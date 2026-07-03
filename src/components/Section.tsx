import type { ReactNode } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { riseIn, VIEWPORT } from './motion';

interface SectionProps {
  id: string;
  alt?: boolean;
  children: ReactNode;
}

export function Section({ id, alt, children }: SectionProps) {
  const reduced = useReducedMotion();
  return (
    <m.section
      id={id}
      className={`section ${alt ? 'section-alt' : ''}`}
      variants={riseIn}
      initial={reduced ? false : 'hidden'}
      whileInView="show"
      viewport={VIEWPORT}
    >
      <div className="wrap">{children}</div>
    </m.section>
  );
}
