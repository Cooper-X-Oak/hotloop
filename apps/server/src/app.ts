import { Hono } from "hono";
import { listEnabledModules } from "@hotloop/modules";
import { createRun, listRuns } from "@hotloop/runner";
import {
  listCandidates,
  listFinalHtmlArtifacts,
  listSources,
  loadWorkspaceConfig,
  type WorkspaceConfig
} from "@hotloop/workspace";

export interface CreateAppOptions {
  workspaceConfigPath: string;
  runsRoot?: string;
  modulesRoot?: string;
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

  return app;
}
