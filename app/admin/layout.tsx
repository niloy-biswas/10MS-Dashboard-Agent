import { redirect } from "next/navigation";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { getSessionProfile } from "@/lib/auth/require-role";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile();
  if (!session || (session.userRole !== "editor" && session.userRole !== "admin")) {
    redirect("/app");
  }

  const isAdmin = session.userRole === "admin";

  return (
    <AdminLayoutShell profile={session.profile} isAdmin={isAdmin}>
      {children}
    </AdminLayoutShell>
  );
}
