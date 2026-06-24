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
      { url: "/api/feedback/outcomes", method: "POST" }
    ]);
  });
});
