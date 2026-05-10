"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, FlaskConical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DataSourceRow {
  id: string;
  type: string;
  label: string;
  project_id: string;
  location: string;
  status: string;
  last_tested_at: string | null;
  updated_at: string;
}

interface DataSourceEditState {
  label: string;
  project_id: string;
  location: string;
  credentials_json: string;
}

export default function DataSourcesSettingsPage() {
  const [items, setItems] = useState<DataSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [projectId, setProjectId] = useState("");
  const [location, setLocation] = useState("US");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [createTestStatus, setCreateTestStatus] = useState<"idle" | "testing" | "success">("idle");
  const [createTestMessage, setCreateTestMessage] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, DataSourceEditState>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  function resetCreateTest() {
    setCreateTestStatus("idle");
    setCreateTestMessage(null);
  }

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/settings/data-sources");
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to load");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const nextItems = (data.data_sources ?? []) as DataSourceRow[];
    setItems(nextItems);
    setEdits(
      Object.fromEntries(
        nextItems.map((item) => [
          item.id,
          {
            label: item.label,
            project_id: item.project_id,
            location: item.location ?? "US",
            credentials_json: "",
          },
        ])
      )
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (createTestStatus !== "success") {
      setError("Test the BigQuery connection before saving.");
      return;
    }
    setError(null);
    const res = await fetch("/api/admin/settings/data-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        project_id: projectId,
        location,
        credentials_json: credentialsJson,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Create failed");
      return;
    }
    setLabel("");
    setProjectId("");
    setLocation("US");
    setCredentialsJson("");
    setCreateTestStatus("idle");
    setCreateTestMessage(null);
    await load();
  }

  async function handleCreateTest() {
    setError(null);
    setCreateTestMessage(null);
    setCreateTestStatus("testing");
    const res = await fetch("/api/admin/settings/data-sources/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        location,
        credentials_json: credentialsJson,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCreateTestStatus("idle");
      setCreateTestMessage(null);
      setError(data.error ?? "Connection test failed");
      return;
    }
    setCreateTestStatus("success");
    setCreateTestMessage("Connection test passed. You can save this source now.");
  }

  async function handleUpdate(id: string) {
    const edit = edits[id];
    if (!edit) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/settings/data-sources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });
    setBusyId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Update failed");
      return;
    }
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this data source? Dashboards must not reference it.")) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/settings/data-sources/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Data sources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          BigQuery connections stored encrypted (requires{" "}
          <span className="font-mono text-xs">SETTINGS_ENCRYPTION_KEY</span>). Assign sources to
          dashboards from the dashboard editor.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected sources</CardTitle>
          <CardDescription>
            New sources must pass <span className="font-mono">SELECT 1</span> before they are saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data sources yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((ds) => (
                <li
                  key={ds.id}
                  className="rounded-lg border border-border/60 bg-card/50 p-3 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{ds.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {ds.project_id} · {ds.location ?? "US"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ds.type} · {ds.status}
                      {ds.last_tested_at
                        ? ` · tested ${new Date(ds.last_tested_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={edits[ds.id]?.label ?? ds.label}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [ds.id]: {
                            ...(prev[ds.id] ?? {
                              label: ds.label,
                              project_id: ds.project_id,
                              location: ds.location ?? "US",
                              credentials_json: "",
                            }),
                            label: e.target.value,
                          },
                        }))
                      }
                      className="h-9 px-3 rounded-md bg-input border border-border text-sm"
                      placeholder="Label"
                    />
                    <input
                      value={edits[ds.id]?.project_id ?? ds.project_id}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [ds.id]: {
                            ...(prev[ds.id] ?? {
                              label: ds.label,
                              project_id: ds.project_id,
                              location: ds.location ?? "US",
                              credentials_json: "",
                            }),
                            project_id: e.target.value,
                          },
                        }))
                      }
                      className="h-9 px-3 rounded-md bg-input border border-border text-sm font-mono"
                      placeholder="Project ID"
                    />
                    <input
                      value={edits[ds.id]?.location ?? ds.location ?? "US"}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [ds.id]: {
                            ...(prev[ds.id] ?? {
                              label: ds.label,
                              project_id: ds.project_id,
                              location: ds.location ?? "US",
                              credentials_json: "",
                            }),
                            location: e.target.value,
                          },
                        }))
                      }
                      className="h-9 px-3 rounded-md bg-input border border-border text-sm font-mono"
                      placeholder="US"
                    />
                    <input
                      type="password"
                      value={edits[ds.id]?.credentials_json ?? ""}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [ds.id]: {
                            ...(prev[ds.id] ?? {
                              label: ds.label,
                              project_id: ds.project_id,
                              location: ds.location ?? "US",
                              credentials_json: "",
                            }),
                            credentials_json: e.target.value,
                          },
                        }))
                      }
                      className="h-9 px-3 rounded-md bg-input border border-border text-sm md:col-span-3"
                      placeholder="Optional: paste new service account JSON to replace stored credentials"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === ds.id}
                      onClick={() => handleUpdate(ds.id)}
                    >
                      Save changes
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busyId === ds.id}
                      onClick={() => handleDelete(ds.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="size-4" />
            Add BigQuery source
          </CardTitle>
          <CardDescription>Paste the GCP service account JSON (single object).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Label
              </label>
              <input
                required
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  resetCreateTest();
                }}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                placeholder="10MS Production BQ"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Project ID
              </label>
              <input
                required
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  resetCreateTest();
                }}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm font-mono"
                placeholder="my-gcp-project"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                BigQuery location
              </label>
              <input
                required
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  resetCreateTest();
                }}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm font-mono"
                placeholder="US"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Service account JSON
              </label>
              <textarea
                required
                value={credentialsJson}
                onChange={(e) => {
                  setCredentialsJson(e.target.value);
                  resetCreateTest();
                }}
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-xs font-mono"
                placeholder='{ "type": "service_account", ... }'
              />
            </div>
            {createTestMessage ? (
              <p className="text-sm text-emerald-500">{createTestMessage}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Test the connection first. Save becomes available only after a successful test.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  createTestStatus === "testing" ||
                  !projectId.trim() ||
                  !location.trim() ||
                  !credentialsJson.trim()
                }
                onClick={handleCreateTest}
              >
                <FlaskConical className="size-3.5" />
                {createTestStatus === "testing" ? "Testing..." : "Test connection"}
              </Button>
              <Button type="submit" disabled={createTestStatus !== "success"}>
                Save source
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
