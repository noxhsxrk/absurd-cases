import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {GEST, resetTurn, toLocal, rot, ik, sh, handTo, fingers} from '../../pov/acting/ik';
const ringMat = new THREE.MeshBasicMaterial({color: '#FF2E2E', transparent: true, opacity: 0.9, toneMapped: false, depthTest: false, side: THREE.DoubleSide});
import {M, MB} from '../../pov/lib/tex';
import {ev, V3, sm, cl, lerp, lerp3, shake, pop} from './data';
import {COMMANDOS} from './cast';
import {autoFace, setFace} from './boxcast';
import {Bedroom, Street, Interro, Court, Cell, Town, BED_TOP, MQ_WALL, TABLE_TOP} from './sets';
import {Mosquito, mqPath, Handcuffs, Jar, Van, Swarm, makeShield, makeGavel, ChargePlate, CaseFolder} from './props';

type Inst = any;
type Cast = Record<string, Inst>;
export type Cam = {pos: V3; look: V3; fov: number; roll?: number};
export type Bg = {color: string; fog?: [string, number, number]} | null;

// ------------------------------------------------------------------------------------------------
// people: a PersonState built by hand per shot (no life sim: this format is staged shot by shot)
// ------------------------------------------------------------------------------------------------
type PSo = {poseId?: string; clip?: string; moving?: boolean; loco?: 'run' | 'walk'; odo?: number; talkK?: number; fear?: number; held?: string; lookW?: V3; hy?: number};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...POSES.stand({t, phase: 0, talking: false, seed: id.length, speed: 0}), hy: o.hy ?? 0};
  return {id, x, z, yaw, pose, held: o.held ?? 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: o.odo ?? 0, poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, loco: o.loco, lookW: o.lookW} as any;
};
const wraps = new Map<Inst, THREE.Group>();
/** place + drive one person; `y` lifts the root, `rx` tips the whole body (−π/2 = lying on the back, head toward −z) */
const body = (I: Inst, s: any, t: number, y = 0, rx = 0): THREE.Group => {
  let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, y, s.z); w.rotation.set(rx, s.yaw, 0, 'YXZ'); w.scale.setScalar(I.scale); w.updateMatrixWorld(true);
  if (s.lookW) s.pose.lookL = new THREE.Vector3(...toLocal(I, s, s.lookW) as any);
  drive(I, s, t); w.updateMatrixWorld(true);
  if (s.face) setFace(I, s.face); else autoFace(I, t, {talk: s.talkK, fear: s.fear, seed: s.id.length * 3.1});
  return w;
};
const bw = (I: Inst, bone: string): V3 => { const v = I.bones[bone].getWorldPosition(new THREE.Vector3()); return [v.x, v.y, v.z]; };

const P: React.FC<{o: THREE.Object3D}> = ({o}) => <primitive object={o} />;

// props attached to bones once (bone space is cm)
const attached = new WeakMap<Inst, Record<string, THREE.Object3D>>();
const prop = (I: Inst, key: string, bone: string, make: () => THREE.Object3D, p: V3, r: V3) => {
  let a = attached.get(I); if (!a) { a = {}; attached.set(I, a); }
  if (!a[key]) { const o = make(); o.position.set(...p); o.rotation.set(...r); I.bones[bone].add(o); a[key] = o; }
  return a[key];
};
const showProp = (I: Inst, key: string, on: boolean) => { const a = attached.get(I); if (a?.[key]) a[key].visible = on; };

/** a laser beam between two points */
const Beam: React.FC<{a: V3; b: V3; k?: number}> = ({a, b, k = 1}) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return <mesh position={A.clone().add(B).multiplyScalar(0.5)} quaternion={q} material={laserMat} scale={[1, k, 1]}><cylinderGeometry args={[0.0035, 0.0035, L, 5]} /></mesh>;
};
const laserMat = new THREE.MeshBasicMaterial({color: '#FF2A2A', transparent: true, opacity: 0.75, toneMapped: false, depthWrite: false});

