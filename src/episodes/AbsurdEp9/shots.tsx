import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, fingers} from '../../pov/acting/ik';
import {ev, V3, sm, cl, lerp, lerp3, pop, SHOTS, TOTAL, FPS} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Bedroom, Interro, Court, Cell, TABLE_TOP} from '../AbsurdEp1/sets';
import {Handcuffs, makeGavel} from '../AbsurdEp1/props';
import {PrisonOutside} from '../AbsurdEp3/props';
import {Phone3D, Stars} from '../AbsurdEp4/props';
import {PrisonGate} from '../AbsurdEp6/props';
import {camMove, SirenLights, Cam, MoveOpts} from '../absurdkit';
import {Mirror, BlackBag, makeToothbrush, makeBaton, NoteSheet, SentenceSign, Steam, MIR_H} from './props';

/** EP9 คดีกระจกเงา. The offender is a real planar mirror: whatever anyone does in front of it, it does back. */
type Inst = any; type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;

// ---- people (same staging helpers as EP1–8)
type PSo = {clip?: string; moving?: boolean; talkK?: number; fear?: number; lookW?: V3; face?: string; poseId?: string; odo?: number};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...(POSES as any)[o.poseId ?? 'stand']({t, phase: 0, talking: false, seed: id.length, speed: 0} as any), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: o.odo ?? (o.moving ? t * 1.4 : 0), poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
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
  a[key].visible = true; return a[key];
};
const hideProps = (I: Inst) => { const a = attached.get(I); if (a) Object.values(a).forEach((o) => { o.visible = false; }); };
const loc = (I: Inst, s: any, w: V3) => new THREE.Vector3(...(toLocal(I, s, w) as any));
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.01; c.far = 600; c.updateProjectionMatrix();
  return null;
};
const mv = (base: Cam, lt: number, o: MoveOpts = {}) => camMove(base, lt, {arrive: 0.1, push: 0.11, ...o});
const ROOM: Bg = {color: '#BFD6E4'}, DARK: Bg = {color: '#1A1E22'};
/** a hit at t0: raise over 0.3 s, strike in 3 frames, small rebound (1 = raised, 0 = at rest / contact) */
const strike = (t: number, t0: number, up = 0.3) => { const u = t - t0; return u < -up ? 0 : u < -0.1 ? sm((u + up) / (up - 0.1)) : u < 0 ? 1 - (u + 0.1) / 0.1 : u < 0.15 ? 0.12 * Math.sin((u / 0.15) * Math.PI) : 0; };
/** damped wobble after each impact (radians) */
const wobble = (t: number, hits: number[], amp = 0.05) => hits.reduce((a, h) => { const u = t - h; return u > 0 ? a + amp * Math.exp(-u * 7) * Math.sin(u * 38) : a; }, 0);
const near = (t: number, hits: number[], d = 0.12) => hits.some((h) => t > h && t < h + d);

// =====================================================================================================
// BEDROOM (EP1, morning): a dresser against the east wall with the tabletop mirror; he brushes facing +x
// =====================================================================================================
const DR: V3 = [1.82, 0.95, -0.6];                // dresser top centre
const MAN: V3 = [1.2, 0, -0.6];
const deskM = new THREE.MeshStandardMaterial({color: '#A87A52', roughness: 0.6});
const Dresser = () => <>
  <mesh castShadow receiveShadow position={[DR[0], DR[1] / 2, DR[2]]} material={deskM}><boxGeometry args={[0.5, DR[1], 0.9]} /></mesh>
  {[0.3, 0.62].map((y) => <mesh key={y} position={[DR[0] - 0.252, y, DR[2]]} material={new THREE.MeshStandardMaterial({color: '#8E6440', roughness: 0.6})}><boxGeometry args={[0.01, 0.26, 0.8]} /></mesh>)}
  <mesh castShadow position={[DR[0] - 0.05, DR[1] + 0.06, DR[2] + 0.35]} material={new THREE.MeshStandardMaterial({color: '#F2F2EE', roughness: 0.5})}><cylinderGeometry args={[0.035, 0.035, 0.12, 12]} /></mesh>
  <mesh castShadow position={[DR[0] - 0.05, DR[1] + 0.02, DR[2] - 0.33]} rotation={[0, 0, Math.PI / 2]} material={new THREE.MeshStandardMaterial({color: '#E0453A', roughness: 0.5})}><cylinderGeometry args={[0.022, 0.022, 0.16, 10]} /></mesh>
