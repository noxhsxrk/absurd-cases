import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot, fingers, ik} from '../../pov/acting/ik';
import {ev, SHOTS, TOTAL, FPS} from './data';
import {Court, Cell, Interro, TABLE_TOP} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {Phone3D, Stars} from '../AbsurdEp4/props';
import {Cable} from '../AbsurdEp6/props';
import {Puffs, PoliceCar} from '../AbsurdEp7/props';
import {Village} from '../AbsurdEp8/village';
import {label} from '../AbsurdEp8/props';
import {EmptyRoom} from '../AbsurdEp13/props';
import {ps, body, bw, hideProps, prop, P, CamRig, mv, strike, wobble, near, sm, loc, V3, Cast, ShotOut, Bg} from '../lifekit/stage';
import {VillageLife, CourtLife} from '../lifekit/presets';
import {Earth, Dominoes, Domino, dominoPath, DOM, Crack, LieDetector, EarthCuff, BackDoor, tremble} from './props';
import type {Mood} from './props';

export {CamRig};
/** EP14 คดีแผ่นดินไหว. An earthquake knocks down his all-night domino run; the patrol car finds the culprit (the Earth), cuffs it, interrogates it (it never stops shaking), court, cell 18. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const ROOM_BG: Bg = {color: '#10141E'}, CELL_BG: Bg = {color: '#2A2E33'}, SKY: Bg = {color: '#BFD6E4'};
const DAY = () => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} /><directionalLight position={[-8, 16, 10]} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} shadow-bias={-0.0006} /></>;

// =====================================================================================================
// THE ROOM at night: the domino run over the floor; he crouches at MAN and sets the last piece at LAST.
// =====================================================================================================
const SPOTS = dominoPath();
const LAST = SPOTS[SPOTS.length - 1];
const MAN = {x: LAST.x + 0.05, z: LAST.z + 0.42};
const CRACK: [number, number][] = [[-1.95, -1.95], [-0.7, -0.75], [0.15, -0.05], [0.55, 0.62], [0.85, 1.3], [1.6, 2.0]];
const quakeT = () => ev('quake');
const lamp = () => <><pointLight position={[-1.55, 1.5, 1.4]} color="#FFC98A" intensity={4.5} distance={7} decay={1.3} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
  <mesh position={[-1.55, 1.55, 1.4]}><sphereGeometry args={[0.12, 14, 10]} /><meshBasicMaterial color="#FFE2B0" toneMapped={false} /></mesh>
  <mesh position={[-1.55, 0.75, 1.4]}><cylinderGeometry args={[0.015, 0.015, 1.5, 6]} /><meshLambertMaterial color="#2A2622" /></mesh></>;
const room = (t: number, o: {quake?: number; wobble?: number; tipLast?: number; count?: number; crack?: number} = {}) => <>
  <EmptyRoom t={t} night wall="#7E786A" />{lamp()}
  <Crack pts={CRACK} k={o.crack ?? 0} w={0.07} seed={3} />
  <Dominoes t={t} spots={SPOTS} quake={o.quake} wobble={o.wobble} tipLast={o.tipLast} count={o.count} /></>;
/** the man crouched at MAN, his right hand on the last domino. place = time the last piece touches down (null: hands down) */
const CROUCH_YAW = Math.PI / 2;
const man = (C: Cast, t: number, o: {place?: number | null; face?: string; stand?: boolean; point?: boolean; look?: V3} = {}) => {
  const I = C.nai; hideProps(I); resetTurn(I);
  // crouch_idle turns the body ~90° to its left: compensate so he faces the run (−z)
  const s = ps('nai', MAN.x, MAN.z, o.stand ? Math.PI : Math.PI + CROUCH_YAW, t, {clip: o.stand ? 'idle_angry_01' : 'crouch_idle', face: o.face ?? 'half', lookW: o.look ?? [LAST.x, 0.05, LAST.z]}); const w = body(I, s, t);
  let held: React.ReactNode = null;
  if (o.place !== undefined && o.place !== null) {
    const k = sm((t - (o.place - 0.45)) / 0.45), lift = t > o.place + 0.25 ? sm((t - o.place - 0.25) / 0.3) * 0.12 : 0;
    const y = DOM.h + 0.015 + (1 - k) * 0.14 + lift;
    fingers(I, 'R', t < o.place + 0.2 ? 'fist' : 'open', 1); ik(I, 'R', loc(I, [LAST.x + 0.02, y, LAST.z + 0.03]), new THREE.Vector3(-1, -1, 0.2), 1);
    if (t < o.place) held = <Domino position={[LAST.x, (1 - k) * 0.14, LAST.z]} yaw={LAST.yaw} color="#D9493A" />;
  }
  if (o.point) { fingers(I, 'R', 'point', 1); ik(I, 'R', loc(I, [MAN.x - 0.4, 1.2, MAN.z - 0.62]), new THREE.Vector3(-1, -0.6, 0), 1); }
  w.updateMatrixWorld(true); return {I, w, held};
};

