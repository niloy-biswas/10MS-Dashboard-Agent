# Competitive landscape analysis

**Purpose:** Inform product positioning, packaging (self-host / managed / services), and roadmap priorities for a **governed analytics context layer** with NL query—not a generic “chat with your warehouse” tool.

**Sources:** Public pricing pages, product/docs sites, and vendor blogs (May 2026). **Pricing and features change often**—verify on official sites before sales or investor materials.

**Competitors covered:** From [PLAN.md](../PLAN.md) competitive reference—Wren AI, Vanna.ai, Chat2DB, Metabase (+ Metabot), Looker, Power BI Copilot, Tableau Pulse, ThoughtSpot, Briefer, Evidence, Outerbase, Zenlytic.

---

## 1. Executive summary

### 1.1 Market structure

The space splits into four overlapping clusters:

| Cluster | What buyers get | Examples | Typical buyer |
|--------|------------------|----------|----------------|
| **GenBI / text-to-SQL** | NL → SQL → chart; semantic or RAG layer | Wren AI, Vanna, Chat2DB, ThoughtSpot Spotter | Analysts, data teams |
| **BI platform + AI bolt-on** | Dashboards, semantic layer, permissions; AI assists query/build | Metabase, Looker, Power BI, Tableau | Org-wide analytics |
| **Code-first / notebook BI** | Versioned reports, SQL+Markdown, optional AI codegen | Evidence, Briefer | Analytics engineers |
| **Semantic layer + AI analyst** | Governed metrics/models first; conversational layer on top | Zenlytic, (partially) Looker/ThoughtSpot | Teams with warehouse + modeling discipline |

**Crowding:** “Connect warehouse + chat” is commoditized (many OSS and cloud options). **Differentiation** that remains defensible: **draft/publish governance of dashboard context**, approved table allowlists, business rules/caveats in the prompt, per-dashboard data sources, and **self-host / data residency**—aligned with your [PLAN.md](../PLAN.md) direction.

### 1.2 Positioning snapshot (vs. this product)

| Dimension | Incumbents (typical) | Your opportunity |
|-----------|----------------------|------------------|
| **Governance** | Often retrofitted (RLS, Metabase permissions) | First-class registry + publish workflow for *context* |
| **Scope** | Whole warehouse or whole BI instance | Per-dashboard bounded context (rules + tables) |
| **Deploy** | Cloud-first or heavy enterprise | Self-host path (Docker + Supabase) like n8n |
| **Buyer** | Enterprise IT or broad “everyone” | 1–3 analysts, mid-market, warehouse but weak semantic layer |
| **Services** | Implementation partners | Fixed integration + monthly context evolution (your GTM idea) |

---

## 2. Category comparison (at a glance)

### 2.1 Deployment & openness

| Product | OSS / self-host | Managed cloud | Notes |
|---------|-----------------|---------------|--------|
| **Wren AI** | OSS (MIT-style stack on GitHub); paid self-host editions | Cloud from $0 / $179 / $559 mo (annual) | OSS lacks user mgmt, many cloud-only features |
| **Vanna.ai** | MIT framework; self-host agent loop | Cloud: $0 / $50 / $500+ / Enterprise | Admin/audit/memory often on cloud |
| **Chat2DB** | OSS GUI client on GitHub | Pro / Team / Enterprise (contact sales) | Desktop + team; private deploy = Enterprise |
| **Metabase** | OSS core | Cloud Starter $100+ / Pro $575+ | Metabot AI on paid tiers |
| **Evidence** | OSS core | Hobby free; Team $15/user; Pro $25/user | “BI as code”; AI credits on cloud |
| **Briefer** | OSS (full notebooks/dashboards) | Pro $169/mo (10 seats) | Self-host unlimited seats on OSS |
| **Outerbase** | Enterprise only (private deploy) | Free / $9 / $30 per user | Self-host not in standard tiers |
| **Zenlytic** | No public OSS | SaaS (custom / contact) | Semantic layer + Zoë agent |
| **ThoughtSpot** | No | Essentials ~$25/user; Pro usage-based | Developer embed free tier 1 year |
| **Looker / Power BI / Tableau** | On-prem variants exist (Tableau Server) | Cloud bundles | AI tied to platform subscription |

