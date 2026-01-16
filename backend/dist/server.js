"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./config/db"));
const auth_1 = __importDefault(require("./routes/auth"));
const messages_1 = __importDefault(require("./routes/messages"));
const Message_1 = __importDefault(require("./models/Message"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
    },
});
// Connect MongoDB
(0, db_1.default)(process.env.MONGO_URI);
// Middleware
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL }));
app.use(express_1.default.json());
// Routes
app.use("/api/auth", auth_1.default);
app.use("/api/messages", messages_1.default);
// Online users map: userId -> Set<socketId>
const onlineUsers = new Map();
// Socket.io connection logic
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("user:online", async ({ userId }) => {
        const sockets = onlineUsers.get(userId) || new Set();
        sockets.add(socket.id);
        onlineUsers.set(userId, sockets);
        io.emit("presence:update", { userId, status: "online" });
    });
    socket.on("joinRoom", ({ room }) => {
        socket.join(room);
    });
    socket.on("leaveRoom", ({ room }) => {
        socket.leave(room);
    });
    socket.on("message:send", async ({ room, senderId, text, media, }) => {
        const msg = await Message_1.default.create({ room, sender: senderId, text, media });
        io.to(room).emit("message:new", msg);
    });
    socket.on("typing", ({ room, userId }) => {
        socket.to(room).emit("typing", { room, userId });
    });
    // WebRTC events
    socket.on("call:request", ({ toUserId, fromUser, room, }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets) {
            for (const sId of targetSockets) {
                io.to(sId).emit("call:incoming", { fromUser, room });
            }
        }
        else {
            socket.emit("call:unavailable", { toUserId });
        }
    });
    socket.on("call:accept", ({ toUserId, fromUser }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets) {
            for (const sId of targetSockets) {
                io.to(sId).emit("call:accepted", { fromUser });
            }
        }
    });
    socket.on("webrtc:offer", ({ toUserId, sdp }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets)
            for (const sId of targetSockets)
                io.to(sId).emit("webrtc:offer", { sdp });
    });
    socket.on("webrtc:answer", ({ toUserId, sdp }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets)
            for (const sId of targetSockets)
                io.to(sId).emit("webrtc:answer", { sdp });
    });
    socket.on("webrtc:icecandidate", ({ toUserId, candidate }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets)
            for (const sId of targetSockets)
                io.to(sId).emit("webrtc:icecandidate", { candidate });
    });
    socket.on("call:end", ({ room, toUserId }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets)
            for (const sId of targetSockets)
                io.to(sId).emit("call:ended", { room });
        socket.to(room).emit("call:ended", { room });
    });
    socket.on("disconnect", async () => {
        for (const [userId, sockets] of onlineUsers.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit("presence:update", {
                        userId,
                        status: "offline",
                        lastSeen: new Date(),
                    });
                }
                else {
                    onlineUsers.set(userId, sockets);
                }
                break;
            }
        }
        console.log(`Socket disconnected: ${socket.id}`);
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
