import { create } from 'zustand';
import { api } from '@/api/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  loadUser: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}

const storedAccessToken = localStorage.getItem('accessToken');
const storedRefreshToken = localStorage.getItem('refreshToken');

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  isAuthenticated: !!storedAccessToken,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/api/auth/login',
        { email, password }
      );
      get().setTokens(result.accessToken, result.refreshToken);
      set({ user: result.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/api/auth/register',
        { username, email, password }
      );
      get().setTokens(result.accessToken, result.refreshToken);
      set({ user: result.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  refreshAuth: async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      get().logout();
      return;
    }
    const result = await api.post<{ accessToken: string; refreshToken: string }>(
      '/api/auth/refresh',
      { refreshToken }
    );
    get().setTokens(result.accessToken, result.refreshToken);
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await api.get<User>('/api/auth/me');
      set({ user, isAuthenticated: true });
    } catch {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },
}));
