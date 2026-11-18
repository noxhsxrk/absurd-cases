import React from 'react';
import * as THREE from 'three';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {Mosquito, Handcuffs, Jar} from '../AbsurdEp1/props';
import {CellPlate, Fan} from '../AbsurdEp2/props';
import {Durian} from '../AbsurdEp4/props';
import {Bubbles, FoamRing} from '../AbsurdEp5/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {Moon} from '../AbsurdEp15/props';
import {Phone} from '../AbsurdEp16/props';
import {Icebox, ICEBOX, Fire} from '../AbsurdEp17/props';
import {makeFly} from '../AbsurdEp19/props';
import {ps, body, hideProps, prop, P, CamRig, mv, near, sm, V3, Cast, ShotOut, CELL_BG, hand, hw, bw, headFr} from '../lifekit/stage';
import {WallPlan, Swarm, makeFogger, NOZZLE, makeGasMask, FogJet, FogBank} from './props';

export {CamRig};
/** EP21 · แก๊งห้อง 24 S1E2 แหกคุกได้ครึ่งตัว. His plan: let the mosquito (EP20, it signed in his blood) drink until he is thin enough
 *  to slip between the bars. It bites — assault! — he calls the police, the guard two metres away answers, and he takes it back. One mosquito
 *  is not enough, so it brings a million relatives. He goes flat as paper, turns sideways, slides into the bars — and stops half out. Itchy
 *  all over: assault, a million counts. He calls again, and this time he does not take it back. The guard masks up and fogs the whole block;
 *  the swarm flees out of the window with his blood; the guard pinches one out of the fog and cuffs it. He escaped by half. That night,
 *  something slippery takes his hand (the cliffhanger: the soap, EP5 — not shown).
 *
 *  LAYOUT (metres; yaw 0 faces +z; a character's LEFT is +x at yaw 0) — the EP20 block, unchanged
 *  cells   a row along x, each an EP1 Cell (3 × 3, bars at z 1.5 spaced 0.24, open to the corridor on +z), CW apart:
 *          23 the fire's fridge (−2CW) · 18 the Earth + the Moon (−CW) · 24 HIM (0) · 19 the fan (+CW) · 20 the durian (+2CW)
 *          cell 24 has no waist rail this episode (rails at 0.04 and 2.6 only) so a flat man can pass between two bars without cutting a rail
 *  him     standing: (0.35, 1.28) facing +z, face between the bars at x 0.23 / 0.47. The plan is chalked on his LEFT wall (x −1.49).
 *          From `turn` he faces +x (yaw π/2): his thin axis is world x, his width runs along z — his LEFT side is −z (inside), his RIGHT
 *          side is +z (outside). He slides from z 1.05 to 1.5 (body centre on the bar plane) and stays there: right arm and leg out.
 *  guard   offA at G (1.05, 3.2), facing +z (back to the cell) until `firm`, then turns to face the cell (yaw π). Phone in his LEFT hand
 *          (as EP20). Mask on at `mask`. The fogger stands on the floor by his right foot from frame 0 and is in his LEFT hand from `fogOn`.
 *
 *  TRAPS OF THIS EPISODE
 *  1. "แบนเป็นกระดาษ" only reads from the side: the `flat` shot looks along x from inside the cell, so he is a thin sheet in profile.
 *  2. "ออกไปได้ครึ่งตัว" only reads from a diagonal (the corridor at +x+z): frontal he is a sliver between two bars.
 *  3. The waist rail would cut through him — removed from cell 24 (Cell rails prop). Nothing else crosses the bar plane but his body.
 *  4. Hands: first call LEFT ear (standing). Everything after `turn` is his RIGHT hand (the outside one): scratching, pointing, the second
 *     call, the hand the foam takes. The left arm hangs inside, untouched.
 *  5. The swarm is one InstancedMesh; "ล้านตัว" is a cloud dense enough to hide his body, not a count. Red bellies only from `flee`.
 *  6. The fogger must exist before it is used: on the floor by the guard in every two-shot before `fogOn`.
 *  7. Night: the corridor lights go down to a blue wash and the window goes dark; the Moon's glow in 18 is the warm light.
 *  8. Offenders keep no face: Earth eyes off, durian face off. The one mosquito keeps EP1's look. The soap is never shown — foam only. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CW = 3.05, X23 = -2 * CW, X18 = -CW, X19 = CW, X20 = 2 * CW;
const MAN = {x: 0.35, z: 1.28}, G = {x: 1.05, z: 3.2};
const BAR_R: V3 = [0.21, 1.44, 1.46], BAR_L: V3 = [0.49, 1.44, 1.46];
const EAR_L: V3 = [12, 12, 2], EAR_R: V3 = [-12, 12, 2];
const WINDOW: V3 = [0.6, 2.25, -1.45];
const FOGGER_FLOOR: V3 = [1.62, 0.0, 3.05];

// =====================================================================================================
// THE BLOCK (EP20) — by day, or at night (k 0…1)
// =====================================================================================================
const EARTH_C: V3 = [X18, 1.08, -0.15], EARTH_R = 0.95;
const ORB = {r: 1.2, y: 2.05, w: (Math.PI * 2) / 3.2};
const moonAt = (t: number): V3 => { const a = ORB.w * t; return [EARTH_C[0] + Math.cos(a) * ORB.r, ORB.y + 0.1 * Math.sin(a), EARTH_C[2] + Math.sin(a) * ORB.r]; };
const stare = (t: number) => sm((t - ev('stare')) / 0.5);
const fanHead = (t: number) => lerp(Math.sin(t * 2.7) * 0.75, -0.95, stare(t));   // at `stare` it stops oscillating and points at 24
const fridgeP: V3 = [X23 + 0.1, 0, -0.6];
const fridgeDoor = (t: number) => 0.12 + 0.35 * stare(t);
const nightK = (t: number) => sm((t - ev('night')) / 0.3);
type Who = 'fridge' | 'earth' | 'man' | 'fan' | 'durian';
const CELLS: {x: number; no: number; who: Who}[] = [{x: X23, no: 23, who: 'fridge'}, {x: X18, no: 18, who: 'earth'}, {x: 0, no: 24, who: 'man'}, {x: X19, no: 19, who: 'fan'}, {x: X20, no: 20, who: 'durian'}];
const inmate = (who: Who, t: number) => who === 'earth' ? <>
    <Earth t={t} position={EARTH_C} r={EARTH_R} yaw={0.6 * t * (1 - stare(t)) + 0.6 * ev('stare') * stare(t)} shake={0.25} eyes={false} />
    <EarthCuff center={EARTH_C} r={EARTH_R} close={1} tilt={[0.3, 0, 0.25]} />
    <Moon t={t} position={moonAt(t)} r={0.28} glow={0.9} spin={Math.PI / 2 - ORB.w * t} />
    <pointLight position={add(moonAt(t), [0, 0.2, 0])} color="#FFF0C8" intensity={1.2 + 1.2 * nightK(t)} distance={3 + 2 * nightK(t)} decay={1.6} /></>
  : who === 'fan' ? <Fan position={[X19, 0, -0.2]} scale={1.35} headYaw={fanHead(t)} blade={t * 31} blur={1} lit={3} />
  : who === 'fridge' ? <><Icebox position={fridgeP} door={fridgeDoor(t)} glow={0.9} frost={0.3} />
    <Fire position={[fridgeP[0], ICEBOX.shelf + 0.02, fridgeP[2]]} t={t} size={0.3} light={0.5} /></>
  : who === 'durian' ? <Durian position={[X20 + 0.1, 0.32, -0.5]} r={0.3} yaw={lerp(0.3 + Math.sin(t * 0.5) * 0.15, 1.2, stare(t))} face={false} /> : null;
const block = (t: number, o: {only?: number[]; plan?: boolean} = {}) => { const nk = nightK(t); return <>
  {CELLS.filter((c) => !o.only || o.only.includes(c.no)).map((c) => <group key={c.no}><group position={[c.x, 0, 0]}>
    <Cell t={t} days={nk > 0.5 ? 0.98 : 0.45} marks={c.no === 24 ? 11 : 9 + (c.no % 5)} rails={c.no === 24 ? [0.04, 2.6] : undefined} />
    <CellPlate text={`ห้อง ${c.no}`} position={[0, 2.12, 1.54]} w={0.64} /></group>{inmate(c.who, t)}</group>)}
  {o.plan !== false && (!o.only || o.only.includes(24)) && <WallPlan position={[-1.48, 1.55, -0.2]} rotation={[0, Math.PI / 2, 0]} w={1.5} />}
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 4.75]}><planeGeometry args={[22, 6.5]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.6, 8.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[22, 3.2]} /><meshLambertMaterial color="#6F736D" /></mesh>
  {[-4.5, 0, 4.5].map((x) => <pointLight key={x} position={[x, 2.6, 3.4]} color={nk > 0.5 ? '#5A6EA8' : '#DCE6F2'} intensity={1.4 * (1 - 0.7 * nk)} distance={6} decay={1.5} />)}
  {t < ev('fogOn') - 0.4 && <Fogger o={null} pos={FOGGER_FLOOR} aim={[1.62, 0.9, 3.05]} lying />}</>; };
const NIGHT_BG = {color: '#0E1424'};

// =====================================================================================================
// THE FOGGER: one object, placed in world space each frame (it is built in cm along +x from the grip)
// =====================================================================================================
let foggerObj: THREE.Object3D | null = null;
const fogger = () => { if (!foggerObj) { foggerObj = makeFogger(); foggerObj.scale.setScalar(0.01); } return foggerObj; };
/** the fogger with its grip at `pos`, barrel pointing at `aim`; returns the nozzle's world position via the callback-free helper below */
const foggerPose = (pos: V3, aim: V3, lying = false) => { const o = fogger(); o.position.set(...pos);
  if (lying) o.rotation.set(0, 0.4, 0); else { const d = new THREE.Vector3(aim[0] - pos[0], aim[1] - pos[1], aim[2] - pos[2]).normalize(); o.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d); }
  o.updateMatrixWorld(true); const v = new THREE.Vector3(...NOZZLE).applyMatrix4(o.matrixWorld); return [v.x, v.y, v.z] as V3; };
