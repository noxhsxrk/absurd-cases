import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot, fingers, ik} from '../../pov/acting/ik';
import {gait, pace} from '../../pov/acting/motion';
import {ev, SHOTS, TOTAL, FPS} from './data';
import {Court, Cell} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {PrisonOutside} from '../AbsurdEp3/props';
import {Phone3D, Stars} from '../AbsurdEp4/props';
import {PrisonGate} from '../AbsurdEp6/props';
import {Puffs} from '../AbsurdEp7/props';
import {Village} from '../AbsurdEp8/village';
import {ps, walker, body, bw, hideProps, prop, P, CamRig, mv, strike, wobble, near, sm, add3, loc, V3, Cast, ShotOut, Bg} from '../lifekit/stage';
import {VillageLife, CourtLife, OpenAirLife} from '../lifekit/presets';
import {Echo, Reflect, EchoJar, FoamLining, EmptyRoom, ROOM_DOOR, swing, Notes, SignBoard, Boards, RockingChair} from './props';
import type {Hit} from './props';

export {CamRig};
/** EP13 คดีเสียงสะท้อน. The accused is the ROOM: it throws every word back. Patrol police mediate, get mocked, and smash the walls. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const ROOM_BG: Bg = {color: '#1A1E22'}, CELL_BG: Bg = {color: '#2A2E33'}, SKY: Bg = {color: '#BFD6E4'}, NIGHT: Bg = {color: '#121928'};
const DAY = () => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} /><directionalLight position={[-8, 16, 10]} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} shadow-bias={-0.0006} /></>;
/** the box head's mouth: head bone (at the neck) + 0.1 up, 0.13 forward along the body's facing */
const mouthOf = (I: any): V3 => { const h = bw(I, 'Bip01_Head'); const f = new THREE.Vector3(0, 0, 1).applyQuaternion(I.root.getWorldQuaternion(new THREE.Quaternion())); return [h[0] + f.x * 0.13, h[1] + 0.1, h[2] + f.z * 0.13]; };

// =====================================================================================================
// THE ROOM. He stands at MAN facing the north wall (−z). WALL_HIT = where his shout lands.
// =====================================================================================================
const MAN = {x: 0.25, z: 0.35};
const WALL_Z = -1.93;
/** the man: cupped hands at the mouth while he shouts (cup), pointing at the wall (point), or hands down */
const man = (C: Cast, t: number, o: {mode?: 'cup' | 'point' | 'down'; face?: string; yaw?: number; look?: V3; phone?: boolean} = {}) => {
  const I = C.nai; hideProps(I); resetTurn(I); const yaw = o.yaw ?? Math.PI;
  const s = ps('nai', MAN.x, MAN.z, yaw, t, {clip: o.mode === 'point' ? 'idle_angry_01' : 'idle_neutral_01', face: o.face, lookW: o.look}); const w = body(I, s, t);
  const m = mouthOf(I); const f: V3 = [Math.sin(yaw), 0, Math.cos(yaw)], r: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  if (o.mode === 'cup') { (['L', 'R'] as const).forEach((sd) => { const k = sd === 'L' ? 1 : -1; fingers(I, sd, 'cup', 1);
    ik(I, sd, loc(I, [m[0] + f[0] * 0.1 + r[0] * 0.07 * k, m[1] - 0.17, m[2] + f[2] * 0.1 + r[2] * 0.07 * k]), new THREE.Vector3(k, -1, -0.2), 1); }); }
  if (o.mode === 'point') { fingers(I, 'R', 'point', 1); ik(I, 'R', loc(I, [MAN.x - 0.15, 1.45, MAN.z - 0.6]), new THREE.Vector3(-1, -0.8, -0.3), 1); }
  w.updateMatrixWorld(true); return {I, w, mouth: mouthOf(I)};
};
const WALL_HIT: V3 = [MAN.x - 0.05, 1.62, WALL_Z];
const SHOUTS = () => [ev('shout'), sh('mimic').t0 + 0.1];

