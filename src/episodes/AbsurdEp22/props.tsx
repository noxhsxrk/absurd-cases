import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {MB, M, tex, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {CONTRACT} from '../AbsurdEp20/props';
import {HANDLE} from './data';

/** EP22 — the new things only: the soap with no face (rule 4; EP5's bar has a drawn scowl), its pink stamp in box 2 of the contract,
 *  cell 24's bigger back window, the OUTSIDE of the block (wall, windows, roof, yard), the searchlight beam, and the arrest warrant.
 *  Everything else comes from earlier episodes. */
export type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// =====================================================================================================
// THE SOAP: EP5's pink bar (10 × 4.5 × 6.5 cm) without the face. squash 0…1 flattens it onto what it presses.
// =====================================================================================================
export const SOAP = {w: 0.1, h: 0.045, d: 0.065};
const soapGeo = new RoundedBoxGeometry(SOAP.w, SOAP.h, SOAP.d, 3, 0.016);
export const Soap: React.FC<{position: V3; rotation?: V3; squash?: number; scale?: number}> = ({position, rotation = [0, 0, 0], squash = 0, scale = 1}) =>
  <group position={position} rotation={rotation} scale={[scale * (1 + squash * 0.3), scale * (1 - squash * 0.4), scale * (1 + squash * 0.3)]}>
    <mesh geometry={soapGeo} material={PM('#F2A3B5', 'soap', 0.05)} castShadow /></group>;

// =====================================================================================================
// THE STAMP: box 2 of the EP20 contract (canvas box [276, 612] 196 × 70 on a 512 × 717 sheet) — a pink soap print with foam flecks.
// Lies on the sheet (local +z), k 0…1 = how much of it is there.
// =====================================================================================================
const PX = 512 / CONTRACT.w;
export const BOX2: [number, number] = [(276 + 98 - 256) / PX, -(612 + 35 - 358.5) / PX];
const stampTex = () => tex('ep22-soapstamp', 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128); g.fillStyle = 'rgba(232,120,150,0.85)';
  g.beginPath(); (g as any).roundRect(48, 30, 160, 70, 22); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(40 + hash(i) * 176, 22 + hash(i * 3) * 84, 3 + hash(i * 5) * 7, 0, 7); g.fill(); }
});
export const SoapStamp: React.FC<{k: number}> = ({k}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: stampTex(), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide}), []);
  mat.opacity = Math.min(1, Math.max(0, k)); if (k <= 0.01) return null;
  return <mesh position={[BOX2[0], BOX2[1], 0.0012]} material={mat}><planeGeometry args={[0.08, 0.04]} /></mesh>;
};

// =====================================================================================================
// CELL 24's BACK WINDOW, bigger than the EP1 Cell's (0.55 × 0.8, centre y 2.03) so a flat man fits through between two bars.
// Drawn just in front of the cell's back wall (z −1.5) and again on the outside face of the block wall. Bars at x 0.45 / 0.6 / 0.75.
// =====================================================================================================
export const WIN24 = {x: 0.6, y: 2.03, w: 0.55, h: 0.8, bars: [0.45, 0.6, 0.75]};
const barM = () => M('#3A3E42', 0.4, 0.8);
export const Window24: React.FC<{z: number; dark?: string; out?: boolean}> = ({z, dark = '#141B2C', out = false}) => <group>
  <mesh position={[WIN24.x, WIN24.y, z]} rotation={[0, out ? Math.PI : 0, 0]} material={MB(dark)}><planeGeometry args={[WIN24.w, WIN24.h]} /></mesh>
  {WIN24.bars.map((x) => <mesh key={x} position={[x, WIN24.y, z + (out ? -0.012 : 0.008)]} material={barM()}><boxGeometry args={[0.025, WIN24.h + 0.02, 0.025]} /></mesh>)}
  {[-1, 1].map((s) => <mesh key={s} position={[WIN24.x, WIN24.y + s * (WIN24.h / 2 + 0.02), z + (out ? -0.012 : 0.008)]} material={barM()}><boxGeometry args={[WIN24.w + 0.06, 0.04, 0.03]} /></mesh>)}
</group>;

