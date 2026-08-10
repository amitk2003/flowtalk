"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const pg_1 = require("./config/pg");
const User_1 = require("./models/User");
const Message_1 = require("./models/Message");
const Room_1 = require("./models/Room");
const auth_1 = __importDefault(require("./routes/auth"));
const messages_1 = __importDefault(require("./routes/messages"));
const room_1 = __importDefault(require("./routes/room"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
// const openai = new Grok({ apiKey: process.env.XAI_API_KEY });
const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const app = (0, express_1.default)();
const server = http_1.default.createServer(app); // create server for application
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
});
// Connect PostgreSQL
(0, pg_1.connectDB)();
// Middleware
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL }));
app.use(express_1.default.json());
// Routes
app.use("/api/auth", auth_1.default);
app.use("/api/messages", messages_1.default);
app.use("/api/rooms", room_1.default);
// Online users map: userId -> Set<socketId>
const onlineUsers = new Map();
// socket authentication middle waree
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token)
        return next(new Error("Unauthorized"));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        socket.user = decoded;
        next();
    }
    catch {
        next(new Error("Unauthorized"));
    }
});
io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);
    const userRepo = pg_1.AppDataSource.getRepository(User_1.User);
    const msgRepo = pg_1.AppDataSource.getRepository(Message_1.Message);
    const roomRepo = pg_1.AppDataSource.getRepository(Room_1.Room);
    // --------- PRESENCE: USER ONLINE ---------
    socket.on("user:online", async () => {
        const userId = socket.user.id;
        const sockets = onlineUsers.get(userId) || new Set();
        sockets.add(socket.id);
        onlineUsers.set(userId, sockets);
        await userRepo.update(userId, { isOnline: true });
        io.emit("presence:update", { userId, status: "online" });
    });
    // --------- JOIN / LEAVE ROOM ---------
    socket.on("joinRoom", ({ room }) => {
        socket.join(room);
    });
    socket.on("leaveRoom", ({ room }) => {
        socket.leave(room);
    });
    // --------- SEND MESSAGE (WHATSAPP STYLE) ---------
    // receiive message from user- saves in databse-updates room info- broadcast to everyone in that room
    socket.on("message:send", async ({ roomId, text, mediaUrl }) => {
        const user = socket.user;
        const senderId = user.id;
        const room = await roomRepo.findOne({ where: { id: roomId } });
        if (!room || !room.members.includes(senderId)) {
            return socket.emit("error", { message: "Access denied" });
        }
        const msg = msgRepo.create({
            roomId,
            senderId,
            content: text,
            mediaUrl,
            deliveryStatus: "sent",
        });
        await msgRepo.save(msg);
        await roomRepo.update(roomId, {
            lastMessagePreview: msg.id,
            lastMessageAt: new Date(),
        });
        io.to(roomId).emit("message:new", msg);
    });
    // --------- TYPING INDICATOR ---------
    socket.on("typing", ({ room, userId }) => {
        socket.to(room).emit("typing", { room, userId });
    });
    // --------- MESSAGE STATUS: DELIVERED ---------
    socket.on("message:delivered", async ({ messageId }) => {
        await msgRepo.update(messageId, { deliveryStatus: "delivered" });
        io.emit("message:status:update", {
            messageId,
            deliveryStatus: "delivered",
        });
    });
    // --------- MESSAGE STATUS: READ (BLUE TICK) ---------
    socket.on("message:read", async ({ messageId, userId }) => {
        const msg = await msgRepo.findOneBy({ id: messageId });
        if (!msg)
            return;
        const updatedReadBy = Array.from(new Set([...(msg.readByUserIds || []), userId]));
        await msgRepo.update(messageId, {
            deliveryStatus: "read",
            readByUserIds: updatedReadBy,
        });
        io.emit("message:status:update", {
            messageId,
            deliveryStatus: "read",
        });
    });
    // ========== WEBRTC VIDEO CALL SIGNALING ==========
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
        if (targetSockets) {
            for (const sId of targetSockets) {
                io.to(sId).emit("webrtc:offer", { sdp });
            }
        }
    });
    socket.on("webrtc:answer", ({ toUserId, sdp }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets) {
            for (const sId of targetSockets) {
                io.to(sId).emit("webrtc:answer", { sdp });
            }
        }
    });
    socket.on("webrtc:icecandidate", ({ toUserId, candidate, }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets) {
            for (const sId of targetSockets) {
                io.to(sId).emit("webrtc:icecandidate", { candidate });
            }
        }
    });
    // --------- REAL-TIME AI LLM ---------
    socket.on("ai:ask", async ({ room, prompt, }) => {
        try {
            const userId = socket.user.id;
            io.to(room).emit("typing", { room, userId: "AI_BOT" });
            const response = await axios_1.default.post(GROK_API_URL, {
                model: "grok-3.5",
                stream: false,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful AI assistant integrated into a chat application. Provide concise and relevant answers to user queries."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.XAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });
            const fullResponse = response.data?.choices?.[0]?.message?.content || "no response from grok";
            socket.emit("ai:complete", { room, text: fullResponse });
            // Save AI message in DB like normal chat
            const aiMessage = msgRepo.create({
                roomId: room,
                senderId: "AI_BOT",
                content: fullResponse,
                deliveryStatus: "sent",
            });
            await msgRepo.save(aiMessage);
            await roomRepo.update(room, {
                lastMessagePreview: aiMessage.id,
                lastMessageAt: new Date(),
            });
            io.to(room).emit("message:new", aiMessage);
        }
        catch (err) {
            console.error("AI error:", err);
            socket.emit("ai:complete", {
                room,
                text: "Sorry, AI service is currently unavailable.",
            });
        }
    });
    socket.on("call:end", ({ room, toUserId }) => {
        const targetSockets = onlineUsers.get(toUserId);
        if (targetSockets) {
            for (const sId of targetSockets) {
                io.to(sId).emit("call:ended", { room });
            }
        }
        socket.to(room).emit("call:ended", { room });
    });
    // --------- DISCONNECT HANDLER (LAST SEEN) ---------
    socket.on("disconnect", async () => {
        console.log(`🔴 Socket disconnected: ${socket.id}`);
        for (const [userId, sockets] of onlineUsers.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    await userRepo.update(userId, {
                        isOnline: false,
                        lastSeen: new Date(),
                    });
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
    });
});
// --------- START SERVER ---------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
