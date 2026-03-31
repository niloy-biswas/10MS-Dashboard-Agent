import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardById, getProfileByEmail, getChatHistory } from "@/lib/supabase/queries";
import { ChatScreen } from "./chat-screen";

interface ChatPageProps {
  params: Promise<{ dashboardId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { dashboardId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [dashboard, profile] = await Promise.all([
    getDashboardById(dashboardId),
    getProfileByEmail(user.email!),
  ]);

  if (!dashboard) notFound();

  let initialMessages: any[] = [];
  if (profile) {
    initialMessages = await getChatHistory(dashboard.id, profile.id);
  }

  return <ChatScreen dashboard={dashboard} profile={profile} initialMessages={initialMessages} />;
}
