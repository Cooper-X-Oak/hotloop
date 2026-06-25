import { spawn } from "node:child_process";
import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type AgentSessionStatus =
  | "idle"
  | "running"
  | "waiting_for_user"
  | "waiting_for_tool"
  | "succeeded"
  | "failed"
  | "cancelled";

export type AgentAdapter = `local-cli:${string}` | "manual-agent";

export interface AgentSession {
  id: string;
  status: AgentSessionStatus;
  workspaceRoot: string;
  activeRunId?: string;
  agentAdapter: AgentAdapter;
  cliAdapterPriority: AgentAdapter[];
  cliUnavailableReason: string | null;
  loadedHarness: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentSessionInput {
  id: string;
  workspaceRoot: string;
  activeRunId?: string;
  agentAdapter: AgentAdapter;
  cliAdapterPriority: AgentAdapter[];
  cliUnavailableReason: string | null;
  loadedHarness: string[];
}

export type AgentMessageRole = "human" | "agent" | "system" | "tool";

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: AgentMessageRole;
  content: string;
  createdAt: string;
}

export interface AgentCommand {
  id: string;
  sessionId: string;
  type: string;
  payload: unknown;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  createdAt: string;
}

export interface AgentEvent {
  ts: string;
  type: string;
  message?: string;
  data?: unknown;
}

export interface ToolInvocation {
  id: string;
  sessionId: string;
  runId?: string;
  tool: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  inputRef?: string;
  outputRef?: string;
  startedAt?: string;
  endedAt?: string;
  error?: string;
}

export interface HumanDecision {
  id: string;
  sessionId: string;
  runId?: string;
  question: string;
  recommendedAnswer?: string;
  options: string[];
  status: "open" | "answered" | "dismissed";
  answer?: string;
  createdAt: string;
  answeredAt?: string;
}

export interface OpenHumanDecisionInput {
  id: string;
  runId?: string;
  question: string;
  recommendedAnswer?: string;
  options: string[];
}

export interface LocalCliRunnerInput {
  executable: string;
  args: string[];
  cwd: string;
  stdin: string;
}

export interface LocalCliRunnerResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type LocalCliRunner = (input: LocalCliRunnerInput) => Promise<LocalCliRunnerResult>;

export interface RunLocalCliAgentCommandInput {
  executable: string;
  args?: string[];
  cwd: string;
  runner: LocalCliRunner;
}

export interface RunLocalCliAgentCommandResult {
  session: AgentSession;
  command: AgentCommand;
  harnessContextPath: string;
  stdoutPath: string;
  stderrPath: string;
  exitCode: number | null;
}

export type AgentLoopRunStatus =
  | "queued"
  | "running"
  | "waiting_for_user"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface AgentLoopProgress {
  completedSteps: string[];
  activeStep: string;
  pendingSteps: string[];
}

export interface AgentLoopRun {
  id: string;
  sessionId: string;
  loopDefinition: string;
  status: AgentLoopRunStatus;
  currentStep: string;
  currentTask: string;
  startedAt: string;
  updatedAt: string;
  lastHeartbeatAt: string | null;
  progress: AgentLoopProgress;
}

export interface CreateAgentLoopRunInput {
  id: string;
  loopDefinition: string;
  currentStep: string;
  currentTask: string;
  progress: AgentLoopProgress;
}

export interface AgentTurn {
  id: string;
  sessionId: string;
  loopRunId: string;
  commandId: string;
  status: "running" | "succeeded" | "failed";
  inputRef: string;
  stdoutRef: string;
  stderrRef: string;
  createdAt: string;
  completedAt?: string;
}

export interface RunAgentLoopTurnResult {
  loop: AgentLoopRun;
  turn: AgentTurn;
  ingestionPath: string;
}

export interface OutputIngestionResult {
  messages: AgentMessage[];
  events: AgentEvent[];
  decisions: HumanDecision[];
  toolInvocations: ToolInvocation[];
  loopUpdate?: Partial<Pick<AgentLoopRun, "status" | "currentStep" | "currentTask">>;
}

