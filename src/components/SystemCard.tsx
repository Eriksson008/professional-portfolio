import { GlowPanel } from './GlowPanel';
import type { Project } from '../data/projects';

/** A project as a system node: glass panel + corner node that lights on hover. */
export function SystemCard({ project: p }: { project: Project }) {
  return (
    <GlowPanel as="article" className="sys-card">
      <span className="sys-node" aria-hidden="true" />
      <header className="pc-head">
        <span className={`pc-kind kind-${p.kind.toLowerCase()}`}>{p.kind}</span>
        {p.confidential && <span className="pc-conf">Sanitized</span>}
      </header>
      <h3 className="pc-title">{p.title}</h3>
      <p className="pc-summary">{p.summary}</p>
      <p className="pc-role">{p.role}</p>
      <ul className="pc-bullets">
        {p.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <ul className="pc-tags" aria-label="Technologies">
        {p.tags.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {p.link && (
        <a className="pc-link" href={p.link.href} target="_blank" rel="noopener">
          {p.link.label} →
        </a>
      )}
    </GlowPanel>
  );
}
