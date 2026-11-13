import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, tex, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {Glow} from '../AbsurdEp7/props';
import {label} from '../AbsurdEp8/props';
import {HANDLE} from './data';

/** EP15 คดีดวงจันทร์ — the new things: the Moon (the accused, no face), the man's open-top car, the night roads, the evidence board.
 *  Every surface is a painted material (PM) — no flat single colours (ref6 look). */
export type V3 = [number, number, number];
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const Bx: React.FC<{p: V3; s: V3; c: string; k?: string; r?: V3; cast?: boolean}> = ({p, s, c, k = '', r, cast = true}) =>
  <mesh position={p} rotation={r} castShadow={cast} receiveShadow material={PM(c, k)}><boxGeometry args={s} /></mesh>;
const glowMat = (c: string, o: number) => new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide});

// =====================================================================================================
// THE MOON: a faceted cream ball with crater patches, lit from inside so it reads at night, a soft halo for the bloom.
// No face (ref6): it acts through where it is in the sky, its size, its light (dim = caught) and the tag hung on it.
// =====================================================================================================
const moonGeo = () => {
  const g = new THREE.IcosahedronGeometry(1, 3); const p = g.attributes.position; const col = new Float32Array(p.count * 3);
  const A = new THREE.Color('#EDE7D2'), B = new THREE.Color('#D6CFB8'), C = new THREE.Color('#B9B29C');
  const craters = Array.from({length: 11}, (_, i) => { const u = hash(i * 3.3) * 2 - 1, th = hash(i * 7.1) * 6.283, s = Math.sqrt(1 - u * u); return {v: new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th)), r: 0.16 + hash(i * 1.9) * 0.2}; });
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    v.set((p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3).normalize();
    const inC = craters.some((c) => v.distanceTo(c.v) < c.r), rim = craters.some((c) => { const d = v.distanceTo(c.v); return d >= c.r && d < c.r + 0.06; });
    const c = inC ? C : rim ? A : hash(i) > 0.7 ? B : A;
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
};
let MOON_GEO: THREE.BufferGeometry | null = null;
// indoors (glow < 0.3) the surface is darkened so the interrogation lamp does not burn it out to a light bulb
const moonMat = (glow: number, indoor: boolean) => new THREE.MeshLambertMaterial({vertexColors: true, flatShading: true, color: indoor ? '#8C897E' : '#FFFFFF', emissive: new THREE.Color('#8E8A74'), emissiveIntensity: glow});
const MOON_MATS = new Map<number, THREE.Material>();
export const Moon: React.FC<{t: number; position: V3; r: number; glow?: number; spin?: number; tag?: string | null; tagDrop?: number; squash?: number; shake?: number}> = ({t, position, r, glow = 1, spin = 0, tag = null, tagDrop = 1, squash = 1, shake = 0}) => {
  MOON_GEO ??= moonGeo(); const gk = Math.round(glow * 10) / 10; if (!MOON_MATS.has(gk)) MOON_MATS.set(gk, moonMat(gk < 0.3 ? 0.12 : 0.25 + gk * 0.75, gk < 0.3));
  const j: V3 = shake ? [Math.sin(t * 53) * 0.02 * r * shake, Math.abs(Math.sin(t * 67)) * 0.015 * r * shake, 0] : [0, 0, 0];
  const bounce = tagDrop < 1 ? 0 : 0;
  return <group position={[position[0] + j[0], position[1] + j[1], position[2]]}>
    <mesh castShadow geometry={MOON_GEO} material={MOON_MATS.get(gk)!} rotation={[0.3, spin, 0.1]} scale={[r, r * squash, r]} />
    <Glow p={[0, 0, 0]} c="#FFF3CF" s={r * 3.8} o={0.26 * glow} />
    {tag && <group position={[0, -r * squash - 0.02 - (1 - cl(tagDrop)) * r * 3 + bounce, r * 0.2]}>
      <mesh position={[0, -r * 0.14, 0]} material={PM('#2A2622', 'string')}><boxGeometry args={[r * 0.02, r * 0.28, r * 0.02]} /></mesh>
      <mesh position={[0, -r * 0.5, 0]} rotation={[0, 0, Math.sin(t * 2.3) * 0.08]} material={label('ep15tag' + tag, 512, 256, '#F2E6C8', '#1B2831', [tag], 120, '#B0302E')}><planeGeometry args={[r * 0.95, r * 0.475]} /></mesh>
    </group>}
  </group>;
};
/** night sky: seeded stars on a far shell (points, so they stay out of the AO pass) */
const STARS = (() => { const out: number[] = []; for (let i = 0; i < 900; i++) { const u = hash(i) * 0.95 + 0.05, th = hash(i + 5000) * Math.PI * 2, s = Math.sqrt(1 - u * u); out.push(s * Math.cos(th) * 380, u * 380, s * Math.sin(th) * 380); } return new Float32Array(out); })();
export const NightSky: React.FC = () => <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[STARS, 3]} /></bufferGeometry>
  <pointsMaterial color="#DCE4F4" size={2} sizeAttenuation={false} toneMapped={false} fog={false} /></points>;

