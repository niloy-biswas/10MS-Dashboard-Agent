# Admin workspace — plan

Living document: **Phases 1–3 are done** (admin workspace, context editor, settings UI, encrypted secrets, published-only chat, per-dashboard BigQuery data sources). This file keeps **operational notes**, **reference**, **remaining build items**, and **self-host / OSS direction**.

---

## Current baseline (implemented)

- **Migrations:** apply in order for a fresh DB:
  - `supabase/migrations/000_current_schema.sql`
  - `supabase/migrations/001_admin_workspace.sql`
  - `supabase/migrations/002_admin_top_dashboards_by_messages.sql`
- **Optional seed data:** `supabase/seeds/001_dashboards.sql` (replace for non-internal deployments).
- **App:** `/admin` workspace, dashboard registry + draft/publish/archive, context + table mapping, `/admin/settings/*` (data sources, models, auth domain), `/admin/users`; chat serves **published** dashboards only; dashboard context fields injected into the agent prompt; BigQuery credentials from **`data_sources`** when `dashboards.data_source_id` is set, else **env** fallback (see `.env.example`).
- **Secrets:** AES-GCM with `SETTINGS_ENCRYPTION_KEY` in `data_sources.credentials_encrypted` and `app_settings` (including encrypted AI key). Supabase Vault as an alternate backend remains future work.

---

## New environment checklist

**1. Run migrations** (order above).

