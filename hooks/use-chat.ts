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

        // Smooth display: drain received chars to screen at a controlled rate
        const CHARS_PER_FRAME = 30;
        let displayedSegLen = 0; // chars of segmentContent currently shown
        let rafId: number | null = null;

        const doDisplay = () => {
          rafId = null;
          if (displayedSegLen >= segmentContent.length) return;
          displayedSegLen = Math.min(displayedSegLen + CHARS_PER_FRAME, segmentContent.length);
          const rawSeg = segmentContent.slice(0, displayedSegLen);
          const rawFull = streamedContent.slice(0, streamedContent.length - segmentContent.length + displayedSegLen);
          const displaySeg = rawSeg.replace(/\\n/g, "\n");
          const displayFull = rawFull.replace(/\\n/g, "\n").trim();
          const displayParts = parts.map((p, i) =>
            i === parts.length - 1 && p.type === "text"
              ? { type: "text" as const, content: displaySeg }
              : p
          );
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: displayFull, parts: displayParts, isStreaming: true, thinkingState: null }
                : m
            )
          );
          if (displayedSegLen < segmentContent.length) {
            rafId = requestAnimationFrame(doDisplay);
          }
        };

        const scheduleDisplay = () => {
          if (rafId === null) rafId = requestAnimationFrame(doDisplay);
        };

        const flushDisplay = () => {
          if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
          displayedSegLen = segmentContent.length;
        };

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
                flushDisplay();
                const newToolCall: ToolCall = { tool: chunk.tool, input: chunk.input ?? {} };
                parts = [...parts, { type: "tool_call", toolCall: newToolCall }];
                segmentContent = "";
                displayedSegLen = 0;
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

                const lastPart = parts[parts.length - 1];
                if (lastPart?.type !== "text") {
                  parts = [...parts, { type: "text", content: "" }];
                }
                scheduleDisplay();

              } else if (chunk.type === "error") {
                streamDone = true;
                flushDisplay();
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: normalize(streamedContent), isStreaming: false, hasError: true }
                      : m
                  )
                );
                break;
              }
            } catch { /* incomplete JSON chunk, skip */ }
          }
        }

        flushDisplay();
        finalContent = normalize(streamedContent);

        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: finalContent, isStreaming: false } : m)
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