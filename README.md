# HotLoop

HotLoop is a local-first agent cockpit and toolroom for high-velocity AI and technology publishing.

It is designed around an existing content vault and an external agent executor, not as a standalone SaaS product or traditional CMS database. The cockpit gives the agent a visible operating surface: it reads a local workspace, exposes tools, records durable run state, renders final artifacts, and can later prepare drafts for publishing channels such as WeChat.

## Product Direction

HotLoop is not a generic AI writer and not the primary executor. It is an operations console for the agent-human loop: deciding what is worth writing now, preserving the evidence chain, producing reviewable drafts, rendering finished HTML artifacts, and handing off to publishing adapters.

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
- Keep the agent as the executor; HotLoop is the operating surface and durable tool layer.
- Wrap existing scripts with adapters before rewriting them.
- Record durable runs with events, checkpoints, logs, and artifact references.
- Keep publishing human-reviewed; create drafts, do not auto-publish.
- Make radar capabilities modular, so new sources can be added quickly.

## Planned Repo Shape

```text
apps/
  web/       # local agent operations console
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

This repository starts as an agent cockpit shell. The existing content vault remains external and will be connected through local workspace configuration.

## Product Documents

- [Product Shape](docs/product-shape.md): product identity, principles, pages, and non-goals.
- [Information Architecture](docs/information-architecture.md): how radar, topics, evidence, articles, artifacts, and publishing fit together.
- [Architecture](docs/architecture.md): local-first workspace architecture and package boundaries.
- [Agent Runtime](docs/agent-runtime.md): agent sessions, commands, messages, decisions, tool calls, and bridge boundary.
- [Domain Model](docs/domain-model.md): core objects and lifecycle.
- [State and Loop](docs/state-and-loop.md): durable run ledger, loop flow, and resume model.
- [Module System](docs/module-system.md): pluggable radar/evidence/writing/media/render/publisher modules.
- [Technical Selection](docs/technical-selection.md): technology choices and rejected alternatives.
- [Roadmap](docs/roadmap.md): staged path from cockpit shell to agent-interactive toolroom.
- [Hotspot Writing Loop](loops/hotspot-writing-loop.yaml): first durable loop definition.
- [Module Manifest Example](modules/module.example.yaml): starting contract for pluggable modules.