</>;
const MIR_BED = {position: [DR[0] - 0.02, DR[1], DR[2]] as V3, yaw: -Math.PI / 2, scale: 1.5, tilt: -0.1};
const bedMirror = (t: number, o: {roll?: number} = {}) => <Mirror {...MIR_BED} roll={o.roll ?? 0} />;
/** him at the mirror: brushing (IK hand at the mouth, fast side-to-side), plus the mimic beats and the point */
const man = (C: Cast, t: number, o: {mode?: 'brush' | 'point' | 'idle' | 'phone'; x?: number; z?: number; yaw?: number; face?: string} = {}) => {
  const I = C.nai; hideProps(I); const mode = o.mode ?? 'brush';
  const s = ps('nai', o.x ?? MAN[0], o.z ?? MAN[2], o.yaw ?? Math.PI / 2, t, {clip: mode === 'phone' ? 'cell_phone_talk_01' : 'idle_neutral_01', face: o.face ?? 'half'});
  const w = body(I, s, t); resetTurn(I);
  const br = prop(I, 'brush', 'Bip01_R_Hand', makeToothbrush, [8, 0, 0], [0, Math.PI / 2, 0]); br.visible = mode !== 'phone';
  const head = bw(I, 'Bip01_Head'); const fwd: V3 = [Math.sin(s.yaw), 0, Math.cos(s.yaw)]; const side: V3 = [Math.cos(s.yaw), 0, -Math.sin(s.yaw)];
  if (mode === 'brush' || mode === 'point') {
    // brushing pauses on the mimic beat (he stops, tilts his head, lifts his left hand: the mirror does the same)
    const stopK = mode === 'point' ? 1 : sm((t - ev('tilt') + 0.15) / 0.15);
    const scrub = Math.sin(t * 29) * 0.03 * (1 - stopK);
    const mouth = add3(head, [fwd[0] * 0.12 + side[0] * scrub, -0.03 - 0.06 * (mode === 'point' ? 1 : 0), fwd[2] * 0.12 + side[2] * scrub]);
    fingers(I, 'R', 'fist', 1); ik(I, 'R', loc(I, s, mode === 'point' ? add3(head, [fwd[0] * 0.18, -0.25, fwd[2] * 0.18]) : mouth), V(-0.3, -1, 0.6), 1);
    const tilt = sm((t - ev('tilt')) / 0.2) * (1 - sm((t - ev('point') + 0.4) / 0.2));
    rot(I.bones.Bip01_Head, 0, 0, 1, 0.28 * tilt, I.root);
    // the left hand: raised palm (mimic), then a hard point at the glass (charge)
    const raise = sm((t - ev('raise')) / 0.17) * (1 - sm((t - ev('point') + 0.3) / 0.15));
    const pointK = mode === 'point' ? sm((t - ev('point')) / 0.15) : 0;
    if (raise > 0.01) { fingers(I, 'L', 'open', 1); ik(I, 'L', loc(I, s, add3(head, [fwd[0] * 0.28 - side[0] * 0.22, 0.05, fwd[2] * 0.28 - side[2] * 0.22])), V(0.4, -1, 0.3), raise); }
    if (pointK > 0.01) { fingers(I, 'L', 'point', 1); const jab = Math.sin(Math.max(0, t - ev('point')) * 16) * 0.025 * Math.exp(-Math.max(0, t - ev('point')) * 1.5);
      ik(I, 'L', loc(I, s, add3(head, [fwd[0] * (0.5 + jab) - side[0] * 0.08, -0.12, fwd[2] * (0.5 + jab) - side[2] * 0.08])), V(0.4, -1, 0), pointK); }
  }
  w.updateMatrixWorld(true);
  return w;
};
/** foam at his mouth while brushing / shouting */
const Foam: React.FC<{I: Inst; s?: number}> = ({I, s = 1}) => { const h = bw(I, 'Bip01_Head'); return <group position={add3(h, [0.115, -0.07, 0])}>
  {[[0, 0, 0, 0.022], [0.004, -0.02, 0.02, 0.015], [0.004, -0.015, -0.025, 0.017], [0.006, -0.04, 0.005, 0.012]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]} scale={r * s}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#FFFFFF" roughness={0.6} /></mesh>)}</group>; };
const bedroom = (t: number, door = 0) => <><Bedroom st={{t, lamp: 0, day: 1, door}} /><Dresser /></>;

// SWAT in the bedroom: four commandos burst through the door (east wall, z ≈ 0.8–1.6) and close on the mirror
const SW: [string, V3, number][] = [['cmd1', [1.25, 0, -1.05], 0.9], ['cmd2', [1.25, 0, -0.15], 2.3], ['cmd3', [0.75, 0, -0.95], 1.3], ['cmd4', [0.75, 0, -0.2], 1.9]];
const DOOR_IN: V3 = [2.4, 0, 1.2];
const swatIn = (C: Cast, t: number, opts: {hits?: boolean; carry?: number} = {}) => SW.map(([id, at, yaw], i) => {
  const I = C[id]; hideProps(I);
  const k = sm((t - ev('door') - 0.05 - i * 0.07) / 0.45);
  const p = lerp3(add3(DOOR_IN, [0, 0, i * 0.25]), at, k);
  const running = k > 0 && k < 1;
  const yy = running ? Math.atan2(at[0] - DOOR_IN[0], at[2] - DOOR_IN[2]) : yaw;
  const s = ps(id, p[0], p[2], yy, t, {moving: running, odo: k * 3, clip: running ? 'run_neutral_01' : 'idle_angry_01', lookW: [DR[0], 1.2, DR[2]], face: 'wide'});
  const w = body(I, s, t); resetTurn(I);
  if (opts.hits && i < 2 && k >= 1) {
    // baton blows: cmd1 on hit1 / hit3, cmd2 on hit2 / hit4; contact point = the frame edge
    prop(I, 'baton', 'Bip01_R_Hand', makeBaton, [8, 0, 0], [0, Math.PI / 2, 0]);
    const myHits = i === 0 ? [ev('hit1'), ev('hit3')] : [ev('hit2'), ev('hit4')];
    const up = Math.max(...myHits.map((h) => strike(t, h)));
    const edge: V3 = [DR[0] - 0.15, DR[1] + 0.5 + up * 0.55, DR[2] + (i === 0 ? -0.2 : 0.2)];
    fingers(I, 'R', 'fist', 1); ik(I, 'R', loc(I, s, edge), V(0.6, -1, -0.2), 1);
  }
  w.updateMatrixWorld(true);
  return <P key={id} o={w} />;
});
const HITS = () => [ev('hit1'), ev('hit2'), ev('hit3'), ev('hit4')];
const bagK = (t: number) => sm((t - ev('bag') + 0.2) / 0.25);
const bagged = (t: number, pos: V3, yaw: number, scale: number, k = 1) => <group position={pos} rotation={[0, yaw, 0]} scale={scale}><BlackBag k={k} /></group>;

// =====================================================================================================
// INTERROGATION (EP1): the mirror on the table facing +z; the lieutenant (offA) in the south chair facing it
// =====================================================================================================
const MIR_INT = {position: [0, TABLE_TOP, -0.15] as V3, scale: 1.6, tilt: -0.1};
const LT: V3 = [0, 0, 0.85];
const lieutenant = (C: Cast, t: number, face?: string) => {
  const I = C.offA; hideProps(I);
  const s = ps('offA', LT[0], LT[2], Math.PI, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.15, -0.15]});
  const w = body(I, s, t); resetTurn(I);
  const up = Math.max(strike(t, ev('slam1'), 0.35), strike(t, ev('slam2'), 0.35));
  fingers(I, 'R', 'flat', 1); ik(I, 'R', loc(I, s, [0.22, TABLE_TOP + 0.05 + up * 0.4, 0.32 - up * 0.06]), V(0.6, -1, -0.3), 1);
  const shouting = (t > ev('slam1') - 0.4 && t < ev('slam1') + 0.5) || (t > ev('slam2') - 0.4 && t < ev('slam2') + 0.5);
  setFace(I, (face as any) ?? (shouting ? (Math.floor(t * 30 / 3) % 3 ? 'talk' : 'wide') : 'half'));
  w.updateMatrixWorld(true);
  return w;
};
const unbagK = (t: number) => 1 - sm((t - ev('unbag')) / 0.3);
const interroRoom = (C: Cast, t: number) => {
  const w = lieutenant(C, t); const roll = wobble(t, [ev('slam1'), ev('slam2')], 0.02);
  const ub = unbagK(t);
  return <><Interro t={t} swing={0.3} /><Mirror {...MIR_INT} roll={roll} /><P o={w} />
    {ub > 0.01 && <group position={add3(MIR_INT.position, [0, (1 - ub) * 0.9, 0])} scale={MIR_INT.scale}><BlackBag k={1} /></group>}
    <NoteSheet position={[-0.38, TABLE_TOP + 0.004, 0.28]} rotation={[-Math.PI / 2, 0, 0.12]} w={0.26} write={(t - ev('note')) / 0.6} /></>;
};

