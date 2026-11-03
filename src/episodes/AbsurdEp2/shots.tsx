import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, sh as shoulder, handTo, fingers, hc} from '../../pov/acting/ik';
import {ev, V3, sm, cl, lerp, lerp3, shake, pop, LN} from './data';
import {BOMBS} from './cast';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Bedroom, Street, Interro, Court, Cell, TABLE_TOP} from '../AbsurdEp1/sets';
import {Mosquito, Handcuffs, Jar, Van, makeGavel, makePhone, ChargePlate} from '../AbsurdEp1/props';
import {Fan, btnWorld, Arm, Bolt, Wind, EchoRing, PowerStrip, Plug, Cord, CaseFolder, ReportForm, CellPlate, CutterPole, HairSpikes} from './props';

type Inst = any;
type Cast = Record<string, Inst>;
export type Cam = {pos: V3; look: V3; fov: number; roll?: number};
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};

// ---- people, staged by hand per shot (same helpers as EP1)
type PSo = {poseId?: string; clip?: string; moving?: boolean; loco?: 'run' | 'walk'; odo?: number; talkK?: number; fear?: number; held?: string; lookW?: V3; hy?: number};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...POSES.stand({t, phase: 0, talking: false, seed: id.length, speed: 0}), hy: o.hy ?? 0};
  return {id, x, z, yaw, pose, held: o.held ?? 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: o.odo ?? 0, poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, loco: o.loco, lookW: o.lookW} as any;
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

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.01; c.far = 400; c.updateProjectionMatrix();
  return null;
};

// ---- the bedroom staging: fan on the rug blowing toward −x, the man at its panel
const FAN_P: V3 = [0.35, 0, 0.72]; const FAN_YAW = -Math.PI / 2;
const MAN_X = -0.28;
const SWEEP = (t: number) => Math.sin(t * 1.05) * 0.5;      // oscillating head while it runs
const bladeRun = (t: number) => t * 31;
const BTN3 = btnWorld(FAN_P, FAN_YAW, 1, 'b3');
const manAtFan = (C: Cast, t: number, zapped: boolean) => {
  const j = zapped ? 0.012 : 0;
  const s = ps('nai', MAN_X + Math.sin(t * 91) * j, FAN_P[2] + Math.sin(t * 77) * j, Math.PI / 2, t, {clip: 'idle_neutral_01', fear: zapped ? 1 : 0, lookW: zapped ? [1.2, 1.55, 1.2] : [FAN_P[0], 1.1, FAN_P[2]]});
  const w = body(C.nai, s, t);
  const I = C.nai; resetTurn(I);
  const tgt = new THREE.Vector3(...(toLocal(I, s, BTN3) as any)); const s0 = shoulder(I, 'R'); const dir = tgt.clone().sub(s0).normalize();
  fingers(I, 'R', 'point', 1); ik(I, 'R', tgt.clone().sub(dir.clone().multiplyScalar(17)), new THREE.Vector3(0.5, -1, -0.4), 1); handTo(I, 'R', dir, new THREE.Vector3(0, 1, 0), 1);
  if (zapped) { rot(I.bones.Bip01_L_UpperArm, 0, 0, 1, Math.sin(t * 63) * 0.12 + 0.45, I.root); rot(I.bones.Bip01_Head, 1, 0, 0, Math.sin(t * 83) * 0.08, I.root); }
  w.updateMatrixWorld(true);
  return w;
};
const headTop = (I: Inst): V3 => add3(bw(I, 'Bip01_Head'), [0, 0.28, 0.0]);

// ---- bomb squad
const OFF_R = 1.02;
const ringPos = (i: number): [number, number, number] => { const a = -2.2 + (i / 7) * 4.5 + Math.PI / 2; const x = FAN_P[0] + Math.cos(a) * OFF_R * 1.1, z = FAN_P[2] + Math.sin(a) * OFF_R; return [x, z, Math.atan2(FAN_P[0] - x, FAN_P[2] - z)]; };

