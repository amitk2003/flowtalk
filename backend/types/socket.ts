import { Socket } from 'socket.io';

export interface ServerToClientEvents {
  'message:new': (msg: any) => void;
  'presence:update': (data: { userId: string; status: string }) => void;
  'call:incoming': (payload: any) => void;
  'webrtc:offer': (payload: { sdp: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (payload: { sdp: RTCSessionDescriptionInit }) => void;
  'webrtc:icecandidate': (payload: { candidate: RTCIceCandidateInit }) => void;
  "ai:stream": (data: { room: string; text: string }) => void;
  "ai:complete": (data: { room: string; text: string }) => void;
}


// export interface ClientToServerEvents {
//   "ai:ask": (data: { room: string; userId: string; prompt: string }) => void;
// }


export interface ClientToServerEvents {
  'user:online': (data: { userId: string }) => void;
  'message:send': (data: { room: string; senderId: string; text: string }) => void;
  'webrtc:offer': (data: { toUserId: string; sdp: RTCSessionDescriptionInit }) => void;
  "ai:ask": (data: { room: string; userId: string; prompt: string }) => void;
}

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
