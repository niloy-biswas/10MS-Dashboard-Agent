import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardById, getProfileByEmail, getOrCreateLatestSession } from "@/lib/supabase/queries";

interface ChatPageProps {
  params: Promise<{ dashboardId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { dashboardId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dashboard, profile] = await Promise.all([
    getDashboardById(dashboardId),
    getProfileByEmail(user.email!),
  ]);

  if (!dashboard) notFound();
  if (!profile) redirect("/login");

  const session = await getOrCreateLatestSession(dashboard.id, profile.id);
  if (!session) notFound();

  redirect(`/chat/${dashboardId}/${session.session_number}`);
}
