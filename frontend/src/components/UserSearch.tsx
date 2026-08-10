"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchUsers } from "@/services/userService";
import { createPrivateRoom } from "@/services/roomService";
import { User, Room } from "@/types";

interface UserSearchProps {
  onRoomSelect: (room: Room) => void;
  onClose: () => void;
}

export default function UserSearch({ onRoomSelect, onClose }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(q);
        setResults(res.data.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleStartChat = async (user: User) => {
    setCreating(user.id);
    try {
      const res = await createPrivateRoom(user.id);
      const room = res.data.data || res.data;
      onRoomSelect({ ...room, otherUser: user });
      onClose();
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
          animation: "scaleIn 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 600,
                color: "var(--color-text)",
                marginBottom: 2,
              }}
            >
              New Chat
            </h3>
            <p style={{ color: "var(--color-text-3)", fontSize: 12 }}>
              Search for a user to start messaging
            </p>
          </div>
          <button id="user-search-close" className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-3)",
                fontSize: 16,
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              ref={inputRef}
              id="user-search-input"
              className="input"
              type="text"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "0 12px 12px" }}>
          {loading && (
            <div style={{ padding: "20px", textAlign: "center" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    marginBottom: 4,
                  }}
                >
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: "80%", height: 11 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 20px",
                color: "var(--color-text-3)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 14 }}>No users found for "{query}"</p>
            </div>
          )}

          {!loading && !query && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 20px",
                color: "var(--color-text-3)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
              <p style={{ fontSize: 13 }}>Start typing to search users</p>
            </div>
          )}

          {results.map((user) => (
            <button
              key={user.id}
              id={`user-result-${user.id}`}
              onClick={() => handleStartChat(user)}
              disabled={creating === user.id}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                textAlign: "left",
                transition: "var(--transition)",
                color: "var(--color-text)",
                marginBottom: 2,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  {user.name[0].toUpperCase()}
                </div>
                {/* Online dot */}
                {user.isOnline && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--color-online)",
                      border: "2px solid var(--color-surface)",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </p>
                <p style={{ color: "var(--color-text-3)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.email}
                </p>
              </div>

              {creating === user.id ? (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "2px solid var(--color-border)",
                  borderTopColor: "var(--color-primary)",
                  animation: "spin 0.7s linear infinite",
                  flexShrink: 0,
                }} />
              ) : (
                <span style={{ color: "var(--color-primary)", fontSize: 18, flexShrink: 0 }}>💬</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
