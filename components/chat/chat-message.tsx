"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";

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
          className={`w-full rounded-2xl rounded-bl-sm px-5 py-4 text-sm leading-relaxed text-[#dde3f0]
            bg-white/[0.05] backdrop-blur-md
            border border-white/[0.08]
            ${message.isStreaming ? "streaming-cursor" : ""}`}
        >
          {message.content.length === 0 && message.isStreaming ? (
            <TypingDots />
          ) : (
            <div className="overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full border-collapse text-xs">{children}</table>
                    </div>
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
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
