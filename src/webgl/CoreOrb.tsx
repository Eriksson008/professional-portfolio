import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeCircleTexture } from './textures';

interface CoreOrbProps {
  /** 'lite' halves the orbital dust ring. */
  tier: 'full' | 'lite';
}

const FORM_SECONDS = 3;
const WIRE_OPACITY = 0.13;
const RING_OPACITY = 0.6;

/**
 * The hero core: a faint glass/neural orb behind the identity — a low-poly
 * wireframe icosahedron in slow twin-axis rotation, wrapped by a tilted,
 * counter-rotating orbital dust ring. Forms over the first ~3 seconds
 * (scale settles in, opacity ramps) to read as particle dust gathering into
 * structure. Deliberately quiet: it must never compete with the name.
 */
export function CoreOrb({ tier }: CoreOrbProps) {
  const group = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Mesh>(null);
  const ringSpin = useRef<THREE.Group>(null);
  const wireMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const ringMaterial = useRef<THREE.PointsMaterial>(null);
  const sprite = useMemo(() => makeCircleTexture(), []);

  const ringGeometry = useMemo(() => {
    const count = tier === 'full' ? 240 : 110;
    let s = 20260703;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const silver = new THREE.Color(0.72, 0.74, 0.84);
    const ice = new THREE.Color(0.56, 0.85, 0.95);
    const c = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const r = 1.7 + (rand() - 0.5) * 0.36;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (rand() - 0.5) * 0.1;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      c.copy(rand() < 0.22 ? ice : silver).multiplyScalar(0.6 + rand() * 0.4);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [tier]);

  useFrame(({ clock }, delta) => {
    if (wire.current) {
      wire.current.rotation.y += delta * 0.05;
      wire.current.rotation.x += delta * 0.016;
    }
    if (ringSpin.current) ringSpin.current.rotation.y -= delta * 0.045;

    // Formation: dust gathers into structure over the first few seconds.
    const t = Math.min(1, clock.elapsedTime / FORM_SECONDS);
    const eased = 1 - (1 - t) ** 3;
    group.current?.scale.setScalar(1.35 - 0.35 * eased);
    if (wireMaterial.current) wireMaterial.current.opacity = WIRE_OPACITY * eased;
    if (ringMaterial.current) ringMaterial.current.opacity = RING_OPACITY * eased;
  });

  return (
    <group ref={group} position={[0, -0.25, -1]} rotation={[0.3, 0, 0.42]}>
      <mesh ref={wire}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshBasicMaterial
          ref={wireMaterial}
          wireframe
          color="#8f8af4"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <group ref={ringSpin}>
        <points geometry={ringGeometry}>
          <pointsMaterial
            ref={ringMaterial}
            map={sprite}
            vertexColors
            transparent
            opacity={0}
            size={0.035}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  );
}
