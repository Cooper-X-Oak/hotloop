# Task Plan: HotLoop Phase 1 to Phase 8

## Goal

Build HotLoop from the current Phase 0 product guardrails into a minimal runnable local-first agentic content workspace through Phase 8.

The target is a thin but coherent product skeleton, not a fully polished SaaS.

## Current Phase

Phase 5: Topic and Article Workflow

## Phase Checklist

- [x] Phase 0: Product guardrails and architecture documents
- [x] Phase 1: Workspace reader
- [x] Phase 2: Durable run ledger
- [x] Phase 3: Radar console
- [x] Phase 4: Module registry
- [ ] Phase 5: Topic and article workflow
- [ ] Phase 6: Artifact library
- [ ] Phase 7: Publish console
- [ ] Phase 8: Feedback and learning

## Implementation Strategy

1. Keep the external content vault outside this repo.
2. Use TypeScript packages with tests.
3. Start with file-system and JSON state.
4. Build local API after core packages are tested.
5. Build web UI only after API contracts exist.
6. Keep publisher draft-only.

## Planned Packages

- `packages/core`: shared domain types and schemas
- `packages/workspace`: workspace config and file readers
- `packages/runner`: durable run ledger
- `packages/modules`: module manifests and registry
- `packages/adapters`: first local adapters and publisher stubs

## Planned Apps

- `apps/server`: local HTTP API
- `apps/web`: local operations console

## Verification Requirements

- `npm test`
- `npm run typecheck`
- `npm run build`

These commands must exist before implementation is considered complete.

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
| Missing workspace implementation caused RED test failure | Phase 1 RED | Implemented `packages/workspace/src/index.ts` |
| Missing server app caused RED test failure | Phase 1 RED | Implemented `apps/server/src/app.ts` and `index.ts` |
| Missing runner implementation caused RED test failure | Phase 2 RED | Implemented `packages/runner/src/index.ts` |
| Missing `/api/runs` route caused RED test failure | Phase 2 RED | Added `GET /api/runs` and `POST /api/runs` |
| Root typecheck failed on TSX/CSS imports | Phase 3 verification | Enabled `jsx: react-jsx` and added Vite type reference |
| Radar TSX test was not included | Phase 3 RED setup | Updated Vitest include pattern to include `*.test.tsx` |
| Missing radar component caused RED test failure | Phase 3 RED | Implemented `RadarPage` and `buildRadarLanes` |
| Missing module registry caused RED test failure | Phase 4 RED | Implemented `packages/modules/src/index.ts` |
| Missing `/api/modules` route caused RED test failure | Phase 4 RED | Added modules API route |
