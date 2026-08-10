import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { TypedSocket } from "../types/socket";
import { registerPresenceHandlers } from "./handlers/presenceHandler";
import { registerMessageHandlers } from "./handlers/messageHandler";
import { registerCallHandlers } from "./handlers/callHandler";
import { registerAIHandlers } from "./handlers/aiHandler";

// Global map of userId → Set of socket IDs (supports multi-tab)
export const onlineUsers: Map<string, Set<string>> = new Map();

/**
 * Initializes Socket.IO server with JWT auth middleware
 * and registers all domain-specific socket handlers.
 */
export const initSocket = (server: http.Server): Server => {
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  // ── JWT AUTHENTICATION MIDDLEWARE ────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized: no token"));

    try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as any;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  // ── CONNECTION HANDLER ────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const typedSocket = socket as TypedSocket;
    console.log(`🟢 Socket connected: ${socket.id}`);

    // Register all domain handlers
    registerPresenceHandlers(io, typedSocket, onlineUsers);
    registerMessageHandlers(io, typedSocket);
    registerCallHandlers(io, typedSocket, onlineUsers);
    registerAIHandlers(io, typedSocket);
  });

  return io;
};
