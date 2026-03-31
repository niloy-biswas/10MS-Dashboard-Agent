import { NextRequest, NextResponse } from "next/server";
import { saveChatMessage, getDashboardTables } from "@/lib/supabase/queries";
import type { ChatPayload } from "@/lib/types";

const WEBHOOK_URL = "https://n8n-prod.10minuteschool.com/webhook/GDS-n8n";

export async function POST(req: NextRequest) {
  try {
    const payload: ChatPayload = await req.json();

    if (payload.user?.id) {
      await saveChatMessage(
        payload.dashboard_id,
        payload.user.id,
        "user",
        payload.message
      );
    }

    // Fetch and inject dashboard tables
    const contextTables = await getDashboardTables(payload.dashboard_number);
    if (contextTables && contextTables.length > 0) {
      payload.context_tables = contextTables.map(t => ({
        table_name: t.table_name,
        description: t.description,
        row_count: t.row_count,
        notes: t.notes
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

    // Stream the response back to the client
    const contentType = webhookResponse.headers.get("content-type") ?? "";
    const isStream =
      contentType.includes("text/event-stream") ||
      contentType.includes("text/plain") ||
      contentType.includes("application/octet-stream");

    if (webhookResponse.body && isStream) {
      return new NextResponse(webhookResponse.body, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Non-streaming: return as JSON
    const text = await webhookResponse.text();
    return NextResponse.json({ response: text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
