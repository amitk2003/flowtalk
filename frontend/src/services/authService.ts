import { API } from "@/lib/axios";

export const login = async (email: string, password: string) =>
  API.post("/auth/login", { email, password });

export const register = async (name: string, email: string, password: string) =>
  API.post("/auth/register", { name, email, password });
