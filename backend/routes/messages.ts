import express, { Request, Response } from "express";
import auth, { AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/pg";
import { Message } from "../models/Message";

const router = express.Router();

router.get("/:room", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { room } = req.params;

    const messages = await AppDataSource.getRepository(Message).find({
      where: { room },
      order: { createdAt: "ASC" },
      take: 100,
    });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