export const nodeLocalCliRunner: LocalCliRunner = async (input) =>
  new Promise((resolve, reject) => {
    const child = spawn(input.executable, input.args, {
      cwd: input.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8")
      });
    });
    child.stdin.end(input.stdin);
  });

function sessionDir(sessionsRoot: string, sessionId: string): string {
  return path.join(sessionsRoot, sessionId);
}

function sessionJsonPath(sessionsRoot: string, sessionId: string): string {
  return path.join(sessionDir(sessionsRoot, sessionId), "session.json");
}

function jsonlPath(sessionsRoot: string, sessionId: string, fileName: string): string {
  return path.join(sessionDir(sessionsRoot, sessionId), fileName);
}

function checkpointPath(sessionsRoot: string, sessionId: string, checkpointId: string): string {
  return path.join(sessionDir(sessionsRoot, sessionId), "checkpoints", checkpointId);
}

function logPath(sessionsRoot: string, sessionId: string, fileName: string): string {
  return path.join(sessionDir(sessionsRoot, sessionId), "logs", fileName);
}

function loopRunsDir(sessionsRoot: string, sessionId: string): string {
  return path.join(sessionDir(sessionsRoot, sessionId), "loop-runs");
}

function loopRunDir(sessionsRoot: string, sessionId: string, loopRunId: string): string {
  return path.join(loopRunsDir(sessionsRoot, sessionId), loopRunId);
}

function loopStatePath(sessionsRoot: string, sessionId: string, loopRunId: string): string {
  return path.join(loopRunDir(sessionsRoot, sessionId, loopRunId), "loop-state.json");
}

function loopTurnsPath(sessionsRoot: string, sessionId: string, loopRunId: string): string {
  return path.join(loopRunDir(sessionsRoot, sessionId, loopRunId), "turns.jsonl");
}

function loopHeartbeatPath(sessionsRoot: string, sessionId: string, loopRunId: string): string {
  return path.join(loopRunDir(sessionsRoot, sessionId, loopRunId), "heartbeat.json");
}

function loopCheckpointPath(
  sessionsRoot: string,
  sessionId: string,
  loopRunId: string,
  fileName: string
): string {
  return path.join(loopRunDir(sessionsRoot, sessionId, loopRunId), "checkpoints", fileName);
}

