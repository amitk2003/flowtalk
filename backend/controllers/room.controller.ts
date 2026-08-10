import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/pg";
import { Room } from "../models/Room";
import { User } from "../models/User";
import { In, Raw, ILike } from "typeorm";
import { asyncHandler } from "../middleware/errorHandler";

const roomRepo = () => AppDataSource.getRepository(Room);
const userRepo = () => AppDataSource.getRepository(User);

// ─── GET MY ROOMS ─────────────────────────────────────────────────────────
export const getMyRooms = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const rooms = await roomRepo().find({
    where: {
      members: Raw((alias) => `:userId = ANY(${alias})`, { userId }),
    },
    order: { lastMessageAt: "DESC", createdAt: "DESC" },
  });

  res.json({ success: true, data: rooms });
});

// ─── CREATE / FIND PRIVATE ROOM ───────────────────────────────────────────
export const createPrivateRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { otherUserId } = req.body;
  const userId = req.user!.id;

  if (otherUserId === userId) {
    return res.status(400).json({ success: false, message: "Cannot create a room with yourself" });
  }

  const otherUser = await userRepo().findOne({ where: { id: otherUserId } });
  if (!otherUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Try to find existing private room with exactly these two members
  let room = await roomRepo().findOne({
    where: {
      isPrivate: true,
      members: Raw(
        (alias) =>
          `array_length(${alias},1)=2 AND :u1 = ANY(${alias}) AND :u2 = ANY(${alias})`,
        { u1: userId, u2: otherUserId }
      ),
    },
  });

  if (!room) {
    room = roomRepo().create({
      isPrivate: true,
      members: [userId, otherUserId],
    });
    await roomRepo().save(room);
  }

  res.json({ success: true, data: room });
});

// ─── SEARCH USERS (for "New Chat") ────────────────────────────────────────
export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const q = (req.query.q as string || "").trim();

  if (q.length < 1) {
    return res.json({ success: true, data: [] });
  }

  const users = await userRepo().find({
    where: [
      { name: ILike(`%${q}%`) },
      { email: ILike(`%${q}%`) },
    ],
    select: ["id", "name", "email", "avatar", "isOnline", "lastSeen"],
    take: 20,
  });

  // Exclude the current user from results
  const filtered = users.filter((u) => u.id !== currentUserId);

  res.json({ success: true, data: filtered });
});
