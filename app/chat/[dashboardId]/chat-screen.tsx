"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ChatHeader, EmptyState } from "@/components/chat/chat-header";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { useChat } from "@/hooks/use-chat";
import type { Dashboard, Profile, ChatMessage, ChatSession } from "@/lib/types";

interface ChatScreenProps {
  dashboard: Dashboard;
  profile: Profile | null;
  session: ChatSession;
  sessions: ChatSession[];
  initialMessages: ChatMessage[];
}

export function ChatScreen({ dashboard, profile, session, sessions, initialMessages }: ChatScreenProps) {
  const router = useRouter();
  const { messages, isStreaming, error, sendMessage } = useChat(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const [localSessions, setLocalSessions] = useState<ChatSession[]>(sessions);

  useEffect(() => {
    const isNewMessage = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    bottomRef.current?.scrollIntoView({
      behavior: isNewMessage ? "smooth" : "instant",
    });
  }, [messages]);

  const handleSend = (text: string) => {
    // Optimistically update sidebar title on first message
    if (messages.length === 0) {
      setLocalSessions((prev) =>
        prev.map((s) => s.id === session.id ? { ...s, title: text.slice(0, 60) } : s)
      );
    }
    sendMessage({
      session_id: session.id,
      dashboard_id: dashboard.id,
      dashboard_number: dashboard.dashboard_id,
      dashboard_name: dashboard.dashboard_name,
      user: profile
        ? { id: profile.id, name: profile.name, email: profile.email, role: profile.role }
        : null,
      message: text,
    });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080a0f" }}>
      {/* Sidebar */}
      <DashboardSidebar
        dashboard={dashboard}
        profile={profile}
        sessions={localSessions}
        currentSessionNumber={session.session_number}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Gradient background with ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, #0d1120 0%, #090b14 45%, #080a0f 100%)" }}
          />
          <div className="absolute -top-20 right-1/3 w-[500px] h-[400px] rounded-full bg-primary/[0.07] blur-[120px]" />
          <div className="absolute bottom-1/4 -left-10 w-[400px] h-[400px] rounded-full bg-[#4f8ef7]/[0.06] blur-[110px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#1a1f3a]/30 blur-[80px]" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center border-b border-white/[0.06] bg-black/20 backdrop-blur-md">
          <button
            onClick={() => router.push("/")}
            className="h-14 px-4 flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors border-r border-white/[0.06]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <ChatHeader dashboard={dashboard} sessionNumber={session.session_number} sessionTitle={session.title} />
          </div>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden relative z-10"
            >
              <div className="flex items-center gap-2 px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState dashboardId={dashboard.dashboard_id} dashboardName={dashboard.dashboard_name} purpose={dashboard.purpose} />
          ) : (
            <div className="px-6 py-6 flex flex-col gap-5 max-w-3xl mx-auto w-full">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {isEmpty && (
          <div className="relative z-10">
            <SuggestedPrompts dashboardName={dashboard.dashboard_name} onSelect={handleSend} />
          </div>
        )}

        <div className="relative z-10">
          <ChatInput
            onSend={handleSend}
            isStreaming={isStreaming}
            placeholder={`Ask about ${dashboard.dashboard_name}…`}
          />
        </div>
      </div>
    </div>
  );
}
