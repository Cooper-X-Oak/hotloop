import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runWorkspaceSmokeTest } from "./index.js";

async function createExternalWorkspaceFixture() {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "hotloop-repo-"));
  const externalRoot = await mkdtemp(path.join(tmpdir(), "hotloop-content-vault-"));
  const hotspotRoot = path.join(externalRoot, "热点追踪");
  const scratchRoot = path.join(externalRoot, ".scratch", "hotloop");
  await mkdir(path.join(scratchRoot, "candidates"), { recursive: true });
  await mkdir(hotspotRoot, { recursive: true });
  await writeFile(
    path.join(hotspotRoot, "信源.yaml"),
    "- id: hn\n  name: Hacker News\n  kind: rss\n  endpoint: https://hnrss.org/frontpage\n  status: active\n",
    "utf8"
  );
  await writeFile(
    path.join(scratchRoot, "candidates", "latest.json"),
    JSON.stringify({ candidates: [] }),
    "utf8"
  );
  const configPath = path.join(repoRoot, "workspace.local.json");
  await writeFile(
    configPath,
    JSON.stringify({
      workspaceName: "external-fixture",
      contentRoot: externalRoot,
      hotspotRoot,
      scratchRoot
    }),
    "utf8"
  );

  return { configPath, repoRoot, externalRoot };
}

describe("workspace smoke test", () => {
  it("validates an external content vault without importing private content into the repo", async () => {
    const fixture = await createExternalWorkspaceFixture();

    const result = await runWorkspaceSmokeTest({
      repoRoot: fixture.repoRoot,
      workspaceConfigPath: fixture.configPath
    });

    expect(result.ok).toBe(true);
    expect(result.workspaceName).toBe("external-fixture");
    expect(result.externalWorkspace).toBe(true);
    expect(result.checks).toEqual([
      { name: "contentRoot", ok: true },
      { name: "hotspotRoot", ok: true },
      { name: "scratchRoot", ok: true },
      { name: "sourceRegistry", ok: true },
      { name: "candidateCache", ok: true }
    ]);
  });
});
