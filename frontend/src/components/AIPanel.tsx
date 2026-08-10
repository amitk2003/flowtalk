"use client";

import { useState, useRef, useEffect } from "react";
import { socket } from "@/lib/socket";
import { AIMessage } from "@/types";

interface AIPanelProps {
  roomId: string | null;
  onClose: () => void;
}

export default function AIPanel({ roomId, onClose }: AIPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-surface)",
        borderLeft: "1px solid var(--color-border)",
        animation: "slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "linear-gradient(135deg, rgba(168,85,247,0.05), rgba(108,99,255,0.05))",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, var(--color-ai), var(--color-ai-dark))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "var(--shadow-ai)",
          }}
        >
          🤖
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              background: "linear-gradient(135deg, var(--color-ai), #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            FlowBot AI
          </p>
          <p style={{ fontSize: 11, color: "var(--color-text-3)" }}>
            Powered by Groq · llama-3.3-70b
          </p>
        </div>
        <button
          id="ai-panel-close"
          className="btn-icon"
          onClick={onClose}
          title="Close AI panel"
        >
          ✕
        </button>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && !loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
              color: "var(--color-text-3)",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-ai), var(--color-ai-dark))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                boxShadow: "var(--shadow-ai)",
                opacity: 0.7,
              }}
            >
              🤖
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 4 }}>
                Ask FlowBot anything
              </p>
              <p style={{ fontSize: 12 }}>
                Summarize chats, draft messages,
                <br />
                explain concepts, and more
              </p>
            </div>
            {/* Suggestion chips */}
            {roomId && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 4 }}>
                {["Summarize this conversation", "Help me draft a reply", "Explain a technical concept"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    style={{
                      padding: "8px 12px",
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--color-text-2)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "var(--transition)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-ai)";
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text-2)";
                    }}
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
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 8,
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                flexShrink: 0,
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))"
                    : "linear-gradient(135deg, var(--color-ai), var(--color-ai-dark))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
              }}
            >
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)" : "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))"
                    : "var(--color-surface-2)",
                border: msg.role === "user" ? "none" : "1px solid var(--color-border)",
                color: msg.role === "user" ? "white" : "var(--color-text)",
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", animation: "fadeIn 0.2s ease" }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--color-ai), var(--color-ai-dark))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              }}
            >
              🤖
            </div>
            <div
              style={{
                padding: "10px 16px",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                borderBottomLeftRadius: 4,
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--color-ai)",
                  display: "inline-block",
                  animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        {!roomId && (
          <p style={{ fontSize: 12, color: "var(--color-text-3)", textAlign: "center", marginBottom: 8 }}>
            Select a chat to enable FlowBot
          </p>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            id="ai-panel-input"
            className="input"
            placeholder={roomId ? "Ask FlowBot... (Enter to send)" : "Select a chat first"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!roomId || loading}
            rows={1}
            style={{
              resize: "none",
              minHeight: 40,
              maxHeight: 120,
              overflowY: "auto",
              lineHeight: 1.5,
            }}
          />
          <button
            id="ai-panel-send"
            className="btn btn-ai"
            onClick={handleAsk}
            disabled={!roomId || !input.trim() || loading}
            style={{ padding: "9px 14px", flexShrink: 0 }}
            title="Ask FlowBot"
          >
            ✨
          </button>
        </div>
      </div>
    </div>
  );
}
