import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, M, tex, F} from '../../pov/lib/tex';
import {HANDLE} from './data';

/** EP23 — the new things only: the durian's green gas (a bank that fills a box, a jet that pours along a direction), the plastic wrap the
 *  guard winds across the front of cell 19, the hazard sign, the escape file with its rubber stamp, the guard's empty post, and the hooded
 *  silhouette of the new prisoner (cliffhanger: nobody knows who it is yet). Everything else comes from earlier episodes. */
export type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// =====================================================================================================
// GAS: durian green, low-poly puffs. Bank = puffs scattered in a box (centre at floor level, size), filling by k. Jet = puffs born at
// `from`, drifting along `dir` (with spread) for `reach` metres over `life` seconds, while t0 ≤ t ≤ t1.
// =====================================================================================================
const gasMats = new Map<string, THREE.Material>();
const gasM = (o: number) => { const key = (Math.round(o * 20) / 20).toFixed(2);
  if (!gasMats.has(key)) gasMats.set(key, new THREE.MeshLambertMaterial({color: '#9DB53E', emissive: '#4E5E18', emissiveIntensity: 0.35, flatShading: true, transparent: true, opacity: +key, depthWrite: false}));
  return gasMats.get(key)!; };
const puffGeo = new THREE.IcosahedronGeometry(1, 1);
export const GasBank: React.FC<{t: number; center: V3; size: V3; k: number; n?: number; seed?: number; o?: number; puff?: number}> = ({t, center, size, k, n = 50, seed = 0, o = 0.32, puff = 0.32}) =>
  k <= 0.01 ? null : <group position={center}>{Array.from({length: n}, (_, i) => { const j = i + seed * 61; const a = cl(k * 1.6 - hash(j * 1.9) * 0.6); if (a <= 0.01) return null;
    const p: V3 = [(hash(j) - 0.5) * size[0] + 0.12 * Math.sin(t * 0.5 + j), hash(j * 2.3) * size[1] + 0.06 * Math.sin(t * 0.7 + j * 2), (hash(j * 3.7) - 0.5) * size[2] + 0.12 * Math.cos(t * 0.4 + j)];
    return <mesh key={i} geometry={puffGeo} material={gasM(o * a)} position={p} scale={(puff * 0.7 + hash(j * 5.1) * puff) * (0.5 + 0.5 * a)} rotation={[j, j * 1.7, t * 0.15]} />; })}</group>;
export const GasJet: React.FC<{t: number; from: V3; dir: V3; t0: number; t1: number; n?: number; life?: number; reach?: number; spread?: number; o?: number; size?: number}> =
  ({t, from, dir, t0, t1, n = 24, life = 1.6, reach = 3, spread = 0.6, o = 0.55, size = 0.5}) => {
  if (t < t0 - 0.01 || t > t1 + life) return null;
  return <group position={from}>{Array.from({length: n}, (_, i) => { const born0 = t0 + (i / n) * life; if (t < born0) return null;
    const cyc = Math.floor((t - born0) / life); const born = born0 + cyc * life; if (born > t1) return null; const u = (t - born) / life; const d = reach * Math.sqrt(u);
    const s = (0.08 + size * u) * (0.7 + hash(i) * 0.6);
    return <mesh key={i} geometry={puffGeo} material={gasM(o * (1 - u * u))} scale={s} rotation={[i, i * 2, t * 0.3]}
      position={[dir[0] * d + (hash(i * 3) - 0.5) * u * spread, dir[1] * d + (hash(i * 7) - 0.4) * u * spread * 0.6, dir[2] * d + (hash(i * 5) - 0.5) * u * spread]} />; })}</group>;
};

// =====================================================================================================
// PLASTIC WRAP across the front of a cell (the bars plane, facing +z): a translucent sheet `k` of the way along x from x0 to x1, wound in
// three bands with visible overlaps; plus the roll the guard carries (axis vertical).
// =====================================================================================================
const wrapMat = new THREE.MeshLambertMaterial({color: '#E6F2FA', emissive: '#A8BCC8', emissiveIntensity: 0.45, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false});
const seamMat = new THREE.MeshBasicMaterial({color: '#FFFFFF', transparent: true, opacity: 0.85, depthWrite: false});
export const WRAP_BANDS = [[0.05, 1.0], [0.9, 1.85], [1.75, 2.75]];
export const Wrap: React.FC<{x0: number; x1: number; z: number; k: number}> = ({x0, x1, z, k}) => {
  if (k <= 0.005) return null;
  return <group>{WRAP_BANDS.map(([y0, y1], b) => { const kb = cl(k * 3 - b); if (kb <= 0) return null; const dir = b % 2 ? -1 : 1;
    const a = dir > 0 ? x0 : x1, e = a + (x1 - x0) * dir * kb; const cx = (a + e) / 2, w = Math.abs(e - a);
    return <group key={b}>
      <mesh position={[cx, (y0 + y1) / 2, z + 0.02 + b * 0.008]} material={wrapMat}><planeGeometry args={[w, y1 - y0]} /></mesh>
      {[y0, y1].map((y) => <mesh key={y} position={[cx, y, z + 0.025 + b * 0.008]} material={seamMat}><planeGeometry args={[w, 0.03]} /></mesh>)}
      {Array.from({length: 4}, (_, i) => <mesh key={'g' + i} position={[cx + (hash(b * 9 + i) - 0.5) * w * 0.8, y0 + (y1 - y0) * hash(b * 5 + i * 3), z + 0.026 + b * 0.008]} rotation={[0, 0, 0.6]} material={seamMat}><planeGeometry args={[0.35, 0.012]} /></mesh>)}
    </group>; })}</group>;
};
export const WrapRoll: React.FC<{position: V3}> = ({position}) => <group position={position}>
  <mesh material={wrapMat}><cylinderGeometry args={[0.07, 0.07, 0.5, 14]} /></mesh>
  <mesh material={M('#B9C2C8', 0.5)}><cylinderGeometry args={[0.022, 0.022, 0.56, 8]} /></mesh></group>;

