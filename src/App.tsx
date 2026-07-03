import { LazyMotion, domAnimation } from 'framer-motion';
import { Nav } from './components/Nav';
import { AstronautHero } from './components/AstronautHero';
import { About } from './components/About';
import { Highlights } from './components/Highlights';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Experience } from './components/Experience';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export default function App() {
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
    </LazyMotion>
  );
}
