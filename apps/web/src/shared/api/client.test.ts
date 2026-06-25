import { describe, expect, it, vi } from "vitest";
import { createHotLoopApi } from "./client.js";

describe("HotLoop API client", () => {
  it("centralizes reads and workflow actions against backend APIs", async () => {
    const calls: Array<{ url: string; method: string }> = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method ?? "GET" });
      return new Response(JSON.stringify({ ok: true, candidates: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });
    const api = createHotLoopApi(fetchImpl);

    await api.getCandidates();
    await api.getRuns();
    await api.getArtifacts("2026-06-24");
    await api.getFeedback();
    await api.runScan("scan-1");
    await api.createAgentSession({
      id: "agent-1",
      workspaceRoot: "D:/workspace",
      agentAdapter: "local-cli:codex",
      cliAdapterPriority: ["local-cli:codex"],
      cliUnavailableReason: null,
      loadedHarness: ["AGENTS.md"]
    });
    await api.sendAgentMessage("agent-1", {
      id: "msg-1",
      role: "human",
      content: "跑一轮近 6h 热点。"
    });
    await api.enqueueAgentCommand("agent-1", {
      id: "cmd-1",
      type: "run_loop",
      payload: { freshnessWindowHours: 6 }
    });
    await api.runAgentCommandWithLocalCli("agent-1", "cmd-1", {
      executable: "codex",
      args: ["exec"],
      cwd: "D:/workspace"
    });
    await api.createAgentLoopRun("agent-1", {
      id: "loop-1",
      loopDefinition: "loops/hotspot-writing-loop.yaml",
      currentStep: "load_harness",
      currentTask: "准备上下文",
      progress: {
        completedSteps: [],
        activeStep: "load_harness",
        pendingSteps: ["scan_sources"]
      }
    });
    await api.runAgentLoopTurn("agent-1", "loop-1", {
      commandId: "cmd-1",
      executable: "codex",
      args: ["exec"],
      cwd: "D:/workspace"
    });
    await api.answerAgentDecision("agent-1", "decision-1", { answer: "write_p0" });
    await api.recordFeedback({
      topicId: "topic-1",
      source: "sopilot-x-rss",
      lane: "P0",
      metrics: { views: 100, likes: 5, shares: 1 }
    });

    expect(calls).toEqual([
      { url: "/api/candidates", method: "GET" },
      { url: "/api/runs", method: "GET" },
      { url: "/api/artifacts?date=2026-06-24", method: "GET" },
      { url: "/api/feedback/sources", method: "GET" },
      { url: "/api/loops/hotspot/scan", method: "POST" },
      { url: "/api/agent/sessions", method: "POST" },
      { url: "/api/agent/sessions/agent-1/messages", method: "POST" },
      { url: "/api/agent/sessions/agent-1/commands", method: "POST" },
      { url: "/api/agent/sessions/agent-1/commands/cmd-1/local-cli/run", method: "POST" },
      { url: "/api/agent/sessions/agent-1/loop-runs", method: "POST" },
      { url: "/api/agent/sessions/agent-1/loop-runs/loop-1/turns", method: "POST" },
      { url: "/api/agent/sessions/agent-1/decisions/decision-1/answer", method: "POST" },
      { url: "/api/feedback/outcomes", method: "POST" }
    ]);
  });
});
