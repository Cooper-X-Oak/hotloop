import type { FeaturePageProps } from "../types.js";
import { ViewHeader } from "../shared/WorkflowHeader.js";

export function PublishRoute({ artifacts, onCreateDraft }: FeaturePageProps) {
  return (
    <section id="publish" className="view">
      <ViewHeader eyebrow="发布台" title="草稿交付" />
      <p className="summary">只创建草稿，不自动发布。成品 HTML 校验后再交给发布适配器。</p>
      <ul className="table-list">
        {artifacts.map((artifact) => (
          <li key={artifact.id}>
            <strong>{artifact.title}</strong>
            <span>{artifact.fileName}</span>
            <button onClick={() => onCreateDraft(artifact)}>创建公众号草稿</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
