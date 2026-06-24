import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Candidate } from "@hotloop/workspace";

export interface DemoRuntimeInput {
  repoRoot: string;
  serverPort?: number;
  webPort?: number;
}

export interface DemoRuntimeConfig {
  repoRoot: string;
  workspaceConfigPath: string;
  contentRoot: string;
  hotspotRoot: string;
  scratchRoot: string;
  runsRoot: string;
  feedbackRoot: string;
  agentSessionsRoot: string;
  modulesRoot: string;
  serverPort: number;
  webPort: number;
}

const DEMO_SOURCES = [
  {
    id: "sopilot-x-rss",
    name: "X explosive posts RSS",
    kind: "rss",
    endpoint: "https://example.invalid/sopilot-x.xml",
    status: "active",
    note: "Demo P0 source"
  },
  {
    id: "github-trending",
    name: "GitHub Trending",
    kind: "github",
    endpoint: "https://github.com/trending",
    status: "active"
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    kind: "rss",
    endpoint: "https://hnrss.org/frontpage",
    status: "active"
  },
  {
    id: "official-ai-updates",
    name: "Official AI updates",
    kind: "web",
    endpoint: "https://openai.com/news/",
    status: "active"
  },
  {
    id: "paper-signals",
    name: "Recent paper signals",
    kind: "web",
    endpoint: "https://arxiv.org/",
    status: "active"
  }
];

export const DEMO_CANDIDATES: Candidate[] = [
  {
    id: "demo-p0-x",
    lane: "P0",
    title: "Demo X post: product lead hints at agent workflow shift",
    source: "sopilot-x-rss",
    url: "https://x.com/example/status/demo-p0",
    summary: "A seeded P0 item for testing the operation console.",
    whyItMatters: "P0 verifies the explosive-post lane and scan loop.",
    risk: "Demo data only."
  },
  {
    id: "demo-p1-github",
    lane: "P1",
    title: "Demo GitHub repo gains unusual momentum",
    source: "github-trending",
    url: "https://github.com/example/demo",
    summary: "Seeded open-source velocity signal."
  },
  {
    id: "demo-p2-hn",
    lane: "P2",
    title: "Demo HN thread debates AI coding workflows",
    source: "hacker-news",
    url: "https://news.ycombinator.com/item?id=1",
    summary: "Seeded international community discussion."
  },
  {
    id: "demo-p3-official",
    lane: "P3",
    title: "Demo official changelog updates agent tooling",
    source: "official-ai-updates",
    url: "https://openai.com/news/",
    summary: "Seeded official update signal."
  },
  {
    id: "demo-p4-paper",
    lane: "P4",
    title: "Demo paper proposes better tool-use evaluation",
    source: "paper-signals",
    url: "https://arxiv.org/abs/0000.00000",
    summary: "Seeded paper signal."
  }
];

export async function prepareDemoRuntime(input: DemoRuntimeInput): Promise<DemoRuntimeConfig> {
  const repoRoot = path.resolve(input.repoRoot);
  const demoRoot = path.join(repoRoot, ".scratch", "demo");
  const contentRoot = path.join(demoRoot, "content");
  const hotspotRoot = path.join(contentRoot, "热点追踪");
  const scratchRoot = path.join(contentRoot, ".scratch", "hotloop");
  const candidatesRoot = path.join(scratchRoot, "candidates");
  const runsRoot = path.join(demoRoot, "runs");
  const feedbackRoot = path.join(demoRoot, "feedback");
  const agentSessionsRoot = path.join(demoRoot, "agent-sessions");
  const workspaceConfigPath = path.join(demoRoot, "workspace.local.json");
  const modulesRoot = path.join(repoRoot, "modules");

  await mkdir(hotspotRoot, { recursive: true });
  await mkdir(candidatesRoot, { recursive: true });
  await mkdir(runsRoot, { recursive: true });
  await mkdir(feedbackRoot, { recursive: true });
  await mkdir(agentSessionsRoot, { recursive: true });

  await writeFile(path.join(hotspotRoot, "信源.yaml"), toSourceYaml(DEMO_SOURCES), "utf8");
  await writeFile(
    path.join(candidatesRoot, "latest.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), candidates: DEMO_CANDIDATES }, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    workspaceConfigPath,
    `${JSON.stringify(
      {
        workspaceName: "hotloop-demo",
        contentRoot,
        hotspotRoot,
        scratchRoot
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  return {
    repoRoot,
    workspaceConfigPath,
    contentRoot,
    hotspotRoot,
    scratchRoot,
    runsRoot,
    feedbackRoot,
    agentSessionsRoot,
    modulesRoot,
    serverPort: input.serverPort ?? 8787,
    webPort: input.webPort ?? 5173
  };
}

function toSourceYaml(sources: typeof DEMO_SOURCES): string {
  return sources
    .map((source) =>
      [
        `- id: ${source.id}`,
        `  name: ${source.name}`,
        `  kind: ${source.kind}`,
        `  endpoint: ${source.endpoint}`,
        `  status: ${source.status}`,
        source.note ? `  note: ${source.note}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n");
}
