import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, glowTex} from '../../pov/lib/tex';
import {Dog, Cat} from '../../pov/fx/animals';

/**
 * lifekit — the non-human "life" of a scene: far skyline, trees, animals, vehicles, things that hang and sway.
 * Every component is a pure function of `t` (seconds): no useFrame, no random, no state. Metres, y up, origin on the ground
 * under the object, facing +z unless stated. All swaying things read the same wind(), so a scene sways as one.
 */
export type V3 = [number, number, number];
type FC<P> = React.FC<P>;
const TAU = Math.PI * 2, UP = new THREE.Vector3(0, 1, 0);
export const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x: number) => { const c = cl(x); return c * c * (3 - 2 * c); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const fr = (x: number) => x - Math.floor(x);
const v3 = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const angLerp = (a: number, b: number, k: number) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return a + d * k; };
const mixC = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
/** the one shared wind, roughly −1…1 (0.3 / 0.55 / 0.85 Hz); `seed` only shifts the phase */
export const wind = (t: number, seed = 0) => Math.sin(t * 2.0 + seed * 1.3) * 0.55 + Math.sin(t * 3.4 + seed * 2.9 + 1.3) * 0.3 + Math.sin(t * 5.3 + seed * 0.7 + 2.1) * 0.15;

// ---------------------------------------------------------------- shared geometry / materials / small parts
const cache = new Map<string, any>();
const G = <T,>(k: string, mk: () => T): T => { if (!cache.has(k)) cache.set(k, mk()); return cache.get(k) as T; };
const BOX = () => G('box', () => new THREE.BoxGeometry(1, 1, 1));
const ICO = (d = 0) => G('ico' + d, () => new THREE.IcosahedronGeometry(1, d));
const SPH = () => G('sph', () => new THREE.SphereGeometry(1, 16, 12));
const CYL = (rt = 1, rb = 1, seg = 8) => G(`cyl${rt}_${rb}_${seg}`, () => new THREE.CylinderGeometry(rt, rb, 1, seg));
const tri = (k: string, p: number[], idx: number[]) => G(k, () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; });
/** flat-shaded matte material (the low-poly look); FL2 = double sided (leaves, cloth, wings) */
const FL = (c: string) => M(c, 0.9, 0, {flatShading: true}, 'lkF');
const FL2 = (c: string) => M(c, 0.9, 0, {flatShading: true, side: THREE.DoubleSide}, 'lkF2');
const SM = (c: string, rough = 0.85) => M(c, rough, 0, {}, 'lkS');

type MP = {p?: V3; s?: V3 | number; r?: V3; m: THREE.Material; cast?: boolean};
const Ms: FC<MP & {g: THREE.BufferGeometry}> = ({g, p, s, r, m, cast = true}) => <mesh geometry={g} position={p} scale={s} rotation={r} material={m} castShadow={cast} receiveShadow />;
const Bx: FC<MP> = (q) => <Ms g={BOX()} {...q} />;
const Bl: FC<MP & {d?: number}> = ({d = 0, ...q}) => <Ms g={ICO(d)} {...q} />;
const Sp: FC<MP> = (q) => <Ms g={SPH()} {...q} />;
/** a bar from a to b: box of cross-section w (or [wx, wz]); round = a 6-sided rod of diameter w */
const Seg: FC<{a: V3; b: V3; w: number | [number, number]; m: THREE.Material; round?: boolean; cast?: boolean}> = ({a, b, w, m, round, cast = true}) => {
  const d = v3(b).sub(v3(a)), L = d.length(); const [wx, wz] = typeof w === 'number' ? [w, w] : w; const k = round ? 0.5 : 1;
  return <mesh geometry={round ? CYL(1, 1, 6) : BOX()} position={mix3(a, b, 0.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(UP, d.normalize())} scale={[wx * k, L, wz * k]} material={m} castShadow={cast} />;
};
/** a smooth tapered limb (same shape as the street dog's) */
const Cap: FC<{a: V3; b: V3; r0: number; r1: number; m: THREE.Material}> = ({a, b, r0, r1, m}) => {
  const d = v3(b).sub(v3(a)), len = d.length();
  const g = G(`cap${len.toFixed(3)}_${r0}_${r1}`, () => { const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 4; i++) { const q = (i / 4) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(q) * r0, -Math.cos(q) * r0)); }
    for (let i = 0; i <= 4; i++) { const q = (i / 4) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(q) * r1, len + Math.sin(q) * r1)); }
    return new THREE.LatheGeometry(pts, 10); });
  return <mesh geometry={g} material={m} position={a} quaternion={new THREE.Quaternion().setFromUnitVectors(UP, d.normalize())} castShadow />;
};
const Glow: FC<{p?: V3; s: number | [number, number]; color: string; o: number}> = ({p, s, color, o}) => {
  const m = useMemo(() => new THREE.SpriteMaterial({map: glowTex(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false}), []);
  m.color.set(color); m.opacity = o;
  return <sprite material={m} position={p} scale={typeof s === 'number' ? [s, s, 1] : [s[0], s[1], 1]} />;
};
/** a soft pool of light lying on the ground (cheap stand-in for a real light); r = [0, 0, 0] stands it up as a halo on a wall */
const Pool: FC<{p: V3; s: [number, number]; color: string; o: number; r?: V3}> = ({p, s, color, o, r = [-Math.PI / 2, 0, 0]}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: glowTex(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false}), []);
  m.color.set(color); m.opacity = o;
  return <mesh material={m} position={p} rotation={r} scale={[s[0], s[1], 1]}><planeGeometry args={[1, 1]} /></mesh>;
};
/** span frame: x along a→b, y up, z sideways */
const span = (a: V3, b: V3) => { const X = v3(b).sub(v3(a)), L = X.length(); X.normalize(); const Z = new THREE.Vector3().crossVectors(X, UP); if (Z.lengthSq() < 1e-6) Z.set(0, 0, 1); Z.normalize();
  return {L, q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, new THREE.Vector3().crossVectors(Z, X), Z))}; };
const sagY = (u: number, sag: number) => -4 * sag * u * (1 - u);
/** a sagging wire from a to b; children live in the span frame (x = distance along, y = sagY). `swing` rocks it about the a–b axis. */
const Wire: FC<{a: V3; b: V3; sag?: number; r?: number; swing?: number; m: THREE.Material; children?: React.ReactNode}> = ({a, b, sag = 0.3, r = 0.012, swing = 0, m, children}) => {
  const {L, q} = span(a, b);
  const g = G(`wire${L.toFixed(2)}_${sag}_${r}`, () => new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(L / 2, -2 * sag, 0), new THREE.Vector3(L, 0, 0)), 12, r, 4));
  return <group position={a} quaternion={q}><group rotation={[swing, 0, 0]}><mesh geometry={g} material={m} />{children}</group></group>;
};
// instancing: a dummy object, a mesh per component, matrices rewritten every render (pure in t)
const D = new THREE.Object3D(), COL = new THREE.Color();
const useInst = (g: THREE.BufferGeometry, m: THREE.Material, n: number, cast = false) => useMemo(() => { const o = new THREE.InstancedMesh(g, m, n); o.frustumCulled = false; o.castShadow = cast; return o; }, [g, m, n, cast]);
const put = (o: THREE.InstancedMesh, i: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, sx: number, sy = sx, sz = sx, order: THREE.EulerOrder = 'XYZ') => {
  D.position.set(x, y, z); D.rotation.set(rx, ry, rz, order); D.scale.set(sx, sy, sz); D.updateMatrix(); o.setMatrixAt(i, D.matrix); };

// =====================================================================================================
// Far layer
// =====================================================================================================
const WALLS = ['#D9CDA6', '#C4CFB8', '#DBC2AA', '#CBC8BF', '#DDD4B2', '#BCC9D0', '#B9B4AA', '#C9B9A0'], ROOFS = ['#8C3F2A', '#4E5C6E', '#6E3524', '#5B605A'];
const winTex = (cols: number, rows: number, lit: boolean, v: number) => tex(`lk-win${cols}x${rows}${lit ? 'L' : 'D'}${v}`, 256, 256, (g) => {
  g.fillStyle = lit ? '#000000' : '#FFFFFF'; g.fillRect(0, 0, 256, 256); const cw = 256 / cols, ch = 256 / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const h = hash(r * 17.3 + c * 5.1 + v * 31.7 + cols);
    if (lit) { if (h > 0.36) continue; g.fillStyle = h < 0.05 ? '#BFD8FF' : h < 0.2 ? '#FFE7B0' : '#FFC878'; } else g.fillStyle = h < 0.25 ? '#8493A0' : '#66757F';
    g.fillRect(c * cw + cw * 0.2, r * ch + ch * 0.22, cw * 0.6, ch * 0.5); }
  if (!lit) { g.fillStyle = 'rgba(0,0,0,0.1)'; for (let r = 1; r < rows; r++) g.fillRect(0, r * ch - 1, 256, 2); }
});
const KINDS = [{cols: 3, rows: 2}, {cols: 6, rows: 4}, {cols: 5, rows: 9}];   // house, shop-house row, block
const tvLevel = (t: number, seed: number) => 0.45 + 0.4 * hash(Math.floor(t * 1.3 + seed) * 5.3 + seed) + 0.15 * hash(Math.floor(t * 7 + seed * 3.3) * 1.7 + seed * 9.1);
const tvColor = (t: number, seed: number) => mixC('#3F66B8', '#CFE0FF', tvLevel(t, seed));
/** distant town: instanced houses / shop-house rows / blocks in a ring r0…r1 (or an arc [a0, a1], angle = atan2(z, x)). night lights a subset of windows; a few flicker like a TV. */
export const Skyline: FC<{t: number; night?: number; r0?: number; r1?: number; n?: number; seed?: number; arc?: [number, number]; haze?: string}> = ({t, night = 0, r0 = 55, r1 = 110, n = 90, seed = 0, arc, haze = '#BFD6E4'}) => {
  const a0 = arc ? arc[0] : 0, a1 = arc ? arc[1] : TAU;
  const S = useMemo(() => {
    const list = Array.from({length: n}, (_, i) => { const h = (k: number) => hash(i * 3.71 + seed * 13.3 + k + 0.31);
      const a = a0 + ((i + h(1) * 0.9) / n) * (a1 - a0), u = h(2), R = r0 + u * (r1 - r0), kh = h(3) * 0.8 + u * 0.2, kind = kh < 0.5 ? 0 : kh < 0.84 ? 1 : 2;
      return {x: Math.cos(a) * R, z: Math.sin(a) * R, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)) + (h(7) - 0.5) * 0.5, u, kind, v: h(8) < 0.5 ? 0 : 1, c: Math.floor(h(9) * WALLS.length),
        w: kind === 0 ? 7 + h(4) * 3 : kind === 1 ? 12 + h(4) * 9 : 10 + h(4) * 6, d: kind === 0 ? 7 + h(5) * 2 : 9 + h(5) * 4, hh: kind === 0 ? 5.5 + h(6) * 1.5 : kind === 1 ? 9 + h(6) * 4 : 14 + h(6) * 16 * u}; });
    const mats: THREE.MeshLambertMaterial[] = [], meshes: THREE.InstancedMesh[] = [];
    const mk = (g: THREE.BufferGeometry, m: THREE.Material, c: number) => { const o = new THREE.InstancedMesh(g, m, Math.max(1, c)); o.count = c; o.frustumCulled = false; meshes.push(o); return o; };
    KINDS.forEach((K, kind) => [0, 1].forEach((v) => { const sel = list.filter((b) => b.kind === kind && b.v === v);
      const m = new THREE.MeshLambertMaterial({map: winTex(K.cols, K.rows, false, v), emissiveMap: winTex(K.cols, K.rows, true, v), emissive: '#FFFFFF', emissiveIntensity: 0}); mats.push(m);
      const o = mk(BOX(), m, sel.length); sel.forEach((b, i) => { put(o, i, b.x, b.hh / 2, b.z, 0, b.yaw, 0, b.w, b.hh, b.d); o.setColorAt(i, COL.set(WALLS[b.c]).lerp(new THREE.Color(haze), 0.2 + b.u * 0.35)); }); }));
    const low = list.filter((b) => b.kind === 0), high = list.filter((b) => b.kind > 0);
    const roof = mk(G('pyr', () => new THREE.ConeGeometry(0.7071, 1, 4).rotateY(Math.PI / 4)), new THREE.MeshLambertMaterial({flatShading: true}), low.length);
    low.forEach((b, i) => { put(roof, i, b.x, b.hh + 1.1, b.z, 0, b.yaw, 0, b.w + 0.9, 2.2, b.d + 0.9); roof.setColorAt(i, COL.set(ROOFS[b.c % 4]).lerp(new THREE.Color(haze), 0.2 + b.u * 0.35)); });
    const tank = mk(BOX(), new THREE.MeshLambertMaterial({color: mixC('#A9A9A2', haze, 0.2)}), high.length);
    high.forEach((b, i) => put(tank, i, b.x + Math.cos(b.yaw) * b.w * 0.2, b.hh + 0.9, b.z - Math.sin(b.yaw) * b.w * 0.2, 0, b.yaw, 0, 3, 1.8, 2.5));
    const tvs = high.slice().sort((p, q) => p.u - q.u).slice(0, 3).map((b, i) => { const K = KINDS[b.kind], c = Math.floor(hash(i * 5.7 + seed + 0.2) * K.cols), r = 1 + Math.floor(hash(i * 9.1 + seed + 0.4) * (K.rows - 1));
      return {b, p: [((c + 0.5) / K.cols - 0.5) * b.w, (1 - (r + 0.47) / K.rows) * b.hh, b.d / 2 + 0.08] as V3, s: [(b.w / K.cols) * 0.6, (b.hh / K.rows) * 0.5, 1] as V3, m: new THREE.MeshBasicMaterial({toneMapped: false})}; });
    return {mats, meshes, tvs};
  }, [n, seed, r0, r1, a0, a1, haze]);
  S.mats.forEach((m) => { m.emissiveIntensity = night; }); S.tvs.forEach((v, i) => v.m.color.set(tvColor(t, i + seed)));   // own materials, recoloured: the TV colour changes every few frames
  return <group>{S.meshes.map((o, i) => <primitive key={i} object={o} />)}
    {night > 0.3 && S.tvs.map((v, i) => <group key={i} position={[v.b.x, 0, v.b.z]} rotation={[0, v.b.yaw, 0]}><mesh position={v.p} scale={v.s} material={v.m}><planeGeometry args={[1, 1]} /></mesh></group>)}
  </group>;
};
const hillGeo = (r: number, hMax: number, seed: number, segs = 72) => G(`hill${r}_${hMax}_${seed}`, () => {
  const H = (a: number) => hMax * (0.3 + 0.7 * Math.abs(Math.sin(a * 2 + seed * 1.7) * 0.5 + Math.sin(a * 3 + seed * 4.1) * 0.3 + Math.sin(a * 7 + seed * 2.3) * 0.2));
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segs; i++) { const a = (i / segs) * TAU, c = Math.cos(a), s = Math.sin(a), h = H(a), j = hash((i % segs) * 3.3 + seed + 0.1);
    pos.push(c * r * 0.9, -0.5, s * r * 0.9, c * r * (0.96 + j * 0.03), h * (0.45 + j * 0.3), s * r * (0.96 + j * 0.03), c * r * 1.06, h, s * r * 1.06); }
  for (let i = 0; i < segs; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k, b = a + 3; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
});
/** two rings of low faceted hills on the horizon */
export const Hills: FC<{color?: string; r?: number; seed?: number; h?: number; haze?: string}> = ({color = '#7F9A7E', r = 160, seed = 0, h = 16, haze = '#C9DAE4'}) => <group>
  <mesh geometry={hillGeo(r * 1.3, h * 1.7, seed + 5)} material={FL2(mixC(color, haze, 0.45))} />
  <mesh geometry={hillGeo(r, h, seed)} material={FL2(color)} />
