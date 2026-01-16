import { io, Socket } from "socket.io-client";

export interface ServerToClientEvents {
  "message:new": (msg: any) => void;
  "presence:update": (data: { userId: string; status: string; lastSeen?: string }) => void;
  "typing": (data: { room: string; userId: string }) => void;
  "message:status:update": (data: { messageId: string; status: string }) => void;
  "webrtc:offer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:answer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:icecandidate": (data: { candidate: RTCIceCandidateInit }) => void;
  "call:incoming": (data: { fromUser: string; room: string }) => void;
  "call:ended": (data: { room: string }) => void;
  "ai:stream": (data: { room: string; text: string }) => void;
"ai:complete": (data: { room: string; text: string }) => void;

}

export interface ClientToServerEvents {
  "user:online": (data: { userId: string }) => void;
  "joinRoom": (data: { room: string }) => void;
  "leaveRoom": (data: { room: string }) => void;
  "message:send": (data: { room: string; senderId: string; text: string }) => void;
  "typing": (data: { room: string; userId: string }) => void;
  "message:read": (data: { messageId: string; userId: string }) => void;
  "message:delivered": (data: { messageId: string }) => void;
  "webrtc:offer": (data: { toUserId: string; sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:answer": (data: { toUserId: string; sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:icecandidate": (data: { toUserId: string; candidate: RTCIceCandidateInit }) => void;
  "ai:ask": (data: { room: string; userId: string; prompt: string }) => void;

}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(process.env.NEXT_PUBLIC_SOCKET_URL!, { autoConnect: false });
