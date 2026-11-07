import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, fingers, handTo, hc} from '../../pov/acting/ik';
import {ev, V3, sm, cl, lerp, lerp3, shake, pop, LN} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Bedroom, Street, Interro, Court, Cell, TABLE_TOP} from '../AbsurdEp1/sets';
import {Mosquito, Handcuffs, makeGavel, makePhone} from '../AbsurdEp1/props';
import {Fan, Wind, EchoRing, Arm} from '../AbsurdEp2/props';
import {Dust, Smog, Heli, Vacuum, NOZZLE, Jar3, JAR_R, TableRing, CaseFolder3, Plate, Calendar3, BigPlate3, PrisonOutside, PRISON_WIN} from './props';

type Inst = any;
type Cast = Record<string, Inst>;
export type Cam = {pos: V3; look: V3; fov: number; roll?: number};
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---- people, staged by hand per shot (same helpers as EP1/EP2)
type PSo = {poseId?: string; clip?: string; moving?: boolean; talkK?: number; fear?: number; lookW?: V3; face?: string};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...POSES.stand({t, phase: 0, talking: false, seed: id.length, speed: 0}), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: 0, poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
};
const wraps = new Map<Inst, THREE.Group>();
const body = (I: Inst, s: any, t: number, y = 0): THREE.Group => {
  let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, y, s.z); w.rotation.set(0, s.yaw, 0, 'YXZ'); w.scale.setScalar(I.scale); w.updateMatrixWorld(true);
  if (s.lookW) s.pose.lookL = new THREE.Vector3(...toLocal(I, s, s.lookW) as any);
  drive(I, s, t); w.updateMatrixWorld(true);
  if (s.face) setFace(I, s.face); else autoFace(I, t, {talk: s.talkK, fear: s.fear, seed: s.id.length * 3.1});
  return w;
};
const bw = (I: Inst, bone: string): V3 => { const v = I.bones[bone].getWorldPosition(new THREE.Vector3()); return [v.x, v.y, v.z]; };
const P: React.FC<{o: THREE.Object3D}> = ({o}) => <primitive object={o} />;
const attached = new WeakMap<Inst, Record<string, THREE.Object3D>>();
const prop = (I: Inst, key: string, bone: string, make: () => THREE.Object3D, p: V3, r: V3) => {
  let a = attached.get(I); if (!a) { a = {}; attached.set(I, a); }
  if (!a[key]) { const o = make(); o.position.set(...p); o.rotation.set(...r); I.bones[bone].add(o); a[key] = o; }
  return a[key];
};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const along = (pts: V3[], k: number): V3 => { const n = pts.length - 1; const u = cl(k) * n; const i = Math.min(n - 1, Math.floor(u)); return lerp3(pts[i], pts[i + 1], u - i); };

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.01; c.far = 400; c.updateProjectionMatrix();
  return null;
};

// =====================================================================================================
// BEDROOM, morning. The window is on the west wall (x −2.1, z −0.5). He stands at it facing −x.
// =====================================================================================================
const MAN_W = {x: -1.72, z: -0.5, yaw: -Math.PI / 2};
const MAN_R = {x: -1.62, z: -0.38, yaw: Math.PI / 2};       // after the sneeze he has turned to face the room
const room = (t: number, o: {hideS?: boolean} = {}) => <><Bedroom st={{t, lamp: 0, day: 1, open: sm((t - ev('window')) / 0.5), hideS: o.hideS}} />
  <Calendar3 position={[-2.088, 1.62, -1.25]} rotation={[0, Math.PI / 2, 0]} /></>;
