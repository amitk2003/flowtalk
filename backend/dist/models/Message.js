"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    room: { type: String, required: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true },
    media: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Message', MessageSchema);
