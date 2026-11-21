import React from 'react';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {CellPlate} from '../AbsurdEp2/props';
import {Stars} from '../AbsurdEp4/props';
import {PoliceCar} from '../AbsurdEp7/props';
import {Village} from '../AbsurdEp8/village';
import {Phone} from '../AbsurdEp16/props';
import {Marker} from '../AbsurdEp17/props';
import {WasherCuff} from '../AbsurdEp28/props';
import {ps, body, bw, hideProps, P, CamRig, mv, near, sm, V3, Cast, ShotOut, DAY, SKY, CELL_BG, hand, hw} from '../lifekit/stage';
import {VillageLife} from '../lifekit/presets';
import {Vending, VM, Can, Coin, shakeAt} from './props';

export {CamRig};
/** EP29 คดีตู้กดน้ำ. The drinks machine on the village sidewalk eats his coin: embezzlement. Two officers interrogate it by shaking it; it drops
 *  one can; the sergeant (offA, the mustache) drinks it on the spot: bribery. The machine gets the giant ring, the sergeant gets the other end of
 *  its chain on his wrist, and they share cell 27. The machine only ever eats coins and drops a can when shaken.
 *
 *  LAYOUT (metres; yaw 0 faces +z; root +x is the character's LEFT)
 *  street  EP8 village; sidewalk z −4.05 … −5.15 at y 0.12. The machine VMP (2.6, 0.12, −5.05), front (+z) to the road, fence of lot 3 behind.
 *          He stands at MAN (3.15, −4.35) yaw −1.6 (facing −x, his left hand = +z = the camera side); from `cops` on he has stepped back to MAN2.
 *          The sergeant offA stands left of it at SG (1.75, −4.4) facing +x; offB right of it at OB (3.45, −4.45) facing −x. The patrol car parks on the road at (0.2, 0, −2.0).
 *          Cameras stand on the road side, left of the man (x ≤ 2.9), so his face and the sergeant's are three-quarter to the lens.
 *  cell    EP1 Cell, plate "ห้อง 27" (first free after 26): the machine at (0.35, 0, −0.55), the sergeant standing at (−0.4, −0.15) chained to it.
 *
 *  TRAPS OF THIS EPISODE
 *  1. "หนึ่งกระป๋อง" must count: one red can in the empty tray, an evidence marker "1" beside it.
 *  2. The sergeant must read as the one who drinks: the can is in his hand from `take` to the end, at his mouth in `drink` / `bribe`.
 *  3. The giant ring must clear the machine's half diagonal (0.6): r 0.66; its chain ends on the sergeant's wrist from `cuffd` on (also in the cell).
 *  4. People on the sidewalk stand at y 0.12, the car on the road at 0.
 *  5. Lamp posts every 16 m from x0+6 and VillageLife trees at z ±3.65 (x 9 on −z): the machine at x 2.6 keeps clear of both. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
void sh;

const X0 = -34, X1 = 34, SW = 0.12;
const VMP: V3 = [2.6, SW, -5.05], SLOT: V3 = add(VMP, [VM.slot[0], VM.slot[1] - 0.12, VM.d / 2 + 0.02]), TRAY: V3 = add(VMP, [VM.tray[0], VM.tray[1], VM.d / 2]);
const MAN = {x: 3.15, z: -4.35, yaw: -1.6}, MAN2 = {x: 4.15, z: -3.85, yaw: -2.0}, SG = {x: 1.75, z: -4.4, yaw: Math.PI / 2}, OB = {x: 3.45, z: -4.45, yaw: -Math.PI / 2};
const CAR: V3 = [0.2, 0, -2.0];
const RING_R = 0.66, RING_Y = 0.6;
const rockAt = (t: number) => shakeAt(t, ev('shake') - 0.05, ev('drop') - 0.05);
const machine = (t: number, at: V3 = VMP, yaw = 0) => <Vending position={at} yaw={yaw} t={t} rz={rockAt(t)} coin={cl((t - ev('eat') + 0.25) / 0.25)} flap={t > ev('drop') && t < ev('grab') - 0.05 ? 1 : 0} lit={t > ev('eat') ? '10' : '--'} />;
const street = (t: number) => <><Village x0={X0} x1={X1} clear={[3, 5]} /><VillageLife t={t} x0={X0} x1={X1} traffic={false} dog={false} />{DAY([2.6, 0, -4.5])}{machine(t)}
  {t > ev('cops') - 0.6 && <PoliceCar t={t} position={add(CAR, [Math.max(0, ev('cops') - t) * 14, 0, 0])} yaw={Math.PI} seed={2} />}</>;

// ---- people
type GO = {clip?: string; face?: string; look?: V3; y?: number; rx?: number};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {})}), t, o.y ?? SW, o.rx ?? 0);
  return {I, w}; };
const MOUTH: V3 = [0, 6.5, 15];
const man = (C: Cast, t: number, o: GO & {L?: V3; ls?: string; R?: V3; rs?: string} = {}) => { const a = t < ev('cops') - 0.3 ? MAN : MAN2;
  const m = guy(C, 'nai', a.x, a.z, a.yaw, t, {look: add(VMP, [0, 1.2, 0]), ...o}); if (o.L) hand(m.I, 'L', o.L, o.ls ?? 'open'); if (o.R) hand(m.I, 'R', o.R, o.rs ?? 'open'); m.w.updateMatrixWorld(true); return m; };
/** the two officers walk in from the car at `cops`, then stand at their marks */
const walkIn = (t: number, to: {x: number; z: number}, k0 = 0): [number, number] => { const k = sm((t - ev('cops') - k0) / 0.7); return [CAR[0] + 1.2 + (to.x - CAR[0] - 1.2) * k, -2.6 + (to.z + 2.6) * k]; };
/** where the sergeant's hands go: on the machine while shaking, the can from `grab`, the can at his mouth from `drink` */
const sergeant = (C: Cast, t: number, o: {face?: string; cuffed?: boolean} = {}) => { const [x, z] = walkIn(t, SG); const turn = sm((t - ev('grab') - 0.15) / 0.4); const yaw = SG.yaw + (0.75 - SG.yaw) * turn;   // he turns to the road with the can
  const g = guy(C, 'offA', x, z, yaw, t, {face: o.face ?? (t > ev('plate2') ? 'wide' : 'angry'), look: t > ev('grab') + 0.3 ? [2.7, 1.65, -2.9] : t > ev('grab') - 0.3 ? TRAY : add(VMP, [0, 1.1, 0]), y: z < -4.05 ? SW : 0});
  const r = rockAt(t); const side: V3 = add(VMP, [-VM.w / 2 - 0.02, 1.15 - r * 0.6, 0.15]);
  let can: V3 | null = null; const mouth = hw(g.I, MOUTH);
  if (t > ev('shake') - 0.2 && t < ev('drop') + 0.1) { hand(g.I, 'R', side, 'fist'); hand(g.I, 'L', add(side, [0, -0.25, 0.1]), 'fist'); }
  else if (t > ev('grab') - 0.35) { const up = sm((t - ev('grab')) / 0.4), dr = sm((t - ev('drink') + 0.2) / 0.3), off = sm((t - ev('drink') - 1.3) / 0.4);
    const hold: V3 = [x + 0.25, 1.08, z + 0.35], low: V3 = add(TRAY, [-0.05, 0.08, 0.06]);
    can = t < ev('grab') ? low : lerp3(lerp3(low, hold, up), add(mouth, [0.02, -0.03, 0.08]), dr * (1 - off));
    hand(g.I, 'L', add(can, [0, -0.02, 0.0]), 'cup'); g.w.updateMatrixWorld(true); if (t > ev('grab') - 0.05) can = add(bw(g.I, 'Bip01_L_Hand'), [0, 0.02, 0.02]); }
  if (o.cuffed) hand(g.I, 'R', [x + 0.2, 0.95 + SW, z + 0.3], 'fist');
  g.w.updateMatrixWorld(true);
  const tip = can ? sm((t - ev('drink') + 0.1) / 0.3) * (1 - sm((t - ev('drink') - 1.3) / 0.4)) : 0;
  return {...g, wrist: bw(g.I, 'Bip01_R_Hand'), node: <><P o={g.w} />{can && <Can position={can} rotation={[0, 0, 1.4 * tip]} />}</>}; };
