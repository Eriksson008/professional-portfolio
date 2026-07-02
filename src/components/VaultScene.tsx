import type { CSSProperties } from 'react';
import { heroSystems } from '../data/heroSystems';

/**
 * The 2.5D "system vault" reveal that sits on top of the atmospheric frame
 * backdrop. Everything here is real DOM/SVG driven by scroll `progress` (0..1):
 *
 *   matte vault opens → red light emerges → system cards rise in 3D → the
 *   architecture connects → dashboard panels assemble → scene recedes for the CTA.
 *
 * Purely decorative (aria-hidden); the readable copy lives in ScrollHero's caption.
 */

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Normalize progress within [a,b] to 0..1. */
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Settled architecture positions (percent of the scene box), same order as heroSystems. */
const NODES = [
  { x: 25, y: 30, z: 50 }, // Frontend
  { x: 20, y: 57, z: 80 }, // Backend
  { x: 80, y: 55, z: 60 }, // Cloud
  { x: 75, y: 28, z: 40 }, // Enterprise
  { x: 40, y: 82, z: 20 }, // DevOps
  { x: 65, y: 82, z: 30 }, // Leadership
];

/** Architecture connectors between node indices. */
const LINKS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 3],
  [1, 4],
  [2, 5],
  [4, 5],
];

/** Dashboard tiles that assemble near the end (abstract — no metric claims). */
const DASH_TILES = ['Throughput', 'Availability', 'Latency'];

export function VaultScene({ progress }: { progress: number }) {
  // Phase envelopes across the scroll (synced to the caption stages).
  const lid = easeInOut(seg(progress, 0.03, 0.18)); // vault lid swings open
  const glow = seg(progress, 0.06, 0.3); // red inner light emerges
  const dash = easeOut(seg(progress, 0.6, 0.84)); // dashboard assembles
  const recede = seg(progress, 0.85, 1); // scene settles back for the CTA

  const sceneStyle: CSSProperties = { opacity: 1 - recede * 0.25 };

  return (
    <div className="vault-scene" aria-hidden="true" style={sceneStyle}>
      <div className="vault-3d">
        {/* Red inner glow rising out of the vault */}
        <div
          className="vault__glow"
          style={{
            opacity: glow * (1 - dash * 0.5),
            transform: `translate(-50%, -50%) scale(${lerp(0.55, 1.2, glow)})`,
          }}
        />
        <div
          className="vault__beam"
          style={{ opacity: glow * 0.4 * (1 - dash), ['--beam' as string]: lerp(0.4, 1, glow) } as CSSProperties}
        />

        {/* Vault body + hinged lid */}
        <div className="vault__body">
          <div className="vault__mouth" style={{ ['--glow' as string]: glow } as CSSProperties} />
          <div className="vault__lid" style={{ transform: `rotateX(${lerp(0, -114, lid)}deg)` }} />
        </div>

        {/* Architecture connectors */}
        <svg className="vault__links" viewBox="0 0 100 100" preserveAspectRatio="none">
          {LINKS.map(([a, b], i) => {
            const drawn = seg(progress, 0.44 + i * 0.02, 0.6 + i * 0.02);
            return (
              <line
                key={`${a}-${b}`}
                x1={NODES[a].x}
                y1={NODES[a].y}
                x2={NODES[b].x}
                y2={NODES[b].y}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - drawn}
                style={{ opacity: (0.35 + drawn * 0.65) * (1 - dash * 0.85) }}
              />
            );
          })}
        </svg>

        {/* System cards rising from the vault into the architecture */}
        {heroSystems.map((sys, i) => {
          const node = NODES[i];
          const cp = easeOut(seg(progress, 0.22 + i * 0.028, 0.46 + i * 0.02));
          const style: CSSProperties = {
            left: `${lerp(50, node.x, cp)}%`,
            top: `${lerp(64, node.y, cp)}%`,
            transform: `translate(-50%, -50%) translateZ(${lerp(-70, node.z, cp).toFixed(1)}px) scale(${lerp(0.5, 1, cp).toFixed(3)})`,
            opacity: clamp01(cp * 1.4) * (1 - dash * 0.9),
          };
          return (
            <div className="vault-card" key={sys.area} style={style}>
              <span className="vault-card__area">{sys.area}</span>
              <span className="vault-card__tools">{sys.tools.join(' · ')}</span>
            </div>
          );
        })}

        {/* Dashboard panels assembling from the settled system */}
        <div
          className="vault-dash"
          style={{
            opacity: dash,
            transform: `translate(-50%, -50%) translateZ(${lerp(-30, 24, dash).toFixed(1)}px) scale(${lerp(0.92, 1, dash).toFixed(3)})`,
          }}
        >
          <div className="vdash__head">
            <span className="vdash__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="vdash__title">System Overview</span>
            <span className="vdash__status" aria-hidden="true" />
          </div>
          <div className="vdash__tiles">
            {DASH_TILES.map((label, i) => {
              const t = easeOut(seg(progress, 0.64 + i * 0.04, 0.8 + i * 0.03));
              return (
                <div
                  className="vdash__tile"
                  key={label}
                  style={{ opacity: t, transform: `translateY(${lerp(14, 0, t).toFixed(1)}px)` }}
                >
                  <span className="vdash__tile-label">{label}</span>
                  <span className="vdash__meter" aria-hidden="true">
                    <i style={{ transform: `scaleX(${(0.4 + 0.5 * t).toFixed(2)})` }} />
                  </span>
                </div>
              );
            })}
          </div>
          <svg className="vdash__spark" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points="0,24 18,20 34,22 52,12 70,16 88,6 106,10 120,4"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - easeOut(seg(progress, 0.7, 0.86))}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
