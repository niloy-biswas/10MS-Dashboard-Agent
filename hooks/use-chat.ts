"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, ChatPayload, MessagePart, ToolCall } from "@/lib/types";

export function useChat(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (payload: ChatPayload) => {
      setError(null);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: payload.message,
        createdAt: new Date().toISOString(),
      };

      const assistantId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      let finalContent = "";
      let parts: MessagePart[] = [];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(errData.error ?? "Request failed");
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamedContent = "";  // full raw text across all segments — used for finalContent
        let segmentContent = "";   // raw text for the current segment between tool calls
        let streamDone = false;

        const normalize = (raw: string) =>
          raw.replace(/\\n/g, "\n").trim();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (streamDone) continue;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.replace(/\}\}\s+\{/g, "}}\n{").split("\n");
          buffer = chunks.pop() ?? "";

          for (const raw of chunks) {
            if (streamDone) break;
            try {
              const chunk = JSON.parse(raw) as {
                type: string;
                content?: string;
                metadata?: { nodeName?: string };
                tool?: string;
                input?: Record<string, unknown>;
                output?: string;
              };

              if (chunk.type === "tool_start" && chunk.tool) {
                const newToolCall: ToolCall = { tool: chunk.tool, input: chunk.input ?? {} };
                parts = [...parts, { type: "tool_call", toolCall: newToolCall }];
                segmentContent = "";
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, parts } : m)
                );

              } else if (chunk.type === "tool_end" && chunk.tool) {
                const idx = [...parts].reverse().findIndex(
                  (p) => p.type === "tool_call" &&
                    !(p as { type: "tool_call"; toolCall: ToolCall }).toolCall.output &&
                    (p as { type: "tool_call"; toolCall: ToolCall }).toolCall.tool === chunk.tool
                );
                if (idx !== -1) {
                  const realIdx = parts.length - 1 - idx;
                  const existing = (parts[realIdx] as { type: "tool_call"; toolCall: ToolCall }).toolCall;
                  parts = [
                    ...parts.slice(0, realIdx),
                    { type: "tool_call", toolCall: { ...existing, output: chunk.output } },
                    ...parts.slice(realIdx + 1),
                  ];
                }
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, parts, thinkingState: null } : m)
                );

              } else if (chunk.type === "begin") {
                const nodeName = chunk.metadata?.nodeName ?? "";
                const newState = nodeName.toLowerCase().includes("bigquery") || nodeName.toLowerCase().includes("sql")
                  ? "querying"
                  : "thinking";
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, thinkingState: newState } : m)
                );

              } else if (chunk.type === "item" && chunk.content) {
                segmentContent += chunk.content;
                streamedContent += chunk.content;
                const liveSegment = normalize(segmentContent);
                const fullContent = normalize(streamedContent);

                const lastPart = parts[parts.length - 1];
                if (lastPart?.type === "text") {
                  parts = [...parts.slice(0, -1), { type: "text", content: liveSegment }];
                } else {
                  parts = [...parts, { type: "text", content: liveSegment }];
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullContent, parts, isStreaming: true, thinkingState: null }
                      : m
                  )
                );

              } else if (chunk.type === "error") {
                streamDone = true;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: streamedContent, isStreaming: false, hasError: true }
                      : m
                  )
                );
                break;
              }
            } catch { /* incomplete JSON chunk, skip */ }
          }
        }

        finalContent = normalize(streamedContent);

        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m)
        );

        if (payload.session_id && payload.user?.id) {
          const saveRes = await fetch("/api/chat/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: payload.session_id,
              dashboardId: payload.dashboard_id,
              profileId: payload.user.id,
              content: finalContent,
              parts,
            }),
          });
          const saveData = await saveRes.json().catch(() => ({}));
          if (saveData.messageId) {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, id: saveData.messageId } : m)
            );
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "⚠️ Something went wrong. Please try again.", isStreaming: false }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}