</group>;
/** concrete poles from a to b (ground points) with 3 sagging wires. Wire k of span i runs between the pole tops: see powerWire(). */
export const PowerLine: FC<{a: V3; b: V3; poles?: number; t: number; h?: number; sag?: number}> = ({a, b, poles = 4, t, h = 8, sag = 0.5}) => {
  const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]), con = M('#A8A49C', 0.85), dark = M('#2B2D30', 0.6), arm = M('#7D7A74', 0.8);
  return <group>
    {Array.from({length: poles}, (_, i) => <group key={i} position={mix3(a, b, poles > 1 ? i / (poles - 1) : 0)} rotation={[0, yaw, 0]}>
      <Ms g={CYL(0.7, 1, 8)} p={[0, h / 2, 0]} s={[0.16, h, 0.16]} m={con} />
      <Bx p={[0, h - 0.35, 0]} s={[1.7, 0.1, 0.1]} m={arm} />
      {[-0.75, 0.75].map((x) => <Bx key={x} p={[x, h - 0.24, 0]} s={[0.07, 0.14, 0.07]} m={M('#D8D4C8', 0.5)} />)}
      {i % 3 === 2 && <><Bx p={[0.34, h - 2.3, 0]} s={[0.5, 0.75, 0.45]} m={M('#8B9096', 0.5, 0.4)} /><Bx p={[0.34, h - 1.85, 0]} s={[0.56, 0.06, 0.5]} m={arm} /></>}
    </group>)}
    {Array.from({length: Math.max(0, poles - 1)}, (_, i) => [0, 1, 2].map((k) => { const w = powerWire(a, b, poles, i, k, h);
      return <Wire key={i + ':' + k} a={w.a} b={w.b} sag={sag * (k === 2 ? 1.5 : 1)} r={k === 2 ? 0.024 : 0.014} swing={wind(t, i * 0.4 + k * 0.2) * 0.07} m={dark} />; }))}
  </group>;
};
/** end points of wire k (0, 1 = on the cross-arm, 2 = the lower cable) of span i of a PowerLine: feed them to WireBirds */
export const powerWire = (a: V3, b: V3, poles: number, i: number, k: number, h = 8) => { const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]), x = [-0.75, 0.75, 0.1][k], y = k === 2 ? h - 1.5 : h - 0.17;
  const at = (j: number): V3 => { const p = mix3(a, b, j / (poles - 1)); return [p[0] + Math.cos(yaw) * x, p[1] + y, p[2] - Math.sin(yaw) * x]; }; return {a: at(i), b: at(i + 1)}; };
/** low-poly clouds drifting along +x over a 200 m square, wrapping (they shrink to nothing at the edges, so no pop) */
export const CloudsDrift: FC<{t: number; y?: number; n?: number; seed?: number; night?: number; speed?: number; center?: V3}> = ({t, y = 40, n = 9, seed = 0, night = 0, speed = 0.4, center = [0, 0, 0]}) => {
  const m = useMemo(() => new THREE.MeshLambertMaterial({flatShading: true}), []);
  m.color.set(mixC('#F4F6F8', '#46526C', night)); m.emissive.set(mixC('#7C8894', '#161C2C', night));
  const o = useInst(ICO(1), m, n * 4);
  for (let i = 0; i < n; i++) { const h = (k: number) => hash(i * 5.3 + seed * 11.1 + k + 0.7);
    const x = fr((h(1) * 200 + speed * t * (0.7 + 0.6 * h(2))) / 200) * 200 - 100, z = (h(3) - 0.5) * 200, s = (5 + h(4) * 5) * sm((100 - Math.abs(x)) / 14);
    for (let k = 0; k < 4; k++) { const q = (j: number) => hash(i * 7.7 + k * 3.9 + seed + j), r = s * (0.55 + q(1) * 0.45) * (k === 1 || k === 2 ? 1 : 0.7);
      put(o, i * 4 + k, center[0] + x + (k - 1.5) * s * 0.75, center[1] + y + (h(5) - 0.5) * 10 + q(2) * s * 0.15, center[2] + z + (q(3) - 0.5) * s * 0.6, q(4) * 3, q(5) * 3, 0, r, r * 0.5, r * 0.8); } }
  o.instanceMatrix.needsUpdate = true;
  return <primitive object={o} />;
};

// =====================================================================================================
// Nature
// =====================================================================================================
const LEAF = ['#3F5E2A', '#466A2E', '#3A5628'], LEAF_HI = ['#58793A', '#5F8440', '#4F6F36'], BARK = '#5A4330';
const TREE = {round: {th: 2.7, n: 6, r: 1.0, ry: 0.85, sx: 0.85, sy: 0.55, tr: 0.13}, tall: {th: 2.4, n: 5, r: 0.85, ry: 1.25, sx: 0.12, sy: 0.75, tr: 0.11}, mango: {th: 1.8, n: 7, r: 1.2, ry: 0.75, sx: 1.3, sy: 0.35, tr: 0.2}};
/** trunk + faceted canopy; the canopy leans with the wind and every blob shifts a little on its own. round ≈ 5 m, tall ≈ 7.5 m, mango ≈ 4 m and wide. */
export const SwayTree: FC<{position: V3; t: number; seed?: number; scale?: number; kind?: 'round' | 'tall' | 'mango'}> = ({position, t, seed = 0, scale = 1, kind = 'round'}) => {
  const c = TREE[kind], h = (k: number) => hash(seed * 7.7 + k * 3.1 + 0.5), w = wind(t, seed * 0.3), w2 = wind(t * 1.3, seed * 0.3 + 4);
  return <group position={position} scale={scale} rotation={[0, h(0) * TAU, w * 0.012]}>
    <Ms g={CYL(0.75, 1, 7)} p={[0, c.th / 2, 0]} s={[c.tr, c.th, c.tr]} m={FL(BARK)} />
    {kind === 'mango' && [-1, 1].map((s) => <Seg key={s} a={[0, c.th * 0.7, 0]} b={[s * 0.8, c.th + 0.5, s * 0.3]} w={0.2} round m={FL(BARK)} />)}
    <group position={[0, c.th, 0]} rotation={[w2 * 0.02, 0, w * 0.035]}>
      {Array.from({length: c.n}, (_, k) => { const a = (k / (c.n - 1)) * TAU + h(k + 10) * 0.8, tall = kind === 'tall', r = tall ? c.r * (1 - (k / c.n) * 0.5) : k === 0 ? c.r * 1.15 : c.r * (0.65 + h(k + 20) * 0.3);
        const p: V3 = tall ? [(h(k + 30) - 0.5) * c.sx, 0.4 + k * c.sy, (h(k + 40) - 0.5) * c.sx] : k === 0 ? [0, 0.75, 0] : [Math.cos(a) * c.sx * (0.7 + h(k + 30) * 0.4), 0.45 + h(k + 40) * c.sy * 2, Math.sin(a) * c.sx * (0.7 + h(k + 30) * 0.4)];
        return <Bl key={k} p={[p[0] + wind(t * 1.6, seed + k * 5) * 0.05, p[1] + wind(t * 1.9, seed + k * 3 + 2) * 0.03, p[2]]} s={[r, r * c.ry, r]} r={[h(k + 50) * 3, h(k + 60) * 3, wind(t * 1.4, seed + k) * 0.04]} m={FL((k % 3 === 1 ? LEAF_HI : LEAF)[Math.floor(seed) % 3])} />; })}
      {kind === 'mango' && [0, 1, 2, 3, 4].map((k) => { const a = h(k + 70) * TAU, sw = wind(t * 1.5, seed + k * 2) * 0.12;
        return <group key={k} position={[Math.cos(a) * 1.5, 0.15, Math.sin(a) * 1.5]} rotation={[sw, 0, sw * 0.7]}><Bx p={[0, -0.12, 0]} s={[0.012, 0.24, 0.012]} m={FL(BARK)} cast={false} /><Bl d={1} p={[0, -0.3, 0]} s={[0.055, 0.085, 0.055]} m={FL('#A9B24A')} /></group>; })}
    </group>
  </group>;
};
const frondGeo = () => { const n = 10, pos: number[] = [], idx: number[] = [];   // spine along +z (length 1), arching up then drooping; serrated edges read as leaflets
  for (let j = 0; j <= n; j++) { const u = j / n, y = 0.2 * Math.sin(u * 2.2) - 0.55 * u * u, w = (0.04 + 0.2 * Math.sin(Math.PI * Math.min(1, u * 1.02))) * (j % 2 ? 1 : 0.5);
    pos.push(0, y, u, -w, y - w * 0.6, u + 0.03, w, y - w * 0.6, u + 0.03); }
  for (let j = 0; j < n; j++) { const a = j * 3, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a, a + 2, b, a + 2, b + 2, b); }
  return tri('frond', pos, idx); };
