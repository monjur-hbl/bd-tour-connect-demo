import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Pino logger for Baileys (silenced)
const logger = pino({ level: 'silent' });

// CORS configuration
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Store WhatsApp clients
const whatsappClients = new Map(); // agencyId_slot -> { socket, status, info, store }
const activeReplies = new Map();
const qrCodeStore = new Map();

// Auth directory
const authDir = path.join(__dirname, 'auth_sessions');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const isCloudRun = process.env.K_SERVICE || process.env.NODE_ENV === 'production';
console.log(`Environment: ${isCloudRun ? 'Cloud Run/Production' : 'Local Development'}`);

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Initialize WhatsApp client using Baileys
async function initializeClient(agencyId, slot) {
  const clientId = `${agencyId}_${slot}`;

  // Check for existing client
  if (whatsappClients.has(clientId)) {
    const existing = whatsappClients.get(clientId);
    if (existing.status === 'connected') {
      console.log(`Client ${clientId} already connected, emitting status`);
      // Emit connected status to all clients in the room
      io.to(agencyId).emit('whatsapp:connected', {
        slot,
        account: existing.info
      });
      return existing;
    }
    if (existing.status === 'qr_ready') {
      const storedQr = qrCodeStore.get(clientId);
      if (storedQr) {
        console.log(`Resending stored QR for ${clientId}`);
        io.to(agencyId).emit('whatsapp:qr', { slot, qrCode: storedQr });
      }
      return existing;
    }
    if (existing.status === 'connecting') {
      console.log(`Client ${clientId} is connecting, waiting for QR...`);
      return existing;
    }
    // Close existing connection if any
    if (existing.socket) {
      try {
        existing.socket.end();
      } catch (e) {}
    }
  }

  console.log(`Initializing WhatsApp client for ${clientId}`);

  const authPath = path.join(authDir, clientId);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  const clientData = {
    socket: null,
    status: 'connecting',
    info: null,
    agencyId,
    slot
  };

  whatsappClients.set(clientId, clientData);

  try {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`);

    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const sock = makeWASocket({
      version,
      logger,
      auth: state,
      printQRInTerminal: false,
      browser: ['BD Tour Connect', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      getMessage: async () => undefined
    });

    clientData.socket = sock;

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(`Connection update for ${clientId}:`, { connection, hasQR: !!qr });

      if (qr) {
        clientData.status = 'qr_ready';
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { width: 256, margin: 2 });
          const qrBase64 = qrDataUrl.split(',')[1];
          qrCodeStore.set(clientId, qrBase64);

          console.log(`QR code generated for ${clientId}`);
          io.to(agencyId).emit('whatsapp:qr', { slot, qrCode: qrBase64 });
        } catch (err) {
          console.error('QR generation error:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`Connection closed for ${clientId}:`, {
          statusCode,
          reason: lastDisconnect?.error?.message,
          shouldReconnect
        });

        qrCodeStore.delete(clientId);
        clientData.status = 'disconnected';
        clientData.info = null;

        io.to(agencyId).emit('whatsapp:disconnected', {
          slot,
          reason: lastDisconnect?.error?.message || 'connection_closed'
        });

        if (shouldReconnect) {
          console.log(`Will attempt to reconnect ${clientId} in 5 seconds...`);
          await delay(5000);
          initializeClient(agencyId, slot);
        } else {
          whatsappClients.delete(clientId);
          // Clean up auth files for logged out user
          if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
          }
        }
      }

      if (connection === 'open') {
        console.log(`WhatsApp connected for ${clientId}!`);
        clientData.status = 'connected';
        qrCodeStore.delete(clientId);

        try {
          const user = sock.user;
          clientData.info = {
            id: clientId,
            phoneNumber: user?.id?.split(':')[0] || user?.id?.split('@')[0] || 'unknown',
            name: user?.name || user?.verifiedName || 'WhatsApp User',
            platform: 'web'
          };

          console.log(`Connected as: ${clientData.info.phoneNumber} (${clientData.info.name})`);

          io.to(agencyId).emit('whatsapp:connected', {
            slot,
            account: clientData.info
          });

          // Fetch initial chats after a short delay
          await delay(2000);
          const chats = await sock.groupFetchAllParticipating();
          const chatList = Object.values(chats || {}).slice(0, 50).map(chat => formatChat(chat, clientId));

          io.to(agencyId).emit('whatsapp:chats', { slot, chats: chatList });
        } catch (err) {
          console.error('Error getting user info:', err);
        }
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const message of messages) {
        if (message.key.fromMe) continue;

        try {
          const formattedMessage = formatMessage(message, clientId);

          io.to(agencyId).emit('whatsapp:message', {
            slot,
            message: formattedMessage,
            chat: {
              id: message.key.remoteJid,
              accountId: clientId
            }
          });

          io.to(agencyId).emit('whatsapp:notification', {
            slot,
            chatId: message.key.remoteJid,
            message: formattedMessage,
            contact: {
              name: message.pushName || message.key.remoteJid.split('@')[0],
              phoneNumber: message.key.remoteJid.split('@')[0]
            }
          });
        } catch (err) {
          console.error('Error processing message:', err);
        }
      }
    });

    return clientData;

  } catch (err) {
    console.error(`Failed to initialize ${clientId}:`, err);
    clientData.status = 'disconnected';
    whatsappClients.delete(clientId);

    io.to(agencyId).emit('whatsapp:error', {
      error: `Failed to initialize WhatsApp: ${err.message}`
    });

    return null;
  }
}

// Format chat
function formatChat(chat, clientId) {
  return {
    id: chat.id,
    accountId: clientId,
    contact: {
      id: chat.id,
      phoneNumber: chat.id.split('@')[0],
      name: chat.subject || chat.name || chat.id.split('@')[0],
      isGroup: chat.id.endsWith('@g.us')
    },
    type: chat.id.endsWith('@g.us') ? 'group' : 'individual',
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false
  };
}

// Format message
function formatMessage(message, clientId) {
  const content = message.message;
  let body = '';
  let type = 'text';

  if (content?.conversation) {
    body = content.conversation;
  } else if (content?.extendedTextMessage?.text) {
    body = content.extendedTextMessage.text;
  } else if (content?.imageMessage) {
    type = 'image';
    body = content.imageMessage.caption || '[Image]';
  } else if (content?.videoMessage) {
    type = 'video';
    body = content.videoMessage.caption || '[Video]';
  } else if (content?.audioMessage) {
    type = 'audio';
    body = '[Audio]';
  } else if (content?.documentMessage) {
    type = 'document';
    body = content.documentMessage.fileName || '[Document]';
  }

  return {
    id: message.key.id,
    accountId: clientId,
    chatId: message.key.remoteJid,
    fromMe: message.key.fromMe,
    from: message.key.remoteJid,
    type,
    body,
    timestamp: new Date((message.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
    status: 'delivered'
  };
}

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', ({ agencyId }) => {
    socket.join(agencyId);
    socket.agencyId = agencyId;
    console.log(`Socket ${socket.id} joined agency ${agencyId}`);

    // Send current statuses for all clients in this agency
    for (const [clientId, clientData] of whatsappClients.entries()) {
      if (clientData.agencyId === agencyId) {
        console.log(`Sending status for ${clientId}: ${clientData.status}`);

        // Send status update
        socket.emit('whatsapp:status', {
          slot: clientData.slot,
          status: clientData.status,
          account: clientData.info
        });

        // If connected, also emit connected event
        if (clientData.status === 'connected' && clientData.info) {
          socket.emit('whatsapp:connected', {
            slot: clientData.slot,
            account: clientData.info
          });
        }

        // If QR is ready, send it
        if (clientData.status === 'qr_ready') {
          const storedQr = qrCodeStore.get(clientId);
          if (storedQr) {
            socket.emit('whatsapp:qr', {
              slot: clientData.slot,
              qrCode: storedQr
            });
          }
        }
      }
    }
  });

  socket.on('whatsapp:connect', async ({ agencyId, slot }) => {
    console.log(`=== Connect request: agency=${agencyId}, slot=${slot} ===`);
    await initializeClient(agencyId || socket.agencyId, slot || 1);
  });

  socket.on('whatsapp:disconnect', async ({ agencyId, slot }) => {
    const clientId = `${agencyId}_${slot}`;
    const clientData = whatsappClients.get(clientId);

    if (clientData?.socket) {
      try {
        await clientData.socket.logout();
        clientData.socket.end();
      } catch (err) {
        console.error('Disconnect error:', err);
      }
      whatsappClients.delete(clientId);
      qrCodeStore.delete(clientId);

      // Clean up auth
      const authPath = path.join(authDir, clientId);
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
      }

      io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: 'user_logout' });
    }
  });

  socket.on('whatsapp:send', async ({ agencyId, slot, chatId, message }) => {
    const clientId = `${agencyId}_${slot}`;
    const clientData = whatsappClients.get(clientId);

    if (!clientData?.socket || clientData.status !== 'connected') {
      socket.emit('whatsapp:error', { error: 'WhatsApp not connected' });
      return;
    }

    try {
      let sentMessage;

      if (message.type === 'text') {
        sentMessage = await clientData.socket.sendMessage(chatId, { text: message.body });
      }
      // TODO: Add media message support

      if (sentMessage) {
        io.to(agencyId).emit('whatsapp:message_sent', {
          slot,
          chatId,
          message: {
            id: sentMessage.key.id,
            accountId: clientId,
            chatId,
            fromMe: true,
            type: 'text',
            body: message.body,
            timestamp: new Date().toISOString(),
            status: 'sent'
          }
        });
      }
    } catch (err) {
      console.error('Send error:', err);
      socket.emit('whatsapp:error', { error: 'Failed to send message' });
    }
  });

  socket.on('whatsapp:fetch_chats', async ({ agencyId, slot }) => {
    const clientId = `${agencyId}_${slot}`;
    const clientData = whatsappClients.get(clientId);

    if (!clientData?.socket || clientData.status !== 'connected') {
      socket.emit('whatsapp:error', { error: 'WhatsApp not connected' });
      return;
    }

    try {
      const chats = await clientData.socket.groupFetchAllParticipating();
      const chatList = Object.values(chats || {}).slice(0, 100).map(chat => formatChat(chat, clientId));
      socket.emit('whatsapp:chats', { slot, chats: chatList });
    } catch (err) {
      console.error('Fetch chats error:', err);
      socket.emit('whatsapp:error', { error: 'Failed to fetch chats' });
    }
  });

  socket.on('whatsapp:start_reply', ({ agencyId, chatId, userId, userName }) => {
    activeReplies.set(chatId, { userId, userName, timestamp: Date.now() });
    io.to(agencyId).emit('whatsapp:reply_started', { chatId, userId, userName });
  });

  socket.on('whatsapp:stop_reply', ({ agencyId, chatId, userId }) => {
    const existing = activeReplies.get(chatId);
    if (existing?.userId === userId) {
      activeReplies.delete(chatId);
      io.to(agencyId).emit('whatsapp:reply_cleared', { chatId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API
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
    version: '2.0.0',
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
  console.log(`WhatsApp server v2.0.0 running on port ${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  for (const [clientId, clientData] of whatsappClients.entries()) {
    try {
      if (clientData.socket) {
        clientData.socket.end();
      }
    } catch (err) {
      console.error(`Error closing ${clientId}:`, err);
    }
  }
  process.exit(0);
});
