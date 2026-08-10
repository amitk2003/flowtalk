export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
  role?: "user" | "admin";
}

export interface Room {
  id: string;
  name?: string;
  isPrivate: boolean;
  members: string[];
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
  // Enriched on frontend
  otherUser?: User;
}

export type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  deliveryStatus: MessageStatus;
  readByUserIds: string[];
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
}
