import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { projects } from '../data/projects';

export function Projects() {
  return (
    <Section id="projects" alt>
      <SectionHeader
        index="04"
        eyebrow="Selected Projects"
        title="Enterprise systems I own, and things I build for myself."
        intro="Enterprise work is sanitized — no internal system names, data, or business logic. Personal and lab projects are my own and described in full."
      />
      <div className="project-grid">
        {projects.map((p) => (
          <article className="project-card" key={p.id}>
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
          </article>
        ))}
      </div>
    </Section>
  );
}
