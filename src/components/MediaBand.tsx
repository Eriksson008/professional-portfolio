interface MediaBandProps {
  /** Full-bleed still. */
  src: string;
  /** Describes the image for anyone who cannot see it. */
  alt: string;
  /** One quiet line over the plate. Optional — the band works without it. */
  caption?: string;
}

/**
 * A quiet full-bleed still between two dense text sections.
 *
 * Deliberately *not* a chapter. By this point in the page the cinematic
 * chapters are finished and the reader is working through project detail;
 * dropping another scroll-scrubbed sequence in would restart an intensity the
 * page has spent three sections coming down from, and cost another ~4 MB and a
 * hundred requests to do it.
 *
 * So this is a living still: one image, one slow drift, no canvas, no runway,
 * no frame sequence. It reuses a frame from the orbit chapter's own plate, so
 * it introduces no new media at all — it is the same flight, seen once more in
 * passing, which is the only reason a second look at it is not a repeat.
 *
 * The drift is CSS-only and stops under `prefers-reduced-motion`, where the
 * band becomes exactly what it already is with the movement removed — which is
 * the test for whether an ambient effect was carrying the composition.
 */
export function MediaBand({ src, alt, caption }: MediaBandProps) {
  return (
    <aside className="media-band" aria-label={alt}>
      <img className="media-band-img" src={src} alt="" loading="lazy" decoding="async" />
      <div className="media-band-scrim" aria-hidden="true" />
      {caption && <p className="media-band-caption">{caption}</p>}
    </aside>
  );
}
