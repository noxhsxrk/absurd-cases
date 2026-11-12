import React, {useMemo, useLayoutEffect, useRef} from 'react';
import * as THREE from 'three';
import {M, MB, tex, F} from '../../pov/lib/tex';
import {HANDLE} from './data';

/** EP14 คดีแผ่นดินไหว — the new things: the Earth (the accused), the domino run, the lie detector, a crack in the ground, the patrol car's back door. */
export type V3 = [number, number, number];
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// =====================================================================================================
// THE EARTH: a low-poly globe (blue sea, green land, white caps) with cartoon eyes. It trembles all the time (shake 0…1).
// Local +z is its face. mood: 'nervous' (pupils dart), 'wide', 'angry' (brows), 'shut' (eyes squeezed).
// =====================================================================================================
const earthGeo = () => {
  const g = new THREE.IcosahedronGeometry(1, 3); const p = g.attributes.position; const col = new Float32Array(p.count * 3);
  const sea = new THREE.Color('#2F7FC1'), land = new THREE.Color('#5FA04E'), land2 = new THREE.Color('#8DB255'), ice = new THREE.Color('#F2F4F2');
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const n = Math.sin(cx * 3.1 + 1.7) * Math.cos(cz * 2.7 - 0.4) + 0.6 * Math.sin(cy * 4.3 + cx * 2.1) + 0.35 * Math.sin(cz * 6.1 + cy * 3.3 + 2);
    // keep the face (front, +z) mostly sea so the eyes read
    const c = Math.abs(cy) > 0.86 ? ice : n > 0.55 - (cz > 0.55 ? -0.5 : 0) ? (hash(i) > 0.5 ? land : land2) : sea;
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
};
let EARTH_GEO: THREE.BufferGeometry | null = null;
const EARTH_MAT = new THREE.MeshLambertMaterial({vertexColors: true, flatShading: true});
export type Mood = 'nervous' | 'wide' | 'angry' | 'shut';
/** jitter of a trembling thing at time t (deterministic) */
export const tremble = (t: number, amp: number, seed = 0): V3 => [Math.sin(t * 53 + seed) * amp + Math.sin(t * 91 + seed * 2) * amp * 0.5, Math.abs(Math.sin(t * 67 + seed)) * amp * 0.8, Math.sin(t * 59 + seed * 3) * amp * 0.6];
export const Earth: React.FC<{t: number; position: V3; r: number; yaw?: number; pitch?: number; shake?: number; mood?: Mood; squash?: V3; eyes?: boolean}> = ({t, position, r, yaw = 0, pitch = 0, shake = 1, mood = 'nervous', squash = [1, 1, 1], eyes = true}) => {
  EARTH_GEO ??= earthGeo();
  const j = tremble(t, 0.035 * r * shake), rz = Math.sin(t * 47) * 0.05 * shake;
  const dart = mood === 'nervous' ? [Math.sin(Math.floor(t * 5) * 7.3) * 0.35, Math.cos(Math.floor(t * 5) * 3.1) * 0.15] : [0, 0];
  const pupil = mood === 'wide' ? 0.42 : 0.55, eyeH = mood === 'shut' ? 0.12 : mood === 'angry' ? 0.75 : 1;
  const blink = (t * 0.6 + 0.3) % 2.7 < 0.08 ? 0.1 : 1;
  return <group position={[position[0] + j[0], position[1] + j[1], position[2] + j[2]]} rotation={[pitch, yaw, rz]} scale={[r * squash[0], r * squash[1], r * squash[2]]}>
    <mesh castShadow receiveShadow geometry={EARTH_GEO} material={EARTH_MAT} />
    {/* a thin atmosphere rim */}
    <mesh scale={1.04}><sphereGeometry args={[1, 24, 16]} /><meshBasicMaterial color="#9FD4FF" transparent opacity={0.16} side={THREE.BackSide} toneMapped={false} /></mesh>
    {eyes && [-1, 1].map((s) => <group key={s} position={[s * 0.3, 0.16, 0.955]} rotation={[-0.16, s * 0.3, 0]}>
      <mesh scale={[0.2, 0.26 * eyeH * blink, 0.06]} material={MB('#FBFAF4')}><sphereGeometry args={[1, 16, 12]} /></mesh>
      {mood !== 'shut' && blink > 0.5 && <mesh position={[dart[0] * 0.1, dart[1] * 0.1 - (mood === 'angry' ? 0.03 : 0), 0.05]} scale={[0.2 * pupil, 0.2 * pupil * eyeH, 0.04]} material={MB('#141210')}><sphereGeometry args={[1, 12, 10]} /></mesh>}
      {(mood === 'angry' || mood === 'shut') && <mesh position={[0, 0.27, 0.05]} rotation={[0, 0, s * (mood === 'angry' ? -0.45 : 0.25)]} material={MB('#141210')}><boxGeometry args={[0.3, 0.05, 0.03]} /></mesh>}
      {mood === 'shut' && <mesh position={[0, 0, 0.06]} rotation={[0, 0, s * 0.3]} material={MB('#141210')}><boxGeometry args={[0.26, 0.035, 0.02]} /></mesh>}
    </group>)}
    {/* tremble lines either side when it shakes hard */}
    {shake > 0.6 && [-1, 1].map((s) => [0, 1].map((k) => <mesh key={s + '' + k} position={[s * (1.22 + k * 0.14), 0.15 - k * 0.3, 0]} rotation={[0, 0, s * 0.2]} material={MB('#2A2E36')}>
      <boxGeometry args={[0.04, 0.34 * (0.6 + 0.4 * Math.abs(Math.sin(t * 30 + k))), 0.02]} /></mesh>))}
  </group>;
};

