import { Socket } from "socket.io";

export interface ServerToClientEvents {
  "message:new": (msg: {
    id: string;
    roomId: string;
    senderId: string;
    content?: string;
    mediaUrl?: string;
    createdAt: Date;
  }) => void;

  "presence:update": (data: {
    userId: string;
    status: "online" | "offline";
  }) => void;

  "call:incoming": (payload: {
    fromUserId: string;
  }) => void;

  "webrtc:offer": (payload: {
    sdp: RTCSessionDescriptionInit;
  }) => void;

  "webrtc:answer": (payload: {
    sdp: RTCSessionDescriptionInit;
  }) => void;

  "webrtc:icecandidate": (payload: {
    candidate: RTCIceCandidateInit;
  }) => void;

  "ai:stream": (data: { roomId: string; text: string }) => void;

  "ai:complete": (data: { roomId: string; text: string }) => void;
}

export interface ClientToServerEvents {
  "user:online": () => void;

  "message:send": (data: {
    roomId: string;
    text?: string;
    mediaUrl?: string;
  }) => void;

  "webrtc:offer": (data: {
    toUserId: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;

  "ai:ask": (data: {
    roomId: string;
    prompt: string;
  }) => void;
}

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents
>;