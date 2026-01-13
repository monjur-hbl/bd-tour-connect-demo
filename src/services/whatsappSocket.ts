import { io, Socket } from 'socket.io-client';
import { useWhatsAppStore } from '../stores/whatsappStore';
import { WhatsAppAccount, WhatsAppConnectionStatus } from '../types';

// Server URLs
const WHATSAPP_SERVER_1_URL = process.env.REACT_APP_WHATSAPP_SERVER_1_URL || 'https://bd-tour-whatsapp-1-1006186358018.us-central1.run.app';
const WHATSAPP_SERVER_2_URL = process.env.REACT_APP_WHATSAPP_SERVER_2_URL || 'https://bd-tour-whatsapp-2-1006186358018.us-central1.run.app';

interface ServerConnection {
  socket: Socket | null;
  serverId: number;
  serverUrl: string;
  status: WhatsAppConnectionStatus;
  account: WhatsAppAccount | null;
  qrCode: string | null;
}

class WhatsAppSocketService {
  private servers: Map<number, ServerConnection> = new Map();
  private agencyId: string | null = null;

  constructor() {
    // Initialize server connections
    this.servers.set(1, {
      socket: null,
      serverId: 1,
      serverUrl: WHATSAPP_SERVER_1_URL,
      status: 'disconnected',
      account: null,
      qrCode: null,
    });
    this.servers.set(2, {
      socket: null,
      serverId: 2,
      serverUrl: WHATSAPP_SERVER_2_URL,
      status: 'disconnected',
      account: null,
      qrCode: null,
    });
  }

  // Connect to both servers
  connect(agencyId: string) {
    this.agencyId = agencyId;
    console.log('Connecting to WhatsApp servers for agency:', agencyId);

    // Connect to server 1
    this.connectToServer(1, agencyId);
    // Connect to server 2
    this.connectToServer(2, agencyId);
  }

  private connectToServer(serverId: number, agencyId: string) {
    const server = this.servers.get(serverId);
    if (!server) return;

    // Disconnect existing socket
    if (server.socket) {
      server.socket.disconnect();
    }

    console.log(`Connecting to Server ${serverId}: ${server.serverUrl}`);

    const socket = io(server.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
    });

    server.socket = socket;

    // Socket connection events
    socket.on('connect', () => {
      console.log(`Connected to Server ${serverId}`);
      socket.emit('join', { agencyId });
    });

    socket.on('connect_error', (error) => {
      console.error(`Server ${serverId} connection error:`, error.message);
      server.status = 'disconnected';
      this.updateStore();
    });

    socket.on('disconnect', (reason) => {
      console.log(`Server ${serverId} disconnected:`, reason);
      server.status = 'disconnected';
      this.updateStore();
    });

    // WhatsApp status event - server sends 'slot' not 'serverId'
    socket.on('whatsapp:status', ({ slot, status, account }) => {
      const sid = slot || serverId;
      console.log(`Server ${sid} status:`, status);
      server.status = status as WhatsAppConnectionStatus;
      if (account) {
        server.account = {
          id: account.id,
          phoneNumber: account.phoneNumber,
          name: account.name,
          status: 'connected',
          agencyId,
          serverId: sid,
        };
      }
      this.updateStore();
    });

    // QR Code received - server sends 'slot' not 'serverId'
    socket.on('whatsapp:qr', ({ slot, qrCode }) => {
      const sid = slot || serverId;
      console.log(`QR code received from Server ${sid}`);
      server.qrCode = qrCode;
      server.status = 'qr_ready' as WhatsAppConnectionStatus;
      useWhatsAppStore.getState().setActiveServerQR(sid, qrCode);
      this.updateStore();
    });

    // Connected successfully - server sends 'slot' not 'serverId'
    socket.on('whatsapp:connected', ({ slot, account }) => {
      const sid = slot || serverId;
      console.log(`WhatsApp connected on Server ${sid}:`, account);
      server.status = 'connected';
      server.qrCode = null;
      server.account = {
        id: account.id || `server_${sid}`,
        phoneNumber: account.phoneNumber,
        name: account.name,
        status: 'connected',
        connectedAt: new Date().toISOString(),
        agencyId,
        serverId: sid,
      };
      useWhatsAppStore.getState().setActiveServerQR(sid, null);
      this.updateStore();

      // Fetch chats automatically after connection
      console.log(`Auto-fetching chats for server ${sid} after connection`);
      setTimeout(() => {
        this.fetchChats(sid);
      }, 1000);
    });

