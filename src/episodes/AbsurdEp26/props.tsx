import React from 'react';
import * as THREE from 'three';
import {MB, M} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {Glow} from '../AbsurdEp8/props';

/** EP26 — the new things only: the fire as a ball (no gravity: a flame has no "up", so it burns round — real microgravity flames do),
 *  cell bars that melt where it touches them (molten drops float off), and the guard's fire extinguisher with its white CO2 jet.
 *  Everything else comes from earlier episodes. */
export type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const ICO1 = new THREE.IcosahedronGeometry(1, 1), ICO2 = new THREE.IcosahedronGeometry(1, 2);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// =====================================================================================================
// THE FIRE BALL: EP17's colours in shells (white-yellow core, orange, a thin blue skin), each shell wobbling 14 times a second.
// r = outer radius; light = point light strength.
// =====================================================================================================
const glass = (c: string, o: number, key: string, back = false) => { const k = 'ep26-fb-' + key; const m = MB(c, k); m.transparent = o < 1; m.opacity = o; m.depthWrite = o >= 1; if (back) m.side = THREE.BackSide; return m; };
export const FireBall: React.FC<{position: V3; t: number; r?: number; k?: number; light?: number; seed?: number}> = ({position, t, r = 0.22, k = 1, light = 1.4, seed = 0}) => {
  if (k <= 0.01) return null; const fr = Math.floor(t * 14) + seed * 17; const w = (i: number) => 1 + 0.08 * (hash(fr + i * 5) - 0.5) * 2;
  return <group position={position} scale={r * k}>
    <group rotation={[t * 1.7 + seed, t * 2.3, t * 1.1]}>
      <mesh geometry={ICO2} scale={[1.0 * w(2), 0.97 * w(3), 1.0 * w(4)]} material={glass('#FF5A14', 0.6, 'outer')} renderOrder={1} />
      <mesh geometry={ICO1} scale={0.74 * w(5)} material={glass('#FFA42A', 0.8, 'mid')} renderOrder={2} />
      <mesh geometry={ICO1} scale={0.44 * w(7)} material={MB('#FFF1B0', 'f3')} />
      {[0, 1, 2, 3, 4, 5].map((i) => { const a = i * 1.047 + t * 3 + seed, b = hash(i + seed) * 2 - 1; const d = 0.9 + 0.12 * hash(fr + i);
        return <mesh key={i} geometry={ICO1} position={[Math.cos(a) * d * Math.sqrt(1 - b * b), b * d, Math.sin(a) * d * Math.sqrt(1 - b * b)]} scale={0.16 + 0.08 * hash(fr + i * 3)} material={MB('#FF7A22', 'f4')} />; })}
    </group>
    <Glow p={[0, 0, 0]} c="#FF7A2A" s={2.4} o={0.22 + 0.05 * hash(fr)} />
    {light > 0 && <pointLight color="#FF9A4A" intensity={light * k * (0.85 + 0.25 * hash(fr))} distance={4.5} decay={1.5} />}
  </group>;
};

// =====================================================================================================
// MELTING BARS: EP1 Cell's 13 bars (x −1.45 + 0.24 i, z 1.5, local to the cell) and its rails. m (0…1) opens a gap round y = gy (half
// height 1.0 · m); heat (0…1) turns the stubs' ends red-orange. Molten drops float off the cut ends and drift (no gravity).
// =====================================================================================================
const steel = () => M('#3A3E42', 0.4, 0.8);
const hot = (h: number) => { const c = new THREE.Color('#3A3E42').lerp(new THREE.Color('#FF7A2A'), h); return MB('#' + c.getHexString(), 'hot'); };
export const MeltBars: React.FC<{t: number; m: number; heat: number; gy?: number; rails?: number[]; seed?: number}> = ({t, m, heat, gy = 1.45, rails = [0.15, 1.2, 2.6], seed = 0}) => {
  const H = 2.8, half = 1.05 * m * m * (3 - 2 * m); const lo = gy - half, hi = gy + half; const hq = Math.round(heat * 8) / 8;
  return <group>
    {Array.from({length: 13}, (_, i) => { const x = -1.45 + i * 0.24; const j = (hash(i * 3 + seed) - 0.5) * 0.25 * m; const a = lo + j, b = hi - j * 0.6;
      if (m <= 0.01) return <mesh key={i} position={[x, H / 2, 1.5]} material={steel()}><cylinderGeometry args={[0.018, 0.018, H, 8]} /></mesh>;
      return <group key={i}>
        {a > 0.02 && <mesh position={[x, a / 2, 1.5]} material={steel()}><cylinderGeometry args={[0.018, 0.018, a, 8]} /></mesh>}
        {b < H - 0.02 && <mesh position={[x, (b + H) / 2, 1.5]} material={steel()}><cylinderGeometry args={[0.018, 0.018, H - b, 8]} /></mesh>}
        {hq > 0.05 && a > 0.02 && <mesh position={[x, a, 1.5]} geometry={ICO1} scale={[0.03, 0.045, 0.03]} material={hot(hq)} />}
        {hq > 0.05 && b < H - 0.02 && <mesh position={[x, b, 1.5]} geometry={ICO1} scale={[0.03, 0.045, 0.03]} material={hot(hq)} />}
      </group>; })}
    {rails.filter((y) => y < lo - 0.03 || y > hi + 0.03 || m <= 0.01).map((y) => <mesh key={y} position={[0, y, 1.5]} material={steel()}><boxGeometry args={[3, 0.05, 0.06]} /></mesh>)}
    <Drops t={t} m={m} heat={hq} gy={gy} seed={seed} />
  </group>;
};
/** the drops: one or two per bar, leaving the cut while m grows, then drifting slowly and cooling from orange to steel */
const Drops: React.FC<{t: number; m: number; heat: number; gy: number; seed: number}> = ({t, m, heat, gy, seed}) => m <= 0.05 ? null : <>{Array.from({length: 18}, (_, i) => {
  const x = -1.45 + (i % 13) * 0.24 + (hash(i * 7 + seed) - 0.5) * 0.1; const k = Math.min(1, m * 1.4 - hash(i * 5 + seed) * 0.3); if (k <= 0) return null;
  const drift = 0.25 * k + 0.05 * Math.sin(t * 0.7 + i); const y = gy + (hash(i * 11 + seed) - 0.5) * 1.6 * m + 0.06 * Math.sin(t * 0.9 + i * 2);
  return <mesh key={i} position={[x + 0.04 * Math.sin(t * 0.5 + i), y, 1.5 + (hash(i * 13 + seed) - 0.3) * drift]} geometry={ICO1} scale={0.018 + 0.016 * hash(i * 17 + seed)} material={hot(Math.max(0.15, heat))} />; })}</>;

