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
  /**
   * Where the chapter's own copy begins fading out, when later beats follow it.
   * Set it clear of the next beat's `from`: two stanzas cross-fading in the same
   * place puts two eyebrows and two headlines on top of each other, which reads
   * as a rendering fault rather than a transition. A brief gap with no copy at
   * all is better — on a chapter whose film never stops, that gap is a beat of
   * pure film, which is the point of merging them in the first place.
   */
  until?: number;
  /**
   * Optional additional copy stanzas for a chapter whose film is long enough to
   * carry more than one thought. The chapter's own `eyebrow`/`title`/`body` are
   * the first beat; these follow it, each fading in and out on its own window
   * of the same scroll while the film underneath never stops.
   */
  beats?: readonly ChapterBeat[];
}

/**
 * One stanza of copy inside a chapter, with the progress window it lives in.
 *
 * `from` is where it begins fading in; `until` is where it begins fading out.
 * The last beat omits `until` and holds to the end of the runway. Windows may
 * overlap slightly — a small crossfade reads better than a gap, because a gap
 * leaves the film carrying the frame alone and the chapter briefly looks empty.
 */
export interface ChapterBeat {
  eyebrow: string;
  title: string;
  body?: string;
  from: number;
  until?: number;
  /** Rendered as large editorial numerals beneath the body. */
  figures?: readonly Highlight[];
}

const media = (file: string) => `${import.meta.env.BASE_URL}media/${file}`;

/**
 * Which highlights get the editorial treatment in the liftoff beat.
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

export const engineerChapter: Chapter = {
  id: 'engineer',
  eyebrow: 'The engineer',
  title: 'I started in mechanical engineering.',
  // profile.about[0], compressed.
  body: 'Project management, technical drawings, facility design — where I learned to break ambiguous problems into precise, buildable specifications. The software came later. The habit came with it.',
  // A machined turbopump impeller whose trailing edge dissolves into its own
  // engineering drawing — the line on paper and the thing that exists, in one
  // object. It replaced an exploded assembly, which illustrated the *noun*
  // (machine parts) while the copy is about the *verb* (specifying), and which
  // put two consecutive chapters of grey engine hardware back to back.
  sequence: 'impeller',
  poster: media('impeller-poster.jpg'),
  start: media('impeller-start.jpg'),
  label: 'About the engineer',
};

/**
 * Ignition and liftoff, as one uninterrupted film.
 *
 * They were two chapters, which meant the sticky runway unpinned and repinned
 * at exactly the moment the launch should have been most continuous, and the
 * canvas swapped from one frame sequence to another across the join. The
 * master is now a single 241-frame concatenation — the duplicated seed frame
 * between them dropped — so the engine lights, builds and leaves in one move
 * and the reader's thumb never hands off.
 *
 * The copy is what changes instead: two beats fading through on their own
 * windows of the same scroll. That is the right division of labour — the film
 * is continuous because the event is, and the words are discrete because
 * they are two different claims.
 */
export const ascentChapter: Chapter = {
  id: 'ascent',
  eyebrow: 'Ignition',
  title: 'Architecture becomes execution.',
  // profile.about[2] ("keeping production stable under enterprise reliability
  // standards") and the Salesforce platform entry's release ownership.
  body: 'Design decisions stay cheap until something has to run. Mine have carried production releases, enterprise reliability standards, and the engineers on call behind them.',
  sequence: 'ascent',
  poster: media('ascent-poster.jpg'),
  start: media('ascent-start.jpg'),
  label: 'Engineering approach and career figures',
  // Ignition's copy is gone by 0.48 and liftoff's arrives at 0.50 — a hand-over
  // with a hairline of clear film between, not a dissolve.
  until: 0.4,
  beats: [
    {
      eyebrow: 'Liftoff',
      title: 'What it has added up to.',
      body: 'Figures that can be checked, not estimated — commit history, team scope, and a performance record.',
      from: 0.5,
      figures: liftoffFigures(),
    },
  ],
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
