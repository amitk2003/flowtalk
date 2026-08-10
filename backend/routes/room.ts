import express from "express";
import { auth } from "../middleware/auth";
import { getMyRooms, createPrivateRoom, searchUsers } from "../controllers/room.controller";
import { validate } from "../middleware/validate";
import { createPrivateRoomSchema } from "../schemas/room.schema";

const router = express.Router();

// GET /api/rooms/my-rooms
router.get("/my-rooms", auth, getMyRooms);

// GET /api/rooms/users?q=<query>  — search users to start a new chat
router.get("/users", auth, searchUsers);

// POST /api/rooms/private
router.post("/private", auth, validate(createPrivateRoomSchema), createPrivateRoom);

export default router;
