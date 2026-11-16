import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl, pop} from './data';
import {Bedroom, Court} from '../AbsurdEp1/sets';
import {makeGavel, Handcuffs} from '../AbsurdEp1/props';
import {Arm} from '../AbsurdEp2/props';
import {Stars} from '../AbsurdEp4/props';
import {Glow, SunBall} from '../AbsurdEp8/props';
import {Phone} from '../AbsurdEp16/props';
import {Jet} from '../AbsurdEp17/props';
import {ps, body, bw, hideProps, prop, P, CamRig, mv, strike, near, sm, V3, Cast, ShotOut, toward, hand, hw, Bg} from '../lifekit/stage';
import {CourtLife} from '../lifekit/presets';
import {DayPage, Annotation, WallCalendar, WallClock, CAL, Sea, SkyDome, DateLine, LineSign, YesterdaySign, CountBoard, Checkpoint, PONTOON, BOOTH,
  PoliceBoat, Bouquet, FlowerArch, Passport, RubberStamp, waveY, WorkPile, Laptop, RuleSign} from './props';

export {CamRig};
/** EP18 คดีวันจันทร์. He watches Sunday run out; at midnight Monday comes in again, with no passport (illegal entry). A hundred police boats
 *  string barbed wire along the date line; the sunrise gets asked for its passport; Monday is cuffed at the line, the court deports it back to
 *  yesterday. It comes back to the sergeant at the checkpoint every week; he becomes the one person in the world who waits for Monday; they
 *  marry, it gets citizenship. Now the sergeant hates Tuesday.
 *  Monday only does what Monday does (arrives at midnight, every week, and leaves after a day). Everything else is the people.
 *  Monday = its yellow tear-off sheet "จันทร์ 16" (Thai day colours: Sunday red, Monday yellow, Tuesday pink). No face, ever.
 *
 *  LAYOUT (metres; yaw 0 faces +z; root +x is the character's LEFT)
 *  bedroom EP1 Bedroom (room x ±2.1, z ±2.2, bed against the north wall, mattress top 0.56). He sits on the bed's foot edge at (0.25, −0.3)
 *          facing +z (body y 0.11). The calendar hangs on the south wall at CALP (0.55, 1.45, 2.185) facing −z, the clock above it at 1.9.
 *          For the charge and the call he stands at (0.35, 0.7) facing the calendar.
 *  sea     the date line runs along z at x = 0: our side (Sunday, the checkpoint) is −x, Monday comes in from +x. The pontoon spans
 *          x −6.2…−0.7, z ±2.4, deck 0.32 (it bobs a little: `deck(t)`); booth at (−4.7, −1.1); a striped barrier along the pontoon's +x edge.
 *          Monday stops at PAGE (1.0, 0) turned −0.9 rad, so its face reads from the pontoon AND from cameras on the +z side.
 *          The sergeant stands at the barrier (−1.0, −0.6) facing it. The line sign stands in the water at (0, −16) facing −x: out of every +z camera, a landmark down the line in `wire`.
 *          The fleet: 10 × 10 boats, rows 5 m apart in x (−12…−57), 3 m apart in z (±13.5), bows to +x.
 *  court   EP1 Court; Monday (2.1 m) stands on the floor right of the bench at (1.05, −1.75), facing the camera, small cuffs on its edge.
 *
 *  TRAPS OF THIS EPISODE (written before the first shot)
 *  1. The arrest must be SEEN (the words only say "wire" and "passport"): the silent beat before the court is the giant cuffs closing on
 *     Monday's edge, chained to the sergeant's hand, with a flash and stars.
 *  2. "ร้อยลำ" must be countable: top-down over a 10 × 10 grid of boats, bows up the frame (roll0 90).
 *  3. The sergeant is planted early: his face is the sun's point of view in `palm` (he asks the sunrise for its passport), long before the
 *     narrator names him in line 8. Khaki shirt, white cap, moustache: nobody else in the episode looks like him.
 *  4. The sun is a bystander, never cuffed. Monday is in frame from `sun` on (a yellow speck far out on the water, gliding in).
 *  5. A page seen edge-on is a line: every camera on the +z side needs Monday turned towards it (PAGE_YAW), never flat to −x.
 *  6. Both sides of a page are printed (it must read from the pontoon and from the water).
 *  7. Time of day carries the story: arrest at dawn, the weekly visits flip night/day, the waiting at night (one lit booth in a dark fleet),
 *     the wedding by day, Tuesday at dawn. The closer's picture walks on to the last frame (no silent gag: (ฉ) is banned for EP18).
 *  8. The man is only in the bedroom; after the call the story belongs to the sergeant. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// =====================================================================================================
// THE BEDROOM
// =====================================================================================================
const CALP: V3 = [0.55, 1.45, 2.185], CLKP: V3 = [0.55, 1.9, 2.18], SEAT = {x: 0.25, z: -0.3}, STAND = {x: 0.35, z: 0.7};
/** the clock: seconds tick to midnight on `midnight` */
const hours = (t: number) => (24 * 3600 + Math.floor(t - ev('midnight') + 1e-6)) / 3600 % 24;
/** Monday's luggage: the work pile lands on the bed at `pile` (gravity), the laptop beside him starts filling up at `mail` */
const PILE: V3 = [-0.42, 0.56, -0.5], LAP: V3 = [0.78, 0.56, -0.62];
const pileDrop = (t: number) => { const u = ev('pile') - t; return u > 0 ? Math.min(2.2, 0.5 * 9.8 * u * u) : 0; };
const mails = (t: number) => t < ev('mail') ? 0 : Math.min(300, 300 * Math.pow(cl((t - ev('mail')) / 1.5), 1.6));
const bedroom = (t: number) => <><Bedroom st={{t, lamp: 0.3, made: false, hideClock: true} as any} />
  {t > ev('pile') - 0.65 && <WorkPile position={PILE} drop={pileDrop(t)} yaw={0.2} />}{t > ev('peel') && <Laptop position={LAP} yaw={-0.35} count={mails(t)} />}
  <WallCalendar position={CALP} yaw={Math.PI} t={t} peel={t - ev('peel')} floorY={0} /><WallClock position={CLKP} yaw={Math.PI} hours={hours(t)} />
  {t > ev('peel') && <pointLight position={[0.55, 1.5, 1.7]} color="#FFD65A" intensity={0.9 * sm((t - ev('peel')) / 0.3)} distance={2.5} decay={1.6} />}</>;
