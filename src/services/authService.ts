import api from "./api";
import type { AuthResponse, AuthUser } from "@/types";

export const authService = {
  async login(username: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/login", { username, password });
    return data;
  },

  async me() {
    const { data } = await api.get<AuthUser>("/auth/me");
    return data;
  },
};
