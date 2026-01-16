"use client";

import { useState } from "react";
import Login from "@/components/Login";
import ChatWindow from "@/components/ChatWindow";

export default function Page() {
  const [user, setUser] = useState<any>(null);

  if (!user) {
    return <Login onAuth={(u) => setUser(u)} />;
  }

  return <ChatWindow user={user} />;
}
