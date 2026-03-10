import api from "./api";
import type { InvestmentRequest, InvestmentResponse, B3AnalysisResponse, B3ImportResponse, InstitutionMapping } from "@/types";

export const investmentService = {
  async list(): Promise<InvestmentResponse[]> {
    const { data } = await api.get<InvestmentResponse[]>("/investments");
    return data;
  },

  async getById(id: string): Promise<InvestmentResponse> {
    const { data } = await api.get<InvestmentResponse>(`/investments/${id}`);
    return data;
  },

  async create(investment: InvestmentRequest): Promise<InvestmentResponse> {
    const { data } = await api.post<InvestmentResponse>("/investments", investment);
    return data;
  },

  async update(id: string, investment: InvestmentRequest): Promise<InvestmentResponse> {
    const { data } = await api.put<InvestmentResponse>(`/investments/${id}`, investment);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/investments/${id}`);
  },

  async analyzeB3(file: File): Promise<B3AnalysisResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<B3AnalysisResponse>("/investments/analyze-b3", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async importB3(file: File, mappings?: InstitutionMapping[]): Promise<B3ImportResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (mappings && mappings.length > 0) {
      formData.append(
        "mappings",
        new Blob([JSON.stringify(mappings)], { type: "application/json" })
      );
    }
    const { data } = await api.post<B3ImportResponse>("/investments/import-b3", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

    async deleteAllInvestmentsAndAliases(): Promise<void> {
      await api.delete("/investments/delete-all-investments-and-aliases");
    },

    async deleteAllInvestments(): Promise<void> {
      await api.delete("/investments/delete-all-investments");
    },

    async deleteInvestmentsByFile(fileName: string): Promise<void> {
      await api.delete(`/investments/delete-investments-by-file?fileName=${encodeURIComponent(fileName)}`);
    },
};