function loopLogPath(
  sessionsRoot: string,
  sessionId: string,
  loopRunId: string,
  fileName: string
): string {
  return path.join(loopRunDir(sessionsRoot, sessionId, loopRunId), "logs", fileName);
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function appendJsonLine(filePath: string, value: unknown): Promise<void> {
  await appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

async function readJsonLines<T>(filePath: string): Promise<T[]> {
  const raw = await readFile(filePath, "utf8");
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T);
}

async function readDirIfExists(dirPath: string) {
  try {
    return await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

export async function createAgentSession(
  sessionsRoot: string,
  input: CreateAgentSessionInput
): Promise<AgentSession> {
  const now = new Date().toISOString();
  const dir = sessionDir(sessionsRoot, input.id);
  await mkdir(path.join(dir, "checkpoints"), { recursive: true });
  await mkdir(path.join(dir, "logs"), { recursive: true });

  const session: AgentSession = {
    ...input,
    status: "idle",
    createdAt: now,
    updatedAt: now
  };

  await writeJson(sessionJsonPath(sessionsRoot, input.id), session);
  await writeFile(jsonlPath(sessionsRoot, input.id, "messages.jsonl"), "", "utf8");
  await writeFile(jsonlPath(sessionsRoot, input.id, "commands.jsonl"), "", "utf8");
  await writeFile(jsonlPath(sessionsRoot, input.id, "events.jsonl"), "", "utf8");
  await writeFile(jsonlPath(sessionsRoot, input.id, "decisions.jsonl"), "", "utf8");
  await writeFile(jsonlPath(sessionsRoot, input.id, "tool-invocations.jsonl"), "", "utf8");

  return session;
}

export async function getAgentSession(
  sessionsRoot: string,
  sessionId: string
): Promise<AgentSession> {
  const raw = await readFile(sessionJsonPath(sessionsRoot, sessionId), "utf8");
  return JSON.parse(raw) as AgentSession;
}

export async function listAgentSessions(sessionsRoot: string): Promise<AgentSession[]> {
  const entries = await readDirIfExists(sessionsRoot);
  const sessions = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => getAgentSession(sessionsRoot, entry.name))
  );

  return sessions.sort((a, b) => {
    const byCreated = b.createdAt.localeCompare(a.createdAt);
    if (byCreated !== 0) return byCreated;
    return b.id.localeCompare(a.id);
  });
}

async function updateAgentSession(
  sessionsRoot: string,
  sessionId: string,
  update: Partial<Pick<AgentSession, "status" | "cliUnavailableReason">>
): Promise<AgentSession> {
  const current = await getAgentSession(sessionsRoot, sessionId);
  const next: AgentSession = {
    ...current,
    ...update,
    updatedAt: new Date().toISOString()
  };
  await writeJson(sessionJsonPath(sessionsRoot, sessionId), next);
  return next;
}

export async function updateAgentSessionStatus(
  sessionsRoot: string,
  sessionId: string,
  status: AgentSessionStatus
): Promise<AgentSession> {
  return updateAgentSession(sessionsRoot, sessionId, { status });
}

export async function appendAgentMessage(
  sessionsRoot: string,
  sessionId: string,
  input: Pick<AgentMessage, "id" | "role" | "content">
): Promise<AgentMessage> {
  const message: AgentMessage = {
    ...input,
    sessionId,
    createdAt: new Date().toISOString()
  };
  await appendJsonLine(jsonlPath(sessionsRoot, sessionId, "messages.jsonl"), message);
  return message;
}

export async function listAgentMessages(
  sessionsRoot: string,
  sessionId: string
): Promise<AgentMessage[]> {
  return readJsonLines(jsonlPath(sessionsRoot, sessionId, "messages.jsonl"));
}

export async function enqueueAgentCommand(
  sessionsRoot: string,
  sessionId: string,
  input: Pick<AgentCommand, "id" | "type" | "payload">
): Promise<AgentCommand> {
  const command: AgentCommand = {
    ...input,
    sessionId,
    status: "queued",
    createdAt: new Date().toISOString()
  };
  await appendJsonLine(jsonlPath(sessionsRoot, sessionId, "commands.jsonl"), command);
  return command;
}

export async function listAgentCommands(
  sessionsRoot: string,
  sessionId: string
): Promise<AgentCommand[]> {
  return readJsonLines(jsonlPath(sessionsRoot, sessionId, "commands.jsonl"));
}

export async function appendAgentEvent(
  sessionsRoot: string,
  sessionId: string,
  input: Omit<AgentEvent, "ts">
): Promise<AgentEvent> {
  const event: AgentEvent = {
    ts: new Date().toISOString(),
    ...input
  };
  await appendJsonLine(jsonlPath(sessionsRoot, sessionId, "events.jsonl"), event);
  return event;
}

export async function listAgentEvents(
  sessionsRoot: string,
  sessionId: string
): Promise<AgentEvent[]> {
  return readJsonLines(jsonlPath(sessionsRoot, sessionId, "events.jsonl"));
}

export async function recordToolInvocation(
  sessionsRoot: string,
  sessionId: string,
  input: Omit<ToolInvocation, "sessionId">
): Promise<ToolInvocation> {
  const invocation: ToolInvocation = {
    ...input,
    sessionId
  };
  await appendJsonLine(jsonlPath(sessionsRoot, sessionId, "tool-invocations.jsonl"), invocation);
  return invocation;
}

export async function listToolInvocations(
  sessionsRoot: string,
  sessionId: string
): Promise<ToolInvocation[]> {
  return readJsonLines(jsonlPath(sessionsRoot, sessionId, "tool-invocations.jsonl"));
}

export async function openHumanDecision(
  sessionsRoot: string,
  sessionId: string,
  input: OpenHumanDecisionInput
): Promise<HumanDecision> {
  const decision: HumanDecision = {
    ...input,
    sessionId,
    status: "open",
    createdAt: new Date().toISOString()
  };
  await appendJsonLine(jsonlPath(sessionsRoot, sessionId, "decisions.jsonl"), decision);
  return decision;
}

export async function answerHumanDecision(
  sessionsRoot: string,
  sessionId: string,
  decisionId: string,
  input: { answer: string }
): Promise<HumanDecision> {
  const current = (await listAgentDecisions(sessionsRoot, sessionId)).find(
    (decision) => decision.id === decisionId
  );
  if (!current) {
    throw new Error(`Decision not found: ${decisionId}`);
  }
  const answered: HumanDecision = {
    ...current,
    status: "answered",
    answer: input.answer,
    answeredAt: new Date().toISOString()
  };
  await appendJsonLine(jsonlPath(sessionsRoot, sessionId, "decisions.jsonl"), answered);
  return answered;
}

export async function listAgentDecisions(
  sessionsRoot: string,
  sessionId: string
): Promise<HumanDecision[]> {
  const decisions = await readJsonLines<HumanDecision>(
    jsonlPath(sessionsRoot, sessionId, "decisions.jsonl")
  );
  return Array.from(new Map(decisions.map((decision) => [decision.id, decision])).values());
}

export async function createAgentLoopRun(
  sessionsRoot: string,
  sessionId: string,
  input: CreateAgentLoopRunInput
): Promise<AgentLoopRun> {
  const now = new Date().toISOString();
  const dir = loopRunDir(sessionsRoot, sessionId, input.id);
  await mkdir(path.join(dir, "checkpoints"), { recursive: true });
  await mkdir(path.join(dir, "logs"), { recursive: true });
  const loop: AgentLoopRun = {
    ...input,
    sessionId,
    status: "queued",
    startedAt: now,
    updatedAt: now,
    lastHeartbeatAt: null
  };
  await writeJson(loopStatePath(sessionsRoot, sessionId, input.id), loop);
  await writeFile(loopTurnsPath(sessionsRoot, sessionId, input.id), "", "utf8");
  await writeJson(loopHeartbeatPath(sessionsRoot, sessionId, input.id), {
    sessionId,
    loopRunId: input.id,
    lastHeartbeatAt: null
  });
  await appendAgentEvent(sessionsRoot, sessionId, {
    type: "loop_started",
    data: { loopRunId: input.id, loopDefinition: input.loopDefinition }
  });
  return loop;
}

export async function getAgentLoopRun(
  sessionsRoot: string,
  sessionId: string,
  loopRunId: string
): Promise<AgentLoopRun> {
  const raw = await readFile(loopStatePath(sessionsRoot, sessionId, loopRunId), "utf8");
  return JSON.parse(raw) as AgentLoopRun;
}

export async function listAgentLoopRuns(
  sessionsRoot: string,
  sessionId: string
): Promise<AgentLoopRun[]> {
  const root = loopRunsDir(sessionsRoot, sessionId);
  const entries = await readDirIfExists(root);
  const loops = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => getAgentLoopRun(sessionsRoot, sessionId, entry.name))
  );
  return loops.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

