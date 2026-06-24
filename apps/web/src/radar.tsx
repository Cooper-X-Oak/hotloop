import type { Candidate } from "@hotloop/workspace";

export interface RadarLane {
  id: "P0" | "P1" | "P2" | "P3" | "P4";
  title: string;
  description: string;
  candidates: Candidate[];
}

const LANE_DEFINITIONS: Array<Omit<RadarLane, "candidates">> = [
  {
    id: "P0",
    title: "X 起爆贴",
    description: "X 热帖、官方账号、产品负责人的高时效信号。"
  },
  {
    id: "P1",
    title: "GitHub 速度",
    description: "Trending 仓库、开源项目增长和开发者采用信号。"
  },
  {
    id: "P2",
    title: "国际社区热点",
    description: "HN、Reddit、Product Hunt、Techmeme 等全球讨论。"
  },
  {
    id: "P3",
    title: "官方更新",
    description: "公司博客、发布说明、API 更新和政策变化。"
  },
  {
    id: "P4",
    title: "论文信号",
    description: "一周内且对产品或开发者有潜在影响的论文。"
  }
];

export function buildRadarLanes(candidates: Candidate[]): RadarLane[] {
  return LANE_DEFINITIONS.map((lane) => ({
    ...lane,
    candidates: candidates.filter((candidate) => candidate.lane === lane.id)
  }));
}

export function RadarPage({ candidates }: { candidates: Candidate[] }) {
  const lanes = buildRadarLanes(candidates);
  const total = candidates.length;
  const p0Count = lanes.find((lane) => lane.id === "P0")?.candidates.length ?? 0;

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">HotLoop 雷达</p>
          <h1>AI 热点信号台</h1>
          <p className="summary">
            先看高时效信号，再决定现在最值得写什么。
          </p>
        </div>
        <dl className="stats">
          <div>
            <dt>候选</dt>
            <dd>{total}</dd>
          </div>
          <div>
            <dt>P0</dt>
            <dd>{p0Count}</dd>
          </div>
        </dl>
      </header>

      <section className="lanes" aria-label="Radar lanes">
        {lanes.map((lane) => (
          <article className="lane" key={lane.id}>
            <header>
              <span className="lane-id">{lane.id}</span>
              <div>
                <h2>{lane.title}</h2>
                <p>{lane.description}</p>
              </div>
            </header>

            {lane.candidates.length === 0 ? (
              <p className="empty">当前分组暂无候选。</p>
            ) : (
              <ul>
                {lane.candidates.map((candidate) => (
                  <li className="candidate" key={candidate.id}>
                    <h3>{candidate.title}</h3>
                    <p className="meta">{candidate.source}</p>
                    {candidate.summary ? <p>{candidate.summary}</p> : null}
                    {candidate.whyItMatters ? (
                      <p>
                        <strong>为什么重要：</strong> {candidate.whyItMatters}
                      </p>
                    ) : null}
                    {candidate.risk ? (
                      <p>
                        <strong>风险：</strong> {candidate.risk}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
