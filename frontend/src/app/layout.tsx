import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Realtime Chat App",
  description: "WhatsApp-like chat app with WebSockets and WebRTC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 min-h-screen`}>
        {/* Optional Top Bar (you can remove if you don’t want it) */}
        <header className="bg-blue-600 text-white p-4 text-center font-semibold shadow-md">
          Realtime Chat Application
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
