import { Hono } from "hono";
import { createWeChatDraftThroughApi, type WeChatApiClient } from "@hotloop/adapters";
import { writeEvidencePack } from "@hotloop/evidence";
import { recordTopicOutcome, summarizeSourcePerformance } from "@hotloop/feedback";
import { runHotspotScanLoop } from "@hotloop/loop";
import { listEnabledModules, runRadarModules, type RadarModuleHandler } from "@hotloop/modules";
import { renderArticleHtml } from "@hotloop/render";
import { createRun, listRuns } from "@hotloop/runner";
import { runWorkspaceSmokeTest } from "@hotloop/smoke";
import {
  createArticlePackage,
  createTopicPackage,
  getTopicPackage,
  listCandidates,
  listFinalHtmlArtifacts,
  listSources,
  loadWorkspaceConfig,
  validateFinalArtifactDirectory,
  type WorkspaceConfig
} from "@hotloop/workspace";

export interface CreateAppOptions {
  workspaceConfigPath: string;
  repoRoot?: string;
  runsRoot?: string;
  modulesRoot?: string;
  feedbackRoot?: string;
  radarHandlers?: Record<string, RadarModuleHandler>;
  wechatClient?: WeChatApiClient;
}

export function createApp(options: CreateAppOptions) {
  const app = new Hono();
  let workspacePromise: Promise<WorkspaceConfig> | undefined;

  function getWorkspace() {
    workspacePromise ??= loadWorkspaceConfig(options.workspaceConfigPath);
    return workspacePromise;
  }

  app.get("/api/workspace", async (c) => {
    const workspace = await getWorkspace();
    return c.json(workspace);
  });

  app.get("/api/sources", async (c) => {
    const workspace = await getWorkspace();
    return c.json(await listSources(workspace));
  });

  app.get("/api/candidates", async (c) => {
    const workspace = await getWorkspace();
    return c.json(await listCandidates(workspace));
  });

  app.get("/api/artifacts", async (c) => {
    const date = c.req.query("date");
    if (!date) {
      return c.json({ error: "Missing required query parameter: date" }, 400);
    }
    const workspace = await getWorkspace();
    return c.json(await listFinalHtmlArtifacts(workspace, date));
  });

  app.get("/api/artifacts/validate", async (c) => {
    const date = c.req.query("date");
    if (!date) {
      return c.json({ error: "Missing required query parameter: date" }, 400);
    }
    const workspace = await getWorkspace();
    return c.json(await validateFinalArtifactDirectory(workspace, date));
  });

  app.get("/api/runs", async (c) => {
    if (!options.runsRoot) {
      return c.json({ error: "runsRoot is not configured" }, 503);
    }
    return c.json(await listRuns(options.runsRoot));
  });

  app.post("/api/runs", async (c) => {
    if (!options.runsRoot) {
      return c.json({ error: "runsRoot is not configured" }, 503);
    }
    const input = await c.req.json();
    const run = await createRun(options.runsRoot, input);
    return c.json(run, 201);
  });

  app.get("/api/modules", async (c) => {
    if (!options.modulesRoot) {
      return c.json({ error: "modulesRoot is not configured" }, 503);
    }
    return c.json(await listEnabledModules(options.modulesRoot));
  });

  app.get("/api/smoke", async (c) => {
    if (!options.repoRoot) {
      return c.json({ error: "repoRoot is not configured" }, 503);
    }
    return c.json(
      await runWorkspaceSmokeTest({
        repoRoot: options.repoRoot,
        workspaceConfigPath: options.workspaceConfigPath
      })
    );
  });

  app.post("/api/radar/run", async (c) => {
    if (!options.modulesRoot) {
      return c.json({ error: "modulesRoot is not configured" }, 503);
    }
    const workspace = await getWorkspace();
    return c.json(
      await runRadarModules({
        modulesRoot: options.modulesRoot,
        scratchRoot: workspace.scratchRoot,
        handlers: options.radarHandlers ?? {}
      }),
      201
    );
  });

  app.post("/api/loops/hotspot/scan", async (c) => {
    if (!options.runsRoot) {
      return c.json({ error: "runsRoot is not configured" }, 503);
    }
    if (!options.modulesRoot) {
      return c.json({ error: "modulesRoot is not configured" }, 503);
    }
    const input = await c.req.json();
    return c.json(
      await runHotspotScanLoop({
        id: input.id,
        runsRoot: options.runsRoot,
        modulesRoot: options.modulesRoot,
        workspaceConfigPath: options.workspaceConfigPath,
        loopDefinition: input.loopDefinition ?? "loops/hotspot-writing-loop.yaml",
        radarHandlers: options.radarHandlers ?? {}
      }),
      201
    );
  });

  app.post("/api/topics", async (c) => {
    const workspace = await getWorkspace();
    const input = await c.req.json();
    const topic = await createTopicPackage(workspace, input);
    return c.json(topic, 201);
  });

  app.post("/api/topics/:date/:slug/article", async (c) => {
    const workspace = await getWorkspace();
    const date = c.req.param("date");
    const slug = c.req.param("slug");
    const input = await c.req.json();
    const topic = await getTopicPackage(workspace, date, slug);
    const article = await createArticlePackage(workspace, topic, {
      group: input.group ?? "default"
    });
    return c.json(article, 201);
  });

  app.post("/api/topics/:date/:slug/evidence", async (c) => {
    const workspace = await getWorkspace();
    const topic = await getTopicPackage(workspace, c.req.param("date"), c.req.param("slug"));
    return c.json(await writeEvidencePack(topic, await c.req.json()), 201);
  });

  app.post("/api/topics/:date/:slug/render", async (c) => {
    const workspace = await getWorkspace();
    const topic = await getTopicPackage(workspace, c.req.param("date"), c.req.param("slug"));
    if (!topic.articlePackage) {
      return c.json({ error: "Article package has not been created" }, 409);
    }
    return c.json(await renderArticleHtml(workspace, topic, topic.articlePackage), 201);
  });

  app.post("/api/publish/wechat/draft", async (c) => {
    if (!options.wechatClient) {
      return c.json({ error: "wechatClient is not configured" }, 503);
    }
    return c.json(await createWeChatDraftThroughApi(await c.req.json(), options.wechatClient), 201);
  });

  app.post("/api/feedback/outcomes", async (c) => {
    if (!options.feedbackRoot) {
      return c.json({ error: "feedbackRoot is not configured" }, 503);
    }
    await recordTopicOutcome(options.feedbackRoot, await c.req.json());
    return c.json({ status: "recorded" }, 201);
  });

  app.get("/api/feedback/sources", async (c) => {
    if (!options.feedbackRoot) {
      return c.json({ error: "feedbackRoot is not configured" }, 503);
    }
    return c.json(await summarizeSourcePerformance(options.feedbackRoot));
  });

  return app;
}
