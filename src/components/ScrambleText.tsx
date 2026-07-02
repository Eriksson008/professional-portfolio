import { useEffect, useRef, useState } from 'react';

/** Monospace decode-scramble: on `play`, glyphs settle into `text` once. */
const GLYPHS = '0123456789+#~<>/\\{}[]%';

export function ScrambleText({ text, play }: { text: string; play: boolean }) {
  const [out, setOut] = useState(text);
  const done = useRef(false);
  useEffect(() => {
    if (!play) {
      // Always land on the final text when not playing — this also resolves a
      // scramble that was interrupted mid-flight (fast scroll past the focus window).
      setOut(text);
      return;
    }
    if (done.current) return;
    done.current = true;
    let frame = 0;
    const total = 16;
    const id = window.setInterval(() => {
      frame += 1;
      const revealCount = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split('')
          .map((ch, i) =>
            i < revealCount || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join('')
      );
      if (frame >= total) {
        window.clearInterval(id);
        setOut(text);
      }
    }, 28);
    return () => window.clearInterval(id);
  }, [play, text]);
  return <>{out}</>;
}