const Frond: FC<{yaw: number; pitch: number; roll: number; len: number; m: THREE.Material; p?: V3}> = ({yaw, pitch, roll, len, m, p}) =>
  <group position={p} rotation={[0, yaw, 0]}><mesh geometry={frondGeo()} rotation={[pitch, 0, roll]} scale={len} material={m} castShadow /></group>;
/** coconut palm: leaning curved trunk of height h, 7–9 swaying fronds, a few coconuts */
export const Palm: FC<{position: V3; t: number; seed?: number; h?: number}> = ({position, t, seed = 0, h = 6}) => {
  const q = (k: number) => hash(seed * 9.1 + k * 2.3 + 0.9), lean = 0.5 + q(1) * 0.9, nF = 7 + Math.floor(q(2) * 3), w = wind(t, seed * 0.3 + 1);
  const P = (u: number): V3 => [lean * u * u + w * 0.05 * u * u, h * u, 0], top = P(1);
  return <group position={position} rotation={[0, q(0) * TAU, 0]}>
    {Array.from({length: 7}, (_, i) => <Seg key={i} a={P(i / 7)} b={P((i + 1) / 7 + 0.01)} w={0.36 - i * 0.022} round m={FL(i % 2 ? '#8C7B63' : '#7F6F59')} />)}
    <group position={top} rotation={[0, 0, -Math.atan2(2 * lean, h) * 0.6 + w * 0.02]}>
      <Bl d={1} s={[0.26, 0.3, 0.26]} m={FL('#6F6A45')} />
      {Array.from({length: nF}, (_, i) => <Frond key={i} yaw={(i / nF) * TAU + q(i + 10) * 0.5} pitch={-0.5 + (i % 3) * 0.42 + wind(t * 1.2, seed + i * 1.7) * 0.07} roll={wind(t * 1.5, seed + i * 2.9) * 0.08} len={2.5 + q(i + 20) * 0.7} m={FL2(i % 2 ? '#4E7A3A' : '#44702F')} />)}
      {[0, 1, 2].map((i) => <Frond key={'u' + i} yaw={i * 2.1 + 0.4} pitch={-1.05 + wind(t * 1.3, seed + i * 4) * 0.05} roll={0} len={1.9} m={FL2('#5C8A40')} />)}
      {[0, 1, 2, 3].map((i) => <Bl key={'c' + i} d={1} p={[Math.cos(i * 1.7) * 0.2, -0.26 - (i % 2) * 0.1, Math.sin(i * 1.7) * 0.2]} s={0.13} m={FL(i % 2 ? '#7C8A44' : '#8A6A3E')} />)}
    </group>
  </group>;
};
const PETAL = ['#E3A2B6', '#EFD06C', '#F2EEE2', '#D98A6A'];
/** a low shrub (≈ 1.2 m wide, 0.8 m high); flowers = small coloured dots over the top */
export const Bush: FC<{position: V3; t: number; seed?: number; flowers?: boolean; scale?: number}> = ({position, t, seed = 0, flowers = false, scale = 1}) => {
  const h = (k: number) => hash(seed * 6.1 + k * 2.7 + 0.3), w = wind(t, seed * 0.3 + 2);
  const blobs = Array.from({length: 5}, (_, k) => { const a = (k / 4) * TAU + h(k) * 0.6, d = k === 0 ? 0 : 0.34; return {p: [Math.cos(a) * d, k === 0 ? 0.45 : 0.26 + h(k + 5) * 0.12, Math.sin(a) * d] as V3, r: k === 0 ? 0.42 : 0.3 + h(k + 9) * 0.1}; });
  return <group position={position} scale={scale} rotation={[0, h(40) * TAU, w * 0.03]}>
    {blobs.map((b, k) => <Bl key={k} p={[b.p[0] + wind(t * 1.7, seed + k * 4) * 0.012, b.p[1], b.p[2]]} s={[b.r, b.r * 0.85, b.r]} r={[h(k + 13) * 3, h(k + 17) * 3, 0]} m={FL(k % 2 ? '#4A7238' : '#3E6632')} />)}
    {flowers && Array.from({length: 22}, (_, i) => { const b = blobs[i % 5], a = h(i + 50) * TAU, e = 0.25 + h(i + 70) * 1.1, r = b.r * 0.98;
      return <Bl key={'f' + i} p={[b.p[0] + Math.cos(a) * Math.cos(e) * r, b.p[1] + Math.sin(e) * r * 0.85, b.p[2] + Math.sin(a) * Math.cos(e) * r]} s={0.03 + h(i + 90) * 0.015} m={FL(i % 5 === 0 ? PETAL[2] : PETAL[Math.floor(seed) % 4])} cast={false} />; })}
  </group>;
};
/** a potted areca palm (≈ 1 m): terracotta pot, 7 arching fronds that nod with the wind */
export const PotPlant: FC<{position: V3; t: number; seed?: number; scale?: number}> = ({position, t, seed = 0, scale = 1}) => <group position={position} scale={scale}>
  <Ms g={CYL(1, 0.72, 10)} p={[0, 0.14, 0]} s={[0.17, 0.28, 0.17]} m={FL('#B5674A')} />
  <Ms g={CYL(1, 1, 10)} p={[0, 0.275, 0]} s={[0.185, 0.04, 0.185]} m={FL('#A65B40')} />
  <Ms g={CYL(1, 1, 10)} p={[0, 0.29, 0]} s={[0.155, 0.02, 0.155]} m={FL('#3A2E24')} cast={false} />
  {Array.from({length: 7}, (_, i) => <Frond key={i} p={[0, 0.3, 0]} yaw={(i / 7) * TAU + hash(seed + i * 3.3) * 0.6} pitch={-1.25 + (i % 3) * 0.3 + wind(t * 1.2, seed + i * 1.9) * 0.04} roll={wind(t * 1.5, seed + i * 2.3) * 0.05} len={0.6 + hash(seed + i * 5.1) * 0.25} m={FL2(i % 2 ? '#4E7A3A' : '#44702F')} />)}
