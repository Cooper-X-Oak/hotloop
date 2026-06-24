# Information Architecture

## Top-level Model

```text
Workspace
  -> Sources
  -> Candidates
  -> Topics
  -> Evidence Packs
  -> Article Packages
  -> Render Artifacts
  -> Publish Jobs
```

## Product IA

```text
HotLoop
|
|-- Radar
|   |-- P0 X explosive posts
|   |-- P1 GitHub / open-source trends
|   |-- P2 international community
|   |-- P3 official product updates
|   `-- P4 paper signals
|
|-- Topics
|   |-- selected
|   |-- collecting evidence
|   |-- evidence ready
|   |-- writing
|   |-- article ready
|   |-- artifact ready
|   `-- draft created
|
|-- Evidence
|   |-- original sources
|   |-- official sources
|   |-- X posts and threads
|   |-- GitHub repos / issues / commits
|   |-- community discussion
|   |-- paper references
|   `-- L1 / L2 / L3 claim table
|
|-- Articles
|   |-- outline
|   |-- article draft
|   |-- polish pass
|   |-- title variants
|   |-- digest
|   `-- quality gates
|
|-- Media
|   |-- image plan
|   |-- cover image
|   |-- inline images
|   `-- image jobs
|
|-- Artifacts
|   |-- final HTML
|   |-- preview
|   `-- validation
|
`-- Publish
    |-- WeChat draft adapter
    |-- image upload map
    |-- cover material ID
    `-- draft media ID
```

## Candidate Lanes

P0 is mandatory and must be reported first even when empty.

```text
P0: X explosive posts / hot takes / official product-lead comments
P1: GitHub Trending / open-source velocity
P2: international AI community hotspots
P3: official product and platform updates
P4: papers, capped and only if relevant to product or developer impact
```

## Core Screens

### Hotspot Radar

Purpose: decide what is worth writing right now.

Primary objects:

- Candidate
- Source
- Lane
- Scan Run

Primary actions:

- scan
- refresh lane
- select topic
- ignore candidate
- ask agent why a candidate was or was not selected

### Topic Workspace

Purpose: turn a candidate into a controlled writing target.

Primary objects:

- Topic
- EvidencePack
- Claim
- WritingAngle

Primary actions:

- collect evidence
- mark claim level
- add source
- create article package

### Article Factory

Purpose: produce and review the article package.

Primary objects:

- ArticlePackage
- ImagePlan
- QualityGate
- Run

Primary actions:

- generate draft
- polish
- generate images
- render artifact

### Artifact Library

Purpose: inspect finished output without exposing intermediate clutter.

Primary objects:

- RenderArtifact
- ArtifactValidation

Primary actions:

- preview
- validate
- reveal file
- prepare publisher handoff

### Publish Console

Purpose: create platform drafts without auto-publishing.

Primary objects:

- PublishJob
- UploadMap
- DraftResult

Primary actions:

- validate platform compatibility
- upload images
- create draft
- record result

