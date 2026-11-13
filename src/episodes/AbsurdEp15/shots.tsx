import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot, fingers, ik} from '../../pov/acting/ik';
import {ev, SHOTS, TOTAL, FPS, lerp, lerp3, cl} from './data';
import {Court, Cell, Interro, TABLE_TOP} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {Phone3D, Stars} from '../AbsurdEp4/props';
import {Chain, label} from '../AbsurdEp6/props';
import {Puffs, PoliceCar} from '../AbsurdEp7/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {ps, body, bw, hideProps, prop, P, CamRig, mv, strike, wobble, near, sm, loc, V3, Cast, ShotOut, Bg} from '../lifekit/stage';
import {CourtLife} from '../lifekit/presets';
import {PM} from '../AbsurdEp1/boxcast';
import {Moon, NightSky, ManCar, carPt, SEAT, WHEEL, TownGrid, Board, Cup} from './props';
import type {CarPose} from './props';

export {CamRig};
/** EP15 คดีดวงจันทร์. He drives home; whichever way he turns, the Moon is still up there behind him (it has not moved: it is just very far away).
 *  A patrol car flies out to space, cuffs it and tows it back; an all-night interrogation — it was never following him, it was following the Earth (EP14, cell 18). It gets cell 19 and keeps orbiting next door. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const NIGHT: Bg = {color: '#0B1020', fog: ['#0B1020', 30, 150]} as any, CELL_BG: Bg = {color: '#1E2228'};

// =====================================================================================================
// DRIVING. The Moon does nothing: it hangs where it always hangs, so far away that it never moves in the frame while the houses slide
// past (Nox: "มันอยู่ที่เดิม บนฟ้า แต่มันอยู่ไกลมาก เราเลยมองเห็นเหมือนมันตาม"). farMoon(camera) = the same direction from wherever the camera is.
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
const PARK: CarPose = {x: 40, z: 16, yaw: -0.85};   // slammed to a stop, skewed across the road: the Moon is over his right shoulder
const OFF: V3 = [-18, 30, -80], FR = 7.5;   // the Moon's fixed direction (20° up) and its size at that distance
const farMoon = (cam: V3): V3 => [cam[0] + OFF[0], cam[1] + OFF[1], cam[2] + OFF[2]];
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
/** on the bonnet, looking back and a little up: his face low in the frame, the sky behind the car above it */
const hoodCam = (c: CarPose, fov: number) => ({pos: carPt(c, 2.3, -0.45, 1.15), look: carPt(c, -0.3, 0.3, 1.62), fov});
const steerOf = (t: number, t0: number, dir: number) => { const u = (t - t0) / TURN; return u > 0 && u < 1 ? -dir * 1.1 * Math.sin(Math.PI * u) : 0; };