</group>;
const tuftGeo = () => G('tuft', () => { const pos: number[] = [], nor: number[] = [];   // 5 blades fanned out, unit height; both windings with normals up, so every blade lights the same from either side
  for (let b = 0; b < 5; b++) { const a = b * 1.31, c = Math.cos(a), s = Math.sin(a), A = [c * 0.03 - s * 0.012, 0, s * 0.03 + c * 0.012], B = [c * 0.03 + s * 0.012, 0, s * 0.03 - c * 0.012], T = [c * (0.07 + b * 0.015), 1 - b * 0.13, s * (0.07 + b * 0.015)];
    pos.push(...A, ...B, ...T, ...B, ...A, ...T); for (let k = 0; k < 6; k++) nor.push(0, 1, 0); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g; });
/** instanced grass tufts over a w × d patch; they lean along +x as gusts travel across */
export const GrassTufts: FC<{center: V3; size: [number, number]; n?: number; t: number; seed?: number; height?: number}> = ({center, size, n = 200, t, seed = 0, height = 0.16}) => {
  const m = G('tuftM', () => new THREE.MeshLambertMaterial());
  const o = useInst(tuftGeo(), m, n);
  useMemo(() => { for (let i = 0; i < n; i++) o.setColorAt(i, COL.set(['#6C8A40', '#7A9A4A', '#5E7C36', '#86A050'][Math.floor(hash(i * 3.1 + seed + 0.2) * 4)])); }, [o, n, seed]);
  for (let i = 0; i < n; i++) { const h = (k: number) => hash(i * 2.39 + seed * 7.3 + k + 0.4), x = (h(1) - 0.5) * size[0], z = (h(2) - 0.5) * size[1], s = 0.8 + h(3) * 0.9;
    put(o, i, center[0] + x, center[1], center[2] + z, 0, h(4) * TAU, -0.1 - wind(t - x * 0.25, seed * 0.3) * 0.2 * (0.6 + h(5) * 0.6), s, height * (0.6 + h(6) * 0.9), s, 'ZYX'); }
  o.instanceMatrix.needsUpdate = true;
  return <primitive object={o} />;
};
/** leaves drifting down through a box (size = [w, h, d], centre = box centre), fluttering; each shrinks in/out at the ends of its fall, so the loop never pops */
export const FallingLeaves: FC<{center: V3; size: V3; t: number; n?: number; seed?: number; color?: string; leaf?: number}> = ({center, size, t, n = 14, seed = 0, color, leaf = 0.085}) => {
  const m = G('leafM', () => new THREE.MeshLambertMaterial({side: THREE.DoubleSide, flatShading: true}));
  const o = useInst(tri('leaf', [0, 0, -0.5, 0.3, 0.06, 0, 0, 0, 0.5, -0.3, 0.06, 0], [0, 1, 2, 0, 2, 3]), m, n);
  useMemo(() => { for (let i = 0; i < n; i++) o.setColorAt(i, COL.set(color ?? ['#B8A04A', '#A87A3A', '#7A8C3A', '#C28A3E'][i % 4])); }, [o, n, color]);
  for (let i = 0; i < n; i++) { const h = (k: number) => hash(i * 4.17 + seed * 5.9 + k + 0.6), T = size[1] / (0.55 + h(1) * 0.4), u = fr(t / T + h(2)), ph = h(3) * TAU;
    const s = leaf * (0.8 + h(4) * 0.5) * sm(u / 0.08) * sm((1 - u) / 0.08);
    put(o, i, center[0] + (h(5) - 0.5) * size[0] + Math.sin(t * 1.6 + ph) * 0.22 + u * 0.4, center[1] + size[1] * (0.5 - u) + Math.cos(t * 3.2 + ph * 2) * 0.03, center[2] + (h(6) - 0.5) * size[2] + Math.cos(t * 1.1 + ph) * 0.15,
      Math.sin(t * 3.2 + ph * 2) * 0.9, t * (0.8 + h(7)) + ph, Math.cos(t * 1.6 + ph) * 0.7, s); }
  o.instanceMatrix.needsUpdate = true;
  return <primitive object={o} />;
};

// =====================================================================================================
// Animals
// =====================================================================================================
type BirdCol = {body: string; wing: string; head: string; beak: string; leg?: string};
const wingGeo = () => tri('wing', [0, 0, 0.5, 0, 0, -0.5, 1, 0, -0.25, 0.55, 0, 0.32], [0, 1, 2, 0, 2, 3]);
/** one small bird, L = body length, origin at its feet. flap given = flying (wings spread at that angle, legs tucked); otherwise perched/walking. */
const BirdM: FC<{L: number; c: BirdCol; peck?: number; look?: number; flap?: number; step?: number}> = ({L, c, peck = 0, look = 0, flap, step = 0}) => {
  const fly = flap !== undefined;
  return <group scale={L}>
    <group position={[0, 0.36, 0]} rotation={[fly ? 0.05 : -0.3 + peck * 0.75, 0, 0]}>
      <Bl d={1} s={[0.19, 0.19, 0.36]} m={FL(c.body)} />
      <Bx p={[0, 0, -0.42]} s={[fly ? 0.28 : 0.15, 0.03, 0.3]} r={[fly ? 0 : -0.15, 0, 0]} m={FL(c.wing)} />
      {fly ? [-1, 1].map((s) => <group key={s} position={[s * 0.1, 0.06, 0.04]} rotation={[0, 0, s * (flap as number)]}><mesh geometry={wingGeo()} scale={[s, 1, 0.55]} material={FL2(c.wing)} castShadow /></group>)
        : [-1, 1].map((s) => <Bl key={s} d={1} p={[s * 0.15, 0.03, -0.06]} s={[0.07, 0.14, 0.3]} m={FL(c.wing)} />)}
      <group position={[0, 0.1, 0.26 + Math.sin(step) * 0.035]} rotation={[fly ? 0.1 : 0.3 + peck * 0.5, look, 0]}>
        <Bl d={1} p={[0, 0.14, 0.06]} s={0.135} m={FL(c.head)} />
        <Ms g={CYL(0, 1, 4)} p={[0, 0.12, 0.23]} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.13, 0.04]} m={FL(c.beak)} cast={false} />
        {[-1, 1].map((s) => <Bx key={s} p={[s * 0.105, 0.17, 0.11]} s={0.04} m={FL('#141414')} cast={false} />)}
      </group>
    </group>
    {!fly && [-1, 1].map((s) => <group key={s} position={[s * 0.07, 0.2, 0]} rotation={[Math.sin(step + (s > 0 ? Math.PI : 0)) * 0.55, 0, 0]}><Bx p={[0, -0.1, 0]} s={[0.025, 0.2, 0.025]} m={FL(c.leg ?? '#B98A5A')} cast={false} /></group>)}
  </group>;
};
const DARK_BIRD: BirdCol = {body: '#2F3338', wing: '#3B4046', head: '#2A2D31', beak: '#3A3A3A'};
/** a small flock circling `center` at height y: tangent heading, banking into the turn, flap-and-glide. size = body length (wingspan ≈ 2.2×). */
export const Birds: FC<{t: number; center: V3; radius?: number; y?: number; n?: number; seed?: number; size?: number; speed?: number; color?: string}> = ({t, center, radius = 14, y = 12, n = 7, seed = 0, size = 0.36, speed = 7, color}) => {
  const c = color ? {body: color, wing: mixC(color, '#FFFFFF', 0.12), head: color, beak: '#3A3A3A'} : DARK_BIRD, dir = hash(seed + 0.3) < 0.5 ? 1 : -1;
  return <group position={center}>{Array.from({length: n}, (_, i) => { const h = (k: number) => hash(i * 6.13 + seed * 3.7 + k + 0.2), R = radius * (0.75 + h(1) * 0.4);
    const th = dir * (t * speed / radius) + h(2) * 1.2 + seed, fl = Math.sin(t * TAU * 3.4 + h(3) * TAU), env = 0.2 + 0.8 * sm(0.5 + Math.sin(t * 1.1 + i * 1.9) * 1.2);
    const vx = -Math.sin(th) * dir, vz = Math.cos(th) * 0.75 * dir;
    return <group key={i} position={[Math.cos(th) * R, y + (h(4) - 0.5) * 4 + Math.sin(t * 0.7 + i) * 0.5 - fl * env * 0.04, Math.sin(th) * R * 0.75]} rotation={[0.03, Math.atan2(vx, vz), dir * (0.38 + Math.sin(t * 0.9 + i) * 0.08), 'YXZ']}>
      <group position={[0, -0.36 * size, 0]}><BirdM L={size * (0.85 + h(5) * 0.3)} c={c} flap={0.12 + fl * 0.8 * env} /></group></group>; })}</group>;
};
const PERCH: BirdCol[] = [{body: '#3A3532', wing: '#2B2826', head: '#1F1D1C', beak: '#E0B040', leg: '#D8B050'}, {body: '#9A8468', wing: '#6E5B45', head: '#7A5A40', beak: '#4A4038'}, {body: '#8E949C', wing: '#737A84', head: '#5E6670', beak: '#3A3A3A'}];
/** birds perched along a→b (a wire with `sag`, or a roof edge): heads flick about, a sideways hop now and then, one flutters up and lands again every ~6 s */
export const WireBirds: FC<{a: V3; b: V3; n?: number; t: number; seed?: number; sag?: number; size?: number}> = ({a, b, n = 4, t, seed = 0, sag = 0, size = 0.2}) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
  const tf = t + seed * 1.3 + 2.2, cF = Math.floor(tf / 6), uF = (tf - cF * 6) / 1.5, who = Math.floor(hash(cF * 3.7 + seed + 0.1) * n);
  return <group>{Array.from({length: n}, (_, i) => { const h = (k: number) => hash(i * 5.71 + seed * 2.9 + k + 0.8);
    const Th = 4 + h(1) * 3, qh = t / Th + h(2), ch = Math.floor(qh), eh = (qh - ch) * Th, hopK = sm(eh / 0.25), off = (c: number) => (hash(c * 2.3 + i * 7.9 + seed) - 0.5) * 0.24;
    const ql = t / (0.9 + h(3) * 0.7) + h(4), cLook = Math.floor(ql), lk = (c: number) => (hash(c * 1.9 + i * 3.3 + seed) - 0.5) * 2.2;
    const fly = i === who && uF < 1, u = 0.1 + 0.8 * (i + 0.5 + (h(5) - 0.5) * 0.5) / n + (lerp(off(ch - 1), off(ch), hopK) + (fly ? Math.sin(uF * TAU) * 0.12 : 0)) / L;
    const p = mix3(a, b, u);
    return <group key={i} position={[p[0], p[1] + sagY(u, sag) + Math.sin(hopK * Math.PI) * 0.05 + (fly ? Math.pow(Math.sin(uF * Math.PI), 0.8) * 0.5 : 0), p[2]]} rotation={[0, yaw + (h(6) < 0.5 ? 1 : -1) * Math.PI / 2, 0]}>
      <BirdM L={size * (0.85 + h(7) * 0.3)} c={PERCH[Math.floor(h(8) * 3)]} look={lerp(lk(cLook - 1), lk(cLook), sm(fr(ql) / 0.12))} flap={fly ? Math.sin(t * TAU * 9 + i) * 1.0 + 0.15 : undefined} /></group>; })}</group>;
};
/** a ground bird's routine around its home spot: stand (peck / look), then a short walk to a new spot. It only travels while its legs move. */
const wander = (i: number, seed: number, t: number, r: number, cyc: number, reach: number) => {
  const h = (k: number) => hash(i * 7.31 + seed * 3.17 + k + 0.5), ha = h(1) * TAU + i * 2.4, hr = Math.sqrt(0.15 + 0.85 * h(2)) * r * 0.85, wf = 0.4;
  const T = cyc * (0.8 + h(3) * 0.4), q = t / T + h(4), c = Math.floor(q), u = q - c;
  const pt = (k: number): [number, number] => { const a = hash(k * 1.37 + i * 9.1 + seed * 2.3) * TAU, d = (0.3 + 0.7 * hash(k * 2.11 + i * 5.3 + seed)) * reach; return [Math.cos(ha) * hr + Math.cos(a) * d, Math.sin(ha) * hr + Math.sin(a) * d]; };
  const O = pt(c - 2), A = pt(c - 1), B = pt(c), k = sm(u / wf);
  return {x: lerp(A[0], B[0], k), z: lerp(A[1], B[1], k), yaw: angLerp(Math.atan2(A[0] - O[0], A[1] - O[1]), Math.atan2(B[0] - A[0], B[1] - A[1]), sm(u / (wf * 0.4))),
    dist: Math.hypot(B[0] - A[0], B[1] - A[1]) * k, rest: u < wf ? -1 : (u - wf) / (1 - wf), mood: hash(c * 4.3 + i * 1.7 + seed)};
};
const pecks = (v: number, n: number) => (v > 0.08 && v < 0.92 ? Math.pow(Math.max(0, Math.sin(((v - 0.08) / 0.84) * Math.PI * n)), 1.5) * (Math.floor(((v - 0.08) / 0.84) * n) % 2 === 0 ? 1 : 0) : 0);
const PIGEON: BirdCol[] = [{body: '#8E949C', wing: '#737A84', head: '#5A626C', beak: '#3A3A3A', leg: '#C4605A'}, {body: '#7F858D', wing: '#5E646C', head: '#4E5A5A', beak: '#3A3A3A', leg: '#C4605A'}, {body: '#B9B4AA', wing: '#8E8778', head: '#8E8778', beak: '#4A4038', leg: '#C4605A'}];
/** pigeons walking and pecking within r of center (head bobs with each step). scareAt (seconds): they all burst up and away, fast flapping, gone in about a second. */
export const Pigeons: FC<{center: V3; r?: number; n?: number; t: number; seed?: number; scareAt?: number; size?: number}> = ({center, r = 1.5, n = 6, t, seed = 0, scareAt, size = 0.3}) =>
  <group position={center}>{Array.from({length: n}, (_, i) => { const h = (k: number) => hash(i * 3.91 + seed * 8.3 + k + 0.3), c = PIGEON[i % 3], L = size * (0.9 + h(1) * 0.2);
    const t0 = scareAt === undefined ? Infinity : scareAt + h(2) * 0.18, w = wander(i, seed, Math.min(t, t0), r, 3.2, r * 0.3), u = t - t0;
    if (u > 4) return null;
    if (u > 0) { const a = Math.atan2(w.z, w.x) + (h(3) - 0.5) * 1.4, d = 7 * Math.pow(u, 1.5) + 1.2 * u, y = 6 * Math.pow(u, 1.4) + 0.3 * sm(u * 8);
      return <group key={i} position={[w.x + Math.cos(a) * d, y, w.z + Math.sin(a) * d]} rotation={[-0.6 + 0.35 * sm(u * 2), angLerp(w.yaw, Math.atan2(Math.cos(a), Math.sin(a)), sm(u * 6)), (h(4) - 0.5) * 0.5, 'YXZ']}>
        <BirdM L={L} c={c} flap={Math.sin(u * TAU * 10 + i) * 1.15 + 0.1} /></group>; }
    return <group key={i} position={[w.x, 0, w.z]} rotation={[0, w.yaw, 0]}>
      <BirdM L={L} c={c} step={(w.dist / (L * 0.28)) * Math.PI} peck={w.rest >= 0 && w.mood > 0.3 ? pecks(w.rest, 4) : 0} look={w.rest >= 0 && w.mood <= 0.3 ? Math.sin(w.rest * 9 + i) * 0.7 : 0} /></group>; })}</group>;
