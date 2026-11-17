import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, M, tex, F, glowTex} from '../../pov/lib/tex';
import {HANDLE} from './data';

/** EP19 — the new things only: déjà vu (a violet thought-cloud with a looping arrow round it, no face), its stick arm, the big evidence jar,
 *  the open fly, the red annotation, the sentence flip-plate and the judge's pile of case files. Everything else comes from earlier episodes. */
export type V3 = [number, number, number];
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x: number) => { const c = cl(x); return c * c * (3 - 2 * c); };
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const VIOLET = '#B49CFF';

// =====================================================================================================
// THE DOUBLES: a see-through violet silhouette of whoever is having the déjà vu (Episode.tsx swaps every mesh of a GHOSTS character to this)
// =====================================================================================================
export const GHOST_MAT = new THREE.MeshBasicMaterial({color: '#C4AEFF', transparent: true, opacity: 0.42, depthWrite: false, toneMapped: false});
export const ghostify = (o: THREE.Object3D) => o.traverse((m: any) => { if (m.isMesh) { m.material = GHOST_MAT; m.castShadow = false; m.receiveShadow = false; m.renderOrder = 3; } });

// =====================================================================================================
// DÉJÀ VU: a lumpy cloud of eight violet puffs that breathes, a white loop-arrow (↻) circling it, sparkles. Origin = its centre, r = radius.
// =====================================================================================================
const PUFFS: [number, number, number, number][] = [[0, 0, 0, 1], [0.62, -0.12, 0.1, 0.72], [-0.6, -0.1, 0.05, 0.75], [0.3, 0.42, -0.05, 0.7], [-0.32, 0.4, 0.08, 0.68], [0.1, -0.3, 0.45, 0.6], [-0.05, 0.05, -0.5, 0.7], [0.0, 0.62, 0.0, 0.5]];
const cloudMat = new THREE.MeshStandardMaterial({color: '#C9B8FF', emissive: '#7A55F0', emissiveIntensity: 0.55, roughness: 0.6, flatShading: true});
const cloudGeo = new THREE.IcosahedronGeometry(0.55, 1);
const arrowMat = new THREE.MeshBasicMaterial({color: '#FFFFFF', toneMapped: false});
const tagTex = () => tex('ep19-tag', 256, 128, (g) => { g.fillStyle = '#F4EFE2'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#7A55F0'; g.lineWidth = 6; g.strokeRect(5, 5, 246, 118);
  g.fillStyle = '#4A2FA8'; g.font = F(800, 58); g.textAlign = 'center'; g.fillText('เดจาวู', 128, 78); g.fillStyle = '#6A6A70'; g.font = F(500, 18); g.fillText('ผู้ต้องหา · ' + HANDLE, 128, 110); });
