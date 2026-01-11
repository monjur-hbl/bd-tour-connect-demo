import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from 'pino';

// NOTE: Removed fetchLatestBaileysVersion - it causes version mismatch issues
// WhatsApp may reject sessions when version changes between connections

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

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

// Session storage - completely isolated per client
// Each session now includes contacts and chats for proper sync
const sessions = new Map(); // clientId -> { sock, status, info, qrCode, reconnecting, contacts, chats }

// Auth directory
const authDir = path.join(__dirname, 'auth_sessions');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const isCloudRun = process.env.K_SERVICE || process.env.NODE_ENV === 'production';
console.log(`Environment: ${isCloudRun ? 'Cloud Run/Production' : 'Local Development'}`);

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error?.message || error);
});

// Clean up corrupted auth state
function cleanAuthState(clientId) {
  const authPath = path.join(authDir, clientId);
  if (fs.existsSync(authPath)) {
    try {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log(`Cleaned auth state for ${clientId}`);
    } catch (e) {
      console.error(`Failed to clean auth state for ${clientId}:`, e.message);
    }
  }
}

// End session cleanly
async function endSession(clientId, cleanAuth = false) {
  const session = sessions.get(clientId);
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
    sessions.delete(clientId);
  }
  if (cleanAuth) {
    cleanAuthState(clientId);
  }
}

