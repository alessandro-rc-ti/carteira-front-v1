import { create } from "zustand";
import { transactionQueryService } from "@/services/transactionService";
import type { Transaction } from "@/types/transaction";

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchByBank: (bankId: string) => Promise<void>;
  fetchAll: () => Promise<void>;
  createTransaction: (bankId: string, payload: Partial<Transaction>) => Promise<Transaction | null>;
  deleteByFile: (bankId: string, fileName: string) => Promise<number | null>;
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

  createTransaction: async (bankId: string, payload: Partial<Transaction>) => {
    set({ loading: true, error: null });
    try {
      const created = await transactionQueryService.create(bankId, payload);
      set((state) => ({ transactions: [created, ...state.transactions], loading: false }));
      return created;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao criar transação",
        loading: false,
      });
      return null;
    }
  },

  deleteByFile: async (bankId: string, fileName: string) => {
    set({ loading: true, error: null });
    try {
      const res = await transactionQueryService.deleteByFile(bankId, fileName);
      // remove transactions that have this fileName (if Transaction has fileName)
      set((state) => ({
        transactions: state.transactions.filter((t) => (t as any).fileName !== fileName),
        loading: false,
      }));
      return res?.deletedCount ?? 0;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao deletar por arquivo",
        loading: false,
      });
      return null;
    }
  },

  clear: () => set({ transactions: [], error: null }),
}));
