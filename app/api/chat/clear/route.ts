import { NextRequest, NextResponse } from "next/server";
import { clearChatHistory } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const { dashboardId, profileId } = await req.json();

    if (!dashboardId || !profileId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const success = await clearChatHistory(dashboardId, profileId);

    if (!success) {
      return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Chat clear API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
