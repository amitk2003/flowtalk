"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const pg_1 = require("../config/pg");
const Message_1 = require("../models/Message");
const router = express_1.default.Router();
router.get("/:room", auth_1.auth, async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await pg_1.AppDataSource.getRepository(Message_1.Message).find({
            where: { room },
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
