# Agent Loop Runtime Architecture

## Purpose

HotLoop needs a durable agent loop runtime, not only a command bridge.

The agent remains the executor. HotLoop provides the cockpit, toolroom, durable state, and monitoring surface. The runtime continuously drives the agent through a loop definition, records what it is doing, ingests its output, calls tools, asks the human for decisions, and resumes from checkpoints.

## Core Correction

The current local CLI bridge is only a turn adapter:

```text
human message
  -> agent command
  -> local CLI process
  -> stdout/stderr logs
```

That is not enough. The required architecture is:

```text
human intent
  -> agent session
  -> agent loop run
  -> loop runner
  -> repeated local CLI turns
  -> output ingestion
  -> messages / events / decisions / tool calls
  -> live console projection
```

## Layered Runtime

```text
Agent Console
  Shows transcript, current loop state, current step/task, heartbeat, tool timeline, and decisions.

Agent Runtime Controller
  Starts, pauses, resumes, cancels, and answers decisions.

Agent Session Ledger
  Durable conversation envelope.

Agent Loop Run Store
  Durable loop execution state.

Agent Loop Runner
  Drives a loop run from step to step.

Local CLI Turn Adapter
  Runs one agent turn through Codex/Claude/local CLI.

Output Ingestion
  Converts CLI output into messages, events, tool calls, decisions, and checkpoints.

Tool Registry
  Executes HotLoop tools requested by the agent.
```

## Runtime Diagram

```text
Human
  |
  v
/agent console
  |-- transcript
  |-- task status
  |-- tool timeline
  |-- decision queue
  |
  v
Agent Runtime Controller
  |-- start loop
  |-- run next turn
  |-- pause/resume/cancel
  |-- answer decision
  |
  v
Agent Loop Runner
  |-- load loop-state.json
  |-- build turn context
  |-- call Local CLI Turn Adapter
  |-- ingest output
  |-- update loop-state.json
  |-- append events
  |-- continue until complete / blocked / failed
  |
  +--> Local CLI Turn Adapter
  |      |-- codex / claude / other local CLI
  |      |-- one-shot turn by default
  |      `-- persistent adapter may be added later
  |
  +--> Output Ingestion
  |      |-- plain text -> role=agent message
  |      |-- JSONL agent_message -> message
  |      |-- JSONL status -> loop state/event
  |      |-- JSONL decision_request -> human decision
  |      |-- JSONL tool_call -> tool invocation
  |
  `--> HotLoop Toolroom
         |-- radar.scan
         |-- radar.collect_with_cdp
         |-- evidence.write_pack
         |-- article.render_html
         `-- publish.wechat_create_draft
```

## Data Model

### AgentSession

Conversation and executor envelope.

Existing files:

```text
agent-sessions/<session-id>/
  session.json
  messages.jsonl
  commands.jsonl
  events.jsonl
  decisions.jsonl
```

### AgentLoopRun

A durable execution of a loop definition inside a session.

```json
{
  "id": "loop-2026-06-25-001",
  "sessionId": "agent-2026-06-25-001",
  "loopDefinition": "loops/hotspot-writing-loop.yaml",
  "status": "running",
  "currentStep": "scan_sources",
  "currentTask": "collect_p0_x_posts",
  "startedAt": "2026-06-25T10:00:00+08:00",
  "updatedAt": "2026-06-25T10:03:21+08:00",
  "lastHeartbeatAt": "2026-06-25T10:03:20+08:00",
  "progress": {
    "completedSteps": ["load_harness"],
    "activeStep": "scan_sources",
    "pendingSteps": ["classify_candidates", "select_topic", "collect_evidence", "write_article"]
  }
}
```

Status:

```text
queued
  -> running
  -> waiting_for_user
  -> succeeded
  -> failed
  -> cancelled
