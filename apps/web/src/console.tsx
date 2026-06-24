import type { ReactNode } from "react";
import type { Candidate } from "@hotloop/workspace";
import { RadarPage } from "./radar.js";

export interface ConsoleRun {
  id: string;
  status: string;
  currentStep: string;
}

export interface ConsoleArtifact {
  id: string;
  title: string;
  fileName: string;
}

export interface ConsoleFeedback {
  source: string;
  count: number;
  averageViews: number;
}

export interface ActiveTopic {
  date: string;
  slug: string;
  title: string;
  source: string;
}

export interface ProductConsoleProps {
  candidates: Candidate[];
  runs: ConsoleRun[];
  artifacts: ConsoleArtifact[];
  feedback: ConsoleFeedback[];
  activeTopic?: ActiveTopic | null;
  activityLog?: string[];
  busyAction?: string | null;
  onRunScan?: () => void;
  onCreateTopic?: (candidate: Candidate) => void;
  onCreateArticle?: () => void;
  onWriteEvidence?: () => void;
  onRenderHtml?: () => void;
  onCreateDraft?: (artifact: ConsoleArtifact) => void;
  onRecordFeedback?: () => void;
}

export function ProductConsole({
  candidates,
  runs,
  artifacts,
  feedback,
  activeTopic,
  activityLog = [],
  busyAction,
  onRunScan,
  onCreateTopic,
  onCreateArticle,
  onWriteEvidence,
  onRenderHtml,
  onCreateDraft,
  onRecordFeedback
}: ProductConsoleProps) {
  const latestRun = runs[0];
  const topCandidate = candidates[0];

  return (
    <main className="product-shell">
      <aside className="sidebar" aria-label="产品视图">
        <p className="brand">HotLoop</p>
        <p className="side-note">本地优先的 AI 热点写作工作台</p>
        <nav>
          <a href="#radar">雷达台</a>
          <a href="#topics">选题工作台</a>
          <a href="#evidence">证据与成稿</a>
          <a href="#runs">运行账本</a>
          <a href="#artifacts">成品与发布</a>
          <a href="#feedback">反馈学习</a>
        </nav>
      </aside>

      <div className="workspace">
        <section className="workflow-overview" aria-label="工作流状态">
          <div>
            <p className="eyebrow">当前工作流</p>
            <h1>从热点扫描到草稿发布</h1>
          </div>
          <div className="status-strip">
            <StatusPill label="候选" value={String(candidates.length)} />
            <StatusPill label="运行" value={latestRun?.status ?? "未开始"} />
            <StatusPill label="成品" value={String(artifacts.length)} />
            <StatusPill label="信源" value={String(feedback.length)} />
          </div>
        </section>

        <section id="radar" className="view">
          <WorkflowHeader
            step="01"
            title="雷达台"
            description="先运行扫描，把 P0-P4 候选池刷新到本地 scratch。"
            action={
              <button className="primary-action" onClick={onRunScan} disabled={busyAction === "scan"}>
                {busyAction === "scan" ? "扫描中" : "运行扫描"}
              </button>
            }
          />
          <RadarPage candidates={candidates} />
        </section>

        <section id="topics" className="view">
          <WorkflowHeader
            step="02"
            title="选题工作台"
            description="从候选池挑一个信号，落成可追踪的 topic package。"
          />
          <div className="split-panel">
            <div>
              <h3>候选列表</h3>
              <ul className="action-list">
                {candidates.map((candidate) => (
                  <li key={candidate.id}>
                    <div>
                      <strong>{candidate.title}</strong>
                      <span>
                        {candidate.lane} · {candidate.source}
                      </span>
                    </div>
                    <button onClick={() => onCreateTopic?.(candidate)}>创建选题包</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="focus-box">
              <p className="eyebrow">当前选题</p>
              {activeTopic ? (
                <>
                  <h3>{activeTopic.title}</h3>
                  <p>
                    {activeTopic.date} / {activeTopic.slug} / {activeTopic.source}
                  </p>
                </>
              ) : (
                <>
                  <h3>{topCandidate?.title ?? "还没有选题"}</h3>
                  <p>先从候选列表创建一个选题包。</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section id="evidence" className="view">
          <WorkflowHeader
            step="03"
            title="证据与成稿"
            description="把选题推进为证据包、文章包，再渲染成最终 HTML。"
          />
          <div className="command-grid">
            <CommandCard
              title="写入证据包"
              body="生成 evidence-pack.json、source snapshot 和 _公共分析.md。"
              action="写入证据包"
              disabled={!activeTopic}
              onClick={onWriteEvidence}
            />
            <CommandCard
              title="创建文章包"
              body="生成 文章.md、配图方案.md、过程.md 和配图目录。"
              action="创建文章包"
              disabled={!activeTopic}
              onClick={onCreateArticle}
            />
            <CommandCard
              title="渲染 HTML"
              body="把文章包渲染到 cooper-md 黑色成品目录。"
              action="渲染 HTML"
              disabled={!activeTopic}
              onClick={onRenderHtml}
            />
          </div>
        </section>

        <section id="runs" className="view">
          <ViewHeader eyebrow="运行账本" title="Durable run ledger" />
          <ul className="table-list">
            {runs.map((run) => (
              <li key={run.id}>
                <strong>{run.id}</strong>
                <span>{run.status}</span>
                <span>{run.currentStep}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="artifacts" className="view">
          <ViewHeader eyebrow="成品与发布" title="最终 HTML 与草稿交付" />
          <p className="summary">只创建草稿，不自动发布。成品 HTML 校验后再交给发布适配器。</p>
          <ul className="table-list">
            {artifacts.map((artifact) => (
              <li key={artifact.id}>
                <strong>{artifact.title}</strong>
                <span>{artifact.fileName}</span>
                <button onClick={() => onCreateDraft?.(artifact)}>创建公众号草稿</button>
              </li>
            ))}
          </ul>
        </section>

        <section id="feedback" className="view">
          <WorkflowHeader
            step="06"
            title="反馈学习"
            description="记录选题结果，让信源表现回流到下一轮雷达判断。"
            action={<button onClick={onRecordFeedback}>记录反馈</button>}
          />
          <ul className="table-list">
            {feedback.map((item) => (
              <li key={item.source}>
                <strong>{item.source}</strong>
                <span>{item.count} 次结果</span>
                <span>{Math.round(item.averageViews)} 平均阅读</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="view">
          <ViewHeader eyebrow="活动记录" title="最近动作" />
          <ol className="activity-log">
            {activityLog.length === 0 ? <li>等待操作。</li> : null}
            {activityLog.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkflowHeader({
  step,
  title,
  description,
  action
}: {
  step: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="workflow-header">
      <div className="step-badge">{step}</div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div className="workflow-action">{action}</div> : null}
    </header>
  );
}

function CommandCard({
  title,
  body,
  action,
  disabled,
  onClick
}: {
  title: string;
  body: string;
  action: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <article className="command-card">
      <h3>{title}</h3>
      <p>{body}</p>
      <button disabled={disabled} onClick={onClick}>
        {action}
      </button>
    </article>
  );
}

function ViewHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="view-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </header>
  );
}
