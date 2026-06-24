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
  -> create run
  -> load workspace manifest
  -> load harness and policies
  -> load modules
  -> execute loop steps
  -> append events
  -> write checkpoints
  -> register artifacts
  -> resume or complete
```

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

- continue
- pause
- retry current step
- skip module
- add source/module
- mark candidate ignored
- ask agent to explain selection
- create draft after review

