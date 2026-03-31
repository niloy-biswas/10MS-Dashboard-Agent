"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ChatHeader, EmptyState } from "@/components/chat/chat-header";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { useChat } from "@/hooks/use-chat";
import type { Dashboard, Profile, ChatMessage } from "@/lib/types";

interface ChatScreenProps {
  dashboard: Dashboard;
  profile: Profile | null;
  initialMessages: ChatMessage[];
}

export function ChatScreen({ dashboard, profile, initialMessages }: ChatScreenProps) {
  const router = useRouter();
  const { messages, isStreaming, error, sendMessage, clearMessages } = useChat(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    sendMessage({
      dashboard_id: dashboard.id,
      dashboard_number: dashboard.dashboard_id,
      dashboard_name: dashboard.dashboard_name,
      user: profile
        ? { id: profile.id, name: profile.name, email: profile.email, role: profile.role }
        : null,
      message: text,
      history: messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content })),
    });
  };

  const handleClear = async () => {
    if (!profile) return clearMessages();
    await fetch("/api/chat/clear", {
      method: "POST",
      body: JSON.stringify({ dashboardId: dashboard.id, profileId: profile.id }),
    });
    clearMessages();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar dashboard={dashboard} profile={profile} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Back nav + header */}
        <div className="flex items-center border-b border-border/50 bg-card/60 backdrop-blur-sm">
          <button
            onClick={() => router.push("/")}
            className="h-14 px-4 flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors border-r border-border/40"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <ChatHeader dashboard={dashboard} />
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="h-14 px-4 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors border-l border-border/40"
            >
              Clear
            </button>
          )}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState
              dashboardId={dashboard.dashboard_id}
              dashboardName={dashboard.dashboard_name}
            />
          ) : (
            <div className="px-6 py-5 flex flex-col gap-5 max-w-3xl mx-auto w-full">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Suggested prompts — only when empty */}
        {isEmpty && (
          <SuggestedPrompts
            dashboardName={dashboard.dashboard_name}
            onSelect={handleSend}
          />
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          placeholder={`Ask a question about Dashboard ${dashboard.dashboard_id}…`}
        />
      </div>
    </div>
  );
}
