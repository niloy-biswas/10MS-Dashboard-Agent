import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SharedChatView } from "./shared-chat-view";
import type { ChatSession, Dashboard, ChatMessage } from "@/lib/types";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/share/${token}`);

  // Use server client (carries user auth) so RLS policy passes
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("share_token", token)
    .eq("is_shared", true)
    .single();

  if (!session) notFound();

  const { data: dashboard } = await supabase
    .from("dashboards")
    .select("*")
    .eq("id", session.dashboard_id)
    .single();

  if (!dashboard) notFound();

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  const mappedMessages: ChatMessage[] = (messages ?? []).map((row: any) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
    reaction: row.reaction ?? null,
    feedback: row.feedback ?? null,
  }));

  return (
    <SharedChatView
      session={session as ChatSession}
      dashboard={dashboard as Dashboard}
      messages={mappedMessages}
    />
  );
}