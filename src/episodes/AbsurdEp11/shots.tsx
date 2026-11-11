import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, rot, ik, fingers, rootLocal} from '../../pov/acting/ik';
import {M, MB} from '../../pov/lib/tex';
import {ev, V3, sm, lerp3, SHOTS, TOTAL, FPS} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Bedroom, Interro, Court, Cell, TABLE_TOP, BED_TOP} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {PrisonOutside} from '../AbsurdEp3/props';
import {Phone3D, Stars} from '../AbsurdEp4/props';
import {PrisonGate} from '../AbsurdEp6/props';
import {Sparks7} from '../AbsurdEp7/props';
import {camMove, SirenLights, Cam, MoveOpts} from '../absurdkit';
import {SQUAD} from './cast';
import {Clock, Battery, LooseHands, Pliers, PhoneTime, SecurityFile, Zs, Sala, Lawn, Crowd, SALA_SEAT, CC, CD, CR} from './props';

/** EP11 คดีนาฬิกาปลุก. The offender is a twin-bell alarm clock: it rings 30 minutes early, keeps ringing until the bomb squad
 *  pulls its battery, twitches its second hand at the interrogator, loses its hands in court and ends up a meditation master. */
type Inst = any; type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm3 = (a: V3): V3 => mul3(a, 1 / Math.hypot(...a));
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;

// ---- people (same staging helpers as EP1–10)
type PSo = {clip?: string; moving?: boolean; lookW?: V3; face?: string; poseId?: string; odo?: number};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...(POSES as any)[o.poseId ?? 'stand']({t, phase: 0, talking: false, seed: id.length, speed: 0} as any), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: false,
    odo: o.odo ?? (o.moving ? t * 1.4 : 0), poseId: o.poseId ?? 'stand', talkK: 0, fear: 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
};
const wraps = new Map<Inst, THREE.Group>();
const body = (I: Inst, s: any, t: number, y = 0, rx = 0): THREE.Group => {
  let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, y, s.z); w.rotation.set(rx, s.yaw, 0, 'YXZ'); w.scale.setScalar(I.scale); w.updateMatrixWorld(true);
  if (s.lookW) s.pose.lookL = rootLocal(I, s.lookW);
  drive(I, s, t); w.updateMatrixWorld(true);
  if (s.face) setFace(I, s.face); else autoFace(I, t, {talk: 0, fear: 0, seed: s.id.length * 3.1});
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
const loc = (I: Inst, w: V3) => rootLocal(I, w);
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
const NIGHT: Bg = {color: '#10141C'}, DARK: Bg = {color: '#1A1E22'}, SKY: Bg = {color: '#BFD6E4'};
const strike = (t: number, t0: number, up = 0.3) => { const u = t - t0; return u < -up ? 0 : u < -0.1 ? sm((u + up) / (up - 0.1)) : u < 0 ? 1 - (u + 0.1) / 0.1 : u < 0.15 ? 0.12 * Math.sin((u / 0.15) * Math.PI) : 0; };
const wobble = (t: number, hits: number[], amp = 0.05) => hits.reduce((a, h) => { const u = t - h; return u > 0 ? a + amp * Math.exp(-u * 7) * Math.sin(u * 38) : a; }, 0);
const near = (t: number, hits: number[], d = 0.12) => hits.some((h) => t > h && t < h + d);

// =====================================================================================================
// BEDROOM (EP1, night): he sleeps; the alarm clock on the nightstand faces his pillow
// =====================================================================================================
const CK: V3 = [1.27, 0.54, -1.74], CK_YAW = -1.62, CK_S = 2.0;
/** clock-local point → world (for any placement of the clock) */
const ckW = (p: V3, at: V3 = CK, yaw = CK_YAW, s = CK_S): V3 => { const c = Math.cos(yaw), n = Math.sin(yaw);
  return [at[0] + (p[0] * c + p[2] * n) * s, at[1] + p[1] * s, at[2] + (-p[0] * n + p[2] * c) * s]; };
