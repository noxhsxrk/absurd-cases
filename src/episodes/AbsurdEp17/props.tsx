import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, M, tex, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {label, Glow} from '../AbsurdEp8/props';
import {HANDLE} from './data';

/** EP17 คดีไฟในปาก — the new things. The fire is the wrong suspect (a plain flame, no face); the real culprit is the one chili on the plate,
 *  which is in frame in every shot at the stall and never does anything but lie there. */
export type V3 = [number, number, number];
const G = 9.8;
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x: number) => { const c = cl(x); return c * c * (3 - 2 * c); };
const mixc = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), cl(Math.round(k * 10) / 10)).getHexString();   // 10 steps: the material cache stays small
const CONE = (() => { const g = new THREE.ConeGeometry(1, 1, 6); g.translate(0, 0.5, 0); return g; })();   // base at the origin
const ICO = new THREE.IcosahedronGeometry(1, 0), ICO1 = new THREE.IcosahedronGeometry(1, 1), BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 8);
const UP = new THREE.Vector3(0, 1, 0);

// =====================================================================================================
// THE FIRE (the accused): layered low-poly tongues that flicker 14 times a second. No face, no limbs. position = its base;
// dir = which way it burns (a jet out of his mouth, or straight up on a tray). size 1 ≈ 1 m tall.
// =====================================================================================================
export const Fire: React.FC<{position: V3; t: number; size?: number; k?: number; dir?: V3; seed?: number; light?: number; lean?: number}> = ({position, t, size = 0.3, k = 1, dir, seed = 0, light = 0.4, lean = 0}) => {
  if (k <= 0.01) return null; const fr = Math.floor(t * 14) + seed * 17;
  const q = dir ? new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(...dir).normalize()) : new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -lean);
  return <group position={position} quaternion={q} scale={size * k}>
    <group rotation={[0, 0, Math.sin(t * 9 + seed) * 0.07]}>
      {[0, 1, 2, 3, 4].map((i) => { const h = (0.7 + hash(fr + i * 3) * 0.55) * (i ? 0.62 : 1); const a = i * 1.571 + seed, r = i ? 0.15 : 0; const x = Math.cos(a) * r, z = Math.sin(a) * r, w = i ? 0.13 : 0.2;
        return <group key={i} position={[x, 0, z]} rotation={[z * 0.9, 0, -x * 0.9]}>
          <mesh geometry={CONE} scale={[w, h, w]} material={MB('#FF6A1F', 'f1')} />
          <mesh geometry={CONE} position={[0, 0.02, 0]} scale={[w * 0.62, h * 0.66, w * 0.62]} material={MB('#FFB52E', 'f2')} renderOrder={1} />
          {!i && <mesh geometry={CONE} position={[0, 0.03, 0]} scale={[w * 0.32, h * 0.36, w * 0.32]} material={MB('#FFF1B0', 'f3')} renderOrder={2} />}</group>; })}
      <mesh geometry={ICO} position={[0, 0.12, 0]} scale={[0.24, 0.16, 0.24]} material={MB('#FF6A1F', 'f1')} />
    </group>
    <Glow p={[0, 0.4, 0]} c="#FF8A3A" s={1.9} o={0.24 + 0.06 * hash(fr)} />
    {light > 0 && <pointLight position={[0, 0.4, 0]} color="#FF8A3A" intensity={light * (0.8 + hash(fr) * 0.3)} distance={3.5} decay={1.6} />}
  </group>;
};

