"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchUsers } from "@/services/userService";
import { createPrivateRoom } from "@/services/roomService";
import { User, Room } from "@/types";
import { Search, X, UserPlus, Loader2 } from "lucide-react";

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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[420px] bg-[#111b21] border border-[#222d34] rounded-xl overflow-hidden shadow-2xl animate-bubble">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222d34] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-[#e9edef] tracking-wide">
              New Chat
            </h3>
            <p className="text-xs text-[#8696a0] mt-0.5">
              Find contacts by name or email
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#2d3f4b] text-[#aebac1] transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input area */}
        <div className="p-4">
          <div className="relative flex items-center bg-[#202d33] rounded-lg px-3 py-2 border border-[#222d34] focus-within:border-[#00a884] transition-all">
            <Search className="w-4 h-4 text-[#8696a0] mr-2.5 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-[#e9edef] outline-none placeholder-[#8696a0]"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto px-2 pb-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-[#00a884] animate-spin" />
              <span className="text-xs text-[#8696a0]">Searching contacts...</span>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-10 text-[#8696a0]">
              <p className="text-sm">No contacts found for "{query}"</p>
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-10 text-[#8696a0] flex flex-col items-center justify-center gap-2 select-none">
              <UserPlus className="w-10 h-10 text-[#667781] stroke-[1.2]" />
              <p className="text-xs">Type a name or email address above</p>
            </div>
          )}

          {!loading && results.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleStartChat(contact)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-[#202d33] transition-all group border-b border-[#222d34]/20"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#005c4b] to-[#00a884] flex items-center justify-center font-semibold text-white uppercase">
                  {contact.name[0]}
                </div>
                {contact.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] border border-[#111b21] rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[#e9edef] truncate">
                  {contact.name}
                </h4>
                <p className="text-xs text-[#8696a0] truncate mt-0.5">
                  {contact.email}
                </p>
              </div>
              
              {creating === contact.id ? (
                <Loader2 className="w-4 h-4 text-[#00a884] animate-spin" />
              ) : (
                <span className="text-[11px] text-[#00a884] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Chat
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