// Initialize a WhatsApp session
async function createSession(agencyId, slot) {
  const clientId = `${agencyId}_${slot}`;

  // Check existing session
  const existing = sessions.get(clientId);
  if (existing) {
    // If connected, just notify
    if (existing.status === 'connected' && existing.info) {
      console.log(`Session ${clientId} already connected`);
      io.to(agencyId).emit('whatsapp:connected', { slot, account: existing.info });
      return existing;
    }

    // If QR ready, resend QR
    if (existing.status === 'qr_ready' && existing.qrCode) {
      console.log(`Session ${clientId} has QR ready, resending`);
      io.to(agencyId).emit('whatsapp:qr', { slot, qrCode: existing.qrCode });
      return existing;
    }

    // If connecting, wait
    if (existing.status === 'connecting') {
      console.log(`Session ${clientId} is already connecting`);
      return existing;
    }

    // Otherwise, clean up and recreate
    await endSession(clientId, false);
  }

  console.log(`Creating new session: ${clientId}`);

  // Create auth directory
  const authPath = path.join(authDir, clientId);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  // Create session object with contacts/chats storage
  const session = {
    sock: null,
    status: 'connecting',
    info: null,
    qrCode: null,
    agencyId,
    slot,
    reconnecting: false,
    contacts: new Map(),  // Store synced contacts
    chats: new Map(),     // Store synced chats
    syncComplete: false   // Track if initial sync is done
  };
  sessions.set(clientId, session);

  try {
    // Don't fetch latest version - use Baileys built-in version for stability
    // This prevents WhatsApp from rejecting sessions due to version mismatch
    console.log(`[${clientId}] Using Baileys built-in version for stability`);

    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const sock = makeWASocket({
      // Don't pass version - let Baileys use its built-in stable version
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      printQRInTerminal: false,
      // Use stable browser fingerprint - ubuntu/Chrome is most reliable
      browser: Browsers.ubuntu('Chrome'),
      // Don't sync full history to avoid timeouts on large accounts
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
      // Keep phone notifications working
      markOnlineOnConnect: false,
      // Connection settings for stability
      retryRequestDelayMs: 2000,
      connectTimeoutMs: 120000,  // Increased to 2 minutes
      qrTimeout: 60000,          // Increased to 1 minute
      // Keep connection alive
      keepAliveIntervalMs: 30000
    });

    session.sock = sock;

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Log meaningful updates only
      if (connection || qr) {
        console.log(`[${clientId}] connection=${connection || 'none'}, hasQR=${!!qr}`);
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

          console.log(`[${clientId}] QR code generated`);
          io.to(agencyId).emit('whatsapp:qr', { slot, qrCode: qrBase64 });
        } catch (err) {
          console.error(`[${clientId}] QR generation error:`, err.message);
        }
      }

      // Connection opened
      if (connection === 'open') {
        console.log(`[${clientId}] Connection opened, validating session...`);

        // Wait a moment to ensure WhatsApp fully accepts the session
        // This helps detect cases where connection opens but is immediately rejected
        await delay(2000);

        // Verify we still have a valid socket and user data
        if (!sock.user) {
          console.log(`[${clientId}] WARNING: Connection opened but no user data - session may be rejected`);
          // Don't mark as connected yet, wait for user data
          session.status = 'validating';

          // Give it more time to get user data
          await delay(3000);

          if (!sock.user) {
            console.log(`[${clientId}] Session validation failed - no user data after timeout`);
            session.status = 'disconnected';
            io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: 'session_rejected' });
            return;
          }
        }

        console.log(`[${clientId}] Session validated successfully!`);
        session.status = 'connected';
        session.qrCode = null;
        session.reconnecting = false;

        try {
          const user = sock.user;
          session.info = {
            id: clientId,
            phoneNumber: user?.id?.split(':')[0] || user?.id?.split('@')[0] || 'unknown',
            name: user?.name || user?.verifiedName || 'WhatsApp User',
            platform: 'baileys'
          };

          console.log(`[${clientId}] Phone: ${session.info.phoneNumber}, Name: ${session.info.name}`);
          io.to(agencyId).emit('whatsapp:connected', { slot, account: session.info });

          // Notify that we're now syncing contacts/chats
          io.to(agencyId).emit('whatsapp:syncing', { slot, message: 'Syncing contacts and chats...' });
        } catch (err) {
          console.error(`[${clientId}] Error getting user info:`, err.message);
        }
      }

      // Connection closed
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || 'unknown';

        console.log(`[${clientId}] Closed: status=${statusCode}, reason=${errorMessage}`);

        session.qrCode = null;

        // Handle different disconnect reasons
        if (statusCode === DisconnectReason.loggedOut) {
          // User logged out - clean everything
          console.log(`[${clientId}] Logged out, cleaning session`);
          await endSession(clientId, true);
          io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: 'logged_out' });
        } else if (statusCode === 401 || statusCode === 403) {
          // Auth error - clean and notify
          console.log(`[${clientId}] Auth error, cleaning session`);
          await endSession(clientId, true);
          io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: 'auth_error' });
        } else if (statusCode === 408 || statusCode === 428) {
          // QR timeout or connection terminated - allow retry
          console.log(`[${clientId}] QR/connection timeout`);
          session.status = 'disconnected';
          io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: 'timeout' });
          // Don't auto-reconnect for QR timeout
          sessions.delete(clientId);
        } else if (statusCode === 515) {
          // Stream error - attempt reconnect once
          if (!session.reconnecting) {
            console.log(`[${clientId}] Stream error, will reconnect...`);
            session.reconnecting = true;
            session.status = 'connecting';
            await delay(3000);
            if (sessions.has(clientId)) {
              createSession(agencyId, slot);
            }
          } else {
            console.log(`[${clientId}] Already tried reconnecting, giving up`);
            await endSession(clientId, false);
            io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: 'connection_failed' });
          }
        } else {
          // Other errors - notify disconnect
          session.status = 'disconnected';
          io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: errorMessage });
          sessions.delete(clientId);
        }
      }
    });

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // ========== CONTACTS & CHATS SYNC EVENTS ==========
    // These are critical for loading chats after QR scan

    // Initial contacts sync (bulk)
    sock.ev.on('contacts.set', ({ contacts }) => {
      console.log(`[${clientId}] Contacts sync: received ${contacts.length} contacts`);
      for (const contact of contacts) {
        session.contacts.set(contact.id, {
          id: contact.id,
          name: contact.name || contact.notify || contact.verifiedName || null,
          phoneNumber: contact.id.split('@')[0],
          isGroup: contact.id.endsWith('@g.us')
        });
      }
      console.log(`[${clientId}] Total contacts stored: ${session.contacts.size}`);

      // Emit contacts to frontend
      io.to(agencyId).emit('whatsapp:contacts_synced', {
        slot,
        count: session.contacts.size
      });
    });

    // Incremental contact updates
    sock.ev.on('contacts.upsert', (contacts) => {
      console.log(`[${clientId}] Contacts upsert: ${contacts.length} contacts`);
      for (const contact of contacts) {
        session.contacts.set(contact.id, {
          id: contact.id,
          name: contact.name || contact.notify || contact.verifiedName || null,
          phoneNumber: contact.id.split('@')[0],
          isGroup: contact.id.endsWith('@g.us')
        });
      }
    });

    // Contact updates (name changes, etc.)
    sock.ev.on('contacts.update', (updates) => {
      for (const update of updates) {
        const existing = session.contacts.get(update.id);
        if (existing) {
          session.contacts.set(update.id, {
            ...existing,
            name: update.name || update.notify || existing.name
          });
        }
      }
    });

    // Initial chats sync (bulk)
    sock.ev.on('chats.set', ({ chats }) => {
      console.log(`[${clientId}] Chats sync: received ${chats.length} chats`);
      for (const chat of chats) {
        session.chats.set(chat.id, {
          id: chat.id,
          name: chat.name || null,
          unreadCount: chat.unreadCount || 0,
          conversationTimestamp: chat.conversationTimestamp,
          pinned: chat.pinned,
          archived: chat.archived,
          muted: chat.mute
        });
      }
      console.log(`[${clientId}] Total chats stored: ${session.chats.size}`);

      // Mark sync as complete
      session.syncComplete = true;

      // Emit to frontend
      io.to(agencyId).emit('whatsapp:chats_synced', {
        slot,
        count: session.chats.size
      });
    });

    // Incremental chat updates
    sock.ev.on('chats.upsert', (chats) => {
      console.log(`[${clientId}] Chats upsert: ${chats.length} chats`);
      for (const chat of chats) {
        session.chats.set(chat.id, {
          id: chat.id,
          name: chat.name || session.chats.get(chat.id)?.name || null,
          unreadCount: chat.unreadCount || 0,
          conversationTimestamp: chat.conversationTimestamp,
          pinned: chat.pinned,
          archived: chat.archived,
          muted: chat.mute
        });
      }
    });

    // Chat updates (read status, archive, etc.)
    sock.ev.on('chats.update', (updates) => {
      for (const update of updates) {
        const existing = session.chats.get(update.id);
        if (existing) {
          session.chats.set(update.id, {
            ...existing,
            ...update,
            name: update.name || existing.name
          });
        }
      }
    });

    // Chat deletion
    sock.ev.on('chats.delete', (deletedIds) => {
      console.log(`[${clientId}] Chats deleted: ${deletedIds.length}`);
      for (const id of deletedIds) {
        session.chats.delete(id);
      }
    });

    // Messaging history sync (for full history if enabled)
    sock.ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest }) => {
      console.log(`[${clientId}] History sync: ${chats?.length || 0} chats, ${contacts?.length || 0} contacts, ${messages?.length || 0} messages, isLatest=${isLatest}`);

      // Store contacts from history
      if (contacts) {
        for (const contact of contacts) {
          session.contacts.set(contact.id, {
            id: contact.id,
            name: contact.name || contact.notify || null,
            phoneNumber: contact.id.split('@')[0],
            isGroup: contact.id.endsWith('@g.us')
          });
        }
      }

      // Store chats from history
      if (chats) {
        for (const chat of chats) {
          session.chats.set(chat.id, {
            id: chat.id,
            name: chat.name || null,
            unreadCount: chat.unreadCount || 0,
            conversationTimestamp: chat.conversationTimestamp
          });
        }
      }

      if (isLatest) {
        session.syncComplete = true;
        console.log(`[${clientId}] Sync complete: ${session.contacts.size} contacts, ${session.chats.size} chats`);
        io.to(agencyId).emit('whatsapp:sync_complete', {
          slot,
          contactsCount: session.contacts.size,
          chatsCount: session.chats.size
        });
      }
    });

    // ========== END CONTACTS & CHATS SYNC EVENTS ==========

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      console.log(`[${clientId}] Messages upsert: type=${type}, count=${messages.length}`);

      // Handle all message types, not just 'notify'
      for (const msg of messages) {
        // Skip status broadcasts
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
          } else if (content?.contactMessage) {
            msgType = 'contact';
            body = content.contactMessage.displayName || '[Contact]';
          } else if (content?.locationMessage) {
            msgType = 'location';
            body = '[Location]';
          } else {
            body = '[Message]';
          }

          const formattedMsg = {
            id: msg.key.id,
            accountId: clientId,
            chatId: msg.key.remoteJid,
            fromMe: msg.key.fromMe || false,
            type: msgType,
            body,
            timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
            status: msg.key.fromMe ? 'sent' : 'delivered',
            senderName: msg.pushName || null
          };

          console.log(`[${clientId}] Message: ${formattedMsg.fromMe ? 'OUT' : 'IN'} - ${body.substring(0, 50)}`);

          io.to(agencyId).emit('whatsapp:message', { slot, message: formattedMsg });

          // Only send notification for incoming messages
          if (!msg.key.fromMe) {
            io.to(agencyId).emit('whatsapp:notification', {
              slot,
              chatId: msg.key.remoteJid,
              message: formattedMsg,
              contact: {
                name: msg.pushName || msg.key.remoteJid.split('@')[0],
                phoneNumber: msg.key.remoteJid.split('@')[0]
              }
            });
          }
        } catch (err) {
          console.error(`[${clientId}] Message processing error:`, err.message);
        }
      }
    });

    // Handle message status updates (read receipts, delivery)
    sock.ev.on('messages.update', (updates) => {
      for (const update of updates) {
        if (update.update?.status) {
          const statusMap = {
            1: 'pending',
            2: 'sent',
            3: 'delivered',
            4: 'read'
          };
          io.to(agencyId).emit('whatsapp:message_status', {
            slot,
            messageId: update.key.id,
            chatId: update.key.remoteJid,
            status: statusMap[update.update.status] || 'sent'
          });
        }
      }
    });

    return session;

  } catch (err) {
    console.error(`[${clientId}] Session creation failed:`, err.message);
    sessions.delete(clientId);
    io.to(agencyId).emit('whatsapp:error', { error: `Failed to create session: ${err.message}` });
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

    // Send current session states
    for (const [clientId, session] of sessions.entries()) {
      if (session.agencyId === agencyId) {
        // Send status
        socket.emit('whatsapp:status', {
          slot: session.slot,
          status: session.status,
          account: session.info
        });

        // Send connected event if connected
        if (session.status === 'connected' && session.info) {
          socket.emit('whatsapp:connected', {
            slot: session.slot,
            account: session.info
          });
        }

        // Send QR if available
        if (session.status === 'qr_ready' && session.qrCode) {
          socket.emit('whatsapp:qr', {
            slot: session.slot,
            qrCode: session.qrCode
          });
        }
      }
    }
  });

  socket.on('whatsapp:connect', async ({ agencyId, slot }) => {
    const targetAgency = agencyId || socket.agencyId;
    const targetSlot = slot || 1;
    console.log(`=== Connect request: ${targetAgency}_${targetSlot} ===`);
    await createSession(targetAgency, targetSlot);
  });

  socket.on('whatsapp:disconnect', async ({ agencyId, slot }) => {
    const clientId = `${agencyId}_${slot}`;
    console.log(`=== Disconnect request: ${clientId} ===`);
    await endSession(clientId, true);
    io.to(agencyId).emit('whatsapp:disconnected', { slot, reason: 'user_logout' });
  });

  socket.on('whatsapp:send', async ({ agencyId, slot, chatId, message }) => {
    const clientId = `${agencyId}_${slot}`;
    const session = sessions.get(clientId);

    if (!session?.sock || session.status !== 'connected') {
      socket.emit('whatsapp:error', { error: 'WhatsApp not connected' });
      return;
    }

    try {
      let result;
      if (message.type === 'text') {
        result = await session.sock.sendMessage(chatId, { text: message.body });
      }

      if (result) {
        io.to(agencyId).emit('whatsapp:message_sent', {
          slot,
          chatId,
          message: {
            id: result.key.id,
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
      console.error(`[${clientId}] Send failed:`, err.message);
      socket.emit('whatsapp:error', { error: 'Failed to send message' });
    }
  });

  socket.on('whatsapp:fetch_chats', async ({ agencyId, slot }) => {
    const clientId = `${agencyId}_${slot}`;
    const session = sessions.get(clientId);

    if (!session?.sock || session.status !== 'connected') {
      socket.emit('whatsapp:error', { error: 'WhatsApp not connected' });
      return;
    }

    try {
      console.log(`[${clientId}] Fetching chats - contacts: ${session.contacts.size}, chats: ${session.chats.size}`);

      // Get groups from WhatsApp
      let groups = {};
      try {
        groups = await session.sock.groupFetchAllParticipating();
      } catch (groupErr) {
        console.log(`[${clientId}] Could not fetch groups: ${groupErr.message}`);
      }

      // Build chat list from multiple sources
      const chatMap = new Map();

      // 1. Add groups from groupFetchAllParticipating
      for (const group of Object.values(groups || {})) {
        chatMap.set(group.id, {
          id: group.id,
          accountId: clientId,
          contact: {
            id: group.id,
            phoneNumber: group.id.split('@')[0],
            name: group.subject || group.name || 'Unknown Group',
            isGroup: true
          },
          type: 'group',
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false
        });
      }

      // 2. Add individual contacts from synced contacts
      for (const [contactId, contact] of session.contacts.entries()) {
        // Skip groups (already handled above) and broadcast
        if (contactId.endsWith('@g.us') || contactId === 'status@broadcast') continue;

        // Only add if not already in the map
        if (!chatMap.has(contactId)) {
          chatMap.set(contactId, {
            id: contactId,
            accountId: clientId,
            contact: {
              id: contactId,
              phoneNumber: contact.phoneNumber,
              name: contact.name || contact.phoneNumber,
              isGroup: false
            },
            type: 'individual',
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            isArchived: false
          });
        }
      }

      // 3. Add chats from synced chats (these have conversation history)
      for (const [chatId, chat] of session.chats.entries()) {
        if (chatId === 'status@broadcast') continue;

        const isGroup = chatId.endsWith('@g.us');
        const existing = chatMap.get(chatId);

        if (existing) {
          // Update with chat metadata
          existing.unreadCount = chat.unreadCount || 0;
          existing.isPinned = chat.pinned || false;
          existing.isMuted = chat.muted || false;
          existing.isArchived = chat.archived || false;
          existing.lastMessageTimestamp = chat.conversationTimestamp;
        } else {
          // Add new chat entry
          const contact = session.contacts.get(chatId);
          chatMap.set(chatId, {
            id: chatId,
            accountId: clientId,
            contact: {
              id: chatId,
              phoneNumber: chatId.split('@')[0],
              name: contact?.name || chat.name || chatId.split('@')[0],
              isGroup
            },
            type: isGroup ? 'group' : 'individual',
            unreadCount: chat.unreadCount || 0,
            isPinned: chat.pinned || false,
            isMuted: chat.muted || false,
            isArchived: chat.archived || false,
            lastMessageTimestamp: chat.conversationTimestamp
          });
        }
      }

      // Convert to array and sort by last message timestamp (recent first)
      const chatList = Array.from(chatMap.values())
        .sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0))
        .slice(0, 200); // Limit to 200 chats

      console.log(`[${clientId}] Returning ${chatList.length} chats (${chatList.filter(c => c.type === 'group').length} groups, ${chatList.filter(c => c.type === 'individual').length} individuals)`);

      socket.emit('whatsapp:chats', { slot, chats: chatList });
    } catch (err) {
      console.error(`[${clientId}] Fetch chats failed:`, err.message);
      socket.emit('whatsapp:error', { error: 'Failed to fetch chats' });
    }
  });

  socket.on('whatsapp:fetch_messages', async ({ agencyId, slot, chatId, limit = 50 }) => {
    const clientId = `${agencyId}_${slot}`;
    const session = sessions.get(clientId);

    if (!session?.sock || session.status !== 'connected') {
      socket.emit('whatsapp:error', { error: 'WhatsApp not connected' });
      return;
    }

    try {
      console.log(`[${clientId}] Fetching messages for chat: ${chatId}`);
      // Note: Baileys doesn't have a direct fetchMessages method
      // Messages are received via messages.upsert event
      // We can only acknowledge we're ready to receive for this chat
      socket.emit('whatsapp:messages', { slot, chatId, messages: [] });
    } catch (err) {
      console.error(`[${clientId}] Fetch messages failed:`, err.message);
      socket.emit('whatsapp:error', { error: 'Failed to fetch messages' });
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
      id,
      status: session.status,
      hasQR: !!session.qrCode,
      hasInfo: !!session.info,
      contactsCount: session.contacts?.size || 0,
      chatsCount: session.chats?.size || 0,
      syncComplete: session.syncComplete || false
    });
  }

  res.json({
    status: 'ok',
    version: '2.3.0',  // Updated version with contact/chat sync fixes
    environment: isCloudRun ? 'cloud-run' : 'local',
    sessions: sessions.size,
    sessionList,
    connections: io.engine.clientsCount
  });
});

app.get('/api/sessions/:agencyId', (req, res) => {
  const { agencyId } = req.params;
  const agencySessions = [];

  for (const [id, session] of sessions.entries()) {
    if (session.agencyId === agencyId) {
      agencySessions.push({
        slot: session.slot,
        status: session.status,
        account: session.info
      });
    }
  }

  res.json({ sessions: agencySessions });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WhatsApp Server v2.3.0 running on port ${PORT}`);
  console.log('Fixes included:');
  console.log('  - Removed fetchLatestBaileysVersion for stable connections');
  console.log('  - Added contacts/chats sync event listeners');
  console.log('  - Connection validation after QR scan');
  console.log('  - fetch_chats now returns individuals + groups');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  for (const [clientId] of sessions.entries()) {
    await endSession(clientId, false);
  }
  process.exit(0);
});
