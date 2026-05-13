import { encryptSecret } from "@/lib/secrets/credentials-crypto";
import { createAdminClient, tryCreateAdminClient } from "./admin-client";

export interface DataSourcePublic {
  id: string;
  type: string;
  label: string;
  project_id: string;
  location: string;
  status: string;
  last_tested_at: string | null;
  updated_at: string;
}

export interface DataSourceRow extends DataSourcePublic {
  vault_secret_id: string | null;
  credentials_encrypted: string | null;
}

export type UserRoleValue = "user" | "editor" | "admin";

export async function adminGetSetting(key: string): Promise<string | null> {
  const admin = tryCreateAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

/** Runtime resolution when service role may be absent — returns null if DB unreachable. */
export async function adminGetDataSourceFullOptional(id: string): Promise<DataSourceRow | null> {
  const admin = tryCreateAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from("data_sources").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data as DataSourceRow | null;
}

export async function adminUpsertSetting(key: string, value: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("app_settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) throw error;
}

export async function adminListDataSources(): Promise<DataSourcePublic[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("data_sources")
    .select("id,type,label,project_id,location,status,last_tested_at,updated_at")
    .order("label");
  if (error) throw error;
  return data ?? [];
}

export async function adminGetDataSourceFull(id: string): Promise<DataSourceRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("data_sources").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as DataSourceRow | null;
}

export async function adminInsertBigQueryDataSource(params: {
  label: string;
  project_id: string;
  location: string;
  credentials_json: string;
  created_by: string;
}): Promise<string> {
  const admin = createAdminClient();
  const credentials_encrypted = encryptSecret(params.credentials_json);
  const { data, error } = await admin
    .from("data_sources")
    .insert({
      type: "bigquery",
      label: params.label,
      project_id: params.project_id,
      location: params.location,
      credentials_encrypted,
      status: "connected",
      last_tested_at: new Date().toISOString(),
      created_by: params.created_by,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function adminUpdateBigQueryDataSource(params: {
  id: string;
  label: string;
  project_id: string;
  location: string;
  credentials_json?: string;
}): Promise<void> {
  const admin = createAdminClient();
  const patch: Record<string, unknown> = {
    label: params.label,
    project_id: params.project_id,
    location: params.location,
    updated_at: new Date().toISOString(),
  };

  if (params.credentials_json?.trim()) {
    patch.credentials_encrypted = encryptSecret(params.credentials_json);
  }
  patch.status = "connected";
  patch.last_tested_at = new Date().toISOString();

  const { error } = await admin.from("data_sources").update(patch).eq("id", params.id);
  if (error) throw error;
}

export async function adminDeleteDataSource(id: string): Promise<void> {
  const admin = createAdminClient();
  const { data: refs } = await admin.from("dashboards").select("id").eq("data_source_id", id).limit(1);
  if (refs && refs.length > 0) {
    throw new Error("Cannot delete while dashboards use this data source");
  }
  const { error } = await admin.from("data_sources").delete().eq("id", id);
  if (error) throw error;
}

export interface ProfileAdminRow {
  id: string;
  name: string;
  email: string;
  role: string;
  user_role: string;
  created_at: string;
}

export async function adminListProfiles(): Promise<ProfileAdminRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,name,email,role,user_role,created_at")
    .order("email");
  if (error) throw error;
  return (data ?? []) as ProfileAdminRow[];
}

export async function adminUpdateUserRole(profileId: string, user_role: UserRoleValue): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ user_role }).eq("id", profileId);
  if (error) throw error;
}

export async function adminUpdateProfilePosition(profileId: string, role: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", profileId);
  if (error) throw error;
}

// ── Dashboard registry ────────────────────────────────────

