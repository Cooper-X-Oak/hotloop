# Loops

Loops are durable workflow definitions.

They should describe the intended agentic flow without hiding state in model context. A loop can be started, paused, resumed, inspected, or retried through the product shell.

## Rules

- Keep loop definitions declarative.
- Each meaningful step should declare inputs, outputs, and whether it creates a checkpoint.
- Publishing steps must remain draft-only unless a future ADR explicitly changes that boundary.
- P0 X / product-lead signal review is mandatory for the hotspot writing loop.

## Current Loops

- `hotspot-writing-loop.yaml`: the primary AI / technology hotspot article workflow.