const Fogger: React.FC<{o: null; pos: V3; aim: V3; lying?: boolean}> = ({pos, aim, lying}) => { foggerPose(lying ? [pos[0], 0.1, pos[2]] : pos, aim, lying); return <P o={fogger()} />; };

// =====================================================================================================
// PEOPLE
// =====================================================================================================
type GO = {clip?: string; face?: string; look?: V3; y?: number};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {})}), t, o.y ?? 0);
  return {I, w}; };
const flies = new WeakMap<any, THREE.Object3D>();
const flyOn = (I: any) => { let f = flies.get(I);
  if (!f) { let hipsFr: THREE.Object3D | null = null; I.bones.Bip01_Spine.traverse((o: any) => { if (!hipsFr && o.isMesh && o.geometry?.parameters?.height === 20 && o.geometry?.parameters?.depth === 19) hipsFr = o.parent; });
    f = makeFly(); (hipsFr ?? I.bones.Bip01_Spine).add(f); flies.set(I, f); }
  f.visible = true; };

// ---- him: standing → flat → sideways → half out
const flat = (t: number) => 0.4 * sm((t - ev('flat0')) / (ev('flatB') - ev('flat0'))) + 0.6 * sm((t - ev('flatB')) / (ev('flat1') - ev('flatB')));
const thick = (t: number) => 1 - 0.88 * flat(t);
const turnK = (t: number) => sm((t - ev('turn')) / 0.3);
const manZ = (t: number) => t < ev('slide') ? lerp(MAN.z, 1.05, turnK(t)) : lerp(1.05, 1.5, Math.min(1, ((t - ev('slide')) / (ev('stuck') - ev('slide'))) ** 0.7));
/** the middle of his body (for the swarm and the cameras) */
const torso = (t: number): V3 => [MAN.x, 1.25, manZ(t)];
const outHand = {R: [0, 0, 0] as V3, L: [0, 0, 0] as V3};
const HAND_OUT: V3 = [0.6, 1.22, 1.74];   // his left hand out through the gap 0.47…0.71, back of the hand up: the mosquito's landing pad
const handOut = (t: number) => t > ev('offer') && t < ev('plate') - 0.15 ? sm((t - ev('offer')) / 0.3) : 0;
const call1 = (t: number) => sm((t - ev('dial') + 0.25) / 0.25) * (1 - sm((t - ev('retract') - 0.1) / 0.25));
const call2 = (t: number) => sm((t - ev('dial2') + 0.25) / 0.25) * (1 - sm((t - ev('mask') - 0.2) / 0.3));
const man = (C: Cast, t: number, o: {face?: string; look?: V3; point?: V3} = {}) => {
  const yaw = (Math.PI / 2) * turnK(t);
  const m = guy(C, 'nai', MAN.x, manZ(t), yaw, t, {face: o.face ?? 'half', look: o.look ?? [MAN.x + 4 * Math.sin(yaw), 1.5, manZ(t) + 4 * Math.cos(yaw)]});
  m.w.scale.z *= thick(t); m.w.updateMatrixWorld(true);
  const nodes: React.ReactNode[] = []; const c1 = call1(t), c2 = call2(t), ho = handOut(t);
  if (t < ev('turn')) {
    if (c1 > 0.01) { const ph = lerp3([MAN.x + 0.18, 1.0, MAN.z + 0.12], add(hw(m.I, EAR_L), [0.01, -0.01, -0.03]), c1); hand(m.I, 'L', add(ph, [0.02, -0.06, -0.03]), 'cup');
      nodes.push(<Phone key="pl" position={ph} rotation={[0, Math.PI / 2, 0.18 * c1]} lit={t < ev('retract') + 0.1 ? 1 : 0} />); }
    else if (ho > 0.01) hand(m.I, 'L', lerp3(BAR_L, HAND_OUT, ho), 'open');
    else if (t < ev('flat0') + 0.3) hand(m.I, 'L', BAR_L, 'fist');
    // right hand: points at the offender on the charge; waves "no, no" while he takes the call back; else on the bar
    if (o.point) hand(m.I, 'R', o.point, 'point');
    else if (t > ev('retract') - 0.05 && t < ev('retract') + 0.75) hand(m.I, 'R', [0.12 + 0.07 * Math.sin((t - ev('retract')) * 22), 1.5, 1.62], 'open');
    else if (t < ev('flat0') + 0.3) hand(m.I, 'R', BAR_R, 'fist');
  } else {
    // sideways: only the RIGHT (outside, +z) hand acts
    const S = ev('itch');
    if (c2 > 0.01) { const ph = lerp3([MAN.x + 0.1, 1.0, manZ(t) + 0.35], add(hw(m.I, EAR_R), [0.0, -0.01, 0.03]), c2); hand(m.I, 'R', add(ph, [0.0, -0.06, 0.02]), 'cup');
      nodes.push(<Phone key="pr" position={ph} rotation={[0, 0, 0.18 * c2]} lit={1} />); }
    else if (o.point) hand(m.I, 'R', o.point, 'point');
    else if (t > S && t < ev('plate2') - 0.25) { const k = (t - S) * 11; hand(m.I, 'R', [MAN.x + 0.1, 1.2 + 0.25 * Math.sin(k * 0.6), manZ(t) + 0.22 + 0.07 * Math.sin(k)], 'claw'); }
  }
  m.w.updateMatrixWorld(true); flyOn(m.I); outHand.R = bw(m.I, 'Bip01_R_Hand'); outHand.L = bw(m.I, 'Bip01_L_Hand');
  return {...m, node: <><P o={m.w} />{nodes}</>}; };

