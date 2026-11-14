import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {MB, M, tex, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {Handcuffs} from '../AbsurdEp1/props';
import {Cable} from '../AbsurdEp6/props';
import {label} from '../AbsurdEp8/props';
import {HANDLE} from './data';

/** EP16 คดีแรงโน้มถ่วง — the new things. Gravity itself is never drawn (no body, no face): before the arrest it is told by what falls
 *  (real ½·g·t²) and a red dashed annotation; after the arrest by what floats. In custody it is a pair of closed cuffs round nothing. */
export type V3 = [number, number, number];
export const G = 9.8;
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/** weightless drift of a loose thing released at u = 0: it eases off the ground, then rises at v m/s and tumbles slowly.
 *  Returns [rise, rx, rz, yaw]; seed gives every object its own speed and spin. */
export const drift = (seed: number, u: number, v = 0.55): [number, number, number, number] => {
  if (u <= 0) return [0, 0, 0, 0]; const k = 0.6 + hash(seed) * 0.8; const rise = v * k * (u - 0.5 * (1 - Math.exp(-u * 2)));
  return [rise, (hash(seed + 1) - 0.5) * 0.55 * u * k, (hash(seed + 2) - 0.5) * 0.55 * u * k, (hash(seed + 3) - 0.5) * 0.5 * u];
};

// =====================================================================================================
// THE PHONE (the damaged property). Local: screen faces +z, long side along y. crack 0…1 = how far the cracks have run.
// =====================================================================================================
export const PH = {w: 0.085, h: 0.172, d: 0.011};
const screenTex = () => tex('ep16-screen', 256, 512, (g) => {
  g.fillStyle = '#F4F2EC'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#1B2831'; g.fillRect(0, 0, 256, 56); g.fillStyle = '#F4F2EC'; g.font = F(700, 22); g.textAlign = 'center'; g.fillText(HANDLE, 128, 37);
  ['#E9A23B', '#6FA39A', '#D9634A', '#7C8FA6'].forEach((c, i) => { const y = 70 + i * 110; g.fillStyle = c; g.fillRect(14, y, 228, 70); g.fillStyle = '#C9C4B6'; g.fillRect(14, y + 78, 150, 9); g.fillRect(14, y + 92, 96, 9); });
});
const CRACKS: [number, number, number, number][] = (() => { const out: [number, number, number, number][] = []; const c: [number, number] = [0.18, -0.22];   // impact point (fraction of half size)
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + hash(i) * 0.5; let x = c[0], y = c[1];
    for (let k = 0; k < 3; k++) { const len = 0.25 + hash(i * 3 + k) * 0.4, b = a + (hash(i * 5 + k) - 0.5) * 0.9; const nx = x + Math.cos(b) * len, ny = y + Math.sin(b) * len * 1.6; out.push([x, y, nx, ny]); x = nx; y = ny; } }
  return out; })();
