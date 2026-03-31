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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
  isStreaming?: boolean;
}

export interface ChatPayload {
  dashboard_id: string;
  dashboard_number: string;
  dashboard_name: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  message: string;
  history: { role: string; content: string }[];
  context_tables?: {
    table_name: string;
    description: string;
    row_count: string;
    notes: string;
  }[];
}
