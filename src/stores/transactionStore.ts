import { create } from "zustand";
import { showSuccess, showError } from "@/lib/toast";
import { transactionQueryService } from "@/services/transactionService";
import type { Transaction } from "@/types/transaction";

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchByBank: (bankId: string) => Promise<void>;
  fetchAll: () => Promise<void>;
  createTransaction: (bankId: string, payload: Partial<Transaction>) => Promise<Transaction | null>;
  updateTransaction: (id: string | number, payload: Partial<Transaction>) => Promise<Transaction | null>;
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

  updateTransaction: async (id: string | number, payload: Partial<Transaction>) => {
    set({ loading: true, error: null });
    try {
      const updated = await transactionQueryService.update(id, payload);
      set((state) => ({
        transactions: state.transactions.map((t) => (String((t as any).id) === String(id) ? updated : t)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao atualizar transação",
        loading: false,
      });
      return null;
    }
  },

  deleteAll: async (bankId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await transactionQueryService.deleteAll(bankId);
      set({ transactions: [], loading: false });
      showSuccess(`${res?.deletedCount ?? 0} transação(ões) deletada(s)`);
      return res?.deletedCount ?? 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao deletar transações";
      set({
        error: message,
        loading: false,
      });
      showError(message);
      return null;
    }
  },

  deleteByFile: async (bankId: string, fileName: string) => {
    set({ loading: true, error: null });
    try {
      const res = await transactionQueryService.deleteByFile(bankId, fileName);
      // remove transactions that have this fileName (if Transaction has fileName)
      set((state) => ({
        transactions: state.transactions.filter((t) => ((t as any).importFileName ?? (t as any).origin) !== fileName),
        loading: false,
      }));
      showSuccess(`${res?.deletedCount ?? 0} transação(ões) deletada(s)`);
      return res?.deletedCount ?? 0;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao deletar por arquivo",
        loading: false,
      });
      showError(err instanceof Error ? err.message : "Falha ao deletar por arquivo");
      return null;
    }
  },

  deleteTransaction: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await transactionQueryService.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => String(t.id) !== String(id)),
        loading: false,
      }));
      showSuccess("Transação removida com sucesso");
      return true;
    } catch (err) {
      // Try to extract backend message from axios error
      const anyErr: any = err;
      const backendMessage = anyErr?.response?.data?.message || anyErr?.response?.data || anyErr?.message;
      const message = typeof backendMessage === "string" ? backendMessage : JSON.stringify(backendMessage);
      // Log full error to console for easier diagnosis (status + body)
      console.error("deleteTransaction error:", anyErr?.response?.status, anyErr?.response?.data ?? anyErr);
      set({ error: message, loading: false });
      showError(message || "Falha ao deletar transação");
      return false;
    }
  },

  clear: () => set({ transactions: [], error: null }),
}));
