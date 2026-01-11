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

// Server identity
const SERVER_ID = 2;
const SERVER_NAME = 'WhatsApp Server 2';

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

// Single session for this server
let session = null;
let sock = null;

// Auth directory
const authDir = path.join(__dirname, 'auth_session');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const isCloudRun = process.env.K_SERVICE || process.env.NODE_ENV === 'production';
console.log(`${SERVER_NAME} - Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error?.message || error);
});

// Clean auth state
function cleanAuthState() {
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
      fs.mkdirSync(authDir, { recursive: true });
      console.log('Cleaned auth state');
    } catch (e) {
      console.error('Failed to clean auth state:', e.message);
    }
  }
}

// End session cleanly
async function endSession(cleanAuth = false) {
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      await sock.logout().catch(() => {});
      sock.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    sock = null;
  }
  session = null;
  if (cleanAuth) {
    cleanAuthState();
  }
}

// Create WhatsApp session
async function createSession(agencyId) {
  // If already connected, send status
  if (session?.status === 'connected' && session?.info) {
    console.log('Already connected, sending status');
    io.to(agencyId).emit('whatsapp:connected', {
      serverId: SERVER_ID,
      account: session.info
    });
    return session;
  }

  // If QR ready, resend
  if (session?.status === 'qr_ready' && session?.qrCode) {
    console.log('QR ready, resending');
    io.to(agencyId).emit('whatsapp:qr', {
      serverId: SERVER_ID,
      qrCode: session.qrCode
    });
    return session;
  }

  // If connecting, wait
  if (session?.status === 'connecting') {
    console.log('Already connecting');
    return session;
  }

  // Clean up any existing session
  await endSession(false);

  console.log('Creating new session');

  session = {
    status: 'connecting',
    info: null,
    qrCode: null,
    agencyId
  };

  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log(`Baileys version: ${version.join('.')}`);

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      printQRInTerminal: false,
      browser: Browsers.macOS('Chrome'),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
      markOnlineOnConnect: false,
      retryRequestDelayMs: 2000,
      connectTimeoutMs: 60000,
      qrTimeout: 40000
    });

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection || qr) {
        console.log(`Connection: ${connection || 'none'}, hasQR: ${!!qr}`);
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

          console.log('QR code generated');
          io.to(agencyId).emit('whatsapp:qr', {
            serverId: SERVER_ID,
            qrCode: qrBase64
          });
        } catch (err) {
          console.error('QR generation error:', err.message);
        }
      }

      // Connecting state (after QR scan)
      if (connection === 'connecting' && session?.status === 'qr_ready') {
        console.log('QR scanned, authenticating...');
        session.status = 'connecting';
        session.qrCode = null;
        io.to(agencyId).emit('whatsapp:connecting', {
          serverId: SERVER_ID
        });
      }

      // Connected
      if (connection === 'open') {
        console.log('Connected!');
        session.status = 'connected';
        session.qrCode = null;

        try {
          const user = sock.user;
          session.info = {
            id: `server_${SERVER_ID}`,
            phoneNumber: user?.id?.split(':')[0] || user?.id?.split('@')[0] || 'unknown',
            name: user?.name || user?.verifiedName || 'WhatsApp User',
            serverId: SERVER_ID
          };

          console.log(`Phone: ${session.info.phoneNumber}, Name: ${session.info.name}`);
          io.to(agencyId).emit('whatsapp:connected', {
            serverId: SERVER_ID,
            account: session.info
          });
        } catch (err) {
          console.error('Error getting user info:', err.message);
        }
      }

      // Disconnected
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || 'unknown';

        console.log(`Closed: status=${statusCode}, reason=${errorMessage}`);

        session.qrCode = null;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('Logged out, cleaning session');
          await endSession(true);
          io.to(agencyId).emit('whatsapp:disconnected', {
            serverId: SERVER_ID,
            reason: 'logged_out'
          });
        } else if (statusCode === 401 || statusCode === 403) {
          console.log('Auth error, cleaning session');
          await endSession(true);
          io.to(agencyId).emit('whatsapp:disconnected', {
            serverId: SERVER_ID,
            reason: 'auth_error'
          });
        } else if (statusCode === 408 || statusCode === 428) {
          console.log('QR/connection timeout');
          session.status = 'disconnected';
          io.to(agencyId).emit('whatsapp:disconnected', {
            serverId: SERVER_ID,
            reason: 'timeout'
          });
        } else if (statusCode === 515) {
          console.log('Stream error, reconnecting...');
          session.status = 'connecting';
          await delay(3000);
          createSession(agencyId);
        } else {
          session.status = 'disconnected';
          io.to(agencyId).emit('whatsapp:disconnected', {
            serverId: SERVER_ID,
            reason: errorMessage
          });
        }
      }
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      console.log(`Messages upsert: type=${type}, count=${messages.length}`);

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

          console.log(`Message: ${formattedMsg.fromMe ? 'OUT' : 'IN'} - ${body.substring(0, 50)}`);

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
          console.error('Message processing error:', err.message);
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
    console.error('Session creation failed:', err.message);
    session = null;
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

    // Send current status
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
    console.log(`Connect request from ${targetAgency}`);
    await createSession(targetAgency);
  });

  socket.on('whatsapp:disconnect', async ({ agencyId }) => {
    console.log('Disconnect request');
    await endSession(true);
    io.to(agencyId).emit('whatsapp:disconnected', {
      serverId: SERVER_ID,
      reason: 'user_logout'
    });
  });

  socket.on('whatsapp:send', async ({ agencyId, chatId, message }) => {
    if (!sock || session?.status !== 'connected') {
      socket.emit('whatsapp:error', {
        serverId: SERVER_ID,
        error: 'WhatsApp not connected'
      });
      return;
    }

    try {
      let result;
      if (message.type === 'text') {
        result = await sock.sendMessage(chatId, { text: message.body });
      }

      if (result) {
        io.to(agencyId).emit('whatsapp:message_sent', {
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
      console.error('Send failed:', err.message);
      socket.emit('whatsapp:error', {
        serverId: SERVER_ID,
        error: 'Failed to send message'
      });
    }
  });

  socket.on('whatsapp:fetch_chats', async ({ agencyId }) => {
    if (!sock || session?.status !== 'connected') {
      socket.emit('whatsapp:error', {
        serverId: SERVER_ID,
        error: 'WhatsApp not connected'
      });
      return;
    }

    try {
      const groups = await sock.groupFetchAllParticipating();
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
      console.error('Fetch chats failed:', err.message);
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
  res.json({
    status: 'ok',
    serverId: SERVER_ID,
    serverName: SERVER_NAME,
    version: '1.0.0',
    environment: isCloudRun ? 'cloud-run' : 'local',
    sessionStatus: session?.status || 'none',
    connected: session?.status === 'connected',
    accountName: session?.info?.name || null,
    accountPhone: session?.info?.phoneNumber || null
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await endSession(false);
  process.exit(0);
});
