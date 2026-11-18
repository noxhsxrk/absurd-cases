import React from 'react';
import * as THREE from 'three';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {Mosquito} from '../AbsurdEp1/props';
import {CellPlate, Fan} from '../AbsurdEp2/props';
import {Durian} from '../AbsurdEp4/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {Moon} from '../AbsurdEp15/props';
import {Phone} from '../AbsurdEp16/props';
import {Icebox, ICEBOX, Fire} from '../AbsurdEp17/props';
import {makeFly} from '../AbsurdEp19/props';
import {ps, body, hideProps, P, CamRig, mv, near, sm, V3, Cast, ShotOut, CELL_BG, hand, hw, bw} from '../lifekit/stage';
import {Contract, CONTRACT, BOX1, Chill, FaceArrow} from './props';

export {CamRig};
/** EP20 · แก๊งห้อง 24 S1E1 ไม่มีใครเอาด้วย. He is in cell 24 (EP19, fly still open). The prison wall keeps him in all day: false
 *  imprisonment. He calls the police — the guard two metres in front of his cell answers, and hangs up. So he asks the cells next door to
 *  break out with him, and every one of them just does what it does: the fan shakes its head (it oscillates), the Earth turns its back on
 *  him (it spins), the fire in the fridge is cold to him (it is in a fridge), the Moon never turns its face to him (it only ever shows the
 *  Earth one side). Discrimination! He calls again — the guard hangs up mid-word. Only the mosquito says yes: it signs the contract in his blood.
 *
 *  LAYOUT (metres; yaw 0 faces +z; a character's LEFT is +x at yaw 0)
 *  cells   a row along x, each an EP1 Cell (3 × 3, bars at z 1.5, open to the corridor on +z), CW apart:
 *          23 the fire's fridge (x −2CW) · 18 the Earth + the Moon in orbit (−CW) · 24 HIM (0) · 19 the fan (+CW) · 20 the durian (+2CW)
 *  him     at the bars of 24: MAN (0.35, 1.28) facing +z, his face between the bars at x 0.23 and 0.47, a hand on each of them.
 *          From `paper` his LEFT hand holds the contract out through the gap 0.47…0.71 by its bottom-left corner (box 1 by his knuckles),
 *          so the second call is on his RIGHT ear.
 *  guard   offA in the corridor at G (1.05, 3.2), facing +z — his back to the cell, phone in his LEFT hand (camera side in the two-shots).
 *  corridor floor z 1.5…8, back wall at z 8. Cameras stand in the corridor.
 *
 *  TRAPS OF THIS EPISODE (written before the first shot)
 *  1. "ห่าง 2 เมตร": guard and him in ONE frame, stacked in depth (guard near/right, him far/left), so the hang-up is plainly absurd.
 *  2. Each refusal is the inmate's own normal motion, readable without sound: the fan's head sweeps fast enough to read as "no" in 1.7 s;
 *     the Earth spins visibly faster on "หันหลัง"; the fridge leaks cold at its seal; the Moon's near side is marked with a red arrow "หน้า"
 *     that stays locked on the Earth while it goes round.
 *  3. The Moon shot needs him and cell 18 in one frame: the camera stands left in the corridor so its ray into 18 clears the shared wall.
 *  4. Cell numbers: 24 is his (EP19); 18/19/20/23 are the inmates' cells from the bible (series2_bible.md fixes the layout).
 *  5. The contract must exist before the mosquito signs it: out at `paper`, in every later shot of him, box 1 under his thumb.
 *  6. The phone hands: first call LEFT ear; second call RIGHT ear (left holds the paper). The guard always uses his left.
 *  7. The fly stays open (makeFly, EP19) in every shot of him.
 *  8. Offenders have no face: Earth eyes off, durian face off. The mosquito keeps EP1's look. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CW = 3.05, X23 = -2 * CW, X18 = -CW, X19 = CW, X20 = 2 * CW;
const MAN = {x: 0.35, z: 1.28}, G = {x: 1.05, z: 3.2};
const BAR_R: V3 = [0.21, 1.44, 1.46], BAR_L: V3 = [0.49, 1.44, 1.46];
const EAR_L: V3 = [12, 12, 2], EAR_R: V3 = [-12, 12, 2];

// =====================================================================================================
// THE BLOCK
// =====================================================================================================
const EARTH_C: V3 = [X18, 1.08, -0.15], EARTH_R = 0.95;
const ORB = {r: 1.2, y: 2.05, w: (Math.PI * 2) / 3.2};
const moonAt = (t: number): V3 => { const a = ORB.w * t; return [EARTH_C[0] + Math.cos(a) * ORB.r, ORB.y + 0.1 * Math.sin(a), EARTH_C[2] + Math.sin(a) * ORB.r]; };
/** the Earth spins as it always does; on "หันหลังให้" it turns a little faster (it has a lot of practice) */
const earthYaw = (t: number) => 0.6 * t + 2.2 * sm((t - ev('turn')) / 0.7);
const fanHead = (t: number) => Math.sin(t * 2.7) * 0.75;
const fridgeP: V3 = [X23 + 0.1, 0, -0.6];
/** ajar, the fire visible on the shelf; on `puff` the cold rolls out and the door swings shut */
const fridgeDoor = (t: number) => 0.6 * (1 - sm((t - ev('puff') - 0.3) / 0.3));
const MOON_R = 0.28;
type Who = 'fridge' | 'earth' | 'man' | 'fan' | 'durian';
const CELLS: {x: number; no: number; who: Who}[] = [{x: X23, no: 23, who: 'fridge'}, {x: X18, no: 18, who: 'earth'}, {x: 0, no: 24, who: 'man'}, {x: X19, no: 19, who: 'fan'}, {x: X20, no: 20, who: 'durian'}];
const inmate = (who: Who, t: number) => who === 'earth' ? <>
    <Earth t={t} position={EARTH_C} r={EARTH_R} yaw={earthYaw(t)} shake={0.25} eyes={false} />
    <EarthCuff center={EARTH_C} r={EARTH_R} close={1} tilt={[0.3, 0, 0.25]} />
    <Moon t={t} position={moonAt(t)} r={MOON_R} glow={0.9} spin={Math.PI / 2 - ORB.w * t} />
    <pointLight position={add(moonAt(t), [0, 0.2, 0])} color="#FFF0C8" intensity={1.2} distance={3} decay={1.6} /></>
  : who === 'fan' ? <Fan position={[X19, 0, -0.2]} scale={1.35} headYaw={fanHead(t)} blade={t * 31} blur={1} lit={3} />
  : who === 'fridge' ? <><Icebox position={fridgeP} door={fridgeDoor(t)} glow={0.9} frost={0.08 + 0.5 * sm((t - ev('puff') - 0.4) / 0.5)} />
    {fridgeDoor(t) > 0.04 && <Fire position={[fridgeP[0], ICEBOX.shelf + 0.02, fridgeP[2]]} t={t} size={0.3} light={0.5} />}</>
  : who === 'durian' ? <Durian position={[X20 + 0.1, 0.32, -0.5]} r={0.3} yaw={0.3 + Math.sin(t * 0.5) * 0.15} face={false} /> : null;
