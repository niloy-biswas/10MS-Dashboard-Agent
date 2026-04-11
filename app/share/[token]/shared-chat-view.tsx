"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import type { Dashboard, ChatSession, ChatMessage } from "@/lib/types";

interface SharedChatViewProps {
  session: ChatSession;
  dashboard: Dashboard;
  messages: ChatMessage[];
}

export function SharedChatView({ session, dashboard, messages }: SharedChatViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen dark:bg-[#080a0f]">
      {/* Header */}
      <div className="flex items-center border-b border-border bg-card/80 backdrop-blur-md shrink-0">
        <button
          onClick={() => router.push("/")}
          className="h-14 px-4 flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-r border-border"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="h-7 min-w-7 px-1.5 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">{dashboard.dashboard_id}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">{dashboard.dashboard_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Session #{session.session_number}{session.title !== "New Chat" ? ` · ${session.title.slice(0, 30)}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5">
              <Lock className="h-3 w-3" />
              Read-only · 10MS Internal
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages in this session.
          </div>
        ) : (
          <div className="px-6 py-6 flex flex-col gap-5 max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} readOnly />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}