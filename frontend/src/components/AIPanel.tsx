"use client";

import { useState, useRef, useEffect } from "react";
import { socket } from "@/lib/socket";
import { AIMessage } from "@/types";
import { Sparkles, X, Send, Bot, Loader2 } from "lucide-react";

interface AIPanelProps {
  roomId: string | null;
  onClose: () => void;
}

export default function AIPanel({ roomId, onClose }: AIPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleComplete = ({ text }: { text: string; room: string }) => {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: text, timestamp: new Date() },
      ]);
    };

    socket.on("ai:complete" as any, handleComplete);
    return () => { socket.off("ai:complete" as any, handleComplete); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAsk = () => {
    if (!input.trim() || !roomId || loading) return;

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    socket.emit("ai:ask", { room: roomId, prompt: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#111b21] border-l border-[#222d34] select-none">
      
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[#202d33] border-b border-[#222d34] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-400 leading-tight flex items-center gap-1">
              FlowBot AI <Sparkles className="w-3.5 h-3.5" />
            </h3>
            <p className="text-[10px] text-[#8696a0]">llama-3.3-70b via Groq</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[#2d3f4b] text-[#aebac1] transition-all"
          title="Close AI Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4 text-[#8696a0]">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-2xl shadow-lg opacity-85">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e9edef] mb-1">
                Ask FlowBot Assistant
              </p>
              <p className="text-xs max-w-[200px] leading-relaxed mx-auto">
                FlowBot can summarize your conversation history, help you draft responses, or answer standard queries.
              </p>
            </div>
            
            {roomId && (
              <div className="w-full flex flex-col gap-2 mt-2">
                {[
                  "Summarize this conversation",
                  "Help me draft a friendly reply",
                  "What is a standard HTTP protocol?"
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left w-full px-3 py-2 bg-[#202d33] border border-[#222d34] hover:border-purple-500/40 text-xs rounded-lg text-[#e9edef] transition-all truncate"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 items-end ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center text-xs shrink-0">
                🤖
              </div>
            )}
            <div
              className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-br-none"
                  : "bg-[#202d33] border border-purple-500/15 text-[#e9edef] rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-center justify-start text-[#8696a0]">
            <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center text-xs shrink-0">
              🤖
            </div>
            <div className="flex items-center gap-1 bg-[#202d33] border border-[#222d34] px-4 py-2.5 rounded-full rounded-bl-none">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-xs text-purple-300">FlowBot is typing...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#1e2a30] border-t border-[#222d34] shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={roomId ? "Ask FlowBot AI..." : "Select a room first"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!roomId || loading}
            className="flex-1 bg-[#2a3942] text-[#e9edef] rounded-lg px-3 py-2 text-xs outline-none placeholder-[#8696a0]"
          />
          <button
            onClick={handleAsk}
            disabled={!roomId || !input.trim() || loading}
            className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-full text-white shrink-0 transition-all duration-200"
            title="Ask"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