// =====================================================================================================
// DOMINOES: an S-shaped run over the room floor. Instanced. state:
//   quake  = the earthquake starts (they wobble, then each falls at its own time, forwards or back)
//   wobble = an extra tremble amplitude (aftershock), tipLast = time the nearest (last placed) one starts to tip over
// =====================================================================================================
export const DOM = {h: 0.11, w: 0.055, d: 0.018, gap: 0.068};
export type DomSpot = {x: number; z: number; yaw: number};
export const dominoPath = (rows = 7, x0 = -1.45, x1 = 1.2, z0 = -1.45, dz = 0.3): DomSpot[] => {
  const out: DomSpot[] = [];
  for (let r = 0; r < rows; r++) {
    const z = z0 + r * dz, dir = r % 2 ? -1 : 1, a = dir > 0 ? x0 : x1, b = dir > 0 ? x1 : x0;
    const n = Math.floor(Math.abs(b - a) / DOM.gap);
    for (let i = 0; i <= n; i++) out.push({x: a + dir * i * DOM.gap, z, yaw: dir > 0 ? Math.PI / 2 : -Math.PI / 2});
    if (r < rows - 1) { // U-turn: a half circle of radius dz/2 to the next row
      const cx = b, cz = z + dz / 2, R = dz / 2, m = Math.max(2, Math.floor((Math.PI * R) / DOM.gap));
      for (let k = 1; k < m; k++) { const th = -Math.PI / 2 + (k / m) * Math.PI; out.push({x: cx + dir * Math.cos(th) * R, z: cz + Math.sin(th) * R, yaw: (dir > 0 ? Math.PI / 2 : -Math.PI / 2) + (k / m) * Math.PI * -dir}); }
    }
  }
  return out;
};
const DOM_COLS = ['#E9E2CC', '#D9493A', '#E7B63A', '#3E8C86', '#2D3E63', '#E9E2CC'].map((c) => new THREE.Color(c));
export const Dominoes: React.FC<{t: number; spots: DomSpot[]; quake?: number; wobble?: number; tipLast?: number; count?: number}> = ({t, spots, quake = 1e9, wobble = 0, tipLast = 1e9, count}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(DOM.w, DOM.h, DOM.d), []);
  const mat = useMemo(() => new THREE.MeshLambertMaterial(), []);
  const n = count ?? spots.length;
  useLayoutEffect(() => {
    const im = ref.current; if (!im) return; const m = new THREE.Matrix4(), q = new THREE.Matrix4(), T = new THREE.Matrix4(), R = new THREE.Matrix4();
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i]; const hs = hash(i * 1.37 + 0.5);
      let th = 0, sgn = hs > 0.5 ? 1 : -1;
      const u = t - (quake + 0.2 + hash(i * 3.1) * 1.25);
      if (t > quake) th = Math.sin(t * 34 + i) * 0.1 * Math.min(1, (t - quake) * 4);
      if (u > 0) { const k = u / 0.3; th = sgn * (k < 1 ? 1.45 * k * k : 1.45 - 0.07 * Math.exp(-(u - 0.3) * 18) * Math.abs(Math.sin((u - 0.3) * 40))); }
      if (wobble > 0) th += Math.sin(t * 38 + i * 1.7) * wobble * (0.6 + 0.4 * hash(i));
      if (i === n - 1 && t > tipLast) { const v = (t - tipLast) / 0.5; th = -Math.min(1.45, 1.45 * v * v) - 0.03; sgn = -1; }
      if (th < 0) sgn = -1; else if (th > 0) sgn = 1;
      T.makeTranslation(s.x, 0, s.z); R.makeRotationY(s.yaw); m.multiplyMatrices(T, R);
      q.makeTranslation(0, 0, sgn * DOM.d / 2); m.multiply(q); q.makeRotationX(th); m.multiply(q); q.makeTranslation(0, DOM.h / 2, -sgn * DOM.d / 2); m.multiply(q);
      if (i >= n) m.makeScale(0, 0, 0);
      im.setMatrixAt(i, m); im.setColorAt(i, DOM_COLS[Math.floor(hash(i * 7.7) * DOM_COLS.length)]);
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, spots.length]} castShadow receiveShadow frustumCulled={false} />;
};
/** one domino held in a hand (or standing alone) — same look as the run */
export const Domino: React.FC<{position: V3; yaw?: number; tilt?: number; color?: string}> = ({position, yaw = 0, tilt = 0, color = '#D9493A'}) => <group position={position} rotation={[tilt, yaw, 0]}>
  <mesh castShadow position={[0, DOM.h / 2, 0]} material={M(color, 0.7)}><boxGeometry args={[DOM.w, DOM.h, DOM.d]} /></mesh></group>;

