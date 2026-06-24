# Architecture

## Architecture Style

HotLoop is a local-first agentic workspace application.

The product shell operates on an external content vault. It does not own the long-term content by default. It reads, indexes, renders, and orchestrates work around that vault.

## Layered View

```text
Product UI
  -> Local API
  -> Domain Services
  -> Job Runner
  -> Module Registry / Adapters
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

5. Product API Layer
   Stable endpoints for UI and commands.

6. Frontend Operations Console
   Radar, topic, article, artifact, and publish views.
```

## Repository Boundary

This product repo contains the product shell and reusable implementation.

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

packages/adapters
  Wrappers around existing scripts and external systems.
```

## Planned Apps

```text
apps/server
  Local API, job orchestration, workspace access, module execution.

apps/web
  Local operations console.
```

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
```

