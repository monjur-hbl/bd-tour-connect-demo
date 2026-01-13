import { create } from 'zustand';
import {
  WhatsAppAccount,
  WhatsAppChat,
  WhatsAppMessage,
  WhatsAppNotification,
  WhatsAppConnectionStatus,
  WhatsAppMessageType,
} from '../types';

// WhatsApp notification sound
const WHATSAPP_NOTIFICATION_SOUND = '/sounds/whatsapp-notification.mp3';

interface ServerStatus {
  status: WhatsAppConnectionStatus;
  account: WhatsAppAccount | null;
}

interface WhatsAppStore {
  // State
  accounts: WhatsAppAccount[];
  chats: WhatsAppChat[];
  messages: Record<string, WhatsAppMessage[]>;
  activeChat: string | null;
  activeAccount: string | null;
  activeServer: number;
  qrCode: string | null;
  serverQRCodes: Record<number, string | null>;
  serverStatuses: Record<number, ServerStatus>;
  serverChats: Record<number, WhatsAppChat[]>;
  searchQuery: string;
  notifications: WhatsAppNotification[];
  unreadTotal: number;
  isLoading: boolean;
  error: string | null;
  isComposing: boolean;
  mediaPreview: { file: File; type: WhatsAppMessageType; previewUrl: string } | null;
  replyToMessage: WhatsAppMessage | null;
  soundEnabled: boolean;

  // Account actions
  setAccounts: (accounts: WhatsAppAccount[]) => void;
  addAccount: (account: WhatsAppAccount) => void;
  updateAccountStatus: (accountId: string, status: WhatsAppConnectionStatus) => void;
  removeAccount: (accountId: string) => void;
  setQrCode: (qrCode: string | null) => void;

  // Chat actions
  setChats: (chats: WhatsAppChat[]) => void;
  addChat: (chat: WhatsAppChat) => void;
  updateChat: (chatId: string, updates: Partial<WhatsAppChat>) => void;
  setActiveChat: (chatId: string | null) => void;
  setActiveAccount: (accountId: string | null) => void;
  pinChat: (chatId: string, pinned: boolean) => void;
  muteChat: (chatId: string, muted: boolean) => void;
  archiveChat: (chatId: string, archived: boolean) => void;
  markChatAsRead: (chatId: string) => void;
  setSearchQuery: (query: string) => void;

  // Message actions
  setMessages: (chatId: string, messages: WhatsAppMessage[]) => void;
  addMessage: (chatId: string, message: WhatsAppMessage) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<WhatsAppMessage>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  setReplyToMessage: (message: WhatsAppMessage | null) => void;

  // Reply tracking
  startReplying: (chatId: string, userId: string, userName: string) => void;
  stopReplying: (chatId: string) => void;

  // Media
  setMediaPreview: (media: { file: File; type: WhatsAppMessageType; previewUrl: string } | null) => void;

  // Notifications
  addNotification: (notification: WhatsAppNotification) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  playNotificationSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setComposing: (composing: boolean) => void;
  reset: () => void;

  // Server-specific actions
  setActiveServer: (serverId: number) => void;
  setActiveServerQR: (serverId: number, qrCode: string | null) => void;
  setServerStatuses: (statuses: Record<number, ServerStatus>) => void;
  setServerChats: (serverId: number, chats: WhatsAppChat[]) => void;
  getServerName: (serverId: number) => string;

  // Computed
  getFilteredChats: () => WhatsAppChat[];
  getActiveChatMessages: () => WhatsAppMessage[];
  getActiveAccountChats: () => WhatsAppChat[];
}

const initialState = {
  accounts: [],
  chats: [],
  messages: {},
  activeChat: null,
  activeAccount: null,
  activeServer: 1,
  qrCode: null,
  serverQRCodes: { 1: null, 2: null },
  serverStatuses: {
    1: { status: 'disconnected' as WhatsAppConnectionStatus, account: null },
    2: { status: 'disconnected' as WhatsAppConnectionStatus, account: null },
  },
  serverChats: { 1: [], 2: [] },
  searchQuery: '',
  notifications: [],
  unreadTotal: 0,
  isLoading: false,
  error: null,
  isComposing: false,
  mediaPreview: null,
  replyToMessage: null,
  soundEnabled: true,
};

