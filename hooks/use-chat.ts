"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, ChatPayload } from "@/lib/types";

export function useChat(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (payload: ChatPayload) => {
      setError(null);

      // Add user message
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
      let metadata: any = null;

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

        const contentType = res.headers.get("content-type") ?? "";

        // Legacy fallback for non-streaming n8n format: [{"output":"..."}]
        const extractLegacyText = (raw: string) => {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed[0]?.output) return parsed[0].output;
            if (parsed.output) return parsed.output;
          } catch { /* partial JSON */ }
          const match = raw.match(/"output"\s*:\s*"([^]*)"/);
          if (match?.[1]) return match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
          return raw;
        };

        // Handle streaming response
        if (res.body && contentType.includes("text")) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let streamedContent = "";
          let isN8nStream = false;
          let streamDone = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (streamDone) continue;

            buffer += decoder.decode(value, { stream: true });

            // n8n sends JSON objects separated by whitespace.
            // Each object ends with }} (nested metadata). Split on }} followed by whitespace and {.
            const chunks = buffer.replace(/\}\}\s+\{/g, "}}\n{").split("\n");
            buffer = chunks.pop() ?? ""; // last chunk may be incomplete

            for (const raw of chunks) {
              if (streamDone) break;
              try {
                const chunk = JSON.parse(raw) as { type: string; content?: string; metadata?: { nodeName?: string } };
                if (chunk.type === "begin") {
                  if (chunk.metadata?.nodeName === "Respond to Webhook") {
                    streamDone = true;
                    break;
                  }
                  isN8nStream = true;
                  const nodeName = chunk.metadata?.nodeName ?? "";
                  const newState = nodeName.toLowerCase().includes("bigquery") || nodeName.toLowerCase().includes("sql")
                    ? "querying"
                    : "thinking";
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, thinkingState: newState }
                        : m
                    )
                  );
                } else if (chunk.type === "item" && chunk.content) {
                  streamedContent += chunk.content;
                  // Normalize \n and strip tool call logs for live display
                  const liveContent = streamedContent
                    .replace(/\\n/g, "\n")
                    .replace(/Calling [^\n]+\{[^}]*(?:\{[^}]*\}[^}]*)*\}[^\n]*---?/g, "")
                    .trim();
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: liveContent, isStreaming: true, thinkingState: null }
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
              } catch { /* incomplete JSON, skip */ }
            }
          }

          // Normalize literal \n → real newlines and strip n8n internal tool call logs
          // e.g. "Calling SQL query in BigQuery with input: {...}---"
          const normalize = (raw: string) =>
            raw
              .replace(/\\n/g, "\n")
              .replace(/Calling [^\n]+\{[^}]*(?:\{[^}]*\}[^}]*)*\}[^\n]*---?/g, "")
              .trim();

          finalContent = normalize(isN8nStream ? streamedContent : extractLegacyText(buffer || streamedContent));
        } else {
          // Non-streaming JSON fallback
          const data = await res.json();
          const responseText = data.response ?? JSON.stringify(data);
          metadata = data.metadata;
          finalContent = extractLegacyText(responseText);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: finalContent, metadata, isStreaming: false }
                : m
            )
          );
        }

        // Mark streaming done if we streamed
        if (contentType.includes("text")) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            )
          );
        }

        // Save assistant message to the database
        if (payload.session_id && payload.user?.id) {
          await fetch("/api/chat/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: payload.session_id,
              dashboardId: payload.dashboard_id,
              profileId: payload.user.id,
              content: finalContent,
              metadata,
            }),
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "⚠️ Something went wrong. Please try again.",
                  isStreaming: false,
                }
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