// =====================================================================================================
// THE STREET (EP8 village, road along x): the Earth sits in a crack in the road; the patrol car pulls up behind it.
// =====================================================================================================
const ER = 0.55;
const EARTH_ST: V3 = [2.0, ER - 0.08, -1.2];
const CAR_STOP = EARTH_ST[0] - ER - 1.8 - 0.55;
const ROAD_CRACK: [number, number][] = [[-30, -1.0], [-14, -1.5], [-4, -0.9], [EARTH_ST[0], -1.2], [9, -1.6], [30, -1.1]];
const street = (t: number) => <><Village /><VillageLife t={t} traffic={false} dog={false} />{DAY()}<Crack pts={ROAD_CRACK} w={0.16} y={0.012} seed={7} /></>;
const carX = (t: number) => { const t0 = sh('patrol').t0 - 0.3, t1 = ev('park'); const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0))); return CAR_STOP - 16 * (1 - k) * (1 - k); };
const car = (t: number, door = 0, back = 0) => { const x = carX(t); const moving = t < ev('park');
  return <group><PoliceCar t={t} position={[x, 0, EARTH_ST[2]]} yaw={0} door={door} spin={moving ? -9 : 0} pitch={moving ? 0 : -0.03 * Math.exp(-(t - ev('park')) * 6) * Math.sin((t - ev('park')) * 20)} />
    <group position={[x, 0, EARTH_ST[2]]}><BackDoor open={back} /></group></group>; };
