# Domain Model

## Objects

### Workspace

The external content vault that HotLoop reads and operates on.

Fields:

- `name`
- `contentRoot`
- `hotspotRoot`
- `scratchRoot`

### Source

A registered origin of information.

Examples:

- RSS feed
- API endpoint
- GitHub Trending source
- CDP browser collection target
- official product page

### Candidate

A possible hotspot found by a radar module.

Candidates are not topics yet. They must be classified, deduplicated, and selected.

### Topic

A selected writing target.

A topic owns or points to:

- source references
- evidence pack
- article package
- image plan
- render artifacts
- publish jobs

### EvidencePack

The structured source and claim layer for a topic.

It separates:

- L1 confirmed facts
- L2 reliable evidence
- L3 assumptions, disputes, or weak signals
- forbidden or unsafe claims

### ArticlePackage

The writing workspace for a topic.

It includes:

- article draft
- process notes
- image plan
- image assets
- quality gate status

### RenderArtifact

A finished output file, such as final HTML.

Artifacts should be clean, reviewable, and stable.

### PublishJob

A draft-creation or export job for an external platform.

Publishing jobs are not auto-publish jobs. They create reviewable drafts or export packages.

### Run

A durable execution record for a workflow.

Runs own:

- `run.json`
- `events.jsonl`
- checkpoints
- artifact references
- logs

## Lifecycle

```text
Source
  -> Candidate
  -> Topic
  -> EvidencePack
  -> ArticlePackage
  -> RenderArtifact
  -> PublishJob
```

## State Ownership

```text
Long-term content:
  external workspace

Recoverable runtime state:
  scratch run ledger

Query acceleration:
  optional future SQLite index
```

