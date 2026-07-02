import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleField } from './ParticleField';
import { makeGlowTexture } from './textures';
import type { HeroMotion } from './types';
import type { VisualTier } from '../hooks/useVisualTier';

interface WebGLBackdropProps {
  motionRef: MutableRefObject<HeroMotion>;
  tier: Exclude<VisualTier, 'off'>;
  /** Called once the GL context is live — parent may quiet its SVG star layer. */
  onReady: () => void;
  /** Called if the GL context is lost — parent falls back to the SVG field. */
  onFail: () => void;
}

/** Lerps the camera toward pointer parallax and scroll-driven dolly each frame. */
function Rig({ motionRef }: { motionRef: MutableRefObject<HeroMotion> }) {
  useFrame(({ camera }) => {
    const m = motionRef.current;
    camera.position.x += (m.px * 0.4 - camera.position.x) * 0.045;
    camera.position.y += (-m.py * 0.28 - camera.position.y) * 0.045;
    camera.position.z = 7 - m.progress * 1.4;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/** Soft red core glow behind the identity block, breathing very slowly. */
function CoreGlow() {
  const sprite = useRef<THREE.Sprite>(null);
  const material = useRef<THREE.SpriteMaterial>(null);
  const texture = useMemo(() => makeGlowTexture(), []);
  useFrame(({ clock }) => {
    const breathe = Math.sin(clock.elapsedTime * 0.35);
    sprite.current?.scale.set(7 * (1 + breathe * 0.04), 5.2 * (1 + breathe * 0.04), 1);
    if (material.current) material.current.opacity = 0.14 + breathe * 0.02;
  });
  return (
    <sprite ref={sprite} position={[0, -0.4, -2.5]}>
      <spriteMaterial
        ref={material}
        map={texture}
        color="#e5484d"
        transparent
        opacity={0.14}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

/**
 * Lazy-loaded R3F canvas behind the hero field (this module — and three with
 * it — is its own Vite chunk, never in the main bundle). Purely decorative:
 * all information lives in the DOM/SVG layers above it. Pauses rendering
 * while the hero is off-screen; fades in once the context is created.
 */
export default function WebGLBackdrop({ motionRef, tier, onReady, onFail }: WebGLBackdropProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = wrap.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrap} className={`c-webgl ${ready ? 'is-ready' : ''}`} aria-hidden="true">
      <Canvas
        dpr={tier === 'full' ? [1, 1.75] : 1}
        camera={{ position: [0, 0, 7], fov: 50, near: 0.1, far: 40 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        frameloop={onScreen ? 'always' : 'never'}
        onCreated={({ gl }) => {
          setReady(true);
          onReady();
          gl.domElement.addEventListener('webglcontextlost', onFail);
        }}
      >
        <Rig motionRef={motionRef} />
        <CoreGlow />
        <ParticleField count={tier === 'full' ? 1600 : 650} />
      </Canvas>
    </div>
  );
}
