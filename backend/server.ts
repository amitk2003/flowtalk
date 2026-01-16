import dotenv from "dotenv";
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

import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app: Application = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
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

// Online users map: userId -> Set<socketId>
const onlineUsers: Map<string, Set<string>> = new Map();

io.on("connection", (socket: Socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  const userRepo = AppDataSource.getRepository(User);
  const msgRepo = AppDataSource.getRepository(Message);
  const roomRepo = AppDataSource.getRepository(Room);

  // --------- PRESENCE: USER ONLINE ---------
  socket.on("user:online", async ({ userId }: { userId: string }) => {
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
  socket.on(
    "message:send",
    async ({
      room,
      senderId,
      text,
      media,
    }: {
      room: string;
      senderId: string;
      text?: string;
      media?: string;
    }) => {
      const msg = msgRepo.create({
        room,
        senderId,
        text,
        media,
        status: "sent",
      });

      await msgRepo.save(msg);

      // Update room last message
      await roomRepo.update(room, {
        lastMessage: msg.id,
        lastMessageAt: new Date(),
      });

      io.to(room).emit("message:new", msg);
    }
  );

  // --------- TYPING INDICATOR ---------
  socket.on(
    "typing",
    ({ room, userId }: { room: string; userId: string }) => {
      socket.to(room).emit("typing", { room, userId });
    }
  );

  // --------- MESSAGE STATUS: DELIVERED ---------
  socket.on("message:delivered", async ({ messageId }) => {
    await msgRepo.update(messageId, { status: "delivered" });

    io.emit("message:status:update", {
      messageId,
      status: "delivered",
    });
  });

  // --------- MESSAGE STATUS: READ (BLUE TICK) ---------
  socket.on("message:read", async ({ messageId, userId }) => {
    const msg = await msgRepo.findOneBy({ id: messageId });
    if (!msg) return;

    const updatedReadBy = Array.from(
      new Set([...(msg.readBy || []), userId])
    );

    await msgRepo.update(messageId, {
      status: "read",
      readBy: updatedReadBy,
    });

    io.emit("message:status:update", {
      messageId,
      status: "read",
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
      userId,
      prompt,
    }: {
      room: string;
      userId: string;
      prompt: string;
    }) => {
      try {
        io.to(room).emit("typing", { room, userId: "AI_BOT" });

        let fullResponse = "";

        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant inside a real-time chat app.",
            },
            { role: "user", content: prompt },
          ],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          fullResponse += text;

          socket.emit("ai:stream", { room, text });
        }

        socket.emit("ai:complete", { room, text: fullResponse });

        // Save AI message in DB like normal chat
        const aiMessage = msgRepo.create({
          room,
          senderId: "AI_BOT",
          text: fullResponse,
          status: "sent",
        });

        await msgRepo.save(aiMessage);

        await roomRepo.update(room, {
          lastMessage: aiMessage.id,
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
