# ADR 0001: Local-first Agentic Workspace

## Status

Accepted

## Context

The current content workflow is an AI-native repository. It combines Markdown policy documents, skills, source registries, scripts, generated drafts, images, HTML artifacts, and scratch runtime output.

Traditional application architecture would move much of this into backend configuration and database tables. That would make the system easier to render as a conventional product, but it would also weaken the current workflow's strongest properties:

- human-editable policy documents
- agent-readable harness files
- file-system artifacts that work with Obsidian and Git
- fast source and workflow changes
- local browser and platform session reuse

## Decision

HotLoop will be a local-first agentic workspace application.

The product shell will read and operate on an external content vault. The content vault remains the long-term source of truth. Product state that is operational or recoverable, such as runs, events, checkpoints, and job logs, will be written to a scratch runtime area.

## Consequences

- Markdown policy remains first-class runtime input.
- Existing scripts can be wrapped by adapters before being rewritten.
- Durable run state must be explicit and persisted outside model context.
- The first version can be useful without a hosted database or SaaS account system.
- The frontend is an operations console over a workspace, not a traditional CMS.