// =====================================================================================================
// THE POLICE. A patrol car floors it down the street, fires its jets and flies out to space (the Moon is where it is going). 384,400 km later:
// a giant cuff, a tag, and the Moon is towed back to Earth on a chain.
// =====================================================================================================
const cop = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: {clip?: string; face?: string; look?: V3} = {}) => {
  const I = C[id]; hideProps(I); resetTurn(I); return {I, w: body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', face: o.face, lookW: o.look}), t)}; };
/** the patrol car on the street: away from the camera towards the Moon (−z), nose up at ev('lift') */
const flyCar = (t: number): {p: V3; pitch: number; jet: number} => { const u = Math.max(0, t - sh('takeoff').t0 + 0.3), l = Math.max(0, t - ev('lift'));
  return {p: [0, 6 * l * l + 2 * l, 31 - (5 * u + 3 * u * u)], pitch: Math.min(0.9, l * 2.2), jet: sm(l / 0.15)}; };
const SPACE_BG: Bg = {color: '#04060D'};
const spaceLights = () => <><NightSky /><hemisphereLight args={['#4A5A8A', '#0A0C14', 0.6]} /><directionalLight position={[-20, 10, 18]} color="#FFF4E0" intensity={2.4} /></>;
const MRAD = 6;   // the Moon up close (the patrol car is 3.6 m long)
const SP_CAR: V3 = [1.6, -2.4, 9.5], SP_COP: V3 = [0.9, 1.2, 8.4];
const spCar = (t: number, at: V3, yaw: number, jet = 0, pitch = 0) => <PoliceCar t={t} position={at} yaw={yaw} pitch={pitch} jet={jet} fold={1} />;
/** a road sign floating in space */
const SpaceSign: React.FC<{p: V3; lines: string[]; k: string; yaw?: number}> = ({p, lines, k, yaw = 0}) => <group position={p} rotation={[0, yaw, 0]}>
  <mesh material={label('ep15sign' + k, 1024, 384, '#1E5C3A', '#F2F0E6', lines, 120, '#F2F0E6')}><planeGeometry args={[5.2, 1.95]} /></mesh>
  {[-1.8, 1.8].map((x) => <mesh key={x} position={[x, -2.4, -0.05]} material={PM('#8E949A', 'rail')}><boxGeometry args={[0.12, 2.9, 0.12]} /></mesh>)}</group>;

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
    // frame 0: over the bonnet — he drives, half asleep; the Moon is up there over his shoulder
    const c = straight(t); const cam = hoodCam(c, 44); const m = farMoon(cam.pos);
    return {node: <><TownGrid moon={m} focus={[c.x, c.z]} /><ManCar car={c} t={t} roll={t * 28} steer={Math.sin(t * 3) * 0.06} /><P o={driver(C, c, t, {steer: Math.sin(t * 3) * 0.06}).w} /><Moon t={t} position={m} r={FR} /></>,
      cam: mv(cam, lt, {arrive: 0, push: 0.06}), bg: NIGHT};
  },
  wide: (t, lt, C) => {
    // roadside, low: the little car comes down the empty street; the Moon hangs over the rooftops behind it
    const c = straight(t); const pos: V3 = [3.4, 0.75, -17.5]; const m = farMoon(pos);
    return {node: <><TownGrid moon={m} focus={[0, -20]} /><ManCar car={c} t={t} roll={t * 28} /><P o={driver(C, c, t).w} /><Moon t={t} position={m} r={FR} /></>,
      cam: mv({pos, look: [-0.6, 3.4, -40], fov: 56}, lt, {arrive: 0.06, push: 0.05, roll0: 2}), bg: NIGHT};
  },
  left: (t, lt, C) => {
    // travelling with him through the junction: he turns left, the houses sweep past — and the Moon has not moved a millimetre in the frame
    const c = carL(t); const pos: V3 = [c.x + 2.5, 1.0, c.z + 7.0]; const m = farMoon(pos);
    return {node: <><TownGrid moon={m} focus={[0, 0]} /><ManCar car={c} t={t} roll={t * 28} steer={steerOf(t, ev('turnL'), 1)} />
      <P o={driver(C, c, t, {steer: steerOf(t, ev('turnL'), 1), face: t > ev('turnL') + TURN ? 'open' : 'half', look: t > ev('turnL') + TURN ? m : undefined}).w} /><Moon t={t} position={m} r={FR} /></>,
      cam: mv({pos, look: [c.x, 2.2, c.z - 4], fov: 56}, lt, {arrive: 0, push: 0.03}), bg: NIGHT};
  },
  right: (t, lt, C) => {
    // over the bonnet: he swings right, the street wheels round behind him — and there it is again, over his shoulder. Two snap-zooms.
    const c = carR(t); const st = steerOf(t, ev('turnR'), -1); const z = sm((t - ev('follow2')) / 0.1) + sm((t - ev('follow2') - 0.3) / 0.1);
    const cam = hoodCam(c, 44 - z * 6.5); const m = farMoon(cam.pos);
    return {node: <><TownGrid moon={m} focus={[40, 0]} /><ManCar car={c} t={t} roll={t * 28} steer={st} /><P o={driver(C, c, t, {steer: st, face: t > ev('follow2') - 0.05 ? 'wide' : 'half'}).w} /><Moon t={t} position={m} r={FR} /></>,
      cam: mv(cam, lt, {arrive: 0, push: 0.03}), bg: NIGHT};
  },
  charge: (t, lt, C) => {
    // he has stopped in the middle of the road and points back up at it. Snap zoom, the plate drops.
    const z = sm((t - ev('zoom')) / 0.17); const pos = carPt(PARK, 1.55, -2.65, 0.9); const m = farMoon(pos); const seat = carPt(PARK, SEAT.f, SEAT.r, 0);
    return {node: <><TownGrid moon={m} focus={[40, 14]} /><ManCar car={PARK} t={t} brake={1} /><P o={driver(C, PARK, t, {face: 'shout', look: t > ev('plate1') + 0.15 ? pos : m, point: [seat[0] + OFF[0] * 0.015, 1.95, seat[2] + OFF[2] * 0.015]}).w} /><Moon t={t} position={m} r={FR} /></>,
      cam: mv({pos, look: [pos[0] + OFF[0] * 0.08, pos[1] + 1.75, pos[2] + OFF[2] * 0.08], fov: 56 - 13 * z}, lt, {arrive: 0.08, push: 0.05, shake: near(t, [ev('plate1')], 0.1) ? 0.012 : 0}), bg: NIGHT};
  },
  phone: (t, lt, C) => {
    // his POV, twisted round in the seat: the Moon over the street behind the car; the phone slides up, 191
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12); const pos = carPt(PARK, -0.25, 0.38, 1.36); const m = farMoon(pos);
    const c = mv({pos, look: [m[0] + 6, m[1] - 33, m[2]], fov: 56}, lt, {push: 0.08, arrive: 0});
    return {node: <><TownGrid moon={m} focus={[40, 14]} /><ManCar car={PARK} t={t} brake={1} /><Moon t={t} position={m} r={FR} /><Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: NIGHT};
  },
  takeoff: (t, lt) => {
    // from behind: a patrol car floors it down the street, siren on, straight at the Moon — jets, nose up, gone
    const c = flyCar(t); const pos: V3 = [1.7, 0.65, 33.5]; const m = farMoon(pos);
    return {node: <><TownGrid moon={m} focus={[0, 20]} /><PoliceCar t={t} position={c.p} yaw={Math.PI / 2} pitch={c.pitch} jet={c.jet} fold={sm((c.p[1] - 0.3) / 1.2)} spin={c.p[1] > 0.05 ? 0 : -9} /><Moon t={t} position={m} r={FR} />
      {t > ev('lift') && <Puffs at={[0, 0.3, c.p[2] + 2]} t={t} t0={ev('lift')} n={10} size={0.5} color="#B9B4A6" />}</>,
      cam: mv({pos, look: [-2.8, 4.5 + c.p[1] * 0.3, -3.5], fov: 58}, lt, {arrive: 0.06, push: 0.04, shake: near(t, [ev('lift')], 0.3) ? 0.02 : 0}), bg: NIGHT};
  },
  space: (t, lt) => {
    // space, chasing it from behind: jets blazing, the Moon growing dead ahead; a motorway sign whips past — ดวงจันทร์ 384,400 กม.
    const u = (t - sh('space').t0) / (sh('space').dur / FPS);
    return {node: <>{spaceLights()}{spCar(t, [0, Math.sin(t * 5) * 0.06, 0], Math.PI, 1)}
      <SpaceSign p={[-46 + 58 * u, 3.3, -2.9]} lines={['ดวงจันทร์', '384,400 กม.']} k="moon" yaw={Math.PI / 2} />
      <Moon t={t} position={[-60, 12, -3]} r={4 + 6 * u} /></>,
      cam: mv({pos: [5.5, 1.6, 1.2], look: [-10, 1.6, -0.6], fov: 52}, lt, {arrive: 0.06, push: 0.05, roll0: -3, shake: 0.006}), bg: SPACE_BG};
  },
  reach: (t, lt) => {
    // the Moon, huge; the little patrol car pulls up in front of it and brakes
    const k = sm((t - sh('reach').t0) / (ev('brake') - sh('reach').t0)); const from: V3 = [8, -9, 9];
    return {node: <>{spaceLights()}<Moon t={t} position={[0, 0, 0]} r={MRAD} spin={0.3} />{spCar(t, lerp3(from, SP_CAR, k), Math.PI / 2 + 0.6, 1 - k * 0.8)}</>,
      cam: mv({pos: [-1.5, 0.8, 23], look: [0.6, -0.8, 0], fov: 50}, lt, {arrive: 0.08, push: 0.08, roll0: -3}), bg: SPACE_BG};
  },
  cuff: (t, lt, C) => {
    // an officer floats in front of it: a giant cuff snaps shut round the whole Moon; a tag drops — ผู้ต้องหา
    const a = cop(C, 'offA', SP_COP[0], SP_COP[2], Math.PI + 0.1, t, {clip: 'idle_angry_01', face: 'angry', look: [0, 0, 0]});
    a.w.position.y = SP_COP[1] + Math.sin(t * 1.6) * 0.05; a.w.updateMatrixWorld(true);
    fingers(a.I, 'L', 'fist', 1); ik(a.I, 'L', loc(a.I, [SP_COP[0] - 0.35, SP_COP[1] + 1.05, SP_COP[2] - 0.5]), new THREE.Vector3(1, -1, 0), 1); a.w.updateMatrixWorld(true);
    const close = sm((t - ev('cuff') + 0.15) / 0.15); const tilt: V3 = [0.25, 0, 0.35];
    const R = MRAD * (1.07 + 0.45 * (1 - close)); const lock = new THREE.Vector3(R, 0, 0).applyEuler(new THREE.Euler(...tilt));
    return {node: <>{spaceLights()}<Moon t={t} position={[0, 0, 0]} r={MRAD} spin={0.3} shake={t > ev('cuff') ? 0.5 : 0} tag={t > ev('cuff') + 0.12 ? 'ผู้ต้องหา' : null} tagDrop={cl((t - ev('cuff') - 0.12) / 0.14)} />
      {spCar(t, SP_CAR, Math.PI / 2 + 0.6, 0.2)}<P o={a.w} /><EarthCuff center={[0, 0, 0]} r={MRAD} close={close} tilt={tilt} />
      <Chain a={[lock.x * 1.04, lock.y * 1.04, lock.z * 1.04]} b={bw(a.I, 'Bip01_L_Hand')} n={16} r={0.13} sag={0.3} />
      {t > ev('cuff') && t < ev('cuff') + 0.35 && <Stars center={[lock.x, lock.y + 1, lock.z + 1]} t={t * 3} r={1.6} size={0.4} />}</>,
      cam: mv({pos: [SP_COP[0] - 3.5, SP_COP[1] + 1.8, SP_COP[2] + 9.5], look: [0.2, 0, 0], fov: 60}, lt, {arrive: 0.08, push: 0.08, shake: near(t, [ev('cuff')], 0.15) ? 0.05 : 0}), bg: SPACE_BG};
  },
  tow: (t, lt) => {
    // the long way home, straight down the frame: the little patrol car, nose to the Earth, tows the cuffed Moon behind it on a chain
    const u = (t - sh('tow').t0) / (sh('tow').dur / FPS); const car: V3 = [Math.sin(t * 2.2) * 0.2, 0, 0]; const mp: V3 = [Math.sin(t * 1.7) * 0.5, 11.2 + Math.sin(t * 3.1) * 0.25, 0];
    const tilt: V3 = [0.25, 0, -Math.PI / 2 + 0.15]; const lock = new THREE.Vector3(MRAD * 1.14, 0, 0).applyEuler(new THREE.Euler(...tilt));
    return {node: <>{spaceLights()}{spCar(t, car, 0, 1, -Math.PI / 2)}
      <Moon t={t} position={mp} r={MRAD} spin={0.3 + t * 0.25} shake={0.4} /><EarthCuff center={mp} r={MRAD} close={1} tilt={tilt} />
      <Chain a={[car[0] + 0.5, car[1] + 1.9, 0]} b={[mp[0] + lock.x, mp[1] + lock.y, mp[2] + lock.z]} n={14} r={0.13} sag={0} />
      <Earth t={t} position={[1.5, -17.5 + 3.5 * u, -6]} r={7} shake={0} eyes={false} /></>,
      cam: mv({pos: [3, 2, 34], look: [0, 3, 0], fov: 50}, lt, {arrive: 0.06, push: 0.05, roll0: 3}), bg: SPACE_BG};
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
void TOTAL; void lerp;
