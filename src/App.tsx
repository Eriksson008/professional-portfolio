import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Experience } from './components/Experience';
import { Highlights } from './components/Highlights';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Resume } from './components/Resume';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero />
        <About />
        <Experience />
        <Highlights />
        <Projects />
        <Skills />
        <Resume />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
