import { Server } from "socket.io";
import { AppDataSource } from "../../config/pg";
import { Message } from "../../models/Message";
import { Room } from "../../models/Room";
import { TypedSocket } from "../../types/socket";

/**
 * Handles all message-related socket events:
 * send, deliver, read, and typing indicators.
 */
export const registerMessageHandlers = (
  io: Server,
  socket: TypedSocket
) => {
  const msgRepo = AppDataSource.getRepository(Message);
  const roomRepo = AppDataSource.getRepository(Room);

  // ── JOIN / LEAVE ROOM ──────────────────────────────────────────────────
  socket.on("joinRoom", ({ room }) => {
    socket.join(room);
    console.log(`👥 Socket ${socket.id} joined room ${room}`);
  });

  socket.on("leaveRoom", ({ room }) => {
    socket.leave(room);
  });

  // ── SEND MESSAGE ───────────────────────────────────────────────────────
  socket.on("message:send", async ({ roomId, text, mediaUrl }) => {
    const user = (socket as any).user;
    const senderId: string = user.id;

    try {
      const room = await roomRepo.findOne({ where: { id: roomId } });
      if (!room || !room.members.includes(senderId)) {
        return socket.emit("error" as any, { message: "Access denied" });
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

      io.to(roomId).emit("message:new", msg as any);
    } catch (err) {
      console.error("[messageHandler] message:send error:", err);
      socket.emit("error" as any, { message: "Failed to send message" });
    }
  });

  // ── TYPING INDICATOR ───────────────────────────────────────────────────
  socket.on("typing" as any, ({ room, userId }: { room: string; userId: string }) => {
    socket.to(room).emit("typing" as any, { room, userId });
  });

  // ── MESSAGE DELIVERED ──────────────────────────────────────────────────
  socket.on("message:delivered", async ({ messageId }) => {
    try {
      await msgRepo.update(messageId, { deliveryStatus: "delivered" });
      io.emit("message:status:update" as any, { messageId, deliveryStatus: "delivered" });
    } catch (err) {
      console.error("[messageHandler] message:delivered error:", err);
    }
  });

  // ── MESSAGE READ (BLUE TICK) ───────────────────────────────────────────
  socket.on("message:read" as any, async ({ messageId, userId }: { messageId: string; userId: string }) => {
    try {
      const msg = await msgRepo.findOneBy({ id: messageId });
      if (!msg) return;

      const updatedReadBy = Array.from(new Set([...(msg.readByUserIds || []), userId]));
      await msgRepo.update(messageId, {
        deliveryStatus: "read",
        readByUserIds: updatedReadBy,
      });
      io.emit("message:status:update" as any, { messageId, deliveryStatus: "read" });
    } catch (err) {
      console.error("[messageHandler] message:read error:", err);
    }
  });
};