// =====================================================================================================
// HAZARD SIGN: a yellow diamond with the biohazard-ish trefoil and "วัตถุอันตราย". Faces local +z.
// =====================================================================================================
const hazardTex = () => tex('ep23-hazard', 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512); g.save(); g.translate(256, 256); g.rotate(Math.PI / 4);
  g.fillStyle = '#1B1B1B'; g.fillRect(-176, -176, 352, 352); g.fillStyle = '#F2C230'; g.fillRect(-164, -164, 328, 328); g.restore();
  g.fillStyle = '#1B1B1B'; g.strokeStyle = '#1B1B1B';
  for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; g.beginPath(); g.arc(256 + Math.cos(a) * 52, 205 + Math.sin(a) * 52, 40, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#F2C230'; for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; g.beginPath(); g.arc(256 + Math.cos(a) * 66, 205 + Math.sin(a) * 66, 26, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.arc(256, 205, 20, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1B1B1B'; g.beginPath(); g.arc(256, 205, 11, 0, Math.PI * 2); g.fill();
  g.font = F(800, 50); g.textAlign = 'center'; g.fillText('วัตถุอันตราย', 256, 352);
  g.font = F(700, 28); g.fillText('อาวุธเคมี · ห้อง 19', 256, 396);
});
export const HazardSign: React.FC<{position: V3; rotation?: V3; s?: number}> = ({position, rotation = [0, 0, 0], s = 0.62}) => {
  const mat = useMemo(() => new THREE.MeshLambertMaterial({map: hazardTex(), transparent: true, side: THREE.DoubleSide, emissive: '#3A3008', emissiveIntensity: 0.2}), []);
  return <mesh position={position} rotation={rotation} material={mat}><planeGeometry args={[s, s]} /></mesh>;
};

