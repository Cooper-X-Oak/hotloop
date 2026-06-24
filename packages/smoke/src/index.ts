import { access } from "node:fs/promises";
import path from "node:path";
import { loadWorkspaceConfig } from "@hotloop/workspace";

export interface WorkspaceSmokeInput {
  repoRoot: string;
  workspaceConfigPath: string;
}

export interface WorkspaceSmokeCheck {
  name: string;
  ok: boolean;
}

export interface WorkspaceSmokeResult {
  ok: boolean;
  workspaceName: string;
  externalWorkspace: boolean;
  checks: WorkspaceSmokeCheck[];
}

export async function runWorkspaceSmokeTest(
  input: WorkspaceSmokeInput
): Promise<WorkspaceSmokeResult> {
  const config = await loadWorkspaceConfig(input.workspaceConfigPath);
  const checks: WorkspaceSmokeCheck[] = [
    { name: "contentRoot", ok: await exists(config.contentRoot) },
    { name: "hotspotRoot", ok: await exists(config.hotspotRoot) },
    { name: "scratchRoot", ok: await exists(config.scratchRoot) },
    { name: "sourceRegistry", ok: await exists(path.join(config.hotspotRoot, "信源.yaml")) },
    {
      name: "candidateCache",
      ok: await exists(path.join(config.scratchRoot, "candidates", "latest.json"))
    }
  ];
  const externalWorkspace = !isInside(input.repoRoot, config.contentRoot);

  return {
    ok: externalWorkspace && checks.every((check) => check.ok),
    workspaceName: config.workspaceName,
    externalWorkspace,
    checks
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
