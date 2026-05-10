# Admin Workspace — Implementation Plan

## Current implementation status

This plan is now mostly implemented through Phase 3.

- `supabase/migrations/000_current_schema.sql` is the production baseline.
- `supabase/migrations/001_admin_workspace.sql` contains the admin workspace schema changes: dashboard status/context fields, `profiles.user_role`, `app_settings`, `data_sources`, configurable email-domain trigger, and `dashboards.data_source_id`.
- `/admin` is now a workspace overview.
- `/admin/dashboards` is the Dashboard Registry.
- `/admin/dashboards/new` creates draft dashboards.
- `/admin/dashboards/[id]` edits dashboard context, data source assignment, table mappings, and admin status controls.
- `/admin/users` manages user profile positions and access roles.
- `/admin/settings/*` contains admin-only global settings: data sources, AI models, and auth domain.
- Chat now serves only published dashboards and injects DB-managed dashboard context into the prompt.
- Data source and AI keys are stored encrypted with `SETTINGS_ENCRYPTION_KEY` in DB columns. Supabase Vault remains a future backend option.
- `npm run typecheck` and `npm run build` pass after the current implementation.

## Start here — operational checklist

**1. Apply migrations**
Run the baseline and admin migration in order for new environments:

```text
supabase/migrations/000_current_schema.sql
supabase/migrations/001_admin_workspace.sql
```

If `001_admin_workspace.sql` was already applied before `data_sources.location` was added, run:

```sql
ALTER TABLE public.data_sources
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'US';
```

### Configure Required Server Env

```env
SUPABASE_SERVICE_ROLE_KEY=...
SETTINGS_ENCRYPTION_KEY=...
ADMIN_EMAIL=...
ALLOWED_EMAIL_DOMAIN=10minuteschool.com
```

### Promote First Admin

Either rely on `ADMIN_EMAIL` during startup with a valid service role key, or run:

```sql
UPDATE profiles
SET user_role = 'admin'
WHERE email = '<admin-email>';
```

### Configure Runtime Settings From UI

- Add and test BigQuery under `/admin/settings/data-sources`.
- Assign the saved data source to each dashboard from `/admin/dashboards/[id]`.
- Configure model provider/key under `/admin/settings/models`.
- Configure allowed signup domain under `/admin/settings/auth`.

---

## Capturing missing migrations

SQL run directly in Supabase that is not in the repo must be exported and saved as numbered migration files before Phase 1 begins. Otherwise schema drift accumulates and self-hosters cannot reproduce the DB state.

**How to export current live schema from Supabase:**

Option A — Supabase CLI (recommended):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db dump --schema public -f supabase/migrations/000_current_schema_dump.sql
```

Option B — Supabase dashboard:
Go to Database → Backups → Download, or use Table Editor → each table → "View definition".

Option C — SQL query (run in Supabase SQL editor, exports column definitions):

```sql
SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

After export: review the dump, split into logical numbered files, delete `seed.sql` and the old ad-hoc files. Going forward all schema changes are numbered migration files only.

---

## Context

Internal 10MS analytics chat. MVP works: select dashboard → chat → LangGraph agent queries BigQuery → streamed answer.

Pain point: dashboard context (description, business rules, approved tables, prompt instructions) is managed manually in Supabase. Does not scale safely.

Goal: lightweight internal admin workspace so the data team can manage dashboard context without touching Supabase directly.

Longer-term: this context governance layer becomes the foundation for an open-source product.

---

## What the admin workspace covers

- Dashboard Context Registry (create, edit, draft/publish/archive lifecycle)
- Per-dashboard context editor (business rules, caveats, custom prompt instructions, table mapping)
- Role-based access: `user | editor | admin`
- Data source management (BigQuery connection config — admin only)
- AI model configuration (model selection + API key — admin only)
- User role management (admin only)
- Opik observability tagging (filter traces by dashboard, context status, environment)

---

## Role definitions

