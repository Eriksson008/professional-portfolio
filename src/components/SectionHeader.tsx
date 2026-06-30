interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  title: string;
  intro?: string;
}

export function SectionHeader({ index, eyebrow, title, intro }: SectionHeaderProps) {
  return (
    <div className="section-head">
      <p className="sheet-mark">
        <span className="sheet-no">{index}</span>
        <span className="sheet-rule" aria-hidden="true" />
        <span className="sheet-eyebrow">{eyebrow}</span>
      </p>
      <h2 className="section-title">{title}</h2>
      {intro && <p className="section-intro">{intro}</p>}
    </div>
  );
}
