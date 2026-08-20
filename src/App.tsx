import { LazyMotion, domAnimation } from 'framer-motion';
import { Nav } from './components/Nav';
import { MobileDock } from './components/MobileDock';
import { useAnchorGlide } from './components/useAnchorGlide';
import { useAskFredrik } from './components/useAskFredrik';
import { HeroSwitch } from './components/HeroSwitch';
import { CinematicChapter } from './components/CinematicChapter';
import { engineerChapter, ignitionChapter, liftoffChapter, liftoffFigures } from './data/chapters';
import { About } from './components/About';
import { Highlights } from './components/Highlights';
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

        {/* The launch narrative. Three scroll-scrubbed film beats between the
            opening hero and the document sections: the helmeted explorer of the
            hero becomes a person, the person's work ignites, and the figures
            arrive on the ascent. All three are the same component over
            different frame sequences — see CinematicChapter. */}
        <CinematicChapter {...engineerChapter} range={[0, 0.68]} />
        <CinematicChapter {...ignitionChapter} tone="ignition" />
        <CinematicChapter {...liftoffChapter} tone="ignition">
          <dl className="chapter-figures">
            {liftoffFigures().map((figure) => (
              <div className="chapter-figure" key={figure.label}>
                <dt>{figure.value}</dt>
                <dd>{figure.label}</dd>
              </div>
            ))}
          </dl>
        </CinematicChapter>

        <About />
        <Highlights />
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
