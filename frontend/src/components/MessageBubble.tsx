"use client";

import { Message } from "@/types";

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  isBot?: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusTick({ status }: { status: string }) {
  if (status === "read") {
    return <span style={{ color: "var(--color-accent)", fontSize: 12 }}>✓✓</span>;
  }
  if (status === "delivered") {
    return <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>✓✓</span>;
  }
  return <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>✓</span>;
}

export default function MessageBubble({ msg, isMe, isBot = false }: MessageBubbleProps) {
  const content = msg.content || "";
  const isAI = msg.senderId === "AI_BOT";

  if (isAI) {
    return (
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 8,
          animation: "fadeIn 0.25s ease",
        }}
      >
        {/* Bot avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-ai), var(--color-ai-dark))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
            boxShadow: "var(--shadow-ai)",
            alignSelf: "flex-end",
          }}
        >
          🤖
        </div>

        <div style={{ maxWidth: "72%" }}>
          <div style={{ fontSize: 10, color: "var(--color-ai)", fontWeight: 600, marginBottom: 4, letterSpacing: "0.5px" }}>
            FLOWBOT AI
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(108,99,255,0.08))",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: "var(--radius-lg)",
              borderBottomLeftRadius: 4,
              padding: "10px 14px",
              color: "var(--color-text)",
              fontSize: 13.5,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {content}
          </div>
          <div style={{ fontSize: 10, color: "var(--color-text-3)", marginTop: 4 }}>
            {formatTime(msg.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: 6,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
        <div
          style={{
            padding: "9px 14px",
            borderRadius: isMe
              ? "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)"
              : "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px",
            background: isMe
              ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))"
              : "var(--color-surface-2)",
            border: isMe ? "none" : "1px solid var(--color-border)",
            color: isMe ? "white" : "var(--color-text)",
            fontSize: 13.5,
            lineHeight: 1.55,
            wordBreak: "break-word",
            boxShadow: isMe ? "0 2px 8px var(--color-primary-glow)" : "none",
          }}
        >
          {content || <span style={{ opacity: 0.5, fontStyle: "italic" }}>No content</span>}
        </div>

        {/* Timestamp + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 3,
            color: "var(--color-text-3)",
            fontSize: 10,
          }}
        >
          <span>{formatTime(msg.createdAt)}</span>
          {isMe && <StatusTick status={msg.deliveryStatus} />}
        </div>
      </div>
    </div>
  );
}
