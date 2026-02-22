import express, { Request, Response } from "express";
import { AuthRequest,auth } from "../middleware/auth";
import { AppDataSource } from "../config/pg";
import { Message } from "../models/Message";
import { Room } from "../models/Room";
const router = express.Router();

router.get("/:roomId", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    const roomRepo = AppDataSource.getRepository(Room);
    const messageRepo = AppDataSource.getRepository(Message);

    const room = await roomRepo.findOne({ where: { id: roomId } });

    if (!room || !room.members.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await messageRepo.find({
      where: { roomId },
      order: { createdAt: "ASC" },
      take: 100,
    });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