/** offB: shakes the other side, then carries the giant ring (cuffm) and the wrist cuff (cuffd) */
const ringAt = (t: number): V3 => { const u = sm((t - ev('cuffm') + 0.9) / 0.5), d = cl((t - ev('cuffm') + 0.2) / 0.2); return [VMP[0] + 0.5 * (1 - u), (1.0 + 1.2 * u) * (1 - d * d) + (VMP[1] + RING_Y) * d * d, VMP[2] + 0.45 * (1 - u)]; };
const partner = (C: Cast, t: number) => { const [x, z] = walkIn(t, OB, 0.15); const g = guy(C, 'offB', x, z, OB.yaw, t, {face: 'angry', look: add(VMP, [0, 1.1, 0]), y: z < -4.05 ? SW : 0});
  const r = rockAt(t); const side: V3 = add(VMP, [VM.w / 2 + 0.02, 1.15 + r * 0.6, 0.15]);
  if (t > ev('shake') - 0.2 && t < ev('drop') + 0.1) { hand(g.I, 'L', side, 'fist'); hand(g.I, 'R', add(side, [0, -0.25, 0.1]), 'fist'); }
  else if (t > ev('cuffm') - 1.0 && t < ev('cuffm') + 0.05) { const rc = ringAt(t); hand(g.I, 'L', add(rc, [RING_R * 0.85, 0.02, 0.25]), 'fist'); hand(g.I, 'R', add(rc, [RING_R * 0.6, 0.02, 0.45]), 'fist'); }
  g.w.updateMatrixWorld(true); return {...g, node: <P o={g.w} />}; };
