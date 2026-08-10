"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const pg_1 = require("../config/pg");
const Message_1 = require("../models/Message");
const Room_1 = require("../models/Room");
const router = express_1.default.Router();
router.get("/:roomId", auth_1.auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        const roomRepo = pg_1.AppDataSource.getRepository(Room_1.Room);
        const messageRepo = pg_1.AppDataSource.getRepository(Message_1.Message);
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
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
