import { NextRequest, NextResponse } from "next/server";
import { saveChatMessage } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const { dashboardId, profileId, content, metadata } = await req.json();

    if (!dashboardId || !profileId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const success = await saveChatMessage(dashboardId, profileId, "assistant", content, metadata);

    if (!success) {
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Chat save API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
