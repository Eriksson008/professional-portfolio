import { LazyMotion, domAnimation } from 'framer-motion';
import { Nav } from './components/Nav';
import { MobileDock } from './components/MobileDock';
import { useAnchorGlide } from './components/useAnchorGlide';
import { useAskFredrik } from './components/useAskFredrik';
import { useKeyboardInset } from './components/useKeyboardInset';
import { AstronautHero } from './components/AstronautHero';
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
  useKeyboardInset();
  // One assistant, two triggers: the desktop pill and the phone dock.
  const ask = useAskFredrik();
  return (
    <LazyMotion features={domAnimation} strict>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Nav />
      <main>
        <AstronautHero />
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
