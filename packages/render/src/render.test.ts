import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createArticlePackage,
  createTopicPackage,
  loadWorkspaceConfig
} from "@hotloop/workspace";
import { renderArticleHtml } from "./index.js";

async function createArticleFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "hotloop-render-"));
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
    slug: "codex-update",
    candidate: {
      id: "official-1",
      lane: "P3",
      title: "Codex update",
      source: "openai",
      url: "https://openai.com/"
    }
  });
  const article = await createArticlePackage(config, topic, { group: "default" });
  await writeFile(
    article.articlePath,
    "# Codex update\n\nA concise evidence-backed article.\n\n## Why it matters\n\nDevelopers can inspect the loop.",
    "utf8"
  );
  return { config, topic, article };
}

describe("article renderer", () => {
  it("renders an article package into the flat cooper-md dark final artifact folder", async () => {
    const { config, topic, article } = await createArticleFixture();

    const artifact = await renderArticleHtml(config, topic, article);
    const html = await readFile(artifact.path, "utf8");

    expect(artifact.fileName).toBe("2026-06-24-codex-update.html");
    expect(html).toContain("cooper-md-dark");
    expect(html).toContain("<h1>Codex update</h1>");
    expect(html).toContain("A concise evidence-backed article.");
  });
});