| Capability                                                                | user | editor | admin |
| ------------------------------------------------------------------------- | ---- | ------ | ----- |
| Chat with published dashboards                                            | yes  | yes    | yes   |
| Create new dashboards                                                     | no   | yes    | yes   |
| Edit dashboard basic info (name, vertical, purpose, link, refresh window) | no   | yes    | yes   |
| Edit dashboard context (rules, caveats, instructions, tables)             | no   | yes    | yes   |
| Publish / archive dashboards                                              | no   | no     | yes   |
| Update own profile position (`profiles.role`)                             | no   | yes    | yes   |
| Update any user's profile position                                        | no   | no     | yes   |
| Assign access roles (`profiles.user_role`)                                | no   | no     | yes   |
| Manage data source connections                                            | no   | no     | yes   |
| Configure AI model + API key                                              | no   | no     | yes   |

**DB:** `user_role` enum on `profiles`: `user | editor | admin`, default `user`

**Route guards:**

- `/admin/*` — requires `editor` or `admin`
- `/admin/settings/*` — requires `admin` only

**Critical rule:** layout guards do not protect API routes. Every `/api/admin/*` route must independently verify `user_role` via Supabase server client on every request. Never trust layout-only protection.

---

## Prompt layer split

The system prompt has two distinct layers:

**Layer 1 — agent behavior rules (sections 1, 4–16):** SQL generation, schema discovery protocol, tool usage, chart format, privacy rules. Stays in code. Version controlled. Requires deploy to change.

**Layer 2 — dashboard context block (section 3):** assembled at runtime from DB. Editor/admin-editable. Includes:

- `description` / `purpose`
- `business_rules` — domain-specific rules per dashboard
- `caveats` — known data quality issues or gaps
- `custom_instructions` — freeform prompt additions per dashboard
- `example_questions` — seeded examples
- `context_tables` — approved BQ tables (already in `dashboard_tables`)

Section 2 ("About 10 Minute School") stays in code for now.

---

## Design system

Admin pages are part of the same Next.js app and must match the existing UI exactly. No separate design language.

**Rules:**

- Use existing shadcn/ui components only (`components/ui/`) — no new UI libraries
- All color/spacing via CSS variables in `globals.css` — no hardcoded values
- Dark/light via existing `ThemeProvider` + `.dark` on `<html>` — admin shell (`components/admin/admin-layout-shell.tsx`) mirrors chat: same dark gradient/glow layers as `chat-screen.tsx`, `DashboardSidebar`-style rail (`bg-sidebar`, logo header), and a top bar `bg-card/80 backdrop-blur-md` with `ThemeToggle` on the **upper right** next to actions (same cluster pattern as `ChatHeader`; `D` shortcut still works)
- Brand token `--10ms-red` for primary actions (matches rest of app)
- Icons: Lucide only (already configured in `components.json`)
- Font: Inter + Noto Bengali (already loaded in root layout)
- Decorative backgrounds align with chat main pane (gradient + primary / blue glow blurs), not only flat `bg-background`

**In practice:** build admin pages the same way existing pages are built. Reuse components from `components/dashboard/`, `components/chat/`, `components/auth/` where they fit. Only new components are admin-specific ones (context editor form, table mapping UI, settings forms).

---

## Phase 1 — Foundation

**Goal:** live chat only serves published dashboards. Admin/editor route exists. No manual Supabase edits needed for status management.

### DB migration (`supabase/migrations/001_admin_workspace.sql`)

- Add `status` column to `dashboards`: enum `draft | published | archived`, default `draft`
- Add `user_role` column to `profiles`: enum `user | editor | admin`, default `user`
- Add to `dashboards`: `business_rules text`, `caveats text`, `custom_instructions text`, `example_questions text[]`, `published_at timestamptz`, `published_by uuid FK profiles`
- Drop `is_active` column from `dashboards` — replaced entirely by `status`
- New table `app_settings` — flat key/value for global config (`ai_provider`, `ai_model`, encrypted AI key, allowed email domain)
- New table `data_sources` — multi-row connector config with encrypted credentials, project ID, and BigQuery location
- Backfill: set all current `is_active = true` dashboards to `status = 'published'`
- Set `user_role = 'admin'` for your own profile row manually via SQL

