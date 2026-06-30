import { useEffect, useState } from 'react';
import { profile } from '../data/profile';

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
          <span className="brand-mark">{profile.initials}</span>
          <span className="brand-name">{profile.name}</span>
        </a>

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

        <nav id="nav-menu" className={`nav-menu ${open ? 'is-open' : ''}`} aria-label="Primary">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)}>
              {s.label}
            </a>
          ))}
          <a className="nav-cta" href="#contact" onClick={() => setOpen(false)}>
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
