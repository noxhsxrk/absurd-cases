import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {tex, M, MB, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {HANDLE} from './data';

type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const CREAM = '#E6E7CF', NAVY = '#152028', BRICK = '#B0402E', INK = '#14110F';

// =====================================================================================================
// THE ACCUSED: a pink soap bar with a hand-drawn scowl on its front (like the durian), and its foam.
// Real-ish size (10 × 4.5 × 6.5 cm); the shots get close instead of scaling it.
// =====================================================================================================
export const SOAP = {w: 0.1, h: 0.045, d: 0.065};
const soapGeo = new RoundedBoxGeometry(SOAP.w, SOAP.h, SOAP.d, 3, 0.016);
const soapFace = (mode: string) => tex('soap-face-' + mode, 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128); g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'round';
  if (mode === 'shut') { g.lineWidth = 7; for (const x of [84, 172]) { g.beginPath(); g.moveTo(x - 16, 66); g.lineTo(x + 16, 66); g.stroke(); } }
  else for (const x of [84, 172]) { g.beginPath(); g.ellipse(x, 68, 9, 11, 0, 0, 7); g.fill(); }
  // angry slanted brows (a scowl: inner ends low)
  g.lineWidth = 7; g.beginPath(); g.moveTo(62, 40); g.lineTo(102, 52); g.moveTo(194, 40); g.lineTo(154, 52); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(112, 104); g.quadraticCurveTo(128, 98, 144, 104); g.stroke();
});
const soapMat = () => PM('#F2A3B5', 'soap', 0.05);
export const Soap: React.FC<{position: V3; yaw?: number; look?: V3; roll?: number; pitch?: number; squash?: number; face?: string; scale?: number}> = ({position, yaw, look, roll = 0, pitch = 0, squash = 0, face = 'open', scale = 1}) => {
  const fm = useMemo(() => new THREE.MeshBasicMaterial({map: soapFace(face), transparent: true, toneMapped: false, depthWrite: false}), [face]);
  const y = look ? Math.atan2(look[0] - position[0], look[2] - position[2]) : yaw ?? 0;
  return <group position={position} rotation={[pitch, y, roll, 'YXZ']} scale={[scale * (1 - squash * 0.35), scale * (1 + squash * 0.25), scale * (1 + squash * 0.3)]}>
    <mesh geometry={soapGeo} material={soapMat()} castShadow />
    <mesh position={[0, 0.001, SOAP.d / 2 + 0.0008]} material={fm}><planeGeometry args={[SOAP.w * 0.8, SOAP.h * 0.85]} /></mesh>
  </group>;
};
/** the same soap as a plain Object3D, to hang on a hand bone (bone space = cm) */
export const makeSoapObj = () => {
  const g = new THREE.Group(); const m = new THREE.Mesh(soapGeo, soapMat()); m.scale.setScalar(100); m.castShadow = true; g.add(m);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(SOAP.w * 80, SOAP.h * 85), new THREE.MeshBasicMaterial({map: soapFace('open'), transparent: true, toneMapped: false, depthWrite: false})); f.position.set(0, 0.1, SOAP.d * 50 + 0.08); g.add(f);
  g.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); return g;
};

const foamMat = new THREE.MeshLambertMaterial({color: '#FBFCFA', flatShading: true});
const foamGeo = new THREE.IcosahedronGeometry(1, 0);
/** a ring of low-poly foam puffs around a point on the floor (k 0..1 grows it) */
export const FoamRing: React.FC<{center: V3; r?: number; k?: number; n?: number; t: number; size?: number}> = ({center, r = 0.075, k = 1, n = 14, t, size = 0.016}) => k <= 0 ? null : <group position={center}>
  {Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2 + hash(i) * 0.4, rr = r * (0.8 + hash(i * 3) * 0.45);
    const s = size * (0.6 + hash(i * 5) * 0.8) * k * (1 + 0.06 * Math.sin(t * 3 + i));
    return <mesh key={i} geometry={foamGeo} material={foamMat} position={[Math.cos(a) * rr, s * 0.6, Math.sin(a) * rr]} scale={s} rotation={[i, i * 2, 0]} />; })}
