import React, {useMemo, useLayoutEffect, useRef} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {M, tex, F} from '../../pov/lib/tex';
import {Handcuffs} from '../AbsurdEp1/props';
import {HANDLE} from './data';
import {ik, fingers} from '../../pov/acting/ik';
import {strike, loc} from '../lifekit/stage';

/** EP13 คดีเสียงสะท้อน — the new things: the echo (the accused), the police sledgehammer, a brick wall that breaks, the jar cuffed at the lid, the foam cell. */
export type V3 = [number, number, number];
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const sm = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

// =====================================================================================================
// THE ECHO (no face — Nox): a bundle of sound, a pale-cyan core with rings rippling out of it, always facing the lens. Used where the echo is held (jar, cell, haunted house).
// pulse 0…1 = it is "talking" (bigger, faster rings); hoarse 0…1 = after prison (dim, broken, few rings)
// =====================================================================================================
const add = (c: string, o = 1) => new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide});
export const Echo: React.FC<{t: number; position?: V3; scale?: number; pulse?: number; hoarse?: number; light?: number}> = ({t, position = [0, 0, 0], scale = 1, pulse = 0, hoarse = 0, light = 1}) => {
  const g = useRef<THREE.Group>(null); const {camera} = useThree();
  useLayoutEffect(() => { if (g.current) g.current.quaternion.copy(camera.quaternion); });
  const ringM = useMemo(() => [0, 1, 2, 3].map(() => add('#7FE3FF')), []);
  const halo = useMemo(() => add('#3FB8F0', 0.35), []), core = useMemo(() => new THREE.MeshBasicMaterial({color: '#E6FBFF', toneMapped: false}), []);
  const speed = 1.4 + pulse * 1.6 - hoarse * 0.6, n = hoarse > 0.5 ? 2 : 4;
  const jit = hoarse * (hash(Math.floor(t * 15)) - 0.5) * 0.04;     // a hoarse echo stutters
  const breathe = 1 + 0.06 * Math.sin(t * 5) + pulse * 0.12 * Math.abs(Math.sin(t * 17));
  const glow = (1 - hoarse * 0.65) * light;
  return <group position={position} scale={scale}>
    <group ref={g}>
      <mesh material={halo} scale={breathe * (1 + pulse * 0.3)}><circleGeometry args={[0.17, 32]} /></mesh>
      <mesh material={core} scale={breathe} position={[jit, 0, 0.002]}><circleGeometry args={[0.1, 32]} /></mesh>
      {ringM.slice(0, n).map((m, i) => { const k = ((t * speed + i / n) % 1); m.opacity = (1 - k) * 0.9 * glow * (hoarse > 0.5 && i === 1 ? 0.4 : 1);
        const r = 0.13 + k * (0.42 + pulse * 0.25);
        return <mesh key={i} material={m} scale={r} position={[0, 0, 0.001]}><ringGeometry args={[0.93, 1, 48, 1, hoarse > 0.5 ? 0.3 + i : 0, hoarse > 0.5 ? Math.PI * 1.3 : Math.PI * 2]} /></mesh>; })}
    </group>
    {light > 0 && <pointLight color="#7FDFFF" intensity={(1.4 + pulse * 1.8) * glow} distance={3.2} decay={1.6} />}
  </group>;
};
/** the echo pinballing between wall points: eases into each point, a tiny squash on contact. pts in world space */
export const echoBounce = (t: number, pts: V3[], hop = 0.38): {p: V3; hitK: number} => {
  const u = Math.max(0, t) / hop, i = Math.floor(u), k = u - i; const a = pts[i % pts.length], b = pts[(i + 1) % pts.length];
  const e = 1 - Math.pow(1 - k, 2.2);                       // leaves fast, lands soft
  return {p: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e + Math.sin(k * Math.PI) * 0.12, a[2] + (b[2] - a[2]) * e], hitK: Math.max(0, 1 - k * 6)};
};