const block = (t: number, o: {only?: number[]; days?: number; marks?: number} = {}) => <>
  {CELLS.filter((c) => !o.only || o.only.includes(c.no)).map((c) => <group key={c.no}><group position={[c.x, 0, 0]}><Cell t={t} days={c.no === 24 ? o.days ?? 0.45 : 0.45} marks={c.no === 24 ? o.marks ?? (t > ev('day') + 0.9 ? 10 : 4) : 9 + (c.no % 5)} />
    <CellPlate text={`ห้อง ${c.no}`} position={[0, 2.12, 1.54]} w={0.64} /></group>{inmate(c.who, t)}</group>)}
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 4.75]}><planeGeometry args={[22, 6.5]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.6, 8.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[22, 3.2]} /><meshLambertMaterial color="#6F736D" /></mesh>
  {[-4.5, 0, 4.5].map((x) => <pointLight key={x} position={[x, 2.6, 3.4]} color="#DCE6F2" intensity={1.4} distance={6} decay={1.5} />)}</>;

// =====================================================================================================
// PEOPLE
// =====================================================================================================
type GO = {clip?: string; face?: string; look?: V3; y?: number; sit?: boolean};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? (o.sit ? 'sit_table_idle_neutral_01' : 'idle_neutral_01'), ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {}), ...(o.sit ? {poseId: 'sitIdle'} : {})}), t, o.y ?? 0);
  return {I, w}; };
