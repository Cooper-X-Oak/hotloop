import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDemoApp } from "./demo-app.js";

describe("demo server app", () => {
  it("wires demo runtime options so smoke and hotspot scan APIs are usable", async () => {
    const { app, runtime } = await createDemoApp({
      repoRoot: path.resolve(".")
    });

    const smoke = await (await app.request("/api/smoke")).json();
    const scanResponse = await app.request("/api/loops/hotspot/scan", {
      method: "POST",
      body: JSON.stringify({ id: "demo-loop-test" }),
      headers: { "Content-Type": "application/json" }
    });
    const scan = await scanResponse.json();
    const agentSessionResponse = await app.request("/api/agent/sessions", {
      method: "POST",
      body: JSON.stringify({
        id: "demo-agent-test",
        workspaceRoot: runtime.contentRoot,
        agentAdapter: "local-cli:codex",
        adapterPriority: ["local-cli:codex", "api-fallback"],
        fallbackReason: null,
        loadedHarness: ["AGENTS.md"]
      }),
      headers: { "Content-Type": "application/json" }
    });
    const agentSession = await agentSessionResponse.json();

    expect(runtime.workspaceConfigPath).toContain(path.join(".scratch", "demo"));
    expect(smoke.ok).toBe(true);
    expect(scanResponse.status).toBe(201);
    expect(scan.run.status).toBe("succeeded");
    expect(scan.candidates).toHaveLength(5);
    expect(agentSessionResponse.status).toBe(201);
    expect(agentSession.agentAdapter).toBe("local-cli:codex");
  });
});