const atWindow = (C: Cast, t: number, breathe: number, sneeze = 0) => {
  const face = sneeze > 0.3 ? 'closed' : breathe > 0.4 ? 'closed' : undefined;
  const s = ps('nai', MAN_W.x, MAN_W.z, MAN_W.yaw, t, {clip: 'idle_neutral_01', face});
  const w = body(C.nai, s, t); const I = C.nai;
  rot(I.bones.Bip01_Head, 0, 0, 1, breathe * 0.22 - sneeze * 0.5, I.root);
  rot(I.bones.Bip01_Spine2, 0, 0, 1, breathe * 0.08 - sneeze * 0.18, I.root);
  w.updateMatrixWorld(true); return w;
};
/** the front of his face (nostrils), from the head bone */
const noseOf = (I: Inst, yaw: number): V3 => { const h = bw(I, 'Bip01_Head'); return [h[0] + Math.sin(yaw) * 0.14, h[1] + 0.1, h[2] + Math.cos(yaw) * 0.14]; };
const breathK = (t: number) => sm((t - 1.1) / 0.9) * (0.75 + 0.25 * Math.sin(t * 2.2));

// =====================================================================================================
// THE SKY OPERATION. His house is the middle townhouse of the EP1 street; the upstairs window is WIN.
// =====================================================================================================
const WIN: V3 = [1.06, 5.15, -4.72];
const HELIS: {p: V3; bank: number}[] = [{p: [-10, 12, 3], bank: 0.08}, {p: [-4.5, 15, 7], bank: -0.05}, {p: [3, 14, 8], bank: 0.06}, {p: [10, 12.5, 4], bank: -0.08}, {p: [-7, 10, -1], bank: 0.04}, {p: [7.5, 9.5, 0.5], bank: -0.04}];
const yawTo = (p: V3, q: V3) => Math.atan2(-(q[2] - p[2]), q[0] - p[0]);
const daylight = (k = 1) => <><hemisphereLight args={['#E2E6E0', '#4A4A44', 0.95 * k]} /><directionalLight position={[-12, 20, 14]} color="#FFF1D6" intensity={1.4 * k} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={16} shadow-camera-bottom={-6} shadow-bias={-0.0006} /></>;
const SMOG_C = new THREE.Color('#A7AAA2'), CLEAR_C = new THREE.Color('#8EC2E6');
const skyK = (t: number) => sm((t - (ev('vacOn') + 0.4)) / (ev('suck1') - ev('vacOn') - 0.4));
const skyBg = (t: number): Bg => { const c = SMOG_C.clone().lerp(CLEAR_C, skyK(t)); return {color: '#' + c.getHexString(), fog: ['#' + c.getHexString(), 30, 140]}; };
const LEAD: V3 = [0, 16.5, 0]; const CAN: V3 = [0, 10.4, 0]; const MOUTH: V3 = add3(add3(CAN, NOZZLE), [0, 0.5, 0]);
const NSMOG = 46;
const smogField = (t: number) => {
  const a = ev('vacOn') + 0.4, b = ev('suck1');
  return Array.from({length: NSMOG}, (_, i) => {
    const p0: V3 = [(hash(i) - 0.5) * 70, 15 + hash(i * 2.1) * 22, -12 - hash(i * 3.3) * 40];
    const drift: V3 = [Math.sin(t * 0.3 + i) * 0.6, Math.sin(t * 0.4 + i * 2) * 0.3, 0];
    const ti = lerp(a, b, hash(i * 5.7)); const k = sm((t - (ti - 0.55)) / 0.55);
    const p = lerp3(add3(p0, drift), MOUTH, k * k); const r = (2.2 + hash(i * 7.1) * 2.6) * (1 - k * 0.92);
    return t >= ti ? null : <Smog key={i} position={p} r={r} spin={i} />;
  });
};

