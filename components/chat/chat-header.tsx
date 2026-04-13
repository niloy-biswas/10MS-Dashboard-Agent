"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Sparkles, Share2, Copy, Check, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Dashboard, ChatSession } from "@/lib/types";

interface ChatHeaderProps {
  dashboard: Dashboard;
  session?: ChatSession;
  sessionNumber?: number;
  sessionTitle?: string;
}

function SharePanel({ session, onClose }: { session: ChatSession; onClose: () => void }) {
  const [isShared, setIsShared] = useState(session.is_shared ?? false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/share/${session.share_token}`;

  const toggle = async () => {
    setLoading(true);
    const res = await fetch("/api/sessions/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, isShared: !isShared }),
    });
    const data = await res.json();
    if (data.success) setIsShared(data.isShared);
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed right-4 top-14 z-[100] w-80 bg-card border border-border rounded-2xl shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Share Session</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl mb-3">
        <div>
          <p className="text-xs font-medium text-foreground">Share with 10MS team</p>
          <p className="text-xs text-muted-foreground mt-0.5">Anyone with an account can view</p>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isShared ? "bg-primary" : "bg-muted-foreground/25"} disabled:opacity-50`}
        >
          <span className={`absolute top-1 h-4 w-4 rounded-full shadow-sm transition-all duration-200 ${isShared ? "bg-white left-6" : "bg-muted-foreground/60 left-1"}`} />
        </button>
      </div>

      {isShared && (
        <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground truncate flex-1">{shareUrl}</p>
          <button
            onClick={copyLink}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

export function ChatHeader({ dashboard, session, sessionNumber, sessionTitle }: ChatHeaderProps) {
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="h-14 shrink-0 px-6 flex items-center justify-between relative">
      {showShare && <div className="fixed inset-0 z-[99]" onClick={() => setShowShare(false)} />}

      <div className="flex items-center gap-3">
        <div className="h-7 min-w-7 px-1.5 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
          <span className="text-primary text-xs font-bold">{dashboard.dashboard_id}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">{dashboard.dashboard_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sessionNumber !== undefined ? (
              <span>Session #{sessionNumber}{sessionTitle && sessionTitle !== "New Chat" ? ` · ${sessionTitle.slice(0, 30)}` : ""}</span>
            ) : dashboard.vertical}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session && (
          <div className="relative">
            <button
              onClick={() => setShowShare((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                session.is_shared
                  ? "text-primary border-primary/30 bg-primary/10"
                  : "text-muted-foreground border-border hover:text-foreground hover:bg-accent"
              }`}
            >
              <Share2 className="h-3 w-3" />
              {session.is_shared ? "Shared" : "Share"}
            </button>
            {showShare && <SharePanel session={session} onClose={() => setShowShare(false)} />}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          AI Intelligence
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ dashboardId, dashboardName, purpose }: { dashboardId: string; dashboardName: string; purpose?: string | null }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center max-w-sm"
      >
        <img
          src="/TenTen Lottie Animation Blink Smile.gif"
          alt="TenTen"
          className="h-24 w-24 object-contain"
        />
        <div>
          <p className="text-xs text-muted-foreground/50 font-mono">{dashboardId}</p>
          <h2 className="text-lg font-semibold text-foreground mt-0.5">
            {dashboardName}
          </h2>
          {purpose && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {purpose}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Ask any analytical question and get TenTen-powered insights instantly.
          </p>
          <p className="text-xs text-muted-foreground/40 mt-3 tracking-wide">
            Built by the creators of TenTen
          </p>
        </div>
      </motion.div>
    </div>
  );
}
