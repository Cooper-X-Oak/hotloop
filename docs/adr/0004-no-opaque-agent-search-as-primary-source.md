# ADR 0004: No Opaque Agent Search as Primary Source

## Status

Accepted

## Context

HotLoop is designed for timely, evidence-backed AI and technology content. Source quality and freshness are central product concerns.

Opaque search agents can be useful, but they make it harder to reason about what was searched, what was missed, and why an item was selected.

## Decision

HotLoop will prefer direct source collection:

- RSS
- public APIs
- GitHub
- official pages
- direct web fetch
- local CDP browser collection when a page requires login or JavaScript

Agent search may be used as a supplementary fallback, not as the primary discovery path.

## Consequences

- Radar modules should record source URLs and fetch metadata.
- Candidate selection should be explainable.
- The product can answer why P0 items were or were not found.
- Browser collection must be implemented carefully to avoid interfering with the user's desktop.