const HEN = [{body: '#A8683A', dark: '#7A4526'}, {body: '#E6DFD0', dark: '#BDB4A2'}, {body: '#3A3330', dark: '#26211F'}];
/** hens (≈ 0.45 m) scratching and pecking around center, with short walks */
export const Chickens: FC<{center: V3; r?: number; n?: number; t: number; seed?: number}> = ({center, r = 2, n = 3, t, seed = 0}) =>
  <group position={center}>{Array.from({length: n}, (_, i) => { const w = wander(i, seed + 3, t, r, 4.2, r * 0.3), c = HEN[(i + Math.floor(seed)) % 3], body = FL(c.body), dark = FL(c.dark), red = FL('#C23A30'), yel = FL('#D9A93C');
    const resting = w.rest >= 0, scratch = resting && w.mood < 0.35, pk = resting && !scratch ? pecks(w.rest, 6) : 0, step = (w.dist / 0.09) * Math.PI;
    const kick = scratch ? Math.max(0, Math.sin(w.rest * Math.PI * 10)) * (w.rest < 0.6 ? 1 : 0) : 0, look = scratch && w.rest >= 0.6 ? 1 : 0;
    return <group key={i} position={[w.x, 0, w.z]} rotation={[0, w.yaw, 0]} scale={0.95 + hash(i + seed) * 0.15}>
      {[-1, 1].map((s) => <group key={s} position={[s * 0.05, 0.15, 0]} rotation={[Math.sin(step + (s > 0 ? Math.PI : 0)) * 0.5 + (s > 0 ? kick * 0.9 : 0), 0, 0]}>
        <Bx p={[0, -0.075, 0]} s={[0.018, 0.15, 0.018]} m={yel} cast={false} /><Bx p={[0, -0.143, 0.025]} s={[0.05, 0.012, 0.075]} m={yel} cast={false} /></group>)}
      <group position={[0, 0.15, 0]} rotation={[pk * 0.5 + kick * 0.12 + look * 0.1, 0, 0]}>
        <Bl d={1} p={[0, 0.1, -0.01]} s={[0.105, 0.11, 0.16]} m={body} />
        <Bx p={[0, 0.2, -0.15]} s={[0.05, 0.12, 0.09]} r={[0.6, 0, 0]} m={dark} />
        {[-1, 1].map((s) => <Bl key={s} d={1} p={[s * 0.09, 0.11, -0.03]} s={[0.035, 0.07, 0.12]} m={dark} />)}
        <group position={[0, 0.14, 0.1]} rotation={[0.1 + pk * 1.25 - look * 0.25, look * Math.sin(t * 2.2 + i) * 0.6, 0]}>
          <Bl d={1} p={[0, 0.06, 0.02]} s={[0.045, 0.09, 0.05]} m={body} />
          <Bl d={1} p={[0, 0.15, 0.04]} s={0.048} m={body} />
          <Bx p={[0, 0.205, 0.035]} s={[0.014, 0.035, 0.065]} m={red} cast={false} />
          <Ms g={CYL(0, 1, 4)} p={[0, 0.145, 0.105]} r={[Math.PI / 2, 0, 0]} s={[0.016, 0.05, 0.016]} m={yel} cast={false} />
          <Bx p={[0, 0.105, 0.075]} s={[0.014, 0.03, 0.02]} m={red} cast={false} />
          {[-1, 1].map((s) => <Bx key={s} p={[s * 0.04, 0.16, 0.06]} s={0.012} m={FL('#141414')} cast={false} />)}
        </group>
      </group>
    </group>; })}</group>;
const flutter = (t: number, i: number, seed: number, size: V3): V3 => { const h = (k: number) => hash(i * 8.3 + seed * 4.1 + k + 0.1) * TAU;
  return [size[0] * 0.5 * (Math.sin(t * 0.83 + h(1)) * 0.6 + Math.sin(t * 1.9 + h(2)) * 0.4), size[1] * 0.5 * (Math.sin(t * 1.27 + h(3)) * 0.6 + Math.sin(t * 2.9 + h(4)) * 0.4), size[2] * 0.5 * (Math.sin(t * 0.71 + h(5)) * 0.6 + Math.sin(t * 2.3 + h(6)) * 0.4)]; };
const BFLY = ['#F2D36B', '#F4F0E6', '#E89A4A', '#9CC4E8'];
/** butterflies wandering through a box (size = [w, h, d] around center); wing = wing length in metres */
export const Butterflies: FC<{center: V3; size: V3; n?: number; t: number; seed?: number; wing?: number}> = ({center, size, n = 4, t, seed = 0, wing = 0.09}) =>
  <group position={center}>{Array.from({length: n}, (_, i) => { const p = flutter(t, i, seed, size), q = flutter(t + 0.06, i, seed, size), f = Math.abs(Math.sin(t * TAU * 4.5 + i * 1.3)), m = FL2(BFLY[(i + Math.floor(seed)) % 4]);
    return <group key={i} position={[p[0], p[1] + f * 0.03, p[2]]} rotation={[0, Math.atan2(q[0] - p[0], q[2] - p[2]), 0]} scale={wing}>
      <Bx s={[0.12, 0.12, 0.9]} m={FL('#2A2622')} cast={false} />
      {[-1, 1].map((s) => <group key={s} rotation={[0, 0, s * (0.15 + f * 1.15)]}><mesh geometry={tri('bfly', [0, 0, 0.45, 1, 0, 0.75, 0.95, 0, -0.05, 0.6, 0, -0.65, 0, 0, -0.4], [0, 1, 2, 0, 2, 4, 4, 2, 3])} scale={[s, 1, 1]} material={m} castShadow /></group>)}
    </group>; })}</group>;
/** moths darting round a lamp at `center` within radius r: pale flecks that flicker as they turn */
export const Moths: FC<{center: V3; r?: number; n?: number; t: number; seed?: number; size?: number}> = ({center, r = 0.35, n = 6, t, seed = 0, size = 0.03}) =>
  <group position={center}>{Array.from({length: n}, (_, i) => { const h = (k: number) => hash(i * 5.9 + seed * 6.7 + k + 0.4), a = t * (3.1 + h(1) * 2.7) * (h(2) < 0.5 ? 1 : -1) + h(3) * TAU, rr = r * (0.6 + 0.4 * Math.sin(t * (1.7 + h(4)) + h(5) * TAU));
    return <mesh key={i} geometry={ICO(0)} position={[Math.sin(a) * rr, r * 0.6 * Math.sin(t * (4.3 + h(6) * 2) + h(7) * TAU), Math.cos(a) * rr]} rotation={[t * 9 + i, t * 7, 0]} scale={[size * (0.4 + Math.abs(Math.sin(t * 40 + i * 2.1))), size * 0.35, size * 0.6]} material={MB('#EFE6C8', 'moth')} />; })}</group>;
/** a house gecko on a wall (points a, b on the wall, its outward normal given): still, then a short scuttle toward the other end; tail wiggles. size = length. */
export const Gecko: FC<{a: V3; b: V3; t: number; normal: V3; seed?: number; size?: number; color?: string}> = ({a, b, t, normal, seed = 0, size = 0.12, color = '#BF9C76'}) => {
  const N = 4, P = 2.3 + hash(seed + 0.6) * 0.6, q = t / P + hash(seed * 3.1 + 0.2), c = Math.floor(q), e = Math.max(0, (q - c) * P - hash(c * 2.7 + seed) * 0.9), k = sm(e / 0.4), run = e < 0.4 && e > 0 ? 1 : 0;
  const mm = ((c % (2 * N)) + 2 * N) % (2 * N), fwd = mm < N, s0 = fwd ? mm / N : (2 * N - mm) / N, s = s0 + (fwd ? 1 : -1) * k / N, turn = (mm === 0 || mm === N) ? Math.PI * (1 - sm(e / 0.18)) : 0;
  const Z = v3(b).sub(v3(a)).normalize().multiplyScalar(fwd ? 1 : -1), Y = v3(normal).normalize(), X = new THREE.Vector3().crossVectors(Y, Z).normalize(); Z.crossVectors(X, Y);
  const m = FL(color), wig = Math.sin(e * 55) * run, tail = wig * 0.5 + Math.sin(t * 2.3 + seed) * 0.12 * (1 - run);
  return <group position={mix3(a, b, 0.1 + 0.8 * s)} quaternion={new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z))}><group rotation={[0, turn + wig * 0.12, 0]} scale={size / 0.12}>
    <Bl d={1} p={[0, 0.007, 0]} s={[0.012, 0.007, 0.028]} m={m} />
    <Bl d={1} p={[0, 0.007, 0.036]} s={[0.011, 0.0065, 0.014]} m={m} />
    {[-1, 1].map((sd) => <Bx key={sd} p={[sd * 0.008, 0.012, 0.04]} s={0.004} m={FL('#141414')} cast={false} />)}
    <group position={[0, 0.005, -0.026]} rotation={[0, tail, 0]}><Bx p={[0, 0, -0.012]} s={[0.009, 0.007, 0.026]} m={m} />
      <group position={[0, 0, -0.025]} rotation={[0, tail * 1.3, 0]}><Bx p={[0, 0, -0.011]} s={[0.006, 0.005, 0.024]} m={m} />
        <group position={[0, 0, -0.023]} rotation={[0, tail * 1.3, 0]}><Bx p={[0, 0, -0.009]} s={[0.003, 0.003, 0.02]} m={m} /></group></group></group>
    {[-1, 1].map((sd) => [-1, 1].map((f) => <group key={sd + ':' + f} position={[sd * 0.009, 0.004, f * 0.016]} rotation={[0, sd * (f * -0.6 + wig * sd * f * 0.5), 0]}>
      <Bx p={[sd * 0.011, 0, 0]} s={[0.022, 0.004, 0.005]} m={m} cast={false} /><Bx p={[sd * 0.023, 0, 0.002]} s={[0.008, 0.003, 0.01]} m={m} cast={false} /></group>))}
  </group></group>;
};
/** the street dog (pov/fx/animals Dog) trotting round a closed path: heading follows the path, gait phase = distance / stride (no foot slide), stops to sniff at some corners */
export const StrayDog: FC<{path: V3[]; t: number; speed?: number; seed?: number; coat?: string}> = ({path, t, speed = 1.3, seed = 0, coat}) => {
  const n = path.length, at = (k: number) => path[((k % n) + n) % n];
  const len = path.map((p, k) => Math.hypot(at(k + 1)[0] - p[0], at(k + 1)[2] - p[2])), yw = path.map((p, k) => Math.atan2(at(k + 1)[0] - p[0], at(k + 1)[2] - p[2]));
  const pause: number[] = path.map((_, k) => (hash(k * 3.3 + seed * 5.1 + 0.7) < 0.4 ? 1.8 : 0)); if (!pause.some(Boolean)) pause[n > 1 ? 1 : 0] = 1.8;
  const Lt = len.reduce((x, y) => x + y, 0), Pt = pause.reduce((x, y) => x + y, 0), T = Lt / speed + Pt, laps = Math.floor(t / T);
  let tau = t - laps * T, dist = laps * Lt, idle = laps * Pt, pos = path[0], yaw = 0, trot = 1, sniff = 0;
  for (let k = 0; k < n; k++) { const mid = angLerp(yw[(k - 1 + n) % n], yw[k], 0.5);
    if (tau < pause[k]) { pos = path[k]; yaw = mid; trot = Math.max(0, 1 - tau / 0.15, 1 - (pause[k] - tau) / 0.15); sniff = sm(tau / 0.3) * sm((pause[k] - tau) / 0.3); idle += tau; break; }
    tau -= pause[k]; idle += pause[k]; const dur = len[k] / speed;
    if (tau < dur || k === n - 1) { const d = Math.min(len[k], tau * speed), R = Math.min(0.6, len[k] / 2); pos = mix3(path[k], at(k + 1), d / len[k]); dist += d;
      yaw = d < R ? angLerp(yw[(k - 1 + n) % n], yw[k], 0.5 + 0.5 * d / R) : d > len[k] - R ? angLerp(yw[k], yw[(k + 1) % n], 0.5 * (d - (len[k] - R)) / R) : yw[k]; break; }
    tau -= dur; dist += len[k]; }
  return <group position={pos} rotation={[0, yaw + sniff * Math.sin(idle * 2.1) * 0.12, 0]}><group rotation={[sniff * 0.07, 0, 0]}><Dog phase={dist / 0.8 + idle * 0.45} trot={trot} coat={coat} /></group></group>;
};
/** a dog asleep, curled on its side (belly and legs toward +x, head at +z turned back over the paws): breathing, an ear or the tail twitches now and then */
export const SleepingDog: FC<{position: V3; yaw?: number; t: number; coat?: string}> = ({position, yaw = 0, t, coat = '#C2955E'}) => {
  const c = SM(coat), belly = SM('#E3C79E'), dark = SM('#3A2A1E', 0.6), br = Math.sin(t * 1.7) * 0.5 + 0.5;
  const tw = (T: number, d: number, o: number) => { const u = (t + o) % T; return u < d ? Math.sin((u / d) * Math.PI * 3) * (1 - u / d) : 0; }, ear = tw(3.7, 0.4, 0.5), tail = tw(5.3, 0.6, 1.9);
  return <group position={position} rotation={[0, yaw, 0]}>
    <Sp p={[0, 0.115, -0.23]} s={[0.15, 0.115, 0.15]} m={c} />
    <Sp p={[-0.015, 0.11, -0.05]} s={[0.135, 0.11, 0.2]} m={c} />
    <Sp p={[-0.01, 0.125 + br * 0.006, 0.13]} s={[0.15 + br * 0.006, 0.125 + br * 0.014, 0.2]} m={c} />
    <Sp p={[0.07, 0.085, 0.04]} s={[0.09, 0.075, 0.22]} m={belly} cast={false} />
    <Cap a={[0, 0.13, 0.27]} b={[0.13, 0.1, 0.39]} r0={0.09} r1={0.075} m={c} />
    <group position={[0.22, 0.09, 0.41]} rotation={[0, 2.0, 0.3]} scale={1.35}>
      <Sp s={[0.075, 0.07, 0.085]} m={c} />
      <Cap a={[0, -0.02, 0.04]} b={[0, -0.03, 0.13]} r0={0.05} r1={0.04} m={c} />
      <Sp p={[0, -0.04, 0.12]} s={[0.04, 0.025, 0.035]} m={belly} cast={false} />
      <Sp p={[0, -0.022, 0.168]} s={[0.024, 0.018, 0.016]} m={SM('#151213', 0.35)} cast={false} />
      {[-1, 1].map((sd) => <group key={sd}>
        <mesh position={[sd * 0.05, 0.06, -0.02]} rotation={[-0.5 + (sd < 0 ? ear * 0.5 : 0), 0, -sd * 0.7]} material={c} castShadow><coneGeometry args={[0.04, 0.09, 5]} /></mesh>
        <Bx p={[sd * 0.042, 0.02, 0.066]} s={[0.022, 0.005, 0.008]} r={[0, sd * 0.5, 0]} m={dark} cast={false} /></group>)}
    </group>
    {([[[0.05, 0.1, 0.2], [0.24, 0.045, 0.27], [0.4, 0.03, 0.22]], [[0.06, 0.06, 0.15], [0.26, 0.04, 0.16], [0.42, 0.03, 0.11]]] as V3[][]).map((L, i) => <group key={'f' + i}>
      <Cap a={L[0]} b={L[1]} r0={0.05} r1={0.034} m={c} /><Cap a={L[1]} b={L[2]} r0={0.033} r1={0.028} m={c} /><Sp p={[L[2][0] + 0.02, 0.026, L[2][2]]} s={[0.045, 0.024, 0.036]} m={dark} /></group>)}
    {([[[0.05, 0.11, -0.24], [0.22, 0.06, -0.12], [0.3, 0.04, -0.3]], [[0.06, 0.06, -0.27], [0.2, 0.045, -0.2], [0.27, 0.03, -0.37]]] as V3[][]).map((L, i) => <group key={'h' + i}>
      <Cap a={L[0]} b={L[1]} r0={0.065} r1={0.04} m={c} /><Cap a={L[1]} b={L[2]} r0={0.038} r1={0.03} m={c} /><Sp p={[L[2][0] + 0.02, 0.026, L[2][2]]} s={[0.045, 0.024, 0.036]} m={dark} /></group>)}
    <group position={[-0.02, 0.07, -0.35]} rotation={[0, tail * 0.3, 0]}>
      <Cap a={[0, 0, 0]} b={[0.1, 0, -0.07]} r0={0.026} r1={0.022} m={c} /><Cap a={[0.1, 0, -0.07]} b={[0.22, 0, -0.05]} r0={0.022} r1={0.018} m={c} /><Cap a={[0.22, 0, -0.05]} b={[0.3, 0.005, 0.03]} r0={0.018} r1={0.012} m={belly} /></group>
  </group>;
};
/** the wall cat (pov/fx/animals Cat), real size (≈ 0.33 m sitting). look = head yaw. */
export const SittingCat: FC<{position: V3; yaw?: number; t: number; look?: number}> = ({position, yaw = 0, t, look = 0}) => <group position={position} rotation={[0, yaw, 0]}><Cat t={t} look={look} /></group>;