export const Phone: React.FC<{position: V3; rotation?: V3; quaternion?: THREE.Quaternion; crack?: number; scale?: number; lit?: number}> = ({position, rotation, quaternion, crack = 0, scale = 1, lit = 1}) => {
  const scr = useMemo(() => new THREE.MeshBasicMaterial({map: screenTex(), toneMapped: false}), []);
  const n = Math.round(cl(crack) * CRACKS.length); const hw = PH.w / 2 - 0.004, hh = PH.h / 2 - 0.004;
  return <group position={position} rotation={quaternion ? undefined : rotation} quaternion={quaternion} scale={scale}>
    <mesh castShadow material={PM('#1B232C', 'ph16')}><boxGeometry args={[PH.w, PH.h, PH.d]} /></mesh>
    <mesh position={[0, 0, PH.d / 2 + 0.0006]} material={lit > 0.5 ? scr : MB('#10161D')}><planeGeometry args={[PH.w - 0.008, PH.h - 0.008]} /></mesh>
    {CRACKS.slice(0, n).map(([ax, ay, bx, by], i) => { const x0 = cl(ax, -1, 1) * hw, y0 = cl(ay, -1, 1) * hh, x1 = cl(bx, -1, 1) * hw, y1 = cl(by, -1, 1) * hh; const len = Math.hypot(x1 - x0, y1 - y0); if (len < 1e-4) return null;
      return <mesh key={i} position={[(x0 + x1) / 2, (y0 + y1) / 2, PH.d / 2 + 0.0012]} rotation={[0, 0, Math.atan2(y1 - y0, x1 - x0)]} material={MB(i % 3 ? '#F7F7F2' : '#22262A', 'crk')}><planeGeometry args={[len, 0.0016]} /></mesh>; })}
  </group>;
};
/** the phone held up to the camera for the 191 call (EP4 Phone3D with this episode's cracked glass) */
const callTex = (pressed: boolean) => tex('ep16-call-' + pressed, 360, 720, (g) => {
  g.fillStyle = '#10161D'; g.fillRect(0, 0, 360, 720); g.fillStyle = '#E6E7CF'; g.textAlign = 'center';
  g.font = F(600, 30); g.fillText(pressed ? 'กำลังโทร…' : 'แจ้งเหตุ', 180, 120); g.font = F(700, 120); g.fillText('191', 180, 300);
  g.font = F(500, 24); g.fillStyle = '#9AA6AE'; g.fillText('ตำรวจ · ' + HANDLE, 180, 350);
  g.fillStyle = pressed ? '#E0322E' : '#2FA866'; g.beginPath(); g.arc(180, 560, 62, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = F(700, 34); g.fillText(pressed ? 'วาง' : 'โทร', 180, 572);
  g.lineCap = 'round'; CRACKS.forEach(([ax, ay, bx, by], i) => { g.strokeStyle = i % 3 ? 'rgba(247,247,242,0.9)' : 'rgba(0,0,0,0.8)'; g.lineWidth = i % 3 ? 3 : 2; g.beginPath(); g.moveTo(180 + ax * 180, 360 - ay * 360); g.lineTo(180 + bx * 180, 360 - by * 360); g.stroke(); });
});
export const CallPhone: React.FC<{cam: V3; look: V3; k: number; pressed: boolean; thumb: number}> = ({cam, look, k, pressed, thumb}) => {
  const scr = useMemo(() => [new THREE.MeshBasicMaterial({map: callTex(false), toneMapped: false}), new THREE.MeshBasicMaterial({map: callTex(true), toneMapped: false})], []);
  const C = new THREE.Vector3(...cam), f = new THREE.Vector3(...look).sub(C).normalize(), r = f.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), u = r.clone().cross(f);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate())).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.06));
  const pos = C.clone().add(f.clone().multiplyScalar(0.42)).add(u.clone().multiplyScalar(-0.42 + 0.4 * k)).add(r.clone().multiplyScalar(0.02));
  return <group position={pos} quaternion={q}>
    <mesh material={PM('#1B232C', 'ph16')}><boxGeometry args={[0.15, 0.3, 0.014]} /></mesh>
    <mesh position={[0, 0, 0.0075]} material={scr[pressed ? 1 : 0]}><planeGeometry args={[0.135, 0.27]} /></mesh>
    <group position={[0.07 - 0.07 * thumb, -0.2 + 0.11 * thumb, 0.02 + 0.006 * (1 - thumb)]} rotation={[0, 0, 0.7]}>
      <mesh material={PM('#D9A879', 'thumb')}><boxGeometry args={[0.035, 0.11, 0.03]} /></mesh>
      <mesh position={[0, 0.045, 0.016]} material={PM('#EBC9A5', 'nail')}><boxGeometry args={[0.024, 0.022, 0.003]} /></mesh>
    </group>
  </group>;
};

// =====================================================================================================
// THE ANNOTATION: a red dashed arrow pointing down with a label, like a mark on an evidence photo. It turns to the camera about y.
// position = the arrow's tip. k pops it in (0…1).
// =====================================================================================================
const noteTex = (text: string) => new THREE.MeshBasicMaterial({transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, map: tex('ep16-note-' + text, 512, 640, (g) => {
  g.clearRect(0, 0, 512, 640); g.strokeStyle = '#D8321F'; g.fillStyle = '#D8321F'; g.lineWidth = 16; g.lineCap = 'butt'; g.setLineDash([34, 22]);
  g.beginPath(); g.moveTo(256, 150); g.lineTo(256, 520); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(256, 636); g.lineTo(196, 510); g.lineTo(316, 510); g.closePath(); g.fill();
  g.fillStyle = '#D8321F'; g.fillRect(16, 16, 480, 112); g.fillStyle = '#FFF6EC'; g.font = F(700, 70); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 76);
})});
export const Note: React.FC<{position: V3; cam: V3; h?: number; k?: number; text?: string}> = ({position, cam, h = 0.6, k = 1, text = 'แรงโน้มถ่วง'}) => {
  const mat = useMemo(() => noteTex(text), [text]); if (k <= 0.01) return null;
  return <group position={position} rotation={[0, Math.atan2(cam[0] - position[0], cam[2] - position[2]), 0]} scale={k}>
    <mesh position={[0, h / 2, 0]} material={mat} renderOrder={5}><planeGeometry args={[h * 0.8, h]} /></mesh></group>;
};