export const DejaVu: React.FC<{position: V3; t: number; r?: number; k?: number; tag?: boolean; spin?: number; yaw?: number; pulse?: number}> = ({position, t, r = 0.22, k = 1, tag = false, spin = 1, yaw = 0, pulse = 0}) => {
  const tm = useMemo(() => new THREE.MeshBasicMaterial({map: tagTex(), side: THREE.DoubleSide}), []);
  if (k <= 0.01) return null;
  const br = 1 + 0.04 * Math.sin(t * 3.1) + 0.18 * pulse; const a = t * 2.4 * spin;
  return <group position={position} rotation={[0, yaw, 0]} scale={r * k * br}>
    {PUFFS.map(([x, y, z, s], i) => <mesh key={i} geometry={cloudGeo} material={cloudMat} castShadow position={[x, y + 0.03 * Math.sin(t * 2 + i), z]} scale={s} rotation={[i, i * 2, 0]} />)}
    {/* the loop: an arc of 300° with an arrow head, turning round the cloud — the thing it does is make a moment come round again */}
    <group rotation={[0.35, a, 0.12]}>
      <mesh material={arrowMat}><torusGeometry args={[1.25, 0.045, 6, 40, Math.PI * 1.65]} /></mesh>
      <mesh material={arrowMat} position={[1.25, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.13, 0.3, 6]} /></mesh>
    </group>
    {[0, 1, 2, 3, 4].map((i) => { const b = t * 1.7 + i * 1.26; return <mesh key={i} material={MB('#FFFFFF', 'dvs')} position={[Math.cos(b) * 1.05, Math.sin(b * 1.3 + i) * 0.5, Math.sin(b) * 1.05]} scale={0.06 + 0.04 * Math.abs(Math.sin(t * 6 + i))}><octahedronGeometry args={[1, 0]} /></mesh>; })}
    <sprite scale={4.2}><spriteMaterial map={glowTex()} color="#9C7BFF" transparent opacity={0.35 + 0.25 * pulse} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></sprite>
    {tag && <group position={[0.95, -0.55, 0.55]} rotation={[0, 0, 0.12 * Math.sin(t * 2.2)]}>
      <mesh material={M('#3A3A40', 0.6)} position={[0, -0.25, 0]}><cylinderGeometry args={[0.012, 0.012, 0.5, 4]} /></mesh>
      <mesh material={tm} position={[0, -0.75, 0]}><planeGeometry args={[1.0, 0.5]} /></mesh></group>}
  </group>;
};
/** a stick arm out of the cloud's side, ending in a white mitten at `hand` (world) */
export const CloudArm: React.FC<{from: V3; hand: V3}> = ({from, hand}) => {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...hand); const d = b.clone().sub(a); const L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <><mesh position={a.clone().add(b).multiplyScalar(0.5).toArray() as V3} quaternion={q} material={M('#E9E2FF', 0.6)} castShadow><cylinderGeometry args={[0.012, 0.012, L, 6]} /></mesh>
    <mesh position={hand} material={M('#FFFFFF', 0.7)} castShadow><sphereGeometry args={[0.035, 10, 8]} /></mesh></>;
};
export const Binoculars: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => <group position={position} rotation={rotation}>
  {[-1, 1].map((s) => <group key={s} position={[s * 0.035, 0, 0]}><mesh rotation={[Math.PI / 2, 0, 0]} material={M('#22262C', 0.5)} castShadow><cylinderGeometry args={[0.026, 0.03, 0.11, 10]} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.056]} material={M('#7FB2D8', 0.1, 0.4)}><circleGeometry args={[0.024, 12]} /></mesh></group>)}
  <mesh material={M('#3A3F46', 0.5)}><boxGeometry args={[0.03, 0.02, 0.05]} /></mesh>
</group>;

// =====================================================================================================
// THE EVIDENCE JAR (big: déjà vu fits inside). Origin at the bottom centre, mouth up (+y). lid 0 = screwed on, 1 = lifted off and tipped.
// =====================================================================================================
export const JAR = {r: 0.26, h: 0.58};
const jarLabel = () => tex('ep19-jar', 512, 256, (g) => { g.fillStyle = '#F4EFE2'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#B0302E'; g.lineWidth = 10; g.strokeRect(10, 10, 492, 236);
  g.textAlign = 'center'; g.fillStyle = '#B0302E'; g.font = F(800, 72); g.fillText('หลักฐาน', 256, 92); g.fillStyle = '#2A2A2E'; g.font = F(700, 48); g.fillText('ผู้ต้องหา: เดจาวู', 256, 158);
  g.font = F(500, 30); g.fillStyle = '#6A6A70'; g.fillText('คดีที่ 194/2569 · ' + HANDLE, 256, 214); });
export const BigJar: React.FC<{position: V3; rotation?: V3; lid?: number; children?: React.ReactNode}> = ({position, rotation = [0, 0, 0], lid = 0, children}) => {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({color: '#D8EEF2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide}), []);
  const label = useMemo(() => new THREE.MeshStandardMaterial({map: jarLabel(), roughness: 0.8}), []);
  const {r, h} = JAR; const lk = sm(lid);
  return <group position={position} rotation={rotation}>
    {children}
    <mesh material={glass} position={[0, h / 2, 0]}><cylinderGeometry args={[r, r, h, 32, 1, true]} /></mesh>
    <mesh material={glass} position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r, 32]} /></mesh>
    <mesh material={M('#E9F6F8', 0.1, 0, {transparent: true, opacity: 0.6})} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.008, 6, 32]} /></mesh>
    <group position={[r * 1.1 * lk, h + 0.02 + 0.22 * Math.sin(lk * Math.PI * 0.8), 0]} rotation={[0, 0, -1.2 * lk]}>
      <mesh castShadow material={M('#9AA3AC', 0.3, 0.8)} position={[0, 0.02, 0]}><cylinderGeometry args={[r + 0.012, r + 0.012, 0.05, 32]} /></mesh>
      <mesh material={M('#2A2E33', 0.5)} position={[0, 0.05, 0]}><cylinderGeometry args={[0.04, 0.04, 0.02, 12]} /></mesh>
    </group>
    <mesh material={label} position={[0, h * 0.42, 0]}><cylinderGeometry args={[r + 0.003, r + 0.003, 0.2, 24, 1, true, -0.8, 1.6]} /></mesh>
  </group>;
};

