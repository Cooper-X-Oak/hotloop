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

  it("creates topic and article packages", async () => {
    const fixture = await createFixtureWorkspace();
    const app = createApp({ workspaceConfigPath: fixture.configPath });

    const topicResponse = await app.request("/api/topics", {
      method: "POST",
      body: JSON.stringify({
        date: "2026-06-24",
        slug: "hn-candidate",
        candidate: {
          id: "hn-1",
          lane: "P2",
          title: "HN candidate",
          source: "hn"
        }
      }),
      headers: { "Content-Type": "application/json" }
    });
    const topic = await topicResponse.json();

    const articleResponse = await app.request("/api/topics/2026-06-24/hn-candidate/article", {
      method: "POST",
      body: JSON.stringify({ group: "科普" }),
      headers: { "Content-Type": "application/json" }
    });
    const article = await articleResponse.json();

    expect(topicResponse.status).toBe(201);
    expect(topic.slug).toBe("hn-candidate");
    expect(articleResponse.status).toBe(201);
    expect(article.group).toBe("科普");
  });

  it("validates artifact directories", async () => {
    const fixture = await createFixtureWorkspace();
    const app = createApp({ workspaceConfigPath: fixture.configPath });

    const response = await app.request("/api/artifacts/validate?date=2026-06-24");
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.valid).toBe(true);
  });

  it("records and summarizes feedback outcomes", async () => {
    const fixture = await createFixtureWorkspace();
    const feedbackRoot = await mkdtemp(path.join(tmpdir(), "hotloop-api-feedback-"));
    const app = createApp({ workspaceConfigPath: fixture.configPath, feedbackRoot });

    const recordResponse = await app.request("/api/feedback/outcomes", {
      method: "POST",
      body: JSON.stringify({
        topicId: "topic-1",
        source: "sopilot-x",
        lane: "P0",
        metrics: { views: 1200, likes: 30, shares: 6 }
      }),
      headers: { "Content-Type": "application/json" }
    });
    const summaryResponse = await app.request("/api/feedback/sources");
    const summary = await summaryResponse.json();

    expect(recordResponse.status).toBe(201);
    expect(summary).toEqual([
      {
        source: "sopilot-x",
        count: 1,
        averageViews: 1200,
        averageLikes: 30,
        averageShares: 6
      }
    ]);
  });

  it("exposes agent session, message, command, event, and decision APIs", async () => {
    const fixture = await createFixtureWorkspace();
    const agentSessionsRoot = await mkdtemp(path.join(tmpdir(), "hotloop-api-agent-"));
    const app = createApp({ workspaceConfigPath: fixture.configPath, agentSessionsRoot });

    const createResponse = await app.request("/api/agent/sessions", {
      method: "POST",
      body: JSON.stringify({
        id: "agent-api-1",
        workspaceRoot: "D:/workspace",
        activeRunId: "run-api-1",
        agentAdapter: "local-cli:codex",
        adapterPriority: ["local-cli:codex", "api-fallback"],
        fallbackReason: null,
        loadedHarness: ["AGENTS.md"]
      }),
      headers: { "Content-Type": "application/json" }
    });
    const session = await createResponse.json();

    const messageResponse = await app.request("/api/agent/sessions/agent-api-1/messages", {
      method: "POST",
      body: JSON.stringify({
        id: "msg-api-1",
        role: "human",
        content: "跑一轮近 6h 热点。"
      }),
      headers: { "Content-Type": "application/json" }
    });

    const commandResponse = await app.request("/api/agent/sessions/agent-api-1/commands", {
      method: "POST",
      body: JSON.stringify({
        id: "cmd-api-1",
        type: "run_loop",
        payload: { freshnessWindowHours: 6 }
      }),
      headers: { "Content-Type": "application/json" }
    });

    const eventResponse = await app.request("/api/agent/sessions/agent-api-1/events", {
      method: "POST",
      body: JSON.stringify({
        type: "adapter_selected",
        message: "Using local CLI",
        data: { adapter: "local-cli:codex" }
      }),
      headers: { "Content-Type": "application/json" }
    });

    const decisionResponse = await app.request("/api/agent/sessions/agent-api-1/decisions", {
      method: "POST",
      body: JSON.stringify({
        id: "decision-api-1",
        runId: "run-api-1",
        question: "先写哪个？",
        recommendedAnswer: "先写 P0。",
        options: ["write_p0", "skip"]
      }),
      headers: { "Content-Type": "application/json" }
    });

    const answerResponse = await app.request(
      "/api/agent/sessions/agent-api-1/decisions/decision-api-1/answer",
      {
        method: "POST",
        body: JSON.stringify({ answer: "write_p0" }),
        headers: { "Content-Type": "application/json" }
      }
    );

    const sessions = await (await app.request("/api/agent/sessions")).json();
    const messages = await (await app.request("/api/agent/sessions/agent-api-1/messages")).json();
    const commands = await (await app.request("/api/agent/sessions/agent-api-1/commands")).json();
    const events = await (await app.request("/api/agent/sessions/agent-api-1/events")).json();
    const decisions = await (await app.request("/api/agent/sessions/agent-api-1/decisions")).json();

    expect(createResponse.status).toBe(201);
    expect(session.agentAdapter).toBe("local-cli:codex");
    expect(messageResponse.status).toBe(201);
    expect(commandResponse.status).toBe(201);
    expect(eventResponse.status).toBe(201);
    expect(decisionResponse.status).toBe(201);
    expect(answerResponse.status).toBe(201);
    expect(sessions).toHaveLength(1);
    expect(messages[0].content).toBe("跑一轮近 6h 热点。");
    expect(commands[0].status).toBe("queued");
    expect(events[0].type).toBe("adapter_selected");
    expect(decisions[0]).toMatchObject({ status: "answered", answer: "write_p0" });
  });

  it("dispatches a queued agent command through the local CLI bridge", async () => {
    const fixture = await createFixtureWorkspace();
    const agentSessionsRoot = await mkdtemp(path.join(tmpdir(), "hotloop-api-agent-cli-"));
    const app = createApp({
      workspaceConfigPath: fixture.configPath,
      agentSessionsRoot,
      localCliRunner: async (input) => {
        expect(input.executable).toBe("codex");
        expect(input.stdin).toContain("cmd-cli-api");
        return {
          exitCode: 0,
          stdout: "local cli finished",
          stderr: ""
        };
      }
    });

    await app.request("/api/agent/sessions", {
      method: "POST",
      body: JSON.stringify({
        id: "agent-cli-api",
        workspaceRoot: "D:/workspace",
        agentAdapter: "local-cli:codex",
        adapterPriority: ["local-cli:codex", "api-fallback"],
        fallbackReason: null,
        loadedHarness: ["AGENTS.md"]
      }),
      headers: { "Content-Type": "application/json" }
    });
    await app.request("/api/agent/sessions/agent-cli-api/commands", {
      method: "POST",
      body: JSON.stringify({
        id: "cmd-cli-api",
        type: "run_loop",
        payload: { instruction: "跑近 6h AI 热点。" }
      }),
      headers: { "Content-Type": "application/json" }
    });

    const dispatchResponse = await app.request(
      "/api/agent/sessions/agent-cli-api/commands/cmd-cli-api/local-cli/run",
      {
        method: "POST",
        body: JSON.stringify({
          executable: "codex",
          args: ["exec", "--json"],
          cwd: "D:/workspace"
        }),
        headers: { "Content-Type": "application/json" }
      }
    );
    const dispatch = await dispatchResponse.json();
    const session = await (
      await app.request("/api/agent/sessions/agent-cli-api")
    ).json();
    const events = await (
      await app.request("/api/agent/sessions/agent-cli-api/events")
    ).json();

    expect(dispatchResponse.status).toBe(201);
    expect(dispatch.exitCode).toBe(0);
    expect(dispatch.stdoutPath).toContain("agent.stdout.log");
    expect(session.status).toBe("succeeded");
    expect(events.map((event: { type: string }) => event.type)).toContain("local_cli_completed");
  });

  it("exposes phase 9-13 workflow APIs", async () => {
    const fixture = await createFixtureWorkspace();
    const modulesRoot = await mkdtemp(path.join(tmpdir(), "hotloop-api-phase-modules-"));
    const runsRoot = await mkdtemp(path.join(tmpdir(), "hotloop-api-phase-runs-"));
    const moduleRoot = path.join(modulesRoot, "sopilot-x");
    await mkdir(moduleRoot, { recursive: true });
    await writeFile(
      path.join(moduleRoot, "module.yaml"),
      "id: sopilot-x\ntype: radar\nname: X explosive posts\nversion: 0.1.0\nenabled: true\nlane: P0\n",
      "utf8"
    );
    const app = createApp({
      workspaceConfigPath: fixture.configPath,
      repoRoot: await mkdtemp(path.join(tmpdir(), "hotloop-api-repo-")),
      runsRoot,
      modulesRoot,
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
      },
      wechatClient: {
        uploadContentImage: async () => "https://mmbiz.qpic.cn/inline.png",
        uploadCoverImage: async () => "cover-media-id",
        addDraft: async () => "draft-media-id"
      }
    });

    const smoke = await (await app.request("/api/smoke")).json();
    const radarRun = await (await app.request("/api/radar/run", { method: "POST" })).json();
    const loopRunResponse = await app.request("/api/loops/hotspot/scan", {
      method: "POST",
      body: JSON.stringify({ id: "api-loop-1" }),
      headers: { "Content-Type": "application/json" }
    });
    const loopRun = await loopRunResponse.json();
    await app.request("/api/topics", {
      method: "POST",
      body: JSON.stringify({
        date: "2026-06-24",
        slug: "x-post",
        candidate: radarRun.candidates[0]
      }),
      headers: { "Content-Type": "application/json" }
    });
    await app.request("/api/topics/2026-06-24/x-post/article", {
      method: "POST",
      body: JSON.stringify({ group: "default" }),
      headers: { "Content-Type": "application/json" }
    });
    const evidenceResponse = await app.request("/api/topics/2026-06-24/x-post/evidence", {
      method: "POST",
      body: JSON.stringify({
        sources: [
          {
            id: "x-1",
            url: "https://x.com/example/status/1",
            title: "Original X post",
            capturedAt: "2026-06-24T12:00:00+08:00",
            evidenceLevel: "L2",
            summary: "Original post captured."
          }
        ],
        publicAnalysis: "L2 evidence captured."
      }),
      headers: { "Content-Type": "application/json" }
    });
    const renderResponse = await app.request("/api/topics/2026-06-24/x-post/render", {
      method: "POST"
    });
    const publishResponse = await app.request("/api/publish/wechat/draft", {
      method: "POST",
      body: JSON.stringify({
        title: "Draft",
        digest: "Digest",
        html: '<section><img src="data:image/png;base64,AAAA" /></section>',
        coverImagePath: "cover.png"
      }),
      headers: { "Content-Type": "application/json" }
    });
    const rendered = await renderResponse.json();
    const draft = await publishResponse.json();

    expect(smoke.ok).toBe(true);
    expect(radarRun.candidates).toHaveLength(1);
    expect(loopRunResponse.status).toBe(201);
    expect(loopRun.run.status).toBe("succeeded");
    expect(loopRun.candidates).toHaveLength(1);
    expect(evidenceResponse.status).toBe(201);
    expect(renderResponse.status).toBe(201);
    expect(rendered.fileName).toBe("2026-06-24-x-post.html");
    expect(publishResponse.status).toBe(201);
    expect(draft.mediaId).toBe("draft-media-id");
  });
});
