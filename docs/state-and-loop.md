# State and Loop

## Core Concern

The original workflow can be run by a single agent in a highly coupled AI-native repository. That gives the workflow flexibility and continuity, but state can be lost if it lives only in model context.

HotLoop preserves the agentic flow while making state durable.

## Principle

State must live in the workspace, not only in the agent conversation.

The agent remains the orchestrator. The product records what happened, what exists, and what should happen next.

## Loop Flow

```text
user intent
  -> create agent session
  -> append human message
  -> enqueue agent command
  -> create run
  -> load workspace manifest
  -> load harness and policies
  -> load modules
  -> agent executes loop steps through tools
  -> append events
  -> write checkpoints
  -> register artifacts
  -> ask human for decisions when needed
  -> resume or complete
```

## Agent Session State

Agent interaction state is durable runtime state, not React state and not model memory.

```text
.scratch/hotloop/agent-sessions/<session-id>/
  session.json
  messages.jsonl
  commands.jsonl
  events.jsonl
  decisions.jsonl
  tool-invocations.jsonl
  checkpoints/
    harness-context.json
  logs/
    agent.stdout.log
    agent.stderr.log
```

The session points to an active run when a command becomes executable:

```text
AgentSession
  -> AgentCommand
  -> RunRecord
  -> ToolInvocation
  -> Checkpoint / Artifact
```

The run ledger records workflow progress. The session ledger records agent-human interaction and tool use.

## Durable Run Shape

```text
runs/<run-id>/
  run.json
  events.jsonl
  checkpoints/
    001-after-scan.json
    002-after-selection.json
    003-after-evidence.json
  artifacts.json
  logs/
```

## `run.json`

```json
{
  "id": "2026-06-24-hotspot-loop-001",
  "type": "hotspot-writing-loop",
  "status": "running",
  "currentStep": "collect_evidence",
  "workspaceRoot": "D:/path/to/content-vault",
  "loopDefinition": "loops/hotspot-writing-loop.yaml",
  "loadedHarness": [
    "AGENTS.md",
    "skills/hotspot-writing-loop/SKILL.md"
  ],
  "loadedModules": [
    "sopilot-x",
    "github-trending",
    "cooper-md"
  ],
  "createdAt": "2026-06-24T10:00:00+08:00",
  "updatedAt": "2026-06-24T10:18:00+08:00"
}
```

## `events.jsonl`

Append-only event log:

```jsonl
{"ts":"2026-06-24T10:00:00+08:00","type":"run_started","message":"Manual hotspot writing loop started"}
{"ts":"2026-06-24T10:01:00+08:00","type":"module_loaded","module":"sopilot-x"}
{"ts":"2026-06-24T10:03:00+08:00","type":"scan_completed","artifact":"latest-candidates.json"}
{"ts":"2026-06-24T10:05:00+08:00","type":"topic_selected","topicId":"codex-ssd-write-bug"}
```

## `artifacts.json`

Artifact references, not copied blobs:

```json
{
  "candidatePool": ".scratch/hotloop/candidates/latest.json",
  "topicPath": "hotspot-tracking/2026-06-24/codex-ssd-write-bug",
  "evidencePack": "hotspot-tracking/2026-06-24/codex-ssd-write-bug/analysis.md",
  "article": "hotspot-tracking/2026-06-24/codex-ssd-write-bug/article.md",
  "finalHtml": null
}
```

## Topic State Machine

```text
candidate
  -> selected
  -> collecting_evidence
  -> evidence_ready
  -> writing
  -> draft_ready
  -> image_pending
  -> image_ready
  -> rendering
  -> artifact_ready
  -> publish_preparing
  -> draft_created
```

## Run State Machine

```text
queued
  -> running
  -> waiting_for_user
  -> succeeded
  -> failed
  -> cancelled
```

## Resume Model

Resume should be mechanical:

1. find active or failed run
2. read `run.json`
3. read latest checkpoint
4. verify referenced artifacts still exist
5. compute pending steps
6. create a resume instruction for the agent
7. continue without repeating completed steps unless explicitly requested

## Human Control

The UI should allow:

- talk to the agent
- issue structured commands
- continue
- pause
- retry current step
- skip module
- add source/module
- mark candidate ignored
- ask agent to explain selection
- answer agent decision requests
- inspect agent tool calls
- create draft after review
