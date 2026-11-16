import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, M, tex, F} from '../../pov/lib/tex';
import {Glow} from '../AbsurdEp8/props';

/** EP18 — the new things only: the day pages (Monday is its yellow tear-off sheet, no face), the bedroom calendar and clock, the sea at the
 *  date line (water, buoys, concertina wire, the checkpoint pontoon with its booth and barrier), the police boats, and the wedding things. */
export type V3 = [number, number, number];
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x: number) => { const c = cl(x); return c * c * (3 - 2 * c); };
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// =====================================================================================================
// DAY PAGES. Thai day colours: Sunday red, Monday yellow, Tuesday pink. Printed on both sides so it reads from either side of the line.
// =====================================================================================================
export type Day = 'sun' | 'mon' | 'tue';
export const DAYS: Record<Day, {name: string; num: string; band: string; ink: string}> = {
  sun: {name: 'อาทิตย์', num: '15', band: '#D9453A', ink: '#FFFFFF'}, mon: {name: 'จันทร์', num: '16', band: '#F2C230', ink: '#3A2A08'}, tue: {name: 'อังคาร', num: '17', band: '#E890B4', ink: '#FFFFFF'}};
const pageTex = (d: Day) => tex('ep18-page-' + d, 512, 640, (g) => { const D = DAYS[d];
  g.fillStyle = '#FBF8EF'; g.fillRect(0, 0, 512, 640);
  g.fillStyle = D.band; g.fillRect(0, 0, 512, 150); g.fillStyle = D.ink; g.font = F(800, 92); g.textAlign = 'center'; g.fillText(D.name, 256, 112);
  g.fillStyle = d === 'sun' ? '#D9453A' : '#26262B'; g.font = F(800, 300); g.fillText(D.num, 256, 470);
  g.fillStyle = '#55555C'; g.font = F(600, 44); g.fillText('พฤศจิกายน 2569', 256, 570);
  g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 150, 512, 6);
  g.fillStyle = '#C9C2B0'; for (const x of [150, 362]) { g.beginPath(); g.arc(x, 24, 9, 0, 7); g.fill(); }
});
/** a day's sheet, standing: origin at its bottom-centre, w × h metres, front faces local +z. curl lifts the bottom edge forward a little. */
export const DayPage: React.FC<{day: Day; position: V3; yaw?: number; h?: number; t?: number; flutter?: number; tilt?: number; veil?: number; k?: number; roll?: number}> =
  ({day, position, yaw = 0, h = 2.6, t = 0, flutter = 1, tilt = 0, veil = 0, k = 1, roll = 0}) => {
  const w = h * 0.8;
  const geo = useMemo(() => { const gg = new THREE.PlaneGeometry(1, 1, 6, 8); const p = gg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const v = p.getY(i) + 0.5, u = p.getX(i); p.setZ(i, 0.07 * (1 - v) * (1 - v) + 0.02 * u * u); } gg.computeVertexNormals(); return gg; }, []);
  const front = useMemo(() => new THREE.MeshStandardMaterial({map: pageTex(day), roughness: 0.9, side: THREE.FrontSide}), [day]);
  const back = useMemo(() => new THREE.MeshStandardMaterial({map: pageTex(day), roughness: 0.9, side: THREE.BackSide}), [day]);
  if (k <= 0.001) return null;
  const fl = flutter * (0.035 * Math.sin(t * 2.3) + 0.02 * Math.sin(t * 5.1 + 1));
  return <group position={position} rotation={[tilt + fl, yaw + 0.03 * flutter * Math.sin(t * 1.7), roll]} scale={k}>
    <group position={[0, h / 2, 0]} scale={[w, h, w * 0.7]}><mesh geometry={geo} material={front} castShadow receiveShadow /><mesh geometry={geo} material={back} position={[0, 0, -0.004]} /></group>
    <mesh position={[0, h - 0.015 * h, 0.01]} material={M('#3A3A40', 0.5, 0.3)}><boxGeometry args={[w * 1.01, 0.03 * h, 0.03 * h]} /></mesh>
    {veil > 0 && <Veil h={h} w={w} k={veil} t={t} />}
  </group>;
};
/** a bride's veil + a flower crown on the page's top edge */
const Veil: React.FC<{h: number; w: number; k: number; t: number}> = ({h, w, k, t}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: '#FFFFFF', transparent: true, opacity: 0.55, roughness: 0.6, side: THREE.DoubleSide, depthWrite: false}), []);
  return <group position={[0, h, 0]} scale={k}>
    <mesh material={m} position={[0, -h * 0.2, 0.09]} rotation={[-0.06 + 0.03 * Math.sin(t * 2), 0, 0]}><planeGeometry args={[w * 1.1, h * 0.42]} /></mesh>
    <mesh material={m} position={[0, -h * 0.34, -0.06]} rotation={[0.08, 0, 0]}><planeGeometry args={[w * 1.15, h * 0.68]} /></mesh>
    {Array.from({length: 9}, (_, i) => <mesh key={i} position={[(i / 8 - 0.5) * w * 0.9, 0.02, 0.04]} material={M(['#F6A6C1', '#FFFFFF', '#F7D65A'][i % 3], 0.8)}><sphereGeometry args={[w * 0.045, 8, 6]} /></mesh>)}
  </group>;
};
/** the red diagram annotation from the reference: dashed box + ✕ + label, drawn where the passport should be */
const annoTex = () => tex('ep18-anno', 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512); g.strokeStyle = '#E2342B'; g.lineWidth = 12; g.setLineDash([34, 22]); g.beginPath(); g.roundRect(70, 40, 372, 300, 20); g.stroke(); g.setLineDash([]);
  g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(180, 110); g.lineTo(332, 270); g.moveTo(332, 110); g.lineTo(180, 270); g.stroke();
  g.fillStyle = '#E2342B'; g.beginPath(); g.roundRect(86, 370, 340, 100, 18); g.fill(); g.fillStyle = '#FFFFFF'; g.font = F(800, 64); g.textAlign = 'center'; g.fillText('พาสปอร์ต', 256, 444);
});
export const Annotation: React.FC<{position: V3; yaw?: number; s: number; k: number}> = ({position, yaw = 0, s, k}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: annoTex(), transparent: true, depthWrite: false, toneMapped: false}), []);
  if (k <= 0.01) return null; m.opacity = cl(k * 1.5);
  return <mesh position={position} rotation={[0, yaw, 0]} scale={s * (1.25 - 0.25 * sm(k))} material={m}><planeGeometry args={[1, 1]} /></mesh>;
};

