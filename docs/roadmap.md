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

## Phase 17: Agent Runtime Contract

Goal: make the agent an explicit, durable runtime actor instead of an implied external conversation.

Deliverables:

- agent session model
- agent message log
- agent command queue
- agent event log
- tool invocation log
- human decision queue
- harness context checkpoint
- agent session API

## Phase 18: Agent Console UI

Goal: give the human a cockpit surface to instruct, inspect, and steer the agent.

Deliverables:

- `/agent` route
- session selector
- human message composer
- structured command buttons
- transcript
- tool timeline
- decision queue
- active run summary

## Phase 19: Manual Agent Bridge

Goal: prove agent interaction without hiding execution inside an autonomous backend.

Deliverables:

- `manual-agent` adapter
- command-to-tool mapping
- scan command routed through an agent session
- durable events for every manual tool action
- resume manifest for the current agent conversation

## Phase 20: External Agent Bridge

Goal: connect a local CLI agent while preserving HotLoop as the cockpit and toolroom.

Deliverables:

- local CLI bridge contract
- process lifecycle events
- stdout/stderr logs
- command injection through harness context
- cancellation boundary
- bridge tests with a fake process adapter

## Phase 21: CDP Tool Integration

Goal: make browser collection an explicit agent-callable tool.

Deliverables:

- `radar.collect_with_cdp` tool contract
- background-only CDP adapter
- source snapshot persistence
- browser activity events
- no foreground focus stealing