**2. Server env** (minimum for admin + encrypted settings — see `.env.example` for full list):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SETTINGS_ENCRYPTION_KEY=...   # required to persist encrypted settings from UI
ADMIN_EMAIL=...               # optional: first-login admin promotion
ALLOWED_EMAIL_DOMAIN=...      # optional fallback before DB; UI overrides via app_settings
```

**3. First admin:** rely on `ADMIN_EMAIL` with service role present, or:

```sql
UPDATE profiles SET user_role = 'admin' WHERE email = '<admin-email>';
```

**4. Runtime configuration (UI):** BigQuery under `/admin/settings/data-sources`, assign data source per dashboard under `/admin/dashboards/[id]`, model provider/key under `/admin/settings/models`, allowed signup domain under `/admin/settings/auth`.

If `001_admin_workspace.sql` was applied on an older branch **before** `data_sources.location` existed:

```sql
ALTER TABLE public.data_sources
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'US';
```

---

## Schema drift / migration hygiene

SQL applied only in the Supabase dashboard and not committed here will break reproducible installs. Prefer exporting the live public schema and folding changes into **new numbered** files under `supabase/migrations/`.

**Export options:** Supabase CLI `supabase db dump`, dashboard backups/definitions, or `information_schema.columns` queries — see historical notes in git if needed.

Target over time: small numbered migrations only (no one-off “run this in SQL editor” without a matching file).

---

## Reference — roles and guards

| Capability | user | editor | admin |
|------------|:----:|:------:|:-----:|
| Chat with published dashboards | ✓ | ✓ | ✓ |
| Create/edit dashboards & context (not publish) | | ✓ | ✓ |
| Publish / archive dashboards | | | ✓ |
| Manage data sources, AI keys, auth domain | | | ✓ |
| Assign `user_role`, any user’s position | | | ✓ |
| Edit own profile position only | | ✓ | ✓ |

- **`/admin/*`:** `editor` or `admin` (layout + server checks).
- **`/admin/settings/*`:** `admin` only.
- **Critical:** every **`/api/admin/*`** handler must verify `user_role` server-side; never rely on layout alone.

---

## Reference — prompt layers

- **Layer 1 (code):** agent behavior — SQL rules, tools, charts, safety. Ship via deploy.
- **Layer 2 (DB):** per-dashboard context — description, purpose, `business_rules`, `caveats`, `custom_instructions`, `example_questions`, approved tables. Edited in admin UI.
- **Layer 2b (code today):** static org context block in `lib/application/prompts/analytics-prompt.ts` — candidates for DB-driven or neutral copy when productizing.

---

## Reference — admin UI design

Admin uses the same stack as chat: shadcn-style `components/ui/`, tokens from `globals.css`, `ThemeProvider`, Lucide, Inter + Noto Bengali. Shell: `components/admin/admin-layout-shell.tsx`. Prefer **no** hardcoded colors outside existing tokens (e.g. brand primary token — name may still be `--10ms-red` in CSS until rebranding).

---

## Next implementation — Phase 4 (Opik)

**Goal:** trace metadata on every agent run for filtering in Opik.

**Entry:** `lib/application/orchestrators/chat-orchestrator.ts` (where Opik trace is created).

**Tags to add:** e.g. `environment`, `context_status` from `dashboard.status`, `dashboard_id` (short code), `session_type: 'chat'`. Thread `dashboard.status` and `dashboard.dashboard_id` from `app/api/chat/route.ts` through `ChatPayload` into the orchestrator.

---

## Explicitly out of scope (for now)

- Audit/change history beyond `published_at` / `published_by`
- `in_review` status, dashboard owner role, notifications on publish
- Metabase / Postgres connectors (schema supports `data_sources.type`; build when prioritized)
- Context comment threads, git-style diffs, prompt playground
- Bulk publish, API key rotation tracking, data-source health pings
- Hard delete for dashboards (archive is the safe path)

---

## Self-hosting and OSS roadmap

**Already aligned**

- Configurable **allowed email domain** (`app_settings`, UI, trigger via `enforce_email_domain()` in migrations — not hardcoded to one company).
- **`ADMIN_EMAIL`** bootstrap for first admin.
- **No Vercel-only env** in app logic (keep it that way).
- **Runtime AI/BQ overrides** from DB with env fallback.

**Still to build before “easy self-host” positioning**

- `Dockerfile` (multi-stage Node, optional Next `standalone` output).
- `docker-compose.yml` — at least: app + documented env for **Supabase Cloud** (Mode 1).
- Short **SELF_HOST** doc: env copy, migrate order, first login, admin path.
- Optional: image publish (GHCR/Docker Hub), migration runner in entrypoint.

**Deployment modes (target)**

| Mode | What runs | Complexity |
|------|-----------|------------|
| Cloud Supabase + containerized app | Recommended first OSS path | Low |
| Full self-hosted Supabase stack | All services under customer control | High |
| Future: Postgres + Auth.js | Fewer moving parts | Significant auth rewrite |

---

## Product direction (context, not a task list)

Differentiator: **governed analytics context** (registry, draft/publish, rules, approved tables, data sources) — not generic “chat with warehouse.” Self-hosted posture similar to n8n is a goal.

**Open-source prerequisites (remaining examples):** external validation on self-hosted builds, optional extra warehouse connectors, neutral branding/docs, Docker path above, stable 10MS dogfood (if that fork remains).

### Competitive landscape (reference)

- Wren AI — closest OSS GenBI direction
- Vanna.ai -- open source, self-hostable, text-to-SQL, multiple DB connectors. Already exists.
- Chat2DB -- open source, SQL chat, multi-DB. Already exists.
- Metabase itself adding AI features
- Looker, Power BI Copilot, Tableau Pulse -- Google/Microsoft/Salesforce with unlimited resources building this
- ThoughtSpot -- literally "AI-first analytics" is their entire product, $2B+ valuation
- Briefer, Evidence, Outerbase -- all open source BI with AI
- Zenlytic — semantic-layer + AI analyst direction

Detail: [`docs/COMPETITOR_ANALYSIS.md`](docs/COMPETITOR_ANALYSIS.md).

### Product surface (routing)

- **`/`** — public marketing landing (brand, offerings, FAQ).
- **`/app`** — authenticated product home (dashboard selector).
- Brand strings: `lib/brand.ts` (`Average Analyst` — changeable).
