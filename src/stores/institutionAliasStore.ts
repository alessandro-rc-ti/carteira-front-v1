import { create } from "zustand";
import { institutionAliasService } from "@/services/institutionAliasService";
import type {
  InstitutionAliasRequest,
  InstitutionAliasResponse,
} from "@/types/institutionAlias";

interface InstitutionAliasState {
  aliases: InstitutionAliasResponse[];
  loading: boolean;
  error: string | null;

  fetchAliases: () => Promise<void>;
  createAlias: (request: InstitutionAliasRequest) => Promise<InstitutionAliasResponse>;
  updateAlias: (id: string, request: InstitutionAliasRequest) => Promise<InstitutionAliasResponse>;
  deleteAlias: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useInstitutionAliasStore = create<InstitutionAliasState>((set) => ({
  aliases: [],
  loading: false,
  error: null,

  fetchAliases: async () => {
    set({ loading: true, error: null });
    try {
      const aliases = await institutionAliasService.list();
      set({ aliases, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao buscar aliases",
        loading: false,
      });
    }
  },

  createAlias: async (request: InstitutionAliasRequest) => {
    set({ loading: true, error: null });
    try {
      const created = await institutionAliasService.create(request);
      set((state) => ({
        aliases: [...state.aliases, created],
        loading: false,
      }));
      return created;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao criar alias",
        loading: false,
      });
      throw err;
    }
  },

  updateAlias: async (id: string, request: InstitutionAliasRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = await institutionAliasService.update(id, request);
      set((state) => ({
        aliases: state.aliases.map((a) => (a.id === id ? updated : a)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao atualizar alias",
        loading: false,
      });
      throw err;
    }
  },

  deleteAlias: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await institutionAliasService.remove(id);
      set((state) => ({
        aliases: state.aliases.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Falha ao excluir alias",
        loading: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
