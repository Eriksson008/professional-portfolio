import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { timeline } from '../data/experience';

export function Experience() {
  return (
    <Section id="experience">
      <SectionHeader
        index="06"
        eyebrow="Career Trajectory"
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
        Genesis Corp was the employer of record from February 2022 to June 2023, with all work
        performed on assignment inside the same Group Insurance technology organization; direct
        employment ran from June 2023 to June 2026. “Acting Technical Lead” denotes scope of
        ownership rather than an officially conferred title. Recognized with the employer’s highest
        performance designation, “Exceptional Impact,” for 2023, 2024, and 2025.
      </p>
    </Section>
  );
}
