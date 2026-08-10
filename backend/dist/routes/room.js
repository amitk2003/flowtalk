"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const pg_1 = require("../config/pg");
const Room_1 = require("../models/Room");
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const router = express_1.default.Router();
const userRepo = pg_1.AppDataSource.getRepository(User_1.User);
const roomRepo = pg_1.AppDataSource.getRepository(Room_1.Room);
router.get("/my-rooms", auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const rooms = await roomRepo.find({
            where: {
                members: (0, typeorm_1.Raw)((alias) => `:userId = ANY(${alias})`, { userId }),
            },
            order: { lastMessageAt: "DESC", createdAt: "DESC" },
        });
        res.json(rooms);
    }
    catch (err) {
        console.error("Room fetch error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
router.post("/private", auth_1.auth, async (req, res) => {
    try {
        const { otherUserId } = req.body;
        const userId = req.user.id;
        if (!otherUserId)
            return res.status(400).json({ message: "otheruser id is required" });
        if (otherUserId === userId) {
            return res.status(400).json({ message: "Cannot create private room with yourself" });
        }
        // if other usr exist
        const otherUser = await userRepo.findOne({ where: { id: otherUserId } });
        if (!otherUser)
            return res.status(404).json({ message: "Other user not found" });
        // Find existing private room containing BOTH users
        let room = await roomRepo.findOne({
            where: {
                isPrivate: true,
                members: (0, typeorm_1.Raw)((alias) => `array_length(${alias},1)=2 AND :u1 = ANY(${alias})
        AND :u2=ANY(${alias})
        `, { u1: userId, u2: otherUserId }
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
    }
    catch (err) {
        console.error("Private room error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
