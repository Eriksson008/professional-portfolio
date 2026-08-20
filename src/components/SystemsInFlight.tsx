import { m, useReducedMotion } from 'framer-motion';
import { Section } from './Section';
import { SectionHeader } from './SectionHeader';
import { clientAssistFlow, clientAssistPlatform } from '../data/systems';
import { gridStagger, headerItem } from './motion';

/**
 * Systems in flight — one real production pipeline, drawn.
 *
 * The cinematic chapters stop here. This is the de-escalation: after the
 * launch beats the page has to become an engineering document again, so the
 * only motion is the section's existing in-view stagger and nothing is
 * scroll-scrubbed.
 *
 * It draws the AI Client-Assist retrieval pipeline because that flow is the
 * clearest single answer to "what does this person actually build" — records
 * out of a CRM, into a search index, retrieved, reasoned over, returned. The
 * stages come from `systems.ts`, which takes them from the project entry; the
 * component invents nothing and cannot, because it has no copy of its own.
 *
 * Ordered markup: this is a sequence, and a reader on a screen reader should
 * get it as one. The connectors are CSS pseudo-elements on the list items, so
 * they carry no meaning that only exists visually.
 */
export function SystemsInFlight() {
  const reduced = useReducedMotion();

  return (
    <Section id="systems" alt>
      <SectionHeader
        index="03"
        eyebrow="Systems in flight"
        title="How one of them actually works"
        intro="A secure internal assistant that answers questions about client detail without reading from the CRM. Records are indexed outside it, retrieved, and reasoned over — so an answer is grounded in indexed data rather than in what a model remembers."
      />

      <m.ol className="flow" variants={reduced ? undefined : gridStagger}>
        {clientAssistFlow.map((stage, i) => (
          <m.li className="flow-stage" key={stage.name} variants={reduced ? undefined : headerItem}>
            <span className="flow-step" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="flow-name">{stage.name}</h3>
            <p className="flow-tech">{stage.tech}</p>
            <p className="flow-role">{stage.role}</p>
          </m.li>
        ))}
      </m.ol>

      <div className="flow-platform">
        <h3 className="flow-platform-title">Running on</h3>
        <dl className="flow-platform-list">
          {clientAssistPlatform.map((item) => (
            <div className="flow-platform-item" key={item.name}>
              <dt>{item.tech}</dt>
              <dd>{item.role}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