### 2.2 Pricing summary (public, approximate)

| Product | Entry | Mid | Enterprise |
|---------|-------|-----|------------|
| **Wren AI Cloud** | Free (credits) | $179/mo Essential | $559/mo Enterprise |
| **Wren AI self-host** | OSS infra cost only | Business / Enterprise Plus (contact) | + LLM + ops |
| **Vanna** | Free | $50 Explorer; $500 Team | Custom |
| **Chat2DB** | Community / trial | Pro & Team (contact) | Enterprise (SSO, private deploy) |
| **Metabase** | OSS free | $100/mo Starter cloud | $20k+/yr Enterprise |
| **Evidence** | Free hobby | $15–25/user/mo | Custom + support from $500/dev/mo |
| **Briefer** | OSS $0 | $169/mo Pro | — |
| **Outerbase** | Free (5 users) | $9–30/user/mo | Custom |
| **ThoughtSpot** | Dev embed free 1yr | ~$25/user/mo Essentials | Six-figure ACV typical |
| **Power BI** | — | Pro $14/user/mo (2025) | Premium / Fabric capacity |
| **Tableau** | — | $15/user/mo Standard | $35+ Enterprise; Tableau+ bundle |
| **Looker** | — | Platform + user (contact) | Enterprise / Embed |
| **Zenlytic** | — | Contact | Enterprise |

**Metering patterns:** Credits (Wren), tokens/CU (Fabric Copilot), per-user SaaS (most), per-query (ThoughtSpot Pro), AI call caps (Chat2DB ~1k/mo on Pro).

---

## 3. Competitor profiles

### 3.1 Wren AI — closest OSS GenBI peer

**What it is:** Generative BI platform (Canner): semantic modeling UI, NL Q&A, dashboards, AI spreadsheets, embedded API. Positions as “GenBI” with semantic layer + knowledge base.

**Offerings**

- **OSS:** Self-managed; full feature exploration for POC; you operate backend, vector DB, Postgres, LLM APIs (~$250+/mo infra cited in their docs, excluding LLM).
- **Cloud:** Free → Essential ($179/mo) → Enterprise ($559/mo) with credits, unlimited projects/members on paid tiers.
- **Commercial self-host:** Business / Enterprise Plus for private infra, compliance, dedicated support (pricing via sales).

**Pricing mechanics (cloud)**

- Web credits for questions, charts, spreadsheet runs; embedded API priced per token on Essential+.
- Free tier: 2 projects, 2 members, 10 tables/project, limited dashboards/spreadsheets.
- Enterprise adds row/column-level data control, advanced RBAC, audit logs, LDAP/OIDC, MCP (roadmap).

**Data connections & stack fit**

- Warehouses: **BigQuery, Snowflake, PostgreSQL, MySQL, Redshift**; CSV upload.
- **dbt integration** (Essential+): import manifest/catalog via Wren CLI (`wren dbt create/update`)—syncs models, descriptions, relationships.
- Cloud connections often require **IP allowlisting** to Wren’s egress.
- **Embedded AI API** for third-party apps; Slack (limited channels on lower tiers).

**Integration pattern**

```
dbt / warehouse → Wren semantic models → NL interface + dashboards + API
                     ↑
              Knowledge base + RBAC (cloud)
```

**Strengths:** Strong GenBI story; dbt-native path; clear OSS vs cloud split; embedded API for product teams.

**Weaknesses vs. you:** Governance is Wren’s semantic project model, not your **dashboard-centric publish workflow** tied to existing BI links (Looker Studio, etc.); OSS lacks user/RBAC; self-host ops heavy.

**Useful detail:** SOC 2 Type II on cloud; credit rollover rules documented on pricing page.

---

### 3.2 Vanna.ai — OSS text-to-SQL agent framework

