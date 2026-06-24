import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TopicPackage } from "@hotloop/workspace";

export interface EvidenceSourceSnapshot {
  id: string;
  url: string;
  title: string;
  capturedAt: string;
  evidenceLevel: "L1" | "L2" | "L3" | string;
  summary: string;
  rawText?: string;
}

export interface WriteEvidencePackInput {
  sources: EvidenceSourceSnapshot[];
  publicAnalysis: string;
}

export interface EvidencePackResult {
  evidencePackPath: string;
  publicAnalysisPath: string;
  sourceSnapshotPaths: string[];
}

export async function writeEvidencePack(
  topic: TopicPackage,
  input: WriteEvidencePackInput
): Promise<EvidencePackResult> {
  const evidenceDir = path.join(topic.topicPath, "参考资料");
  const analysisDir = path.join(topic.topicPath, "skill创作");
  await mkdir(evidenceDir, { recursive: true });
  await mkdir(analysisDir, { recursive: true });

  const sourceSnapshotPaths: string[] = [];
  for (const source of input.sources) {
    const snapshotPath = path.join(evidenceDir, `${sanitizeFileName(source.id)}.json`);
    await writeJson(snapshotPath, source);
    sourceSnapshotPaths.push(snapshotPath);
  }

  const evidencePackPath = path.join(evidenceDir, "evidence-pack.json");
  await writeJson(evidencePackPath, {
    topic: {
      date: topic.date,
      slug: topic.slug,
      candidateId: topic.candidate.id
    },
    sources: input.sources
  });

  const publicAnalysisPath = path.join(analysisDir, "_公共分析.md");
  await writeFile(publicAnalysisPath, `${input.publicAnalysis.trim()}\n`, "utf8");

  return {
    evidencePackPath,
    publicAnalysisPath,
    sourceSnapshotPaths
  };
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}
