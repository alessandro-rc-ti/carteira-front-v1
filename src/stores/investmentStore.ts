import { create } from "zustand";
import { investmentService } from "@/services/investmentService";
import type { InvestmentResponse, InvestmentRequest } from "@/types";

interface InvestmentState {
  investments: InvestmentResponse[];
  selectedInvestment: InvestmentResponse | null;
  loading: boolean;
  error: string | null;

  fetchInvestments: () => Promise<void>;
  fetchInvestmentById: (id: string) => Promise<void>;
  createInvestment: (inv: InvestmentRequest) => Promise<InvestmentResponse>;
  updateInvestment: (id: string, inv: InvestmentRequest) => Promise<InvestmentResponse>;
  deleteInvestment: (id: string) => Promise<void>;
  clearSelectedInvestment: () => void;
  clearError: () => void;
}

export const useInvestmentStore = create<InvestmentState>((set) => ({
  investments: [],
  selectedInvestment: null,
  loading: false,
  error: null,

  fetchInvestments: async () => {
    set({ loading: true, error: null });
    try {
      const investments = await investmentService.list();
      set({ investments, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao buscar investimentos",
        loading: false,
      });
    }
  },

  fetchInvestmentById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const inv = await investmentService.getById(id);
      set({ selectedInvestment: inv, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao buscar investimento",
        loading: false,
      });
    }
  },

  createInvestment: async (inv: InvestmentRequest) => {
    set({ loading: true, error: null });
    try {
      const created = await investmentService.create(inv);
      set((state) => ({
        investments: [...state.investments, created],
        loading: false,
      }));
      return created;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao criar investimento",
        loading: false,
      });
      throw err;
    }
  },

  updateInvestment: async (id: string, inv: InvestmentRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = await investmentService.update(id, inv);
      set((state) => ({
        investments: state.investments.map((i) => (i.id === id ? updated : i)),
        selectedInvestment:
          state.selectedInvestment?.id === id ? updated : state.selectedInvestment,
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao atualizar investimento",
        loading: false,
      });
      throw err;
    }
  },

  deleteInvestment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await investmentService.remove(id);
      set((state) => ({
        investments: state.investments.filter((i) => i.id !== id),
        selectedInvestment:
          state.selectedInvestment?.id === id ? null : state.selectedInvestment,
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao excluir investimento",
        loading: false,
      });
      throw err;
    }
  },

  clearSelectedInvestment: () => set({ selectedInvestment: null }),
  clearError: () => set({ error: null }),
}));