// ------------------------------------------------------------------------------------------------
// the camera for the current shot
// ------------------------------------------------------------------------------------------------
export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  // sky + fog live on the scene itself (attach="background" inside a group would not reach it)
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) { c.fov = cam.fov; } c.near = 0.01; c.far = 400; c.updateProjectionMatrix();
  return null;
};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ------------------------------------------------------------------------------------------------
// commando raid choreography (shared by the door shot and the overhead ring)
// ------------------------------------------------------------------------------------------------
const C_RING: [number, number] = [-2.1, 1.05];
const ringPos = (i: number): [number, number] => {
  const inner = i < 5, j = inner ? i : i - 5, n = inner ? 5 : 7, r = inner ? 1.0 : 1.65, span = inner ? 1.22 : 0.84;
  const a = -span + (2 * span * j) / (n - 1);
  return [C_RING[0] + r * Math.cos(a), C_RING[1] + r * Math.sin(a)];
};
const raid = (i: number, t: number) => {
  const t0 = ev('doorBurst') - 0.3 + i * 0.1, v = 4.4;
  const A: [number, number] = [3.4, 1.2], D: [number, number] = [1.7, 1.2], T = ringPos(i);
  const l1 = Math.hypot(D[0] - A[0], D[1] - A[1]), l2 = Math.hypot(T[0] - D[0], T[1] - D[1]);
  const d = Math.max(0, (t - t0) * v);
  if (d >= l1 + l2) return {x: T[0], z: T[1], yaw: Math.atan2(MQ_WALL[0] - T[0], MQ_WALL[2] - T[1]), moving: false, odo: l1 + l2, arrived: t - t0 - (l1 + l2) / v};
  const [p, q, k] = d < l1 ? [A, D, d / l1] : [D, T, (d - l1) / l2];
  return {x: lerp(p[0], q[0], k), z: lerp(p[1], q[1], k), yaw: Math.atan2(q[0] - p[0], q[1] - p[1]), moving: d > 0, odo: d, arrived: -1};
};
const commandos = (C: Cast, t: number, aim: boolean) => COMMANDOS.map((id, i) => {
  const I = C[id]; if (!I) return null;
  const r = raid(i, t);
  const s = ps(id, r.x, r.z, r.yaw, t, {moving: r.moving, loco: 'run', odo: r.odo, clip: 'idle_angry_01', lookW: r.moving ? undefined : MQ_WALL});
  const w = body(I, s, t);
  const sh = prop(I, 'shield', 'Bip01_L_Forearm', makeShield, [16, 6, 10], [0, Math.PI / 2, Math.PI / 2]);
  sh.visible = i % 3 === 0;
  let hand: V3 | null = null;
  if (aim && !r.moving) { resetTurn(I); GEST.point(I, 'R', new THREE.Vector3(...(toLocal(I, s, MQ_WALL) as any)), sm(r.arrived / 0.35)); w.updateMatrixWorld(true); hand = bw(I, 'Bip01_R_Finger1Nub'); }
  return {w, hand, id};
}).filter(Boolean) as {w: THREE.Group; hand: V3 | null; id: string}[];

// ------------------------------------------------------------------------------------------------
// shots — each returns the scene and the camera. `lt` = seconds since the cut, `t` = episode time.
// ------------------------------------------------------------------------------------------------
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const MAN_SIT: V3 = [0.12, 0, -0.12];
const lyingMan = (C: Cast, t: number, open = 0, fear = 0, id = 'nai') => {
  const I = C[id]; const s = ps(id, 0.12, -0.22, 0, t, {clip: 'idle_neutral_01', fear});
  if (open < 1) s.face = 'closed';
  return body(I, s, t, BED_TOP + 0.13, -Math.PI / 2);
};
const SleepBlanket = () => <group>
  <mesh castShadow receiveShadow position={[0.12, 0.69, -0.62]} scale={[0.78, 0.13, 0.62]} material={M('#5E8FA6', 0.95)}><sphereGeometry args={[1, 18, 12]} /></mesh>
  <mesh receiveShadow position={[0.0, 0.6, -0.55]} material={M('#5E8FA6', 0.95)}><boxGeometry args={[1.66, 0.1, 0.95]} /></mesh>
</group>;

