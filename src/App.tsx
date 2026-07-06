import { LazyMotion, domAnimation } from 'framer-motion';
import { Nav } from './components/Nav';
import { useAnchorGlide } from './components/useAnchorGlide';
import { AstronautHero } from './components/AstronautHero';
import { About } from './components/About';
import { Highlights } from './components/Highlights';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Experience } from './components/Experience';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AskFredrik } from './components/AskFredrik';

export default function App() {
  useAnchorGlide();
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
        <Contact />
      </main>
      <Footer />
      <AskFredrik />
    </LazyMotion>
  );
}
