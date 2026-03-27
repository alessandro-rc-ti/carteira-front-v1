import api from "./api";
import type { BankDashboardInflationResponse } from "@/types/bankDashboard";

export const bankDashboardService = {
  async getInflationDashboard(
    year: string,
    month: string
  ): Promise<BankDashboardInflationResponse> {
    const { data } = await api.get<BankDashboardInflationResponse>(
      "/banks/dashboard/inflation",
      {
        params: {
          year,
          month,
        },
      }
    );
    return data;
  },
};