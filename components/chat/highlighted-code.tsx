"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark, atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useTheme } from "next-themes";
import type { CSSProperties } from "react";

interface HighlightedCodeProps {
  code: string;
  language: string;
  wrapperClassName?: string;
  customStyle?: CSSProperties;
}

export function HighlightedCode({ code, language, wrapperClassName = "", customStyle }: HighlightedCodeProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme !== "light";

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) {
    return <pre className="bg-muted border border-border rounded-xl p-4 overflow-x-auto text-xs font-mono">{code}</pre>;
  }

  return (
    <div className={`relative group/hlcode ${wrapperClassName}`}>
      <button
        onClick={handleCopy}
        title="Copy code"
        className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-1 rounded-md text-xs opacity-0 group-hover/hlcode:opacity-100 transition-opacity bg-black/30 hover:bg-black/50 text-white/70 hover:text-white"
      >
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={isDark ? atomOneDark : atomOneLight}
        customStyle={{
          borderRadius: "0.75rem",
          fontSize: "0.75rem",
          margin: 0,
          padding: "1rem",
          border: "1px solid var(--border)",
          background: isDark ? "#1a1d23" : "#f6f8fa",
          ...customStyle,
        }}
        showLineNumbers={code.split("\n").length > 8}
        lineNumberStyle={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)", fontSize: "0.7rem" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