export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  bedWide: (t, lt, C) => {
    const s = ps('nai', MAN_SIT[0], MAN_SIT[2], 0, t, {poseId: 'sitIdle', clip: 'sit_chair_idle_yawn', lookW: [0.6, 1.2, 1.4]});
    const w = body(C.nai, s, t, 0.08);
    return {node: <><Bedroom st={{t, lamp: 1}} /><P o={w} /></>, cam: {pos: lerp3([1.0, 1.28, 1.75], [0.85, 1.22, 1.45], sm(lt / 1.2)), look: [0.1, 0.95, -0.2], fov: 42}};
  },
  bedSleep: (t, lt, C) => {
    const lamp = lt < 0.2 ? 1 : 0;
    const w = lyingMan(C, t);
    return {node: <><Bedroom st={{t, lamp, made: false}} /><SleepBlanket /><P o={w} /></>, cam: {pos: lerp3([1.3, 1.95, -0.45], [1.1, 1.8, -0.7], sm(lt / 2)), look: [0.12, 0.7, -1.55], fov: 40}};
  },
  mosqFly: (t, lt, C) => {
    // the reference's scale shot: the offender fills the frame, the man is small in the back (tiny man vs. huge wave)
    const camP: V3 = [-1.55, 1.5, 2.05], tgt: V3 = [0.1, 0.95, -0.35];
    const dir = [tgt[0] - camP[0], tgt[1] - camP[1], tgt[2] - camP[2]] as V3; const L = Math.hypot(...dir); const u = dir.map((v) => v / L) as V3;
    const start = add3(camP, [u[0] * 0.32 - 0.06, u[1] * 0.32 - 0.03, u[2] * 0.32]);
    const end = add3(camP, [u[0] * 0.62 + 0.1, u[1] * 0.62 - 0.08, u[2] * 0.62]);
    const m = mqPath(t, start, end, ev('mosqIn') + 0.1, ev('mosqIn') + 1.6, 0.012);
    const w = lyingMan(C, t);
    return {node: <><Bedroom st={{t, lamp: 0, made: false}} /><SleepBlanket /><P o={w} /><Mosquito t={t} position={m.p} rotation={[0.1, m.yaw, 0]} scale={4} /></>,
      cam: {pos: camP, look: tgt, fov: 60}};
  },
  bite: (t, lt, C) => {
    const w = lyingMan(C, t);
    const fa = bw(C.nai, 'Bip01_R_Forearm'), hd = bw(C.nai, 'Bip01_R_Hand');
    const spot: V3 = [lerp(fa[0], hd[0], 0.55), lerp(fa[1], hd[1], 0.55) + 0.045, lerp(fa[2], hd[2], 0.55)];
    const land = ev('land'), bite = ev('bite');
    const fly = mqPath(t, add3(spot, [-0.25, 0.22, 0.1]), spot, land - 0.6, land, 0.012);
    const p = t < land ? fly.p : spot;
    const fill = cl((t - bite) / 1.0);
    const bump = cl((t - bite - 0.7) / 0.6);
    const yaw = Math.atan2(hd[0] - fa[0], hd[2] - fa[2]);
    return {node: <><Bedroom st={{t, lamp: 0, made: false}} /><SleepBlanket /><P o={w} />
      <Mosquito t={t} position={[p[0], p[1] - (t >= bite ? 0.004 : 0), p[2]]} rotation={[t >= bite ? 0.35 : 0.1, yaw, 0]} flap={t < land + 0.1 ? 1 : 0} fill={fill} />
      {bump > 0 && <mesh position={[spot[0] + 0.012, spot[1] - 0.032, spot[2]]} scale={[0.012 * bump, 0.006 * bump, 0.012 * bump]} material={M('#E8837A', 0.6)}><sphereGeometry args={[1, 12, 8]} /></mesh>}
      </>, cam: {pos: add3(spot, [0.2, 0.13, 0.17 - sm(lt / 1.6) * 0.04]), look: add3(spot, [0, -0.02, 0]), fov: 34}};
  },
  assault: (t, lt, C) => {
    // the evidence: the swollen red bite on his forearm circled in red, the culprit flying off fat and red
    const w = lyingMan(C, t, 1, 0.9);
    const I = C.nai;
    setFace(I, lt < 0.9 ? 'wide' : (Math.sin(lt * 12) > 0 ? 'talk' : 'wide'));
    const fa = bw(I, 'Bip01_R_Forearm'), hd = bw(I, 'Bip01_R_Hand');
    const spot: V3 = [lerp(fa[0], hd[0], 0.55), lerp(fa[1], hd[1], 0.55) + 0.045, lerp(fa[2], hd[2], 0.55)];
    const bump: V3 = [spot[0] + 0.006, spot[1] - 0.024, spot[2]];
    const away = mqPath(t, add3(spot, [0, 0.03, 0]), add3(spot, [-0.55, 0.42, 0.35]), ev('sitUp'), ev('sitUp') + 1.6, 0.02);
    const pulse = 1 + 0.15 * Math.sin(lt * 9), ring = sm(cl((lt - 0.15) / 0.3));
    const k = sm(cl((lt - 0.7) / 1.1));   // pull back from the bite to bite + face
    const camP = add3(lerp3(add3(spot, [0.2, 0.13, 0.17]), add3(spot, [0.25, 0.2, 0.24]), k), shake(t, ev('titleAssault'), 0.01, 7));
    const look = add3(bump, [0, -0.02, 0]);
    return {node: <><Bedroom st={{t, lamp: 1, made: false}} /><SleepBlanket /><P o={w} />
      <Mosquito t={t} position={away.p} rotation={[0.1, away.yaw, 0]} flap={1} fill={1} />
      <mesh position={bump} scale={[0.022, 0.014, 0.022]} material={M('#D9483E', 0.5)}><sphereGeometry args={[1, 12, 8]} /></mesh>
      <ChargePlate text="ทำร้ายร่างกาย" position={add3(bump, [-0.045, 0.04, -0.035])} lookAt={camP} width={0.075} />
      {ring > 0 && <mesh position={add3(bump, [0, 0.012, 0])} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...camP).sub(new THREE.Vector3(...bump)).normalize())}
        scale={ring * pulse} material={ringMat}><ringGeometry args={[0.032, 0.039, 32]} /></mesh>}
      </>, cam: {pos: camP, look, fov: 40}};
  },
  phone: (t, lt, C) => {
    const s = ps('nai', 0.85, 0.35, -0.75, t, {clip: 'cell_phone_talk_01', held: 'phone', fear: 0.4, poseId: 'standPhone'});
    const w = body(C.nai, s, t);
    return {node: <><Bedroom st={{t, lamp: 1}} /><P o={w} /></>, cam: {pos: lerp3([-0.18, 1.56, 1.45], [-0.08, 1.56, 1.33], sm(lt / 2)), look: [1.0, 1.5, 0.49], fov: 42}};
  },
  vans: (t, lt) => {
    const t0 = ev('vans');
    const k1 = Easing3(cl((t - t0) / 1.0)), k2 = Easing3(cl((t - t0 - 0.25) / 1.0));
    const sk = shake(t, t0 + 1.0, 0.04, 6);
    return {node: <><Street t={t} />
      <Van t={t} position={[lerp(16, 2.0, k1), 0, 1.4]} yaw={Math.PI} roll={(1 - k1) * 0.02} />
      <Van t={t + 0.07} position={[lerp(-17, -4.6, k2), 0, -0.9]} yaw={0} roll={(1 - k2) * -0.02} />
      </>, cam: {pos: add3([8.6, 1.7, 5.4], sk), look: [0.6, 1.6, -0.9], fov: 54}, bg: {color: '#1A2648', fog: ['#1A2648', 18, 60]}};
  },
  commandos: (t, lt, C) => {
    const list = commandos(C, t, false);
    return {node: <><Bedroom st={{t, lamp: 1, door: 1}} />{list.map((c) => <P key={c.id} o={c.w} />)}</>,
      cam: {pos: add3([-1.15, 1.32, 2.0], shake(t, ev('doorBurst'), 0.02, 5)), look: [1.7, 1.1, 0.95], fov: 58}};
  },
  ring: (t, lt, C) => {
    const list = commandos(C, t, true);
    const a = lt * 0.18;
    return {node: <><Bedroom st={{t, lamp: 1, door: 1, ceiling: false}} />{list.map((c) => <P key={c.id} o={c.w} />)}
      <Mosquito t={t} position={MQ_WALL} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} flap={0} />
      {list.map((c) => c.hand && <Beam key={'b' + c.id} a={c.hand} b={MQ_WALL} />)}
      <sprite position={[MQ_WALL[0] + 0.01, MQ_WALL[1], MQ_WALL[2]]} scale={0.25}><spriteMaterial color="#FF3030" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      </>, cam: {pos: [-1.05 + Math.sin(a) * 0.3, 4.9, 1.1 + Math.cos(a) * 0.3], look: [-1.25, 0, 1.05], fov: 58, roll: 1.57 + a}};
  },
  cuff: (t, lt, C) => {
    const k = pop((t - ev('cuff')) / 0.35);
    const dots = [0, 1, 2, 3, 4].map((i) => [MQ_WALL[0] + 0.004, MQ_WALL[1] + Math.sin(t * 3 + i * 1.7) * 0.018, MQ_WALL[2] + Math.cos(t * 2.4 + i * 2.3) * 0.02] as V3);
    return {node: <><Bedroom st={{t, lamp: 1, door: 1}} />
      <Mosquito t={t} position={MQ_WALL} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} flap={0} />
      {dots.map((d, i) => <mesh key={i} position={d} rotation={[0, Math.PI / 2, 0]} material={MB('#FF3030')}><circleGeometry args={[0.0028, 10]} /></mesh>)}
      <Handcuffs k={k} position={[MQ_WALL[0] + 0.03, MQ_WALL[1] - 0.004, MQ_WALL[2]]} rotation={[0, Math.PI / 2, 0.15]} size={0.75} />
      <pointLight position={[MQ_WALL[0] + 0.5, MQ_WALL[1] + 0.2, MQ_WALL[2] + 0.2]} intensity={0.6} distance={2} color="#FFE8C8" />
      </>, cam: {pos: add3([MQ_WALL[0] + 0.3 - sm(lt / 2.4) * 0.07, MQ_WALL[1] + 0.02, MQ_WALL[2] + 0.07], shake(t, ev('cuff') + 0.05, 0.006, 8)), look: MQ_WALL, fov: 40}};
  },
  caseFile: (t, lt) => ({node: <><Interro t={t} swing={1} hideS /><CaseFolder position={[-0.45, TABLE_TOP + 0.012, 0.1]} rotation={[0, 0.12, 0]} /></>,
    cam: {pos: lerp3([-0.47, TABLE_TOP + 0.5, 0.3], [-0.46, TABLE_TOP + 0.42, 0.24], sm(lt / 0.9)), look: [-0.45, TABLE_TOP + 0.01, 0.1], fov: 40}}),
  interroWide: (t, lt, C) => interro(t, lt, C, 'wide'),
  officerLean: (t, lt, C) => interro(t, lt, C, 'lean'),
  mosqJar: (t, lt, C) => interro(t, lt, C, 'jar'),
  confess: (t, lt, C) => interro(t, lt, C, 'confess'),
  court: (t, lt, C) => courtShot(t, lt, C, false),
  gavelECU: (t, lt, C) => courtShot(t, lt, C, true),
  cell: (t, lt) => ({node: <><Cell t={t} days={lt * 2.6} marks={Math.min(14, 1 + Math.floor(lt * 7))} />
      <Jar position={[-0.6, 0.46, -1.2]}><Mosquito t={t} position={[0, 0.012, 0]} rotation={[0, 0.4, 0]} flap={0} /></Jar>
    </>, cam: {pos: lerp3([0.75, 1.25, 0.95], [0.65, 1.2, 0.8], sm(lt / 1.2)), look: [-0.35, 0.75, -1.25], fov: 46}}),
  // two weeks: fourteen marks on the wall, and under them the jar with the prisoner, legs up (a mosquito's whole life)
  tally: (t, lt) => ({node: <><Cell t={t} days={0.45} marks={14} />
      <group position={[-0.02, 0.46, -1.15]} rotation={[0, -0.9, 0]}><Jar scale={1.5}><group scale={2.2}><Mosquito t={t} position={[0, 0.008, 0]} rotation={[0, 2.4, 0]} flap={0} legsUp /></group></Jar></group>
    </>, cam: {pos: lerp3([0.1, 0.92, 0.45], [0.04, 0.82, -0.25], sm(lt / 1.15)), look: lerp3([-0.03, 0.75, -1.4], [-0.02, 0.55, -1.2], sm(lt / 1.15)), fov: 50}}),
  news: (t, lt) => ({node: <><Town t={t} /><Swarm t={t} center={[14 - lt * 2, 24, -105 + lt * 6]} radius={[26, 9, 16]} n={9000} size={1.4} /></>,
    cam: {pos: [0 + lt * 0.8, 32, 26], look: [4, 10, -70], fov: 52}, bg: {color: '#2E3F72', fog: ['#3A4C82', 30, 160]}}),
  swarmLow: (t, lt) => {
    // street level: the swarm pours over the rooftops toward camera
    const k = cl(lt / 2.2);
    return {node: <><Town t={t} /><Swarm t={t} center={[lerp(4, -2, k), lerp(26, 17, k), lerp(-60, -8, k)]} radius={[14, 5, 10]} n={14000} size={0.42} /></>,
      cam: {pos: [1.5, 6, 12], look: [0, 16 - k * 4, -30], fov: 62}, bg: {color: '#2E3F72', fog: ['#3A4C82', 30, 160]}};
  },
  swarm: (t, lt) => {
    const k = lt / 3.6;
    return {node: <><Town t={t} /><Swarm t={t} center={[lerp(6, 0.5, k), lerp(22, 15.5, k), lerp(-75, -26, k)]} radius={[16, 6, 12]} n={14000} size={0.38} /></>,
      cam: {pos: [0, 15, -14 - lt * 1.5], look: [1.5, 15.5, -60], fov: 55}, bg: {color: '#2E3F72', fog: ['#3A4C82', 30, 160]}};
  },
  window: (t, lt, C) => {
    const open = sm((t - ev('eyesOpen')) / 0.12);
    const w = lyingMan(C, t, open, open * 0.9, 'naiEnd');
    const k = cl((t - ev('window')) / 1.1);
    const bugs = Array.from({length: 46}, (_, i) => i).filter((i) => i / 46 < k * 1.2);
    return {node: <><Bedroom st={{t, lamp: 0, made: false, swarm: k * 0.85}} /><SleepBlanket /><P o={w} />
      {bugs.map((i) => { const h = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
        return <Mosquito key={i} t={t + i} position={[-2.075, 1.0 + h(i) * 0.9, -0.92 + h(i + 50) * 0.84]} rotation={[-Math.PI / 2 + (h(i + 9) - 0.5), 0, -Math.PI / 2]} flap={h(i + 3) > 0.6 ? 1 : 0} eyes={false} />; })}
      </>, cam: t < ev('eyesOpen') - 0.1
        ? {pos: lerp3([-1.05, 1.42, -0.42], [-1.25, 1.44, -0.46], sm(lt / 2)), look: [-2.1, 1.46, -0.5], fov: 48}
        : {pos: lerp3([0.42, 1.18, -1.62], [0.36, 1.1, -1.7], sm((t - ev('eyesOpen')) / 2)), look: [0.12, 0.8, -1.86], fov: 38, roll: 0.25}};
  },
};
const Easing3 = (x: number) => 1 - Math.pow(1 - x, 3);

