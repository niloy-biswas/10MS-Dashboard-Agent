"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, FileDown, ThumbsUp, ThumbsDown, Copy, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import { ChartBlock, type ChartSpec } from "@/components/chat/chart-block";
import { ToolCallBlock } from "@/components/chat/tool-call-block";
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
  readOnly?: boolean;
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
  }, [state, pool]);

  // Rotate message every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      const next = pool[Math.floor(Math.random() * pool.length)];
      setFullText(next);
      setDisplayed("");
    }, 3000);
    return () => clearInterval(interval);
  }, [state, pool]);

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

const MARKDOWN_COMPONENTS = {
  table: ({ children }: { children?: React.ReactNode }) => <DownloadableTable>{children}</DownloadableTable>,
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-primary/10 dark:bg-white/[0.06]">{children}</thead>,
  th: ({ children }: { children?: React.ReactNode }) => <th className="border-b-2 border-primary/20 dark:border-white/10 px-3 py-2 text-left font-semibold whitespace-nowrap text-foreground">{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td className="border-b border-border px-3 py-2 align-top text-foreground/80">{children}</td>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="my-1.5 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="my-0">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono text-foreground/80">{children}</code>,
  pre: ({ children }: { children?: React.ReactNode }) => <pre className="bg-muted border border-border rounded-xl p-3 overflow-x-auto text-xs my-2">{children}</pre>,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground/90">{children}</h3>,
  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-2 border-primary/50 pl-3 text-foreground/60 italic my-2">{children}</blockquote>,
  hr: () => <hr className="border-border my-3" />,
};

function FeedbackModal({ onSubmit, onClose }: { onSubmit: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-semibold text-foreground pr-4">What was wrong with this response?</p>
          <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="Tell us what went wrong..."
          className="w-full h-28 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{text.length}/300</span>
          <button
            onClick={() => onSubmit(text)}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Submit
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ChatMessageBubble({ message, readOnly = false }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [reaction, setReaction] = useState<"liked" | "disliked" | null>(message.reaction ?? null);
  const [copied, setCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const saveReaction = async (r: "liked" | "disliked", feedback?: string) => {
    setReaction(r);
    await fetch("/api/chat/reaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: message.id, reaction: r, feedback }),
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDislike = () => setShowFeedback(true);

  const handleFeedbackSubmit = async (text: string) => {
    setShowFeedback(false);
    await saveReaction("disliked", text);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {isUser ? (
          <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed text-foreground bg-white/55 backdrop-blur-md dark:bg-white/[0.07] border border-white/70 dark:border-white/[0.09]">
            <span className={message.isStreaming ? "streaming-cursor" : ""}>{message.content}</span>
          </div>
        ) : (
          <div className="w-full">
            <div
              className={`w-full rounded-2xl rounded-bl-sm px-5 py-4 text-sm leading-[1.75] text-foreground
                bg-white/55 backdrop-blur-md dark:bg-white/[0.05] border border-white/70 dark:border-white/[0.08]
                ${message.isStreaming && message.content.length > 0 ? "streaming-cursor" : ""}`}
            >
              {message.content.length === 0 && message.isStreaming && !message.parts?.length ? (
                <ThinkingIndicator state={message.thinkingState === "querying" ? "querying" : "thinking"} />
              ) : message.parts?.length ? (
                // Interleaved parts: text segments and tool calls in order
                <div>
                  {message.parts.map((part, i) =>
                    part.type === "tool_call" ? (
                      <ToolCallBlock key={i} toolCall={part.toolCall} />
                    ) : part.content.length === 0 && message.isStreaming ? (
                      <ThinkingIndicator key={i} state={message.thinkingState === "querying" ? "querying" : "thinking"} />
                    ) : (
                      <div key={i} className="overflow-x-auto">
                        {parseContentParts(part.content).map((cp, j) =>
                          cp.type === "chart" ? (
                            <ChartBlock key={j} spec={cp.spec} />
                          ) : (
                            <ReactMarkdown key={j} remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                              {cp.content}
                            </ReactMarkdown>
                          )
                        )}
                      </div>
                    )
                  )}
                  {/* Thinking indicator after last tool_call while waiting for next text */}
                  {message.isStreaming && message.parts[message.parts.length - 1]?.type === "tool_call" && (
                    <ThinkingIndicator state={message.thinkingState === "querying" ? "querying" : "thinking"} />
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {parseContentParts(message.content).map((part, i) =>
                    part.type === "chart" ? (
                      <ChartBlock key={i} spec={part.spec} />
                    ) : (
                      <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
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

            {/* Action buttons — only after streaming is done and not read-only */}
            {!message.isStreaming && message.content.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 ml-1">
                <button
                  onClick={handleCopy}
                  title="Copy"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {!readOnly && <button
                  onClick={() => saveReaction("liked")}
                  title="Helpful"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    reaction === "liked"
                      ? "text-green-500"
                      : "text-muted-foreground hover:text-green-500 hover:bg-accent"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>}
                {!readOnly && <button
                  onClick={handleDislike}
                  title="Not helpful"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    reaction === "disliked"
                      ? "text-destructive"
                      : "text-muted-foreground hover:text-destructive hover:bg-accent"
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>}
              </div>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showFeedback && (
          <FeedbackModal onSubmit={handleFeedbackSubmit} onClose={() => setShowFeedback(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
