"use client";

import { useCallback, useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ANTHROPIC_MODEL_CHOICES,
  OPENAI_MODEL_CHOICES,
} from "@/lib/application/enums/model-names";

function modelChoices(provider: string) {
  return provider === "openai" ? OPENAI_MODEL_CHOICES : ANTHROPIC_MODEL_CHOICES;
}

function pickValidModel(provider: string, fromServer: string | undefined): string {
  const opts = modelChoices(provider);
  const candidate = (fromServer ?? "").trim();
  return opts.some((o) => o.value === candidate) ? candidate : opts[0]!.value;
}

function messageFromApiError(data: unknown): string {
  if (!data || typeof data !== "object" || !("error" in data)) return "Request failed";
  const err = (data as { error: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const parts: string[] = [];
    if (Array.isArray(o.formErrors)) parts.push(...o.formErrors);
    if (o.fieldErrors) {
      for (const msgs of Object.values(o.fieldErrors)) {
        if (Array.isArray(msgs)) parts.push(...msgs);
      }
    }
    if (parts.length > 0) return parts.join(" ");
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Request failed";
  }
}

export default function ModelsSettingsPage() {
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [keyPresence, setKeyPresence] = useState({ anthropic: false, openai: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings/models");
    if (!res.ok) {
      setError("Failed to load settings");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setError(null);
    setTestSuccess(null);
    const p = data.provider ?? "anthropic";
    setProvider(p);
    setModel(pickValidModel(p, data.model));
    setKeyPresence({
      anthropic: Boolean(data.has_anthropic_api_key_stored ?? data.has_api_key_stored),
      openai: Boolean(data.has_openai_api_key_stored),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch-on-mount; `load` only updates state after await
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTestSuccess(null);
    const res = await fetch("/api/admin/settings/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model,
        anthropic_api_key: anthropicApiKey.trim() || undefined,
        openai_api_key: openaiApiKey.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(messageFromApiError(j));
      return;
    }
    setAnthropicApiKey("");
    setOpenaiApiKey("");
    await load();
  }

  async function handleTest() {
    setTesting(true);
    setError(null);
    setTestSuccess(null);
    const res = await fetch("/api/admin/settings/models/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model,
        anthropic_api_key: anthropicApiKey.trim() || undefined,
        openai_api_key: openaiApiKey.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setTesting(false);
    if (!res.ok) {
      setError(messageFromApiError(data));
      return;
    }
    setTestSuccess(
      `Connected — ${provider === "openai" ? "OpenAI" : "Anthropic"} accepted a request for model ${model}.`
    );
  }

  const modelOptions = modelChoices(provider);

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">AI models</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save an API key for each provider you use, then switch the active provider anytime. Only the
          active provider and model are used for chat; keys are encrypted at rest.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active chat runtime</CardTitle>
              <CardDescription>
                These control which LLM runs in production. Changing provider does not remove the
                other provider&apos;s saved key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const next = e.target.value;
                    setTestSuccess(null);
                    setError(null);
                    setProvider(next);
                    setModel((prev) => {
                      const opts = modelChoices(next);
                      return opts.some((o) => o.value === prev) ? prev : opts[0]!.value;
                    });
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Model for active provider
                </label>
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setTestSuccess(null);
                    setError(null);
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm font-mono"
                >
                  {modelOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label} ({o.value})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Provider API keys</CardTitle>
              <CardDescription>
                Paste a key only when adding or rotating it. Leave blank to keep the stored value.
                You can configure both providers, then flip &quot;Active provider&quot; above without
                touching keys again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Anthropic
                    </p>
                    {keyPresence.anthropic ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Key stored
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Not stored
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    One key for all Claude models. Falls back to{" "}
                    <span className="font-mono">ANTHROPIC_API_KEY</span> if empty.
                  </p>
                  <input
                    type="password"
                    value={anthropicApiKey}
                    onChange={(e) => {
                      setAnthropicApiKey(e.target.value);
                      setTestSuccess(null);
                      setError(null);
                    }}
                    autoComplete="off"
                    className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                    placeholder={
                      keyPresence.anthropic ? "Leave blank to keep existing key" : "Paste Anthropic API key"
                    }
                  />
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      OpenAI
                    </p>
                    {keyPresence.openai ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Key stored
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Not stored
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    One key for all listed OpenAI models. Falls back to{" "}
                    <span className="font-mono">OPENAI_API_KEY</span> if empty.
                  </p>
                  <input
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => {
                      setOpenaiApiKey(e.target.value);
                      setTestSuccess(null);
                      setError(null);
                    }}
                    autoComplete="off"
                    className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                    placeholder={
                      keyPresence.openai ? "Leave blank to keep existing key" : "Paste OpenAI API key"
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" disabled={testing} onClick={handleTest}>
              <FlaskConical className="size-3.5" />
              {testing ? "Testing…" : "Test active connection"}
            </Button>
          </div>

          <div aria-live="polite" className="min-h-[1.25rem]">
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            {testSuccess && !error ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                {testSuccess}
              </div>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
