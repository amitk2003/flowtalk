"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { socket } from "@/lib/socket";
import { fetchMessages } from "@/services/messageService";
import { Room, User, Message } from "@/types";
import ChatList from "./ChatList";
import MessageBubble from "./MessageBubble";
import VideoCallModal from "./VideoCallModal";
import TypingIndicator from "./TypingIndicator";
import AIPanel from "./AIPanel";

interface ChatWindowProps {
  user: User;
  onLogout: () => void;
}

export default function ChatWindow({ user, onLogout }: ChatWindowProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [showCall, setShowCall] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showMobileList, setShowMobileList] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // ── AUTO SCROLL ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // ── CONNECT + PRESENCE ──────────────────────────────────────────────────
  useEffect(() => {
    socket.auth = { token: localStorage.getItem("token") };
    socket.connect();
    socket.emit("user:online");

    return () => { socket.disconnect(); };
  }, []);

  // ── ROOM CHANGE ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    setMessages([]);
    setTypingUsers(new Set());

    socket.emit("joinRoom", { room: room.id });

    fetchMessages(room.id)
      .then((res) => {
        const data = res.data.data || res.data;
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      socket.emit("message:delivered", { messageId: msg.id });
    };

    const handleTyping = ({ userId }: { room: string; userId: string }) => {
      if (userId === user.id) return;
      setTypingUsers((prev) => new Set([...prev, userId]));

      // Clear typing after 2.5s of no updates
      const existing = typingTimersRef.current.get(userId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setTypingUsers((prev) => { const next = new Set(prev); next.delete(userId); return next; });
        typingTimersRef.current.delete(userId);
      }, 2500);
      typingTimersRef.current.set(userId, timer);
    };

    const handleStatusUpdate = ({ messageId, deliveryStatus }: any) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deliveryStatus } : m))
      );
    };

    socket.on("message:new" as any, handleNewMessage);
    socket.on("typing" as any, handleTyping);
    socket.on("message:status:update" as any, handleStatusUpdate);

    return () => {
      socket.emit("leaveRoom", { room: room.id });
      socket.off("message:new" as any, handleNewMessage);
      socket.off("typing" as any, handleTyping);
      socket.off("message:status:update" as any, handleStatusUpdate);
    };
  }, [room, user.id]);

  // ── TYPING EMIT ─────────────────────────────────────────────────────────
  const typingEmitRef = useRef<NodeJS.Timeout | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!room) return;
    if (!typingEmitRef.current) {
      socket.emit("typing" as any, { room: room.id, userId: user.id });
    }
    if (typingEmitRef.current) clearTimeout(typingEmitRef.current);
    typingEmitRef.current = setTimeout(() => { typingEmitRef.current = null; }, 2000);
  };

  // ── SEND MESSAGE ────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!text.trim() || !room) return;
    socket.emit("message:send", { roomId: room.id, text: text.trim() });
    setText("");
    inputRef.current?.focus();
  }, [text, room]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── SELECT ROOM ─────────────────────────────────────────────────────────
  const handleSelectRoom = (r: Room) => {
    setRoom(r);
    setShowMobileList(false); // On mobile, hide the list when a room is selected
  };

  const getRoomDisplayName = () => {
    if (!room) return "";
    if (room.isPrivate) return room.otherUser?.name || "Private Chat";
    return room.name || "Group Chat";
  };

  const otherUserId = room?.members?.find((m) => m !== user.id);

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* ── SIDEBAR (Chat List) ── */}
      <div
        style={{
          flexShrink: 0,
          // Mobile: show/hide based on state
          display: "flex",
        }}
        className="sidebar-wrapper"
      >
        <ChatList
          currentUser={user}
          selectedRoom={room}
          onSelectRoom={handleSelectRoom}
          onLogout={onLogout}
        />
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          background: "var(--color-bg)",
          backgroundImage: "radial-gradient(ellipse at 80% 20%, rgba(108,99,255,0.04) 0%, transparent 50%)",
        }}
      >
        {room ? (
          <>
            {/* Chat header */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
              }}
            >
              {/* Mobile back button */}
              <button
                id="mobile-back-btn"
                className="btn-icon"
                onClick={() => setShowMobileList(true)}
                style={{ display: "none" }}
                title="Back to chats"
              >
                ←
              </button>

              {/* Room avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: room.isPrivate
                    ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))"
                    : "linear-gradient(135deg, var(--color-success), #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {room.isPrivate ? getRoomDisplayName()[0]?.toUpperCase() : "👥"}
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--color-text)" }}>
                  {getRoomDisplayName()}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-3)" }}>
                  {typingUsers.size > 0 ? (
                    <span style={{ color: "var(--color-primary)" }}>typing...</span>
                  ) : (
                    `${room.members?.length || 0} members`
                  )}
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  id="ai-toggle-btn"
                  className="btn-icon"
                  onClick={() => setShowAI(!showAI)}
                  title="FlowBot AI"
                  style={{
                    fontSize: 18,
                    background: showAI ? "rgba(168,85,247,0.15)" : "transparent",
                    color: showAI ? "var(--color-ai)" : "var(--color-text-2)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  🤖
                </button>
                {room.isPrivate && otherUserId && (
                  <button
                    id="video-call-btn"
                    className="btn-icon"
                    onClick={() => setShowCall(true)}
                    title="Video Call"
                    style={{ fontSize: 18 }}
                  >
                    📞
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 20px 10px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-3)",
                    textAlign: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 48, opacity: 0.4 }}>💬</div>
                  <p style={{ fontSize: 14, color: "var(--color-text-2)" }}>No messages yet</p>
                  <p style={{ fontSize: 12 }}>Send the first message to get the conversation going!</p>
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  msg={m}
                  isMe={m.senderId === user.id}
                  isBot={m.senderId === "AI_BOT"}
                />
              ))}

              {/* Typing indicators */}
              {Array.from(typingUsers).map((uid) => (
                <TypingIndicator key={uid} userId={uid} />
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                id="message-input"
                className="input"
                type="text"
                placeholder={`Message ${getRoomDisplayName()}...`}
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                style={{ fontSize: 14 }}
              />
              <button
                id="send-message-btn"
                className="btn btn-primary"
                onClick={sendMessage}
                disabled={!text.trim()}
                style={{ padding: "9px 18px", flexShrink: 0 }}
              >
                <span>Send</span>
                <span>↑</span>
              </button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-3)",
              textAlign: "center",
              padding: 40,
              gap: 16,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,229,255,0.1))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                marginBottom: 8,
              }}
            >
              💬
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: 8,
                }}
              >
                Welcome to FlowTalk
              </h2>
              <p style={{ fontSize: 14, color: "var(--color-text-2)", maxWidth: 280 }}>
                Select a conversation or start a new one using the ✏️ button
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── AI PANEL ── */}
      {showAI && (
        <div
          style={{
            width: "var(--ai-panel-width)",
            minWidth: "var(--ai-panel-width)",
            height: "100dvh",
            flexShrink: 0,
          }}
        >
          <AIPanel roomId={room?.id || null} onClose={() => setShowAI(false)} />
        </div>
      )}

      {/* ── VIDEO CALL ── */}
      {showCall && room && otherUserId && (
        <VideoCallModal
          room={room}
          user={user}
          otherUserId={otherUserId}
          onClose={() => setShowCall(false)}
        />
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed !important;
            left: ${showMobileList ? "0" : "-100%"} !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            z-index: 50 !important;
            transition: left 0.3s cubic-bezier(0.4,0,0.2,1) !important;
          }
          .sidebar-wrapper > div {
            width: 100% !important;
            min-width: 100% !important;
          }
          #mobile-back-btn {
            display: flex !important;
          }
        }
        @media (max-width: 1024px) {
          :root {
            --ai-panel-width: 260px;
          }
        }
      `}</style>
    </div>
  );
}
