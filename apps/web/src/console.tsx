import type { Candidate } from "@hotloop/workspace";
import { RadarPage } from "./radar.js";

export interface ConsoleRun {
  id: string;
  status: string;
  currentStep: string;
}

export interface ConsoleArtifact {
  id: string;
  title: string;
  fileName: string;
}

export interface ConsoleFeedback {
  source: string;
  count: number;
  averageViews: number;
}

export interface ProductConsoleProps {
  candidates: Candidate[];
  runs: ConsoleRun[];
  artifacts: ConsoleArtifact[];
  feedback: ConsoleFeedback[];
}

export function ProductConsole({ candidates, runs, artifacts, feedback }: ProductConsoleProps) {
  return (
    <main className="product-shell">
      <aside className="sidebar" aria-label="Product views">
        <p className="brand">HotLoop</p>
        <nav>
          <a href="#radar">Radar</a>
          <a href="#runs">Runs</a>
          <a href="#artifacts">Artifacts</a>
          <a href="#publish">Publish</a>
          <a href="#feedback">Feedback</a>
        </nav>
      </aside>

      <div className="workspace">
        <section id="radar" className="view">
          <RadarPage candidates={candidates} />
        </section>

        <section id="runs" className="view">
          <ViewHeader eyebrow="Runs" title="Durable loop ledger" />
          <ul className="table-list">
            {runs.map((run) => (
              <li key={run.id}>
                <strong>{run.id}</strong>
                <span>{run.status}</span>
                <span>{run.currentStep}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="artifacts" className="view">
          <ViewHeader eyebrow="Artifacts" title="Final HTML library" />
          <ul className="table-list">
            {artifacts.map((artifact) => (
              <li key={artifact.id}>
                <strong>{artifact.title}</strong>
                <span>{artifact.fileName}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="publish" className="view">
          <ViewHeader eyebrow="Publish" title="Draft-only handoff" />
          <p className="summary">
            Prepare platform drafts from validated artifacts. Auto-publish remains disabled.
          </p>
        </section>

        <section id="feedback" className="view">
          <ViewHeader eyebrow="Feedback" title="Source performance" />
          <ul className="table-list">
            {feedback.map((item) => (
              <li key={item.source}>
                <strong>{item.source}</strong>
                <span>{item.count} outcomes</span>
                <span>{Math.round(item.averageViews)} avg views</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function ViewHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="view-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </header>
  );
}
