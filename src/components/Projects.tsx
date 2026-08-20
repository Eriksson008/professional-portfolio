import { m } from 'framer-motion';
import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { SystemCard } from './SystemCard';
import { gridStagger } from './motion';
import { type Project, projects } from '../data/projects';

/**
 * One line of framing per kind.
 *
 * Typed as a `Record` over the union rather than as an array of objects, so
 * adding a kind to `Project['kind']` fails the build here instead of silently
 * rendering nothing. The groups themselves are derived from the data below —
 * a hand-maintained list would drop any project whose kind was not on it, and
 * lint, tests and build would all still pass.
 */
const NOTES: Record<Project['kind'], string> = {
  Enterprise: 'Production systems owned on a platform team',
  Personal: 'Built and operated end to end, by me',
  Lab: 'Infrastructure practice, not a product',
};

/** The order the kinds earn attention. Anything unlisted sorts to the end. */
const ORDER: readonly Project['kind'][] = ['Enterprise', 'Personal', 'Lab'];
const rank = (kind: Project['kind']) => {
  const i = ORDER.indexOf(kind);
  return i === -1 ? ORDER.length : i;
};

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

      {[...new Set(projects.map((p) => p.kind))]
        .sort((a, b) => rank(a) - rank(b))
        .map((kind) => {
        const inGroup = projects.filter((p) => p.kind === kind);
        const note = NOTES[kind];
        return (
          <section className="project-group" key={kind} aria-label={`${kind} work`}>
            <h3 className="project-group-head">
              <span className="project-group-kind">{kind}</span>
              <span className="project-group-rule" aria-hidden="true" />
              <span className="project-group-note">{note}</span>
            </h3>
            <m.div
              // Only Enterprise takes a modifier; the other kinds use the base
              // two-column grid, so emitting grid-personal / grid-lab would be
              // class names with no rules behind them.
              className={`project-grid ${kind === 'Enterprise' ? 'grid-enterprise' : ''}`}
              variants={gridStagger}
            >
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
