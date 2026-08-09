"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, ExternalLink, Globe, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardEditorRow,
  DashboardTableAdminRow,
  DataSourcePublic,
} from "@/lib/supabase/admin-queries";

interface DashboardFormState {
  dashboard_id: string;
  dashboard_name: string;
  vertical: string;
  purpose: string;
  link: string;
  refresh_window: string;
  description: string;
  business_rules: string;
  caveats: string;
  custom_instructions: string;
  example_questions: string;
  data_source_id: string;
}

interface TableFormState {
  table_name: string;
  row_count: string;
  description: string;
  notes: string;
}

interface DashboardEditorProps {
  mode: "create" | "edit";
  dashboard?: DashboardEditorRow;
  tables?: DashboardTableAdminRow[];
  dataSources: DataSourcePublic[];
  isAdmin: boolean;
}

function toFormState(dashboard?: DashboardEditorRow): DashboardFormState {
  return {
    dashboard_id: dashboard?.dashboard_id ?? "",
    dashboard_name: dashboard?.dashboard_name ?? "",
    vertical: dashboard?.vertical ?? "",
    purpose: dashboard?.purpose ?? "",
    link: dashboard?.link ?? "",
    refresh_window: dashboard?.refresh_window ?? "",
    description: dashboard?.description ?? "",
    business_rules: dashboard?.business_rules ?? "",
    caveats: dashboard?.caveats ?? "",
    custom_instructions: dashboard?.custom_instructions ?? "",
    example_questions: (dashboard?.example_questions ?? []).join("\n"),
    data_source_id: dashboard?.data_source_id ?? "",
  };
}