// the open fly (EP19), built once into his hips box
const flies = new WeakMap<any, THREE.Object3D>();
const flyOn = (I: any) => { let f = flies.get(I);
  if (!f) { let hipsFr: THREE.Object3D | null = null; I.bones.Bip01_Spine.traverse((o: any) => { if (!hipsFr && o.isMesh && o.geometry?.parameters?.height === 20 && o.geometry?.parameters?.depth === 19) hipsFr = o.parent; });
    f = makeFly(); (hipsFr ?? I.bones.Bip01_Spine).add(f); flies.set(I, f); }
  f.visible = true; };
// ---- his phone: first call on the LEFT ear (raised at `dial`, still there through the silence, gone before `paper`); second on the RIGHT ear
const callL = (t: number) => t < ev('paper') - 0.3 ? sm((t - ev('dial') + 0.25) / 0.25) * (1 - sm((t - ev('paper') + 0.6) / 0.3)) : 0;
const callR = (t: number) => sm((t - ev('dial2') + 0.25) / 0.25) * (1 - sm((t - ev('mqIn') - 0.6) / 0.4));
// ---- the contract: out of his pocket at `paper`, held through the bars in his left fist by its bottom-left corner; box 1 sits just
//      up-right of the fist so the blood signature is not hidden by it
const PAPER_HAND: V3 = [0.6, 1.2, 1.74];
/** where he looks while the mosquito is on his hand: fixed off the IK target (HAND.L is only known after his pose is set) */
const LOOK_HAND: V3 = [0.64, 1.26, 1.74];
const paperK = (t: number) => sm((t - ev('paper')) / 0.3);
const HAND = {L: [0, 0, 0] as V3};   // his left hand's world position this frame (set by man())
const paperAt = (t: number): V3 => { const k = paperK(t); const h = HAND.L; return lerp3([MAN.x + 0.2, 1.0, 1.3], [h[0] + CONTRACT.w / 2 + 0.01, h[1] + CONTRACT.h / 2, h[2] + 0.03], k); };
const box1At = (t: number): V3 => { const p = paperAt(t); return [p[0] + BOX1[0], p[1] + BOX1[1], p[2] + 0.004]; };
type MO = GO & {point?: V3; sitBench?: boolean; grip?: boolean};
const man = (C: Cast, t: number, o: MO = {}) => {
  const m = guy(C, 'nai', MAN.x, MAN.z, 0, t, {face: o.face ?? 'half', look: o.look ?? [MAN.x, 1.5, 4]});
  const cL = callL(t), cR = callR(t), pk = paperK(t);
  const nodes: React.ReactNode[] = [];
  if (cL > 0.01) { const ph = lerp3([MAN.x + 0.18, 1.0, MAN.z + 0.12], add(hw(m.I, EAR_L), [0.01, -0.01, -0.03]), cL); hand(m.I, 'L', add(ph, [0.02, -0.06, -0.03]), 'cup');
    nodes.push(<Phone key="pl" position={ph} rotation={[0, Math.PI / 2, 0.18 * cL]} />); }
  else if (pk > 0.01) hand(m.I, 'L', lerp3([MAN.x + 0.2, 0.95, MAN.z + 0.1], PAPER_HAND, pk), 'fist');
  else if (o.grip !== false) hand(m.I, 'L', BAR_L, 'fist');
  if (cR > 0.01) { const ph = lerp3([MAN.x - 0.18, 1.0, MAN.z + 0.12], add(hw(m.I, EAR_R), [-0.01, -0.01, -0.03]), cR); hand(m.I, 'R', add(ph, [-0.02, -0.06, -0.03]), 'cup');
    nodes.push(<Phone key="pr" position={ph} rotation={[0, -Math.PI / 2, -0.18 * cR]} lit={t < ev('cut') ? 1 : 0} />); }
  else if (o.point) hand(m.I, 'R', o.point, 'point');
  else if (o.grip !== false) hand(m.I, 'R', BAR_R, 'fist');
  m.w.updateMatrixWorld(true); flyOn(m.I); HAND.L = bw(m.I, 'Bip01_L_Hand');
  if (pk > 0.01) nodes.push(<Contract key="c" position={paperAt(t)} blood={t > ev('lift') + 0.22 ? 1 : 0} scale={0.4 + 0.6 * pk} />);
  return {...m, node: <><P o={m.w} />{nodes}</>}; };