type GO = {clip?: string; face?: string; look?: V3; y?: number; sit?: boolean};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? (o.sit ? 'sit_table_idle_neutral_01' : 'idle_neutral_01'), ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {}), ...(o.sit ? {poseId: 'sitIdle'} : {})}), t, o.y ?? 0);
  return {I, w}; };
const CAL_LOOK: V3 = [CALP[0], CALP[1] + 0.1, CALP[2]];
const manSit = (C: Cast, t: number, face = 'half') => { const m = guy(C, 'nai', SEAT.x, SEAT.z, 0, t, {sit: true, y: 0.11, face, look: CAL_LOOK});
  hand(m.I, 'R', [SEAT.x - 0.22, 0.6, SEAT.z + 0.18], 'open'); hand(m.I, 'L', [SEAT.x + 0.22, 0.6, SEAT.z + 0.18], 'open'); m.w.updateMatrixWorld(true); return m; };
const manStand = (C: Cast, t: number, face: string) => guy(C, 'nai', STAND.x, STAND.z, Math.atan2(CALP[0] - STAND.x, CALP[2] - STAND.z), t, {face, look: CAL_LOOK});
const NIGHT_IN: Bg = {color: '#1A2238'};

// =====================================================================================================
// THE SEA
// =====================================================================================================
type Tod = 'night' | 'dawn' | 'day';
const SKIES: Record<Tod, {top: string; mid: string; low: string; sea: string; far: string; bg: string; fog: [string, number, number]}> = {
  night: {top: '#070B1C', mid: '#1C2A55', low: '#2A3A66', sea: '#1A2C52', far: '#16264A', bg: '#0E1630', fog: ['#22325E', 60, 260]},
  dawn: {top: '#34406E', mid: '#F29A66', low: '#FFD3A0', sea: '#3E5C80', far: '#6A7FA0', bg: '#F2A070', fog: ['#E9B08C', 80, 320]},
  day: {top: '#5E9AD6', mid: '#A9CDEA', low: '#D6E8F2', sea: '#2F7FA6', far: '#5E9CBC', bg: '#BFD6E4', fog: ['#CFE2EE', 90, 340]}};
const lights = (tod: Tod) => tod === 'night'
  ? <><hemisphereLight args={['#5468A0', '#0A1020', 0.75]} /><directionalLight position={[-14, 18, 9]} target-position={[-1, 0, 0]} color="#9DB7FF" intensity={1.0} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} shadow-bias={-0.0004} /></>
  : tod === 'dawn'
  ? <><hemisphereLight args={['#FFD9B8', '#33405C', 0.95]} /><directionalLight position={[30, 7, 6]} target-position={[-1, 0, 0]} color="#FFB37A" intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={80} shadow-bias={-0.0004} /></>
  : <><hemisphereLight args={['#DCE8F2', '#2E4A5C', 1.1]} /><directionalLight position={[-8, 16, 10]} target-position={[-1, 0, 0]} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} shadow-bias={-0.0004} /></>;