// =====================================================================================================
// SLEDGEHAMMER: grip at the origin, handle along +y, head at the top (0.86 m). Pose it in world space and IK both hands onto it.
// =====================================================================================================
export const SLEDGE_LEN = 0.86;
export const Sledgehammer: React.FC<{position: V3; rotation: V3}> = ({position, rotation}) => <group position={position} rotation={rotation}>
  <mesh castShadow material={M('#B4844F', 0.7)} position={[0, SLEDGE_LEN / 2 - 0.06, 0]}><cylinderGeometry args={[0.018, 0.022, SLEDGE_LEN, 10]} /></mesh>
  <mesh castShadow material={M('#1E2226', 0.8)} position={[0, -0.02, 0]}><cylinderGeometry args={[0.024, 0.024, 0.16, 10]} /></mesh>
  <mesh castShadow material={M('#4A5058', 0.35, 0.8)} position={[0, SLEDGE_LEN - 0.04, 0]}><boxGeometry args={[0.1, 0.1, 0.27]} /></mesh>
  {[-1, 1].map((s) => <mesh key={s} castShadow material={M('#6E767E', 0.3, 0.85)} position={[0, SLEDGE_LEN - 0.04, s * 0.142]}><boxGeometry args={[0.11, 0.11, 0.014]} /></mesh>)}
  <mesh material={M('#E8C53A', 0.6)} position={[0, SLEDGE_LEN - 0.04, 0]}><boxGeometry args={[0.102, 0.03, 0.2]} /></mesh>
</group>;

// =====================================================================================================
// BRICK WALL that breaks: plastered (seamless cream) instanced bricks in the wall's local XY plane (x across, y up, the room is +z).
// Each hit knocks out the bricks round it: they tumble out under gravity and come to rest on the floor; bricks at the edge of a hole show raw brick.
// =====================================================================================================
const BW = 0.24, BH = 0.085, BD = 0.12;
export type Hit = {t: number; x: number; y: number; r?: number};
export const BrickWall: React.FC<{t: number; w: number; h: number; position: V3; yaw?: number; hits: Hit[]; plaster?: string; floorY?: number}> = ({t, w, h, position, yaw = 0, hits, plaster = '#D9CFB6', floorY = 0}) => {
  const bricks = useMemo(() => { const out: {x: number; y: number}[] = []; const rows = Math.ceil(h / BH), cols = Math.ceil(w / BW) + 1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = -w / 2 + c * BW + (r % 2 ? 0 : BW / 2); if (x - BW / 2 > w / 2 || x + BW / 2 < -w / 2) continue; out.push({x, y: r * BH + BH / 2}); } return out; }, [w, h]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(BW, BH, BD), []), mat = useMemo(() => new THREE.MeshStandardMaterial({roughness: 0.9}), []);
  const cP = useMemo(() => new THREE.Color(plaster), [plaster]), cB = useMemo(() => new THREE.Color('#B4553A'), []), cB2 = useMemo(() => new THREE.Color('#9E4630'), []);
  useLayoutEffect(() => { const m = ref.current; if (!m) return; const o = new THREE.Object3D();
    bricks.forEach((b, i) => {
      // the first hit (already landed) that takes this brick out
      let gone: Hit | null = null; let edge = false;
      for (const hh of hits) { if (t < hh.t) continue; const d = Math.hypot((b.x - hh.x) * 0.8, b.y - hh.y), r = hh.r ?? 0.42; const rr = r * (0.8 + hash(i * 3.1 + hh.t) * 0.4);
        if (d < rr) { gone = hh; break; } if (d < rr + 0.16) edge = true; }
      if (gone) { const u = t - gone.t, s = hash(i * 7.3); const out = s < 0.65 ? -1 : 1;  // most fall out of the room, some spill in
        const vx = (b.x - gone.x) * 2.2 + (hash(i * 1.7) - 0.5) * 1.2, vz = out * (1.2 + hash(i * 2.9) * 1.8), vy = 0.6 + hash(i * 4.1) * 1.2;
        let y = b.y + vy * u - 4.9 * u * u; const land = y < floorY + BH / 2; const tl = land ? (vy + Math.sqrt(vy * vy + 19.6 * (b.y - floorY - BH / 2))) / 9.8 : u;
        if (land) y = floorY + BH / 2 + hash(i) * 0.02; const uu = Math.min(u, tl);
        o.position.set(b.x + vx * uu, y, vz * uu); o.rotation.set(uu * (4 + s * 6), uu * 3 * (s - 0.5), uu * 5 * (hash(i * 5) - 0.5)); o.scale.setScalar(0.75 + hash(i * 8) * 0.25);
        m.setColorAt(i, s > 0.5 ? cB : cB2);
      } else { o.position.set(b.x, b.y, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1); m.setColorAt(i, edge ? cB : cP); }
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); });
  return <group position={position} rotation={[0, yaw, 0]}><instancedMesh ref={ref} args={[geo, mat, bricks.length]} castShadow receiveShadow frustumCulled={false} /></group>;
};