// =====================================================================================================
// THE ESCAPE FILE: a buff folder lying open (face up, local +y), the inner sheet says "แฟ้มผู้ต้องขัง · ห้อง 24" with the mugshot,
// and the red stamp "หลบหนีแล้ว" appears at k. Folder 0.34 × 0.25 open. And the rubber stamp (handle up, origin at the face).
// =====================================================================================================
const fileTex = () => tex('ep23-file24', 512, 380, (g) => {
  g.fillStyle = '#F4F0E2'; g.fillRect(0, 0, 512, 380);
  g.fillStyle = '#1B2831'; g.font = F(800, 40); g.textAlign = 'left'; g.fillText('แฟ้มผู้ต้องขัง', 34, 62); g.font = F(800, 64); g.fillText('ห้อง 24', 34, 140);
  g.fillStyle = '#C9CCC4'; g.fillRect(330, 34, 150, 160); g.fillStyle = '#8FB0D2'; g.fillRect(345, 150, 120, 44);
  g.fillStyle = '#D9A879'; g.fillRect(366, 60, 78, 88); g.fillStyle = '#1A1513'; g.fillRect(362, 54, 86, 20);
  g.fillStyle = '#14110F'; g.fillRect(386, 98, 9, 9); g.fillRect(414, 98, 9, 9); g.fillRect(392, 126, 28, 4);
  g.fillStyle = '#5A6470'; g.font = F(600, 26); ['ข้อหา: อนาจาร (ซิป)', 'โทษ: 10 ปี', 'สถานะ: ______'].forEach((s, i) => g.fillText(s, 34, 200 + i * 40));
  g.font = F(500, 18); g.fillText(HANDLE, 34, 356);
});
const stampTex = () => tex('ep23-stamp-escaped', 512, 160, (g) => {
  g.clearRect(0, 0, 512, 160); g.strokeStyle = '#C22A26'; g.lineWidth = 12; g.strokeRect(14, 14, 484, 132);
  g.fillStyle = '#C22A26'; g.font = F(800, 92); g.textAlign = 'center'; g.fillText('หลบหนีแล้ว', 256, 114);
});
export const EscapeFile: React.FC<{position: V3; rotation?: V3; k: number}> = ({position, rotation = [0, 0, 0], k}) => {
  const mats = useMemo(() => ({page: new THREE.MeshLambertMaterial({map: fileTex()}), stamp: new THREE.MeshBasicMaterial({map: stampTex(), transparent: true, depthWrite: false, toneMapped: false})}), []);
  return <group position={position} rotation={rotation}>
    <mesh position={[0, 0, 0]} material={M('#C8A86A', 0.9)}><boxGeometry args={[0.36, 0.006, 0.27]} /></mesh>
    <mesh position={[0.005, 0.0045, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.page}><planeGeometry args={[0.32, 0.237]} /></mesh>
    {k > 0.01 && <mesh position={[0.02, 0.006, 0.055]} rotation={[-Math.PI / 2, 0, -0.12]} scale={1 + 0.4 * (1 - k)} material={mats.stamp}><planeGeometry args={[0.24, 0.075]} /></mesh>}
  </group>;
};
export const RubberStamp: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => <group position={position} rotation={rotation}>
  <mesh position={[0, 0.012, 0]} material={M('#8A2420', 0.6)}><boxGeometry args={[0.1, 0.024, 0.04]} /></mesh>
  <mesh position={[0, 0.04, 0]} material={M('#6B4A2E', 0.8)}><boxGeometry args={[0.07, 0.03, 0.03]} /></mesh>
  <mesh position={[0, 0.085, 0]} material={M('#6B4A2E', 0.8)}><sphereGeometry args={[0.03, 10, 8]} /></mesh></group>;

// =====================================================================================================
// THE GUARD'S POST: a steel desk and a stool in the corridor, a navy plate "ผู้คุม" on the desk (the target of the plan, empty at night)
// =====================================================================================================
const postTex = () => tex('ep23-guardpost', 256, 96, (g) => { g.fillStyle = '#22314C'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#EDE6CF'; g.font = F(800, 58); g.textAlign = 'center'; g.fillText('ผู้คุม', 128, 70); });
export const GuardPost: React.FC<{position: V3; yaw?: number}> = ({position, yaw = 0}) => {
  const plate = useMemo(() => new THREE.MeshLambertMaterial({map: postTex()}), []);
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.74, 0]} material={M('#7C8288', 0.5, 0.5)} castShadow><boxGeometry args={[0.9, 0.04, 0.5]} /></mesh>
    {[[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]].map(([x, z]) => <mesh key={x + ',' + z} position={[x, 0.37, z]} material={M('#4A5058', 0.5)}><boxGeometry args={[0.04, 0.74, 0.04]} /></mesh>)}
    <group position={[0, 0.82, 0.18]} rotation={[-0.35, 0, 0]}><mesh material={M('#22314C', 0.6)}><boxGeometry args={[0.32, 0.13, 0.03]} /></mesh>
      <mesh position={[0, 0, 0.016]} material={plate}><planeGeometry args={[0.3, 0.11]} /></mesh></group>
    <mesh position={[0.05, 0.25, 0.55]} material={M('#4A5058', 0.5)}><cylinderGeometry args={[0.17, 0.17, 0.04, 12]} /></mesh>
    <mesh position={[0.05, 0.12, 0.55]} material={M('#3A3E42', 0.5)}><cylinderGeometry args={[0.025, 0.025, 0.24, 6]} /></mesh>
    <mesh position={[0.25, 0.79, -0.08]} material={M('#E8E2D2', 0.8)}><cylinderGeometry args={[0.04, 0.035, 0.09, 10]} /></mesh>
  </group>;
};

// =====================================================================================================
// THE NEW PRISONER: a hooded silhouette, no features, 1.8 m, dark against the corridor (rule 4: we don't know who yet). Walks with a bob.
// =====================================================================================================
const inkMat = new THREE.MeshLambertMaterial({color: '#0B0D12', flatShading: true});
export const Hooded: React.FC<{position: V3; yaw?: number; t: number; walking?: boolean}> = ({position, yaw = 0, t, walking = false}) => {
  const b = walking ? Math.abs(Math.sin(t * 6)) * 0.035 : 0; const sw = walking ? Math.sin(t * 6) * 0.18 : 0;
  return <group position={[position[0], position[1] + b, position[2]]} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.82, 0]} material={inkMat} castShadow><cylinderGeometry args={[0.2, 0.34, 1.3, 9]} /></mesh>
    <mesh position={[0, 1.58, 0]} material={inkMat} castShadow><sphereGeometry args={[0.2, 10, 8]} /></mesh>
    <mesh position={[0, 1.62, -0.03]} rotation={[0.25, 0, 0]} material={inkMat}><coneGeometry args={[0.24, 0.48, 9]} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.1, 0.1, 0.04 + s * sw * 0.3]} material={inkMat}><boxGeometry args={[0.12, 0.2, 0.26]} /></mesh>)}
  </group>;
};
export {MB, M};
