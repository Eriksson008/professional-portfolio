import type { ComponentType } from 'react';
import {
  AskIcon,
  CareerIcon,
  ContactIcon,
  HomeIcon,
  ImpactIcon,
  ProjectsIcon,
  SkillsIcon,
} from './NavIcons';

/**
 * One source of truth for where the site can navigate. The desktop header
 * (Nav) and the phone dock (MobileDock) are two presentations of this list,
 * not two lists — a renamed section can't drift between them.
 */
export interface NavDestination {
  /** Anchor target id on the page. */
  id: string;
  label: string;
}

/** The desktop header's link row — order and labels as shipped. */
export const headerSections: readonly NavDestination[] = [
  { id: 'about', label: 'Summary' },
  { id: 'highlights', label: 'Impact' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Career' },
];

/** The header's trailing call to action (the closing/contact scene). */
export const contactDestination: NavDestination = { id: 'contact', label: 'Contact' };

export interface DockDestination {
  key: string;
  /** Accessible name — the dock itself is icon-only. */
  label: string;
  icon: ComponentType;
  /** Anchor target; omitted for the assistant, which opens a panel. */
  href?: string;
  /**
   * Scroll-spy ids this destination owns. `''` means "above the first
   * observed section" — the opening film, which belongs to Home.
   */
  matches: readonly string[];
}

/**
 * The dock's hierarchy (7 destinations). "Summary" is not a separate stop:
 * the opening film and the summary that follows it are one landing, so Home
 * owns both — that keeps thumb targets at a usable width instead of squeezing
 * an eighth icon in at 320px. Ask Fredrik is a dock citizen here rather than a
 * floating pill; it keeps the desktop pill's state and panel.
 */
export const dockDestinations: readonly DockDestination[] = [
  { key: 'home', label: 'Home', icon: HomeIcon, href: '#top', matches: ['', 'about'] },
  {
    key: 'highlights',
    label: 'Impact',
    icon: ImpactIcon,
    href: '#highlights',
    matches: ['highlights'],
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: ProjectsIcon,
    href: '#projects',
    matches: ['projects'],
  },
  { key: 'skills', label: 'Skills', icon: SkillsIcon, href: '#skills', matches: ['skills'] },
  {
    key: 'experience',
    label: 'Career',
    icon: CareerIcon,
    href: '#experience',
    matches: ['experience'],
  },
  { key: 'contact', label: 'Contact', icon: ContactIcon, href: '#contact', matches: ['contact'] },
  { key: 'ask', label: 'Ask Fredrik', icon: AskIcon, matches: [] },
];

/** Sections the dock's active state watches. */
export const dockTrackedIds: readonly string[] = dockDestinations
  .flatMap((d) => d.matches)
  .filter((id) => id !== '');
