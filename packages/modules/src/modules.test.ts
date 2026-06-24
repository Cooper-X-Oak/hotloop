import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listEnabledModules, loadModule, loadModules } from "./index.js";

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
});

