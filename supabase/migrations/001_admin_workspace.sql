-- ============================================================
-- 001_admin_workspace.sql
-- Admin workspace foundation + Phase 3 settings schema:
-- dashboard lifecycle, RBAC, app_settings, data_sources, dashboard FK.
-- Run after 000_current_schema.sql on fresh DBs; safe to re-run pieces
-- via IF NOT EXISTS where noted (manual adjustments for prod drift).
-- ============================================================

-- ─── Profiles: RBAC ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_role text NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_role_check
      CHECK (user_role IN ('user', 'editor', 'admin'));
  END IF;
END $$;

-- ─── Dashboards: status + context fields + data source ───────
ALTER TABLE public.dashboards ADD COLUMN IF NOT EXISTS status text;

UPDATE public.dashboards
SET status = CASE WHEN is_active IS TRUE THEN 'published' ELSE 'draft' END
WHERE status IS NULL;

UPDATE public.dashboards SET status = 'draft' WHERE status IS NULL;

ALTER TABLE public.dashboards ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.dashboards ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dashboards_status_check'
  ) THEN
    ALTER TABLE public.dashboards
      ADD CONSTRAINT dashboards_status_check
      CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

ALTER TABLE public.dashboards DROP COLUMN IF EXISTS is_active;

ALTER TABLE public.dashboards ADD COLUMN IF NOT EXISTS business_rules text;
ALTER TABLE public.dashboards ADD COLUMN IF NOT EXISTS caveats text;
ALTER TABLE public.dashboards ADD COLUMN IF NOT EXISTS custom_instructions text;
ALTER TABLE public.dashboards ADD COLUMN IF NOT EXISTS example_questions text[];
ALTER TABLE public.dashboards ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.dashboards ADD COLUMN IF NOT EXISTS published_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dashboards_published_by_fkey'
  ) THEN
    ALTER TABLE public.dashboards
      ADD CONSTRAINT dashboards_published_by_fkey
      FOREIGN KEY (published_by) REFERENCES public.profiles(id);
  END IF;
END $$;

-- ─── App settings (non-sensitive key/value) ──────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (key, value)
VALUES ('allowed_email_domain', '*')
ON CONFLICT (key) DO NOTHING;

-- ─── Data sources ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  label text NOT NULL,
  project_id text NOT NULL,
  location text NOT NULL DEFAULT 'US',
  vault_secret_id uuid,
  credentials_encrypted text,
  status text NOT NULL DEFAULT 'unconfigured',
  last_tested_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.data_sources ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'US';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_sources_type_check'
  ) THEN
    ALTER TABLE public.data_sources
      ADD CONSTRAINT data_sources_type_check
      CHECK (type IN ('bigquery', 'postgres'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_sources_status_check'
  ) THEN
    ALTER TABLE public.data_sources
      ADD CONSTRAINT data_sources_status_check
      CHECK (status IN ('connected', 'error', 'unconfigured'));
  END IF;
END $$;

ALTER TABLE public.dashboards ADD COLUMN IF NOT EXISTS data_source_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dashboards_data_source_id_fkey'
  ) THEN
    ALTER TABLE public.dashboards
      ADD CONSTRAINT dashboards_data_source_id_fkey
      FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dashboards_data_source_id
  ON public.dashboards(data_source_id);

-- ─── RLS: deny direct client access (service role bypasses) ─
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'deny_all_app_settings'
  ) THEN
    CREATE POLICY deny_all_app_settings ON public.app_settings FOR ALL USING (false);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'data_sources' AND policyname = 'deny_all_data_sources'
  ) THEN
    CREATE POLICY deny_all_data_sources ON public.data_sources FOR ALL USING (false);
  END IF;
END $$;

-- ─── Email domain trigger (reads app_settings) ─────────────
CREATE OR REPLACE FUNCTION public.enforce_email_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed text;
  domain_part text;
BEGIN
  SELECT value INTO allowed
  FROM public.app_settings
  WHERE key = 'allowed_email_domain';

  IF allowed IS NULL OR trim(allowed) = '' OR trim(allowed) = '*' THEN
    RETURN new;
  END IF;

  domain_part := lower(trim(both '@' from trim(allowed)));

  IF lower(split_part(new.email, '@', 2)) <> domain_part THEN
    raise exception 'Only % email addresses are allowed.', domain_part;
  END IF;

  RETURN new;
END;
$$;
