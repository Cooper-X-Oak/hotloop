# Modules

Modules are pluggable capabilities that the product and agents can load.

They are intentionally filesystem-based so new radar sources, evidence collectors, renderers, and publisher adapters can be added without rewriting the product backend.

## Module Types

- `radar`: discovers candidates
- `evidence`: captures or enriches source material
- `writer`: writes or rewrites text
- `media`: generates or processes images
- `renderer`: creates final artifacts
- `publisher`: creates platform drafts or exports

## Expected Shape

```text
modules/<module-id>/
  module.yaml
  README.md
  fetch.ts
  normalize.ts
  examples/
  tests/
```

The exact entrypoints depend on module type. The manifest is the stable contract.

## Safety

- Modules must not auto-publish.
- Browser modules must not steal focus.
- Modules should emit structured output and errors.
- Modules should record source URLs and fetch metadata wherever possible.

