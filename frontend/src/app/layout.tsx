import "./globals.css";
import type { Metadata, Viewport } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "FlowTalk — Realtime Chat",
  description: "A premium realtime chat app with AI assistant, WebRTC video calls, and instant messaging",
  keywords: ["chat", "realtime", "AI", "messaging", "video call"],
  authors: [{ name: "FlowTalk" }],
};

export const viewport: Viewport = {
  themeColor: "#6c63ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