// =====================================================================================================
// COURT (EP1): the mirror on the dock facing the bench; the judge slams, the judge in the mirror slams back
// =====================================================================================================
const MIR_CT = {position: [0, 1.04, 0.6] as V3, yaw: Math.PI, scale: 2.0, tilt: 0.06};
const GAVELS = () => [ev('gavel1'), ev('gavel2'), ev('gavel3'), ev('gavel4')];
const courtRoom = (C: Cast, t: number) => {
  const I = C.judge; hideProps(I); const mad = t > ev('gavel1') + 0.25;
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.4, 0.6], face: mad ? (Math.floor(t * 10) % 2 ? 'wide' : 'talk') : 'half'});
  const w = body(I, s, t, 0.5);
  prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  const lift = Math.max(...GAVELS().map((g, i) => strike(t, g, i === 0 ? 0.35 : 0.13)));
  const lean = mad ? 0.18 * sm((t - ev('gavel1') - 0.25) / 0.2) : 0;
  rot(I.bones.Bip01_Spine1, 1, 0, 0, lean, I.root);
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - lift * 1.0, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - lift * 0.6, I.root); w.updateMatrixWorld(true);
  return {I, node: <><Court t={t} /><P o={w} /><Mirror {...MIR_CT} roll={wobble(t, GAVELS(), 0.012)} /></>};
};