// =====================================================================================================
// THE BEDROOM WALL: a tear-off calendar (Sunday on top, Monday under it) and a clock above it. Both hang on a wall facing local +z.
// =====================================================================================================
export const CAL = {w: 0.34, h: 0.425};
/** peel = seconds since the Sunday sheet let go (< 0: still on). It swings out from its top edge, lets go, and flutters down to the floor. */
export const WallCalendar: React.FC<{position: V3; yaw?: number; t: number; peel: number; floorY: number}> = ({position, yaw = 0, t, peel, floorY}) => {
  const mon = useMemo(() => new THREE.MeshStandardMaterial({map: pageTex('mon'), roughness: 0.9}), []);
  const sun = useMemo(() => new THREE.MeshStandardMaterial({map: pageTex('sun'), roughness: 0.9, side: THREE.DoubleSide}), []);
  const {w, h} = CAL; const u = peel;
  let sheet: React.ReactNode = null;
  if (u < 0) sheet = <mesh position={[0, 0, 0.012]} material={sun}><planeGeometry args={[w, h]} /></mesh>;
  else { const swing = sm(u / 0.18) * 1.3; const fall = Math.max(0, u - 0.16); const drop = Math.min(position[1] - floorY - 0.05, 0.5 * 9.8 * 0.22 * fall * fall);
    sheet = <group position={[0.06 * fall + 0.02 * Math.sin(fall * 9), h / 2 - drop, 0.012 + 0.25 * sm(u / 0.3) + 0.1 * fall]} rotation={[swing + fall * 2.2, 0.4 * Math.sin(fall * 6), 0.3 * Math.sin(fall * 4)]}>
      <mesh position={[0, -h / 2, 0]} material={sun}><planeGeometry args={[w, h]} /></mesh></group>; }
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.02, -0.004]} material={M('#8B6B4A', 0.9)}><boxGeometry args={[w + 0.05, h + 0.12, 0.01]} /></mesh>
    <mesh position={[0, 0, 0.006]} material={mon}><planeGeometry args={[w, h]} /></mesh>
    {sheet}
    <mesh position={[0, h / 2 + 0.035, 0.012]} material={M('#2E2E34', 0.5, 0.4)}><boxGeometry args={[w + 0.02, 0.05, 0.02]} /></mesh>
    <mesh position={[0, h / 2 + 0.13, -0.002]} material={M('#555', 0.5, 0.5)}><cylinderGeometry args={[0.006, 0.006, 0.01, 6]} /></mesh>
  </group>;
};
const clockTex = () => tex('ep18-clock', 256, 256, (g) => {
  g.fillStyle = '#FBFAF4'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#2B2B30'; g.lineWidth = 10; g.stroke();
  g.fillStyle = '#2B2B30'; g.font = F(700, 34); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(String(i), 128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92); }
});
/** a round wall clock; hours is the time of day as a float (23.99 = 23:59:24). Faces local +z. */
export const WallClock: React.FC<{position: V3; yaw?: number; r?: number; hours: number}> = ({position, yaw = 0, r = 0.13, hours}) => {
  const face = useMemo(() => new THREE.MeshStandardMaterial({map: clockTex(), roughness: 0.6}), []);
  const hh = hours % 12, mm = (hours * 60) % 60, ss = (hours * 3600) % 60;
  const hand = (a: number, len: number, wd: number, col: string, z: number) => <group rotation={[0, 0, -a]} position={[0, 0, z]}><mesh position={[0, len / 2 - len * 0.12, 0]} material={MB(col)}><boxGeometry args={[wd, len, 0.004]} /></mesh></group>;
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={M('#2B2B30', 0.5, 0.3)} position={[0, 0, -0.01]}><cylinderGeometry args={[r * 1.06, r * 1.06, 0.03, 32]} /></mesh>
    <mesh position={[0, 0, 0.007]} material={face}><circleGeometry args={[r, 32]} /></mesh>
    {hand((hh / 12) * Math.PI * 2, r * 0.55, r * 0.07, '#1E1E22', 0.012)}{hand((mm / 60) * Math.PI * 2, r * 0.82, r * 0.05, '#1E1E22', 0.016)}{hand((ss / 60) * Math.PI * 2, r * 0.88, r * 0.02, '#D9453A', 0.02)}
  </group>;
};