// =====================================================================================================
// THE RIG: a tripod with a pulley over the hole, a rope through it down the road, a hook on the end; the hole in the road.
// =====================================================================================================
export const RIG = {h: 4.2, leg: 1.7};
const ROPE = '#C9A56B';
export const Tripod: React.FC<{position: V3}> = ({position}) => <group position={position}>
  {[0, 1, 2].map((i) => { const a = Math.PI / 2 + (i * Math.PI * 2) / 3 + 0.5; const foot: V3 = [Math.cos(a) * RIG.leg, 0, Math.sin(a) * RIG.leg];
    return <Cable key={i} a={foot} b={[0, RIG.h + 0.25, 0]} r={0.07} color="#6E7479" />; })}
  <mesh position={[0, RIG.h, 0]} rotation={[0, 0, 0]} castShadow material={M('#3A3F45', 0.4, 0.6)}><torusGeometry args={[0.22, 0.06, 8, 20]} /></mesh>
  <mesh position={[0, RIG.h, 0]} rotation={[Math.PI / 2, 0, 0]} material={M('#9CA3A8', 0.4, 0.7)}><cylinderGeometry args={[0.05, 0.05, 0.3, 8]} /></mesh>
</group>;
/** a rope through the given points */
export const Rope: React.FC<{pts: V3[]; r?: number}> = ({pts, r = 0.035}) => <>{pts.slice(1).map((b, i) => <Cable key={i} a={pts[i]} b={b} r={r} color={ROPE} />)}</>;
export const Hook: React.FC<{position: V3; swing?: number}> = ({position, swing = 0}) => <group position={position} rotation={[0, 0, swing]}>
  <mesh position={[0, -0.12, 0]} material={M('#6E7479', 0.35, 0.8)} castShadow><cylinderGeometry args={[0.03, 0.03, 0.24, 6]} /></mesh>
  <mesh position={[0.1, -0.26, 0]} rotation={[0, 0, Math.PI]} material={M('#6E7479', 0.35, 0.8)} castShadow><torusGeometry args={[0.1, 0.03, 6, 14, Math.PI * 1.2]} /></mesh>
</group>;
/** the hole the rope goes down: a dark pit, a broken lip of asphalt slabs that tilt up as it is pulled (k 0…1), burst open after `burst` */
export const Hole: React.FC<{position: V3; k: number; burst?: number}> = ({position, k, burst = 0}) => <group position={position}>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} material={MB('#0B0C0E')}><circleGeometry args={[0.42 + 0.25 * burst, 14]} /></mesh>
  {Array.from({length: 9}, (_, i) => { const a = (i / 9) * Math.PI * 2 + hash(i) * 0.4, d = 0.62 + hash(i * 3) * 0.2 + burst * 0.5, tilt = (0.15 + 0.55 * k) * (0.6 + hash(i * 7) * 0.8) + burst * 0.5;
    return <group key={i} position={[Math.cos(a) * d, 0.02, Math.sin(a) * d]} rotation={[0, -a, 0]}><mesh rotation={[0, 0, -tilt]} position={[-0.05, 0.03 + 0.12 * k, 0]} castShadow material={PM('#3E4044', 'slab')}><boxGeometry args={[0.5, 0.07, 0.42]} /></mesh></group>; })}
