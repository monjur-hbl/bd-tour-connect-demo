import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Server identity - THIS IS SERVER 1
const SERVER_ID = 1;

// Silent logger for Baileys
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

// Session storage - one per agency
const sessions = new Map(); // agencyId -> { sock, status, info, qrCode, reconnecting }

// Auth directory
const authDir = path.join(__dirname, 'auth_sessions');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const isCloudRun = process.env.K_SERVICE || process.env.NODE_ENV === 'production';
console.log(`WhatsApp Server ${SERVER_ID} - Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error?.message || error);
});

// Clean up corrupted auth state
function cleanAuthState(agencyId) {
  const authPath = path.join(authDir, agencyId);
  if (fs.existsSync(authPath)) {
    try {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log(`[${agencyId}] Cleaned auth state`);
    } catch (e) {
      console.error(`[${agencyId}] Failed to clean auth state:`, e.message);
    }
  }
}

// End session cleanly
async function endSession(agencyId, cleanAuth = false) {
  const session = sessions.get(agencyId);
  if (session) {
    session.reconnecting = false;
    if (session.sock) {
      try {
        session.sock.ev.removeAllListeners();
        await session.sock.logout().catch(() => {});
        session.sock.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    sessions.delete(agencyId);
  }
  if (cleanAuth) {
    cleanAuthState(agencyId);
  }
}

// Initialize a WhatsApp session
async function createSession(agencyId) {
  // Check existing session
  const existing = sessions.get(agencyId);
  if (existing) {
    // If connected, just notify
    if (existing.status === 'connected' && existing.info) {
      console.log(`[${agencyId}] Already connected`);
      io.to(agencyId).emit('whatsapp:connected', {
        serverId: SERVER_ID,
        account: existing.info
      });
      return existing;
    }

    // If QR ready, resend QR
    if (existing.status === 'qr_ready' && existing.qrCode) {
      console.log(`[${agencyId}] QR ready, resending`);
      io.to(agencyId).emit('whatsapp:qr', {
        serverId: SERVER_ID,
        qrCode: existing.qrCode
      });
      return existing;
    }

    // If connecting, wait
    if (existing.status === 'connecting') {
      console.log(`[${agencyId}] Already connecting`);
      return existing;
    }

    // Otherwise, clean up and recreate
    await endSession(agencyId, false);
  }

  console.log(`[${agencyId}] Creating new session`);

  // Create auth directory
  const authPath = path.join(authDir, agencyId);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  // Create session object
  const session = {
    sock: null,
    status: 'connecting',
    info: null,
    qrCode: null,
    agencyId,
    reconnecting: false
  };
  sessions.set(agencyId, session);

  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log(`[${agencyId}] Baileys version: ${version.join('.')}`);

    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      printQRInTerminal: false,
      // Use ubuntu browser - works better with WhatsApp Web
      browser: Browsers.ubuntu('Chrome'),
      // Connection settings from working miami implementation
      connectTimeoutMs: 120000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      retryRequestDelayMs: 500,
      emitOwnEvents: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async () => undefined,
    });

    session.sock = sock;

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection || qr) {
        console.log(`[${agencyId}] connection=${connection || 'none'}, hasQR=${!!qr}`);
      }

      // QR Code received
      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            errorCorrectionLevel: 'M'
          });
          const qrBase64 = qrDataUrl.split(',')[1];

          session.status = 'qr_ready';
          session.qrCode = qrBase64;

          console.log(`[${agencyId}] QR code generated`);
          io.to(agencyId).emit('whatsapp:qr', {
            serverId: SERVER_ID,
            qrCode: qrBase64
          });
        } catch (err) {
          console.error(`[${agencyId}] QR generation error:`, err.message);
        }
      }

      // Connection opened
      if (connection === 'open') {
        console.log(`[${agencyId}] Connected!`);
        session.status = 'connected';
        session.qrCode = null;
        session.reconnecting = false;

        try {
          const user = sock.user;
          session.info = {
            id: `server${SERVER_ID}_${agencyId}`,
            phoneNumber: user?.id?.split(':')[0] || user?.id?.split('@')[0] || 'unknown',
            name: user?.name || user?.verifiedName || 'WhatsApp User',
            serverId: SERVER_ID
          };

          console.log(`[${agencyId}] Phone: ${session.info.phoneNumber}, Name: ${session.info.name}`);
          io.to(agencyId).emit('whatsapp:connected', {
            serverId: SERVER_ID,
            account: session.info
          });
        } catch (err) {
          console.error(`[${agencyId}] Error getting user info:`, err.message);
        }
      }

      // Connection closed
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || 'unknown';

        console.log(`[${agencyId}] Closed: status=${statusCode}, reason=${errorMessage}`);

        session.qrCode = null;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log(`[${agencyId}] Logged out, cleaning session`);
          await endSession(agencyId, true);
          io.to(agencyId).emit('whatsapp:disconnected', {
            serverId: SERVER_ID,
            reason: 'logged_out'
          });
        } else if (statusCode === 401 || statusCode === 403) {
          console.log(`[${agencyId}] Auth error, cleaning session`);
          await endSession(agencyId, true);
          io.to(agencyId).emit('whatsapp:disconnected', {
            serverId: SERVER_ID,
            reason: 'auth_error'
          });
        } else if (statusCode === 408 || statusCode === 428) {
          console.log(`[${agencyId}] QR/connection timeout`);
          session.status = 'disconnected';
          io.to(agencyId).emit('whatsapp:disconnected', {
            serverId: SERVER_ID,
            reason: 'timeout'
          });
          sessions.delete(agencyId);
        } else if (statusCode === 515) {
          if (!session.reconnecting) {
            console.log(`[${agencyId}] Stream error, will reconnect...`);
            session.reconnecting = true;
            session.status = 'connecting';
            await delay(3000);
            if (sessions.has(agencyId)) {
              createSession(agencyId);
            }
          } else {
            console.log(`[${agencyId}] Already tried reconnecting, giving up`);
            await endSession(agencyId, false);
            io.to(agencyId).emit('whatsapp:disconnected', {
              serverId: SERVER_ID,
              reason: 'connection_failed'
            });
          }
        } else {
          session.status = 'disconnected';
          io.to(agencyId).emit('whatsapp:disconnected', {
            serverId: SERVER_ID,
            reason: errorMessage
          });
          sessions.delete(agencyId);
        }
      }
    });

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      console.log(`[${agencyId}] Messages upsert: type=${type}, count=${messages.length}`);

      for (const msg of messages) {
        if (msg.key.remoteJid === 'status@broadcast') continue;

        try {
          const content = msg.message;
          if (!content) continue;

          let body = '';
          let msgType = 'text';

          if (content?.conversation) {
            body = content.conversation;
          } else if (content?.extendedTextMessage?.text) {
            body = content.extendedTextMessage.text;
          } else if (content?.imageMessage) {
            msgType = 'image';
            body = content.imageMessage.caption || '[Image]';
          } else if (content?.videoMessage) {
            msgType = 'video';
            body = content.videoMessage.caption || '[Video]';
          } else if (content?.audioMessage) {
            msgType = 'audio';
            body = '[Audio]';
          } else if (content?.documentMessage) {
            msgType = 'document';
            body = content.documentMessage.fileName || '[Document]';
          } else if (content?.stickerMessage) {
            msgType = 'sticker';
            body = '[Sticker]';
          } else {
            body = '[Message]';
          }

          const formattedMsg = {
            id: msg.key.id,
            serverId: SERVER_ID,
            chatId: msg.key.remoteJid,
            fromMe: msg.key.fromMe || false,
            type: msgType,
            body,
            timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
            status: msg.key.fromMe ? 'sent' : 'delivered',
            senderName: msg.pushName || null
          };

          console.log(`[${agencyId}] Message: ${formattedMsg.fromMe ? 'OUT' : 'IN'} - ${body.substring(0, 50)}`);

          io.to(agencyId).emit('whatsapp:message', {
            serverId: SERVER_ID,
            message: formattedMsg
          });

          if (!msg.key.fromMe) {
            io.to(agencyId).emit('whatsapp:notification', {
              serverId: SERVER_ID,
              chatId: msg.key.remoteJid,
              message: formattedMsg,
              contact: {
                name: msg.pushName || msg.key.remoteJid.split('@')[0],
                phoneNumber: msg.key.remoteJid.split('@')[0]
              }
            });
          }
        } catch (err) {
          console.error(`[${agencyId}] Message processing error:`, err.message);
        }
      }
    });

    // Message status updates
    sock.ev.on('messages.update', (updates) => {
      for (const update of updates) {
        if (update.update?.status) {
          const statusMap = { 1: 'pending', 2: 'sent', 3: 'delivered', 4: 'read' };
          io.to(agencyId).emit('whatsapp:message_status', {
            serverId: SERVER_ID,
            messageId: update.key.id,
            chatId: update.key.remoteJid,
            status: statusMap[update.update.status] || 'sent'
          });
        }
      }
    });

    return session;

  } catch (err) {
    console.error(`[${agencyId}] Session creation failed:`, err.message);
    sessions.delete(agencyId);
    io.to(agencyId).emit('whatsapp:error', {
      serverId: SERVER_ID,
      error: `Failed to create session: ${err.message}`
    });
    return null;
  }
}

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', ({ agencyId }) => {
    socket.join(agencyId);
    socket.agencyId = agencyId;
    console.log(`Socket ${socket.id} joined ${agencyId}`);

    // Send current session state
    const session = sessions.get(agencyId);
    if (session) {
      socket.emit('whatsapp:status', {
        serverId: SERVER_ID,
        status: session.status,
        account: session.info
      });

      if (session.status === 'connected' && session.info) {
        socket.emit('whatsapp:connected', {
          serverId: SERVER_ID,
          account: session.info
        });
      }

      if (session.status === 'qr_ready' && session.qrCode) {
        socket.emit('whatsapp:qr', {
          serverId: SERVER_ID,
          qrCode: session.qrCode
        });
      }
    }
  });

  socket.on('whatsapp:connect', async ({ agencyId }) => {
    const targetAgency = agencyId || socket.agencyId;
    console.log(`[${targetAgency}] Connect request`);
    await createSession(targetAgency);
  });

  socket.on('whatsapp:disconnect', async ({ agencyId }) => {
    const targetAgency = agencyId || socket.agencyId;
    console.log(`[${targetAgency}] Disconnect request`);
    await endSession(targetAgency, true);
    io.to(targetAgency).emit('whatsapp:disconnected', {
      serverId: SERVER_ID,
      reason: 'user_logout'
    });
  });

  socket.on('whatsapp:send', async ({ agencyId, chatId, message }) => {
    const targetAgency = agencyId || socket.agencyId;
    const session = sessions.get(targetAgency);

    if (!session?.sock || session.status !== 'connected') {
      socket.emit('whatsapp:error', {
        serverId: SERVER_ID,
        error: 'WhatsApp not connected'
      });
      return;
    }

    try {
      let result;
      if (message.type === 'text') {
        result = await session.sock.sendMessage(chatId, { text: message.body });
      }

      if (result) {
        io.to(targetAgency).emit('whatsapp:message_sent', {
          serverId: SERVER_ID,
          chatId,
          message: {
            id: result.key.id,
            serverId: SERVER_ID,
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
      console.error(`[${targetAgency}] Send failed:`, err.message);
      socket.emit('whatsapp:error', {
        serverId: SERVER_ID,
        error: 'Failed to send message'
      });
    }
  });

  socket.on('whatsapp:fetch_chats', async ({ agencyId }) => {
    const targetAgency = agencyId || socket.agencyId;
    const session = sessions.get(targetAgency);

    if (!session?.sock || session.status !== 'connected') {
      socket.emit('whatsapp:error', {
        serverId: SERVER_ID,
        error: 'WhatsApp not connected'
      });
      return;
    }

    try {
      const groups = await session.sock.groupFetchAllParticipating();
      const chatList = Object.values(groups || {}).slice(0, 100).map(chat => ({
        id: chat.id,
        serverId: SERVER_ID,
        contact: {
          id: chat.id,
          phoneNumber: chat.id.split('@')[0],
          name: chat.subject || chat.name || chat.id.split('@')[0],
          isGroup: chat.id.endsWith('@g.us')
        },
        type: chat.id.endsWith('@g.us') ? 'group' : 'individual',
        unreadCount: 0
      }));

      socket.emit('whatsapp:chats', {
        serverId: SERVER_ID,
        chats: chatList
      });
    } catch (err) {
      console.error(`[${targetAgency}] Fetch chats failed:`, err.message);
      socket.emit('whatsapp:error', {
        serverId: SERVER_ID,
        error: 'Failed to fetch chats'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// REST API
app.get('/api/health', (req, res) => {
  const sessionList = [];
  for (const [id, session] of sessions.entries()) {
    sessionList.push({
      agencyId: id,
      status: session.status,
      hasQR: !!session.qrCode,
      hasInfo: !!session.info,
      phone: session.info?.phoneNumber,
      name: session.info?.name
    });
  }

  res.json({
    status: 'ok',
    serverId: SERVER_ID,
    version: '3.2.0',
    environment: isCloudRun ? 'cloud-run' : 'local',
    sessions: sessions.size,
    sessionList,
    connections: io.engine.clientsCount
  });
});

// Get connection status - Miami-style REST endpoint for polling
app.get('/status', (req, res) => {
  const agencyId = req.query.agencyId;

  if (!agencyId) {
    return res.json({
      serverId: SERVER_ID,
      status: 'disconnected',
      qrCode: null,
      connectedAs: null,
      lastError: null
    });
  }

  const session = sessions.get(agencyId);

  if (!session) {
    return res.json({
      serverId: SERVER_ID,
      status: 'disconnected',
      qrCode: null,
      connectedAs: null,
      lastError: null
    });
  }

  res.json({
    serverId: SERVER_ID,
    status: session.status,
    qrCode: session.qrCode,
    connectedAs: session.info,
    lastError: null
  });
});

// Initialize/connect WhatsApp via REST
app.post('/connect', async (req, res) => {
  const { agencyId } = req.body;

  if (!agencyId) {
    return res.status(400).json({ success: false, error: 'agencyId required' });
  }

  console.log(`[REST] Connect request for ${agencyId}`);
  await createSession(agencyId);

  const session = sessions.get(agencyId);
  res.json({
    success: true,
    serverId: SERVER_ID,
    status: session?.status || 'connecting'
  });
});

// Disconnect via REST
app.post('/disconnect', async (req, res) => {
  const { agencyId } = req.body;

  if (!agencyId) {
    return res.status(400).json({ success: false, error: 'agencyId required' });
  }

  console.log(`[REST] Disconnect request for ${agencyId}`);
  await endSession(agencyId, true);

  io.to(agencyId).emit('whatsapp:disconnected', {
    serverId: SERVER_ID,
    reason: 'user_logout'
  });

  res.json({ success: true, serverId: SERVER_ID });
});

// Restart connection via REST
app.post('/restart', async (req, res) => {
  const { agencyId } = req.body;

  if (!agencyId) {
    return res.status(400).json({ success: false, error: 'agencyId required' });
  }

  console.log(`[REST] Restart request for ${agencyId}`);

  // End existing session
  await endSession(agencyId, false);

  // Create new session
  await createSession(agencyId);

  const session = sessions.get(agencyId);
  res.json({
    success: true,
    serverId: SERVER_ID,
    status: session?.status || 'connecting'
  });
});

// Logout (clear auth) via REST
app.post('/logout', async (req, res) => {
  const { agencyId } = req.body;

  if (!agencyId) {
    return res.status(400).json({ success: false, error: 'agencyId required' });
  }

  console.log(`[REST] Logout request for ${agencyId}`);
  await endSession(agencyId, true);

  io.to(agencyId).emit('whatsapp:disconnected', {
    serverId: SERVER_ID,
    reason: 'logged_out'
  });

  res.json({ success: true, serverId: SERVER_ID, message: 'Logged out successfully' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WhatsApp Server ${SERVER_ID} v3.2.0 running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  for (const [agencyId] of sessions.entries()) {
    await endSession(agencyId, false);
  }
  process.exit(0);
});