// ---- the guard: back to the cell; phone in his LEFT hand. Call 1: rings → answers → he takes it back → the guard lowers it, looks at it.
//      Call 2: rings → answers → keeps it → turns to the cell (`firm`) → mask (`mask`) → fogger (`fogOn` … `catch`) → pinches one (`catch`)
// the gas mask lives on the head frame (x left, y up, z forward), built once, shown from `mask`
const masks = new WeakMap<any, THREE.Object3D>();
const maskOn = (I: any) => { let m = masks.get(I); if (!m) { m = makeGasMask(); headFr(I).add(m); masks.set(I, m); } return m; };
const turnG = (t: number) => sm((t - ev('firm')) / 0.35);
const guard = (C: Cast, t: number, face = 'half', at = G) => { const yaw = Math.PI * turnG(t);
  const g = guy(C, 'offA', at.x, at.z, yaw, t, {face, look: [at.x + 3 * Math.sin(yaw), 1.5, at.z + 3 * Math.cos(yaw)]});
  const nodes: React.ReactNode[] = [];
  const second = t > ev('dial2') - 0.3;
  const ring = second ? ev('ring2') : ev('ring'), up = second ? ev('answer2') : ev('answer'), down = second ? ev('firm') - 0.1 : ev('gdown');
  const vis = t > ring - 0.15 && t < down + 0.9; const ear = sm((t - up) / 0.22) * (1 - sm((t - down) / 0.2));
  const low: V3 = [G.x + 0.2, 1.08, G.z + 0.24], chest: V3 = [G.x + 0.15, 1.25, G.z + 0.32];
  let ph = t < up ? low : t < down ? lerp3(low, add(hw(g.I, EAR_L), [0.01, -0.01, -0.03]), ear) : lerp3(add(hw(g.I, EAR_L), [0.01, -0.01, -0.03]), chest, sm((t - down) / 0.2));
  if (t > down + 0.55) ph = lerp3(chest, [G.x + 0.2, 0.95, G.z + 0.1], sm((t - down - 0.55) / 0.25));
  const buzz = t > ring && t < up ? 0.006 * Math.sin(t * 90) : 0; ph = [ph[0] + buzz, ph[1], ph[2]];
  if (vis && turnG(t) < 0.5) { hand(g.I, 'L', add(ph, [0.02, -0.06, -0.02]), 'cup'); nodes.push(<Phone key="g" position={ph} rotation={ear > 0.5 ? [0, Math.PI / 2, 0.18] : [-0.6, 0, 0]} lit={t < down + 0.12 ? 1 : 0} />); }
  // mask: drops onto his face over 0.2 s at `mask`
  const mk = maskOn(g.I); mk.visible = t > ev('mask'); mk.position.y = 26 * (1 - sm((t - ev('mask')) / 0.2));
  // fogger in his LEFT hand at the hip, barrel at cell 24; puffs out of the nozzle from `fogOn` to `catch`
  let nozzle: V3 | null = null;
  if (t > ev('fogOn') - 0.4) { const sway = 0.25 * Math.sin((t - ev('fogOn')) * 2.2); const grip: V3 = [at.x - 0.22, 1.0, at.z - 0.25];
    const aim: V3 = t < ev('catch') - 0.3 ? [0.35 + 2.5 * sway, 1.0, 0.0] : [at.x - 0.4, 0.2, at.z - 0.4];
    hand(g.I, 'L', grip, 'fist'); nozzle = foggerPose(grip, aim); nodes.push(<P key="fg" o={fogger()} />); }
  // right hand: pinches one mosquito out of the air at `catch`, holds it up through `cuff`
  if (t > ev('catch') - 0.35) hand(g.I, 'R', catchHand(t), 'claw');
  g.w.updateMatrixWorld(true); return {...g, nozzle, node: <><P o={g.w} />{nodes}</>}; };
