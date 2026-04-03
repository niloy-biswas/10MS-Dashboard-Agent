"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isStreaming, placeholder = "Ask a question..." }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-5 pt-3 border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className={`flex items-end gap-3 bg-card border rounded-2xl px-4 py-3 transition-all ${
        isStreaming ? "border-[rgba(59,130,246,0.30)]" : "border-border/60 focus-within:border-[rgba(59,130,246,0.45)] focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
      }`}>
        <textarea
          ref={textareaRef}
          id="chat-input"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? "Assistant is thinking..." : placeholder}
          disabled={isStreaming}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none disabled:opacity-50 min-h-[24px] max-h-[160px] leading-relaxed py-0.5"
        />

        <AnimatePresence mode="wait">
          <motion.button
            key={isStreaming ? "stop" : "send"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleSend}
            disabled={!isStreaming && !value.trim()}
            className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
              isStreaming
                ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                : value.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isStreaming ? <Square className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          </motion.button>
        </AnimatePresence>
      </div>
      <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