**What it is:** MIT-licensed **agent framework** (Vanna 2.0) for production multi-tenant NL→SQL (and beyond). Cloud adds hosted admin: access control, observability, agent memory, audit.

**Offerings**

- **Framework (self-host):** `pip install vanna` — agent loop, tools, streaming; BYO LLM and DB.
- **Cloud tiers:** Free → Explorer **$50/mo** (1–2 users) → Team **$500/mo** (1–10 users) → Enterprise (custom).
- Positioning: identity-first, dual output (LLM summary + rich UI components), RLS, quotas, audit logs in 2.0.

**Pricing**

- Open core + paid cloud for “full stack” enterprises don’t want to build (sandboxes, audit, failover).

**Data connections**

- **Production:** PostgreSQL, MySQL, SQLite, Snowflake, BigQuery (+ Athena, Redshift, Oracle, SQL Server, DuckDB, ClickHouse in broader docs).
- Connection via URLs or provider-specific auth (e.g. BQ service account JSON).

**Integration pattern**

```
App / Slack / API → Vanna agent → Tool: SQL runner → Warehouse
                      ↑
            User identity + RLS + audit (2.0)
```

**Strengths:** Developer-loved OSS; explicit multi-tenant story; huge GitHub presence; not locked to one warehouse.

**Weaknesses vs. you:** No first-class **dashboard context registry** or editor/admin workflow for business rules; you assemble governance yourself. Closer to **infrastructure** than **governed product**.

**Overlap risk:** High on “NL + BigQuery”; low on “context governance UI.”

---

### 3.3 Chat2DB — AI SQL client & team tool

**What it is:** AI-driven **database GUI + Text2SQL** (hot OSS client). Pro adds AI charts, migration, unlimited DB types; Team adds collaboration; Enterprise adds SSO, private deployment, fine-tuning.

**Offerings**

- **Community / OSS:** Multi-DB client, baseline Text2SQL.
- **Pro / Team:** ~1,000 AI uses/month, all SQL DB types, auth, support (pricing often **contact sales**).
- **Enterprise:** SSO, unlimited users, **private deployment**, dedicated CSM, model fine-tuning.

**Pricing**

- Public site emphasizes plans and 30-day Pro trial; dollar amounts for Team/Enterprise often not listed—custom quotes.

**Data connections**

- **15+ types** in community; **all types** in Pro+ (MySQL, Postgres, Oracle, SQL Server, ClickHouse, MongoDB, Redis, Snowflake, etc.).
- Knowledge base + MCP settings for better Text2SQL; multi-LLM switch.

**Integration pattern**

```
Developer/analyst desktop or team server → Chat2DB → Direct DB connections
                                              ↑
                                    Not a semantic governance layer
```

**Strengths:** Broad connector list; familiar “SQL client + AI” category; private deploy at Enterprise.

**Weaknesses vs. you:** **Tooling for query authors**, not org-wide **published analytics context** or chat tied to approved dashboard surfaces. Weak fit for “only these tables for dashboard G107.”

---

### 3.4 Metabase (+ Metabot) — OSS BI with AI assistant

**What it is:** Popular open-source BI (questions, dashboards, pulses). **Metabot** adds NL Q&A, SQL help, chart summaries, Slack/MCP—respecting existing Metabase permissions.

**Offerings**

- **Open Source:** Free self-host; BYO model for AI.
- **Cloud:** Starter **~$100/mo** (+ per user), Pro **~$575/mo**, Enterprise **$20k+/yr** minimum cited in third-party summaries.
- **Metabot:** On Starter+; optional **Metabase AI Service** (managed LLM, cloud-only).

**Pricing**

- Seat + platform fee model; AI may be BYO API key or add-on service.

**Data connections & stack fit**

- Connects to **warehouses and DBs** Metabase already supports (Postgres, BQ, Snowflake, Redshift, etc.).
- Uses **Metabase models/metrics** as semantic context for AI.
- **Zero data movement** claim: queries run in your warehouse; Metabot doesn’t ingest warehouse data.

**Integration pattern**