### First-admin bootstrap

- For 10MS: manually run `UPDATE profiles SET user_role = 'admin' WHERE email = 'niloy@10minuteschool.com'` after migration
- For future open-source: support `ADMIN_EMAIL` env var — on first server start, auto-promote that profile to admin if `user_role` is still `user`

### Live chat safety

- `getDashboards()` in `lib/supabase/queries.ts`: replace `is_active = true` with `status = 'published'`
- `getDashboardById()`: add `status = 'published'` guard — blocks direct URL access to unpublished dashboards
- Note: admin/editor routes need a separate `getDashboardByIdAdmin()` that fetches regardless of status

### Prompt injection

- `buildContextSection()` in `lib/application/prompts/analytics-prompt.ts`: inject `business_rules`, `caveats`, `custom_instructions` into section 3 when non-null
- `app/api/chat/route.ts`: fetch new context fields from DB and add to payload alongside existing `context_tables`
- `lib/types.ts`: update `Dashboard` interface with new fields

### Admin route guard

- `app/admin/layout.tsx`: server component, fetches profile from Supabase session cookie, checks `user_role` is `editor` or `admin`, redirects to `/` if not
- `app/admin/settings/layout.tsx`: stricter guard, requires `admin` only
- All `/api/admin/`* routes: extract session and profile independently, return 403 if role check fails — do not rely on layout

**Status:** implemented. Live chat only serves published context. `/admin` is a guarded workspace overview, with dashboard registry at `/admin/dashboards`.

---

## Phase 2 — Context Editor

**Goal:** editors and admins create and manage all dashboard content without touching Supabase. Publish workflow live (admin only).

### Dashboard list (`app/admin/dashboards/page.tsx`)

- Table: dashboard ID, name, vertical, status badge, last updated, Edit / Publish / Archive actions
- Publish and Archive visible to admin only; editor sees Edit only
- Status filter tabs: All / Draft / Published / Archived
- "New Dashboard" button (editor and admin)

### Create dashboard (`app/admin/dashboards/new/page.tsx`)

- Form: dashboard short ID (e.g. G110), name, vertical, purpose, link, refresh window
- Saves as `status = 'draft'` — cannot be published at creation time
- Editor and admin can create

### Context editor (`app/admin/dashboards/[id]/page.tsx`)

Sections:

- **Basic info** — name, vertical, purpose, link, refresh window — editable by editor and admin
- **Context fields** — `description`, `business_rules`, `caveats`, `custom_instructions` as textarea inputs — editable by editor and admin
- **Example questions** — add/remove string list — editable by editor and admin
- **Table mapping** — list of `dashboard_tables` rows, add new table (table_name, description, notes), remove existing — editable by editor and admin
- **Status controls** — Draft / Publish / Archive buttons (admin only); confirmation on Archive
- **Timestamps** — `published_at`, `published_by` shown as read-only metadata

### `dashboard_tables` key note

`dashboard_tables.dashboard_id` is the TEXT short code (e.g. `"G107"`), not the UUID. The context editor URL uses the UUID (`/admin/dashboards/[uuid]`). Table mapping queries must join or look up the short code from `dashboards.dashboard_id` before inserting into `dashboard_tables`. Do not assume the URL param maps directly.

### Editor-to-admin handoff

No in-app notification. Editors save drafts and communicate changes to admins out-of-band (Slack, etc.). Admin reviews and publishes directly. This is intentional for current team size.

### Admin API routes

All routes verify `user_role` server-side independently.

- `POST /api/admin/dashboards` — create new dashboard (editor or admin)
- `PUT /api/admin/dashboards/[id]` — update basic info + context fields (editor or admin)
- `POST /api/admin/dashboards/[id]/status` — transition status, record `published_at` + `published_by` (admin only)
- `POST /api/admin/dashboards/[id]/tables` — add table mapping (editor or admin)
- `DELETE /api/admin/dashboards/[id]/tables/[tableName]` — remove table mapping (editor or admin)