// =====================================================================================================
// THE OPEN FLY: a dark V in the trousers with the white of his underpants showing and a zip down each side. Built in the hips box's own
// frame (cm): the box is 30 × 20 × 19 centred at (0, 2, 0), so its front face is z = 9.5 and its bottom y = −8.
// =====================================================================================================
export const makeFly = () => { const g = new THREE.Group();
  const v = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-3.2, 2), new THREE.Vector2(3.2, 2), new THREE.Vector2(0, -8)])), MB('#1E2433', 'flyv')); v.position.set(0, 0, 9.62); g.add(v);
  const w = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-2.2, 1), new THREE.Vector2(2.2, 1), new THREE.Vector2(0, -6)])), MB('#F4F4EE', 'flyw')); w.position.set(0, 0, 9.66); g.add(w);
  for (const s of [-1, 1]) { const z = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10.3, 0.3), M('#C9A04A', 0.3, 0.7)); z.position.set(s * 1.9, -3, 9.7); z.rotation.z = s * 0.31; g.add(z); }
  const pull = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 0.5), M('#C9A04A', 0.3, 0.7)); pull.position.set(0, -8.4, 9.75); g.add(pull);
  return g; };

/** red annotation (dashed circle + ✕ + word), like the reference's diagram marks. Faces local +z; s = diameter in metres. */
const noteTex = (word: string) => tex('ep19-note-' + word, 512, 640, (g) => { g.clearRect(0, 0, 512, 640); g.strokeStyle = '#E2342B'; g.lineWidth = 16; g.setLineDash([34, 22]);
  g.beginPath(); g.arc(256, 256, 220, 0, 7); g.stroke(); g.setLineDash([]); g.lineWidth = 20; g.lineCap = 'round';
  g.fillStyle = '#E2342B'; g.beginPath(); g.roundRect(106, 520, 300, 104, 18); g.fill(); g.fillStyle = '#FFFFFF'; g.font = F(800, 70); g.textAlign = 'center'; g.fillText(word, 256, 596); });
export const Note: React.FC<{position: V3; quaternion?: THREE.Quaternion; s: number; k: number; word: string}> = ({position, quaternion, s, k, word}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: noteTex(word), transparent: true, depthWrite: false, depthTest: false, toneMapped: false}), [word]);
  if (k <= 0.01) return null; m.opacity = cl(k * 1.5);
  return <mesh position={position} quaternion={quaternion} scale={[s * (1.25 - 0.25 * sm(k)), s * 1.25 * (1.25 - 0.25 * sm(k)), 1]} material={m} renderOrder={9}><planeGeometry args={[1, 1]} /></mesh>;
};

// =====================================================================================================
// THE SENTENCE: a navy plate on the cell beam that flips (about x) from blank to "10 ปี" in 3 frames. Faces +z.
// =====================================================================================================
const signTex = (txt: string) => tex('ep19-sign-' + txt, 512, 192, (g) => { g.fillStyle = '#152028'; g.fillRect(0, 0, 512, 192); g.strokeStyle = '#E6E7CF'; g.lineWidth = 6; g.strokeRect(12, 12, 488, 168);
  g.fillStyle = txt ? '#E6E7CF' : '#3A4752'; g.font = F(800, 110); g.textAlign = 'center'; g.fillText(txt || '— ปี', 256, 136); });