/** the giant ring (from cuffm) and its chain: held by offB, then on the sergeant's wrist (cuffd) */
const ring = (t: number, wrist: V3, holder: V3) => { if (t < ev('cuffm') - 1.0) return null; const rc = ringAt(t); const locked = t > ev('cuffm');
  const b = t > ev('cuffd') ? wrist : t > ev('cuffd') - 0.4 ? lerp3(holder, wrist, sm((t - ev('cuffd') + 0.4) / 0.4)) : add(rc, [RING_R * 0.85, 0.02, 0.25]);
  return <><WasherCuff at={rc} r={RING_R} b={b} k={locked ? 1 : 0} sag={locked ? 0.3 : 0.05} />{near(t, [ev('cuffm'), ev('cuffd')], 0.35) && <Stars center={add(locked && t < ev('cuffd') ? add(VMP, [0, RING_Y + 0.3, 0.5]) : wrist, [0, 0.2, 0])} t={t * 3} r={0.18} size={0.05} />}</>; };
const scene = (C: Cast, t: number, o: {face?: string} = {}) => { const s = sergeant(C, t, {cuffed: t > ev('cuffd') - 0.4, face: o.face}); const b = partner(C, t);
  return {s, b, node: <>{street(t)}{t > ev('cops') - 0.3 && <>{s.node}{b.node}</>}{ring(t, s.wrist, bw(b.I, 'Bip01_L_Hand'))}</>}; };