**Deliverable:** editors create and edit dashboards, admins publish. No more manual Supabase for dashboard management.

**Status:** implemented.

Current route structure:

- `/admin` — workspace overview
- `/admin/dashboards` — dashboard registry
- `/admin/dashboards/new` — create draft dashboard
- `/admin/dashboards/[id]` — context editor and table mapping

---

## Phase 3 — Settings (admin only)

**Goal:** admins configure data sources and AI model from the UI. No env var edits for basic config changes.

### Data source management (`app/admin/settings/data-sources/page.tsx`)

Uses a proper `data_sources` table (not `app_settings`) — supports multiple connections.

**`data_sources` table schema:**

```text
id             uuid PK
type           text          -- 'bigquery' | 'postgres' (extensible)
label          text          -- display name e.g. "10MS Production BQ"
project_id     text          -- BigQuery project ID or Postgres host
location       text          -- BigQuery location, e.g. "US"
credentials_encrypted text   -- AES-GCM ciphertext; encrypted with SETTINGS_ENCRYPTION_KEY
vault_secret_id uuid         -- reserved for future Vault backend
status         text          -- 'connected' | 'error' | 'unconfigured'
last_tested_at timestamptz
created_by     uuid FK profiles
updated_at     timestamptz
```

**Credential encryption (current):** AES-256-GCM using `SETTINGS_ENCRYPTION_KEY`; ciphertext is stored in `data_sources.credentials_encrypted`. Raw credentials are never returned to the UI. API routes retrieve/decrypt secrets with the service role only.

**Credential encryption (future):** Supabase Vault can be added as a second backend later; `vault_secret_id` is reserved for that.

**UI:**

- List connected data sources with project, location, type, status, and last tested time
- Add BigQuery connection: label, project ID, location, service account JSON
- New data source must pass `SELECT 1` before it can be saved
- Existing data source edits are tested server-side before save
- Dashboards assigned to a data source via `data_source_id` FK from the dashboard editor

**Phase 3 migration (`supabase/migrations/001_admin_workspace.sql`):**

- Create `data_sources` table
- Add `location text NOT NULL DEFAULT 'US'`
- Add `data_source_id uuid FK data_sources` to `dashboards` (nullable)

### AI model configuration (`app/admin/settings/models/page.tsx`)

- Select active model provider: Anthropic / OpenAI
- Select model: dropdown of supported models per provider
- API key input: write-only after save — encrypted using `SETTINGS_ENCRYPTION_KEY`
- Test button: sends a minimal ping to validate key
- Settings stored in `app_settings` (`ai_provider`, `ai_model`, `ai_api_key_encrypted`)

### Runtime resolution order

1. `app_settings` / encrypted DB value (if set)
2. Env var fallback

First-run works from `.env`. Admin can override without redeploying.

### User management (`app/admin/users/page.tsx`)

- Table: name, email, profile position (`profiles.role`), access role (`profiles.user_role`)
- Admin can update any user's position and access role
- Editor can update only their own position
- No invite system — users sign up via existing auth flow, admin promotes role after signup

### Auth settings (`app/admin/settings/auth/page.tsx`)

- **Allowed email domain** — input field, saved to `app_settings` with key `allowed_email_domain`
  - Default: `*` (allow all) when not set — required for self-hosters
  - Set to `10minuteschool.com` for 10MS production
  - The DB trigger (`002_auth_trigger.sql`) must be updated to read this value from `app_settings` at trigger time instead of hardcoding the domain
  - Env var `ALLOWED_EMAIL_DOMAIN` remains as first-run fallback before DB is configured
- API route: `PUT /api/admin/settings/auth` — admin only, updates `app_settings`

### API routes (admin only — all verify role server-side)

