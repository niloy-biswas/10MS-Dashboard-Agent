import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createAnalyticsAgent } from "../agents/analytics-agent";
import { createOpikHandler } from "../config/opik";
import type { ChatPayload } from "@/lib/types";

type WireChunk =
  | { type: "begin"; metadata: { nodeName: string } }
  | { type: "item"; content: string }
  | { type: "tool_start"; tool: string; input: Record<string, unknown> }
  | { type: "tool_end"; tool: string; output: string }
  | { type: "error" };

export async function streamAgentResponse(payload: ChatPayload): Promise<ReadableStream> {
  const agent = await createAnalyticsAgent(payload);
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
            const raw = event.data?.output;
            const output = typeof raw === "string" ? raw : (raw?.content ?? JSON.stringify(raw ?? ""));
            emit({ type: "tool_end", tool: toolName, output });
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