"use client";

import { motion } from "framer-motion";
import { Sparkles, LayoutDashboard } from "lucide-react";
import type { Dashboard } from "@/lib/types";

interface ChatHeaderProps {
  dashboard: Dashboard;
  sessionNumber?: number;
  sessionTitle?: string;
}

export function ChatHeader({ dashboard, sessionNumber, sessionTitle }: ChatHeaderProps) {
  return (
    <div className="h-14 shrink-0 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-7 min-w-7 px-1.5 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
          <span className="text-primary text-xs font-bold">{dashboard.dashboard_id}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">{dashboard.dashboard_name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {sessionNumber !== undefined ? (
              <span>Session #{sessionNumber}{sessionTitle && sessionTitle !== "New Chat" ? ` · ${sessionTitle.slice(0, 30)}` : ""}</span>
            ) : dashboard.vertical}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-white/[0.08] rounded-full px-3 py-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        AI Assistant
      </div>
    </div>
  );
}

export function EmptyState({ dashboardId, dashboardName }: { dashboardId: string; dashboardName: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center max-w-sm"
      >
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <LayoutDashboard className="h-7 w-7 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary/90 flex items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Ask about Dashboard {dashboardId}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {dashboardName} is loaded. Ask any analytical question and get AI-powered insights instantly.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
