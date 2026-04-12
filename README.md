# 10MS Analytics

An internal AI-powered data analytics assistant for 10 Minute School. Ask questions about business data in plain language — the agent queries BigQuery, returns results, and surfaces insights.

## How it works

```
User message
  → Next.js API route
    → LangGraph ReAct agent (Anthropic / OpenAI)
      → BigQuery tools (execute_query, describe_table, list_tables)
    → Streamed response with inline tool call blocks
  → Supabase (session + message persistence)
```

## Prerequisites

- Node.js 18+
- A Supabase project
- An Anthropic or OpenAI API key
- A GCP service account with BigQuery Data Viewer + BigQuery Job User roles
- (Optional) An Opik account for LLM tracing

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Key variables to set:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `MODEL_PROVIDER` | `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` | Required if `MODEL_PROVIDER=anthropic` |
| `OPENAI_API_KEY` | Required if `MODEL_PROVIDER=openai` |
| `BIGQUERY_PROJECT` | GCP project ID |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Service account key JSON (single line) |

**3. Set up Supabase**

Run the following in the Supabase SQL editor in order:

```
supabase/seed.sql
supabase/auth-trigger.sql
```

Then run this migration to support tool call persistence:

```sql
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS tool_calls JSONB;
```

In the Supabase dashboard under Authentication > Settings:
- Disable "Enable email confirmations" (internal tool)

**4. BigQuery credentials (local development)**

Option A — Service account key (same as production):
```bash
# Minify the JSON to a single line and add to .env.local
cat your-service-account.json | tr -d '\n'
# Paste output as GOOGLE_APPLICATION_CREDENTIALS_JSON=...
```

Option B — Application Default Credentials:
```bash
gcloud auth application-default login
# Leave GOOGLE_APPLICATION_CREDENTIALS_JSON unset in .env.local
```

**5. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Switching LLM providers

Change one variable in `.env.local`:

```bash
MODEL_PROVIDER=anthropic   # uses ANTHROPIC_DEFAULT_MODEL
MODEL_PROVIDER=openai      # uses OPENAI_DEFAULT_MODEL
```

## Deploying to Vercel

1. Add all environment variables from `.env.example` to Vercel project settings
2. Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` to the minified single-line JSON of your service account key
3. Deploy — BigQuery connects via the service account, no `uvx` or local tooling needed

## Project structure

```
app/
  api/chat/          Next.js API routes (chat, save, reaction, sessions)
  chat/              Chat pages per dashboard and session
lib/
  application/       LangGraph agent domain
    agents/          ReAct agent factory
    config/          LLM providers, BigQuery tools, Opik tracing
    enums/           ModelProvider, model name enums
    orchestrators/   Stream events → wire format
    prompts/         System prompt builder
    use_cases/       Entry point called by API route
  supabase/          DB client, queries
  types.ts           Shared TypeScript types
components/
  chat/              Chat UI (messages, tool call blocks, input, header)
hooks/
  use-chat.ts        Streaming state management
```