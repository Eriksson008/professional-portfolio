import { profile } from '../data/profile';

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-name">
      <div className="hero-grid-bg" aria-hidden="true" />
      <div className="wrap hero-inner">
        <div className="hero-lead">
          <p className="hero-eyebrow">
            <span className="status-dot" aria-hidden="true" />
            {profile.role} · {profile.location}
          </p>
          <h1 className="hero-name" id="hero-name">
            {profile.name}
          </h1>
          <p className="hero-statement">{profile.tagline}</p>

          <div className="hero-actions">
            <a className="btn btn-primary" href={profile.links.resume} target="_blank" rel="noopener">
              Download résumé
            </a>
            <a className="btn" href="#projects">
              View projects
            </a>
            <a className="btn btn-ghost" href={profile.links.linkedin} target="_blank" rel="noopener">
              LinkedIn
            </a>
            <a className="btn btn-ghost" href={profile.links.github} target="_blank" rel="noopener">
              GitHub
            </a>
          </div>
        </div>

        {/* Signature: an engineering drawing's title block. */}
        <aside className="title-block" aria-label="Profile title block">
          <div className="tb-head">
            <span>Profile</span>
            <span className="tb-rev">REV 2026.06</span>
          </div>
          <dl className="tb-rows">
            {profile.titleBlock.map((row) => (
              <div className="tb-row" key={row.field}>
                <dt>{row.field}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="tb-ticks" aria-hidden="true">
            <span>+</span>
            <span>+</span>
            <span>+</span>
            <span>+</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
