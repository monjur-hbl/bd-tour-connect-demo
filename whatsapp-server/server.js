const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// CORS configuration - allow all origins for now (can be restricted later)
const corsOptions = {
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Socket.IO setup with improved settings for Cloud Run
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Store WhatsApp clients - supports up to 2 accounts per agency
const whatsappClients = new Map(); // agencyId_slot -> { client, status, info }
const activeReplies = new Map(); // chatId -> { userId, userName, timestamp }
const qrCodeStore = new Map(); // clientId -> qrCode (for immediate retrieval)

// Ensure session directory exists
const sessionsDir = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Check if running in Cloud Run/Docker
const isCloudRun = process.env.K_SERVICE || process.env.NODE_ENV === 'production';
console.log(`Environment: ${isCloudRun ? 'Cloud Run/Production' : 'Local Development'}`);

// Initialize WhatsApp client for a specific agency slot
function initializeClient(agencyId, slot) {
  const clientId = `${agencyId}_${slot}`;

  if (whatsappClients.has(clientId)) {
    const existing = whatsappClients.get(clientId);
    if (existing.status === 'connected' || existing.status === 'connecting' || existing.status === 'qr_ready') {
      console.log(`Client ${clientId} already exists with status: ${existing.status}`);

      // If QR code exists, resend it
      const storedQr = qrCodeStore.get(clientId);
      if (storedQr && existing.status === 'qr_ready') {
        console.log(`Resending stored QR for ${clientId}`);
        io.to(agencyId).emit('whatsapp:qr', {
          slot,
          qrCode: storedQr
        });
      }
      return existing;
    }
    // Clean up old client
    try {
      existing.client.destroy().catch(() => {});
    } catch (e) {}
  }

  console.log(`Initializing WhatsApp client for ${clientId}`);

  // Puppeteer configuration for Cloud Run
  const puppeteerConfig = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--safebrowsing-disable-auto-update'
    ]
  };

  // Add executablePath for Cloud Run/Docker
  if (isCloudRun) {
    puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
    console.log(`Using Chromium at: ${puppeteerConfig.executablePath}`);
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId }),
    puppeteer: puppeteerConfig
  });

  const clientData = {
    client,
    status: 'connecting',
    info: null,
    agencyId,
    slot
  };

  whatsappClients.set(clientId, clientData);

  // QR Code event
  client.on('qr', async (qr) => {
    console.log(`QR received for ${clientId}`);
    clientData.status = 'qr_ready';

    try {
      const qrDataUrl = await QRCode.toDataURL(qr, { width: 256, margin: 2 });
      const qrBase64 = qrDataUrl.split(',')[1];

      // Store QR code for reconnecting clients
      qrCodeStore.set(clientId, qrBase64);

      console.log(`Emitting QR code to agency room: ${agencyId}`);
      io.to(agencyId).emit('whatsapp:qr', {
        slot,
        qrCode: qrBase64
      });
    } catch (err) {
      console.error('QR generation error:', err);
      io.to(agencyId).emit('whatsapp:error', { error: 'Failed to generate QR code' });
    }
  });

  // Ready event
  client.on('ready', async () => {
    console.log(`WhatsApp client ${clientId} is ready!`);
    clientData.status = 'connected';

    // Clear stored QR code
    qrCodeStore.delete(clientId);

    try {
      const info = client.info;
      clientData.info = {
        id: clientId,
        phoneNumber: info.wid.user,
        name: info.pushname || info.wid.user,
        platform: info.platform
      };

      console.log(`WhatsApp connected: ${clientData.info.phoneNumber} (${clientData.info.name})`);

      io.to(agencyId).emit('whatsapp:connected', {
        slot,
        account: clientData.info
      });

      // Fetch initial chats
      const chats = await client.getChats();
      const formattedChats = await Promise.all(
        chats.slice(0, 50).map(chat => formatChat(chat, clientId))
      );

      io.to(agencyId).emit('whatsapp:chats', {
        slot,
        chats: formattedChats.filter(Boolean)
      });
    } catch (err) {
      console.error('Error on ready:', err);
    }
  });

  // Message received event
  client.on('message', async (message) => {
    console.log(`New message in ${clientId}:`, message.body?.substring(0, 50));

    try {
      const chat = await message.getChat();
      const contact = await message.getContact();

      const formattedMessage = await formatMessage(message, clientId);
      const formattedChat = await formatChat(chat, clientId);

      io.to(agencyId).emit('whatsapp:message', {
        slot,
        message: formattedMessage,
        chat: formattedChat
      });

      // Send notification
      io.to(agencyId).emit('whatsapp:notification', {
        slot,
        chatId: chat.id._serialized,
        message: formattedMessage,
        contact: {
          name: contact.pushname || contact.name || contact.number,
          phoneNumber: contact.number
        }
      });
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  // Message sent acknowledgment
  client.on('message_ack', (message, ack) => {
    const statusMap = {
      0: 'pending',
      1: 'sent',
      2: 'delivered',
      3: 'read',
      4: 'played'
    };

    io.to(agencyId).emit('whatsapp:message_status', {
      slot,
      messageId: message.id._serialized,
      chatId: message.from,
      status: statusMap[ack] || 'sent'
    });
  });

  // Disconnected event
  client.on('disconnected', (reason) => {
    console.log(`Client ${clientId} disconnected:`, reason);
    clientData.status = 'disconnected';
    clientData.info = null;

    io.to(agencyId).emit('whatsapp:disconnected', { slot, reason });
  });

  // Authentication failure
  client.on('auth_failure', (message) => {
    console.error(`Auth failure for ${clientId}:`, message);
    clientData.status = 'disconnected';

    io.to(agencyId).emit('whatsapp:auth_failure', { slot, message });
  });

  // Loading screen event (helps track initialization progress)
  client.on('loading_screen', (percent, message) => {
    console.log(`Loading ${clientId}: ${percent}% - ${message}`);
  });

  // Initialize the client
  console.log(`Starting client initialization for ${clientId}...`);
  client.initialize().then(() => {
    console.log(`Client ${clientId} initialized successfully`);
  }).catch(err => {
    console.error(`Failed to initialize ${clientId}:`, err.message);
    console.error('Full error:', err);
    clientData.status = 'disconnected';
    qrCodeStore.delete(clientId);

    io.to(agencyId).emit('whatsapp:error', {
      error: `Failed to initialize WhatsApp: ${err.message}`
    });
  });

  return clientData;
}

// Format chat object
async function formatChat(chat, clientId) {
  try {
    const contact = await chat.getContact();
    const lastMessage = chat.lastMessage;

    return {
      id: chat.id._serialized,
      accountId: clientId,
      contact: {
        id: chat.id._serialized,
        phoneNumber: contact.number || chat.id.user,
        name: contact.pushname || contact.name || contact.number || chat.id.user,
        pushName: contact.pushname,
        profilePicture: null, // Would need async fetch
        isBlocked: contact.isBlocked,
        isGroup: chat.isGroup,
        lastMessageAt: lastMessage ? new Date(lastMessage.timestamp * 1000).toISOString() : null
      },
      type: chat.isGroup ? 'group' : 'individual',
      unreadCount: chat.unreadCount || 0,
      isPinned: chat.pinned,
      isMuted: chat.isMuted,
      isArchived: chat.archived,
      lastMessage: lastMessage ? await formatMessage(lastMessage, clientId) : null
    };
  } catch (err) {
    console.error('Error formatting chat:', err);
    return null;
  }
}

// Format message object
async function formatMessage(message, clientId) {
  try {
    let mediaUrl = null;
    let mediaFileName = null;
    let mediaMimeType = null;
    let mediaSize = null;

    if (message.hasMedia) {
      try {
        const media = await message.downloadMedia();
        if (media) {
          mediaUrl = `data:${media.mimetype};base64,${media.data}`;
          mediaMimeType = media.mimetype;
          mediaFileName = media.filename || `file.${media.mimetype.split('/')[1]}`;
        }
      } catch (err) {
        console.error('Error downloading media:', err);
      }
    }

    const messageType = getMessageType(message);

    return {
      id: message.id._serialized,
      accountId: clientId,
      chatId: message.from,
      fromMe: message.fromMe,
      from: message.from,
      to: message.to,
      type: messageType,
      body: message.body || '',
      caption: message.caption,
      mediaUrl,
      mediaMimeType,
      mediaFileName,
      mediaSize,
      timestamp: new Date(message.timestamp * 1000).toISOString(),
      status: message.fromMe ? 'sent' : 'delivered',
      quotedMessage: message.hasQuotedMsg ? {
        id: message.quotedMsgId,
        body: message._data.quotedMsg?.body || ''
      } : null,
      isForwarded: message.isForwarded,
      isStarred: message.isStarred
    };
  } catch (err) {
    console.error('Error formatting message:', err);
    return null;
  }
}

// Get message type
function getMessageType(message) {
  if (message.type === 'image') return 'image';
  if (message.type === 'video') return 'video';
  if (message.type === 'audio' || message.type === 'ptt') return 'audio';
  if (message.type === 'document') return 'document';
  if (message.type === 'sticker') return 'sticker';
  if (message.type === 'location') return 'location';
  if (message.type === 'vcard') return 'contact';
  return 'text';
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join agency room
  socket.on('join', ({ agencyId }) => {
    socket.join(agencyId);
    socket.agencyId = agencyId;
    console.log(`Socket ${socket.id} joined agency ${agencyId}`);

    // Send current client statuses
    for (const [clientId, clientData] of whatsappClients.entries()) {
      if (clientData.agencyId === agencyId) {
        socket.emit('whatsapp:status', {
          slot: clientData.slot,
          status: clientData.status,
          account: clientData.info
        });
      }
    }
  });

  // Request QR code to connect
  socket.on('whatsapp:connect', ({ agencyId, slot }) => {
    console.log(`=== Connect request received ===`);
    console.log(`Agency: ${agencyId}, Slot: ${slot}`);
    console.log(`Socket ID: ${socket.id}, Socket Agency: ${socket.agencyId}`);

    // Use socket's agency if not provided
    const targetAgencyId = agencyId || socket.agencyId;
    if (!targetAgencyId) {
      console.error('No agency ID provided for connect request');
      socket.emit('whatsapp:error', { error: 'Agency ID is required' });
      return;
    }

    initializeClient(targetAgencyId, slot || 1);
  });

  // Disconnect WhatsApp
  socket.on('whatsapp:disconnect', async ({ agencyId, slot }) => {
    const clientId = `${agencyId}_${slot}`;
    const clientData = whatsappClients.get(clientId);

    if (clientData && clientData.client) {
      try {
        await clientData.client.logout();
        await clientData.client.destroy();
      } catch (err) {
        console.error('Error disconnecting:', err);
      }
      whatsappClients.delete(clientId);

      io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: 'user_logout' });
    }
  });

  // Send message
  socket.on('whatsapp:send', async ({ agencyId, slot, chatId, message }) => {
    const clientId = `${agencyId}_${slot}`;
    const clientData = whatsappClients.get(clientId);

    if (!clientData || clientData.status !== 'connected') {
      socket.emit('whatsapp:error', { error: 'WhatsApp not connected' });
      return;
    }

    try {
      let sentMessage;

      if (message.type === 'text') {
        sentMessage = await clientData.client.sendMessage(chatId, message.body);
      } else if (message.mediaData) {
        // Handle media message
        const media = new MessageMedia(
          message.mediaMimeType,
          message.mediaData,
          message.mediaFileName
        );
        sentMessage = await clientData.client.sendMessage(chatId, media, {
          caption: message.caption
        });
      }

      if (sentMessage) {
        const formattedMessage = await formatMessage(sentMessage, clientId);
        io.to(agencyId).emit('whatsapp:message_sent', {
          slot,
          chatId,
          message: formattedMessage
        });
      }

      // Clear active reply
      activeReplies.delete(chatId);
      io.to(agencyId).emit('whatsapp:reply_cleared', { chatId });
    } catch (err) {
      console.error('Error sending message:', err);
      socket.emit('whatsapp:error', { error: 'Failed to send message' });
    }
  });

  // Start replying indicator
  socket.on('whatsapp:start_reply', ({ agencyId, chatId, userId, userName }) => {
    const existing = activeReplies.get(chatId);
    if (!existing || existing.userId === userId) {
      activeReplies.set(chatId, { userId, userName, timestamp: Date.now() });
      io.to(agencyId).emit('whatsapp:reply_started', { chatId, userId, userName });
    }
  });

  // Stop replying indicator
  socket.on('whatsapp:stop_reply', ({ agencyId, chatId, userId }) => {
    const existing = activeReplies.get(chatId);
    if (existing && existing.userId === userId) {
      activeReplies.delete(chatId);
      io.to(agencyId).emit('whatsapp:reply_cleared', { chatId });
    }
  });

  // Fetch messages for a chat
  socket.on('whatsapp:fetch_messages', async ({ agencyId, slot, chatId, limit = 50 }) => {
    const clientId = `${agencyId}_${slot}`;
    const clientData = whatsappClients.get(clientId);

    if (!clientData || clientData.status !== 'connected') {
      socket.emit('whatsapp:error', { error: 'WhatsApp not connected' });
      return;
    }

    try {
      const chat = await clientData.client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });

      const formattedMessages = await Promise.all(
        messages.map(msg => formatMessage(msg, clientId))
      );

      socket.emit('whatsapp:messages', {
        slot,
        chatId,
        messages: formattedMessages.filter(Boolean)
      });

      // Mark as read
      await chat.sendSeen();
    } catch (err) {
      console.error('Error fetching messages:', err);
      socket.emit('whatsapp:error', { error: 'Failed to fetch messages' });
    }
  });

  // Fetch chats
  socket.on('whatsapp:fetch_chats', async ({ agencyId, slot }) => {
    const clientId = `${agencyId}_${slot}`;
    const clientData = whatsappClients.get(clientId);

    if (!clientData || clientData.status !== 'connected') {
      socket.emit('whatsapp:error', { error: 'WhatsApp not connected' });
      return;
    }

    try {
      const chats = await clientData.client.getChats();
      const formattedChats = await Promise.all(
        chats.slice(0, 100).map(chat => formatChat(chat, clientId))
      );

      socket.emit('whatsapp:chats', {
        slot,
        chats: formattedChats.filter(Boolean)
      });
    } catch (err) {
      console.error('Error fetching chats:', err);
      socket.emit('whatsapp:error', { error: 'Failed to fetch chats' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API endpoints for compatibility
app.get('/api/health', (req, res) => {
  const clientStatuses = [];
  for (const [clientId, clientData] of whatsappClients.entries()) {
    clientStatuses.push({
      id: clientId,
      status: clientData.status,
      hasQR: qrCodeStore.has(clientId)
    });
  }

  res.json({
    status: 'ok',
    environment: isCloudRun ? 'cloud-run' : 'local',
    clients: whatsappClients.size,
    clientStatuses,
    socketConnections: io.engine.clientsCount
  });
});

app.get('/api/status/:agencyId', (req, res) => {
  const { agencyId } = req.params;
  const statuses = [];

  for (const [clientId, clientData] of whatsappClients.entries()) {
    if (clientData.agencyId === agencyId) {
      statuses.push({
        slot: clientData.slot,
        status: clientData.status,
        account: clientData.info
      });
    }
  }

  res.json({ statuses });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WhatsApp server running on port ${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  for (const [clientId, clientData] of whatsappClients.entries()) {
    try {
      await clientData.client.destroy();
    } catch (err) {
      console.error(`Error destroying ${clientId}:`, err);
    }
  }
  process.exit(0);
});