// =====================================================================================================
// THE MAN'S CAR: a small open-top roadster so the driver reads from every angle. Local front = +z, right-hand drive (seat at x −0.38).
// carPt(car, forward, right, up) → world point; the driver's right is the car's right (local −x).
// =====================================================================================================
export type CarPose = {x: number; z: number; yaw: number};
export const carPt = (c: CarPose, f: number, r: number, u: number): V3 => [c.x + Math.sin(c.yaw) * f - Math.cos(c.yaw) * r, u, c.z + Math.cos(c.yaw) * f + Math.sin(c.yaw) * r];
export const SEAT = {f: -0.2, r: 0.38, lift: 0.08}, WHEEL = {f: 0.42, r: 0.38, u: 1.0, rad: 0.17};
export const ManCar: React.FC<{car: CarPose; t: number; steer?: number; roll?: number; lights?: number; brake?: number; pitch?: number}> = ({car, t, steer = 0, roll = 0, lights = 1, brake = 0, pitch = 0}) => {
  const body = '#F0A21C', dark = '#2A2D30';
  const glass = useMemo(() => new THREE.MeshBasicMaterial({color: '#BFE0F0', transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide}), []);
  return <group position={[car.x, 0, car.z]} rotation={[pitch, car.yaw, 0, 'YXZ'] as any}>
    {/* tub: sills, nose, tail (open cockpit between them) */}
    <Bx p={[0, 0.5, 1.45]} s={[1.66, 0.5, 1.3]} c={body} k="car" /><Bx p={[0, 0.5, -1.45]} s={[1.66, 0.5, 1.1]} c={body} k="car" />
    <Bx p={[0, 0.32, 0]} s={[1.66, 0.14, 4.0]} c={body} k="car" />
    {[-1, 1].map((s) => <Bx key={s} p={[s * 0.79, 0.6, -0.2]} s={[0.1, 0.42, 2.0]} c={body} k="car" />)}
    <Bx p={[0, 0.72, 0.72]} s={[1.5, 0.12, 0.3]} c={dark} k="dash" /><Bx p={[0, 0.2, 2.06]} s={[1.7, 0.16, 0.1]} c={dark} k="dash" /><Bx p={[0, 0.22, -2.03]} s={[1.7, 0.16, 0.1]} c={dark} k="dash" />
    {/* windshield frame + glass */}
    {[-1, 1].map((s) => <Bx key={'a' + s} p={[s * 0.76, 0.92, 0.89]} s={[0.05, 0.34, 0.05]} c={dark} k="dash" r={[-0.3, 0, 0]} />)}
    <Bx p={[0, 1.08, 0.84]} s={[1.57, 0.04, 0.04]} c={dark} k="dash" />
    <mesh position={[0, 0.93, 0.89]} rotation={[-0.3, 0, 0]} material={glass}><planeGeometry args={[1.5, 0.3]} /></mesh>
    {/* seats */}
    {[-1, 1].map((s) => <group key={'s' + s} position={[s * 0.38, 0, -0.25]}><Bx p={[0, 0.47, 0]} s={[0.5, 0.12, 0.5]} c="#7A3B2E" k="seat" /><Bx p={[0, 0.82, -0.27]} s={[0.5, 0.62, 0.1]} c="#7A3B2E" k="seat" r={[-0.12, 0, 0]} /></group>)}
    {/* steering wheel (driver = local −x) */}
    <group position={[-WHEEL.r, WHEEL.u, WHEEL.f]} rotation={[-1.05, 0, 0]}><group rotation={[0, 0, steer]}>
      <mesh material={PM(dark, 'dash')}><torusGeometry args={[WHEEL.rad, 0.022, 6, 18]} /></mesh><Bx p={[0, 0, 0]} s={[WHEEL.rad * 2, 0.03, 0.02]} c={dark} k="dash" cast={false} /></group></group>
    <Bx p={[-WHEEL.r, 0.88, 0.56]} s={[0.04, 0.04, 0.3]} c={dark} k="dash" r={[0.5, 0, 0]} cast={false} />
    {/* wheels */}
    {[[0.8, 1.3], [-0.8, 1.3], [0.8, -1.3], [-0.8, -1.3]].map(([x, z], i) => <group key={i} position={[x, 0.31, z]} rotation={[roll, z > 0 ? -steer * 0.5 : 0, Math.PI / 2]}>
      <mesh castShadow material={PM('#17181B', 'tyre')}><cylinderGeometry args={[0.31, 0.31, 0.2, 12]} /></mesh>
      <mesh position={[0, x > 0 ? 0.105 : -0.105, 0]} material={PM('#B9BEC2', 'hub')}><cylinderGeometry args={[0.16, 0.16, 0.02, 8]} /></mesh></group>)}
    {/* lamps: emissive so they bloom; a pool of light on the road ahead */}
    {[-0.58, 0.58].map((x) => <React.Fragment key={x}><mesh position={[x, 0.56, 2.11]} material={MB(lights > 0.05 ? '#FFF6DA' : '#B9B6A8')}><boxGeometry args={[0.32, 0.14, 0.04]} /></mesh>
      {lights > 0.05 && <Glow p={[x, 0.56, 2.2]} c="#FFF0C8" s={1.1 * lights} o={0.8} />}
      <mesh position={[x, 0.56, -2.01]} material={MB(brake > 0.5 ? '#FF4433' : '#B0241C')}><boxGeometry args={[0.3, 0.12, 0.04]} /></mesh>
      {brake > 0.5 && <Glow p={[x, 0.56, -2.1]} c="#FF4A3A" s={0.9} o={0.8} />}</React.Fragment>)}
    {lights > 0.05 && <mesh position={[0, 0.03, 5.6]} rotation={[-Math.PI / 2, 0, 0]} material={glowMat('#FFE9B8', 0.22 * lights)}><planeGeometry args={[3.6, 7]} /></mesh>}
    <mesh position={[0, 0.5, -2.012]} material={label('ep15plate', 256, 96, '#F1EEE4', '#17181B', [HANDLE], 34)}><planeGeometry args={[0.62, 0.2]} /></mesh>
  </group>;
};

