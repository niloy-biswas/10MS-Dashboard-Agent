"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import { ChartBlock, type ChartSpec } from "@/components/chat/chart-block";
import { THINKING_MESSAGES, QUERYING_MESSAGES } from "@/lib/thinking-messages";

// Extract plain text from React children recursively
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) return extractText((node.props as { children?: React.ReactNode }).children);
  return "";
}

// Extract rows from thead/tbody React children
function extractTableData(children: React.ReactNode): { headers: string[]; rows: string[][] } {
  const headers: string[] = [];
  const rows: string[][] = [];

  React.Children.forEach(children, (section) => {
    if (!React.isValidElement(section)) return;
    const sectionProps = section.props as { children?: React.ReactNode };
    React.Children.forEach(sectionProps.children, (tr) => {
      if (!React.isValidElement(tr)) return;
      const trProps = tr.props as { children?: React.ReactNode };
      const cells: string[] = [];
      React.Children.forEach(trProps.children, (cell) => {
        if (!React.isValidElement(cell)) return;
        cells.push(extractText((cell.props as { children?: React.ReactNode }).children).trim());
      });
      if (headers.length === 0) {
        headers.push(...cells);
      } else {
        rows.push(cells);
      }
    });
  });

  return { headers, rows };
}

function DownloadableTable({ children }: { children: React.ReactNode }) {
  const timestamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");

  function downloadCSV() {
    const { headers, rows } = extractTableData(children);
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `table_${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadExcel() {
    try {
      const { headers, rows } = extractTableData(children);
      const xlsx = await import("xlsx");
      const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Data");
      xlsx.writeFile(wb, `table_${timestamp}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
    }
  }

  return (
    <div className="my-3 group/table">
      <div className="flex justify-end gap-1.5 mb-1 opacity-0 group-hover/table:opacity-100 transition-opacity">
        <button
          onClick={downloadCSV}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border"
        >
          <FileDown className="h-3 w-3" />
          CSV
        </button>
        <button
          onClick={downloadExcel}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border"
        >
          <FileDown className="h-3 w-3" />
          Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs rounded-lg overflow-hidden border border-border">{children}</table>
      </div>
    </div>
  );
}

type ContentPart =
  | { type: "markdown"; content: string }
  | { type: "chart"; spec: ChartSpec };

function parseContentParts(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const chartRegex = /```chart\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = chartRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "markdown", content: content.slice(lastIndex, match.index) });
    }
    try {
      const spec = JSON.parse(match[1].trim()) as ChartSpec;
      parts.push({ type: "chart", spec });
    } catch {
      parts.push({ type: "markdown", content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "markdown", content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "markdown", content: content }];
}

interface ChatMessageProps {
  message: ChatMessage;
}

function ThinkingIndicator({ state }: { state: "thinking" | "querying" }) {
  const pool = state === "querying" ? QUERYING_MESSAGES : THINKING_MESSAGES;
  const [fullText, setFullText] = useState(() => pool[Math.floor(Math.random() * pool.length)]);
  const [displayed, setDisplayed] = useState("");

  // Pick new message when state changes
  useEffect(() => {
    const next = pool[Math.floor(Math.random() * pool.length)];
    setFullText(next);
    setDisplayed("");
  }, [state]);

  // Rotate message every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      const next = pool[Math.floor(Math.random() * pool.length)];
      setFullText(next);
      setDisplayed("");
    }, 3000);
    return () => clearInterval(interval);
  }, [state]);

  // Typewriter: reveal one character at a time
  useEffect(() => {
    if (displayed.length >= fullText.length) return;
    const timeout = setTimeout(() => {
      setDisplayed(fullText.slice(0, displayed.length + 1));
    }, 28);
    return () => clearTimeout(timeout);
  }, [displayed, fullText]);

  return (
    <div className="flex items-center gap-3">
      {/* Pulsing dot trio */}
      <span className="inline-flex items-center gap-[5px] shrink-0">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block rounded-full bg-muted-foreground/50"
            style={{ width: i === 1 ? 5 : 4, height: i === 1 ? 5 : 4 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground tracking-wide">
        {displayed}
        {displayed.length < fullText.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-[1px] h-3 bg-muted-foreground/60 ml-[1px] align-middle"
          />
        )}
      </span>
    </div>
  );
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Bubble */}
      {isUser ? (
        /* ── User bubble ── */
        <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed text-foreground bg-white/55 backdrop-blur-md dark:bg-white/[0.07] border border-white/70 dark:border-white/[0.09]">
          <span className={message.isStreaming ? "streaming-cursor" : ""}>
            {message.content}
          </span>
        </div>
      ) : (
        /* ── Assistant card ── */
        <div
          className={`w-full rounded-2xl rounded-bl-sm px-5 py-4 text-sm leading-[1.75] text-foreground
            bg-white/55 backdrop-blur-md dark:bg-white/[0.05] border border-white/70 dark:border-white/[0.08]
            ${message.isStreaming && message.content.length > 0 ? "streaming-cursor" : ""}`}
        >
          {message.content.length === 0 && message.isStreaming ? (
            <ThinkingIndicator state={message.thinkingState === "querying" ? "querying" : "thinking"} />
          ) : message.isStreaming ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="overflow-x-auto">
              {parseContentParts(message.content).map((part, i) =>
                part.type === "chart" ? (
                  <ChartBlock key={i} spec={part.spec} />
                ) : (
                  <ReactMarkdown
                    key={i}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children }) => (
                        <DownloadableTable>{children}</DownloadableTable>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-primary/10 dark:bg-white/[0.06]">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="border-b-2 border-primary/20 dark:border-white/10 px-3 py-2 text-left font-semibold whitespace-nowrap text-foreground">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border-b border-border px-3 py-2 align-top text-foreground/80">
                          {children}
                        </td>
                      ),
                      p: ({ children }) => <p className="my-1.5 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="my-0">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      code: ({ children }) => (
                        <code className="bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono text-foreground/80">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-muted border border-border rounded-xl p-3 overflow-x-auto text-xs my-2">
                          {children}
                        </pre>
                      ),
                      h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground/90">{children}</h3>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-primary/50 pl-3 text-foreground/60 italic my-2">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="border-border my-3" />,
                    }}
                  >
                    {part.content}
                  </ReactMarkdown>
                )
              )}
            </div>
          )}
          {message.hasError && (
            <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Something went wrong while running the query. Please try rephrasing your question or try again.</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
