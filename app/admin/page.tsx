import Link from "next/link";
import {
  BarChart2,
  Database,
  MessageSquare,
  MessagesSquare,
  Settings,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { getSessionProfile } from "@/lib/auth/require-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminGetWorkspaceOverviewStats } from "@/lib/supabase/admin-queries";

function formatCount(n: number | undefined): string {
  if (n === undefined) return "—";
  return n.toLocaleString();
}

export default async function AdminOverviewPage() {
  const session = await getSessionProfile();
  const isAdmin = session?.userRole === "admin";

  let stats = null as Awaited<ReturnType<typeof adminGetWorkspaceOverviewStats>>;
  try {
    stats = await adminGetWorkspaceOverviewStats();
  } catch {
    stats = null;
  }

  const envProvider = (process.env.MODEL_PROVIDER ?? "anthropic").toLowerCase();
  const displayProvider = (stats?.ai_provider ?? envProvider).toLowerCase();
  const displayModel = stats?.ai_model?.trim() || null;

  return (
    <div className="w-full space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Sparkles className="size-3" />
          Admin workspace
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Workspace overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live counts across dashboards, platform configuration, and chat activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/admin/dashboards" className="block group">
          <Card className="h-full transition-colors hover:bg-muted/20 border-border/80">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Published dashboards
                </CardTitle>
                <BarChart2 className="size-5 text-primary shrink-0 opacity-80 group-hover:opacity-100" />
              </div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {stats ? formatCount(stats.published_dashboards) : "—"}
              </p>
              <CardDescription>
                Chat-ready (published).{" "}
                {stats !== null ? (
                  <>
                    <span className="text-foreground/80">{formatCount(stats.total_dashboards)}</span>{" "}
                    total in registry.
                  </>
                ) : (
                  "Configure the service role to load counts."
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {isAdmin ? (
          <Link href="/admin/settings/data-sources" className="block group">
            <Card className="h-full transition-colors hover:bg-muted/20 border-border/80">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Data sources</CardTitle>
                  <Database className="size-5 text-primary shrink-0 opacity-80 group-hover:opacity-100" />
                </div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {stats ? formatCount(stats.data_sources) : "—"}
                </p>
                <CardDescription>BigQuery connections stored in the workspace.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ) : (
          <Card className="h-full border-border/80 border-dashed">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Data sources</CardTitle>
                <Database className="size-5 text-muted-foreground shrink-0" />
              </div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {stats ? formatCount(stats.data_sources) : "—"}
              </p>
              <CardDescription>Count only — configuration is in Settings (admins).</CardDescription>
            </CardHeader>
          </Card>
        )}

        {isAdmin ? (
          <Link href="/admin/settings/models" className="block group">
            <Card className="h-full transition-colors hover:bg-muted/20 border-border/80">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">AI runtime</CardTitle>
                  <Settings className="size-5 text-primary shrink-0 opacity-80 group-hover:opacity-100" />
                </div>
                <p className="text-2xl font-semibold capitalize tracking-tight text-foreground">
                  {displayProvider}
                </p>
                <CardDescription className="font-mono text-xs">
                  {displayModel ?? "Model from env until saved in settings"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ) : (
          <Card className="h-full border-border/80 border-dashed">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">AI runtime</CardTitle>
                <Settings className="size-5 text-muted-foreground shrink-0" />
              </div>
              <p className="text-2xl font-semibold capitalize tracking-tight text-foreground">
                {displayProvider}
              </p>
              <CardDescription className="font-mono text-xs">
                {displayModel ?? "Model from env or admin settings (read-only for you)."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Link href="/admin/users" className="block group">
          <Card className="h-full transition-colors hover:bg-muted/20 border-border/80">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
                <Users className="size-5 text-primary shrink-0 opacity-80 group-hover:opacity-100" />
              </div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {stats ? formatCount(stats.users) : "—"}
              </p>
              <CardDescription>Profiles with access to the app.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Chat activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/80">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Chat sessions</CardTitle>
                <MessageSquare className="size-5 text-primary shrink-0" />
              </div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {stats ? formatCount(stats.chat_sessions) : "—"}
              </p>
              <CardDescription>Distinct conversation threads across dashboards.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/80">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Chat messages</CardTitle>
                <MessagesSquare className="size-5 text-primary shrink-0" />
              </div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {stats ? formatCount(stats.chat_messages) : "—"}
              </p>
              <CardDescription>All persisted user and assistant messages.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-border/80 mt-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-primary shrink-0" />
              <CardTitle className="text-base">Top dashboards by messages</CardTitle>
            </div>
            <CardDescription>
              Ranked by total stored messages (user + assistant). Links open the dashboard editor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!stats ? (
              <p className="text-sm text-muted-foreground">Configure the service role to load rankings.</p>
            ) : stats.chat_messages === 0 ? (
              <p className="text-sm text-muted-foreground">No chat messages yet.</p>
            ) : stats.top_dashboards_by_messages.length > 0 ? (
              <ul className="divide-y divide-border/80 rounded-lg border border-border/60 overflow-hidden">
                {stats.top_dashboards_by_messages.map((d, i) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/dashboards/${d.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono tabular-nums text-muted-foreground w-6 shrink-0">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{d.dashboard_name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{d.dashboard_code}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                        {formatCount(d.message_count)} messages
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Rankings are not available. Run migration{" "}
                <span className="font-mono text-xs text-foreground/90">
                  supabase/migrations/002_admin_top_dashboards_by_messages.sql
                </span>{" "}
                in the Supabase SQL editor, then reload.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
