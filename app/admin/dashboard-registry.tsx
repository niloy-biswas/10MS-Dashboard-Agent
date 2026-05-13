"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, BarChart2, ExternalLink, FileText, Globe, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardAdminRow } from "@/lib/supabase/admin-queries";

type StatusFilter = "all" | "draft" | "published" | "archived";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  published: {
    label: "Published",
    className: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25",
  },
  draft: {
    label: "Draft",
    className: "bg-amber-500/15 text-amber-500 border border-amber-500/25",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground border border-border",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

interface Props {
  dashboards: DashboardAdminRow[];
  isAdmin: boolean;
}

export function DashboardRegistry({ dashboards: initial, isAdmin }: Props) {
  const [dashboards, setDashboards] = useState(initial);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = filter === "all" ? dashboards : dashboards.filter((d) => d.status === filter);

  const counts = {
    all: dashboards.length,
    published: dashboards.filter((d) => d.status === "published").length,
    draft: dashboards.filter((d) => d.status === "draft").length,
    archived: dashboards.filter((d) => d.status === "archived").length,
  };

  async function transition(id: string, status: "draft" | "published" | "archived") {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/dashboards/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to update status");
      return;
    }
    setDashboards((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dashboards.length} dashboard{dashboards.length !== 1 ? "s" : ""} · Chat serves{" "}
            <span className="font-mono text-xs">published</span> only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboards/new">
            <Button size="sm">
              <Plus className="size-4" />
              New Dashboard
            </Button>
          </Link>
          {isAdmin ? (
            <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-2 text-sm font-medium transition-colors rounded-t-md -mb-px border-b-2 ${
              filter === tab.value
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs font-mono px-1.5 py-0.5 rounded-full ${
                filter === tab.value
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No {filter !== "all" ? filter : ""} dashboards found.
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-2 text-xs text-primary hover:underline"
            >
              View all
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium w-20">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell w-40">Vertical</th>
                <th className="px-4 py-3 font-medium w-32">Status</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell w-40">Created</th>
                <th className="px-4 py-3 font-medium text-right w-56">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const isBusy = busyId === d.id;
                return (
                  <tr
                    key={d.id}
                    className={`border-b border-border/60 transition-colors hover:bg-muted/20 ${
                      i === filtered.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-primary">
                        {d.dashboard_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{d.dashboard_name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {d.vertical ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status ?? "draft"} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/dashboards/${d.id}`}>
                          <Button variant="ghost" size="xs">
                            <Pencil className="size-3" />
                            Edit
                          </Button>
                        </Link>

                        {/* Chat link — only for published */}
                        {d.status === "published" && (
                          <Link
                            href={`/chat/${d.dashboard_id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                          >
                            <ExternalLink className="size-3" />
                            Chat
                          </Link>
                        )}

                        {/* Admin-only status transitions */}
                        {isAdmin && (
                          <>
                            {d.status !== "published" && (
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={isBusy}
                                onClick={() => transition(d.id, "published")}
                                className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                              >
                                <Globe className="size-3" />
                                Publish
                              </Button>
                            )}
                            {d.status === "published" && (
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={isBusy}
                                onClick={() => transition(d.id, "draft")}
                                className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                              >
                                <FileText className="size-3" />
                                Unpublish
                              </Button>
                            )}
                            {d.status !== "archived" && (
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={isBusy}
                                onClick={() => {
                                  if (!confirm(`Archive "${d.dashboard_name}"? Users won't be able to chat with it.`))
                                    return;
                                  transition(d.id, "archived");
                                }}
                                className="text-muted-foreground hover:text-destructive border-border hover:border-destructive/30"
                              >
                                <Archive className="size-3" />
                              </Button>
                            )}
                            {d.status === "archived" && (
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={isBusy}
                                onClick={() => transition(d.id, "draft")}
                              >
                                Restore
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground/60">
        Editors can create drafts and edit context. Admins publish or archive dashboards after review.
      </p>
    </div>
  );
}