function buildPayload(form: DashboardFormState) {
  return {
    dashboard_id: form.dashboard_id,
    dashboard_name: form.dashboard_name,
    vertical: form.vertical,
    purpose: form.purpose,
    link: form.link,
    refresh_window: form.refresh_window,
    description: form.description,
    business_rules: form.business_rules,
    caveats: form.caveats,
    custom_instructions: form.custom_instructions,
    example_questions: form.example_questions
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean),
    data_source_id: form.data_source_id || null,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export function DashboardEditor({
  mode,
  dashboard,
  tables: initialTables = [],
  dataSources,
  isAdmin,
}: DashboardEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => toFormState(dashboard));
  const [tables, setTables] = useState(initialTables);
  const [tableForm, setTableForm] = useState<TableFormState>({
    table_name: "",
    row_count: "",
    description: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTableSaving, setIsTableSaving] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);

  const isEdit = mode === "edit" && dashboard;

  function updateField<K extends keyof DashboardFormState>(key: K, value: DashboardFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const endpoint = isEdit ? `/api/admin/dashboards/${dashboard.id}` : "/api/admin/dashboards";
    const res = await fetch(endpoint, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(form)),
    });

    setIsSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to save dashboard");
      return;
    }

    if (!isEdit && data.id) {
      router.push(`/admin/dashboards/${data.id}`);
      router.refresh();
      return;
    }

    router.refresh();
  }

  async function handleStatus(status: "draft" | "published" | "archived") {
    if (!dashboard) return;
    setError(null);
    setBusyStatus(true);
    const res = await fetch(`/api/admin/dashboards/${dashboard.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyStatus(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update status");
      return;
    }
    router.refresh();
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!dashboard) return;
    setError(null);
    setIsTableSaving(true);
    const res = await fetch(`/api/admin/dashboards/${dashboard.id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tableForm),
    });
    setIsTableSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add table");
      return;
    }
    setTables((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        table_name: tableForm.table_name,
        row_count: tableForm.row_count || null,
        description: tableForm.description || null,
        notes: tableForm.notes || null,
        created_at: new Date().toISOString(),
      },
    ]);
    setTableForm({ table_name: "", row_count: "", description: "", notes: "" });
  }

  async function handleRemoveTable(tableName: string) {
    if (!dashboard) return;
    if (!confirm(`Remove table mapping "${tableName}"?`)) return;
    setError(null);
    const res = await fetch(
      `/api/admin/dashboards/${dashboard.id}/tables/${encodeURIComponent(tableName)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to remove table");
      return;
    }
    setTables((prev) => prev.filter((table) => table.table_name !== tableName));
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/dashboards"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="size-4" />
            Dashboard registry
          </Link>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {isEdit ? dashboard.dashboard_name : "New dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
              ? "Edit dashboard context, approved tables, and publishing metadata."
              : "Create a draft dashboard. Admins can publish after review."}
          </p>
        </div>

        {isEdit && isAdmin ? (
          <div className="flex flex-wrap gap-2">
            {dashboard.status !== "published" ? (
              <Button
                type="button"
                variant="outline"
                disabled={busyStatus}
                onClick={() => handleStatus("published")}
                className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <Globe className="size-4" />
                Publish
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={busyStatus}
                onClick={() => handleStatus("draft")}
              >
                Unpublish
              </Button>
            )}
            {dashboard.status !== "archived" ? (
              <Button
                type="button"
                variant="outline"
                disabled={busyStatus}
                onClick={() => {
                  if (!confirm("Archive this dashboard? Users will not be able to chat with it."))
                    return;
                  handleStatus("archived");
                }}
                className="text-muted-foreground hover:text-destructive border-border hover:border-destructive/30"
              >
                <Archive className="size-4" />
                Archive
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={busyStatus}
                onClick={() => handleStatus("draft")}
              >
                Restore draft
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic info</CardTitle>
            <CardDescription>
              Short ID is the user-facing dashboard code and links table mappings.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Dashboard short ID">
              <input
                required
                value={form.dashboard_id}
                onChange={(e) => updateField("dashboard_id", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm font-mono"
                placeholder="G107"
              />
            </Field>
            <Field label="Dashboard name">
              <input
                required
                value={form.dashboard_name}
                onChange={(e) => updateField("dashboard_name", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                placeholder="Sales Performance"
              />
            </Field>
            <Field label="Vertical">
              <input
                value={form.vertical}
                onChange={(e) => updateField("vertical", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                placeholder="Sales & Marketing"
              />
            </Field>
            <Field label="Refresh window">
              <input
                value={form.refresh_window}
                onChange={(e) => updateField("refresh_window", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                placeholder="Daily"
              />
            </Field>
            <Field label="Dashboard link">
              <input
                value={form.link}
                onChange={(e) => updateField("link", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                placeholder="https://lookerstudio.google.com/..."
              />
            </Field>
            <Field label="Data source">
              <select
                value={form.data_source_id}
                onChange={(e) => updateField("data_source_id", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
              >
                <option value="">Default connected source (or env)</option>
                {dataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label} ({source.project_id}, {source.location})
                  </option>
                ))}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Purpose">
                <textarea
                  value={form.purpose}
                  onChange={(e) => updateField("purpose", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                  placeholder="What business question does this dashboard answer?"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Context</CardTitle>
            <CardDescription>
              These fields are injected into the dashboard context block for the agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
              />
            </Field>
            <Field label="Business rules">
              <textarea
                value={form.business_rules}
                onChange={(e) => updateField("business_rules", e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                placeholder="Revenue filters, definitions, attribution rules..."
              />
            </Field>
            <Field label="Caveats">
              <textarea
                value={form.caveats}
                onChange={(e) => updateField("caveats", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                placeholder="Known data gaps, delayed tables, fields to avoid..."
              />
            </Field>
            <Field label="Custom prompt instructions">
              <textarea
                value={form.custom_instructions}
                onChange={(e) => updateField("custom_instructions", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                placeholder="Dashboard-specific response behavior..."
              />
            </Field>
            <Field label="Example questions (one per line)">
              <textarea
                value={form.example_questions}
                onChange={(e) => updateField("example_questions", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                placeholder={"What was revenue last week?\nWhich products declined month over month?"}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          {isEdit && dashboard.link ? (
            <Link href={dashboard.link} target="_blank">
              <Button type="button" variant="outline">
                <ExternalLink className="size-4" />
                Open dashboard
              </Button>
            </Link>
          ) : null}
          <Button type="submit" disabled={isSaving}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>

      {isEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Approved tables</CardTitle>
            <CardDescription>
              Table mappings use the dashboard short ID:{" "}
              <span className="font-mono text-xs">{dashboard.dashboard_id}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {tables.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved tables mapped yet.</p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Table</th>
                      <th className="px-3 py-2 font-medium hidden md:table-cell">Description</th>
                      <th className="px-3 py-2 font-medium w-24">Rows</th>
                      <th className="px-3 py-2 font-medium text-right w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.id} className="border-b border-border/60 last:border-b-0">
                        <td className="px-3 py-2 font-mono text-xs">{table.table_name}</td>
                        <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">
                          {table.description ?? "—"}
                          {table.notes ? (
                            <p className="text-xs text-muted-foreground/70 mt-1">{table.notes}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {table.row_count ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTable(table.table_name)}
                            aria-label={`Remove ${table.table_name}`}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <form onSubmit={handleAddTable} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Table name">
                  <input
                    required
                    value={tableForm.table_name}
                    onChange={(e) =>
                      setTableForm((prev) => ({ ...prev, table_name: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm font-mono"
                    placeholder="dataset.table"
                  />
                </Field>
              </div>
              <Field label="Row count">
                <input
                  value={tableForm.row_count}
                  onChange={(e) => setTableForm((prev) => ({ ...prev, row_count: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                  placeholder="1.2M"
                />
              </Field>
              <Field label="Description">
                <input
                  value={tableForm.description}
                  onChange={(e) =>
                    setTableForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm"
                  placeholder="What this table contains"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Notes">
                  <textarea
                    value={tableForm.notes}
                    onChange={(e) => setTableForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                    placeholder="Known filters, JSON fields, partition notes..."
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isTableSaving}>
                  <Plus className="size-4" />
                  {isTableSaving ? "Adding..." : "Add table"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
