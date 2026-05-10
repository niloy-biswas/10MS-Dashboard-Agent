"use client";

import { useCallback, useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ModelsSettingsPage() {
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/settings/models");
    if (!res.ok) {
      setError("Failed to load settings");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProvider(data.provider ?? "anthropic");
    setModel(data.model ?? "");
    setHasStoredKey(Boolean(data.has_api_key_stored));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/settings/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model,
        api_key: apiKey.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Save failed");
      return;
    }
    setApiKey("");
    await load();
  }

  async function handleTest() {
    setTesting(true);
    setError(null);
    const res = await fetch("/api/admin/settings/models/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model,
        api_key: apiKey.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setTesting(false);
    if (!res.ok) {
      setError(data.error ?? "Test failed");
      return;
    }
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">AI models</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overrides environment defaults when saved. API keys are encrypted at rest.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provider & model</CardTitle>
          <CardDescription>
            {hasStoredKey
              ? "An API key is already stored. Leave the key blank to keep it."
              : "No encrypted API key stored yet — use env vars or enter a key below."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Model ID
                </label>
                <input
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm font-mono"
                  placeholder="claude-sonnet-4-5 or gpt-4o"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  API key (optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                  placeholder="Leave blank to keep existing"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" disabled={testing} onClick={handleTest}>
                  <FlaskConical className="size-3.5" />
                  {testing ? "Testing…" : "Test connection"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
