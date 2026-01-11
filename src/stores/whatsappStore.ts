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

interface WhatsAppStore {
  // State
  accounts: WhatsAppAccount[];
  chats: WhatsAppChat[];
  messages: Record<string, WhatsAppMessage[]>;
  activeChat: string | null;
  activeAccount: string | null;
  qrCode: string | null;
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
  qrCode: null,
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
    const chat = state.chats.find((c) => c.id === chatId);
    if (!chat || chat.unreadCount === 0) return state;

    return {
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
      unreadTotal: state.unreadTotal - chat.unreadCount,
    };
  }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Message actions
  setMessages: (chatId, messages) => set((state) => ({
    messages: { ...state.messages, [chatId]: messages },
  })),

  addMessage: (chatId, message) => set((state) => {
    const chatMessages = state.messages[chatId] || [];
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