</group>;
/** a heap of foam filling a volume (k 0..1): low-poly puffs that grow and wobble */
export const FoamPile: React.FC<{center: V3; size: V3; k: number; t: number; n?: number; puff?: number; seed?: number}> = ({center, size, k, t, n = 40, puff = 0.18, seed = 0}) => k <= 0 ? null : <group position={center}>
  {Array.from({length: n}, (_, i) => { const j = i + seed * 97; const p: V3 = [(hash(j) - 0.5) * size[0], hash(j * 2.3) * size[1] * k, (hash(j * 3.7) - 0.5) * size[2]];
    const s = puff * (0.5 + hash(j * 5.1) * 0.8) * cl(k * 1.6 - hash(j * 7) * 0.6) * (1 + 0.05 * Math.sin(t * 2.4 + i));
    return s <= 0.001 ? null : <mesh key={i} geometry={foamGeo} material={foamMat} position={p} scale={s} rotation={[j, j * 1.7, t * 0.2]} />; })}
</group>;
/** soap bubbles: clear spheres with a white rim highlight; each rises from `from` and pops at its time */
const bubbleMat = new THREE.MeshBasicMaterial({color: '#DDF2FF', transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false});
const bubbleRim = new THREE.MeshBasicMaterial({color: '#FFFFFF', transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false, side: THREE.DoubleSide});
export const Bubble: React.FC<{position: V3; r: number; pop?: number}> = ({position, r, pop = 0}) => {
  if (r <= 0.0005 || pop >= 1) return null;
  if (pop > 0) return <group position={position}>{Array.from({length: 6}, (_, i) => { const a = (i / 6) * Math.PI * 2; return <mesh key={i} material={bubbleRim} position={[Math.cos(a) * r * (1 + pop), Math.sin(a) * r * (1 + pop), 0]} scale={r * 0.18 * (1 - pop)}><circleGeometry args={[1, 6]} /></mesh>; })}</group>;
  return <group position={position}>
    <mesh material={bubbleMat} scale={r}><sphereGeometry args={[1, 16, 12]} /></mesh>
    <mesh material={bubbleRim} position={[-r * 0.35, r * 0.4, r * 0.8]} scale={r * 0.22}><circleGeometry args={[1, 10]} /></mesh>
    <mesh material={bubbleRim} position={[0, 0, 0]} scale={r}><ringGeometry args={[0.96, 1.0, 28]} /></mesh>
  </group>;
};
/** drifting bubbles in a box (looping, pure function of t) */
export const Bubbles: React.FC<{center: V3; size: V3; t: number; n?: number; r?: number; k?: number; rise?: number; seed?: number}> = ({center, size, t, n = 12, r = 0.05, k = 1, rise = 0.18, seed = 0}) => k <= 0 ? null : <group position={center}>
  {Array.from({length: n}, (_, i) => { const j = i + seed * 31; const u = (hash(j * 1.3) + t * rise / size[1] * (0.6 + hash(j) * 0.8)) % 1;
    const p: V3 = [(hash(j * 2.1) - 0.5) * size[0] + Math.sin(t * 1.3 + j) * 0.04, u * size[1], (hash(j * 4.3) - 0.5) * size[2]];
    return <Bubble key={i} position={p} r={r * (0.5 + hash(j * 6.7)) * cl(k * 1.4 - hash(j * 3) * 0.4) * Math.min(1, (1 - u) * 6)} />; })}
</group>;

