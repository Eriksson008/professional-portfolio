import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { profile } from '../data/profile';

export function Resume() {
  return (
    <Section id="resume" alt>
      <SectionHeader
        index="06"
        eyebrow="Résumé"
        title="One page, same facts, same confidentiality rules."
        intro="The downloadable résumé mirrors this site — the same git-verifiable metrics and sanitized case studies, nothing exposed that this page does not already state."
      />
      <div className="resume-actions">
        <a className="btn btn-primary" href={profile.links.resume} target="_blank" rel="noopener">
          Download résumé (PDF)
        </a>
        <a className="btn btn-ghost" href={`mailto:${profile.links.email}`}>
          Request more detail
        </a>
      </div>
    </Section>
  );
}