```
Warehouse ← Metabase semantic models ← Dashboards/questions
                    ↑
              Metabot (NL) uses permissions of logged-in user
```

**Strengths:** Mature BI + sharing + permissions; Metabot leverages existing definitions; self-host friendly.

**Weaknesses vs. you:** AI is an **assistant on top of Metabase**, not a standalone **context governance** product; teams must adopt Metabase as primary BI. Less focused on **external BI links** (Looker Studio) as source of truth.

---

### 3.5 ThoughtSpot — AI-first analytics incumbent

**What it is:** Search-driven analytics platform; **Spotter** AI agent; embedding for product teams. High ACV enterprise motion.

**Offerings**

- **Essentials:** From **~$25/user/mo** (annual), 5–50 users, row limits (~25M rows cited in summaries).
- **Pro:** **~$0.10/query** usage model, larger user/data caps, Spotter + Analyst Studio.
- **Enterprise:** Custom, unlimited scale.
- **Developer / Embedded:** Free tier up to 1 year (10 users, 25M rows) for embed POC.

**Pricing caveats**

- Add-ons: Analyst Studio, extra AI queries, premium support, connectors, multi-region—TCO often **$90k–$130k+** ACV mid-market per procurement data.

**Data connections**

- Emphasis on **in-database** architectures (Snowflake, BQ, Redshift, Databricks, etc.) and ThoughtSpot’s own modeling layer.
- Strong **embed SDK** for SaaS vendors.

**Integration pattern**

```
Cloud DW → ThoughtSpot modeling / Worksheets → Search & Spotter
                    ↑
           Enterprise SSO, governance, embed APIs
```

**Strengths:** Polished AI-first UX; enterprise sales machine; embed story.

**Weaknesses vs. you:** Expensive; replacement BI, not a **lightweight context layer** beside existing dashboards; overkill for 1–3 analysts.

---

### 3.6 Looker (Google Cloud) — semantic BI + Gemini

**What it is:** Modeling layer (LookML) + explores + dashboards; **Gemini in Looker** and **Conversational Analytics** (data agents, NL on explores, Python advanced analysis).

**Offerings**

- **Standard / Enterprise / Embed** platform editions + user SKUs (10 standard + 2 developer users bundled; more via sales).
- Pricing: **contact sales** for platform + per-user; GCP billing complexity.

**AI features**

- NL questions against governed explores; agents; integration with Google Cloud AI stack.

**Data connections**

- Looker **connections** to warehouses BQ, Snowflake, Redshift, Postgres, etc.; LookML as semantic layer.

**Integration pattern**

```
Warehouse → LookML models → Explores/Dashboards → Gemini NL layer
```

**Strengths:** Deep governance via LookML; enterprise standard for GCP customers.

**Weaknesses vs. you:** Heavy implementation; LookML skills required; not self-serve for small teams; AI is platform upsell, not standalone OSS.

---

### 3.7 Power BI + Microsoft Fabric Copilot

**What it is:** Dominant Microsoft stack BI; Copilot in **Fabric** for Power BI reports, data flows, notebooks—billed via **capacity units** on Premium/Fabric SKUs.

**Offerings**

- **Power BI Pro:** **$14/user/mo** (2025 increase from $10).
- **PPU:** **$24/user/mo**.
- **Copilot:** Consumption on Fabric capacity—**100 CU per 1k input tokens**, **400 CU per 1k output tokens** (not a separate Copilot SKU for many customers).

**Data connections**

- Hundreds of connectors via Power Query; best experience in **Azure / OneLake / Fabric** ecosystem.

**Integration pattern**

```
Azure data estate → Fabric lakehouse/warehouse → Power BI semantic model → Copilot
```

**Strengths:** Default choice for Microsoft shops; Copilot breadth across Fabric workloads.

**Weaknesses vs. you:** Lock-in; governance spread across Fabric/PBI admin, not a simple **dashboard context registry**; self-host not relevant.

---

### 3.8 Tableau Pulse — metrics layer + AI digests