// =====================================================================================================
// NIGHT ROADS. grid = a small town grid (north–south roads at x 0 and 40, east–west roads at z 0 and 40) with houses, lamps and trees;
// highway = one wide road along z with a median, rails, lamps and a far skyline. Both carry their own night lights.
// =====================================================================================================
const Lamp: React.FC<{p: V3; side: number; light?: boolean}> = ({p, side, light = false}) => <group position={p}>
  <Bx p={[0, 2.6, 0]} s={[0.12, 5.2, 0.12]} c="#3A3F45" k="pole" /><Bx p={[side * 0.7, 5.2, 0]} s={[1.5, 0.1, 0.12]} c="#3A3F45" k="pole" cast={false} />
  <mesh position={[side * 1.35, 5.1, 0]} material={MB('#FFE3A6')}><boxGeometry args={[0.5, 0.12, 0.26]} /></mesh><Glow p={[side * 1.35, 5.0, 0]} c="#FFD98A" s={3.2} o={0.55} />
  <mesh position={[side * 1.35, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glowMat('#FFD98A', 0.13)}><circleGeometry args={[4.2, 20]} /></mesh>
  {light && <pointLight position={[side * 1.35, 4.8, 0]} color="#FFD49A" intensity={26} distance={16} decay={1.7} />}
</group>;
const House: React.FC<{p: V3; yaw: number; seed: number}> = ({p, yaw, seed}) => { const w = 7 + hash(seed) * 3, h = 3.2 + (hash(seed * 3) > 0.5 ? 3 : 0), d = 7;
  const wall = ['#CDBFA6', '#B9B0A0', '#A9B6AC', '#C7AD98'][seed % 4], roof = ['#7A3B2E', '#3F4A55', '#5A4A3C'][seed % 3];
  return <group position={p} rotation={[0, yaw, 0]}>
    <Bx p={[0, h / 2, 0]} s={[w, h, d]} c={wall} k="house" /><Bx p={[0, h + 0.25, 0]} s={[w + 0.7, 0.5, d + 0.7]} c={roof} k="roof" />
    {Array.from({length: h > 4 ? 6 : 3}, (_, i) => { const lit = hash(seed * 7 + i) > 0.45; return <mesh key={i} position={[-w * 0.3 + (i % 3) * w * 0.3, 1.6 + Math.floor(i / 3) * 3, d / 2 + 0.01]} material={MB(lit ? (hash(seed + i) > 0.7 ? '#9FC8FF' : '#FFD98A') : '#1A222E')}><planeGeometry args={[1.3, 1.1]} /></mesh>; })}
    <Bx p={[w * 0.32, 1.0, d / 2 + 0.02]} s={[1.0, 2.0, 0.06]} c="#5A3E2C" k="door" cast={false} />
  </group>; };
const Tree: React.FC<{p: V3; seed: number}> = ({p, seed}) => <group position={p}><Bx p={[0, 1.0, 0]} s={[0.25, 2.0, 0.25]} c="#4A3626" k="trunk" />
  <mesh castShadow position={[0, 2.9 + hash(seed) * 0.5, 0]} rotation={[0, hash(seed * 3) * 3, 0]} material={PM('#27432F', 'leaf')}><icosahedronGeometry args={[1.3 + hash(seed * 5) * 0.5, 0]} /></mesh></group>;
const Dashes: React.FC<{a: V3; b: V3; n: number}> = ({a, b, n}) => { const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
  return <>{Array.from({length: n}, (_, i) => { const f = (i + 0.5) / n; return <mesh key={i} position={[a[0] + (b[0] - a[0]) * f, 0.012, a[2] + (b[2] - a[2]) * f]} rotation={[-Math.PI / 2, 0, -yaw]} material={PM('#D9D3BE', 'dash')}><planeGeometry args={[0.16, 2.2]} /></mesh>; })}</>; };
const NightLights: React.FC<{moon: V3}> = ({moon}) => <><hemisphereLight args={['#5468A0', '#141820', 0.75]} />
  <directionalLight position={moon} color="#DCE4FF" intensity={0.95} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={260} shadow-bias={-0.0008} /></>;
export const TownGrid: React.FC<{moon: V3; focus?: [number, number]}> = ({moon, focus = [0, 0]}) => {
  const lots = useMemo(() => { const out: {p: V3; yaw: number; seed: number}[] = []; let s = 1;
    for (const cx of [-20, 20, 60]) for (const cz of [-20, 20, 60]) for (const [dx, dz, yaw] of [[-9, -9, 0], [9, -9, 0], [-9, 9, Math.PI], [9, 9, Math.PI], [0, 0, Math.PI / 2]] as const) out.push({p: [cx + dx, 0, cz + dz], yaw: yaw + (dz < 0 ? Math.PI : 0), seed: s++});
    return out; }, []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, -0.02, 20]} receiveShadow material={PM('#22352A', 'grass')}><planeGeometry args={[240, 240]} /></mesh>
    {[0, 40].map((x) => <mesh key={'ns' + x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 20]} receiveShadow material={PM('#33363C', 'asph')}><planeGeometry args={[7.5, 240]} /></mesh>)}
    {[0, 40].map((z) => <mesh key={'ew' + z} rotation={[-Math.PI / 2, 0, 0]} position={[20, 0.003, z]} receiveShadow material={PM('#33363C', 'asph')}><planeGeometry args={[240, 7.5]} /></mesh>)}
    {[0, 40].map((x) => <React.Fragment key={'d' + x}><Dashes a={[x, 0, -70]} b={[x, 0, -5]} n={13} /><Dashes a={[x, 0, 5]} b={[x, 0, 35]} n={6} /><Dashes a={[x, 0, 45]} b={[x, 0, 100]} n={11} /></React.Fragment>)}
    {[0, 40].map((z) => <React.Fragment key={'e' + z}><Dashes a={[-70, 0, z]} b={[-5, 0, z]} n={13} /><Dashes a={[5, 0, z]} b={[35, 0, z]} n={6} /><Dashes a={[45, 0, z]} b={[100, 0, z]} n={11} /></React.Fragment>)}
    {lots.map((l) => <House key={l.seed} {...l} />)}
    {lots.filter((l) => l.seed % 2 === 0).map((l) => <Tree key={'t' + l.seed} p={[l.p[0] + 5.5, 0, l.p[2] + (hash(l.seed) - 0.5) * 3]} seed={l.seed} />)}
    {[0, 40].map((x) => [-48, -30, -12, 8, 26, 48, 66].map((z, i) => <Lamp key={x + ':' + z} p={[x + (i % 2 ? 4.3 : -4.3), 0, z]} side={i % 2 ? -1 : 1} light={Math.hypot(x - focus[0], z - focus[1]) < 22} />))}
    {[0, 40].map((z) => [-30, 14, 28, 58].map((x, i) => <Lamp key={'e' + z + ':' + x} p={[x, 0, z + (i % 2 ? 4.3 : -4.3)]} side={0} light={Math.hypot(x - focus[0], z - focus[1]) < 22} />))}
    <NightLights moon={moon} /><NightSky />
  </group>;
};

