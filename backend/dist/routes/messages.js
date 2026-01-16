"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const Message_1 = __importDefault(require("../models/Message"));
const router = express_1.default.Router();
router.get('/:room', auth_1.default, async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await Message_1.default.find({ room }).sort({ createdAt: 1 }).limit(100);
        res.status(200).json(messages);
    }
    catch (err) {
        res.status(500).json({ message: 'server error' });
    }
});
exports.default = router;
