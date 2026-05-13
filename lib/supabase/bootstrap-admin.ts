import { createAdminClient } from "./admin-client";

/**
 * Promotes ADMIN_EMAIL to admin on cold start (self-host / first deploy).
 */
export async function promoteAdminFromEnv(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) return;

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id,user_role")
      .ilike("email", email)
      .maybeSingle();

    if (error || !profile || profile.user_role === "admin") return;

    await admin.from("profiles").update({ user_role: "admin" }).eq("id", profile.id);
  } catch {
    // Missing service role or DB unreachable during build — ignore
  }
}
