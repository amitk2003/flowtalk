import { API } from "@/lib/axios";

export const fetchMessages = async (room: string) =>
  API.get(`/messages/${room}`);
