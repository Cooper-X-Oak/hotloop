import type { AgentCommand, AgentMessage, AgentSession, HumanDecision } from "@hotloop/agent";
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
  getAgentSessions: () => Promise<AgentSession[]>;
  getAgentMessages: (sessionId: string) => Promise<AgentMessage[]>;
  getAgentCommands: (sessionId: string) => Promise<AgentCommand[]>;
  getAgentDecisions: (sessionId: string) => Promise<HumanDecision[]>;
  runScan: (id: string) => Promise<{ candidates?: Candidate[]; run?: ConsoleRun }>;
  createAgentSession: (input: {
    id: string;
    workspaceRoot: string;
    activeRunId?: string;
    agentAdapter: AgentSession["agentAdapter"];
    adapterPriority: AgentSession["adapterPriority"];
    fallbackReason: string | null;
    loadedHarness: string[];
  }) => Promise<AgentSession>;
  sendAgentMessage: (
    sessionId: string,
    input: Pick<AgentMessage, "id" | "role" | "content">
  ) => Promise<AgentMessage>;
  enqueueAgentCommand: (
    sessionId: string,
    input: Pick<AgentCommand, "id" | "type" | "payload">
  ) => Promise<AgentCommand>;
  runAgentCommandWithLocalCli: (
    sessionId: string,
    commandId: string,
    input: { executable: string; args?: string[]; cwd: string }
  ) => Promise<{ exitCode: number | null; stdoutPath?: string; stderrPath?: string }>;
  answerAgentDecision: (
    sessionId: string,
    decisionId: string,
    input: { answer: string }
  ) => Promise<HumanDecision>;
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
    getAgentSessions: () => getJson(fetchImpl, "/api/agent/sessions", []),
    getAgentMessages: (sessionId) =>
      getJson(fetchImpl, `/api/agent/sessions/${sessionId}/messages`, []),
    getAgentCommands: (sessionId) =>
      getJson(fetchImpl, `/api/agent/sessions/${sessionId}/commands`, []),
    getAgentDecisions: (sessionId) =>
      getJson(fetchImpl, `/api/agent/sessions/${sessionId}/decisions`, []),
    runScan: (id) =>
      postJson(fetchImpl, "/api/loops/hotspot/scan", { id }, { candidates: [] }),
    createAgentSession: (input) =>
      postJson(fetchImpl, "/api/agent/sessions", input, {
        ...input,
        status: "idle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }),
    sendAgentMessage: (sessionId, input) =>
      postJson(fetchImpl, `/api/agent/sessions/${sessionId}/messages`, input, {
        ...input,
        sessionId,
        createdAt: new Date().toISOString()
      }),
    enqueueAgentCommand: (sessionId, input) =>
      postJson(fetchImpl, `/api/agent/sessions/${sessionId}/commands`, input, {
        ...input,
        sessionId,
        status: "queued",
        createdAt: new Date().toISOString()
      }),
    runAgentCommandWithLocalCli: (sessionId, commandId, input) =>
      postJson(
        fetchImpl,
        `/api/agent/sessions/${sessionId}/commands/${commandId}/local-cli/run`,
        input,
        { exitCode: null }
      ),
    answerAgentDecision: (sessionId, decisionId, input) =>
      postJson(fetchImpl, `/api/agent/sessions/${sessionId}/decisions/${decisionId}/answer`, input, {
        id: decisionId,
        sessionId,
        question: "",
        options: [],
        status: "answered",
        answer: input.answer,
        createdAt: new Date().toISOString(),
        answeredAt: new Date().toISOString()
      }),
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