// =====================================================================================================
// Vehicles (front = +z)
// =====================================================================================================
const extrude = (key: string, pts: [number, number][], w: number) => G(key, () => { const s = new THREE.Shape(); pts.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y))); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: w, bevelEnabled: false}); g.translate(0, 0, -w / 2); g.rotateY(-Math.PI / 2); return g; });
const Wheel: FC<{p: V3; r: number; w: number; roll: number}> = ({p, r, w, roll}) => <group position={p} rotation={[roll, 0, 0]}>
  <mesh geometry={CYL(1, 1, 14)} rotation={[0, 0, Math.PI / 2]} scale={[r, w, r]} material={M('#1B1C1E', 0.9)} castShadow />
  <mesh geometry={CYL(1, 1, 10)} rotation={[0, 0, Math.PI / 2]} scale={[r * 0.58, w * 1.05, r * 0.58]} material={M('#A9ADB2', 0.45, 0.15)} />
  <Bx s={[w * 1.08, r * 0.95, r * 0.17]} m={M('#55595E', 0.5, 0.4)} cast={false} />
</group>;
const Lamps: FC<{front: V3[]; rear: V3[]; s: V3; rs?: V3; lights: number; beam?: number}> = ({front, rear, s, rs = s, lights, beam = 1}) => { const on = lights > 0.05; return <>
  {front.map((p, i) => <group key={'f' + i}><Bx p={p} s={s} m={on ? MB('#FFF4D2') : M('#E9E6D8', 0.3, 0.2)} cast={false} />{on && <Glow p={[p[0], p[1], p[2] + 0.08]} s={0.9 * lights} color="#FFF0C8" o={0.9} />}</group>)}
  {rear.map((p, i) => <group key={'r' + i}><Bx p={p} s={rs} m={on ? MB('#FF3B2E') : M('#8E2A24', 0.4)} cast={false} />{on && <Glow p={[p[0], p[1], p[2] - 0.08]} s={0.45 * lights} color="#FF4A3A" o={0.7} />}</group>)}
  {on && <Pool p={[0, 0.04, front[0][2] + 3.4]} s={[4.4 * beam, 7.5]} color="#FFE9B8" o={0.3 * lights} />}
</>; };
type VehP = {position: V3; yaw?: number; t?: number; color?: string; /** wheel angle, radians */ roll?: number; /** 0…1 head and tail lights */ lights?: number};
const GLASS = () => M('#26323A', 0.15, 0.3, {}, 'lkglass'), TRIM = () => M('#2A2D30', 0.7);
/** a small hatchback: 4.3 m long, 1.7 m wide, 1.45 m high */
export const Car: FC<VehP> = ({position, yaw = 0, color = '#C9CDD2', roll = 0, lights = 0}) => { const body = M(color, 0.45, 0.25, {}, 'lkcar'), dark = TRIM();
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh geometry={extrude('carL', [[2.14, 0.24], [2.14, 0.6], [2.0, 0.78], [0.95, 0.9], [-1.5, 0.9], [-2.1, 0.84], [-2.14, 0.3], [-2.05, 0.24]], 1.7)} material={body} castShadow receiveShadow />
    <mesh geometry={extrude('carG', [[0.98, 0.88], [0.32, 1.4], [-1.0, 1.42], [-1.72, 0.88]], 1.52)} material={GLASS()} castShadow />
    <Bx p={[0, 1.425, -0.33]} s={[1.56, 0.06, 1.42]} m={body} />
    {[-1, 1].map((s) => <group key={s}>
      <Seg a={[s * 0.765, 0.9, 0.97]} b={[s * 0.765, 1.41, 0.33]} w={[0.03, 0.07]} m={body} /><Bx p={[s * 0.765, 1.15, -0.3]} s={[0.03, 0.52, 0.09]} m={body} /><Seg a={[s * 0.765, 0.9, -1.7]} b={[s * 0.765, 1.41, -1.0]} w={[0.03, 0.11]} m={body} />
      <Bx p={[s * 0.91, 0.98, 0.85]} s={[0.14, 0.09, 0.07]} m={dark} /><Bx p={[s * 0.853, 0.6, -0.3]} s={[0.006, 0.52, 0.015]} m={dark} cast={false} />
      <Wheel p={[s * 0.8, 0.31, 1.3]} r={0.31} w={0.2} roll={roll} /><Wheel p={[s * 0.8, 0.31, -1.25]} r={0.31} w={0.2} roll={roll} /></group>)}
    <Bx p={[0, 0.34, 2.11]} s={[1.72, 0.2, 0.1]} m={dark} /><Bx p={[0, 0.36, -2.11]} s={[1.72, 0.2, 0.1]} m={dark} /><Bx p={[0, 0.6, 2.135]} s={[0.8, 0.1, 0.03]} m={dark} cast={false} />
    <Bx p={[0, 0.5, -2.15]} s={[0.4, 0.13, 0.02]} m={M('#F1EEE4', 0.6)} cast={false} />
    <Lamps front={[[-0.6, 0.66, 2.12], [0.6, 0.66, 2.12]]} rear={[[-0.62, 0.72, -2.11], [0.62, 0.72, -2.11]]} s={[0.34, 0.11, 0.07]} lights={lights} />
  </group>; };
/** a Thai pickup: 5.2 m long, 1.8 m wide, 1.75 m high, open bed (cargo = crates and a barrel in it) */
export const Pickup: FC<VehP & {cargo?: boolean}> = ({position, yaw = 0, color = '#B9BCC0', roll = 0, lights = 0, cargo = true}) => { const body = M(color, 0.45, 0.25, {}, 'lkcar'), dark = TRIM();
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh geometry={extrude('pkL', [[2.6, 0.36], [2.6, 0.84], [2.42, 1.0], [1.2, 1.08], [-0.4, 1.08], [-0.4, 0.62], [-2.6, 0.62], [-2.6, 0.36]], 1.8)} material={body} castShadow receiveShadow />
    <mesh geometry={extrude('pkG', [[1.22, 1.06], [0.72, 1.7], [-0.25, 1.72], [-0.4, 1.06]], 1.62)} material={GLASS()} castShadow />
    <Bx p={[0, 1.73, 0.23]} s={[1.66, 0.06, 1.02]} m={body} /><Bx p={[0, 0.85, -2.57]} s={[1.8, 0.46, 0.06]} m={body} />
    {[-1, 1].map((s) => <group key={s}>
      <Seg a={[s * 0.815, 1.08, 1.21]} b={[s * 0.815, 1.71, 0.72]} w={[0.03, 0.08]} m={body} /><Bx p={[s * 0.815, 1.39, -0.33]} s={[0.03, 0.66, 0.16]} m={body} />
      <Bx p={[s * 0.87, 0.85, -1.5]} s={[0.06, 0.46, 2.2]} m={body} /><Bx p={[s * 0.96, 1.16, 1.05]} s={[0.16, 0.11, 0.08]} m={dark} /><Bx p={[s * 0.903, 0.75, 0.35]} s={[0.006, 0.6, 0.015]} m={dark} cast={false} />
      <Wheel p={[s * 0.84, 0.37, 1.7]} r={0.37} w={0.24} roll={roll} /><Wheel p={[s * 0.84, 0.37, -1.55]} r={0.37} w={0.24} roll={roll} /></group>)}
    <Bx p={[0, 0.46, 2.58]} s={[1.84, 0.22, 0.12]} m={dark} /><Bx p={[0, 0.44, -2.6]} s={[1.84, 0.16, 0.1]} m={dark} /><Bx p={[0, 0.76, 2.61]} s={[0.95, 0.16, 0.03]} m={dark} cast={false} />
    {cargo && <><Bx p={[-0.35, 0.86, -1.0]} s={[0.6, 0.48, 0.8]} m={FL('#B08D5E')} /><Bx p={[0.38, 0.8, -1.7]} s={[0.7, 0.36, 0.6]} m={FL('#9C7A4E')} /><Ms g={CYL(1, 1, 10)} p={[0.4, 0.98, -0.85]} s={[0.26, 0.72, 0.26]} m={FL('#3E6A8C')} /></>}
    <Lamps front={[[-0.68, 0.8, 2.59], [0.68, 0.8, 2.59]]} rear={[[-0.8, 0.82, -2.6], [0.8, 0.82, -2.6]]} s={[0.36, 0.13, 0.07]} rs={[0.12, 0.3, 0.07]} lights={lights} />
  </group>; };
