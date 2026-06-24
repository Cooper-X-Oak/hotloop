import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const workspaceConfigPath = process.env.HOTLOOP_WORKSPACE_CONFIG;

if (!workspaceConfigPath) {
  throw new Error("HOTLOOP_WORKSPACE_CONFIG is required");
}

const port = Number(process.env.PORT ?? 8787);

serve({
  fetch: createApp({ workspaceConfigPath }).fetch,
  port
});

console.log(`HotLoop server listening on http://127.0.0.1:${port}`);

