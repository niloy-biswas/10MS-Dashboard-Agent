import { createClient } from "@supabase/supabase-js";
import type { Dashboard, Profile, ChatMessage, ChatSession } from "@/lib/types";

// Anon client for DB queries — all tables use permissive RLS (USING true)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getDashboards(): Promise<Dashboard[]> {
  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("is_active", true)
    .order("dashboard_id", { ascending: true });

  if (error) {
    console.error("Error fetching dashboards:", error.message);
    return [];
  }
  return data as Dashboard[];
}

export async function getDashboardById(id: string): Promise<Dashboard | null> {
  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching dashboard:", error.message);
    return null;
  }
  return data as Dashboard;
}

export async function getDashboardByShortId(shortId: string): Promise<Dashboard | null> {
  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("dashboard_id", shortId)
    .single();

  if (error) return null;
  return data as Dashboard;
}

// Accepts either UUID or short ID (e.g. "G107")
export async function getDashboardByAnyId(id: string): Promise<Dashboard | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  return isUuid ? getDashboardById(id) : getDashboardByShortId(id);
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error.message);
    return null;
  }
  return data as Profile;
}

export async function getFirstProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(1)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function getChatHistory(dashboardId: string, profileId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("dashboard_id", dashboardId)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat history:", error.message);
    return [];
  }
  
  return data.map((row: any) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

export async function saveChatMessage(
  dashboardId: string,
  profileId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const { error } = await supabase.from("chat_messages").insert({
    dashboard_id: dashboardId,
    profile_id: profileId,
    role,
    content,
    metadata,
  });

  if (error) {
    console.error("Error saving chat message:", error.message);
    return false;
  }
  return true;
}

export async function clearChatHistory(dashboardId: string, profileId: string): Promise<boolean> {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("dashboard_id", dashboardId)
    .eq("profile_id", profileId);
  
  if (error) {
    console.error("Error clearing chat history:", error.message);
    return false;
  }
  return true;
}

// ── Chat Sessions ──────────────────────────────────────────

export async function getChatSessions(
  dashboardId: string,
  profileId: string
): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("dashboard_id", dashboardId)
    .eq("profile_id", profileId)
    .order("session_number", { ascending: false });
  if (error) return [];
  return data as ChatSession[];
}

export async function getChatSessionByNumber(
  dashboardId: string,
  profileId: string,
  sessionNumber: number
): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("dashboard_id", dashboardId)
    .eq("profile_id", profileId)
    .eq("session_number", sessionNumber)
    .single();
  if (error) return null;
  return data as ChatSession;
}

export async function createChatSession(
  dashboardId: string,
  profileId: string
): Promise<ChatSession | null> {
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("session_number")
    .eq("dashboard_id", dashboardId)
    .eq("profile_id", profileId)
    .order("session_number", { ascending: false })
    .limit(1);

  const nextNumber =
    existing && existing.length > 0 ? existing[0].session_number + 1 : 1;

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ dashboard_id: dashboardId, profile_id: profileId, session_number: nextNumber, title: "New Chat" })
    .select()
    .single();

  if (error) return null;
  return data as ChatSession;
}

export async function getOrCreateLatestSession(
  dashboardId: string,
  profileId: string
): Promise<ChatSession | null> {
  const { data } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("dashboard_id", dashboardId)
    .eq("profile_id", profileId)
    .order("session_number", { ascending: false })
    .limit(1)
    .single();

  if (data) return data as ChatSession;
  return createChatSession(dashboardId, profileId);
}

export async function getChatHistoryBySession(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data.map((row: any) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
    reaction: row.reaction ?? null,
    feedback: row.feedback ?? null,
  }));
}

export async function saveChatMessageToSession(
  sessionId: string,
  dashboardId: string,
  profileId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  const { data, error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    dashboard_id: dashboardId,
    profile_id: profileId,
    role,
    content,
    metadata,
  }).select("id").single();
  if (error) return null;
  return data.id;
}

export async function toggleSessionSharing(sessionId: string, isShared: boolean): Promise<string | null> {
  const { data, error } = await supabase
    .from("chat_sessions")
    .update({ is_shared: isShared, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select("share_token")
    .single();
  if (error) return null;
  return data.share_token;
}

export async function getSessionByShareToken(token: string): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("share_token", token)
    .eq("is_shared", true)
    .single();
  if (error) return null;
  return data as ChatSession;
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  await supabase
    .from("chat_sessions")
    .update({ title: title.slice(0, 60), updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function saveMessageReaction(
  messageId: string,
  reaction: "liked" | "disliked",
  feedback?: string
): Promise<boolean> {
  const { error } = await supabase
    .from("chat_messages")
    .update({ reaction, feedback: feedback ?? null })
    .eq("id", messageId);
  return !error;
}

export async function clearSessionMessages(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("session_id", sessionId);
  return !error;
}

// ── Dashboard Tables ───────────────────────────────────────

export async function getDashboardTables(dashboardId: string) {
  const { data, error } = await supabase
    .from("dashboard_tables")
    .select("table_name, row_count, description, notes")
    .eq("dashboard_id", dashboardId);

  if (error) {
    console.error("Error fetching dashboard tables:", error.message);
    return [];
  }
  return data;
}
