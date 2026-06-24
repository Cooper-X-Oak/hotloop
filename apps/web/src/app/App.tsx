import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { Candidate } from "@hotloop/workspace";
import type { ActiveTopic, ConsoleArtifact, ConsoleFeedback, ConsoleRun } from "../console.js";
import { AppShell } from "./AppShell.js";
import { ArtifactsRoute } from "../features/artifacts/ArtifactsRoute.js";
import { EvidenceRoute } from "../features/evidence/EvidenceRoute.js";
import { FeedbackRoute } from "../features/feedback/FeedbackRoute.js";
import { PublishRoute } from "../features/publish/PublishRoute.js";
import { RadarRoute } from "../features/radar/RadarRoute.js";
import { RunsRoute } from "../features/runs/RunsRoute.js";
import { TopicsRoute } from "../features/topics/TopicsRoute.js";
import type { FeaturePageProps } from "../features/types.js";
import { createHotLoopApi, type HotLoopApi } from "../shared/api/client.js";

export interface HotLoopInitialData {
  candidates: Candidate[];
  runs: ConsoleRun[];
  artifacts: ConsoleArtifact[];
  feedback: ConsoleFeedback[];
}

export interface HotLoopAppProps {
  api?: HotLoopApi;
  initialData?: HotLoopInitialData;
}

const EMPTY_DATA: HotLoopInitialData = {
  candidates: [],
  runs: [],
  artifacts: [],
  feedback: []
};

export function HotLoopApp({ api = createHotLoopApi(), initialData = EMPTY_DATA }: HotLoopAppProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialData.candidates);
  const [runs, setRuns] = useState<ConsoleRun[]>(initialData.runs);
  const [artifacts, setArtifacts] = useState<ConsoleArtifact[]>(initialData.artifacts);
  const [feedback, setFeedback] = useState<ConsoleFeedback[]>(initialData.feedback);
  const [activeTopic, setActiveTopic] = useState<ActiveTopic | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function refresh() {
    const date = today();
    const [nextCandidates, nextRuns, nextArtifacts, nextFeedback] = await Promise.all([
      api.getCandidates(),
      api.getRuns(),
      api.getArtifacts(date),
      api.getFeedback()
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
    const result = await api.runScan(`ui-scan-${Date.now()}`);
    log(`扫描完成：${result.candidates?.length ?? 0} 条候选`);
    await refresh();
    setBusyAction(null);
  }

  async function createTopic(candidate: Candidate) {
    const topic = await api.createTopic(today(), slugify(candidate.id), candidate);
    setActiveTopic(topic);
    log(`已创建选题包：${candidate.title}`);
  }

  async function createArticle() {
    if (!activeTopic) return;
    await api.createArticle(activeTopic);
    log(`已创建文章包：${activeTopic.title}`);
  }

  async function writeEvidence() {
    if (!activeTopic) return;
    await api.writeEvidence(activeTopic);
    log(`已写入证据包：${activeTopic.title}`);
  }

  async function renderHtml() {
    if (!activeTopic) return;
    await api.renderHtml(activeTopic);
    log(`已渲染 HTML：${activeTopic.title}`);
    await refresh();
  }

  async function createDraft(artifact: ConsoleArtifact) {
    await api.createDraft(artifact);
    log(`已创建公众号草稿：${artifact.title}`);
  }

  async function recordFeedback() {
    const source = activeTopic?.source ?? candidates[0]?.source ?? "demo";
    await api.recordFeedback({
      topicId: activeTopic?.slug ?? `feedback-${Date.now()}`,
      source,
      lane: candidates.find((candidate) => candidate.source === source)?.lane ?? "P0",
      metrics: { views: 1200, likes: 36, shares: 8 }
    });
    log(`已记录反馈：${source}`);
    await refresh();
  }

  useEffect(() => {
    if (initialData === EMPTY_DATA) {
      void refresh();
    }
  }, []);

  const pageProps: FeaturePageProps = {
    candidates,
    runs,
    artifacts,
    feedback,
    activeTopic,
    busyAction,
    onRunScan: runScan,
    onCreateTopic: createTopic,
    onCreateArticle: createArticle,
    onWriteEvidence: writeEvidence,
    onRenderHtml: renderHtml,
    onCreateDraft: createDraft,
    onRecordFeedback: recordFeedback
  };
  const summary = useMemo(
    () => ({
      candidates: candidates.length,
      runs: runs[0]?.status ?? "未开始",
      artifacts: artifacts.length,
      feedback: feedback.length
    }),
    [artifacts.length, candidates.length, feedback.length, runs]
  );

  return (
    <AppShell summary={summary} activityLog={activityLog}>
      <Routes>
        <Route path="/" element={<Navigate to="/radar" replace />} />
        <Route path="/radar" element={<RadarRoute {...pageProps} />} />
        <Route path="/topics" element={<TopicsRoute {...pageProps} />} />
        <Route path="/evidence" element={<EvidenceRoute {...pageProps} />} />
        <Route path="/runs" element={<RunsRoute {...pageProps} />} />
        <Route path="/artifacts" element={<ArtifactsRoute {...pageProps} />} />
        <Route path="/publish" element={<PublishRoute {...pageProps} />} />
        <Route path="/feedback" element={<FeedbackRoute {...pageProps} />} />
      </Routes>
    </AppShell>
  );
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
