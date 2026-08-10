import { API } from "@/lib/axios";

export const login = async (email: string, password: string) =>
  API.post("/auth/login", { email, password });

export const register = async (name: string, email: string, password: string) =>
  API.post("/auth/register", { name, email, password });

export const logout = async (refreshToken: string) =>
  API.post("/auth/logout", { refreshToken });
