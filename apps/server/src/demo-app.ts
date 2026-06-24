import type { Hono } from "hono";
import {
  DEMO_CANDIDATES,
  prepareDemoRuntime,
  type DemoRuntimeConfig,
  type DemoRuntimeInput
} from "@hotloop/demo";
import { createApp } from "./app.js";

export interface DemoAppResult {
  app: Hono;
  runtime: DemoRuntimeConfig;
}

export async function createDemoApp(input: DemoRuntimeInput): Promise<DemoAppResult> {
  const runtime = await prepareDemoRuntime(input);
  const app = createApp({
    workspaceConfigPath: runtime.workspaceConfigPath,
    repoRoot: runtime.repoRoot,
    runsRoot: runtime.runsRoot,
    modulesRoot: runtime.modulesRoot,
    feedbackRoot: runtime.feedbackRoot,
    agentSessionsRoot: runtime.agentSessionsRoot,
    localCliRunner: async () => ({
      exitCode: 0,
      stdout: "HotLoop demo local CLI bridge completed.",
      stderr: ""
    }),
    allowInternalWorkspace: true,
    radarHandlers: {
      "sopilot-x-rss": async () =>
        DEMO_CANDIDATES.filter((candidate) => candidate.source === "sopilot-x-rss"),
      "github-trending": async () =>
        DEMO_CANDIDATES.filter((candidate) => candidate.source === "github-trending"),
      "hacker-news": async () =>
        DEMO_CANDIDATES.filter((candidate) => candidate.source === "hacker-news"),
      "official-ai-updates": async () =>
        DEMO_CANDIDATES.filter((candidate) => candidate.source === "official-ai-updates"),
      "paper-signals": async () =>
        DEMO_CANDIDATES.filter((candidate) => candidate.source === "paper-signals")
    },
    wechatClient: {
      uploadContentImage: async ({ index }) =>
        `https://mmbiz.qpic.cn/hotloop-demo-inline-${index}.png`,
      uploadCoverImage: async () => "hotloop-demo-cover-media-id",
      addDraft: async () => "hotloop-demo-draft-media-id"
    }
  });

  return { app, runtime };
}
