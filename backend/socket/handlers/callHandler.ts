import { Server } from "socket.io";
import { TypedSocket } from "../../types/socket";

/**
 * Handles all WebRTC call signaling events:
 * request, accept, offer, answer, ICE candidates, end.
 */
export const registerCallHandlers = (
  io: Server,
  socket: TypedSocket,
  onlineUsers: Map<string, Set<string>>
) => {
  const emitToUser = (userId: string, event: string, payload: any) => {
    const targetSockets = onlineUsers.get(userId);
    if (targetSockets) {
      for (const sId of targetSockets) {
        io.to(sId).emit(event, payload);
      }
      return true;
    }
    return false;
  };

  // ── CALL REQUEST ───────────────────────────────────────────────────────
  socket.on("call:request" as any, ({ toUserId, fromUser, room }: any) => {
    const found = emitToUser(toUserId, "call:incoming", { fromUser, room });
    if (!found) {
      socket.emit("call:unavailable" as any, { toUserId });
    }
  });

  // ── CALL ACCEPT ────────────────────────────────────────────────────────
  socket.on("call:accept" as any, ({ toUserId, fromUser }: any) => {
    emitToUser(toUserId, "call:accepted", { fromUser });
  });

  // ── WEBRTC OFFER ───────────────────────────────────────────────────────
  socket.on("webrtc:offer", ({ toUserId, sdp }) => {
    emitToUser(toUserId, "webrtc:offer", { sdp });
  });

  // ── WEBRTC ANSWER ──────────────────────────────────────────────────────
  socket.on("webrtc:answer", ({ toUserId, sdp }) => {
    emitToUser(toUserId, "webrtc:answer", { sdp });
  });

  // ── ICE CANDIDATES ─────────────────────────────────────────────────────
  socket.on("webrtc:icecandidate", ({ toUserId, candidate }) => {
    emitToUser(toUserId, "webrtc:icecandidate", { candidate });
  });

  // ── CALL END ───────────────────────────────────────────────────────────
  socket.on("call:end" as any, ({ room, toUserId }: any) => {
    emitToUser(toUserId, "call:ended", { room });
    socket.to(room).emit("call:ended" as any, { room });
  });
};
