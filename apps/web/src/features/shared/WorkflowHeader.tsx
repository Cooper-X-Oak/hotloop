import type { ReactNode } from "react";

export function WorkflowHeader({
  step,
  title,
  description,
  action
}: {
  step: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="workflow-header">
      <div className="step-badge">{step}</div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div className="workflow-action">{action}</div> : null}
    </header>
  );
}

export function ViewHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="view-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </header>
  );
}

export function CommandCard({
  title,
  body,
  action,
  disabled,
  onClick
}: {
  title: string;
  body: string;
  action: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <article className="command-card">
      <h3>{title}</h3>
      <p>{body}</p>
      <button disabled={disabled} onClick={onClick}>
        {action}
      </button>
    </article>
  );
}
