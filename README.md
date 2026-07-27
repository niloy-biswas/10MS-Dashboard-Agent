# Average Analyst

Governed AI analytics. Ask questions in plain English and get charts, explanations, and inspectable SQL, grounded in approved dashboards, tables, and business rules.

**Tagline:** Above-average answers from Average Analyst.

Repo: [github.com/niloy-biswas/Average-Analyst](https://github.com/niloy-biswas/Average-Analyst)  
Contact: [hello@niloy.tech](mailto:hello@niloy.tech)

## How it works

```
User message
  → Next.js API route
    → LangGraph ReAct agent (Anthropic / OpenAI)
      → BigQuery tools (execute_query, describe_table, list_tables)
    → Streamed response with inline tool call blocks
  → Supabase (session + message persistence)
```

Chat only uses **published** dashboard context (rules, caveats, approved tables). Editors draft; admins publish.

## App routes

| Path | Who | What |
|------|-----|------|
| `/` | Public | Marketing landing |
| `/app` | Signed in | Dashboard selector |
| `/chat/...` | Signed in | Analytics chat |
| `/admin/...` | Editor / admin | Context registry and settings |
| `/login`, `/signup` | Public | Auth |

Brand strings live in `lib/brand.ts`.

## Prerequisites

- Node.js 18+
- A Supabase project
- An Anthropic or OpenAI API key (env and/or admin UI)
- A GCP service account with BigQuery Data Viewer + BigQuery Job User (or per-dashboard data sources in admin)
- (Optional) An Opik account for LLM tracing

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env.local
```

Important variables (see `.env.example` for the full list):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; admin APIs and encrypted settings |
| `SETTINGS_ENCRYPTION_KEY` | Encrypt AI keys and BigQuery JSON from the admin UI |
| `ADMIN_EMAIL` | Optional first-boot admin promotion |
| `ALLOWED_EMAIL_DOMAIN` | Optional signup domain fallback before DB settings |
| `MODEL_PROVIDER` | `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Provider keys |
| `BIGQUERY_PROJECT` | Fallback GCP project when a dashboard has no data source |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Fallback service account JSON (single line) |

**3. Set up Supabase**

Apply migrations in order (SQL editor or Supabase CLI):

```text
supabase/migrations/000_current_schema.sql
supabase/migrations/001_admin_workspace.sql
supabase/migrations/002_admin_top_dashboards_by_messages.sql
```

Optional seed data: `supabase/seeds/`.

In Supabase Authentication settings, disable email confirmations if you want frictionless local signup.

**4. BigQuery credentials**

Prefer configuring a data source under **Admin → Settings → Data sources**, then assigning it on each dashboard.

For local fallback via env:

```bash
# Minify the JSON to a single line
cat your-service-account.json | tr -d '\n'
# Paste as GOOGLE_APPLICATION_CREDENTIALS_JSON=...
```

Or use Application Default Credentials and leave the JSON unset:

```bash
gcloud auth application-default login
```

**5. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then sign in to use `/app`.

## Switching LLM providers

Env fallback:

```bash
MODEL_PROVIDER=anthropic   # uses ANTHROPIC_DEFAULT_MODEL
MODEL_PROVIDER=openai      # uses OPENAI_DEFAULT_MODEL
```

Admins can also set provider, model, and encrypted API key under **Admin → Settings → Models** (overrides env when configured).

## Deploying

1. Set all required variables from `.env.example` in your host (for example Vercel).
2. Apply the Supabase migrations to a fresh project.
3. Prefer admin-configured BigQuery data sources; keep env BigQuery vars as fallback if needed.

Docker / self-host packaging is on the roadmap (see `PLAN.md`). Cloud Supabase plus a containerized Next.js app is the intended first self-host path.

## Project structure

```text
app/
  page.tsx                 Public marketing landing
  app/                     Authenticated product home (dashboard selector)
  admin/                   Admin workspace
  api/chat/                Chat, save, reaction
  api/sessions/            Sessions and sharing
  api/admin/               Dashboard and settings APIs (role-checked)
  chat/                    Per-dashboard chat UI
  share/                   Shared session view
components/
  marketing/               Landing page sections
  chat/                    Chat UI
  admin/                   Admin shell
  dashboard/               Selector and sidebar
lib/
  brand.ts                 Product name, tagline, contact, GitHub
  application/             LangGraph agent domain
  supabase/                queries, admin-queries, clients
  types.ts                 Shared TypeScript types
supabase/
  migrations/              Numbered schema migrations
  seeds/                   Optional demo data
docs/
  COMPETITOR_ANALYSIS.md   Competitive landscape notes
hooks/
  use-chat.ts              Streaming chat client
```

## Docs for agents and planning

- `AGENTS.md` — orientation for coding agents
- `PLAN.md` — operational checklist, remaining work, self-host roadmap

## License / contact

Open-source distribution details will follow the Community Edition packaging. For Cloud, implementation, or setup services, email **hello@niloy.tech**.
