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
- `packages/workspace` can now create topic packages and article package skeletons.
- `apps/server` can create topics and article packages through API routes.
- Final artifact directories can be validated for clean flat HTML-only output.
- Artifact validation is available through server API.
- `packages/adapters` has a tested WeChat draft adapter core.
- Publish boundary is enforced: draft-only, no auto-publish.
- `packages/feedback` records topic outcomes and summarizes source performance.
- `apps/server` exposes feedback outcome and source performance APIs.
- Current full verification: 9 test files, 28 tests, typecheck, and all workspace builds pass.

## Phase 9-14 Direction

- Phase 9 should prove HotLoop can point at a real external content vault without copying private content into this repo.
- Phase 10 should add a deterministic module runner that loads enabled filesystem modules and writes normalized candidates.
- Phase 11 should add evidence pack persistence so a selected topic can keep source snapshots and claim boundaries outside model context.
- Phase 12 should add a basic writer/render path from article markdown to final `cooper-md` dark HTML artifacts.
- Phase 13 should move WeChat from pure draft adapter core toward an integration boundary with explicit credentials injection and draft-only behavior.
- Phase 14 should turn the web app from a radar-only page into a small operations console with radar, runs, artifacts, publish, and feedback views.

## Phase 9-14 Implemented State

- `packages/smoke` validates an external content vault path without importing private content into the product repo.
- `packages/modules` now has `runRadarModules`, which executes enabled radar modules through injected handlers and writes normalized candidates to `scratchRoot/candidates/latest.json`.
- `packages/loop` now runs a minimal durable hotspot scan loop:
  - creates a run
  - executes radar modules
  - writes a scan checkpoint
  - registers candidate artifacts
  - marks the run as `succeeded`
- First-party module manifests now cover P0-P4:
  - `sopilot-x-rss` for P0
  - `github-trending` for P1
  - `hacker-news` for P2
  - `official-ai-updates` for P3
  - `paper-signals` for P4
- `packages/evidence` writes topic evidence packs, source snapshots, and `_公共分析.md`.
- `packages/render` renders an article package into the flat `cooper-md` dark final artifact directory.
- `packages/adapters` now exposes `createWeChatDraftThroughApi`, an injected-client WeChat draft integration boundary.
- `apps/server` exposes Phase 9-13 workflow APIs:
  - `GET /api/smoke`
  - `POST /api/radar/run`
  - `POST /api/loops/hotspot/scan`
  - `POST /api/topics/:date/:slug/evidence`
  - `POST /api/topics/:date/:slug/render`
  - `POST /api/publish/wechat/draft`
- `apps/web` now renders a multi-view product console with Radar, Runs, Artifacts, Publish, and Feedback sections.
- Current full verification after Phase 14: 14 test files, 37 tests, typecheck, and all workspace builds pass.