// =====================================================================================================
// THE EXTINGUISHER: red bottle (0.5 m), black handle and lever on top, a short hose to a black horn. Origin = bottom centre, the horn
// points along local +x. HORN = the horn mouth in local coordinates (where the jet starts).
// =====================================================================================================
export const HORN: V3 = [0.36, 0.42, 0];
export const Extinguisher: React.FC<{position: V3; quaternion?: THREE.Quaternion; rotation?: V3}> = ({position, quaternion, rotation}) => <group position={position} quaternion={quaternion} rotation={quaternion ? undefined : rotation}>
  <mesh position={[0, 0.25, 0]} material={PM('#C8261E', 'ext')}><cylinderGeometry args={[0.075, 0.075, 0.5, 14]} /></mesh>
  <mesh position={[0, 0.5, 0]} material={PM('#C8261E', 'ext')}><sphereGeometry args={[0.075, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
  <mesh position={[0, 0.25, 0.076]} material={MB('#F2EEE0')}><planeGeometry args={[0.1, 0.16]} /></mesh>
  <mesh position={[0, 0.6, 0]} material={M('#1A1B1E', 0.6)}><boxGeometry args={[0.05, 0.12, 0.05]} /></mesh>
  <mesh position={[0.06, 0.66, 0]} rotation={[0, 0, -0.25]} material={M('#1A1B1E', 0.6)}><boxGeometry args={[0.16, 0.025, 0.04]} /></mesh>
  <mesh position={[0.15, 0.52, 0]} rotation={[0, 0, 0.9]} material={M('#1A1B1E', 0.8)}><cylinderGeometry args={[0.012, 0.012, 0.22, 6]} /></mesh>
  <mesh position={[0.29, 0.43, 0]} rotation={[0, 0, -Math.PI / 2]} material={M('#1A1B1E', 0.6)}><cylinderGeometry args={[0.045, 0.014, 0.16, 10, 1, true]} /></mesh>
</group>;

// =====================================================================================================
// THE CO2 JET: white puffs streaming from `from` along `dir`, widening and fading (a cone of cloud). k = trigger (0 = off).
// =====================================================================================================
const puff = (o: number) => { const m = MB('#EEF3F8', 'puff' + Math.round(o * 10)); m.transparent = true; m.opacity = Math.round(o * 10) / 10; m.depthWrite = false; return m; };
export const Jet26: React.FC<{from: V3; dir: V3; t: number; k: number; len?: number; n?: number}> = ({from, dir, t, k, len = 1.6, n = 26}) => {
  if (k <= 0.01) return null; const d = new THREE.Vector3(...dir).normalize(); const s = new THREE.Vector3(0, 1, 0).cross(d).normalize(); if (s.lengthSq() < 0.1) s.set(1, 0, 0); const u = d.clone().cross(s);
  return <>{Array.from({length: n}, (_, i) => { const ph = ((t * 2.4 + hash(i * 3)) % 1); const L = ph * len * k; const sp = 0.06 + ph * 0.45;
    const a = hash(i * 7) * Math.PI * 2, rr = hash(i * 11) * sp; const p = add(from, [d.x * L + (s.x * Math.cos(a) + u.x * Math.sin(a)) * rr, d.y * L + (s.y * Math.cos(a) + u.y * Math.sin(a)) * rr, d.z * L + (s.z * Math.cos(a) + u.z * Math.sin(a)) * rr]);
    return <mesh key={i} position={p} geometry={ICO1} scale={0.05 + ph * 0.22} material={puff(0.85 * (1 - ph * 0.8))} />; })}</>;
};
export {MB, M, PM, add};
