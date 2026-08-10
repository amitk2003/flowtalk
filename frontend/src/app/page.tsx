"use client";

import { useState, useEffect } from "react";
import Login from "@/components/Login";
import ChatWindow from "@/components/ChatWindow";
import { User } from "@/types";

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session from localStorage on page load
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuth = (u: User, token: string, refreshToken: string) => {
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg)",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid rgba(108,99,255,0.2)",
            borderTopColor: "var(--color-primary)",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <p style={{ color: "var(--color-text-3)", fontSize: 13 }}>Loading FlowTalk...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Login onAuth={handleAuth} />;
  }

  return <ChatWindow user={user} onLogout={handleLogout} />;
}
