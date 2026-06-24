# ADR 0002: Durable Run Ledger

## Status

Accepted

## Context

The writing loop can run for a long time and may involve source scanning, browser collection, topic selection, evidence capture, drafting, image generation, rendering, and publishing preparation.

If run state lives only in an agent conversation, it can be lost when context is compacted, the process is interrupted, the browser disconnects, or a different agent resumes the work.

## Decision

Every meaningful workflow execution will create a durable run directory.

The minimal run shape is:

```text
runs/<run-id>/
  run.json
  events.jsonl
  checkpoints/
  artifacts.json
```

`run.json` records the current status and active step. `events.jsonl` records append-only events. `checkpoints/` stores resumable snapshots. `artifacts.json` records references to produced or consumed files.

## Consequences

- Agents can resume from durable state instead of conversational memory.
- The UI can show progress, failures, and artifacts without scraping logs.
- Scripts and modules should emit structured events where possible.
- The first implementation can be file-based; SQLite can be added later as an index.

