import { Server } from "socket.io";
import { AppDataSource } from "../../config/pg";
import { Message } from "../../models/Message";
import { Room } from "../../models/Room";
import { TypedSocket } from "../../types/socket";
import { askGroq } from "../../services/ai.service";

const AI_BOT_ID = "AI_BOT";

/**
 * Handles ai:ask socket event.
 * Calls Groq (llama-3.3-70b-versatile), saves AI reply as a message,
 * and broadcasts it to the room.
 */
export const registerAIHandlers = (io: Server, socket: TypedSocket) => {
  const msgRepo = AppDataSource.getRepository(Message);
  const roomRepo = AppDataSource.getRepository(Room);

  socket.on("ai:ask", async ({ room, prompt }) => {
    try {
      // Signal typing so UI shows "FlowBot is typing..."
      io.to(room).emit("typing" as any, { room, userId: AI_BOT_ID });

      // Get response from Groq
      const fullResponse = await askGroq(prompt);

      // Emit response back to the requesting socket
      socket.emit("ai:complete", { room, text: fullResponse } as any);

      // Save as a permanent message in the room
      const aiMessage = msgRepo.create({
        roomId: room,
        senderId: AI_BOT_ID,
        content: fullResponse,
        deliveryStatus: "sent",
      });
      await msgRepo.save(aiMessage);

      // Update room's last message
      await roomRepo.update(room, {
        lastMessagePreview: aiMessage.id,
        lastMessageAt: new Date(),
      });

      // Broadcast to everyone in the room
      io.to(room).emit("message:new", aiMessage as any);
    } catch (err) {
      console.error("[aiHandler] Groq error:", err);
      socket.emit("ai:complete", {
        room,
        text: "⚠️ FlowBot is temporarily unavailable. Please try again.",
      } as any);
    }
  });
};
