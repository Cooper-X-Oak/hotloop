import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { recordTopicOutcome, summarizeSourcePerformance } from "./index.js";

async function createFeedbackRoot() {
  return mkdtemp(path.join(tmpdir(), "hotloop-feedback-"));
}

describe("feedback and learning", () => {
  it("records topic outcomes as jsonl", async () => {
    const feedbackRoot = await createFeedbackRoot();

    await recordTopicOutcome(feedbackRoot, {
      topicId: "topic-1",
      source: "sopilot-x",
      lane: "P0",
      publishedAt: "2026-06-24T12:00:00+08:00",
      metrics: {
        views: 1000,
        likes: 20,
        shares: 5
      }
    });

    const raw = await readFile(path.join(feedbackRoot, "topic-outcomes.jsonl"), "utf8");
    expect(raw).toContain("topic-1");
    expect(raw).toContain("sopilot-x");
  });

  it("summarizes source performance", async () => {
    const feedbackRoot = await createFeedbackRoot();
    await recordTopicOutcome(feedbackRoot, {
      topicId: "topic-1",
      source: "sopilot-x",
      lane: "P0",
      metrics: { views: 1000, likes: 20, shares: 5 }
    });
    await recordTopicOutcome(feedbackRoot, {
      topicId: "topic-2",
      source: "sopilot-x",
      lane: "P0",
      metrics: { views: 3000, likes: 60, shares: 15 }
    });
    await recordTopicOutcome(feedbackRoot, {
      topicId: "topic-3",
      source: "hn",
      lane: "P2",
      metrics: { views: 500, likes: 5, shares: 1 }
    });

    const summary = await summarizeSourcePerformance(feedbackRoot);

    expect(summary).toEqual([
      {
        source: "sopilot-x",
        count: 2,
        averageViews: 2000,
        averageLikes: 40,
        averageShares: 10
      },
      {
        source: "hn",
        count: 1,
        averageViews: 500,
        averageLikes: 5,
        averageShares: 1
      }
    ]);
  });
});

