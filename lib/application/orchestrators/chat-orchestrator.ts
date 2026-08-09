import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createAnalyticsAgent } from "../agents/analytics-agent";
import { createOpikHandler } from "../config/opik";
import type { ResolvedChatRuntime } from "../runtime/resolve-chat-runtime";
import type { ChatPayload } from "@/lib/types";

type WireChunk =
  | { type: "begin"; metadata: { nodeName: string } }
  | { type: "item"; content: string }
  | { type: "tool_start"; tool: string; input: Record<string, unknown> }
  | { type: "tool_end"; tool: string; output: string; isError?: boolean }
  | { type: "error" };

function toolOutputToString(raw: unknown): { output: string; isError: boolean } {
  if (raw == null) return { output: "", isError: false };

  if (typeof raw === "string") {
    return { output: raw, isError: false };
  }

  if (typeof raw === "object") {
    const msg = raw as {
      content?: unknown;
      status?: string;
      message?: string;
    };
    const isError = msg.status === "error";
    if (typeof msg.content === "string") {
      return { output: msg.content, isError };
    }
    if (Array.isArray(msg.content)) {
      const text = msg.content
        .map((c) => {
          if (typeof c === "string") return c;
          if (c && typeof c === "object" && "text" in c) {
            return String((c as { text?: unknown }).text ?? "");
          }
          return "";
        })
        .join("");
      return { output: text || JSON.stringify(raw), isError };
    }
    if (typeof msg.message === "string") {
      return { output: msg.message, isError: true };
    }
  }

  return { output: JSON.stringify(raw), isError: false };
}

function toolErrorToString(raw: unknown): string {
  if (raw instanceof Error) return raw.message;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "message" in raw) {
    return String((raw as { message: unknown }).message);
  }
  try {
    return JSON.stringify(raw ?? "Tool failed");
  } catch {
    return "Tool failed";
  }
}

export async function streamAgentResponse(
  payload: ChatPayload,
  runtime: ResolvedChatRuntime
): Promise<ReadableStream> {
  const agent = await createAnalyticsAgent(payload, runtime);
  const opik = createOpikHandler();

  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      const emit = (chunk: WireChunk) =>
        controller.enqueue(enc.encode(JSON.stringify(chunk) + "\n"));

      try {
        const history = (payload.history ?? []).map((m) =>
          m.role === "user"
            ? new HumanMessage(m.content)
            : new AIMessage(m.content)
        );

        const events = agent.streamEvents(
          { messages: [...history, new HumanMessage(payload.message)] },
          { version: "v2", callbacks: [opik] }
        );

        for await (const event of events) {
          if (event.event === "on_tool_start") {
            const toolName = event.name ?? "unknown";
            emit({ type: "begin", metadata: { nodeName: toolName } });
            emit({ type: "tool_start", tool: toolName, input: (event.data?.input ?? {}) as Record<string, unknown> });
          } else if (event.event === "on_tool_end") {
            const toolName = event.name ?? "unknown";
            const { output, isError } = toolOutputToString(event.data?.output);
            emit({ type: "tool_end", tool: toolName, output, isError: isError || undefined });
          } else if (event.event === "on_tool_error") {
            const toolName = event.name ?? "unknown";
            emit({
              type: "tool_end",
              tool: toolName,
              output: toolErrorToString(event.data?.error ?? event.data),
              isError: true,
            });
          } else if (event.event === "on_chat_model_stream") {
            const raw = event.data?.chunk?.content;
            let token = "";
            if (typeof raw === "string") {
              // OpenAI format
              token = raw;
            } else if (Array.isArray(raw)) {
              // Anthropic format: [{type: "text", text: "..."}]
              token = raw
                .filter((c: { type: string }) => c.type === "text")
                .map((c: { text?: string }) => c.text ?? "")
                .join("");
            }
            if (token) emit({ type: "item", content: token });
          }
        }
      } catch (err) {
        console.error("Agent stream error:", err);
        emit({ type: "error" });
      } finally {
        await opik.flushAsync();
        controller.close();
      }
    },
  });
}