// the court: one staging, a wide and the gavel ECU (reference: judge POV gavel close-up before the sentence)
const courtShot = (t: number, lt: number, C: Cast, ecu: boolean): ShotOut => {
  const I = C.judge;
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.05, 0.6]});
  const w = body(I, s, t, 0.5);
  const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 1, 3], [0, 0, Math.PI / 2]); g.visible = true;
  const strike = (t0: number) => { const u = t - t0; return u < -0.25 ? 0 : u < 0 ? sm((u + 0.25) / 0.25) : Math.max(0, 1 - u / 0.07); };
  const lift = Math.max(strike(ev('gavel')), strike(ev('gavel2')));
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.6 - lift * 0.9, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.5 - lift * 0.5, I.root);
  w.updateMatrixWorld(true);
  const sk = add3(shake(t, ev('gavel'), 0.018, 9), shake(t, ev('gavel2'), 0.018, 9));
  const node = <><Court t={t} /><P o={w} /><Jar position={[0, 1.04, 0.6]}><Mosquito t={t} position={[0, 0.012, 0]} rotation={[0, 0, 0]} flap={0} /></Jar></>;
  if (ecu) {
    const hd = bw(I, 'Bip01_R_Hand');
    return {node, cam: {pos: add3([hd[0] + 0.3, hd[1] + 0.1, hd[2] + 0.66], sk), look: [hd[0] - 0.02, hd[1] - 0.16, hd[2] + 0.02], fov: 40}};
  }
  return {node, cam: {pos: add3(lerp3([0.28, 1.22, 1.45], [0.24, 1.25, 1.15], sm(lt / 2.5)), sk), look: [0, 1.7, -3.2], fov: 32}};
};

