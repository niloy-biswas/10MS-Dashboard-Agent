"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Database,
  List,
  Table2,
  Loader2,
} from "lucide-react";
import { HighlightedCode } from "@/components/chat/highlighted-code";
import type { ToolCall } from "@/lib/types";

const TOOL_META: Record<string, { label: string; icon: React.ReactNode }> = {
  execute_query: { label: "SQL Query", icon: <Database className="h-3.5 w-3.5" /> },
  describe_table: { label: "Describe Table", icon: <Table2 className="h-3.5 w-3.5" /> },
  list_tables: { label: "List Tables", icon: <List className="h-3.5 w-3.5" /> },
};

// LangGraph wraps tool input as { input: '{"query":"..."}' } — unwrap it
function extractInput(input: Record<string, unknown>): Record<string, unknown> {
  if (typeof input.input === "string") {
    try {
      return JSON.parse(input.input);
    } catch {
      /* fall through */
    }
  }
  return input;
}

// Extract SQL query and unescape literal \n → real newlines
function extractSQL(input: Record<string, unknown>): string | null {
  const unwrapped = extractInput(input);
  const raw = unwrapped.query ?? unwrapped.sql;
  if (typeof raw !== "string") return null;
  return raw.replace(/\\n/g, "\n").replace(/\\t/g, "\t").trim();
}

function looksLikeErrorOutput(output: string): boolean {
  const trimmed = output.trim();
  if (!trimmed) return true;
  try {
    JSON.parse(trimmed);
    return false;
  } catch {
    // Non-JSON tool failures from LangChain / BigQuery (list_tables success is plain text without these).
    return /(?:\berror\b|\bexception\b|\bfailed\b|credentials|authentication|permission denied|could not load)/i.test(
      trimmed
    );
  }
}

function OutputContent({ output, isError }: { output: string; isError: boolean }) {
  if (isError) {
    return (
      <pre className="whitespace-pre-wrap break-all font-mono text-destructive/90 leading-relaxed max-h-64 overflow-y-auto">
        {output}
      </pre>
    );
  }

  try {
    const parsed = JSON.parse(output);

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return <p className="text-muted-foreground italic">No rows returned</p>;
      const headers = Object.keys(parsed[0]);
      const rows = parsed.slice(0, 100);
      return (
        <div>
          <p className="text-muted-foreground mb-2">
            {parsed.length} row{parsed.length !== 1 ? "s" : ""} returned
            {parsed.length > 100 ? " (showing first 100)" : ""}
          </p>
          <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-1.5 text-left font-semibold text-foreground/70 border-b border-border whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: Record<string, unknown>, i: number) => (
                  <tr key={i} className="even:bg-muted/30">
                    {headers.map((h) => (
                      <td
                        key={h}
                        className="px-3 py-1.5 border-b border-border/50 text-foreground/80 whitespace-nowrap"
                      >
                        {row[h] === null || row[h] === undefined ? (
                          <span className="text-muted-foreground italic">null</span>
                        ) : (
                          String(row[h])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <pre className="whitespace-pre-wrap break-all font-mono text-foreground/80 leading-relaxed max-h-64 overflow-y-auto">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    return (
      <pre className="whitespace-pre-wrap break-all font-mono text-foreground/80 leading-relaxed max-h-64 overflow-y-auto">
        {output}
      </pre>
    );
  }
}

export function ToolCallBlock({
  toolCall,
  isStreaming = false,
}: {
  toolCall: ToolCall;
  isStreaming?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const meta = TOOL_META[toolCall.tool] ?? {
    label: toolCall.tool,
    icon: <Database className="h-3.5 w-3.5" />,
  };
  const hasOutput = Boolean(toolCall.output?.trim());
  const pending = !hasOutput && !toolCall.isError && isStreaming;
  // Prefer explicit isError; fall back for legacy saves missing the flag.
  const failed =
    toolCall.isError === true ||
    (!hasOutput && !isStreaming) ||
    (hasOutput && toolCall.isError == null && looksLikeErrorOutput(toolCall.output!));
  const sql = toolCall.tool === "execute_query" ? extractSQL(toolCall.input) : null;
  const unwrappedInput = extractInput(toolCall.input);
  const detailText = toolCall.output?.trim() || "Tool did not complete successfully.";

  return (
    <div
      className={`my-2 rounded-xl border overflow-hidden text-xs ${
        failed
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-muted/40"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (pending) return;
          setOpen((v) => !v);
        }}
        disabled={pending}
        aria-expanded={open}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
          pending ? "cursor-default" : "hover:bg-muted/60"
        }`}
      >
        <span className={failed ? "text-destructive" : "text-muted-foreground"}>{meta.icon}</span>
        <span className={`font-medium flex-1 ${failed ? "text-destructive/90" : "text-foreground/80"}`}>
          {meta.label}
          {failed ? " · failed" : ""}
        </span>
        {pending ? (
          <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
        ) : (
          <>
            {failed && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
            {open ? (
              <ChevronDown className={`h-3.5 w-3.5 ${failed ? "text-destructive/80" : "text-muted-foreground"}`} />
            ) : (
              <ChevronRight className={`h-3.5 w-3.5 ${failed ? "text-destructive/80" : "text-muted-foreground"}`} />
            )}
          </>
        )}
      </button>

      {open && !pending && (
        <div className="border-t border-border/80 divide-y divide-border/80">
          <div className="px-3 py-2.5">
            <p className="text-muted-foreground mb-1.5 uppercase tracking-wide text-[10px] font-semibold">
              Input
            </p>
            {sql ? (
              <HighlightedCode
                code={sql}
                language="sql"
                wrapperClassName="-mx-3 -mb-2.5"
                customStyle={{
                  borderRadius: "0 0 0.75rem 0.75rem",
                  fontSize: "0.72rem",
                  border: "none",
                  padding: "0.75rem 1rem",
                }}
              />
            ) : (
              <pre className="whitespace-pre-wrap break-all font-mono text-foreground/80 leading-relaxed">
                {JSON.stringify(unwrappedInput, null, 2)}
              </pre>
            )}
          </div>

          <div className="px-3 py-2.5">
            <p
              className={`mb-1.5 uppercase tracking-wide text-[10px] font-semibold ${
                failed ? "text-destructive/80" : "text-muted-foreground"
              }`}
            >
              {failed ? "Error" : "Output"}
            </p>
            <OutputContent output={detailText} isError={failed} />
          </div>
        </div>
      )}
    </div>
  );
}
