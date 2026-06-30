import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { profile } from '../data/profile';

export function About() {
  return (
    <Section id="about">
      <SectionHeader
        index="01"
        eyebrow="About"
        title="From mechanical engineering to enterprise software ownership."
      />
      <div className="about-body">
        {profile.about.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </Section>
  );
}