</group>;
/** clods thrown up when it comes out: real ballistics from t0 */
export const Clods: React.FC<{at: V3; t: number; t0: number; n?: number}> = ({at, t, t0, n = 14}) => { const u = t - t0; if (u < 0) return null;
  return <>{Array.from({length: n}, (_, i) => { const a = hash(i) * 6.283, v = 2 + hash(i * 3) * 3, vy = 3 + hash(i * 5) * 2.2; const y = vy * u - 0.5 * G * u * u; if (y < 0) return null;
    return <mesh key={i} position={[at[0] + Math.cos(a) * v * u * 0.4, at[1] + y, at[2] + Math.sin(a) * v * u * 0.4]} rotation={[u * 7 * hash(i * 7), u * 5, 0]} castShadow material={PM(i % 2 ? '#5A4636' : '#3E4044', 'clod')}><boxGeometry args={[0.14 + hash(i) * 0.14, 0.1, 0.12 + hash(i * 2) * 0.1]} /></mesh>; })}</>;
};

// =====================================================================================================
// GRAVITY IN CUSTODY: closed cuffs round nothing, and a tag. While it is still "heavy" (float 0) the tag hangs; once it is caught nothing
// hangs any more: the tag rides up on its string (float 1). arrow = the alternative look (a textbook force vector), kept for comparison.
// =====================================================================================================
export const Accused: React.FC<{t: number; position: V3; size?: number; k?: number; tag?: string | null; tagK?: number; float?: number; arrow?: boolean; yaw?: number}> = ({t, position, size = 7, k = 1, tag = 'ผู้ต้องหา', tagK = 1, float = 0, arrow = false, yaw = 0}) => {
  const r = 0.024 * size; const sway = Math.sin(t * 1.7) * 0.06; const up = float * 2 - 1;   // −1 hangs, +1 floats up
  return <group position={position} rotation={[0, yaw, sway * (1 - float * 0.5)]}>
    <Handcuffs k={k} size={size} rotation={[Math.PI / 2, 0, 0]} />
    {arrow && <group><mesh position={[0, 0.35, 0]} material={PM('#C8301F', 'vec')} castShadow><cylinderGeometry args={[r * 0.55, r * 0.55, 2.2, 10]} /></mesh>
      <mesh position={[0, -1.05, 0]} rotation={[Math.PI, 0, 0]} material={PM('#C8301F', 'vec')} castShadow><coneGeometry args={[r * 1.2, 0.7, 10]} /></mesh></group>}
    {tag && tagK > 0.01 && <group position={[r * 2.6, 0, 0]} rotation={[0, 0, (1 - Math.abs(up)) * 1.2 + Math.sin(t * 2.3) * 0.08]} scale={cl(tagK)}>
      <mesh position={[0, up * r * 0.9, 0]} material={PM('#2A2622', 'string')}><boxGeometry args={[r * 0.05, r * 1.8, r * 0.05]} /></mesh>
      <mesh position={[0, up * r * 2.5, 0]} material={label('ep16tag' + tag + (float > 0.5 ? 0 : 9), 512, 320, '#F2E6C8', '#1B2831', [tag, 'g = ' + (float > 0.5 ? '0' : '9.8')], 96, '#B0302E')}><planeGeometry args={[r * 2.6, r * 1.6]} /></mesh>
    </group>}
  </group>;
};

