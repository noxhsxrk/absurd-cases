import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot, fingers, ik} from '../../pov/acting/ik';
import {ev, SHOTS, TOTAL, FPS, lerp, lerp3, cl} from './data';
import {Court, Cell, Interro, TABLE_TOP} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {Phone3D, Stars} from '../AbsurdEp4/props';
import {Crane} from '../AbsurdEp6/props';
import {Puffs, PoliceCar} from '../AbsurdEp7/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {ps, body, bw, hideProps, prop, P, CamRig, mv, strike, wobble, near, sm, loc, V3, Cast, ShotOut, Bg} from '../lifekit/stage';
import {CourtLife} from '../lifekit/presets';
import {Moon, ManCar, carPt, SEAT, WHEEL, TownGrid, Highway, Cone, Searchlight, Board, Cup} from './props';
import type {CarPose} from './props';

export {CamRig};
/** EP15 คดีดวงจันทร์. He drives home; whichever way he turns, the Moon is still behind him. A highway roadblock, cranes that haul it out of the sky,
 *  an all-night interrogation — it was never following him, it was following the Earth (EP14, cell 18). It gets cell 19 and keeps orbiting next door. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const NIGHT: Bg = {color: '#0B1020', fog: ['#0B1020', 30, 150]} as any, HWY: Bg = {color: '#0B1020', fog: ['#0B1020', 45, 240]} as any, CELL_BG: Bg = {color: '#1E2228'};

// =====================================================================================================
// DRIVING. One car pose function per stretch; the Moon sits behind the car in the CAR's heading, a beat late (lag), so on every turn it
// swings across the sky and settles behind him again — closer each time.
// =====================================================================================================
const V = 9, TURN = 0.87, RAD = 5;
const straight = (t: number): CarPose => ({x: 0, z: -44 + V * t, yaw: 0});
/** a quarter turn of radius RAD that starts at t0 from `s`; dir +1 = left */
const turn = (t: number, t0: number, s: CarPose, dir: 1 | -1): CarPose => {
  const u = t - t0, fx = Math.sin(s.yaw), fz = Math.cos(s.yaw), lx = Math.cos(s.yaw) * dir, lz = -Math.sin(s.yaw) * dir;   // forward, and the side it turns to
  if (u <= 0) return {x: s.x + fx * V * u, z: s.z + fz * V * u, yaw: s.yaw};
  const a = Math.min(1, u / TURN) * Math.PI / 2; const cx = s.x + lx * RAD, cz = s.z + lz * RAD;
  const p = {x: cx + RAD * (-lx * Math.cos(a) + fx * Math.sin(a)), z: cz + RAD * (-lz * Math.cos(a) + fz * Math.sin(a)), yaw: s.yaw + dir * a};
  if (u <= TURN) return p; const w = u - TURN; return {x: p.x + Math.sin(p.yaw) * V * w, z: p.z + Math.cos(p.yaw) * V * w, yaw: p.yaw};
};
const carL = (t: number) => turn(t, ev('turnL'), {x: 0, z: -5, yaw: 0}, 1);
const carR = (t: number) => turn(t, ev('turnR'), {x: 35, z: 0, yaw: Math.PI / 2}, -1);
const PARK: CarPose = {x: 40, z: 16, yaw: 0};
/** the Moon behind a car: distance D, height H, following the heading the car had `lag` s ago, with a small overshoot once the turn is over */
const moonBehind = (car: (t: number) => CarPose, t: number, D: number, H: number, lag = 0.32, t0?: number, dir = 1): V3 => {
  let yaw = car(t - lag).yaw; if (t0 !== undefined) { const u = t - (t0 + TURN + lag); if (u > 0) yaw += dir * 0.3 * Math.exp(-u * 5) * Math.sin(u * 15); }
  const c = car(t); return [c.x - Math.sin(yaw) * D, H + Math.sin(t * 1.3) * 0.15, c.z - Math.cos(yaw) * D];
};
/** the man at the wheel. steer turns his hands with the rim; point = a world point his outside (right) arm points at */
const driver = (C: Cast, car: CarPose, t: number, o: {steer?: number; face?: string; look?: V3; point?: V3 | null} = {}) => {
  const I = C.nai; hideProps(I); resetTurn(I); const seat = carPt(car, SEAT.f, SEAT.r, 0);
  const w = body(I, ps('nai', seat[0], seat[2], car.yaw, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', face: o.face ?? 'half', lookW: o.look}), t, SEAT.lift);
  (['L', 'R'] as const).forEach((sd) => { const k = sd === 'R' ? 1 : -1;
    if (sd === 'R' && o.point) { fingers(I, 'R', 'point', 1); ik(I, 'R', loc(I, o.point), new THREE.Vector3(1, -0.4, 0), 1); return; }
    const a = (sd === 'R' ? 0.25 : Math.PI - 0.25) + (o.steer ?? 0);
    fingers(I, sd, 'fist', 1); ik(I, sd, loc(I, carPt(car, WHEEL.f - 0.06 - Math.sin(a) * 0.05, WHEEL.r + Math.cos(a) * WHEEL.rad, WHEEL.u + Math.sin(a) * WHEEL.rad * 0.8)), new THREE.Vector3(k, -1, 0), 1); });
  w.updateMatrixWorld(true); return {I, w};
};
const hoodCam = (c: CarPose, fov: number) => ({pos: carPt(c, 2.15, -0.5, 1.5), look: carPt(c, -0.25, 0.34, 1.2), fov});
const steerOf = (t: number, t0: number, dir: number) => { const u = (t - t0) / TURN; return u > 0 && u < 1 ? -dir * 1.1 * Math.sin(Math.PI * u) : 0; };
const MR = 3.4;   // the Moon's radius while it tails him

// =====================================================================================================
// THE HIGHWAY (along z). Roadblock at z ≈ 0; the Moon comes down the road from +z at height MH, passes over the officers at ev('over'),
// stops at z = HOOK_Z; cranes hook it (ev('hook')) and haul it down onto the back-up cars (ev('slam')).
// =====================================================================================================
const MH = 15, HR = 6, HOOK_Z = -26;
const hwMoon = (t: number): V3 => { const z = 2 - 20 * (t - ev('over')); const zz = z > HOOK_Z + 8 ? z : HOOK_Z + 8 * Math.exp((z - HOOK_Z - 8) / 8);
  const q = cl((t - ev('hook') - 0.2) / (ev('slam') - ev('hook') - 0.2)); return [0, lerp(MH, HR * 0.92, q * q) + (q <= 0 ? Math.sin(t * 1.3) * 0.2 : 0), zz]; };
const ROWS: [number, number][] = [...[-10.4, -5.2, 0, 5.2, 10.4].map((x) => [x, 0] as [number, number]), ...[-7.8, -2.6, 2.6, 7.8].map((x) => [x, -3.4] as [number, number]), ...[-10.4, -5.2, 0, 5.2, 10.4].map((x) => [x, -6.8] as [number, number])];
const BACKUP: [number, number][] = [[-4.2, HOOK_Z + 1], [0, HOOK_Z - 1], [4.2, HOOK_Z + 1.5]];
const COPS: [string, number, number][] = [['offA', -1.3, 2.2], ['offB', 1.5, 2.4], ['pol3', -4.6, 2.0], ['pol4', 4.9, 2.3]];
const TIPS: V3[] = [[-6.5, 13, -15], [6.5, 13, -15]];
const cop = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: {clip?: string; face?: string; look?: V3} = {}) => {
  const I = C[id]; hideProps(I); resetTurn(I); return {I, w: body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', face: o.face, lookW: o.look}), t)}; };
/** the roadblock: three rows of patrol cars across every lane, cones, searchlights on the Moon, four officers. turned = they have spun round to watch it go */
const roadblock = (C: Cast, t: number, o: {flat?: number; cranes?: boolean} = {}) => { const m = hwMoon(t); const us = t - ev('slam'); const sq = us > 0 ? 1 - 0.14 * Math.exp(-us * 6) * Math.cos(us * 22) : 1;
  return <><Highway moon={[m[0], m[1] + 20, m[2]]} />
    <Moon t={t} position={[m[0], m[1] * sq, m[2]]} r={HR} squash={sq} glow={us > 0 ? 0.45 : 1} spin={0.4} tag={t > ev('cuff') + 0.12 ? 'ผู้ต้องหา' : null} tagDrop={cl((t - ev('cuff') - 0.12) / 0.14)} />
    {ROWS.map(([x, z], i) => <PoliceCar key={i} t={t} position={[x, 0, z]} yaw={0} seed={i} />)}
    {BACKUP.map(([x, z], i) => <group key={'b' + i} position={[x, 0, z]} scale={[1, 1 - 0.82 * (o.flat ?? 0), 1]}><PoliceCar t={t} position={[0, 0, 0]} yaw={Math.PI / 2 + i} seed={i + 20} /></group>)}
    {Array.from({length: 13}, (_, i) => <Cone key={i} p={[-12 + i * 2, 0, 3.6]} />)}
    <Searchlight p={[-11.5, 0, 4.5]} aim={m} /><Searchlight p={[11.5, 0, 4.5]} aim={m} />
    {COPS.map(([id, x, z], i) => { const u = t - ev('over') - 0.25 - i * 0.1; const yaw = Math.PI * sm(u / 0.35);
      const c = cop(C, id, x, z, yaw, t, {clip: i % 2 ? 'idle_angry_01' : 'idle_neutral_01', face: u > 0 ? 'wide' : 'angry', look: m});
      if (id === 'offA' && t > ev('hook') - 0.9) { fingers(c.I, 'R', 'point', 1); ik(c.I, 'R', loc(c.I, [x + 0.1, 2.1, z - 0.6]), new THREE.Vector3(1, -0.5, 0), 1); c.w.updateMatrixWorld(true); }
      return <P key={id} o={c.w} />; })}
    {o.cranes && TIPS.map((tip, i) => { const k = sm((t - (ev('hook') - 0.3)) / 0.3); const s = i ? 1 : -1; const on: V3 = [m[0] + s * HR * 0.55, m[1] + HR * 0.75, m[2] + HR * 0.3];
      return <Crane key={i} t={t} position={[s * 10.5, 0, -8]} yaw={s > 0 ? Math.PI * 0.6 : Math.PI * 0.4} tip={tip} hook={k > 0 ? lerp3(tip, on, k) : undefined} />; })}</>;
};

// =====================================================================================================
// INTERROGATION / COURT / CELLS 18–19 (EP1 sets; the Earth of EP14 is next door)
// =====================================================================================================
const IR = 0.32, MOON_IN: V3 = [0, 0.47 + IR, -0.85];
const BOARD = {p: [1.55, 1.45, -0.25] as V3, yaw: -Math.PI / 2 + 0.25};
const onBoard = (lx: number, ly: number): V3 => [BOARD.p[0] + lx * Math.cos(BOARD.yaw) + 0.04 * Math.sin(BOARD.yaw), BOARD.p[1] + ly, BOARD.p[2] - lx * Math.sin(BOARD.yaw) + 0.04 * Math.cos(BOARD.yaw)];
const interroRoom = (C: Cast, t: number, o: {board?: boolean} = {}) => {
  const b = cop(C, 'offB', -0.6, 0.5, Math.PI - 0.55, t, {clip: 'idle_angry_01', face: near(t, [ev('table')], 0.5) ? 'shout' : 'angry', look: MOON_IN});
  const lift = strike(t, ev('table'), 0.3); rot(b.I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.3 - lift * 1.1, b.I.root); rot(b.I.bones.Bip01_R_Forearm, 1, 0, 0, -0.5 - lift * 0.5, b.I.root); b.w.updateMatrixWorld(true);
  let a: {I: any; w: THREE.Group} | null = null;
  if (o.board) { a = cop(C, 'offA', 0.95, 0.55, 2.55, t, {clip: 'idle_neutral_01', face: 'talk', look: BOARD.p});
    const kx = sm((t - ev('circle') + 0.25) / 0.2); const tgt = onBoard(lerp(-0.387, 0.387, kx) + 0.12, 0.05 + Math.sin(t * 9) * 0.03);
    fingers(a.I, 'R', 'point', 1); ik(a.I, 'R', loc(a.I, tgt), new THREE.Vector3(1, -0.6, 0), 1); a.w.updateMatrixWorld(true); }
  const cups = Array.from({length: 7}, (_, i) => <Cup key={i} p={[-0.62 + i * 0.13, TABLE_TOP, 0.22 + (i % 2) * 0.09]} k={sm((t - ev('table') - 0.25 - i * 0.12) / 0.08)} />);
  return <><Interro t={t} swing={1} /><Moon t={t} position={[MOON_IN[0], MOON_IN[1] + wobble(t, [ev('table')], 0.03), MOON_IN[2]]} r={IR} glow={0.1} tag="ผู้ต้องหา" spin={0.6} />
    <P o={b.w} />{a && <P o={a.w} />}{cups}
    {/* the wall clock races: the whole night goes by */}
    <mesh position={[0, 2.15, -1.975]} rotation={[0, 0, -(t - sh('interro').t0) * 14]}><planeGeometry args={[0.012, 0.13]} /><meshBasicMaterial color="#B0302E" /></mesh>
    {o.board && <Board position={BOARD.p} yaw={BOARD.yaw} t={t} cross={cl((t - ev('cross')) / 0.2)} ring={cl((t - ev('circle')) / 0.2)} />}</>;
};
const DOCK_M: V3 = [0, 1.04 + 0.3, 0.6];
const judgeAt = (C: Cast, t: number) => { const I = C.judge; hideProps(I);
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: DOCK_M, face: t > ev('gavel') - 0.3 && t < ev('gavel') + 0.4 ? 'shout' : 'angry'});
  const w = body(I, s, t, 0.5); prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  const lift = strike(t, ev('gavel'), 0.4); rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - lift, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - lift * 0.6, I.root); w.updateMatrixWorld(true); return {I, w}; };
