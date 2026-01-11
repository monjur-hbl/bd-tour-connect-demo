// Authentication Store using Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '../types';
import { DEMO_USERS } from '../data/demoData';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (phone: string, password: string): Promise<boolean> => {
        set({ isLoading: true });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const userData = DEMO_USERS[phone];

        if (userData && userData.password === password) {
          set({
            user: userData.user,
            isAuthenticated: true,
            isLoading: false
          });
          return true;
        }

        set({ isLoading: false });
        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user
        });
      }
    }),
    {
      name: 'bd-tour-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
