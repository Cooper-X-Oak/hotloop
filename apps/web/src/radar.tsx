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
    title: "X Explosive Posts",
    description: "X hot takes, official accounts, and product-lead comments."
  },
  {
    id: "P1",
    title: "GitHub Velocity",
    description: "Trending repositories and open-source momentum."
  },
  {
    id: "P2",
    title: "International Community",
    description: "HN, Reddit, Product Hunt, Techmeme, and other global discussions."
  },
  {
    id: "P3",
    title: "Official Updates",
    description: "Company blogs, release notes, API updates, and policy changes."
  },
  {
    id: "P4",
    title: "Paper Signals",
    description: "Recent papers capped to items with product or developer impact."
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
          <p className="eyebrow">HotLoop Radar</p>
          <h1>AI technology signal desk</h1>
          <p className="summary">
            Fresh source-first radar for deciding what is worth writing now.
          </p>
        </div>
        <dl className="stats">
          <div>
            <dt>Candidates</dt>
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
              <p className="empty">No candidates in this lane.</p>
            ) : (
              <ul>
                {lane.candidates.map((candidate) => (
                  <li className="candidate" key={candidate.id}>
                    <h3>{candidate.title}</h3>
                    <p className="meta">{candidate.source}</p>
                    {candidate.summary ? <p>{candidate.summary}</p> : null}
                    {candidate.whyItMatters ? (
                      <p>
                        <strong>Why it matters:</strong> {candidate.whyItMatters}
                      </p>
                    ) : null}
                    {candidate.risk ? (
                      <p>
                        <strong>Risk:</strong> {candidate.risk}
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

