import { Socket } from "socket.io";

// shared/socketEvents.ts  (same file for both client & server)

export interface ServerToClientEvents {
  "message:new": (msg: {
    id: string;
    roomId: string;
    senderId: string;
    content?: string;
    mediaUrl?: string;
    createdAt: string;           // ← ISO string, not Date
  }) => void;

  "presence:update": (data: {
    userId: string;
    status: "online" | "offline" | "away";  // ← extended a bit
    lastSeen?: string;
  }) => void;

  "call:incoming": (payload: {
    fromUserId: string;
    roomId?: string;             // ← optional, but often useful
  }) => void;

  "webrtc:offer": (payload: {
    fromUserId?: string;         // ← helpful for UI
    sdp: RTCSessionDescriptionInit;
  }) => void;

  "webrtc:answer": (payload: {
    fromUserId?: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;

  "webrtc:icecandidate": (payload: {
    fromUserId?: string;
    candidate: RTCIceCandidateInit;
  }) => void;

  "ai:stream": (data: { roomId: string; text: string }) => void;
  "ai:complete": (data: { roomId: string; text: string }) => void;
}

export interface ClientToServerEvents {
  "user:online": () => void;   // or (data: { userId: string }) if you prefer explicit

  "message:send": (data: {
    roomId: string;
    senderId?: string;            // ← made optional to match backend token derivation
    text?: string;
    mediaUrl?: string;
  }) => void;

  "webrtc:offer": (data: {
    toUserId: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;

  "webrtc:answer": (data: {
    toUserId: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;

  "webrtc:icecandidate": (data: {
    toUserId: string;
    candidate: RTCIceCandidateInit;
  }) => void;

  "joinRoom": (data: { room: string }) => void;
  "leaveRoom": (data: { room: string }) => void;
  "message:delivered": (data: { messageId: string }) => void;

  "ai:ask": (data: {
    room: string;
    prompt: string;
  }) => void;
}
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents
>;