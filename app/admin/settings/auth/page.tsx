"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthSettingsPage() {
  const [domain, setDomain] = useState("*");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/settings/auth");
    if (!res.ok) {
      setError("Failed to load auth settings");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setDomain(data.allowed_email_domain ?? "*");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/settings/auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowed_email_domain: domain.trim() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Save failed");
      return;
    }
    await load();
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Auth</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Controls the signup email domain check (database trigger). Use{" "}
          <span className="font-mono text-xs">*</span> to allow all domains (self-host default).
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Allowed email domain</CardTitle>
          <CardDescription>
            Store plain domain without @ (e.g. <span className="font-mono">10minuteschool.com</span>
            ). Requires <span className="font-mono text-xs">enforce_email_domain</span> trigger on{" "}
            <span className="font-mono text-xs">auth.users</span> in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm font-mono"
                placeholder="* or 10minuteschool.com"
              />
              <Button type="submit">Save</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
