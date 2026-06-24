# Findings

## Product Constraints

- HotLoop is a filesystem-first agentic workspace, not a CMS.
- External content vault remains source of truth.
- Durable run state must live outside model context.
- Module capabilities should be loaded from filesystem manifests.
- Publishing creates drafts only; it must not auto-publish.

## Current Repo State

- Product docs and ADRs exist.
- Loop contract exists at `loops/hotspot-writing-loop.yaml`.
- Module example exists at `modules/module.example.yaml`.
- TypeScript and Vitest are configured.
- `packages/workspace` can load workspace config, source registry, candidates, and final HTML artifacts.
- `apps/server` exposes workspace, sources, candidates, and artifacts APIs.
- `npm run check` now runs test, typecheck, and build.
- `packages/runner` provides file-based durable run state:
  - `run.json`
  - `events.jsonl`
  - `artifacts.json`
  - checkpoints
- `apps/server` now exposes basic run creation and listing.
- `apps/web` now has a minimal Radar page.
- P0-P4 lane ordering is tested.
- P0 is rendered even when empty.
- `packages/modules` validates filesystem module manifests.
- `apps/server` exposes enabled module list via `GET /api/modules`.
