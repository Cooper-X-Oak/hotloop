import type { FeaturePageProps } from "../types.js";
import { WorkflowHeader } from "../shared/WorkflowHeader.js";

export function TopicsRoute({ candidates, activeTopic, onCreateTopic }: FeaturePageProps) {
  const topCandidate = candidates[0];

  return (
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
                <button onClick={() => onCreateTopic(candidate)}>创建选题包</button>
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
  );
}