// interrogation room: one staging, four camera set-ups
const interro = (t: number, lt: number, C: Cast, mode: 'wide' | 'lean' | 'jar' | 'confess'): ShotOut => {
  const jarHop = Math.max(0, Math.sin(cl((t - ev('slam')) / 0.22) * Math.PI)) * 0.03;
  const jarP: V3 = [0, TABLE_TOP + jarHop, 0];
  const camJar: V3 = [0, TABLE_TOP + 0.05, 0.6];
  const aLook: V3 = mode === 'confess' ? [0.75, 1.62, -0.45] : mode === 'jar' ? [0, TABLE_TOP + 0.05, 0] : camJar;
  const slamK = sm((t - ev('slam') + 0.15) / 0.15) * (1 - sm((t - ev('slam') - 0.9) / 0.3));
  const sA = ps('offA', 0, -0.82, 0, t, {clip: 'idle_angry_01', talkK: mode === 'lean' && t < ev('slam') + 0.9 ? 1 : 0, lookW: aLook});
  const wA = body(C.offA, sA, t);
  if (mode !== 'confess' && slamK > 0.01) { resetTurn(C.offA); GEST.palmsDown(C.offA, 'L', slamK, 0); GEST.palmsDown(C.offA, 'R', slamK, 0); wA.updateMatrixWorld(true); }
  const turnB = mode === 'confess' ? 1 : 0;
  const sB = ps('offB', turnB ? 0.72 : 1.35, turnB ? -0.62 : 0.85, turnB ? -1.4 : -2.4, t, {clip: turnB ? 'idle_neutral_01' : 'idle_look_around_01', lookW: turnB ? [0, 1.62, -0.82] : [0, TABLE_TOP, 0]});
  const wB = body(C.offB, sB, t);
  const answering = t >= ev('answer') && t < ev('answer') + 1.25;
  const sk = add3(shake(t, ev('slam'), mode === 'lean' ? 0.03 : 0.015, 8), shake(t, ev('stamp'), mode === 'confess' ? 0.03 : 0, 9));
  const node = <><Interro t={t} swing={1} hideS={mode === 'lean' || mode === 'jar' || mode === 'confess'} /><P o={wA} /><P o={wB} />
    <Jar position={jarP}><Mosquito t={t} position={[0, 0.012, 0]} rotation={[0, 0, 0]} flap={answering ? 1 : 0} /></Jar></>;
  const cams: Record<string, Cam> = {
    wide: {pos: lerp3([-1.55, 2.35, 1.7], [-1.35, 2.2, 1.45], sm(lt / 1.5)), look: [0.1, 1.15, -0.35], fov: 56},
    lean: {pos: add3(lerp3([0.05, 0.86, 0.62], [0.04, 0.88, 0.52], sm(lt / 2.5)), sk), look: [0, 1.42, -0.78], fov: 46},
    jar: {pos: add3(lerp3([0, TABLE_TOP + 0.06, 0.36], [0, TABLE_TOP + 0.05, 0.22], sm(lt / 2.4)), sk), look: [0, TABLE_TOP + 0.035, 0], fov: 34},
    confess: {pos: add3([0.95, 1.5, 1.35], sk), look: [0.38, 1.45, -0.7], fov: 44},
  };
  return {node, cam: cams[mode]};
};
