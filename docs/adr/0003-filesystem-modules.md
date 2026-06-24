# ADR 0003: Filesystem Modules

## Status

Accepted

## Context

HotLoop needs to support fast addition of new radar sources and capabilities. The current workflow benefits from scripts and Markdown instructions that agents can inspect and modify.

Hardcoding every source into the backend would make the product rigid and would slow down experimentation.

## Decision

HotLoop will use filesystem modules.

Each module is a directory with a manifest and optional executable entrypoints. The module directory can also include human and agent-readable documentation.

## Consequences

- New sources can be added as modules.
- The product can list and run modules without knowing their internal implementation.
- Agents can inspect module docs and code.
- Module output must be normalized into stable product schemas.