const CK_C = ckW([0, CC, 0]);                               // dial centre
const BAY = ckW([0, CC - 0.018, -CD / 2 - 0.007]);          // the battery, at its back
const HEAD: V3 = [0.12, 0.78, -1.82];
const PH: V3 = [0.9, 1.2, -1.55];                          // where he holds the phone up next to the clock
const ringK = (t: number) => t < ev('ring') ? 0 : t < ev('pull') ? 1 : Math.max(0, 1 - (t - ev('pull')) / 0.12);
const bedClock = (t: number, o: {jolt?: number} = {}) => <Clock position={CK} yaw={CK_YAW} scale={CK_S} t={t} time={6} sec={Math.min(t, ev('pull')) + 3} ring={ringK(t)} battery={t < ev('grip')} jolt={o.jolt ?? 0} />;
/** him lying on his back. `hold`: left hand up at that point (the phone); `point`: left arm flung at the clock */
const lying = (C: Cast, t: number, o: {face?: string; look?: V3; point?: number; hold?: V3; holdK?: number} = {}) => {
  const I = C.nai; hideProps(I);
  const s = ps('nai', 0.12, -0.22, 0, t, {clip: 'idle_neutral_01', face: o.face ?? 'closed', lookW: o.look});
  const w = body(I, s, t, BED_TOP + 0.13, -Math.PI / 2); resetTurn(I);
  const pk = o.point ?? 0;
  if (pk > 0.01) { fingers(I, 'L', 'point', 1); const jab = Math.sin(t * 16) * 0.02; ik(I, 'L', loc(I, [0.66 + jab, 0.98, -1.66]), V(0, -1, 0), pk); }
  else if (o.hold) { fingers(I, 'L', 'fist', 1); ik(I, 'L', loc(I, o.hold), V(0.5, 0, -1), o.holdK ?? 1); }
  w.updateMatrixWorld(true); return w;
};
const wakeFace = (t: number) => t < ev('wake') ? 'closed' : 'wide';
const bedroom = (t: number, o: {door?: number; ceiling?: boolean} = {}) => <><Bedroom st={{t, lamp: 0.25, made: false, door: o.door, ceiling: o.ceiling, hideClock: true} as any} />
  <mesh castShadow receiveShadow position={[0.12, 0.69, -0.62]} scale={[0.78, 0.13 + Math.sin(t * 1.6) * 0.006, 0.62]} material={M('#5E8FA6', 0.95)}><sphereGeometry args={[1, 18, 12]} /></mesh></>;

// the bomb squad: six officers pour in through the door (east wall) and ring the bed, crouched, eyes on the clock
const DOOR_IN: V3 = [2.4, 0, 1.2];
const SQ_AT: [number, number][] = [[1.95, -1.45], [1.75, 0.15], [1.0, 0.55], [0.0, 0.7], [-1.0, 0.5], [-1.5, -0.7]];
const squadIn = (C: Cast, t: number, o: {skip0?: boolean} = {}) => SQUAD.map((id, i) => {
  if (i === 0 && o.skip0) return null;
  const I = C[id]; hideProps(I); const at = SQ_AT[i];
  const k = sm((t - ev('door') - 0.05 - i * 0.1) / 0.55);
  const p = lerp3(add3(DOOR_IN, [0, 0, i * 0.2]), [at[0], 0, at[1]], k); const running = k > 0 && k < 1;
  const yy = running ? Math.atan2(at[0] - DOOR_IN[0], at[1] - DOOR_IN[2]) : Math.atan2(CK[0] - at[0], CK[2] - at[1]);
  const s = ps(id, p[0], p[2], yy, t, {moving: running, odo: k * 3, clip: running ? 'run_neutral_01' : 'crouch_idle', lookW: add3(CK, [0, 0.15, 0])});
  return <P key={id} o={body(I, s, t)} />;
});
// the lead officer and the giant pliers: a rigid 1.05 m tool, jaws creeping in on the battery at the clock's back
const PL = 1.05;
const PM_AT: V3 = [1.95, 0, -1.45];
const plDir = norm3([1.82 - BAY[0], 1.3 - BAY[1], -1.55 - BAY[2]]);   // from the battery back toward his hands
const plTip = (t: number): V3 => {
  const a = sh('pliers').t0, g = ev('grip'), p = ev('pull');
  const far = 0.5 * (1 - sm((t - a) / (g - a - 0.08)));
  const back = t < p ? 0 : 0.55 * sm((t - p) / 0.14);
  const tr = t < g ? Math.sin(t * 31) * 0.004 : 0;
  return add3(BAY, [plDir[0] * (far + back), plDir[1] * (far + back) + tr + back * 0.2, plDir[2] * (far + back)]);
};
const plOpen = (t: number) => t < ev('grip') ? 1 : Math.max(0.2, 1 - (t - ev('grip')) / 0.08);
/** an officer holding the pliers by the grips (hands at 0.1 / 0.3 m from the handle end) */
const holdPliers = (I: Inst, tail: V3, tip: V3) => { const d = norm3([tip[0] - tail[0], tip[1] - tail[1], tip[2] - tail[2]]);
  fingers(I, 'R', 'fist', 1); fingers(I, 'L', 'fist', 1);
  ik(I, 'R', loc(I, add3(tail, mul3(d, 0.1))), V(0.6, -1, 0), 1); ik(I, 'L', loc(I, add3(tail, mul3(d, 0.32))), V(-0.6, -1, 0), 1); };
