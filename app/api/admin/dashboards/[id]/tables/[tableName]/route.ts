import { NextResponse } from "next/server";
import { requireEditorOrAdmin } from "@/lib/auth/require-role";
import { adminDeleteDashboardTable } from "@/lib/supabase/admin-queries";

interface RouteParams {
  params: Promise<{ id: string; tableName: string }>;
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await requireEditorOrAdmin();
    const { id, tableName } = await params;
    await adminDeleteDashboardTable(id, decodeURIComponent(tableName));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to remove table" }, { status: 500 });
  }
}