// =====================================================================================================
// JAR cuffed at the lid: one cuff locked round the lid, the other hanging off the side. Label: the accused.
// =====================================================================================================
const JR = 0.055;
const jarLabel = () => tex('jar-label-13', 256, 128, (g) => {
  g.fillStyle = '#F4EFE2'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#B0302E'; g.lineWidth = 6; g.strokeRect(6, 6, 244, 116);
  g.fillStyle = '#B0302E'; g.font = F(700, 30); g.textAlign = 'center'; g.fillText('ผู้ต้องหา', 128, 44); g.fillStyle = '#2A2A2E'; g.font = F(700, 28); g.fillText('เสียงสะท้อน', 128, 82); g.font = F(500, 15); g.fillStyle = '#6A6A70'; g.fillText(HANDLE, 128, 112);
});
export const EchoJar: React.FC<{t: number; position?: V3; scale?: number; lid?: number; cuff?: number; children?: React.ReactNode}> = ({t, position, scale = 1, lid = 0, cuff = 1, children}) => {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({color: '#D8EEF2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide}), []);
  const rim = useMemo(() => new THREE.MeshStandardMaterial({color: '#E9F6F8', roughness: 0.1, transparent: true, opacity: 0.55}), []);
  const label = useMemo(() => new THREE.MeshStandardMaterial({map: jarLabel(), roughness: 0.8, side: THREE.DoubleSide}), []);
  const sway = Math.sin(t * 2.3) * 0.12;
  return <group position={position} scale={scale}>
    {children}
    <mesh material={glass} position={[0, 0.075, 0]}><cylinderGeometry args={[JR, JR, 0.15, 28, 1, true]} /></mesh>
    <mesh material={rim} position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[JR, 28]} /></mesh>
    <mesh material={rim} position={[0, 0.15, 0]}><torusGeometry args={[JR, 0.003, 6, 28]} /></mesh>
    <group position={[0, lid, 0]}>
      <mesh castShadow material={M('#9AA3AC', 0.3, 0.8)} position={[0, 0.162, 0]}><cylinderGeometry args={[0.058, 0.058, 0.022, 28]} /></mesh>
      {/* the cuff: loop A locked flat round the lid, loop B hangs off the +x side and swings */}
      {cuff > 0 && <group position={[0, 0.162, 0]}>
        <group position={[-0.067 * 2.8 * 1.45 + 0.067 * 2.8 * 1.45, 0, 0]}>
          <Handcuffs k={cuff} size={2.8} position={[0.067 * 1.45 * 1.0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
        <group position={[0.21, 0, 0]} rotation={[0, 0, -1.25 + sway]}><Handcuffs k={cuff} size={1.4} position={[0.035, 0, 0]} rotation={[0, 0, 0]} /></group>
      </group>}
    </group>
    <mesh material={label} position={[0, 0.06, 0]}><cylinderGeometry args={[JR + 0.0015, JR + 0.0015, 0.05, 20, 1, true, -0.75, 1.5]} /></mesh>
  </group>;
};

// =====================================================================================================
// FOAM lining for the Cell set (3 × 3 m, walls x = ±1.5, z = −1.5, h 2.8): grey acoustic pyramids on the back and both side walls.
// =====================================================================================================
export const FoamLining: React.FC<{color?: string}> = ({color = '#59606E'}) => {
  const ref = useRef<THREE.InstancedMesh>(null); const S = 0.15;
  const cells = useMemo(() => { const out: {p: V3; r: V3}[] = []; const n = Math.floor(2.98 / S), m = Math.floor(2.78 / S);
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = -1.49 + S / 2 + i * S, y = S / 2 + j * S, flip = (i + j) % 2 ? Math.PI / 4 : -Math.PI / 4;
      out.push({p: [a, y, -1.49], r: [Math.PI / 2, flip, 0]}); out.push({p: [-1.49, y, a], r: [0, 0, -Math.PI / 2]}); out.push({p: [1.49, y, a], r: [0, 0, Math.PI / 2]}); } return out; }, []);
  const geo = useMemo(() => { const g = new THREE.ConeGeometry(S * 0.7, S * 0.5, 4, 1); g.translate(0, S * 0.25, 0); return g; }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({color, roughness: 1, flatShading: true}), [color]);
  useLayoutEffect(() => { const m = ref.current; if (!m) return; const o = new THREE.Object3D();
    cells.forEach((c, i) => { o.position.set(...c.p); o.rotation.set(...c.r); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }, [cells]);
  return <instancedMesh ref={ref} args={[geo, mat, cells.length]} receiveShadow frustumCulled={false} />;
};

// =====================================================================================================
// REFLECT: the ROOM is the offender. A shout leaves `src` as arcs facing the wall, crosses to `hit` on the wall, the wall ripples
// (rings in the wall plane) and the same arcs come straight back to `src` — then again, weaker (echo of the echo).
// =====================================================================================================
export const Reflect: React.FC<{t: number; src: V3; hit: V3; normal: V3; t0s: number[]; speed?: number; bounces?: number; color?: string; power?: number}> = ({t, src, hit, normal, t0s, speed = 4.5, bounces = 3, color = '#2FB6EA', power = 1}) => {
  const d = Math.hypot(hit[0] - src[0], hit[1] - src[1], hit[2] - src[2]), leg = d / speed;
  const pool = useMemo(() => Array.from({length: 40}, () => new THREE.MeshBasicMaterial({color, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide})), [color]);   // normal blend: additive washes out on a cream wall
  const wallQ = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...normal).normalize()), [normal]);
  const out: React.ReactNode[] = []; let n = 0;
  const arc = (p: V3, toward: V3, r: number, o: number, key: string) => { if (n >= pool.length || o <= 0.01) return; const m = pool[n++]; m.opacity = o;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(toward[0] - p[0], toward[1] - p[1], toward[2] - p[2]).normalize());
    out.push(<mesh key={key} material={m} position={p} quaternion={q} scale={r}><ringGeometry args={[0.9, 1, 40, 1, 0, Math.PI * 2]} /></mesh>); };
  const L = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  t0s.forEach((t0, si) => { for (let b = 0; b < bounces * 2; b++) {   // even legs go out to the wall, odd legs come back
    const a = t0 + b * leg, u = (t - a) / leg, fade = Math.pow(0.6, b) * power; if (u < -0.05 || u > 1.6) continue;
    for (let w = 0; w < 3; w++) { const k = u - w * 0.09; if (k < 0 || k > 1) continue;      // three arcs per wavefront
      const out_ = b % 2 === 0; const p = out_ ? L(src, hit, k) : L(hit, src, k); const r = out_ ? 0.08 + k * 0.55 : 0.63 - k * 0.3;
      arc(p, out_ ? hit : src, r, fade * (1 - w * 0.25) * (0.35 + 0.65 * Math.sin(Math.min(1, k * 1.2) * Math.PI * 0.5 + 0.4)), `${si}-${b}-${w}`); }
    if (b % 2 === 0 && u > 1 && u < 1.6) {                     // the wall rings where the sound lands
      const k = (u - 1) / 0.6; for (let w = 0; w < 3; w++) { const kk = k - w * 0.15; if (kk < 0) continue; if (n >= pool.length) break; const m = pool[n++]; m.opacity = (1 - kk) * fade;
        out.push(<mesh key={`w${si}-${b}-${w}`} material={m} position={[hit[0] + normal[0] * 0.01, hit[1] + normal[1] * 0.01, hit[2] + normal[2] * 0.01]} quaternion={wallQ} scale={0.15 + kk * 0.9}><ringGeometry args={[0.88, 1, 48]} /></mesh>); } }
  } });
  const lit = t0s.some((t0) => t > t0 + leg && t < t0 + leg + 0.5);
  return <>{out}{lit && <pointLight position={[hit[0] + normal[0] * 0.3, hit[1], hit[2] + normal[2] * 0.3]} color={color} intensity={1.6 * power} distance={2.5} decay={1.6} />}</>;
};

