import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface TopicOutcome {
  topicId: string;
  source: string;
  lane: string;
  publishedAt?: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
  };
}

export interface SourcePerformance {
  source: string;
  count: number;
  averageViews: number;
  averageLikes: number;
  averageShares: number;
}

function outcomesPath(feedbackRoot: string): string {
  return path.join(feedbackRoot, "topic-outcomes.jsonl");
}

export async function recordTopicOutcome(
  feedbackRoot: string,
  outcome: TopicOutcome
): Promise<void> {
  await mkdir(feedbackRoot, { recursive: true });
  const record = {
    recordedAt: new Date().toISOString(),
    ...outcome
  };
  await appendFile(outcomesPath(feedbackRoot), `${JSON.stringify(record)}\n`, "utf8");
}

export async function summarizeSourcePerformance(
  feedbackRoot: string
): Promise<SourcePerformance[]> {
  const outcomes = await readOutcomes(feedbackRoot);
  const grouped = new Map<string, TopicOutcome[]>();

  for (const outcome of outcomes) {
    const list = grouped.get(outcome.source) ?? [];
    list.push(outcome);
    grouped.set(outcome.source, list);
  }

  return [...grouped.entries()]
    .map(([source, list]) => ({
      source,
      count: list.length,
      averageViews: average(list.map((item) => item.metrics.views)),
      averageLikes: average(list.map((item) => item.metrics.likes)),
      averageShares: average(list.map((item) => item.metrics.shares))
    }))
    .sort((a, b) => b.averageViews - a.averageViews || a.source.localeCompare(b.source));
}

async function readOutcomes(feedbackRoot: string): Promise<TopicOutcome[]> {
  try {
    const raw = await readFile(outcomesPath(feedbackRoot), "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as TopicOutcome);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

