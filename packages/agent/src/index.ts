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

export type AgentAdapter = `local-cli:${string}` | "api-fallback" | "manual-agent";

export interface AgentSession {
  id: string;
  status: AgentSessionStatus;
  workspaceRoot: string;
  activeRunId?: string;
  agentAdapter: AgentAdapter;
  adapterPriority: AgentAdapter[];
  fallbackReason: string | null;
  loadedHarness: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentSessionInput {
  id: string;
  workspaceRoot: string;
  activeRunId?: string;
  agentAdapter: AgentAdapter;
  adapterPriority: AgentAdapter[];
  fallbackReason: string | null;
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

function sessionDir(sessionsRoot: string, sessionId: string): string {
  return path.join(sessionsRoot, sessionId);
}

function sessionJsonPath(sessionsRoot: string, sessionId: string): string {
  return path.join(sessionDir(sessionsRoot, sessionId), "session.json");
}

function jsonlPath(sessionsRoot: string, sessionId: string, fileName: string): string {
  return path.join(sessionDir(sessionsRoot, sessionId), fileName);
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
  const entries = await readdir(sessionsRoot, { withFileTypes: true });
  const sessions = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => getAgentSession(sessionsRoot, entry.name))
  );

  return sessions.sort((a, b) => {
    const byCreated = b.createdAt.localeCompare(a.createdAt);
    if (byCreated !== 0) return byCreated;
    return b.id.localeCompare(a.id);
  });
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
