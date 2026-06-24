# Roadmap

## Phase 0: Product Guardrails

Goal: make the product shape hard to drift away from.

Deliverables:

- product shape document
- information architecture
- architecture document
- state and loop document
- module system document
- technical selection document
- initial ADRs

## Phase 1: Workspace Reader

Goal: connect HotLoop to an external content vault without moving it.

Deliverables:

- workspace config loader
- source registry reader
- candidate cache reader
- artifact reader
- final HTML list API

## Phase 2: Durable Run Ledger

Goal: make existing workflows resumable and inspectable.

Deliverables:

- run directory creation
- `run.json`
- `events.jsonl`
- `artifacts.json`
- checkpoint writer
- run list API
- run detail API

## Phase 3: Radar Console

Goal: show current AI / tech candidates in product UI.

Deliverables:

- P0-P4 lane view
- freshness and source display
- candidate details
- select / ignore actions
- run scan button

## Phase 4: Module Registry

Goal: make radar and platform capabilities pluggable.

Deliverables:

- module manifest schema
- enabled module registry
- dry-run support
- module health
- first radar modules

## Phase 5: Topic and Article Workflow

Goal: turn a candidate into a tracked topic and article package.

Deliverables:

- topic creation
- evidence pack view
- article package status
- existing writer adapter
- image job adapter
- renderer adapter

## Phase 6: Artifact Library

Goal: inspect and validate final HTML artifacts.

Deliverables:

- date-based artifact list
- preview
- artifact validation
- clean final-folder checks

## Phase 7: Publish Console

Goal: create platform drafts without auto-publishing.

Deliverables:

- WeChat compatibility validation
- data URL / local image extraction
- `uploadimg` mapping
- cover material upload
- `draft/add`
- publish-result record

