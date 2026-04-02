-- ============================================================
-- 10MS Analytics — Chat Sessions Migration
-- Run this in the Supabase SQL Editor AFTER seed.sql
-- ============================================================

-- CHAT SESSIONS TABLE
create table if not exists chat_sessions (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  dashboard_id   uuid not null references dashboards(id) on delete cascade,
  session_number integer not null,
  title          text not null default 'New Chat',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint unique_session unique (profile_id, dashboard_id, session_number)
);

alter table chat_sessions enable row level security;
create policy "Public read sessions"   on chat_sessions for select using (true);
create policy "Public insert sessions" on chat_sessions for insert with check (true);
create policy "Public update sessions" on chat_sessions for update using (true);
create policy "Public delete sessions" on chat_sessions for delete using (true);

-- Add session_id column to chat_messages (nullable for backward compat)
alter table chat_messages
  add column if not exists session_id uuid references chat_sessions(id) on delete cascade;

-- Index for fast session-based message lookup
create index if not exists idx_chat_messages_session_id on chat_messages(session_id);
create index if not exists idx_chat_sessions_profile_dashboard on chat_sessions(profile_id, dashboard_id);
