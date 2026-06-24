# Task Plan: HotLoop Phase 1 to Phase 14

## Goal

Build HotLoop from the current Phase 0 product guardrails into a runnable local-first agentic content workspace through Phase 14.

Phase 0-8 established the minimal product skeleton. Phase 9-14 should connect the skeleton into a usable local product path without violating the core boundaries: content vault remains external, runs are durable, modules are filesystem-based, browser/source collection is explicit, and publishing remains draft-only.

## Current Phase

All phases through Phase 14 complete for the runnable local product foundation.

## Phase Checklist

- [x] Phase 0: Product guardrails and architecture documents
- [x] Phase 1: Workspace reader
- [x] Phase 2: Durable run ledger
- [x] Phase 3: Radar console
- [x] Phase 4: Module registry
- [x] Phase 5: Topic and article workflow
- [x] Phase 6: Artifact library
- [x] Phase 7: Publish console
- [x] Phase 8: Feedback and learning
- [x] Phase 9: Real workspace smoke test and local config path
- [x] Phase 10: Module execution runner
- [x] Phase 11: Evidence collector foundation
- [x] Phase 12: Writer and renderer pipeline foundation
- [x] Phase 13: WeChat draft integration layer
- [x] Phase 14: Product UI views for radar, runs, artifacts, publish, and feedback

## Implementation Strategy

1. Keep the external content vault outside this repo.
2. Use TypeScript packages with tests.
3. Start with file-system and JSON state.
4. Build local API after core packages are tested.
5. Build web UI only after API contracts exist.
6. Keep publisher draft-only.
7. Add behavior with TDD: failing test first, then implementation.
8. Keep real credentials and private content outside git.

## Planned Packages

- `packages/core`: shared domain types and schemas
- `packages/workspace`: workspace config and file readers
- `packages/runner`: durable run ledger
- `packages/modules`: module manifests and registry
- `packages/adapters`: first local adapters and publisher stubs
- `packages/evidence`: evidence pack writer and source snapshot helpers
- `packages/render`: markdown-to-HTML renderer for final artifacts
- `packages/smoke`: workspace smoke test helpers

## Planned Apps

- `apps/server`: local HTTP API
- `apps/web`: local operations console
- `modules/*`: first real filesystem radar modules

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
| Missing topic/article workspace functions caused RED test failure | Phase 5 RED | Implemented topic and article package creation/status |
| Missing topic/article API routes caused RED test failure | Phase 5 RED | Added `POST /api/topics` and article package route |
| Missing artifact validator caused RED test failure | Phase 6 RED | Implemented final artifact directory validation |
| Missing artifact validation API | Phase 6 | Added `GET /api/artifacts/validate` |
| Missing WeChat draft adapter caused RED test failure | Phase 7 RED | Implemented `createWeChatDraft` with draft-only guard |
| Missing feedback package caused RED test failure | Phase 8 RED | Implemented outcome recording and source performance summary |
| Missing feedback API | Phase 8 | Added `POST /api/feedback/outcomes` and `GET /api/feedback/sources` |
| Missing workspace smoke helper caused RED test failure | Phase 9 RED | Implemented `packages/smoke` |
| Missing module runner caused RED test failure | Phase 10 RED | Implemented `runRadarModules` |
| Missing first-party radar manifests caused RED test failure | Phase 10 RED | Added P0-P4 module manifests |
| Missing evidence package caused RED test failure | Phase 11 RED | Implemented `packages/evidence` |
| Missing renderer package caused RED test failure | Phase 12 RED | Implemented `packages/render` |
| Missing WeChat API integration function caused RED test failure | Phase 13 RED | Added `createWeChatDraftThroughApi` |
| Missing product console caused RED test failure | Phase 14 RED | Added `ProductConsole` and multi-view UI |
| Missing server workflow APIs caused RED test failure | Phase 9-13 API RED | Added smoke, radar run, evidence, render, and WeChat draft routes |
