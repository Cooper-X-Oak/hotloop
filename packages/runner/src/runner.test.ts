import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  appendRunEvent,
  createRun,
  getRun,
  listRuns,
  registerArtifacts,
  updateRunStatus,
  writeCheckpoint
} from "./index.js";

async function createRunsRoot() {
  return mkdtemp(path.join(tmpdir(), "hotloop-runs-"));
}

describe("durable run ledger", () => {
  it("creates a run directory with run.json, events.jsonl, and artifacts.json", async () => {
    const runsRoot = await createRunsRoot();

    const run = await createRun(runsRoot, {
      id: "run-1",
      type: "hotspot-writing-loop",
      currentStep: "scan",
      workspaceRoot: "D:/workspace",
      loopDefinition: "loops/hotspot-writing-loop.yaml",
      loadedHarness: ["AGENTS.md"],
      loadedModules: ["sopilot-x"]
    });

    expect(run.status).toBe("running");
    expect(run.currentStep).toBe("scan");
    await expect(readFile(path.join(runsRoot, "run-1", "run.json"), "utf8")).resolves.toContain(
      "hotspot-writing-loop"
    );
    await expect(
      readFile(path.join(runsRoot, "run-1", "events.jsonl"), "utf8")
    ).resolves.toContain("run_started");
    await expect(readFile(path.join(runsRoot, "run-1", "artifacts.json"), "utf8")).resolves.toBe(
      "{}\n"
    );
  });

  it("appends events, writes checkpoints, and registers artifacts", async () => {
    const runsRoot = await createRunsRoot();
    await createRun(runsRoot, {
      id: "run-2",
      type: "hotspot-writing-loop",
      currentStep: "scan",
      workspaceRoot: "D:/workspace",
      loopDefinition: "loops/hotspot-writing-loop.yaml",
      loadedHarness: [],
      loadedModules: []
    });

    await appendRunEvent(runsRoot, "run-2", {
      type: "scan_completed",
      message: "Scan complete",
      data: { count: 3 }
    });
    await writeCheckpoint(runsRoot, "run-2", "001-after-scan", { candidateCount: 3 });
    await registerArtifacts(runsRoot, "run-2", {
      candidatePool: ".scratch/hotloop/candidates/latest.json"
    });

    const events = await readFile(path.join(runsRoot, "run-2", "events.jsonl"), "utf8");
    const checkpoint = await readFile(
      path.join(runsRoot, "run-2", "checkpoints", "001-after-scan.json"),
      "utf8"
    );
    const artifacts = await readFile(path.join(runsRoot, "run-2", "artifacts.json"), "utf8");

    expect(events).toContain("scan_completed");
    expect(checkpoint).toContain("candidateCount");
    expect(JSON.parse(artifacts).candidatePool).toBe(".scratch/hotloop/candidates/latest.json");
  });

  it("updates run status and lists newest runs first", async () => {
    const runsRoot = await createRunsRoot();
    await createRun(runsRoot, {
      id: "run-a",
      type: "hotspot-writing-loop",
      currentStep: "scan",
      workspaceRoot: "D:/workspace",
      loopDefinition: "loops/hotspot-writing-loop.yaml",
      loadedHarness: [],
      loadedModules: []
    });
    await createRun(runsRoot, {
      id: "run-b",
      type: "hotspot-writing-loop",
      currentStep: "write",
      workspaceRoot: "D:/workspace",
      loopDefinition: "loops/hotspot-writing-loop.yaml",
      loadedHarness: [],
      loadedModules: []
    });

    await updateRunStatus(runsRoot, "run-a", {
      status: "succeeded",
      currentStep: "artifact_ready"
    });

    const updated = await getRun(runsRoot, "run-a");
    const runs = await listRuns(runsRoot);

    expect(updated.status).toBe("succeeded");
    expect(updated.currentStep).toBe("artifact_ready");
    expect(runs.map((run) => run.id)).toEqual(["run-b", "run-a"]);
  });
});

