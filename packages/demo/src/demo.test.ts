import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listCandidates, listSources, loadWorkspaceConfig } from "@hotloop/workspace";
import { prepareDemoRuntime } from "./index.js";

describe("demo runtime", () => {
  it("prepares an ignored local workspace with seeded sources and candidates", async () => {
    const runtime = await prepareDemoRuntime({
      repoRoot: path.resolve(".")
    });

    const config = await loadWorkspaceConfig(runtime.workspaceConfigPath);
    const sources = await listSources(config);
    const candidates = await listCandidates(config);
    const configRaw = await readFile(runtime.workspaceConfigPath, "utf8");

    expect(runtime.serverPort).toBe(8787);
    expect(runtime.webPort).toBe(5173);
    expect(runtime.modulesRoot).toBe(path.resolve("modules"));
    expect(runtime.runsRoot).toContain(path.join(".scratch", "demo", "runs"));
    expect(runtime.feedbackRoot).toContain(path.join(".scratch", "demo", "feedback"));
    expect(runtime.agentSessionsRoot).toContain(path.join(".scratch", "demo", "agent-sessions"));
    expect(config.contentRoot).toContain(path.join(".scratch", "demo", "content"));
    expect(sources.map((source) => source.id)).toEqual([
      "sopilot-x-rss",
      "github-trending",
      "hacker-news",
      "official-ai-updates",
      "paper-signals"
    ]);
    expect(candidates.map((candidate) => candidate.lane)).toEqual(["P0", "P1", "P2", "P3", "P4"]);
    expect(configRaw).not.toContain("D:/Users/cooper/Practice-Project/内容创作");
  });

  it("exposes a root one-command demo script", async () => {
    const packageJson = JSON.parse(await readFile(path.resolve("package.json"), "utf8"));

    expect(packageJson.scripts["dev:demo"]).toBe("tsx scripts/dev-demo.ts");
  });
});
