import { m } from 'framer-motion';
import { headerStagger, headerItem, ruleDraw } from './motion';

interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  title: string;
  intro?: string;
}

/**
 * Cinematic section header: inherits the parent Section's in-view trigger and
 * cascades — number, rule line drawing left→right, eyebrow, title, intro.
 */
export function SectionHeader({ index, eyebrow, title, intro }: SectionHeaderProps) {
  return (
    <m.div className="section-head" variants={headerStagger}>
      <p className="sheet-mark">
        <m.span className="sheet-no" variants={headerItem}>
          {index}
        </m.span>
        <m.span
          className="sheet-rule"
          aria-hidden="true"
          variants={ruleDraw}
          style={{ originX: 0 }}
        />
        <m.span className="sheet-eyebrow" variants={headerItem}>
          {eyebrow}
        </m.span>
      </p>
      <m.h2 className="section-title" variants={headerItem}>
        {title}
      </m.h2>
      {intro && (
        <m.p className="section-intro" variants={headerItem}>
          {intro}
        </m.p>
      )}
    </m.div>
  );
}
