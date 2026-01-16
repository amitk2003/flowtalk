import { useEffect, useState } from "react";
import { getMyRooms } from "@/services/roomService";

export default function ChatList({ onSelectRoom }: any) {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    getMyRooms().then((res) => setRooms(res.data));
  }, []);

  return (
    <div className="w-1/3 bg-white border-r h-screen overflow-y-auto">
      <h2 className="p-4 font-bold text-lg bg-gray-100">Chats</h2>

      {rooms.map((room) => (
        <div
          key={room._id}
          className="p-4 border-b hover:bg-gray-100 cursor-pointer"
          onClick={() => onSelectRoom(room)}
        >
          <p className="font-semibold">
            {room.isPrivate ? "Private Chat" : room.name || "Group"}
          </p>
          <p className="text-sm text-gray-500">
            {room.lastMessage?.text || "No messages yet"}
          </p>
        </div>
      ))}
    </div>
  );
}
