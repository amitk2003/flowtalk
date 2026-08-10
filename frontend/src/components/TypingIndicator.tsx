"use client";

interface TypingIndicatorProps {
  userId: string;
}

export default function TypingIndicator({ userId }: TypingIndicatorProps) {
  const isBot = userId === "AI_BOT";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 0",
        animation: "fadeIn 0.2s ease",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: isBot
            ? "linear-gradient(135deg, var(--color-ai), var(--color-ai-dark))"
            : "linear-gradient(135deg, var(--color-surface-3), var(--color-surface-2))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        {isBot ? "🤖" : "💬"}
      </div>

      {/* Bubble */}
      <div
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          borderBottomLeftRadius: 4,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isBot ? "var(--color-ai)" : "var(--color-text-3)",
              display: "inline-block",
              animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {isBot && (
        <span
          style={{
            fontSize: 11,
            color: "var(--color-ai)",
            fontWeight: 500,
          }}
        >
          FlowBot is thinking...
        </span>
      )}
    </div>
  );
}