// =====================================================================================================
// THE PLATE: som tam on a deep dish, and ONE chili lying on top of it (oversized, bright, the only pure red thing on the table).
// flood 0…1 = the hoses have filled the dish: the liquid rises and pales, the strands spread out, and the chili FLOATS.
// =====================================================================================================
export const PLATE_R = 0.2;
const liquidY = (flood: number) => 0.02 + 0.03 * flood;
/** the chili in plate space: [position, yaw, roll] */
export const chiliPose = (t: number, flood: number): {p: V3; yaw: number; roll: number} => flood < 0.05 ? {p: [0.025, 0.112, 0.02], yaw: 0.5, roll: 0.25}
  : {p: [0.03 + Math.sin(t * 0.7) * 0.03 * flood, lerp(0.112, liquidY(flood) + 0.036, flood) + Math.sin(t * 2.3) * 0.005 * flood, 0.02 + Math.cos(t * 0.55) * 0.03 * flood], yaw: 0.5 + t * 0.3 * flood, roll: 0.25 * (1 - flood) + Math.sin(t * 2.3) * 0.12 * flood};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const Chili: React.FC<{position: V3; yaw?: number; roll?: number; scale?: number}> = ({position, yaw = 0, roll = 0, scale = 1}) => {
  const red = M('#E3211B', 0.3), stem = M('#4E8A2E', 0.7);
  return <group position={position} rotation={[roll, yaw, 0]} scale={scale}>
    <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.012, 0, 0]} material={red} castShadow><cylinderGeometry args={[0.017, 0.015, 0.05, 8]} /></mesh>
    <mesh rotation={[0, 0.16, -Math.PI / 2]} position={[0.043, 0, -0.005]} material={red} castShadow><coneGeometry args={[0.015, 0.07, 8]} /></mesh>
    <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.04, 0, 0]} material={stem}><coneGeometry args={[0.019, 0.014, 8]} /></mesh>
    <mesh rotation={[0, 0.3, Math.PI / 2 + 0.5]} position={[-0.056, 0.007, 0.003]} material={stem}><cylinderGeometry args={[0.004, 0.005, 0.03, 5]} /></mesh>
  </group>;
};
export const SomTam: React.FC<{position: V3; t: number; flood?: number; scale?: number}> = ({position, t, flood = 0, scale = 1}) => {
  const c = chiliPose(t, flood); const ly = liquidY(flood);
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.02, 0]} material={PM('#F1EEE4', 'dish')} castShadow receiveShadow><cylinderGeometry args={[PLATE_R, 0.13, 0.04, 20]} /></mesh>
    <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={M('#3E6FA8', 0.5)}><torusGeometry args={[PLATE_R - 0.004, 0.006, 6, 28]} /></mesh>
    <mesh position={[0, ly + 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MB(mixc('#C8632A', '#B5D3DA', flood * 0.85), 'juice')}><circleGeometry args={[0.15 + 0.045 * flood, 20]} /></mesh>
    {Array.from({length: 52}, (_, i) => { const a = hash(i) * 6.283, r = Math.sqrt(hash(i * 3)) * 0.105 * (1 + 0.45 * flood), h = (1 - r / 0.16) * 0.075 * (1 - 0.8 * flood) * (0.5 + hash(i * 5));
      const kind = i % 7 === 0 ? 2 : i % 5 === 0 ? 1 : 0; const bob = flood * Math.sin(t * 2 + i) * 0.003;
      return <mesh key={i} geometry={BOX} position={[Math.cos(a) * r, Math.max(ly + 0.024, 0.035 + h) + bob, Math.sin(a) * r]} rotation={[(hash(i * 7) - 0.5) * 0.7 * (1 - flood), hash(i * 11) * 6.283 + flood * Math.sin(t * 0.4 + i) * 0.3, (hash(i * 13) - 0.5) * 0.7 * (1 - flood)]}
        scale={kind === 2 ? [0.075, 0.009, 0.009] : [0.07 + hash(i * 2) * 0.04, 0.005, 0.008]} material={PM(['#EDE5B4', '#F0903A', '#6F9A42'][kind], 'st')} />; })}
    {[0, 1, 2].map((i) => { const a = 0.9 + i * 2.2, r = 0.085 * (1 + 0.5 * flood); return <mesh key={i} geometry={ICO1} position={[Math.cos(a) * r, lerp(0.07, ly + 0.03, flood) + flood * Math.sin(t * 1.9 + i * 2) * 0.004, Math.sin(a) * r]} rotation={[0.4, a, 0]} scale={[0.024, 0.014, 0.019]} material={M('#D8452E', 0.5)} />; })}
    <mesh geometry={ICO1} position={[-0.11 * (1 + 0.3 * flood), lerp(0.06, ly + 0.03, flood), 0.06]} rotation={[0, 0.6, 0.3]} scale={[0.028, 0.014, 0.018]} material={M('#8DB548', 0.6)} />
    {Array.from({length: 9}, (_, i) => { const a = hash(i + 40) * 6.283, r = 0.03 + hash(i * 3 + 40) * 0.09 * (1 + 0.4 * flood); return <mesh key={i} geometry={BOX} position={[Math.cos(a) * r, lerp(0.045 + (1 - r / 0.14) * 0.06, ly + 0.026, flood), Math.sin(a) * r]} rotation={[0, a, 0]} scale={[0.011, 0.007, 0.008]} material={PM('#C99A5B', 'nut')} />; })}
    {flood > 0.6 && [0, 1].map((i) => { const u = (t * 0.55 + i * 0.5) % 1; return <mesh key={i} position={[c.p[0], ly + 0.0225, c.p[2]]} rotation={[-Math.PI / 2, 0, 0]} material={MB('#F2FBFF', 'ripple')} visible={u < 0.85}><ringGeometry args={[0.07 + u * 0.06, 0.074 + u * 0.06, 24]} /></mesh>; })}
    <Chili position={c.p} yaw={c.yaw} roll={c.roll} scale={1.25} />
  </group>;
};

