import { NextRequest, NextResponse } from "next/server";
import { saveMessageReaction } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const { messageId, reaction, feedback } = await req.json();

    if (!messageId || !reaction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const success = await saveMessageReaction(messageId, reaction, feedback);

    if (!success) {
      return NextResponse.json({ error: "Failed to save reaction" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reaction API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}