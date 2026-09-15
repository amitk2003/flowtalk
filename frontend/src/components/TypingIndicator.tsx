"use client";

interface TypingIndicatorProps {
  userId: string;
}

export default function TypingIndicator({ userId }: TypingIndicatorProps) {
  const isBot = userId === "AI_BOT";

  return (
    <div className="flex gap-2.5 items-end justify-start mb-2.5 animate-bubble max-w-[80%] select-none">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mb-1 ${
        isBot ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-md" : "bg-[#202d33]"
      }`}>
        {isBot ? "🤖" : "💬"}
      </div>
      
      <div className="flex flex-col">
        {isBot && (
          <span className="text-[9px] font-bold text-purple-400 mb-0.5 ml-1.5 tracking-wider uppercase">
            FlowBot AI
          </span>
        )}
        <div className="bg-[#202d33] border border-[#222d34] text-[#e9edef] rounded-xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8696a0] typing-dot" style={{ animationDelay: "0s" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#8696a0] typing-dot" style={{ animationDelay: "0.2s" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#8696a0] typing-dot" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}