// two cells side by side: 18 (the Earth) at x −CX, 19 (the Moon) at x +CX; bars at z 1.5, the corridor in front
const CX = 1.55, EARTH_C: V3 = [-CX, 0.42, -0.35], MOON_C: V3 = [CX, 0.42, -0.35], ORB = {r: 2.3, y: 1.25, w: (Math.PI * 2) / 1.7};
const orbitT0 = () => sh('cells').t0 + 0.25;
/** the Moon in the cell block: on the floor of 19 until orbitT0, then it lifts off and circles cell 18 (through the walls — nobody asks) */
const cellMoon = (t: number): V3 => { const u = t - orbitT0(); if (u <= 0) return MOON_C;
  const th = -0.35 + ORB.w * Math.max(0, u - 0.35); const o: V3 = [EARTH_C[0] + Math.cos(th) * ORB.r, ORB.y, EARTH_C[2] - Math.sin(th) * ORB.r];
  return u < 0.35 ? lerp3(MOON_C, o, sm(u / 0.35)) : o; };
const cellBlock = (C: Cast, t: number, o: {night?: boolean; flip?: number} = {}) => { const m = cellMoon(t); const f = o.flip ?? 1;
  const g = cop(C, 'offB', -3.6, 3.0, Math.PI * 0.75, t, {clip: 'idle_neutral_01', look: m});
  return <>{[-CX, CX].map((x) => <group key={x} position={[x, 0, 0]}><Cell t={t} days={0.45} marks={0} /></group>)}
    <CellPlate text="ห้อง 18" position={[-CX, 2.12, 1.54]} w={0.64} />
    <group position={[-0.25, 2.2, 2.05]} rotation={[0, Math.PI / 2, 0]}><CellPlate text="ห้อง 18" position={[0, 0, 0]} w={0.7} /></group>
    <group position={[2.9, 2.2, 2.05]} rotation={[0, Math.PI / 2, (1 - f) * 1.5]}><CellPlate text="ห้อง 19" position={[0, 0, 0]} w={0.7} /></group>
    <Earth t={t} position={EARTH_C} r={0.42} yaw={Math.atan2(m[0] - EARTH_C[0], m[2] - EARTH_C[2])} shake={1.0} mood={t > orbitT0() ? 'wide' : 'nervous'} />
    <Moon t={t} position={m} r={0.4} glow={0.8} spin={t * 0.8} tag={t > orbitT0() ? null : f >= 1 ? 'นช. 19' : 'ผู้ต้องหา'} tagDrop={f >= 1 ? cl((t - ev('flip') - 0.1) / 0.13) : 1} />
    <pointLight position={[m[0], m[1] + 0.2, m[2]]} color="#FFF0C8" intensity={t > orbitT0() ? 5 : 1.5} distance={5} decay={1.6} />
    <P o={g.w} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 5.5]}><planeGeometry args={[16, 8.2]} /><meshLambertMaterial color={o.night ? '#5E6368' : '#8E918B'} /></mesh></>;
};

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  drive: (t, lt, C) => {
    // frame 0: MCU over the hood — he drives, half asleep; the Moon is already there, over his shoulder
    const c = straight(t); const m = carPt(c, -34, 7.5, 7.6);   // behind him and a little to the side, so it sits over his shoulder from this camera
    return {node: <><TownGrid moon={m} focus={[c.x, c.z]} /><ManCar car={c} t={t} roll={t * 28} steer={Math.sin(t * 3) * 0.06} /><P o={driver(C, c, t, {steer: Math.sin(t * 3) * 0.06}).w} /><Moon t={t} position={m} r={3.2} /></>,
      cam: mv(hoodCam(c, 38), lt, {arrive: 0, push: 0.1}), bg: NIGHT};
  },
  wide: (t, lt, C) => {
    // roadside, low: the little car comes down the empty street, the Moon big above and behind it
    const c = straight(t); const m = moonBehind(straight, t, 42, 19, 0);
    return {node: <><TownGrid moon={m} focus={[0, -20]} /><ManCar car={c} t={t} roll={t * 28} /><P o={driver(C, c, t).w} /><Moon t={t} position={m} r={5.5} /></>,
      cam: mv({pos: [-3.4, 0.75, -17.5], look: [0.2, 4.6, c.z - 6], fov: 56}, lt, {arrive: 0.06, push: 0.07, roll0: -2}), bg: NIGHT};
  },
  left: (t, lt, C) => {
    // the junction, from down the side street: he turns left, towards us — a beat later the Moon swings across the sky and parks behind him again
    const c = carL(t); const m = moonBehind(carL, t, 15, 10.5, 0.32, ev('turnL'), 1);
    return {node: <><TownGrid moon={m} focus={[0, 0]} /><ManCar car={c} t={t} roll={t * 28} steer={steerOf(t, ev('turnL'), 1)} /><P o={driver(C, c, t, {steer: steerOf(t, ev('turnL'), 1)}).w} /><Moon t={t} position={m} r={MR} /></>,
      cam: mv({pos: [17.5, 1.25, 1.0], look: [c.x * 0.45 - 1.5, 3.9, c.z * 0.55], fov: 58}, lt, {arrive: 0.06, push: 0.04, shake: near(t, [ev('follow1')], 0.1) ? 0.012 : 0}), bg: NIGHT};
  },
  right: (t, lt, C) => {
    // over the hood again: he swings right, the Moon slides out of frame — and slides straight back in behind his head, bigger. Two snap-zooms.
    const c = carR(t); const m = moonBehind(carR, t, 10.5, 5.2, 0.34, ev('turnR'), -1); const st = steerOf(t, ev('turnR'), -1);
    const z = sm((t - ev('follow2')) / 0.1) + sm((t - ev('follow2') - 0.3) / 0.1);
    return {node: <><TownGrid moon={m} focus={[40, 0]} /><ManCar car={c} t={t} roll={t * 28} steer={st} /><P o={driver(C, c, t, {steer: st, face: t > ev('follow2') - 0.05 ? 'wide' : 'half'}).w} /><Moon t={t} position={m} r={MR} /></>,
      cam: mv(hoodCam(c, 40 - z * 6.5), lt, {arrive: 0, push: 0.04}), bg: NIGHT};
  },
  charge: (t, lt, C) => {
    // he has stopped; the Moon hangs right over his boot. He points back at it. Snap zoom, the plate drops.
    const m: V3 = [PARK.x, 5.3 + Math.sin(t * 1.3) * 0.12, PARK.z - 8.5]; const z = sm((t - ev('zoom')) / 0.17);
    return {node: <><TownGrid moon={m} focus={[40, 14]} /><ManCar car={PARK} t={t} brake={1} /><P o={driver(C, PARK, t, {face: 'shout', look: m, point: carPt(PARK, -1.0, 0.9, 1.85)}).w} /><Moon t={t} position={m} r={2.8} /></>,
      cam: mv({pos: carPt(PARK, 3.5, 2.0, 0.85), look: carPt(PARK, -2.2, 0.1, 2.9), fov: 54 - 13 * z}, lt, {arrive: 0.08, push: 0.05, shake: near(t, [ev('plate1')], 0.1) ? 0.012 : 0}), bg: NIGHT};
  },
  phone: (t, lt, C) => {
    // his POV, twisted round in the seat: the Moon fills the sky behind the car; the phone slides up, 191
    const m: V3 = [PARK.x, 5.3 + Math.sin(t * 1.3) * 0.12, PARK.z - 8.5]; const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: carPt(PARK, -0.25, 0.38, 1.36), look: [m[0], m[1] - 0.6, m[2]], fov: 56}, lt, {push: 0.08, arrive: 0});
    return {node: <><TownGrid moon={m} focus={[40, 14]} /><ManCar car={PARK} t={t} brake={1} /><Moon t={t} position={m} r={2.8} /><Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: NIGHT};
  },
  roadblock: (t, lt, C) => {
    // behind the line: light bars, backs of four officers, the Moon coming down the highway — then a crane-up: every lane is patrol cars
    const k = sm((t - ev('reveal') + 0.12) / 0.24);
    return {node: roadblock(C, t), cam: mv({pos: lerp3([0.9, 1.75, -9.2], [0.6, 10.5, -19], k), look: lerp3([0, 4.2, 22], [0, 4.6, 14], k), fov: 58}, lt, {arrive: 0.08, push: 0.04}), bg: HWY};
  },
  over: (t, lt, C) => {
    // from in front of the officers, low: the Moon slides overhead and on down the road; their heads follow it, then they turn, one after another
    const k = sm((t - ev('over') + 0.25) / 0.8);
    return {node: roadblock(C, t), cam: mv({pos: [0.5, 0.6, 7.2], look: lerp3([0, 3.4, 0], [0, 8.5, -8], k), fov: 62}, lt, {arrive: 0.06, push: 0.03, roll0: 3}), bg: HWY};
  },
  crane: (t, lt, C) => {
    // two army cranes: the hooks fly up and bite
    const m = hwMoon(t);
    return {node: <>{roadblock(C, t, {cranes: true})}{near(t, [ev('hook')], 0.3) && <Stars center={[m[0], m[1] + HR * 0.8, m[2] + HR * 0.4]} t={t * 3} r={2.2} size={0.5} />}</>,
      cam: mv({pos: [-2.6, 1.3, 6.0], look: [0, 9.5, -18], fov: 64}, lt, {arrive: 0.08, push: 0.06, shake: near(t, [ev('hook')], 0.12) ? 0.03 : 0}), bg: HWY};
  },
  crash: (t, lt, C) => {
    // hauled out of the sky: it comes down on the back-up cars. Dust. Then a giant cuff snaps round it and a tag drops: ผู้ต้องหา
    const m = hwMoon(t); const u = t - ev('slam'); const sq = u > 0 ? 1 - 0.14 * Math.exp(-u * 6) * Math.cos(u * 22) : 1; const close = sm((t - ev('cuff') + 0.15) / 0.15);
    return {node: <>{roadblock(C, t, {cranes: true, flat: u > 0 ? 1 : 0})}
      {u > 0 && [-6, -3, 0, 3, 6].map((x, i) => <Puffs key={i} at={[x, 0.5, HOOK_Z + 4.5 + (i % 2)]} t={t} t0={ev('slam')} n={7} size={1.3} color="#8C8778" seed={i} />)}
      {close > 0 && <EarthCuff center={[m[0], m[1] * sq, m[2]]} r={HR} close={close} tilt={[0.2, 0, 0.3]} />}
      {t > ev('cuff') && t < ev('cuff') + 0.3 && <Stars center={[HR, m[1] + 2, m[2] + 3]} t={t * 3} r={1.8} size={0.45} />}</>,
      cam: mv({pos: [2.8, 1.5, 2.6], look: [0, 5.6, HOOK_Z], fov: 62}, lt, {arrive: 0.06, push: 0.05, shake: near(t, [ev('slam')], 0.2) ? 0.07 : near(t, [ev('cuff')], 0.1) ? 0.02 : 0}), bg: HWY};
  },
  interro: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: [0.15, 1.5, 1.85], look: [-0.05, 0.85, -0.85], fov: 56}, lt, {arrive: 0.1, push: 0.1, shake: near(t, [ev('table')], 0.12) ? 0.02 : 0})}),
  board: (t, lt, C) => {
    // the result, on a board: a red ✕ over the man, a red ring round the Earth
    const k = sm((t - ev('circle') + 0.2) / 0.25);
    return {node: interroRoom(C, t, {board: true}), cam: mv({pos: [-0.25, 1.52, 0.2], look: onBoard(lerp(-0.2, 0.25, k), -0.26), fov: 46 - 6 * k}, lt, {arrive: 0.08, push: 0.06, roll0: -2})};
  },
  court: (t, lt, C) => { const {w} = judgeAt(C, t);
    return {node: <><Court t={t} /><P o={w} /><CourtLife t={t} C={C} /><Moon t={t} position={[0, DOCK_M[1] + wobble(t, [ev('gavel')], 0.03), DOCK_M[2]]} r={0.3} glow={0.1} tag="ผู้ต้องหา" /></>,
      cam: mv({pos: [0, 2.2, 3.4], look: [0, 1.4, -2.6], fov: 44}, lt, {push: 0.14, arrive: 0.1, shake: near(t, [ev('gavel')], 0.1) ? 0.015 : 0})}; },
  cell19: (t, lt, C) => ({node: cellBlock(C, t, {flip: sm((t - ev('flip')) / 0.1)}),
    cam: mv({pos: [5.4, 1.55, 3.9], look: [0.6, 1.25, 0.7], fov: 54}, lt, {arrive: 0.08, push: 0.07, shake: near(t, [ev('cellShut')], 0.15) ? 0.015 : 0}), bg: CELL_BG}),
  cells: (t, lt, C) => ({node: cellBlock(C, t, {night: true}), cam: mv({pos: [5.4, 1.7, 4.3], look: [0.2, 1.3, 0.9], fov: 56}, lt, {arrive: 0.06, push: 0.05}), bg: CELL_BG}),
  orbit: (t, lt, C) => {
    // cell 18: the Moon goes round and round the Earth's cell; the Earth's eyes follow it. No freeze — it is still going on the last frame.
    return {node: cellBlock(C, t, {night: true}), cam: mv({pos: [-1.1, 1.5, 7.4], look: [-CX, 1.2, 0], fov: 50}, lt, {arrive: 0.08, push: 0.045}), bg: CELL_BG};
  },
};
void TOTAL; void FPS; void bw;
