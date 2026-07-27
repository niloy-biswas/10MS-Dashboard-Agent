import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboards, getProfileByEmail } from "@/lib/supabase/queries";
import { SelectorScreen } from "@/app/selector-screen";

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/app");

  const [dashboards, profile] = await Promise.all([
    getDashboards(),
    getProfileByEmail(user.email!),
  ]);

  return <SelectorScreen dashboards={dashboards} profile={profile} />;
}
