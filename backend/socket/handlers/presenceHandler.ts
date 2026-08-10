import { Server } from "socket.io";
import { AppDataSource } from "../../config/pg";
import { User } from "../../models/User";
import { TypedSocket } from "../../types/socket";

/**
 * Handles user presence: online/offline tracking and last seen updates.
 */
export const registerPresenceHandlers = (
  io: Server,
  socket: TypedSocket,
  onlineUsers: Map<string, Set<string>>
) => {
  const userRepo = AppDataSource.getRepository(User);

  // ── USER COMES ONLINE ──────────────────────────────────────────────────
  socket.on("user:online", async () => {
    const userId = (socket as any).user.id;
    const sockets = onlineUsers.get(userId) || new Set<string>();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);

    await userRepo.update(userId, { isOnline: true });
    io.emit("presence:update", { userId, status: "online" });
  });

  // ── DISCONNECT → UPDATE LAST SEEN ──────────────────────────────────────
  socket.on("disconnect", async () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);

    for (const [userId, sockets] of onlineUsers.entries()) {
      if (!sockets.has(socket.id)) continue;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        const now = new Date();
        await userRepo.update(userId, { isOnline: false, lastSeen: now });
        io.emit("presence:update", {
          userId,
          status: "offline",
          lastSeen: now.toISOString(),
        });
      } else {
        onlineUsers.set(userId, sockets);
      }
      break;
    }
  });
};