// =====================================================================================================
// THE SEA. The date line runs along z at x = 0: the Sunday side (ours, the checkpoint) is −x, Monday comes from +x.
// =====================================================================================================
export const waveY = (x: number, z: number, t: number) => 0.09 * Math.sin(0.42 * x + 1.25 * t) + 0.06 * Math.sin(0.55 * z - 1.05 * t + 0.6) + 0.035 * Math.sin(0.9 * (x + z) + 2.1 * t);
/** low-poly water: a faceted patch round `at` (1 m facets) on a flat far plane */
export const Sea: React.FC<{t: number; color: string; far?: string; at?: V3; size?: number}> = ({t, color, far, at = [0, 0, 0], size = 90}) => {
  const seg = Math.round(size / 1.2);
  const geo = useMemo(() => new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2).toNonIndexed(), [size, seg]);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, waveY(x + at[0], z + at[2], t)); }
  p.needsUpdate = true; geo.computeVertexNormals();
  const m = useMemo(() => new THREE.MeshStandardMaterial({color, flatShading: true, roughness: 0.3, metalness: 0.15}), [color]);
  return <>
    <mesh geometry={geo} material={m} position={[at[0], 0, at[2]]} receiveShadow />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[at[0], -0.06, at[2]]} material={M(far ?? color, 0.4, 0.1)}><planeGeometry args={[1400, 1400]} /></mesh>
  </>;
};
/** a sky dome: zenith → horizon gradient (MeshBasic, no fog) */
export const SkyDome: React.FC<{top: string; mid: string; low: string}> = ({top, mid, low}) => {
  const key = 'ep18-sky-' + top + mid + low;
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: tex(key, 8, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, low); gr.addColorStop(1, low); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); }), side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false}), [key]);
  return <mesh material={m} renderOrder={-10}><sphereGeometry args={[450, 32, 16]} /></mesh>;
};

// ---- a row of buoys along the line, with a post on every 4th one, and the concertina wire (instanced: hundreds of coils, one draw call)
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number) => { const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; im.castShadow = true; return im; };
/** z0…z1 along the line; wire = how far the coils have been laid, as a z (coils exist for z ≤ wireTo); spread = from where they were laid, metres */
export const DateLine: React.FC<{t: number; z0: number; z1: number; wireFrom?: number; wireTo?: number; x?: number}> = ({t, z0, z1, wireFrom, wireTo, x = 0}) => {
  const nB = Math.floor((z1 - z0) / 2.4) + 1, nW = Math.floor((z1 - z0) / 0.24) + 1;
  const buoys = useMemo(() => instanced(new THREE.SphereGeometry(0.26, 10, 8), M('#F07A2A', 0.6), nB), [nB]);
  const posts = useMemo(() => instanced(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 6), M('#5C5F66', 0.5, 0.5), nB), [nB]);
  const coils = useMemo(() => instanced(new THREE.TorusGeometry(0.34, 0.013, 4, 18), M('#4E535B', 0.35, 0.8), nW), [nW]);
  for (let i = 0; i < nB; i++) { const z = z0 + i * 2.4; const y = waveY(x, z, t);
    tmpM.compose(tmpP.set(x, y + 0.05, z), tmpQ.identity(), tmpS.set(1, 0.75, 1)); buoys.setMatrixAt(i, tmpM);
    tmpM.compose(tmpP.set(x, y + 0.66, z), tmpQ.identity(), tmpS.set(1, 1, 1)); posts.setMatrixAt(i, tmpM); }
  const a = wireFrom ?? z0, b = wireTo ?? z1;
  for (let i = 0; i < nW; i++) { const z = z0 + i * 0.24; const on = (z >= Math.min(a, b) && z <= Math.max(a, b)); const y = waveY(x, z, t);
    tmpE.set(0.25 * (hash(i) - 0.5), Math.PI / 2 + 0.5 * (hash(i + 9) - 0.5), 0); tmpQ.setFromEuler(tmpE);
    tmpM.compose(tmpP.set(x + 0.05 * (hash(i + 3) - 0.5), y + 0.82, z), tmpQ, tmpS.setScalar(on ? 1 : 0.0001)); coils.setMatrixAt(i, tmpM); }
  buoys.instanceMatrix.needsUpdate = true; posts.instanceMatrix.needsUpdate = true; coils.instanceMatrix.needsUpdate = true;
  return <><primitive object={buoys} /><primitive object={posts} /><primitive object={coils} /></>;
};

