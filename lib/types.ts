export interface Dashboard {
  id: string;
  dashboard_id: string;
  dashboard_name: string;
  vertical: string;
  purpose: string | null;
  link: string | null;
  refresh_window: string | null;
  description: string | null;
  available_metrics: string[] | null;
  available_filters: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
}

export type MessagePart =
  | { type: "text"; content: string }
  | { type: "tool_call"; toolCall: ToolCall };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
  isStreaming?: boolean;
  hasError?: boolean;
  thinkingState?: "thinking" | "querying" | null;
  reaction?: "liked" | "disliked" | null;
  feedback?: string | null;
  toolCalls?: ToolCall[];
  parts?: MessagePart[];
}

export interface ChatSession {
  id: string;
  profile_id: string;
  dashboard_id: string;
  session_number: number;
  title: string;
  is_shared: boolean;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatPayload {
  session_id: string | null;
  dashboard_id: string;
  dashboard_number: string;
  dashboard_name: string;
  model?: string;
  history?: HistoryMessage[];
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  message: string;
  context_tables?: {
    table_name: string;
    description: string;
    row_count: string;
    notes: string;
  }[];
}
