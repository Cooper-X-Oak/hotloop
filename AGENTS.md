# HotLoop Agent Guide

HotLoop is a local-first agentic content workspace product.

## Boundaries

- Do not move private content vault files into this repository.
- Do not commit local credentials, browser profiles, tokens, run logs, or generated scratch artifacts.
- Treat external content vaults as user workspaces configured locally.
- Prefer adapters around existing working scripts before rewriting behavior.

## Architecture

- `apps/` contains product surfaces such as web and server apps.
- `packages/` contains reusable product internals.
- `modules/` will contain pluggable radar, evidence, writing, media, renderer, and publisher modules.
- `loops/` will contain durable workflow definitions.
- `docs/adr/` records architecture decisions.

## Development Principles

- Durable state must be persisted outside model conversation context.
- Agent instructions and skills are runtime policy, not just documentation.
- The content vault remains the source of truth for long-term content assets.
- Finished artifact directories should stay clean and human-reviewable.
- Publishing adapters may create drafts, but must not auto-publish.

