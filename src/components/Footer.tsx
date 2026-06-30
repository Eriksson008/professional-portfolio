import { profile } from '../data/profile';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <p className="footer-name">{profile.name}</p>
        <p className="footer-note">
          {profile.role} · {profile.location}. Built with React, TypeScript, and Docker — no
          employer-confidential content.
        </p>
      </div>
    </footer>
  );
}
