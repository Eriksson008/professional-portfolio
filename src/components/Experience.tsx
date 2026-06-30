import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { timeline } from '../data/experience';

export function Experience() {
  return (
    <Section id="experience">
      <SectionHeader
        index="02"
        eyebrow="Experience & Education"
        title="A steady progression from engineering foundation to senior ownership."
      />
      <ol className="timeline">
        {timeline.map((entry, i) => (
          <li className={`tl-item ${entry.current ? 'is-current' : ''}`} key={i}>
            <div className="tl-marker" aria-hidden="true" />
            <p className="tl-period">{entry.period}</p>
            <div className="tl-content">
              <h3>{entry.title}</h3>
              <p>{entry.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="footnote">
        Title progression reflects responsibilities held; “acting Tech Lead” denotes scope of
        ownership rather than an officially conferred title. Recognized with the employer’s highest
        performance rating, “Exceptional Impact,” for 2023, 2024, and 2025.
      </p>
    </Section>
  );
}
