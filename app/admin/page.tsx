import Link from "next/link";
import { BarChart2, Database, Settings, Sparkles, Users } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/require-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const session = await getSessionProfile();
  const isAdmin = session?.userRole === "admin";

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Sparkles className="size-3" />
          Admin workspace
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Workspace overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage governed dashboard context and platform configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/dashboards" className="block">
          <Card className="h-full transition-colors hover:bg-muted/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="size-5 text-primary" />
                Dashboard registry
              </CardTitle>
              <CardDescription>
                Create dashboards, edit business context, manage approved tables, and control
                draft/published/archive status.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {isAdmin ? (
          <>
            <Link href="/admin/settings/data-sources" className="block">
              <Card className="h-full transition-colors hover:bg-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="size-5 text-primary" />
                    Data sources
                  </CardTitle>
                  <CardDescription>
                    Manage BigQuery connections and encrypted credentials.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/settings/models" className="block">
              <Card className="h-full transition-colors hover:bg-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="size-5 text-primary" />
                    AI model settings
                  </CardTitle>
                  <CardDescription>
                    Configure provider, model, and encrypted API key overrides.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/users" className="block">
              <Card className="h-full transition-colors hover:bg-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    Users and roles
                  </CardTitle>
                  <CardDescription>
                    Promote users to editor or admin after they sign up.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </>
        ) : (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Global settings are restricted to admins. Editors can manage dashboard drafts and
                context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ask an admin for data source or model changes.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