// =====================================================================================================
// FIVE HUNDRED OFFICERS on the rope: instanced box figures in the uniform of offA (blue shirt, navy trousers and cap), two files either
// side of the rope, leaning back and heaving in a wave that runs down the line. After `pop` they go over backwards, file by file;
// after `float` they drift up off the road. spots: [x, z] of each officer; they face −x (towards the rig).
// =====================================================================================================
const PARTS: {s: V3; p: V3; c: string}[] = [
  {s: [0.3, 0.82, 0.24], p: [0, 0.41, 0], c: '#26324A'},        // legs
  {s: [0.42, 0.58, 0.26], p: [0, 1.11, 0], c: '#8DB4CF'},       // shirt
  {s: [0.25, 0.28, 0.25], p: [0, 1.56, 0], c: '#C8935F'},       // head
  {s: [0.28, 0.09, 0.32], p: [0, 1.73, 0.03], c: '#22314C'},    // cap
  {s: [0.5, 0.1, 0.46], p: [0, 1.2, 0.3], c: '#8DB4CF'},        // both arms out to the rope
];
/** n officers in four files (two either side of the rope at z), a row every `gap` m from x0 */
export const copSpots = (x0: number, n: number, z: number, gap = 0.6): [number, number][] => Array.from({length: n}, (_, i) => [x0 + Math.floor(i / 4) * gap + (i % 2) * gap / 2 + (hash(i * 1.7) - 0.5) * 0.24, z + [-1.0, -0.42, 0.42, 1.0][i % 4] + (hash(i * 2.9) - 0.5) * 0.2] as [number, number]);
export const CopCrowd: React.FC<{t: number; spots: [number, number][]; heave?: number; pop?: number; float?: number}> = ({t, spots, heave = 0, pop = 1e9, float = 1e9}) => {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mats = useMemo(() => PARTS.map((p) => new THREE.MeshLambertMaterial({color: p.c})), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), a = new THREE.Matrix4(), e = new THREE.Euler(), v = new THREE.Vector3(); const skins = ['#C8935F', '#D6A87C', '#B98559'].map((c) => new THREE.Color(c));
    for (let i = 0; i < spots.length; i++) {
      const [x, z] = spots[i]; const lag = i * 0.004;
      let lean = t > heave ? 0.3 + 0.13 * Math.sin((t - heave) * 9 - i * 0.12) : 0.12; let y = 0, rz = 0, dx = t > heave ? Math.sin((t - heave) * 9 - i * 0.12) * 0.05 : 0;
      const up = t - pop - lag; if (up > 0) { lean = Math.min(1.45, 0.3 + up * up * 16); dx += Math.min(0.5, up * 1.6); }   // the rope goes slack: over they go
      const uf = t - float - hash(i) * 0.5; if (uf > 0) { const k = 0.6 + hash(i * 3) * 0.8; y = 0.5 * k * (uf - 0.5 * (1 - Math.exp(-uf * 2))) + 0.02; lean += (hash(i * 5) - 0.3) * uf * 0.5; rz = (hash(i * 7) - 0.5) * uf * 0.6; }
      e.set(-lean, -Math.PI / 2, rz, 'YXZ'); m.makeRotationFromEuler(e); m.setPosition(x + dx, y, z); m.scale(v.setScalar(0.92 + hash(i * 9.1) * 0.16));
      PARTS.forEach((p, k) => { const im = refs.current[k]; if (!im) return; a.makeTranslation(...p.p); a.multiplyMatrices(m, a); a.scale(v.set(...p.s)); im.setMatrixAt(i, a); if (k === 2) im.setColorAt(i, skins[i % 3]); });
    }
    refs.current.forEach((im) => { if (!im) return; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; });
  });
  return <>{PARTS.map((p, k) => <instancedMesh key={k} ref={(r) => { refs.current[k] = r; }} args={[geo, mats[k], spots.length]} castShadow frustumCulled={false} />)}</>;
};

// =====================================================================================================
// LOOSE THINGS that float once it is caught: pebbles and leaves off the road (bits), and the dirt patch a lifted house leaves behind.
// =====================================================================================================
export const Bits: React.FC<{center: V3; size: [number, number]; t: number; t0: number; n?: number; seed?: number}> = ({center, size, t, t0, n = 40, seed = 0}) => <>{Array.from({length: n}, (_, i) => {
  const u = t - t0 + 0.25 - hash(i * 3 + seed) * 0.5; const d = drift(i + seed * 13, u, 0.7); const s = 0.03 + hash(i * 5 + seed) * 0.05;
  return <mesh key={i} position={[center[0] + (hash(i + seed) - 0.5) * size[0], center[1] + s / 2 + d[0], center[2] + (hash(i * 7 + seed) - 0.5) * size[1]]} rotation={[d[1] * 6, d[3] * 6, d[2] * 6]} material={PM(['#6E6A62', '#5B7838', '#8A7A5E', '#3E4044'][i % 4], 'bit')}><boxGeometry args={[s, s * 0.6, s * 0.8]} /></mesh>; })}</>;
export const DirtPatch: React.FC<{x: number; side: number; W: number}> = ({x, side, W}) => <group>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.004, side * 11.15]} receiveShadow material={PM('#5A4636', 'dirt')}><planeGeometry args={[W + 1.0, 11.1]} /></mesh>
  {Array.from({length: 6}, (_, i) => <mesh key={i} position={[x + (hash(i + x) - 0.5) * W, 0.08, side * (7 + hash(i * 3 + x) * 8)]} rotation={[0, hash(i) * 3, 0]} castShadow material={PM('#4A3A2C', 'dirt2')}><boxGeometry args={[0.5 + hash(i) * 0.5, 0.16, 0.4]} /></mesh>)}
</group>;
