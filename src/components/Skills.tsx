import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { skillGroups } from '../data/skills';

export function Skills() {
  return (
    <Section id="skills">
      <SectionHeader
        index="05"
        eyebrow="Skills Matrix"
        title="Tools and practices I work in regularly."
      />
      <div className="skills-grid">
        {skillGroups.map((group) => (
          <div className="skill-group" key={group.name}>
            <h3>{group.name}</h3>
            <ul className="chip-list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
