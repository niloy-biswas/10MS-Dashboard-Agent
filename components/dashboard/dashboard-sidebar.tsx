"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart2, Filter, Info, ExternalLink, Clock, Plus, MessageSquare } from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "@/components/auth/logout-button";
import { UserAvatar } from "@/components/auth/user-avatar";
import type { Dashboard, Profile, ChatSession } from "@/lib/types";

// ── Collapsible section ──────────────────────────────────

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarSection({ title, icon, children, defaultOpen = false }: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <span className="text-primary">{icon}</span>
          {title}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 border-t border-border/40">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Profile card ──────────────────────────────────────────

function ProfileCard({ profile }: { profile: Profile | null }) {
  if (!profile) return null;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50">
      <UserAvatar name={profile.name} avatarUrl={profile.avatar_url} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
        <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
      </div>
    </div>
  );
}

// ── Sessions panel ────────────────────────────────────────

interface SessionsPanelProps {
  sessions: ChatSession[];
  currentSessionNumber: number;
  dashboardUuid: string;
  dashboardShortId: string;
  profileId: string;
}

function SessionsPanel({ sessions, currentSessionNumber, dashboardUuid, dashboardShortId, profileId }: SessionsPanelProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleNewChat = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardId: dashboardUuid, profileId }),
      });
      const data = await res.json();
      if (data.sessionNumber) {
        router.push(`/chat/${dashboardShortId}/${data.sessionNumber}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 px-3 py-3 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground/50 uppercase">
          Chat History
        </p>
        <button
          onClick={handleNewChat}
          disabled={creating}
          title="New Chat"
          className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
        >
          {creating ? (
            <span className="h-2.5 w-2.5 rounded-full border border-primary/50 border-t-primary animate-spin" />
          ) : (
            <Plus className="h-2.5 w-2.5" />
          )}
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 space-y-0.5 overflow-y-auto pr-0.5">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 px-2 py-2">No sessions yet</p>
        ) : (
          sessions.map((s) => {
            const isActive = s.session_number === currentSessionNumber;
            return (
              <button
                key={s.id}
                onClick={() => router.push(`/chat/${dashboardShortId}/${s.session_number}`)}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group ${
                  isActive
                    ? "bg-primary/12 border border-primary/20 text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border border-transparent"
                }`}
              >
                <MessageSquare className={`h-3 w-3 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"}`} />
                <span className="flex-1 min-w-0">
                  <span className="truncate text-xs block leading-tight">
                    {s.title === "New Chat" ? (
                      <span className="text-muted-foreground/60">New Chat</span>
                    ) : s.title}
                  </span>
                  <span className={`text-[10px] ${isActive ? "text-primary/60" : "text-muted-foreground/40"}`}>
                    #{s.session_number}
                  </span>
                </span>
                {isActive && (
                  <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main sidebar ──────────────────────────────────────────

interface DashboardSidebarProps {
  dashboard: Dashboard;
  profile: Profile | null;
  sessions?: ChatSession[];
  currentSessionNumber?: number;
}

export function DashboardSidebar({ dashboard, profile, sessions = [], currentSessionNumber = 1 }: DashboardSidebarProps) {
  return (
    <aside className="w-64 shrink-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0">
            <Image src="/10ms-logo.png" alt="10MS" width={28} height={28} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground tracking-wide">10MS ANALYTICS</p>
            <p className="text-[10px] text-muted-foreground">Internal Intelligence</p>
          </div>
        </div>
      </div>

      {/* Active dashboard info */}
      <div className="px-4 py-4 border-b border-border/40">
        <p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground/50 uppercase mb-2">
          Active Dashboard
        </p>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 min-w-8 px-1.5 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <span className="text-primary text-xs font-bold">{dashboard.dashboard_id}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">{dashboard.dashboard_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{dashboard.vertical}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {dashboard.refresh_window && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
              <Clock className="h-2.5 w-2.5" />
              {dashboard.refresh_window}
            </span>
          )}
          {dashboard.link && (
            <a
              href={dashboard.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 bg-primary/10 rounded-full px-2 py-0.5 transition-colors"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              View
            </a>
          )}
        </div>
      </div>

      {/* Sessions panel */}
      {profile && (
        <SessionsPanel
          sessions={sessions}
          currentSessionNumber={currentSessionNumber}
          dashboardUuid={dashboard.id}
          dashboardShortId={dashboard.dashboard_id}
          profileId={profile.id}
        />
      )}

      {/* Dashboard info sections */}
      <div className="shrink-0 px-3 py-4 flex flex-col gap-2">
        {dashboard.description && (
          <SidebarSection title="Overview" icon={<Info className="h-3.5 w-3.5" />} defaultOpen>
            <p className="text-xs text-muted-foreground leading-relaxed">{dashboard.description}</p>
            {dashboard.purpose && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                <span className="text-foreground/70 font-medium">Purpose: </span>
                {dashboard.purpose}
              </p>
            )}
          </SidebarSection>
        )}
        {dashboard.available_metrics && dashboard.available_metrics.length > 0 && (
          <SidebarSection title="Available Metrics" icon={<BarChart2 className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dashboard.available_metrics.map((m) => (
                <span key={m} className="text-[10px] bg-accent text-accent-foreground rounded-full px-2 py-0.5 border border-border/50">{m}</span>
              ))}
            </div>
          </SidebarSection>
        )}
        {dashboard.available_filters && dashboard.available_filters.length > 0 && (
          <SidebarSection title="Available Filters" icon={<Filter className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dashboard.available_filters.map((f) => (
                <span key={f} className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 border border-border/50">{f}</span>
              ))}
            </div>
          </SidebarSection>
        )}
      </div>

      {/* Profile + logout */}
      <div className="px-3 pb-4 pt-3 border-t border-border/40 space-y-2">
        {profile && <ProfileCard profile={profile} />}
        <LogoutButton variant="full" />
      </div>
    </aside>
  );
}
