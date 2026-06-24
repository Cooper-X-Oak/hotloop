import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  answerHumanDecision,
  appendAgentEvent,
  appendAgentMessage,
  createAgentSession,
  enqueueAgentCommand,
  getAgentSession,
  listAgentCommands,
  listAgentDecisions,
  listAgentEvents,
  listAgentMessages,
  listAgentSessions,
  listToolInvocations,
  openHumanDecision,
  recordToolInvocation
} from "./index.js";

async function createSessionsRoot() {
  return mkdtemp(path.join(tmpdir(), "hotloop-agent-sessions-"));
}

describe("agent session store", () => {
  it("creates a durable agent session with adapter selection metadata", async () => {
    const sessionsRoot = await createSessionsRoot();

    const session = await createAgentSession(sessionsRoot, {
      id: "agent-1",
      workspaceRoot: "D:/workspace",
      activeRunId: "run-1",
      agentAdapter: "local-cli:codex",
      adapterPriority: ["local-cli:codex", "api-fallback"],
      fallbackReason: null,
      loadedHarness: ["AGENTS.md", "loops/hotspot-writing-loop.yaml"]
    });

    const stored = await getAgentSession(sessionsRoot, "agent-1");
    const sessions = await listAgentSessions(sessionsRoot);
    const sessionJson = await readFile(path.join(sessionsRoot, "agent-1", "session.json"), "utf8");
    const messages = await readFile(path.join(sessionsRoot, "agent-1", "messages.jsonl"), "utf8");

    expect(session.status).toBe("idle");
    expect(stored.agentAdapter).toBe("local-cli:codex");
    expect(stored.fallbackReason).toBeNull();
    expect(sessions.map((item) => item.id)).toEqual(["agent-1"]);
    expect(sessionJson).toContain("adapterPriority");
    expect(messages).toBe("");
  });

  it("persists messages, commands, events, decisions, and tool invocations", async () => {
    const sessionsRoot = await createSessionsRoot();
    await createAgentSession(sessionsRoot, {
      id: "agent-2",
      workspaceRoot: "D:/workspace",
      agentAdapter: "local-cli:codex",
      adapterPriority: ["local-cli:codex", "api-fallback"],
      fallbackReason: null,
      loadedHarness: []
    });

    await appendAgentMessage(sessionsRoot, "agent-2", {
      id: "msg-1",
      role: "human",
      content: "跑近 6h AI 热点。"
    });
    await enqueueAgentCommand(sessionsRoot, "agent-2", {
      id: "cmd-1",
      type: "run_loop",
      payload: { freshnessWindowHours: 6 }
    });
    await appendAgentEvent(sessionsRoot, "agent-2", {
      type: "adapter_selected",
      message: "Using local CLI agent",
      data: { adapter: "local-cli:codex" }
    });
    await recordToolInvocation(sessionsRoot, "agent-2", {
      id: "tool-1",
      runId: "run-1",
      tool: "radar.scan",
      status: "succeeded",
      inputRef: "checkpoints/tool-1-input.json",
      outputRef: "checkpoints/tool-1-output.json",
      startedAt: "2026-06-24T10:00:00+08:00",
      endedAt: "2026-06-24T10:00:10+08:00"
    });
    await openHumanDecision(sessionsRoot, "agent-2", {
      id: "decision-1",
      runId: "run-1",
      question: "先写哪个 P0？",
      recommendedAnswer: "先写 Uzi。",
      options: ["write_uzi_first", "merge_both"]
    });
    await answerHumanDecision(sessionsRoot, "agent-2", "decision-1", {
      answer: "write_uzi_first"
    });

    const messages = await listAgentMessages(sessionsRoot, "agent-2");
    const commands = await listAgentCommands(sessionsRoot, "agent-2");
    const events = await listAgentEvents(sessionsRoot, "agent-2");
    const tools = await listToolInvocations(sessionsRoot, "agent-2");
    const decisions = await listAgentDecisions(sessionsRoot, "agent-2");

    expect(messages[0]).toMatchObject({ role: "human", content: "跑近 6h AI 热点。" });
    expect(commands[0]).toMatchObject({ status: "queued", type: "run_loop" });
    expect(events[0]).toMatchObject({ type: "adapter_selected" });
    expect(tools[0]).toMatchObject({ tool: "radar.scan", status: "succeeded" });
    expect(decisions[0]).toMatchObject({
      id: "decision-1",
      status: "answered",
      answer: "write_uzi_first"
    });
  });
});