async function ingestAgentOutput(
  sessionsRoot: string,
  sessionId: string,
  loopRunId: string,
  stdout: string
): Promise<OutputIngestionResult> {
  const result: OutputIngestionResult = {
    messages: [],
    events: [],
    decisions: [],
    toolInvocations: []
  };
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    const event = await appendAgentEvent(sessionsRoot, sessionId, {
      type: "agent_output_empty",
      data: { loopRunId }
    });
    result.events.push(event);
    return result;
  }

  let parsedAny = false;
  for (const line of lines) {
    const record = parseJsonRecord(line);
    if (!record) continue;
    parsedAny = true;

    if (record.type === "agent_message" && typeof record.content === "string") {
      const message = await appendAgentMessage(sessionsRoot, sessionId, {
        id: `msg-agent-${Date.now()}-${result.messages.length}`,
        role: "agent",
        content: record.content
      });
      const event = await appendAgentEvent(sessionsRoot, sessionId, {
        type: "agent_message_appended",
        data: { loopRunId, messageId: message.id }
      });
      result.messages.push(message);
      result.events.push(event);
      continue;
    }

    if (record.type === "status") {
      const loopUpdate: Partial<Pick<AgentLoopRun, "status" | "currentStep" | "currentTask">> = {
        status: "running"
      };
      if (typeof record.currentStep === "string") loopUpdate.currentStep = record.currentStep;
      if (typeof record.currentTask === "string") loopUpdate.currentTask = record.currentTask;
      result.loopUpdate = { ...result.loopUpdate, ...loopUpdate };
      const event = await appendAgentEvent(sessionsRoot, sessionId, {
        type: "agent_status_reported",
        data: { loopRunId, ...loopUpdate }
      });
      result.events.push(event);
      continue;
    }

    if (record.type === "decision_request") {
      const decision = await openHumanDecision(sessionsRoot, sessionId, {
        id: typeof record.id === "string" ? record.id : `decision-${Date.now()}`,
        runId: loopRunId,
        question: typeof record.question === "string" ? record.question : "Agent requested a decision.",
        recommendedAnswer:
          typeof record.recommendedAnswer === "string" ? record.recommendedAnswer : undefined,
        options: Array.isArray(record.options)
          ? record.options.filter((option): option is string => typeof option === "string")
          : []
      });
      result.loopUpdate = { ...result.loopUpdate, status: "waiting_for_user" };
      result.decisions.push(decision);
      continue;
    }

    if (record.type === "tool_call" && typeof record.tool === "string") {
      const invocation = await recordToolInvocation(sessionsRoot, sessionId, {
        id: typeof record.id === "string" ? record.id : `tool-${Date.now()}`,
        runId: loopRunId,
        tool: record.tool,
        status: "queued",
        inputRef: typeof record.inputRef === "string" ? record.inputRef : undefined
      });
      const event = await appendAgentEvent(sessionsRoot, sessionId, {
        type: "tool_call_requested",
        data: { loopRunId, toolInvocationId: invocation.id, tool: invocation.tool }
      });
      result.toolInvocations.push(invocation);
      result.events.push(event);
      continue;
    }

    if (record.type === "loop_complete") {
      result.loopUpdate = { ...result.loopUpdate, status: "succeeded" };
      const event = await appendAgentEvent(sessionsRoot, sessionId, {
        type: "loop_complete",
        data: { loopRunId }
      });
      result.events.push(event);
      continue;
    }

    if (record.type === "loop_failed") {
      result.loopUpdate = { ...result.loopUpdate, status: "failed" };
      const event = await appendAgentEvent(sessionsRoot, sessionId, {
        type: "loop_failed",
        message: typeof record.message === "string" ? record.message : undefined,
        data: { loopRunId, record }
      });
      result.events.push(event);
      continue;
    }

    const event = await appendAgentEvent(sessionsRoot, sessionId, {
      type: "agent_output_record",
      data: { loopRunId, record }
    });
    result.events.push(event);
  }

  if (!parsedAny) {
    const message = await appendAgentMessage(sessionsRoot, sessionId, {
      id: `msg-agent-${Date.now()}`,
      role: "agent",
      content: stdout.trim()
    });
    const event = await appendAgentEvent(sessionsRoot, sessionId, {
      type: "agent_message_appended",
      data: { loopRunId, messageId: message.id }
    });
    result.messages.push(message);
    result.events.push(event);
  }

  return result;
}

