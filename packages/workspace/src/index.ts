import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

const WorkspaceConfigSchema = z.object({
  workspaceName: z.string().min(1),
  contentRoot: z.string().min(1),
  hotspotRoot: z.string().min(1),
  scratchRoot: z.string().min(1)
});

const SourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["rss", "api", "cdp", "web", "github"]).or(z.string().min(1)),
  endpoint: z.string().min(1),
  status: z.enum(["active", "dead"]).or(z.string().min(1)),
  note: z.string().optional(),
  ua_required: z.boolean().optional()
});

const CandidateSchema = z.object({
  id: z.string().min(1),
  lane: z.string().min(1),
  title: z.string().min(1),
  source: z.string().min(1),
  url: z.string().min(1).optional(),
  publishedAt: z.string().optional(),
  ageHours: z.number().optional(),
  summary: z.string().optional(),
  whyItMatters: z.string().optional(),
  risk: z.string().optional(),
  evidenceLevel: z.string().optional(),
  topicTags: z.array(z.string()).optional(),
  heat: z.record(z.string(), z.unknown()).optional()
});

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Candidate = z.infer<typeof CandidateSchema>;

export interface RenderArtifact {
  id: string;
  date: string;
  title: string;
  fileName: string;
  path: string;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeWorkspaceConfig(config: WorkspaceConfig): WorkspaceConfig {
  return {
    workspaceName: config.workspaceName,
    contentRoot: path.resolve(config.contentRoot),
    hotspotRoot: path.resolve(config.hotspotRoot),
    scratchRoot: path.resolve(config.scratchRoot)
  };
}

export async function loadWorkspaceConfig(configPath: string): Promise<WorkspaceConfig> {
  const raw = await readFile(configPath, "utf8");
  const parsed = WorkspaceConfigSchema.parse(JSON.parse(raw));
  return normalizeWorkspaceConfig(parsed);
}

export async function listSources(config: WorkspaceConfig): Promise<Source[]> {
  const registryPath = path.join(config.hotspotRoot, "信源.yaml");
  if (!(await exists(registryPath))) {
    return [];
  }

  const raw = await readFile(registryPath, "utf8");
  const parsed = YAML.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return z.array(SourceSchema).parse(parsed);
}

export async function listCandidates(config: WorkspaceConfig): Promise<Candidate[]> {
  const candidatesPath = path.join(config.scratchRoot, "candidates", "latest.json");
  if (!(await exists(candidatesPath))) {
    return [];
  }

  const raw = await readFile(candidatesPath, "utf8");
  const parsed = JSON.parse(raw);
  const candidates = Array.isArray(parsed) ? parsed : parsed.candidates;
  if (!Array.isArray(candidates)) {
    return [];
  }

  return z.array(CandidateSchema).parse(candidates);
}

export async function listFinalHtmlArtifacts(
  config: WorkspaceConfig,
  date: string
): Promise<RenderArtifact[]> {
  const artifactDir = path.join(config.hotspotRoot, date, "_成品文章-cooper-md黑色");
  if (!(await exists(artifactDir))) {
    return [];
  }

  const entries = await readdir(artifactDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .filter((entry) => entry.name.startsWith(`${date}-`))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const title = entry.name.replace(`${date}-`, "").replace(/\.html$/i, "");
      return {
        id: `${date}/${entry.name}`,
        date,
        title,
        fileName: entry.name,
        path: path.join(artifactDir, entry.name)
      };
    });
}

