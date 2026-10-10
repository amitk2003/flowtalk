import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import http from "http";
import cors from "cors";

import { env } from "./config/env";
import { connectDB } from "./config/pg";
import { requestLogger } from "./middleware/requestLogger";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { initSocket } from "./socket/socketManager";

import authRoutes from "./routes/auth";
import msgRoutes from "./routes/messages";
import roomRoutes from "./routes/room";

// ─── APP SETUP ─────────────────────────────────────────────────────────────
const app: Application = express();
const server = http.createServer(app);

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: "5mb" }));
app.use(requestLogger);
app.use("/api", apiLimiter);

// ─── ROUTES ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/messages", msgRoutes);
app.use("/api/rooms", roomRoutes);

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── GLOBAL ERROR HANDLER (must be last) ───────────────────────────────────
app.use(errorHandler);

// ─── SOCKET.IO ─────────────────────────────────────────────────────────────
initSocket(server);

// ─── START ─────────────────────────────────────────────────────────────────
connectDB().then(() => {
  server.listen(env.PORT, () => {
    console.log(`✅ FlowTalk server running on port ${env.PORT}`);
  });
});
