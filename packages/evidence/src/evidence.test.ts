import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTopicPackage, loadWorkspaceConfig } from "@hotloop/workspace";
import { writeEvidencePack } from "./index.js";

async function createTopicFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "hotloop-evidence-"));
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
  const config = await loadWorkspaceConfig(configPath);
  const topic = await createTopicPackage(config, {
    date: "2026-06-24",
    slug: "claude-codex",
    candidate: {
      id: "x-1",
      lane: "P0",
      title: "Claude and Codex update",
      source: "sopilot-x",
      url: "https://x.com/example/status/1"
    }
  });
  return { topic };
}

describe("evidence pack", () => {
  it("writes source snapshots and public analysis into a topic package", async () => {
    const { topic } = await createTopicFixture();

    const result = await writeEvidencePack(topic, {
      sources: [
        {
          id: "x-1",
          url: "https://x.com/example/status/1",
          title: "Original X post",
          capturedAt: "2026-06-24T12:00:00+08:00",
          evidenceLevel: "L2",
          summary: "The original post claims a product behavior changed."
        }
      ],
      publicAnalysis: "L2: Original source captured. L3: Impact hypothesis remains tentative."
    });

    const packRaw = await readFile(result.evidencePackPath, "utf8");
    const analysisRaw = await readFile(result.publicAnalysisPath, "utf8");

    expect(JSON.parse(packRaw).sources).toHaveLength(1);
    expect(analysisRaw).toContain("Impact hypothesis remains tentative");
    expect(result.sourceSnapshotPaths[0]).toContain("x-1.json");
  });
});
