# AGENTS.md — Average Analyst

Compact orientation for coding agents. Read this before large changes.

Product brand: **Average Analyst** (`lib/brand.ts`: name, tagline, `supportEmail`, `githubUrl`, `marketingPrimaryCta`, `contactMailto`). Shared mark: **`components/brand-mark.tsx`**. Public marketing at **`/`**; authenticated product home at **`/app`**.

## What this is

Next.js app: **published** BI dashboards (`dashboards`), **per-dashboard chat** (`chat_sessions` / `chat_messages`), **LangGraph** analytics agent against **BigQuery**, optional **share-by-link**. **Admin workspace** (`/admin`) lets editors/admins manage dashboard lifecycle, context (rules, caveats, instructions, example questions, table allowlist), data sources, AI provider settings, and signup email domain, without editing SQL by hand for day-to-day work.

## Stack

- **Framework:** Next.js **16** (App Router), React 19, TypeScript strict.
- **UI:** Tailwind 4, shadcn-style components (`components/ui/`), Framer Motion, react-markdown, Recharts.
- **Auth:** Supabase Auth (email/password + Google). **Allowed email domain** comes from `app_settings` (admin: `/admin/settings/auth`), with **`ALLOWED_EMAIL_DOMAIN`** env as bootstrap fallback; `*` allows any domain when configured that way. Google sign-in passes an optional OAuth **`hd`** hint matching that host when the domain is not `*` (see `lib/auth/allowed-email-domain.ts`). SSR: `@supabase/ssr`.
- **Data:** Supabase Postgres: app catalog, chat, `app_settings`, `data_sources`, encrypted credentials/keys.
- **Warehouse:** **BigQuery** via LangChain tools. Credentials: per-dashboard **`data_sources`** row when `dashboards.data_source_id` is set; otherwise env **`BIGQUERY_PROJECT`** / **`GOOGLE_APPLICATION_CREDENTIALS_JSON`** (and related) as in `.env.example`.
- **Agent:** LangGraph / LangChain under `lib/application/`, streaming from **`POST /api/chat`**.

## Repo map

| Area | Path |
|------|------|
| Pages | `app/` — **`/`** marketing (public), **`/app`** dashboard selector (auth), `/login`, `/signup`, `/auth/callback`, `/chat/[dashboardId]` → `/chat/[dashboardId]/[sessionNumber]`, `/share/[token]`, **`/admin/**`** |
| Marketing UI | **`components/marketing/`** (landing sections, demo data, config copy) |
| Brand | **`lib/brand.ts`** |
| Chat API | `app/api/chat/*` |
| Sessions API | `app/api/sessions/*` |
| Admin API | **`app/api/admin/**`** (dashboards, settings, users; enforce `user_role` server-side) |
| Public config | `app/api/public/allowed-email-domain` (anon-safe read for login/signup UI) |
| Agent / LLM | `lib/application/` — `use_cases/chat.ts`, `orchestrators/chat-orchestrator.ts`, `agents/analytics-agent.ts`, `config/*`, `prompts/` |
| Supabase | **`lib/supabase/queries.ts`**, **`admin-queries.ts`**, `client.ts`, `server.ts` |
| Types | `lib/types.ts` — `ChatPayload`, `ChatMessage`, `ChatSession`, `Dashboard`, `Profile`, etc. |
| Hooks | `hooks/use-chat.ts` — streams `/api/chat`, persists assistant via `/api/chat/save` |
| Docs | `PLAN.md`, `docs/COMPETITOR_ANALYSIS.md`, `README.md` |

## Env

See **`.env.example`**. Highlights:

- Supabase: `NEXT_PUBLIC_SUPABASE_*`, **`SUPABASE_SERVICE_ROLE_KEY`** (server; admin APIs + encrypted field access).
- **`SETTINGS_ENCRYPTION_KEY`** — required to store encrypted AI keys and BigQuery JSON from the admin UI.
- **`ADMIN_EMAIL`** — optional first-boot admin promotion when service role is available.
- **`ALLOWED_EMAIL_DOMAIN`** — optional until overridden in DB via admin settings.
- LLM: `MODEL_PROVIDER`, provider API keys, optional model overrides (admin UI can override at runtime).
- BigQuery **fallback** when a dashboard has no `data_source_id`: `BIGQUERY_PROJECT`, `BIGQUERY_LOCATION`, `GOOGLE_APPLICATION_CREDENTIALS_JSON` (or ADC locally).
- Optional: Opik tracing keys (`OPIK_*`).

## Auth edge handler

Root **`proxy.ts`** refreshes Supabase session cookies, redirects unauthenticated users to `/login` (except **`/`** marketing, **`/auth/*`**, **`/api/public/*`**, login/signup), and skips **`/auth/*`** so OAuth PKCE cookies are not corrupted before `app/auth/callback/route.ts`. Logged-in users on auth pages redirect to **`/app`**.

> If production ever shows **no redirects** while logged out, confirm Next’s expected **`middleware`** export for your deployment; this repo uses **`proxy.ts`** as the session edge entry. Align with Next docs for your version.

## Important domain rules

- **`dashboards.id`** — UUID PK (URLs `/chat/[dashboardId]`, FKs on `chat_messages`, `chat_sessions`).
- **`dashboards.dashboard_id`** — human-facing code (`G107`, …). **`dashboard_tables.dashboard_id`** is this **text** column, **not** the UUID (admin table mapping must use the short code).
- **`session_id` in payloads** — UUID = **`chat_sessions.id`**. **`session_number`** — incremental per user + dashboard for pretty URLs.

## SQL migrations and seeds

For a fresh database, apply numbered files in order under **`supabase/migrations/`** (see **`PLAN.md`** checklist):

```text
000_current_schema.sql
001_admin_workspace.sql
002_admin_top_dashboards_by_messages.sql
```

Optional demo/catalog data: **`supabase/seeds/`**.

## Chat pipeline (happy path)

1. Client sends **`ChatPayload`** to **`POST /api/chat`** (`session_id`, user, dashboard fields, `message`; optional `history`, `model`).
2. Route saves the **user** message via `saveChatMessageToSession`, may **auto-title** the session (`getChatHistoryBySession`).
3. **`runChatUseCase`** → **`streamAgentResponse`** streams the assistant; client persists via **`POST /api/chat/save`** (including **parts** / tool metadata when applicable).

Related: **`POST /api/chat/reaction`**, **`POST /api/sessions`**, **`POST /api/sessions/share`**, **`POST /api/chat/clear`**.

## Security notes (do not ignore)

- **API routes** do not uniformly re-verify the cookie session vs. `profileId` / `session_id` in the body. Treat as a **hardening gap** where relevant.
- **RLS:** confirm live Supabase policies; do not assume permissive `USING true` in all environments.

## Commands

```bash
npm install
npm run dev       # turbopack
npm run build
npm run typecheck
npm run lint
```

## Conventions

- Prefer **existing patterns** in `lib/application/` and `components/`; avoid unrelated refactors.
- **`@/`** path alias → repo root.
- Keep **`ChatPayload`**, streaming behavior, and DB writes in sync when changing the agent or API contracts.
- Prefer **data access through `lib/supabase/`** (`queries` / `admin-queries` / server client) rather than ad hoc Supabase usage spread across the tree.
- Marketing copy and demo data: keep in **`components/marketing/config.ts`** and **`demo-data.ts`**; brand identity in **`lib/brand.ts`**.
- Do not advertise roadmap items (for example Docker Compose) as available on the landing page.
