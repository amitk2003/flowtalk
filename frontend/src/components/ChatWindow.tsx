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
import { 
  Phone, 
  Video, 
  Bot, 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Send,
  ArrowLeft,
  MessageSquare
} from "lucide-react";

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
    setShowMobileList(false);
  };

  const getRoomDisplayName = () => {
    if (!room) return "";
    if (room.isPrivate) return room.otherUser?.name || "Private Chat";
    return room.name || "Group Chat";
  };

  const otherUserId = room?.members?.find((m) => m !== user.id);

  return (
    <div className="flex h-screen w-screen bg-[#0b141a] text-[#e9edef] overflow-hidden select-none">
      
      {/* Sidebar Wrapper */}
      <div className={`shrink-0 md:flex z-20 ${showMobileList ? "flex w-full md:w-auto" : "hidden md:flex"}`}>
        <ChatList
          currentUser={user}
          selectedRoom={room}
          onSelectRoom={handleSelectRoom}
          onLogout={onLogout}
          onToggleAI={() => setShowAI(!showAI)}
          showAI={showAI}
        />
      </div>

      {/* Main chat window container */}
      <div className={`flex-1 flex flex-col min-w-0 h-full relative z-10 ${!showMobileList ? "flex" : "hidden md:flex"}`}>
        {room ? (
          <>
            {/* Chat header */}
            <div className="h-[60px] px-4 flex items-center justify-between bg-[#202d33] border-b border-[#222d34] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="p-1.5 rounded-full hover:bg-[#2d3f4b] transition-all md:hidden text-[#aebac1]"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white uppercase text-base bg-gradient-to-tr from-[#005c4b] to-[#00a884] shrink-0 shadow-sm">
                  {getRoomDisplayName()[0]}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate text-[#e9edef] leading-tight">
                    {getRoomDisplayName()}
                  </h2>
                  <p className="text-[11px] text-[#8696a0] mt-0.5 truncate leading-none">
                    {typingUsers.size > 0 ? (
                      <span className="text-[#00a884] font-medium">typing...</span>
                    ) : (
                      "online"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {room.isPrivate && otherUserId && (
                  <button
                    onClick={() => setShowCall(true)}
                    className="p-2 rounded-full text-[#aebac1] hover:bg-[#2d3f4b] transition-all duration-200"
                    title="Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowAI(!showAI)}
                  className={`p-2 rounded-full transition-all duration-200 hover:bg-[#2d3f4b] ${
                    showAI ? "text-purple-400 bg-purple-500/10" : "text-[#aebac1]"
                  }`}
                  title="FlowBot AI Assistant"
                >
                  <Bot className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full text-[#aebac1] hover:bg-[#2d3f4b]" title="Search">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full text-[#aebac1] hover:bg-[#2d3f4b]" title="Menu">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message Wallpaper Area */}
            <div className="flex-1 overflow-y-auto chat-wallpaper p-4 space-y-2 flex flex-col justify-start">
              <div className="flex justify-center my-3 select-none">
                <span className="bg-[#182229] border border-[#222d34] text-[#8696a0] text-[10.5px] px-2.5 py-1 rounded-md uppercase font-light tracking-wide shadow-sm">
                  Messages are end-to-end encrypted
                </span>
              </div>

              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  msg={m}
                  isMe={m.senderId === user.id}
                  isBot={m.senderId === "AI_BOT"}
                />
              ))}

              {/* Typing Indicators */}
              {Array.from(typingUsers).map((uid) => (
                <TypingIndicator key={uid} userId={uid} />
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="h-[62px] px-4 flex items-center gap-3 bg-[#202d33] border-t border-[#222d34] shrink-0">
              <div className="flex items-center gap-2 text-[#aebac1]">
                <button className="p-2 hover:bg-[#2d3f4b] rounded-full transition-all duration-150">
                  <Smile className="w-6 h-6" />
                </button>
                <button className="p-2 hover:bg-[#2d3f4b] rounded-full transition-all duration-150">
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message"
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-[#2a3942] text-[#e9edef] rounded-lg px-4 py-2 text-sm outline-none placeholder-[#8696a0]"
              />

              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className={`p-2.5 rounded-full text-white transition-all duration-200 shrink-0 ${
                  text.trim()
                    ? "bg-[#00a884] hover:bg-[#008f72] shadow-sm active:scale-95"
                    : "text-[#aebac1] hover:bg-[#2d3f4b]"
                }`}
              >
                {text.trim() ? (
                  <Send className="w-5 h-5 text-[#111b21]" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </>
        ) : (
          /* Empty Chat state (WhatsApp Style) */
          <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] select-none border-l border-[#222d34]/60">
            <div className="max-w-[460px] text-center px-6">
              <div className="w-[180px] h-[180px] bg-[#1f2c34] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative">
                <MessageSquare className="w-24 h-24 text-[#00a884]/30" />
                <Bot className="w-12 h-12 text-[#a855f7]/30 absolute bottom-6 right-6" />
              </div>
              <h2 className="text-2xl font-light text-[#e9edef] mb-3">
                FlowTalk for Web
              </h2>
              <p className="text-sm text-[#8696a0] leading-relaxed mb-6 font-normal">
                Send and receive messages instantly. Select any chat from the sidebar or click the edit icon to search for new users to start a conversation.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-[#667781] border-t border-[#3b4a54] pt-6 font-light">
                <span>🔒 End-to-end encrypted</span>
                <span>·</span>
                <span>✨ Built-in Groq AI assistant</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Sidebar (slides in next to the chat screen) */}
      {showAI && (
        <div className="w-[360px] shrink-0 border-l border-[#222d34] h-full z-15">
          <AIPanel roomId={room?.id || null} onClose={() => setShowAI(false)} />
        </div>
      )}

      {/* Video call modal */}
      {showCall && room && otherUserId && (
        <VideoCallModal
          room={room}
          user={user}
          otherUserId={otherUserId}
          onClose={() => setShowCall(false)}
        />
      )}
    </div>
  );
}
