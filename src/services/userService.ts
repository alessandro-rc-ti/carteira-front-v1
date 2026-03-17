import api from "./api";
import type {
  AppUser,
  AppUserCreateRequest,
  AppUserManagementMetadata,
  AppUserUpdateRequest,
} from "@/types";

export const userService = {
  async list(): Promise<AppUser[]> {
    const { data } = await api.get<AppUser[]>("/users");
    return data;
  },

  async getById(id: string): Promise<AppUser> {
    const { data } = await api.get<AppUser>(`/users/${id}`);
    return data;
  },

  async getManagementMetadata(): Promise<AppUserManagementMetadata> {
    const { data } = await api.get<AppUserManagementMetadata>("/users/management-metadata");
    return data;
  },

  async create(payload: AppUserCreateRequest): Promise<AppUser> {
    const { data } = await api.post<AppUser>("/users", payload);
    return data;
  },

  async update(id: string, payload: AppUserUpdateRequest): Promise<AppUser> {
    const { data } = await api.put<AppUser>(`/users/${id}`, payload);
    return data;
  },

  async activate(id: string): Promise<AppUser> {
    const { data } = await api.post<AppUser>(`/users/${id}/activate`);
    return data;
  },

  async deactivate(id: string): Promise<AppUser> {
    const { data } = await api.post<AppUser>(`/users/${id}/deactivate`);
    return data;
  },
};