// =====================================================================================================
// THE BATHROOM. Room x −1.8…1.8, z −1.8…1.8, h 2.6. Shower corner back-left (head on the north wall at x −0.5),
// sink + mirror on the north wall at x 0.95, toilet on the west wall, the door in the +x wall at z 0.55.
// Palette: pink tiles + white grout, cream upper wall, warm ceiling light.
// =====================================================================================================
const tileMat = (key: string, base: string, grout: string, n: number, rep: [number, number]) => {
  const t = tex(key, 256, 256, (g) => { g.fillStyle = base; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1400; i++) { g.fillStyle = hash(i) > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; g.fillRect(hash(i * 2.1) * 256, hash(i * 3.3) * 256, 2, 2); }
    g.fillStyle = grout; const s = 256 / n; for (let i = 0; i <= n; i++) { g.fillRect(i * s - 1.5, 0, 3, 256); g.fillRect(0, i * s - 1.5, 256, 3); } }, rep);
  return new THREE.MeshLambertMaterial({map: t});
};
const mats = new Map<string, THREE.Material>();
const once = <T extends THREE.Material>(k: string, f: () => T) => { if (!mats.has(k)) mats.set(k, f()); return mats.get(k) as T; };
const label = (key: string, w: number, h: number, bg: string, fg: string, lines: string[], size: number) => once('lbl' + key, () => new THREE.MeshBasicMaterial({toneMapped: false, map: tex('lbl5-' + key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = F(700, size);
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.15));
})}));
export const DOOR: V3 = [1.8, 0, 0.55];
export const SHOWER: V3 = [-0.5, 2.05, -1.42];
export const Bathroom: React.FC<{t: number; doorShake?: number; doorFall?: number; hideS?: boolean; hideW?: boolean; ceiling?: boolean}> = ({t, doorShake = 0, doorFall = 0, hideS, hideW, ceiling = true}) => {
  const wallT = once('bwall', () => tileMat('bath-wall', '#E8A3B0', '#F7E6E9', 8, [4, 2])), floorT = once('bfloor', () => tileMat('bath-floor', '#F3EDE6', '#D9C9C4', 6, [5, 5]));
  const upper = PM('#EFE4D6', 'bupper'), white = PM('#F4F3EF', 'bwhite'), chrome = M('#C9CED2', 0.25, 0.8);
  const W = 3.6, D = 3.6, H = 2.6, TH = 1.5;   // tiled up to 1.5 m
  const wall = (pos: V3, ry: number, w: number, key: string) => <group position={pos} rotation={[0, ry, 0]} key={key}>
    <mesh position={[0, TH / 2 - pos[1], 0]} material={wallT} receiveShadow><planeGeometry args={[w, TH]} /></mesh>
    <mesh position={[0, TH + (H - TH) / 2 - pos[1], 0]} material={upper} receiveShadow><planeGeometry args={[w, H - TH]} /></mesh>
    <mesh position={[0, TH - pos[1], 0.01]} material={white}><boxGeometry args={[w, 0.05, 0.02]} /></mesh>
  </group>;
  // the door: shakes on the bangs, then falls flat inward (gravity) with a small bounce
  const fallA = doorFall <= 0 ? 0 : doorFall < 1 ? (Math.PI / 2) * doorFall * doorFall : Math.PI / 2 - 0.05 * Math.abs(Math.sin((doorFall - 1) * 14)) * Math.exp(-(doorFall - 1) * 4);
  const jig = doorShake > 0 ? Math.sin(t * 90) * 0.03 * doorShake : 0;
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorT} receiveShadow><planeGeometry args={[W, D]} /></mesh>
    {wall([0, 0, -D / 2], 0, W, 'n')}
    {!hideW && wall([-W / 2, 0, 0], Math.PI / 2, D, 'w')}
    {/* +x wall with the doorway (0.9 wide, 2.1 high) */}
    {wall([W / 2, 0, -0.8], -Math.PI / 2, 2.0, 'e1')}{wall([W / 2, 0, 1.425], -Math.PI / 2, 0.75, 'e2')}
    <mesh position={[W / 2, 2.35, DOOR[2]]} rotation={[0, -Math.PI / 2, 0]} material={upper}><planeGeometry args={[0.9, 0.5]} /></mesh>
    <group position={[W / 2, 0, DOOR[2]]} rotation={[0, 0, fallA]}>
      <mesh position={[-0.03, 1.05, 0]} rotation={[0, jig, 0]} material={PM('#F2F0EA', 'bdoor')} castShadow><boxGeometry args={[0.05, 2.08, 0.86]} /></mesh>
      <mesh position={[-0.07, 1.0, 0.32]} material={chrome}><sphereGeometry args={[0.03, 8, 6]} /></mesh>
      <mesh position={[-0.06, 1.65, 0]} rotation={[0, -Math.PI / 2, 0]} material={label('wc', 128, 64, '#476F66', '#fff', ['ห้องน้ำ'], 30)}><planeGeometry args={[0.24, 0.12]} /></mesh>
    </group>
    {!hideS && wall([0, 0, D / 2], Math.PI, W, 's')}
    {ceiling && <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={PM('#F4EEE6', 'bceil')}><planeGeometry args={[W, D]} /></mesh>}
    {/* shower: pipe, head, curtain rod + a half-drawn curtain, a shelf with the shampoo */}
    <mesh position={[SHOWER[0], 1.4, -D / 2 + 0.03]} material={chrome}><cylinderGeometry args={[0.015, 0.015, 1.4, 8]} /></mesh>
    <mesh position={[SHOWER[0], 2.08, -D / 2 + 0.2]} rotation={[Math.PI / 2, 0, 0]} material={chrome}><cylinderGeometry args={[0.015, 0.015, 0.38, 8]} /></mesh>
    <mesh position={SHOWER} rotation={[0.5, 0, 0]} material={chrome}><cylinderGeometry args={[0.07, 0.04, 0.05, 14]} /></mesh>
    <mesh position={[-0.7, 2.25, -0.55]} rotation={[0, 0, Math.PI / 2]} material={chrome}><cylinderGeometry args={[0.012, 0.012, 2.2, 6]} /></mesh>
    {Array.from({length: 7}, (_, i) => <mesh key={i} position={[-1.75 + i * 0.075, 1.35, -0.55 + (i % 2) * 0.03]} material={PM('#9CC9D6', 'curtain')} castShadow><boxGeometry args={[0.08, 1.8, 0.02]} /></mesh>)}
    <mesh position={[-1.05, 1.25, -D / 2 + 0.07]} material={white}><boxGeometry args={[0.4, 0.02, 0.12]} /></mesh>
    <group position={[-1.15, 1.26, -D / 2 + 0.07]}>
      <mesh position={[0, 0.1, 0]} material={PM('#4FA3C7', 'shamp')} castShadow><boxGeometry args={[0.08, 0.2, 0.05]} /></mesh>
      <mesh position={[0, 0.215, 0]} material={PM('#2E6F8E', 'shampcap')}><cylinderGeometry args={[0.018, 0.018, 0.03, 8]} /></mesh>
      <mesh position={[0, 0.1, 0.0255]} material={label('shampoo', 128, 128, '#F4F3EF', '#1E4E6A', ['แชมพู'], 34)}><planeGeometry args={[0.07, 0.07]} /></mesh>
    </group>
    <mesh position={[-0.92, 1.29, -D / 2 + 0.07]} material={PM('#F2A3B5', 'soapdish')}><boxGeometry args={[0.12, 0.015, 0.08]} /></mesh>
    {/* drain + bath mat */}
    <mesh position={[-0.5, 0.002, -1.2]} rotation={[-Math.PI / 2, 0, 0]} material={chrome}><circleGeometry args={[0.05, 12]} /></mesh>
    <mesh position={[0.35, 0.006, 0.55]} material={PM('#7FB7A8', 'mat')} receiveShadow><boxGeometry args={[0.6, 0.012, 0.4]} /></mesh>
    {/* sink + mirror */}
    <group position={[0.95, 0, -D / 2]}>
      <mesh position={[0, 0.42, 0.12]} material={white} castShadow><cylinderGeometry args={[0.08, 0.1, 0.84, 10]} /></mesh>
      <mesh position={[0, 0.86, 0.25]} material={white} castShadow><boxGeometry args={[0.55, 0.1, 0.42]} /></mesh>
      <mesh position={[0, 0.95, 0.12]} material={chrome}><cylinderGeometry args={[0.015, 0.015, 0.1, 8]} /></mesh>
      <mesh position={[0, 1.55, 0.012]} material={M('#BFD3DA', 0.06, 0.9)}><planeGeometry args={[0.5, 0.65]} /></mesh>
      <mesh position={[0, 1.55, 0.006]} material={chrome}><planeGeometry args={[0.54, 0.69]} /></mesh>
      <mesh position={[0.18, 0.95, 0.35]} material={PM('#F2D04A', 'cup')}><cylinderGeometry args={[0.03, 0.026, 0.09, 10]} /></mesh>
    </group>
    {/* toilet on the west wall */}
    <group position={[-1.5, 0, 0.9]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.2, 0.05]} material={white} castShadow><boxGeometry args={[0.36, 0.4, 0.5]} /></mesh>
      <mesh position={[0, 0.42, 0.05]} material={white}><boxGeometry args={[0.38, 0.04, 0.52]} /></mesh>
      <mesh position={[0, 0.6, -0.22]} material={white} castShadow><boxGeometry args={[0.4, 0.4, 0.16]} /></mesh>
    </group>
    {/* towel rail + towel on the east wall */}
    <mesh position={[1.76, 1.25, -0.9]} material={PM('#E6B44A', 'towel')} castShadow><boxGeometry args={[0.04, 0.5, 0.42]} /></mesh>
    {/* ceiling lamp */}
    <mesh position={[0, H - 0.03, 0]} material={MB('#FFF4E0')}><cylinderGeometry args={[0.18, 0.18, 0.03, 18]} /></mesh>
    <pointLight position={[0, H - 0.25, 0.2]} color="#FFE9D2" intensity={5.5} distance={7} decay={1.3} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
    <hemisphereLight args={['#FFE7E6', '#8A6A6E', 0.9]} />
  </group>;
};
/** shower water: thin falling streaks under the head + a little splash ring at the feet */
export const ShowerWater: React.FC<{t: number; head?: V3; floorY?: number; n?: number; k?: number}> = ({t, head = SHOWER, floorY = 0, n = 34, k = 1}) => {
  const m = once('water', () => new THREE.MeshBasicMaterial({color: '#E8F6FF', transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false}));
  if (k <= 0) return null;
  return <group>{Array.from({length: n}, (_, i) => { const u = (hash(i * 1.7) + t * 1.9 * (0.85 + hash(i) * 0.3)) % 1; const a = hash(i * 3.1) * Math.PI * 2, rr = 0.03 + hash(i * 5.3) * 0.2 * (0.3 + u);
    const y = head[1] - u * (head[1] - floorY); const len = 0.14;
    return <mesh key={i} material={m} position={[head[0] + Math.cos(a) * rr, y, head[2] + 0.35 * u + Math.sin(a) * rr]}><boxGeometry args={[0.004, len, 0.004]} /></mesh>; })}</group>;
};
/** the knocked-over yellow wet-floor sign */
export const WetSign: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => {
  const face = label('wet', 128, 160, '#F2C230', INK, ['ระวัง', 'พื้นลื่น'], 30);
  return <group position={position} rotation={rotation}>
    {[-1, 1].map((s) => <mesh key={s} position={[0, 0.04, s * 0.13]} rotation={[s * 1.25, 0, 0]} material={PM('#F2C230', 'wetsign')} castShadow><boxGeometry args={[0.3, 0.42, 0.012]} /></mesh>)}
    <mesh position={[0, 0.05, 0.15]} rotation={[-Math.PI / 2 + 0.32, 0, 0]} material={face}><planeGeometry args={[0.24, 0.3]} /></mesh>
  </group>;
};
/** police tape ring round a point (unrolls with k) — the EP4 one says "เขตกลิ่น", this one is for the soap */
const tapeTex = () => { const t = tex('tape-5', 1024, 64, (g) => { g.fillStyle = '#F2C230'; g.fillRect(0, 0, 1024, 64); g.fillStyle = INK; g.font = F(700, 38); for (let x = 0; x < 1024; x += 340) g.fillText('ห้ามเข้า · เขตลื่น', x + 12, 46); }); t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t; };
export const TapeRing5: React.FC<{center: V3; r: number; y: number; k: number}> = ({center, r, y, k}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: tapeTex(), side: THREE.DoubleSide, toneMapped: false}), []);
  if (k <= 0) return null;
  return <group position={[center[0], y, center[2]]}><mesh material={mat}><cylinderGeometry args={[r, r, 0.07, 40, 1, true, 0, Math.PI * 2 * cl(k)]} /></mesh></group>;
};

