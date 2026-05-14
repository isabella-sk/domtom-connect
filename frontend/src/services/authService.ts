import api from "./api";
import type { RegisterData, LoginData, AuthResponse } from "../types/auth";

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register", data);
    return res.data;
  },
  login: async (data: LoginData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", data);
    return res.data;
  },
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};
