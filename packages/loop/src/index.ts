import path from "node:path";
import { runRadarModules, type RadarModuleHandler } from "@hotloop/modules";
import {
  appendRunEvent,
  createRun,
  registerArtifacts,
  updateRunStatus,
  writeCheckpoint,
  type RunRecord
} from "@hotloop/runner";
import { loadWorkspaceConfig, type Candidate } from "@hotloop/workspace";

export interface RunHotspotScanLoopInput {
  id: string;
  runsRoot: string;
  modulesRoot: string;
  workspaceConfigPath: string;
  loopDefinition: string;
  radarHandlers: Record<string, RadarModuleHandler>;
}

export interface RunHotspotScanLoopResult {
  run: RunRecord;
  candidates: Candidate[];
  candidatesPath: string;
}

export async function runHotspotScanLoop(
  input: RunHotspotScanLoopInput
): Promise<RunHotspotScanLoopResult> {
  const workspace = await loadWorkspaceConfig(input.workspaceConfigPath);
  const run = await createRun(input.runsRoot, {
    id: input.id,
    type: "hotspot-writing-loop",
    currentStep: "scan",
    workspaceRoot: workspace.contentRoot,
    loopDefinition: input.loopDefinition,
    loadedHarness: [],
    loadedModules: []
  });

  await appendRunEvent(input.runsRoot, run.id, {
    type: "loop_started",
    message: "Hotspot scan loop started"
  });

  const radarResult = await runRadarModules({
    modulesRoot: input.modulesRoot,
    scratchRoot: workspace.scratchRoot,
    handlers: input.radarHandlers
  });

  await writeCheckpoint(input.runsRoot, run.id, "scan", {
    candidates: radarResult.candidates,
    modules: radarResult.modules
  });
  await registerArtifacts(input.runsRoot, run.id, {
    candidates: path.relative(workspace.contentRoot, radarResult.candidatesPath)
  });
  const completedRun = await updateRunStatus(input.runsRoot, run.id, {
    status: "succeeded",
    currentStep: "scan"
  });
  await appendRunEvent(input.runsRoot, run.id, {
    type: "loop_completed",
    message: "Hotspot scan loop completed"
  });

  return {
    run: completedRun,
    candidates: radarResult.candidates,
    candidatesPath: radarResult.candidatesPath
  };
}