// ---- the fan as an interrogated suspect: small on the table, its cord in a strip
const TF_S = 0.55; const TF_P: V3 = [0, TABLE_TOP, 0];
const yawInterro = (t: number) => {
  const a = ev('shake0'), u = ev('unplug'); const per = 1.25;
  const y = (x: number) => x < a ? 0 : Math.sin(((x - a) / per) * Math.PI * 2) * 0.62 * sm((x - a) / 0.12);
  return t < u ? y(t) : y(u) * (1 - sm((t - u) / 0.45));
};
const bladeOff = (t: number) => { const d = ev('windDown'); return t < d ? 31 * t : 31 * d + (31 * (1 - Math.exp(-1.5 * (t - d)))) / 1.5; };
const blurOff = (t: number) => { const d = ev('windDown'); return t < d ? 1 : Math.exp(-2.4 * (t - d)); };
const STRIP: V3 = [0.46, TABLE_TOP, 0.2]; const SOCKET: V3 = [0.46, TABLE_TOP + 0.05, 0.27];
const interro = (t: number, lt: number, C: Cast, mode: 'front' | 'shake' | 'down' | 'confess'): ShotOut => {
  const turn = mode === 'confess';
  const sA = ps('offA', turn ? -0.34 : -0.52, turn ? -0.5 : -0.82, turn ? 1.4 : 0.1, t, {clip: 'idle_angry_01', lookW: turn ? [0.34, 1.62, -0.5] : [0, 1.3, 0]});
  const sB = ps('offB', turn ? 0.34 : 0.52, turn ? -0.5 : -0.82, turn ? -1.4 : -0.1, t, {clip: 'idle_neutral_01', lookW: turn ? [-0.34, 1.62, -0.5] : [0, 1.3, 0]});
  const wA = body(C.offA, sA, t), wB = body(C.offB, sB, t);
  const unplugged = t >= ev('unplug');
  const node = <><Interro t={t} swing={1} hideS /><P o={wA} /><P o={wB} />
    <Fan position={TF_P} scale={TF_S} headYaw={yawInterro(t)} blade={bladeOff(t)} blur={blurOff(t)} lit={unplugged ? 0 : 3} />
    <PowerStrip position={STRIP} />
    {!unplugged && <Plug position={[STRIP[0], STRIP[1] + 0.03, STRIP[2] + 0.07]} />}
    <Cord pts={[[0, TABLE_TOP + 0.02, 0.06], [0.2, TABLE_TOP + 0.006, 0.2], [0.34, TABLE_TOP + 0.006, 0.3], unplugged ? [0.46, TABLE_TOP + 0.02, 0.36] : SOCKET]} />
    {unplugged && <Plug position={[0.46, TABLE_TOP + 0.01, 0.36]} />}
  </>;
  const cams: Record<string, Cam> = {
    front: {pos: lerp3([0, 1.22, 1.95], [0, 1.22, 1.72], sm(lt / 1.2)), look: [0, 1.16, -0.2], fov: 46},
    shake: {pos: [0, TABLE_TOP + 0.68, 0.62], look: [0, TABLE_TOP + 0.66, 0], fov: 38},
    down: {pos: lerp3([0, TABLE_TOP + 0.62, 0.78], [0, TABLE_TOP + 0.64, 0.62], sm(lt / 1.2)), look: [0, TABLE_TOP + 0.6, 0], fov: 40},
    confess: {pos: add3([0, 1.42, 1.92], shake(t, ev('stamp'), 0.03, 9)), look: [0, 1.32, -0.4], fov: 48},
  };
  return {node, cam: cams[mode]};
};

// ---- the court (EP1 staging, the fan in the dock)
const courtShot = (t: number, lt: number, C: Cast): ShotOut => {
  const I = C.judge; const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.05, 0.6]});
  const w = body(I, s, t, 0.5);
  const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 1, 3], [0, 0, Math.PI / 2]); g.visible = true;
  const u = t - ev('gavel'); const lift = u < -0.25 ? 0 : u < 0 ? sm((u + 0.25) / 0.25) : Math.max(0, 1 - u / 0.07);
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.6 - lift * 0.9, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.5 - lift * 0.5, I.root); w.updateMatrixWorld(true);
  return {node: <><Court t={t} /><P o={w} /><Fan position={[0, 1.04, 0.6]} scale={TF_S} headYaw={0} blade={0} lit={0} /></>,
    cam: {pos: add3(lerp3([0.42, 1.2, 2.7], [0.38, 1.22, 2.4], sm(lt / 2)), shake(t, ev('gavel'), 0.018, 9)), look: [-0.05, 1.56, -1.5], fov: 36}};
};

