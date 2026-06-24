import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Candidate } from "@hotloop/workspace";
import YAML from "yaml";
import { z } from "zod";

const ModuleManifestSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["radar", "evidence", "writer", "media", "renderer", "publisher"]),
  name: z.string().min(1),
  version: z.string().default("0.1.0"),
  enabled: z.boolean().default(true),
  lane: z.string().optional(),
  freshnessWindowHours: z.number().optional(),
  requires: z.array(z.string()).default([]),
  entrypoints: z.record(z.string(), z.string()).optional(),
  outputs: z.array(z.string()).default([]),
  policy: z.array(z.string()).default([]),
  health: z
    .object({
      timeoutMs: z.number().optional(),
      retryCount: z.number().optional()
    })
    .optional(),
  notes: z.string().optional()
});

export type ModuleManifest = z.infer<typeof ModuleManifestSchema> & {
  moduleRoot: string;
};

export async function loadModule(moduleRoot: string): Promise<ModuleManifest> {
  const manifestPath = path.join(moduleRoot, "module.yaml");
  const raw = await readFile(manifestPath, "utf8");
  const parsed = ModuleManifestSchema.parse(YAML.parse(raw));
  return {
    ...parsed,
    moduleRoot
  };
}

export async function loadModules(modulesRoot: string): Promise<ModuleManifest[]> {
  const entries = await readdir(modulesRoot, { withFileTypes: true });
  const modules = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => loadModule(path.join(modulesRoot, entry.name)))
  );

  return modules.sort((a, b) => a.id.localeCompare(b.id));
}

export async function listEnabledModules(modulesRoot: string): Promise<ModuleManifest[]> {
  const modules = await loadModules(modulesRoot);
  return modules.filter((module) => module.enabled);
}

export type RadarModuleHandler = (module: ModuleManifest) => Promise<Candidate[]>;

export interface RunRadarModulesInput {
  modulesRoot: string;
  scratchRoot: string;
  handlers: Record<string, RadarModuleHandler>;
}

export interface RunRadarModulesResult {
  candidates: Candidate[];
  candidatesPath: string;
  modules: Array<{
    id: string;
    candidateCount: number;
  }>;
}

export async function runRadarModules(
  input: RunRadarModulesInput
): Promise<RunRadarModulesResult> {
  const modules = (await listEnabledModules(input.modulesRoot)).filter(
    (module) => module.type === "radar"
  );
  const candidates: Candidate[] = [];
  const moduleResults: RunRadarModulesResult["modules"] = [];

  for (const module of modules) {
    const handler = input.handlers[module.id];
    if (!handler) {
      moduleResults.push({ id: module.id, candidateCount: 0 });
      continue;
    }
    const moduleCandidates = await handler(module);
    candidates.push(...moduleCandidates);
    moduleResults.push({ id: module.id, candidateCount: moduleCandidates.length });
  }

  const candidatesPath = path.join(input.scratchRoot, "candidates", "latest.json");
  await mkdir(path.dirname(candidatesPath), { recursive: true });
  await writeFile(
    candidatesPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), candidates }, null, 2)}\n`,
    "utf8"
  );

  return {
    candidates,
    candidatesPath,
    modules: moduleResults
  };
}
