import { useEffect, useState } from 'react';
import { profile } from '../data/profile';
import { contactDestination, headerSections } from './navigation';
import { useActiveSection } from './useActiveSection';

const trackedIds = headerSections.map((s) => s.id);

/**
 * Desktop header. Hidden on phones (≤719px), where MobileDock takes over —
 * both read the same destinations from navigation.ts.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(trackedIds);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="wrap nav-inner">
        <a className="brand" href="#top" aria-label={`${profile.name} — home`}>
          {/* The monogram carries the identity; the link's aria-label already
              says whose it is, so the mark itself is decorative. */}
          <img
            className="brand-mark"
            src={`${import.meta.env.BASE_URL}logo-fe.png`}
            alt=""
            width={36}
            height={36}
            decoding="async"
          />
          <span className="brand-name">{profile.name}</span>
        </a>

        <div className="nav-actions">
          <nav id="nav-menu" className={`nav-menu ${open ? 'is-open' : ''}`} aria-label="Primary">
            {headerSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={active === s.id ? 'is-active' : ''}
                aria-current={active === s.id ? 'true' : undefined}
                onClick={() => setOpen(false)}
              >
                {s.label}
              </a>
            ))}
            <a
              className="nav-cta"
              href={`#${contactDestination.id}`}
              onClick={() => setOpen(false)}
            >
              {contactDestination.label}
            </a>
          </nav>

          <button
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="nav-menu"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
