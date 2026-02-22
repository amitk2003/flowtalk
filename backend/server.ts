import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { connectDB, AppDataSource } from "./config/pg";
import { User } from "./models/User";
import { Message } from "./models/Message";
import { Room } from "./models/Room";

import authRoutes from "./routes/auth";
import msgRoutes from "./routes/messages";
import roomRoutes from "./routes/room"
import jwt from "jsonwebtoken"
import axios from "axios";



// const openai = new Grok({ apiKey: process.env.XAI_API_KEY });

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";

const app: Application = express();
const server = http.createServer(app);// create server for application

const io = new Server(server, {
  cors: {
    origin:  "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

// Connect PostgreSQL
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", msgRoutes);
app.use("/api/rooms",roomRoutes)

// Online users map: userId -> Set<socketId>
const onlineUsers: Map<string, Set<string>> = new Map();
// socket authentication middle waree
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as any;

    (socket as any).user = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});
io.on("connection", (socket: Socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  const userRepo = AppDataSource.getRepository(User);
  const msgRepo = AppDataSource.getRepository(Message);
  const roomRepo = AppDataSource.getRepository(Room);

  // --------- PRESENCE: USER ONLINE ---------
  socket.on("user:online", async () => {
    const userId = (socket as any).user.id;
    const sockets = onlineUsers.get(userId) || new Set<string>();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);

    await userRepo.update(userId, { isOnline: true });

    io.emit("presence:update", { userId, status: "online" });
  });

  // --------- JOIN / LEAVE ROOM ---------
  socket.on("joinRoom", ({ room }: { room: string }) => {
    socket.join(room);
  });

  socket.on("leaveRoom", ({ room }: { room: string }) => {
    socket.leave(room);
  });

  // --------- SEND MESSAGE (WHATSAPP STYLE) ---------
  // receiive message from user- saves in databse-updates room info- broadcast to everyone in that room
  socket.on("message:send", async ({ roomId, text, mediaUrl }) => {
  const user = (socket as any).user;
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
  socket.on(
    "typing",
    ({ room, userId }: { room: string; userId: string }) => {
      socket.to(room).emit("typing", { room, userId });
    }
  );

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
    if (!msg) return;

    const updatedReadBy = Array.from(
      new Set([...(msg.readByUserIds || []), userId])
    );

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
  socket.on(
    "call:request",
    ({
      toUserId,
      fromUser,
      room,
    }: {
      toUserId: string;
      fromUser: string;
      room: string;
    }) => {
      const targetSockets = onlineUsers.get(toUserId);

      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit("call:incoming", { fromUser, room });
        }
      } else {
        socket.emit("call:unavailable", { toUserId });
      }
    }
  );

  socket.on(
    "call:accept",
    ({ toUserId, fromUser }: { toUserId: string; fromUser: string }) => {
      const targetSockets = onlineUsers.get(toUserId);
      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit("call:accepted", { fromUser });
        }
      }
    }
  );

  socket.on(
    "webrtc:offer",
    ({ toUserId, sdp }: { toUserId: string; sdp: any }) => {
      const targetSockets = onlineUsers.get(toUserId);
      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit("webrtc:offer", { sdp });
        }
      }
    }
  );

  socket.on(
    "webrtc:answer",
    ({ toUserId, sdp }: { toUserId: string; sdp: any }) => {
      const targetSockets = onlineUsers.get(toUserId);
      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit("webrtc:answer", { sdp });
        }
      }
    }
  );

  socket.on(
    "webrtc:icecandidate",
    ({
      toUserId,
      candidate,
    }: {
      toUserId: string;
      candidate: any;
    }) => {
      const targetSockets = onlineUsers.get(toUserId);
      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit("webrtc:icecandidate", { candidate });
        }
      }
    }
  );

  // --------- REAL-TIME AI LLM ---------
  socket.on(
    "ai:ask",
    async ({
      room,
      prompt,
    }: {
      room: string;
      prompt: string;
    }) => {
      try {
        const userId= (socket as any).user.id;
        io.to(room).emit("typing", { room, userId: "AI_BOT" });

       

        const  response= await axios.post(
          GROK_API_URL,{
            model: "grok-3.5",
            stream:false,
            messages:[
              {
                role:"system",
                content:"You are a helpful AI assistant integrated into a chat application. Provide concise and relevant answers to user queries."
              },
              {
                role:"user",
                content:prompt
              }
            ],
          },
          {
            headers:{
              Authorization:`Bearer ${process.env.XAI_API_KEY}`,
              "Content-Type":"application/json"
            }
          }
        )
        const fullResponse= response.data?.choices?.[0]?.message?.content || "no response from grok"
        socket.emit("ai:complete",{room,text:fullResponse})
        
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
      } catch (err) {
        console.error("AI error:", err);
        socket.emit("ai:complete", {
          room,
          text: "Sorry, AI service is currently unavailable.",
        });
      }
    }
  );

  socket.on(
    "call:end",
    ({ room, toUserId }: { room: string; toUserId: string }) => {
      const targetSockets = onlineUsers.get(toUserId);

      if (targetSockets) {
        for (const sId of targetSockets) {
          io.to(sId).emit("call:ended", { room });
        }
      }

      socket.to(room).emit("call:ended", { room });
    }
  );

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
        } else {
          onlineUsers.set(userId, sockets);
        }
        break;
      }
    }
  });
});

// --------- START SERVER ---------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
