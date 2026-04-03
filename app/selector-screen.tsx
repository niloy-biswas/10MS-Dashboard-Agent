"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart2, Sparkles } from "lucide-react";
import { DashboardSelector } from "@/components/dashboard/dashboard-selector";
import { LogoutButton } from "@/components/auth/logout-button";
import { UserAvatar } from "@/components/auth/user-avatar";
import type { Dashboard, Profile } from "@/lib/types";

interface SelectorScreenProps {
  dashboards: Dashboard[];
  profile: Profile | null;
}

export function SelectorScreen({ dashboards, profile }: SelectorScreenProps) {
  const router = useRouter();

  const handleSelect = (dashboard: Dashboard) => {
    router.push(`/chat/${dashboard.id}`);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <div className="px-8 pt-8 pb-4">
          {/* Brand + profile row */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_18px_rgba(59,130,246,0.35)]">
                <BarChart2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest text-foreground uppercase">10MS Analytics</p>
                <p className="text-[10px] text-muted-foreground">Internal Intelligence</p>
              </div>
            </div>

            {profile && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{profile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{profile.role}</p>
                </div>
                <UserAvatar name={profile.name} avatarUrl={profile.avatar_url} size="sm" />
                <LogoutButton />
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.28)] rounded-full px-3 py-1 text-[11px] text-[#93c5fd] font-medium mb-3">
              <Sparkles className="h-3 w-3" />
              AI-Powered Analytics
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Select a Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Choose a dashboard to start asking questions
            </p>
          </div>

          {/* Selector list */}
          {dashboards.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <BarChart2 className="h-10 w-10 mx-auto opacity-20 mb-3" />
              No dashboards found. Check your Supabase connection.
            </div>
          ) : (
            <DashboardSelector dashboards={dashboards} onSelect={handleSelect} />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border/40 flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground/50">
            {dashboards.length} dashboard{dashboards.length !== 1 ? "s" : ""} available
          </p>
          <p className="text-[10px] text-muted-foreground/40 font-mono">10MS · Internal Only</p>
        </div>
      </motion.div>
    </main>
  );
}
