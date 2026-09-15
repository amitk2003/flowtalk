"use client";

import { useState, useEffect } from "react";
import { login, register } from "@/services/authService";
import { User } from "@/types";

interface LoginProps {
  onAuth: (user: User, token: string, refreshToken: string) => void;
}

export default function Login({ onAuth }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = isRegister
        ? await register(name, email, password)
        : await login(email, password);

      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      onAuth(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at top left, rgba(108,99,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.1) 0%, transparent 60%), var(--color-bg)",
      padding: "16px",
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", top: "15%", left: "10%", width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)",
          animation: "gradientShift 8s ease infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "5%", width: 300, height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(26,30,42,0.8)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "var(--radius-xl)",
        padding: "40px 36px",
        backdropFilter: "blur(30px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        animation: "scaleIn 0.35s cubic-bezier(0.4,0,0.2,1)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56, height: 56,
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
            boxShadow: "0 8px 24px var(--color-primary-glow)",
            marginBottom: 16,
            fontSize: 26,
          }}>
            💬
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28, fontWeight: 700,
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.5px",
          }}>FlowTalk</h1>
          <p style={{ color: "var(--color-text-3)", fontSize: 13, marginTop: 4 }}>
            {isRegister ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            marginBottom: 20,
            color: "#f87171",
            fontSize: 13,
            animation: "fadeIn 0.2s ease",
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isRegister && (
            <div>
              <label style={{ display: "block", color: "var(--color-text-2)", fontSize: 12, fontWeight: 500, marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Full Name
              </label>
              <input
                id="login-name"
                className="input"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", color: "var(--color-text-2)", fontSize: 12, fontWeight: 500, marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Email
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--color-text-2)", fontSize: 12, fontWeight: 500, marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder={isRegister ? "Min. 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-text-3)", fontSize: 16, padding: 2,
                  display: "flex", alignItems: "center",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 8, padding: "12px", fontSize: 15, fontWeight: 600 }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />
                {isRegister ? "Creating account..." : "Signing in..."}
              </span>
            ) : (
              isRegister ? "Create Account" : "Sign In"
            )}
          </button>
        </form>

        {/* Guest Demo Credentials */}
        {!isRegister && (
          <div style={{
            marginTop: 20,
            padding: "12px 14px",
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            <p style={{ color: "var(--color-text-2)", fontSize: 11, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, fontWeight: 500 }}>
              ⚡ Quick Demo Login
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                id="demo-guest-1"
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEmail("abcdef@gmai.com");
                  setPassword("Ambrt@2345");
                }}
                style={{ flex: 1, padding: "8px", fontSize: 12 }}
              >
                👤 Guest 1
              </button>
              <button
                id="demo-guest-2"
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEmail("docker@gmai.com");
                  setPassword("fucj@2378");
                }}
                style={{ flex: 1, padding: "8px", fontSize: 12 }}
              >
                👤 Guest 2
              </button>
            </div>
          </div>
        )}

        <div style={{
          marginTop: 24, textAlign: "center",
          borderTop: "1px solid var(--color-border)",
          paddingTop: 20,
        }}>
          <span style={{ color: "var(--color-text-3)", fontSize: 13 }}>
            {isRegister ? "Already have an account? " : "New to FlowTalk? "}
          </span>
          <button
            id="login-toggle"
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-primary)", fontSize: 13, fontWeight: 600,
              textDecoration: "underline", textUnderlineOffset: "3px",
            }}
          >
            {isRegister ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
