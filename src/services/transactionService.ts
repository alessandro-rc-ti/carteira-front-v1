import api from "./api";
import type { Transaction } from "@/types/transaction";

export const transactionQueryService = {
  async listByBank(bankId: string): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>(`/transactions/bank/${bankId}`);
    return data;
  },

  async listAll(): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>("/transactions");
    return data;
  },

  async create(bankId: string, payload: Partial<Transaction>): Promise<Transaction> {
    const { data } = await api.post<Transaction>(`/transactions/${bankId}`, payload);
    return data;
  },

  async deleteByFile(bankId: string, fileName: string): Promise<{ deletedCount: number }>
  {
    const { data } = await api.delete(`/transactions/${bankId}/by-file`, { params: { fileName } });
    return data;
  },
};
