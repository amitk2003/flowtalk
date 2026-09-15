"use client";

import { useEffect, useState } from "react";
import { getMyRooms } from "@/services/roomService";
import { socket } from "@/lib/socket";
import { Room, User } from "@/types";
import UserSearch from "./UserSearch";
import { 
  MessageSquarePlus, 
  LogOut, 
  Search, 
  Bot, 
  Sparkles, 
  Check, 
  CheckCheck,
  User as UserIcon,
  CircleDot
} from "lucide-react";

interface ChatListProps {
  currentUser: User;
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onLogout: () => void;
  onToggleAI: () => void;
  showAI: boolean;
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

export default function ChatList({ 
  currentUser, 
  selectedRoom, 
  onSelectRoom, 
  onLogout,
  onToggleAI,
  showAI
}: ChatListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});

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
      setRooms((prev) => {
        const index = prev.findIndex((r) => r.id === msg.roomId);
        if (index === -1) return prev;
        
        const updated = [...prev];
        updated[index] = { 
          ...updated[index], 
          lastMessagePreview: msg.content,
          lastMessageAt: msg.createdAt 
        };
        return updated.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
      });
    };

    const handleTyping = ({ room: roomId, userId }: { room: string; userId: string }) => {
      if (userId === currentUser.id) return;
      setTypingMap((prev) => ({ ...prev, [roomId]: true }));
      
      const timer = setTimeout(() => {
        setTypingMap((prev) => ({ ...prev, [roomId]: false }));
      }, 2500);
      return () => clearTimeout(timer);
    };

    socket.on("presence:update" as any, handlePresence);
    socket.on("message:new" as any, handleNewMsg);
    socket.on("typing" as any, handleTyping);
    
    return () => {
      socket.off("presence:update" as any, handlePresence);
      socket.off("message:new" as any, handleNewMsg);
      socket.off("typing" as any, handleTyping);
    };
  }, [currentUser.id]);

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

  const getOtherUserId = (room: Room) =>
    room.members?.find((m) => m !== currentUser.id);

  return (
    <>
      <div className="w-[380px] min-w-[380px] h-screen flex flex-col bg-[#111b21] border-r border-[#222d34] select-none">
        {/* Header */}
        <div className="h-[60px] px-4 flex items-center justify-between bg-[#202d33] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-base shadow-sm uppercase">
                {currentUser.name[0]}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#202d33] rounded-full" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-[#e9edef] leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-[#00a884]">My Profile</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleAI}
              className={`p-2 rounded-full transition-all duration-200 hover:bg-[#2d3f4b] relative ${showAI ? 'text-purple-400 bg-purple-500/10' : 'text-[#aebac1]'}`}
              title="FlowBot AI Assistant"
            >
              <Bot className="w-5 h-5" />
              <Sparkles className="w-2.5 h-2.5 absolute top-1 right-1 text-purple-400" />
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-full text-[#aebac1] hover:bg-[#2d3f4b] transition-all duration-200"
              title="Start New Chat"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-full text-[#aebac1] hover:bg-[#2d3f4b] transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search / Filter Section */}
        <div className="p-2 bg-[#111b21] border-b border-[#222d34] shrink-0">
          <div className="relative flex items-center bg-[#202d33] rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-[#8696a0] mr-3" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[#e9edef] outline-none placeholder-[#8696a0]"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto bg-[#111b21]">
          {loading && (
            <div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 px-4 py-3 items-center border-b border-[#222d34]/40">
                  <div className="w-12 h-12 rounded-full bg-[#202d33] animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="w-24 h-3.5 bg-[#202d33] rounded animate-pulse mb-2" />
                    <div className="w-48 h-2.5 bg-[#202d33] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center h-[300px]">
              <CircleDot className="w-12 h-12 text-[#667781] mb-3 animate-pulse" />
              <p className="text-[#e9edef] text-sm font-medium mb-1">
                {searchQuery ? "No matches found" : "No chats yet"}
              </p>
              <p className="text-[#8696a0] text-xs max-w-[200px] mb-4">
                {searchQuery ? "Try searching for a different user name or email." : "Start a private conversation with another user."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="px-4 py-2 bg-[#00a884] hover:bg-[#008f72] text-[#111b21] font-semibold text-xs rounded-full transition-all duration-200 shadow-sm"
                >
                  Find Users
                </button>
              )}
            </div>
          )}

          {filteredRooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            const otherId = getOtherUserId(room);
            const isOnline = otherId ? (onlineMap[otherId] ?? false) : false;
            const roomName = getRoomName(room);
            const isTyping = typingMap[room.id];

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-b border-[#222d34]/40 select-none ${
                  isSelected ? "bg-[#2a3942]" : "hover:bg-[#202d33]"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base uppercase ${
                    room.isPrivate ? "bg-gradient-to-tr from-[#005c4b] to-[#00a884]" : "bg-gradient-to-tr from-purple-700 to-indigo-600"
                  }`}>
                    {room.isPrivate ? roomName[0] : "GP"}
                  </div>
                  {room.isPrivate && (
                    <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#111b21] ${
                      isOnline ? "bg-[#00a884]" : "bg-[#8696a0]"
                    }`} />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm truncate leading-snug ${
                      isSelected ? "text-[#e9edef] font-semibold" : "text-[#e9edef] font-medium"
                    }`}>
                      {roomName}
                    </h3>
                    <span className="text-[11px] text-[#8696a0] shrink-0 font-light">
                      {formatTime(room.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {isTyping ? (
                      <span className="text-xs text-[#00a884] font-medium animate-pulse">typing...</span>
                    ) : (
                      <p className="text-xs text-[#8696a0] truncate max-w-[200px] font-normal leading-normal">
                        {room.lastMessagePreview || "No messages yet"}
                      </p>
                    )}
                    
                    {room.lastMessagePreview && isSelected && (
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0 ml-1.5" />
                    )}
                  </div>
                </div>
              </div>
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