const PINCH: V3 = [G.x + 0.12, 1.55, G.z - 0.42];
const catchHand = (t: number): V3 => lerp3([G.x + 0.35, 1.3, G.z - 0.5], PINCH, sm((t - ev('catch') + 0.35) / 0.35));
/** the one he caught: between his finger and thumb, legs down, tiny cuffs on from `cuff` */
const mqHeld = (t: number) => add(catchHand(t), [0.0, 0.03, -0.11]);
const caught = (t: number, scale = 2) => { const p = mqHeld(t);
  return <><Mosquito t={t} position={p} rotation={[0, 0.6, 0.25 * Math.sin(t * 13)]} flap={t < ev('catch') ? 1 : 0.25} fill={1} scale={scale} />
    <Handcuffs k={sm((t - ev('cuff') + 0.08) / 0.12)} position={add(p, [0, -0.012 * scale, 0])} rotation={[Math.PI / 2, 0, 0.6]} size={0.2 * scale} /></>; };

// ---- the one mosquito (EP20): circling his head until the offer, then on the back of his left hand, bites (belly fills), lifts at `full`,
//      then (on l006) flies to the window and out to fetch the family
const mqAt = (t: number): {p: V3; flap: number; yaw: number} => { const land = ev('bite') - 0.4, hand0: V3 = add(HAND_OUT, [0.0, 0.04, 0.03]);
  const head: V3 = [MAN.x, 1.66, MAN.z + 0.3]; const a = t * 4.2;
  const orbit: V3 = [head[0] + Math.cos(a) * 0.3, head[1] + 0.05 * Math.sin(a * 2), head[2] + 0.12 + Math.sin(a) * 0.18];
  if (t < land - 0.6) return {p: orbit, flap: 1, yaw: -a};
  if (t < land) { const k = sm((t - land + 0.6) / 0.6); return {p: lerp3(orbit, hand0, k), flap: 1, yaw: -2.2}; }
  if (t < ev('full')) return {p: hand0, flap: 0, yaw: -2.2};
  if (t < ev('mqOut')) { const k = sm((t - ev('full')) / 0.4); const p = lerp3(hand0, [0.75, 1.75, 1.9], k); return {p: [p[0] + 0.05 * k * Math.sin(t * 9), p[1] + 0.04 * k * Math.sin(t * 13), p[2]], flap: 1, yaw: -1.2}; }
  const k = sm((t - ev('mqOut')) / 0.9); const mid: V3 = [0.9, 2.3, 0.6]; return {p: lerp3(lerp3([0.75, 1.75, 1.9], mid, k), lerp3(mid, add(WINDOW, [0, 0, -0.2]), k), k), flap: 1, yaw: 0}; };