    // Disconnected - server sends 'slot' not 'serverId'
    socket.on('whatsapp:disconnected', ({ slot, reason }) => {
      const sid = slot || serverId;
      console.log(`WhatsApp disconnected on Server ${sid}:`, reason);
      server.status = 'disconnected';
      server.qrCode = null;
      server.account = null;
      useWhatsAppStore.getState().setActiveServerQR(sid, null);
      this.updateStore();
    });

    // Error - server sends 'slot' for some errors
    socket.on('whatsapp:error', ({ slot, error }) => {
      const sid = slot || serverId;
      console.error(`Server ${sid} error:`, error);
      useWhatsAppStore.getState().setError(error);
    });

    // Message received - server sends 'slot' not 'serverId'
    socket.on('whatsapp:message', ({ slot, message }) => {
      const sid = slot || serverId;
      console.log(`Message from Server ${sid}:`, message);

      // Add required fields that the server might not send
      const phoneNumber = message.chatId?.split('@')[0] || '';
      const fullMessage = {
        ...message,
        accountId: `server_${sid}`,
        from: message.fromMe ? 'me' : phoneNumber,
        to: message.fromMe ? phoneNumber : 'me',
      };

      useWhatsAppStore.getState().addMessage(message.chatId, fullMessage);
    });

    // Message sent confirmation - server sends 'slot' not 'serverId'
    socket.on('whatsapp:message_sent', ({ slot, chatId, message }) => {
      const sid = slot || serverId;
      console.log(`Message sent on Server ${sid}:`, chatId);

      // Add required fields that the server might not send
      const phoneNumber = chatId?.split('@')[0] || '';
      const fullMessage = {
        ...message,
        accountId: `server_${sid}`,
        from: message.fromMe ? 'me' : phoneNumber,
        to: message.fromMe ? phoneNumber : 'me',
      };

      useWhatsAppStore.getState().addMessage(chatId, fullMessage);
    });

    // Notification - server sends 'slot' not 'serverId'
    socket.on('whatsapp:notification', ({ slot, chatId, message, contact }) => {
      const sid = slot || serverId;
      const store = useWhatsAppStore.getState();

      // Don't show notification if this chat is currently active
      if (store.activeChat === chatId) {
        return;
      }

      store.addNotification({
        id: message.id,
        accountId: `server_${sid}`,
        chatId,
        message: {
          ...message,
          accountId: `server_${sid}`,
        },
        isRead: false,
        createdAt: message.timestamp,
      });
    });

    // Chats received - server sends 'slot' not 'serverId'
    socket.on('whatsapp:chats', ({ slot, chats }) => {
      const sid = slot || serverId;
      console.log(`Chats received from Server ${sid}:`, chats?.length || 0);
      if (chats && chats.length > 0) {
        useWhatsAppStore.getState().setServerChats(sid, chats);
      }
    });

    // Messages received for a specific chat
    socket.on('whatsapp:messages', ({ slot, chatId, messages }) => {
      const sid = slot || serverId;
      console.log(`Messages received from Server ${sid} for chat ${chatId}:`, messages?.length || 0);
      if (messages && messages.length > 0) {
        // Add from/to fields and set messages
        const fullMessages = messages.map((msg: any) => {
          const phoneNumber = chatId?.split('@')[0] || '';
          return {
            ...msg,
            accountId: `server_${sid}`,
            from: msg.fromMe ? 'me' : phoneNumber,
            to: msg.fromMe ? phoneNumber : 'me',
          };
        });
        useWhatsAppStore.getState().setMessages(chatId, fullMessages);
      }
    });

    // Sync events from server
    socket.on('whatsapp:contacts_synced', ({ slot, count }) => {
      console.log(`Server ${slot || serverId}: ${count} contacts synced`);
    });