// ---- the cells. Cell block: 19 at x = 0, 18 at x = −3.05. A corridor floor outside the bars.
const CX18 = -3.05;
const Corridor: React.FC = () => <group>
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, -0.002, 3.2]}><planeGeometry args={[11, 3.6]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[-1.5, 1.4, 5.2]} rotation={[0, Math.PI, 0]}><planeGeometry args={[11, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh>
</group>;
const CELL_BG: Bg = {color: '#2E3A38'};
const FAN_C: V3 = [0.25, 0, -0.3]; const FAN_C_YAW = -0.25;
const fanRunning = (t: number) => ({blade: bladeRun(t), blur: 1, headYaw: 0});
const Cell19: React.FC<{t: number; on: boolean; fx?: number}> = ({t, on, fx = 0}) => <group>
  <Cell t={t} days={0.45} marks={0} />
  <Fan position={[FAN_C[0] + fx, FAN_C[1], FAN_C[2]]} yaw={FAN_C_YAW} {...(on ? fanRunning(t) : {blade: 0.4, blur: 0, headYaw: 0})} lit={on ? 3 : 0} />
  <CellPlate text="ห้อง 19" position={[0, 2.12, 1.54]} w={0.64} />
  <CellPlate text="20 ปี" position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />
</group>;
const JAR18: V3 = [-0.35, 0.46, -1.2];
const WALL18: V3 = [-1.475, 1.32, -0.25];
const Cell18: React.FC<{t: number; jarTip?: number}> = ({t, jarTip = 0}) => <group>
  <Cell t={t} days={0.45} marks={9} />
  <group position={JAR18} rotation={[0, 0, jarTip * 1.45]}><Jar /></group>
  <CellPlate text="ห้อง 18" position={[0, 2.12, 1.54]} w={0.64} />
</group>;

export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  fanPress: (t, lt, C) => {
    const w = manAtFan(C, t, false);
    return {node: <><Bedroom st={{t, lamp: 1, hideS: true}} /><P o={w} /><Fan position={FAN_P} yaw={FAN_YAW} headYaw={SWEEP(t) * 0.5} blade={bladeRun(t)} blur={1} /></>,
      cam: {pos: lerp3([0.03, 1.32, 3.25], [0.03, 1.3, 2.85], sm(lt / 2.0)), look: [0.03, 1.12, 0.7], fov: 44}};
  },
  fingerECU: (t, lt) => {
    const sh2 = shake(t, ev('zap') - 2, 0, 1);
    const jit: V3 = [Math.sin(t * 91) * 0.003, Math.sin(t * 77) * 0.004, 0];
    return {node: <><Bedroom st={{t, lamp: 1}} /><Fan position={FAN_P} yaw={FAN_YAW} headYaw={0} blade={bladeRun(t)} blur={1} />
      <Arm position={add3(BTN3, add3([-0.006, -0.012, -0.012], jit))} back={[-0.8, -0.52, -0.2]} sleeve="#8FB0D2" />
      {[0, 1, 2].map((i) => <Bolt key={i} t={t} seed={i + 1} a={BTN3} b={add3(BTN3, [-0.06 - i * 0.05, 0.06 - i * 0.07, i === 1 ? 0.08 : -0.07])} n={4} amp={0.012} w={0.0035} />)}
      </>, cam: {pos: add3([-0.16, 1.02, 0.86], sh2), look: [0.27, BTN3[1] + 0.015, 0.72], fov: 30}};
  },
  zapped: (t, lt, C) => {
    const w = manAtFan(C, t, true); const hd = bw(C.nai, 'Bip01_R_Hand'), ua = bw(C.nai, 'Bip01_R_UpperArm'), head = bw(C.nai, 'Bip01_Head');
    return {node: <><Bedroom st={{t, lamp: 1}} /><P o={w} /><Fan position={FAN_P} yaw={FAN_YAW} headYaw={0} blade={bladeRun(t)} blur={1} /><HairSpikes head={headTop(C.nai)} />
      <Bolt t={t} seed={1} a={BTN3} b={hd} n={5} amp={0.03} w={0.008} />
      <Bolt t={t} seed={2} a={hd} b={ua} n={5} amp={0.03} w={0.008} />
      <Bolt t={t} seed={3} a={ua} b={add3(head, [0.05, 0.12, 0.08])} n={4} amp={0.03} w={0.007} />
      </>, cam: {pos: [0.62, 1.5, 2.2], look: [-0.12, 1.42, 0.72], fov: 46}};
  },
  fanScale: (t, lt, C) => {
    // the offender fills the room; the man is small behind it, fried, looking up
    const s = ps('nai', -1.75, 0.15, 1.1, t, {clip: 'idle_neutral_01', fear: 1, lookW: [0.2, 2.3, 0.6]});
    const w = body(C.nai, s, t);
    const a = lt * 0.05; const camP: V3 = [1.62, 0.2, 1.0 + Math.sin(a) * 0.2];
    const plate: V3 = [-0.45, 1.72, 0.8];
    return {node: <><Bedroom st={{t, lamp: 1}} /><P o={w} /><Fan position={[0.42, 0, 0.42]} yaw={Math.PI / 2 + 0.42} scale={2.0} headYaw={SWEEP(t) * 0.2} tilt={0.42} blade={bladeRun(t)} blur={1} /><HairSpikes head={headTop(C.nai)} />
      <ChargePlate text="พยายามฆ่า" position={plate} lookAt={camP} width={0.82} />
      </>, cam: {pos: camP, look: [-0.2, 1.42, 0.45], fov: 72}};
  },
  phone: (t, lt, C) => phoneShot(t, lt, C),
  callUI: (t, lt, C) => phoneShot(t, lt, C),
  squadWalk: (t, lt, C) => {
    const list = BOMBS.map((id, i) => { const row = i % 2, x = 9.4 + Math.floor(i / 2) * 1.5 + row * 0.5 - (t - ev('squad')) * 0.55; const s = ps(id, x, 0.15 + row * 1.0, -Math.PI / 2, t, {moving: true, loco: 'walk', odo: t * 0.75 + i * 0.3, clip: 'idle_neutral_01'}); return <P key={id} o={body(C[id], s, t)} />; });
    return {node: <><Street t={t} /><Van t={t} position={[11.5, 0, -2.2]} yaw={Math.PI} flashing />{list}</>,
      cam: {pos: lerp3([3.6, 1.1, 3.55], [3.75, 1.1, 3.35], sm(lt / 1.2)), look: [9.4, 1.6, 0.2], fov: 46}, bg: {color: '#1A2648', fog: ['#1A2648', 18, 60]}};
  },
  doorway: (t, lt, C) => {
    const s = ps(BOMBS[0], 1.92, 1.2, -Math.PI / 2, t, {clip: 'idle_neutral_01'}); const w = body(C[BOMBS[0]], s, t);
    return {node: <><Bedroom st={{t, lamp: 1, door: 1, hideS: true}} /><P o={w} /></>, cam: {pos: add3(lerp3([-0.45, 1.25, 1.2], [-0.15, 1.27, 1.2], sm(lt / 1.0)), shake(t, ev('door'), 0.02, 6)), look: [1.92, 1.32, 1.2], fov: 42}};
  },
  surround: (t, lt, C) => {
    const list = BOMBS.map((id, i) => { const [x, z, yaw] = ringPos(i); return <P key={id} o={body(C[id], ps(id, x, z, yaw, t, {clip: i % 3 ? 'idle_neutral_01' : 'idle_look_around_01', lookW: [FAN_P[0], 1.1, FAN_P[2]]}), t)} />; });
    const a = lt * 0.16;
    return {node: <><Bedroom st={{t, lamp: 1, door: 1}} />{list}<Fan position={FAN_P} yaw={FAN_YAW} headYaw={SWEEP(t)} blade={bladeRun(t)} blur={1} /></>,
      cam: {pos: [-0.95 + a * 0.5, 2.5, 2.05 - a * 0.4], look: [FAN_P[0] - 0.05, 0.62, FAN_P[2]], fov: 66}};
  },
  soiCut: (t, lt, C) => {
    const out = t >= ev('out3') ? 3 : t >= ev('out2') ? 2 : t >= ev('out1') ? 1 : 0;
    const s = ps(BOMBS[1], 2.75, -2.55, Math.PI, t, {clip: 'idle_neutral_01', lookW: [2.6, 8, -3.7]}); const w = body(C[BOMBS[1]], s, t);
    const I = C[BOMBS[1]]; resetTurn(I); ik(I, 'R', new THREE.Vector3(...(toLocal(I, s, [2.72, 1.5, -2.95]) as any)), new THREE.Vector3(0.5, -1, 0), 1); ik(I, 'L', new THREE.Vector3(...(toLocal(I, s, [2.6, 1.15, -2.9]) as any)), new THREE.Vector3(-0.5, -1, 0), 1); w.updateMatrixWorld(true);
    const hand = bw(I, 'Bip01_R_Hand'), top: V3 = [2.6, 7.75, -3.7];
    const sparks = t >= ev('cut') - 0.05 && t < ev('out3');
    return {node: <><Street t={t} out={out} /><P o={w} /><CutterPole a={add3(hand, [0, -0.45, 0.12])} b={top} />
      {sparks && [0, 1, 2].map((i) => <Bolt key={i} t={t} seed={i + 4} a={[2.6, 8.05, -3.7]} b={[2.6 + (i - 1) * 0.9, 7.0 + i * 0.3, -3.3]} n={5} amp={0.14} w={0.04} />)}
      </>, cam: {pos: add3([5.9, 1.05, 4.0], shake(t, ev('cut'), 0.03, 7)), look: [1.2, 4.35, -3.7], fov: 66}, bg: {color: '#1A2648', fog: ['#1A2648', 18, 60]}};
  },
  cuffECU: (t, lt) => {
    const k = pop((t - ev('cuff')) / 0.28);
    return {node: <><Bedroom st={{t, lamp: 0, door: 1}} /><Fan position={FAN_P} yaw={FAN_YAW} blade={0.6} blur={0} lit={0} />
      <Handcuffs k={k} position={[FAN_P[0] + 0.024 * 2.2 * 1.45, 0.62, FAN_P[2]]} rotation={[Math.PI / 2, 0, 0]} size={2.2} />
      </>, cam: {pos: add3([FAN_P[0] - 0.42, 0.86, FAN_P[2] + 0.44], shake(t, ev('cuff') + 0.03, 0.008, 8)), look: [FAN_P[0] + 0.03, 0.64, FAN_P[2]], fov: 38}};
  },
  interroFront: (t, lt, C) => interro(t, lt, C, 'front'),
  caseFile: (t, lt) => ({node: <><Interro t={t} swing={1} hideS /><CaseFolder position={[-0.45, TABLE_TOP + 0.012, 0.1]} rotation={[0, 0.12, 0]} /></>,
    cam: {pos: lerp3([-0.47, TABLE_TOP + 0.5, 0.3], [-0.46, TABLE_TOP + 0.42, 0.24], sm(lt / 0.9)), look: [-0.45, TABLE_TOP + 0.01, 0.1], fov: 40}}),
  shakeNo: (t, lt, C) => interro(t, lt, C, 'shake'),
  plugECU: (t, lt) => {
    const u = ev('unplug'); const k = sm((t - u) / 0.1); const plug: V3 = add3([STRIP[0], STRIP[1] + 0.03, STRIP[2] + 0.07], [0, k * 0.2, k * 0.05]);
    const reach = sm(lt / 0.2);
    return {node: <><Interro t={t} swing={1} hideS /><PowerStrip position={STRIP} /><Plug position={plug} />
      <Cord pts={[[0.16, TABLE_TOP + 0.006, 0.34], [0.32, TABLE_TOP + 0.012, 0.33], add3(plug, [0, 0.07, 0])]} />
      <Arm position={add3(plug, [-0.09 + (1 - reach) * 0.1, -0.01 + (1 - reach) * 0.1, -0.04])} back={[0.72, 0.6, 0.35]} sleeve="#7FA5BF" skin="#B98559" grip unlit />
      </>, cam: {pos: [0.14, TABLE_TOP + 0.4, 0.86], look: [0.47, TABLE_TOP + 0.13, 0.27], fov: 36}};
  },
  windDown: (t, lt, C) => interro(t, lt, C, 'down'),
  confess: (t, lt, C) => interro(t, lt, C, 'confess'),
  court: (t, lt, C) => courtShot(t, lt, C),
  cell19: (t, lt) => ({node: <><Cell19 t={t} on={false} /><Corridor /></>, cam: {pos: lerp3([0.06, 1.3, 4.3], [0.06, 1.3, 3.95], sm(lt / 1)), look: [0.06, 1.42, 0], fov: 46}, bg: CELL_BG}),
  press3: (t, lt) => {
    const B = btnWorld(FAN_C, FAN_C_YAW, 1, 'b3'); const k = sm((t - ev('press3') + 0.18) / 0.18), pushed = t >= ev('press3');
    const dir: V3 = [Math.sin(FAN_C_YAW), 0, Math.cos(FAN_C_YAW)];
    const tip = add3(B, [dir[0] * (1 - k) * 0.16 + 0.016, -0.004, dir[2] * (1 - k) * 0.16]);
    return {node: <><Cell t={t} days={0.45} marks={0} />
      <Fan position={FAN_C} yaw={FAN_C_YAW} blade={pushed ? bladeRun(t) * sm((t - ev('press3')) / 0.3) : 0.4} blur={pushed ? sm((t - ev('press3')) / 0.3) : 0} lit={pushed ? 3 : 0} />
      <Arm position={tip} back={[0.75, -0.45, 0.6]} sleeve="#476F66" skin="#C99A6E" />
      </>, cam: {pos: add3(B, [-0.3, 0.12, 0.42]), look: add3(B, [0.03, 0.02, 0]), fov: 36}};
  },
  cellBlock: (t, lt) => {
    const fx = -0.48; const h: V3 = [FAN_C[0] + fx, 1.2, FAN_C[2] + 0.25];
    const path: V3[] = [h, [h[0] - 0.1, 1.2, 2.0], [CX18 + 0.1, 1.2, 2.1], [CX18 - 0.5, 0.95, -0.9]];
    const rattle = Math.sin(t * 40) * 0.05;
    return {node: <><Cell19 t={t} on fx={fx} /><group position={[CX18, 0, 0]}><Cell18 t={t} jarTip={rattle} /></group><Corridor />
      <mesh position={[-1.5, 5.2, 1.46]}><planeGeometry args={[11, 4.8]} /><meshLambertMaterial color="#8C9088" /></mesh>
      <mesh position={[-5.1, 1.4, 1.46]}><planeGeometry args={[4, 2.8]} /><meshLambertMaterial color="#8C9088" /></mesh>
      <mesh position={[3.2, 1.4, 1.46]}><planeGeometry args={[3.4, 2.8]} /><meshLambertMaterial color="#8C9088" /></mesh>
      <CellPlate text="แดนขัง" position={[-1.5, 3.55, 1.5]} w={1.5} />
      <Wind path={path} t={t} n={34} speed={0.9} len={0.05} w={0.024} spread={0.2} /></>,
      cam: {pos: [-1.45, 1.6, 8.4], look: [-1.45, 1.62, 0], fov: 57}, bg: CELL_BG};
  },
  mosqBlown: (t, lt) => {
    const a = ev('peel'), b = ev('splat'); const k = cl((t - a) / (b - a)); const e = k * k;
    const start: V3 = [JAR18[0] + 0.02, JAR18[1] + 0.2, JAR18[2]];
    const p = lerp3(start, WALL18, e); const stuck = t >= b;
    const camP: V3 = [0.55, 1.2, 0.95];
    const lookM = lerp3([-0.5, 0.95, -1.0], [-1.1, 1.18, -0.42], sm(k * 1.1));
    return {node: <><Cell18 t={t} jarTip={k > 0 ? Math.min(1, sm(k * 1.3)) : Math.sin(t * 40) * 0.05} />
      <Mosquito t={t} position={stuck ? WALL18 : p} rotation={stuck ? [-Math.PI / 2, 0, -Math.PI / 2] : [0.3 + k * 4, 0.6, k * 3]} flap={stuck ? 0 : 1} scale={4} />
      {!stuck && <Handcuffs k={1} position={add3(p, [0.03, -0.03, 0])} rotation={[0.4, 0.8, 0]} size={0.5} />}
      <Wind path={[[0.6, 1.2, 0.2], WALL18]} t={t} n={34} speed={1.3} len={0.12} w={0.006} spread={0.5} />
      </>, cam: {pos: add3(camP, shake(t, b, 0.03, 8)), look: lookM, fov: 50}, bg: CELL_BG};
  },
  mosqWall: (t, lt) => wallShot(t, lt, 0.62, 44, 0),
  mosqECU: (t, lt) => wallShot(t, lt, 0.3, 40, 1),
  reportForm: (t, lt) => {
    const pen = (u: number): V3 => [-0.09 + ((u * 3.1) % 1) * 0.14, TABLE_TOP + 0.016, 0.095 + Math.sin(u * 37) * 0.006];
    const P0 = pen(lt * 0.9);
    const penTop = add3(P0, [0.05, 0.16, 0.06]);
    return {node: <><Interro t={t} swing={0.4} hideS /><ReportForm position={[0, TABLE_TOP + 0.012, 0]} rotation={[0, 0, 0]} />
      <Cord pts={[P0, add3(P0, [0.025, 0.08, 0.03]), penTop]} r={0.005} />
      <Arm position={add3(penTop, [-0.06, -0.06, -0.08])} back={[0.55, 0.3, 0.75]} sleeve="#7FA5BF" skin="#B98559" grip unlit len={0.5} />
      </>, cam: {pos: lerp3([0, TABLE_TOP + 0.76, 0.16], [0, TABLE_TOP + 0.7, 0.14], sm(lt / 2.6)), look: [0, TABLE_TOP, 0.03], fov: 40}};
  },
};

const phoneShot = (t: number, lt: number, C: Cast): ShotOut => {
  const s = ps('nai', 0.85, 0.35, -0.75, t, {clip: 'idle_neutral_01', fear: 1});
  const w = body(C.nai, s, t); const I = C.nai;
  // his left hand (screen right) brings a phone to his ear
  resetTurn(I); const raise = sm(lt / 0.22); const ear = hc(I).add(new THREE.Vector3(16, -12, -2));
  fingers(I, 'L', 'cup', 1); ik(I, 'L', ear, new THREE.Vector3(0.9, -1, -0.45), raise); handTo(I, 'L', new THREE.Vector3(-0.1, 1, 0.25), new THREE.Vector3(0, 0, 1), raise);
  const ph = prop(I, 'phone', 'Bip01_L_Hand', makePhone, [9, 3.5, 0], [Math.PI / 2 - 0.5, 0, Math.PI / 2]); ph.visible = true; w.updateMatrixWorld(true);
  return {node: <><Bedroom st={{t, lamp: 1}} /><P o={w} /><HairSpikes head={headTop(I)} /></>, cam: {pos: lerp3([-0.18, 1.56, 1.45], [-0.08, 1.56, 1.33], sm(lt / 2)), look: [0.82, 1.56, 0.49], fov: 42}};
};

// the mosquito flattened on the wall: wide-eyed, still cuffed, the wind pinning it. mode 1 adds its answer.
const WALL_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
const wallShot = (t: number, lt: number, d: number, fov: number, mode: number): ShotOut => {
  const ans = ev('answer'); const answering = mode === 1 && t >= ans && t < ans + 0.9;
  const camP: V3 = lerp3([WALL18[0] + d + 0.06, WALL18[1] + 0.02, WALL18[2] + 0.05], [WALL18[0] + d, WALL18[1] + 0.01, WALL18[2] + 0.03], sm(lt / 1.2));
  const qv = Math.sin(t * 60) * 0.006;
  const ring = cl((t - ans) / 0.5);
  return {node: <><Cell t={t} days={0.45} marks={9} />
    {/* dent in the plaster */}
    {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} position={[WALL18[0] - 0.009, WALL18[1] + Math.sin(i * 1.05 + 0.4) * 0.1, WALL18[2] + Math.cos(i * 1.05 + 0.4) * 0.1]} rotation={[-(i * 1.05 + 0.4), 0, 0]}><boxGeometry args={[0.002, 0.004, 0.09]} /><meshBasicMaterial color="#6E726B" /></mesh>)}
    <Mosquito t={t} position={[WALL18[0], WALL18[1] + qv, WALL18[2]]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} flap={answering ? 1 : 0} scale={3.2} />
    <Handcuffs k={1} position={[WALL18[0] + 0.03, WALL18[1] - 0.02, WALL18[2]]} rotation={[0, Math.PI / 2, 0.2]} size={0.75} />
    <Wind path={[[WALL18[0] + 0.28, WALL18[1] + 0.02, WALL18[2] + 0.04], [WALL18[0] + 0.03, WALL18[1], WALL18[2]]]} t={t} n={16} speed={1.4} len={0.2} w={0.0016} spread={mode ? 0.1 : 0.22} />
    {mode === 1 && answering && <EchoRing position={[WALL18[0] + 0.03, WALL18[1], WALL18[2]]} quaternion={WALL_Q} k={ring} r={0.06} />}
    </>, cam: {pos: camP, look: [WALL18[0], WALL18[1], WALL18[2]], fov}};
};