// =====================================================================================================
// THE ROOM (the accused): 4 × 4 m, plain walls, a bare bulb, a doorway in the south wall (x 1.3); the north wall (z −2) is brick and breaks.
// night: bulb off, moonlight only (the haunted house reuses it)
// =====================================================================================================
const Bx: React.FC<{p: V3; s: V3; c: string}> = ({p, s, c}) => <mesh position={p} castShadow receiveShadow material={M(c, 0.9)}><boxGeometry args={s} /></mesh>;
const DOOR_X = 1.3, DOOR_W = 0.95;
export const EmptyRoom: React.FC<{t: number; hits?: Hit[]; night?: boolean; wall?: string}> = ({t, hits = [], night = false, wall = '#D9CFB6'}) => {
  const sky = useMemo(() => new THREE.MeshBasicMaterial({color: night ? '#1C2540' : '#CFE4F2', toneMapped: false}), [night]);
  const out = useMemo(() => new THREE.MeshBasicMaterial({color: night ? '#151B2C' : '#BFD6E4', toneMapped: false}), [night]);
  const sw = (a: number, b: number) => <Bx p={[(a + b) / 2, 1.35, 2.05]} s={[b - a, 2.7, 0.1]} c={wall} />;
  return <group>
    <Bx p={[0, -0.05, 0]} s={[4.2, 0.1, 4.4]} c={night ? '#5E4A36' : '#A9825A'} />
    <Bx p={[0, 2.75, 0]} s={[4.2, 0.1, 4.4]} c={night ? '#4A4A4C' : '#EFEBE0'} />
    <Bx p={[-2.05, 1.35, 0]} s={[0.1, 2.7, 4.2]} c={wall} /><Bx p={[2.05, 1.35, 0]} s={[0.1, 2.7, 4.2]} c={wall} />
    {sw(-2.1, DOOR_X - DOOR_W / 2)}{sw(DOOR_X + DOOR_W / 2, 2.1)}<Bx p={[DOOR_X, 2.4, 2.05]} s={[DOOR_W, 0.7, 0.1]} c={wall} />
    <BrickWall t={t} w={4.0} h={2.7} position={[0, 0, -2.0]} hits={hits} plaster={wall} />
    <mesh position={[-1.99, 1.5, -0.6]} rotation={[0, Math.PI / 2, 0]} material={sky}><planeGeometry args={[1.0, 1.0]} /></mesh>
    {[0.52, -0.52].map((y) => <Bx key={y} p={[-1.97, 1.5 + y, -0.6]} s={[0.06, 0.05, 1.08]} c="#F2EFE8" />)}
    <mesh position={[0, 2.35, -0.3]} material={new THREE.MeshBasicMaterial({color: night ? '#5A5448' : '#FFE9B8', toneMapped: false})}><sphereGeometry args={[0.05, 12, 10]} /></mesh>
    <mesh position={[0, 2.55, -0.3]} material={M('#222222', 0.6)}><cylinderGeometry args={[0.004, 0.004, 0.36, 4]} /></mesh>
    {night ? <><hemisphereLight args={['#5A6CA0', '#1A1C22', 1.0]} /><directionalLight position={[-6, 4, -2]} color="#8EA6E8" intensity={0.7} /></>
      : <><pointLight position={[0, 2.3, -0.3]} color="#FFE2B0" intensity={2.2} distance={7} decay={1.4} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
        <hemisphereLight args={['#DCE6EE', '#5A4E40', 0.9]} /><directionalLight position={[-6, 5, 6]} color="#FFF1D6" intensity={0.8} /></>}
    {/* outside, seen through the holes and the doorway */}
    <mesh position={[0, 3, -9]} material={out}><planeGeometry args={[40, 12]} /></mesh>
    <mesh position={[0, 3, 9]} rotation={[0, Math.PI, 0]} material={out}><planeGeometry args={[40, 12]} /></mesh>
    <mesh position={[0, -0.06, -6]} rotation={[-Math.PI / 2, 0, 0]} material={M(night ? '#26331E' : '#6A8742', 0.95)}><planeGeometry args={[40, 8]} /></mesh>
    <mesh position={[0, -0.06, 5.5]} rotation={[-Math.PI / 2, 0, 0]} material={M(night ? '#2A2622' : '#8C8478', 0.95)}><planeGeometry args={[40, 7]} /></mesh>
  </group>;
};
export const ROOM_DOOR: V3 = [DOOR_X, 0, 2.05];

