import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { highlights } from '../data/highlights';

export function Highlights() {
  return (
    <Section id="highlights" alt>
      <SectionHeader
        index="03"
        eyebrow="Career Highlights"
        title="The work, in numbers I can defend."
        intro="Every figure below is git-verifiable or directly documented — framed honestly, with nothing inflated."
      />
      <ul className="metric-grid">
        {highlights.map((h) => (
          <li className="metric" key={h.label}>
            <p className="metric-value">{h.value}</p>
            <p className="metric-label">{h.label}</p>
            <p className="metric-note">{h.note}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
