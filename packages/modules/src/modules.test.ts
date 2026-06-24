import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listEnabledModules, loadModule, loadModules, runRadarModules } from "./index.js";

async function createModuleFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "hotloop-modules-"));
  const active = path.join(root, "sopilot-x");
  const disabled = path.join(root, "disabled-source");
  await mkdir(active, { recursive: true });
  await mkdir(disabled, { recursive: true });

  await writeFile(
    path.join(active, "module.yaml"),
    [
      "id: sopilot-x",
      "type: radar",
      "name: X explosive posts",
      "version: 0.1.0",
      "enabled: true",
      "lane: P0",
      "freshnessWindowHours: 6",
      "requires:",
      "  - network",
      "entrypoints:",
      "  fetch: fetch.ts",
      "  normalize: normalize.ts",
      "outputs:",
      "  - Candidate[]"
    ].join("\n"),
    "utf8"
  );
  await writeFile(
    path.join(disabled, "module.yaml"),
    [
      "id: disabled-source",
      "type: radar",
      "name: Disabled Source",
      "version: 0.1.0",
      "enabled: false",
      "lane: P2"
    ].join("\n"),
    "utf8"
  );

  return { root, active };
}

describe("module registry", () => {
  it("loads a module manifest", async () => {
    const fixture = await createModuleFixture();

    const module = await loadModule(fixture.active);

    expect(module.id).toBe("sopilot-x");
    expect(module.type).toBe("radar");
    expect(module.lane).toBe("P0");
    expect(module.entrypoints?.fetch).toBe("fetch.ts");
  });

  it("loads modules sorted by id and filters enabled modules", async () => {
    const fixture = await createModuleFixture();

    const modules = await loadModules(fixture.root);
    const enabled = await listEnabledModules(fixture.root);

    expect(modules.map((module) => module.id)).toEqual(["disabled-source", "sopilot-x"]);
    expect(enabled.map((module) => module.id)).toEqual(["sopilot-x"]);
  });

  it("runs enabled radar modules and writes normalized candidates to the workspace cache", async () => {
    const fixture = await createModuleFixture();
    const scratchRoot = await mkdtemp(path.join(tmpdir(), "hotloop-module-runner-"));

    const result = await runRadarModules({
      modulesRoot: fixture.root,
      scratchRoot,
      handlers: {
        "sopilot-x": async () => [
          {
            id: "x-1",
            lane: "P0",
            title: "Explosive X post",
            source: "sopilot-x",
            url: "https://x.com/example/status/1"
          }
        ]
      }
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.modules).toEqual([{ id: "sopilot-x", candidateCount: 1 }]);
    expect(result.candidatesPath).toBe(path.join(scratchRoot, "candidates", "latest.json"));
  });

  it("ships first-party radar module manifests for P0-P4 source lanes", async () => {
    const modules = await listEnabledModules(path.resolve("modules"));

    expect(modules.map((module) => module.id)).toEqual([
      "github-trending",
      "hacker-news",
      "official-ai-updates",
      "paper-signals",
      "sopilot-x-rss"
    ]);
    expect(modules.map((module) => module.lane)).toEqual(["P1", "P2", "P3", "P4", "P0"]);
  });
});
