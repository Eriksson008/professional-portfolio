import { m } from 'framer-motion';
import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { SystemCard } from './SystemCard';
import { gridStagger } from './motion';
import { type Project, projects } from '../data/projects';

/**
 * The three kinds, in the order they earn attention. Enterprise work is the
 * deepest and least self-evident (it is sanitized, so it has to explain
 * itself); lab work is context, not a claim.
 */
const GROUPS: { kind: Project['kind']; note: string }[] = [
  { kind: 'Enterprise', note: 'Production systems owned on a platform team' },
  { kind: 'Personal', note: 'Built and operated end to end, by me' },
  { kind: 'Lab', note: 'Infrastructure practice, not a product' },
];

/**
 * Selected work, grouped rather than tiled.
 *
 * Nine identical cards in one grid read as one undifferentiated wall — the
 * enterprise systems, which carry the most evidence and the most explaining to
 * do, looked exactly like the home lab. Grouping by the `kind` the data already
 * carries gives each set its own environment without inventing a hierarchy the
 * content does not support.
 *
 * Enterprise cards run full width because they are the longest entries and the
 * only sanitized ones; the rest stay two-up. That is the whole differentiation —
 * layout and density, not colour. Painting the groups different colours would
 * have spent the palette on a distinction the eye gets from position anyway.
 */
export function Projects() {
  return (
    <Section id="projects">
      <SectionHeader
        index="04"
        eyebrow="Selected work"
        title="Enterprise systems I own, and things I build for myself."
        intro="Enterprise work is sanitized — no internal system names, data, or business logic. Personal and lab projects are my own and described in full."
      />

      {GROUPS.map(({ kind, note }) => {
        const inGroup = projects.filter((p) => p.kind === kind);
        if (inGroup.length === 0) return null;
        return (
          <section className="project-group" key={kind} aria-label={`${kind} work`}>
            <h3 className="project-group-head">
              <span className="project-group-kind">{kind}</span>
              <span className="project-group-rule" aria-hidden="true" />
              <span className="project-group-note">{note}</span>
            </h3>
            <m.div className={`project-grid grid-${kind.toLowerCase()}`} variants={gridStagger}>
              {inGroup.map((p) => (
                <SystemCard key={p.id} project={p} />
              ))}
            </m.div>
          </section>
        );
      })}
    </Section>
  );
}
