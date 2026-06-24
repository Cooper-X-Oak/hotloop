import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getRun, readArtifacts } from "@hotloop/runner";
import { runHotspotScanLoop } from "./index.js";

async function createLoopFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "hotloop-loop-"));
  const contentRoot = path.join(root, "content");
  const hotspotRoot = path.join(contentRoot, "热点追踪");
  const scratchRoot = path.join(contentRoot, ".scratch", "hotloop");
  const modulesRoot = path.join(root, "modules");
  const moduleRoot = path.join(modulesRoot, "sopilot-x");
  const runsRoot = path.join(root, "runs");
  await mkdir(hotspotRoot, { recursive: true });
  await mkdir(moduleRoot, { recursive: true });
  await writeFile(
    path.join(moduleRoot, "module.yaml"),
    "id: sopilot-x\ntype: radar\nname: X explosive posts\nversion: 0.1.0\nenabled: true\nlane: P0\n",
    "utf8"
  );
  const workspaceConfigPath = path.join(root, "workspace.local.json");
  await writeFile(
    workspaceConfigPath,
    JSON.stringify({ workspaceName: "fixture", contentRoot, hotspotRoot, scratchRoot }),
    "utf8"
  );
  return { modulesRoot, runsRoot, workspaceConfigPath };
}

describe("hotspot scan loop runner", () => {
  it("creates a durable run, executes radar modules, and records candidate artifacts", async () => {
    const fixture = await createLoopFixture();

    const result = await runHotspotScanLoop({
      id: "loop-1",
      runsRoot: fixture.runsRoot,
      modulesRoot: fixture.modulesRoot,
      workspaceConfigPath: fixture.workspaceConfigPath,
      loopDefinition: "loops/hotspot-writing-loop.yaml",
      radarHandlers: {
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
    const run = await getRun(fixture.runsRoot, "loop-1");
    const artifacts = await readArtifacts(fixture.runsRoot, "loop-1");
    const checkpointRaw = await readFile(
      path.join(fixture.runsRoot, "loop-1", "checkpoints", "scan.json"),
      "utf8"
    );

    expect(result.candidates).toHaveLength(1);
    expect(run.status).toBe("succeeded");
    expect(run.currentStep).toBe("scan");
    expect(artifacts.candidates).toContain("latest.json");
    expect(JSON.parse(checkpointRaw).candidates).toHaveLength(1);
  });
});
