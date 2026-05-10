export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { promoteAdminFromEnv } = await import("./lib/supabase/bootstrap-admin");
    await promoteAdminFromEnv();
  } catch {
    // Missing env during build or DB unreachable — safe to ignore
  }
}
