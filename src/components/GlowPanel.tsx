import type { ReactNode } from 'react';
import { m } from 'framer-motion';
import { cardRise } from './motion';

const tags = { div: m.div, article: m.article, li: m.li } as const;

interface GlowPanelProps {
  as?: keyof typeof tags;
  className?: string;
  children: ReactNode;
}

/**
 * Premium glass surface: gradient panel, hairline top edge, film grain —
 * all CSS/SVG, no image assets. Participates in the parent's variant
 * cascade (cardRise) so grids can stagger panels in.
 */
export function GlowPanel({ as = 'div', className = '', children }: GlowPanelProps) {
  const Tag = tags[as];
  return (
    <Tag className={`glow-panel ${className}`} variants={cardRise}>
      {children}
    </Tag>
  );
}