// the four patrol officers. offA does the talking (and the first sledgehammer), pol3 the second hammer, offB + pol4 stand by.
const COP_TALK = {x: 0.1, z: -0.35};
const cop = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: {clip?: string; face?: string; look?: V3; y?: number} = {}) => {
  const I = C[id]; hideProps(I); resetTurn(I); return {I, w: body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', face: o.face, lookW: o.look}), t, o.y ?? 0)}; };
const standBy = (C: Cast, t: number, face = 'angry') => <>
  <P o={cop(C, 'offB', 1.25, 1.2, Math.PI + 0.3, t, {clip: 'idle_angry_01', face, look: WALL_HIT}).w} />
  <P o={cop(C, 'pol4', -1.3, 1.0, Math.PI - 0.4, t, {clip: 'idle_neutral_01', face, look: WALL_HIT}).w} /></>;
const HITS_A = () => [ev('hit1'), ev('hit3')], HITS_B = () => [ev('hit2'), ev('hit4')];
const SMASH_A = {x: 0.55, z: -0.86, yaw: Math.PI + 0.35}, SMASH_B = {x: -1.05, z: -0.86, yaw: Math.PI - 0.25};
const hitAt = (sp: {x: number; z: number; yaw: number}): [number, number] => [sp.x + Math.sin(sp.yaw) * 1.13, 1.0];
/** every hole in the wall, landed by time t (the rubble shot adds the off-screen blows) */
const allHits = (): Hit[] => { const [ax, ay] = hitAt(SMASH_A), [bx, by] = hitAt(SMASH_B); const r0 = sh('rubble').t0;
  return [{t: ev('hit1'), x: ax, y: ay}, {t: ev('hit2'), x: bx, y: by}, {t: ev('hit3'), x: ax + 0.15, y: ay + 0.5}, {t: ev('hit4'), x: bx - 0.1, y: by + 0.55},
    {t: r0 + 0.05, x: 1.45, y: 1.5, r: 0.5}, {t: r0 + 0.3, x: -1.6, y: 1.9, r: 0.45}, {t: r0 + 0.5, x: -0.25, y: 2.1, r: 0.5}, {t: r0 + 0.7, x: 1.35, y: 0.5, r: 0.45}]; };
const smashers = (C: Cast, t: number) => {
  const a = cop(C, 'offA', SMASH_A.x, SMASH_A.z, SMASH_A.yaw, t, {clip: 'idle_angry_01', face: 'shout'}); const sa = ps('offA', SMASH_A.x, SMASH_A.z, SMASH_A.yaw, t); const swA = swing(a.I, sa, t, HITS_A()); a.w.updateMatrixWorld(true);
  const b = cop(C, 'pol3', SMASH_B.x, SMASH_B.z, SMASH_B.yaw, t, {clip: 'idle_angry_01', face: 'angry'}); const sb = ps('pol3', SMASH_B.x, SMASH_B.z, SMASH_B.yaw, t); const swB = swing(b.I, sb, t, HITS_B()); b.w.updateMatrixWorld(true);
  return <><P o={a.w} />{swA.node}<P o={b.w} />{swB.node}
    {[...HITS_A().map((h) => [h, hitAt(SMASH_A)] as const), ...HITS_B().map((h) => [h, hitAt(SMASH_B)] as const)].map(([h, [x, y]]) => <React.Fragment key={h}>
      <Puffs at={[x, y, -1.85]} t={t} t0={h} n={9} size={0.16} color="#CDBFA4" />{t > h && t < h + 0.3 && <Stars center={[x, y, -1.8]} t={t * 3} r={0.18} size={0.04} />}</React.Fragment>)}</>;
};

// =====================================================================================================
// COURT / FOAM CELL / PRISON / HAUNTED HOUSE
// =====================================================================================================
const DOCK: V3 = [0, 1.04, 0.6];
const jarOnDock = (t: number, shake = 0) => <group position={[0, shake, 0]}><EchoJar t={t} position={DOCK} scale={2.2}><Echo t={t} position={[0, 0.075, 0]} scale={0.13} pulse={0.2} light={0.4} /></EchoJar></group>;
const judgeAt = (C: Cast, t: number) => { const I = C.judge; hideProps(I);
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.2, 0.6], face: t > ev('gavel') - 0.3 && t < ev('gavel') + 0.4 ? 'shout' : 'angry'});
  const w = body(I, s, t, 0.5); prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  const lift = strike(t, ev('gavel'), 0.4); rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - lift, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - lift * 0.6, I.root); w.updateMatrixWorld(true); return {I, w}; };
