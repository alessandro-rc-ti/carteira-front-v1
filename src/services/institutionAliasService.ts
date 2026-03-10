import api from "./api";
import type {
  InstitutionAliasRequest,
  InstitutionAliasResponse,
} from "@/types/institutionAlias";

export const institutionAliasService = {
  async list(): Promise<InstitutionAliasResponse[]> {
    const { data } = await api.get<InstitutionAliasResponse[]>("/institution-aliases");
    return data;
  },

  async getById(id: string): Promise<InstitutionAliasResponse> {
    const { data } = await api.get<InstitutionAliasResponse>(`/institution-aliases/${id}`);
    return data;
  },

  async create(request: InstitutionAliasRequest): Promise<InstitutionAliasResponse> {
    const { data } = await api.post<InstitutionAliasResponse>("/institution-aliases", request);
    return data;
  },

  async update(id: string, request: InstitutionAliasRequest): Promise<InstitutionAliasResponse> {
    const { data } = await api.put<InstitutionAliasResponse>(`/institution-aliases/${id}`, request);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/institution-aliases/${id}`);
  },
};
