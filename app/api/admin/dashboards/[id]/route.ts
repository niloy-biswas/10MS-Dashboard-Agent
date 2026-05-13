import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEditorOrAdmin } from "@/lib/auth/require-role";
import { adminGetDashboardEditor, adminUpdateDashboard } from "@/lib/supabase/admin-queries";

const dashboardSchema = z.object({
  dashboard_id: z.string().trim().min(1),
  dashboard_name: z.string().trim().min(1),
  vertical: z.string().trim().optional().nullable(),
  purpose: z.string().trim().optional().nullable(),
  link: z.string().trim().optional().nullable(),
  refresh_window: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  business_rules: z.string().trim().optional().nullable(),
  caveats: z.string().trim().optional().nullable(),
  custom_instructions: z.string().trim().optional().nullable(),
  example_questions: z.array(z.string().trim()).default([]),
  data_source_id: z.string().uuid().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

function emptyToNull(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await requireEditorOrAdmin();
    const { id } = await params;
    const editor = await adminGetDashboardEditor(id);
    if (!editor) return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    return NextResponse.json(editor);
  } catch (e) {
    const status = e instanceof Error && "status" in e ? (e as { status: number }).status : 500;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requireEditorOrAdmin();
    const { id } = await params;
    const body = dashboardSchema.parse(await req.json());
    await adminUpdateDashboard(id, {
      dashboard_id: body.dashboard_id,
      dashboard_name: body.dashboard_name,
      vertical: emptyToNull(body.vertical),
      purpose: emptyToNull(body.purpose),
      link: emptyToNull(body.link),
      refresh_window: emptyToNull(body.refresh_window),
      description: emptyToNull(body.description),
      business_rules: emptyToNull(body.business_rules),
      caveats: emptyToNull(body.caveats),
      custom_instructions: emptyToNull(body.custom_instructions),
      example_questions: body.example_questions.filter(Boolean),
      data_source_id: body.data_source_id ?? null,
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
    return NextResponse.json({ error: "Failed to update dashboard" }, { status: 500 });
  }
}
