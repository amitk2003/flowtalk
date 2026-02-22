import express, { Response } from "express";
import { auth,AuthRequest } from "../middleware/auth";
import { AppDataSource } from "../config/pg";
import { Room } from "../models/Room";
import { In, Raw } from "typeorm";
import { User } from  "../models/User"

const router = express.Router();
const userRepo=AppDataSource.getRepository(User)
const roomRepo=AppDataSource.getRepository(Room)
router.get("/my-rooms", auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;


    const rooms = await roomRepo.find({
      where: {
        members: Raw((alias) => `:userId = ANY(${alias})`, { userId }),
      },
      order: { lastMessageAt: "DESC", createdAt:"DESC" },
    });

    res.json(rooms);
  } catch (err) {
    console.error("Room fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/private", auth, async (req: AuthRequest, res: Response) => {
  try{
      const { otherUserId } = req.body;
  const userId = req.user!.id;
  if(!otherUserId) return res.status(400).json({message:"otheruser id is required"})
  if (otherUserId === userId) {
  return res.status(400).json({ message: "Cannot create private room with yourself" });
}  
// if other usr exist
const otherUser = await userRepo.findOne({where:{id:otherUserId}})
if(!otherUser) return res.status(404).json({message:"Other user not found"})

  // Find existing private room containing BOTH users
  let room = await roomRepo.findOne({
    where: {
      isPrivate: true,
      members: Raw(
        (alias)=> `array_length(${alias},1)=2 AND :u1 = ANY(${alias})
        AND :u2=ANY(${alias})
        `,
         {u1:userId,u2:otherUserId}
        //  room is private, contain both users, has exactly 2 memebers
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
  }catch(err){
    console.error("Private room error:", err);
    res.status(500).json({ message: "Server error" });
  }

  
});

export default router;
