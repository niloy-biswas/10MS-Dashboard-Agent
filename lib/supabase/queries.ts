import { createClient } from "@supabase/supabase-js";
import type { Dashboard, Profile, ChatMessage } from "@/lib/types";

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
