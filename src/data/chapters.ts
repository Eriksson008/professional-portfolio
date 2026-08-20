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
  // An exploded assembly closing itself back together. The site's whole idiom
  // is the title block of an engineering drawing, and an exploded view is that
  // drawing's other half — so the one chapter about mechanical engineering is
  // the one place it can be shown literally rather than alluded to.
  sequence: 'assembly',
  poster: media('assembly-poster.jpg'),
  start: media('assembly-start.jpg'),
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

export const orbitChapter: Chapter = {
  id: 'orbit',
  eyebrow: 'In flight',
  title: 'Shipping is where the work starts.',
  // profile.about[2] (production stability under enterprise reliability
  // standards), the Salesforce entry's release ownership and production
  // support, and Homebase's forward-only migrations against live data.
  body: 'Release ownership, production support, forward-only migrations applied to live data, and checks that run on every change. The interesting part of a system is the part that has to keep running.',
  sequence: 'orbit',
  poster: media('orbit-poster.jpg'),
  start: media('orbit-start.jpg'),
  label: 'Operating in production',
};

/**
 * The exhale. Intensity 2 — the quietest cinematic beat, and the last one
 * before the page becomes a document. The plate is also the emptiest in the
 * sequence, which is deliberate: the typography earns the most room exactly
 * where the story stops pushing.
 */
export const recedeChapter: Chapter = {
  id: 'recede',
  eyebrow: 'Endurance',
  title: 'The handover is part of the build.',
  // experience.ts (code review, mentoring and onboarding, release ownership)
  // and profile.about[2] ("a dependable owner for the people and platforms I
  // support"). The closing clause is the site's own positioning line.
  body: 'Code review, onboarding, and release ownership — so a system does not depend on the person who wrote it. Built to launch, scale, and endure.',
  sequence: 'recede',
  poster: media('recede-poster.jpg'),
  start: media('recede-start.jpg'),
  label: 'Handover and maintainability',
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
