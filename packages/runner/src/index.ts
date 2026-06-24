import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type RunStatus =
  | "queued"
  | "running"
  | "waiting_for_user"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface RunRecord {
  id: string;
  type: string;
  status: RunStatus;
  currentStep: string;
  workspaceRoot: string;
  loopDefinition: string;
  loadedHarness: string[];
  loadedModules: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRunInput {
  id: string;
  type: string;
  currentStep: string;
  workspaceRoot: string;
  loopDefinition: string;
  loadedHarness: string[];
  loadedModules: string[];
}

export interface RunEventInput {
  type: string;
  message?: string;
  data?: unknown;
}

export type ArtifactMap = Record<string, string | null>;

function runDir(runsRoot: string, runId: string): string {
  return path.join(runsRoot, runId);
}

function runJsonPath(runsRoot: string, runId: string): string {
  return path.join(runDir(runsRoot, runId), "run.json");
}

function eventsPath(runsRoot: string, runId: string): string {
  return path.join(runDir(runsRoot, runId), "events.jsonl");
}

function artifactsPath(runsRoot: string, runId: string): string {
  return path.join(runDir(runsRoot, runId), "artifacts.json");
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function createRun(runsRoot: string, input: CreateRunInput): Promise<RunRecord> {
  const now = new Date().toISOString();
  const dir = runDir(runsRoot, input.id);
  await mkdir(path.join(dir, "checkpoints"), { recursive: true });
  await mkdir(path.join(dir, "logs"), { recursive: true });

  const run: RunRecord = {
    ...input,
    status: "running",
    createdAt: now,
    updatedAt: now
  };

  await writeJson(runJsonPath(runsRoot, input.id), run);
  await writeFile(eventsPath(runsRoot, input.id), "", "utf8");
  await writeJson(artifactsPath(runsRoot, input.id), {});
  await appendRunEvent(runsRoot, input.id, {
    type: "run_started",
    message: `Run ${input.id} started`
  });

  return run;
}

export async function appendRunEvent(
  runsRoot: string,
  runId: string,
  input: RunEventInput
): Promise<void> {
  const event = {
    ts: new Date().toISOString(),
    ...input
  };
  await appendFile(eventsPath(runsRoot, runId), `${JSON.stringify(event)}\n`, "utf8");
}

export async function writeCheckpoint(
  runsRoot: string,
  runId: string,
  checkpointId: string,
  value: unknown
): Promise<string> {
  const checkpointsDir = path.join(runDir(runsRoot, runId), "checkpoints");
  await mkdir(checkpointsDir, { recursive: true });
  const checkpointPath = path.join(checkpointsDir, `${checkpointId}.json`);
  await writeJson(checkpointPath, value);
  await appendRunEvent(runsRoot, runId, {
    type: "checkpoint_written",
    data: { checkpointId, path: checkpointPath }
  });
  return checkpointPath;
}

export async function registerArtifacts(
  runsRoot: string,
  runId: string,
  artifacts: ArtifactMap
): Promise<ArtifactMap> {
  const current = await readArtifacts(runsRoot, runId);
  const next = { ...current, ...artifacts };
  await writeJson(artifactsPath(runsRoot, runId), next);
  await appendRunEvent(runsRoot, runId, {
    type: "artifacts_registered",
    data: artifacts
  });
  return next;
}

export async function readArtifacts(runsRoot: string, runId: string): Promise<ArtifactMap> {
  const raw = await readFile(artifactsPath(runsRoot, runId), "utf8");
  return JSON.parse(raw) as ArtifactMap;
}

export async function getRun(runsRoot: string, runId: string): Promise<RunRecord> {
  const raw = await readFile(runJsonPath(runsRoot, runId), "utf8");
  return JSON.parse(raw) as RunRecord;
}

export async function updateRunStatus(
  runsRoot: string,
  runId: string,
  update: Partial<Pick<RunRecord, "status" | "currentStep">>
): Promise<RunRecord> {
  const current = await getRun(runsRoot, runId);
  const next: RunRecord = {
    ...current,
    ...update,
    updatedAt: new Date().toISOString()
  };
  await writeJson(runJsonPath(runsRoot, runId), next);
  await appendRunEvent(runsRoot, runId, {
    type: "run_updated",
    data: update
  });
  return next;
}

export async function listRuns(runsRoot: string): Promise<RunRecord[]> {
  const entries = await readdir(runsRoot, { withFileTypes: true });
  const runs = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => getRun(runsRoot, entry.name))
  );

  return runs.sort((a, b) => {
    const byCreated = b.createdAt.localeCompare(a.createdAt);
    if (byCreated !== 0) return byCreated;
    return b.id.localeCompare(a.id);
  });
}

