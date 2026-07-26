"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Sheet,
  Sparkles,
  Users,
  Database,
  Bot,
  Lock,
  Settings,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { UserAvatar } from "@/components/auth/user-avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BRAND } from "@/lib/brand";
import type { Profile } from "@/lib/types";

interface AdminLayoutShellProps {
  profile: Profile;
  isAdmin: boolean;
  children: ReactNode;
}

function getAdminSectionTitle(pathname: string): string {
  if (pathname === "/admin") return "Overview";
  if (pathname.startsWith("/admin/dashboards/new")) return "New dashboard";
  if (pathname.startsWith("/admin/dashboards")) return "Dashboard registry";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/settings/data-sources")) return "Data sources";
  if (pathname.startsWith("/admin/settings/models")) return "AI models";
  if (pathname.startsWith("/admin/settings/auth")) return "Auth";
  if (pathname.startsWith("/admin/settings/users")) return "Users";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Workspace admin";
}

function AdminNavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: ReactNode;
}) {
  const active =
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
        active
          ? "bg-primary/12 border border-primary/20 text-foreground"
          : "text-foreground/80 hover:bg-accent/50 hover:text-foreground border border-transparent"
      }`}
    >
      {children}
    </Link>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
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

export function AdminLayoutShell({ profile, isAdmin, children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const title = getAdminSectionTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden dark:bg-[#080a0f]">
      <aside className="w-64 shrink-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
        <div className="px-5 py-5 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0">
              <Image src="/10ms-logo.png" alt="10MS" width={28} height={28} className="object-cover w-full h-full" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground tracking-wide uppercase">{BRAND.name}</p>
              <p className="text-xs text-muted-foreground">{BRAND.productLabel}</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-border/40 flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground/50 uppercase mb-2 px-1">
              Workspace
            </p>
            <nav className="flex flex-col gap-0.5">
              <AdminNavLink href="/admin" pathname={pathname}>
                <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Overview
              </AdminNavLink>
              <AdminNavLink href="/admin/dashboards" pathname={pathname}>
                <Sheet className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Dashboard registry
              </AdminNavLink>
              <AdminNavLink href="/admin/users" pathname={pathname}>
                <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                Users
              </AdminNavLink>
            </nav>
          </div>

          {isAdmin ? (
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground/50 uppercase mb-2 px-1">
                Settings
              </p>
              <nav className="flex flex-col gap-0.5">
                <AdminNavLink href="/admin/settings/data-sources" pathname={pathname}>
                  <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  Data sources
                </AdminNavLink>
                <AdminNavLink href="/admin/settings/models" pathname={pathname}>
                  <Bot className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  AI models
                </AdminNavLink>
                <AdminNavLink href="/admin/settings/auth" pathname={pathname}>
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  Auth
                </AdminNavLink>
              </nav>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-2 leading-relaxed">
              Settings are restricted to admins. Ask an admin for model or data-source changes.
            </p>
          )}
        </div>

        <div className="px-3 pb-4 pt-3 border-t border-border/40 space-y-2 shrink-0">
          <ProfileCard profile={profile} />
          <LogoutButton variant="full" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 hidden dark:block"
            style={{
              background: "linear-gradient(160deg, #0d1120 0%, #090b14 45%, #080a0f 100%)",
            }}
          />
          <div className="absolute -top-20 right-1/3 w-[500px] h-[400px] rounded-full bg-primary/[0.07] blur-[120px]" />
          <div className="absolute bottom-1/4 -left-10 w-[400px] h-[400px] rounded-full bg-[#4f8ef7]/[0.06] blur-[110px]" />
        </div>

        <header className="relative z-10 shrink-0 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 min-w-7 px-1.5 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                <Settings className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none truncate">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Workspace administration</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <Link
                href="/app"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Chat home
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5">
                <Sparkles className="h-3 w-3 text-primary shrink-0" />
                AI Intelligence
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 xl:p-10">
          <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
