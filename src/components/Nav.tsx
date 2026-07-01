import { useEffect, useState } from 'react';
import { profile } from '../data/profile';
import { useTheme } from '../hooks/useTheme';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path strokeLinejoin="round" d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'resume', label: 'Résumé' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: highlight the nav link for the section currently in view.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="wrap nav-inner">
        <a className="brand" href="#top" aria-label={`${profile.name} — home`}>
          <span className="brand-mark">{profile.initials}</span>
          <span className="brand-name">{profile.name}</span>
        </a>

        <div className="nav-actions">
          <nav id="nav-menu" className={`nav-menu ${open ? 'is-open' : ''}`} aria-label="Primary">
            {sections.map((s) => (
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
            <a className="nav-cta" href="#contact" onClick={() => setOpen(false)}>
              Contact
            </a>
          </nav>

          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggle}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

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
