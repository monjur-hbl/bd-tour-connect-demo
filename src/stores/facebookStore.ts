import { create } from 'zustand';
import {
  FacebookPage,
  FacebookPageConversation,
  FacebookPageMessage,
  FacebookMessengerAccount,
  FacebookMessengerConversation,
  FacebookMessengerMessage,
  FacebookConnectionStatus,
} from '../types';

interface FacebookStore {
  // Messenger State
  messengerAccounts: FacebookMessengerAccount[];
  messengerConversations: FacebookMessengerConversation[];
  messengerMessages: Record<string, FacebookMessengerMessage[]>;
  activeMessengerAccount: string | null;
  activeMessengerConversation: string | null;
  messengerStatus: FacebookConnectionStatus;

  // Page State
  pages: FacebookPage[];
  pageConversations: Record<string, FacebookPageConversation[]>; // pageId -> conversations
  pageMessages: Record<string, FacebookPageMessage[]>; // conversationId -> messages
  activePage: string | null;
  activePageConversation: string | null;

  // Common State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // Messenger Actions
  setMessengerAccounts: (accounts: FacebookMessengerAccount[]) => void;
  addMessengerAccount: (account: FacebookMessengerAccount) => void;
  removeMessengerAccount: (accountId: string) => void;
  setMessengerConversations: (conversations: FacebookMessengerConversation[]) => void;
  setActiveMessengerAccount: (accountId: string | null) => void;
  setActiveMessengerConversation: (conversationId: string | null) => void;
  addMessengerMessage: (conversationId: string, message: FacebookMessengerMessage) => void;
  setMessengerStatus: (status: FacebookConnectionStatus) => void;

  // Page Actions
  setPages: (pages: FacebookPage[]) => void;
  addPage: (page: FacebookPage) => void;
  removePage: (pageId: string) => void;
  updatePageStatus: (pageId: string, status: FacebookConnectionStatus) => void;
  setPageConversations: (pageId: string, conversations: FacebookPageConversation[]) => void;
  setActivePage: (pageId: string | null) => void;
  setActivePageConversation: (conversationId: string | null) => void;
  addPageMessage: (conversationId: string, message: FacebookPageMessage) => void;

  // Common Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;

  // Computed
  getMessengerUnreadCount: () => number;
  getPageUnreadCount: (pageId?: string) => number;
  getTotalUnreadCount: () => number;
}

const initialState = {
  // Messenger
  messengerAccounts: [],
  messengerConversations: [],
  messengerMessages: {},
  activeMessengerAccount: null,
  activeMessengerConversation: null,
  messengerStatus: 'disconnected' as FacebookConnectionStatus,

  // Pages
  pages: [],
  pageConversations: {},
  pageMessages: {},
  activePage: null,
  activePageConversation: null,

  // Common
  isLoading: false,
  error: null,
  searchQuery: '',
};

export const useFacebookStore = create<FacebookStore>((set, get) => ({
  ...initialState,

  // Messenger Actions
  setMessengerAccounts: (accounts) => set({ messengerAccounts: accounts }),

  addMessengerAccount: (account) => set((state) => ({
    messengerAccounts: [...state.messengerAccounts, account],
  })),

  removeMessengerAccount: (accountId) => set((state) => ({
    messengerAccounts: state.messengerAccounts.filter((a) => a.id !== accountId),
    messengerConversations: state.messengerConversations.filter((c) => c.accountId !== accountId),
  })),

  setMessengerConversations: (conversations) => set({ messengerConversations: conversations }),

  setActiveMessengerAccount: (accountId) => set({ activeMessengerAccount: accountId }),

  setActiveMessengerConversation: (conversationId) => set({ activeMessengerConversation: conversationId }),

  addMessengerMessage: (conversationId, message) => set((state) => {
    const messages = state.messengerMessages[conversationId] || [];
    return {
      messengerMessages: {
        ...state.messengerMessages,
        [conversationId]: [...messages, message],
      },
    };
  }),

  setMessengerStatus: (status) => set({ messengerStatus: status }),

  // Page Actions
  setPages: (pages) => set({ pages }),

  addPage: (page) => set((state) => ({
    pages: [...state.pages, page],
  })),

  removePage: (pageId) => set((state) => ({
    pages: state.pages.filter((p) => p.id !== pageId),
    pageConversations: Object.fromEntries(
      Object.entries(state.pageConversations).filter(([key]) => key !== pageId)
    ),
  })),

  updatePageStatus: (pageId, status) => set((state) => ({
    pages: state.pages.map((p) =>
      p.id === pageId ? { ...p, status } : p
    ),
  })),

  setPageConversations: (pageId, conversations) => set((state) => ({
    pageConversations: {
      ...state.pageConversations,
      [pageId]: conversations,
    },
  })),

  setActivePage: (pageId) => set({ activePage: pageId }),

  setActivePageConversation: (conversationId) => set({ activePageConversation: conversationId }),

  addPageMessage: (conversationId, message) => set((state) => {
    const messages = state.pageMessages[conversationId] || [];
    return {
      pageMessages: {
        ...state.pageMessages,
        [conversationId]: [...messages, message],
      },
    };
  }),

  // Common Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  reset: () => set(initialState),

  // Computed
  getMessengerUnreadCount: () => {
    const state = get();
    return state.messengerConversations.reduce((sum, c) => sum + c.unreadCount, 0);
  },

  getPageUnreadCount: (pageId) => {
    const state = get();
    if (pageId) {
      const conversations = state.pageConversations[pageId] || [];
      return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    }
    return Object.values(state.pageConversations)
      .flat()
      .reduce((sum, c) => sum + c.unreadCount, 0);
  },

  getTotalUnreadCount: () => {
    const state = get();
    return state.getMessengerUnreadCount() + state.getPageUnreadCount();
  },
}));
