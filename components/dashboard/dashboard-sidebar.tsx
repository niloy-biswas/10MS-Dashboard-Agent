"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart2, Filter, Info, ExternalLink, Clock } from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import type { Dashboard, Profile } from "@/lib/types";

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
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
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

interface ProfileCardProps {
  profile: Profile | null;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  if (!profile) return null;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50">
      <div className="shrink-0 h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
        <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
      </div>
    </div>
  );
}

interface DashboardSidebarProps {
  dashboard: Dashboard;
  profile: Profile | null;
}

export function DashboardSidebar({ dashboard, profile }: DashboardSidebarProps) {
  return (
    <aside className="w-64 shrink-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-black">10</span>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground tracking-wide">10MS ANALYTICS</p>
            <p className="text-[10px] text-muted-foreground">Internal Intelligence</p>
          </div>
        </div>
      </div>

      {/* Selected dashboard header */}
      <div className="px-4 py-4 border-b border-border/40">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">
          Active Dashboard
        </p>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <span className="text-primary text-xs font-bold">{dashboard.dashboard_id}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">{dashboard.dashboard_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{dashboard.vertical}</p>
          </div>
        </div>

        {/* Quick meta pills */}
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

      {/* Expandable sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2">
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
                <span
                  key={m}
                  className="text-[10px] bg-accent text-accent-foreground rounded-full px-2 py-0.5 border border-border/50"
                >
                  {m}
                </span>
              ))}
            </div>
          </SidebarSection>
        )}

        {dashboard.available_filters && dashboard.available_filters.length > 0 && (
          <SidebarSection title="Available Filters" icon={<Filter className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dashboard.available_filters.map((f) => (
                <span
                  key={f}
                  className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 border border-border/50"
                >
                  {f}
                </span>
              ))}
            </div>
          </SidebarSection>
        )}
      </div>

      {/* Profile + logout at bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-border/40 space-y-2">
        {profile && <ProfileCard profile={profile} />}
        <LogoutButton variant="full" />
      </div>
    </aside>
  );
}