export const useWhatsAppStore = create<WhatsAppStore>((set, get) => ({
  ...initialState,

  // Account actions
  setAccounts: (accounts) => set({ accounts }),

  addAccount: (account) => set((state) => ({
    accounts: [...state.accounts, account],
  })),

  updateAccountStatus: (accountId, status) => set((state) => ({
    accounts: state.accounts.map((acc) =>
      acc.id === accountId ? { ...acc, status } : acc
    ),
  })),

  removeAccount: (accountId) => set((state) => ({
    accounts: state.accounts.filter((acc) => acc.id !== accountId),
    chats: state.chats.filter((chat) => chat.accountId !== accountId),
  })),

  setQrCode: (qrCode) => set({ qrCode }),

  // Chat actions
  setChats: (chats) => {
    const unreadTotal = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
    set({ chats, unreadTotal });
  },

  addChat: (chat) => set((state) => ({
    chats: [chat, ...state.chats],
    unreadTotal: state.unreadTotal + chat.unreadCount,
  })),

  updateChat: (chatId, updates) => set((state) => {
    const oldChat = state.chats.find((c) => c.id === chatId);
    const unreadDiff = (updates.unreadCount ?? oldChat?.unreadCount ?? 0) - (oldChat?.unreadCount ?? 0);

    return {
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      ),
      unreadTotal: state.unreadTotal + unreadDiff,
    };
  }),

  setActiveChat: (chatId) => {
    set({ activeChat: chatId });
    if (chatId) {
      get().markChatAsRead(chatId);
    }
  },

  setActiveAccount: (accountId) => set({ activeAccount: accountId }),

  pinChat: (chatId, pinned) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, isPinned: pinned } : chat
    ),
  })),

  muteChat: (chatId, muted) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, isMuted: muted } : chat
    ),
  })),

  archiveChat: (chatId, archived) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, isArchived: archived } : chat
    ),
  })),

  markChatAsRead: (chatId) => set((state) => {
    // Find chat in serverChats (primary) or legacy chats
    let unreadToSubtract = 0;

    // Update serverChats for all servers
    const updatedServerChats = { ...state.serverChats };
    for (const serverId of Object.keys(updatedServerChats)) {
      const serverChatList = updatedServerChats[Number(serverId)] || [];
      const chatIndex = serverChatList.findIndex((c) => c.id === chatId);
      if (chatIndex !== -1 && serverChatList[chatIndex].unreadCount > 0) {
        unreadToSubtract = serverChatList[chatIndex].unreadCount;
        updatedServerChats[Number(serverId)] = serverChatList.map((c) =>
          c.id === chatId ? { ...c, unreadCount: 0 } : c
        );
        break;
      }
    }

    // Also update legacy chats array
    const chat = state.chats.find((c) => c.id === chatId);
    if (chat && chat.unreadCount > 0 && unreadToSubtract === 0) {
      unreadToSubtract = chat.unreadCount;
    }

    if (unreadToSubtract === 0) return state;

    return {
      serverChats: updatedServerChats,
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
      unreadTotal: Math.max(0, state.unreadTotal - unreadToSubtract),
    };
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Message actions
  setMessages: (chatId, messages) => set((state) => ({
    messages: { ...state.messages, [chatId]: messages },
  })),

  addMessage: (chatId, message) => set((state) => {
    const chatMessages = state.messages[chatId] || [];

    // Determine which server this message belongs to based on accountId
    const serverId = message.accountId?.includes('server_')
      ? parseInt(message.accountId.replace('server_', ''))
      : state.activeServer;

    // Update serverChats (this is what the UI displays)
    const updatedServerChats = { ...state.serverChats };
    const serverChatList = [...(updatedServerChats[serverId] || [])];
    let chatFound = false;

    for (let i = 0; i < serverChatList.length; i++) {
      if (serverChatList[i].id === chatId) {
        chatFound = true;
        const isActiveChat = state.activeChat === chatId;
        serverChatList[i] = {
          ...serverChatList[i],
          lastMessage: message,
          unreadCount: message.fromMe || isActiveChat
            ? serverChatList[i].unreadCount
            : serverChatList[i].unreadCount + 1,
        };
        break;
      }
    }

    // If chat not found in serverChats, create a new chat entry
    if (!chatFound) {
      const phoneNumber = chatId.split('@')[0];
      const isGroup = chatId.endsWith('@g.us');
      serverChatList.unshift({
        id: chatId,
        accountId: message.accountId || `server_${serverId}`,
        contact: {
          id: chatId,
          phoneNumber,
          name: message.senderName || phoneNumber,
          isGroup,
          isBlocked: false,
        },
        type: isGroup ? 'group' : 'individual',
        lastMessage: message,
        unreadCount: message.fromMe ? 0 : 1,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      });
    }

    // Sort chats by pinned first, then by last message time
    serverChatList.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.timestamp || '';
      const bTime = b.lastMessage?.timestamp || '';
      return bTime.localeCompare(aTime);
    });

    updatedServerChats[serverId] = serverChatList;

    // Also update the legacy chats array for backward compatibility
    const updatedChats = state.chats.map((chat) => {
      if (chat.id === chatId) {
        const isActiveChat = state.activeChat === chatId;
        return {
          ...chat,
          lastMessage: message,
          unreadCount: message.fromMe || isActiveChat ? chat.unreadCount : chat.unreadCount + 1,
        };
      }
      return chat;
    });

    // Sort chats by last message time
    updatedChats.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.timestamp || '';
      const bTime = b.lastMessage?.timestamp || '';
      return bTime.localeCompare(aTime);
    });

    const newUnreadTotal = updatedChats.reduce((sum, chat) => sum + chat.unreadCount, 0);

    return {
      messages: {
        ...state.messages,
        [chatId]: [...chatMessages, message],
      },
      serverChats: updatedServerChats,
      chats: updatedChats,
      unreadTotal: newUnreadTotal,
    };
  }),

  updateMessage: (chatId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    },
  })),

  deleteMessage: (chatId, messageId) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).filter((msg) => msg.id !== messageId),
    },
  })),

  setReplyToMessage: (message) => set({ replyToMessage: message }),

  // Reply tracking - prevents multiple agents replying at once
  startReplying: (chatId, userId, userName) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            activeReplyBy: userId,
            activeReplyByName: userName,
            activeReplyAt: new Date().toISOString(),
          }
        : chat
    ),
  })),

  stopReplying: (chatId) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            activeReplyBy: undefined,
            activeReplyByName: undefined,
            activeReplyAt: undefined,
          }
        : chat
    ),
  })),

  // Media
  setMediaPreview: (media) => set({ mediaPreview: media }),

  // Notifications
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
    }));

    // Play sound if enabled and chat is not active
    const state = get();
    if (state.soundEnabled && state.activeChat !== notification.chatId) {
      get().playNotificationSound();
    }
  },

  markNotificationRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ),
  })),

  clearNotifications: () => set({ notifications: [] }),

  playNotificationSound: () => {
    try {
      const audio = new Audio(WHATSAPP_NOTIFICATION_SOUND);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Silently fail if autoplay is blocked
      });
    } catch {
      // Audio not supported
    }
  },

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  // Utility
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setComposing: (composing) => set({ isComposing: composing }),

  reset: () => set(initialState),

  // Server-specific actions
  setActiveServer: (serverId) => set({ activeServer: serverId }),

  setActiveServerQR: (serverId, qrCode) => set((state) => ({
    serverQRCodes: { ...state.serverQRCodes, [serverId]: qrCode },
    qrCode: state.activeServer === serverId ? qrCode : state.qrCode,
  })),

  setServerStatuses: (statuses) => set({ serverStatuses: statuses }),

  setServerChats: (serverId, chats) => set((state) => {
    const updatedServerChats = { ...state.serverChats, [serverId]: chats };

    // Calculate total unread from all server chats
    let totalUnread = 0;
    for (const serverChatList of Object.values(updatedServerChats)) {
      for (const chat of serverChatList as any[]) {
        totalUnread += chat.unreadCount || 0;
      }
    }

    return {
      serverChats: updatedServerChats,
      unreadTotal: totalUnread,
    };
  }),

  getServerName: (serverId) => {
    const state = get();
    const serverStatus = state.serverStatuses[serverId];
    if (serverStatus?.account?.name) {
      return serverStatus.account.name;
    }
    return `WhatsApp ${serverId}`;
  },

  // Computed getters
  getFilteredChats: () => {
    const state = get();
    const query = state.searchQuery.toLowerCase();

    let filtered = state.chats.filter((chat) => !chat.isArchived);

    if (state.activeAccount) {
      filtered = filtered.filter((chat) => chat.accountId === state.activeAccount);
    }

    if (query) {
      filtered = filtered.filter(
        (chat) =>
          chat.contact.name.toLowerCase().includes(query) ||
          chat.contact.phoneNumber.includes(query) ||
          chat.lastMessage?.body.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.timestamp || '';
      const bTime = b.lastMessage?.timestamp || '';
      return bTime.localeCompare(aTime);
    });
  },

  getActiveChatMessages: () => {
    const state = get();
    if (!state.activeChat) return [];
    return state.messages[state.activeChat] || [];
  },

  getActiveAccountChats: () => {
    const state = get();
    if (!state.activeAccount) return state.chats;
    return state.chats.filter((chat) => chat.accountId === state.activeAccount);
  },
}));