const cop = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: {clip?: string; face?: string; look?: V3} = {}) => {
  const I = C[id]; hideProps(I); resetTurn(I); return {I, w: body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', face: o.face, lookW: o.look}), t)}; };

// =====================================================================================================
// INTERROGATION (EP1 Interro: table at the origin, chairs at z ±0.85) — the Earth on the far chair, wired to the lie detector
// =====================================================================================================
const IR = 0.3;
const EARTH_IN: V3 = [0, 0.47 + IR, -0.85];
const DET: V3 = [0.3, TABLE_TOP, -0.02];
const detAt = (t: number): {p: V3; rot: V3; landed: number} => {
  const f = ev('fall'), hop0 = f - 0.65; if (t < hop0) return {p: DET, rot: [0, 0, 0], landed: -1};
  const edge = 0.78, x0 = DET[0];
  if (t < f) { const k = (t - hop0) / 0.65; return {p: [x0 + (edge - x0) * k, DET[1] + Math.abs(Math.sin(t * 40)) * 0.03, DET[2] + Math.sin(t * 31) * 0.01], rot: [0, Math.sin(t * 37) * 0.15, 0], landed: -1}; }
  const u = t - f, tf = Math.sqrt((2 * (DET[1] - 0.05)) / 9.8);
  if (u < tf) return {p: [edge + u * 0.6, DET[1] - 4.9 * u * u, DET[2]], rot: [0, 0, -u / tf * 1.3], landed: -1};
  return {p: [edge + tf * 0.6 + 0.04, 0.05, DET[2]], rot: [0, 0, -1.4], landed: f + tf};
};
const interro = (C: Cast, t: number, o: {shake?: number; mood?: Mood; cop?: boolean} = {}) => {
  const d = detAt(t);
  const a = o.cop !== false ? cop(C, 'offB', -0.55, 0.45, Math.PI - 0.55, t, {clip: 'idle_angry_01', face: 'angry', look: EARTH_IN}) : null;
  return <><Interro t={t} swing={1} /><Earth t={t} position={EARTH_IN} r={IR} shake={o.shake ?? 1.2} mood={o.mood ?? 'nervous'} />
    {a && <P o={a.w} />}
    <LieDetector t={t} position={d.p} rot={d.rot} wild={1} />
    {d.landed < 0 && <><Cable a={[DET[0] - 0.2, DET[1] + 0.08, DET[2] - 0.05]} b={[EARTH_IN[0] + 0.27, EARTH_IN[1] - 0.06, EARTH_IN[2] + 0.06]} r={0.006} color="#B0302E" />
      <Cable a={[DET[0] - 0.2, DET[1] + 0.08, DET[2]]} b={[EARTH_IN[0] + 0.2, EARTH_IN[1] - 0.18, EARTH_IN[2] + 0.12]} r={0.006} color="#2D3E63" /></>}
    {d.landed > 0 && <Puffs at={[d.p[0], 0.05, d.p[2]]} t={t} t0={d.landed} n={8} size={0.08} color="#9AA2A8" />}</>;
};

// =====================================================================================================
// COURT / CELL 18
// =====================================================================================================
const DOCK_E: V3 = [0, 1.04 + 0.3, 0.6];
const judgeAt = (C: Cast, t: number) => { const I = C.judge; hideProps(I);
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: DOCK_E, face: t > ev('gavel') - 0.3 && t < ev('gavel') + 0.4 ? 'shout' : 'angry'});
  const w = body(I, s, t, 0.5); prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  const lift = strike(t, ev('gavel'), 0.4); rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - lift, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - lift * 0.6, I.root); w.updateMatrixWorld(true); return {I, w}; };
const courtRoom = (C: Cast, t: number) => { const {w} = judgeAt(C, t); const big = t > ev('plate2') ? 2 : 1.1;
  return <><Court t={t} /><P o={w} /><CourtLife t={t} C={C} /><Earth t={t} position={[0, DOCK_E[1] + wobble(t, [ev('gavel')], 0.03), DOCK_E[2]]} r={0.3} yaw={Math.PI} shake={big} mood={t > ev('plate2') ? 'shut' : 'nervous'} /></>; };
