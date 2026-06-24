import { Hono } from "hono";
import { recordTopicOutcome, summarizeSourcePerformance } from "@hotloop/feedback";
import { listEnabledModules } from "@hotloop/modules";
import { createRun, listRuns } from "@hotloop/runner";
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
  runsRoot?: string;
  modulesRoot?: string;
  feedbackRoot?: string;
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