**What it is:** Salesforce Tableau’s **metrics-centric AI experience**—personalized digests, insight summaries, Slack/email; **Tableau+** bundle adds premium Pulse, Agent, Tableau Next.

**Offerings**

- **Tableau Cloud Standard:** from **~$15/user/mo** (annual) with Pulse.
- **Enterprise:** **~$35/user/mo** with Pulse.
- **Tableau+:** Sales-led bundle (Agent, enhanced Q&A).

**Constraints**

- Pulse is **Tableau Cloud–oriented** (not classic on-prem Server story in many docs).

**Data connections**

- Tableau’s existing connectors + **metrics layer** as “single source of truth” for KPIs.

**Integration pattern**

```
Sources → Tableau data model → Metric definitions → Pulse digests / Q&A
```

**Strengths:** Executive-friendly metrics narrative; Salesforce ecosystem.

**Weaknesses vs. you:** Requires Tableau adoption; AI on **metrics**, not arbitrary governed SQL tables per internal dashboard ID.

---

### 3.9 Zenlytic — semantic layer + AI analyst (Zoë)

**What it is:** **AI data analyst** built on a **self-modeling semantic layer** (Git-governed), proactive agents, cited answers, exports to Office formats.

**Offerings**

- SaaS; pricing **not fully public** (tiered by company size on reseller sites—contact sales).

**Data connections**

- **Snowflake, BigQuery, Redshift, Databricks**, etc.; **dbt** alignment; Git for semantic definitions.

**Integration pattern**

```
Warehouse + dbt → Zenlytic semantic layer (Git) → Zoë chat / Slack / Teams
                              ↑
                    Metrics lineage & permissions
```

**Strengths:** Closest **semantic + AI** story to enterprise “trusted answers”; proactive anomaly agents.

**Weaknesses vs. you:** Another **full platform**; less emphasis on **per-dashboard publish** beside existing BI URLs; not OSS/self-host positioning.

---

### 3.10 Evidence — BI as code

**What it is:** SQL + Markdown **reports as code** in Git; fast static/SSR dashboards; cloud adds scheduling, RBAC, AI dev assist.

**Offerings**

- **Hobby:** Free, 1 user, daily refresh.
- **Team:** **$15/user/mo** — hourly refresh, RLS.
- **Pro:** **$25/user/mo** — SSO, SCIM, 5-min refresh.
- **AI credits:** 1k–3k/user/mo by tier; **$0.01/credit** overage.
- **Self-host support:** Core **$500/dev/mo**, Premium custom.

**Data connections**

- Warehouse connectors via Evidence sources (BigQuery, Snowflake, Postgres, etc.—see current docs).

**Integration pattern**

```
Git repo (SQL + markdown) → Evidence build → Published site / embed
```

**Strengths:** Engineer-loved; version control native; cheap entry.

**Weaknesses vs. you:** **Reporting**, not conversational governance over **many live BI dashboards**; AI assists building reports, not operating a registry of business rules per dashboard.

---

### 3.11 Briefer — notebooks + dashboards (OSS)

**What it is:** Open-source **Notion-like** notebooks (Python, SQL, Markdown) + dashboards; AI codegen with BYO key (OSS) or bundled analyst (Pro).

**Offerings**

- **OSS:** Free self-host; unlimited seats when self-hosted; BYO OpenAI for AI blocks.
- **Pro:** **$169/mo**, 10 seats, AI analyst, large compute, schedules, premium support.

**Data connections**

- Connect notebooks to databases/data warehouses (per docs); not a warehouse governance platform.

**Integration pattern**

```
Team server / cloud → Briefer notebooks → SQL/Python → Visualizations
```

**Strengths:** Flexible analysis surface; OSS credibility; YC-backed.

**Weaknesses vs. you:** **Analyst workspace**, not **dashboard context registry** + published chat for business users.

---

### 3.12 Outerbase — collaborative database UI + EZQL

**What it is:** Modern **database browser** with AI (**EZQL**), bases, dashboards; StarbaseDB (managed SQLite) as adjacent product.

