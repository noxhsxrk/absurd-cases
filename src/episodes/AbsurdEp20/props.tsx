import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, tex, F} from '../../pov/lib/tex';
import {HANDLE} from './data';

/** EP20 — the new things only: the break-out contract (pause-bait, seven signature boxes, box 1 signed in blood), the cold that leaks out of
 *  the fire's fridge, and the red annotation that shows which side of the Moon is its face. Everything else comes from earlier episodes. */
export type V3 = [number, number, number];
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// =====================================================================================================
// THE CONTRACT: a sheet of ruled paper, A5-ish (CONTRACT.w × h, metres), faces local +z. Seven boxes, box 1 is bottom-left
// (BOX1 = its centre in the sheet's own frame, metres from the centre) so his thumb can sit on it. blood 0…1 = the red blot in box 1.
// =====================================================================================================
export const CONTRACT = {w: 0.2, h: 0.28};
const CW = 512, CH = 717, PX = CW / CONTRACT.w;   // canvas pixels; pixels per metre
// box rows from the bottom up: 1-2, 3-4, 5-6, then 7 alone (top right); box 1 bottom-left, where his thumb holds the sheet
const BOXES = [[40, 612], [276, 612], [40, 532], [276, 532], [40, 452], [276, 452], [276, 372]] as const;
const BW = 196, BH = 70;
/** box 1's centre in the sheet's frame (metres from the sheet centre, +y up) */
export const BOX1: [number, number] = [(BOXES[0][0] + BW / 2 - CW / 2) / PX, -(BOXES[0][1] + BH / 2 - CH / 2) / PX];
const contractTex = (blood: boolean) => tex('ep20-contract-' + blood, CW, CH, (g) => {
  g.fillStyle = '#F3EEDF'; g.fillRect(0, 0, CW, CH);
  g.strokeStyle = 'rgba(70,90,120,0.18)'; g.lineWidth = 2; for (let y = 130; y < 330; y += 32) { g.beginPath(); g.moveTo(30, y + 8); g.lineTo(482, y + 8); g.stroke(); }
  g.fillStyle = '#1B2831'; g.textAlign = 'center'; g.font = F(800, 50); g.fillText('สัญญาแก๊งห้อง 24', 256, 62);
  g.font = F(600, 32); g.fillStyle = '#B0302E'; g.fillText('แผนแหกคุก (ลับมาก)', 256, 104);
  g.textAlign = 'left'; g.fillStyle = '#2A3440'; g.font = F(500, 25);
  ['ข้อ 1  ทุกห้องออกพร้อมกัน', 'ข้อ 2  ห้ามบอกผู้คุม', 'ข้อ 3  ห้ามโทรแจ้งตำรวจ', 'ข้อ 4  เรื่องซิปไม่เกี่ยว', 'ผู้ริเริ่ม: ห้อง 24  ·  ' + HANDLE].forEach((s, i) => g.fillText(s, 40, 136 + i * 34));
  g.font = F(600, 24); g.fillStyle = '#5A6470'; g.fillText('ลงชื่อผู้ร่วมแผน', 40, 352);
  BOXES.forEach(([x, y], i) => { g.strokeStyle = '#2A3440'; g.lineWidth = 4; g.setLineDash([12, 8]); g.strokeRect(x, y, BW, BH); g.setLineDash([]);
    g.fillStyle = '#5A6470'; g.font = F(600, 22); g.fillText(String(i + 1), x + 8, y + 24); });
  if (blood) { const [x, y] = BOXES[0]; const cx = x + BW / 2, cy = y + BH / 2;
    g.fillStyle = '#A3121C'; g.beginPath(); g.ellipse(cx, cy, 20, 17, 0.3, 0, 7); g.fill();
    for (let i = 0; i < 7; i++) { const a = hash(i) * 7, r = 22 + hash(i * 3) * 16; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 2 + hash(i * 5) * 5, 0, 7); g.fill(); }
    g.strokeStyle = '#A3121C'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + 16, cy - 2); g.quadraticCurveTo(cx + 50, cy - 24, cx + 76, cy + 6); g.stroke(); }
});
export const Contract: React.FC<{position: V3; quaternion?: THREE.Quaternion; rotation?: V3; blood?: number; scale?: number}> = ({position, quaternion, rotation, blood = 0, scale = 1}) => {
  const mats = useMemo(() => [false, true].map((b) => new THREE.MeshBasicMaterial({map: contractTex(b), toneMapped: false, side: THREE.DoubleSide})), []);
  return <group position={position} quaternion={quaternion} rotation={quaternion ? undefined : rotation} scale={scale}>
    <mesh material={mats[0]} castShadow><planeGeometry args={[CONTRACT.w, CONTRACT.h]} /></mesh>
    {blood > 0.01 && <mesh position={[0, 0, 0.0008]} material={mats[1]}><planeGeometry args={[CONTRACT.w, CONTRACT.h]} /></mesh>}
  </group>;
};

