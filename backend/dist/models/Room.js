"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const mongoose_1 = require("mongoose");
const RoomSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    members: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});
exports.Room = (0, mongoose_1.model)('Room', RoomSchema);