function parseJsonRecord(line: string): (Record<string, unknown> & { type?: string }) | null {
  try {
    const value = JSON.parse(line) as unknown;
    if (typeof value === "object" && value !== null) {
      return value as Record<string, unknown> & { type?: string };
    }
  } catch {
    return null;
  }
  return null;
}

export async function listAgentTurns(
  sessionsRoot: string,
  sessionId: string,
  loopRunId: string
): Promise<AgentTurn[]> {
  return readJsonLines(loopTurnsPath(sessionsRoot, sessionId, loopRunId));
}

async function updateAgentLoopRun(
  sessionsRoot: string,
  sessionId: string,
  loopRunId: string,
  update: Partial<Pick<AgentLoopRun, "status" | "currentStep" | "currentTask" | "lastHeartbeatAt">>
): Promise<AgentLoopRun> {
  const current = await getAgentLoopRun(sessionsRoot, sessionId, loopRunId);
  const next: AgentLoopRun = {
    ...current,
    ...update,
    progress: {
      ...current.progress,
      activeStep: update.currentStep ?? current.progress.activeStep
    },
    updatedAt: new Date().toISOString()
  };
  await writeJson(loopStatePath(sessionsRoot, sessionId, loopRunId), next);
  return next;
}

export async function runAgentLoopTurn(
  sessionsRoot: string,
  sessionId: string,
  loopRunId: string,
  commandId: string,
  input: RunLocalCliAgentCommandInput
): Promise<RunAgentLoopTurnResult> {
  const session = await getAgentSession(sessionsRoot, sessionId);
  const loop = await getAgentLoopRun(sessionsRoot, sessionId, loopRunId);
  const command = (await listAgentCommands(sessionsRoot, sessionId)).find(
    (item) => item.id === commandId
  );
  if (!command) {
    throw new Error(`Agent command not found: ${commandId}`);
  }

  const now = new Date().toISOString();
  const turnId = `turn-${Date.now()}`;
  const inputRef = loopCheckpointPath(sessionsRoot, sessionId, loopRunId, `${turnId}-context.json`);
  const ingestionPath = loopCheckpointPath(
    sessionsRoot,
    sessionId,
    loopRunId,
    `${turnId}-ingestion.json`
  );
  const stdoutRef = loopLogPath(sessionsRoot, sessionId, loopRunId, `${turnId}.stdout.log`);
  const stderrRef = loopLogPath(sessionsRoot, sessionId, loopRunId, `${turnId}.stderr.log`);
  const heartbeat = {
    sessionId,
    loopRunId,
    lastHeartbeatAt: now,
    status: "running"
  };
  await writeJson(loopHeartbeatPath(sessionsRoot, sessionId, loopRunId), heartbeat);
  await updateAgentLoopRun(sessionsRoot, sessionId, loopRunId, {
    status: "running",
    lastHeartbeatAt: now
  });
  await appendAgentEvent(sessionsRoot, sessionId, {
    type: "heartbeat",
    data: heartbeat
  });

  const context = {
    session,
    loop,
    command,
    messages: await listAgentMessages(sessionsRoot, sessionId)
  };
  await writeJson(inputRef, context);

  const runnerResult = await input.runner({
    executable: input.executable,
    args: input.args ?? [],
    cwd: input.cwd,
    stdin: buildLocalCliPrompt(inputRef, command)
  });
  await writeFile(stdoutRef, runnerResult.stdout, "utf8");
  await writeFile(stderrRef, runnerResult.stderr, "utf8");

  const ingestion = await ingestAgentOutput(sessionsRoot, sessionId, loopRunId, runnerResult.stdout);
  await writeJson(ingestionPath, ingestion);

  const nextLoop = await updateAgentLoopRun(sessionsRoot, sessionId, loopRunId, {
    status:
      runnerResult.exitCode === 0
        ? ingestion.loopUpdate?.status ?? "running"
        : "failed",
    currentStep: ingestion.loopUpdate?.currentStep,
    currentTask: ingestion.loopUpdate?.currentTask
  });
  const turn: AgentTurn = {
    id: turnId,
    sessionId,
    loopRunId,
    commandId,
    status: runnerResult.exitCode === 0 ? "succeeded" : "failed",
    inputRef,
    stdoutRef,
    stderrRef,
    createdAt: now,
    completedAt: new Date().toISOString()
  };
  await appendJsonLine(loopTurnsPath(sessionsRoot, sessionId, loopRunId), turn);
  await appendAgentEvent(sessionsRoot, sessionId, {
    type: "agent_turn_completed",
    data: { loopRunId, turnId, status: turn.status }
  });

  return {
    loop: nextLoop,
    turn,
    ingestionPath
  };
}