**Offerings**

- **Free:** 5 users, 1 base, 10 EZQL queries/mo.
- **Hobby:** **$9/user/mo** (annual).
- **Pro:** **$30/user/mo**, 1k EZQL/mo.
- **Enterprise:** Custom; **HIPAA, SOC 2, private cloud, audit trails**; **self-host only via Enterprise** (contact).

**Data connections**

- Cloud bases over supported databases; enterprise private deploy for strict environments.

**Integration pattern**

```
DB credentials → Outerbase UI → EZQL / dashboards
```

**Strengths:** Low-friction team UI; clear SaaS pricing on lower tiers.

**Weaknesses vs. you:** **DB-centric**, not multi-dashboard **analytics governance**; limited self-host except enterprise.

---

## 4. How competitors integrate with the modern data stack

### 4.1 Common integration archetypes

| Archetype | Who uses it | Implication for you |
|-----------|-------------|---------------------|
| **Direct warehouse** | Vanna, Chat2DB, Wren OSS | You already do BigQuery per `data_sources`; add Postgres later per schema |
| **Semantic layer (dbt / LookML / metrics)** | Wren, Zenlytic, Looker, ThoughtSpot | Long-term: import dbt manifest or metric definitions—not required for v1 |
| **BI tool permissions** | Metabase Metabot | You use **Supabase + role** + published dashboard—not full BI RBAC clone |
| **Embedded API** | Wren, ThoughtSpot embed, Vanna in-app | Future revenue: metered API if you expose governed query endpoint |
| **Slack / Teams** | Wren, Zenlytic, Metabase, Tableau Pulse | Distribution channel; not core yet |
| **IP allowlist / VPC** | Wren Cloud, enterprise tiers | Document for managed hosting offer |

### 4.2 Typical buyer stack (mid-market)

```text
Ingestion (Fivetran/Airbyte) → Warehouse (BQ/Snowflake)
        → dbt (optional) → BI (Metabase/Looker/LS) + spreadsheets
                                    ↓
              [Gap: governed NL layer per dashboard/domain]
                                    ↓
              Your product: context registry + chat + self-host
```

Most competitors **replace** a layer (full BI or full semantic platform). Your wedge is **augmenting** existing BI with **published, bounded context** without migrating all dashboards.

---

## 5. Feature matrix (selected)

| Capability | Wren | Vanna | Chat2DB | Metabase | ThoughtSpot | Zenlytic | **This product (target)** |
|------------|------|-------|---------|----------|-------------|----------|---------------------------|
| NL → SQL | ✓ | ✓ | ✓ | ✓ Metabot | ✓ | ✓ | ✓ |
| Dashboard registry | ✓ | — | — | ✓ | ✓ | ✓ | ✓ **core** |
| Draft/publish context | partial | — | — | partial | ✓ | ✓ Git | ✓ **core** |
| Business rules in prompt | KB | train/RAG | KB | models | worksheets | semantic | ✓ DB fields |
| Per-resource data source | projects | conn/str | per conn | per DB | per connection | per warehouse | ✓ per dashboard |
| Self-host OSS | ✓ | ✓ | ✓ | ✓ | — | — | roadmap |
| Admin UI for non-engineers | ✓ cloud | cloud | limited | ✓ | ✓ | ✓ | ✓ |
| Embedded analytics API | ✓ | build | — | embed | ✓ | ✓ | future |
| dbt integration | ✓ | — | — | — | partial | ✓ | future |
| Multi-DB connectors | many | many | many | many | many | many | BQ now |

---

## 6. Commercial model comparison (for your GTM)

| Model | Who does it | Fit for your plan |
|-------|-------------|-------------------|
| **Open core + cloud** | Vanna, Metabase, Wren | OSS self-host + paid cloud/support |
| **Per-seat SaaS** | Evidence, Outerbase, Tableau | Managed hosting tier |
| **Usage/credits** | Wren, Fabric Copilot, ThoughtSpot Pro | API/AI overage add-on |
| **Enterprise ACV** | ThoughtSpot, Looker | Not initial ICP |
| **Implementation services** | All enterprise vendors | **Your fixed-fee integration** |
| **Monthly retainer** | Consultancies | **Context evolution** on self-host |