// =====================================================================================================
// THE EVIDENCE BOARD (interrogation result): left card "ชายคนนี้" gets a red ✕ (cross 0…1), right card "โลก" gets a red ring (ring 0…1)
// and a dashed orbit with the Moon on it. Faces local +z; size 1.6 × 1.0, centre at its origin.
// =====================================================================================================
const boardTex = () => new THREE.MeshBasicMaterial({toneMapped: false, map: tex('ep15-board', 1024, 640, (g) => {
  g.fillStyle = '#E9E2CF'; g.fillRect(0, 0, 1024, 640); g.strokeStyle = '#6E5A44'; g.lineWidth = 22; g.strokeRect(11, 11, 1002, 618);
  g.fillStyle = '#1B2831'; g.font = F(700, 50); g.textAlign = 'center'; g.fillText('มันตามใคร?', 512, 84); g.font = F(500, 22); g.fillStyle = '#7A6E5C'; g.fillText('คดี 15 · ' + HANDLE, 512, 116);
  // left card: the man in his car
  g.fillStyle = '#FBF8EE'; g.fillRect(84, 170, 360, 300); g.strokeStyle = '#1B2831'; g.lineWidth = 5; g.strokeRect(84, 170, 360, 300);
  g.fillStyle = '#E3B341'; g.fillRect(150, 330, 230, 60); g.fillStyle = '#17181B'; g.beginPath(); g.arc(200, 396, 26, 0, 6.3); g.arc(330, 396, 26, 0, 6.3); g.fill();
  g.fillStyle = '#5E7BA0'; g.fillRect(238, 262, 54, 68); g.fillStyle = '#D4B59E'; g.fillRect(240, 214, 50, 50); g.fillStyle = '#141210'; g.fillRect(236, 204, 58, 20);
  g.fillStyle = '#1B2831'; g.font = F(700, 44); g.fillText('ชายคนนี้', 264, 530);
  // right card: the Earth, with a dashed orbit
  g.fillStyle = '#FBF8EE'; g.fillRect(580, 170, 360, 300); g.strokeRect(580, 170, 360, 300);
  g.fillStyle = '#2F7FC1'; g.beginPath(); g.arc(760, 320, 70, 0, 6.3); g.fill(); g.fillStyle = '#5FA04E'; g.beginPath(); g.ellipse(735, 300, 28, 20, 0.4, 0, 6.3); g.ellipse(790, 345, 22, 16, -0.3, 0, 6.3); g.fill();
  g.strokeStyle = '#1B2831'; g.setLineDash([12, 10]); g.lineWidth = 4; g.beginPath(); g.ellipse(760, 320, 150, 110, 0, 0, 6.3); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#1B2831'; g.fillText('โลก', 760, 530);
})});
export const Board: React.FC<{position: V3; yaw?: number; t: number; cross: number; ring: number}> = ({position, yaw = 0, t, cross, ring}) => {
  const mat = useMemo(boardTex, []); const red = MB('#C8301F');
  const k1 = cl(cross * 2), k2 = cl(cross * 2 - 1); const a = t * 2.2; // the Moon icon rides the dashed orbit
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh material={mat}><planeGeometry args={[1.6, 1.0]} /></mesh>
    <Bx p={[0, 0, -0.03]} s={[1.68, 1.08, 0.04]} c="#6E5A44" k="frame" />
    {[-0.7, 0.7].map((x) => <Bx key={x} p={[x, -1.0, -0.03]} s={[0.05, 1.0, 0.05]} c="#3A3F45" k="pole" />)}
    {/* ✕ on the man (two strokes, 3 frames each) */}
    {k1 > 0 && <mesh position={[-0.387, 0, 0.004]} rotation={[0, 0, 0.72]} material={red}><planeGeometry args={[0.62 * k1, 0.05]} /></mesh>}
    {k2 > 0 && <mesh position={[-0.387, 0, 0.005]} rotation={[0, 0, -0.72]} material={red}><planeGeometry args={[0.62 * k2, 0.05]} /></mesh>}
    {/* ring round the Earth */}
    {ring > 0 && <mesh position={[0.387, 0, 0.004]} rotation={[0, 0, 1.2]} material={red}><ringGeometry args={[0.19, 0.215, 40, 1, 0, Math.PI * 2 * cl(ring)]} /></mesh>}
    <mesh position={[0.387 + Math.cos(a) * 0.234, Math.sin(a) * 0.172, 0.006]} material={MB('#EDE7D2')}><circleGeometry args={[0.035, 14]} /></mesh>
  </group>;
};
/** a paper cup of coffee (the all-night interrogation) */
export const Cup: React.FC<{p: V3; k?: number}> = ({p, k = 1}) => k <= 0 ? null : <group position={p} scale={k}>
  <mesh castShadow position={[0, 0.05, 0]} material={PM('#F2F0EA', 'cup')}><cylinderGeometry args={[0.038, 0.03, 0.1, 10]} /></mesh>
  <mesh position={[0, 0.101, 0]} rotation={[-Math.PI / 2, 0, 0]} material={PM('#3A2618', 'coffee')}><circleGeometry args={[0.034, 10]} /></mesh></group>;
