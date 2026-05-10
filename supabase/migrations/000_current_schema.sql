-- ============================================================
-- 000_current_schema.sql
-- Full baseline schema as it exists in production today.
-- Run this on a fresh DB to reproduce current state exactly.
-- All subsequent changes go in numbered files: 001_, 002_, etc.
-- ============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;

-- ============================================================
-- SEQUENCES
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.n8n_chat_histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id          uuid DEFAULT gen_random_uuid() NOT NULL,
    name        text NOT NULL,
    email       text NOT NULL,
    role        text DEFAULT 'Analyst' NOT NULL,
    avatar_url  text,
    created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dashboards (
    id                uuid DEFAULT gen_random_uuid() NOT NULL,
    dashboard_id      text NOT NULL,
    dashboard_name    text NOT NULL,
    vertical          text,
    purpose           text,
    link              text,
    refresh_window    text,
    description       text,
    available_metrics text[],
    available_filters text[],
    is_active         boolean DEFAULT true NOT NULL,
    created_at        timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dashboard_tables (
    id           uuid DEFAULT gen_random_uuid() NOT NULL,
    dashboard_id text NOT NULL,        -- TEXT short code e.g. "G107", not UUID
    table_name   text NOT NULL,
    row_count    text,
    description  text,
    notes        text,
    created_at   timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id             uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id     uuid NOT NULL,
    dashboard_id   uuid NOT NULL,
    session_number integer NOT NULL,
    title          text DEFAULT 'New Chat' NOT NULL,
    is_shared      boolean DEFAULT false,
    share_token    uuid DEFAULT gen_random_uuid(),
    created_at     timestamptz DEFAULT now() NOT NULL,
    updated_at     timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id           uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id   uuid NOT NULL,
    dashboard_id uuid NOT NULL,
    session_id   uuid,
    role         text NOT NULL,
    content      text NOT NULL,
    metadata     jsonb,
    reaction     text,
    feedback     text,
    tool_calls   jsonb,
    created_at   timestamptz DEFAULT now() NOT NULL
);

-- Legacy: n8n chat history table (kept for reference, not used by current agent)
CREATE TABLE IF NOT EXISTS public.n8n_chat_histories (
    id         integer DEFAULT nextval('public.n8n_chat_histories_id_seq') NOT NULL,
    session_id character varying(255) NOT NULL,
    message    jsonb NOT NULL
);

ALTER SEQUENCE public.n8n_chat_histories_id_seq OWNED BY public.n8n_chat_histories.id;

-- ============================================================
-- PRIMARY KEYS
-- ============================================================

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.dashboards
    ADD CONSTRAINT dashboards_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.dashboard_tables
    ADD CONSTRAINT dashboard_tables_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.n8n_chat_histories
    ADD CONSTRAINT n8n_chat_histories_pkey PRIMARY KEY (id);

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT unique_session UNIQUE (profile_id, dashboard_id, session_number);

-- ============================================================
-- CHECK CONSTRAINTS
-- ============================================================

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_role_check
    CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text]));

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_reaction_check
    CHECK (reaction = ANY (ARRAY['liked'::text, 'disliked'::text]));

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_dashboard_id_fkey
    FOREIGN KEY (dashboard_id) REFERENCES public.dashboards(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_dashboard_id_fkey
    FOREIGN KEY (dashboard_id) REFERENCES public.dashboards(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
    ON public.chat_messages USING btree (session_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_profile_dashboard
    ON public.chat_sessions USING btree (profile_id, dashboard_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_tables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Public read profiles"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Service can insert profiles"
    ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.email() = email);

-- dashboards
CREATE POLICY "Public read dashboards"
    ON public.dashboards FOR SELECT USING (true);

-- dashboard_tables
CREATE POLICY "Public read dashboard tables"
    ON public.dashboard_tables FOR SELECT USING (true);

CREATE POLICY "Public insert dashboard tables"
    ON public.dashboard_tables FOR INSERT WITH CHECK (true);

-- chat_sessions
CREATE POLICY "Public read sessions"
    ON public.chat_sessions FOR SELECT USING (true);

CREATE POLICY "Public insert sessions"
    ON public.chat_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update sessions"
    ON public.chat_sessions FOR UPDATE USING (true);

CREATE POLICY "Public delete sessions"
    ON public.chat_sessions FOR DELETE USING (true);

CREATE POLICY "Authenticated read shared sessions"
    ON public.chat_sessions FOR SELECT TO authenticated
    USING (is_shared = true);

-- chat_messages
CREATE POLICY "Public read chat messages"
    ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Public insert chat messages"
    ON public.chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update chat messages"
    ON public.chat_messages FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public delete chat messages"
    ON public.chat_messages FOR DELETE USING (true);

CREATE POLICY "Authenticated read shared messages"
    ON public.chat_messages FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
              AND chat_sessions.is_shared = true
        )
    );

-- n8n_chat_histories
CREATE POLICY "Public read n8n histories"
    ON public.n8n_chat_histories FOR SELECT USING (true);

CREATE POLICY "Public insert n8n histories"
    ON public.n8n_chat_histories FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete n8n histories"
    ON public.n8n_chat_histories FOR DELETE USING (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  insert into public.profiles (id, name, email, role, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    'Analyst',
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (email) do update
    set avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

-- Email domain restriction (currently hardcoded — replaced in 001_admin_workspace.sql)
CREATE OR REPLACE FUNCTION public.enforce_email_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  if new.email not like '%@10minuteschool.com' then
    raise exception 'Only @10minuteschool.com email addresses are allowed.';
  end if;
  return new;
end;
$$;

-- ============================================================
-- TRIGGERS (on auth.users — must be run in Supabase SQL editor,
-- not via migration runner, because auth schema requires elevated access)
-- ============================================================

-- BEFORE INSERT on auth.users → enforce_email_domain()
-- CREATE TRIGGER enforce_email_domain_trigger
--     BEFORE INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.enforce_email_domain();

-- AFTER INSERT on auth.users → handle_new_user()
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();