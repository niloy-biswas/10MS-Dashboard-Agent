import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboards, getProfileByEmail } from "@/lib/supabase/queries";
import { SelectorScreen } from "./selector-screen";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [dashboards, profile] = await Promise.all([
    getDashboards(),
    getProfileByEmail(user.email!),
  ]);

  return <SelectorScreen dashboards={dashboards} profile={profile} />;
}