```

### AgentTurn

One durable agent reasoning/execution turn.

```json
{
  "id": "turn-001",
  "sessionId": "agent-2026-06-25-001",
  "loopRunId": "loop-2026-06-25-001",
  "commandId": "cmd-001",
  "status": "succeeded",
  "inputRef": "loop-runs/loop-2026-06-25-001/checkpoints/turn-001-context.json",
  "stdoutRef": "loop-runs/loop-2026-06-25-001/logs/turn-001.stdout.log",
  "stderrRef": "loop-runs/loop-2026-06-25-001/logs/turn-001.stderr.log",
  "createdAt": "2026-06-25T10:00:10+08:00",
  "completedAt": "2026-06-25T10:00:42+08:00"
}
```

### OutputIngestionResult

The normalized result of agent output.

```json
{
  "messages": [
    { "role": "agent", "content": "收到，我正在扫描 P0 X 起爆贴。" }
  ],
  "events": [
    { "type": "step_started", "data": { "step": "scan_sources" } }
  ],
  "decisions": [],
  "toolInvocations": [],
  "loopUpdate": {
    "status": "running",
    "currentStep": "scan_sources",
    "currentTask": "collect_p0_x_posts"
  }
}
```

## Storage Layout

```text
.scratch/hotloop/agent-sessions/<session-id>/
  session.json
  messages.jsonl
  commands.jsonl
  events.jsonl
  decisions.jsonl
  tool-invocations.jsonl
  checkpoints/
  logs/

  loop-runs/
    <loop-run-id>/
      loop-state.json
      turns.jsonl
      tasks.jsonl
      heartbeat.json
      checkpoints/
        turn-001-context.json
        turn-001-ingestion.json
      logs/
        turn-001.stdout.log
        turn-001.stderr.log
```

## Loop Runner State Machine

```text
startLoop
  -> create loop-state.json
  -> append loop_started
  -> runNextTurn

runNextTurn
  -> load session + loop state + command + latest messages
  -> update status running
  -> append heartbeat
  -> write turn context checkpoint
  -> call Local CLI Turn Adapter
  -> write stdout/stderr logs
  -> ingest output
  -> append agent messages
  -> append events
  -> open decisions if requested
  -> update loop state
  -> stop if waiting_for_user / succeeded / failed
  -> continue if more steps are ready
```

## Output Ingestion Rules

### Plain Text

If stdout is plain text:

```text
stdout.trim()
  -> append AgentMessage(role=agent)
  -> append event agent_message_appended
```

### Structured JSONL

If stdout contains JSONL records, each line is interpreted:

```json
{"type":"agent_message","content":"我正在加载 loop。"}
{"type":"status","currentStep":"scan_sources","currentTask":"collect_p0_x_posts"}
{"type":"decision_request","id":"decision-1","question":"先写哪一个？","options":["uzi","tibo"]}
{"type":"tool_call","id":"tool-1","tool":"radar.scan","input":{"lanes":["P0"]}}
{"type":"loop_complete"}
```

Supported first-version record types:

```text
agent_message
status
decision_request
tool_call
loop_complete
loop_failed
```

Unknown records must be preserved as events, not discarded.

## Console Projection

The `/agent` screen must show four projections:

```text
Transcript
  messages.jsonl

Current Loop
  loop-state.json + heartbeat.json

Tool Timeline
  tool-invocations.jsonl + events.jsonl

Decision Queue
  decisions.jsonl
```

Minimum visible fields:

```text
loop status
current step
current task
last heartbeat
latest agent message
latest tool event
open decisions
```

## API Contract

```text
POST /api/agent/sessions/:id/loop-runs
GET  /api/agent/sessions/:id/loop-runs
GET  /api/agent/sessions/:id/loop-runs/:loopRunId
POST /api/agent/sessions/:id/loop-runs/:loopRunId/turns
GET  /api/agent/sessions/:id/loop-runs/:loopRunId/turns
POST /api/agent/sessions/:id/loop-runs/:loopRunId/pause
POST /api/agent/sessions/:id/loop-runs/:loopRunId/resume
POST /api/agent/sessions/:id/loop-runs/:loopRunId/cancel
```

First implementation may execute one turn per request. A later runner can continue turns in a background worker.

## Relationship To Local CLI Bridge

The local CLI bridge is not the runtime. It is the turn adapter.

```text
Agent Loop Runtime
  -> Local CLI Turn Adapter
```

The bridge should be reusable by both:

```text
one-shot command dispatch
durable loop turn execution
```

## Minimum Acceptance Criteria

When a human sends:

```text
跑一轮近 6h AI 热点，优先 X 起爆贴。
```

The cockpit must be able to show:

```text
1. human message in transcript
2. loop status = running/succeeded/waiting_for_user
3. current step and current task
4. agent message ingested from CLI output
5. heartbeat updated
6. local CLI lifecycle event
7. stdout/stderr log references
```
