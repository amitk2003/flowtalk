import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/pg";
import { Message } from "../models/Message";
import { Room } from "../models/Room";
import { asyncHandler } from "../middleware/errorHandler";

// ─── GET MESSAGES FOR A ROOM ──────────────────────────────────────────────
export const getRoomMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user!.id;

  // Optional cursor-based pagination
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before as string | undefined;

  const roomRepo = AppDataSource.getRepository(Room);
  const messageRepo = AppDataSource.getRepository(Message);

  const room = await roomRepo.findOne({ where: { id: roomId } });
  if (!room || !room.members.includes(userId)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const qb = messageRepo
    .createQueryBuilder("msg")
    .where("msg.roomId = :roomId", { roomId })
    .orderBy("msg.createdAt", "DESC")
    .take(limit);

  if (before) {
    const anchor = await messageRepo.findOneBy({ id: before });
    if (anchor) {
      qb.andWhere("msg.createdAt < :anchorTime", { anchorTime: anchor.createdAt });
    }
  }

  const messages = await qb.getMany();

  res.json({ success: true, data: messages.reverse(), count: messages.length });
});
