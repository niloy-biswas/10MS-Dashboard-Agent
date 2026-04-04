"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileDown } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { ChartBlock, type ChartSpec } from "@/components/chat/chart-block";

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
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-muted-foreground hover:text-white hover:bg-white/[0.07] transition-colors border border-white/[0.06]"
        >
          <FileDown className="h-3 w-3" />
          CSV
        </button>
        <button
          onClick={downloadExcel}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-muted-foreground hover:text-white hover:bg-white/[0.07] transition-colors border border-white/[0.06]"
        >
          <FileDown className="h-3 w-3" />
          Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">{children}</table>
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

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-1 h-4 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-white/40"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
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
        /* ── User: same glass, right-aligned ── */
        <div
          className="max-w-[72%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed text-[#dde3f0]
            bg-white/[0.07] backdrop-blur-md
            border border-white/[0.09]"
        >
          <span className={message.isStreaming ? "streaming-cursor" : ""}>
            {message.content}
          </span>
        </div>
      ) : (
        /* ── Assistant: glass card, full width ── */
        <div
          className={`w-full rounded-2xl rounded-bl-sm px-5 py-4 text-sm leading-[1.75] text-[#dde3f0]
            bg-white/[0.05] backdrop-blur-md
            border border-white/[0.08]
            ${message.isStreaming ? "streaming-cursor" : ""}`}
        >
          {message.content.length === 0 && message.isStreaming ? (
            <TypingDots />
          ) : (
            <div className="overflow-x-auto">
              {(message.isStreaming
                ? [{ type: "markdown" as const, content: message.content }]
                : parseContentParts(message.content)
              ).map((part, i) =>
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
                        <thead className="bg-white/[0.04]">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="border border-white/10 px-3 py-2 text-left font-semibold whitespace-nowrap text-foreground">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-white/[0.07] px-3 py-1.5 align-top text-foreground/70">
                          {children}
                        </td>
                      ),
                      p: ({ children }) => <p className="my-1.5 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="my-0">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">{children}</strong>
                      ),
                      code: ({ children }) => (
                        <code className="bg-white/[0.08] border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-foreground/80">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-white/[0.06] border border-white/10 rounded-xl p-3 overflow-x-auto text-xs my-2">
                          {children}
                        </pre>
                      ),
                      h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-white">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-white">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-white/90">{children}</h3>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-primary/50 pl-3 text-foreground/60 italic my-2">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="border-white/10 my-3" />,
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