// =====================================================================================================
// THE STALL FURNITURE: a folding steel table, a red plastic stool, the things on the table; his fork.
// =====================================================================================================
export const TABLE_H = 0.72;
export const Table: React.FC<{position: V3}> = ({position}) => { const steel = M('#C3C8CC', 0.35, 0.55), leg = M('#8F969B', 0.4, 0.7);
  return <group position={position}>
    <mesh position={[0, TABLE_H - 0.015, 0]} material={steel} castShadow receiveShadow><boxGeometry args={[0.78, 0.03, 0.72]} /></mesh>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => <mesh key={i} position={[x * 0.34, (TABLE_H - 0.03) / 2, z * 0.31]} material={leg} castShadow><boxGeometry args={[0.03, TABLE_H - 0.03, 0.03]} /></mesh>)}
    {/* condiment caddy, tissue box, a glass of water */}
    <group position={[-0.27, TABLE_H, 0.2]}>{[[0, 0, '#C8402E'], [0.07, 0, '#E9E2D0'], [0, 0.07, '#7A4A22'], [0.07, 0.07, '#D9B13B']].map(([x, z, c], i) => <mesh key={i} position={[x as number, 0.035, z as number]} material={PM(c as string, 'jar')} castShadow><cylinderGeometry args={[0.026, 0.026, 0.07, 8]} /></mesh>)}
      <mesh position={[0.035, 0.008, 0.035]} material={M('#9CA3A8', 0.4, 0.7)}><boxGeometry args={[0.17, 0.016, 0.17]} /></mesh></group>
    <mesh position={[0.27, TABLE_H + 0.04, 0.22]} rotation={[0, 0.3, 0]} material={PM('#E88FA6', 'tissue')} castShadow><boxGeometry args={[0.11, 0.08, 0.11]} /></mesh>
    <mesh position={[0.27, TABLE_H + 0.06, -0.12]} material={M('#DCEFF5', 0.1, 0, {transparent: true, opacity: 0.6}, 'glass')}><cylinderGeometry args={[0.035, 0.03, 0.12, 10]} /></mesh>
  </group>; };
export const Stool: React.FC<{position: V3}> = ({position}) => { const m = PM('#D5362C', 'stool');
  return <group position={position}><mesh position={[0, 0.44, 0]} material={m} castShadow><cylinderGeometry args={[0.17, 0.17, 0.035, 10]} /></mesh>
    {[0, 1, 2, 3].map((i) => { const a = i * 1.571 + 0.785; return <mesh key={i} position={[Math.cos(a) * 0.15, 0.21, Math.sin(a) * 0.15]} rotation={[Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14]} material={m} castShadow><boxGeometry args={[0.035, 0.43, 0.035]} /></mesh>; })}</group>; };
/** a fork from the fist (a) to its tip (b); load = a mouthful of strands on it */
export const Fork: React.FC<{a: V3; b: V3; load?: number}> = ({a, b, load = 0}) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()); const steel = M('#D4D8DB', 0.25, 0.8);
  return <group position={a} quaternion={q}>
    <mesh position={[0, L * 0.4, 0]} material={steel} castShadow><boxGeometry args={[0.012, L * 0.8, 0.005]} /></mesh>
    {[-1, 0, 1].map((s) => <mesh key={s} position={[s * 0.008, L * 0.9, 0]} material={steel}><boxGeometry args={[0.004, L * 0.2, 0.004]} /></mesh>)}
    {load > 0.05 && <group position={[0, L, 0]} scale={load}>{Array.from({length: 9}, (_, i) => <mesh key={i} geometry={BOX} position={[(hash(i) - 0.5) * 0.03, (hash(i * 3) - 0.3) * 0.03, (hash(i * 5) - 0.5) * 0.03]} rotation={[hash(i) * 3, hash(i * 2) * 3, hash(i * 7) * 3]} scale={[0.06, 0.005, 0.008]} material={PM(i % 4 ? '#EDE5B4' : '#F0903A', 'st')} />)}</group>}
  </group>; };

