# Agent Runtime and Interaction Architecture

## Purpose

HotLoop needs an explicit agent interaction layer.

The product is still an agent cockpit and toolroom, not the executor. The agent remains the actor that reads harness context, reasons over the workflow, calls tools, asks the human for decisions, and continues the writing loop. HotLoop provides the durable operating surface around that agent.

## Design Goal

Make this flow possible:

```text
human intent in cockpit
  -> durable agent session
  -> agent reads workspace + harness + loop definition
  -> agent plans next step
  -> agent calls HotLoop tools
  -> tools append events/checkpoints/artifacts
  -> agent asks human when judgment is needed
  -> human replies in cockpit
  -> agent resumes from durable state
```

The key requirement is not "add chat". The key requirement is to make the agent loop observable, interruptible, steerable, and resumable.

## Position in the System

```text
Human
  |
  v
Agent Cockpit UI
  |-- Agent chat / command panel
  |-- Run inspector
  |-- Tool activity timeline
  |-- Human decision queue
  |
  v
Cockpit API
  |-- /api/agent/sessions
  |-- /api/agent/sessions/:id/messages
  |-- /api/agent/sessions/:id/commands
  |-- /api/agent/sessions/:id/events
  |-- /api/agent/sessions/:id/decisions
  |
  v
Agent Runtime Boundary
  |-- Agent Bridge
  |-- Harness Loader
  |-- Tool Registry
  |-- Permission Gate
  |-- Event Sink
  |
  v
External Agent Executor
  |-- local CLI agent first: Codex / Claude / other local agent CLIs
  |-- model API fallback only when local CLI is unavailable
  |-- Reads harness and workspace context
  |-- Calls HotLoop tools through local contracts
  |
  v
HotLoop Toolroom
  |-- radar scan
  |-- CDP collection
  |-- evidence writer
  |-- article package writer
  |-- renderer
  |-- draft publisher
  |-- feedback recorder
```

## Runtime Boundary

HotLoop should expose a boundary that an agent can use, but it should not hide the agent inside opaque backend automation.

### In Scope

- Create and list agent sessions.
- Accept human messages and structured commands.
- Persist agent events, tool calls, checkpoints, and human decisions.
- Load workspace policy, AGENTS files, skills, loop definitions, and module manifests.
- Start or connect to an external agent process through an adapter.
- Prefer local CLI agent adapters as the primary execution bridge.
- Use model/provider API adapters only as fallback when local CLI execution is unavailable.
- Expose HotLoop tools through typed local contracts.
- Let the UI show what the agent is doing and where it is blocked.

### Out of Scope

- Replacing the external agent with a hidden backend planner.
- Making model API calls the primary agent path when a local CLI bridge is available.
- Making source discovery depend on opaque agent search.
- Auto-publishing or bypassing human review.
- Hiding tool calls or browser collection behind uninspectable summaries.

## Core Concepts

### Agent Session

A durable conversation and execution envelope.

```json
{
  "id": "agent-2026-06-24-001",
  "status": "running",
  "workspaceRoot": "D:/path/to/content-vault",
  "activeRunId": "ui-scan-123",
  "agentAdapter": "local-cli:codex",
  "loadedHarness": [
    "AGENTS.md",
    "loops/hotspot-writing-loop.yaml",
    "skills/hotspot-writing-loop/SKILL.md"
  ],
  "createdAt": "2026-06-24T10:00:00+08:00",
  "updatedAt": "2026-06-24T10:03:00+08:00"
}
```

Session status:

```text
idle
  -> running
  -> waiting_for_user
  -> waiting_for_tool
  -> succeeded
  -> failed
  -> cancelled
```

### Agent Message

A human or agent utterance that belongs to a session.

```json
{
  "id": "msg-001",
  "sessionId": "agent-2026-06-24-001",
  "role": "human",
  "content": "跑一轮近 6h AI 热点，优先 X 起爆贴。",
  "createdAt": "2026-06-24T10:00:10+08:00"
}
```

Roles:

```text
human
agent
system
tool
```

### Agent Command

A structured request that the UI sends to the agent runtime.

```json
{
  "id": "cmd-001",
  "sessionId": "agent-2026-06-24-001",
  "type": "run_loop",
  "payload": {
    "loopDefinition": "loops/hotspot-writing-loop.yaml",
    "freshnessWindowHours": 6,
    "priorityLanes": ["P0", "P1", "P2", "P3", "P4"]
  },
  "status": "queued"
}
```

Initial command types:

```text
run_loop
continue_run
resume_run
collect_source
ask_agent
revise_article
render_artifact
create_platform_draft
```

### Tool Invocation

Every tool call must be visible and replayable enough for debugging.

