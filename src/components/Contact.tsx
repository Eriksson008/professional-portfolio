import { m, useReducedMotion } from 'framer-motion';
import { profile } from '../data/profile';
import { riseIn, VIEWPORT } from './motion';

export function Contact() {
  const reduced = useReducedMotion();
  return (
    <m.section
      id="contact"
      className="section section-contact"
      variants={riseIn}
      initial={reduced ? false : 'hidden'}
      whileInView="show"
      viewport={VIEWPORT}
    >
      <div className="wrap">
        <div className="contact-panel">
          <p className="sheet-mark">
            <span className="sheet-no">06</span>
            <span className="sheet-rule" aria-hidden="true" />
            <span className="sheet-eyebrow">Contact Transmission</span>
          </p>
          <h2 className="contact-title">Let’s talk about senior engineering roles.</h2>
          <p className="contact-intro">
            Open to Senior Software Engineer, Salesforce Engineer, Backend, Full-Stack, Cloud /
            Application Engineer, and Tech Lead-track opportunities.
          </p>
          <div className="contact-actions">
            <a className="btn btn-primary" href={`mailto:${profile.links.email}`}>
              {profile.links.email}
            </a>
            <a
              className="btn btn-ghost"
              href={profile.links.linkedin}
              target="_blank"
              rel="noopener"
            >
              LinkedIn
            </a>
            <a className="btn btn-ghost" href={profile.links.github} target="_blank" rel="noopener">
              GitHub
            </a>
            <a className="btn btn-ghost" href={profile.links.resume} target="_blank" rel="noopener">
              Download Résumé
            </a>
          </div>
          <p className="contact-note">
            The résumé is a one-page PDF that mirrors this site — same facts, same numbers.
          </p>
        </div>
      </div>
    </m.section>
  );
}