- `POST /api/admin/settings/data-sources/test` — test unsaved BigQuery connection before save
- `POST /api/admin/settings/data-sources` — create connection after server-side test, store encrypted credentials
- `PUT /api/admin/settings/data-sources/[id]` — update connection after server-side test, optionally replace encrypted credentials
- `DELETE /api/admin/settings/data-sources/[id]` — remove connection (with FK check against dashboards)
- `POST /api/admin/settings/models` — save provider + model to `app_settings`, encrypted key to `app_settings.ai_api_key_encrypted`
- `PUT /api/admin/settings/users/[id]/role` — change `user_role`
- `PUT /api/admin/settings/users/[id]/position` — change `profiles.role`

**Deliverable:** admin manages data sources, AI model, and user roles entirely from UI.

**Status:** implemented with encrypted DB storage. Supabase Vault backend remains future work.

---

## Phase 4 — Opik observability tagging

Add trace metadata to all agent runs. Entry point: `lib/application/orchestrators/chat-orchestrator.ts` where Opik trace is created.

### Tags to add

- `environment`: `'production'`
- `context_status`: `'draft' | 'published' | 'archived'` — pass from `dashboard.status`
- `dashboard_id`: short ID (G107 etc.)
- `session_type`: `'chat'`

Pass `dashboard.status` and `dashboard.dashboard_id` from `app/api/chat/route.ts` through `ChatPayload` to the orchestrator.

**Deliverable:** Opik traces filterable by dashboard and context status.

---

## Build order

```text
Phase 1 (1–2 days)
  ├── DB migration (status, user_role, context fields, drop is_active, app_settings, data_sources tables)
  ├── Query filter (published only for chat, unrestricted for admin)
  ├── Prompt injection (business_rules, caveats, custom_instructions)
  └── Admin layout + role guards (editor vs admin, layout + API layer)
  ✅ Implemented

Phase 2 (3–4 days)
  ├── Dashboard list + New Dashboard flow
  ├── Context editor (basic info + context fields + table mapping)
  └── Admin API routes (create, update, status transition, tables)
  ✅ Implemented

Phase 3 (5–7 days)
  ├── data_sources table migration + encrypted DB credential storage
  ├── Data source management UI (BigQuery connect + pre-save test)
  ├── AI model configuration (provider + encrypted key)
  ├── User management (role assignment)
  └── app_settings + encrypted DB runtime resolution
  ✅ Implemented

Phase 4 (1 day)
  └── Opik metadata tagging
  ⏳ Pending
```

---

## Explicitly out of scope (for now)

- Audit/change history table — `published_at + published_by` is enough
- `in_review` status — add when second approver exists
- Dashboard owner role — add in open source phase
- Metabase / Postgres connectors — `data_sources.type` field supports it, build later
- Notification system (email/Slack on publish)
- Comment/discussion threads on context
- Git-style diffing of context versions
- Prompt playground — skip for now
- Bulk status transitions (publish all drafts at once)
- API key rotation / expiry tracking
- Data source health monitoring / scheduled pings
- Dashboard delete — archive is the safe alternative

---

## Self-hosting readiness

### What to do now (constraints to follow from this point)

**Supabase access isolation**
All Supabase client calls must stay inside `lib/supabase/` only — never in components, pages, or API routes directly. This is already the pattern. Keep it strict. When Supabase is eventually swappable (plain Postgres + Auth.js), only one folder changes.

