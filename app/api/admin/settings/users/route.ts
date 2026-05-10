import { NextResponse } from "next/server";
import { requireEditorOrAdmin } from "@/lib/auth/require-role";
import { adminListProfiles } from "@/lib/supabase/admin-queries";

export async function GET() {
  try {
    const session = await requireEditorOrAdmin();
    const profiles = await adminListProfiles();
    return NextResponse.json({
      profiles,
      current_user_id: session.userId,
      current_user_role: session.userRole,
    });
  } catch (e) {
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}