const bgOf = (tod: Tod): Bg => ({color: SKIES[tod].bg, fog: SKIES[tod].fog});
const PAGE: V3 = [1.0, 0, 0], PAGE_YAW = -0.9, PH = 2.6;
const PAGE_DIR: V3 = [Math.cos(PAGE_YAW), 0, -Math.sin(PAGE_YAW)];   // the page's local +x in the world
const pageEdge = (s: 1 | -1, y: number, at: V3 = PAGE): V3 => [at[0] + s * PH * 0.4 * PAGE_DIR[0], y, at[2] + s * PH * 0.4 * PAGE_DIR[2]];
/** Monday gliding in to the line: far out on the water during `sun`, stops at PAGE right after the passport line */
const glideX = (t: number) => PAGE[0] + 62 * (1 - sm((t - (ev('glide') - 1.7)) / 2.0));
const monday = (t: number, at: V3, o: {yaw?: number; veil?: number; h?: number} = {}) => <DayPage day="mon" position={[at[0], waveY(at[0], at[2], t) * 0.5 + 0.05, at[2]]} yaw={o.yaw ?? PAGE_YAW} h={o.h ?? PH} t={t} veil={o.veil} />;
const FLEET: V3[] = Array.from({length: 100}, (_, i) => [-12 - Math.floor(i / 10) * 5, 0, -13.5 + (i % 10) * 3]);
const deck = (t: number) => PONTOON.top + 0.25 * waveY(-3, 0, t);
const sea = (t: number, tod: Tod, o: {noPost?: boolean; wireFrom?: number; wireTo?: number; noWire?: boolean; bar?: number; clock?: number; fleet?: 'all' | 'near' | 'none'; fleetLights?: number; at?: V3} = {}) => { const S = SKIES[tod];
  const fl = o.fleet ?? 'near';
  return <><SkyDome top={S.top} mid={S.mid} low={S.low} /><Sea t={t} color={S.sea} far={S.far} at={o.at ?? [-6, 0, 0]} />{lights(tod)}
    <DateLine t={t} z0={-40} z1={40} wireFrom={o.noWire ? 99 : o.wireFrom ?? -40} wireTo={o.noWire ? 99 : o.wireTo ?? 40} />
    {!o.noPost && <Checkpoint t={t} night={tod === 'night'} clock={o.clock} bar={o.bar} />}<LineSign position={[0, 0, -16]} yaw={-Math.PI / 2} t={t} />
    {fl === 'all' && FLEET.map((p, i) => <PoliceBoat key={i} position={p} t={t} seed={i} lights={o.fleetLights ?? 1} />)}
    {fl === 'near' && [[-9, 0, 6], [-12, 0, -5], [-7.5, 0, -9], [-15, 0, 9]].map((p, i) => <PoliceBoat key={i} position={p as V3} yaw={0.2 * i} t={t} seed={i} lights={o.fleetLights ?? 1} />)}</>; };
/** the sergeant on the pontoon */
const SG = {x: -1.0, z: -0.6};
const SG_YAW = Math.atan2(PAGE[0] - SG.x, PAGE[2] - SG.z);
type DO = {x?: number; z?: number; yaw?: number; face?: string; look?: V3; R?: V3 | null; L?: V3 | null; rs?: string; ls?: string; bouquet?: boolean};
const sergeant = (C: Cast, t: number, o: DO = {}) => { const d = guy(C, 'dab', o.x ?? SG.x, o.z ?? SG.z, o.yaw ?? SG_YAW, t, {face: o.face ?? 'angry', ...(o.look ? {look: o.look} : {}), y: deck(t)});
  if (o.R) hand(d.I, 'R', o.R, o.rs ?? 'fist'); if (o.L) hand(d.I, 'L', o.L, o.ls ?? 'open'); d.w.updateMatrixWorld(true);
  const bq = o.bouquet ? <Bouquet at={add(bw(d.I, 'Bip01_R_Hand'), [0, 0.02, 0])} s={1.1} /> : null;
  return {...d, node: <><P o={d.w} />{bq}</>}; };
/** a point in front of him at chest height, `f` metres out, `s` metres to his side (+ = his left), height y above the deck */
const front = (t: number, f: number, s: number, y: number, x = SG.x, z = SG.z, yaw = SG_YAW): V3 => [x + Math.sin(yaw) * f + Math.cos(yaw) * s, deck(t) + y, z + Math.cos(yaw) * f - Math.sin(yaw) * s];

/** the stamping arm: its fist (0.13 m behind the fingertip along `back`) sits on the stamp's knob */
const ARM_BACK: V3 = [-0.45, 0.85, -0.3]; const ARM_OFF: V3 = (() => { const n = Math.hypot(...ARM_BACK); return ARM_BACK.map((v) => -0.13 * v / n) as V3; })();
// ---- the cuffs at the line: one ring round Monday's near edge, the other in the sergeant's right hand
const CUFF_A = add(pageEdge(-1, PH - 0.06), [0.32 * PAGE_DIR[0], 0, 0.32 * PAGE_DIR[2]]), CUFF_HAND: V3 = [-0.68, 1.35, -0.6];
/** the cuffs fly from his hand and close on the bar: ring axis along the page's bar (local z), rings apart along local x */
const cuffAt = (t: number, hand: V3 = CUFF_HAND) => { const u = t - ev('cuff'); const k = 1 - Math.pow(1 - cl((u + 0.22) / 0.22), 3);
  const B = hand, A = lerp3(add(CUFF_HAND, [0.3, 0.3, 0.1]), CUFF_A, k);
  const z = new THREE.Vector3(...PAGE_DIR), d = new THREE.Vector3(A[0] - B[0], A[1] - B[1], A[2] - B[2]); const x = d.clone().sub(z.clone().multiplyScalar(d.dot(z)));
  const len = x.length(); x.normalize(); const y = z.clone().cross(x); const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  const mid: V3 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
  return {mid, q, size: Math.max(6, len / (2.9 * 0.024)), k: cl((u + 0.3) / 0.08)}; };
const giantCuffs = (t: number, hand: V3) => { const c = cuffAt(t, hand); return c.k <= 0 ? null : <group position={c.mid} quaternion={c.q}><Handcuffs k={c.k} size={c.size} /></group>; };

