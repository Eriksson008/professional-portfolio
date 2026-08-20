import { LazyMotion, domAnimation } from 'framer-motion';
import { Nav } from './components/Nav';
import { MobileDock } from './components/MobileDock';
import { useAnchorGlide } from './components/useAnchorGlide';
import { useAskFredrik } from './components/useAskFredrik';
import { HeroSwitch } from './components/HeroSwitch';
import { CinematicChapter } from './components/CinematicChapter';
import {
  engineerChapter,
  ignitionChapter,
  liftoffChapter,
  liftoffFigures,
  orbitChapter,
  recedeChapter,
} from './data/chapters';
import { About } from './components/About';
import { Highlights } from './components/Highlights';
import { SystemsInFlight } from './components/SystemsInFlight';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Experience } from './components/Experience';
import { AstronautFinale } from './components/AstronautFinale';
import { Footer } from './components/Footer';
import { AskFredrik } from './components/AskFredrik';

export default function App() {
  useAnchorGlide();
  // useKeyboardInset() used to run here, publishing --kb-inset for the old
  // assistant panel's max-height. That was its only consumer, and the sheet
  // sizes itself from visualViewport instead (useSheetViewport, mounted only
  // while it is open) — so a global visualViewport listener writing a custom
  // property nobody read was pure cost on a scroll-scrubbed page.
  // One assistant, two triggers: the desktop pill and the phone dock.
  const ask = useAskFredrik();
  return (
    <LazyMotion features={domAnimation} strict>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Nav />
      <main>
        {/* Renders AstronautHero unchanged unless ?hero= selects an
            experimental implementation (experiment/cinematic-media-converter). */}
        <HeroSwitch />

        {/* The launch narrative: five scroll-scrubbed film beats between the
            opening hero and the document sections — hardware is assembled, it
            ignites, it leaves the ground carrying the figures, it flies, and
            it goes on without us. All five are one component over sequences
            (see CinematicChapter), and their intensity runs 4-5-4-3-2 so the
            page peaks in the middle of the launch and comes down from there
            rather than staying loud. */}
        <CinematicChapter {...engineerChapter} tone="deep" />
        <CinematicChapter {...ignitionChapter} tone="ignition" />
        <CinematicChapter {...liftoffChapter} tone="ignition">
          <dl className="chapter-figures">
            {liftoffFigures().map((figure) => (
              // The label is the term and the figure is its value, not the
              // other way round; CSS orders the value above so the editorial
              // reading is unchanged.
              <div className="chapter-figure" key={figure.label}>
                <dt>{figure.label}</dt>
                <dd>{figure.value}</dd>
              </div>
            ))}
          </dl>
        </CinematicChapter>
        {/* The deceleration. Ignition and liftoff peak; these two glide, and
            the page keeps coming down from here into the document. */}
        <CinematicChapter {...orbitChapter} tone="deep" />
        <CinematicChapter {...recedeChapter} tone="deep" phoneFit="contain" />

        <About />
        <Highlights />
        <SystemsInFlight />
        <Projects />
        <Skills />
        <Experience />
        <AstronautFinale />
      </main>
      <Footer />
      <AskFredrik ask={ask} />
      <MobileDock ask={ask} />
    </LazyMotion>
  );
}
