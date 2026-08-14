import { dockDestinations, dockTrackedIds } from './navigation';
import { useActiveSection } from './useActiveSection';
import type { AskFredrikController } from './useAskFredrik';

interface MobileDockProps {
  ask: AskFredrikController;
}

/**
 * Phone navigation (≤719px): a fixed dock in thumb reach instead of a top
 * header. Icon-only — seven destinations don't leave room for labels at
 * 320px, and every item carries an aria-label — with the active destination
 * lit by a soft capsule that follows the scroll-spy. Rendered on every
 * viewport but displayed only on phones (dock.css); display:none also keeps
 * it out of the desktop accessibility tree and tab order.
 */
export function MobileDock({ ask }: MobileDockProps) {
  // Clear the active id above the first section so Home owns the opening film.
  const active = useActiveSection(dockTrackedIds, true);

  return (
    <nav className="dock" aria-label="Primary">
      <ul className="dock-row">
        {dockDestinations.map((d) => {
          const Icon = d.icon;
          const isActive = d.href ? d.matches.includes(active) && !ask.open : ask.open;
          const className = `dock-item ${d.href ? '' : 'dock-ask'} ${isActive ? 'is-active' : ''}`;
          return (
            <li className="dock-cell" key={d.key}>
              {d.href ? (
                <a
                  className={className}
                  href={d.href}
                  aria-label={d.label}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <Icon />
                </a>
              ) : (
                <button
                  type="button"
                  className={className}
                  aria-label={d.label}
                  aria-expanded={ask.open}
                  aria-controls="ask-fredrik-panel"
                  onClick={(e) => ask.toggle(e.currentTarget)}
                >
                  <Icon />
                  <span className="dock-spark" aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
