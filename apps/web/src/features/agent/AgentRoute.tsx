import { useState } from "react";
import type { FeaturePageProps } from "../types.js";
import { WorkflowHeader } from "../shared/WorkflowHeader.js";

export function AgentRoute({
  agentSessions,
  agentMessages,
  agentCommands,
  agentDecisions,
  agentLoopRuns,
  agentTurns,
  busyAction,
  onSendAgentInstruction,
  onAnswerAgentDecision
}: FeaturePageProps) {
  const [instruction, setInstruction] = useState("跑一轮近 6h AI 热点，优先 X 起爆贴。");
  const openDecisions = agentDecisions.filter((decision) => decision.status === "open");
  const activeLoop = agentLoopRuns[0];
  const latestAgentMessage = [...agentMessages].reverse().find((message) => message.role === "agent");

  return (
    <section id="agent" className="view">
      <WorkflowHeader
        step="00"
        title="Agent 交互台"
        description="这里是人和本地 CLI agent 的交互入口：发指令、看命令、答决策、追踪工具调用。"
        action={
          <button
            className="primary-action"
            onClick={() => onSendAgentInstruction(instruction)}
            disabled={busyAction === "agent" || instruction.trim().length === 0}
          >
            {busyAction === "agent" ? "发送中" : "发送指令"}
          </button>
        }
      />

      <div className="agent-console">
        <label className="agent-composer">
          <span>给 agent 的指令</span>
          <textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={4}
          />
        </label>

        <div className="split-panel">
          <section className="focus-box">
            <h3>Agent Session</h3>
            {agentSessions.length === 0 ? <p>还没有 session。</p> : null}
            <ul className="table-list">
              {agentSessions.map((session) => (
                <li key={session.id}>
                  <strong>{session.id}</strong>
                  <span>{session.agentAdapter}</span>
                  <span>{session.cliUnavailableReason ?? "本地 CLI 已配置"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="focus-box">
            <h3>Current Loop</h3>
            {!activeLoop ? <p>还没有 loop run。</p> : null}
            {activeLoop ? (
              <dl className="metric-grid">
                <div>
                  <dt>状态</dt>
                  <dd>{activeLoop.status}</dd>
                </div>
                <div>
                  <dt>步骤</dt>
                  <dd>{activeLoop.currentStep}</dd>
                </div>
                <div>
                  <dt>任务</dt>
                  <dd>{activeLoop.currentTask}</dd>
                </div>
                <div>
                  <dt>心跳</dt>
                  <dd>{activeLoop.lastHeartbeatAt ?? "未开始"}</dd>
                </div>
              </dl>
            ) : null}
            {latestAgentMessage ? <p>{latestAgentMessage.content}</p> : null}
          </section>
        </div>

        <div className="split-panel">
          <section className="focus-box">
            <h3>Transcript</h3>
            {agentMessages.length === 0 ? <p>等待第一条指令。</p> : null}
            <ol className="activity-log">
              {agentMessages.map((message) => (
                <li key={message.id}>
                  <strong>{message.role}</strong>：{message.content}
                </li>
              ))}
            </ol>
          </section>

          <section className="focus-box">
            <h3>Command Queue</h3>
            {agentCommands.length === 0 ? <p>暂无命令。</p> : null}
            <ol className="activity-log">
              {agentCommands.map((command) => (
                <li key={command.id}>
                  <strong>{command.type}</strong>：{command.status}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="split-panel">
          <section className="focus-box">
            <h3>Human Decision</h3>
            {openDecisions.length === 0 ? <p>没有等待人工判断的问题。</p> : null}
            <ul className="action-list">
              {openDecisions.map((decision) => (
                <li key={decision.id}>
                  <div>
                    <strong>{decision.question}</strong>
                    <span>{decision.recommendedAnswer ?? "等待选择"}</span>
                  </div>
                  <button onClick={() => onAnswerAgentDecision(decision, decision.options[0] ?? "")}>
                    采纳建议
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="focus-box">
            <h3>Turn Log</h3>
            {agentTurns.length === 0 ? <p>暂无 turn。</p> : null}
            <ol className="activity-log">
              {agentTurns.map((turn) => (
                <li key={turn.id}>
                  <strong>{turn.id}</strong>：{turn.status} / {turn.commandId}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}