// =====================================================================================================
// THE BLOCK FROM OUTSIDE. The cells' back walls are at z −1.5; the block wall is a slab z −1.56…−1.66, x −9.6…9.6, 3.4 high,
// with a small barred window per cell (EP1 Cell: x c+0.6, y 2.25, 0.5 × 0.35) — cell 24 gets WIN24 —, a painted sign, a steel yard door
// at x 8.6 with a gap under it, a flat roof over the whole block (for the aerial), and a yard of asphalt with a far fence.
// =====================================================================================================
export const WALL_Z = -1.66, DOOR_X = 8.6;
const wallTex = () => { const t = tex('ep22-blockwall', 512, 256, (g) => {
  g.fillStyle = '#8D9089'; g.fillRect(0, 0, 512, 256); g.strokeStyle = 'rgba(40,44,40,0.25)'; g.lineWidth = 3;
  for (let y = 0; y < 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(50,55,50,${0.05 + hash(i) * 0.08})`; g.fillRect(hash(i * 3) * 512, hash(i * 5) * 256, 8 + hash(i * 7) * 40, 4 + hash(i * 9) * 20); }
}); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 1); return t; };
const signTex = () => tex('ep22-prison-sign', 1024, 160, (g) => {
  g.fillStyle = '#1F2A33'; g.fillRect(0, 0, 1024, 160); g.strokeStyle = '#E6E7CF'; g.lineWidth = 6; g.strokeRect(10, 10, 1004, 140);
  g.fillStyle = '#E6E7CF'; g.font = F(800, 84); g.textAlign = 'center'; g.fillText('เรือนจำ · แดนขัง 2', 512, 108);
});
export const BlockOutside: React.FC<{cells: number[]; win?: string}> = ({cells, win = '#18203A'}) => {
  const mats = useMemo(() => ({wall: new THREE.MeshLambertMaterial({map: wallTex()}), sign: new THREE.MeshBasicMaterial({map: signTex(), toneMapped: false})}), []);
  return <group>
    <mesh position={[0, 1.7, -1.61]} material={mats.wall} receiveShadow><boxGeometry args={[19.2, 3.4, 0.1]} /></mesh>
    <mesh position={[0, 3.45, 3.2]} material={M('#5E625C', 0.9)}><boxGeometry args={[19.4, 0.12, 9.8]} /></mesh>
    {cells.map((c) => c === 0 ? <Window24 key={c} z={WALL_Z - 0.005} dark={win} out /> : <group key={c}>
      <mesh position={[c + 0.6, 2.25, WALL_Z - 0.005]} rotation={[0, Math.PI, 0]} material={MB(win)}><planeGeometry args={[0.5, 0.35]} /></mesh>
      {[-0.15, 0, 0.15].map((x) => <mesh key={x} position={[c + 0.6 + x, 2.25, WALL_Z - 0.017]} material={barM()}><boxGeometry args={[0.025, 0.36, 0.025]} /></mesh>)}</group>)}
    <mesh position={[-3.2, 3.0, WALL_Z - 0.01]} rotation={[0, Math.PI, 0]} material={mats.sign}><planeGeometry args={[3.2, 0.5]} /></mesh>
    {/* the yard door: steel, a dark gap under it */}
    <mesh position={[DOOR_X, 1.06, WALL_Z - 0.03]} material={M('#4A5058', 0.5, 0.6)}><boxGeometry args={[1.0, 2.0, 0.05]} /></mesh>
    <mesh position={[DOOR_X, 0.03, WALL_Z - 0.006]} rotation={[0, Math.PI, 0]} material={MB('#05070A')}><planeGeometry args={[1.0, 0.06]} /></mesh>
    <mesh position={[DOOR_X + 0.4, 1.05, WALL_Z - 0.06]} material={M('#B8BCC0', 0.3, 0.8)}><boxGeometry args={[0.04, 0.16, 0.04]} /></mesh>
    {/* yard + the far fence */}
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, -22]}><planeGeometry args={[80, 41]} /><meshLambertMaterial color="#3B3F44" /></mesh>
    {Array.from({length: 21}, (_, i) => <mesh key={i} position={[-30 + i * 3, 1.8, -24]} material={M('#2A2E33', 0.6)}><boxGeometry args={[0.1, 3.6, 0.1]} /></mesh>)}
    <mesh position={[0, 1.8, -24]} material={new THREE.MeshBasicMaterial({color: '#4A5260', transparent: true, opacity: 0.35, side: THREE.DoubleSide})}><planeGeometry args={[60, 3.4]} /></mesh>
  </group>;
};

// =====================================================================================================
// SEARCHLIGHT: a lamp on a tripod and a soft cone of light from it to `to` (k 0…1 = beam on). The real light is a spotLight in the shot.
// =====================================================================================================
const beamMat = new THREE.MeshBasicMaterial({color: '#FFF4D6', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false});
export const Searchlight: React.FC<{at: V3; to: V3; k: number; r?: number}> = ({at, to, k, r = 0.55}) => {
  const a = new THREE.Vector3(...at), b = new THREE.Vector3(...to), d = b.clone().sub(a); const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <group>
    <group position={at} quaternion={q}>
      <mesh position={[0, 0, 0]} material={M('#2A2D33', 0.5, 0.6)}><cylinderGeometry args={[0.28, 0.22, 0.5, 14]} /></mesh>
      <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MB(k > 0.1 ? '#FFF6DE' : '#3A3E44')}><circleGeometry args={[0.25, 18]} /></mesh>
      {k > 0.01 && <mesh position={[0, len / 2 + 0.25, 0]} material={beamMat} scale={[1, 1, 1]}><cylinderGeometry args={[r * k, 0.22, len, 24, 1, true]} /></mesh>}
    </group>
    {[-1, 0, 1].map((s) => <mesh key={s} position={[at[0] + s * 0.25, at[1] / 2, at[2] + (s === 0 ? 0.28 : -0.14)]} rotation={[s === 0 ? -0.25 : 0.12, 0, s * 0.25]} material={M('#2A2D33', 0.5)}><cylinderGeometry args={[0.025, 0.025, at[1] + 0.1, 6]} /></mesh>)}
  </group>;
};

// =====================================================================================================
// THE WARRANT: an A3 poster, faces local +z. A box-head mugshot with the zip open, "หมายจับ", the charge, "ห้อง 24".
// =====================================================================================================
export const WARRANT = {w: 0.42, h: 0.6};
const warrantTex = () => tex('ep22-warrant', 512, 731, (g) => {
  g.fillStyle = '#F3EEDF'; g.fillRect(0, 0, 512, 731); g.strokeStyle = '#B0302E'; g.lineWidth = 10; g.strokeRect(14, 14, 484, 703);
  g.fillStyle = '#B0302E'; g.font = F(800, 110); g.textAlign = 'center'; g.fillText('หมายจับ', 256, 140);
  // the mugshot: a box head, side-parted hair, a flat mouth; the collar of the blue shirt
  g.fillStyle = '#C9CCC4'; g.fillRect(126, 170, 260, 260);
  g.fillStyle = '#8FB0D2'; g.fillRect(150, 360, 212, 70);
  g.fillStyle = '#D9A879'; g.fillRect(186, 214, 140, 150); g.fillStyle = '#1A1513'; g.fillRect(180, 204, 152, 34); g.fillRect(180, 204, 30, 70);
  g.fillStyle = '#14110F'; g.fillRect(222, 280, 16, 16); g.fillRect(276, 280, 16, 16); g.fillRect(232, 330, 50, 7);
  g.fillStyle = '#2A3440'; g.font = F(700, 30); g.fillText('ห้อง 24', 256, 418);
  g.fillStyle = '#1B2831'; g.font = F(700, 40); g.fillText('ข้อหา', 256, 494); g.font = F(800, 48); g.fillText('หลบหนีจากที่คุมขัง', 256, 552);
  g.fillStyle = '#5A6470'; g.font = F(600, 28); g.fillText('ทราบเบาะแส แจ้ง 191', 256, 616);
  g.font = F(500, 20); g.fillText(HANDLE, 256, 690);
});
export const Warrant: React.FC<{position: V3; rotation?: V3; scale?: number}> = ({position, rotation = [0, 0, 0], scale = 1}) => {
  const mat = useMemo(() => new THREE.MeshLambertMaterial({map: warrantTex(), side: THREE.DoubleSide}), []);
  return <mesh position={position} rotation={rotation} scale={scale} material={mat} castShadow><planeGeometry args={[WARRANT.w, WARRANT.h]} /></mesh>;
};
export {MB, M};