// =====================================================================================================
// COLD: the fridge does what a fridge does — cold air spills out at the seal and rolls forward and down. Pale low-poly puffs,
// each lives `life` s, born every `life / n` from t0 until t1 (bounded: never loops past t1 + life).
// =====================================================================================================
const fade = new Map<string, THREE.Material>();
const fm = (o: number) => { const k = (Math.round(o * 10) / 10).toFixed(1); if (!fade.has(k)) fade.set(k, new THREE.MeshLambertMaterial({color: '#DDE8EF', emissive: '#9FC8E8', emissiveIntensity: 0.12, flatShading: true, transparent: true, opacity: +k, depthWrite: false})); return fade.get(k)!; };
export const Chill: React.FC<{from: V3; t: number; t0: number; t1: number; n?: number; dir?: V3; life?: number; size?: number}> = ({from, t, t0, t1, n = 14, dir = [0, -0.25, 1], life = 1.1, size = 0.12}) => {
  if (t < t0 || t > t1 + life) return null;
  return <group position={from}>{Array.from({length: n}, (_, i) => { const born = t0 + (i / n) * Math.max(0.2, t1 - t0) * 0.9; const u = (t - born) / life; if (u < 0 || u > 1) return null;
    const s = size * (0.5 + 1.6 * u) * (0.7 + hash(i) * 0.6); const d = 0.55 * Math.sqrt(u);
    return <mesh key={i} position={[(hash(i * 3) - 0.5) * 0.5 + dir[0] * d, (hash(i * 7) - 0.3) * 1.2 + dir[1] * d - 0.25 * u * u, dir[2] * d]} scale={s} material={fm(0.7 * (1 - u))}>
      <icosahedronGeometry args={[1, 0]} /></mesh>; })}</group>;
};

// =====================================================================================================
// THE MOON'S FACE: a red dashed arrow from the Moon's surface towards the Earth with the word "หน้า" — the side it always shows the
// Earth. Drawn as a flat strip in world space between a and b, turned to face the camera. k 0…1 grows it from a.
// =====================================================================================================
const arrowTex = () => tex('ep20-facearrow', 512, 96, (g) => { g.clearRect(0, 0, 512, 96); g.strokeStyle = '#E2342B'; g.lineWidth = 14; g.setLineDash([30, 20]);
  g.beginPath(); g.moveTo(10, 48); g.lineTo(440, 48); g.stroke(); g.setLineDash([]); g.fillStyle = '#E2342B'; g.beginPath(); g.moveTo(506, 48); g.lineTo(430, 12); g.lineTo(430, 84); g.fill(); });
const wordTex = () => tex('ep20-faceword', 256, 128, (g) => { g.clearRect(0, 0, 256, 128); g.fillStyle = '#E2342B'; g.beginPath(); g.roundRect(14, 14, 228, 100, 18); g.fill();
  g.fillStyle = '#FFFFFF'; g.font = F(800, 64); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('หน้า', 128, 70); });
export const FaceArrow: React.FC<{a: V3; b: V3; cam: V3; k?: number; w?: number}> = ({a, b, cam, k = 1, w = 0.14}) => {
  const [am, wm] = useMemo(() => [arrowTex(), wordTex()].map((m) => new THREE.MeshBasicMaterial({map: m, transparent: true, depthWrite: false, depthTest: false, toneMapped: false})), []);
  if (k <= 0.01) return null;
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A); const L = d.length() * cl(k); d.normalize();
  const mid = A.clone().addScaledVector(d, L / 2); const toCam = new THREE.Vector3(...cam).sub(mid).normalize();
  const y = toCam.clone().cross(d).normalize(); const z = d.clone().cross(y).normalize(); const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, y, z));
  const wq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(...cam), A, new THREE.Vector3(0, 1, 0)));
  return <><mesh position={mid} quaternion={q} material={am} renderOrder={9}><planeGeometry args={[L, w]} /></mesh>
    <mesh position={A.clone().add(new THREE.Vector3(0, 0.2, 0))} quaternion={wq} material={wm} renderOrder={9} scale={[0.4, 0.2, 1]}><planeGeometry args={[1, 1]} /></mesh></>;
};
export {MB};
