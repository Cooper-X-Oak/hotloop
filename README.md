# HotLoop

HotLoop is a local-first agentic content workspace for high-velocity AI and technology publishing.

It is designed around an existing content vault, not a traditional CMS database. The product shell reads a local workspace, runs modular radar and writing workflows, records durable run state, renders final artifacts, and can later prepare drafts for publishing channels such as WeChat.

## Product Direction

HotLoop is not a generic AI writer. It is an operations console for deciding what is worth writing now, preserving the evidence chain, producing reviewable drafts, rendering finished HTML artifacts, and handing off to publishing adapters.

The first target workflow is:

```text
AI / tech sources
  -> hotspot radar
  -> P0-P4 topic lanes
  -> evidence pack
  -> article package
  -> image assets
  -> final HTML artifact
  -> optional draft publisher
```

## Architecture Principles

- Keep the content vault as the source of truth.
- Treat agent instructions, skills, and style docs as runtime policy.
- Wrap existing scripts with adapters before rewriting them.
- Record durable runs with events, checkpoints, logs, and artifact references.
- Keep publishing human-reviewed; create drafts, do not auto-publish.
- Make radar capabilities modular, so new sources can be added quickly.

## Planned Repo Shape

```text
apps/
  web/       # local operations console
  server/    # local API and job orchestration

packages/
  core/      # domain models and schemas
  workspace/ # content vault reader/writer
  modules/   # module registry and execution contracts
  runner/    # durable run ledger and job runner
  policy/    # AGENTS.md / skills / style policy loader
  adapters/  # existing script and platform adapters

docs/
  adr/       # architecture decision records
```

## Initial Status

This repository starts as a product shell. The existing content vault remains external and will be connected through local workspace configuration.

