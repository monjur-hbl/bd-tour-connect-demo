import { io, Socket } from 'socket.io-client';
import { useWhatsAppStore } from '../stores/whatsappStore';
import {
  WhatsAppAccount,
  WhatsAppConnectionStatus,
} from '../types';

// Two separate WhatsApp server URLs
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
  private maxReconnectAttempts = 5;

  constructor() {
    // Initialize both server connections
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

  connect(agencyId: string) {
    this.agencyId = agencyId;

    // Connect to both servers
    this.servers.forEach((server, serverId) => {
      this.connectToServer(serverId, agencyId);
    });
  }

  private connectToServer(serverId: number, agencyId: string) {
    const server = this.servers.get(serverId);
    if (!server) return;

    if (server.socket?.connected) {
      return;
    }

    // Disconnect existing socket
    if (server.socket) {
      server.socket.disconnect();
    }

    console.log(`Connecting to WhatsApp Server ${serverId}:`, server.serverUrl);

    const socket = io(server.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    server.socket = socket;

    this.setupServerListeners(serverId, socket, agencyId);
  }

  private setupServerListeners(serverId: number, socket: Socket, agencyId: string) {
    const server = this.servers.get(serverId);
    if (!server) return;

    socket.on('connect', () => {
      console.log(`Connected to WhatsApp Server ${serverId}`);
      socket.emit('join', { agencyId });
    });

    socket.on('disconnect', (reason) => {
      console.log(`Disconnected from WhatsApp Server ${serverId}:`, reason);
    });

    socket.on('connect_error', (error) => {
      console.error(`Connection error on Server ${serverId}:`, error);
    });

    // Status update
    socket.on('whatsapp:status', ({ status, account }) => {
      console.log(`Server ${serverId} status:`, status);
      server.status = status;
      if (account) {
        server.account = {
          ...account,
          id: `server_${serverId}`,
          agencyId: this.agencyId!,
          status,
          serverId,
        };
      }
      this.updateStore();
    });

    // QR Code received
    socket.on('whatsapp:qr', ({ qrCode }) => {
      console.log(`QR code received from Server ${serverId}`);
      server.qrCode = qrCode;
      server.status = 'qr_ready' as WhatsAppConnectionStatus;
      useWhatsAppStore.getState().setActiveServerQR(serverId, qrCode);
      this.updateStore();
    });

    // Connecting (after QR scan)
    socket.on('whatsapp:connecting', () => {
      console.log(`Server ${serverId} connecting (QR scanned)...`);
      server.status = 'connecting';
      server.qrCode = null;
      useWhatsAppStore.getState().setActiveServerQR(serverId, null);
      this.updateStore();
    });

    // Connected successfully
    socket.on('whatsapp:connected', ({ account }) => {
      console.log(`WhatsApp connected on Server ${serverId}:`, account);
      server.status = 'connected';
      server.qrCode = null;
      server.account = {
        id: `server_${serverId}`,
        phoneNumber: account.phoneNumber,
        name: account.name,
        status: 'connected',
        connectedAt: new Date().toISOString(),
        agencyId: this.agencyId!,
        serverId,
      };
      useWhatsAppStore.getState().setActiveServerQR(serverId, null);
      this.updateStore();

      // Play success sound
      try {
        const audio = new Audio('/sounds/whatsapp-notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    });

    // Disconnected
    socket.on('whatsapp:disconnected', ({ reason }) => {
      console.log(`WhatsApp disconnected on Server ${serverId}:`, reason);
      server.status = 'disconnected';
      server.account = null;
      server.qrCode = null;
      this.updateStore();
    });

    // New message
    socket.on('whatsapp:message', ({ message }) => {
      console.log(`Message from Server ${serverId}:`, message?.body?.substring(0, 50));
      if (message) {
        useWhatsAppStore.getState().addMessage(message.chatId, {
          ...message,
          serverId,
        });
      }
    });

    // Message sent
    socket.on('whatsapp:message_sent', ({ chatId, message }) => {
      console.log(`Message sent on Server ${serverId}`);
      useWhatsAppStore.getState().addMessage(chatId, {
        ...message,
        serverId,
      });
    });

    // Notification
    socket.on('whatsapp:notification', ({ chatId, message, contact }) => {
      useWhatsAppStore.getState().addNotification({
        id: `notif-${Date.now()}`,
        chatId,
        message: { ...message, serverId },
        accountId: `server_${serverId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${contact.name} (WhatsApp ${serverId})`, {
          body: message.body || 'New message',
          icon: '/logo192.png',
          tag: chatId,
        });
      }
    });

    // Chats received
    socket.on('whatsapp:chats', ({ chats }) => {
      console.log(`Received ${chats.length} chats from Server ${serverId}`);
      useWhatsAppStore.getState().setServerChats(serverId, chats);
    });

    // Error
    socket.on('whatsapp:error', ({ error }) => {
      console.error(`Error on Server ${serverId}:`, error);
      useWhatsAppStore.getState().setError(`Server ${serverId}: ${error}`);
    });
  }

  private updateStore() {
    const accounts: WhatsAppAccount[] = [];
    this.servers.forEach((server) => {
      if (server.account) {
        accounts.push(server.account);
      }
    });
    useWhatsAppStore.getState().setAccounts(accounts);

    // Update server statuses
    const serverStatuses: Record<number, { status: WhatsAppConnectionStatus; account: WhatsAppAccount | null }> = {};
    this.servers.forEach((server, id) => {
      serverStatuses[id] = {
        status: server.status,
        account: server.account,
      };
    });
    useWhatsAppStore.getState().setServerStatuses(serverStatuses);
  }

  // Request QR code for a specific server
  requestQR(serverId: number) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) {
      console.error(`Server ${serverId} socket not connected`);
      return;
    }

    console.log(`Requesting QR for Server ${serverId}`);
    server.socket.emit('whatsapp:connect', {
      agencyId: this.agencyId,
    });
  }

  // Disconnect WhatsApp account on a specific server
  disconnectAccount(serverId: number) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) return;

    server.socket.emit('whatsapp:disconnect', {
      agencyId: this.agencyId,
    });
  }

  // Send message via specific server
  sendMessage(serverId: number, chatId: string, message: {
    type: string;
    body?: string;
    mediaData?: string;
    mediaMimeType?: string;
    mediaFileName?: string;
    caption?: string;
  }) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) return;

    server.socket.emit('whatsapp:send', {
      agencyId: this.agencyId,
      chatId,
      message,
    });
  }

  // Fetch chats for a specific server
  fetchChats(serverId: number) {
    const server = this.servers.get(serverId);
    if (!server?.socket || !this.agencyId) return;

    server.socket.emit('whatsapp:fetch_chats', {
      agencyId: this.agencyId,
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
  getServerQR(serverId: number): string | null {
    return this.servers.get(serverId)?.qrCode || null;
  }

  // Disconnect all
  disconnect() {
    this.servers.forEach((server) => {
      if (server.socket) {
        server.socket.disconnect();
        server.socket = null;
      }
    });
    this.agencyId = null;
  }

  // Check if any server is connected
  isAnyConnected(): boolean {
    let connected = false;
    this.servers.forEach((server) => {
      if (server.socket?.connected) {
        connected = true;
      }
    });
    return connected;
  }
}

// Singleton instance
export const whatsappSocket = new WhatsAppSocketService();

// Hook for easy access
export function useWhatsAppSocket() {
  return whatsappSocket;
}
