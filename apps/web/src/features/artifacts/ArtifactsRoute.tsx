import type { FeaturePageProps } from "../types.js";
import { ViewHeader } from "../shared/WorkflowHeader.js";

export function ArtifactsRoute({ artifacts }: FeaturePageProps) {
  return (
    <section id="artifacts" className="view">
      <ViewHeader eyebrow="成品库" title="最终 HTML 成品" />
      <ul className="table-list">
        {artifacts.map((artifact) => (
          <li key={artifact.id}>
            <strong>{artifact.title}</strong>
            <span>{artifact.fileName}</span>
            <span>HTML</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
