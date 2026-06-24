import { RadarPage } from "../../radar.js";
import type { FeaturePageProps } from "../types.js";
import { WorkflowHeader } from "../shared/WorkflowHeader.js";

export function RadarRoute({ candidates, busyAction, onRunScan }: FeaturePageProps) {
  return (
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
  );
}
