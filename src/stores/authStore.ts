import { create } from "zustand";

import { authService } from "@/services/authService";
import { getStoredToken, setStoredToken } from "@/lib/authSession";
import type { AuthUser } from "@/types";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  hasPermission: (permission?: string | string[]) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getStoredToken(),
  loading: false,
  initialized: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const auth = await authService.login(username, password);
      setStoredToken(auth.token);
      const user = await authService.me();
      set({ user, token: auth.token, loading: false, initialized: true });
    } catch (error) {
      setStoredToken(null);
      set({ user: null, token: null, loading: false, initialized: true });
      throw error;
    }
  },

  logout: () => {
    setStoredToken(null);
    set({ user: null, token: null, loading: false, initialized: true });
  },

  restoreSession: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ user: null, token: null, loading: false, initialized: true });
      return;
    }

    set({ loading: true, token });
    try {
      const user = await authService.me();
      set({ user, token, loading: false, initialized: true });
    } catch {
      setStoredToken(null);
      set({ user: null, token: null, loading: false, initialized: true });
    }
  },

  hasPermission: (permission) => {
    const user = get().user;
    if (!user) {
      return false;
    }
    if (!permission) {
      return true;
    }
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some((item) => user.permissions.includes(item));
  },
}));
