import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
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

