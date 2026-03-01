import api from "./api";
import type {
  BankRequest,
  BankResponse,
  CsvAnalysisResponse,
  CsvImportResponse,
  ManualMapping,
} from "@/types";

// ===== Bank CRUD =====

export const bankService = {
  async list(): Promise<BankResponse[]> {
    const { data } = await api.get<BankResponse[]>("/banks");
    return data;
  },

  async getById(id: string): Promise<BankResponse> {
    const { data } = await api.get<BankResponse>(`/banks/${id}`);
    return data;
  },

  async create(bank: BankRequest): Promise<BankResponse> {
    const { data } = await api.post<BankResponse>("/banks", bank);
    return data;
  },

  async update(id: string, bank: BankRequest): Promise<BankResponse> {
    const { data } = await api.put<BankResponse>(`/banks/${id}`, bank);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/banks/${id}`);
  },
};

// ===== CSV Import =====

export const transactionService = {
  async analyzeCsv(bankId: string, file: File): Promise<CsvAnalysisResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<CsvAnalysisResponse>(
      `/transactions/${bankId}/analyze-csv`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  async importCsv(
    bankId: string,
    file: File,
    mappings?: ManualMapping[]
  ): Promise<CsvImportResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (mappings && mappings.length > 0) {
      formData.append(
        "mappings",
        new Blob([JSON.stringify(mappings)], { type: "application/json" })
      );
    }
    const { data } = await api.post<CsvImportResponse>(
      `/transactions/${bankId}/import-csv`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },
};
