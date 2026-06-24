import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

async function createFixtureWorkspace() {
  const root = await mkdtemp(path.join(tmpdir(), "hotloop-server-"));
  const contentRoot = path.join(root, "content");
  const hotspotRoot = path.join(contentRoot, "热点追踪");
  const scratchRoot = path.join(contentRoot, ".scratch", "hotloop");
  await mkdir(path.join(hotspotRoot, "2026-06-24", "_成品文章-cooper-md黑色"), {
    recursive: true
  });
  await mkdir(path.join(scratchRoot, "candidates"), { recursive: true });

  await writeFile(
    path.join(root, "workspace.local.json"),
    JSON.stringify({ workspaceName: "fixture", contentRoot, hotspotRoot, scratchRoot }),
    "utf8"
  );
  await writeFile(
    path.join(hotspotRoot, "信源.yaml"),
    "- id: hn\n  name: Hacker News\n  kind: rss\n  endpoint: https://hnrss.org/frontpage\n  status: active\n",
    "utf8"
  );
  await writeFile(
    path.join(scratchRoot, "candidates", "latest.json"),
    JSON.stringify({
      candidates: [
        {
          id: "hn-1",
          lane: "P2",
          title: "HN candidate",
          source: "hn",
          url: "https://news.ycombinator.com/item?id=1"
        }
      ]
    }),
    "utf8"
  );
  await writeFile(
    path.join(hotspotRoot, "2026-06-24", "_成品文章-cooper-md黑色", "2026-06-24-HN.html"),
    "<html>HN</html>",
    "utf8"
  );

  return {
    configPath: path.join(root, "workspace.local.json")
  };
}

describe("server API", () => {
  it("returns workspace metadata", async () => {
    const fixture = await createFixtureWorkspace();
    const app = createApp({ workspaceConfigPath: fixture.configPath });

    const response = await app.request("/api/workspace");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.workspaceName).toBe("fixture");
    expect(body.contentRoot).toContain("content");
  });

  it("returns sources, candidates, and artifacts", async () => {
    const fixture = await createFixtureWorkspace();
    const app = createApp({ workspaceConfigPath: fixture.configPath });

    const sources = await (await app.request("/api/sources")).json();
    const candidates = await (await app.request("/api/candidates")).json();
    const artifacts = await (await app.request("/api/artifacts?date=2026-06-24")).json();

    expect(sources).toHaveLength(1);
    expect(candidates).toHaveLength(1);
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].title).toBe("HN");
  });

  it("rejects artifact requests without a date", async () => {
    const fixture = await createFixtureWorkspace();
    const app = createApp({ workspaceConfigPath: fixture.configPath });

    const response = await app.request("/api/artifacts");

    expect(response.status).toBe(400);
  });

  it("creates and lists durable runs", async () => {
    const fixture = await createFixtureWorkspace();
    const runsRoot = await mkdtemp(path.join(tmpdir(), "hotloop-api-runs-"));
    const app = createApp({ workspaceConfigPath: fixture.configPath, runsRoot });

    const createResponse = await app.request("/api/runs", {
      method: "POST",
      body: JSON.stringify({
        id: "run-api-1",
        type: "hotspot-writing-loop",
        currentStep: "scan",
        workspaceRoot: "D:/workspace",
        loopDefinition: "loops/hotspot-writing-loop.yaml",
        loadedHarness: [],
        loadedModules: []
      }),
      headers: { "Content-Type": "application/json" }
    });
    const runsResponse = await app.request("/api/runs");
    const runs = await runsResponse.json();

    expect(createResponse.status).toBe(201);
    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe("run-api-1");
  });

  it("lists enabled modules", async () => {
    const fixture = await createFixtureWorkspace();
    const modulesRoot = await mkdtemp(path.join(tmpdir(), "hotloop-api-modules-"));
    const moduleRoot = path.join(modulesRoot, "sopilot-x");
    await mkdir(moduleRoot, { recursive: true });
    await writeFile(
      path.join(moduleRoot, "module.yaml"),
      "id: sopilot-x\ntype: radar\nname: X explosive posts\nversion: 0.1.0\nenabled: true\nlane: P0\n",
      "utf8"
    );
    const app = createApp({ workspaceConfigPath: fixture.configPath, modulesRoot });

    const response = await app.request("/api/modules");
    const modules = await response.json();

    expect(response.status).toBe(200);
    expect(modules).toHaveLength(1);
    expect(modules[0].id).toBe("sopilot-x");
  });
});
