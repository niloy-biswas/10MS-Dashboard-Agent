"use client";

import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessage;
}

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-0.5 h-4 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-primary/60"
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center border ${
          isUser
            ? "bg-primary/20 border-primary/30 text-primary"
            : "bg-muted border-border/50 text-muted-foreground"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "max-w-[75%] bg-primary text-primary-foreground rounded-tr-sm"
            : "w-full bg-card border border-border/50 text-foreground rounded-tl-sm"
        }`}
      >
        {message.content.length === 0 && message.isStreaming ? (
          <TypingDots />
        ) : isUser ? (
          <span className={message.isStreaming ? "streaming-cursor" : ""}>{message.content}</span>
        ) : (
          <div className={`overflow-x-auto ${message.isStreaming ? "streaming-cursor" : ""}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <table className="w-full border-collapse text-xs my-3">{children}</table>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/50">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-border/50 px-3 py-2 text-left font-semibold whitespace-nowrap text-foreground">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-border/40 px-3 py-1.5 align-top text-muted-foreground">{children}</td>
                ),
                p: ({ children }) => <p className="my-1.5 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="my-0">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => <code className="bg-muted/60 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                pre: ({ children }) => <pre className="bg-muted/60 rounded p-3 overflow-x-auto text-xs my-2">{children}</pre>,
                h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 text-muted-foreground italic my-2">{children}</blockquote>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
