import type { AgentCommand, AgentMessage, AgentSession, HumanDecision } from "@hotloop/agent";
import type { Candidate } from "@hotloop/workspace";
import type { ActiveTopic, ConsoleArtifact, ConsoleFeedback, ConsoleRun } from "../console.js";

export interface FeaturePageProps {
  candidates: Candidate[];
  runs: ConsoleRun[];
  artifacts: ConsoleArtifact[];
  feedback: ConsoleFeedback[];
  agentSessions: AgentSession[];
  agentMessages: AgentMessage[];
  agentCommands: AgentCommand[];
  agentDecisions: HumanDecision[];
  activeTopic: ActiveTopic | null;
  busyAction: string | null;
  onRunScan: () => void;
  onCreateTopic: (candidate: Candidate) => void;
  onCreateArticle: () => void;
  onWriteEvidence: () => void;
  onRenderHtml: () => void;
  onCreateDraft: (artifact: ConsoleArtifact) => void;
  onRecordFeedback: () => void;
  onSendAgentInstruction: (content: string) => void;
  onAnswerAgentDecision: (decision: HumanDecision, answer: string) => void;
}
