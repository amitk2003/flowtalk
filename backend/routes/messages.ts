import express from "express";
import { auth } from "../middleware/auth";
import { getRoomMessages } from "../controllers/message.controller";

const router = express.Router();

// GET /api/messages/:roomId?before=<cursor>&limit=<n>
router.get("/:roomId", auth, getRoomMessages);

export default router;