const plierMan = (C: Cast, t: number) => {
  const I = C[SQUAD[0]]; hideProps(I); const tip = plTip(t), tail = add3(tip, mul3(plDir, PL));
  const s = ps(SQUAD[0], PM_AT[0], PM_AT[2], Math.atan2(CK[0] - PM_AT[0], CK[2] - PM_AT[2]), t, {clip: 'idle_neutral_01', lookW: BAY});
  const w = body(I, s, t); resetTurn(I); holdPliers(I, tail, tip); w.updateMatrixWorld(true);
  return <><P o={w} /><Pliers tail={tail} tip={tip} open={plOpen(t)} />
    {t >= ev('grip') && <Battery position={tip} rotation={[0, CK_YAW, t > ev('pull') ? (t - ev('pull')) * 2 : 0]} scale={CK_S} />}</>;
};

// =====================================================================================================
// INTERROGATION (EP1): the clock on the table, battery out — and its second hand still twitches at the lieutenant
// =====================================================================================================
const RT_INT: V3 = [0, TABLE_TOP, -0.12], INT_YAW = 0.5, INT_S = 2.6;
const twitch = (t: number) => { const u = (t * 2.2) % 1; return 14 + (u < 0.14 ? Math.sin((u / 0.14) * Math.PI) * 1.3 : 0); };
const interroRoom = (C: Cast, t: number) => {
  const I = C.offA; hideProps(I);
  const s = ps('offA', 0, 0.85, Math.PI, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: add3(RT_INT, [0, 0.2, 0])});
  const w = body(I, s, t); resetTurn(I);
  const hits = [ev('slam'), ev('rage')]; const up = Math.max(...hits.map((h) => strike(t, h, 0.35)));
  fingers(I, 'R', 'flat', 1); ik(I, 'R', loc(I, [0.26, TABLE_TOP + 0.05 + up * 0.4, 0.32 - up * 0.06]), V(0.6, -1, -0.3), 1);
  setFace(I, hits.some((h) => t > h - 0.35 && t < h + 0.5) ? 'shout' : 'angry'); w.updateMatrixWorld(true);
  const J = C[SQUAD[1]]; hideProps(J); const c = body(J, ps(SQUAD[1], -1.0, -1.0, Math.PI * 0.2, t, {clip: 'idle_neutral_01', lookW: add3(RT_INT, [0, 0.2, 0])}), t);
  return <><Interro t={t} swing={0.3} /><P o={w} /><P o={c} /><SecurityFile position={[-0.45, TABLE_TOP + 0.017, 0.1]} w={0.22} />
    <Clock position={RT_INT} yaw={INT_YAW} scale={INT_S} t={t} time={6} sec={twitch(t)} battery={false} jolt={wobble(t, hits, 0.04)} lit={0.35} /></>;
};

// =====================================================================================================
// COURT (EP1): the clock in the dock facing the bench; the court orders its hands removed — the pliers again
// =====================================================================================================
const RT_CT: V3 = [0, 1.04, 0.6], CT_S = 2.6;
const CT_C: V3 = [0, 1.04 + CC * CT_S, 0.6 - (CD / 2 + 0.012) * CT_S];   // the centre pin (dial faces −z, toward the bench)
const ctDir = norm3([-0.85, 0.42, -0.3]);
const ctTip = (t: number): V3 => { const a = sh('unhand').t0, u = ev('unhand');
  const far = 0.45 * (1 - sm((t - a) / (u - 0.18 - a))); const back = t < u ? 0 : 0.6 * sm((t - u) / 0.14);
  return add3(CT_C, mul3(ctDir, far + back)); };
