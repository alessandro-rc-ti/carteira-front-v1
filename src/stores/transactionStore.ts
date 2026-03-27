import { create } from "zustand";
import { isAxiosError } from "axios";
import { showSuccess, showError } from "@/lib/toast";
import { transactionQueryService } from "@/services/transactionService";
import type { Transaction, TransactionUpsertPayload } from "@/types/transaction";

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchByBank: (bankId: string, ruleId?: string | null) => Promise<void>;
  fetchAll: () => Promise<void>;
  createTransaction: (bankId: string, payload: TransactionUpsertPayload) => Promise<Transaction | null>;
  updateTransaction: (id: string | number, payload: TransactionUpsertPayload) => Promise<Transaction | null>;
  deleteByFile: (bankId: string, fileName: string) => Promise<number | null>;
  deleteAll: (bankId: string) => Promise<number | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  clear: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchByBank: async (bankId: string, ruleId?: string | null) => {
    set({ loading: true, error: null });
    try {
      const transactions = await transactionQueryService.listByBank(bankId, ruleId);
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

  createTransaction: async (bankId: string, payload: TransactionUpsertPayload) => {
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

  updateTransaction: async (id: string | number, payload: TransactionUpsertPayload) => {
    set({ loading: true, error: null });
    try {
      const updated = await transactionQueryService.update(id, payload);
      set((state) => ({
        transactions: state.transactions.map((t) => (String(t.id) === String(id) ? updated : t)),
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
        transactions: state.transactions.filter((t) => (t.importFileName ?? t.origin) !== fileName),
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
      const backendMessage = isAxiosError(err)
        ? err.response?.data && typeof err.response.data === "object" && err.response.data !== null && "message" in err.response.data
          ? String((err.response.data as { message: unknown }).message)
          : typeof err.response?.data === "string"
            ? err.response.data
            : err.message
        : err instanceof Error
          ? err.message
          : "Falha ao deletar transação";
      const message = typeof backendMessage === "string" ? backendMessage : JSON.stringify(backendMessage);
      if (isAxiosError(err)) {
        console.error("deleteTransaction error:", err.response?.status, err.response?.data ?? err.message);
      } else {
        console.error("deleteTransaction error:", err);
      }
      set({ error: message, loading: false });
      showError(message || "Falha ao deletar transação");
      return false;
    }
  },

  clear: () => set({ transactions: [], error: null }),
}));
