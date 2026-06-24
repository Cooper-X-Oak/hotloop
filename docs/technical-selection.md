# Technical Selection

## Selection Frame

HotLoop should not start by choosing a generic agent framework.

It should start by preserving the current AI-native workflow:

```text
workspace
  + harness
  + skills
  + modules
  + durable loop
  + local artifacts
```

## Product Pattern

Selected pattern:

```text
filesystem-first agent cockpit and toolroom
```

Reference ideas:

- Vercel Eve: agent as a directory, with instructions, tools, skills, sandbox, and schedules.
- AGENTS.md: repo-native agent instructions as runtime policy.
- Durable workflow systems such as Inngest, Trigger.dev, Temporal, and LangGraph as references for resumable execution.

## Recommended Stack

### Language

TypeScript.

Rationale:

- shared types across frontend, backend, modules, and adapters
- strong fit for local tooling and browser automation
- compatible with existing Node scripts

### Frontend

React + Vite for the first local operations console.

Rationale:

- fast local development
- simpler than a full web platform
- enough for dashboard, details, preview, and job status

Next.js can be revisited later if hosted deployment or deeper Vercel integration becomes important.

### Backend

Node.js with Hono or Fastify.

Default preference: Hono for the first thin local API.

Rationale:

- low ceremony
- easy local HTTP API
- works well with TypeScript
- can wrap existing scripts through child processes

### Storage

First version:

```text
file system + JSON run ledger
```

Later:

```text
SQLite as index and query accelerator
```

Do not move long-term content assets into a database first.

### Job Runner

First version:

```text
custom local job runner + durable run ledger
```

Later candidates:

- Trigger.dev
- Inngest
- Temporal

Rationale:

The first problem is to make the current local agent loop observable and resumable, not to operate distributed workflows at scale.

### Browser / X Collection

Use local Playwright over CDP.

Rationale:

- reuses local Chrome profile and logged-in sessions
- can obey background / non-focus constraints
- avoids opaque agent search
- works with platform pages that require JavaScript or login

Managed browser-agent tools such as Stagehand or Browser Use can be evaluated later, but should not replace deterministic local CDP collection in the first version.

### Agent Runtime and Interaction

First version:

```text
existing GPT/Codex-style agent + local harness + durable HotLoop agent sessions + typed tools
```

Later candidates:

- OpenAI Agents SDK
- Vercel Eve
- Mastra
- LangGraph

Rationale:

The current repo already has a strong AI-native harness. The first cockpit shell should make the agent durable, observable, steerable, and resumable before replacing the runtime.

The first implementation should prefer a `manual-agent` or thin local CLI bridge over a heavy agent framework. HotLoop should expose sessions, commands, tool calls, and human decision checkpoints; it should not hide execution inside an autonomous backend planner.

## Rejected for MVP

### Traditional CMS

Rejected because the primary workflow is operational and agentic, not CRUD content management.

### SaaS-first Platform

Rejected because the current workflow depends on local files, local browser profile, local credentials, and private content vaults.

### Database-first Content Store

Rejected because Markdown, HTML, image assets, source captures, and policy docs are the long-term user assets.

### Opaque Agent Search

Rejected as the main discovery path. HotLoop should use direct sources, RSS, APIs, GitHub, CDP, and recorded evidence.

### Auto-publishing

Rejected for the first product. Publishing adapters may create drafts only.
