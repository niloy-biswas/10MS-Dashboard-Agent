import { NextRequest, NextResponse } from "next/server";
import { saveChatMessageToSession } from "@/lib/supabase/queries";
import type { MessagePart } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, dashboardId, profileId, content, metadata, parts } = await req.json();

    if (!sessionId || !dashboardId || !profileId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const messageId = await saveChatMessageToSession(
      sessionId,
      dashboardId,
      profileId,
      "assistant",
      content,
      metadata,
      parts as MessagePart[] | undefined
    );

    if (!messageId) {
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId });
  } catch (err) {
    console.error("Chat save API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
