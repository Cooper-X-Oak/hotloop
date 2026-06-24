import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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

export interface ArtifactValidation {
  valid: boolean;
  violations: string[];
}

export interface TopicPackage {
  date: string;
  slug: string;
  topicPath: string;
  candidate: Candidate;
}

export interface ArticlePackage {
  group: string;
  articlePath: string;
  imagePlanPath: string;
  processPath: string;
  imageDir: string;
}

export interface TopicStatus extends TopicPackage {
  hasEvidencePack: boolean;
  articlePackage: ArticlePackage | null;
  hasArticleDraft: boolean;
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

export async function validateFinalArtifactDirectory(
  config: WorkspaceConfig,
  date: string
): Promise<ArtifactValidation> {
  const artifactDir = path.join(config.hotspotRoot, date, "_成品文章-cooper-md黑色");
  if (!(await exists(artifactDir))) {
    return {
      valid: false,
      violations: ["Missing final artifact directory"]
    };
  }

  const entries = await readdir(artifactDir, { withFileTypes: true });
  const violations: string[] = [];

  const sortedEntries = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sortedEntries) {
    if (entry.isDirectory()) {
      violations.push(`Unexpected directory: ${entry.name}`);
      continue;
    }
    if (!entry.isFile()) {
      violations.push(`Unexpected entry: ${entry.name}`);
      continue;
    }
    if (!entry.name.endsWith(".html") || !entry.name.startsWith(`${date}-`)) {
      violations.push(`Unexpected file: ${entry.name}`);
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

export async function createTopicPackage(
  config: WorkspaceConfig,
  input: { date: string; slug: string; candidate: Candidate }
): Promise<TopicPackage> {
  const topicPath = path.join(config.hotspotRoot, input.date, input.slug);
  await mkdir(path.join(topicPath, "参考资料"), { recursive: true });
  await mkdir(path.join(topicPath, "skill创作"), { recursive: true });
  await mkdir(path.join(topicPath, "技能组成稿"), { recursive: true });

  const topic: TopicPackage = {
    date: input.date,
    slug: input.slug,
    topicPath,
    candidate: input.candidate
  };
  await writeJson(path.join(topicPath, "topic.json"), topic);
  return topic;
}

export async function createArticlePackage(
  _config: WorkspaceConfig,
  topic: TopicPackage,
  options: { group: string }
): Promise<ArticlePackage> {
  const groupDir = path.join(topic.topicPath, "技能组成稿", options.group);
  const imageDir = path.join(groupDir, "配图");
  await mkdir(imageDir, { recursive: true });

  const articlePackage: ArticlePackage = {
    group: options.group,
    articlePath: path.join(groupDir, "文章.md"),
    imagePlanPath: path.join(groupDir, "配图方案.md"),
    processPath: path.join(groupDir, "过程.md"),
    imageDir
  };

  await writeFile(
    articlePackage.articlePath,
    `# ${topic.candidate.title}\n\n> Draft placeholder. Replace through the writing loop.\n`,
    "utf8"
  );
  await writeFile(articlePackage.imagePlanPath, "# 配图方案\n\n", "utf8");
  await writeFile(articlePackage.processPath, "# 过程\n\n", "utf8");
  await writeJson(path.join(groupDir, "article-package.json"), articlePackage);

  return articlePackage;
}

export async function getTopicPackage(
  config: WorkspaceConfig,
  date: string,
  slug: string
): Promise<TopicStatus> {
  const topicPath = path.join(config.hotspotRoot, date, slug);
  const raw = await readFile(path.join(topicPath, "topic.json"), "utf8");
  const topic = JSON.parse(raw) as TopicPackage;
  const evidencePath = path.join(topicPath, "skill创作", "_公共分析.md");
  const articlePackage = await findArticlePackage(topicPath);

  return {
    ...topic,
    hasEvidencePack: await exists(evidencePath),
    articlePackage,
    hasArticleDraft: articlePackage ? await exists(articlePackage.articlePath) : false
  };
}

async function findArticlePackage(topicPath: string): Promise<ArticlePackage | null> {
  const draftsRoot = path.join(topicPath, "技能组成稿");
  if (!(await exists(draftsRoot))) return null;

  const groups = await readdir(draftsRoot, { withFileTypes: true });
  for (const group of groups.filter((entry) => entry.isDirectory())) {
    const packagePath = path.join(draftsRoot, group.name, "article-package.json");
    if (await exists(packagePath)) {
      const raw = await readFile(packagePath, "utf8");
      return JSON.parse(raw) as ArticlePackage;
    }
  }
  return null;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
