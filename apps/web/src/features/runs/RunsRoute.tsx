import type { FeaturePageProps } from "../types.js";
import { ViewHeader } from "../shared/WorkflowHeader.js";

export function RunsRoute({ runs }: FeaturePageProps) {
  return (
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
  );
}
