# Module System

## Goal

Radar, evidence, writing, media, rendering, and publishing capabilities should be modular.

The user must be able to add a new source or capability without rewriting the product backend.

## Module Types

```text
radar
  Finds candidate hotspots.

evidence
  Captures or enriches source material for a topic.

writer
  Produces or edits article text.

media
  Generates or processes images.

renderer
  Turns article packages into final artifacts.

publisher
  Creates drafts or export packages for external platforms.
```

## Module Directory

```text
modules/<module-id>/
  module.yaml
  README.md
  fetch.ts
  normalize.ts
  examples/
    sample-output.json
  tests/
```

Not every module needs every file. A renderer or publisher may expose different entrypoints.

## Example Radar Module

```yaml
id: sopilot-x
type: radar
name: X explosive posts
lane: P0
freshnessWindowHours: 6
requires:
  - network
  - rss
outputs:
  - Candidate[]
entrypoints:
  fetch: fetch.ts
  normalize: normalize.ts
policy:
  - hotspot-tracking/AGENTS.md
```

## Candidate Output Contract

Radar modules should normalize into a shared candidate shape:

```json
{
  "id": "x-2026-06-24-example",
  "lane": "P0",
  "title": "Candidate title",
  "summary": "One sentence summary",
  "url": "https://example.com",
  "source": "sopilot-x",
  "publishedAt": "2026-06-24T08:30:00+08:00",
  "ageHours": 2.4,
  "heat": {
    "score": 87,
    "velocity": "high"
  },
  "topicTags": ["AI", "agent"],
  "whyItMatters": "Why this is worth writing.",
  "risk": "What is unknown or disputed.",
  "evidenceLevel": "L2"
}
```

## Adding a Source

Adding a new source should be a small workflow:

```text
create module folder
  -> write module.yaml
  -> implement fetch
  -> implement normalize
  -> run dry-run
  -> inspect sample candidates
  -> enable module
  -> next radar scan loads it
```

## Module Registry

The product should maintain a registry of enabled modules and their lane assignment.

The registry should support:

- enabled / disabled
- lane override
- freshness override
- dry-run
- health status
- last successful run
- last error

## CDP / Browser Modules

Browser modules must respect local focus and session constraints:

- reuse the configured browser profile
- prefer background tabs
- do not activate or bring tabs to foreground
- do not close shared browser processes
- record source gaps when access is unavailable

