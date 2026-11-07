import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {HANDLE} from './data';

type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const CREAM = '#E6E7CF', NAVY = '#152028', TEAL = '#476F66', BRICK = '#B0402E', INK = '#14110F';

// =====================================================================================================
// KITCHEN at 2 a.m. Back wall z −2, fridge against it at x 0. Side door on the +x wall (x 2.2, z 0.2).
// Night palette: charcoal/navy, value ≈ 0.33; the fridge interior is the only warm-cold light source.
// =====================================================================================================
export const FRIDGE: V3 = [0, 0, -1.62];
export const FRIDGE_LIGHT: V3 = [0, 1.45, -1.55];
const fridgeInterior = () => tex('fridge-in', 256, 512, (g) => { g.fillStyle = '#F4F8FA'; g.fillRect(0, 0, 256, 512); g.fillStyle = 'rgba(160,190,205,0.35)'; for (let y = 0; y < 512; y += 64) g.fillRect(0, y, 256, 3); });
export const Fridge: React.FC<{door: number; light: number}> = ({door, light}) => {
  const body = PM('#D9DCD3', 'fridge'), trim = PM('#9EA3A0', 'fridge2');
  const inner = useMemo(() => new THREE.MeshBasicMaterial({map: fridgeInterior(), toneMapped: false}), []);
  const W = 0.78, H = 1.82, D = 0.7, th = 0.04;
  const ang = -door * 1.95;   // hinge on the left edge, swings toward the camera / left
  return <group position={FRIDGE}>
    {/* cabinet: back, sides, top, bottom (open front) */}
    <mesh position={[0, H / 2, -D / 2]} material={body} castShadow><boxGeometry args={[W, H, th]} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * (W / 2 - th / 2), H / 2, 0]} material={body} castShadow><boxGeometry args={[th, H, D]} /></mesh>)}
    <mesh position={[0, H - th / 2, 0]} material={body}><boxGeometry args={[W, th, D]} /></mesh>
    <mesh position={[0, th / 2, 0]} material={body}><boxGeometry args={[W, th, D]} /></mesh>
    {/* glowing interior lining + glass shelves */}
    <mesh position={[0, H / 2, -D / 2 + th / 2 + 0.002]} material={inner}><planeGeometry args={[W - 2 * th, H - 2 * th]} /></mesh>
    {[0.48, 0.9, 1.32].map((y) => <mesh key={y} position={[0, y, 0.02]} material={useMemo(() => new THREE.MeshBasicMaterial({color: '#DDEFF5', transparent: true, opacity: 0.55, toneMapped: false}), [])}><boxGeometry args={[W - 2 * th, 0.012, D - 0.1]} /></mesh>)}
    {/* the door */}
    <group position={[-W / 2, 0, D / 2]} rotation={[0, ang, 0]}>
      <mesh position={[W / 2, H / 2, 0.03]} material={body} castShadow><boxGeometry args={[W, H, 0.06]} /></mesh>
      <mesh position={[W - 0.07, H * 0.62, 0.075]} material={trim}><boxGeometry args={[0.03, 0.42, 0.03]} /></mesh>
      {[0.4, 0.85, 1.3].map((y) => <mesh key={y} position={[W / 2, y, -0.06]} material={inner}><boxGeometry args={[W - 0.12, 0.08, 0.08]} /></mesh>)}
      <mesh position={[0.25, 1.35, 0.062]} material={useMemo(() => new THREE.MeshBasicMaterial({map: tex('fridge-note', 128, 128, (g) => { g.fillStyle = '#F2E58A'; g.fillRect(0, 0, 128, 128); g.fillStyle = INK; g.font = F(700, 24); g.textAlign = 'center'; g.fillText('อย่าลืม', 64, 46); g.fillText('ซื้อนม', 64, 80); }), toneMapped: false}), [])}><planeGeometry args={[0.12, 0.12]} /></mesh>
    </group>
    {/* everyday contents */}
    <mesh position={[0.24, 0.62, -0.05]} material={PM('#F3F1EA', 'milk')} castShadow><boxGeometry args={[0.09, 0.24, 0.09]} /></mesh>
    <mesh position={[0.24, 0.77, -0.05]} material={PM('#3E7CB1', 'milk2')}><boxGeometry args={[0.09, 0.05, 0.09]} /></mesh>
    {[-0.28, -0.2, -0.12].map((x) => <mesh key={x} position={[x, 0.94, 0.05]} material={PM('#EDE2C8', 'egg')} scale={[0.03, 0.04, 0.03]}><sphereGeometry args={[1, 8, 6]} /></mesh>)}
    {light > 0 && <pointLight position={[0, 1.45, 0.1]} color="#EAF6FF" intensity={4.5 * light} distance={4.5} decay={1.6} />}
    {light > 0 && <spotLight position={[0, 1.2, 0.25]} target-position={[0, 1.3, 2.5]} angle={0.7} penumbra={0.6} color="#E4F2FF" intensity={9 * light} distance={6} decay={1.4} castShadow />}
  </group>;
};
const wallTex = (base: string, key: string) => PM(base, key, 0.03);
export const KITCHEN_DOOR: V3 = [2.18, 0, 0.25];
export const Kitchen: React.FC<{t: number; door?: number; doorFall?: number; light: number; hideS?: boolean}> = ({t, door = 0, doorFall = 0, light, hideS}) => {
  const wall = wallTex('#2E3A48', 'kwall'), floor = wallTex('#3C3A3A', 'kfloor'), counter = PM('#4A5A63', 'kcount'), top = PM('#8C8F8A', 'ktop');
  // the side door: falls flat inward when kicked (gravity: angle ∝ t²), then a small bounce
  const fallA = doorFall <= 0 ? 0 : doorFall < 1 ? (Math.PI / 2) * doorFall * doorFall : Math.PI / 2 - 0.06 * Math.abs(Math.sin((doorFall - 1) * 14)) * Math.exp(-(doorFall - 1) * 4);
  return <group>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floor}><planeGeometry args={[6, 6]} /></mesh>
    <mesh position={[0, 1.4, -2]} material={wall} receiveShadow><planeGeometry args={[4.6, 2.8]} /></mesh>
    <mesh position={[-2.2, 1.4, 0.4]} rotation={[0, Math.PI / 2, 0]} material={wall}><planeGeometry args={[4.8, 2.8]} /></mesh>
    {/* +x wall with the doorway */}
    <mesh position={[2.2, 1.4, -1.25]} rotation={[0, -Math.PI / 2, 0]} material={wall}><planeGeometry args={[1.5, 2.8]} /></mesh>
    <mesh position={[2.2, 1.4, 1.9]} rotation={[0, -Math.PI / 2, 0]} material={wall}><planeGeometry args={[2.3, 2.8]} /></mesh>
    <mesh position={[2.2, 2.45, 0.25]} rotation={[0, -Math.PI / 2, 0]} material={wall}><planeGeometry args={[0.9, 0.7]} /></mesh>
    {/* the door slab, hinged at its bottom outer edge when it falls */}
    <group position={[2.2, 0, 0.25]} rotation={[0, 0, fallA]}>
      <mesh position={[-0.03, 1.05, 0]} rotation={[0, -door * 1.4, 0]} material={PM('#6B4E3A', 'kdoor')} castShadow><boxGeometry args={[0.05, 2.1, 0.86]} /></mesh>
      <mesh position={[-0.07, 1.0, 0.33]} material={M('#C8C2B0', 0.4, 0.6)}><sphereGeometry args={[0.03, 8, 6]} /></mesh>
    </group>
    {!hideS && <mesh position={[0, 1.4, 2.8]} rotation={[0, Math.PI, 0]} material={wall}><planeGeometry args={[4.6, 2.8]} /></mesh>}
    {/* counters left of the fridge, a window with blinds above them */}
    <mesh position={[-1.3, 0.45, -1.7]} material={counter} castShadow><boxGeometry args={[1.5, 0.9, 0.6]} /></mesh>
    <mesh position={[-1.3, 0.92, -1.7]} material={top}><boxGeometry args={[1.54, 0.04, 0.64]} /></mesh>
    <mesh position={[-1.3, 1.75, -1.99]} material={useMemo(() => new THREE.MeshBasicMaterial({map: tex('k-window', 128, 128, (g) => { g.fillStyle = '#20304E'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#E8E6CF'; g.beginPath(); g.arc(92, 34, 12, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.45)'; for (let y = 4; y < 128; y += 12) g.fillRect(0, y, 128, 5); }), toneMapped: false}), [])}><planeGeometry args={[0.9, 0.7]} /></mesh>
    <mesh position={[-1.75, 1.03, -1.75]} material={PM('#B0402E', 'kettle')} castShadow><cylinderGeometry args={[0.08, 0.1, 0.18, 10]} /></mesh>
    <mesh material={useMemo(() => new THREE.MeshBasicMaterial({map: tex('k-clock', 128, 128, (g) => { g.fillStyle = '#E6E7CF'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.moveTo(64, 64); g.lineTo(88, 50); g.stroke(); g.fillStyle = BRICK; g.font = F(700, 20); g.textAlign = 'center'; g.fillText('02:00', 64, 104); }), toneMapped: false}), [])} position={[1.25, 2.0, -1.99]}><circleGeometry args={[0.18, 24]} /></mesh>
    {/* night fill */}
    <hemisphereLight args={['#4A5C86', '#1A1A22', 0.55]} />
    <directionalLight position={[-3, 3, -4]} color="#8FA6D8" intensity={0.35} />
  </group>;
};

// =====================================================================================================
// The accused: a durian. Low-poly olive core, a crown of spikes, lobe seams, an ink deadpan face.
// =====================================================================================================
const durianCore = (() => { const g = new THREE.IcosahedronGeometry(1, 1); const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setXYZ(i, p.getX(i), y * 1.18, p.getZ(i)); } g.computeVertexNormals(); return g; })();
const SPIKES: V3[] = (() => { const out: V3[] = []; const g = new THREE.IcosahedronGeometry(1, 1); const p = g.getAttribute('position') as THREE.BufferAttribute; const seen = new Set<string>();
  for (let i = 0; i < p.count; i++) { const v: V3 = [p.getX(i), p.getY(i) * 1.18, p.getZ(i)]; const k = v.map((x) => x.toFixed(2)).join(); if (!seen.has(k)) { seen.add(k); out.push(v); } } return out; })();
const durianFace = () => tex('durian-face', 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128); g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'round'; g.lineWidth = 7;
  for (const x of [88, 168]) { g.beginPath(); g.ellipse(x, 66, 9, 11, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 20, 52); g.lineTo(x + 20, 52); g.stroke(); }
  g.lineWidth = 5; g.beginPath(); g.moveTo(108, 104); g.lineTo(148, 104); g.stroke();
});
export const LOBES = 5;
export const Durian: React.FC<{position: V3; r?: number; yaw?: number; look?: V3; face?: boolean; squash?: number}> = ({position, r = 0.15, yaw, look, face = true, squash = 0}) => {
  const core = PM('#7C8A3C', 'durian', 0.08), spike = useMemo(() => new THREE.MeshLambertMaterial({color: '#6A7832', flatShading: true}), []);
  const faceM = useMemo(() => new THREE.MeshBasicMaterial({map: durianFace(), transparent: true, toneMapped: false, depthWrite: false}), []);
  const y = look ? Math.atan2(look[0] - position[0], look[2] - position[2]) : yaw ?? 0;
  return <group position={position} rotation={[0, y, 0]} scale={[r * (1 + squash * 0.15), r * (1 - squash * 0.2), r * (1 + squash * 0.15)]}>
    <mesh geometry={durianCore} material={core} castShadow />
    {SPIKES.map((v, i) => { const n = new THREE.Vector3(...v).normalize(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      return <mesh key={i} position={[v[0] * 1.02, v[1] * 1.02, v[2] * 1.02]} quaternion={q} material={spike}><coneGeometry args={[0.13, 0.32, 4]} /></mesh>; })}
    {Array.from({length: LOBES}, (_, i) => <mesh key={'s' + i} rotation={[0, (i / LOBES) * Math.PI * 2, 0]} material={MB('#4C5A24')}><torusGeometry args={[1.03, 0.025, 4, 24, Math.PI]} /></mesh>)}
    <mesh position={[0, 1.25, 0]} material={PM('#5A4A2A', 'stem')}><cylinderGeometry args={[0.06, 0.1, 0.35, 6]} /></mesh>
    {face && <mesh position={[0, 0.05, 1.06]} material={faceM}><planeGeometry args={[1.2, 0.6]} /></mesh>}
  </group>;
};
/** where a cuff sits on lobe i (unit-radius local coordinates, scaled by r) */
export const lobePoint = (i: number): V3 => { const a = (i / LOBES) * Math.PI * 2 + 0.35; return [Math.sin(a) * 1.05, 0.15 - (i % 2) * 0.35, Math.cos(a) * 1.05]; };

// =====================================================================================================
// The smell: sickly yellow-green wavy ribbons that travel along a path + a few low-poly puffs.
// =====================================================================================================
const smellMat = new THREE.MeshBasicMaterial({color: '#B9C45A', transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, toneMapped: false});
const puffMat = new THREE.MeshLambertMaterial({color: '#A7B54E', flatShading: true, transparent: true, opacity: 0.7, depthWrite: false});
const puffGeo = new THREE.IcosahedronGeometry(1, 0);
export const Smell: React.FC<{from: V3; to: V3; t: number; k?: number; n?: number; amp?: number; w?: number; speed?: number; seed?: number}> = ({from, to, t, k = 1, n = 3, amp = 0.08, w = 0.018, speed = 1, seed = 0}) => {
  if (k <= 0) return null;
  const A = new THREE.Vector3(...from), B = new THREE.Vector3(...to), d = B.clone().sub(A); const len = d.length();
  const side = new THREE.Vector3(0, 1, 0).cross(d).normalize(); if (side.lengthSq() < 0.1) side.set(1, 0, 0);
  const up = d.clone().cross(side).normalize();
  const ribbons = Array.from({length: n}, (_, j) => {
    const off = side.clone().multiplyScalar((j - (n - 1) / 2) * amp * 1.6).add(up.clone().multiplyScalar(Math.sin(j * 2.1 + seed) * amp));
    const head = cl(k * 1.15 - j * 0.08);   // ribbons reach out one after another
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 28; i++) { const u = (i / 28) * head; const wave = Math.sin(u * len * 9 - t * 7 * speed + j * 1.7 + seed) * amp * (0.4 + u);
      pts.push(A.clone().add(d.clone().multiplyScalar(u)).add(off.clone().multiplyScalar(0.5 + u)).add(up.clone().multiplyScalar(wave))); }
    if (head < 0.02) return null;
    return <mesh key={j} material={smellMat}><tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 40, w * (0.7 + 0.3 * Math.sin(t * 3 + j)), 5, false]} /></mesh>;
  });
  const puffs = Array.from({length: 6}, (_, i) => { const u = ((t * 0.5 * speed + hash(i + seed) ) % 1) * cl(k * 1.2); const p = A.clone().add(d.clone().multiplyScalar(u)).add(side.clone().multiplyScalar((hash(i * 3 + seed) - 0.5) * amp * 3)).add(up.clone().multiplyScalar(Math.sin(t * 2 + i) * amp));
    const r = amp * (0.25 + hash(i * 7 + seed) * 0.35) * (0.5 + u); return <mesh key={'p' + i} geometry={puffGeo} material={puffMat} position={p} scale={r} rotation={[t + i, t * 0.7, 0]} />; });
  return <group>{ribbons}{puffs}</group>;
};
/** a green fog that fills a room (k 0..1) */
export const SmellFog: React.FC<{center: V3; k: number; t: number; size?: number}> = ({center, k, t, size = 2.2}) => k <= 0 ? null : <group>
  {Array.from({length: 18}, (_, i) => { const a = hash(i) * Math.PI * 2, rr = hash(i * 2) * size * k; const p: V3 = [center[0] + Math.cos(a) * rr, center[1] + (hash(i * 3) - 0.3) * 1.2 * k + Math.sin(t + i) * 0.05, center[2] + Math.sin(a) * rr];
    return <mesh key={i} geometry={puffGeo} material={puffMat} position={p} scale={(0.25 + hash(i * 5) * 0.35) * k} rotation={[i, t * 0.3, 0]} />; })}