const cell18 = (C: Cast, t: number) => { const g = cop(C, 'offB', 1.9, 2.4, Math.PI + 0.7, t, {clip: 'idle_neutral_01', look: [0, 0.5, -0.3]});
  return <><Cell t={t} days={0.45} marks={0} />
    <CellPlate text="ห้อง 18" position={[0, 2.12, 1.54]} w={0.64} /><mesh position={[0, 1.74, 1.54]} material={label('ep14-years', 768, 256, '#B0302E', '#F2E6C8', ['ห้าพันล้านปี'], 120)}><planeGeometry args={[0.9, 0.3]} /></mesh>
    <Earth t={t} position={[0.1, 0.42, -0.35]} r={0.42} shake={1.3} mood="nervous" /><P o={g.w} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.2]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8E918B" /></mesh>
    <mesh position={[0, 1.4, 5.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh></>; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  man: (t, lt, C) => {
    // frame 0: MCU, low, from inside the run — he sets the last domino down, very carefully
    const m = man(C, t, {place: ev('lastDomino'), face: 'open'});
    return {node: <>{room(t, {count: t < ev('lastDomino') ? SPOTS.length - 1 : SPOTS.length})}<P o={m.w} />{m.held}</>,
      cam: mv({pos: [MAN.x - 1.05, 1.0, MAN.z - 1.25], look: [MAN.x - 0.1, 0.62, MAN.z - 0.2], fov: 54}, lt, {arrive: 0.08, push: 0.12, roll0: -2}), bg: ROOM_BG};
  },
  dominoes: (t, lt, C) => {
    // high wide from the doorway corner: the whole floor is one long domino snake, and him at the end of it
    const m = man(C, t, {face: 'open'});
    return {node: <>{room(t)}<P o={m.w} /></>, cam: mv({pos: [-1.5, 2.3, -1.85], look: [0.35, 0.1, 0.0], fov: 62}, lt, {arrive: 0.08, push: 0.06}), bg: ROOM_BG};
  },
  quake: (t, lt, C) => {
    // low along the rows: the room jolts, every domino trembles, the first ones go
    const m = man(C, t, {face: 'wide', look: [0, 0.1, -0.6]});
    return {node: <>{room(t, {quake: quakeT(), crack: sm((t - quakeT() - 0.3) / 1.5)})}<P o={m.w} /></>,
      cam: mv({pos: [-1.75, 0.38, 0.75], look: [0.4, 0.05, -0.55], fov: 54}, lt, {arrive: 0.06, push: 0.1, shake: t > quakeT() ? 0.03 : 0}), bg: ROOM_BG};
  },
  topple: (t, lt, C) => {
    // from above: the whole run goes down in a second; a crack opens right through it
    const m = man(C, t, {face: 'wide', look: [0, 0.1, -0.6]});
    return {node: <>{room(t, {quake: quakeT(), crack: sm((t - quakeT() - 0.3) / 1.5)})}<P o={m.w} /></>,
      cam: mv({pos: [0.0, 2.55, 1.0], look: [0.0, 0, -0.55], fov: 70}, lt, {arrive: 0.06, push: 0.05, shake: 0.018}), bg: ROOM_BG};
  },
  charge: (t, lt, C) => {
    // he stands among the fallen dominoes and points at the crack in the floor; the plate drops
    const m = man(C, t, {stand: true, point: true, face: 'shout', look: [0.55, 0, 0.62]});
    return {node: <>{room(t, {quake: quakeT(), crack: 1})}<P o={m.w} /></>,
      cam: mv({pos: [0.05, 1.25, -1.45], look: [1.1, 1.3, 0.6], fov: 58}, lt, {arrive: 0.08, push: 0.08, shake: near(t, [ev('plate1')], 0.2) ? 0.01 : 0}), bg: ROOM_BG};
  },
  phone: (t, lt, C) => {
    // his POV down on the crack: the 3D phone slides up, 191
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [MAN.x, 1.55, MAN.z], look: [0.45, 0.0, 0.3], fov: 54}, lt, {push: 0.08, arrive: 0});
    return {node: <>{room(t, {quake: quakeT(), crack: 1})}<Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: ROOM_BG};
  },
  patrol: (t, lt) => {
    // the street: the Earth sits in a crack in the road, trembling; a patrol car, siren on, pulls up behind it
    return {node: <>{street(t)}{car(t)}<Earth t={t} position={EARTH_ST} r={ER} yaw={-0.9} mood={t > ev('park') - 0.3 ? 'wide' : 'nervous'} /></>,
      cam: mv({pos: [5.4, 1.0, 2.6], look: [0.9, 0.7, -1.2], fov: 52}, lt, {arrive: 0.08, push: 0.07, roll0: 2}), bg: SKY};
  },
  cuff: (t, lt, C) => {
    // the officer snaps a giant cuff round the whole planet
    const a = cop(C, 'offA', EARTH_ST[0] + 0.2, EARTH_ST[2] + 1.05, Math.PI + 0.15, t, {clip: 'idle_angry_01', face: 'angry', look: EARTH_ST});
    fingers(a.I, 'L', 'fist', 1); ik(a.I, 'L', loc(a.I, [EARTH_ST[0] + 0.45, 1.05, EARTH_ST[2] + 0.75]), new THREE.Vector3(1, -1, 0), 1); a.w.updateMatrixWorld(true);
    const close = sm((t - ev('cuff') + 0.15) / 0.15);
    return {node: <>{street(t)}{car(t)}<P o={a.w} /><Earth t={t} position={EARTH_ST} r={ER} yaw={0.4} mood={t > ev('cuff') ? 'shut' : 'wide'} shake={1.3} />
      <EarthCuff center={EARTH_ST} r={ER} close={close} hand={bw(a.I, 'Bip01_L_Hand')} />
      {t > ev('cuff') && t < ev('cuff') + 0.3 && <Stars center={[EARTH_ST[0] + ER, EARTH_ST[1] + 0.3, EARTH_ST[2] + 0.3]} t={t * 3} r={0.2} size={0.05} />}</>,
      cam: mv({pos: [EARTH_ST[0] + 1.9, 1.3, EARTH_ST[2] + 2.3], look: [EARTH_ST[0] + 0.05, 0.75, EARTH_ST[2] + 0.1], fov: 50}, lt, {arrive: 0.08, push: 0.12, shake: near(t, [ev('cuff')], 0.12) ? 0.015 : 0}), bg: SKY};
  },
  backseat: (t, lt, C) => {
    // the back door: he shoves the cuffed Earth in, slams the door — it ends up squashed against the window
    const s0 = sh('backseat').t0, ds = ev('doorShut'); const x = CAR_STOP; const hinge: V3 = [x - 0.45, 0, EARTH_ST[2] + 0.81];
    const open = t < ds - 0.15 ? 1 : 1 - sm((t - (ds - 0.15)) / 0.15);
    const push = sm((t - s0) / 0.4);
    const ep: V3 = [x - 0.95, 0.85, EARTH_ST[2] + 1.55 - push * 0.95];
    const a = cop(C, 'offA', x - 0.95, EARTH_ST[2] + 2.05 - push * 0.45, Math.PI, t, {clip: 'idle_angry_01', face: 'angry', look: ep});
    if (t < ds - 0.25) { (['L', 'R'] as const).forEach((sd) => { const k = sd === 'L' ? -1 : 1; fingers(a.I, sd, 'open', 1);
      ik(a.I, sd, loc(a.I, [ep[0] + k * 0.36, ep[1] + 0.05, ep[2] + 0.2]), new THREE.Vector3(k, -1, 0), 1); }); }
    else { const ang = open * 1.25; fingers(a.I, 'R', 'open', 1); ik(a.I, 'R', loc(a.I, [hinge[0] - Math.cos(ang) * 0.95, 1.0, hinge[2] + Math.sin(ang) * 0.95 + 0.05]), new THREE.Vector3(1, -1, 0), 1); }
    a.w.updateMatrixWorld(true);
    const inside = t > ds - 0.25; const squash = t > ds ? 1 + 0.25 * Math.exp(-(t - ds) * 8) * Math.cos((t - ds) * 30) : 1;
    return {node: <>{street(t)}{car(t, 0, open)}<P o={a.w} />
      {!inside && <Earth t={t} position={ep} r={0.42} squash={[1 + push * 0.12, 1 - push * 0.08, 1 - push * 0.15]} mood="wide" shake={1.2} />}
      {t > ds && <Earth t={t} position={[x - 0.95, 1.08, EARTH_ST[2] + 0.86]} r={0.24} squash={[squash, squash, 0.18]} mood="shut" shake={0.6} />}
      {near(t, [ds], 0.25) && <Puffs at={[x - 0.95, 0.9, EARTH_ST[2] + 0.85]} t={t} t0={ds} n={6} size={0.1} color="#D8D2C4" />}</>,
      cam: mv({pos: [x + 0.55, 1.35, EARTH_ST[2] + 3.0], look: [x - 0.95, 0.9, EARTH_ST[2] + 0.6], fov: 48}, lt, {arrive: 0.08, push: 0.1, shake: near(t, [ds], 0.12) ? 0.02 : 0}), bg: SKY};
  },
  interro: (t, lt, C) => ({node: interro(C, t), cam: mv({pos: [0.15, 1.5, 1.85], look: [-0.05, 0.85, -0.85], fov: 56}, lt, {arrive: 0.1, push: 0.1})}),
  shake: (t, lt, C) => {
    // CU: it shakes harder and harder; the officer leans in
    const j = tremble(t, 0.006);
    return {node: interro(C, t, {shake: 1.8, mood: 'nervous'}), cam: mv({pos: [-0.35 + j[0], 1.0 + j[1], 0.1], look: [0, 0.8, -0.85], fov: 46}, lt, {arrive: 0.06, push: 0.18, roll0: 3})};
  },
  polygraph: (t, lt, C) => {
    // ECU: the needles go wild — then the whole machine shakes itself across the table and off the edge
    const d = detAt(t); const k = sm((t - ev('fall') + 0.7) / 0.7);
    const look: V3 = [DET[0] + (d.p[0] - DET[0]) * 0.8, DET[1] + (0.45 - DET[1]) * k, DET[2]];
    return {node: interro(C, t, {cop: false}), cam: mv({pos: [0.75 + 0.35 * k, 1.05 - 0.15 * k, 0.55 + 0.25 * k], look, fov: 40 + 12 * k}, lt, {arrive: 0.06, push: 0.1, shake: d.landed > 0 && near(t, [d.landed], 0.15) ? 0.02 : 0.004})};
  },
  court: (t, lt, C) => ({node: courtRoom(C, t), cam: mv({pos: [0, 2.2, 3.4], look: [0, 1.4, -2.6], fov: 44}, lt, {push: 0.12, arrive: 0.1, shake: near(t, [ev('gavel')], 0.1) ? 0.015 : 0})}),
  sentence: (t, lt, C) => ({node: courtRoom(C, t), cam: mv({pos: [0.2, 1.75, -1.55], look: [0, 1.3, 0.6], fov: 42}, lt, {push: 0.14, arrive: 0.08, roll0: 3, shake: near(t, [ev('plate2')], 0.15) ? 0.02 : 0})}),
  cell18: (t, lt, C) => ({node: cell18(C, t), cam: mv({pos: [0.3, 1.5, 4.5], look: [0.0, 1.3, -0.3], fov: 50}, lt, {arrive: 0.08, push: 0.1, shake: near(t, [ev('cellShut')], 0.2) ? 0.015 : 0}), bg: CELL_BG}),
  rebuild: (t, lt, C) => {
    // home again: a new run across the floor (right over the crack); he sets the last piece down, carefully
    const m = man(C, t, {place: ev('place'), face: 'half'});
    return {node: <>{room(t, {crack: 1, count: t < ev('place') ? SPOTS.length - 1 : SPOTS.length})}<P o={m.w} />{m.held}</>,
      cam: mv({pos: [MAN.x - 1.6, 1.35, MAN.z - 1.7], look: [MAN.x - 0.2, 0.55, MAN.z - 0.3], fov: 50}, lt, {arrive: 0.08, push: 0.08}), bg: ROOM_BG};
  },
  aftershock: (t, lt) => {
    // dominoes' eye level along the last row: a small shiver runs through them; dust lifts out of the crack
    const w = 0.06 * sm((t - ev('wobble')) / 0.3);
    return {node: <>{room(t, {crack: 1, wobble: w})}<Puffs at={[0.6, 0.02, 0.62]} t={t} t0={ev('wobble')} n={6} size={0.05} color="#8A7A66" /></>,
      cam: mv({pos: [LAST.x + 0.35, 0.38, LAST.z + 0.42], look: [LAST.x - 0.35, 0.04, LAST.z - 0.12], fov: 44}, lt, {arrive: 0.06, push: 0.1, shake: 0.004}), bg: ROOM_BG};
  },
  final: (t, lt, C) => {
    // low wide: he freezes, eyes on the run; everything trembles and the piece he just set starts to tip back into the row. Hold.
    const tEnd = TOTAL / FPS - 0.5, tt = Math.min(t, tEnd), L = Math.min(lt, tEnd - sh('final').t0);
    const m = man(C, tt, {face: 'wide'});
    return {node: <>{room(tt, {crack: 1, wobble: 0.07, tipLast: tEnd - 0.22})}<P o={m.w} /></>,
      cam: mv({pos: [MAN.x - 1.3, 0.6, LAST.z - 1.55], look: [MAN.x - 0.1, 0.42, MAN.z - 0.25], fov: 56}, L, {arrive: 0.06, push: 0.08}), bg: ROOM_BG};
  },
};
