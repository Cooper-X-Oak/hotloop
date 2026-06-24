import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArticlePackage, RenderArtifact, TopicPackage, WorkspaceConfig } from "@hotloop/workspace";

export async function renderArticleHtml(
  config: WorkspaceConfig,
  topic: TopicPackage,
  article: ArticlePackage
): Promise<RenderArtifact> {
  const markdown = await readFile(article.articlePath, "utf8");
  const fileName = `${topic.date}-${topic.slug}.html`;
  const artifactDir = path.join(config.hotspotRoot, topic.date, "_成品文章-cooper-md黑色");
  const artifactPath = path.join(artifactDir, fileName);
  await mkdir(artifactDir, { recursive: true });
  await writeFile(artifactPath, buildHtml(markdown, topic.candidate.title), "utf8");

  return {
    id: `${topic.date}/${fileName}`,
    date: topic.date,
    title: topic.candidate.title,
    fileName,
    path: artifactPath
  };
}

function buildHtml(markdown: string, title: string): string {
  return [
    "<!doctype html>",
    '<html lang="zh-CN">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    "<style>",
    "body.cooper-md-dark{margin:0;background:#101214;color:#f2f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.72;}",
    "main{max-width:760px;margin:0 auto;padding:48px 22px 72px;}",
    "h1{font-size:34px;line-height:1.2;margin:0 0 24px;}h2{font-size:22px;margin:34px 0 12px;}p{margin:0 0 16px;color:#d7dcdf;}",
    "</style>",
    "</head>",
    '<body class="cooper-md-dark">',
    "<main>",
    markdownToHtml(markdown),
    "</main>",
    "</body>",
    "</html>"
  ].join("\n");
}

function markdownToHtml(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("# ")) {
        return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      }
      if (line.startsWith("## ")) {
        return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
