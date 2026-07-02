import { m } from 'framer-motion';
import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { SystemCard } from './SystemCard';
import { gridStagger } from './motion';
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
      <m.div className="project-grid" variants={gridStagger}>
        {projects.map((p) => (
          <SystemCard key={p.id} project={p} />
        ))}
      </m.div>
    </Section>
  );
}