</group>;

// =====================================================================================================
// Police tape: a ring of yellow tape at a height around a centre, unrolling as k goes 0→1
// =====================================================================================================
const tapeTex = () => { const t = tex('tape-4', 1024, 64, (g) => { g.fillStyle = '#F2C230'; g.fillRect(0, 0, 1024, 64); g.fillStyle = INK; g.font = F(700, 38); for (let x = 0; x < 1024; x += 340) { g.fillText('ห้ามเข้า · เขตกลิ่น', x + 12, 46); } }); t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t; };
export const TapeRing: React.FC<{center: V3; r: number; y: number; k: number; tilt?: number}> = ({center, r, y, k, tilt = 0}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: tapeTex(), side: THREE.DoubleSide, toneMapped: false}), []);
  if (k <= 0) return null;
  return <group position={[center[0], y, center[2]]} rotation={[tilt, 0, tilt * 0.5]}>
    <mesh material={mat}><cylinderGeometry args={[r, r, 0.07, 48, 1, true, 0, Math.PI * 2 * cl(k)]} /></mesh>
    {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.sin(i * Math.PI / 2 + 0.4) * r, -y / 2, Math.cos(i * Math.PI / 2 + 0.4) * r]} material={PM('#E6E7CF', 'post')}><cylinderGeometry args={[0.02, 0.025, y, 6]} /></mesh>)}
  </group>;
};