Suggested packaging (aligned with prior discussion):

1. **Self-hosted license/subscription** — software + updates.  
2. **Managed hosting** — you operate app (+ optional Supabase).  
3. **Implementation (fixed)** — warehouse + N dashboards + rules.  
4. **Retainer (monthly)** — publish workflow support, new context.  
5. **Usage add-on** — LLM/BQ pass-through or credits on hosted.

---

## 7. Strategic takeaways

### 7.1 Where not to compete head-on

- **Generic Text2SQL OSS** (Vanna, Chat2DB) without governance story.  
- **Full BI replacement** (Metabase, ThoughtSpot, Looker) in year one.  
- **Microsoft/Salesforce bundling** deals (Power BI, Tableau) on their turf.

### 7.2 Where to compete

- **“Governed context layer”** between warehouse and consumers—publish rules, caveats, allowed tables, example questions.  
- **Self-host + BYO Supabase + BYO keys** for data residency (n8n-like).  
- **Services-led GTM** for teams with Looker Studio / Metabase links but no semantic layer discipline.  
- **Per-dashboard data source** for multi-tenant or multi-BQ-project shops.

### 7.3 Product gaps vs. best-in-class (roadmap hints)

| Gap | Leader to learn from | Priority |
|-----|----------------------|----------|
| dbt manifest sync | Wren, Zenlytic | Medium |
| Embedded API + metering | Wren, ThoughtSpot | Medium (matches API subscription idea) |
| Slack/Teams | Wren, Zenlytic, Metabase | Low–medium |
| Row/column security in agent | Vanna 2.0, Wren Enterprise | High for enterprise |
| Connector breadth | Chat2DB, Vanna | Medium (Postgres after BQ) |
| Docker one-click deploy | n8n, Briefer | High for OSS launch |
| Opik/trace tags by dashboard | — | Low (internal quality) |

### 7.4 Messaging cheat sheet

| Against | Say |
|---------|-----|
| **Vanna / Chat2DB** | “We’re not a SQL client—we’re **published analytics context** with an agent on top.” |
| **Wren / Zenlytic** | “Lighter weight: govern **existing dashboards**, don’t rebuild your semantic platform.” |
| **Metabase** | “Works **alongside** your BI; focused on **context workflow**, not replacing charts.” |
| **ThoughtSpot / Looker** | “Mid-market time-to-value; **self-host** and **fixed-scope** implementation.” |

---

## 8. Sources & refresh checklist

Verify before external use:

| Vendor | Primary URLs |
|--------|----------------|
| Wren AI | https://getwren.ai/pricing , https://docs.getwren.ai/ |
| Vanna | https://vanna.ai/ , https://vanna.ai/docs/ |
| Chat2DB | https://chat2db.ai/en-US/pricing |
| Metabase | https://www.metabase.com/pricing , https://www.metabase.com/docs/latest/ai/ |
| ThoughtSpot | https://www.thoughtspot.com/pricing |
| Evidence | https://evidence.dev/pricing , https://evidence.dev/pricing/ai |
| Briefer | https://docs.briefer.cloud/ , https://www.ycombinator.com/launches/ (OSS launch) |
| Outerbase | https://www.outerbase.com/pricing/ |
| Zenlytic | https://www.zenlytic.com/product , https://docs.zenlytic.com/ |
| Looker | https://cloud.google.com/looker/docs , https://cloud.google.com/looker/pricing |
| Power BI / Fabric | https://powerbi.microsoft.com/pricing , https://learn.microsoft.com/fabric/ |
| Tableau | https://www.tableau.com/pricing , https://www.tableau.com/products/tableau-pulse |

**Refresh cadence:** Quarterly, or before fundraising / website positioning updates.

---

*Document version: 1.0 — created for internal product planning; not legal or investment advice.*