// ---- labels
const board = (key: string, w: number, h: number, bg: string, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void) => tex('ep18-' + key, w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); draw(g, w, h); });
const Board: React.FC<{position: V3; yaw?: number; w: number; h: number; map: THREE.Texture; poles?: number; basic?: boolean}> = ({position, yaw = 0, w, h, map, poles = 0, basic}) => {
  const m = useMemo(() => basic ? new THREE.MeshBasicMaterial({map, toneMapped: false}) : new THREE.MeshStandardMaterial({map, roughness: 0.8}), [map, basic]);
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh material={m} castShadow><boxGeometry args={[w, h, 0.05]} /></mesh>
    {poles > 0 && [-1, 1].map((s) => <mesh key={s} position={[s * w * 0.38, -h / 2 - poles / 2, -0.03]} material={M('#6A6E75', 0.5, 0.5)}><cylinderGeometry args={[0.04, 0.04, poles, 6]} /></mesh>)}
  </group>;
};
const lineTex = () => board('dateline', 1024, 512, '#1F3A5C', (g) => {
  g.strokeStyle = '#F2EFE6'; g.lineWidth = 14; g.strokeRect(14, 14, 996, 484); g.fillStyle = '#F2EFE6'; g.font = F(800, 92); g.textAlign = 'center'; g.fillText('เส้นแบ่งเขตวันสากล', 512, 150);
  g.fillStyle = '#E2342B'; g.fillRect(506, 200, 12, 280);
  g.fillStyle = '#D9453A'; g.beginPath(); g.roundRect(70, 250, 380, 170, 20); g.fill(); g.fillStyle = '#F2C230'; g.beginPath(); g.roundRect(574, 250, 380, 170, 20); g.fill();
  g.font = F(800, 88); g.fillStyle = '#FFFFFF'; g.fillText('อาทิตย์', 260, 366); g.fillStyle = '#3A2A08'; g.fillText('จันทร์', 764, 366);
});
/** the date-line sign on two poles in the water, facing local +z: Sunday on its left, Monday on its right */
export const LineSign: React.FC<{position: V3; yaw?: number; t: number}> = ({position, yaw = 0, t}) =>
  <group position={[position[0], position[1] + waveY(position[0], position[2], t) * 0.4, position[2]]}><Board position={[0, 2.6, 0]} yaw={yaw} w={3.2} h={1.6} map={lineTex()} poles={1.8} /></group>;
