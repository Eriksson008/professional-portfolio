import { GlowPanel } from './GlowPanel';
import { useVideoMediaTier } from './useDesktopViewport';
import type { Project } from '../data/projects';

/**
 * A project as a system node: glass panel + corner node that lights on hover.
 *
 * The title is an `h4` because `Projects` groups cards under an `h3` per kind.
 * At the same level the grouping the section exists to create is absent from
 * the heading outline — a screen reader hears "Enterprise", then three project
 * titles, all as siblings.
 *
 * **On phones the evidence bullets collapse behind a disclosure.** Nine cards
 * with their full bullet lists made this section 10 screens of a 38-screen
 * page at 390 px, and 15 of 47 on a small phone — around a third of the site,
 * in the one place a reader is scrolling to find something specific. The
 * summary and the role line stay visible, so every card still says what it is
 * and what was done; only the detail is a tap away.
 *
 * A native `<details>` rather than a JS accordion: it is keyboard operable and
 * screen-reader announced for free, and browsers expand it for find-in-page,
 * so collapsing does not hide the text from Ctrl-F. On wide viewports it is
 * rendered permanently open with its marker hidden, which is why `open` is
 * driven by the same media tier the rest of the site reads rather than by CSS
 * — there is no reliable way to force a `<details>` open from a stylesheet.
 */
export function SystemCard({ project: p }: { project: Project }) {
  const phone = useVideoMediaTier() === 'small';
  return (
    <GlowPanel as="article" className="sys-card">
      <span className="sys-node" aria-hidden="true" />
      <header className="pc-head">
        <span className={`pc-kind kind-${p.kind.toLowerCase()}`}>{p.kind}</span>
        {p.confidential && <span className="pc-conf">Sanitized</span>}
      </header>
      <h4 className="pc-title">{p.title}</h4>
      <p className="pc-summary">{p.summary}</p>
      <p className="pc-role">{p.role}</p>
      <details className="pc-more" open={!phone}>
        <summary className="pc-more-toggle">
          <span>{`What that involved (${p.bullets.length})`}</span>
        </summary>
        <ul className="pc-bullets">
          {p.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </details>
      <ul className="pc-tags" aria-label="Technologies">
        {p.tags.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {p.link && (
        <a className="pc-link" href={p.link.href} target="_blank" rel="noopener">
          {p.link.label} →
        </a>
      )}
    </GlowPanel>
  );
}