const mosquito = (t: number, scale = 2) => { if (t > ev('mqOut') + 0.9) return null; const m = mqAt(t); const fill = sm((t - ev('bite')) / (ev('full') - ev('bite')));
  return <Mosquito t={t} position={m.p} rotation={[0, m.yaw, 0]} flap={m.flap} fill={fill} scale={scale} />; };

// ---- the million: in through the window on l006, a cloud round him (it follows his body), out of the window again from `out` (red)
const dens = (t: number) => t < ev('flat1') ? 1 : t < ev('itch') - 0.3 ? lerp(1, 0.3, sm((t - ev('flat1')) / 0.4)) : lerp(0.3, 0.85, sm((t - ev('itch') + 0.3) / 0.4));
const swarm = (t: number, n = 900, avoid?: V3) => { if (t < ev('swarm') - 0.2) return null; const c = torso(t);
  const leave = sm((t - ev('flee')) / 0.4) ; const gone = sm((t - ev('out')) / 1.1);
  const center: V3 = lerp3(c, [0.6, 1.9, -0.6], leave);
  const k = (1 - gone) * (t < ev('flee') ? dens(t) : 1); if (k <= 0.01) return null;
  return <Swarm t={t} center={center} r={lerp3([0.55, 0.85, 0.55], [0.45, 0.35, 0.45], leave)} n={n} k={k} red={sm((t - ev('flee') + 0.1) / 0.5)}
    from={WINDOW} inK={t < ev('out') ? sm((t - ev('swarm')) / 1.1) : 1 - gone} avoid={avoid} />; };

// ---- fog: from the nozzle while fogging; the bank fills the block from `fogAll` and clears from `clear`
const fogK = (t: number) => sm((t - ev('fogOn') - 0.4) / 1.4) * (1 - sm((t - ev('clear')) / 1.4));
const fog = (t: number, g: {nozzle: V3 | null}, avoid?: V3, inside = true, jet = true) => <>
  {jet && g.nozzle && <FogJet t={t} from={g.nozzle} dir={[-0.35, -0.05, -0.94]} t0={ev('fogOn')} t1={ev('catch') - 0.3} />}
  <FogBank t={t} center={[0, 0, 2.2]} size={[9, 2.4, 3.6]} k={fogK(t)} n={60} avoid={avoid} />
  {inside && <FogBank t={t} center={[0, 0, -0.3]} size={[2.6, 2.4, 2.4]} k={fogK(t)} n={18} seed={3} avoid={avoid} />}</>;
const sceneFog = (t: number): [string, number, number] | undefined => fogK(t) > 0.02 ? ['#C9CCC8', lerp(30, 3, fogK(t)), lerp(60, 18, fogK(t))] : undefined;

// =====================================================================================================
const G2 = {x: 2.25, z: 3.6};   // after the catch he has stepped aside
const jar25 = (t: number) => <><Jar position={[-0.45, 0, 2.15]} scale={1.6}><Mosquito t={t} position={[0, 0.06, 0]} flap={0.2} fill={1} scale={2} /></Jar>
  <CellPlate text="ห้อง 25" position={[-0.45, 0.36, 2.25]} w={0.16} /></>;

