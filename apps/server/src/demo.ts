import path from "node:path";
import { serve } from "@hono/node-server";
import { createDemoApp } from "./demo-app.js";

const repoRoot = process.env.HOTLOOP_REPO_ROOT ?? path.resolve(".");
const port = Number(process.env.PORT ?? 8787);
const { app, runtime } = await createDemoApp({ repoRoot, serverPort: port });

serve({
  fetch: app.fetch,
  port: runtime.serverPort
});

console.log(`HotLoop demo server listening on http://127.0.0.1:${runtime.serverPort}`);
console.log(`Demo workspace config: ${runtime.workspaceConfigPath}`);
