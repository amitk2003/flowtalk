import { API } from "@/lib/axios";

export const searchUsers = async (q: string) =>
  API.get<{ success: boolean; data: any[] }>(`/rooms/users?q=${encodeURIComponent(q)}`);
