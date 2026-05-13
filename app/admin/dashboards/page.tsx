import { getSessionProfile } from "@/lib/auth/require-role";
import { adminListAllDashboards } from "@/lib/supabase/admin-queries";
import { DashboardRegistry } from "../dashboard-registry";

export default async function DashboardsPage() {
  const session = await getSessionProfile();
  const isAdmin = session?.userRole === "admin";

  let dashboards: Awaited<ReturnType<typeof adminListAllDashboards>> = [];
  try {
    dashboards = await adminListAllDashboards();
  } catch {
    // service role not configured — will show empty state
  }

  return <DashboardRegistry dashboards={dashboards} isAdmin={isAdmin} />;
}
