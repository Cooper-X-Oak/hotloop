# Architecture

## Architecture Style

HotLoop is a local-first agent cockpit and toolroom.

The agent remains the executor. HotLoop operates on an external content vault as the visible control surface and durable tool layer for that agent. It does not own the long-term content by default. It reads, indexes, renders, and records work around that vault.

## Layered View

```text
Agent Cockpit UI
  -> Agent Interaction Layer
  -> Local API
  -> Agent Runtime Boundary
  -> Domain Services
  -> Job Runner
  -> Module Registry / Adapters
  -> Agent / Tool Execution
  -> External Content Vault + External Platforms
```

## Runtime Layers

```text
1. Content Vault
   Long-term human and agent-readable assets.

2. Policy Layer
   AGENTS.md, skills, style docs, source policy, account positioning.

3. Module Layer
   Radar, evidence, writing, media, renderer, and publisher modules.

4. Durable Run Layer
   run.json, events.jsonl, checkpoints, artifacts, logs.

5. Cockpit API Layer
   Stable endpoints for the UI, commands, and agent tool calls.

6. Frontend Agent Console
   Radar, topic, article, artifact, and publish views.

7. Agent Runtime Boundary
   Agent sessions, messages, commands, tool invocations, human decisions, and bridge adapters.

8. Agent Interaction Surface
   Chat-style instruction input, structured quick commands, decision queue, tool timeline, and active run inspector.
```

## Repository Boundary

This repo contains the agent cockpit shell and reusable implementation.

It must not absorb private content vaults.

```text
hotloop/
  apps/
  packages/
  modules/
  loops/
  docs/

external content vault/
  AGENTS.md
  source registries
  writing policy
  topic folders
  article packages
  final HTML artifacts
  scratch runtime output
```

## Planned Packages

```text
packages/core
  Domain models and schemas:
  Source, Candidate, Topic, EvidencePack, ArticlePackage, RenderArtifact, Run, PublishJob.

packages/workspace
  File-system workspace reader and writer.

packages/policy
  AGENTS.md / skill / writing-style / account-positioning loader.

packages/modules
  Module registry, manifest validation, and module execution contracts.

packages/runner
  Durable run ledger, job execution, logs, checkpoints, and resume support.

packages/agent
  Agent session store, command queue, event log, decision queue, harness loader, and bridge contracts.

packages/adapters
  Wrappers around existing scripts and external systems.
```

## Planned Apps

```text
apps/server
  Local API, job orchestration, workspace access, module execution.

apps/web
  Local agent operations console.
```

## Agent Runtime Boundary

HotLoop does not become the agent. It gives the agent a durable cockpit.

```text
Human
  -> /agent UI
  -> Agent Session API
  -> Agent Runtime Boundary
  -> external agent executor
  -> HotLoop tool registry
  -> durable run ledger and workspace artifacts
```

The boundary is defined in [Agent Runtime and Interaction Architecture](agent-runtime.md).

Required runtime objects:

```text
AgentSession
AgentMessage
AgentCommand
AgentEvent
ToolInvocation
HumanDecision
HarnessContext
```

Required UI surfaces:

```text
/agent
  session selector
  human message composer
  structured command buttons
  agent transcript
  tool activity timeline
  human decision queue
  active run summary
```

Required API families:

```text
GET  /api/agent/sessions
POST /api/agent/sessions
GET  /api/agent/sessions/:id/messages
POST /api/agent/sessions/:id/messages
POST /api/agent/sessions/:id/commands
GET  /api/agent/sessions/:id/events
GET  /api/agent/sessions/:id/decisions
POST /api/agent/sessions/:id/decisions/:decisionId/answer
```

The existing direct workflow APIs can remain for demo and tool-level testing, but real cockpit operation should route through an agent session so actions are explainable and resumable.

## Storage Policy

Long-term content remains in the content vault:

- source captures
- evidence packs
- article drafts
- image plans
- image assets
- final HTML artifacts

Recoverable runtime state lives in scratch:

- runs
- events
- checkpoints
- logs
- upload maps
- publish results

SQLite may be introduced later as an index, not as the source of truth.

## API Shape

Initial API families:

```text
GET  /api/workspace
GET  /api/sources
POST /api/jobs/scan

GET  /api/candidates
GET  /api/candidates/lanes
POST /api/candidates/:id/select

GET  /api/topics
GET  /api/topics/:id
POST /api/topics/:id/collect
POST /api/topics/:id/write
POST /api/topics/:id/images
POST /api/topics/:id/render

GET  /api/artifacts
GET  /api/artifacts/:id/preview
POST /api/artifacts/:id/validate
POST /api/artifacts/:id/create-draft

GET  /api/runs
GET  /api/runs/:id
GET  /api/runs/:id/events
POST /api/runs/:id/resume

GET  /api/agent/sessions
POST /api/agent/sessions
GET  /api/agent/sessions/:id
GET  /api/agent/sessions/:id/messages
POST /api/agent/sessions/:id/messages
GET  /api/agent/sessions/:id/events
POST /api/agent/sessions/:id/commands
GET  /api/agent/sessions/:id/commands
GET  /api/agent/sessions/:id/decisions
POST /api/agent/sessions/:id/decisions/:decisionId/answer
POST /api/agent/sessions/:id/cancel
```