const courtRoom = (C: Cast, t: number, pliers = false) => {
  const I = C.judge; hideProps(I);
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.2, 0.6], face: t > ev('gavel') - 0.3 && t < ev('gavel') + 0.4 ? 'shout' : 'angry'});
  const w = body(I, s, t, 0.5);
  prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  const lift = strike(t, ev('gavel'), 0.4);
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - lift * 1.0, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - lift * 0.6, I.root); w.updateMatrixWorld(true);
  const u = ev('unhand'); const tip = ctTip(t), tail = add3(tip, mul3(ctDir, PL));
  const B = C[SQUAD[0]]; hideProps(B);
  const bs = ps(SQUAD[0], -1.05, 0.15, 1.9, t, {clip: 'idle_neutral_01', lookW: CT_C}); const b = body(B, bs, t); resetTurn(B);
  if (pliers) { holdPliers(B, tail, tip); b.updateMatrixWorld(true); }
  return {I, node: <><Court t={t} /><P o={w} /><P o={b} />
    <Clock position={add3(RT_CT, [0, wobble(t, [ev('gavel')], 0.02), 0])} yaw={Math.PI} scale={CT_S} t={t} time={6} sec={14} hands={t < u} battery={false} jolt={wobble(t, [ev('gavel'), u], 0.04)} />
    {pliers && <><Pliers tail={tail} tip={tip} open={t < u - 0.16 ? 1 : Math.max(0.12, 1 - (t - u + 0.16) / 0.08)} />
      {t >= u && <LooseHands position={tip} rotation={[0, Math.PI, (t - u) * 3]} scale={CT_S} />}
      {t > u && t < u + 0.4 && <Stars center={CT_C} t={t * 3} r={0.16} size={0.04} />}</>}</>};
};

// =====================================================================================================
// CELL BLOCK / PRISON / the meditation centre
// =====================================================================================================
const CELL_BG: Bg = {color: '#2A2E33'};
const cellClock = (t: number, x = 0.1, z = 0.7, hop = 0, yaw = 0.15) => <Clock position={[x, hop, z]} yaw={yaw} scale={3.6} t={t} hands={false} battery={false} tilt={0} />;
const plates = <><CellPlate text="ห้อง 21" position={[0, 2.12, 1.54]} w={0.64} /><CellPlate text="5 ปี" position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" /></>;
const corridor = <><mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, -0.002, 3.2]} material={M('#8E918B')}><planeGeometry args={[14, 3.6]} /></mesh>
  <mesh position={[-1.5, 1.4, 5.0]} rotation={[0, Math.PI, 0]} material={M('#6F736D')}><planeGeometry args={[14, 2.8]} /></mesh></>;
const DAY = () => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} /><directionalLight position={[-8, 16, 10]} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-far={60} /></>;

const SALA: V3 = [0, 0, -3];
const MASTER: V3 = add3(SALA, SALA_SEAT), MS = 4;
const master = (t: number) => <Clock position={MASTER} scale={MS * (1 + Math.sin(t * 1.3) * 0.008)} t={t} hands={false} battery={false} robe lit={0.15} />;
/** cross-legged on the ground: the chair-sit clip lowered to the floor, thighs opened, shins folded in */
const SIT_Y = -0.36;
const sitCross = (C: Cast, id: string, x: number, z: number, t: number, bow = 0) => {
  const I = C[id]; hideProps(I);
  const s = ps(id, x, z, Math.atan2(MASTER[0] - x, MASTER[2] - z), t, {poseId: 'sitIdle', clip: 'sit_chair_idle_neutral_01', face: 'closed'});
  const w = body(I, s, t, SIT_Y); resetTurn(I);
  ([['L', 1], ['R', -1]] as const).forEach(([sd, k]) => {
    rot(I.bones[`Bip01_${sd}_Thigh`], 0, 1, 0, k * 0.9, I.root); rot(I.bones[`Bip01_${sd}_Calf`], 0, 0, 1, -k * 1.4, I.root); });
  if (bow > 0.001) { rot(I.bones.Bip01_Spine, 1, 0, 0, bow * 0.7, I.root); rot(I.bones.Bip01_Spine1, 1, 0, 0, bow * 0.5, I.root); }
  w.updateMatrixWorld(true); return <P key={id} o={w} />;
};
// the congregation: the man front and centre, then the judge, the officers and the bomb squad — everyone who put it away
const SEATS: [string, number, number][] = [['dis1', -1.15, 0.25], ['nai', 0, 0.1], ['dis2', 1.15, 0.25],
  ['judge', -1.7, 1.3], ['dis3', -0.57, 1.3], ['dis4', 0.57, 1.3], ['offA', 1.7, 1.3],
  [SQUAD[0], -2.2, 2.35], ['dis5', -1.1, 2.35], ['offB', 0, 2.35], [SQUAD[1], 1.1, 2.35], [SQUAD[2], 2.2, 2.35]];
