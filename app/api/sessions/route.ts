import { NextRequest, NextResponse } from "next/server";
import { createChatSession } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const { dashboardId, profileId } = await req.json();

    if (!dashboardId || !profileId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await createChatSession(dashboardId, profileId);

    if (!session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ sessionNumber: session.session_number, sessionId: session.id });
  } catch (err) {
    console.error("Session create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
