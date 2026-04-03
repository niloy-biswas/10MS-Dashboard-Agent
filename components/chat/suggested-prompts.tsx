"use client";

import { motion } from "framer-motion";

const PROMPTS = [
  "What changed this week?",
  "Summarize the key trends",
  "Compare with last month",
  "Show me top performing segments",
];

interface SuggestedPromptsProps {
  dashboardName: string;
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ dashboardName: _dashboardName, onSelect }: SuggestedPromptsProps) {
  return (
    <div className="px-4 pb-3 flex flex-wrap gap-2">
      {PROMPTS.map((prompt, i) => (
        <motion.button
          key={prompt}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.2 }}
          onClick={() => onSelect(prompt)}
          className="text-xs border border-border/60 text-muted-foreground hover:text-foreground hover:border-[rgba(59,130,246,0.35)] hover:bg-[rgba(59,130,246,0.06)] rounded-full px-3.5 py-1.5 transition-all"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  );
}
