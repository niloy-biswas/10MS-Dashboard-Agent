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

        // Helper to extract text from n8n's JSON format [{"output": "..."}]
        const extractText = (raw: string) => {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].output) {
              return parsed[0].output;
            }
            if (parsed.output) return parsed.output;
          } catch(e) {
            // Not valid JSON or partial JSON
          }
          
          // Fallback regex to clean up display if JSON parsing fails (e.g. during partial stream)
          const match = raw.match(/"output"\s*:\s*"([^]*)"/);
          if (match && match[1]) {
             // Replace json escaped newlines so they render correctly
             return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          }
          
          return raw; 
        };

        // Handle streaming response
        if (res.body && contentType.includes("text")) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: extractText(accumulated), isStreaming: true }
                  : m
              )
            );
          }
          finalContent = extractText(accumulated);
        } else {
          // Non-streaming JSON fallback
          const data = await res.json();
          const responseText = data.response ?? JSON.stringify(data);
          metadata = data.metadata; // Expecting metadata from API if provided
          finalContent = extractText(responseText);
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
        if (payload.user?.id) {
          await fetch("/api/chat/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