// =====================================================================================================
// THE FIRE TRUCK (faces local +x). 6.4 m long. nozzle() = the tip of its roof monitor in the world.
// =====================================================================================================
export const nozzle = (p: V3, yaw: number): V3 => [p[0] + Math.cos(yaw) * 0.95, p[1] + 3.05, p[2] - Math.sin(yaw) * 0.95];
export const FireTruck: React.FC<{position: V3; yaw?: number; pitch?: number; t: number; seed?: number}> = ({position, yaw = 0, pitch = 0, t, seed = 0}) => {
  const red = PM('#C8261F', 'ft'), dark = M('#1A1D21', 0.8), glass = M('#1A2330', 0.15, 0.4), steel = M('#B9BFC4', 0.35, 0.7), white = PM('#F1EEE4', 'ftw');
  const ph = Math.floor(t * 7 + seed * 0.6) % 2; const side = label('ep17-ft', 768, 192, '#F1EEE4', '#C8261F', ['ดับเพลิง ' + HANDLE], 84);
  return <group position={position} rotation={[0, yaw, pitch, 'YXZ'] as any}>
    <mesh position={[0, 0.55, 0]} material={dark} castShadow><boxGeometry args={[6.4, 0.3, 2.0]} /></mesh>
    <mesh position={[-0.75, 1.62, 0]} material={red} castShadow><boxGeometry args={[4.9, 1.85, 2.1]} /></mesh>
    <mesh position={[2.45, 1.5, 0]} material={red} castShadow><boxGeometry args={[1.5, 1.6, 2.1]} /></mesh>
    <mesh position={[3.205, 1.75, 0]} rotation={[0, Math.PI / 2, 0]} material={glass}><planeGeometry args={[1.8, 0.75]} /></mesh>
    {[-1, 1].map((s) => <React.Fragment key={s}>
      <mesh position={[2.5, 1.75, s * 1.055]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={glass}><planeGeometry args={[1.0, 0.7]} /></mesh>
      <mesh position={[-0.75, 1.5, s * 1.056]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={side}><planeGeometry args={[3.4, 0.85]} /></mesh>
      <mesh position={[-0.75, 0.86, s * 1.056]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={white}><planeGeometry args={[4.9, 0.12]} /></mesh>
      {[2.3, -1.3, -2.5].map((x) => <mesh key={x} position={[x, 0.5, s * 0.92]} rotation={[Math.PI / 2, 0, 0]} material={dark} castShadow><cylinderGeometry args={[0.5, 0.5, 0.34, 12]} /></mesh>)}
      <mesh position={[3.21, 0.95, s * 0.7]} rotation={[0, Math.PI / 2, 0]} material={MB('#FFE9A8')}><circleGeometry args={[0.14, 10]} /></mesh>
      <mesh position={[2.45, 2.38, s * 0.55]} material={MB((s > 0 ? ph : 1 - ph) ? '#FF3B30' : '#5A1512')}><boxGeometry args={[0.5, 0.16, 0.5]} /></mesh>
      <mesh position={[-0.9, 2.66, s * 0.3]} material={steel} castShadow><boxGeometry args={[4.4, 0.06, 0.06]} /></mesh>
    </React.Fragment>)}
    <mesh position={[3.24, 0.72, 0]} material={steel}><boxGeometry args={[0.1, 0.22, 2.1]} /></mesh>
    {Array.from({length: 9}, (_, i) => <mesh key={i} position={[-2.9 + i * 0.5, 2.66, 0]} material={steel}><boxGeometry args={[0.05, 0.05, 0.6]} /></mesh>)}
    {/* the roof monitor: a short cannon tilted up over the cab */}
    <mesh position={[0.6, 2.7, 0]} material={dark}><cylinderGeometry args={[0.16, 0.2, 0.3, 8]} /></mesh>
    <mesh position={[0.78, 2.93, 0]} rotation={[0, 0, -0.9]} material={steel} castShadow><cylinderGeometry args={[0.07, 0.1, 0.55, 8]} /></mesh>
    <Glow p={[2.45, 2.45, (ph ? 1 : -1) * 0.55]} c="#FF3B30" s={1.6} o={0.5} />
  </group>;
};

// =====================================================================================================
// WATER. Jet: an arc from a to b; the water front leaves at t0 and takes `fly` s, the tail leaves at t1. Splash: where it lands.
// =====================================================================================================
export const Jet: React.FC<{a: V3; b: V3; t: number; t0: number; t1: number; lift?: number; r?: number; fly?: number; seed?: number}> = ({a, b, t, t0, t1, lift = 1.5, r = 0.05, fly = 0.2, seed = 0}) => {
  const s1 = cl((t - t0) / fly), s0 = cl((t - t1) / fly); if (s1 <= 0 || s0 >= 1) return null;
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), C = A.clone().add(B).multiplyScalar(0.5).add(new THREE.Vector3(0, lift, 0));
  const at = (s: number) => { const u = 1 - s; const p = A.clone().multiplyScalar(u * u).add(C.clone().multiplyScalar(2 * u * s)).add(B.clone().multiplyScalar(s * s));
    const w = Math.sin(s * Math.PI) * 0.03; p.x += Math.sin(t * 40 + s * 20 + seed) * w; p.y += Math.cos(t * 33 + s * 17 + seed) * w; return p; };
  const N = 12; const out: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N; if (u1 <= s0 || u0 >= s1) continue; const p = at(Math.max(u0, s0)), q = at(Math.min(u1, s1)), d = q.clone().sub(p), len = d.length(); if (len < 1e-4) continue;
    const qt = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()); const mid = p.clone().add(q).multiplyScalar(0.5).toArray() as V3; const rr = r * (0.8 + 0.5 * u0);
    out.push(<mesh key={i} geometry={CYL} position={mid} quaternion={qt} scale={[rr, len * 1.04, rr]} material={MB('#9FD6EE', 'jet')} />, <mesh key={'c' + i} geometry={CYL} position={mid} quaternion={qt} scale={[rr * 0.5, len * 1.05, rr * 0.5]} material={MB('#F2FBFF', 'jetc')} renderOrder={1} />); }
  return <>{out}</>;
};
export const Splash: React.FC<{at: V3; t: number; t0: number; t1: number; n?: number; power?: number}> = ({at, t, t0, t1, n = 36, power = 1}) => { if (t < t0 || t > t1 + 0.6) return null;
  return <group position={at}>{Array.from({length: n}, (_, i) => { const per = 0.45 + hash(i) * 0.25; const born = t0 + i * 0.013 + Math.floor((t - t0 - i * 0.013) / per) * per; if (born < t0 || born > t1) return null; const u = t - born;
    const a = hash(i * 3 + born) * 6.283, v = (1.2 + hash(i * 5) * 2.2) * power, vy = (1.5 + hash(i * 7 + born) * 2.5) * power; const s = 0.018 + hash(i * 9) * 0.03;
    return <mesh key={i} geometry={ICO} position={[Math.cos(a) * v * u, vy * u - 0.5 * G * u * u, Math.sin(a) * v * u * 0.7]} scale={s} material={MB(i % 3 ? '#BFE6F5' : '#F2FBFF', 'drop')} />; })}
    {t < t1 + 0.15 && <Glow p={[0, 0, 0.1]} c="#DDF3FF" s={1.1 * power} o={0.35} />}</group>; };
