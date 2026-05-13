import { getSessionProfile } from "@/lib/auth/require-role";
import { adminListDataSources } from "@/lib/supabase/admin-queries";
import { DashboardEditor } from "../dashboard-editor";

export default async function NewDashboardPage() {
  const session = await getSessionProfile();
  const isAdmin = session?.userRole === "admin";

  let dataSources: Awaited<ReturnType<typeof adminListDataSources>> = [];
  try {
    dataSources = await adminListDataSources();
  } catch {
    dataSources = [];
  }

  return <DashboardEditor mode="create" dataSources={dataSources} isAdmin={isAdmin} />;
}
