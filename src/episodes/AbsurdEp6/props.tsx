import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {HANDLE} from './data';

type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const CREAM = '#E6E7CF', NAVY = '#152028', BRICK = '#B0402E', INK = '#14110F', OLIVE = '#5B6B3A';
const mats = new Map<string, THREE.Material>();
const once = <T extends THREE.Material>(k: string, f: () => T) => { if (!mats.has(k)) mats.set(k, f()); return mats.get(k) as T; };
export const label = (key: string, w: number, h: number, bg: string, fg: string, lines: string[], size: number, border?: string) => once('lbl6' + key, () => new THREE.MeshBasicMaterial({toneMapped: false, side: THREE.DoubleSide, map: tex('lbl6-' + key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = border; g.lineWidth = Math.max(4, h * 0.05); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = F(700, size);
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.18));
})}));
const concrete = (key: string, base: string) => once('conc' + key, () => new THREE.MeshLambertMaterial({map: tex('conc6-' + key, 256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { g.fillStyle = hash(i) > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'; g.fillRect(hash(i * 2.1) * 256, hash(i * 3.3) * 256, 2, 2); }
  g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 6; i++) g.fillRect(0, hash(i * 7) * 256, 256, 3);
}, [2, 1])}));

// =====================================================================================================
// THE ACCUSED: a concrete footbridge. Local frame: the deck runs along z (L long) at height H; both stairs
// run down along +x from the deck's +x edge at each end. A hand-drawn scowl is painted on the deck fascia.
// =====================================================================================================
export const FB = {L: 34, H: 5.6, W: 2.6, T: 1.2, steps: 50, run: 0.17, sw: 1.8};
const faceTex = (mode: string) => tex('bridge-face-' + mode, 512, 128, (g) => {
  g.clearRect(0, 0, 512, 128); g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'round';
  for (const x of [176, 336]) { if (mode === 'shut') { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 22, 70); g.lineTo(x + 22, 70); g.stroke(); } else { g.beginPath(); g.ellipse(x, 72, 13, 15, 0, 0, 7); g.fill(); } }
  g.lineWidth = 10; g.beginPath(); g.moveTo(140, 34); g.lineTo(200, 52); g.moveTo(372, 34); g.lineTo(312, 52); g.stroke();   // scowl: inner ends low
  g.lineWidth = 7; g.beginPath(); g.moveTo(226, 112); g.lineTo(286, 112); g.stroke();
});
export const stairTop = (end: 1 | -1): V3 => [FB.W / 2, FB.H, end * (FB.L / 2 - FB.sw / 2)];
/** world position on the bridge path (for walkers / the swarm): 0 = foot of stair A (z−), 1 = foot of stair B (z+) */
export const pathPoint = (u: number): V3 => {
  const sl = FB.steps * FB.run; const d = cl(u) * (2 * sl + FB.L - FB.sw);
  const za = -(FB.L / 2 - FB.sw / 2), zb = -za;
  if (d < sl) { const k = d / sl; return [FB.W / 2 + sl * (1 - k), FB.H * k, za]; }
  if (d < sl + FB.L - FB.sw) { const k = (d - sl) / (FB.L - FB.sw); return [FB.W / 4, FB.H, za + (zb - za) * k]; }
  const k = (d - sl - (FB.L - FB.sw)) / sl; return [FB.W / 2 + sl * k, FB.H * (1 - k), zb];
};
type FBP = {position?: V3; yaw?: number; scale?: number; lift?: number; tilt?: number; face?: string; faces?: ('-x' | '+x')[]; stairs?: boolean; pillars?: boolean; sign?: string; children?: React.ReactNode};
export const FootBridge: React.FC<FBP> = ({position = [0, 0, 0], yaw = 0, scale = 1, lift = 0, tilt = 0, face = 'open', faces = ['-x'], stairs = true, pillars = true, sign, children}) => {
  const c = concrete('deck', '#B9B3A6'), cd = concrete('deckd', '#9E988B'), steel = PM('#3F6E78', 'fbsteel'), tread = concrete('tread', '#C9C3B6');
  const fm = useMemo(() => new THREE.MeshBasicMaterial({map: faceTex(face), transparent: true, toneMapped: false, depthWrite: false}), [face]);
  const {L, H, W, T, steps, run, sw} = FB; const rise = H / steps;
  const rail = (x: number, z0: number, z1: number, y: number) => <group>
    <mesh position={[x, y + 1.05, (z0 + z1) / 2]} material={steel} castShadow><boxGeometry args={[0.07, 0.07, Math.abs(z1 - z0)]} /></mesh>
    {Array.from({length: Math.floor(Math.abs(z1 - z0) / 1.6) + 1}, (_, i) => <mesh key={i} position={[x, y + 0.53, z0 + Math.sign(z1 - z0) * i * 1.6]} material={steel}><boxGeometry args={[0.05, 1.05, 0.05]} /></mesh>)}
    <mesh position={[x, y + 0.5, (z0 + z1) / 2]} material={steel}><boxGeometry args={[0.03, 0.03, Math.abs(z1 - z0)]} /></mesh>
  </group>;
  const stair = (end: 1 | -1) => { const z = end * (L / 2 - sw / 2);
    return <group key={end}>
      {Array.from({length: steps}, (_, i) => <mesh key={i} position={[W / 2 + (steps - i - 0.5) * run, (i + 0.5) * rise, z]} material={i % 2 ? tread : c} castShadow receiveShadow><boxGeometry args={[run, rise, sw]} /></mesh>)}
      <mesh position={[W / 2 + (steps * run) / 2, H / 2 - 0.25, z]} rotation={[0, 0, Math.atan2(H, steps * run)]} material={cd} castShadow><boxGeometry args={[Math.hypot(H, steps * run), 0.35, sw * 0.98]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[W / 2 + (steps * run) / 2, H / 2 + 1.0, z + s * sw / 2]} rotation={[0, 0, -Math.atan2(H, steps * run)]} material={steel}><boxGeometry args={[Math.hypot(H, steps * run), 0.07, 0.07]} /></mesh>)}
      {/* the step counter on the first riser */}
      <mesh position={[W / 2 + steps * run + 0.001, rise / 2, z]} rotation={[0, Math.PI / 2, 0]} material={label('step1', 256, 64, '#F2C230', INK, ['ขั้นที่ 1 / 50'], 34)}><planeGeometry args={[sw * 0.6, rise * 0.85]} /></mesh>
      {pillars && <mesh position={[W / 2 + steps * run * 0.45, H * 0.22, z]} material={cd} castShadow><boxGeometry args={[0.45, H * 0.44, 0.45]} /></mesh>}
    </group>; };
  return <group position={[position[0], position[1] + lift, position[2]]} rotation={[0, yaw, tilt]} scale={scale}>
    <mesh position={[0, H - T / 2, 0]} material={c} castShadow receiveShadow><boxGeometry args={[W, T, L]} /></mesh>
    <mesh position={[0, H + 0.02, 0]} material={tread} receiveShadow><boxGeometry args={[W * 0.96, 0.04, L]} /></mesh>
    {rail(-W / 2 + 0.05, -L / 2, L / 2, H)}{rail(W / 2 - 0.05, -L / 2 + sw, L / 2 - sw, H)}
    {faces.includes('-x') && <mesh position={[-W / 2 - 0.005, H - T / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={fm}><planeGeometry args={[T * 4, T]} /></mesh>}
    {faces.includes('+x') && <mesh position={[W / 2 + 0.005, H - T / 2, L / 2 - sw - 2.6]} rotation={[0, Math.PI / 2, 0]} material={fm}><planeGeometry args={[T * 4, T]} /></mesh>}
    {sign && <mesh position={[-W / 2 - 0.02, H - T - 0.75, 3.2]} rotation={[0, -Math.PI / 2, 0]} material={label('fbsign-' + sign, 512, 128, NAVY, CREAM, [sign], 44)}><planeGeometry args={[4.4, 1.1]} /></mesh>}
    {pillars && [-1, 0, 1].map((k) => [-0.6, 0.6].map((x) => <mesh key={k + ':' + x} position={[x * (k === 0 ? 1 : 0.0001), (H - T) / 2, k * (L / 2 - 1.2)]} material={cd} castShadow><boxGeometry args={[0.55, H - T, 0.55]} /></mesh>))}
    {stairs && <>{stair(-1)}{stair(1)}</>}
    {children}
  </group>;
};

// =====================================================================================================
// THE 8-LANE ROAD (daytime): road along x, lanes z −14…14, sidewalks to ±18, shophouses beyond.
// =====================================================================================================
export const Road8: React.FC<{t: number; closed?: number; tape?: number}> = ({t, closed = 0, tape = 0}) => {
  const asphalt = once('asph', () => new THREE.MeshLambertMaterial({map: tex('asphalt6', 512, 512, (g) => {
    g.fillStyle = '#4A4D52'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { g.fillStyle = hash(i) > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'; g.fillRect(hash(i * 1.3) * 512, hash(i * 2.9) * 512, 2, 2); }
    // 8 lanes across the texture height (one tile = 28 m): white dashes, double yellow in the middle
    for (let k = 1; k < 8; k++) { const y = (k / 8) * 512; if (k === 4) { g.fillStyle = '#E8C23A'; g.fillRect(0, y - 5, 512, 3); g.fillRect(0, y + 2, 512, 3); } else { g.fillStyle = '#ECE8DA'; for (let x = 0; x < 512; x += 128) g.fillRect(x, y - 2, 64, 4); } }
  }, [4, 1])}));
  const walk = concrete('walk', '#A7A399'), kerb = PM('#8C8984', 'kerb6');
  const cars = Array.from({length: 6}, (_, i) => { const lane = [0, 1, 2, 3, 4, 5, 6, 7][(i * 3) % 8]; const dir = lane < 4 ? 1 : -1; const z = -14 + 1.75 + lane * 3.5;
    const x = ((hash(i) * 120 + t * 16 * dir) % 120 + 120) % 120 - 60; return {x, z, dir, i}; });
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={asphalt} receiveShadow><planeGeometry args={[160, 28]} /></mesh>
    {[-1, 1].map((s) => <group key={s}>
      <mesh position={[0, 0.075, s * 16.1]} material={walk} receiveShadow><boxGeometry args={[160, 0.15, 4.2]} /></mesh>
      <mesh position={[0, 0.08, s * 14.05]} material={kerb}><boxGeometry args={[160, 0.16, 0.12]} /></mesh>
      {Array.from({length: 12}, (_, i) => { const x = -66 + i * 12; const h = 7 + hash(i * 5 + s) * 6; const col = ['#D9C9A8', '#C9B8A0', '#B7C3B3', '#D3B49A', '#C3C7CF'][i % 5];
        return <group key={i} position={[x, 0, s * 22]}>
          <mesh position={[0, h / 2, 0]} material={PM(col, 'shop' + (i % 5))} castShadow receiveShadow><boxGeometry args={[11.6, h, 8]} /></mesh>
          <mesh position={[0, 3.2, -s * 4.05]} rotation={[0, s > 0 ? Math.PI : 0, 0]} material={PM(['#B0402E', '#476F66', '#2E5E8E'][i % 3], 'awn' + (i % 3))}><planeGeometry args={[10, 0.9]} /></mesh>
          {[2, 5].map((y) => [-3, 0, 3].map((wx) => <mesh key={y + ':' + wx} position={[wx, y + 0.8, -s * 4.01]} rotation={[0, s > 0 ? Math.PI : 0, 0]} material={PM('#3C4A55', 'win6')}><planeGeometry args={[1.6, 1.2]} /></mesh>))}
        </group>; })}
    </group>)}
    {closed <= 0 && cars.map((c) => <group key={c.i} position={[c.x, 0, c.z]} rotation={[0, c.dir > 0 ? 0 : Math.PI, 0]}>
      <mesh position={[0, 0.6, 0]} material={PM(['#D9D9D9', '#B0402E', '#2E5E8E', '#E8C23A', '#3A3A3E', '#476F66'][c.i], 'car' + c.i)} castShadow><boxGeometry args={[4.2, 0.8, 1.8]} /></mesh>
      <mesh position={[-0.2, 1.25, 0]} material={PM('#2A3238', 'carwin')}><boxGeometry args={[2.2, 0.6, 1.6]} /></mesh>
      {[-1.3, 1.3].map((x) => [-0.85, 0.85].map((z) => <mesh key={x + ':' + z} position={[x, 0.32, z]} rotation={[Math.PI / 2, 0, 0]} material={PM('#151515', 'tyre')}><cylinderGeometry args={[0.32, 0.32, 0.2, 10]} /></mesh>))}
    </group>)}
    {closed > 0 && [-13, 13].map((x) => Array.from({length: 16}, (_, i) => { const k = cl(closed * 1.6 - i / 16); if (k <= 0) return null; const z = -13.1 + i * 1.75;
      return <group key={x + ':' + i} position={[x, 0, z]} scale={k}><mesh position={[0, 0.38, 0]} material={PM('#E8742E', 'cone')} castShadow><coneGeometry args={[0.25, 0.75, 8]} /></mesh>
        <mesh position={[0, 0.45, 0]} material={MB('#F4F3EF')}><cylinderGeometry args={[0.16, 0.19, 0.12, 8, 1, true]} /></mesh><mesh position={[0, 0.03, 0]} material={PM('#2A2A2A', 'conebase')}><boxGeometry args={[0.55, 0.06, 0.55]} /></mesh></group>; }))}
    {tape > 0 && <TapeBox center={[2, 0, 0]} size={[16, 38]} y={1.1} k={tape} />}
    <hemisphereLight args={['#DCE8F2', '#6E6A5E', 1.0]} />
    <directionalLight position={[-30, 40, 20]} color="#FFF0D6" intensity={1.7} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={150} shadow-bias={-0.0008} />
  </group>;
};
const tapeTex = () => { const t = tex('tape-6', 1024, 64, (g) => { g.fillStyle = '#F2C230'; g.fillRect(0, 0, 1024, 64); g.fillStyle = INK; g.font = F(700, 38); for (let x = 0; x < 1024; x += 360) g.fillText('ห้ามเข้า · เขตจับกุม', x + 12, 46); }); t.wrapS = THREE.RepeatWrapping; return t; };
/** a giant yellow tape fence round a rectangle; it unrolls with k */
export const TapeBox: React.FC<{center: V3; size: [number, number]; y: number; k: number}> = ({center, size, y, k}) => {
  const mat = useMemo(() => { const t = tapeTex(); t.repeat.set(8, 1); return new THREE.MeshBasicMaterial({map: t, side: THREE.DoubleSide, toneMapped: false}); }, []);
  const [w, d] = size; const sides: [V3, number, number][] = [[[0, 0, -d / 2], 0, w], [[w / 2, 0, 0], Math.PI / 2, d], [[0, 0, d / 2], 0, w], [[-w / 2, 0, 0], Math.PI / 2, d]];
  return <group position={[center[0], y, center[2]]}>{sides.map(([p, r, len], i) => { const kk = cl(k * 4 - i); return kk <= 0 ? null : <mesh key={i} position={p} rotation={[0, r, 0]} material={mat} scale={[kk, 1, 1]}><planeGeometry args={[len, 0.35]} /></mesh>; })}
    {[[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z], i) => <mesh key={'p' + i} position={[x, -y / 2, z]} material={PM('#E8742E', 'tpole')}><cylinderGeometry args={[0.06, 0.06, y + 0.3, 6]} /></mesh>)}
  </group>;
};

// =====================================================================================================
// MILITARY TRUCK CRANE (olive): 8-wheel carrier, cab, turret, a telescopic boom to `tip`, a hook cable down to `hook`.
// =====================================================================================================
export const Crane: React.FC<{position: V3; yaw?: number; tip: V3; hook?: V3; t: number}> = ({position, yaw = 0, tip, hook, t}) => {
  const ol = PM(OLIVE, 'olive'), old = PM('#47552E', 'olived'), tyre = PM('#151515', 'tyre');
  const base = new THREE.Vector3(position[0], position[1] + 3.0, position[2]); const T = new THREE.Vector3(...tip); const d = T.clone().sub(base); const L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.clone().normalize());
  const vib = Math.sin(t * 40) * 0.01;
  return <group>
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 1.3, 0]} material={ol} castShadow><boxGeometry args={[9, 1.0, 2.6]} /></mesh>
      <mesh position={[4.0, 2.4 + vib, 0]} material={ol} castShadow><boxGeometry args={[1.8, 1.6, 2.5]} /></mesh>
      <mesh position={[4.6, 2.7 + vib, 0]} material={PM('#2A3238', 'cabwin')}><boxGeometry args={[0.7, 0.7, 2.3]} /></mesh>
      <mesh position={[-1, 2.2, 0]} material={old} castShadow><cylinderGeometry args={[1.3, 1.3, 0.9, 10]} /></mesh>
      {[-3.4, -2.0, 1.6, 3.2].map((x) => [-1.2, 1.2].map((z) => <mesh key={x + ':' + z} position={[x, 0.6, z]} rotation={[Math.PI / 2, 0, 0]} material={tyre} castShadow><cylinderGeometry args={[0.6, 0.6, 0.45, 12]} /></mesh>))}
      {[-4, 4].map((x) => [-1.9, 1.9].map((z) => <mesh key={'o' + x + z} position={[x, 0.5, z]} material={old}><boxGeometry args={[0.35, 1.0, 0.35]} /></mesh>))}
      <mesh position={[0, 1.81, 1.31]} material={label('army', 256, 64, OLIVE, '#E6E7CF', ['ทหาร · 04'], 36)}><planeGeometry args={[2.4, 0.6]} /></mesh>
    </group>
    <group position={[base.x, base.y, base.z]} quaternion={q}>
      <mesh position={[L / 2, 0, 0]} material={PM('#D9B43A', 'boom')} castShadow><boxGeometry args={[L, 0.7, 0.7]} /></mesh>
      <mesh position={[L * 0.3, 0, 0]} material={old}><boxGeometry args={[L * 0.55, 0.85, 0.85]} /></mesh>
    </group>
    {hook && <Cable a={tip} b={hook} r={0.04} />}
  </group>;
};
export const Cable: React.FC<{a: V3; b: V3; r?: number; color?: string}> = ({a, b, r = 0.03, color = '#202326'}) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh position={A.clone().add(B).multiplyScalar(0.5).toArray() as V3} quaternion={q} material={PM(color, 'cable' + color)}><cylinderGeometry args={[r, r, d.length(), 5]} /></mesh>;
};