/** a two-handed sledgehammer swing in front of the cop (yaw 0 = facing +z) that lands at each time in `hits`; hitAt = where the head meets a wall 1.17 m ahead */
export const swing = (I: any, s: any, t: number, hits: number[]) => {
  const k = hits.reduce((a, h) => Math.max(a, strike(t, h, 0.4)), 0);         // 0 = head on the wall, 1 = raised behind the head
  const th = Math.PI / 2 * (1 - k) - 0.35 * k;                                    // handle pitch: forward-level → over the shoulder
  const fw = (d: number): [number, number] => [s.x + Math.sin(s.yaw) * d, s.z + Math.cos(s.yaw) * d];
  const gd = 0.3 * (1 - k) + 0.02 * k, gy = 1.0 * (1 - k) + 1.42 * k;            // grip: waist-front → above the shoulder
  const [gx, gz] = fw(gd);
  const along = (u: number): V3 => { const [x, z] = fw(gd + Math.sin(th) * u); return [x, gy + Math.cos(th) * u, z]; };
  fingers(I, 'R', 'fist', 1); fingers(I, 'L', 'fist', 1);
  ik(I, 'R', loc(I, along(0.3)), new THREE.Vector3(-1, -0.6, -0.4), 1); ik(I, 'L', loc(I, along(0.04)), new THREE.Vector3(1, -0.6, -0.4), 1);
  const [hx, hz] = fw(0.3 + SLEDGE_LEN - 0.04);
  return {node: <group position={[gx, gy, gz]} rotation={[0, s.yaw, 0]}><Sledgehammer position={[0, 0, 0]} rotation={[th, 0, 0]} /></group>, hitAt: [hx, 1.0, hz] as V3};
};

