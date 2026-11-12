import React, {useMemo, useLayoutEffect, useRef} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {M, tex, F} from '../../pov/lib/tex';
import {Handcuffs} from '../AbsurdEp1/props';
import {HANDLE} from '../AbsurdEp12/data';

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
