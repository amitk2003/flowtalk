import { API } from "@/lib/axios";

export const getMyRooms = async () =>
  API.get("/rooms/my-rooms");

export const createPrivateRoom = async (otherUserId: string) =>
  API.post("/rooms/private", { otherUserId });
