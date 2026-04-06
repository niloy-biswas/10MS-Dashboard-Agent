import { NextRequest, NextResponse } from "next/server";
import { saveChatMessageToSession, updateSessionTitle, getDashboardTables, getChatHistoryBySession } from "@/lib/supabase/queries";
import type { ChatPayload } from "@/lib/types";

const WEBHOOK_URL = "https://n8n-prod.10minuteschool.com/webhook/GDS-n8n";

export async function POST(req: NextRequest) {
  try {
    const payload: ChatPayload = await req.json();

    // Save user message to session
    if (payload.session_id && payload.user?.id) {
      await saveChatMessageToSession(
        payload.session_id,
        payload.dashboard_id,
        payload.user.id,
        "user",
        payload.message
      );

      // Auto-title session from first user message only
      const existing = await getChatHistoryBySession(payload.session_id);
      if (existing.length === 1) {
        await updateSessionTitle(payload.session_id, payload.message);
      }
    }

    // Fetch and inject dashboard tables context
    const contextTables = await getDashboardTables(payload.dashboard_number);
    if (contextTables && contextTables.length > 0) {
      payload.context_tables = contextTables.map((t) => ({
        table_name: t.table_name,
        description: t.description,
        row_count: t.row_count,
        notes: t.notes,
      }));
    }

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: `Webhook error: ${webhookResponse.statusText}` },
        { status: webhookResponse.status }
      );
    }

    if (webhookResponse.body) {
      return new NextResponse(webhookResponse.body, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const text = await webhookResponse.text();
    return NextResponse.json({ response: text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
