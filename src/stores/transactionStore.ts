import { create } from "zustand";
import { transactionQueryService } from "@/services/transactionService";
import type { Transaction } from "@/types/transaction";

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchByBank: (bankId: string) => Promise<void>;
  fetchAll: () => Promise<void>;
  clear: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchByBank: async (bankId: string) => {
    set({ loading: true, error: null });
    try {
      const transactions = await transactionQueryService.listByBank(bankId);
      set({ transactions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao buscar transações",
        loading: false,
      });
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const transactions = await transactionQueryService.listAll();
      set({ transactions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao buscar transações",
        loading: false,
      });
    }
  },

  clear: () => set({ transactions: [], error: null }),
}));
