// CSS-only hero core: a soft violet halo, a glass core, and two slowly
// precessing 1px orbit rings behind the identity. Always mounted as the
// guaranteed center of the hero — while the WebGL orb is live it drops to a
// whisper (`is-quiet`, same pattern as the SVG starfield) so a lost GL
// context can never leave an empty center.

export function HeroCoreFallback({ quiet }: { quiet?: boolean }) {
  return (
    <div className={`c-orb ${quiet ? 'is-quiet' : ''}`} aria-hidden="true">
      <div className="c-orb__halo" />
      <div className="c-orb__ring c-orb__ring--a" />
      <div className="c-orb__ring c-orb__ring--b" />
      <div className="c-orb__core" />
    </div>
  );
}
