import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  listCandidates,
  listFinalHtmlArtifacts,
  listSources,
  loadWorkspaceConfig
} from "./index.js";

async function createFixtureWorkspace() {
  const root = await mkdtemp(path.join(tmpdir(), "hotloop-workspace-"));
  const contentRoot = path.join(root, "content");
  const hotspotRoot = path.join(contentRoot, "热点追踪");
  const scratchRoot = path.join(contentRoot, ".scratch", "hotloop");
  await mkdir(hotspotRoot, { recursive: true });
  await mkdir(scratchRoot, { recursive: true });

  const configPath = path.join(root, "workspace.local.json");
  await writeFile(
    configPath,
    JSON.stringify(
      {
        workspaceName: "fixture",
        contentRoot,
        hotspotRoot,
        scratchRoot
      },
      null,
      2
    ),
    "utf8"
  );

  return { root, contentRoot, hotspotRoot, scratchRoot, configPath };
}

describe("workspace reader", () => {
  it("loads workspace config and normalizes absolute roots", async () => {
    const fixture = await createFixtureWorkspace();

    const config = await loadWorkspaceConfig(fixture.configPath);

    expect(config.workspaceName).toBe("fixture");
    expect(config.contentRoot).toBe(path.resolve(fixture.contentRoot));
    expect(config.hotspotRoot).toBe(path.resolve(fixture.hotspotRoot));
    expect(config.scratchRoot).toBe(path.resolve(fixture.scratchRoot));
  });

  it("reads source registry entries from 信源.yaml", async () => {
    const fixture = await createFixtureWorkspace();
    await writeFile(
      path.join(fixture.hotspotRoot, "信源.yaml"),
      [
        "- id: sopilot-x",
        "  name: X explosive posts",
        "  kind: rss",
        "  endpoint: https://example.com/rss.xml",
        "  status: active"
      ].join("\n"),
      "utf8"
    );
    const config = await loadWorkspaceConfig(fixture.configPath);

    const sources = await listSources(config);

    expect(sources).toEqual([
      {
        id: "sopilot-x",
        name: "X explosive posts",
        kind: "rss",
        endpoint: "https://example.com/rss.xml",
        status: "active"
      }
    ]);
  });

  it("returns empty candidate list when latest candidate cache is missing", async () => {
    const fixture = await createFixtureWorkspace();
    const config = await loadWorkspaceConfig(fixture.configPath);

    const candidates = await listCandidates(config);

    expect(candidates).toEqual([]);
  });

  it("reads candidates from latest-candidates.json", async () => {
    const fixture = await createFixtureWorkspace();
    const candidatesDir = path.join(fixture.scratchRoot, "candidates");
    await mkdir(candidatesDir, { recursive: true });
    await writeFile(
      path.join(candidatesDir, "latest.json"),
      JSON.stringify({
        candidates: [
          {
            id: "x-1",
            lane: "P0",
            title: "Explosive X post",
            source: "sopilot-x",
            url: "https://x.com/example/status/1",
            publishedAt: "2026-06-24T08:30:00+08:00",
            ageHours: 2,
            summary: "A fresh signal",
            whyItMatters: "It affects AI coding users",
            risk: "Needs confirmation",
            evidenceLevel: "L2"
          }
        ]
      }),
      "utf8"
    );
    const config = await loadWorkspaceConfig(fixture.configPath);

    const candidates = await listCandidates(config);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.lane).toBe("P0");
  });

  it("lists final HTML artifacts by date", async () => {
    const fixture = await createFixtureWorkspace();
    const artifactDir = path.join(
      fixture.hotspotRoot,
      "2026-06-24",
      "_成品文章-cooper-md黑色"
    );
    await mkdir(artifactDir, { recursive: true });
    await writeFile(path.join(artifactDir, "2026-06-24-A.html"), "<html>A</html>", "utf8");
    await writeFile(path.join(artifactDir, "notes.md"), "not final", "utf8");
    const config = await loadWorkspaceConfig(fixture.configPath);

    const artifacts = await listFinalHtmlArtifacts(config, "2026-06-24");

    expect(artifacts).toEqual([
      {
        id: "2026-06-24/2026-06-24-A.html",
        date: "2026-06-24",
        title: "A",
        fileName: "2026-06-24-A.html",
        path: path.join(artifactDir, "2026-06-24-A.html")
      }
    ]);
  });
});

