import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/require-role";

export default async function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile();
  if (!session || session.userRole !== "admin") {
    redirect("/admin");
  }
  return <>{children}</>;
}