export async function runLocalCliAgentCommand(
  sessionsRoot: string,
  sessionId: string,
  commandId: string,
  input: RunLocalCliAgentCommandInput
): Promise<RunLocalCliAgentCommandResult> {
  const session = await getAgentSession(sessionsRoot, sessionId);
  const command = (await listAgentCommands(sessionsRoot, sessionId)).find(
    (item) => item.id === commandId
  );
  if (!command) {
    throw new Error(`Agent command not found: ${commandId}`);
  }

  const harnessContextPath = checkpointPath(sessionsRoot, sessionId, "harness-context.json");
  const stdoutPath = logPath(sessionsRoot, sessionId, "agent.stdout.log");
  const stderrPath = logPath(sessionsRoot, sessionId, "agent.stderr.log");
  const harnessContext = {
    session,
    command,
    executor: {
      adapter: session.agentAdapter,
      executable: input.executable,
      args: input.args ?? [],
      cwd: input.cwd,
      cliAdapterPriority: session.cliAdapterPriority,
      cliUnavailableReason: session.cliUnavailableReason
    }
  };

  await writeJson(harnessContextPath, harnessContext);
  await appendAgentEvent(sessionsRoot, sessionId, {
    type: "adapter_selected",
    message: `Using ${session.agentAdapter}`,
    data: {
      adapter: session.agentAdapter,
      priority: session.cliAdapterPriority,
      cliUnavailableReason: session.cliUnavailableReason
    }
  });
  await appendAgentEvent(sessionsRoot, sessionId, {
    type: "harness_context_written",
    data: { path: harnessContextPath }
  });
  await appendAgentEvent(sessionsRoot, sessionId, {
    type: "local_cli_started",
    message: `Starting ${input.executable}`,
    data: { executable: input.executable, args: input.args ?? [], cwd: input.cwd }
  });

  await updateAgentSessionStatus(sessionsRoot, sessionId, "running");

  try {
    const result = await input.runner({
      executable: input.executable,
      args: input.args ?? [],
      cwd: input.cwd,
      stdin: buildLocalCliPrompt(harnessContextPath, command)
    });
    await writeFile(stdoutPath, result.stdout, "utf8");
    await writeFile(stderrPath, result.stderr, "utf8");
    const nextStatus: AgentSessionStatus = result.exitCode === 0 ? "succeeded" : "failed";
    const nextSession = await updateAgentSessionStatus(sessionsRoot, sessionId, nextStatus);
    await appendAgentEvent(sessionsRoot, sessionId, {
      type: result.exitCode === 0 ? "local_cli_completed" : "local_cli_failed",
      data: { exitCode: result.exitCode, stdoutPath, stderrPath }
    });
    return {
      session: nextSession,
      command,
      harnessContextPath,
      stdoutPath,
      stderrPath,
      exitCode: result.exitCode
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeFile(stdoutPath, "", "utf8");
    await writeFile(stderrPath, message, "utf8");
    const missingExecutable = isExecutableMissing(error);
    const nextSession = await updateAgentSession(sessionsRoot, sessionId, {
      status: "failed",
      cliUnavailableReason: missingExecutable ? message : undefined
    });
    await appendAgentEvent(sessionsRoot, sessionId, {
      type: missingExecutable ? "local_cli_unavailable" : "local_cli_failed",
      message,
      data: { executable: input.executable, stdoutPath, stderrPath }
    });
    return {
      session: nextSession,
      command,
      harnessContextPath,
      stdoutPath,
      stderrPath,
      exitCode: null
    };
  }
}

function buildLocalCliPrompt(harnessContextPath: string, command: AgentCommand): string {
  return [
    "You are executing a HotLoop agent command through the local CLI bridge.",
    `Read the harness context checkpoint: ${harnessContextPath}`,
    `Command id: ${command.id}`,
    `Command type: ${command.type}`,
    `Command payload: ${JSON.stringify(command.payload)}`
  ].join("\n");
}

function isExecutableMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
