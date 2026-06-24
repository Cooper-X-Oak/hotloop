import type { Candidate } from "@hotloop/workspace";
import type { ActiveTopic, ConsoleArtifact, ConsoleFeedback, ConsoleRun } from "../../console.js";

export interface OutcomeInput {
  topicId: string;
  source: string;
  lane: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
  };
}

export interface HotLoopApi {
  getCandidates: () => Promise<Candidate[]>;
  getRuns: () => Promise<ConsoleRun[]>;
  getArtifacts: (date: string) => Promise<ConsoleArtifact[]>;
  getFeedback: () => Promise<ConsoleFeedback[]>;
  runScan: (id: string) => Promise<{ candidates?: Candidate[]; run?: ConsoleRun }>;
  createTopic: (date: string, slug: string, candidate: Candidate) => Promise<ActiveTopic>;
  createArticle: (topic: ActiveTopic) => Promise<unknown>;
  writeEvidence: (topic: ActiveTopic) => Promise<unknown>;
  renderHtml: (topic: ActiveTopic) => Promise<unknown>;
  createDraft: (artifact: ConsoleArtifact) => Promise<unknown>;
  recordFeedback: (input: OutcomeInput) => Promise<unknown>;
}

export function createHotLoopApi(fetchImpl: typeof fetch = fetch): HotLoopApi {
  return {
    getCandidates: () => getJson(fetchImpl, "/api/candidates", []),
    getRuns: () => getJson(fetchImpl, "/api/runs", []),
    getArtifacts: (date) => getJson(fetchImpl, `/api/artifacts?date=${date}`, []),
    getFeedback: () => getJson(fetchImpl, "/api/feedback/sources", []),
    runScan: (id) =>
      postJson(fetchImpl, "/api/loops/hotspot/scan", { id }, { candidates: [] }),
    createTopic: async (date, slug, candidate) => {
      await postJson(fetchImpl, "/api/topics", { date, slug, candidate }, null);
      return { date, slug, title: candidate.title, source: candidate.source };
    },
    createArticle: (topic) =>
      postJson(fetchImpl, `/api/topics/${topic.date}/${topic.slug}/article`, { group: "default" }, null),
    writeEvidence: (topic) =>
      postJson(
        fetchImpl,
        `/api/topics/${topic.date}/${topic.slug}/evidence`,
        {
          sources: [
            {
              id: topic.slug,
              url: "https://example.invalid/hotloop-demo-source",
              title: topic.title,
              capturedAt: new Date().toISOString(),
              evidenceLevel: "L2",
              summary: "由前端工作流写入的演示证据。"
            }
          ],
          publicAnalysis: `L2：${topic.title} 已写入演示证据包。`
        },
        null
      ),
    renderHtml: (topic) =>
      postJson(fetchImpl, `/api/topics/${topic.date}/${topic.slug}/render`, {}, null),
    createDraft: (artifact) =>
      postJson(
        fetchImpl,
        "/api/publish/wechat/draft",
        {
          title: artifact.title,
          digest: "HotLoop 演示草稿",
          html: `<section><h1>${artifact.title}</h1><p>${artifact.fileName}</p></section>`,
          coverImagePath: "demo-cover.png"
        },
        null
      ),
    recordFeedback: (input) => postJson(fetchImpl, "/api/feedback/outcomes", input, null)
  };
}

async function getJson<T>(fetchImpl: typeof fetch, url: string, fallback: T): Promise<T> {
  try {
    const response = await fetchImpl(url);
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

async function postJson<T>(
  fetchImpl: typeof fetch,
  url: string,
  body: unknown,
  fallback: T
): Promise<T> {
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}
