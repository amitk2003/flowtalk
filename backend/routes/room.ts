import express, { Response } from "express";
import auth, { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/pg";
import { Room } from "../models/Room";
import { In, Raw } from "typeorm";

const router = express.Router();

router.get("/my-rooms", auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const roomRepo = AppDataSource.getRepository(Room);

    const rooms = await roomRepo.find({
      where: {
        members: Raw((alias) => `:userId = ANY(${alias})`, { userId }),
      },
      order: { lastMessageAt: "DESC" },
    });

    res.json(rooms);
  } catch (err) {
    console.error("Room fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/private", auth, async (req: AuthRequest, res: Response) => {
  const { otherUserId } = req.body;
  const userId = req.user!.id;

  const roomRepo = AppDataSource.getRepository(Room);

  // Find existing private room containing BOTH users
  let room = await roomRepo.findOne({
    where: {
      isPrivate: true,
      members: Raw(
        (alias) => `:u1 = ANY(${alias}) AND :u2 = ANY(${alias})`,
        { u1: userId, u2: otherUserId }
      ),
    },
  });

  if (!room) {
    room = roomRepo.create({
      isPrivate: true,
      members: [userId, otherUserId],
    });

    await roomRepo.save(room);
  }

  res.json(room);
});

export default router;