export const FlipSign: React.FC<{position: V3; flip: number; w?: number; text: string}> = ({position, flip, w = 0.62, text}) => {
  const a = useMemo(() => new THREE.MeshBasicMaterial({map: signTex(''), toneMapped: false}), []); const b = useMemo(() => new THREE.MeshBasicMaterial({map: signTex(text), toneMapped: false}), [text]);
  const k = cl(flip / 0.1); const ang = k * Math.PI;
  return <group position={position}>
    <mesh material={M('#2A2E33', 0.5, 0.6)} position={[0, w * 0.22, 0]}><boxGeometry args={[w * 1.05, 0.02, 0.02]} /></mesh>
    <group position={[0, w * 0.2, 0]} rotation={[ang, 0, 0]}>
      <mesh material={a} position={[0, -w * 0.19, 0.006]}><planeGeometry args={[w, w * 0.375]} /></mesh>
      <mesh material={b} position={[0, -w * 0.19, -0.006]} rotation={[0, Math.PI, Math.PI]}><planeGeometry args={[w, w * 0.375]} /></mesh>
    </group></group>;
};

// =====================================================================================================
// THE JUDGE'S PILE: case files, each stamped ยกฟ้อง by a gavel hit and slid off the top. hits = the times the gavel lands on the pile.
// =====================================================================================================
const fileTex = (n: number) => tex('ep19-file-' + n, 256, 192, (g) => { g.fillStyle = '#C9A86A'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#F4EFE2'; g.fillRect(24, 26, 208, 70);
  g.fillStyle = '#1E2B3C'; g.font = F(700, 30); g.textAlign = 'center'; g.fillText('คดีที่ ' + (195 + n), 128, 72); });
const stampTex = () => tex('ep19-stamp', 256, 128, (g) => { g.clearRect(0, 0, 256, 128); g.strokeStyle = '#C8231C'; g.lineWidth = 9; g.strokeRect(14, 14, 228, 100); g.fillStyle = '#C8231C'; g.font = F(800, 64); g.textAlign = 'center'; g.fillText('ยกฟ้อง', 128, 88); });
export const FILE = {w: 0.34, d: 0.26, h: 0.022};
export const FilePile: React.FC<{position: V3; t: number; hits: number[]; n?: number; yaw?: number}> = ({position, t, hits, n = 14, yaw = 0}) => {
  const st = useMemo(() => new THREE.MeshBasicMaterial({map: stampTex(), transparent: true, depthWrite: false, toneMapped: false}), []);
  const mats = useMemo(() => Array.from({length: n}, (_, i) => new THREE.MeshStandardMaterial({map: fileTex(i), roughness: 0.85})), [n]);
  const side = M('#B8975A', 0.85);
  return <group position={position} rotation={[0, yaw, 0]}>{Array.from({length: n}, (_, i) => {
    const j = n - 1 - i; const hit = hits[j]; const u = hit === undefined ? -1 : t - hit; if (u > 1.2) return null;   // j-th from the top is struck by the j-th hit
    const slide = u > 0.12 ? sm((u - 0.12) / 0.3) : 0; const fall = u > 0.42 ? 0.5 * 9.8 * (u - 0.42) ** 2 : 0;
    const y = (i + 0.5) * FILE.h - fall; const x = slide * 0.55 + (hash(i) - 0.5) * 0.02; const rz = -slide * 0.5;
    return <group key={i} position={[x, y, slide * 0.12]} rotation={[0, (hash(i * 3) - 0.5) * 0.12, rz]}>
      <mesh castShadow receiveShadow material={[side, side, mats[i], side, side, side]}><boxGeometry args={[FILE.w, FILE.h, FILE.d]} /></mesh>
      {u > 0 && <mesh material={st} position={[0.02, FILE.h / 2 + 0.002, 0.04]} rotation={[-Math.PI / 2, 0, 0.15]} scale={pop(u / 0.12)}><planeGeometry args={[0.26, 0.13]} /></mesh>}
    </group>; })}</group>;
};
const pop = (x: number) => { if (x <= 0) return 0; if (x >= 1) return 1; return 1 - Math.exp(-6 * x) * Math.cos(9 * x); };