```json
{
  "id": "tool-001",
  "sessionId": "agent-2026-06-24-001",
  "runId": "ui-scan-123",
  "tool": "radar.scan",
  "status": "succeeded",
  "inputRef": "checkpoints/tool-001-input.json",
  "outputRef": "checkpoints/tool-001-output.json",
  "startedAt": "2026-06-24T10:01:00+08:00",
  "endedAt": "2026-06-24T10:01:42+08:00"
}
```

### Human Decision

When the agent needs judgment, it must stop in a durable state instead of burying the question in chat.

```json
{
  "id": "decision-001",
  "sessionId": "agent-2026-06-24-001",
  "runId": "ui-scan-123",
  "question": "P0 里 Uzi 原帖和 Tibo 爆料都可写，先写哪一个？",
  "recommendedAnswer": "先写 Uzi，因为它有原帖、复现实测和更高争议度。",
  "options": [
    "write_uzi_first",
    "write_tibo_first",
    "merge_both"
  ],
  "status": "open"
}
```

Decision status:

```text
open
  -> answered
  -> dismissed
```

## Storage Layout

Agent runtime state should live beside durable runs, not inside React state or model context.

```text
.scratch/hotloop/
  agent-sessions/
    agent-2026-06-24-001/
      session.json
      messages.jsonl
      commands.jsonl
      events.jsonl
      decisions.jsonl
      tool-invocations.jsonl
      checkpoints/
        harness-context.json
        cmd-001-plan.json
        tool-001-input.json
        tool-001-output.json
      logs/
        agent.stdout.log
        agent.stderr.log
```

Long-term content remains in the external content vault. Session logs and tool traces are runtime state. Selected evidence, article packages, final HTML, and publish results are promoted through existing workspace artifacts.

## API Contract

Initial endpoints:

```text
GET  /api/agent/sessions
POST /api/agent/sessions
GET  /api/agent/sessions/:id
GET  /api/agent/sessions/:id/messages
POST /api/agent/sessions/:id/messages
GET  /api/agent/sessions/:id/events
POST /api/agent/sessions/:id/commands
GET  /api/agent/sessions/:id/commands
GET  /api/agent/sessions/:id/decisions
POST /api/agent/sessions/:id/decisions/:decisionId/answer
POST /api/agent/sessions/:id/cancel
```

Streaming can be added after the persisted contract exists:

```text
GET /api/agent/sessions/:id/stream
```

The first implementation can use polling from the UI. Server-sent events are useful later, but they are not required to prove the architecture.

## Agent Bridge

The Agent Bridge adapts HotLoop to whichever agent executor is being used.

The bridge priority is:

```text
1. local CLI bridge
2. model/provider API fallback
3. manual diagnostic bridge for development only
```

Local CLI is the product-default path because it preserves the current agent-native workflow: local workspace, local harness, local tools, local browser/CDP access, and visible process logs. API fallback is useful for environments where a CLI is missing or broken, but it should not become the main execution model.

```text
AgentBridge
  createSession(input)
  appendHumanMessage(sessionId, message)
  enqueueCommand(sessionId, command)
  start(sessionId)
  cancel(sessionId)
  readEvents(sessionId)
```

Adapter examples:

```text
codex-cli
  Starts or connects to a Codex CLI process.
  Injects harness context and command text.
  Streams stdout/stderr into session logs and events.

claude-cli
  Starts or connects to a Claude CLI process.
  Uses the same session/event/tool contracts.

api-fallback
  Calls a model/provider API when local CLI execution is unavailable.
  Must use the same harness-context checkpoint, command queue, event sink, and tool registry.
  Must be marked as fallback in session metadata.

manual-agent
  Does not spawn a model.
  Lets the current human-agent conversation use HotLoop as a durable tool panel.
  Useful only for development diagnostics and emergency human-operated recovery.
```

The first production adapter should be a local CLI bridge. Do not start with an API-first backend agent and do not start by building a complex autonomous daemon.

## Adapter Selection

Agent sessions should record how the executor was selected.

```json
{
  "agentAdapter": "local-cli:codex",
  "adapterPriority": ["local-cli:codex", "local-cli:claude", "api-fallback"],
  "fallbackReason": null
}
```

Fallback example:

```json
{
  "agentAdapter": "api-fallback",
  "adapterPriority": ["local-cli:codex", "local-cli:claude", "api-fallback"],
  "fallbackReason": "local CLI executable not found"
}
```

Rules:

- Try the configured local CLI bridge first.
- If the CLI is unavailable, record the failure as an agent event.
- Only then select `api-fallback`.
- Never silently switch from CLI to API without recording `fallbackReason`.
- The UI must show when a session is using API fallback.

## Harness Loader

Before the agent starts a command, HotLoop should assemble a harness context file:

```text
workspace config
nearest AGENTS.md files
loop definition
enabled module manifests
source policy
writing style references
current run state
latest candidates
open human decisions
```

Output:

```text
agent-sessions/<id>/checkpoints/harness-context.json
```

The context file is not a replacement for the agent reading files. It is a launch manifest that makes the starting state explicit and resumable.

