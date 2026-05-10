"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: string;
  user_role: string;
  created_at: string;
}

export function UsersManagement() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [positions, setPositions] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUserRole === "admin";

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/settings/users");
    if (!res.ok) {
      setError("Failed to load users");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const rows = (data.profiles ?? []) as ProfileRow[];
    setProfiles(rows);
    setPositions(Object.fromEntries(rows.map((p) => [p.id, p.role ?? ""])));
    setCurrentUserId(data.current_user_id ?? null);
    setCurrentUserRole(data.current_user_role ?? "user");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccessRoleChange(profileId: string, user_role: string) {
    setError(null);
    setBusyId(profileId);
    const res = await fetch(`/api/admin/settings/users/${profileId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_role }),
    });
    setBusyId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Access role update failed");
      await load();
      return;
    }
    await load();
  }

  async function handlePositionSave(profileId: string) {
    setError(null);
    setBusyId(profileId);
    const res = await fetch(`/api/admin/settings/users/${profileId}/position`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: positions[profileId] ?? "" }),
    });
    setBusyId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Position update failed");
      await load();
      return;
    }
    await load();
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage profile positions and access roles. Editors can update only their own position.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">User profiles</CardTitle>
          <CardDescription>
            <span className="font-mono text-xs">role</span> is the user position (for example Data
            Analyst). <span className="font-mono text-xs">access</span> controls app permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Position</th>
                    <th className="pb-2 pr-4 font-medium">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => {
                    const canEditPosition = isAdmin || p.id === currentUserId;
                    const hasPositionChanged = (positions[p.id] ?? "") !== (p.role ?? "");
                    return (
                      <tr key={p.id} className="border-b border-border/40">
                        <td className="py-2 pr-4">{p.name}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{p.email}</td>
                        <td className="py-2 pr-4 min-w-56">
                          <div className="flex items-center gap-2">
                            <input
                              value={positions[p.id] ?? ""}
                              disabled={!canEditPosition || busyId === p.id}
                              onChange={(e) =>
                                setPositions((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              className="h-9 w-full px-3 rounded-md bg-input border border-border text-sm disabled:opacity-60"
                              placeholder="Data Analyst"
                            />
                            {canEditPosition ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!hasPositionChanged || busyId === p.id}
                                onClick={() => handlePositionSave(p.id)}
                                aria-label={`Save position for ${p.name}`}
                              >
                                <Save className="size-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2">
                          <select
                            value={p.user_role ?? "user"}
                            disabled={!isAdmin || busyId === p.id}
                            onChange={(e) => handleAccessRoleChange(p.id, e.target.value)}
                            className="h-9 px-2 rounded-md bg-input border border-border text-sm disabled:opacity-60"
                          >
                            <option value="user">user</option>
                            <option value="editor">editor</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
