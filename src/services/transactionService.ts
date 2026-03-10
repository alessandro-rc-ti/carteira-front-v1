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
};
