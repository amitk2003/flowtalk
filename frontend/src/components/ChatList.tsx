"use client";

import { useEffect, useState, useRef } from "react";
import { getMyRooms } from "@/services/roomService";
import { socket } from "@/lib/socket";
import { Room, User } from "@/types";
import UserSearch from "./UserSearch";

interface ChatListProps {
  currentUser: User;
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onLogout: () => void;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatList({ currentUser, selectedRoom, onSelectRoom, onLogout }: ChatListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getMyRooms()
      .then((res) => {
        const data = res.data.data || res.data;
        setRooms(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handlePresence = ({ userId, status }: { userId: string; status: string }) => {
      setOnlineMap((prev) => ({ ...prev, [userId]: status === "online" }));
    };
    const handleNewMsg = (msg: any) => {
      setRooms((prev) =>
        prev
          .map((r) => (r.id === msg.roomId ? { ...r, lastMessageAt: msg.createdAt } : r))
          .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
      );
    };

    socket.on("presence:update" as any, handlePresence);
    socket.on("message:new" as any, handleNewMsg);
    return () => {
      socket.off("presence:update" as any, handlePresence);
      socket.off("message:new" as any, handleNewMsg);
    };
  }, []);

  const handleRoomAdded = (room: Room) => {
    setRooms((prev) => {
      if (prev.find((r) => r.id === room.id)) return prev;
      return [room, ...prev];
    });
    onSelectRoom(room);
  };

  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery.trim()) return true;
    const name = r.isPrivate ? (r.otherUser?.name || "Private Chat") : (r.name || "Group");
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getRoomName = (room: Room) => {
    if (room.isPrivate) return room.otherUser?.name || "Private Chat";
    return room.name || "Group Chat";
  };

  const getRoomInitial = (room: Room) => getRoomName(room)[0]?.toUpperCase() || "?";

  const getOtherUserId = (room: Room) =>
    room.members?.find((m) => m !== currentUser.id);

  return (
    <>
      <div
        style={{
          width: "var(--sidebar-width)",
          minWidth: "var(--sidebar-width)",
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            background: "linear-gradient(180deg, rgba(108,99,255,0.04) 0%, transparent 100%)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* User avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {currentUser.name[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--color-text)" }}>
                  {currentUser.name}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-online)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-online)", display: "inline-block" }} />
                  Online
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                id="new-chat-btn"
                className="btn-icon"
                onClick={() => setShowSearch(true)}
                title="New Chat"
                style={{ fontSize: 18 }}
              >
                ✏️
              </button>
              <button
                id="logout-btn"
                className="btn-icon"
                onClick={onLogout}
                title="Logout"
                style={{ fontSize: 16 }}
              >
                🚪
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              color: "var(--color-text-3)", fontSize: 14, pointerEvents: "none",
            }}>🔍</span>
            <input
              id="chat-list-search"
              className="input"
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 36, fontSize: 13, padding: "8px 12px 8px 34px" }}
            />
          </div>
        </div>

        {/* App brand */}
        <div
          style={{
            padding: "10px 20px 6px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            FlowTalk
          </span>
          <span style={{ color: "var(--color-text-3)", fontSize: 11, marginLeft: "auto" }}>
            {rooms.length} chat{rooms.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Room list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {loading && (
            <div style={{ padding: "8px 12px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px", alignItems: "center" }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: "55%", height: 14, marginBottom: 7 }} />
                    <div className="skeleton" style={{ width: "80%", height: 11 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredRooms.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-3)" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 6 }}>
                {searchQuery ? "No chats match" : "No chats yet"}
              </p>
              {!searchQuery && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowSearch(true)}
                  style={{ marginTop: 8, fontSize: 13 }}
                >
                  ✏️ Start a chat
                </button>
              )}
            </div>
          )}

          {filteredRooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            const otherId = getOtherUserId(room);
            const isOnline = otherId ? (onlineMap[otherId] ?? false) : false;
            const roomName = getRoomName(room);
            const initial = getRoomInitial(room);

            return (
              <button
                key={room.id}
                id={`room-item-${room.id}`}
                onClick={() => onSelectRoom(room)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(108,99,255,0.08))"
                    : "transparent",
                  border: "none",
                  borderLeft: isSelected ? "3px solid var(--color-primary)" : "3px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--color-text)",
                  transition: "var(--transition)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--color-surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: room.isPrivate
                        ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))"
                        : "linear-gradient(135deg, var(--color-success), #06b6d4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                      fontWeight: 700,
                      color: "white",
                      boxShadow: isSelected ? "var(--shadow-primary)" : "none",
                      transition: "var(--transition)",
                    }}
                  >
                    {room.isPrivate ? initial : "👥"}
                  </div>
                  {room.isPrivate && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 1,
                        right: 1,
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        background: isOnline ? "var(--color-online)" : "var(--color-offline)",
                        border: "2px solid var(--color-surface)",
                        transition: "var(--transition)",
                      }}
                    />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <p
                      style={{
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: 14,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                      }}
                    >
                      {roomName}
                    </p>
                    <span style={{ color: "var(--color-text-3)", fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                      {formatTime(room.lastMessageAt)}
                    </span>
                  </div>
                  <p style={{
                    color: "var(--color-text-3)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {isOnline && room.isPrivate ? "● Online" : "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showSearch && (
        <UserSearch onRoomSelect={handleRoomAdded} onClose={() => setShowSearch(false)} />
      )}
    </>
  );
}
