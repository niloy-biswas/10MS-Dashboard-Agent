import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/require-role";
import { adminGetDashboardEditor, adminListDataSources } from "@/lib/supabase/admin-queries";
import { DashboardEditor } from "../dashboard-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDashboardPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSessionProfile();
  const isAdmin = session?.userRole === "admin";

  const [editor, dataSources] = await Promise.all([
    adminGetDashboardEditor(id),
    adminListDataSources().catch(() => []),
  ]);

  if (!editor) notFound();

  return (
    <DashboardEditor
      mode="edit"
      dashboard={editor.dashboard}
      tables={editor.tables}
      dataSources={dataSources}
      isAdmin={isAdmin}
    />
  );
}