// =====================================================================================================
// THE CELL BLOCK. Cells: 18 at x −3.05 (the mosquito, flat on its wall), 19 at 0 (the fan), 20 at +3.05.
// Bars at z 1.5, a corridor outside. Cell 20's high window (local 0.6, 2.25, −1.5) is the way out.
// =====================================================================================================
const CX = {c18: -3.05, c19: 0, c20: 3.05};
const FAN_C: V3 = [0.25, 0, -0.3]; const FAN_C_YAW = -0.25;
const WALL18: V3 = [-1.475, 1.32, -0.25];
const CELL_BG: Bg = {color: '#2E3A38'};
/** the fan's head: oscillating 18 ↔ 20, it locks on 20 just before the blow, then oscillates again after sentencing */
const fanYaw = (t: number) => { const L = ev('turnLock'), N = ev('nail1'); return t < L ? 0.9 * Math.cos((t - L) * 1.7) : t < N ? 0.9 + Math.sin(t * 40) * 0.01 : 0.9 * Math.cos((t - N) * 1.1); };
const bladeRun = (t: number) => t * 31;
const Corridor: React.FC = () => <group>
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.4]}><planeGeometry args={[14, 4]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.4, 5.4]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh>
  <mesh position={[0, 4.6, 1.47]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8C9088" /></mesh>
  <Plate lines={['แดนขัง']} position={[0, 3.3, 1.5]} w={1.5} aspect={3.4} />
</group>;
const Cell19: React.FC<{t: number; old?: boolean}> = ({t, old = true}) => <group>
  <Cell t={t} days={0.45} marks={0} />
  <Fan position={FAN_C} yaw={FAN_C_YAW} headYaw={fanYaw(t)} blade={bladeRun(t)} blur={1} lit={3} />
  <Plate lines={['นช. พัดลม 019']} position={[FAN_C[0] - 0.01, 0.72, FAN_C[2] + 0.03]} rotation={[0, FAN_C_YAW, 0]} w={0.17} aspect={2.8} bg="#E6E7CF" fg="#152028" />
  <Plate lines={['ห้อง 19']} position={[0, 2.12, 1.54]} w={0.64} />
  {old && <Plate lines={['20 ปี']} position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />}
</group>;
const Cell18: React.FC<{t: number}> = ({t}) => <group>
  <Cell t={t} days={0.45} marks={9} />
  <Mosquito t={t} position={WALL18} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} flap={0} scale={3.2} />
  <Handcuffs k={1} position={[WALL18[0] + 0.03, WALL18[1] - 0.02, WALL18[2]]} rotation={[0, Math.PI / 2, 0.2]} size={0.75} />
  <Plate lines={['ห้อง 18']} position={[0, 2.12, 1.54]} w={0.64} />
</group>;
const Cell20: React.FC<{t: number; children?: React.ReactNode}> = ({t, children}) => <group>
  <Cell t={t} days={0.45} marks={0} />
  <Plate lines={['ห้อง 20']} position={[0, 2.12, 1.54]} w={0.64} />
  <Plate lines={['ขังเดี่ยว']} position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />
  {children}
</group>;
const Block: React.FC<{t: number; c20?: React.ReactNode; old?: boolean}> = ({t, c20, old}) => <group>
  <group position={[CX.c18, 0, 0]}><Cell18 t={t} /></group>
  <Cell19 t={t} old={old} />
  <group position={[CX.c20, 0, 0]}><Cell20 t={t}>{c20}</Cell20></group>
  <Corridor />
</group>;
const D_FLOOR: V3 = [-0.15, 0.06, -0.45];                    // the dust's spot in cell 20 (local)
const D_PATH: V3[] = [D_FLOOR, [0.1, 0.9, -0.9], [0.55, 2.0, -1.35], [0.6, 2.25, -1.52], [0.7, 2.5, -2.4]];   // up, out between the window bars

// =====================================================================================================
// THE COURT (EP1 set): the jar sits on a cushion on the dock
// =====================================================================================================
const DOCK_JAR: V3 = [0, 1.1, 0.6];
const judgeAt = (C: Cast, t: number, o: {talk?: number; hits?: number[]} = {}) => {
  const I = C.judge; const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.1, 0.6], talkK: o.talk ?? 0});
  const w = body(I, s, t, 0.5);
  const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 1, 3], [0, 0, Math.PI / 2]); g.visible = true;
  let lift = 0; for (const h of o.hits ?? []) { const u = t - h; lift = Math.max(lift, u < -0.25 ? 0 : u < 0 ? sm((u + 0.25) / 0.25) : Math.max(0, 1 - u / 0.07)); }
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.6 - lift * 0.9, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.5 - lift * 0.5, I.root); w.updateMatrixWorld(true);
  return w;
};
const DockJar: React.FC<{t: number; ring?: number}> = ({t, ring = 0}) => <>
  <mesh castShadow position={[0, 1.075, 0.6]} material={new THREE.MeshLambertMaterial({color: '#8C2A2E'})}><boxGeometry args={[0.26, 0.05, 0.26]} /></mesh>
  <Jar3 position={DOCK_JAR}><Dust position={[0, 0.075, 0]} r={0.026} look={[0, 1.2, 3]} /></Jar3>
  <Plate lines={['จำเลยที่ 1']} position={[0, 1.075, 0.735]} w={0.17} aspect={3.4} />
  {ring > 0 && ring < 1 && <EchoRing position={add3(DOCK_JAR, [0, 0.075, 0.03])} k={ring} r={0.035} />}
