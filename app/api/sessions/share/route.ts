import { NextRequest, NextResponse } from "next/server";
import { toggleSessionSharing } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, isShared } = await req.json();

    if (!sessionId || typeof isShared !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const shareToken = await toggleSessionSharing(sessionId, isShared);

    if (!shareToken) {
      return NextResponse.json({ error: "Failed to update sharing" }, { status: 500 });
    }

    return NextResponse.json({ success: true, shareToken, isShared });
  } catch (err) {
    console.error("Share API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}