// =====================================================================================================
// A CRACK in the ground: a jagged dark band along a polyline, a lighter lip either side. k = how far it has opened (0…1, grows along the line).
// =====================================================================================================
export const Crack: React.FC<{pts: [number, number][]; y?: number; w?: number; k?: number; seed?: number}> = ({pts, y = 0.004, w = 0.08, k = 1, seed = 1}) => {
  const segs = useMemo(() => { const out: {x: number; z: number; len: number; a: number; w: number}[] = [];
    for (let i = 0; i + 1 < pts.length; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const steps = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / 0.18));
      let px = ax, pz = az;
      for (let s = 1; s <= steps; s++) { const f = s / steps; const nx = ax + (bx - ax) * f + (s < steps ? (hash(seed + i * 31 + s) - 0.5) * 0.12 : 0), nz = az + (bz - az) * f + (s < steps ? (hash(seed + i * 17 + s * 3) - 0.5) * 0.12 : 0);
        out.push({x: (px + nx) / 2, z: (pz + nz) / 2, len: Math.hypot(nx - px, nz - pz) + 0.02, a: Math.atan2(nz - pz, nx - px), w: w * (0.6 + 0.8 * hash(seed + s * 7 + i))}); px = nx; pz = nz; } }
    return out; }, [pts, w, seed]);
  const m = Math.floor(segs.length * cl(k));
  return <group>{segs.slice(0, m).map((s, i) => <group key={i} position={[s.x, y, s.z]} rotation={[0, -s.a, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={MB('#14110F')}><planeGeometry args={[s.len, s.w]} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} material={MB('#6B5B49')}><planeGeometry args={[s.len, s.w * 1.9]} /></mesh>
  </group>)}</group>;
};

