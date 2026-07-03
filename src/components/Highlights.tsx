import { m } from 'framer-motion';
import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { MetricNode } from './MetricNode';
import { gridStagger } from './motion';
import { highlights } from '../data/highlights';

export function Highlights() {
  return (
    <Section id="highlights" alt>
      <SectionHeader
        index="02"
        eyebrow="Impact Telemetry"
        title="The work, in numbers I can defend."
        intro="Every figure below is git-verifiable or directly documented — framed honestly, with nothing inflated."
      />
      <m.ul className="metric-grid" variants={gridStagger}>
        {highlights.map((h) => (
          <MetricNode key={h.label} {...h} />
        ))}
      </m.ul>
    </Section>
  );
}
