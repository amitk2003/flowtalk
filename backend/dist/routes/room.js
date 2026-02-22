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
const router = express_1.default.Router();
router.get("/my-rooms", auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const roomRepo = pg_1.AppDataSource.getRepository(Room_1.Room);
        const rooms = await roomRepo.find({
            where: {
                members: (0, typeorm_1.Raw)((alias) => `:userId = ANY(${alias})`, { userId }),
            },
            order: { lastMessageAt: "DESC" },
        });
        res.json(rooms);
    }
    catch (err) {
        console.error("Room fetch error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
router.post("/private", auth_1.auth, async (req, res) => {
    const { otherUserId } = req.body;
    const userId = req.user.id;
    const roomRepo = pg_1.AppDataSource.getRepository(Room_1.Room);
    // Find existing private room containing BOTH users
    let room = await roomRepo.findOne({
        where: {
            isPrivate: true,
            members: (0, typeorm_1.Raw)((alias) => `:u1 = ANY(${alias}) AND :u2 = ANY(${alias})`, { u1: userId, u2: otherUserId }),
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
exports.default = router;
