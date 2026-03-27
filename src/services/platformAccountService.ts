import api from "./api";
import type {
  PlatformAccount,
  PlatformAccountProvisionRequest,
  PlatformAccountUpdateRequest,
} from "@/types";

export const platformAccountService = {
  async list(): Promise<PlatformAccount[]> {
    const { data } = await api.get<PlatformAccount[]>("/platform/accounts");
    return data;
  },

  async getById(id: string): Promise<PlatformAccount> {
    const { data } = await api.get<PlatformAccount>(`/platform/accounts/${id}`);
    return data;
  },

  async provision(payload: PlatformAccountProvisionRequest): Promise<PlatformAccount> {
    const { data } = await api.post<PlatformAccount>("/platform/accounts", payload);
    return data;
  },

  async update(
    id: string,
    payload: PlatformAccountUpdateRequest
  ): Promise<PlatformAccount> {
    const { data } = await api.put<PlatformAccount>(`/platform/accounts/${id}`, payload);
    return data;
  },
};
