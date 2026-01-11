// Authentication Store using Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '../types';
import { authAPI } from '../services/api';

interface Agency {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface AuthStore extends AuthState {
  agency: Agency | null;
  token: string | null;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      agency: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (phone: string, password: string): Promise<boolean> => {
        set({ isLoading: true });

        try {
          const data = await authAPI.login(phone, password);

          set({
            user: data.user,
            agency: data.agency,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });

          return true;
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            agency: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user
        });
      },

      checkAuth: async () => {
        const { token } = get();

        if (!token || !authAPI.isTokenValid()) {
          set({
            user: null,
            agency: null,
            token: null,
            isAuthenticated: false
          });
          return;
        }

        try {
          const data = await authAPI.getMe();
          set({
            user: data.user,
            agency: data.agency,
            isAuthenticated: true
          });
        } catch (error) {
          set({
            user: null,
            agency: null,
            token: null,
            isAuthenticated: false
          });
        }
      }
    }),
    {
      name: 'bd-tour-auth',
      partialize: (state) => ({
        user: state.user,
        agency: state.agency,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