/** the guard: back to the cell, phone in his LEFT hand. Two calls: rings → answers → hangs up (thumb) → pocket */
const guard = (C: Cast, t: number, face = 'half') => { const g = guy(C, 'offA', G.x, G.z, 0, t, {face, look: [G.x + 0.2, 1.5, G.z + 3]});
  const second = t > ev('dial2') - 0.3;
  const ring = second ? ev('dial2') : ev('ring'), up = second ? ev('dial2') + 0.15 : ev('answer'), down = second ? ev('cut') - 0.05 : ev('hang');
  const vis = t > ring - 0.15 && t < down + 0.7; const ear = sm((t - up) / 0.22) * (1 - sm((t - down) / 0.16));
  const low: V3 = [G.x + 0.2, 1.08, G.z + 0.24], chest: V3 = [G.x + 0.1, 1.22, G.z + 0.3];
  let ph = t < up ? low : t < down ? lerp3(low, add(hw(g.I, EAR_L), [0.01, -0.01, -0.03]), ear) : lerp3(add(hw(g.I, EAR_L), [0.01, -0.01, -0.03]), chest, sm((t - down) / 0.16));
  if (t > down + 0.45) ph = lerp3(chest, [G.x + 0.2, 0.95, G.z + 0.1], sm((t - down - 0.45) / 0.2));
  const buzz = t > ring && t < up ? 0.006 * Math.sin(t * 90) : 0; ph = [ph[0] + buzz, ph[1], ph[2]];
  const nodes: React.ReactNode[] = [];
  if (vis) { hand(g.I, 'L', add(ph, [0.02, -0.06, -0.02]), 'cup'); const tap = t > down + 0.05 && t < down + 0.4;
    if (tap) hand(g.I, 'R', add(chest, [-0.02, 0.0, 0.04]), 'point');
    const rot: V3 = ear > 0.5 ? [0, Math.PI / 2, 0.18] : [-0.6, 0, 0];
    nodes.push(<Phone key="g" position={ph} rotation={rot} lit={t < down + 0.12 ? 1 : 0} />); }
  g.w.updateMatrixWorld(true); return {...g, node: <><P o={g.w} />{nodes}</>}; };