// =====================================================================================================
// CELL (EP1, lights out) and the corner-mirror job; prison front; the rented room next door
// =====================================================================================================
const MIR_CELL = {position: [-0.6, 0.46, -1.2] as V3, scale: 1.3, tilt: -0.05};
const cell = (t: number, cut: number) => <><Cell t={t} days={0.0} marks={0} /><Mirror {...MIR_CELL} dark={cut <= 0} /><pointLight position={[-0.4, 1.6, 0.2]} color="#9DB0E0" intensity={0.8} distance={3} />
  <SentenceSign position={[0.55, 2.35, 1.56]} cut={cut} w={0.8} /></>;
const ROOM2_DR = DR;   // the rented room is the same plan (same building, next door), lit at night by the ring light
const room2 = (t: number, o: {ring: number; fog: number; word?: number}) => <><Bedroom st={{t, lamp: 0.15, made: false}} /><Dresser />
  <Mirror {...MIR_BED} ring={o.ring} fog={o.fog} word={o.word ?? 0} /></>;
const fogK = (t: number) => sm((t - ev('steam')) / 1.6) * 0.92;

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  brush: (t, lt, C) => {
    // frame 0 mid-scrub: over his right shoulder into the mirror, his reflection brushing in sync
    const w = man(C, t); return {node: <>{bedroom(t)}{bedMirror(t)}<P o={w} /><Foam I={C.nai} /></>,
      cam: mv({pos: [-0.95, 1.75, -0.2], look: [DR[0], 1.4, DR[2] - 0.08], fov: 32}, lt, {arrive: 0.1, push: 0.1, side: 0.4, roll0: -2, roll: 1}), bg: ROOM};
  },
  mirrorECU: (t, lt, C) => {
    // ECU on the glass from the side: the man in the mirror, scrubbing
    const w = man(C, t); return {node: <>{bedroom(t)}{bedMirror(t)}<P o={w} /><Foam I={C.nai} /></>,
      cam: mv({pos: [0.7, 1.6, -1.2], look: [DR[0], 1.5, DR[2] - 0.2], fov: 30}, lt, {arrive: 0.1, push: 0.2}), bg: ROOM};
  },
  mimic: (t, lt, C) => {
    // he stops, tilts his head, lifts a hand — so does the other one
    const w = man(C, t, {face: t > ev('tilt') ? 'wide' : 'half'}); return {node: <>{bedroom(t)}{bedMirror(t)}<P o={w} /><Foam I={C.nai} /></>,
      cam: mv({pos: [-0.2, 1.7, -1.05], look: [DR[0], 1.42, DR[2] - 0.05], fov: 32}, lt, {arrive: 0.08, push: 0.12, side: -0.4}), bg: ROOM};
  },
  charge: (t, lt, C) => {
    // MCU from beside the mirror: he jabs a finger at the glass, foaming; the charge plate drops on the word
    const w = man(C, t, {mode: 'point', face: 'talk'}); return {node: <>{bedroom(t)}{bedMirror(t)}<P o={w} /><Foam I={C.nai} s={1.3} /></>,
      cam: mv({pos: [1.95, 1.4, 1.7], look: [1.35, 1.45, -0.6], fov: 40}, lt, {arrive: 0.1, push: 0.12, roll0: 3, shake: t > ev('plate1') && t < ev('plate1') + 0.2 ? 0.01 : 0}), bg: ROOM};
  },
  chargeBack: (t, lt, C) => {
    // past his shoulder: the one in the glass points straight back at him
    const w = man(C, t, {mode: 'point', face: 'talk'}); return {node: <>{bedroom(t)}{bedMirror(t)}<P o={w} /><Foam I={C.nai} s={1.3} /></>,
      cam: mv({pos: [0.3, 1.55, -1.1], look: [DR[0], 1.5, DR[2] - 0.12], fov: 30}, lt, {arrive: 0.1, push: 0.22, shake: t > ev('plate2') && t < ev('plate2') + 0.2 ? 0.012 : 0}), bg: ROOM};
  },
  phone: (t, lt, C) => {
    // his POV looking down: the 3D phone slides up, thumb on 191
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [MAN[0], 1.6, MAN[2]], look: [2.1, 0.6, -0.2], fov: 54}, lt, {push: 0.08, arrive: 0});
    return {node: <>{bedroom(t)}{bedMirror(t)}<Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: ROOM};
  },
  callUI: (t, lt, C) => SHOT_FN.phone(t, lt + 0.5, C),
  swat: (t, lt, C) => {
    // wide from the bed corner: the door bursts, four SWAT pour in; he flattens against the wall, toothbrush in mouth
    const d = sm((t - ev('door')) / 0.08);
    const w = man(C, t, {x: 0.55, z: 0.45, yaw: Math.PI / 2 + 0.6, face: 'wide'});
    return {node: <>{bedroom(t, d)}{bedMirror(t)}<P o={w} />{swatIn(C, t)}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={6} /></>,
      cam: mv({pos: [-1.55, 1.95, -1.75], look: [1.5, 1.05, 0.15], fov: 50}, lt, {arrive: 0.12, push: 0.08, roll0: -4, shake: t > ev('door') && t < ev('door') + 0.2 ? 0.02 : 0}), bg: ROOM};
  },
  beat1: (t, lt, C) => {
    // over the SWAT shoulders into the glass: batons come down on the frame — and the SWAT in the mirror beat back
    const roll = wobble(t, HITS());
    return {node: <>{bedroom(t, 1)}{bedMirror(t, {roll})}{swatIn(C, t, {hits: true})}
      {HITS().map((h, i) => t > h && t < h + 0.35 ? <Stars key={i} center={[DR[0] - 0.12, DR[1] + 0.55, DR[2] + (i % 2 ? 0.2 : -0.2)]} t={t * 3} r={0.1} size={0.035} /> : null)}</>,
      cam: mv({pos: [0.0, 1.75, -0.6], look: [DR[0], 1.45, DR[2]], fov: 32}, lt, {arrive: 0.1, push: 0.15, shake: near(t, HITS()) ? 0.018 : 0, roll0: 4}), bg: ROOM};
  },
  beat2: (t, lt, C) => {
    // low from the dresser side: two more blows, the mirror rocks, stars — not a crack
    const roll = wobble(t, HITS());
    return {node: <>{bedroom(t, 1)}{bedMirror(t, {roll})}{swatIn(C, t, {hits: true})}
      {HITS().map((h, i) => t > h && t < h + 0.35 ? <Stars key={i} center={[DR[0] - 0.12, DR[1] + 0.55, DR[2] + (i % 2 ? 0.2 : -0.2)]} t={t * 3} r={0.12} size={0.04} /> : null)}</>,
      cam: mv({pos: [0.95, 1.0, 0.95], look: [1.6, 1.45, -0.6], fov: 48}, lt, {arrive: 0.1, push: 0.14, shake: near(t, HITS()) ? 0.02 : 0, roll0: -5}), bg: ROOM};
  },
  bag: (t, lt, C) => {
    // high: the black bag drops over it
    return {node: <>{bedroom(t, 1)}{bedMirror(t)}{swatIn(C, t)}{bagged(t, MIR_BED.position, MIR_BED.yaw, MIR_BED.scale, bagK(t))}</>,
      cam: mv({pos: [0.2, 2.5, 0.45], look: [DR[0], 1.2, DR[2]], fov: 44}, lt, {arrive: 0.1, push: 0.12}), bg: ROOM};
  },
  cuffs: (t, lt, C) => {
    // ECU: giant cuffs snap round the frame edge sticking out of the bag
    const k = pop((t - ev('cuff')) / 0.25);
    const at: V3 = [DR[0] - 0.02, DR[1] + 0.3, DR[2] + 0.44];
    return {node: <>{bedroom(t, 1)}{bedMirror(t)}{bagged(t, MIR_BED.position, MIR_BED.yaw, MIR_BED.scale)}
      <Handcuffs k={t > ev('cuff') - 0.05 ? Math.max(0.05, k) : 0} position={at} rotation={[0, 0, Math.PI / 2]} size={2.2} /></>,
      cam: mv({pos: add3(at, [-0.75, 0.2, 0.55]), look: at, fov: 40}, lt, {push: 0.2, shake: near(t, [ev('cuff')]) ? 0.012 : 0, roll0: -5}), bg: ROOM};
  },
  carry: (t, lt, C) => {
    // wide: two SWAT march the bagged, cuffed mirror out the door; he stays at the dresser, brushing again
    const k = sm((lt - 0.1) / 0.9);
    const mp = lerp3([DR[0] - 0.4, 0.95, DR[2] + 0.2], [2.2, 0.95, 1.1], k);
    const bearers = ['cmd1', 'cmd2'].map((id, i) => { const I = C[id]; hideProps(I); const s = ps(id, mp[0] - 0.35 + i * 0.7 * 0, mp[2] + (i ? 0.38 : -0.38), Math.PI / 4, t, {moving: true, odo: k * 2.5, clip: 'walk_neutral_01', face: 'half'});
      const w = body(I, s, t); resetTurn(I); fingers(I, 'R', 'fist', 1); fingers(I, 'L', 'fist', 1);
      ik(I, i ? 'R' : 'L', loc(I, s, add3(mp, [0, 0.35, i ? 0.15 : -0.15])), V(0, -1, 0), 1); w.updateMatrixWorld(true); return <P key={id} o={w} />; });
    const w = man(C, t, {face: 'half'});
    return {node: <>{bedroom(t, 1)}<P o={w} /><Foam I={C.nai} />{bearers}
      <group position={mp} rotation={[0, Math.PI / 4, 0]} scale={1.5}><Mirror tilt={0} res={256} /><BlackBag k={1} /></group>
      <Handcuffs k={1} position={add3(mp, [0.05, 0.4, 0.15])} rotation={[0, Math.PI / 4, Math.PI / 2]} size={2.2} /></>,
      cam: mv({pos: [-1.3, 1.7, -1.7], look: [1.4, 1.0, 0.2], fov: 48}, lt, {arrive: 0.1, push: -0.08}), bg: ROOM};
  },
  interro: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: [0, 1.65, 2.6], look: [0, 1.05, -0.15], fov: 42}, lt, {push: 0.09, arrive: 0.1}), bg: DARK}),
  interroCU: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: [0.32, 1.22, -0.05], look: [0, 1.25, 0.85], fov: 42}, lt, {push: 0.15, arrive: 0.08, roll0: 3}), bg: DARK}),
  slam: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: [-0.6, 1.55, 2.25], look: [0, 1.12, -0.15], fov: 38}, lt, {push: 0.12, arrive: 0.1, shake: near(t, [ev('slam1')]) ? 0.012 : 0}), bg: DARK}),
  slam2: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: [-0.3, 1.38, 1.45], look: [0, 1.18, -0.15], fov: 38}, lt, {push: 0.2, arrive: 0.08, shake: near(t, [ev('slam2')]) ? 0.014 : 0, roll0: -3}), bg: DARK}),
  note: (t, lt, C) => ({node: <>{interroRoom(C, t)}<hemisphereLight args={['#FFF6E8', '#3A3028', 0.8]} /></>,
    cam: mv({pos: [-0.38, TABLE_TOP + 0.9, 0.3], look: [-0.38, TABLE_TOP, 0.27], fov: 34}, lt, {push: 0.06, arrive: 0.08}), bg: DARK}),
  court: (t, lt, C) => {
    // frontal, symmetric from the gallery: the mirror's back on the dock, the judge raises the gavel and slams
    const {node} = courtRoom(C, t); return {node, cam: mv({pos: [1.5, 2.3, 3.2], look: [-0.1, 1.45, -2.6], fov: 44}, lt, {push: 0.12, arrive: 0.1, shake: near(t, [ev('gavel1')]) ? 0.015 : 0})};
  },
  judgeMad: (t, lt, C) => {
    // over the judge's shoulder into the glass: the judge in the mirror slams back, red-faced; he goes berserk
    const {I, node} = courtRoom(C, t);
    return {node: <>{node}{GAVELS().map((g, i) => t > g && t < g + 0.3 ? <Stars key={i} center={add3(bw(I, 'Bip01_R_Hand'), [0, -0.05, 0.1])} t={t * 3} r={0.08} size={0.03} /> : null)}</>,
      cam: mv({pos: [0.42, 1.78, -3.55], look: [0, 1.62, 0.6], fov: 26}, lt, {push: 0.22, arrive: 0.06, shake: near(t, GAVELS(), 0.08) ? 0.02 : 0, roll0: 4})};
  },
  darkCell: (t, lt) => ({node: cell(t, 0), cam: mv({pos: [0.2, 1.5, 3.0], look: [-0.2, 1.0, -0.6], fov: 46}, lt, {push: 0.1, arrive: 0.1}), bg: {color: '#05070A'}}),
  reduce: (t, lt) => ({node: cell(t, (t - ev('cut3')) / 0.15), cam: mv({pos: [0.5, 2.1, 2.55], look: [0.55, 2.3, 1.56], fov: 40}, lt, {push: 0.15, arrive: 0.08}), bg: {color: '#05070A'}}),
  cornerMirror: (t, lt, C) => {
    // the corridor outside the cells: it is screwed up in the corner as a blind-spot mirror; a guard checks it and nods
    const I = C.offB; hideProps(I); const s = ps('offB', 0.4, 2.6, Math.PI + 0.5, t, {clip: 'idle_look_around_01', lookW: [-1.2, 2.3, 1.85], face: 'half'}); const w = body(I, s, t);
    return {node: <><Cell t={t} days={0.3} marks={3} /><mesh position={[0, 0, 3.2]} rotation={[-Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({color: '#8E918B'})}><planeGeometry args={[6, 4]} /></mesh>
      <group position={[-1.3, 2.05, 1.75]} rotation={[0.35, 0.75, 0]}><Mirror tilt={0} scale={1.1} res={512} /></group><P o={w} /></>,
      cam: mv({pos: [1.4, 1.2, 4.4], look: [-0.5, 1.7, 2.0], fov: 48}, lt, {push: 0.1, arrive: 0.1, side: 0.4}), bg: {color: '#2A2E33'}};
  },
  release: (t, lt) => {
    // prison front, low and wide: the gate, and the little mirror set down outside it, alone
    return {node: <><PrisonOutside t={t} beam={0.4} /><PrisonGate t={t} /><Mirror position={[0.3, 0, 2.4]} scale={2.4} tilt={-0.05} res={512} />
      <hemisphereLight args={['#DCE8F2', '#5A5446', 1.0]} /><directionalLight position={[-6, 9, 14]} color="#FFF1D6" intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} /></>,
      cam: mv({pos: [1.6, 1.0, 6.6], look: [0.1, 1.3, 1.5], fov: 50}, lt, {push: 0.08, arrive: 0.1, roll0: -2}), bg: {color: '#BFD6E4'}};
  },
  ringLive: (t, lt) => ({node: room2(t, {ring: sm((t - ev('ring')) / 0.08), fog: 0}), cam: mv({pos: [0.65, 1.48, -0.6], look: [DR[0], 1.45, DR[2]], fov: 42}, lt, {push: 0.12, arrive: 0.1}), bg: {color: '#10141C'}}),
  steam: (t, lt) => ({node: <>{room2(t, {ring: 1, fog: fogK(t)})}<Steam from={[0.5, 1.6, -2.15]} to={[1.6, 1.5, -0.6]} t={t} t0={ev('steam') - 0.4} /></>,
    cam: mv({pos: [-0.2, 1.6, 0.6], look: [1.3, 1.4, -0.9], fov: 48}, lt, {push: 0.1, arrive: 0.1, roll0: 2}), bg: {color: '#10141C'}}),
  live0: (t, lt) => ({node: <>{room2(t, {ring: 1, fog: fogK(t)})}<Steam from={[0.9, 1.6, -1.6]} to={[1.6, 1.5, -0.6]} t={t} t0={ev('steam')} n={10} /></>,
    cam: mv({pos: [0.75, 1.47, -0.6], look: [DR[0], 1.45, DR[2]], fov: 40}, lt, {push: 0.1, arrive: 0.08}), bg: {color: '#10141C'}}),
  fogEnd: (t, lt) => {
    // the fogged glass; "แค้น" written in it with a finger, slowly misting over. The last frames freeze.
    const tEnd = TOTAL / FPS - 0.5; const tt = Math.min(t, tEnd); const L = Math.min(lt, tEnd - sh('fogEnd').t0);
    const word = sm((tt - ev('fogEnd') + 0.1) / 0.3) * (1 - 0.6 * sm((tt - ev('fogEnd') - 1.6) / 2.0));
    return {node: room2(tt, {ring: 1, fog: 0.95, word}), cam: mv({pos: [-0.15, 1.46, -0.6], look: [DR[0], 1.46, DR[2]], fov: 40}, L, {push: 0.05, arrive: 0.06}), bg: {color: '#10141C'}};
  },
};
void cl; void lerp; void MIR_H; void ROOM2_DR;
