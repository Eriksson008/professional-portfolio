import type { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

interface SectionProps {
  id: string;
  alt?: boolean;
  children: ReactNode;
}

export function Section({ id, alt, children }: SectionProps) {
  const { ref, shown } = useReveal<HTMLElement>();
  return (
    <section
      id={id}
      ref={ref}
      className={`section ${alt ? 'section-alt' : ''} reveal ${shown ? 'is-shown' : ''}`}
    >
      <div className="wrap">{children}</div>
    </section>
  );
}
