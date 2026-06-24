import type { FeaturePageProps } from "../types.js";
import { CommandCard, WorkflowHeader } from "../shared/WorkflowHeader.js";

export function EvidenceRoute({
  activeTopic,
  onWriteEvidence,
  onCreateArticle,
  onRenderHtml
}: FeaturePageProps) {
  return (
    <section id="evidence" className="view">
      <WorkflowHeader
        step="03"
        title="证据与成稿"
        description="把选题推进为证据包、文章包，再渲染成最终 HTML。"
      />
      <div className="command-grid">
        <CommandCard
          title="写入证据包"
          body="生成 evidence-pack.json、source snapshot 和 _公共分析.md。"
          action="写入证据包"
          disabled={!activeTopic}
          onClick={onWriteEvidence}
        />
        <CommandCard
          title="创建文章包"
          body="生成 文章.md、配图方案.md、过程.md 和配图目录。"
          action="创建文章包"
          disabled={!activeTopic}
          onClick={onCreateArticle}
        />
        <CommandCard
          title="渲染 HTML"
          body="把文章包渲染到 cooper-md 黑色成品目录。"
          action="渲染 HTML"
          disabled={!activeTopic}
          onClick={onRenderHtml}
        />
      </div>
    </section>
  );
}