    socket.on('whatsapp:chats_synced', ({ slot, count }) => {
      console.log(`Server ${slot || serverId}: ${count} chats synced`);
      // Trigger fetch chats once sync is complete
      const sid = slot || serverId;
      setTimeout(() => {
        this.fetchChats(sid);
      }, 500);
    });

    socket.on('whatsapp:sync_complete', ({ slot, contactsCount, chatsCount }) => {
      console.log(`Server ${slot || serverId}: Sync complete - ${contactsCount} contacts, ${chatsCount} chats`);
      // Trigger fetch chats once sync is complete
      const sid = slot || serverId;
      this.fetchChats(sid);
    });

    socket.on('whatsapp:syncing', ({ slot, message }) => {
      console.log(`Server ${slot || serverId}: ${message}`);
    });
  }

  // Update Zustand store with current state
  private updateStore() {
    const statuses: Record<number, { status: WhatsAppConnectionStatus; account: WhatsAppAccount | null }> = {};

    this.servers.forEach((server, serverId) => {
      statuses[serverId] = {
        status: server.status,
        account: server.account,
      };
    });

    useWhatsAppStore.getState().setServerStatuses(statuses);
  }

  // Request QR code for specific server
  requestQR(serverId: number) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) {
      console.error(`Cannot request QR: Server ${serverId} not connected`);
      return;
    }

    console.log(`Requesting QR from Server ${serverId}`);
    server.socket.emit('whatsapp:connect', { agencyId: this.agencyId });
  }

  // Disconnect WhatsApp on specific server
  disconnectWhatsApp(serverId: number) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) {
      console.error(`Cannot disconnect: Server ${serverId} not connected`);
      return;
    }

    console.log(`Disconnecting WhatsApp from Server ${serverId}`);
    server.socket.emit('whatsapp:disconnect', { agencyId: this.agencyId, slot: serverId });
  }

  // Send message
  sendMessage(serverId: number, chatId: string, message: { type: string; body?: string; mediaData?: string; mediaMimeType?: string; mediaFileName?: string; caption?: string }) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) {
      console.error(`Cannot send message: Server ${serverId} not connected`);
      return;
    }

    console.log(`Sending message to ${chatId} via server ${serverId}`);
    server.socket.emit('whatsapp:send', {
      agencyId: this.agencyId,
      slot: serverId,  // Server expects 'slot' parameter
      chatId,
      message,
    });
  }

  // Fetch chats
  fetchChats(serverId: number) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) {
      console.error(`Cannot fetch chats: Server ${serverId} not connected`);
      return;
    }

    // Server expects slot parameter (slot 1 for server 1, etc.)
    console.log(`Fetching chats for server ${serverId}, agency ${this.agencyId}`);
    server.socket.emit('whatsapp:fetch_chats', { agencyId: this.agencyId, slot: serverId });
  }

  // Fetch messages for a specific chat
  fetchMessages(serverId: number, chatId: string, limit: number = 50) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) {
      console.error(`Cannot fetch messages: Server ${serverId} not connected`);
      return;
    }

    console.log(`Fetching messages for chat ${chatId} from server ${serverId}`);
    server.socket.emit('whatsapp:fetch_messages', {
      agencyId: this.agencyId,
      slot: serverId,
      chatId,
      limit,
    });
  }

  // Get server status
  getServerStatus(serverId: number): WhatsAppConnectionStatus {
    return this.servers.get(serverId)?.status || 'disconnected';
  }

  // Get server account
  getServerAccount(serverId: number): WhatsAppAccount | null {
    return this.servers.get(serverId)?.account || null;
  }

  // Get server QR code
  getServerQRCode(serverId: number): string | null {
    return this.servers.get(serverId)?.qrCode || null;
  }

  // Disconnect all
  disconnect() {
    this.servers.forEach((server) => {
      if (server.socket) {
        server.socket.disconnect();
        server.socket = null;
      }
      server.status = 'disconnected';
      server.account = null;
      server.qrCode = null;
    });
    this.agencyId = null;
    this.updateStore();
  }
}

// Singleton instance
export const whatsappSocket = new WhatsAppSocketService();

// Hook for easy access
export function useWhatsAppSocket() {
  return whatsappSocket;
}
