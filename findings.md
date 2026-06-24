# Findings

## Product Constraints

- HotLoop is a filesystem-first agent cockpit and toolroom, not a standalone product or CMS.
- The agent remains the executor; HotLoop makes the loop observable, steerable, durable, and resumable.
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
- Phase 14 should turn the web app from a radar-only page into a small agent operations console with radar, runs, artifacts, publish, and feedback views.

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
- `apps/web` now renders a multi-view agent cockpit console with Radar, Runs, Artifacts, Publish, and Feedback sections.
- Current full verification after Phase 14: 14 test files, 37 tests, typecheck, and all workspace builds pass.

## Phase 15 Direction

- The product has an operation page, but it needs a local demo runtime so the page can be opened and exercised without hand-wiring every API option.
- Demo runtime state should live under `.scratch/` and stay out of git.
- Vite should proxy `/api` to the local Hono server so `apps/web` can be used as the operation page.
- The server demo entry should configure repo root, runs root, modules root, feedback root, and deterministic demo radar handlers.

## Phase 15 Implemented State

- `packages/demo` prepares a generated local demo workspace under `.scratch/demo`.
- Demo data seeds P0-P4 candidates and matching source registry entries.
- `apps/server/src/demo-app.ts` wires the full demo app with:
  - repo root
  - runs root
  - modules root
  - feedback root
  - demo radar handlers
  - draft-only demo WeChat client
- `apps/server/src/demo.ts` starts the demo Hono server on `127.0.0.1:8787`.
- `apps/web/vite.config.ts` proxies `/api` to `http://127.0.0.1:8787`.
- Root scripts now include:
  - `npm run dev:demo`
  - `npm run dev:demo:server`
  - `npm run dev:demo:web`
- Current full verification after Phase 15: 17 test files, 41 tests, typecheck, and all workspace builds pass.

## Chinese Workflow Console Upgrade

- The previous UI was a read-only section dashboard with anchor navigation.
- The upgraded UI is a Chinese workflow console:
  - `雷达台`: reads candidates and can trigger `POST /api/loops/hotspot/scan`.
  - `选题工作台`: can create topic packages from candidate cards.
  - `证据与成稿`: can write evidence, create article packages, and render HTML.
  - `运行账本`: reads durable runs.
  - `成品与发布`: reads final HTML artifacts and can create WeChat drafts.
  - `反馈学习`: reads source performance and can record a demo outcome.
- The left navigation still uses in-page anchors, but each section now contains workflow actions mapped to backend APIs.

## Product Meaning Correction

- HotLoop must not drift into a standalone SaaS, CMS, or self-contained content app.
- Its correct role is an agent-facing operating surface:
  - exposes tools
  - records durable state
  - shows run checkpoints
  - lets the human steer the agent
  - keeps the content vault and agent harness as the real center of gravity
- Future phases should prioritize agent runtime, CDP capability, harness loading, and run/event inspection over generic product polish.

## Phase 16 Direction

- The current Chinese workflow console proves end-to-end behavior but is still one page with anchor navigation.
- Agent cockpit IA should split the operation surface into an app shell plus routed feature pages:
  - `/radar`
  - `/topics`
  - `/runs`
  - `/artifacts`
  - `/publish`
  - `/feedback`
- API calls should move out of `main.tsx` into a shared client layer.
- Each feature page should own its view composition while shared workflow state remains in the app controller.

## Phase 16 Implemented State

- `apps/web/src/main.tsx` now only mounts `BrowserRouter` and `HotLoopApp`.
- `apps/web/src/app/AppShell.tsx` owns agent cockpit navigation, summary state, and activity log.
- `apps/web/src/app/App.tsx` owns shared workflow state and route composition.
- `apps/web/src/shared/api/client.ts` centralizes backend API reads and workflow actions.
- Feature pages are split under `apps/web/src/features/`:
  - `radar/RadarRoute.tsx`
  - `topics/TopicsRoute.tsx`
  - `evidence/EvidenceRoute.tsx`
  - `runs/RunsRoute.tsx`
  - `artifacts/ArtifactsRoute.tsx`
  - `publish/PublishRoute.tsx`
  - `feedback/FeedbackRoute.tsx`
- Routes now cover `/radar`, `/topics`, `/evidence`, `/runs`, `/artifacts`, `/publish`, and `/feedback`.
- `react-router-dom` is declared as a direct dependency of `@hotloop/web`.
- Current full verification after Phase 16: 20 test files, 49 tests, typecheck, and all workspace builds pass.

## Phase 17 Direction

- The previous architecture still implied the agent externally, but did not model agent interaction.
- Phase 17 should add an explicit Agent Runtime Boundary:
  - agent sessions
  - human and agent messages
  - structured commands
  - agent events
  - tool invocation logs
  - human decision queue
  - harness context checkpoints
- The `/agent` surface should become the front door for instructing and steering the agent.
- Existing workflow APIs should remain tool-level capabilities, but real cockpit operation should route through durable agent sessions.
