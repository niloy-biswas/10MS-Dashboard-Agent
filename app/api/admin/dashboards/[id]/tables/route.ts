import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEditorOrAdmin } from "@/lib/auth/require-role";
import { adminAddDashboardTable } from "@/lib/supabase/admin-queries";

const tableSchema = z.object({
  table_name: z.string().trim().min(1),
  row_count: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

function emptyToNull(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await requireEditorOrAdmin();
    const { id } = await params;
    const body = tableSchema.parse(await req.json());
    await adminAddDashboardTable(id, {
      table_name: body.table_name,
      row_count: emptyToNull(body.row_count),
      description: emptyToNull(body.description),
      notes: emptyToNull(body.notes),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to add table" }, { status: 500 });
  }
}