/** an underbone motorbike (1.85 m) with an optional boxy rider in a helmet, leaning into the bars. lean = bank angle. */
export const Motorbike: FC<VehP & {rider?: boolean; lean?: number; shirt?: string}> = ({position, yaw = 0, t = 0, color = '#B24A3E', roll = 0, lights = 0, rider = true, lean = 0, shirt = '#6F8FA8'}) => {
  const body = M(color, 0.45, 0.2, {}, 'lkcar'), dark = TRIM(), steel = M('#A9ADB2', 0.45, 0.15), sh = FL(shirt), tr = FL('#2E3238'), skin = FL('#C99A6E'), nod = Math.sin(t * 5.1) * 0.01;
  return <group position={position} rotation={[0, yaw, 0]}><group rotation={[0, 0, lean]}>
    <Wheel p={[0, 0.29, 0.63]} r={0.29} w={0.09} roll={roll} /><Wheel p={[0, 0.29, -0.6]} r={0.29} w={0.1} roll={roll} />
    <Bx p={[0, 0.63, -0.42]} s={[0.24, 0.2, 0.78]} r={[0.12, 0, 0]} m={body} /><Bx p={[0, 0.77, -0.3]} s={[0.26, 0.07, 0.66]} r={[0.04, 0, 0]} m={dark} />
    <Bx p={[0, 0.38, -0.02]} s={[0.22, 0.24, 0.46]} m={dark} /><Bx p={[0, 0.6, 0.2]} s={[0.4, 0.52, 0.07]} r={[-0.35, 0, 0]} m={body} />
    <Bx p={[0, 0.5, -0.06]} s={[0.26, 0.05, 0.34]} m={body} /><Bx p={[0, 0.6, 0.63]} s={[0.13, 0.05, 0.42]} m={body} /><Bx p={[0, 0.62, -0.72]} s={[0.14, 0.05, 0.4]} m={dark} />
    {[-1, 1].map((s) => <Seg key={s} a={[s * 0.07, 0.29, 0.63]} b={[s * 0.07, 0.98, 0.37]} w={0.04} round m={steel} />)}
    <Bx p={[0, 0.94, 0.4]} s={[0.24, 0.2, 0.14]} m={body} /><Seg a={[-0.3, 1.02, 0.35]} b={[0.3, 1.02, 0.35]} w={0.035} round m={dark} />
    {[-1, 1].map((s) => <Seg key={s} a={[s * 0.24, 1.02, 0.35]} b={[s * 0.3, 1.2, 0.32]} w={0.015} round m={dark} />)}
    {[-1, 1].map((s) => <Bx key={s} p={[s * 0.3, 1.22, 0.32]} s={[0.1, 0.06, 0.015]} m={dark} cast={false} />)}
    <Seg a={[0.16, 0.34, -0.2]} b={[0.17, 0.42, -0.85]} w={0.08} round m={steel} />
    <Lamps front={[[0, 0.96, 0.475]]} rear={[[0, 0.7, -0.83]]} s={[0.14, 0.1, 0.03]} rs={[0.12, 0.06, 0.04]} lights={lights} beam={0.6} />
    {rider && <group position={[0, nod, 0]}>
      <group position={[0, 0.82, -0.22]} rotation={[0.22, 0, 0]}>
        <Bx p={[0, 0.3, 0]} s={[0.36, 0.52, 0.2]} m={sh} /><Bx p={[0, 0.61, 0.01]} s={[0.1, 0.1, 0.1]} m={skin} />
        <Bx p={[0, 0.74, 0.03]} s={[0.19, 0.2, 0.2]} m={skin} /><Bl d={1} p={[0, 0.8, 0.02]} s={[0.15, 0.14, 0.16]} m={FL('#D8D4C8')} /><Bx p={[0, 0.76, 0.14]} s={[0.2, 0.08, 0.03]} m={dark} cast={false} />
      </group>
      {[-1, 1].map((s) => <group key={s}>
        <Seg a={[s * 0.21, 1.3, -0.1]} b={[s * 0.27, 1.12, 0.14]} w={0.09} m={sh} /><Seg a={[s * 0.27, 1.12, 0.14]} b={[s * 0.27, 1.04, 0.35]} w={0.075} m={skin} />
        <Seg a={[s * 0.11, 0.86, -0.22]} b={[s * 0.18, 0.76, 0.14]} w={0.13} m={tr} /><Seg a={[s * 0.18, 0.78, 0.12]} b={[s * 0.18, 0.4, 0.04]} w={0.1} m={tr} /><Bx p={[s * 0.18, 0.37, 0.09]} s={[0.1, 0.07, 0.22]} m={dark} /></group>)}
    </group>}
  </group></group>;
};
const Spoked: FC<{p: V3; r: number; roll?: number}> = ({p, r, roll = 0}) => <group position={p} rotation={[0, 0, roll]}>
  <mesh geometry={G('rim', () => new THREE.TorusGeometry(1, 0.07, 6, 18))} scale={r} material={M('#1B1C1E', 0.9)} castShadow />
  {[0, 1, 2, 3].map((i) => <Bx key={i} s={[r * 1.9, 0.014, 0.014]} r={[0, 0, (i * Math.PI) / 4]} m={M('#A9ADB2', 0.45, 0.15)} cast={false} />)}
  <Ms g={CYL(1, 1, 8)} r={[Math.PI / 2, 0, 0]} s={[0.04, 0.08, 0.04]} m={M('#A9ADB2', 0.45, 0.15)} cast={false} />
</group>;
const parasolGeo = () => G('parasol', () => { const g = new THREE.ConeGeometry(1, 0.32, 8, 1, true).toNonIndexed(), n = g.attributes.position.count, col = new Float32Array(n * 3), cs = ['#C8483C', '#EDE6D2', '#3E6A9C', '#E6C24E'].map((c) => new THREE.Color(c));
  for (let i = 0; i < n; i++) cs[Math.floor(i / 3) % 4].toArray(col, i * 3); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; });
/** a Thai pushcart (front/customer side = +z): steel body, glass case, a steaming pot, two spoked wheels, push handle, a striped parasol that nods in the wind */
export const FoodCart: FC<{position: V3; yaw?: number; t: number; steam?: boolean}> = ({position, yaw = 0, t, steam = true}) => {
  const steel = M('#C2C6C9', 0.4, 0.15), wood = FL('#8A6A48'), dark = TRIM(), w = wind(t, 3);
  const par = G('parasolM', () => new THREE.MeshStandardMaterial({vertexColors: true, flatShading: true, side: THREE.DoubleSide, roughness: 0.9}));
  return <group position={position} rotation={[0, yaw, 0]}>
    <Bx p={[0, 0.66, 0]} s={[1.3, 0.42, 0.72]} m={M('#D9D4C4', 0.6)} /><Bx p={[0, 0.885, 0]} s={[1.36, 0.035, 0.78]} m={steel} /><Bx p={[0, 0.46, 0.365]} s={[1.3, 0.02, 0.01]} m={dark} cast={false} />
    <Bx p={[0, 0.72, 0.362]} s={[0.9, 0.2, 0.01]} m={FL('#C8483C')} cast={false} />
    {[-1, 1].map((s) => <Spoked key={s} p={[0.1, 0.33, s * 0.42]} r={0.31} />)}
    <Bx p={[-0.55, 0.22, 0]} s={[0.05, 0.44, 0.05]} m={dark} />
    {[-1, 1].map((s) => <Seg key={s} a={[-0.65, 0.8, s * 0.3]} b={[-0.98, 0.98, s * 0.3]} w={0.03} round m={steel} />)}<Seg a={[-0.98, 0.98, -0.3]} b={[-0.98, 0.98, 0.3]} w={0.03} round m={steel} />
    {/* glass case with food, and the pot */}
    <Bx p={[0.3, 1.12, 0]} s={[0.66, 0.44, 0.62]} m={M('#CFE3EA', 0.1, 0, {transparent: true, opacity: 0.28, depthWrite: false}, 'lkcase')} cast={false} />
    {[[-0.02, -0.3], [0.62, -0.3], [-0.02, 0.3], [0.62, 0.3]].map(([x, z], i) => <Bx key={i} p={[x, 1.12, z]} s={[0.025, 0.46, 0.025]} m={steel} />)}<Bx p={[0.3, 1.35, 0]} s={[0.7, 0.03, 0.66]} m={steel} />
    {[['#E6C878', 0.12, 0.1], ['#7FA35A', 0.36, -0.08], ['#D98A5A', 0.5, 0.14], ['#EDE6D2', 0.2, -0.16]].map(([c, x, z], i) => <Bl key={i} p={[x as number, 0.96, z as number]} s={[0.1, 0.06, 0.09]} m={FL(c as string)} cast={false} />)}
    <Ms g={CYL(1, 0.9, 12)} p={[-0.34, 1.06, 0.02]} s={[0.2, 0.32, 0.2]} m={steel} /><Ms g={CYL(1, 1, 12)} p={[-0.34, 1.215, 0.02]} s={[0.17, 0.01, 0.17]} m={FL('#C9B58A')} cast={false} />
    {steam && <Smoke from={[-0.34, 1.24, 0.02]} t={t} n={6} color="#F2F2EE" rise={0.7} spread={0.1} size={0.07} />}
    <Seg a={[-0.6, 0.9, -0.33]} b={[-0.6, 2.25, -0.33]} w={0.04} round m={steel} />
    <group position={[-0.6, 2.25, -0.33]} rotation={[0.1 + w * 0.025, 0, 0.06 + w * 0.03]}><mesh geometry={parasolGeo()} position={[0, 0.1, 0.3]} scale={[1.15, 1, 1.15]} material={par} castShadow /></group>
  </group>;
};
const CARS = ['#D8D9D6', '#8E9499', '#B24A3E', '#3E5878', '#3A3D40', '#C9B58A'];
/** one-way traffic from a to b: a vehicle every `every` s (seeded jitter), all at `speed` so they never catch each other; wheels turn at the right rate, bodies bounce a little */
export const Traffic: FC<{t: number; a: V3; b: V3; every?: number; speed?: number; seed?: number; kinds?: ('car' | 'bike' | 'pickup')[]; night?: number}> = ({t, a, b, every = 4, speed = 7, seed = 0, kinds = ['car', 'bike', 'pickup'], night = 0}) => {
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]), yaw = Math.atan2(b[0] - a[0], b[2] - a[2]), out: React.ReactNode[] = [];
  for (let k = Math.floor((t - L / speed) / every) - 1; k <= Math.floor(t / every) + 1; k++) { const h = (j: number) => hash(k * 1.31 + seed * 7.7 + j + 0.5), d = (t - (k + h(1) * 0.4) * every) * speed;
    if (d < 0 || d > L) continue; const kind = kinds[Math.floor(h(2) * kinds.length)], color = CARS[Math.floor(h(3) * CARS.length)], p = mix3(a, b, d / L);
    const P = {position: [0, Math.sin(d * 0.9 + k) * 0.012 + Math.sin(d * 2.3) * 0.006, 0] as V3, color, roll: d / (kind === 'car' ? 0.31 : kind === 'pickup' ? 0.37 : 0.29), lights: night, t};
    out.push(<group key={k} position={p} rotation={[0, yaw, 0]}><group rotation={[Math.sin(d * 0.7 + k) * 0.006, 0, 0]}>{kind === 'car' ? <Car {...P} /> : kind === 'pickup' ? <Pickup {...P} cargo={h(4) < 0.6} /> : <Motorbike {...P} shirt={['#6F8FA8', '#D9D2C0', '#7A8F6A', '#B8865A'][Math.floor(h(5) * 4)]} />}</group></group>); }
  return <>{out}</>;
};

