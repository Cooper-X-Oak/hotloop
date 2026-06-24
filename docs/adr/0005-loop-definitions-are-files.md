# ADR 0005: Loop Definitions Are Files

## Status

Accepted

## Context

HotLoop's primary value comes from agentic workflows that are flexible, inspectable, and resumable. If loop behavior is hardcoded only inside backend logic, the product becomes harder for agents and humans to inspect and adapt.

## Decision

Loop definitions will be stored as files under `loops/`.

The backend may compile and execute these definitions, but the definitions themselves should remain readable, diffable, and versioned.

## Consequences

- Agents can inspect workflow intent before acting.
- Humans can review workflow changes in Git.
- The UI can render progress from the same step definitions used by the runner.
- Backend code should not become the only source of workflow truth.

