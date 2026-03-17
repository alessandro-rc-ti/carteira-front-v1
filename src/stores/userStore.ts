import { create } from "zustand";

import { userService } from "@/services";
import type {
  AppUser,
  AppUserCreateRequest,
  AppUserManagementMetadata,
  AppUserUpdateRequest,
} from "@/types";

interface UserState {
  users: AppUser[];
  metadata: AppUserManagementMetadata | null;
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchManagementMetadata: () => Promise<void>;
  createUser: (payload: AppUserCreateRequest) => Promise<AppUser>;
  updateUser: (id: string, payload: AppUserUpdateRequest) => Promise<AppUser>;
  setUserActive: (id: string, active: boolean) => Promise<AppUser>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  metadata: null,
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await userService.list();
      set({ users, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Falha ao buscar usuarios",
        loading: false,
      });
      throw error;
    }
  },

  fetchManagementMetadata: async () => {
    set({ loading: true, error: null });
    try {
      const metadata = await userService.getManagementMetadata();
      set({ metadata, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Falha ao buscar metadados de usuarios",
        loading: false,
      });
      throw error;
    }
  },

  createUser: async (payload) => {
    set({ loading: true, error: null });
    try {
      const created = await userService.create(payload);
      set((state) => ({
        users: [...state.users, created].sort((left, right) => left.username.localeCompare(right.username)),
        loading: false,
      }));
      return created;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Falha ao criar usuario",
        loading: false,
      });
      throw error;
    }
  },

  updateUser: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await userService.update(id, payload);
      set((state) => ({
        users: state.users
          .map((user) => (user.id === id ? updated : user))
          .sort((left, right) => left.username.localeCompare(right.username)),
        loading: false,
      }));
      return updated;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Falha ao atualizar usuario",
        loading: false,
      });
      throw error;
    }
  },

  setUserActive: async (id, active) => {
    set({ loading: true, error: null });
    try {
      const updated = active ? await userService.activate(id) : await userService.deactivate(id);
      set((state) => ({
        users: state.users
          .map((user) => (user.id === id ? updated : user))
          .sort((left, right) => left.username.localeCompare(right.username)),
        loading: false,
      }));
      return updated;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Falha ao atualizar status do usuario",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));