</>;
const court = (t: number, C: Cast, o: {talk?: number; hits?: number[]; ring?: number} = {}) => <><Court t={t} /><P o={judgeAt(C, t, o)} /><DockJar t={t} ring={o.ring} /></>;

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  openWindow: (t, lt, C) => {
    const w = atWindow(C, t, breathK(t));
    return {node: <>{room(t)}<P o={w} /></>, cam: {pos: lerp3([-0.82, 1.56, 1.3], [-1.0, 1.56, 1.02], sm(lt / 3)), look: [-1.95, 1.47, -0.5], fov: 44}};
  },
  dustAir: (t, lt) => {
    // looking out of the open window: the speck drifts in on the morning air, a few grey friends behind it
    const k = sm(lt / 1.4); const p = lerp3([-2.2, 1.58, -0.62], [-1.86, 1.53, -0.5], k);
    return {node: <>{room(t)}<Dust position={add3(p, [0, Math.sin(t * 3) * 0.006, 0])} r={0.022} look={[-1.5, 1.5, -0.45]} spin={t * 0.4} />
      {[0, 1, 2, 3].map((i) => <Smog key={i} position={[-2.25 - i * 0.05, 1.3 + i * 0.12 + Math.sin(t + i) * 0.02, -0.75 + i * 0.13 + lt * 0.05]} r={0.008 + i * 0.002} spin={i} />)}
      </>, cam: {pos: [-1.5, 1.5, -0.44], look: [-2.2, 1.53, -0.52], fov: 38}};
  },
  noseCU: (t, lt, C) => {
    const w = atWindow(C, t, breathK(t)); const n = noseOf(C.nai, MAN_W.yaw); const h = bw(C.nai, 'Bip01_Head');
    const k = sm((t - ev('dustIn')) / (ev('sniff') - ev('dustIn'))); const start: V3 = add3(n, [-0.38, 0.05, 0.04]);
    const p = lerp3(start, n, k);
    return {node: <>{room(t)}<P o={w} />{t < ev('sniff') + 0.04 && <Dust position={add3(p, [0, Math.sin(t * 5) * 0.004 * (1 - k), 0])} r={0.016 * (1 - 0.4 * k)} look={n} />}</>,
      cam: {pos: lerp3(add3(h, [-0.2, 0.14, 0.95]), add3(h, [-0.2, 0.14, 0.8]), sm(lt / 1.4)), look: add3(h, [-0.2, 0.12, 0]), fov: 34}};
  },
  sneeze: (t, lt, C) => {
    const u = t - ev('sneeze'); const sn = u < 0 ? sm((u + 0.12) / 0.12) * 0.25 : u < 0.1 ? 1 : Math.max(0, 1 - (u - 0.1) / 0.12);
    const w = atWindow(C, t, 0, sn);
    return {node: <>{room(t)}<P o={w} /></>, cam: {pos: add3([-0.95, 1.62, 0.9], shake(t, ev('sneeze'), 0.03, 10)), look: [-1.8, 1.6, -0.5], fov: 36}};
  },
  dustScale: (t, lt, C) => {
    // the offender, huge, in the middle of the room; the man small behind it. The charge slams in on the cut.
    const s = ps('nai', MAN_R.x, MAN_R.z, MAN_R.yaw, t, {clip: 'idle_neutral_01', lookW: [-0.3, 1.25, -0.1]}); const w = body(C.nai, s, t);
    const u = t - ev('titleCharge'); const k = u < 0 ? 0 : u < 0.08 ? lerp(1.9, 0.94, u / 0.08) : u < 0.2 ? lerp(0.94, 1, (u - 0.08) / 0.12) : 1;
    const look: V3 = [-0.9, 1.22, -0.25]; const camP: V3 = add3([1.3 - lt * 0.05, 0.42, 0.78 + lt * 0.06], shake(t, ev('titleCharge'), 0.05, 7));
    return {node: <>{room(t, {hideS: true})}<P o={w} /><Dust position={[-0.28, 1.2 + Math.sin(t * 1.4) * 0.02, -0.12]} r={0.3} look={camP} spin={0.3} />
      <BigPlate3 text="บุกรุกเคหสถาน" cam={camP} look={look} k={k} up={0.2} /></>, cam: {pos: camP, look, fov: 66}};
  },
  stare: (t, lt, C) => {
    const s = ps('nai', MAN_R.x, MAN_R.z, MAN_R.yaw, t, {clip: 'idle_neutral_01', lookW: [-1.22, 1.66, -0.3]}); const w = body(C.nai, s, t);
    return {node: <>{room(t, {hideS: true})}<P o={w} /><Dust position={[-0.82, 1.6 + Math.sin(t * 1.3) * 0.004, -0.02]} r={0.022} look={bw(C.nai, 'Bip01_Head')} /></>,
      cam: {pos: lerp3([-0.15, 1.62, 0.07], [-0.25, 1.62, 0.04], sm(lt / 1.1)), look: [-1.55, 1.62, -0.36], fov: 40}};
  },
  phone: (t, lt, C) => phoneShot(t, lt, C),
  callUI: (t, lt, C) => phoneShot(t, lt, C),
  helis: (t, lt) => {
    const list = HELIS.map((h, i) => <Heli key={i} t={t} seed={i} position={add3(h.p, [0, Math.sin(t * 1.3 + i) * 0.15, 0])} yaw={yawTo(h.p, WIN)} bank={h.bank} light={WIN} scale={2.2} />);
    return {node: <><Street t={t} out={3} />{daylight()}{list}</>, cam: {pos: lerp3([3, 8.5, 38], [3, 9.2, 44], sm(lt / 2.4)), look: [0, 8.5, -3], fov: 42}, bg: {color: '#A7AAA2', fog: ['#A7AAA2', 30, 140]}};
  },
  vacuum: (t, lt) => {
    const on = sm((t - ev('vacOn')) / 0.3);
    return {node: <><Street t={t} out={3} />{daylight()}<Heli t={t} position={LEAD} scale={2.2} /><Vacuum position={CAN} t={t} on={on} />{smogField(t)}
      {on > 0 && <Wind path={[add3(MOUTH, [-6, 6, -8]), add3(MOUTH, [0, 1.2, 0])]} t={t} n={22} speed={1.6} len={0.15} w={0.06} spread={1.6} />}</>,
      cam: {pos: add3([9, 1.8, 13], shake(t, ev('vacOn'), 0.06, 4)), look: [1.6, 12.5, 0], fov: 58}, bg: skyBg(t)};
  },
  skyClean: (t, lt) => {
    const on = 1;
    return {node: <><Street t={t} out={3} />{daylight(1 + skyK(t) * 0.15)}<Heli t={t} position={LEAD} scale={2.2} /><Vacuum position={CAN} t={t} on={on} />{smogField(t)}
      {t < ev('suck1') && <Wind path={[add3(MOUTH, [-8, 8, -12]), add3(MOUTH, [0, 1.2, 0])]} t={t} n={26} speed={1.8} len={0.15} w={0.08} spread={2.4} />}</>,
      cam: {pos: lerp3([-16, 7, 30], [-17, 7.4, 32], sm(lt / 1.4)), look: [0, 14, -6], fov: 54}, bg: skyBg(t)};
  },
  jarLid: (t, lt, C) => {
    const lid = 0.2 * (1 - sm(lt / 0.22));
    const sA = ps('offA', -0.52, -0.82, 0.1, t, {clip: 'idle_angry_01', lookW: [0, 0.9, 0]}), sB = ps('offB', 0.52, -0.82, -0.1, t, {clip: 'idle_neutral_01', lookW: [0, 0.9, 0]});
    return {node: <><Interro t={t} swing={1} hideS />
      <Jar3 position={[0, TABLE_TOP, 0]} lid={lid}><Dust position={[0, 0.07, 0]} r={0.026} look={[0, 1.1, 1]} /></Jar3>
      </>, cam: {pos: add3(lerp3([0, 1.14, 0.82], [0, 1.12, 0.68], sm(lt / 1.1)), shake(t, LN.l007.t0 + 0.17, 0.008, 10)), look: [0, 0.92, -0.1], fov: 40}};
  },
  jarCuff: (t, lt) => {
    const k = pop((t - ev('cuff')) / 0.28); const r = 0.024 * 2.6;
    return {node: <><Interro t={t} swing={1} hideS />
      <Jar3 position={[0, TABLE_TOP, 0]}><Dust position={[0, 0.07, 0]} r={0.026} look={[0.05, 1.1, 0.5]} /></Jar3>
      <TableRing position={[r * 2.9, TABLE_TOP, 0]} />
      <group position={[0, TABLE_TOP + 0.115, 0]} rotation={[0, 0, -0.36]}><Handcuffs k={k} position={[r * 1.45, 0, 0]} rotation={[Math.PI / 2, 0, 0]} size={2.6} /></group>
      </>, cam: {pos: add3(lerp3([0.12, TABLE_TOP + 0.36, 0.52], [0.12, TABLE_TOP + 0.33, 0.46], sm(lt / 1.2)), shake(t, ev('cuff') + 0.03, 0.006, 8)), look: [0.1, TABLE_TOP + 0.07, 0], fov: 40}};
  },
  court: (t, lt, C) => ({node: court(t, C), cam: {pos: lerp3([0, 1.3, 3.1], [0, 1.3, 2.8], sm(lt / 1)), look: [0, 1.5, -1.5], fov: 42}}),
  judge: (t, lt, C) => ({node: court(t, C, {talk: 1}), cam: {pos: lerp3([0.02, 1.98, -1.45], [0.02, 1.98, -1.62], sm(lt / 1.6)), look: [0, 1.84, -3.25], fov: 36}}),
  caseFile: (t, lt, C) => ({node: <>{court(t, C, {talk: 1})}<CaseFolder3 position={[0.62, 1.507, -2.86]} rotation={[0, -0.1, 0]} /></>,
    cam: {pos: lerp3([0.63, 1.98, -2.6], [0.63, 1.9, -2.64], sm(lt / 1.1)), look: [0.62, 1.5, -2.86], fov: 40}}),
  jarECU: (t, lt, C) => ({node: court(t, C, {ring: cl((t - ev('answer')) / 0.6)}), cam: {pos: lerp3([0, 1.34, 1.3], [0, 1.33, 1.2], sm(lt / 1.5)), look: [0, 1.15, 0.6], fov: 28}}),
  courtWide: (t, lt, C) => ({node: court(t, C), cam: {pos: lerp3([0, 2.6, 4.3], [0, 2.55, 4.05], sm(lt / 1.2)), look: [0, 1.3, -1.6], fov: 50}}),
  gavel: (t, lt, C) => ({node: court(t, C, {hits: [ev('gavel')]}), cam: {pos: add3([0.42, 1.92, -1.72], shake(t, ev('gavel'), 0.02, 9)), look: [0.05, 1.7, -3.2], fov: 42}}),
  cellBlock: (t, lt) => {
    // the guard's hand tips the jar through the bars of 20; the speck drops in; the door slams
    const tip = -sm((t - ev('tipIn') + 0.25) / 0.25) * 2.0; const jarP: V3 = [CX.c20 - 0.35, 1.35, 1.72];
    const f = cl((t - ev('tipIn')) / 0.45); const dp: V3 = f <= 0 ? add3(jarP, [0, 0.07, 0]) : lerp3(add3(jarP, [-0.05, 0.02, -0.1]), [CX.c20 + D_FLOOR[0], D_FLOOR[1], D_FLOOR[2]], f * f);
    return {node: <><Block t={t} />{daylightCell}
      <Jar3 position={jarP} tip={tip} lid={0.12} />
      <Arm position={add3(jarP, [0.06, 0.06, 0.06])} back={[0.6, -0.3, 0.8]} sleeve="#8DB4CF" skin="#C8935F" grip unlit />
      <Dust position={dp} r={0.05} look={[1.5, 1.6, 8]} spin={f * 6} />
      </>, cam: {pos: add3([1.55, 1.62, 7.7], shake(t, ev('barsShut'), 0.04, 8)), look: [1.55, 1.48, 0], fov: 52}, bg: CELL_BG};
  },
  cell19: (t, lt) => ({node: <><Block t={t} c20={<Dust position={D_FLOOR} r={0.05} look={[0, 1.5, 8]} />} />{daylightCell}</>,
    cam: {pos: lerp3([-1.5, 1.62, 7.7], [-1.45, 1.62, 7.3], sm(lt / 1.4)), look: [-1.5, 1.45, 0], fov: 52}, bg: CELL_BG}),
  fanTurn: (t, lt) => {
    const locked = t >= ev('turnLock');
    return {node: <><Block t={t} />{daylightCell}
      {locked && <Wind path={[[FAN_C[0] + 0.25, 1.2, FAN_C[2] + 0.2], [1.3, 1.2, 1.7], [2.2, 1.1, 2.2]]} t={t} n={24} speed={1.3} len={0.1} w={0.008} spread={0.18} />}
      </>, cam: {pos: [-0.42, 1.32, 0.72], look: [0.3, 1.18, -0.3], fov: 44}, bg: CELL_BG};
  },
  dustOut: (t, lt) => {
    const k = cl((t - ev('blow')) / 0.95); const dl = along(D_PATH, k * k * (3 - 2 * k)); const flap = Math.sin(t * 30) * 0.35 * (t > ev('blow') ? 1 : 0);
    return {node: <><Block t={t} c20={<>{k < 1 && <Dust position={dl} r={0.05} spin={k * 9} look={[1, 1.5, 3]} />}
        <Plate lines={['ห้ามเข้าใกล้ลูกกรง']} position={[0.75, 1.0, 1.56]} rotation={[flap, 0, 0]} w={0.5} aspect={4} bg="#E6E7CF" fg="#B0402E" /></>} />{daylightCell}
      <Wind path={[[CX.c20 - 1.4, 1.25, 1.8], [CX.c20 - 0.35, 0.5, -0.3], [CX.c20 + 0.4, 1.7, -1.2], [CX.c20 + 0.62, 2.3, -1.6]]} t={t} n={34} speed={1.4} len={0.1} w={0.01} spread={0.16} />
      </>, cam: {pos: [CX.c20 + 1.05, 1.42, 3.05], look: [CX.c20 - 0.05, 1.45, -0.8], fov: 56}, bg: CELL_BG};
  },
  escape: (t, lt) => {
    const w0 = PRISON_WIN(3); const p = add3(w0, [lt * 1.6, lt * 2.4 + lt * lt * 1.5, lt * 0.9]);
    return {node: <><PrisonOutside t={t} beam={lt * 0.8} /><Dust position={p} r={0.55} spin={t * 2} look={[0, 5, 30]} /></>, cam: {pos: [-1, 4.5, 17], look: [0.5, 6.6, 0], fov: 48}, bg: {color: '#8EC2E6', fog: ['#8EC2E6', 40, 160]}};
  },
  plateNail: (t, lt, C) => {
    const sA = ps('offA', -0.78, 2.15, Math.PI + 0.35, t, {clip: 'idle_neutral_01', lookW: [0, 1.76, 1.54]});
    const sB = ps('offB', 0.62, 2.05, Math.PI - 0.32, t, {clip: 'idle_neutral_01', lookW: [0, 1.76, 1.54]});
    const wA = body(C.offA, sA, t), wB = body(C.offB, sB, t); const I = C.offB;
    const g = prop(I, 'hammer', 'Bip01_R_Hand', makeGavel, [8, 1, 3], [0, 0, Math.PI / 2]); g.visible = true;
    let lift = 0; for (const h of [ev('nail1'), ev('nail2')]) { const u = t - h; lift = Math.max(lift, u < -0.22 ? 0 : u < 0 ? sm((u + 0.22) / 0.22) : Math.max(0, 1 - u / 0.07)); }
    resetTurn(I); rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -1.2 - lift * 0.8, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.6 - lift * 0.6, I.root); wB.updateMatrixWorld(true);
    const strike = cl((t - LN.l012.t0) / 0.18); const k = pop((t - ev('nail1')) / 0.22);
    return {node: <><Cell19 t={t} />{daylightCell}<Corridor /><P o={wA} /><P o={wB} />
      {strike > 0 && <mesh position={[-0.27 + 0.27 * strike, 1.76, 1.552]} rotation={[0, 0, 0.12]} material={new THREE.MeshBasicMaterial({color: '#E0322E', toneMapped: false})}><planeGeometry args={[0.6 * strike, 0.04]} /></mesh>}
      {k > 0 && <Plate lines={['50 ปี', '(ช่วยแหกคุก)']} position={[0.0, 1.72, 1.565]} rotation={[0, 0, -0.04]} w={0.7} aspect={1.7} bg="#B0402E" scale={k} />}
      </>, cam: {pos: add3(lerp3([0.02, 1.86, 3.75], [0.02, 1.86, 3.3], sm(lt / 2)), add3(shake(t, ev('nail1'), 0.025, 9), shake(t, ev('nail2'), 0.025, 9))), look: [0.02, 1.86, 1.5], fov: 44}, bg: CELL_BG};
  },
  fanCuffed: (t, lt) => {
    const c = [0, 1, 2].map((i) => pop((t - ev('cuffs3') - i * 0.22) / 0.26));
    return {node: <><Cell19 t={t} old={false} />{daylightCell}
      <Handcuffs k={c[0]} position={[FAN_C[0] + 0.024 * 1.6 * 1.45, 0.42, FAN_C[2]]} rotation={[Math.PI / 2, 0, 0.3]} size={1.6} />
      <Handcuffs k={c[1]} position={[FAN_C[0] + 0.024 * 1.6 * 1.45, 0.2, FAN_C[2]]} rotation={[Math.PI / 2, 0, -0.25]} size={1.6} />
      <Handcuffs k={c[2]} position={[FAN_C[0] - 0.024 * 1.6 * 1.45, 1.02, FAN_C[2]]} rotation={[Math.PI / 2, 0, 0.1]} size={1.6} />
      </>, cam: {pos: [0.08, 0.86, 1.05], look: [0.23, 0.7, -0.3], fov: 46}, bg: CELL_BG};
  },
};
const daylightCell = <pointLight position={[0, 2.6, 3.4]} color="#E8EEF6" intensity={1.6} distance={9} decay={1.4} />;

const phoneShot = (t: number, lt: number, C: Cast): ShotOut => {
  const s = ps('nai', 0.85, 0.35, -0.75, t, {clip: 'idle_neutral_01'});
  const w = body(C.nai, s, t); const I = C.nai;
  resetTurn(I); const raise = sm(lt / 0.22); const ear = hc(I).add(new THREE.Vector3(16, -12, -2));
  fingers(I, 'L', 'cup', 1); ik(I, 'L', ear, new THREE.Vector3(0.9, -1, -0.45), raise); handTo(I, 'L', new THREE.Vector3(-0.1, 1, 0.25), new THREE.Vector3(0, 0, 1), raise);
  const ph = prop(I, 'phone', 'Bip01_L_Hand', makePhone, [9, 3.5, 0], [Math.PI / 2 - 0.5, 0, Math.PI / 2]); ph.visible = true; w.updateMatrixWorld(true);
  return {node: <>{room(t)}<P o={w} /></>, cam: {pos: lerp3([-0.18, 1.56, 1.45], [-0.08, 1.56, 1.33], sm(lt / 2)), look: [0.82, 1.56, 0.49], fov: 42}};
};