export interface DashboardAdminRow {
  id: string;
  dashboard_id: string;
  dashboard_name: string;
  vertical: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

export interface DashboardTableAdminRow {
  id: string;
  table_name: string;
  row_count: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface DashboardEditorRow {
  id: string;
  dashboard_id: string;
  dashboard_name: string;
  vertical: string | null;
  purpose: string | null;
  link: string | null;
  refresh_window: string | null;
  description: string | null;
  status: DashboardStatus;
  business_rules: string | null;
  caveats: string | null;
  custom_instructions: string | null;
  example_questions: string[] | null;
  published_at: string | null;
  published_by: string | null;
  data_source_id: string | null;
  created_at: string;
}

export interface DashboardEditorPayload {
  dashboard_id: string;
  dashboard_name: string;
  vertical: string | null;
  purpose: string | null;
  link: string | null;
  refresh_window: string | null;
  description: string | null;
  business_rules: string | null;
  caveats: string | null;
  custom_instructions: string | null;
  example_questions: string[];
  data_source_id: string | null;
}

export async function adminListAllDashboards(): Promise<DashboardAdminRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dashboards")
    .select("id,dashboard_id,dashboard_name,vertical,status,published_at,created_at")
    .order("dashboard_id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DashboardAdminRow[];
}

export type DashboardStatus = "draft" | "published" | "archived";

export async function adminCreateDashboard(payload: DashboardEditorPayload): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dashboards")
    .insert({
      ...payload,
      status: "draft",
      example_questions: payload.example_questions.length > 0 ? payload.example_questions : null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function adminGetDashboardEditor(id: string): Promise<{
  dashboard: DashboardEditorRow;
  tables: DashboardTableAdminRow[];
} | null> {
  const admin = createAdminClient();
  const { data: dashboard, error } = await admin
    .from("dashboards")
    .select(
      "id,dashboard_id,dashboard_name,vertical,purpose,link,refresh_window,description,status,business_rules,caveats,custom_instructions,example_questions,published_at,published_by,data_source_id,created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!dashboard) return null;

  const { data: tables, error: tablesError } = await admin
    .from("dashboard_tables")
    .select("id,table_name,row_count,description,notes,created_at")
    .eq("dashboard_id", dashboard.dashboard_id)
    .order("table_name", { ascending: true });
  if (tablesError) throw tablesError;

  return {
    dashboard: dashboard as DashboardEditorRow,
    tables: (tables ?? []) as DashboardTableAdminRow[],
  };
}

export async function adminUpdateDashboard(
  id: string,
  payload: DashboardEditorPayload
): Promise<void> {
  const admin = createAdminClient();
  const current = await admin
    .from("dashboards")
    .select("dashboard_id")
    .eq("id", id)
    .single();
  if (current.error) throw current.error;

  const { error } = await admin
    .from("dashboards")
    .update({
      ...payload,
      example_questions: payload.example_questions.length > 0 ? payload.example_questions : null,
    })
    .eq("id", id);
  if (error) throw error;

  const oldShortId = current.data.dashboard_id;
  if (oldShortId !== payload.dashboard_id) {
    const { error: tableError } = await admin
      .from("dashboard_tables")
      .update({ dashboard_id: payload.dashboard_id })
      .eq("dashboard_id", oldShortId);
    if (tableError) throw tableError;
  }
}

export async function adminAddDashboardTable(
  dashboardUuid: string,
  payload: {
    table_name: string;
    row_count: string | null;
    description: string | null;
    notes: string | null;
  }
): Promise<void> {
  const editor = await adminGetDashboardEditor(dashboardUuid);
  if (!editor) throw new Error("Dashboard not found");
  const admin = createAdminClient();
  const { error } = await admin.from("dashboard_tables").insert({
    dashboard_id: editor.dashboard.dashboard_id,
    ...payload,
  });
  if (error) throw error;
}

export async function adminDeleteDashboardTable(
  dashboardUuid: string,
  tableName: string
): Promise<void> {
  const editor = await adminGetDashboardEditor(dashboardUuid);
  if (!editor) throw new Error("Dashboard not found");
  const admin = createAdminClient();
  const { error } = await admin
    .from("dashboard_tables")
    .delete()
    .eq("dashboard_id", editor.dashboard.dashboard_id)
    .eq("table_name", tableName);
  if (error) throw error;
}

export async function adminTransitionDashboardStatus(
  id: string,
  status: DashboardStatus,
  publishedBy?: string
): Promise<void> {
  const admin = createAdminClient();
  const patch: Record<string, unknown> = { status };
  if (status === "published" && publishedBy) {
    patch.published_at = new Date().toISOString();
    patch.published_by = publishedBy;
  }
  const { error } = await admin.from("dashboards").update(patch).eq("id", id);
  if (error) throw error;
}

/** Aggregates for `/admin` overview — service role only; returns null if admin client unavailable. */
export interface AdminTopDashboardByMessages {
  id: string;
  dashboard_code: string;
  dashboard_name: string;
  message_count: number;
}

export interface AdminWorkspaceOverviewStats {
  published_dashboards: number;
  total_dashboards: number;
  data_sources: number;
  users: number;
  chat_sessions: number;
  chat_messages: number;
  ai_provider: string | null;
  ai_model: string | null;
  /** Empty if no messages, RPC missing, or RPC error. */
  top_dashboards_by_messages: AdminTopDashboardByMessages[];
}

export async function adminGetWorkspaceOverviewStats(): Promise<AdminWorkspaceOverviewStats | null> {
  const admin = tryCreateAdminClient();
  if (!admin) return null;

  const countRows = async (
    table: string,
    eq?: { column: string; value: string }
  ): Promise<number> => {
    let q = admin.from(table).select("id", { count: "exact", head: true });
    if (eq) q = q.eq(eq.column, eq.value);
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  };

  const [
    published_dashboards,
    total_dashboards,
    data_sources,
    users,
    chat_sessions,
    chat_messages,
    providerRes,
    modelRes,
    topRpc,
  ] = await Promise.all([
    countRows("dashboards", { column: "status", value: "published" }),
    countRows("dashboards"),
    countRows("data_sources"),
    countRows("profiles"),
    countRows("chat_sessions"),
    countRows("chat_messages"),
    admin.from("app_settings").select("value").eq("key", "ai_provider").maybeSingle(),
    admin.from("app_settings").select("value").eq("key", "ai_model").maybeSingle(),
    admin.rpc("admin_top_dashboards_by_messages", { p_limit: 3 }),
  ]);

  let top_dashboards_by_messages: AdminTopDashboardByMessages[] = [];
  if (!topRpc.error && Array.isArray(topRpc.data)) {
    top_dashboards_by_messages = topRpc.data.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      dashboard_code: String(row.dashboard_code ?? ""),
      dashboard_name: String(row.dashboard_name ?? ""),
      message_count: Number(row.message_count ?? 0),
    }));
  }

  return {
    published_dashboards,
    total_dashboards,
    data_sources,
    users,
    chat_sessions,
    chat_messages,
    ai_provider: providerRes.data?.value ?? null,
    ai_model: modelRes.data?.value ?? null,
    top_dashboards_by_messages,
  };
}
