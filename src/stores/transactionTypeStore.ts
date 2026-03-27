import { create } from "zustand";

import { transactionTypeService, type TransactionTypeDefinitionPayload } from "@/services/transactionTypeService";
import type { TransactionTypeDefinition } from "@/types/transaction";

interface TransactionTypeState {
  items: TransactionTypeDefinition[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchAll: (force?: boolean) => Promise<void>;
  createType: (payload: TransactionTypeDefinitionPayload) => Promise<TransactionTypeDefinition>;
  updateType: (id: string, payload: TransactionTypeDefinitionPayload) => Promise<TransactionTypeDefinition>;
  deleteType: (id: string) => Promise<void>;
}

export const useTransactionTypeStore = create<TransactionTypeState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,

  fetchAll: async (force = false) => {
    if (get().loaded && !force) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const items = await transactionTypeService.list();
      set({ items, loaded: true, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Falha ao carregar tipos de transação",
      });
      throw error;
    }
  },

  createType: async (payload) => {
    const created = await transactionTypeService.create(payload);
    set((state) => ({ items: [...state.items, created] }));
    return created;
  },

  updateType: async (id, payload) => {
    const updated = await transactionTypeService.update(id, payload);
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? updated : item)),
    }));
    return updated;
  },

  deleteType: async (id) => {
    await transactionTypeService.remove(id);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));