import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "FlowTalk — Realtime Chat",
  description: "A premium realtime chat app with AI assistant, WebRTC video calls, and instant messaging",
  keywords: ["chat", "realtime", "AI", "messaging", "video call"],
  authors: [{ name: "FlowTalk" }],
  themeColor: "#6c63ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