// =====================================================================================================
// RAID PROPS (bone space = cm unless noted): the "ปราบสบู่" shield, a yellow taser, the bomb-squad helmet,
// the long steel tongs (world space, from the hand to the tip), the evidence tray.
// =====================================================================================================
const shieldTex = () => tex('shield5', 256, 512, (g) => {
  g.clearRect(0, 0, 256, 512); g.fillStyle = 'rgba(190,215,235,0.3)'; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = 'rgba(30,40,55,0.9)'; g.lineWidth = 14; g.strokeRect(7, 7, 242, 498);
  g.fillStyle = 'rgba(255,255,255,0.97)'; g.font = F(700, 60); g.textAlign = 'center'; g.fillText('ปราบ', 128, 150); g.fillText('สบู่', 128, 225);
  g.font = F(600, 20); g.fillText(HANDLE, 128, 470);
});
export const makeShield5 = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(52, 92, 1.2), new THREE.MeshStandardMaterial({map: shieldTex(), transparent: true, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide})); m.frustumCulled = false; return m; };
export const makeTaser = () => {
  const g = new THREE.Group(); const y = new THREE.MeshLambertMaterial({color: '#E8C431'}), b = new THREE.MeshLambertMaterial({color: '#1E2328'});
  const body = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 3.4), y); body.position.x = 8; g.add(body);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(3.4, 8, 3), b); grip.position.set(2, -4.5, 0); g.add(grip);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2, 3.6, 3.6), b); nose.position.x = 16.5; g.add(nose);
  g.traverse((o: any) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } }); return g;
};
/** bomb-squad helmet: a big olive dome + a dark visor (sits over the box head) */
export const makeBombHelmet = () => {
  const g = new THREE.Group(); const ol = new THREE.MeshLambertMaterial({color: '#56613F', flatShading: true}), vis = new THREE.MeshBasicMaterial({color: '#2A3A44'});
  const dome = new THREE.Mesh(new THREE.BoxGeometry(32, 34, 32), ol); dome.position.set(0, 14, 0); g.add(dome);
  const v = new THREE.Mesh(new THREE.PlaneGeometry(24, 13), vis); v.position.set(0, 15, 16.2); g.add(v);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(44, 10, 36), ol); collar.position.set(0, -6, 0); g.add(collar);
  g.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); return g;
};
const tongTag = () => label('tongtag', 256, 128, '#F2C230', INK, ['วัตถุอันตราย', 'ลื่นมาก'], 40);
/** world-space tongs from the hand `a` to the tip `b`; `open` 0 (closed on the soap) … 1 */
export const Tongs: React.FC<{a: V3; b: V3; open?: number}> = ({a, b, open = 0}) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.clone().normalize());
  const steel = M('#AEB5BA', 0.3, 0.8); const gap = 0.012 + open * 0.05;
  return <group position={a} quaternion={q}>
    {[-1, 1].map((s) => <mesh key={s} position={[s * gap * 0.5, 0, L / 2]} rotation={[0, -s * gap * 0.5 / L, 0]} material={steel} castShadow><boxGeometry args={[0.008, 0.012, L]} /></mesh>)}
    {[-1, 1].map((s) => <mesh key={'p' + s} position={[s * (gap * 0.5 + 0.004), 0, L - 0.02]} material={M('#2B3033', 0.6)}><boxGeometry args={[0.006, 0.03, 0.04]} /></mesh>)}
    <mesh position={[0, -0.04, L * 0.62]} material={tongTag()}><planeGeometry args={[0.14, 0.07]} /></mesh>
    <mesh position={[0, -0.04, L * 0.62 - 0.001]} rotation={[0, Math.PI, 0]} material={tongTag()}><planeGeometry args={[0.14, 0.07]} /></mesh>
    <mesh position={[0, 0, 0.02]} material={M('#C0393B', 0.6)}><boxGeometry args={[0.03, 0.03, 0.12]} /></mesh>
  </group>;
};
const evTag = () => label('evtag', 256, 160, '#F4EFE2', INK, ['ของกลาง', 'จับรอบที่ 4', HANDLE], 34);
export const Tray: React.FC<{position: V3; tag?: boolean}> = ({position, tag = true}) => <group position={position}>
  <mesh position={[0, 0.008, 0]} material={PM('#9AA3AC', 'tray')} castShadow receiveShadow><boxGeometry args={[0.36, 0.016, 0.26]} /></mesh>
  {[[0, 0.13], [0, -0.13]].map(([x, z], i) => <mesh key={i} position={[x, 0.025, z]} material={PM('#8A939C', 'trayrim')}><boxGeometry args={[0.36, 0.035, 0.012]} /></mesh>)}
  {[0.18, -0.18].map((x) => <mesh key={x} position={[x, 0.025, 0]} material={PM('#8A939C', 'trayrim')}><boxGeometry args={[0.012, 0.035, 0.26]} /></mesh>)}
  {tag && <group position={[0.15, 0.09, 0.1]} rotation={[-0.25, -0.35, 0.08]}>
    <mesh position={[0, -0.04, 0]} material={M('#2A2A2E', 0.5)}><boxGeometry args={[0.004, 0.08, 0.004]} /></mesh>
    <mesh position={[0, 0.03, 0.002]} material={evTag()}><planeGeometry args={[0.12, 0.075]} /></mesh>
  </group>}
