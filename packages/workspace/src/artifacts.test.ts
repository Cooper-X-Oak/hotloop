import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadWorkspaceConfig, validateFinalArtifactDirectory } from "./index.js";

async function createFixtureWorkspace() {
  const root = await mkdtemp(path.join(tmpdir(), "hotloop-artifacts-"));
  const contentRoot = path.join(root, "content");
  const hotspotRoot = path.join(contentRoot, "热点追踪");
  const scratchRoot = path.join(contentRoot, ".scratch", "hotloop");
  await mkdir(hotspotRoot, { recursive: true });
  await mkdir(scratchRoot, { recursive: true });
  const configPath = path.join(root, "workspace.local.json");
  await writeFile(
    configPath,
    JSON.stringify({ workspaceName: "fixture", contentRoot, hotspotRoot, scratchRoot }),
    "utf8"
  );
  return { hotspotRoot, configPath };
}

describe("artifact library validation", () => {
  it("accepts a flat final artifact directory with only dated HTML files", async () => {
    const fixture = await createFixtureWorkspace();
    const dir = path.join(fixture.hotspotRoot, "2026-06-24", "_成品文章-cooper-md黑色");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "2026-06-24-A.html"), "<html>A</html>", "utf8");
    const config = await loadWorkspaceConfig(fixture.configPath);

    const result = await validateFinalArtifactDirectory(config, "2026-06-24");

    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("rejects subdirectories and non-final files", async () => {
    const fixture = await createFixtureWorkspace();
    const dir = path.join(fixture.hotspotRoot, "2026-06-24", "_成品文章-cooper-md黑色");
    await mkdir(path.join(dir, "nested"), { recursive: true });
    await writeFile(path.join(dir, "manifest.json"), "{}", "utf8");
    await writeFile(path.join(dir, "2026-06-24-A.html"), "<html>A</html>", "utf8");
    const config = await loadWorkspaceConfig(fixture.configPath);

    const result = await validateFinalArtifactDirectory(config, "2026-06-24");

    expect(result.valid).toBe(false);
    expect(result.violations).toEqual([
      "Unexpected directory: nested",
      "Unexpected file: manifest.json"
    ]);
  });
});