// ---- the mosquito: in from the right after the cut-off call, lands on the back of his left hand (by the paper), bites, lifts at `lift`,
//      dabs box 1 (the blood signature appears 0.22 s after `lift`), then circles his head. Every position is read off his hand this frame.
const onHand = (): V3 => add(HAND.L, [0.0, 0.035, 0.04]);
const mqAt = (t: number): {p: V3; flap: number; yaw: number} => { const a = ev('mqIn'), l = ev('land'), f = ev('lift'); const h = onHand();
  if (t < a) return {p: [1.9, 1.7, 2.4], flap: 1, yaw: -1.6};
  if (t < l) { const k = sm((t - a) / (l - a)); const from: V3 = [1.6, 1.75, 2.2]; const mid: V3 = [1.05, 1.6, 2.05]; const q = lerp3(lerp3(from, mid, k), lerp3(mid, h, k), k);
    const w = 1 - k; return {p: [q[0] + 0.04 * w * Math.sin(t * 11), q[1] + 0.04 * w * Math.sin(t * 13), q[2]], flap: 1, yaw: -1.4}; }
  const nod = near(t, [ev('hop')], 0.3) ? 0.012 * Math.sin((t - ev('hop')) * 21) : 0;   // "ตอบตกลง": a little bob
  if (t < f) return {p: [h[0], h[1] + nod, h[2]], flap: 0, yaw: -2.4};
  const b1 = add(box1At(t), [0, 0.012, 0.012]);
  if (t < f + 0.4) { const k = sm((t - f) / 0.22); const p = lerp3(h, b1, k); return {p: [p[0], p[1] + 0.04 * Math.sin(k * Math.PI), p[2]], flap: k < 1 ? 1 : 0, yaw: -2.0}; }
  const u = t - f - 0.4; const head: V3 = [MAN.x, 1.62, MAN.z + 0.25]; const a2 = u * 4.2; const k = sm(u / 0.5);
  const orbit: V3 = [head[0] + Math.cos(a2) * 0.32, head[1] + 0.06 * Math.sin(a2 * 2), head[2] + 0.14 + Math.sin(a2) * 0.2];
  return {p: lerp3(add(b1, [0, 0.08 * u, 0.1 * u]), orbit, k), flap: 1, yaw: -a2}; };