**Numbered migration files**
Rename and number all SQL migrations before adding more. Target structure:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_sessions.sql
supabase/migrations/003_auth_trigger.sql
supabase/migrations/004_admin_workspace.sql    ← Phase 1
supabase/migrations/005_settings.sql           ← Phase 3
```

Supabase CLI (`supabase db push`) runs these in order. Self-hosters run the same files. No more "run this manually in the SQL editor."

**Secrets abstraction**
Current implementation uses AES-256-GCM with `SETTINGS_ENCRYPTION_KEY`; ciphertext is stored in DB columns:

- `data_sources.credentials_encrypted`
- `app_settings.ai_api_key_encrypted`

Later, add a two-backend secrets layer if open-source users need Supabase Vault:

- Backend A: Supabase Vault — default for cloud and supabase self-hosted users
- Backend B: AES-256 encryption using `SETTINGS_ENCRYPTION_KEY` env var, ciphertext stored in DB columns — implemented

Future backend selection can be resolved from an env flag (`SECRETS_BACKEND=vault|env`).

**Email domain restriction must be configurable**
Implemented in `001_admin_workspace.sql`: `enforce_email_domain()` reads `app_settings.allowed_email_domain`. Admin can change this from Settings → Auth in the UI without a redeploy. Env var `ALLOWED_EMAIL_DOMAIN` is the first-run fallback. Defaults to `*` (allow all) when neither is set — self-hosters must not be locked to a domain on first boot.

**No Vercel-specific env vars or APIs**
Already clean — no `VERCEL_URL`, `VERCEL_ENV`, etc. Never add them. Verify `npm run build` passes with no Vercel env vars present.

**`ADMIN_EMAIL` bootstrap**
First self-hoster has no admin. `ADMIN_EMAIL` env var promotes that profile on startup. Required for self-hosting UX.

### What to do later (when approaching open source)

- `Dockerfile` for Next.js app (`node:22-alpine`, multi-stage build)
- `docker-compose.yml` — two variants: cloud Supabase (env vars only) + self-hosted Supabase (~10 containers)
- Self-hosting documentation (target: deployed in under 15 minutes for cloud Supabase path)
- Migration runner baked into Docker startup (`supabase db push` or custom runner)
- Consider replacing `@supabase/ssr` + Supabase Auth with Auth.js + plain Postgres — makes self-hosting dramatically simpler (1 container instead of 10), but is a significant auth rewrite

### Self-hosting deployment modes (target)

| Mode                        | What runs                                       | Complexity                                       | Data sovereignty                      |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| Cloud Supabase + Docker app | Next.js in Docker, Supabase cloud               | Low — create Supabase account, run one container | App self-hosted, DB in Supabase cloud |
| Full self-hosted            | Next.js + Supabase self-hosted (~10 containers) | High                                             | Full                                  |
| Future: minimal             | Next.js + plain Postgres (Auth.js)              | Low — two containers                             | Full                                  |

Open-source launch targets Mode 1. Mode 3 is the long-term goal.

---

## Future direction (open source product)

The context governance layer (dashboard registry + draft/publish workflow + semantic business rules + data source management) is the differentiator — not the SQL chat. Generic "chat with warehouse" is already crowded (Vanna.ai, Chat2DB, ThoughtSpot, etc.).

Target: mid-market data teams (1–3 analysts) with a warehouse but no governed semantic layer. Self-hosted model (data stays in their infra) similar to n8n.

Pre-requisites before going open source:

1. 10MS version fully stable with admin workspace
2. Metabase / Postgres connector via `data_sources.type` (schema already supports it)
3. 3–5 external companies validated on self-hosted version
4. Clear positioning as "governed analytics context layer" not "SQL chat"
5. `ADMIN_EMAIL` bootstrap pattern implemented for first-run setup

## The Brutal Competitive Reality

### Not Implementation Plan - Future Reference Only

"Connect warehouse + chat" is one of the most crowded spaces right now:

- Wren AI — closest OSS GenBI direction
- Vanna.ai -- open source, self-hostable, text-to-SQL, multiple DB connectors. Already exists.
- Chat2DB -- open source, SQL chat, multi-DB. Already exists.
- Metabase itself adding AI features
- Looker, Power BI Copilot, Tableau Pulse -- Google/Microsoft/Salesforce with unlimited resources building this
- ThoughtSpot -- literally "AI-first analytics" is their entire product, $2B+ valuation
- Briefer, Evidence, Outerbase -- all open source BI with AI
- Zenlytic — semantic-layer + AI analyst direction