// =====================================================================================================
// Gas mask, built on the head bone (kit units: cm, head frame x left, y up, z forward)
// =====================================================================================================
export const makeGasMask = () => {
  const g = new THREE.Group(); const rub = new THREE.MeshLambertMaterial({color: '#1E2328'}), can = new THREE.MeshLambertMaterial({color: '#4E5A3A'}), lens = new THREE.MeshBasicMaterial({color: '#9FB8C8'});
  const face = new THREE.Mesh(new THREE.BoxGeometry(17, 14, 4), rub); face.position.set(0, 12, 12.5); g.add(face);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.2, 12), lens); l.rotation.x = Math.PI / 2; l.position.set(s * 4.2, 15, 14.8); g.add(l);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 5, 10), can); c.rotation.z = s * 1.1; c.rotation.x = 0.4; c.position.set(s * 6.5, 7, 15.5); g.add(c); }
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 5, 10), rub); snout.rotation.x = Math.PI / 2; snout.position.set(0, 8, 16); g.add(snout);
  g.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); return g;
};

// =====================================================================================================
// The 3D phone that slides up from the bottom edge in front of the camera (~5 frames), thumb presses call
// =====================================================================================================
const phoneScreen = (pressed: boolean) => tex('phone4-' + pressed, 360, 720, (g) => {
  g.fillStyle = '#10161D'; g.fillRect(0, 0, 360, 720); g.fillStyle = '#E6E7CF'; g.textAlign = 'center';
  g.font = F(600, 30); g.fillText(pressed ? 'กำลังโทร…' : 'แจ้งเหตุ', 180, 120); g.font = F(700, 120); g.fillText('191', 180, 300);
  g.font = F(500, 24); g.fillStyle = '#9AA6AE'; g.fillText('ตำรวจ · ' + HANDLE, 180, 350);
  g.fillStyle = pressed ? '#E0322E' : '#2FA866'; g.beginPath(); g.arc(180, 560, 62, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = F(700, 34); g.fillText(pressed ? 'วาง' : 'โทร', 180, 572);
});
export const Phone3D: React.FC<{cam: V3; look: V3; k: number; pressed: boolean; thumb: number}> = ({cam, look, k, pressed, thumb}) => {
  const scr = useMemo(() => [new THREE.MeshBasicMaterial({map: phoneScreen(false), toneMapped: false}), new THREE.MeshBasicMaterial({map: phoneScreen(true), toneMapped: false})], []);
  const C = new THREE.Vector3(...cam), f = new THREE.Vector3(...look).sub(C).normalize(), r = f.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), u = r.clone().cross(f);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate())).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.06));
  const pos = C.clone().add(f.clone().multiplyScalar(0.42)).add(u.clone().multiplyScalar(-0.42 + 0.4 * k)).add(r.clone().multiplyScalar(0.02));
  return <group position={pos} quaternion={q}>
    <mesh material={PM('#1B232C', 'ph4')}><boxGeometry args={[0.15, 0.3, 0.014]} /></mesh>
    <mesh position={[0, 0, 0.0075]} material={scr[pressed ? 1 : 0]}><planeGeometry args={[0.135, 0.27]} /></mesh>
    {/* thumb: comes in from the lower right, presses the call button */}
    <group position={[0.07 - 0.07 * thumb, -0.2 + 0.11 * thumb, 0.02 + 0.006 * (1 - thumb)]} rotation={[0, 0, 0.7]}>
      <mesh material={PM('#D9A879', 'thumb')}><boxGeometry args={[0.035, 0.11, 0.03]} /></mesh>
      <mesh position={[0, 0.045, 0.016]} material={PM('#EBC9A5', 'nail')}><boxGeometry args={[0.024, 0.022, 0.003]} /></mesh>
    </group>
  </group>;
};