export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: MCU through the bars, bored and scheming; the mosquito circles him; the plan on the wall behind
    const m = man(C, t, {face: 'angry'});
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{mosquito(t)}</>, cam: mv({pos: [0.62, 1.6, 3.2], look: [0.33, 1.6, 1.3], fov: 42}, lt, {arrive: 0.06, push: 0.08}), bg: CELL_BG};
  },
  offer: (t, lt, C) => {
    // he puts his hand out through the bars, back up, for the mosquito: drink
    const m = man(C, t, {face: 'half', look: add(HAND_OUT, [0, 0.1, 0])});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{mosquito(t)}</>, cam: mv({pos: [1.25, 1.45, 2.65], look: [0.55, 1.35, 1.6], fov: 42}, lt, {arrive: 0.06, push: 0.09}), bg: CELL_BG};
  },
  diagram: (t, lt, C) => {
    // inside 24 from the far wall: the chalk plan — fat man ✗ → mosquito drinking → thin man through the bars ✓
    const m = man(C, t, {face: 'half', look: add(HAND_OUT, [0, 0.1, 0])});
    return {node: <>{block(t, {only: [24]})}{m.node}{mosquito(t)}</>, cam: mv({pos: [1.35, 1.58, -0.18], look: [-1.48, 1.52, -0.2 + 0.12 * lt], fov: 52}, lt, {arrive: 0.08, push: 0.16, roll: -3}), bg: CELL_BG};
  },
  bite: (t, lt, C) => {
    // macro: it sits on the back of his hand and drinks; its belly fills red (no caption)
    const m = man(C, t, {face: 'closed', look: HAND_OUT}); const h = add(HAND_OUT, [0, 0.04, 0.03]);
    return {node: <>{block(t, {only: [24]})}{m.node}{mosquito(t)}</>, cam: mv({pos: [h[0] + 0.09, h[1] + 0.06, h[2] + 0.26], look: add(h, [0.01, 0.0, 0]), fov: 30}, lt, {arrive: 0.04, push: 0.12, roll: 3}), bg: CELL_BG};
  },
  charge: (t, lt, C) => {
    // low angle: he snatches his hand back and points at the fat mosquito. Snap zoom as the plate drops.
    const z = sm((t - ev('plate') + 0.05) / 0.17); const mq = mqAt(t).p;
    const m = man(C, t, {face: 'shout', look: mq, point: add(mq, [-0.18, -0.05, -0.08])});
    return {node: <>{block(t, {only: [24, 18]})}{m.node}{mosquito(t)}</>, cam: mv({pos: [1.3, 0.95, 3.2], look: [0.3, 1.6, 1.3], fov: 58 - 12 * z}, lt, {arrive: 0.07, push: -0.04, roll: 4, shake: near(t, [ev('plate')], 0.1) ? 0.012 : 0}), bg: CELL_BG};
  },
  phone: (t, lt, C) => {
    // MCU: phone to his left ear
    const m = man(C, t, {face: 'angry', look: [G.x, 1.5, G.z]});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{mosquito(t)}</>, cam: mv({pos: [0.9, 1.55, 2.75], look: [0.35, 1.58, 1.3], fov: 42}, lt, {arrive: 0.06, push: 0.09}), bg: CELL_BG};
  },
  guard: (t, lt, C) => {
    // two metres: the guard right in front of the cell, back to it; the fogger on the floor by his foot. His phone buzzes; he answers.
    const m = man(C, t, {face: 'angry', look: [G.x, 1.6, G.z]}); const g = guard(C, t);
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{g.node}{mosquito(t)}</>, cam: mv({pos: [0.2, 1.5, 6.3], look: [0.78, 1.32, 2.4], fov: 54}, lt, {arrive: 0.04, push: 0.06}), bg: CELL_BG};
  },
  retract: (t, lt, C) => {
    // from the left: he lowers the phone and waves "no, no"; in front, the guard takes his phone off his ear and looks at it
    const m = man(C, t, {face: 'closed', look: [G.x, 1.6, G.z]}); const g = guard(C, t, 'open');
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{g.node}{mosquito(t)}</>, cam: mv({pos: [-0.6, 1.5, 6.5], look: [0.67, 1.4, 2.7], fov: 46}, lt, {arrive: 0.05, push: 0.07}), bg: CELL_BG};
  },
  callkin: (t, lt, C) => {
    // close on the mosquito as it flies up to the window and out between the window bars
    const m = man(C, t, {face: 'open', look: mqAt(t).p}); const q = mqAt(t).p;
    return {node: <>{block(t, {only: [24]})}{m.node}{mosquito(t, 2.4)}</>, cam: mv({pos: [q[0] - 0.15 + 0.1 * lt, q[1] - 0.12, q[2] + 0.5], look: add(q, [0, 0.05, -0.2]), fov: 46}, lt, {arrive: 0.06, push: 0.1, roll: 3}), bg: CELL_BG};
  },
  swarm: (t, lt, C) => {
    // inside, from the far corner: a black cloud pours in through the window and down onto him
    const cam: V3 = [-0.3, 1.3, 3.4]; const m = man(C, t, {face: 'wide', look: WINDOW});
    return {node: <>{block(t, {only: [24]})}{m.node}{swarm(t, 900, cam)}</>, cam: mv({pos: cam, look: [0.4, 1.7, -0.5], fov: 56}, lt, {arrive: 0.04, push: 0.05, roll0: -3}), bg: CELL_BG};
  },
  cloud: (t, lt, C) => {
    // from the corridor: he disappears in the cloud and sags
    const m = man(C, t, {face: 'closed'});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{swarm(t)}</>, cam: mv({pos: [0.6, 1.45, 3.4], look: [0.35, 1.3, 1.2], fov: 46}, lt, {arrive: 0.05, push: 0.08}), bg: CELL_BG};
  },
  flat: (t, lt, C) => {
    // inside 24 by the right wall, looking along x: in profile he goes as thin as a sheet of paper
    const cam: V3 = [1.38, 1.3, 0.9]; const m = man(C, t, {face: 'half'});
    return {node: <>{block(t, {only: [24]})}{m.node}{swarm(t, 300, cam)}</>, cam: mv({pos: cam, look: [0.35, 1.15, 1.4], fov: 62}, lt, {arrive: 0.05, push: 0.07}), bg: CELL_BG};
  },
  slide: (t, lt, C) => {
    // nearly frontal: he turns sideways and is a thin edge between two bars; then he slides forward into the gap
    const m = man(C, t, {face: 'angry'});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{swarm(t)}</>, cam: mv({pos: [0.85, 1.35, 3.7], look: [0.35, 1.15, 1.3], fov: 46}, lt, {arrive: 0.05, push: 0.08}), bg: CELL_BG};
  },
  half: (t, lt, C) => {
    // from the corridor at his front: his right half out in the corridor, his left half still behind the bars — stuck
    const cam: V3 = [2.4, 1.5, 1.78]; const m = man(C, t, {face: 'open', look: cam});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{swarm(t, 900, cam)}</>, cam: mv({pos: cam, look: [0.35, 1.15, 1.55], fov: 48}, lt, {arrive: 0.05, push: 0.08, shake: near(t, [ev('stuck')], 0.1) ? 0.01 : 0}), bg: CELL_BG};
  },
  itch: (t, lt, C) => {
    // MCU, the outside half: he scratches like mad, the swarm back on him
    const cam: V3 = [1.9, 1.45, 1.85]; const m = man(C, t, {face: 'angry', look: cam});
    return {node: <>{block(t, {only: [24]})}{m.node}{swarm(t, 900, cam)}</>, cam: mv({pos: cam, look: [0.38, 1.25, 1.6], fov: 46}, lt, {arrive: 0.05, push: 0.1}), bg: CELL_BG};
  },
  scratch: (t, lt, C) => {
    // high angle: flat, half out, scratching, in a cloud (no caption)
    const m = man(C, t, {face: 'angry'});
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{swarm(t)}</>, cam: mv({pos: [1.4, 3.0, 3.1], look: [0.35, 1.0, 1.5], fov: 50}, lt, {arrive: 0.04, push: 0.08, roll: 3}), bg: CELL_BG};
  },
  charge2: (t, lt, C) => {
    // low, wide: he points at the cloud and shouts; plate, then "× ล้านกระทง" under it
    const z = sm((t - ev('plate2') + 0.05) / 0.17) + sm((t - ev('plate3') + 0.05) / 0.17);
    const m = man(C, t, {face: 'shout', look: [0.8, 1.9, 2.0], point: [0.5, 1.75, 1.95]});
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{swarm(t)}</>, cam: mv({pos: [1.7, 0.75, 3.7], look: [0.35, 1.45, 1.5], fov: 60 - 6 * z}, lt, {arrive: 0.07, push: 0.04, roll: -3, shake: near(t, [ev('plate2'), ev('plate3')], 0.1) ? 0.012 : 0}), bg: CELL_BG};
  },
  phone2: (t, lt, C) => {
    // from the left: phone on his right ear, half out of the bars; in front, the guard's phone rings and he answers
    const m = man(C, t, {face: 'angry', look: [G.x, 1.6, G.z]}); const g = guard(C, t);
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{g.node}{swarm(t)}</>, cam: mv({pos: [-0.6, 1.5, 6.5], look: [0.67, 1.4, 2.7], fov: 46}, lt, {arrive: 0.04, push: 0.08}), bg: CELL_BG};
  },
  firm: (t, lt, C) => {
    // CU: phone to his ear, he does not take it back
    const cam: V3 = [1.15, 1.62, 2.3]; const m = man(C, t, {face: 'angry', look: [G.x, 1.6, G.z]});
    return {node: <>{block(t, {only: [24]})}{m.node}{swarm(t, 900, cam)}</>, cam: mv({pos: cam, look: [0.38, 1.6, 1.55], fov: 38}, lt, {arrive: 0.05, push: 0.1}), bg: CELL_BG};
  },
  mask: (t, lt, C) => {
    // the guard turns round to the cell for the first time and his gas mask comes down
    const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [24, 19]})}{g.node}</>, cam: mv({pos: [1.25, 1.65, 1.95], look: [1.05, 1.62, 3.2], fov: 40}, lt, {arrive: 0.05, push: 0.1}), bg: CELL_BG};
  },
  fogger: (t, lt, C) => {
    // from the side: masked guard, fogger at the hip, a white jet roaring out at cell 24
    const cam: V3 = [-0.7, 1.3, 2.45]; const m = man(C, t, {face: 'wide', look: [G.x, 1.4, G.z]}); const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{g.node}{swarm(t, 900, cam)}{fog(t, g, cam)}</>, fog: sceneFog(t), cam: mv({pos: cam, look: [0.85, 1.15, 2.9], fov: 52}, lt, {arrive: 0.05, push: 0.08, shake: 0.004}), bg: CELL_BG} as ShotOut;
  },
  fogall: (t, lt, C) => {
    // the institution, frontal and symmetric: cell 24 in the middle, 18 and 19 either side, fog rolling over the whole block
    const cam: V3 = [0.35, 2.7, 7.4]; const m = man(C, t, {face: 'wide'}); const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [18, 24, 19]})}{m.node}{g.node}{swarm(t)}{fog(t, g, cam)}</>, fog: sceneFog(t), cam: mv({pos: cam, look: [0.35, 1.2, 1.0], fov: 62}, lt, {arrive: 0.04, push: 0.05}), bg: CELL_BG} as ShotOut;
  },
  flee: (t, lt, C) => {
    // the cloud lifts off him — red now, every one full — and streams away to the window
    const cam: V3 = [1.45, 1.45, 2.9]; const m = man(C, t, {face: 'closed'}); const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [24]})}{m.node}{swarm(t, 900, cam)}{fog(t, g, cam, false, false)}</>, cam: mv({pos: cam, look: [0.45, 1.6, 0.4], fov: 56}, lt, {arrive: 0.05, push: 0.06}), bg: CELL_BG};
  },
  window: (t, lt, C) => {
    // inside, up at the window: a red river of mosquitoes pouring out between its bars — his blood, leaving
    const cam: V3 = [0.15, 1.2, 0.5];
    return {node: <>{block(t, {only: [24]})}{swarm(t, 900, cam)}</>, cam: mv({pos: cam, look: [0.6, 2.2, -1.45], fov: 50}, lt, {arrive: 0.04, push: 0.1}), bg: CELL_BG};
  },
  catch: (t, lt, C) => {
    // in the fog the masked guard snaps his fingers shut in the air — one stayed behind
    const cam: V3 = [0.15, 1.6, 1.9]; const m = man(C, t, {face: 'half'}); const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{g.node}{caught(t)}</>, fog: sceneFog(t), cam: mv({pos: cam, look: [1.1, 1.5, 2.9], fov: 46}, lt, {arrive: 0.05, push: 0.08}), bg: CELL_BG} as ShotOut;
  },
  cuffs: (t, lt, C) => {
    // ECU: held up in his fingers, a mosquito in a tiny pair of handcuffs. Click.
    const g = guard(C, t, 'angry'); const p = mqHeld(t);
    return {node: <>{block(t, {only: [24, 19]})}{g.node}{caught(t)}</>, cam: mv({pos: [p[0] - 0.13, p[1] + 0.04, p[2] - 0.2], look: p, fov: 34}, lt, {arrive: 0.04, push: 0.1, shake: near(t, [ev('cuff')], 0.08) ? 0.004 : 0}), bg: CELL_BG};
  },
  halfout: (t, lt, C) => {
    // the fog clears: him flat and stuck, half out; the guard has stepped aside; the caught one in a jar marked "ห้อง 25" on the floor.
    // On `stare` the fan stops and points at 24, the fridge door creaks open, the Earth stops turning — everyone stares
    const cam: V3 = [3.2, 1.65, 1.9]; const m = man(C, t, {face: 'half'}); const g = guard(C, t, 'half', G2);
    return {node: <>{block(t)}{m.node}{g.node}{fog(t, g, cam, true, false)}{jar25(t)}</>, fog: sceneFog(t), cam: mv({pos: cam, look: [0.35, 1.2, 1.6], fov: 52}, lt, {arrive: 0.04, push: 0.06}), bg: CELL_BG} as ShotOut;
  },
  night: (t, lt, C) => {
    // the same frame at night: the block is blue and empty, only him in the bars, half out
    const m = man(C, t, {face: 'half'});
    return {node: <>{block(t)}{m.node}{jar25(t)}<pointLight position={[1.4, 2.2, 2.2]} color="#8FA6E0" intensity={1.6} distance={4} decay={1.4} /></>,
      cam: mv({pos: [3.2, 1.65, 1.9], look: [0.35, 1.2, 1.6], fov: 52}, lt, {arrive: 0, push: 0.05}), bg: NIGHT_BG};
  },
  bubbles: (t, lt, C) => {
    // dark corridor, at his front: soap bubbles drift in out of the dark towards the hand that hangs outside
    const m = man(C, t, {face: 'open', look: [1.6, 1.3, 2.6]}); const k = sm((t - ev('bubbles')) / 0.8);
    return {node: <>{block(t, {only: [24, 19]})}{m.node}<pointLight position={[1.1, 1.9, 2.4]} color="#8FA6E0" intensity={1.4} distance={3.5} decay={1.4} />
      <Bubbles center={lerp3([1.6, 0.5, 2.9], [0.75, 0.5, 2.0], k)} size={[0.9, 1.1, 0.8]} t={t} n={18} r={0.04} k={k} rise={0.3} /></>,
      cam: mv({pos: [2.2 - 0.15 * lt, 1.3, 1.95], look: [0.55, 1.05, 1.7], fov: 50}, lt, {arrive: 0.06, push: 0.14, roll: -3}), bg: NIGHT_BG};
  },
  grab: (t, lt, C) => {
    // close, his face and his outside hand in one frame: foam wraps round the hand and holds; his eyes go wide. Then black.
    const m = man(C, t, {face: t > ev('touch') ? 'wide' : 'open', look: add(outHand.R, [0.3, -0.1, 0.2])}); const h = outHand.R; const k = sm((t - ev('touch')) / 0.5);
    return {node: <>{block(t, {only: [24]})}{m.node}<pointLight position={[1.1, 1.7, 2.3]} color="#8FA6E0" intensity={1.4} distance={3} decay={1.4} />
      <FoamRing center={add(h, [0, -0.04, 0])} r={0.065} k={k} n={26} t={t} size={0.032} />
      <Bubbles center={add(h, [0.25, -0.2, 0.15])} size={[0.5, 0.6, 0.4]} t={t} n={8} r={0.03} k={1} rise={0.1} seed={2} /></>,
      cam: mv({pos: [1.55, 1.3, 1.92], look: [0.4, 1.2, 1.62], fov: 50}, lt, {arrive: 0.04, push: 0.09, shake: near(t, [ev('grip')], 0.1) ? 0.006 : 0}), bg: NIGHT_BG};
  },
};
void [cl, Durian, sh];
