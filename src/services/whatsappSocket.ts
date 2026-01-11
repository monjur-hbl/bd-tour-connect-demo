import { io, Socket } from 'socket.io-client';
import { useWhatsAppStore } from '../stores/whatsappStore';
import {
  WhatsAppAccount,
  WhatsAppChat,
  WhatsAppMessage,
  WhatsAppConnectionStatus,
} from '../types';

// WhatsApp server URL - change this based on environment
const WHATSAPP_SERVER_URL = process.env.REACT_APP_WHATSAPP_SERVER_URL || 'http://localhost:3001';

class WhatsAppSocketService {
  private socket: Socket | null = null;
  private agencyId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(agencyId: string) {
    if (this.socket?.connected && this.agencyId === agencyId) {
      return;
    }

    this.agencyId = agencyId;
    this.disconnect();

    console.log('Connecting to WhatsApp server:', WHATSAPP_SERVER_URL);

    this.socket = io(WHATSAPP_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();

    // Join agency room
    this.socket.on('connect', () => {
      console.log('Connected to WhatsApp server');
      this.reconnectAttempts = 0;
      this.socket?.emit('join', { agencyId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WhatsApp server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        useWhatsAppStore.getState().setError('Unable to connect to WhatsApp server. Please try again later.');
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    const store = useWhatsAppStore.getState();

    // Account status update
    this.socket.on('whatsapp:status', ({ slot, status, account }) => {
      console.log('Status update:', slot, status);
      if (account) {
        const existingAccounts = useWhatsAppStore.getState().accounts;
        const existingIndex = existingAccounts.findIndex(a => a.id === account.id);

        if (existingIndex >= 0) {
          const updated = [...existingAccounts];
          updated[existingIndex] = { ...updated[existingIndex], status, ...account };
          useWhatsAppStore.getState().setAccounts(updated);
        } else {
          useWhatsAppStore.getState().addAccount({
            ...account,
            status,
            agencyId: this.agencyId!,
          });
        }
      }
    });

    // QR Code received
    this.socket.on('whatsapp:qr', ({ slot, qrCode }) => {
      console.log('QR code received for slot:', slot);
      useWhatsAppStore.getState().setQrCode(qrCode);
    });

    // Connected successfully
    this.socket.on('whatsapp:connected', ({ slot, account }) => {
      console.log('WhatsApp connected:', account);
      useWhatsAppStore.getState().setQrCode(null);

      const fullAccount: WhatsAppAccount = {
        id: account.id,
        phoneNumber: account.phoneNumber,
        name: account.name,
        status: 'connected',
        connectedAt: new Date().toISOString(),
        agencyId: this.agencyId!,
      };

      const existingAccounts = useWhatsAppStore.getState().accounts;
      const existingIndex = existingAccounts.findIndex(a => a.id === account.id);

      if (existingIndex >= 0) {
        const updated = [...existingAccounts];
        updated[existingIndex] = fullAccount;
        useWhatsAppStore.getState().setAccounts(updated);
      } else {
        useWhatsAppStore.getState().addAccount(fullAccount);
      }

      // Play success sound
      try {
        const audio = new Audio('/sounds/whatsapp-notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    });

    // Disconnected
    this.socket.on('whatsapp:disconnected', ({ slot, reason }) => {
      console.log('WhatsApp disconnected:', reason);
      const accounts = useWhatsAppStore.getState().accounts;
      const updated = accounts.map(acc => {
        if (acc.id.endsWith(`_${slot}`)) {
          return { ...acc, status: 'disconnected' as WhatsAppConnectionStatus };
        }
        return acc;
      });
      useWhatsAppStore.getState().setAccounts(updated);
    });

    // Auth failure
    this.socket.on('whatsapp:auth_failure', ({ slot, message }) => {
      console.error('Auth failure:', message);
      useWhatsAppStore.getState().setError('WhatsApp authentication failed. Please try again.');
      useWhatsAppStore.getState().setQrCode(null);
    });

    // Chats received
    this.socket.on('whatsapp:chats', ({ slot, chats }) => {
      console.log('Received chats:', chats.length);
      useWhatsAppStore.getState().setChats(chats);
    });

    // Messages received
    this.socket.on('whatsapp:messages', ({ slot, chatId, messages }) => {
      console.log('Received messages for chat:', chatId, messages.length);
      useWhatsAppStore.getState().setMessages(chatId, messages);
    });

    // New message received
    this.socket.on('whatsapp:message', ({ slot, message, chat }) => {
      console.log('New message:', message?.body?.substring(0, 50));

      if (message) {
        useWhatsAppStore.getState().addMessage(message.chatId, message);
      }

      if (chat) {
        useWhatsAppStore.getState().updateChat(chat.id, chat);
      }
    });

    // Message sent confirmation
    this.socket.on('whatsapp:message_sent', ({ slot, chatId, message }) => {
      console.log('Message sent:', message.id);
      useWhatsAppStore.getState().addMessage(chatId, message);
    });

    // Message status update
    this.socket.on('whatsapp:message_status', ({ slot, messageId, chatId, status }) => {
      useWhatsAppStore.getState().updateMessage(chatId, messageId, { status });
    });

    // Notification
    this.socket.on('whatsapp:notification', ({ slot, chatId, message, contact }) => {
      const state = useWhatsAppStore.getState();

      // Add notification
      state.addNotification({
        id: `notif-${Date.now()}`,
        chatId,
        message,
        accountId: message.accountId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${contact.name}`, {
          body: message.body || 'New message',
          icon: '/logo192.png',
          tag: chatId,
        });
      }
    });

    // Reply tracking
    this.socket.on('whatsapp:reply_started', ({ chatId, userId, userName }) => {
      useWhatsAppStore.getState().updateChat(chatId, {
        activeReplyBy: userId,
        activeReplyByName: userName,
        activeReplyAt: new Date().toISOString(),
      });
    });

    this.socket.on('whatsapp:reply_cleared', ({ chatId }) => {
      useWhatsAppStore.getState().updateChat(chatId, {
        activeReplyBy: undefined,
        activeReplyByName: undefined,
        activeReplyAt: undefined,
      });
    });

    // Error handling
    this.socket.on('whatsapp:error', ({ error }) => {
      console.error('WhatsApp error:', error);
      useWhatsAppStore.getState().setError(error);
    });
  }

  // Request QR code to connect a new WhatsApp account
  requestQR(slot: number) {
    if (!this.socket || !this.agencyId) {
      console.error('Socket not connected');
      return;
    }

    console.log('Requesting QR for slot:', slot);
    this.socket.emit('whatsapp:connect', {
      agencyId: this.agencyId,
      slot,
    });
  }

  // Disconnect WhatsApp account
  disconnectAccount(slot: number) {
    if (!this.socket || !this.agencyId) return;

    this.socket.emit('whatsapp:disconnect', {
      agencyId: this.agencyId,
      slot,
    });
  }

  // Send message
  sendMessage(slot: number, chatId: string, message: {
    type: string;
    body?: string;
    mediaData?: string;
    mediaMimeType?: string;
    mediaFileName?: string;
    caption?: string;
  }) {
    if (!this.socket || !this.agencyId) return;

    this.socket.emit('whatsapp:send', {
      agencyId: this.agencyId,
      slot,
      chatId,
      message,
    });
  }

  // Fetch messages for a chat
  fetchMessages(slot: number, chatId: string, limit = 50) {
    if (!this.socket || !this.agencyId) return;

    this.socket.emit('whatsapp:fetch_messages', {
      agencyId: this.agencyId,
      slot,
      chatId,
      limit,
    });
  }

  // Fetch all chats
  fetchChats(slot: number) {
    if (!this.socket || !this.agencyId) return;

    this.socket.emit('whatsapp:fetch_chats', {
      agencyId: this.agencyId,
      slot,
    });
  }

  // Start replying indicator
  startReplying(chatId: string, userId: string, userName: string) {
    if (!this.socket || !this.agencyId) return;

    this.socket.emit('whatsapp:start_reply', {
      agencyId: this.agencyId,
      chatId,
      userId,
      userName,
    });
  }

  // Stop replying indicator
  stopReplying(chatId: string, userId: string) {
    if (!this.socket || !this.agencyId) return;

    this.socket.emit('whatsapp:stop_reply', {
      agencyId: this.agencyId,
      chatId,
      userId,
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.agencyId = null;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const whatsappSocket = new WhatsAppSocketService();

// Hook for easy access
export function useWhatsAppSocket() {
  return whatsappSocket;
}
