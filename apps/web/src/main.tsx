import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { ProductConsole, type ActiveTopic, type ConsoleArtifact, type ConsoleFeedback, type ConsoleRun } from "./console.js";
import type { Candidate } from "@hotloop/workspace";
import "./styles.css";

async function loadJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

async function postJson<T>(url: string, body: unknown, fallback: T): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [runs, setRuns] = useState<ConsoleRun[]>([]);
  const [artifacts, setArtifacts] = useState<ConsoleArtifact[]>([]);
  const [feedback, setFeedback] = useState<ConsoleFeedback[]>([]);
  const [activeTopic, setActiveTopic] = useState<ActiveTopic | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function refresh() {
    const date = today();
    const [nextCandidates, nextRuns, nextArtifacts, nextFeedback] = await Promise.all([
      loadJson<Candidate[]>("/api/candidates", []),
      loadJson<ConsoleRun[]>("/api/runs", []),
      loadJson<ConsoleArtifact[]>(`/api/artifacts?date=${date}`, []),
      loadJson<ConsoleFeedback[]>("/api/feedback/sources", [])
    ]);
    setCandidates(nextCandidates);
    setRuns(nextRuns);
    setArtifacts(nextArtifacts);
    setFeedback(nextFeedback);
  }

  function log(message: string) {
    setActivityLog((items) => [message, ...items].slice(0, 8));
  }

  async function runScan() {
    setBusyAction("scan");
    const result = await postJson<{ candidates?: Candidate[]; run?: ConsoleRun }>(
      "/api/loops/hotspot/scan",
      { id: `ui-scan-${Date.now()}` },
      {}
    );
    log(`扫描完成：${result.candidates?.length ?? 0} 条候选`);
    await refresh();
    setBusyAction(null);
  }

  async function createTopic(candidate: Candidate) {
    const date = today();
    const slug = slugify(candidate.id);
    await postJson(
      "/api/topics",
      {
        date,
        slug,
        candidate
      },
      null
    );
    setActiveTopic({
      date,
      slug,
      title: candidate.title,
      source: candidate.source
    });
    log(`已创建选题包：${candidate.title}`);
  }

  async function createArticle() {
    if (!activeTopic) return;
    await postJson(
      `/api/topics/${activeTopic.date}/${activeTopic.slug}/article`,
      { group: "default" },
      null
    );
    log(`已创建文章包：${activeTopic.title}`);
  }

  async function writeEvidence() {
    if (!activeTopic) return;
    await postJson(
      `/api/topics/${activeTopic.date}/${activeTopic.slug}/evidence`,
      {
        sources: [
          {
            id: activeTopic.slug,
            url: "https://example.invalid/hotloop-demo-source",
            title: activeTopic.title,
            capturedAt: new Date().toISOString(),
            evidenceLevel: "L2",
            summary: "由前端工作流写入的演示证据。"
          }
        ],
        publicAnalysis: `L2：${activeTopic.title} 已写入演示证据包。`
      },
      null
    );
    log(`已写入证据包：${activeTopic.title}`);
  }

  async function renderHtml() {
    if (!activeTopic) return;
    await postJson(`/api/topics/${activeTopic.date}/${activeTopic.slug}/render`, {}, null);
    log(`已渲染 HTML：${activeTopic.title}`);
    await refresh();
  }

  async function createDraft(artifact: ConsoleArtifact) {
    await postJson(
      "/api/publish/wechat/draft",
      {
        title: artifact.title,
        digest: "HotLoop 演示草稿",
        html: `<section><h1>${artifact.title}</h1><p>${artifact.fileName}</p></section>`,
        coverImagePath: "demo-cover.png"
      },
      null
    );
    log(`已创建公众号草稿：${artifact.title}`);
  }

  async function recordFeedback() {
    const source = activeTopic?.source ?? candidates[0]?.source ?? "demo";
    await postJson(
      "/api/feedback/outcomes",
      {
        topicId: activeTopic?.slug ?? `feedback-${Date.now()}`,
        source,
        lane: candidates.find((candidate) => candidate.source === source)?.lane ?? "P0",
        metrics: { views: 1200, likes: 36, shares: 8 }
      },
      null
    );
    log(`已记录反馈：${source}`);
    await refresh();
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <ProductConsole
      candidates={candidates}
      runs={runs}
      artifacts={artifacts}
      feedback={feedback}
      activeTopic={activeTopic}
      activityLog={activityLog}
      busyAction={busyAction}
      onRunScan={runScan}
      onCreateTopic={createTopic}
      onCreateArticle={createArticle}
      onWriteEvidence={writeEvidence}
      onRenderHtml={renderHtml}
      onCreateDraft={createDraft}
      onRecordFeedback={recordFeedback}
    />
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing root element");
}

createRoot(root).render(<App />);
