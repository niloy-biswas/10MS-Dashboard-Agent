import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardByAnyId,
  getProfileByEmail,
  getChatSessionByNumber,
  getChatSessions,
  getChatHistoryBySession,
} from "@/lib/supabase/queries";
import { ChatScreen } from "../chat-screen";

interface SessionPageProps {
  params: Promise<{ dashboardId: string; sessionNumber: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { dashboardId, sessionNumber } = await params;
  const sessionNum = parseInt(sessionNumber, 10);

  if (isNaN(sessionNum)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dashboard, profile] = await Promise.all([
    getDashboardByAnyId(dashboardId),
    getProfileByEmail(user.email!),
  ]);

  if (!dashboard) notFound();
  if (!profile) redirect("/login");

  const [session, sessions] = await Promise.all([
    getChatSessionByNumber(dashboard.id, profile.id, sessionNum),
    getChatSessions(dashboard.id, profile.id),
  ]);

  if (!session) notFound();

  const initialMessages = await getChatHistoryBySession(session.id);

  return (
    <ChatScreen
      dashboard={dashboard}
      profile={profile}
      session={session}
      sessions={sessions}
      initialMessages={initialMessages}
    />
  );
}