const mosquito = (t: number, scale = 1) => { const m = mqAt(t); const fill = t < ev('bite') ? 0 : sm((t - ev('bite')) / (ev('lift') - ev('bite')));
  return t < ev('mqIn') ? null : <Mosquito t={t} position={m.p} rotation={[0, m.yaw, 0]} flap={m.flap} fill={fill} scale={scale} />; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: MCU through the bars of cell 24 — face between two bars, a hand on each, bored; the plate "ห้อง 24" over him
    const m = man(C, t, {face: 'half'});
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}</>, cam: mv({pos: [0.55, 1.62, 3.4], look: [0.35, 1.68, 1.3], fov: 40}, lt, {arrive: 0.06, push: 0.07}), bg: CELL_BG};
  },
  wall: (t, lt, C) => {
    // low wide: the walls of the block, cell after cell; he is small behind his bars
    const m = man(C, t, {face: 'half'});
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}</>, cam: mv({pos: [2.1, 0.5, 5.8], look: [0.2, 1.5, 0.6], fov: 54}, lt, {arrive: 0.06, push: 0.05, roll0: -3}), bg: CELL_BG};
  },
  allday: (t, lt, C) => {
    // inside 24, high: he sits slumped on the bench while the window's sun patch sweeps over the wall — a whole day goes by
    const u = cl((t - ev('day') + 0.1) / 1.0); const m = guy(C, 'nai', -0.6, -1.2, 0, t, {sit: true, face: 'half', look: [0.6, 2.2, -1.5]}); flyOn(m.I);
    return {node: <>{block(t, {only: [24], days: 0.45 + 1.0 * u, marks: Math.floor(4 + u * 6)})}<P o={m.w} /></>, cam: mv({pos: [1.15, 2.35, 1.25], look: [-0.5, 0.75, -1.05], fov: 54}, lt, {arrive: 0.05, push: 0.12}), bg: CELL_BG};
  },
  charge: (t, lt, C) => {
    // low angle: he jabs a finger at the wall of his cell. Snap zoom as the plate drops.
    const z = sm((t - ev('plate') + 0.05) / 0.17); const jab = 0.05 * Math.max(0, Math.sin((t - sh('charge').t0) * 8));
    const m = man(C, t, {face: 'shout', look: [-1.5, 1.6, 0.4], point: [-0.12 - jab, 1.55, 1.15]});
    return {node: <>{block(t, {only: [24, 18]})}{m.node}</>, cam: mv({pos: [1.3, 0.95, 3.2], look: [0.05, 1.6, 0.9], fov: 60 - 12 * z}, lt, {arrive: 0.07, push: -0.04, roll: 4, shake: near(t, [ev('plate')], 0.1) ? 0.012 : 0}), bg: CELL_BG};
  },
  phone: (t, lt, C) => {
    // MCU: phone to his left ear, dialling the police
    const m = man(C, t, {face: 'angry', look: [G.x, 1.5, G.z]});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}</>, cam: mv({pos: [0.9, 1.55, 2.75], look: [0.35, 1.58, 1.3], fov: 42}, lt, {arrive: 0.06, push: 0.09}), bg: CELL_BG};
  },
  guard: (t, lt, C) => {
    // two metres: the guard stands right in front of the cell, back to it. His phone buzzes. He answers. Behind him: the caller.
    const m = man(C, t, {face: 'angry', look: [G.x, 1.6, G.z]}); const g = guard(C, t);
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{g.node}</>, cam: mv({pos: [0.2, 1.5, 6.3], look: [0.78, 1.42, 2.4], fov: 54}, lt, {arrive: 0.06, push: 0.06}), bg: CELL_BG};
  },
  hangup: (t, lt, C) => {
    // MCU guard: he takes the phone from his ear and thumbs it off
    const m = man(C, t, {face: 'angry', look: [G.x, 1.6, G.z]}); const g = guard(C, t);
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{g.node}</>, cam: mv({pos: [1.65, 1.55, 4.75], look: [1.05, 1.42, 3.2], fov: 38}, lt, {arrive: 0.06, push: 0.08}), bg: CELL_BG};
  },
  silence: (t, lt, C) => {
    // frontal, locked off: the cell and the guard in front of it. Nobody moves. (no caption)
    const m = man(C, t, {face: 'open', look: [G.x, 1.6, G.z]}); const g = guard(C, t);
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{g.node}</>, cam: mv({pos: [0.6, 1.45, 7.4], look: [0.6, 1.38, 1.5], fov: 40}, lt, {arrive: 0, push: 0.03}), bg: CELL_BG};
  },
  invite: (t, lt, C) => {
    // he slips a sheet of paper out through the bars towards the cell next door, sly
    const m = man(C, t, {face: 'half', look: [X19 - 0.5, 1.3, 1.9]});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}</>, cam: mv({pos: [1.75, 1.5, 3.4], look: [0.6, 1.4, 1.5], fov: 44}, lt, {arrive: 0.06, push: 0.08}), bg: CELL_BG};
  },
  plan: (t, lt, C) => {
    // ECU: the contract — "สัญญาแก๊งห้อง 24 · แผนแหกคุก", seven empty boxes
    const m = man(C, t, {face: 'half', look: [X19 - 0.5, 1.3, 1.9]}); const p = paperAt(t);
    return {node: <>{block(t, {only: [24]})}{m.node}</>, cam: mv({pos: [p[0] + 0.05, p[1] + 0.06, p[2] + 0.42], look: p, fov: 40}, lt, {arrive: 0.06, push: 0.12, roll: -3}), bg: CELL_BG};
  },
  fan: (t, lt, C) => {
    // cell 19, frontal: the fan's head sweeps left, right, left — no. Punch in on "ส่ายหน้า".
    const z = sm((t - ev('shake') + 0.1) / 0.2);
    return {node: <>{block(t, {only: [19]})}</>, cam: mv({pos: [X19 + 0.1, 1.45, 3.7], look: [X19, 1.35, -0.2], fov: 44 - 12 * z}, lt, {arrive: 0.06, push: 0.06}), bg: CELL_BG};
  },
  earth: (t, lt, C) => {
    // cell 18, low: the whole Earth, cuffed, filling its cell — it turns its back on him (spins away), the Moon going round it
    return {node: <>{block(t, {only: [18]})}</>, cam: mv({pos: [X18 + 0.25, 0.6, 3.3], look: [X18, 1.3, -0.1], fov: 62}, lt, {arrive: 0.06, push: 0.07, roll0: 3}), bg: CELL_BG};
  },
  fridge: (t, lt, C) => {
    // cell 23: the fridge stands ajar, the fire burning small and frosted inside it
    return {node: <>{block(t, {only: [23]})}</>, cam: mv({pos: [X23 + 0.45, 1.2, 3.3], look: [X23 + 0.05, 0.95, -0.5], fov: 44}, lt, {arrive: 0.06, push: 0.08}), bg: CELL_BG};
  },
  cold: (t, lt, C) => {
    // closer: cold air pours out at him — and the door swings shut. Cold shoulder.
    const mouth: V3 = [fridgeP[0], 0.95, fridgeP[2] + ICEBOX.d / 2 + 0.05];
    return {node: <>{block(t, {only: [23]})}<Chill from={mouth} t={t} t0={ev('puff') - 0.25} t1={ev('puff') + 0.45} dir={[0.15, -0.3, 1]} size={0.07} n={18} /></>,
      cam: mv({pos: [X23 + 0.7, 1.1, 2.45], look: [X23 + 0.05, 0.92, -0.3], fov: 44}, lt, {arrive: 0.06, push: 0.1}), bg: CELL_BG};
  },
  moon: (t, lt, C) => {
    // from the corridor: him at the corner of his bars waving at 18; the Moon goes round the Earth with its face (red arrow) always on the Earth
    const m = guy(C, 'nai', -1.12, 1.28, -0.35, t, {face: 'half', look: [X18, 1.5, 0.4]}); flyOn(m.I); const wave = Math.sin((t - sh('moon').t0) * 9) * 0.06;
    hand(m.I, 'R', [-1.3 + wave, 1.75, 1.42], 'open'); hand(m.I, 'L', [-0.95, 1.3, 1.47], 'fist'); m.w.updateMatrixWorld(true);
    const cam: V3 = [-0.75, 1.6, 4.3]; const mo = moonAt(t); const d = new THREE.Vector3(EARTH_C[0] - mo[0], EARTH_C[1] - mo[1], EARTH_C[2] - mo[2]).normalize();
    const a: V3 = [mo[0] + d.x * MOON_R, mo[1] + d.y * MOON_R, mo[2] + d.z * MOON_R], b: V3 = [EARTH_C[0] - d.x * (EARTH_R + 0.04), EARTH_C[1] - d.y * (EARTH_R + 0.04), EARTH_C[2] - d.z * (EARTH_R + 0.04)];
    return {node: <>{block(t, {only: [24, 18]})}<P o={m.w} /><FaceArrow a={a} b={b} cam={cam} k={sm((t - sh('moon').t0 - 0.15) / 0.3)} /></>,
      cam: mv({pos: cam, look: [-2.2, 1.4, 0.4], fov: 60}, lt, {arrive: 0.06, push: 0.05}), bg: CELL_BG};
  },
  charge2: (t, lt, C) => {
    // high, frontal, symmetric: cell 24 in the middle, the Earth's cell and the fan's either side; he shouts, finger out. The second plate drops.
    const z = sm((t - ev('plate2') + 0.05) / 0.17); const m = man(C, t, {face: 'shout', look: [-3, 1.4, 1.8], point: [0.08, 1.62, 1.62]});
    return {node: <>{block(t, {only: [18, 24, 19]})}{m.node}</>, cam: mv({pos: [0.35, 1.75, 4.9], look: [0.35, 1.35, 0.6], fov: 60 - 10 * z}, lt, {arrive: 0.07, push: 0.04, roll: -3, shake: near(t, [ev('plate2')], 0.1) ? 0.012 : 0}), bg: CELL_BG};
  },
  phone2: (t, lt, C) => {
    // the same two-shot: he calls again; the guard has it at his ear for a second and hangs up before he finishes the word
    const m = man(C, t, {face: 'shout', look: [G.x, 1.6, G.z]}); const g = guard(C, t);
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{g.node}</>, cam: mv({pos: [0.2, 1.5, 6.3], look: [0.78, 1.42, 2.4], fov: 50}, lt, {arrive: 0.04, push: 0.1, shake: near(t, [ev('cut')], 0.08) ? 0.01 : 0}), bg: CELL_BG};
  },
  buzz: (t, lt, C) => {
    // CU from his right: dead line at his ear. A whine — the mosquito comes in. (no caption)
    const m = man(C, t, {face: 'open', look: [1.1, 1.65, 2.0]});
    return {node: <>{block(t, {only: [24]})}{m.node}{mosquito(t, 2.0)}</>, cam: mv({pos: [-0.05, 1.55, 2.55], look: [0.4, 1.5, 1.3], fov: 44}, lt, {arrive: 0.05, push: 0.08}), bg: CELL_BG};
  },
  mosq: (t, lt, C) => {
    // it comes down and lands on the back of his hand, the one holding the paper
    const m = man(C, t, {face: 'open', look: LOOK_HAND});
    return {node: <>{block(t, {only: [24]})}{m.node}{mosquito(t, 2.0)}</>, cam: mv({pos: [1.1, 1.5, 2.75], look: [0.62, 1.38, 1.6], fov: 42}, lt, {arrive: 0.06, push: 0.1}), bg: CELL_BG};
  },
  yes: (t, lt, C) => {
    // close: it sits on his hand, right by box 1 — and bobs. Yes.
    const m = man(C, t, {face: 'open', look: LOOK_HAND}); const h = onHand();
    return {node: <>{block(t, {only: [24]})}{m.node}{mosquito(t, 2.0)}</>, cam: mv({pos: [h[0] + 0.12, h[1] + 0.08, h[2] + 0.45], look: add(h, [0.05, 0.05, 0]), fov: 34}, lt, {arrive: 0.06, push: 0.1}), bg: CELL_BG};
  },
  sign: (t, lt, C) => {
    // macro: it bites; its belly fills red
    const m = man(C, t, {face: 'open', look: LOOK_HAND}); const h = onHand();
    return {node: <>{block(t, {only: [24]})}{m.node}{mosquito(t, 2.0)}</>, cam: mv({pos: [h[0] + 0.08, h[1] + 0.05, h[2] + 0.24], look: add(h, [0.01, 0.0, 0]), fov: 30}, lt, {arrive: 0.05, push: 0.12, roll: 3}), bg: CELL_BG};
  },
  blood: (t, lt, C) => {
    // it lifts off and dabs box 1: signed, in his blood. Pull back to him at the bars, the mosquito circling his head; the picture walks on
    const m = man(C, t, {face: 'half', look: LOOK_HAND}); const b = box1At(t); const k = sm((lt - 0.2) / 1.6);
    const pos = lerp3([b[0] + 0.06, b[1] + 0.05, b[2] + 0.36], [0.85, 1.58, 3.0], k), look = lerp3(add(b, [0, 0.03, 0]), [0.42, 1.48, 1.35], k);
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{mosquito(t, 2.0)}</>, cam: mv({pos, look, fov: lerp(32, 42, k)}, lt, {arrive: 0, push: 0.08}), bg: CELL_BG};
  },
};
