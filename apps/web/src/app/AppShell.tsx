import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export interface AppSummary {
  candidates: number;
  runs: string;
  artifacts: number;
  feedback: number;
}

export interface AppShellProps {
  summary: AppSummary;
  activityLog: string[];
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/agent", label: "Agent" },
  { to: "/radar", label: "雷达台" },
  { to: "/topics", label: "选题工作台" },
  { to: "/runs", label: "运行账本" },
  { to: "/artifacts", label: "成品库" },
  { to: "/publish", label: "发布台" },
  { to: "/feedback", label: "反馈学习" }
];

export function AppShell({ summary, activityLog, children }: AppShellProps) {
  return (
    <div className="product-shell">
      <aside className="sidebar" aria-label="Agent 工具间">
        <p className="brand">HotLoop</p>
        <p className="side-note">给 agent 使用的本地热点写作工具间</p>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <section className="workflow-overview" aria-label="工作流状态">
          <div>
            <p className="eyebrow">Agent 当前工作流</p>
            <h1>从热点扫描到草稿发布</h1>
          </div>
          <div className="status-strip">
            <StatusPill label="候选" value={String(summary.candidates)} />
            <StatusPill label="运行" value={summary.runs} />
            <StatusPill label="成品" value={String(summary.artifacts)} />
            <StatusPill label="信源" value={String(summary.feedback)} />
          </div>
        </section>

        {children}

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
    </div>
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

function ViewHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="view-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </header>
  );
}