## Tool Registry

Agent-callable tools should be explicit wrappers over existing HotLoop capabilities.

Initial tools:

```text
workspace.read_config
workspace.list_candidates
radar.scan
radar.collect_with_cdp
topic.create
evidence.write_pack
article.create_package
article.render_html
publish.wechat_create_draft
feedback.record_outcome
run.write_checkpoint
run.append_event
human.request_decision
```

Tool rules:

- Every tool invocation writes an event.
- Every non-trivial tool input/output is checkpointed by reference.
- CDP tools must obey the silent background browser policy.
- Publishing tools create drafts only.
- Destructive filesystem actions are not part of the first tool registry.

## UI Interaction Model

Add a new top-level route:

```text
/agent
```

The Agent Console should contain:

```text
Agent Console
|-- Session selector
|-- Human message composer
|-- Structured quick commands
|   |-- run hotspot loop
|   |-- continue current run
|   |-- resume failed run
|   |-- collect source
|   |-- ask why this candidate matters
|-- Agent transcript
|-- Tool activity timeline
|-- Open decision queue
`-- Active run summary
```

The existing routes remain useful:

```text
/radar      shows candidates and scan output
/topics     shows selected topic state
/evidence   shows evidence and article state
/runs       shows durable run ledger
/artifacts  shows rendered output
/publish    shows draft handoff
/feedback   shows source learning
```

The `/agent` route is the place where the human talks to the executor and watches it use the toolroom.

## Interaction Flow

### Start a Hotspot Loop

```text
1. Human opens /agent.
2. Human sends: "跑近 6h，优先 X 起爆贴和 GitHub Trending."
3. UI creates an agent session.
4. UI posts a human message.
5. UI enqueues run_loop command.
6. Agent Runtime writes harness-context checkpoint.
7. Agent Bridge starts or resumes the external agent.
8. Agent calls radar.scan and radar.collect_with_cdp.
9. Tools write events, checkpoints, and candidate artifacts.
10. Agent summarizes P0-P4 and asks for selection if needed.
11. UI shows open decision.
12. Human answers.
13. Agent continues into evidence/article/render steps.
```

### Resume After State Loss

```text
1. Human opens /agent or /runs.
2. HotLoop lists active sessions and failed/waiting runs.
3. Human clicks resume.
4. UI enqueues resume_run command.
5. Harness Loader reads session.json, run.json, latest checkpoint, artifacts, and open decisions.
6. Agent receives a resume manifest.
7. Agent continues from the last verified checkpoint.
```

## Relationship to Existing Scan Button

Current behavior:

```text
/radar button
  -> POST /api/loops/hotspot/scan
  -> runHotspotScanLoop()
  -> module handlers
  -> candidates cache
```

Target behavior:

```text
/agent command or /radar scan button
  -> create or reuse agent session
  -> enqueue run_loop or collect_source command
  -> agent decides which tools to call
  -> agent calls radar.scan / radar.collect_with_cdp
  -> HotLoop records events and artifacts
```

The scan button can keep a direct demo mode, but the real mode should route through the agent session so the user can see and steer the executor.

## CDP Rule

CDP collection is a tool, not a hidden side effect.

```text
agent
  -> tool request: radar.collect_with_cdp
  -> permission gate checks target/source/module
  -> CDP adapter uses shared browser profile
  -> Target.createTarget(background=true)
  -> reuse one background tab
  -> never activate or bringToForeground
  -> append tool events and source snapshots
```

The UI should show when CDP is being used and which source is being collected.

## Phase Plan

### Phase 17: Agent Runtime Contract

- Add `docs/agent-runtime.md`.
- Add domain contracts for sessions, messages, commands, events, decisions, and tool invocations.
- Add file-backed agent session store.
- Add API endpoints for session/message/command/event/decision polling.
- Add tests for persistence and API contracts.

### Phase 18: Agent Console UI

- Add `/agent` route.
- Add session selector, transcript, command composer, decision queue, and tool timeline.
- Add API client methods for agent endpoints.
- Keep existing feature pages unchanged.

### Phase 19: Local CLI Agent Bridge

- Add the first local CLI bridge adapter.
- Start or connect to a configured local CLI agent.
- Inject harness-context checkpoint and command text.
- Persist stdout/stderr logs.
- Convert process lifecycle into session events.
- Route the real scan command through an agent session using the local CLI bridge.

### Phase 20: API Fallback Bridge

- Add a model/provider API fallback adapter.
- Reuse the same session, command, event, decision, and tool contracts.
- Record fallback reason in session metadata.
- Show fallback status in the Agent Console.
- Keep API fallback behind local CLI selection failure.

### Phase 21: CDP Tool Integration

- Add `radar.collect_with_cdp` as an agent-callable tool.
- Enforce background-only browser behavior.
- Record CDP source snapshots and tool events.
