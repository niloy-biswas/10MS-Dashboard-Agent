import { NextRequest, NextResponse } from "next/server";
import { saveChatMessageToSession, updateSessionTitle, getDashboardTables, getChatHistoryBySession } from "@/lib/supabase/queries";
import { runChatUseCase } from "@/lib/application/use_cases/chat";
import type { ChatPayload, HistoryMessage, MessagePart } from "@/lib/types";

// Extract SQL queries from stored parts (Option C: tool inputs only, no results)
function buildHistoryContent(content: string, parts?: MessagePart[]): string {
  if (!parts) return content;

  const queries: string[] = [];
  for (const part of parts) {
    if (part.type !== "tool_call" || part.toolCall.tool !== "execute_query") continue;
    const input = part.toolCall.input;
    // Unwrap LangGraph's nested {input: '{"query":"..."}'} format
    let query: unknown = input.query;
    if (!query && typeof input.input === "string") {
      try { query = JSON.parse(input.input as string).query; } catch { /* skip */ }
    }
    if (typeof query === "string") {
      queries.push(query.replace(/\\n/g, "\n").trim());
    }
  }

  if (queries.length === 0) return content;
  const sqlNote = queries.map((q) => `\`\`\`sql\n${q}\n\`\`\``).join("\n");
  return `${content}\n\n[SQL queries used in this response]\n${sqlNote}`;
}

export async function POST(req: NextRequest) {
  try {
    const payload: ChatPayload = await req.json();

    if (!payload.message?.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

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

      // Build history for agent context — all messages except the current one (last)
      // Assistant messages include SQL queries used (Option C: inputs only, no results)
      const HISTORY_LIMIT = 14; // max combined user + assistant messages sent as context
      if (existing.length > 1) {
        payload.history = existing.slice(-HISTORY_LIMIT - 1, -1).map((msg): HistoryMessage => ({
          role: msg.role,
          content: msg.role === "assistant"
            ? buildHistoryContent(msg.content, msg.parts)
            : msg.content,
        }));
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

    const stream = await runChatUseCase(payload);

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
