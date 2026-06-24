import type { FeaturePageProps } from "../types.js";
import { WorkflowHeader } from "../shared/WorkflowHeader.js";

export function FeedbackRoute({ feedback, onRecordFeedback }: FeaturePageProps) {
  return (
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
  );
}