// =====================================================================================================
// Pause-bait: the mosquito's transfer request. Every field is a joke.
// =====================================================================================================
const formTex = () => tex('form-4', 768, 1024, (g) => {
  g.fillStyle = '#F6F2E6'; g.fillRect(0, 0, 768, 1024); g.fillStyle = 'rgba(0,0,0,0.04)'; for (let i = 0; i < 2000; i++) g.fillRect(hash(i) * 768, hash(i * 2.3) * 1024, 2, 2);
  g.fillStyle = NAVY; g.fillRect(0, 0, 768, 120); g.fillStyle = CREAM; g.font = F(700, 56); g.textAlign = 'center'; g.fillText('คำร้องขอย้ายห้อง', 384, 80);
  g.textAlign = 'left'; const row = (y: number, k: string, v: string, red = false) => { g.fillStyle = '#6A6A70'; g.font = F(600, 30); g.fillText(k, 50, y); g.fillStyle = red ? BRICK : INK; g.font = F(700, 38); g.fillText(v, 50, y + 50); g.strokeStyle = '#C9C2B0'; g.lineWidth = 2; g.beginPath(); g.moveTo(50, y + 66); g.lineTo(718, y + 66); g.stroke(); };
  row(190, 'ผู้ร้อง', 'ยุง (นช. ห้อง 18)'); row(320, 'สาเหตุ', 'กลิ่นทุเรียน + พัดลมส่ายหน้า'); row(450, 'ห้องที่ขอ', 'ห้องไหนก็ได้ ที่ไม่มีพัดลม', true);
  row(580, 'ประวัติ', 'โดนพัดลมเป่าติดกำแพง (ตอน 2)'); row(710, 'ความเร่งด่วน', '■ ด่วน  ■ ด่วนมาก  ☑ หายใจไม่ออก');
  g.fillStyle = '#6A6A70'; g.font = F(600, 30); g.fillText('ลงชื่อ', 50, 880); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(170, 880); for (let i = 0; i < 6; i++) g.lineTo(180 + i * 6, 870 + (i % 2) * 10); g.stroke();
  g.fillStyle = '#9A9AA0'; g.font = F(500, 26); g.textAlign = 'right'; g.fillText(HANDLE, 718, 990);
  g.save(); g.translate(560, 900); g.rotate(-0.2); g.strokeStyle = BRICK; g.lineWidth = 6; g.strokeRect(-110, -40, 220, 70); g.fillStyle = BRICK; g.font = F(700, 40); g.textAlign = 'center'; g.fillText('รอพิจารณา', 0, 10); g.restore();
});
export const TransferForm: React.FC<{position: V3; rotation?: V3; w?: number}> = ({position, rotation, w = 0.18}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: formTex(), toneMapped: false, side: THREE.DoubleSide}), []);
  return <mesh position={position} rotation={rotation} material={mat}><planeGeometry args={[w, w * 1024 / 768]} /></mesh>;
};
/** 4-point stars circling a fallen head */
const starMat = new THREE.MeshBasicMaterial({color: '#F2C230', side: THREE.DoubleSide, toneMapped: false});
const starGeo = (() => { const s = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r = i % 2 ? 0.35 : 1; const x = Math.sin(a) * r, y = Math.cos(a) * r; if (i) s.lineTo(x, y); else s.moveTo(x, y); } return new THREE.ShapeGeometry(s); })();
export const Stars: React.FC<{center: V3; t: number; r?: number; size?: number}> = ({center, t, r = 0.18, size = 0.045}) => <group position={center}>
  {[0, 1, 2].map((i) => { const a = t * 4 + (i * Math.PI * 2) / 3; return <mesh key={i} geometry={starGeo} material={starMat} position={[Math.cos(a) * r, 0.05 + Math.sin(a * 2) * 0.02, Math.sin(a) * r]} rotation={[-Math.PI / 2, 0, a]} scale={size} />; })}
</group>;
