import { type MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { frameIndexForProgress } from './heroFrames';
import { useDecodeWindow, useHeroFrames } from './useHeroFrames';
import { useHeroRunway } from './useHeroRunway';
import { HeroShell } from './HeroShell';
import { HERO_FRAMES_NAME } from './AstronautHeroFrames';

const POSTER_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-poster.jpg`;
const START_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-start.jpg`;

const FILM_END_DESKTOP = 0.78;
const FILM_END_PHONE = 0.94;

const FOV = 35;
/** Camera distance at rest; the scroll dolly pushes in from here. */
const BASE_Z = 5;
/** Total push-in across the film — about 6%. Enough to feel, small enough not to swim. */
const DOLLY = 0.28;
/** Lateral camera travel from the cursor, in world units. Shallow on purpose. */
const PARALLAX = 0.09;
/**
 * Cover headroom so the lateral cursor offset never reveals a plane edge.
 * Sized to the parallax and no larger: PARALLAX (0.09 world units) against the
 * ~5.04-unit visible width at BASE_Z is 3.6% of travel, so 5% covers it with a
 * little to spare. Every percent beyond that is crop this hero does not share
 * with the other two candidates, which would make the comparison unfair.
 */
const COVER_MARGIN = 1.05;
/** The glow's depth in front of the film — what makes it parallax rather than sit flat. */
const GLOW_Z = 1.6;

/** Matches --glow-soft in the dark palette: rgba(180, 200, 220, 0.1). */
const GLOW_COLOR = new THREE.Color(180 / 255, 200 / 255, 220 / 255);
/** The visor anchor the DOM glow and HUD both use: 56% / 41% of the frame. */
const GLOW_ANCHOR = new THREE.Vector2(0.56, 0.41);

/**
 * A soft radial falloff, additively blended. This is the same ambient glow the
 * CSS hero paints — moved onto a plane at its own depth so it parallaxes
 * against the film instead of sitting flat on top of it.
 */
function glowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: GLOW_COLOR },
      uAnchor: { value: GLOW_ANCHOR },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec2 uAnchor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        // vUv is 0..1 bottom-up; the anchor is quoted top-down like the CSS.
        vec2 p = vec2(vUv.x, 1.0 - vUv.y) - uAnchor;
        float d = length(p * vec2(1.0, 1.4));
        float falloff = smoothstep(0.42, 0.0, d);
        gl_FragColor = vec4(uColor, falloff * uOpacity);
      }
    `,
  });
}

interface SceneProps {
  progress: MutableRefObject<number>;
  images: HTMLImageElement[];
  ready: boolean;
  decodeAround: (images: HTMLImageElement[], index: number) => void;
}

/**
 * The film on a plane, a glow plane in front of it, and a camera that moves.
 *
 * Nothing here is reconstructed: the footage stays footage, pixel for pixel, on
 * a screen-aligned plane. What 3D adds is depth the compositing did not have —
 * the glow at its own z, a scroll-driven dolly, and a shallow cursor parallax
 * that separates the two planes.
 */
function Scene({ progress, images, ready, decodeAround }: SceneProps) {
  const { camera, size, invalidate, gl } = useThree();

  const glowRef = useRef<THREE.Mesh>(null);
  const lastIndex = useRef(-1);

  // Allocated once and mutated in place. Re-creating a texture per frame would
  // reallocate GPU memory 24 times a second.
  const texture = useMemo(() => {
    const t = new THREE.Texture();
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    return t;
  }, []);
  const filmMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
    [texture]
  );
  const glow = useMemo(glowMaterial, []);

  // Pointer target and its lerped follower, both hoisted: allocating a vector
  // inside the frame loop is garbage every frame.
  const pointerTarget = useRef(new THREE.Vector2(0, 0));
  const pointer = useRef(new THREE.Vector2(0, 0));

  // Cover the viewport at the base distance, the way object-fit: cover does.
  const cover = useMemo(() => {
    const first = images[0];
    const imageAspect =
      first && first.naturalWidth > 0 ? first.naturalWidth / first.naturalHeight : 16 / 9;
    const fit = (z: number) => {
      const visibleHeight = 2 * (BASE_Z - z) * Math.tan((FOV * Math.PI) / 360);
      const visibleWidth = visibleHeight * (size.width / size.height);
      const width =
        size.width / size.height > imageAspect ? visibleWidth : visibleHeight * imageAspect;
      return { width: width * COVER_MARGIN, height: (width / imageAspect) * COVER_MARGIN };
    };
    return { film: fit(0), glow: fit(GLOW_Z) };
  }, [images, size.width, size.height]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointerTarget.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1
      );
      invalidate();
    };
    const onPointerLeave = () => {
      pointerTarget.current.set(0, 0);
      invalidate();
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [invalidate]);

  // Textures, geometries and materials are not reclaimed by the GC.
  useEffect(
    () => () => {
      texture.dispose();
      filmMaterial.dispose();
      glow.dispose();
      gl.renderLists.dispose();
    },
    [texture, filmMaterial, glow, gl]
  );

  useFrame(() => {
    const p = progress.current ?? 0;

    if (ready && images.length > 0) {
      const filmEnd = size.width >= 720 ? FILM_END_DESKTOP : FILM_END_PHONE;
      const index = frameIndexForProgress(p, filmEnd, images.length);
      if (index !== lastIndex.current) {
        const image = images[index];
        if (image?.complete && image.naturalWidth > 0) {
          lastIndex.current = index;
          texture.image = image;
          texture.needsUpdate = true;
          decodeAround(images, index);
        }
      }
    }

    // Ease the cursor rather than snapping to it — a hard follow reads as a
    // twitch, and the whole point of this offset is that you barely notice it.
    pointer.current.lerp(pointerTarget.current, 0.06);

    camera.position.set(
      pointer.current.x * PARALLAX,
      -pointer.current.y * PARALLAX * 0.6,
      BASE_Z - DOLLY * p
    );
    camera.lookAt(0, 0, 0);

    // The glow arrives with the settled frame, matching the CSS hero's fade.
    glow.uniforms.uOpacity.value += (Math.max(0, p - 0.45) * 1.6 - glow.uniforms.uOpacity.value) * 0.05;

    if (glowRef.current) {
      // Counter-drift: the near plane moves against the film, which is the
      // parallax the whole layer exists to provide.
      glowRef.current.position.x = -pointer.current.x * PARALLAX * 0.35;
      glowRef.current.position.y = pointer.current.y * PARALLAX * 0.2;
    }

    // frameloop="demand" renders only when something asks it to. Both eases
    // above need several frames to converge, so keep asking until they have —
    // otherwise the scene freezes mid-glide the moment scrolling stops.
    const easing =
      pointer.current.distanceToSquared(pointerTarget.current) > 1e-6 ||
      Math.abs(glow.uniforms.uOpacity.value - Math.max(0, p - 0.45) * 1.6) > 1e-3;
    if (easing) invalidate();
  });

  // Draw once the sequence arrives, without waiting for the reader to scroll.
  useEffect(() => {
    if (ready) invalidate();
  }, [ready, invalidate]);

  return (
    <>
      <mesh material={filmMaterial} position={[0, 0, 0]}>
        <planeGeometry args={[cover.film.width, cover.film.height]} />
      </mesh>
      <mesh ref={glowRef} material={glow} position={[0, 0, GLOW_Z]}>
        <planeGeometry args={[cover.glow.width, cover.glow.height]} />
      </mesh>
    </>
  );
}

/** WebGL can be absent, blocked, or exhausted. Ask before mounting a canvas. */
function webglAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

/**
 * Candidate C — the frame sequence rendered through three/R3F.
 *
 * Same assets as candidate B, same scroll pipeline as both others, so the only
 * variable is the renderer and what it can do that a 2D canvas cannot: real
 * depth between the film and its glow, a camera that moves, and a cursor
 * parallax that is genuinely perspective rather than a translated div.
 *
 * Loaded as its own chunk — a visitor on the default hero never downloads three.
 */
export default function AstronautHeroInteractive() {
  const reduced = useReducedMotion();
  const supported = useMemo(webglAvailable, []);
  const decodeAround = useDecodeWindow();

  const frames = useHeroFrames(HERO_FRAMES_NAME, !reduced && supported);
  const scrub = !reduced && supported && !frames.failed;

  const invalidateRef = useRef<(() => void) | null>(null);
  const onRender = useCallback(() => invalidateRef.current?.(), []);
  const { runwayRef, heroRef, progress, settled } = useHeroRunway(scrub, onRender, 'hero-3d');

  const maxDpr = typeof window !== 'undefined' && window.innerWidth < 720 ? 1.5 : 2;

  return (
    <HeroShell
      runwayRef={runwayRef}
      heroRef={heroRef}
      posterSrc={scrub ? START_SRC : POSTER_SRC}
      scrub={scrub}
      settled={settled}
      glow={!scrub}
    >
      {scrub && (
        <div className="hero-canvas" style={{ opacity: frames.ready ? 1 : 0 }}>
          <Canvas
            frameloop="demand"
            dpr={[1, maxDpr]}
            camera={{ fov: FOV, position: [0, 0, BASE_Z] }}
            gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
            onCreated={({ invalidate, gl }) => {
              invalidateRef.current = invalidate;
              gl.setClearAlpha(0);
            }}
          >
            <Scene
              progress={progress}
              images={frames.images}
              ready={frames.ready}
              decodeAround={decodeAround}
            />
          </Canvas>
        </div>
      )}
    </HeroShell>
  );
}
