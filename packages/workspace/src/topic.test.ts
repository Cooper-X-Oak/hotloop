import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createArticlePackage,
  createTopicPackage,
  getTopicPackage,
  loadWorkspaceConfig
} from "./index.js";

async function createFixtureWorkspace() {
  const root = await mkdtemp(path.join(tmpdir(), "hotloop-topic-"));
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

describe("topic and article package workflow", () => {
  it("creates a topic package from a candidate", async () => {
    const fixture = await createFixtureWorkspace();
    const config = await loadWorkspaceConfig(fixture.configPath);

    const topic = await createTopicPackage(config, {
      date: "2026-06-24",
      slug: "codex-ssd-write-bug",
      candidate: {
        id: "x-1",
        lane: "P0",
        title: "Codex SSD write bug",
        source: "x-cdp",
        url: "https://x.com/example/status/1"
      }
    });

    expect(topic.slug).toBe("codex-ssd-write-bug");
    expect(topic.topicPath).toBe(
      path.join(fixture.hotspotRoot, "2026-06-24", "codex-ssd-write-bug")
    );
    await expect(readFile(path.join(topic.topicPath, "topic.json"), "utf8")).resolves.toContain(
      "Codex SSD write bug"
    );
  });

  it("creates article package directories and reports status", async () => {
    const fixture = await createFixtureWorkspace();
    const config = await loadWorkspaceConfig(fixture.configPath);
    const topic = await createTopicPackage(config, {
      date: "2026-06-24",
      slug: "codex-ssd-write-bug",
      candidate: {
        id: "x-1",
        lane: "P0",
        title: "Codex SSD write bug",
        source: "x-cdp"
      }
    });

    const article = await createArticlePackage(config, topic, { group: "科普" });
    const status = await getTopicPackage(config, "2026-06-24", "codex-ssd-write-bug");

    expect(article.articlePath).toBe(
      path.join(topic.topicPath, "技能组成稿", "科普", "文章.md")
    );
    expect(status.articlePackage?.group).toBe("科普");
    expect(status.hasEvidencePack).toBe(false);
    expect(status.hasArticleDraft).toBe(true);
  });
});