// =====================================================================================================
// Objects
// =====================================================================================================
/** a hanging sheet of cloth (top edge at y = 0) that ripples; each one owns its geometry */
const Cloth: FC<{w: number; h: number; t: number; ph: number; amp?: number; m: THREE.Material}> = ({w, h, t, ph, amp = 0.05, m}) => {
  const [g, base] = useMemo(() => { const g = new THREE.PlaneGeometry(w, h, 4, 5); g.translate(0, -h / 2, 0); return [g, Float32Array.from(g.attributes.position.array)] as const; }, [w, h]);
  const P = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) { const x = base[i * 3], v = -base[i * 3 + 1] / h; P.setZ(i, amp * v * (Math.sin(v * 3.2 + x * 3 - t * 4.2 + ph) + 0.5 * Math.sin(x * 7 + t * 2.6 + ph * 2))); }
  P.needsUpdate = true; g.computeVertexNormals();
  return <mesh geometry={g} material={m} castShadow />;
};
const WASH = ['#EDE9DF', '#B9CBDD', '#C98A80', '#D9C27A', '#9DB5A0', '#D8D2C8', '#8FA3B8'];
/** a washing line from a to b with n shirts / towels / sheets that swing and ripple with the wind. poles = bamboo posts down to the ground at both ends. */
export const Laundry: FC<{a: V3; b: V3; t: number; n?: number; seed?: number; sag?: number; poles?: boolean}> = ({a, b, t, n = 5, seed = 0, sag = 0.12, poles = false}) => {
  const {L} = span(a, b), gap = L / n, bamboo = FL('#B59A62');
  return <group>
    {poles && [a, b].map((p, i) => <Seg key={i} a={[p[0], 0, p[2]]} b={[p[0], p[1] + 0.12, p[2]]} w={0.06} round m={bamboo} />)}
    <Wire a={a} b={b} sag={sag} r={0.008} m={M('#3A3D40', 0.7)}>
      {Array.from({length: n}, (_, i) => { const h = (k: number) => hash(i * 3.7 + seed * 9.3 + k + 0.2), u = (i + 0.5) / n, kind = h(1) < 0.5 ? 0 : h(1) < 0.78 ? 1 : 2;
        const w = Math.min(gap * (kind === 0 ? 0.62 : 0.86), [0.5, 0.55, 1.3][kind]), hh = [0.62, 0.85, 1.05][kind], m = M(WASH[Math.floor(h(2) * WASH.length)], 0.9, 0, {side: THREE.DoubleSide}, 'lkC');
        return <group key={i} position={[L * u, sagY(u, sag) - 0.01, 0]} rotation={[0.1 + wind(t, seed * 0.3 + i * 0.25) * 0.2, 0, 0]}>
          <Cloth w={w} h={hh} t={t} ph={h(3) * TAU} amp={kind === 2 ? 0.07 : 0.045} m={m} />
          {kind === 0 && [-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 + 0.07), -0.1, 0]} rotation={[0, 0, s * 0.55]} material={m} castShadow><planeGeometry args={[0.22, 0.2]} /></mesh>)}
          {[-1, 1].map((s) => <Bx key={'p' + s} p={[s * w * 0.38, 0, 0]} s={[0.015, 0.05, 0.02]} m={FL('#C9A86A')} cast={false} />)}
        </group>; })}
    </Wire>
  </group>;
};
const FLAGS = ['#C8483C', '#E6C24E', '#3E6A9C', '#5C8A50', '#EDE6D2', '#D98AA8'];
/** a line of triangular flags from a to b, fluttering */
export const Bunting: FC<{a: V3; b: V3; t: number; n?: number; sag?: number; size?: number; colors?: string[]}> = ({a, b, t, n = 12, sag = 0.4, size = 0.3, colors = FLAGS}) => { const {L} = span(a, b);
  return <Wire a={a} b={b} sag={sag} r={0.006} swing={wind(t, 1) * 0.05} m={M('#3A3D40', 0.7)}>
    {Array.from({length: n}, (_, i) => { const u = (i + 0.5) / n;
      return <mesh key={i} geometry={tri('flag', [-0.5, 0, 0, 0.5, 0, 0, 0, -1, 0], [0, 1, 2])} position={[L * u, sagY(u, sag), 0]} rotation={[0.2 + wind(t, i * 0.7) * 0.25 + Math.sin(t * 6.5 + i * 1.9) * 0.2, Math.sin(t * 4.1 + i * 1.3) * 0.25, Math.atan(-4 * sag * (1 - 2 * u) / L)]} scale={[size * 0.75, size, 1]} material={FL2(colors[i % colors.length])} castShadow />; })}
  </Wire>; };
/** a pleated curtain, w × h, centred on `position`, hanging flat in the xy plane and breathing toward +z (into the room) with the wind */
export const Curtain: FC<{position: V3; w: number; h: number; t: number; yaw?: number; color?: string; seed?: number}> = ({position, w, h, t, yaw = 0, color = '#E9E2CF', seed = 0}) => {
  const pleats = Math.max(3, Math.round(w / 0.16));
  const [g, base] = useMemo(() => { const g = new THREE.PlaneGeometry(w, h, pleats * 4, 8); return [g, Float32Array.from(g.attributes.position.array)] as const; }, [w, h, pleats]);
  const P = g.attributes.position as THREE.BufferAttribute, B = 0.5 + 0.5 * wind(t * 0.8, seed);
  for (let i = 0; i < P.count; i++) { const x = base[i * 3], v = cl(0.5 - base[i * 3 + 1] / h);   // clamp: float32 rounding can make the top row −1e-8, and pow() of that is NaN
    P.setZ(i, 0.03 + Math.sin((x / w) * TAU * pleats) * 0.03 * (0.5 + 0.5 * v) + B * 0.3 * (h / 1.5) * Math.pow(v, 1.4) * (0.75 + 0.25 * Math.sin((x / w) * 5 + t * 1.3 + seed))); }
  P.needsUpdate = true; g.computeVertexNormals();
  return <group position={position} rotation={[0, yaw, 0]}><mesh geometry={g} material={M(color, 0.9, 0, {side: THREE.DoubleSide}, 'lkC')} castShadow /><Seg a={[-w / 2 - 0.08, h / 2 + 0.02, 0.03]} b={[w / 2 + 0.08, h / 2 + 0.02, 0.03]} w={0.03} round m={M('#5A4330', 0.6)} /></group>;
};
/** a ceiling fan; position = where the rod meets the ceiling. speed 1 ≈ 1.5 rev/s. */
export const CeilingFan: FC<{position: V3; t: number; speed?: number; blades?: number}> = ({position, t, speed = 1, blades = 3}) => { const a = t * speed * TAU * 1.5, white = M('#E9E6DC', 0.5), wood = M('#8A6A48', 0.6);
  return <group position={position} rotation={[Math.sin(a) * 0.006, 0, Math.cos(a) * 0.006]}>
    <Ms g={CYL(1, 1, 8)} p={[0, -0.14, 0]} s={[0.018, 0.28, 0.018]} m={white} /><Ms g={CYL(1, 1, 10)} p={[0, -0.02, 0]} s={[0.06, 0.04, 0.06]} m={white} cast={false} />
    <group position={[0, -0.33, 0]} rotation={[0, -a, 0]}><Ms g={CYL(1, 0.8, 12)} s={[0.11, 0.11, 0.11]} m={white} />
      {Array.from({length: blades}, (_, i) => <group key={i} rotation={[0, (i / blades) * TAU, 0]}><Bx p={[0, 0, 0.2]} s={[0.04, 0.012, 0.2]} m={white} /><Bx p={[0, 0, 0.45]} s={[0.13, 0.012, 0.5]} r={[0, 0, 0.12]} m={wood} /></group>)}</group>
    <Bl d={1} p={[0, -0.42, 0]} s={[0.07, 0.04, 0.07]} m={M('#F4EEDC', 0.4)} cast={false} />
  </group>; };
/** a lit window for night scenes: emissive pane w × h centred on `position`, facing +z (yaw turns it), with mullions and a soft glow. tv = blue flicker. */
export const WindowLight: FC<{position: V3; w: number; h: number; yaw?: number; t: number; kind?: 'warm' | 'tv'; on?: number; color?: string; seed?: number}> = ({position, w, h, yaw = 0, t, kind = 'warm', on = 1, color, seed = 0}) => {
  const tv = kind === 'tv', lv = tv ? tvLevel(t, seed + position[0]) : 1, c = color ?? (tv ? tvColor(t, seed + position[0]) : '#FFD49A'), bar = M('#3A2C20', 0.8);
  const pane = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []); pane.color.set(mixC('#10131A', c, on));
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh material={pane}><planeGeometry args={[w, h]} /></mesh>
    <Bx p={[0, 0, 0.005]} s={[0.04, h, 0.012]} m={bar} cast={false} /><Bx p={[0, h * 0.12, 0.005]} s={[w, 0.04, 0.012]} m={bar} cast={false} />
    <Pool p={[0, 0, 0.02]} r={[0, 0, 0]} s={[w * 2.6, h * 2.6]} color={c} o={0.4 * on * lv} />   {/* flat on the wall: a billboard would poke through curtains */}
  </group>;
};
/** a street lamp: pole of height h with an arm reaching 1.3 m toward +z; on = lens, halo, a ground pool, one modest point light, and moths */
export const StreetLamp: FC<{position: V3; yaw?: number; on?: number; t: number; moths?: boolean; h?: number}> = ({position, yaw = 0, on = 1, t, moths = true, h = 6}) => { const steel = M('#6C7076', 0.5, 0.5), lit = on > 0.05;
  return <group position={position} rotation={[0, yaw, 0]}>
    <Ms g={CYL(0.65, 1, 8)} p={[0, h / 2, 0]} s={[0.09, h, 0.09]} m={steel} /><Bx p={[0, h - 0.05, 0.65]} s={[0.09, 0.09, 1.4]} m={steel} /><Bx p={[0, h - 0.07, 1.25]} s={[0.3, 0.1, 0.5]} m={steel} />
    <Bx p={[0, h - 0.13, 1.25]} s={[0.24, 0.03, 0.42]} m={lit ? MB('#FFE9B8') : M('#E4E0D2', 0.4)} cast={false} />
    {lit && <><Glow p={[0, h - 0.2, 1.25]} s={2.4 * on} color="#FFD9A0" o={0.75} /><Pool p={[0, 0.03, 1.25]} s={[9, 9]} color="#FFD49A" o={0.22 * on} />
      <pointLight position={[0, h - 0.5, 1.25]} color="#FFD49A" intensity={16 * on} distance={16} decay={1.5} />
      {moths && <Moths center={[0, h - 0.4, 1.25]} r={0.38} t={t} seed={position[0] + position[2]} />}</>}
  </group>; };
const puffM = (c: string, o: number) => { const q = Math.round(o * 12) / 12; return M(c, 1, 0, {flatShading: true, transparent: true, opacity: q, depthWrite: false}, 'lkP' + q); };
/** puffs rising `rise` m from a point, widening to `spread`, bending with the wind, fading in and out (chimney, cart, incense) */
export const Smoke: FC<{from: V3; t: number; n?: number; color?: string; rise?: number; spread?: number; size?: number; life?: number; seed?: number}> = ({from, t, n = 8, color = '#C9C9C4', rise = 1.2, spread = 0.3, size = 0.12, life = 2.6, seed = 0}) =>
  <group position={from}>{Array.from({length: n}, (_, i) => { const h = (k: number) => hash(i * 4.9 + seed * 3.3 + k + 0.7), u = fr(t / life + i / n + h(1) * 0.05), o = Math.sin(Math.PI * Math.pow(u, 0.7)) * 0.6; if (o < 0.04) return null;
    return <mesh key={i} geometry={ICO(1)} position={[(h(2) - 0.5) * spread * 2 * u + (0.25 + wind(t, seed) * 0.2) * u * u * rise * 0.4, rise * Math.pow(u, 0.85), (h(3) - 0.5) * spread * 2 * u]} rotation={[h(4) * 3 + t * 0.3, h(5) * 3 + t * 0.4, 0]} scale={size * (0.45 + 1.5 * u) * (0.8 + h(6) * 0.4)} material={puffM(color, o)} />; })}</group>;