/** water running off someone who has just been hosed: drops falling from `from` to `floor` */
export const Drips: React.FC<{from: V3; floor: number; t: number; t0: number; n?: number; spread?: number}> = ({from, floor, t, t0, n = 7, spread = 0.14}) => <>{Array.from({length: n}, (_, i) => { const per = 0.55 + hash(i * 3) * 0.5; const u = ((t - t0 + hash(i) * per) % per + per) % per; if (t < t0) return null;
  const y = from[1] - (hash(i * 5) * 0.12) - 0.5 * G * u * u; if (y < floor) return null;
  return <mesh key={i} geometry={ICO} position={[from[0] + (hash(i * 7) - 0.5) * spread * 2, y, from[2] + (hash(i * 11) - 0.5) * spread]} scale={[0.008, 0.016, 0.008]} material={MB('#BFE6F5', 'drop')} />; })}</>;

// =====================================================================================================
// THE CUFFS THAT MELT: steel rings (EP1 proportions); heat 0…1 turns them orange-white, melt 0…1 sags them and they run off in drops.
// Puddle = what is left on the road. Marker = a numbered evidence tent beside each puddle (three of them: the count is on screen).
// =====================================================================================================
export const HotCuffs: React.FC<{position: V3; rotation?: V3; size?: number; k?: number; heat?: number; melt?: number; t: number}> = ({position, rotation, size = 4, k = 1, heat = 0, melt = 0, t}) => {
  if (k <= 0.01 || melt >= 0.99) return null; const r = 0.024 * size; const m = heat < 0.06 ? M('#F3F3F0', 0.18, 0.35) : MB(mixc('#E9E4DA', '#FF8A1E', heat), 'hot');
  return <group position={[position[0], position[1] - melt * r * 1.6, position[2]]} rotation={rotation} scale={k}>
    <group scale={[1 + melt * 0.5, 1 - melt * 0.82, 1 + melt * 0.2]}>
      {[-1, 1].map((s) => <group key={s} position={[s * r * 1.45, 0, 0]} rotation={[0, 0, s * melt * 0.5]}><mesh material={m} castShadow><torusGeometry args={[r, r * 0.16, 8, 20]} /></mesh>
        <mesh position={[-s * r * 0.95, 0, 0]} material={m}><boxGeometry args={[r * 0.45, r * 0.5, r * 0.34]} /></mesh></group>)}
      {[-0.25, 0.25].map((x) => <mesh key={x} position={[x * r, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m}><torusGeometry args={[r * 0.2, r * 0.07, 6, 10]} /></mesh>)}
    </group>
    {heat > 0.3 && <Glow p={[0, 0, 0.02]} c="#FF8A1E" s={r * 9} o={0.35 * heat} />}
    {melt > 0.02 && Array.from({length: 7}, (_, i) => { const per = 0.3 + hash(i) * 0.2; const u = ((t + hash(i * 3) * per) % per); return <mesh key={i} geometry={ICO} position={[(hash(i * 5) - 0.5) * r * 4.5, -r * 0.6 - 0.5 * G * u * u, 0]} scale={[r * 0.13, r * 0.26, r * 0.13]} material={MB('#FFB54A', 'dripm')} />; })}
  </group>;
};
export const Puddle: React.FC<{position: V3; k: number; hot?: number; r?: number; seed?: number}> = ({position, k, hot = 0, r = 0.2, seed = 0}) => k <= 0.01 ? null : <group position={position}>
  {[0, 1, 2, 3].map((i) => { const a = hash(i + seed) * 6.283, d = i ? r * 0.5 : 0; return <mesh key={i} position={[Math.cos(a) * d, 0.004 + i * 0.0006, Math.sin(a) * d]} rotation={[-Math.PI / 2, 0, 0]} scale={k} material={MB(i ? mixc('#C9CED3', '#FF9A3A', hot) : mixc('#E6E9EC', '#FFB04A', hot), 'pud')}><circleGeometry args={[i ? r * (0.45 + hash(i * 3 + seed) * 0.25) : r, 14]} /></mesh>; })}
  {hot > 0.15 && <Glow p={[0, 0.05, 0]} c="#FF8A1E" s={r * 5} o={0.3 * hot} />}
</group>;
export const Marker: React.FC<{position: V3; n: number; k?: number; yaw?: number; /** how far each face leans back from upright (rad) */ a?: number}> = ({position, n, k = 1, yaw = 0, a = 0.42}) => k <= 0.01 ? null : <group position={position} rotation={[0, yaw, 0]} scale={k}>
  {[-1, 1].map((s) => <mesh key={s} position={[0, 0.095 * Math.cos(a), s * 0.095 * Math.sin(a)]} rotation={[-s * a, s > 0 ? 0 : Math.PI, 0]} material={s > 0 ? label('ep17-mk' + n, 256, 256, '#F2C81E', '#16181B', [String(n)], 190) : MB('#F2C81E', 'mk')} castShadow><planeGeometry args={[0.16, 0.19]} /></mesh>)}
</group>;

// =====================================================================================================
// THE CASE FILE that it burns: the flame side (−x) goes first. burn 0…1 = how far the burning edge has crossed it.
// What is left of the cover keeps its print (the texture is cropped, not squeezed); behind the edge there is only ash.
// =====================================================================================================
export const FOLDER = {w: 0.34, d: 0.44};
const folderTex = () => tex('ep17-folder', 384, 512, (g) => {
  g.fillStyle = '#D9B777'; g.fillRect(0, 0, 384, 512); g.strokeStyle = '#8A6A34'; g.lineWidth = 6; g.strokeRect(14, 14, 356, 484);
  g.fillStyle = '#2B1F12'; g.textAlign = 'center'; g.font = F(700, 46); g.fillText('สำนวนคดี', 192, 84); g.font = F(700, 104); g.fillText('017', 192, 196);
  g.fillStyle = '#F4EAD0'; g.fillRect(40, 232, 304, 150); g.fillStyle = '#2B1F12'; g.font = F(600, 30); g.fillText('ข้อหา', 192, 272); g.font = F(700, 52); g.fillStyle = '#B0302E'; g.fillText('วางเพลิง', 192, 328);
  g.fillStyle = '#2B1F12'; g.font = F(500, 26); g.fillText('ผู้ต้องหา: ไฟ', 192, 368); g.font = F(500, 24); g.fillText(HANDLE, 192, 430);
  g.save(); g.translate(292, 452); g.rotate(-0.25); g.strokeStyle = '#B0302E'; g.lineWidth = 5; g.strokeRect(-52, -24, 104, 48); g.fillStyle = '#B0302E'; g.font = F(700, 30); g.fillText('ลับ', 0, 11); g.restore();
});
export const BurnFolder: React.FC<{position: V3; yaw?: number; burn: number; t: number}> = ({position, yaw = 0, burn, t}) => {
  const map = useMemo(() => { const m = folderTex().clone(); m.needsUpdate = true; return m; }, []); const mat = useMemo(() => new THREE.MeshBasicMaterial({map, toneMapped: false}), [map]);
  const b = cl(burn), W = FOLDER.w, D = FOLDER.d, left = W * (1 - b); map.repeat.set(1 - b, 1); map.offset.set(b, 0);
  const edge = -W / 2 + W * b;   // x of the burning edge
  return <group position={position} rotation={[0, yaw, 0]}>
    {b < 0.995 && <group position={[edge + left / 2, 0, 0]}><mesh position={[0, 0.008, 0]} material={M('#C9A86A', 0.9)} castShadow receiveShadow><boxGeometry args={[left, 0.016, D]} /></mesh>
      <mesh position={[0, 0.0166, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat}><planeGeometry args={[left, D]} /></mesh></group>}
    {b > 0.01 && b < 0.995 && <><mesh position={[edge + 0.012, 0.0172, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MB('#1C1410')}><planeGeometry args={[0.03, D]} /></mesh>
      <mesh position={[edge - 0.002, 0.0176, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MB('#FF8A2A')}><planeGeometry args={[0.008, D]} /></mesh>
      {[-0.32, 0, 0.32].map((z, i) => <Fire key={i} position={[edge + 0.01, 0.015, z * D]} t={t} size={0.2 + 0.05 * Math.sin(b * 9 + i)} seed={i + 3} light={i === 1 ? 0.8 : 0} />)}</>}
    {Array.from({length: 26}, (_, i) => { const x = -W / 2 + hash(i) * W; if (x > edge - 0.01) return null; const age = (edge - x) / W;
      return <mesh key={i} geometry={BOX} position={[x, 0.004 + hash(i * 3) * 0.006, (hash(i * 5) - 0.5) * D]} rotation={[0, hash(i * 7) * 3, (hash(i * 9) - 0.5) * 0.5]} scale={[0.03 + hash(i * 2) * 0.04, 0.003, 0.02 + hash(i * 4) * 0.03]} material={MB(age < 0.12 && i % 3 === 0 ? '#C2551A' : i % 2 ? '#1E1C1A' : '#3A3734', 'ash')} />; })}
  </group>;
};

// =====================================================================================================
// THE COLD CELL: a fridge standing in a prison cell. door 0 = shut, 1 = wide open (hinge on its left edge, swings to the camera side).
// glow = firelight from inside (through the open door, then only the crack); frost creeps over the door once it is shut.
// =====================================================================================================
export const ICEBOX = {w: 0.86, h: 1.75, d: 0.72, shelf: 0.86};
export const doorEdge = (position: V3, door: number): V3 => { const a = -door * 1.9; return [position[0] - ICEBOX.w / 2 + Math.cos(a) * ICEBOX.w * 0.92, position[1] + 1.0, position[2] + ICEBOX.d / 2 - Math.sin(a) * ICEBOX.w * 0.92 + 0.06]; };
export const Icebox: React.FC<{position: V3; door: number; glow?: number; frost?: number}> = ({position, door, glow = 0, frost = 0}) => {
  const {w: W, h: H, d: D} = ICEBOX, th = 0.04; const body = PM('#DADDD6', 'ice'), trim = M('#8F969B', 0.4, 0.6);
  const dial = label('ep17-dial' + (frost > 0.5 ? 1 : 0), 256, 128, '#10161D', frost > 0.5 ? '#7FD0FF' : '#E6E7CF', [frost > 0.5 ? '-18°C' : '4°C'], 78);
  return <group position={position}>
    <mesh position={[0, H / 2, -D / 2]} material={body} castShadow><boxGeometry args={[W, H, th]} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * (W / 2 - th / 2), H / 2, 0]} material={body} castShadow><boxGeometry args={[th, H, D]} /></mesh>)}
    <mesh position={[0, H - th / 2, 0]} material={body} castShadow><boxGeometry args={[W, th, D]} /></mesh><mesh position={[0, th / 2, 0]} material={body}><boxGeometry args={[W, th, D]} /></mesh>
    <mesh position={[0, H / 2, -D / 2 + th / 2 + 0.002]} material={MB(mixc('#EAF4F8', '#FFC58A', glow * 0.8), 'lining')}><planeGeometry args={[W - 2 * th, H - 2 * th]} /></mesh>
    <mesh position={[0, ICEBOX.shelf, 0]} material={M('#C9D3D8', 0.3, 0.3)}><boxGeometry args={[W - 2 * th, 0.02, D - 0.08]} /></mesh>
    <group position={[-W / 2, 0, D / 2]} rotation={[0, -door * 1.9, 0]}>
      <mesh position={[W / 2, H / 2, 0.03]} material={frost > 0.05 ? PM(mixc('#DADDD6', '#EEF8FF', frost), 'iced') : body} castShadow><boxGeometry args={[W, H, 0.06]} /></mesh>
      <mesh position={[W - 0.08, H * 0.6, 0.085]} material={trim}><boxGeometry args={[0.035, 0.46, 0.04]} /></mesh>
      <mesh position={[W * 0.42, H * 0.82, 0.062]} material={dial}><planeGeometry args={[0.3, 0.15]} /></mesh>
      {/* a padlock on the handle side */}
      <mesh position={[W - 0.08, H * 0.4, 0.09]} material={M('#C9A13B', 0.35, 0.7)}><boxGeometry args={[0.09, 0.08, 0.035]} /></mesh>
      <mesh position={[W - 0.08, H * 0.4 + 0.055, 0.09]} material={trim}><torusGeometry args={[0.028, 0.008, 6, 12, Math.PI]} /></mesh>
      {frost > 0.05 && Array.from({length: 14}, (_, i) => <mesh key={i} geometry={ICO} position={[0.06 + hash(i) * (W - 0.12), 0.1 + hash(i * 3) * (H - 0.2), 0.064]} scale={[0.03 + hash(i * 5) * 0.05, 0.02 + hash(i * 7) * 0.04, 0.004]} material={MB('#F4FBFF', 'frost')} visible={hash(i * 9) < frost} />)}
    </group>
    {glow > 0.02 && door < 0.08 && <mesh position={[W / 2 - 0.01, H / 2, D / 2 + 0.035]} material={MB('#FF9A3A', 'crack')}><boxGeometry args={[0.012, H * 0.92 * glow, 0.01]} /></mesh>}
  </group>;
};

/** long steel tongs from the fist (a) to the tip (b); open 0…1 */
export const Tongs17: React.FC<{a: V3; b: V3; open?: number}> = ({a, b, open = 0}) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()); const steel = M('#D4D9DD', 0.3, 0.6); const g = 0.016 + open * 0.07;
  return <group position={a} quaternion={q}>{[-1, 1].map((s) => <mesh key={s} position={[s * g * 0.5, L / 2 - 0.03, 0]} rotation={[0, 0, s * g * 0.5 / L]} material={steel} castShadow><boxGeometry args={[0.014, L + 0.06, 0.02]} /></mesh>)}
    <mesh position={[0, -0.06, 0]} material={M('#2B3033', 0.6)}><boxGeometry args={[0.04, 0.035, 0.028]} /></mesh></group>; };
