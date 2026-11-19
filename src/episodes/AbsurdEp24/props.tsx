import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, M} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';

/** EP24 — the new things only: the hole the quake knocks in the back wall of cell 22 (night sky and stars through it), the rubble,
 *  a hairline crack on the wall of 24 that the Earth was aiming at, gravity's red arrow (EP16's vector, out of its cuffs), and the
 *  black cloak lying where the "new prisoner" stood. Everything else comes from earlier episodes. */
export type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// =====================================================================================================
// THE HOLE: a jagged opening in a wall plane (faces +z), centre c, radius r, grown by k (0 = intact). Night sky behind, a few stars,
// broken edge in raw concrete grey.
// =====================================================================================================
const holeShape = (r: number, seed: number, grow = 1.0) => { const s = new THREE.Shape(); const n = 14;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; const rr = r * grow * (0.72 + 0.4 * hash(i * 3 + seed)); const p = [Math.cos(a) * rr * 1.15, Math.sin(a) * rr];
    if (i === 0) s.moveTo(p[0], p[1]); else s.lineTo(p[0], p[1]); }
  return s; };
export const WallHole: React.FC<{c: V3; r: number; k: number; seed?: number; yaw?: number}> = ({c, r, k, seed = 3, yaw = 0}) => {
  const geo = useMemo(() => ({rim: new THREE.ShapeGeometry(holeShape(r * 1.12, seed)), sky: new THREE.ShapeGeometry(holeShape(r, seed))}), [r, seed]);
  if (k <= 0.01) return null;
  return <group position={c} rotation={[0, yaw, 0]} scale={[k, k, 1]}>
    <mesh geometry={geo.rim} material={M('#6E716B', 0.95)} position={[0, 0, 0.004]} />
    <mesh geometry={geo.sky} material={MB('#141C33')} position={[0, 0, 0.008]} />
    {Array.from({length: 9}, (_, i) => <mesh key={i} position={[(hash(i * 5 + seed) - 0.5) * r * 1.4, (hash(i * 7 + seed) - 0.5) * r * 1.2, 0.012]} material={MB('#F4EFD8')}>
      <circleGeometry args={[0.012 + 0.012 * hash(i), 6]} /></mesh>)}
  </group>;
};

// =====================================================================================================
// RUBBLE: concrete chunks, scattered on a floor patch (centre, size). Each chunk floats by `lift` (own height and spin).
// =====================================================================================================
export const Rubble: React.FC<{center: V3; size: [number, number]; n?: number; k?: number; lift?: number; t: number; seed?: number}> = ({center, size, n = 16, k = 1, lift = 0, t, seed = 0}) =>
  k <= 0.01 ? null : <group position={center}>{Array.from({length: n}, (_, i) => { const j = i + seed * 31; const s = 0.07 + hash(j * 2) * 0.16;
    const up = lift * (0.4 + hash(j * 3) * 1.6) + lift * 0.05 * Math.sin(t * 1.3 + j);
    return <mesh key={i} material={PM(i % 3 ? '#8F928A' : '#7A7D76', 'rubble')} castShadow position={[(hash(j) - 0.5) * size[0], s * 0.4 + up, (hash(j * 5) - 0.5) * size[1]]}
      rotation={[hash(j * 7) * 3 + lift * t * 0.4 * (hash(j) - 0.5), hash(j * 9) * 3, hash(j * 11) * 3]} scale={k}><boxGeometry args={[s, s * 0.7, s * 0.9]} /></mesh>; })}</group>;

// =====================================================================================================
// HAIRLINE CRACK on a wall (faces +x): a zig-zag of thin dark bars from a point, length grown by k.
// =====================================================================================================
export const WallCrack: React.FC<{at: V3; k: number; len?: number; seed?: number}> = ({at, k, len = 1.1, seed = 2}) => {
  if (k <= 0.01) return null; const n = 7; const pts: [number, number][] = [[0, 0]];
  for (let i = 1; i <= n; i++) pts.push([pts[i - 1][0] + (hash(i * 3 + seed) - 0.5) * 0.22, pts[i - 1][1] - len / n]);
  const m = Math.max(1, Math.round(n * k));
  return <group position={at} rotation={[0, Math.PI / 2, 0]}>{pts.slice(1, m + 1).map((p, i) => { const a = pts[i]; const dx = p[0] - a[0], dy = p[1] - a[1];
    return <mesh key={i} position={[(a[0] + p[0]) / 2, (a[1] + p[1]) / 2, 0.006]} rotation={[0, 0, Math.atan2(dy, dx)]} material={MB('#2A2C2A')}><planeGeometry args={[Math.hypot(dx, dy) + 0.02, 0.035]} /></mesh>; })}</group>;
};

// =====================================================================================================
// GRAVITY'S ARROW: EP16's red vector, pointing down (shaft 1.1 m), on its own so it can leave its cuffs.
// =====================================================================================================
export const GravityArrow: React.FC<{position: V3; s?: number; tilt?: number}> = ({position, s = 1, tilt = 0}) => <group position={position} scale={s} rotation={[0, 0, tilt]}>
  <mesh position={[0, 0.2, 0]} material={PM('#C8301F', 'vec')} castShadow><cylinderGeometry args={[0.05, 0.05, 1.1, 10]} /></mesh>
  <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]} material={PM('#C8301F', 'vec')} castShadow><coneGeometry args={[0.12, 0.34, 10]} /></mesh></group>;

// =====================================================================================================
// THE CLOAK, dropped: a black heap of cloth (k 0 = still standing as the hood, 1 = on the floor).
// =====================================================================================================
const ink = new THREE.MeshLambertMaterial({color: '#0B0D12', flatShading: true});
export const Cloak: React.FC<{position: V3; lift?: number; t: number}> = ({position, lift = 0, t}) => <group position={[position[0], position[1] + lift * (0.9 + 0.06 * Math.sin(t * 1.4)), position[2]]}
  rotation={[lift * 0.4 * Math.sin(t * 0.7), lift * t * 0.3, lift * 0.3]}>
  <mesh material={ink} position={[0, 0.06, 0]} scale={[1, 0.22, 1]}><icosahedronGeometry args={[0.36, 1]} /></mesh>
  <mesh material={ink} position={[0.12, 0.1, -0.08]} scale={[0.7, 0.35, 0.55]}><icosahedronGeometry args={[0.25, 1]} /></mesh>
  <mesh material={ink} position={[-0.16, 0.12, 0.12]} rotation={[0.4, 0, 0.3]}><coneGeometry args={[0.16, 0.3, 8]} /></mesh></group>;
export {MB, M};
