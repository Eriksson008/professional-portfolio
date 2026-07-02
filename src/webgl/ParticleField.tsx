import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeCircleTexture } from './textures';

interface ParticleFieldProps {
  count: number;
  /** Outer radius of the flattened particle shell, world units. */
  radius?: number;
  /** Fraction of particles tinted red instead of silver. */
  redFraction?: number;
}

const SILVER = new THREE.Color(0.72, 0.76, 0.82);
const RED = new THREE.Color(0.9, 0.3, 0.32);

/**
 * Reusable 3D points cloud: particles in a flattened spherical shell,
 * silver with a sparse red fraction, additive blending, slow constant spin.
 * Deterministic (seeded LCG) so the field never shifts between mounts.
 */
export function ParticleField({ count, radius = 5.2, redFraction = 0.12 }: ParticleFieldProps) {
  const spin = useRef<THREE.Group>(null);
  const sprite = useMemo(() => makeCircleTexture(), []);

  const geometry = useMemo(() => {
    let s = 20260702;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = radius * (0.35 + 0.65 * Math.cbrt(rand()));
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.55; // flatten vertically
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      c.copy(rand() < redFraction ? RED : SILVER).multiplyScalar(0.65 + rand() * 0.35);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count, radius, redFraction]);

  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.02;
  });

  return (
    <group ref={spin}>
      <points geometry={geometry}>
        <pointsMaterial
          map={sprite}
          vertexColors
          transparent
          opacity={0.75}
          size={0.055}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