// =====================================================================================================
// COURT
// =====================================================================================================
const COURT_PAGE: V3 = [1.05, 0, -1.75];
const courtRoom = (C: Cast, t: number) => { const I = C.judge;
  const pose = (tt: number) => { hideProps(I);
    const w = body(I, ps('judge', 0, -3.25, 0, tt, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [1.05, 1.6, -1.75], face: tt > ev('gavel') - 0.35 && tt < ev('gavel') + 0.5 ? 'shout' : 'angry'}), tt, 1.25);
    const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]); const up = strike(tt, ev('gavel'), 0.4);
    rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - up, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - up * 0.6, I.root); w.updateMatrixWorld(true); return {w, g}; };
  let bb = new THREE.Box3(), top = -1e9; pose(ev('gavel')).g.traverse((o: any) => { if (!o.isMesh) return; const b = new THREE.Box3().setFromObject(o); const cy = (b.min.y + b.max.y) / 2; if (cy > top) { top = cy; bb = b; } });
  const blk: V3 = [(bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2];
  const {w} = pose(t);
  return <><Court t={t} /><P o={w} /><CourtLife t={t} C={C} look={[1.05, 1.2, -1.75]} />
    <DayPage day="mon" position={COURT_PAGE} h={2.1} t={t} flutter={0.4} />
    <Handcuffs k={1} position={[COURT_PAGE[0] - 0.84, 1.0, COURT_PAGE[2] + 0.02]} rotation={[0.2, 0, Math.PI / 2]} size={5} />
    <mesh position={[blk[0], blk[1] - 0.03, blk[2]]} castShadow><boxGeometry args={[0.3, 0.06, 0.26]} /><meshLambertMaterial color="#5A3019" /></mesh>
    {blk[1] - 0.06 > 1.5 && <mesh position={[blk[0], (blk[1] - 0.06 + 1.5) / 2, blk[2]]}><boxGeometry args={[0.07, blk[1] - 0.06 - 1.5, 0.07]} /><meshLambertMaterial color="#7A4526" /></mesh>}</>; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: MCU, night, he sits on the foot of his bed and watches the last of Sunday on the wall (off screen, behind the lens)
    const m = manSit(C, t);
    return {node: <>{bedroom(t)}<P o={m.w} /></>, cam: mv({pos: [0.78, 1.32, 1.3], look: [0.22, 1.12, -0.3], fov: 46}, lt, {arrive: 0.08, push: 0.2, roll0: -2}), bg: NIGHT_IN};
  },
  clock: (t, lt, C) => {
    // over his shoulder: the calendar says Sunday the 15th, the clock is seconds from midnight
    const m = manSit(C, t);
    return {node: <>{bedroom(t)}<P o={m.w} /></>, cam: mv({pos: [-0.2, 1.55, -1.05], look: [0.55, 1.62, 2.18], fov: 36}, lt, {arrive: 0.08, push: 0.22, roll0: 2}), bg: NIGHT_IN};
  },
  peel: (t, lt, C) => {
    // ECU calendar + clock: the second hand reaches twelve — and Sunday lets go of the wall. Under it: Monday, in yellow.
    const m = manSit(C, t, t > ev('peel') ? 'wide' : 'half');
    return {node: <>{bedroom(t)}<P o={m.w} /></>, cam: mv({pos: [0.55, 1.64, 1.12], look: [0.55, 1.64, 2.18], fov: 48}, lt, {arrive: 0.05, push: 0.06, shake: near(t, [ev('peel')], 0.1) ? 0.004 : 0}), bg: NIGHT_IN};
  },
  note: (t, lt, C) => {
    // tighter on the Monday sheet: a red dashed box where its passport should be, a cross, "พาสปอร์ต"
    const k = sm((t - ev('note')) / 0.25); const m = manSit(C, t, 'wide');
    return {node: <>{bedroom(t)}<P o={m.w} /><Annotation position={[CALP[0], CALP[1] - 0.02, CALP[2] - 0.03]} yaw={Math.PI} s={0.24} k={k} /></>,
      cam: mv({pos: [0.55, 1.47, 1.5], look: [0.55, 1.38, 2.18], fov: 48}, lt, {arrive: 0.06, push: 0.12}), bg: NIGHT_IN};
  },
  pile: (t, lt, C) => {
    // "พางานกองโต": a pile of work folders drops out of nowhere onto the bed beside him — thump, he flinches
    const m = manSit(C, t, t > ev('pile') ? 'wide' : 'half');
    return {node: <>{bedroom(t)}<P o={m.w} /></>, cam: mv({pos: [0.4, 1.35, 1.35], look: [0.0, 0.9, -0.4], fov: 50}, lt, {arrive: 0.06, push: 0.12, shake: near(t, [ev('pile')], 0.15) ? 0.015 : 0}), bg: NIGHT_IN};
  },
  mail: (t, lt, C) => {
    // ECU: the laptop beside him, the unread count climbing to 300
    const m = manSit(C, t, 'wide');
    return {node: <>{bedroom(t)}<P o={m.w} /></>, cam: mv({pos: [LAP[0] + 0.2, LAP[1] + 0.34, LAP[2] + 0.5], look: [LAP[0] + 0.02, LAP[1] + 0.14, LAP[2]], fov: 46}, lt, {arrive: 0.05, push: 0.14}), bg: NIGHT_IN};
  },
  ask: (t, lt, C) => {
    // he stands at the calendar and holds out his hand: passport, please
    const k = sm((t - ev('ask') + 0.15) / 0.3); const m = manStand(C, t, 'angry');
    const sR = bw(m.I, 'Bip01_R_UpperArm'); hand(m.I, 'R', lerp3(add(sR, [0.05, -0.45, 0.1]), toward(sR, add(CAL_LOOK, [0, -0.25, 0]), 0.5), k), 'open'); m.w.updateMatrixWorld(true);
    return {node: <>{bedroom(t)}<P o={m.w} /></>, cam: mv({pos: [1.25, 1.35, 1.95], look: [0.42, 1.3, 0.6], fov: 52}, lt, {arrive: 0.07, push: 0.08}), bg: NIGHT_IN};
  },
  charge: (t, lt, C) => {
    // he is up, pointing at the wall: snap zoom, the plate drops
    const z = sm((t - ev('plate') + 0.12) / 0.17); const m = manStand(C, t, 'shout');
    const sR = bw(m.I, 'Bip01_R_UpperArm'); hand(m.I, 'R', toward(sR, CAL_LOOK, 0.55), 'point'); m.w.updateMatrixWorld(true);
    return {node: <>{bedroom(t)}<P o={m.w} /></>, cam: mv({pos: [1.15, 0.98, 1.85], look: [0.42, 1.38, 0.62], fov: 60 - 12 * z}, lt, {arrive: 0.08, push: 0.05, shake: near(t, [ev('plate')], 0.1) ? 0.01 : 0}), bg: NIGHT_IN};
  },
  phone: (t, lt, C) => {
    // the call: phone up to his ear, his other hand still pointing at Monday
    const k = sm((t - ev('phoneUp')) / 0.25); const m = manStand(C, t, 'shout');
    const ear = hw(m.I, [12, 12, 2]); const ph = lerp3(bw(m.I, 'Bip01_L_Thigh'), add(ear, [0.03, -0.01, 0.01]), k);
    hand(m.I, 'L', add(ph, [0.03, -0.06, -0.02]), 'cup'); m.w.updateMatrixWorld(true);
    return {node: <>{bedroom(t)}<P o={m.w} /><Phone position={ph} rotation={[0, Math.atan2(CALP[0] - STAND.x, CALP[2] - STAND.z) + Math.PI / 2, 0.18 * k]} /></>,
      cam: mv({pos: [1.0, 1.52, 1.55], look: [0.38, 1.45, 0.7], fov: 44 - 7 * sm((t - ev('phoneUp') - 0.45) / 0.17)}, lt, {arrive: 0.07, push: 0.08}), bg: NIGHT_IN};
  },
  map: (t, lt, C) => {
    // "every new day comes in across the date line, out at sea": high over the night ocean, the line of buoys runs to the horizon
    void C; return {node: <>{sea(t, 'dawn', {noWire: true, noPost: true, fleet: 'none', at: [0, 0, -10]})}</>,
      cam: mv({pos: [-12, 16, 16], look: [0, 0, -16], fov: 50}, lt, {arrive: 0, push: 0.06}), bg: bgOf('dawn')};
  },
  linesign: (t, lt, C) => {
    // the sign on the line: Sunday on one side, Monday on the other
    void C; return {node: <>{sea(t, 'dawn', {noWire: true, noPost: true, fleet: 'none', at: [0, 0, -14]})}</>,
      cam: mv({pos: [-6.5, 2.3, -14.2], look: [0, 2.6, -16], fov: 46}, lt, {arrive: 0.07, push: 0.1}), bg: bgOf('dawn')};
  },
  checkpoint: (t, lt, C) => {
    // "so they set up a checkpoint right there": the pontoon, the booth, the barrier — and the sergeant at it, boats all round
    const d = sergeant(C, t, {face: 'angry', look: [6, 1.7, 2], R: front(t, 0.28, -0.2, 1.05), L: front(t, 0.28, 0.2, 1.05)});
    return {node: <>{sea(t, 'night', {noWire: true})}{d.node}</>, cam: mv({pos: [6.5, 3.2, 7.5], look: [-2.2, 1.0, -0.3], fov: 46}, lt, {arrive: 0.06, push: 0.08}), bg: bgOf('night')};
  },
  rule: (t, lt, C) => {
    // the rule on a yellow board at the barrier; the sergeant beside it, palm out — anyone who crosses shows a passport
    const d = sergeant(C, t, {face: 'shout', look: [3.4, 3.0, 0.4], R: front(t, 0.5, -0.12, 1.15), rs: 'open', L: front(t, 0.5, 0.3, 1.78), ls: 'open'});
    return {node: <>{sea(t, 'night')}{d.node}<RuleSign position={[-0.75, deck(t), 0.75]} yaw={Math.PI / 2} /></>,
      cam: mv({pos: [3.2, 2.5, 1.3], look: [-0.85, 1.55, 0.35], fov: 50}, lt, {arrive: 0.06, push: 0.1}), bg: bgOf('night')};
  },
  fleet: (t, lt, C) => {
    // straight down over the night sea: a hundred police boats, ten by ten, light bars going, run up the frame and brake in formation
    const stop = ev('hundred') + 0.35; const roll = (tt: number) => { const u = stop - tt; return u > 0 ? 7 * u * u : 0; };
    void C;
    return {node: <>{sea(t, 'night', {fleet: 'none', noWire: true, at: [-34, 0, 0]})}
      {FLEET.map((p, i) => <PoliceBoat key={i} position={[p[0] - roll(t), 0, p[2]]} t={t} seed={i} wake={roll(t) > 0.05 ? 1 : 0.3} />)}</>,
      cam: mv({pos: [-34, 56, 0], look: [-34, 0, 0], fov: 50}, lt, {arrive: 0.05, push: 0.07, roll0: 90}), bg: bgOf('night')};
  },
  wire: (t, lt, C) => {
    // down the line at eye level: a boat runs along it paying out coil after coil of barbed wire behind its stern
    const u = cl((t - ev('wire') + 0.25) / (ev('wireDone') - ev('wire') + 0.25)); const lay = -26 + 22 * u; const wy = waveY(1.6, lay, t); const o = guy(C, 'offA', 1.55, lay - 0.75, -Math.PI / 2, t, {face: 'angry', y: 0.5 + wy});
    hand(o.I, 'R', [1.05, 1.35 + wy, lay - 0.95], 'fist'); hand(o.I, 'L', [1.1, 1.15 + wy, lay - 0.5], 'fist'); o.w.updateMatrixWorld(true);
    return {node: <>{sea(t, 'night', {wireFrom: -40, wireTo: lay - 1.1})}<PoliceBoat position={[1.6, 0, lay]} yaw={-Math.PI / 2} t={t} seed={3} hero wake={1} /><P o={o.w} /></>,
      cam: mv({pos: [-1.6, 1.8, -2.0], look: [0.9, 1.0, -12], fov: 46}, lt, {arrive: 0.06, push: 0.08}), bg: bgOf('night')};
  },
  sun: (t, lt, C) => {
    // dawn, low and wide from the pontoon: the sun comes up over the wire. Far out on the water, something yellow.
    const y = -14 + 24 * sm((t - ev('sunUp') + 0.2) / 1.6); const d = sergeant(C, t, {face: 'angry', look: [200, 4, 4]});
    return {node: <>{sea(t, 'dawn')}<SunBall position={[230, y, 9]} r={13} />{monday(t, [glideX(t), 0, PAGE[2]])}{d.node}</>,
      cam: mv({pos: [-8.5, 1.3, 0.9], look: [6, 2.0, 0.4], fov: 50}, lt, {arrive: 0.06, push: 0.06}), bg: bgOf('dawn')};
  },
  palm: (t, lt, C) => {
    // the sun's point of view: the sergeant (khaki, moustache, white cap) holds up a palm — stop — and holds out the other hand. Passport.
    const k = sm((t - ev('palm') + 0.2) / 0.2); const cam: V3 = [3.4, 3.4, 0.4];
    const d = sergeant(C, t, {face: 'shout', look: cam, R: lerp3(front(t, 0.2, -0.2, 1.0), front(t, 0.5, -0.12, 1.15), k), rs: 'open', L: lerp3(front(t, 0.15, 0.22, 1.0), front(t, 0.5, 0.3, 1.78), k), ls: 'open'});
    return {node: <>{sea(t, 'dawn')}{d.node}<Glow p={[2.5, 3.2, 0.3]} c="#FFE2A0" s={3} o={0.25} /></>,
      cam: mv({pos: cam, look: [SG.x, deck(t) + 1.35, SG.z], fov: 40}, lt, {arrive: 0.06, push: 0.1}), bg: bgOf('dawn')};
  },
  glidein: (t, lt, C) => {
    // dawn: something yellow comes gliding over the water to the wire. The sergeant turns.
    const d = sergeant(C, t, {face: t > ev('glide') - 0.3 ? 'angry' : 'open', look: add([glideX(t), 0, PAGE[2]], [0, 1.6, 0]), R: front(t, 0.3, -0.2, 1.1), L: front(t, 0.3, 0.25, 1.15)});
    return {node: <>{sea(t, 'dawn')}{monday(t, [glideX(t), 0, PAGE[2]])}{d.node}</>,
      cam: mv({pos: [-4.2, 1.7, 0.2], look: [6, 1.5, -0.9], fov: 50}, lt, {arrive: 0.05, push: 0.08}), bg: bgOf('dawn')};
  },
  arrest: (t, lt, C) => {
    // no line: Monday glides up to the wire — and the giant cuffs go round its edge, chained to the sergeant's fist. Flash, stars.
    const d = sergeant(C, t, {face: 'shout', look: CUFF_A, R: cuffAt(t).k > 0 ? CUFF_HAND : front(t, 0.3, -0.2, 1.1), rs: 'fist', L: front(t, 0.3, 0.25, 1.15)});
    return {node: <>{sea(t, 'dawn')}{monday(t, [glideX(t), 0, PAGE[2]])}{d.node}{giantCuffs(t, add(bw(d.I, 'Bip01_R_Hand'), [0.04, 0.02, 0]))}
      {near(t, [ev('cuff')], 0.35) && <Stars center={CUFF_A} t={t * 3} r={0.35} size={0.12} />}</>,
      cam: mv({pos: [-0.4, 1.7, 6.0], look: [0.1, 1.3, 0], fov: 50}, lt, {arrive: 0.07, push: 0.08, shake: near(t, [ev('cuff')], 0.12) ? 0.015 : 0}), bg: bgOf('dawn')};
  },
  court: (t, lt, C) => ({node: courtRoom(C, t), cam: mv({pos: [0.5, 1.95, 3.4], look: [0.55, 1.65, -2.6], fov: 40}, lt, {arrive: 0.07, push: 0.07, shake: near(t, [ev('gavel')], 0.1) ? 0.012 : 0})}),
  deport: (t, lt, C) => {
    // by day: a police boat tows Monday, still cuffed, out across the water towards a road sign in the sea: "เมื่อวาน →"
    const u = Math.max(0, t - ev('tow')); const px = PAGE[0] + 0.5 + 5.5 * u + 1.5 * u * u; const bx = px + 4.2; void C;
    const bow: V3 = [bx - 1.6, 0.6, 0.2], tail = pageEdge(1, 1.0, [px, 0, 0.2]);
    return {node: <>{sea(t, 'day', {at: [6, 0, 0]})}{monday(t, [px, 0, 0.2])}<PoliceBoat position={[bx, 0, 0.2]} t={t} seed={7} wake={1} />
      <mesh position={lerp3(bow, tail, 0.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(tail[0] - bow[0], tail[1] - bow[1], tail[2] - bow[2]).normalize())}><cylinderGeometry args={[0.02, 0.02, Math.hypot(tail[0] - bow[0], tail[1] - bow[1], tail[2] - bow[2]), 5]} /><meshLambertMaterial color="#C9B48A" /></mesh>
      <YesterdaySign position={[14, 0, -2.4]} yaw={-Math.PI / 2 + 0.35} t={t} s={1.7} /></>,
      cam: mv({pos: [-3.4, 2.4, 4.6], look: [9, 1.3, -1.2], fov: 46}, lt, {arrive: 0.06, push: 0.08}), bg: bgOf('day')};
  },
  back: (t, lt, C) => {
    // night, a week later: it is back at the wire, facing him. The board on the post: Monday's visits, 1.
    const d = sergeant(C, t, {face: 'angry', look: add(PAGE, [0, 1.6, 0]), R: front(t, 0.25, -0.22, 1.05), L: front(t, 0.25, 0.22, 1.05)});
    return {node: <>{sea(t, 'night', {clock: 0.02})}{monday(t, [PAGE[0] + 3 * (1 - sm((t - ev('back') + 0.3) / 0.45)), 0, PAGE[2]])}{d.node}<CountBoard position={[-1.9, deck(t) + 1.5, -1.6]} yaw={0.2} n={1} /></>,
      cam: mv({pos: [-0.1, 1.75, 6.6], look: [0.0, 1.45, -0.3], fov: 50}, lt, {arrive: 0.06, push: 0.07}), bg: bgOf('night')};
  },
  weeks: (t, lt, C) => {
    // the same two, week after week: the sky snaps night/day/night, the count goes 2, 3, 4 — and his face goes from angry to soft
    const step = t < ev('w3') ? 2 : t < ev('w4') ? 3 : 4; const tod: Tod = step === 3 ? 'day' : 'night';
    const d = sergeant(C, t, {face: step === 2 ? 'angry' : step === 3 ? 'half' : 'open', look: add(PAGE, [0, 1.6, 0]), R: front(t, 0.25, -0.22, 1.05), L: front(t, 0.25, 0.22, 1.05)});
    return {node: <>{sea(t, tod)}{monday(t, PAGE)}{d.node}<CountBoard position={[-1.9, deck(t) + 1.5, -1.6]} yaw={0.2} n={step} /></>,
      cam: mv({pos: [-0.1, 1.75, 6.6], look: [0.0, 1.45, -0.3], fov: 48 - 4 * (step - 2)}, lt, {arrive: 0, push: 0.05, shake: near(t, [ev('w3'), ev('w4')], 0.08) ? 0.01 : 0}), bg: bgOf(tod)};
  },
  alone: (t, lt, C) => {
    // crane up over the dark sea: a hundred boats, every light off; one lit booth, one man at the barrier with flowers
    const k = sm((t - sh('alone').t0) / 1.6); const d = sergeant(C, t, {face: 'open', yaw: Math.PI / 2, x: -1.15, z: 0.2, look: [20, 1.7, 0.2], R: front(t, 0.28, -0.18, 1.1, -1.15, 0.2, Math.PI / 2), rs: 'fist', bouquet: true});
    return {node: <>{sea(t, 'night', {fleet: 'all', fleetLights: 0, clock: 23.98})}{d.node}</>,
      cam: mv({pos: [7 + 3 * k, 2.2 + 11 * k, 6 + 2 * k], look: [-8, 0.4, -1.5], fov: 48}, lt, {arrive: 0, push: 0.02}), bg: bgOf('night')};
  },
  wait: (t, lt, C) => {
    // MCU from the water: he waits at the barrier with his bouquet, smiling; the booth clock behind him says 23:59
    const d = sergeant(C, t, {face: t > ev('sigh') ? 'closed' : 'open', yaw: Math.PI / 2, x: -1.15, z: 0.2, look: [6, 1.9, 0.6], R: front(t, 0.28, -0.18, 1.1, -1.15, 0.2, Math.PI / 2), rs: 'fist', bouquet: true});
    return {node: <>{sea(t, 'night', {clock: 23.983})}{d.node}<pointLight position={[0.2, 2.0, 0.9]} color="#FFD6A0" intensity={1.4} distance={4} decay={1.5} /></>,
      cam: mv({pos: [0.55, 1.85, 1.15], look: [-1.7, 1.78, -0.1], fov: 42}, lt, {arrive: 0.06, push: 0.1}), bg: bgOf('night')};
  },
  wedding: (t, lt, C) => {
    // by day, on the line: a flower arch, the barrier up, Monday in a veil, the sergeant beside it with the bouquet. Two boats spray an arch of water.
    const d = sergeant(C, t, {face: 'open', x: -0.95, z: 0.6, yaw: 0.3, look: [0, 1.8, 6], R: front(t, 0.28, -0.12, 1.08, -0.95, 0.6, 0.3), rs: 'fist', bouquet: true});
    const A: V3 = [-7, 1.6, -9], B: V3 = [7, 1.6, -9];
    return {node: <>{sea(t, 'day', {bar: 1})}{monday(t, [0.75, 0, 0.1], {yaw: -0.25, veil: 1, h: 2.4})}{d.node}
      <group position={[-0.35, deck(t), 0.3]} rotation={[0, Math.PI / 2, 0]}><FlowerArch position={[0, 0, 0]} span={5.4} /></group>
      <PoliceBoat position={[A[0] - 0.6, 0, A[2]]} yaw={0.6} t={t} seed={1} /><PoliceBoat position={[B[0] + 0.6, 0, B[2]]} yaw={Math.PI - 0.6} t={t} seed={2} />
      <Jet a={A} b={[3, 0.5, -6]} t={t} t0={ev('jets')} t1={99} lift={7} r={0.22} seed={1} /><Jet a={B} b={[-3, 0.5, -6]} t={t} t0={ev('jets') + 0.06} t1={99} lift={7} r={0.22} seed={2} /></>,
      cam: mv({pos: [-0.35, 1.9, 6.0], look: [-0.25, 1.95, 0], fov: 52}, lt, {arrive: 0.07, push: 0.07}), bg: bgOf('day')};
  },
  stamp: (t, lt, C) => {
    // ECU, top down on the booth's desk: Monday's passport (nationality: Thai) — his khaki sleeve brings the stamp down. อนุมัติ.
    const D: V3 = [-2.6, deck(t) + 0.75, 1.5]; const up = strike(t, ev('stamp'), 0.35); const sp: V3 = [D[0] + 0.065, D[1] + 0.002 + 0.16 * up, D[2] + 0.025];
    void C;
    return {node: <>{sea(t, 'day')}<mesh position={[D[0], D[1] - 0.03, D[2]]} castShadow receiveShadow><boxGeometry args={[0.7, 0.06, 0.5]} /><meshLambertMaterial color="#8A6A48" /></mesh>
      <Passport position={add(D, [0, 0.006, 0])} w={0.3} mark={sm((t - ev('stamp')) / 0.05)} /><RubberStamp position={sp} s={0.8} />
      <Arm position={add([sp[0], sp[1] + 0.12, sp[2]], ARM_OFF)} back={ARM_BACK} sleeve="#9C7A4E" skin="#B47B52" grip /></>,
      cam: mv({pos: [D[0], D[1] + 0.85, D[2] + 0.14], look: [D[0], D[1], D[2] + 0.005], fov: 44}, lt, {arrive: 0.05, push: 0.1, shake: near(t, [ev('stamp')], 0.1) ? 0.006 : 0}), bg: bgOf('day')};
  },
  tue: (t, lt, C) => {
    // dawn again: Monday drifts off over the water; something pink glides in to the wire. He turns with the bouquet.
    const lv = sm((t - ev('leave')) / 1.4); const tx = PAGE[0] + 16 * (1 - sm((t - ev('leave') + 0.05) / 0.6));
    const d = sergeant(C, t, {face: t > ev('glare') ? 'angry' : 'open', look: lv > 0.4 ? add(PAGE, [0, 1.6, 0]) : [6, 1.8, 3], R: front(t, 0.28, -0.18, 1.1), rs: 'fist', bouquet: true});
    return {node: <>{sea(t, 'dawn')}{monday(t, [PAGE[0] + 10 * lv, 0, PAGE[2] + 6 * lv])}<DayPage day="tue" position={[tx, waveY(tx, PAGE[2], t) * 0.5 + 0.05, PAGE[2]]} yaw={PAGE_YAW} h={PH} t={t} />{d.node}</>,
      cam: mv({pos: [-0.4, 1.7, 6.2], look: [0.3, 1.35, 0], fov: 50}, lt, {arrive: 0.07, push: 0.07}), bg: bgOf('dawn')};
  },
  glare: (t, lt, C) => {
    // MCU: he glares at Tuesday across the wire, the bouquet still in his fist. The picture walks on to the end.
    const d = sergeant(C, t, {face: 'angry', look: add(PAGE, [0, 1.7, 0]), R: front(t, 0.28, -0.18, 1.1), rs: 'fist', bouquet: true});
    return {node: <>{sea(t, 'dawn')}<DayPage day="tue" position={[PAGE[0], waveY(PAGE[0], PAGE[2], t) * 0.5 + 0.05, PAGE[2]]} yaw={PAGE_YAW} h={PH} t={t} />{d.node}</>,
      cam: mv({pos: [1.9, 1.95, 1.35], look: [-1.0, 1.75, -0.6], fov: 42}, lt, {arrive: 0.06, push: 0.05}), bg: bgOf('dawn')};
  },
};
void [lerp, pop, Glow];