const bowK = (t: number, row: number) => sm((t - ev('bow') - row * 0.12) / 0.45);
const congregation = (C: Cast, t: number) => SEATS.map(([id, x, z], i) => sitCross(C, id, x, z, t, bowK(t, i < 3 ? 0 : i < 7 ? 1 : 2)));
const salaScene = (C: Cast, t: number, o: {people?: boolean; crowd?: boolean; open?: boolean} = {}) => <><Lawn /><Sala position={SALA} open={o.open} />{DAY()}{master(t)}
  {o.people && congregation(C, t)}{o.crowd && <Crowd face={MASTER} z0={3.4} />}</>;

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  sleep: (t, lt, C) => {
    // frame 0: night, he is fast asleep; the clock ticks on the nightstand behind him
    const w = lying(C, t, {face: 'closed'});
    return {node: <>{bedroom(t)}<P o={w} />{bedClock(t)}<Zs from={add3(HEAD, [-0.12, 0.2, 0.1])} t={t} /></>,
      cam: mv({pos: [0.98, 1.32, -0.95], look: [0.22, 0.86, -1.68], fov: 42}, lt, {arrive: 0.1, push: 0.07, side: 0.4, roll0: -2, roll: 1}), bg: NIGHT};
  },
  ring: (t, lt, C) => {
    // ECU from his pillow: the bells go off — 06:00 on the dial
    const w = lying(C, t, {face: wakeFace(t)});
    return {node: <>{bedroom(t)}<P o={w} />{bedClock(t)}</>,
      cam: mv({pos: add3(CK_C, [-0.72, 0.16, 0.12]), look: add3(CK_C, [0, 0.04, 0]), fov: 42}, lt, {arrive: 0.08, push: 0.12, roll0: 3, shake: t > ev('ring') ? 0.004 : 0}), bg: NIGHT};
  },
  early: (t, lt, C) => {
    // he holds his phone up beside it: 05:30 standard time against the clock's 06:00
    const k = sm((lt * 30) / 6); const ph: V3 = [PH[0], PH[1] - (1 - k) * 0.45, PH[2]]; const cam: V3 = [0.3, 1.45, -0.55];
    const w = lying(C, t, {face: 'wide', look: CK_C, hold: add3(ph, [0, -0.13, 0.02]), holdK: k});
    return {node: <>{bedroom(t)}<P o={w} />{bedClock(t)}<PhoneTime position={ph} face={cam} scale={1.7} roll={0.06} /><pointLight position={add3(ph, [-0.2, 0, 0.15])} color="#A8CCF0" intensity={0.5} distance={1.2} /></>,
      cam: mv({pos: cam, look: [1.06, 0.95, -1.63], fov: 36}, lt, {arrive: 0.08, push: 0.07, roll0: -2}), bg: NIGHT};
  },
  charge: (t, lt, C) => {
    // he flings a finger at it; the plate drops on "ปลอมแปลงเวลาราชการ"
    const w = lying(C, t, {look: CK_C, face: 'shout', point: sm((t - sh('charge').t0 - 0.1) / 0.18)});
    return {node: <>{bedroom(t)}<P o={w} />{bedClock(t)}</>,
      cam: mv({pos: [-0.7, 1.95, -0.45], look: [0.5, 0.72, -1.8], fov: 56}, lt, {arrive: 0.1, push: 0.1, roll0: -3, shake: near(t, [ev('plate1')], 0.2) ? 0.01 : 0}), bg: NIGHT};
  },
  phone: (t, lt) => {
    // his POV: the 3D phone slides up, thumb on 191
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [0.12, 1.0, -1.5], look: [0.3, 1.3, 0.6], fov: 54}, lt, {push: 0.08, arrive: 0});
    return {node: <>{bedroom(t)}{bedClock(t)}<Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: NIGHT};
  },
  callUI: (t, lt, C) => SHOT_FN.phone(t, lt + 0.7, C),
  raid: (t, lt, C) => {
    // wide from the bed head: the door bursts, the bomb squad pours in under the strobe; the clock is still ringing
    const d = sm((t - ev('door')) / 0.08);
    const w = lying(C, t, {face: 'wide', look: [2.0, 1.4, 1.0]});
    return {node: <>{bedroom(t, {door: d})}<P o={w} />{bedClock(t)}{squadIn(C, t)}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={6} /></>,
      cam: mv({pos: [-1.3, 1.85, -1.9], look: [1.5, 1.0, 0.3], fov: 52}, lt, {arrive: 0.12, push: 0.08, roll0: -4, shake: near(t, [ev('door')], 0.2) ? 0.02 : 0}), bg: NIGHT};
  },
  surround: (t, lt, C) => {
    // top-down reveal: six suits in a ring round the bed, the man flat in the middle, the clock rattling on the nightstand
    const w = lying(C, t, {face: 'wide', look: CK_C});
    return {node: <>{bedroom(t, {door: 1, ceiling: false})}<P o={w} />{bedClock(t)}{squadIn(C, t)}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={5} /></>,
      cam: mv({pos: [0.2, 6.9, 0.05], look: [0.2, 0, -0.3], fov: 60}, lt, {arrive: 0.1, push: 0.05, roll0: 4, roll: -3}), bg: NIGHT};
  },
  pliers: (t, lt, C) => {
    // from the bed side: the lead officer feeds the giant pliers in behind the ringing clock, hands trembling
    return {node: <>{bedroom(t, {door: 1})}{bedClock(t)}{plierMan(C, t)}{squadIn(C, t, {skip0: true})}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={4} /></>,
      cam: mv({pos: [0.15, 1.05, -1.45], look: [1.6, 1.0, -1.66], fov: 48}, lt, {arrive: 0.08, push: 0.12, roll0: -3}), bg: NIGHT};
  },
  battery: (t, lt, C) => {
    // ECU behind the clock: the jaws close on the battery and yank it — sparks, the bells die
    const p = ev('pull'); const w = lying(C, t, {face: 'wide', look: CK_C});
    return {node: <>{bedroom(t, {door: 1})}<P o={w} />{bedClock(t, {jolt: wobble(t, [p], 0.1)})}{plierMan(C, t)}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={3} />
      <Sparks7 at={BAY} t={t} t0={p} n={14} speed={1.6} />{t > p && t < p + 0.4 && <Stars center={add3(BAY, [0, 0.12, 0])} t={t * 3} r={0.12} size={0.035} />}</>,
      cam: mv({pos: add3(BAY, [0.42, 0.22, -0.3]), look: add3(BAY, [-0.03, 0.05, 0.02]), fov: 44}, lt, {arrive: 0.1, push: 0.1, roll0: 4, shake: near(t, [p], 0.18) ? 0.012 : 0}), bg: NIGHT};
  },
  carry: (t, lt, C) => {
    // "นำตัวไป": carried out at pliers' length, dangling by its handle
    const I = C[SQUAD[0]]; hideProps(I); const x = 1.45, z = -1.0 + lt * 1.3, yaw = 0;
    const s = ps(SQUAD[0], x, z, yaw, t, {moving: true, odo: lt * 1.3, clip: 'walk_neutral_01'}); const w = body(I, s, t); resetTurn(I);
    const tail: V3 = [x, 1.15, z + 0.25]; const tip = add3(tail, [0, 0.14, PL]);
    holdPliers(I, tail, tip); w.updateMatrixWorld(true); const sw = Math.sin(t * 7) * 0.22;
    const m = lying(C, t, {face: 'wide', look: tip});
    return {node: <>{bedroom(t, {door: 1})}<P o={m} /><P o={w} /><Pliers tail={tail} tip={tip} open={0.1} />
      <group position={tip} rotation={[sw, -Math.PI / 2, 0]}><Clock position={[0, -(CC + CR + 0.05) * 2.2, 0]} scale={2.2} t={t} sec={20} battery={false} /></group><SirenLights t={t} position={[2.6, 2.0, 1.4]} power={3} /></>,
      cam: mv({pos: [-1.9, 1.3, 0.35], look: [1.45, 1.0, 0.25], fov: 48}, lt, {arrive: 0.1, push: 0.08, roll0: 3}), bg: NIGHT};
  },
  interro: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: [0.9, 1.7, 2.5], look: [0, 0.98, -0.1], fov: 42}, lt, {push: 0.09, arrive: 0.1, shake: near(t, [ev('slam')]) ? 0.014 : 0}), bg: DARK}),
  file: (t, lt, C) => ({node: interroRoom(C, t),
    cam: mv({pos: [-0.45, TABLE_TOP + 0.62, 0.36], look: [-0.45, TABLE_TOP, 0.09], fov: 34}, lt, {push: 0.06, arrive: 0.08, roll0: 4, roll: -2}), bg: DARK}),
  tick: (t, lt, C) => ({node: interroRoom(C, t),
    cam: mv({pos: add3(RT_INT, [0.42, CC * INT_S + 0.06, 0.62]), look: add3(RT_INT, [0, CC * INT_S, 0]), fov: 38}, lt, {push: 0.12, arrive: 0.08, roll0: -3}), bg: DARK}),
  defy: (t, lt, C) => ({node: interroRoom(C, t),
    cam: mv({pos: [0.95, TABLE_TOP + 0.5, 0.8], look: [0, TABLE_TOP + 0.3, 0.14], fov: 48}, lt, {push: 0.1, arrive: 0.08, roll0: 3, shake: near(t, [ev('rage')]) ? 0.016 : 0}), bg: DARK}),
  court: (t, lt, C) => {
    // frontal, symmetric from the gallery: the clock in the dock, the gavel comes down on the order
    const {node} = courtRoom(C, t); return {node, cam: mv({pos: [0, 2.2, 3.4], look: [0, 1.5, -2.6], fov: 44}, lt, {push: 0.12, arrive: 0.1, shake: near(t, [ev('gavel')], 0.1) ? 0.02 : 0})};
  },
  unhand: (t, lt, C) => {
    // ECU on the dial from the bench side: the same pliers grip the hands at the pin and rip them off
    const {node} = courtRoom(C, t, true);
    return {node, cam: mv({pos: add3(CT_C, [0.28, 0.2, -0.95]), look: add3(CT_C, [-0.06, 0.02, 0]), fov: 36}, lt, {push: 0.12, arrive: 0.08, roll0: -3, shake: near(t, [ev('unhand')], 0.15) ? 0.014 : 0})};
  },
  cell: (t, lt) => {
    // cell 21, "5 ปี": the bars slam, then the days flick past on the wall — locked up and forgotten
    const u = t - ev('cellShut');
    return {node: <><Cell t={t} days={u > 0 ? 0.3 + u * 1.4 : 0.3} marks={Math.max(0, Math.min(25, Math.floor(u * 16)))} />{corridor}{plates}{cellClock(t)}</>,
      cam: mv({pos: [0.5, 1.2, 4.0], look: [0, 1.05, 0.5], fov: 44}, lt, {arrive: 0.1, push: 0.09, shake: near(t, [ev('cellShut')], 0.2) ? 0.015 : 0}), bg: CELL_BG};
  },
  parole: (t, lt, C) => {
    // the guard at the bars with good news
    const I = C.offB; hideProps(I); const w = body(I, ps('offB', -0.45, 2.5, Math.PI + 0.2, t, {clip: 'idle_neutral_01', lookW: [0.1, 0.5, 0.7]}), t);
    return {node: <><Cell t={t} days={0.45} marks={25} />{corridor}{plates}{cellClock(t, 0.1, 0.7, Math.abs(Math.sin(lt * 9)) * 0.05 * sm((t - ev('stamp')) / 0.1))}<P o={w} /></>,
      cam: mv({pos: [0.9, 1.3, 4.3], look: [-0.1, 0.8, 0.9], fov: 42}, lt, {arrive: 0.08, push: 0.12, roll0: 2}), bg: CELL_BG};
  },
  onTime: (t, lt, C) => {
    // "เดินตรงเวลาเป๊ะ": it walks its laps down the corridor, one hop per tick, past the guard and his watch
    const I = C.offA; hideProps(I); const s = ps('offA', 0.15, 3.5, Math.PI, t, {clip: 'idle_neutral_01'});
    const w = body(I, s, t); resetTurn(I); const hd = bw(I, 'Bip01_Head');
    fingers(I, 'L', 'fist', 1); ik(I, 'L', loc(I, [hd[0] + 0.05, hd[1] - 0.3, hd[2] - 0.3]), V(-0.6, -1, 0), 1); rot(I.bones.Bip01_Head, 1, 0, 0, 0.35, I.root); w.updateMatrixWorld(true);
    const x = -2.5 + lt * 1.05; const hop = Math.abs(Math.sin(lt * Math.PI * 2)) * 0.14; const tl = Math.sin(lt * Math.PI * 2) * 0.1;
    return {node: <><Cell t={t} days={0.45} marks={25} /><group position={[-3.05, 0, 0]}><Cell t={t} days={0.45} marks={9} /></group>{corridor}{plates}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0.003, 3.1]} material={MB('#E8D24A')}><planeGeometry args={[0.08, 1.9]} /></mesh>
      <group position={[x, hop, 2.82]} rotation={[0, Math.PI / 2, 0]}><Clock t={t} scale={3} hands={false} battery={false} jolt={tl} yaw={-0.75} /></group><P o={w} /></>,
      cam: mv({pos: [3.0, 1.2, 3.12], look: [-0.5, 0.86, 3.1], fov: 50}, lt, {arrive: 0.08, push: 0.07, roll0: -2}), bg: CELL_BG};
  },
  release: (t, lt) => {
    // prison front, low and wide: set down outside the gate
    const hop = Math.max(0, Math.sin((t - ev('gate') - 0.3) * 7)) * 0.1 * (t > ev('gate') + 0.3 ? 1 : 0);
    return {node: <><PrisonOutside t={t} beam={0.4} /><PrisonGate t={t} /><Clock position={[0.3, hop, 2.4]} yaw={0.1} scale={3} t={t} hands={false} battery={false} />{DAY()}</>,
      cam: mv({pos: [1.4, 0.9, 5.6], look: [0.2, 1.0, 1.5], fov: 50}, lt, {push: 0.08, arrive: 0.1, roll0: -2}), bg: SKY};
  },
  noHands: (t, lt) => {
    // ECU: a blank dial, only the pin left
    return {node: <><PrisonOutside t={t} beam={0.4} /><PrisonGate t={t} /><Clock position={[0.3, 0, 2.4]} yaw={0.1} scale={3} t={t} hands={false} battery={false} jolt={Math.sin(lt * 1.5) * 0.03} />{DAY()}</>,
      cam: mv({pos: [0.62, 0.62, 3.75], look: [0.3, CC * 3 + 0.02, 2.4], fov: 32}, lt, {push: 0.1, arrive: 0.08, roll0: 2}), bg: SKY};
  },
  ordain: (t, lt, C) => ({node: salaScene(C, t), cam: mv({pos: [0.55, 1.25, -1.9], look: add3(MASTER, [0, CC * MS, 0]), fov: 36}, lt, {push: 0.1, arrive: 0.1, roll0: -2}), bg: SKY}),
  school: (t, lt, C) => ({node: salaScene(C, t), cam: mv({pos: [1.6, 1.3, 5.2], look: [0, 1.9, -1.0], fov: 52}, lt, {push: 0.07, arrive: 0.1, side: -0.4, roll0: 2}), bg: SKY}),
  disciples: (t, lt, C) => ({node: salaScene(C, t, {people: true, crowd: true}), cam: mv({pos: [0.5, 1.75, 4.9], look: [0, 1.0, -3.0], fov: 46}, lt, {push: 0.1, arrive: 0.1, roll0: -2}), bg: SKY}),
  nation: (t, lt, C) => ({node: salaScene(C, t, {people: true, crowd: true}), cam: mv({pos: [0, 7.5, 9.5], look: [0, 0.5, 1.5], fov: 54}, lt, {push: -0.3, arrive: 0}), bg: {color: '#BFD6E4', fog: ['#BFD6E4', 40, 110]}}),
  final: (t, lt, C) => {
    // over the master's shoulder: the man who called the police, front row, bows to it; the last frames hold still
    const tEnd = TOTAL / FPS - 0.5; const tt = Math.min(t, tEnd); const L = Math.min(lt, tEnd - sh('final').t0);
    return {node: salaScene(C, tt, {people: true, crowd: true, open: true}), cam: mv({pos: [0.65, 1.45, -6.6], look: [0.1, 0.75, 0.1], fov: 30}, L, {push: 0.05, arrive: 0.08, roll: 1.5}), bg: SKY};
  },
};