// =====================================================================================================
// THE LIE DETECTOR: a grey box with a paper strip scrolling under three needles. wild 0…1 = how hard the needles scribble.
// =====================================================================================================
const paper = () => tex('ep14-polypaper', 1024, 256, (g) => {
  g.fillStyle = '#F4F1E6'; g.fillRect(0, 0, 1024, 256); g.strokeStyle = '#C9D3C4'; g.lineWidth = 2;
  for (let x = 0; x < 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  ['#B0302E', '#2D3E63', '#2E6E4A'].forEach((c, k) => { g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); const y0 = 50 + k * 78;
    for (let x = 0; x <= 1024; x += 4) { const wild = x > 420; const a = wild ? 36 * (0.5 + hash(x * 0.37 + k)) : 6; g.lineTo(x, y0 + Math.sin(x * (wild ? 0.6 : 0.08) + k) * a); } g.stroke(); });
}, [1, 1]);
export const LieDetector: React.FC<{t: number; position: V3; yaw?: number; wild?: number; rot?: V3}> = ({t, position, yaw = 0, wild = 1, rot = [0, 0, 0]}) => {
  const pmat = useMemo(() => { const m = new THREE.MeshBasicMaterial({map: paper().clone(), toneMapped: false}); m.map!.wrapS = THREE.RepeatWrapping; m.map!.repeat.set(0.45, 1); m.map!.needsUpdate = true; return m; }, []);
  pmat.map!.offset.x = (t * 0.35) % 1;
  const front = useMemo(() => new THREE.MeshBasicMaterial({map: tex('ep14-polyfront', 512, 128, (g) => { g.fillStyle = '#3B4247'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#F2E6C8'; g.font = F(700, 52); g.textAlign = 'center'; g.fillText('เครื่องจับเท็จ', 256, 70); g.font = F(500, 22); g.fillStyle = '#A8B0B4'; g.fillText(HANDLE, 256, 108); }), toneMapped: false}), []);
  return <group position={position} rotation={[rot[0], yaw + rot[1], rot[2]]}>
    <mesh castShadow position={[0, 0.05, 0]} material={M('#59626A', 0.5, 0.3)}><boxGeometry args={[0.42, 0.1, 0.28]} /></mesh>
    <mesh position={[0, 0.05, 0.1401]} material={front}><planeGeometry args={[0.4, 0.1]} /></mesh>
    <mesh position={[0, 0.101, -0.02]} rotation={[-Math.PI / 2, 0, 0]} material={pmat}><planeGeometry args={[0.36, 0.17]} /></mesh>
    {[0, 1].map((k) => <mesh key={k} position={[(k ? 1 : -1) * 0.19, 0.11, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={M('#2A2E33', 0.4, 0.5)}><cylinderGeometry args={[0.02, 0.02, 0.18, 10]} /></mesh>)}
    {[0, 1, 2].map((k) => <group key={k} position={[0.17, 0.12, -0.08 + k * 0.055]} rotation={[0, Math.sin(t * (28 + k * 7) + k * 2) * 0.55 * wild + 0.1, 0]}>
      <mesh position={[-0.08, 0, 0]} material={M('#1E2226', 0.4, 0.6)}><boxGeometry args={[0.16, 0.006, 0.008]} /></mesh>
      <mesh position={[-0.16, -0.008, 0]} material={MB(['#B0302E', '#2D3E63', '#2E6E4A'][k])}><sphereGeometry args={[0.008, 8, 6]} /></mesh></group>)}
    {/* a red light that blinks faster as it goes wild */}
    <mesh position={[-0.16, 0.103, 0.1]} material={MB(Math.floor(t * (3 + wild * 12)) % 2 ? '#FF4A3A' : '#5A1F1A')}><cylinderGeometry args={[0.014, 0.014, 0.01, 10]} /></mesh>
  </group>;
};

// =====================================================================================================
// THE CUFF ON THE EARTH: one giant ring that snaps shut round the globe (close 0…1) and a chain to the officer's hand.
// =====================================================================================================
export const EarthCuff: React.FC<{center: V3; r: number; close: number; tilt?: V3; hand?: V3 | null}> = ({center, r, close, tilt = [0.25, 0, 0.35], hand}) => {
  const steel = M('#C3C8CC', 0.25, 0.85), dark = M('#6E7479', 0.4, 0.7);
  const R = r * (1.07 + 0.45 * (1 - close)); const lock = new THREE.Vector3(R, 0, 0).applyEuler(new THREE.Euler(...tilt));
  const a: V3 = [center[0] + lock.x * 1.05, center[1] + lock.y * 1.05, center[2] + lock.z * 1.05];
  return <group>
    <group position={center} rotation={tilt}>
      <mesh castShadow material={steel}><torusGeometry args={[R, r * 0.07, 8, 40]} /></mesh>
      <mesh position={[R + r * 0.06, 0, 0]} material={dark} castShadow><boxGeometry args={[r * 0.22, r * 0.3, r * 0.2]} /></mesh>
    </group>
    {hand && <>{Array.from({length: 7}, (_, i) => { const f = (i + 0.5) / 7; const p: V3 = [a[0] + (hand[0] - a[0]) * f, a[1] + (hand[1] - a[1]) * f - Math.sin(f * Math.PI) * 0.05, a[2] + (hand[2] - a[2]) * f];
        return <mesh key={i} position={p} rotation={[0, i % 2 ? Math.PI / 2 : 0, Math.PI / 2]} material={steel}><torusGeometry args={[0.022, 0.006, 6, 12]} /></mesh>; })}
      <mesh position={hand} material={steel}><torusGeometry args={[0.05, 0.01, 8, 20]} /></mesh></>}
  </group>;
};

// =====================================================================================================
// The patrol car's BACK DOOR (EP7 PoliceCar faces local +x; its driver's door is at x 0.35, z +0.8). open 0…1.
// hole = the dark doorway on the body behind the door.
// =====================================================================================================
export const BackDoor: React.FC<{open: number}> = ({open}) => <group>
  <mesh position={[-0.95, 0.85, 0.802]} material={MB('#14171C')}><planeGeometry args={[0.95, 0.85]} /></mesh>
  <group position={[-0.45, 0.55, 0.81]} rotation={[0, open * 1.25, 0]}>
    <mesh castShadow position={[-0.5, 0.28, 0]} material={M('#EEF0F2', 0.45)}><boxGeometry args={[1.0, 0.95, 0.05]} /></mesh>
    <mesh position={[-0.5, 0.53, 0.03]} material={M('#1A2330', 0.15, 0.4)}><boxGeometry args={[0.8, 0.34, 0.01]} /></mesh>
    <mesh position={[-0.86, 0.18, 0.04]} material={M('#2A2D33', 0.4)}><boxGeometry args={[0.14, 0.03, 0.02]} /></mesh>
  </group>
</group>;