const courtRoom = (C: Cast, t: number) => { const {I, w} = judgeAt(C, t); return {I, node: <><Court t={t} /><P o={w} /><CourtLife t={t} C={C} />{jarOnDock(t, wobble(t, [ev('gavel')], 0.02))}</>}; };
// the foam cell (EP1 Cell, 3 × 3 m, bars at z 1.5): the echo hangs mid-cell, its rings swallowed by the foam
const ECHO_CELL: V3 = [0.1, 1.15, -0.4];
const foamCell = (t: number, o: {years?: string; hoarse?: number; pulse?: number} = {}) => <>
  <Cell t={t} days={0.45} marks={0} /><FoamLining />
  <CellPlate text="ห้อง 13" position={[0, 2.12, 1.54]} w={0.64} /><CellPlate text={o.years ?? '10 ปี'} position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />
  <Echo t={t} position={[ECHO_CELL[0], ECHO_CELL[1] + Math.sin(t * 1.3) * 0.04, ECHO_CELL[2]]} scale={0.7} hoarse={o.hoarse ?? 0.3} pulse={o.pulse ?? 0} />
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.2]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.4, 5.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh></>;
// the haunted house = village lot 10 (x −1.22, front z 9.17, door x −3.49), boarded up, a sign at the gate
const HOUSE_WIN: V3[] = [[-1.22 + 8.12 * 0.28, 1.6, 9.08], [-1.22 + 8.12 * 0.28, 4.4, 9.08], [-1.22 - 8.12 * 0.28, 4.4, 9.08]];
const haunted = (t: number) => <><Village night={1} t={t} doors={{10: 0.35}} /><VillageLife t={t} night={1} traffic={false} dog={false} />
  <hemisphereLight args={['#3C4C78', '#15171C', 0.55]} /><directionalLight position={[-10, 14, -8]} color="#8EA6E8" intensity={0.4} />
  {HOUSE_WIN.map((p, i) => <React.Fragment key={i}><mesh position={[p[0], p[1], p[2] + 0.01]}><planeGeometry args={[1.5, 1.2]} /><meshBasicMaterial color="#0C0F16" /></mesh><Boards position={[p[0], p[1], p[2] - 0.03]} w={1.5} h={1.2} yaw={Math.PI} /></React.Fragment>)}
  <SignBoard position={[0.9, 0, 5.4]} yaw={Math.PI - 0.5} lines={['บ้านผีสิง', 'ค่าเข้า 50 บาท · เด็กครึ่งราคา', 'เสียงประกอบโดย: เสียงสะท้อน']} w={1.5} h={0.95} /></>;

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  man: (t, lt, C) => {
    // frame 0: MCU from the wall side — he fills his lungs, cups his hands round his mouth
    const {w} = man(C, t, {mode: 'cup', face: lt > 0.45 ? 'shout' : 'half'});
    return {node: <><EmptyRoom t={t} /><P o={w} /></>, cam: mv({pos: [MAN.x - 0.1, 1.62, MAN.z - 1.15], look: [MAN.x, 1.52, MAN.z], fov: 42}, lt, {arrive: 0.1, push: 0.12, roll0: -2}), bg: ROOM_BG};
  },
  shout: (t, lt, C) => {
    // wide, side-on: the shout crosses the empty room as rings and lands on the wall; the wall ripples
    const {w, mouth} = man(C, t, {mode: 'cup', face: 'shout'});
    return {node: <><EmptyRoom t={t} /><P o={w} /><Reflect t={t} src={mouth} hit={WALL_HIT} normal={[0, 0, 1]} t0s={[ev('shout')]} /></>,
      cam: mv({pos: [-1.45, 1.55, 1.85], look: [0.55, 1.4, -0.5], fov: 60}, lt, {arrive: 0.08, push: 0.06}), bg: ROOM_BG};
  },
  bounce: (t, lt, C) => {
    // reverse, from the wall: the same rings come straight back into his face
    const {w, mouth} = man(C, t, {face: 'wide', look: WALL_HIT});
    return {node: <><EmptyRoom t={t} /><P o={w} /><Reflect t={t} src={mouth} hit={WALL_HIT} normal={[0, 0, 1]} t0s={[ev('shout')]} /></>,
      cam: mv({pos: [-0.35, 1.5, -1.55], look: [MAN.x, 1.5, MAN.z], fov: 50}, lt, {arrive: 0.08, push: 0.14, roll0: 2}), bg: ROOM_BG};
  },
  mimic: (t, lt, C) => {
    // over his shoulder: he shouts again — and the wall says it right back
    const {w, mouth} = man(C, t, {mode: 'cup', face: 'shout'});
    return {node: <><EmptyRoom t={t} /><P o={w} /><Reflect t={t} src={mouth} hit={WALL_HIT} normal={[0, 0, 1]} t0s={SHOUTS()} /></>,
      cam: mv({pos: [MAN.x + 0.55, 1.75, MAN.z + 1.1], look: [MAN.x - 0.1, 1.5, WALL_Z], fov: 50}, lt, {arrive: 0.06, push: 0.1}), bg: ROOM_BG};
  },
  glare: (t, lt, C) => {
    // from the wall: he points at it, furious
    const {w} = man(C, t, {mode: 'point', face: 'angry', look: WALL_HIT});
    return {node: <><EmptyRoom t={t} /><P o={w} /><Reflect t={t} src={WALL_HIT} hit={WALL_HIT} normal={[0, 0, 1]} t0s={[]} /></>,
      cam: mv({pos: [MAN.x - 0.35, 1.55, MAN.z - 1.25], look: [MAN.x, 1.45, MAN.z], fov: 46}, lt, {arrive: 0.08, push: 0.2, roll0: -3}), bg: ROOM_BG};
  },
  charge: (t, lt, C) => {
    // symmetric wide of the bare room: the accused in full; the plate drops
    const {w} = man(C, t, {mode: 'point', face: 'shout', look: WALL_HIT});
    return {node: <><EmptyRoom t={t} /><P o={w} /></>, cam: mv({pos: [0, 1.55, 1.95], look: [0, 1.35, -2], fov: 62}, lt, {arrive: 0.08, push: 0.08, shake: near(t, [ev('plate1')], 0.2) ? 0.01 : 0}), bg: ROOM_BG};
  },
  phone: (t, lt, C) => {
    // his POV on the wall: the 3D phone slides up, 191
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [MAN.x, 1.6, MAN.z - 0.1], look: [MAN.x - 0.1, 1.5, WALL_Z], fov: 54}, lt, {push: 0.08, arrive: 0});
    return {node: <><EmptyRoom t={t} /><Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: ROOM_BG};
  },
  callUI: (t, lt, C) => SHOT_FN.phone(t, lt + 0.7, C),
  cops: (t, lt, C) => {
    // from the wall: four patrol officers file in through the doorway; he points them at the wall
    const {w} = man(C, t, {mode: 'point', face: 'angry', look: WALL_HIT, yaw: Math.PI - 0.5});
    const walkIn = (id: string, to: [number, number], d: number) => { const I = C[id]; hideProps(I);
      const g = gait([[ROOM_DOOR[0], 3.2], [ROOM_DOOR[0], 1.6], to], t, {t0: sh('cops').t0 - 0.9 + d, speed: pace('walk_fast_01')});
      return <P key={id} o={body(I, walker(id, g, t, {locoClip: 'walk_fast_01', idle: 'idle_neutral_01', lookW: WALL_HIT}), t)} />; };
    return {node: <><EmptyRoom t={t} /><P o={w} />{walkIn('offA', [COP_TALK.x + 0.5, COP_TALK.z + 0.6], 0)}{walkIn('pol3', [-0.9, 0.9], 0.35)}{walkIn('offB', [1.25, 1.2], 0.7)}{walkIn('pol4', [-1.3, 1.0], 1.0)}</>,
      cam: mv({pos: [-1.2, 1.7, -1.6], look: [0.5, 1.2, 1.2], fov: 62}, lt, {arrive: 0.1, push: 0.07, roll0: 2}), bg: ROOM_BG};
  },
  mediate: (t, lt, C) => {
    // side-on: the officer talks to the wall, calm, open hands — his words float across to it
    const a = cop(C, 'offA', COP_TALK.x, COP_TALK.z, Math.PI, t, {clip: 'gestic_talk_neutral_01', face: 'talk'}); const m = mouthOf(a.I);
    return {node: <><EmptyRoom t={t} /><P o={a.w} />{standBy(C, t, 'half')}<Reflect t={t} src={m} hit={[COP_TALK.x, 1.62, WALL_Z]} normal={[0, 0, 1]} t0s={[ev('talk')]} power={0.7} bounces={1} /></>,
      cam: mv({pos: [1.85, 1.55, 1.4], look: [0.1, 1.45, -0.9], fov: 60}, lt, {arrive: 0.08, push: 0.08}), bg: ROOM_BG};
  },
  wallBack: (t, lt, C) => {
    // past his shoulder onto the wall: it ripples — and throws his words back at him, louder
    const a = cop(C, 'offA', COP_TALK.x, COP_TALK.z, Math.PI, t, {clip: 'gestic_listen_neutral_01', face: 'open'}); const m = mouthOf(a.I);
    return {node: <><EmptyRoom t={t} /><P o={a.w} /><Reflect t={t} src={m} hit={[COP_TALK.x, 1.62, WALL_Z]} normal={[0, 0, 1]} t0s={[ev('talk'), ev('mock') - 0.35]} power={1.3} bounces={2} /></>,
      cam: mv({pos: [COP_TALK.x + 0.75, 1.8, COP_TALK.z + 1.7], look: [COP_TALK.x - 0.1, 1.5, WALL_Z], fov: 52}, lt, {arrive: 0.06, push: 0.16, roll0: -3}), bg: ROOM_BG};
  },
  mocked: (t, lt, C) => {
    // from the wall, CU: the mocking rings hit his face, again and again; he goes red
    const a = cop(C, 'offA', COP_TALK.x, COP_TALK.z, Math.PI, t, {clip: 'idle_angry_01', face: lt > 0.5 ? 'shout' : 'angry', look: [COP_TALK.x, 1.6, WALL_Z]}); const m = mouthOf(a.I);
    return {node: <><EmptyRoom t={t} /><P o={a.w} />{standBy(C, t)}<Reflect t={t} src={m} hit={[COP_TALK.x, 1.62, WALL_Z]} normal={[0, 0, 1]} t0s={[ev('mock') - 0.35, ev('mock') + 0.2, ev('mock') + 0.75]} power={1.3} bounces={2} speed={6} /></>,
      cam: mv({pos: [COP_TALK.x - 0.25, 1.6, COP_TALK.z - 1.2], look: [COP_TALK.x, 1.65, COP_TALK.z], fov: 46}, lt, {arrive: 0.06, push: 0.22, roll0: 4}), bg: ROOM_BG};
  },
  smash: (t, lt, C) => {
    // side-on: two officers swing sledgehammers into the wall, bricks fly
    return {node: <><EmptyRoom t={t} hits={allHits()} />{smashers(C, t)}<P o={cop(C, 'offB', 1.4, 0.6, Math.PI + 0.6, t, {clip: 'idle_angry_01', face: 'angry', look: WALL_HIT}).w} /></>,
      cam: mv({pos: [1.85, 1.5, 0.4], look: [-0.3, 1.2, -1.5], fov: 64}, lt, {arrive: 0.06, push: 0.06, shake: near(t, [...HITS_A(), ...HITS_B()], 0.15) ? 0.025 : 0}), bg: ROOM_BG};
  },
  rubble: (t, lt, C) => {
    // from the doorway: the wall is mostly holes now, daylight pouring in; he stands in the middle of it, deadpan
    const {w} = man(C, t, {face: 'half', look: [0, 1.4, -2]});
    return {node: <><EmptyRoom t={t} hits={allHits()} /><P o={w} />{smashers(C, t)}{standBy(C, t)}
      {allHits().slice(4).map((h) => <Puffs key={h.t} at={[h.x, h.y, -1.85]} t={t} t0={h.t} n={8} size={0.2} color="#CDBFA4" />)}</>,
      cam: mv({pos: [0.6, 1.6, 1.95], look: [-0.1, 1.3, -2], fov: 64}, lt, {arrive: 0.08, push: 0.05, shake: near(t, allHits().map((h) => h.t), 0.12) ? 0.015 : 0}), bg: ROOM_BG};
  },
  jar: (t, lt, C) => {
    // in the rubble: an officer crouches over a jar; the last of the sound is sucked in, the lid comes down with cuffs on it
    const J: V3 = [0.15, 0, -1.15]; const suck = sm((t - ev('jarIn')) / 0.45); const lid = 0.12 * (1 - sm((t - ev('lid') + 0.15) / 0.15));
    const a = cop(C, 'offB', J[0] + 0.45, J[2] + 0.3, -2.2, t, {clip: 'crouch_idle', face: 'angry', look: J}); fingers(a.I, 'R', 'open', 1);
    ik(a.I, 'R', loc(a.I, [J[0] + 0.05, 0.4 + lid, J[2] + 0.03]), new THREE.Vector3(-1, -0.5, 0), 1); a.w.updateMatrixWorld(true);
    const e: V3 = [J[0] + (1 - suck) * -0.2, 0.15 + (1 - suck) * 0.8, J[2] + (1 - suck) * -0.3];
    return {node: <><EmptyRoom t={t} hits={allHits()} /><P o={a.w} />
      <EchoJar t={t} position={J} scale={2.2} lid={lid} cuff={sm((t - ev('lid')) / 0.12)}>{null}</EchoJar>
      <Echo t={t} position={e} scale={0.6 - suck * 0.47} pulse={1 - suck} />
      {t > ev('lid') && t < ev('lid') + 0.35 && <Stars center={[J[0], 0.42, J[2]]} t={t * 3} r={0.14} size={0.035} />}</>,
      cam: mv({pos: [J[0] - 0.75, 0.75, J[2] + 0.95], look: [J[0], 0.3, J[2]], fov: 46}, lt, {arrive: 0.08, push: 0.12, shake: near(t, [ev('lid')], 0.12) ? 0.012 : 0}), bg: ROOM_BG};
  },
  courtJar: (t, lt, C) => ({node: courtRoom(C, t).node, cam: mv({pos: [0, 2.2, 3.4], look: [0, 1.4, -2.6], fov: 44}, lt, {push: 0.12, arrive: 0.1})}),
  gavel: (t, lt, C) => ({node: courtRoom(C, t).node, cam: mv({pos: [0.15, 2.0, -1.45], look: [0.05, 1.7, -3.25], fov: 42}, lt, {push: 0.14, arrive: 0.08, shake: near(t, [ev('gavel')], 0.1) ? 0.02 : 0, roll0: 3})}),
  foam: (t, lt, C) => {
    // the cell lined with acoustic foam; a guard slams the barred door; the echo hangs there, its rings swallowed
    const g = cop(C, 'offB', 1.9, 2.4, Math.PI + 0.7, t, {clip: 'idle_neutral_01', look: ECHO_CELL});
    return {node: <>{foamCell(t)}<P o={g.w} /></>, cam: mv({pos: [0.3, 1.55, 4.4], look: [0.0, 1.15, -0.3], fov: 46}, lt, {arrive: 0.08, push: 0.1, shake: near(t, [ev('cellShut')], 0.2) ? 0.015 : 0}), bg: CELL_BG};
  },
  reduced: (t, lt) => ({node: foamCell(t, {years: t > ev('cut') ? '5 ปี' : '10 ปี'}),
    cam: mv({pos: [0.35, 1.7, 2.9], look: [0, 1.76, 1.54], fov: 34}, lt, {arrive: 0.08, push: 0.12, roll0: 3, shake: near(t, [ev('cut')], 0.15) ? 0.012 : 0}), bg: CELL_BG}),
  sing: (t, lt, C) => {
    // the corridor: the guard belts out a song at the bars; the echo sends every note back, and he grins
    const g = cop(C, 'offB', 0.55, 2.05, Math.PI + 0.2, t, {clip: 'gestic_talk_excited_01', face: 'shout', look: ECHO_CELL}); const m = mouthOf(g.I);
    return {node: <>{foamCell(t, {years: '5 ปี', hoarse: 0, pulse: 0.6})}<P o={g.w} /><Notes from={m} t={t} t0={ev('sing')} dir={[-0.3, 0.1, -1.2]} /><Notes from={ECHO_CELL} t={t} t0={ev('sing') + 0.4} color="#8FE6FF" dir={[0.3, 0.1, 1.2]} n={4} /></>,
      cam: mv({pos: [2.4, 1.6, 3.7], look: [0.5, 1.4, 1.3], fov: 52}, lt, {arrive: 0.08, push: 0.08, roll0: -2}), bg: CELL_BG};
  },
  release: (t, lt) => {
    // prison front: the gate opens, the echo drifts out — dim, flickering
    const k = Math.max(0, t - ev('gate'));
    return {node: <><PrisonOutside t={t} beam={0.4} /><PrisonGate t={t} />{DAY()}<OpenAirLife t={t} arc={[-2.4, 2.4]} />
      <Echo t={t} position={[0.2, 1.0 + Math.sin(t * 2) * 0.05, 1.2 + Math.min(k, 2) * 0.8]} scale={0.9} hoarse={0.7} light={0.6} /></>,
      cam: mv({pos: [0.9, 0.9, 4.8], look: [0.2, 0.9, 2.0], fov: 46}, lt, {push: 0.08, arrive: 0.1, roll0: -2}), bg: SKY};
  },
  hoarse: (t, lt) => ({node: <><PrisonOutside t={t} beam={0.4} /><PrisonGate t={t} />{DAY()}<OpenAirLife t={t} arc={[-2.4, 2.4]} pigeons={[1.4, 0, 3.6]} />
    <Echo t={t} position={[0.2, 1.0 + Math.sin(t * 2) * 0.03, 2.9]} scale={0.6} hoarse={1} light={0.5} /></>,
    cam: mv({pos: [0.5, 1.1, 4.3], look: [0.2, 1.0, 2.9], fov: 40}, lt, {push: 0.16, arrive: 0.08, roll0: 2}), bg: SKY}),
  haunted: (t, lt) => ({node: <>{haunted(t)}<Echo t={t} position={[HOUSE_WIN[0][0], HOUSE_WIN[0][1] + Math.sin(t * 1.4) * 0.08, HOUSE_WIN[0][2] - 0.25]} scale={1.6} hoarse={0.4} light={1.6} /></>,
    cam: mv({pos: [3.4, 1.5, 1.6], look: [0.2, 2.0, 9], fov: 56}, lt, {push: 0.06, arrive: 0.1}), bg: NIGHT}),
  boo: (t, lt, C) => {
    // inside, dark: a visitor with a torch creeps in; the echo blooms out of the dark and BOO — she jumps
    const I = C.tw1; hideProps(I); resetTurn(I); const u = t - ev('boo'); const back = u > 0 ? Math.min(0.35, u * 1.6) : 0;
    const s = ps('tw1', 0.6, 0.6 + back, Math.PI - 0.3, t, {clip: 'idle_neutral_01', face: u > 0 ? 'wide' : 'half', lookW: [-0.2, 1.5, -1.2]}); const w = body(I, s, t);
    fingers(I, 'R', 'fist', 1); ik(I, 'R', loc(I, [0.5, 1.15 + (u > 0 ? 0.25 : 0), 0.2 + back]), new THREE.Vector3(-1, -1, 0), 1);
    if (u > 0) { fingers(I, 'L', 'open', 1); ik(I, 'L', loc(I, [0.75, 1.65, 0.45 + back]), new THREE.Vector3(1, -1, 0), 1); } w.updateMatrixWorld(true);
    const hand = bw(I, 'Bip01_R_Hand'); const pulse = u > 0 ? Math.exp(-u * 2.5) : 0;
    return {node: <><EmptyRoom t={t} night wall="#7E786A" /><P o={w} />
      <spotLight position={hand} target-position={[-0.3, 1.2, -1.5]} angle={0.35} penumbra={0.5} intensity={6} distance={6} color="#FFF0C8" castShadow />
      <Echo t={t} position={[-0.25, 1.5, -1.2]} scale={0.6 + pulse * 0.8} pulse={pulse} hoarse={u > 0 ? 0.2 : 0.6} light={u > 0 ? 1.4 : 0.4} /></>,
      cam: mv({pos: [-1.3, 1.55, -1.45], look: [0.45, 1.35, 0.6], fov: 58}, lt, {arrive: 0.06, push: 0.1, shake: near(t, [ev('boo')], 0.25) ? 0.02 : 0}), bg: NIGHT};
  },
  retire: (t, lt, C) => SHOT_FN.final(t, lt, C),
  final: (t, lt) => {
    // inside: the old echo rocking gently in a rocking chair under a retirement banner; the last frames hold
    const tEnd = TOTAL / FPS - 0.5, tt = Math.min(t, tEnd), L = Math.min(lt, tEnd - sh('final').t0); const rock = Math.sin(tt * 1.7) * 0.12;
    return {node: <><EmptyRoom t={tt} night wall="#7E786A" /><RockingChair position={[0.0, 0, -1.0]} rock={rock} />
      <Echo t={tt} position={[0.0, 0.72 + rock * 0.4, -1.0 - rock * 0.3]} scale={0.45} hoarse={0.8} light={0.8} />
      <SignBoard position={[0.0, 0.35, -1.9]} lines={['เกษียณอายุ', 'ขอบคุณที่หลอนมา 30 ปี']} w={1.4} h={0.45} bg="#7A2E2A" fg="#F2E6C8" />
      <pointLight position={[0.6, 1.2, -0.2]} color="#FFC27A" intensity={1.2} distance={3} decay={1.6} /></>,
      cam: sh('retire').t0 <= t && t < sh('final').t0 ? mv({pos: [1.2, 1.5, 1.6], look: [0.0, 1.0, -1.3], fov: 56}, lt, {push: 0.07, arrive: 0.08}) : mv({pos: [0.25, 1.15, 0.6], look: [0.0, 1.1, -1.4], fov: 46}, L, {push: 0.06, arrive: 0.08}), bg: NIGHT};
  },
};
