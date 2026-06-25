import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  answerHumanDecision,
  appendAgentEvent,
  appendAgentMessage,
  createAgentSession,
  createAgentLoopRun,
  enqueueAgentCommand,
  getAgentSession,
  getAgentLoopRun,
  listAgentLoopRuns,
  listAgentTurns,
  listAgentCommands,
  listAgentDecisions,
  listAgentEvents,
  listAgentMessages,
  listAgentSessions,
  listToolInvocations,
  nodeLocalCliRunner,
  openHumanDecision,
  recordToolInvocation,
  runAgentLoopTurn,
  runLocalCliAgentCommand
} from "./index.js";

async function createSessionsRoot() {
  return mkdtemp(path.join(tmpdir(), "hotloop-agent-sessions-"));
}

describe("agent session store", () => {
  it("provides a real local CLI runner that executes a process with stdin", async () => {
    const result = await nodeLocalCliRunner({
      executable: process.execPath,
      args: ["-e", "process.stdin.pipe(process.stdout)"],
      cwd: process.cwd(),
      stdin: "hotloop cli bridge"
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("hotloop cli bridge");
    expect(result.stderr).toBe("");
  });

  it("creates a durable agent session with adapter selection metadata", async () => {
    const sessionsRoot = await createSessionsRoot();

    const session = await createAgentSession(sessionsRoot, {
      id: "agent-1",
      workspaceRoot: "D:/workspace",
      activeRunId: "run-1",
      agentAdapter: "local-cli:codex",
      cliAdapterPriority: ["local-cli:codex"],
      cliUnavailableReason: null,
      loadedHarness: ["AGENTS.md", "loops/hotspot-writing-loop.yaml"]
    });

    const stored = await getAgentSession(sessionsRoot, "agent-1");
    const sessions = await listAgentSessions(sessionsRoot);
    const sessionJson = await readFile(path.join(sessionsRoot, "agent-1", "session.json"), "utf8");
    const messages = await readFile(path.join(sessionsRoot, "agent-1", "messages.jsonl"), "utf8");

    expect(session.status).toBe("idle");
    expect(stored.agentAdapter).toBe("local-cli:codex");
    expect(stored.cliUnavailableReason).toBeNull();
    expect(sessions.map((item) => item.id)).toEqual(["agent-1"]);
    expect(sessionJson).toContain("cliAdapterPriority");
    expect(messages).toBe("");
  });

  it("persists messages, commands, events, decisions, and tool invocations", async () => {
    const sessionsRoot = await createSessionsRoot();
    await createAgentSession(sessionsRoot, {
      id: "agent-2",
      workspaceRoot: "D:/workspace",
      agentAdapter: "local-cli:codex",
      cliAdapterPriority: ["local-cli:codex"],
      cliUnavailableReason: null,
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

  it("runs a queued command through a local CLI bridge with harness context and logs", async () => {
    const sessionsRoot = await createSessionsRoot();
    await createAgentSession(sessionsRoot, {
      id: "agent-cli",
      workspaceRoot: "D:/workspace",
      agentAdapter: "local-cli:codex",
      cliAdapterPriority: ["local-cli:codex"],
      cliUnavailableReason: null,
      loadedHarness: ["AGENTS.md", "loops/hotspot-writing-loop.yaml"]
    });
    await appendAgentMessage(sessionsRoot, "agent-cli", {
      id: "msg-cli",
      role: "human",
      content: "跑近 6h AI 热点。"
    });
    await enqueueAgentCommand(sessionsRoot, "agent-cli", {
      id: "cmd-cli",
      type: "run_loop",
      payload: { freshnessWindowHours: 6 }
    });

    const result = await runLocalCliAgentCommand(sessionsRoot, "agent-cli", "cmd-cli", {
      executable: "codex",
      args: ["exec", "--json"],
      cwd: "D:/workspace",
      runner: async (input) => {
        expect(input.executable).toBe("codex");
        expect(input.args).toEqual(["exec", "--json"]);
        expect(input.cwd).toBe("D:/workspace");
        expect(input.stdin).toContain("harness-context.json");
        expect(input.stdin).toContain("cmd-cli");
        return {
          exitCode: 0,
          stdout: "agent completed scan",
          stderr: ""
        };
      }
    });

    const session = await getAgentSession(sessionsRoot, "agent-cli");
    const events = await listAgentEvents(sessionsRoot, "agent-cli");
    const harnessContext = await readFile(result.harnessContextPath, "utf8");
    const stdout = await readFile(result.stdoutPath, "utf8");
    const stderr = await readFile(result.stderrPath, "utf8");

    expect(result.exitCode).toBe(0);
    expect(session.status).toBe("succeeded");
    expect(harnessContext).toContain("local-cli:codex");
    expect(harnessContext).toContain("run_loop");
    expect(stdout).toBe("agent completed scan");
    expect(stderr).toBe("");
    expect(events.map((event) => event.type)).toEqual([
      "adapter_selected",
      "harness_context_written",
      "local_cli_started",
      "local_cli_completed"
    ]);
  });

  it("records local CLI unavailability without switching to API execution", async () => {
    const sessionsRoot = await createSessionsRoot();
    await createAgentSession(sessionsRoot, {
      id: "agent-cli-missing",
      workspaceRoot: "D:/workspace",
      agentAdapter: "local-cli:codex",
      cliAdapterPriority: ["local-cli:codex"],
      cliUnavailableReason: null,
      loadedHarness: ["AGENTS.md"]
    });
    await enqueueAgentCommand(sessionsRoot, "agent-cli-missing", {
      id: "cmd-missing",
      type: "run_loop",
      payload: { freshnessWindowHours: 6 }
    });

    const result = await runLocalCliAgentCommand(
      sessionsRoot,
      "agent-cli-missing",
      "cmd-missing",
      {
        executable: "codex",
        args: ["exec"],
        cwd: "D:/workspace",
        runner: async () => {
          throw Object.assign(new Error("spawn codex ENOENT"), { code: "ENOENT" });
        }
      }
    );

    const session = await getAgentSession(sessionsRoot, "agent-cli-missing");
    const events = await listAgentEvents(sessionsRoot, "agent-cli-missing");

    expect(result.exitCode).toBeNull();
    expect(session.status).toBe("failed");
    expect(session.agentAdapter).toBe("local-cli:codex");
    expect(session.cliUnavailableReason).toContain("spawn codex ENOENT");
    expect(events.map((event) => event.type)).toContain("local_cli_unavailable");
    expect(events.map((event) => event.type)).not.toContain("api_fallback_selected");
  });

  it("runs an agent loop turn and ingests CLI stdout into transcript and loop state", async () => {
    const sessionsRoot = await createSessionsRoot();
    await createAgentSession(sessionsRoot, {
      id: "agent-loop",
      workspaceRoot: "D:/workspace",
      agentAdapter: "local-cli:codex",
      cliAdapterPriority: ["local-cli:codex"],
      cliUnavailableReason: null,
      loadedHarness: ["AGENTS.md", "loops/hotspot-writing-loop.yaml"]
    });
    await appendAgentMessage(sessionsRoot, "agent-loop", {
      id: "msg-loop",
      role: "human",
      content: "跑近 6h AI 热点。"
    });
    await enqueueAgentCommand(sessionsRoot, "agent-loop", {
      id: "cmd-loop",
      type: "run_loop",
      payload: { instruction: "跑近 6h AI 热点。" }
    });

    const loop = await createAgentLoopRun(sessionsRoot, "agent-loop", {
      id: "loop-1",
      loopDefinition: "loops/hotspot-writing-loop.yaml",
      currentStep: "load_harness",
      currentTask: "准备上下文",
      progress: {
        completedSteps: [],
        activeStep: "load_harness",
        pendingSteps: ["scan_sources", "classify_candidates"]
      }
    });
    const result = await runAgentLoopTurn(sessionsRoot, "agent-loop", "loop-1", "cmd-loop", {
      executable: "codex",
      args: ["exec"],
      cwd: "D:/workspace",
      runner: async () => ({
        exitCode: 0,
        stdout: [
          JSON.stringify({ type: "agent_message", content: "收到，我正在扫描 P0 X 起爆贴。" }),
          JSON.stringify({
            type: "status",
            currentStep: "scan_sources",
            currentTask: "collect_p0_x_posts"
          })
        ].join("\n"),
        stderr: ""
      })
    });

    const loops = await listAgentLoopRuns(sessionsRoot, "agent-loop");
    const updatedLoop = await getAgentLoopRun(sessionsRoot, "agent-loop", "loop-1");
    const turns = await listAgentTurns(sessionsRoot, "agent-loop", "loop-1");
    const messages = await listAgentMessages(sessionsRoot, "agent-loop");
    const events = await listAgentEvents(sessionsRoot, "agent-loop");
    const heartbeat = await readFile(
      path.join(sessionsRoot, "agent-loop", "loop-runs", "loop-1", "heartbeat.json"),
      "utf8"
    );

    expect(loop.status).toBe("queued");
    expect(result.loop.status).toBe("running");
    expect(loops.map((item) => item.id)).toEqual(["loop-1"]);
    expect(updatedLoop.currentStep).toBe("scan_sources");
    expect(updatedLoop.currentTask).toBe("collect_p0_x_posts");
    expect(turns).toHaveLength(1);
    expect(turns[0]).toMatchObject({ status: "succeeded", commandId: "cmd-loop" });
    expect(messages.at(-1)).toMatchObject({
      role: "agent",
      content: "收到，我正在扫描 P0 X 起爆贴。"
    });
    expect(events.map((event) => event.type)).toContain("agent_message_appended");
    expect(heartbeat).toContain("loop-1");
  });
});
