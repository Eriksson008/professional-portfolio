import { type Highlight, highlights } from './highlights';

/**
 * Copy for the scroll-scrubbed chapters of the launch narrative.
 *
 * Every line here is drawn from `profile.about` or `projects` rather than
 * written fresh, so the site cannot start claiming something the résumé and the
 * assistant do not also say. Where a sentence is compressed for the screen, the
 * source it compresses is named beside it.
 */
export interface Chapter {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  sequence: string;
  poster: string;
  start: string;
  label: string;
}

const media = (file: string) => `${import.meta.env.BASE_URL}media/${file}`;

export const engineerChapter: Chapter = {
  id: 'engineer',
  eyebrow: 'The engineer',
  title: 'I started in mechanical engineering.',
  // profile.about[0], compressed.
  body: 'Project management, technical drawings, facility design — where I learned to break ambiguous problems into precise, buildable specifications. The software came later. The habit came with it.',
  sequence: 'astronaut-reveal-97',
  poster: media('astronaut-reveal-poster.jpg'),
  start: media('astronaut-reveal-start.jpg'),
  label: 'About the engineer',
};

export const ignitionChapter: Chapter = {
  id: 'ignition',
  eyebrow: 'Ignition',
  title: 'Architecture becomes execution.',
  // profile.about[2] ("keeping production stable under enterprise reliability
  // standards") and the Salesforce platform entry's release ownership.
  body: 'Design decisions stay cheap until something has to run. Mine have carried production releases, enterprise reliability standards, and the engineers on call behind them.',
  sequence: 'ignition',
  poster: media('ignition-poster.jpg'),
  start: media('ignition-start.jpg'),
  label: 'Engineering approach',
};

export const liftoffChapter: Chapter = {
  id: 'liftoff',
  eyebrow: 'Liftoff',
  title: 'What it has added up to.',
  // Names only the evidence the four displayed figures actually rest on:
  // commit history (750+, #1), team scope (7 engineers), and the performance
  // record (3 yrs). Ticket history backs a highlight this chapter does not show.
  body: 'Figures that can be checked, not estimated — commit history, team scope, and a performance record.',
  sequence: 'liftoff',
  poster: media('liftoff-poster.jpg'),
  start: media('liftoff-start.jpg'),
  label: 'Career figures',
};

/**
 * Which highlights get the editorial treatment in chapter 04.
 *
 * Referenced by label rather than copied, so there is exactly one place a
 * figure can be edited. A unit test asserts every label here still resolves —
 * renaming a highlight would otherwise silently drop it from the chapter.
 */
export const liftoffFigureLabels = [
  'Commits authored',
  'Contributor on core systems',
  'Engineers led',
  'Exceptional Impact rating',
] as const;

export const liftoffFigures = (): Highlight[] =>
  liftoffFigureLabels
    .map((label) => highlights.find((h) => h.label === label))
    .filter((h): h is Highlight => Boolean(h));
