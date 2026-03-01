import { create } from "zustand";
import { bankService } from "@/services";
import type { BankResponse, BankRequest } from "@/types";

interface BankState {
  banks: BankResponse[];
  selectedBank: BankResponse | null;
  loading: boolean;
  error: string | null;

  fetchBanks: () => Promise<void>;
  fetchBankById: (id: string) => Promise<void>;
  createBank: (bank: BankRequest) => Promise<BankResponse>;
  updateBank: (id: string, bank: BankRequest) => Promise<BankResponse>;
  deleteBank: (id: string) => Promise<void>;
  clearSelectedBank: () => void;
  clearError: () => void;
}

export const useBankStore = create<BankState>((set) => ({
  banks: [],
  selectedBank: null,
  loading: false,
  error: null,

  fetchBanks: async () => {
    set({ loading: true, error: null });
    try {
      const banks = await bankService.list();
      set({ banks, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao buscar bancos",
        loading: false,
      });
    }
  },

  fetchBankById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const bank = await bankService.getById(id);
      set({ selectedBank: bank, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao buscar banco",
        loading: false,
      });
    }
  },

  createBank: async (bank: BankRequest) => {
    set({ loading: true, error: null });
    try {
      const created = await bankService.create(bank);
      set((state) => ({
        banks: [...state.banks, created],
        loading: false,
      }));
      return created;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao criar banco",
        loading: false,
      });
      throw err;
    }
  },

  updateBank: async (id: string, bank: BankRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = await bankService.update(id, bank);
      set((state) => ({
        banks: state.banks.map((b) => (b.id === id ? updated : b)),
        selectedBank:
          state.selectedBank?.id === id ? updated : state.selectedBank,
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao atualizar banco",
        loading: false,
      });
      throw err;
    }
  },

  deleteBank: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await bankService.remove(id);
      set((state) => ({
        banks: state.banks.filter((b) => b.id !== id),
        selectedBank:
          state.selectedBank?.id === id ? null : state.selectedBank,
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao excluir banco",
        loading: false,
      });
      throw err;
    }
  },

  clearSelectedBank: () => set({ selectedBank: null }),
  clearError: () => set({ error: null }),
}));