const boothTex = () => board('booth', 1024, 256, '#F2EFE6', (g) => { g.fillStyle = '#1F3A5C'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#FFFFFF'; g.font = F(800, 100); g.textAlign = 'center'; g.fillText('ด่านตรวจคนเข้าเมือง', 512, 165); });
const yesterdayTex = () => board('yday', 768, 384, '#2E7D4F', (g) => { g.strokeStyle = '#FFFFFF'; g.lineWidth = 12; g.strokeRect(12, 12, 744, 360); g.fillStyle = '#FFFFFF'; g.font = F(800, 120); g.textAlign = 'center'; g.fillText('เมื่อวาน', 384, 190);
  g.beginPath(); g.moveTo(250, 260); g.lineTo(470, 260); g.lineTo(470, 230); g.lineTo(540, 285); g.lineTo(470, 340); g.lineTo(470, 310); g.lineTo(250, 310); g.closePath(); g.fill(); });
/** a green road sign on a buoy in open water: "เมื่อวาน →" */
export const YesterdaySign: React.FC<{position: V3; yaw?: number; t: number; s?: number}> = ({position, yaw = 0, t, s = 1}) => <group position={[position[0], waveY(position[0], position[2], t), position[2]]} rotation={[0.03 * Math.sin(t * 1.4), 0, 0.03 * Math.sin(t * 1.1)]} scale={s}>
  <mesh position={[0, 0.1, 0]} material={M('#F07A2A', 0.6)}><sphereGeometry args={[0.5, 12, 10]} /></mesh><Board position={[0, 2.4, 0]} yaw={yaw} w={2.6} h={1.3} map={yesterdayTex()} poles={1.6} /></group>;
const countTex = (n: number) => board('count' + n, 512, 384, '#F2EFE6', (g) => { g.fillStyle = '#1F3A5C'; g.font = F(700, 54); g.textAlign = 'center'; g.fillText('วันจันทร์มาหา', 256, 90);
  g.fillStyle = '#E2342B'; g.font = F(800, 200); g.fillText(String(n), 256, 290); g.fillStyle = '#1F3A5C'; g.font = F(700, 52); g.fillText('ครั้ง', 256, 360); });
/** the board on the booth that counts Monday's visits */
export const CountBoard: React.FC<{position: V3; yaw?: number; n: number}> = ({position, yaw = 0, n}) => <Board position={position} yaw={yaw} w={0.62} h={0.46} map={countTex(n)} poles={1.3} />;

// ---- the checkpoint: a pontoon on the Sunday side, a booth, a striped barrier along the line
export const PONTOON = {x0: -6.2, x1: -0.7, z0: -2.4, z1: 2.4, top: 0.32};
export const BOOTH: V3 = [-4.7, PONTOON.top, -1.1];
const stripes = () => tex('ep18-stripes', 256, 16, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#FFFFFF' : '#D9332B'; g.fillRect(i * 32, 0, 32, 16); } });
export const Checkpoint: React.FC<{t: number; night?: boolean; clock?: number; count?: number; bar?: number}> = ({t, night = false, clock, count, bar = 0}) => {
  const P = PONTOON; const bob = 0.25 * waveY(-3, 0, t);
  const barM = useMemo(() => new THREE.MeshStandardMaterial({map: stripes(), roughness: 0.6}), []);
  const cx = (P.x0 + P.x1) / 2, cz = (P.z0 + P.z1) / 2;
  const sign = useMemo(() => new THREE.MeshBasicMaterial({map: boothTex(), toneMapped: false}), []);
  return <group position={[0, bob, 0]}>
    <mesh position={[cx, P.top / 2 - 0.05, cz]} material={M('#7E8A93', 0.8)} castShadow receiveShadow><boxGeometry args={[P.x1 - P.x0, P.top + 0.1, P.z1 - P.z0]} /></mesh>
    {[P.z0, P.z1].map((z) => <mesh key={z} position={[cx, P.top + 0.45, z]} material={M('#C9CDD2', 0.4, 0.6)}><boxGeometry args={[P.x1 - P.x0, 0.04, 0.04]} /></mesh>)}
    {[P.z0, P.z1].flatMap((z) => [P.x0 + 0.1, cx, P.x1 - 0.1].map((x) => <mesh key={z + '-' + x} position={[x, P.top + 0.22, z]} material={M('#C9CDD2', 0.4, 0.6)}><cylinderGeometry args={[0.025, 0.025, 0.45, 6]} /></mesh>))}
    {/* booth */}
    <group position={BOOTH}>
      <mesh position={[0, 1.1, 0]} material={M('#F2EFE6', 0.8)} castShadow receiveShadow><boxGeometry args={[1.5, 2.2, 1.5]} /></mesh>
      <mesh position={[0, 2.28, 0]} material={M('#1F3A5C', 0.7)} castShadow><boxGeometry args={[1.8, 0.16, 1.8]} /></mesh>
      <mesh position={[0.755, 1.35, 0.15]} rotation={[0, Math.PI / 2, 0]} material={night ? MB('#FFD58A') : M('#3E5568', 0.2, 0.3)}><planeGeometry args={[0.95, 0.7]} /></mesh>
      <mesh position={[0.08, 1.95, 0.756]} material={MB('#FFFFFF')}><planeGeometry args={[1.3, 0.32]} /></mesh>
      <mesh position={[0.08, 1.95, 0.757]} material={sign}><planeGeometry args={[1.28, 0.3]} /></mesh>
      {clock !== undefined && <WallClock position={[0.762, 2.0 - 0.06, -0.45]} yaw={Math.PI / 2} r={0.15} hours={clock} />}
      {count !== undefined && <CountBoard position={[0.78, 0.95, -0.42]} yaw={Math.PI / 2} n={count} />}
      {night && <><pointLight position={[1.4, 1.9, 0.15]} color="#FFC77A" intensity={2.2} distance={6} decay={1.6} /><Glow p={[0.9, 1.35, 0.15]} c="#FFC77A" s={1.4} o={0.45} />
        <mesh position={[1.0, 2.15, 0.15]} material={MB('#FFE7B0')}><sphereGeometry args={[0.07, 8, 6]} /></mesh></>}
    </group>
    {/* the barrier: two posts on the pontoon's edge, a striped bar along the line (raised by `bar`, 0…1) */}
    {[P.z0 + 0.25, P.z1 - 0.25].map((z) => <mesh key={z} position={[P.x1 - 0.18, P.top + 0.5, z]} material={M('#D9332B', 0.6)} castShadow><boxGeometry args={[0.14, 1.0, 0.14]} /></mesh>)}
    {bar < 1 && <group position={[P.x1 - 0.18, P.top + 0.95, P.z0 + 0.25]} rotation={[-bar * 1.4, 0, 0]}>
      <mesh position={[0, 0, (P.z1 - P.z0 - 0.5) / 2]} rotation={[Math.PI / 2, 0, Math.PI / 2]} material={barM} castShadow><boxGeometry args={[P.z1 - P.z0 - 0.5, 0.09, 0.09]} /></mesh></group>}
  </group>;
};

// =====================================================================================================
// POLICE BOATS (local +x is the bow). lights: 0 = dark, 1 = light bar blinking. hero = adds a real point light (only for the near ones)
// =====================================================================================================
const boatLabel = () => tex('ep18-boatlbl', 512, 96, (g) => { g.fillStyle = '#1F3A5C'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#FFFFFF'; g.font = F(800, 64); g.textAlign = 'center'; g.fillText('ตำรวจน้ำ', 256, 72); });
export const PoliceBoat: React.FC<{position: V3; yaw?: number; t: number; seed?: number; lights?: number; hero?: boolean; scale?: number; wake?: number}> = ({position, yaw = 0, t, seed = 0, lights = 1, hero = false, scale = 1, wake = 0}) => {
  const y = waveY(position[0], position[2], t), pitch = 0.04 * Math.sin(t * 1.6 + seed), roll = 0.05 * Math.sin(t * 1.3 + seed * 2.1);
  const on = Math.floor(t * 7.5 + seed) % 2 === 0;
  const lbl = useMemo(() => new THREE.MeshBasicMaterial({map: boatLabel(), toneMapped: false}), []);
  const foam = useMemo(() => new THREE.MeshBasicMaterial({color: '#FFFFFF', transparent: true, opacity: 0.55, depthWrite: false}), []);
  const W = M('#F4F3EE', 0.6), B = M('#1F4E8C', 0.6);
  return <group position={[position[0], position[1] + y, position[2]]} rotation={[roll, yaw, pitch]} scale={scale}>
    <mesh position={[-0.2, 0.22, 0]} material={W} castShadow receiveShadow><boxGeometry args={[2.8, 0.5, 1.3]} /></mesh>
    <mesh position={[1.2, 0.24, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 1]} material={W} castShadow><boxGeometry args={[0.92, 0.46, 0.92]} /></mesh>
    <mesh position={[0.05, 0.36, 0]} material={B}><boxGeometry args={[3.26, 0.1, 1.33]} /></mesh>
    <mesh position={[-0.2, 0.48, 0]} material={M('#9AA1A8', 0.7)}><boxGeometry args={[2.7, 0.04, 1.2]} /></mesh>
    <mesh position={[-0.55, 0.85, 0]} material={W} castShadow><boxGeometry args={[1.1, 0.72, 1.0]} /></mesh>
    <mesh position={[0.02, 0.92, 0]} rotation={[0, 0, -0.5]} material={M('#22303C', 0.15, 0.5)}><boxGeometry args={[0.06, 0.5, 0.9]} /></mesh>
    <mesh position={[-0.55, 0.95, 0.505]} material={lbl}><planeGeometry args={[0.95, 0.18]} /></mesh>
    <mesh position={[-0.55, 0.95, -0.505]} rotation={[0, Math.PI, 0]} material={lbl}><planeGeometry args={[0.95, 0.18]} /></mesh>
    <mesh position={[-0.55, 1.26, 0.2]} material={lights && on ? MB('#FF3B30') : M('#5A1E1C', 0.5)}><boxGeometry args={[0.22, 0.1, 0.32]} /></mesh>
    <mesh position={[-0.55, 1.26, -0.2]} material={lights && !on ? MB('#3B7BFF') : M('#1C2A55', 0.5)}><boxGeometry args={[0.22, 0.1, 0.32]} /></mesh>
    {hero && lights > 0 && <pointLight position={[-0.55, 1.6, 0]} color={on ? '#FF4A3A' : '#4A7BFF'} intensity={3} distance={9} decay={1.5} />}
    {wake > 0 && <mesh position={[-2.4, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={foam} scale={[wake, 1, 1]}><planeGeometry args={[3.2, 1.0]} /></mesh>}
  </group>;
};

// =====================================================================================================
// THE WEDDING + THE CITIZENSHIP
// =====================================================================================================
const FLOWERS = ['#F6A6C1', '#FFFFFF', '#F7D65A', '#E8546B', '#FFB347'];
/** a bouquet held at `at` (the hand), pointing `up` */
export const Bouquet: React.FC<{at: V3; s?: number}> = ({at, s = 1}) => <group position={at} scale={s}>
  <mesh position={[0, 0.06, 0]} rotation={[Math.PI, 0, 0]} material={M('#4C8C5A', 0.8)}><coneGeometry args={[0.07, 0.2, 8]} /></mesh>
  {Array.from({length: 9}, (_, i) => { const a = i * 2.4, r = i ? 0.055 : 0; return <mesh key={i} position={[Math.cos(a) * r, 0.18 + (i ? 0 : 0.02), Math.sin(a) * r]} material={M(FLOWERS[i % 5], 0.8)}><sphereGeometry args={[0.045, 8, 6]} /></mesh>; })}
</group>;
/** a flower arch over the line: half a torus of flowers, spanning `span` along z, facing ±x */
export const FlowerArch: React.FC<{position: V3; span?: number; k?: number}> = ({position, span = 3.6, k = 1}) => {
  const r = span / 2; const n = 34;
  return <group position={position} scale={[1, k, 1]}>
    <mesh rotation={[0, Math.PI / 2, 0]} material={M('#F2EFE6', 0.6)}><torusGeometry args={[r, 0.05, 6, 32, Math.PI]} /></mesh>
    {Array.from({length: n}, (_, i) => { const a = (i / (n - 1)) * Math.PI; return <mesh key={i} position={[0.05 * (hash(i) - 0.5), Math.sin(a) * r, Math.cos(a) * r]} material={M(FLOWERS[i % 5], 0.8)}><sphereGeometry args={[0.12 + 0.04 * hash(i + 4), 8, 6]} /></mesh>; })}
  </group>;
};
const passTex = (k: number) => tex('ep18-pass', 1024, 680, (g) => {
  g.fillStyle = '#F4EEDC'; g.fillRect(0, 0, 1024, 680); g.fillStyle = '#E6DCC0'; g.fillRect(508, 0, 8, 680);
  g.fillStyle = '#1F3A5C'; g.font = F(800, 46); g.textAlign = 'left'; g.fillText('หนังสือเดินทาง', 40, 70);
  g.fillStyle = '#FBF8EF'; g.fillRect(40, 110, 240, 300); g.fillStyle = '#F2C230'; g.fillRect(40, 110, 240, 70); g.fillStyle = '#3A2A08'; g.font = F(800, 44); g.textAlign = 'center'; g.fillText('จันทร์', 160, 160);
  g.fillStyle = '#26262B'; g.font = F(800, 150); g.fillText('16', 160, 350);
  g.textAlign = 'left'; g.fillStyle = '#55555C'; g.font = F(600, 30);
  const rows: [string, string][] = [['ชื่อ', 'วันจันทร์'], ['สัญชาติ', 'ไทย'], ['เกิด', 'ทุกสัปดาห์'], ['อาชีพ', 'วันแรกของการทำงาน'], ['คู่สมรส', 'ด.ต. ประจำด่าน']];
  rows.forEach(([a, b], i) => { g.fillStyle = '#8A8577'; g.font = F(600, 28); g.fillText(a, 560, 90 + i * 110); g.fillStyle = '#1E1E22'; g.font = F(700, 44); g.fillText(b, 560, 136 + i * 110); });
  g.fillStyle = '#8A8577'; g.font = F(600, 24); g.fillText('ลายมือชื่อ', 40, 470); g.strokeStyle = '#1E1E22'; g.lineWidth = 3; g.beginPath(); g.moveTo(60, 540); g.bezierCurveTo(120, 490, 160, 580, 220, 520); g.stroke();
  void k;
});
const stampTex = () => tex('ep18-stampmark', 512, 512, (g) => { g.clearRect(0, 0, 512, 512); g.strokeStyle = '#D02A24'; g.lineWidth = 22; g.beginPath(); g.arc(256, 256, 210, 0, 7); g.stroke(); g.lineWidth = 8; g.beginPath(); g.arc(256, 256, 172, 0, 7); g.stroke();
  g.fillStyle = '#D02A24'; g.font = F(800, 120); g.textAlign = 'center'; g.fillText('อนุมัติ', 256, 290); });
/** the open passport, lying flat (face up, top towards −z); mark = the red stamp's opacity */
export const Passport: React.FC<{position: V3; yaw?: number; w?: number; mark: number}> = ({position, yaw = 0, w = 0.3, mark}) => {
  const pm = useMemo(() => new THREE.MeshStandardMaterial({map: passTex(0), roughness: 0.9}), []);
  const sm_ = useMemo(() => new THREE.MeshBasicMaterial({map: stampTex(), transparent: true, depthWrite: false, toneMapped: false}), []); sm_.opacity = cl(mark) * 0.9;
  const h = w * 680 / 1024;
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, -0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M('#7A1F2A', 0.7)}><planeGeometry args={[w * 1.04, h * 1.06]} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={pm} receiveShadow><planeGeometry args={[w, h]} /></mesh>
    {mark > 0 && <mesh position={[w * 0.24, 0.002, h * 0.12]} rotation={[-Math.PI / 2, 0, -0.25]} material={sm_}><planeGeometry args={[w * 0.36, w * 0.36]} /></mesh>}
  </group>;
};
/** a rubber stamp (handle up); origin at the bottom of its pad */
export const RubberStamp: React.FC<{position: V3; s?: number}> = ({position, s = 1}) => <group position={position} scale={s}>
  <mesh position={[0, 0.012, 0]} material={M('#2A2A2E', 0.6)}><boxGeometry args={[0.09, 0.024, 0.07]} /></mesh>
  <mesh position={[0, 0.03, 0]} material={M('#9C6B3A', 0.7)}><boxGeometry args={[0.1, 0.02, 0.08]} /></mesh>
  <mesh position={[0, 0.08, 0]} material={M('#7A4D2E', 0.7)}><cylinderGeometry args={[0.018, 0.024, 0.08, 10]} /></mesh>
  <mesh position={[0, 0.135, 0]} material={M('#7A4D2E', 0.7)}><sphereGeometry args={[0.035, 10, 8]} /></mesh>
</group>;

// =====================================================================================================
// v2 (Nox 2026-11-17: say what Monday MEANS): the work it brings, the 300 e-mails, the passport rule at the checkpoint
// =====================================================================================================
const folderTex = (i: number) => tex('ep18-folder' + i, 256, 64, (g) => { g.fillStyle = ['#E9C46A', '#8FB3D9', '#E07A5F', '#CFCFC4'][i % 4]; g.fillRect(0, 0, 256, 64);
  if (i % 2 === 0) { g.fillStyle = '#C0392B'; g.fillRect(150, 14, 96, 36); g.fillStyle = '#FFF'; g.font = F(800, 26); g.textAlign = 'center'; g.fillText('ด่วน', 198, 42); } });
/** a tall pile of work folders (origin at its bottom); `drop` = metres above where it lands */
export const WorkPile: React.FC<{position: V3; n?: number; drop?: number; yaw?: number}> = ({position, n = 14, drop = 0, yaw = 0}) => {
  const mats = useMemo(() => [0, 1, 2, 3].map((i) => new THREE.MeshStandardMaterial({map: folderTex(i), roughness: 0.85})), []);
  return <group position={[position[0], position[1] + drop, position[2]]} rotation={[0, yaw, 0]}>
    {Array.from({length: n}, (_, i) => <mesh key={i} castShadow receiveShadow position={[0.02 * Math.sin(i * 2.3), 0.035 * i + 0.0175, 0.02 * Math.cos(i * 1.7)]} rotation={[0, 0.12 * Math.sin(i * 3.1), 0]} material={mats[i % 4]}><boxGeometry args={[0.34, 0.034, 0.25]} /></mesh>)}
  </group>;
};
const mailTex = (n: number) => tex('ep18-mail' + n, 512, 340, (g) => {
  g.fillStyle = '#F4F6FA'; g.fillRect(0, 0, 512, 340); g.fillStyle = '#2E5BBA'; g.fillRect(0, 0, 512, 60); g.fillStyle = '#FFF'; g.font = F(700, 34); g.textAlign = 'left'; g.fillText('กล่องจดหมาย', 20, 42);
  g.fillStyle = '#D02A24'; g.beginPath(); g.roundRect(360, 10, 140, 42, 21); g.fill(); g.fillStyle = '#FFF'; g.font = F(800, 32); g.textAlign = 'center'; g.fillText(String(n), 430, 42);
  const rows = ['ด่วนที่สุด: งานเมื่อวาน', 'ประชุม 8:00 น.', 'แก้งานอีกรอบ', 'ทำไมยังไม่ส่ง', 'ด่วน!!!']; g.textAlign = 'left';
  rows.forEach((r, i) => { g.fillStyle = i % 2 ? '#FFFFFF' : '#EEF1F7'; g.fillRect(0, 70 + i * 54, 512, 54); g.fillStyle = '#1E1E22'; g.font = F(700, 28); g.fillText(r, 24, 106 + i * 54); g.fillStyle = '#2E5BBA'; g.beginPath(); g.arc(490, 97 + i * 54, 8, 0, 7); g.fill(); });
});
/** an open laptop (origin at the hinge, base towards +z, screen facing +z); count = unread e-mails (stepped by 10) */
export const Laptop: React.FC<{position: V3; yaw?: number; count: number; s?: number}> = ({position, yaw = 0, count, s = 1}) => {
  const n = Math.min(300, Math.round(count / 10) * 10);
  const scr = useMemo(() => new THREE.MeshBasicMaterial({map: mailTex(n), toneMapped: false}), [n]);
  return <group position={position} rotation={[0, yaw, 0]} scale={s}>
    <mesh position={[0, 0.008, 0.13]} material={M('#3A3D44', 0.4, 0.5)} castShadow><boxGeometry args={[0.4, 0.016, 0.27]} /></mesh>
    <group rotation={[-0.25, 0, 0]}><mesh position={[0, 0.135, -0.006]} material={M('#3A3D44', 0.4, 0.5)} castShadow><boxGeometry args={[0.4, 0.27, 0.012]} /></mesh>
      <mesh position={[0, 0.135, 0.001]} material={scr}><planeGeometry args={[0.37, 0.245]} /></mesh></group>
    <pointLight position={[0, 0.2, 0.25]} color="#CFE0FF" intensity={0.5} distance={1.5} decay={1.5} />
  </group>;
};
const ruleTex = () => tex('ep18-rule', 768, 384, (g) => { g.fillStyle = '#F2C230'; g.fillRect(0, 0, 768, 384); g.strokeStyle = '#1E1E22'; g.lineWidth = 14; g.strokeRect(14, 14, 740, 356);
  g.fillStyle = '#1E1E22'; g.font = F(800, 74); g.textAlign = 'center'; g.fillText('ข้ามเส้นนี้', 384, 140); g.font = F(800, 92); g.fillStyle = '#C0392B'; g.fillText('แสดงพาสปอร์ต', 384, 270); });
/** the rule, on a post at the barrier: yellow board facing local +z */
export const RuleSign: React.FC<{position: V3; yaw?: number}> = ({position, yaw = 0}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({map: ruleTex(), roughness: 0.7}), []);
  return <group position={position} rotation={[0, yaw, 0]}><mesh position={[0, 1.55, 0]} material={m} castShadow><boxGeometry args={[1.1, 0.55, 0.04]} /></mesh>
    <mesh position={[0, 0.65, -0.03]} material={M('#6A6E75', 0.5, 0.5)}><cylinderGeometry args={[0.035, 0.035, 1.3, 6]} /></mesh></group>;
};
