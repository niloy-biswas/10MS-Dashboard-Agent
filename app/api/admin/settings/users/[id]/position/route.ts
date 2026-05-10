import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEditorOrAdmin } from "@/lib/auth/require-role";
import { adminUpdateProfilePosition } from "@/lib/supabase/admin-queries";

const schema = z.object({
  role: z.string().trim().min(1).max(120),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireEditorOrAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    if (session.userRole !== "admin" && session.userId !== id) {
      return NextResponse.json(
        { error: "Editors can only change their own position" },
        { status: 403 }
      );
    }

    await adminUpdateProfilePosition(id, body.role);
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
    return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
  }
}