// =====================================================================================================
// RAID + COURT + PRISON PROPS
// =====================================================================================================
/** circular saw (bone space, cm): body + a spinning disc with a blur ring */
export const makeSaw = () => {
  const g = new THREE.Group(); const y = new THREE.MeshLambertMaterial({color: '#E8C431'}), b = new THREE.MeshLambertMaterial({color: '#1E2328'});
  const body = new THREE.Mesh(new THREE.BoxGeometry(22, 14, 10), y); body.position.set(14, 0, 0); g.add(body);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(5, 12, 4), b); grip.position.set(2, -2, 0); g.add(grip);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 0.8, 24), new THREE.MeshStandardMaterial({color: '#BFC6CC', metalness: 0.8, roughness: 0.3})); disc.rotation.x = Math.PI / 2; disc.position.set(30, -6, 6); disc.name = 'disc'; g.add(disc);
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 3, 24, 1, true, 0, Math.PI), y); guard.rotation.x = Math.PI / 2; guard.position.set(30, -6, 6); g.add(guard);
  g.traverse((o: any) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } }); return g;
};
/** orange sparks spraying from a point (pure function of t) */
export const Sparks: React.FC<{at: V3; t: number; on: boolean; dir?: V3; n?: number; scale?: number}> = ({at, t, on, dir = [1, 0.4, 0], n = 26, scale = 1}) => {
  const m = once('spark', () => new THREE.MeshBasicMaterial({color: '#FFC24A', toneMapped: false}));
  if (!on) return null;
  return <group position={at}>{Array.from({length: n}, (_, i) => { const life = 0.35, u = ((t * 3.3 + hash(i)) % 1) * life; const sp = (3 + hash(i * 3) * 4) * scale;
    const v: V3 = [dir[0] * sp + (hash(i * 5) - 0.5) * 2 * scale, dir[1] * sp + hash(i * 7) * 2 * scale, dir[2] * sp + (hash(i * 9) - 0.5) * 3 * scale];
    return <mesh key={i} material={m} position={[v[0] * u, v[1] * u - 4.9 * u * u * scale, v[2] * u]} scale={0.03 * scale * (1 - u / life)}><boxGeometry args={[1, 1, 1]} /></mesh>; })}</group>;
};
/** a giant cuff: two steel rings round the deck (rings in XY, `gap` apart along z) + a chain + a weight tag */
export const GiantCuff: React.FC<{position: V3; r: number; gap: number; k?: number; tag?: boolean}> = ({position, r, gap, k = 1, tag = true}) => {
  const steel = M('#B9BEC2', 0.3, 0.85), dark = M('#6E7479', 0.4, 0.7); const close = 1 + 0.25 * (1 - k);
  return <group position={position}>
    {[-1, 1].map((s) => <group key={s} position={[0, 0, s * gap / 2]}>
      <mesh material={steel} castShadow scale={close}><torusGeometry args={[r, r * 0.09, 8, 28]} /></mesh>
      <mesh position={[0, r * close + r * 0.12, 0]} material={dark} castShadow><boxGeometry args={[r * 0.5, r * 0.25, r * 0.3]} /></mesh>
    </group>)}
    {Array.from({length: 5}, (_, i) => <mesh key={i} position={[0, r + r * 0.25, -gap / 2 + gap * (i + 0.5) / 5]} rotation={[0, i % 2 ? Math.PI / 2 : 0, Math.PI / 2]} material={steel}><torusGeometry args={[r * 0.12, r * 0.03, 6, 12]} /></mesh>)}
    {tag && <group position={[r * 0.55, r + 0.1, 0]}><mesh position={[0, -0.55, 0]} material={dark}><boxGeometry args={[0.04, 1.1, 0.04]} /></mesh>
      <mesh position={[0.01, -1.4, 0]} rotation={[0, -Math.PI / 2, 0]} material={label('cufftag', 512, 256, '#F4EFE2', INK, ['ของกลาง', 'น้ำหนัก 40 ตัน'], 70, BRICK)}><planeGeometry args={[1.6, 0.8]} /></mesh></group>}
  </group>;
};
/** courthouse exterior: cream block, columns, pediment, "ศาลยุติธรรม", holes in both side walls (x ±7) */
export const CourtHouse: React.FC<{t: number; holeY: number; holeH: number; holeW: number}> = ({holeY, holeH, holeW}) => {
  const wall = concrete('court6', '#E2D7BE'), trim = PM('#C9BA9B', 'ctrim'), dark = MB('#1C1A18');
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 6]} material={PM('#9AA27E', 'lawn6')} receiveShadow><planeGeometry args={[120, 60]} /></mesh>
    <mesh position={[0, 0.02, 9]} rotation={[-Math.PI / 2, 0, 0]} material={PM('#B8B2A4', 'cpath')}><planeGeometry args={[5, 12]} /></mesh>
    <mesh position={[0, 4, 0]} material={wall} castShadow receiveShadow><boxGeometry args={[14, 8, 9]} /></mesh>
    <mesh position={[0, 8.3, 4.2]} material={trim} castShadow><boxGeometry args={[14.6, 0.6, 1.4]} /></mesh>
    <mesh position={[0, 9.6, 4.2]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1]} material={trim} castShadow><boxGeometry args={[6, 6, 1.2]} /></mesh>
    {[-5, -3, -1, 1, 3, 5].map((x) => <mesh key={x} position={[x, 3.9, 5.2]} material={PM('#F0E8D6', 'col6')} castShadow><cylinderGeometry args={[0.38, 0.42, 7.8, 10]} /></mesh>)}
    {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.15 + i * 0.3, 6.2 + (2 - i) * 0.45]} material={trim} receiveShadow><boxGeometry args={[9 - i * 0.6, 0.3, 0.9]} /></mesh>)}
    <mesh position={[0, 7.4, 4.51]} material={label('court6', 1024, 160, NAVY, CREAM, ['ศาลยุติธรรม'], 100)}><planeGeometry args={[7, 1.1]} /></mesh>
    <mesh position={[0, 2.2, 4.51]} material={PM('#5A3019', 'cdoor')}><planeGeometry args={[2.2, 4.4]} /></mesh>
    {[-1, 1].map((s) => <group key={s} position={[s * 7.01, holeY, 0]} rotation={[0, s * Math.PI / 2, 0]}>
      <mesh material={dark}><planeGeometry args={[holeW, holeH]} /></mesh>
      {Array.from({length: 10}, (_, i) => { const a = (i / 10) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * holeW * 0.55, Math.sin(a) * holeH * 0.55, 0.02]} rotation={[0, 0, a + hash(i)]} material={wall}><boxGeometry args={[0.9 + hash(i * 3) * 0.6, 0.5, 0.15]} /></mesh>; })}
    </group>)}
    {[-1, 1].map((s) => Array.from({length: 14}, (_, i) => <mesh key={s + ':' + i} position={[s * (7.8 + hash(i) * 2.2), 0.2 + hash(i * 2) * 0.3, -2 + hash(i * 5) * 5]} rotation={[hash(i), hash(i * 3), hash(i * 7)]} material={i % 3 ? wall : PM('#B0402E', 'brick6')} castShadow><boxGeometry args={[0.5 + hash(i * 9) * 0.6, 0.3 + hash(i) * 0.3, 0.4 + hash(i * 4) * 0.4]} /></mesh>))}
    <hemisphereLight args={['#DCE8F2', '#6E6A5E', 1.0]} />
    <directionalLight position={[-25, 30, 25]} color="#FFF0D6" intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={20} shadow-camera-bottom={-10} shadow-bias={-0.0008} />
  </group>;
};
/** ragged dark hole + rubble on an interior wall plane (court interior), facing +x or −x */
export const WallHole: React.FC<{position: V3; face: 1 | -1; w: number; h: number}> = ({position, face, w, h}) => {
  const wall = PM('#E7DCC6', 'holeedge');
  return <group position={position} rotation={[0, face > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
    <mesh material={MB('#1C1A18')}><planeGeometry args={[w, h]} /></mesh>
    {Array.from({length: 9}, (_, i) => { const a = (i / 9) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * w * 0.55, Math.sin(a) * h * 0.55, 0.02]} rotation={[0, 0, a]} material={wall}><boxGeometry args={[0.4, 0.22, 0.08]} /></mesh>; })}
  </group>;
};
/** a stub of the bridge for interiors: deck segment with railings and the face, any length (court, cells) */
export const DeckStub: React.FC<{position: V3; yaw?: number; len: number; scale?: number; face?: boolean; plate?: string; stepsAtEnd?: number}> = ({position, yaw = 0, len, scale = 1, face = true, plate, stepsAtEnd = 0}) => {
  const c = concrete('deck', '#B9B3A6'), steel = PM('#3F6E78', 'fbsteel'), tread = concrete('tread', '#C9C3B6'); const {W, T, run} = FB; const rise = FB.H / FB.steps;
  const fm = useMemo(() => new THREE.MeshBasicMaterial({map: faceTex('open'), transparent: true, toneMapped: false, depthWrite: false}), []);
  return <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <mesh position={[0, -T / 2, 0]} material={c} castShadow receiveShadow><boxGeometry args={[W, T, len]} /></mesh>
    <mesh position={[0, 0.02, 0]} material={tread}><boxGeometry args={[W * 0.96, 0.04, len]} /></mesh>
    {[-1, 1].map((s) => <group key={s}>
      <mesh position={[s * (W / 2 - 0.05), 1.05, 0]} material={steel}><boxGeometry args={[0.07, 0.07, len]} /></mesh>
      {Array.from({length: Math.floor(len / 1.6) + 1}, (_, i) => <mesh key={i} position={[s * (W / 2 - 0.05), 0.53, -len / 2 + i * 1.6]} material={steel}><boxGeometry args={[0.05, 1.05, 0.05]} /></mesh>)}
    </group>)}
    {face && <mesh position={[-W / 2 - 0.005, -T / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={fm}><planeGeometry args={[T * 4, T]} /></mesh>}
    {plate && <mesh position={[-W / 2 - 0.01, -T / 2, T * 2.6]} rotation={[0, -Math.PI / 2, 0.06]} material={label('plate-' + plate, 256, 96, '#F4EFE2', INK, [plate], 52, BRICK)}><planeGeometry args={[0.9, 0.34]} /></mesh>}
    {stepsAtEnd > 0 && Array.from({length: stepsAtEnd}, (_, i) => <mesh key={'st' + i} position={[0, -(i + 0.5) * rise - T * 0, len / 2 + (i + 0.5) * run]} material={i % 2 ? tread : c} castShadow><boxGeometry args={[FB.sw, rise, run]} /></mesh>)}
  </group>;
};
/** prison gate + guard booth to add to EP3's PrisonOutside (wall at z 0, x ±12) */
export const PrisonGate: React.FC<{t: number}> = () => <group>
  <mesh position={[0, 2.2, 0.51]} material={MB('#22282C')}><planeGeometry args={[4.2, 4.4]} /></mesh>
  {Array.from({length: 9}, (_, i) => <mesh key={i} position={[-1.9 + i * 0.475, 2.2, 0.56]} material={M('#4A5056', 0.5, 0.6)}><boxGeometry args={[0.08, 4.4, 0.08]} /></mesh>)}
  <group position={[6.2, 0, 3.2]}>
    <mesh position={[0, 1.3, 0]} material={PM('#E2D7BE', 'booth')} castShadow><boxGeometry args={[2, 2.6, 2]} /></mesh>
    <mesh position={[0, 2.75, 0]} material={PM('#B0402E', 'boothroof')} castShadow><boxGeometry args={[2.4, 0.3, 2.4]} /></mesh>
    <mesh position={[0, 1.6, 1.01]} material={PM('#3C4A55', 'boothwin')}><planeGeometry args={[1.3, 0.8]} /></mesh>
    <mesh position={[0, 2.25, 1.02]} material={label('booth', 256, 64, NAVY, CREAM, ['ป้อมยาม'], 36)}><planeGeometry args={[1.2, 0.3]} /></mesh>
  </group>
  <group position={[-4.2, 0, 4.6]}><mesh position={[0, 0.9, 0]} material={PM('#6E6A5E', 'spole')}><cylinderGeometry args={[0.05, 0.05, 1.8, 6]} /></mesh>
    <mesh position={[0, 1.8, 0.03]} material={label('visit', 512, 192, '#F4EFE2', INK, ['จุดเยี่ยมญาติ', '(กรุณาใช้สะพานลอย)'], 58, NAVY)}><planeGeometry args={[1.8, 0.68]} /></mesh></group>
</group>;
/** a chain of links from a to b (each link a thin torus), sagging a little */
export const Chain: React.FC<{a: V3; b: V3; n?: number; r?: number; sag?: number}> = ({a, b, n = 24, r = 0.12, sag = 0.4}) => {
  const steel = M('#9CA3A8', 0.4, 0.8);
  return <group>{Array.from({length: n}, (_, i) => { const u = (i + 0.5) / n; const p: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * sag, a[2] + (b[2] - a[2]) * u];
    const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]); return <mesh key={i} position={p} rotation={[0, yaw + (i % 2 ? Math.PI / 2 : 0), i % 2 ? 0 : Math.PI / 2]} material={steel} castShadow><torusGeometry args={[r, r * 0.25, 6, 12]} /></mesh>; })}</group>;
};
/** the swarm: a million relatives drawn as ~1500 dark dots, flowing along a path function with per-dot lag/offset */
export const Swarm: React.FC<{path: (u: number) => V3; t: number; t0: number; dur: number; n?: number; spread?: number; size?: number}> = ({path, t, t0, dur, n = 1500, spread = 0.8, size = 0.05}) => {
  const mesh = useMemo(() => { const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 5, 4), new THREE.MeshBasicMaterial({color: '#1A1A1E'}), n); m.frustumCulled = false; return m; }, [n]);
  const o = useMemo(() => new THREE.Object3D(), []);
  for (let i = 0; i < n; i++) {
    const lag = hash(i * 1.7) * 0.45; const u = (t - t0) / dur - lag; const vis = u > -0.02 && u < 1.05;
    const p = path(Math.min(1, Math.max(0, u)));
    const w = Math.sin(t * (9 + hash(i) * 6) + i) * 0.08;
    o.position.set(p[0] + (hash(i * 3.1) - 0.5) * spread + w, p[1] + 0.6 + (hash(i * 5.3)) * spread * 0.7 + Math.cos(t * 11 + i) * 0.06, p[2] + (hash(i * 7.7) - 0.5) * spread);
    o.scale.setScalar(vis ? size * (0.7 + hash(i * 9) * 0.6) : 0.00001); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

// =====================================================================================================
// THE VISITING RULES NOTICE (pause-bait) + red stamp "ห้ามบินลอดใต้สะพาน"
// =====================================================================================================
const noticeTex = () => tex('notice-6', 768, 1024, (g) => {
  g.fillStyle = '#F6F2E6'; g.fillRect(0, 0, 768, 1024); g.fillStyle = 'rgba(0,0,0,0.04)'; for (let i = 0; i < 2000; i++) g.fillRect(hash(i) * 768, hash(i * 2.3) * 1024, 2, 2);
  g.fillStyle = NAVY; g.fillRect(0, 0, 768, 150); g.fillStyle = CREAM; g.font = F(700, 50); g.textAlign = 'center'; g.fillText('ระเบียบการเยี่ยมญาติ', 384, 70); g.font = F(600, 34); g.fillText('เรือนจำ · แดนขัง', 384, 122);
  g.textAlign = 'left'; const row = (y: number, k: string, v: string[], red = false, size = 40) => { g.fillStyle = '#6A6A70'; g.font = F(600, 28); g.fillText(k, 46, y); g.fillStyle = red ? BRICK : INK; g.font = F(700, size); v.forEach((l, i) => g.fillText(l, 46, y + 50 + i * size * 1.2)); };
  row(212, 'ผู้ต้องขัง', ['นช. สะพานลอย']); row(334, 'โทษ', ['ยืนตากแดดตลอดชีวิต'], true);
  row(456, 'หมายเหตุ', ['ญาติยุงที่บินมาเยี่ยม นช. ยุง', 'กรุณาเดินข้ามสะพานลอยทุกตัว', 'ฝ่าฝืนปรับตัวละ 200 บาท'], false, 36);
  row(690, 'เวลาเยี่ยม', ['ขึ้นอยู่กับความฟิตของญาติ'], false, 36);
  g.fillStyle = '#9A9AA0'; g.font = F(500, 26); g.textAlign = 'right'; g.fillText(HANDLE, 722, 990);
});
const stampTex = () => tex('stamp-6', 640, 256, (g) => {
  g.clearRect(0, 0, 640, 256); g.save(); g.translate(320, 128); g.strokeStyle = '#D7262B'; g.lineWidth = 14; g.strokeRect(-300, -110, 600, 220); g.lineWidth = 4; g.strokeRect(-282, -92, 564, 184);
  g.fillStyle = '#D7262B'; g.textAlign = 'center'; g.font = F(700, 70); g.fillText('ห้ามบินลอด', 0, -6); g.font = F(700, 62); g.fillText('ใต้สะพาน', 0, 66); g.restore();
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + hash(i) * 0.6})`; g.fillRect(hash(i * 2.7) * 640, hash(i * 5.1) * 256, 3 + hash(i) * 5, 2 + hash(i * 3) * 4); }
});
export const Notice: React.FC<{position: V3; rotation?: V3; w?: number; stamp: number}> = ({position, rotation, w = 0.6, stamp}) => {
  const pm = useMemo(() => new THREE.MeshBasicMaterial({map: noticeTex(), toneMapped: false}), []);
  const sm = useMemo(() => new THREE.MeshBasicMaterial({map: stampTex(), transparent: true, toneMapped: false, depthWrite: false, opacity: 0.92}), []);
  const h = w * 1024 / 768; const s = stamp <= 0 ? 0 : 1.8 - 0.8 * cl(stamp);
  return <group position={position} rotation={rotation}>
    <mesh material={pm}><planeGeometry args={[w, h]} /></mesh>
    {[[-0.42, 0.46], [0.42, 0.46]].map(([x, y], i) => <mesh key={i} position={[x * w, y * h, 0.004]} material={MB('#B0402E')}><circleGeometry args={[w * 0.02, 10]} /></mesh>)}
    {stamp > 0 && <mesh position={[0.06 * w, -0.33 * h, 0.002 + (1 - cl(stamp)) * 0.1]} rotation={[0, 0, -0.14]} scale={s} material={sm}><planeGeometry args={[w * 0.74, w * 0.74 * 256 / 640]} /></mesh>}
  </group>;
};
/** the "safe footbridge (if you can walk it)" sign at the foot of the stairs */
export const FootSign: React.FC<{position: V3; yaw?: number}> = ({position, yaw = 0}) => <group position={position} rotation={[0, yaw, 0]}>
  <mesh position={[0, 1.0, 0]} material={PM('#6E6A5E', 'spole')}><cylinderGeometry args={[0.04, 0.04, 2.0, 6]} /></mesh>
  <mesh position={[0, 2.05, 0.03]} material={label('foot', 512, 192, '#2E5E8E', '#FFFFFF', ['สะพานลอยปลอดภัย', '(ถ้าเดินไหว)'], 58)}><planeGeometry args={[1.5, 0.56]} /></mesh>
</group>;
export const PillarSign: React.FC<{position: V3; yaw?: number}> = ({position, yaw = 0}) => <mesh position={position} rotation={[0, yaw, 0]} material={label('demol', 512, 160, '#F2C230', INK, ['กำลังรื้อถอนผู้ต้องหา'], 52, INK)}><planeGeometry args={[0.9, 0.28]} /></mesh>;
