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

    // WhatsApp status event
    socket.on('whatsapp:status', ({ serverId: sid, status, account }) => {
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

    // QR Code received
    socket.on('whatsapp:qr', ({ serverId: sid, qrCode }) => {
      console.log(`QR code received from Server ${sid}`);
      server.qrCode = qrCode;
      server.status = 'qr_ready' as WhatsAppConnectionStatus;
      useWhatsAppStore.getState().setActiveServerQR(sid, qrCode);
      this.updateStore();
    });

    // Connected successfully
    socket.on('whatsapp:connected', ({ serverId: sid, account }) => {
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
    });

    // Disconnected
    socket.on('whatsapp:disconnected', ({ serverId: sid, reason }) => {
      console.log(`WhatsApp disconnected on Server ${sid}:`, reason);
      server.status = 'disconnected';
      server.qrCode = null;
      server.account = null;
      useWhatsAppStore.getState().setActiveServerQR(sid, null);
      this.updateStore();
    });

    // Error
    socket.on('whatsapp:error', ({ serverId: sid, error }) => {
      console.error(`Server ${sid} error:`, error);
      useWhatsAppStore.getState().setError(error);
    });

    // Message received
    socket.on('whatsapp:message', ({ serverId: sid, message }) => {
      console.log(`Message from Server ${sid}:`, message);
      useWhatsAppStore.getState().addMessage(message.chatId, {
        ...message,
        accountId: `server_${sid}`,
      });
    });

    // Message sent confirmation
    socket.on('whatsapp:message_sent', ({ serverId: sid, chatId, message }) => {
      console.log(`Message sent on Server ${sid}:`, chatId);
      useWhatsAppStore.getState().addMessage(chatId, {
        ...message,
        accountId: `server_${sid}`,
      });
    });

    // Notification
    socket.on('whatsapp:notification', ({ serverId: sid, chatId, message, contact }) => {
      useWhatsAppStore.getState().addNotification({
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

    // Chats received
    socket.on('whatsapp:chats', ({ serverId: sid, chats }) => {
      console.log(`Chats from Server ${sid}:`, chats.length);
      useWhatsAppStore.getState().setServerChats(sid, chats);
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
    server.socket.emit('whatsapp:disconnect', { agencyId: this.agencyId });
  }

  // Send message
  sendMessage(serverId: number, chatId: string, message: { type: string; body?: string; mediaData?: string; mediaMimeType?: string; mediaFileName?: string; caption?: string }) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) {
      console.error(`Cannot send message: Server ${serverId} not connected`);
      return;
    }

    server.socket.emit('whatsapp:send', {
      agencyId: this.agencyId,
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

    server.socket.emit('whatsapp:fetch_chats', { agencyId: this.agencyId });
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