</group>;

// =====================================================================================================
// THE ESCAPE REPORT (pause-bait) + the red rubber stamp that slams onto it. Every field is a joke.
// =====================================================================================================
const reportTex = () => tex('report-5', 768, 1024, (g) => {
  g.fillStyle = '#F6F2E6'; g.fillRect(0, 0, 768, 1024); g.fillStyle = 'rgba(0,0,0,0.04)'; for (let i = 0; i < 2000; i++) g.fillRect(hash(i) * 768, hash(i * 2.3) * 1024, 2, 2);
  g.fillStyle = NAVY; g.fillRect(0, 0, 768, 130); g.fillStyle = CREAM; g.font = F(700, 52); g.textAlign = 'center'; g.fillText('รายงานนักโทษหลบหนี', 384, 84);
  g.textAlign = 'left'; const row = (y: number, k: string, v: string, red = false, size = 40) => { g.fillStyle = '#6A6A70'; g.font = F(600, 28); g.fillText(k, 46, y); g.fillStyle = red ? BRICK : INK; g.font = F(700, size); g.fillText(v, 46, y + 50); g.strokeStyle = '#C9C2B0'; g.lineWidth = 2; g.beginPath(); g.moveTo(46, y + 68); g.lineTo(722, y + 68); g.stroke(); };
  row(196, 'ชื่อ', 'นช. สบู่ (ห้อง 18)'); row(326, 'วิธีหนี', 'ลื่นหลุดซี่กรง'); row(456, 'ผู้สมรู้ร่วมคิด', 'นช. พัดลม 019 (เป่าฟองบังตา)', false, 36);
  row(586, 'โทษพัดลมล่าสุด', '100 ปี', true, 46); row(716, 'ผู้หลบหนีก่อนหน้า', 'ฝุ่น PM 2.5 (ห้อง 20)', false, 36);
  g.fillStyle = '#6A6A70'; g.font = F(600, 28); g.fillText('ผู้คุมเวร', 46, 880); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(170, 878); for (let i = 0; i < 7; i++) g.lineTo(180 + i * 7, 868 + (i % 2) * 12); g.stroke();
  g.fillStyle = '#9A9AA0'; g.font = F(500, 26); g.textAlign = 'right'; g.fillText(HANDLE, 722, 990);
  // a wet foam smudge on the corner (it was written in a hurry)
  g.fillStyle = 'rgba(200,215,225,0.35)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(640 + hash(i) * 90, 900 + hash(i * 2) * 80, 14 + hash(i * 3) * 18, 0, 7); g.fill(); }
});
const stampTex = () => tex('stamp-5', 640, 256, (g) => {
  g.clearRect(0, 0, 640, 256); g.save(); g.translate(320, 128); g.strokeStyle = '#D7262B'; g.lineWidth = 14; g.strokeRect(-300, -110, 600, 220);
  g.lineWidth = 4; g.strokeRect(-282, -92, 564, 184); g.fillStyle = '#D7262B'; g.textAlign = 'center'; g.font = F(700, 76); g.fillText('ตามจับไม่ได้', 0, 12); g.font = F(700, 46); g.fillText('(ลื่นเกิน)', 0, 72); g.restore();
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + hash(i) * 0.6})`; g.fillRect(hash(i * 2.7) * 640, hash(i * 5.1) * 256, 3 + hash(i) * 5, 2 + hash(i * 3) * 4); }
});
export const Report: React.FC<{position: V3; rotation?: V3; w?: number; stamp: number}> = ({position, rotation, w = 0.22, stamp}) => {
  const pm = useMemo(() => new THREE.MeshBasicMaterial({map: reportTex(), toneMapped: false}), []);
  const sm = useMemo(() => new THREE.MeshBasicMaterial({map: stampTex(), transparent: true, toneMapped: false, depthWrite: false, opacity: 0.92}), []);
  const h = w * 1024 / 768; const s = stamp <= 0 ? 0 : 1.8 - 0.8 * cl(stamp);
  return <group position={position} rotation={rotation}>
    <mesh material={pm}><planeGeometry args={[w, h]} /></mesh>
    {stamp > 0 && <mesh position={[0.02 * w, -0.23 * h, 0.001 + (1 - cl(stamp)) * 0.05]} rotation={[0, 0, 0.18]} scale={s} material={sm}><planeGeometry args={[w * 0.78, w * 0.78 * 256 / 640]} /></mesh>}
  </group>;
};
/** a clipboard under the report */
export const Clipboard: React.FC<{position: V3; rotation?: V3; w?: number}> = ({position, rotation, w = 0.26}) => <group position={position} rotation={rotation}>
  <mesh position={[0, 0, -0.004]} material={PM('#8A5A34', 'clip')}><boxGeometry args={[w, w * 1.45, 0.006]} /></mesh>
  <mesh position={[0, w * 0.68, 0.006]} material={M('#B9BEC2', 0.3, 0.8)}><boxGeometry args={[w * 0.4, 0.03, 0.016]} /></mesh>
</group>;
/** green EXIT sign for the corridor */
export const ExitSign: React.FC<{position: V3; rotation?: V3}> = ({position, rotation}) => <group position={position} rotation={rotation}>
  <mesh material={label('exit', 256, 96, '#2E9A5B', '#FFFFFF', ['ทางออก →'], 52)}><planeGeometry args={[0.5, 0.19]} /></mesh>
  <pointLight position={[0, -0.1, 0.2]} color="#7DF0A8" intensity={0.8} distance={2} decay={1.5} />
</group>;
