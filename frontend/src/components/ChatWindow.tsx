import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { fetchMessages } from "@/services/messageService";
import ChatList from "./ChatList";
import MessageBubble from "./MessageBubble";
import VideoCallModal from "./VideoCallModal";


export default function ChatWindow({ user }: any) {
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [showCall, setShowCall] = useState(false);
const [aiInput, setAiInput] = useState("");
const [aiResponse, setAiResponse] = useState("");

useEffect(() => {
  socket.on("ai:stream", ({ text }) => {
    setAiResponse((prev) => prev + text);
  });

  socket.on("ai:complete", ({ text }) => {
    setAiResponse(text);
  });
}, []);
const askAI = () => {
  setAiResponse(""); // clear old response

  socket.emit("ai:ask", {
    room: room._id,
    userId: user._id,
    prompt: aiInput,
  });
};


  useEffect(() => {
    socket.connect();
    socket.emit("user:online", { userId: user._id });
  }, []);

  useEffect(() => {
    if (!room) return;

    socket.emit("joinRoom", { room: room._id });

    fetchMessages(room._id).then((res) => setMessages(res.data));

    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);

      // Mark delivered
      socket.emit("message:delivered", { messageId: msg._id });
    });

    return () => {
      socket.emit("leaveRoom", { room: room._id });
    };
  }, [room]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("message:send", {
      room: room._id,
      senderId: user._id,
      text,
    });
    setText("");
  };

  return (
    <div className="flex h-screen">
      <ChatList onSelectRoom={setRoom} />

      <div className="w-2/3 flex flex-col">
        {room ? (
          <>
            <div className="bg-blue-600 text-white p-4 flex justify-between">
              <span>Chat Room</span>
              <button
                className="bg-green-500 px-3 py-1 rounded"
                onClick={() => setShowCall(true)}
              >
                📞 Video Call
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((m) => (
                <MessageBubble
                  key={m._id}
                  msg={m}
                  isMe={m.senderId === user._id}
                />
              ))}
            </div>

            <div className="p-4 bg-white flex">
              <input
                className="flex-1 border p-2"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="ml-2 bg-blue-500 text-white px-4"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>

            {showCall && (
              <VideoCallModal
                room={room}
                user={user}
                onClose={() => setShowCall(false)}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            Select a chat to start messaging
          </div>
        )}
      </div>
      <div className="w-1/3 border-l p-4 bg-gray-50">
  <h3 className="font-bold mb-2">AI Assistant (Real-Time)</h3>

  <textarea
    className="w-full border p-2 rounded"
    placeholder="Ask AI anything..."
    value={aiInput}
    onChange={(e) => setAiInput(e.target.value)}
  />

  <button
    className="bg-purple-600 text-white px-3 py-1 mt-2 rounded"
    onClick={askAI}
  >
    Ask AI
  </button>

  <div className="mt-3 p-2 bg-white border rounded min-h-[120px]">
    <p className="whitespace-pre-wrap">{aiResponse || "AI response will appear here..."}</p>
  </div>
</div>


    </div>
  );
}
