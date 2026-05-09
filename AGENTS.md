# AGENTS.md — 10MS Analytics Assistant

Compact orientation for coding agents. Read this before large changes.

## What this is

Internal Next.js app: pick a BI dashboard (`dashboards`), open **per-dashboard chat sessions** (`chat_sessions`), talk to an **analytics agent** that queries BigQuery; messages persist in `chat_messages`. Optional **share-by-link** for a session.

## Stack

- **Framework:** Next.js **16** (App Router), React 19, TS strict.
- **UI:** Tailwind 4, shadcn-style components, Framer Motion, react-markdown.
- **Auth:** Supabase Auth (**email/password + Google OAuth** `@10minuteschool.com` enforced via signup + DB trigger; Google uses `hd` hint). SSR client: `@supabase/ssr`.
- **Data:** Supabase Postgres (catalog + chat). **BigQuery** via LangChain tool (GCP creds env).
- **Agent:** LangGraph / LangChain in `lib/application/` — streaming from `POST /api/chat`.

## Repo map

| Area | Path |
|------|------|
| Pages | `app/` — `/`, `/login`, `/signup`, `/auth/callback`, `/chat/[dashboardId]` → redirects to `/chat/[dashboardId]/[sessionNumber]`, `/share/[token]` |
| API | `app/api/chat/*`, `app/api/sessions/*` |
| Agent / LLM | `lib/application/` — `use_cases/chat.ts`, `orchestrators/chat-orchestrator.ts`, `agents/analytics-agent.ts`, `config/*`, `prompts/` |
| Supabase accessors | `lib/supabase/queries.ts`, `client.ts`, `server.ts` |
| Types | `lib/types.ts` — `ChatPayload`, `ChatMessage`, `ChatSession`, `Dashboard`, `Profile` |
| Hooks | `hooks/use-chat.ts` — streams `/api/chat`, persists assistant via `/api/chat/save` |

## Env

See **`.env.example`** — Supabase URLs/keys, `MODEL_PROVIDER` (anthropic \| openai), keys, BigQuery (`BIGQUERY_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`), optional Opik tracing.

## Auth edge handler

Root **`proxy.ts`** — refreshes Supabase session cookies, redirects unauthenticated users to `/login`, skips **`/auth/*`** so OAuth PKCE cookies are not corrupted before `app/auth/callback/route.ts`.

> If prod shows **no redirects** while logged out, Next may still expect **`middleware.ts`** + export **`middleware`** on your version — verify against Next docs and rename/re-export if needed.

## Important domain rules

- **`dashboards.id`** — UUID PK (used in URLs `/chat/[dashboardId]` and FKs like `chat_messages.dashboard_id`, `chat_sessions.dashboard_id`).
- **`dashboards.dashboard_id`** — human-facing code (`G107`, …). **`dashboard_tables.dashboard_id`** is this **text** column, not the UUID.
- **`session_id` in payloads** — UUID = **`chat_sessions.id`**. **`session_number`** is incremental per user+dashboard for URLs.

## SQL migrations / seeds

Run in Supabase SQL editor as needed:

- `supabase/seed.sql` — core tables + seed dashboards
- `supabase/auth-trigger.sql` — profile on signup + email domain guard
- `supabase/sessions-migration.sql` — `chat_sessions`, `chat_messages.session_id`
- `supabase/profiles-rls-migration.sql` — if present, tightens profile policies

## Chat pipeline (happy path)

1. Client sends `ChatPayload` to **`POST /api/chat`** (`session_id`, user, dashboard fields, `message`; optional `history`, `model`).
2. Route saves **user** row via `saveChatMessageToSession`, may **auto-title** session on first message (`getChatHistoryBySession`).
3. **`runChatUseCase`** → **`streamAgentResponse`** streams assistant output; client saves assistant via **`POST /api/chat/save`** (includes **parts** / tool metadata when applicable).

Related: **`POST /api/chat/reaction`**, **`POST /api/sessions`** (create), **`POST /api/sessions/share`**, **`POST /api/chat/clear`** (if still used).

## Security notes (do not ignore)

- **API routes** do not uniformly re-verify the cookie session vs. `profileId` / `session_id` in body — treat as **gap** for hardening.
- Historically **RLS was permissive** (`USING true`); newer migrations may tighten — check live policies before assuming public access.

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
- Agent-facing changes: keep streaming contract and `ChatPayload` / DB writes in sync.
