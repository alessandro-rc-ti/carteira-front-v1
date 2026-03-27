import api from "./api";
import type { TransactionTypeDefinition } from "@/types/transaction";

export interface TransactionTypeDefinitionPayload {
  code?: string | null;
  name: string;
  description?: string | null;
  baseType: string;
  affectsInflation: boolean;
  active?: boolean;
}

export const transactionTypeService = {
  async list(): Promise<TransactionTypeDefinition[]> {
    const { data } = await api.get<TransactionTypeDefinition[]>('/transaction-types');
    return data;
  },

  async create(payload: TransactionTypeDefinitionPayload): Promise<TransactionTypeDefinition> {
    const { data } = await api.post<TransactionTypeDefinition>('/transaction-types', payload);
    return data;
  },

  async update(id: string, payload: TransactionTypeDefinitionPayload): Promise<TransactionTypeDefinition> {
    const { data } = await api.put<TransactionTypeDefinition>(`/transaction-types/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/transaction-types/${id}`);
  },
};