/** ♪ notes floating up from a singer's mouth, swaying */
const noteTex = (c: string) => tex('note13-' + c, 64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.fillStyle = c; g.font = F(700, 54); g.textAlign = 'center'; g.fillText('♪', 32, 52); });
export const Notes: React.FC<{from: V3; t: number; t0: number; n?: number; color?: string; dir?: V3}> = ({from, t, t0, n = 6, color = '#F2D04A', dir = [0, 0, 0]}) => {
  const m = useMemo(() => new THREE.SpriteMaterial({map: noteTex(color), transparent: true, depthWrite: false, toneMapped: false}), [color]);
  return <>{Array.from({length: n}, (_, i) => { const u = t - t0 - i * 0.18; if (u < 0) return null; const k = (u % 1.2) / 1.2;
    return <sprite key={i} material={m} position={[from[0] + dir[0] * k + Math.sin(u * 5 + i) * 0.06, from[1] + k * 0.45 + dir[1] * k, from[2] + dir[2] * k]} scale={0.1 * (1 - k * 0.3)} />; })}</>;
};

/** a wooden sign board on two posts; text lines from the top (first line big) */
export const SignBoard: React.FC<{position: V3; yaw?: number; lines: string[]; w?: number; h?: number; bg?: string; fg?: string}> = ({position, yaw = 0, lines, w = 1.2, h = 0.8, bg = '#3A2A20', fg = '#E8DCC0'}) => {
  const H = Math.round(512 * h / w);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false, map: tex('sign13-' + lines.join('|'), 512, H, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, 512, H); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, 492, H - 20); g.fillStyle = fg; g.textAlign = 'center';
    lines.forEach((l, i) => { g.font = F(700, i ? 34 : 70); g.fillText(l, 256, i ? 120 + i * 50 : 96); }); })}), [lines.join('|'), H]);
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, h / 2 + 0.9, 0]} material={mat}><planeGeometry args={[w, h]} /></mesh>
    <mesh position={[0, h / 2 + 0.9, -0.012]} rotation={[0, Math.PI, 0]} material={M(bg, 0.9)}><planeGeometry args={[w, h]} /></mesh>
    {[-1, 1].map((x) => <mesh key={x} castShadow position={[x * w * 0.42, (h + 0.9) / 2, -0.03]} material={M('#4A3626', 0.9)}><boxGeometry args={[0.06, h + 0.9, 0.06]} /></mesh>)}
  </group>;
};
/** planks nailed across a window, a little crooked */
export const Boards: React.FC<{position: V3; w: number; h: number; yaw?: number}> = ({position, w, h, yaw = 0}) => <group position={position} rotation={[0, yaw, 0]}>
  {[-0.3, 0.02, 0.3].map((y, i) => <mesh key={i} castShadow position={[0, y * h, 0]} rotation={[0, 0, (i - 1) * 0.12 + 0.05]} material={M(['#6B5038', '#5E4632', '#735640'][i], 0.95)}><boxGeometry args={[w * 1.15, 0.14, 0.03]} /></mesh>)}</group>;
