"use client";

import { Message } from "@/types";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  isBot?: boolean;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusTicks({ status }: { status: string }) {
  if (status === "read") {
    return <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />;
  }
  return <Check className="w-3.5 h-3.5 text-[#8696a0]" />;
}

export default function MessageBubble({ msg, isMe, isBot = false }: MessageBubbleProps) {
  const content = msg.content || "";
  const isAI = msg.senderId === "AI_BOT";

  if (isAI) {
    return (
      <div className="flex gap-2.5 items-end justify-start mb-2.5 animate-bubble max-w-[85%] sm:max-w-[70%]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-sm shadow-md shrink-0 mb-1">
          🤖
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-purple-400 mb-1 ml-1.5 tracking-wider uppercase">
            FlowBot AI
          </span>
          <div className="bg-[#1f1a30] border border-purple-500/20 text-[#e9edef] rounded-2xl rounded-tl-none px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm">
            <p className="whitespace-pre-wrap break-words">{content}</p>
            <div className="flex justify-end items-center gap-1 mt-1.5 text-[9px] text-purple-300/60 font-light">
              <span>{formatTime(msg.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-2.5 animate-bubble ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] px-3 py-1.5 shadow-sm text-[13.5px] leading-relaxed ${
          isMe
            ? "bg-[#005c4b] text-[#e9edef] rounded-lg rounded-tr-none"
            : "bg-[#202d33] text-[#e9edef] rounded-lg rounded-tl-none"
        }`}
      >
        <p className="whitespace-pre-wrap break-words pr-12 pb-1.5">
          {content}
        </p>
        
        {/* Align Time & Status Info beautifully inside the bubble corner */}
        <div className="absolute right-2 bottom-1 flex items-center gap-1 text-[10px] text-[#8696a0]/80 font-light select-none">
          <span>{formatTime(msg.createdAt)}</span>
          {isMe && <StatusTicks status={msg.deliveryStatus} />}
        </div>
      </div>
    </div>
  );
}
