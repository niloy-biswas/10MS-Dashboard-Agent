import { NextRequest, NextResponse } from "next/server";
import { clearSessionMessages } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const success = await clearSessionMessages(sessionId);

    if (!success) {
      return NextResponse.json({ error: "Failed to clear messages" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Chat clear API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