/** a rocking chair; rock = current angle */
export const RockingChair: React.FC<{position: V3; yaw?: number; rock?: number}> = ({position, yaw = 0, rock = 0}) => { const wd = M('#6A4A30', 0.8);
  return <group position={position} rotation={[0, yaw, 0]}><group rotation={[rock, 0, 0]} position={[0, 0.04, 0]}>
    {[-0.22, 0.22].map((x) => <mesh key={x} castShadow position={[x, 0.32, -0.05]} rotation={[0, Math.PI / 2, Math.PI / 2 + Math.PI * 0.34]} material={wd}><torusGeometry args={[0.38, 0.018, 6, 24, Math.PI * 0.32]} /></mesh>)}
    {[-0.22, 0.22].map((x) => [-0.2, 0.15].map((z) => <mesh key={x + ':' + z} castShadow position={[x, 0.22, z]} material={wd}><boxGeometry args={[0.04, 0.4, 0.04]} /></mesh>))}
    <mesh castShadow position={[0, 0.43, -0.02]} material={wd}><boxGeometry args={[0.5, 0.05, 0.45]} /></mesh>
    <mesh castShadow position={[0, 0.78, -0.24]} rotation={[-0.2, 0, 0]} material={wd}><boxGeometry args={[0.5, 0.65, 0.04]} /></mesh>
    {[-0.24, 0.24].map((x) => <mesh key={x} castShadow position={[x, 0.6, 0.0]} material={wd}><boxGeometry args={[0.04, 0.04, 0.42]} /></mesh>)}
  </group></group>; };