// ---- the cell
const CVM: V3 = [0.35, 0, -0.55], SGC = {x: -0.42, z: -0.1, yaw: 0.35};
const cellBlock = (C: Cast, t: number) => { const g = guy(C, 'offA', SGC.x, SGC.z, SGC.yaw, t, {face: 'closed', look: [0.6, 1.3, 2], y: 0});
  hand(g.I, 'R', [SGC.x + 0.25, 0.95, SGC.z + 0.25], 'fist'); const can: V3 = [SGC.x - 0.22, 1.0, SGC.z + 0.25]; hand(g.I, 'L', add(can, [0, -0.02, 0]), 'cup'); g.w.updateMatrixWorld(true);
  return <><Cell t={t} days={0.2} marks={0} /><CellPlate text="ห้อง 27" position={[0, 2.12, 1.54]} w={0.64} /><Vending position={CVM} t={t} lit="10" />
    <WasherCuff at={add(CVM, [0, RING_Y, 0])} r={RING_R} b={bw(g.I, 'Bip01_R_Hand')} sag={0.25} /><P o={g.w} /><Can position={can} rotation={[0, 0, 0.3]} />
    <pointLight position={[0, 1.7, 1.0]} color="#DCE8F5" intensity={2.4} distance={4} decay={1.5} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.5]}><planeGeometry args={[14, 4]} /><meshLambertMaterial color="#8E918B" /></mesh>
    <mesh position={[0, 1.4, 5.4]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh></>; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: at the machine on the sidewalk, a coin between his fingers on its way to the slot
    const k = sm((t - 0.3) / (ev('eat') - 0.6)); const hd = lerp3([MAN.x - 0.05, 1.2, MAN.z + 0.35], add(SLOT, [0.04, -0.02, 0.06]), k);
    const m = man(C, t, {face: 'open', look: SLOT, L: hd, ls: 'cup'});
    return {node: <>{street(t)}<P o={m.w} /><Coin position={add(hd, [-0.02, 0.02, 0.01])} rotation={[0, 0, Math.PI / 2]} /></>, cam: mv({pos: [1.75, 1.6, -2.95], look: [2.9, 1.3, -4.6], fov: 50}, lt, {arrive: 0.06, push: 0.08}), bg: SKY};
  },
  eat: (t, lt, C) => {
    // ECU: the coin slides into the slot; the display reads 10 — and nothing else happens
    const m = man(C, t, {face: 'open', look: SLOT, L: add(SLOT, [0.05, -0.03, 0.07]), ls: 'cup'});
    return {node: <>{street(t)}<P o={m.w} /></>, cam: mv({pos: add(SLOT, [-0.2, 0.18, 0.62]), look: add(SLOT, [-0.03, 0.08, 0]), fov: 40}, lt, {arrive: 0.05, push: 0.22, roll0: -3}), bg: SKY};
  },
  empty: (t, lt, C) => {
    // low, the empty tray in the foreground; above it he jabs the button again and again
    const jab = Math.abs(Math.sin((t - ev('press')) * 9)) * 0.05; const m = man(C, t, {face: 'half', look: add(VMP, [0.33, 1.2, 0.4]), L: add(VMP, [0.33 + 0.04, 1.2, VM.d / 2 + 0.06 + jab]), ls: 'point'});
    return {node: <>{street(t)}<P o={m.w} /></>, cam: mv({pos: [2.35, 0.55, -3.6], look: [2.7, 0.8, -4.75], fov: 60}, lt, {arrive: 0.06, push: 0.16}), bg: SKY};
  },
  charge: (t, lt, C) => {
    // he points at the machine
    const k = sm((t - ev('point') + 0.15) / 0.25); const m = man(C, t, {face: 'shout', L: lerp3([MAN.x - 0.05, 1.2, MAN.z + 0.35], [MAN.x - 0.45, 1.35, MAN.z - 0.05], k), ls: 'point'});
    return {node: <>{street(t)}<P o={m.w} /></>, cam: mv({pos: [2.0, 0.95, -3.6], look: [2.85, 1.4, -4.6], fov: 54}, lt, {arrive: 0.07, push: 0.12}), bg: SKY};
  },
  accuse: (t, lt, C) => {
    // the accused, frontal: rows of cans behind glass, the display still reading 10. Snap zoom, the plate drops.
    const z = sm((t - ev('plate')) / 0.17); const m = man(C, t, {face: 'shout', L: [MAN.x - 0.45, 1.35, MAN.z - 0.05], ls: 'point'});
    return {node: <>{street(t)}<P o={m.w} /></>, cam: mv({pos: [2.55, 1.15, -2.9], look: [2.6, 1.1, -5.0], fov: 54 - 12 * z}, lt, {arrive: 0.06, push: 0.14, shake: near(t, [ev('plate')], 0.1) ? 0.01 : 0}), bg: SKY};
  },
  phone: (t, lt, C) => {
    // the call: phone up in front of his mouth on speaker
    const k = sm((t - ev('phoneUp')) / 0.25); const m = man(C, t, {face: 'shout', look: [1.8, 1.5, -3.2]}); const ph = lerp3([MAN.x + 0.1, 1.0, MAN.z + 0.3], hw(m.I, [9, 0, 19]), k);
    hand(m.I, 'L', add(ph, [0.02, -0.07, -0.03]), 'cup'); m.w.updateMatrixWorld(true);
    return {node: <>{street(t)}<P o={m.w} /><Phone position={ph} rotation={[-0.35, -1.0, 0.1 * k]} /></>, cam: mv({pos: [2.3, 1.65, -3.5], look: [3.1, 1.52, -4.35], fov: 46}, lt, {arrive: 0.07, push: 0.1}), bg: SKY};
  },
  cops: (t, lt, C) => {
    // from across the road: the patrol car pulls up, two officers march to either side of the machine
    const m = man(C, t, {face: 'open'}); const s = scene(C, t);
    return {node: <>{s.node}<P o={m.w} /></>, cam: mv({pos: [3.3, 1.75, -1.0], look: [2.6, 1.05, -4.8], fov: 56}, lt, {arrive: 0.06, push: 0.08}), bg: SKY};
  },
  shake: (t, lt, C) => {
    // the interrogation: both of them rock it side to side
    const m = man(C, t, {face: 'wide'}); const s = scene(C, t);
    return {node: <>{s.node}<P o={m.w} /></>, cam: mv({pos: [2.6, 1.5, -1.85], look: [2.6, 1.15, -4.85], fov: 62}, lt, {arrive: 0.05, push: 0.08, shake: 0.012}), bg: SKY};
  },
  drop: (t, lt, C) => {
    // ECU on the tray: clunk — a can
    const s = scene(C, t);
    return {node: s.node, cam: mv({pos: add(TRAY, [0.15, 0.22, 0.55]), look: add(TRAY, [0, -0.02, 0]), fov: 40}, lt, {arrive: 0.08, push: 0.26, roll0: 3, shake: near(t, [ev('drop')], 0.12) ? 0.012 : 0}), bg: SKY};
  },
  one: (t, lt, C) => {
    // from above: one red can in the tray, an evidence marker "1" set down beside it
    const s = scene(C, t); const k = sm((t - ev('one') + 0.1) / 0.2);
    return {node: <>{s.node}<Marker position={add(TRAY, [0.42, -VM.tray[1], 0.22])} n={1} k={k} a={0.95} /></>, cam: mv({pos: add(TRAY, [0.16, 0.48, 0.45]), look: add(TRAY, [0.12, -0.08, 0.08]), fov: 46}, lt, {arrive: 0.04, push: 0.22, roll0: -4}), bg: SKY};
  },
  take: (t, lt, C) => {
    // the sergeant picks it up
    const m = man(C, t, {face: 'open', look: [SG.x, 1.3, SG.z]}); const s = scene(C, t);
    return {node: <>{s.node}<P o={m.w} /><Marker position={add(TRAY, [0.42, -VM.tray[1], 0.22])} n={1} a={0.95} /></>, cam: mv({pos: [2.95, 1.6, -2.95], look: [1.9, 1.3, -4.4], fov: 54}, lt, {arrive: 0.06, push: 0.08}), bg: SKY};
  },
  drink: (t, lt, C) => {
    // …and drinks it, right there
    const s = scene(C, t, {face: 'closed'});
    return {node: <>{s.node}<Marker position={add(TRAY, [0.42, -VM.tray[1], 0.22])} n={1} a={0.95} /></>, cam: mv({pos: [2.65, 1.8, -3.25], look: [1.8, 1.65, -4.4], fov: 44}, lt, {arrive: 0.06, push: 0.1}), bg: SKY};
  },
  charge2: (t, lt, C) => {
    // he points at the sergeant; the partner turns to look
    const k = sm((t - ev('point2') + 0.15) / 0.25); const m = man(C, t, {face: 'shout', look: [SG.x, 1.5, SG.z], L: lerp3([MAN2.x - 0.05, 1.2, MAN2.z + 0.3], [MAN2.x - 0.5, 1.4, MAN2.z - 0.05], k), ls: 'point'});
    const s = scene(C, t);
    return {node: <>{s.node}<P o={m.w} /></>, cam: mv({pos: [4.4, 1.7, -2.3], look: [2.15, 1.3, -4.4], fov: 56}, lt, {arrive: 0.06, push: 0.1}), bg: SKY};
  },
  bribe: (t, lt, C) => {
    // snap zoom on the sergeant, can at his lips. The plate drops.
    const z = sm((t - ev('plate2')) / 0.17); const s = scene(C, t, {face: 'wide'});
    return {node: s.node, cam: mv({pos: [2.7, 1.75, -3.1], look: [1.8, 1.62, -4.4], fov: 48 - 12 * z}, lt, {arrive: 0.05, push: 0.05, shake: near(t, [ev('plate2')], 0.1) ? 0.01 : 0}), bg: SKY};
  },
  cuffm: (t, lt, C) => {
    // the partner lifts the giant ring over the whole machine and drops it round it
    const m = man(C, t, {face: 'open'}); const s = scene(C, t);
    return {node: <>{s.node}<P o={m.w} /></>, cam: mv({pos: [3.55, 1.75, -2.85], look: [2.55, 1.1, -4.95], fov: 54}, lt, {arrive: 0.06, push: 0.08, shake: near(t, [ev('cuffm')], 0.12) ? 0.018 : 0}), bg: SKY};
  },
  ring: (t, lt, C) => {
    // ECU: locked round the base of the machine, the chain running off towards the sergeant
    const s = scene(C, t);
    return {node: s.node, cam: mv({pos: [3.2, 0.85, -3.85], look: [2.45, 0.7, -4.75], fov: 46}, lt, {arrive: 0.05, push: 0.1}), bg: SKY};
  },
  cuffd: (t, lt, C) => {
    // and the other end of the chain snaps onto the sergeant's wrist
    const s = scene(C, t, {face: 'wide'});
    return {node: s.node, cam: mv({pos: [2.3, 1.3, -3.3], look: [1.95, 1.0, -4.3], fov: 48}, lt, {arrive: 0.06, push: 0.08, shake: near(t, [ev('cuffd')], 0.12) ? 0.016 : 0}), bg: SKY};
  },
  sergeant: (t, lt, C) => {
    // MCU: the sergeant, chained to the machine, the empty can still in his other hand
    const s = scene(C, t, {face: 'closed'});
    return {node: s.node, cam: mv({pos: [2.75, 1.7, -3.05], look: [1.8, 1.5, -4.4], fov: 48}, lt, {arrive: 0.06, push: 0.1}), bg: SKY};
  },
  cell: (t, lt, C) => ({node: cellBlock(C, t), cam: mv({pos: [0.15, 1.45, 4.3], look: [-0.05, 1.15, 0.0], fov: 50}, lt, {arrive: 0.08, push: 0.08, roll0: -2}), bg: CELL_BG}),
  together: (t, lt, C) => ({node: cellBlock(C, t), cam: mv({pos: [0.25, 1.45, 2.7], look: [-0.05, 1.2, -0.3], fov: 48}, lt, {arrive: 0.06, push: 0.1}), bg: CELL_BG}),
  last: (t, lt, C) => ({node: cellBlock(C, t), cam: mv({pos: [-0.05, 1.5, 2.1], look: [-0.15, 1.35, -0.2], fov: 44}, lt, {arrive: 0, push: 0.14}), bg: CELL_BG}),
};
