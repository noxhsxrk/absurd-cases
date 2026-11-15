import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot, fingers, ik} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl, pop} from './data';
import {Court, Cell, Interro, TABLE_TOP} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {Stars} from '../AbsurdEp4/props';
import {Tray} from '../AbsurdEp5/props';
import {Puffs, PoliceCar, makeSoot} from '../AbsurdEp7/props';
import {Village} from '../AbsurdEp8/village';
import {Glow} from '../AbsurdEp8/props';
import {Phone} from '../AbsurdEp16/props';
import {ps, body, bw, hideProps, prop, P, CamRig, mv, strike, near, sm, loc, V3, Cast, ShotOut, Bg} from '../lifekit/stage';
import {VillageLife, CourtLife} from '../lifekit/presets';
import {FoodCart} from '../lifekit/props';
import {Fire, SomTam, chiliPose, Table, Stool, Fork, TABLE_H, FireTruck, nozzle, Jet, Splash, Drips, HotCuffs, Puddle, Marker, BurnFolder, Icebox, ICEBOX, doorEdge, Tongs17} from './props';

export {CamRig};
/** EP17 คดีไฟในปาก. He orders som tam with one chili; the first bite sets his mouth on fire (arson). Ten fire trucks cannot put it out, so the
 *  police pull the fire out with tongs and cuff it; three pairs of cuffs melt. It burns its own case file in the interrogation room and is
 *  locked in a fridge. The chili — on the plate in every shot at the stall — is never even questioned.
 *  The fire only does what fire does (burns, melts, is not put out by water); all the escalation is the people's. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const SKY: Bg = {color: '#BFD6E4'}, CELL_BG: Bg = {color: '#2A2E33'};
const DAY = (at: V3 = [0, 0, 0]) => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} /><directionalLight position={[at[0] - 8, at[1] + 16, at[2] + 10]} target-position={at} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={70} shadow-bias={-0.0006} /></>;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const toward = (a: V3, b: V3, d: number): V3 => { const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize().multiplyScalar(d); return [a[0] + v.x, a[1] + v.y, a[2] + v.z]; };

// =====================================================================================================
// THE STALL (EP8 village, road along x, z −3…3): a som tam cart at the kerb on his side, a steel table, a red stool. He sits facing the road (+z).
// =====================================================================================================
const X0 = -40, X1 = 70, SX = 5;
const SEAT = {x: SX, z: -2.5}, TB: V3 = [SX, 0, -1.95], PL: V3 = [SX + 0.02, TABLE_H, -1.98], CART: V3 = [SX - 2.2, 0, -2.45];
const chiliW = (t: number, flood: number): V3 => add(PL, chiliPose(t, flood).p);
const floodAt = (t: number) => sm((t - ev('jets') - 0.15) / 0.9);
// ---- ten fire trucks, all driving −x (yaw π): three stop short of the stall in each lane's half, the rest have gone past it. One convoy, braking together.
const PARK: [number, number][] = [[-19, 0], [-12, 0], [-5, 0], [5, 0], [12, 0], [19, 0], [-15.5, 1], [-8.5, 1], [8.5, 1], [15.5, 1]];
const LANE = [-0.2, 1.9];
const RANK = PARK.map(([x], i) => PARK.filter(([y], j) => Math.sign(y) === Math.sign(x) && (Math.abs(y) < Math.abs(x) || (Math.abs(y) === Math.abs(x) && j < i))).length);   // 0…4 on each side, nearest first
const TP = () => ev('jets') - 0.3;                                                    // the moment they are all stopped
const roll = (t: number) => { const u = TP() - t; return u > 0 ? 9 * u * u : 0; };       // braking at 18 m/s²
const dive = (t: number) => { const u = TP() - t; return u > 0 ? -0.03 * cl(u * 4) : 0.025 * Math.exp(u * 7) * Math.sin(-u * 22); };
const truckAt = (i: number, t: number): V3 => [SX + PARK[i][0] + roll(t), 0, LANE[PARK[i][1]]];
const convoy = (t: number) => <>{PARK.map((_, i) => <FireTruck key={i} position={truckAt(i, t)} yaw={Math.PI} pitch={dive(t)} t={t} seed={i} />)}
  <PoliceCar t={t} position={[SX + 2.4 + roll(t), 0, 2.15]} yaw={Math.PI} seed={3} /></>;
const stall = (t: number) => { const flood = floodAt(t); const wet = t > ev('jets') + 0.2;
  return <><Village x0={X0} x1={X1} /><VillageLife t={t} x0={X0} x1={X1} traffic={false} dog={false} />{DAY([SX, 0, 0])}
    <FoodCart position={CART} yaw={0} t={t} /><Table position={TB} /><Stool position={[SEAT.x, 0, SEAT.z]} /><SomTam position={PL} t={t} flood={flood} />
    {wet && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SX, 0.006, -2.0]}><circleGeometry args={[1.7 * sm((t - ev('jets') - 0.2) / 0.6), 20]} /><meshStandardMaterial color="#26282C" roughness={0.12} metalness={0.2} transparent opacity={0.75} /></mesh>}
    {(t > ev('fire2') + 0.1 || (t > ev('fire') + 0.25 && t < sh('again').t0)) && <Fork a={[SX - 0.3, TABLE_H + 0.006, -1.92]} b={[SX - 0.27, TABLE_H + 0.006, -1.74]} />}
    {t >= sh('trucks').t0 && convoy(t)}</>; };

// ---- people
type GO = {clip?: string; face?: string; look?: V3; y?: number; rx?: number; sit?: boolean; soot?: boolean};
const soots = new WeakMap<any, THREE.Object3D>();
const headFr = (I: any): THREE.Object3D => { const hb = I.bones.Bip01_Head as THREE.Object3D; return hb.children.find((c: any) => c.isGroup && c.children.some((m: any) => m.geometry?.type === 'CylinderGeometry')) ?? hb; };
/** a point / a direction given in the head's own frame (cm; y up, z out of the face) → world */
const hw = (I: any, p: V3): V3 => { const fr = headFr(I); fr.updateWorldMatrix(true, false); const v = fr.localToWorld(new THREE.Vector3(...p)); return [v.x, v.y, v.z]; };
const hdir = (I: any, d: V3): V3 => { const fr = headFr(I); fr.updateWorldMatrix(true, false); const v = new THREE.Vector3(...d).transformDirection(fr.matrixWorld); return [v.x, v.y, v.z]; };
const MOUTH: V3 = [0, 6.5, 15], EAR_L: V3 = [12, 12, 2], EAR_R: V3 = [-12, 12, 2];
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? (o.sit ? 'sit_table_idle_neutral_01' : 'idle_neutral_01'), ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {}), ...(o.sit ? {poseId: 'sitIdle'} : {})}), t, o.y ?? 0, o.rx ?? 0);
  let so = soots.get(I); if (o.soot && !so) { so = makeSoot(); headFr(I).add(so); soots.set(I, so); } if (so) so.visible = !!o.soot;
  return {I, w}; };
const hand = (I: any, sd: 'L' | 'R', to: V3, shape = 'fist') => { fingers(I, sd, shape as any, 1); ik(I, sd, loc(I, to), new THREE.Vector3(sd === 'R' ? -1 : 1, -1, -0.3), 1); };   // root +x is the character's LEFT: the elbow goes out, down and a little back, never into the chest
/** the man on his stool. Hands default to the table top (his left is +x). Returns where his mouth is and which way it points. */
type Hands = {R?: V3 | null; L?: V3 | null; rs?: string; ls?: string};
const man = (C: Cast, t: number, o: GO & {hands?: (mouth: V3) => Hands} = {}) => {
  const m = guy(C, 'nai', SEAT.x, SEAT.z, 0, t, {sit: true, ...o});
  const h = o.hands ? o.hands(hw(m.I, MOUTH)) : {};
  if (h.R !== null) hand(m.I, 'R', h.R ?? [SX - 0.22, TABLE_H + 0.05, -2.2], h.rs ?? 'open');
  if (h.L !== null) hand(m.I, 'L', h.L ?? [SX + 0.22, TABLE_H + 0.05, -2.2], h.ls ?? 'open');
  m.w.updateMatrixWorld(true);
  return {...m, mouth: hw(m.I, MOUTH), out: hdir(m.I, [0, 0.32, 0.95])};
};
type Man = ReturnType<typeof man>;
/** the fire in his mouth: a jet up and out of it, a red glow on his face */
const mouthFire = (m: Man, t: number, k: number, size = 0.31) => k <= 0.01 ? null : <><Fire position={add(m.mouth, [0, -0.01, 0])} dir={m.out} t={t} size={size} k={k} />
  <Glow p={hw(m.I, [0, 14, 12])} c="#FF2A10" s={0.45} o={0.2 * Math.min(1, k)} /></>;
const steam = (m: Man, t: number, t0: number, life = 1.3) => t > t0 && t < t0 + life ? <>{[EAR_L, EAR_R].map((e, i) => <Puffs key={i} at={hw(m.I, e)} t={t} t0={t0} n={5} size={0.05} color="#F4F4F0" rise={0.4} spread={0.05} life={0.7} seed={i} />)}</> : null;
const drips = (m: Man, t: number) => t > ev('jetsOff') ? <Drips from={hw(m.I, [0, 4, 8])} floor={TABLE_H} t={t} t0={ev('jetsOff')} /> : null;
// ---- the fork: at rest (upright in his fist), in the pile, at his mouth
const REST_H: V3 = [SX - 0.2, TABLE_H + 0.13, -2.14], REST_T: V3 = [SX - 0.19, TABLE_H + 0.5, -2.05];
const DIG_H: V3 = [PL[0] - 0.1, TABLE_H + 0.22, PL[2] - 0.16], PILE: V3 = [PL[0] - 0.05, TABLE_H + 0.07, PL[2] - 0.03];
const atMouth = (mouth: V3): V3 => add(mouth, [-0.1, -0.09, 0.15]);
const fork = (m: Man, tip: V3, load = 0) => { const a = bw(m.I, 'Bip01_R_Hand'); return <Fork a={a} b={toward(a, tip, 0.2)} load={load} />; };
/** a forkful going from the pile to his mouth: k 0…1; returns hand + tip targets */
const lift = (mouth: V3, k: number): {R: V3; tip: V3} => { const up = Math.sin(k * Math.PI) * 0.06; const h0 = add(DIG_H, [0, 0.12, -0.04]); return {R: add(lerp3(h0, atMouth(mouth), k), [0, up, 0]), tip: lerp3(add(PILE, [0, 0.14, 0]), mouth, k)}; };

// ---- the officer with the tongs (he stands at the man's right, between the table and the cart; his right hand is the camera side)
const OF = {x: SX - 0.75, z: -2.2}, OF_YAW = Math.atan2(SEAT.x - (SX - 0.75), SEAT.z + 2.2 - 0.2), OF_HEAD: V3 = [OF.x, 1.55, OF.z], CHEST: V3 = [OF.x + 0.11, 1.38, OF.z + 0.17];   // CHEST = his right shoulder (the camera side)
/** OUTA = where he draws it out to (the gap between the two of them, seen from the tongs shot); OUTP = where he then holds it out over the road for the cuffs */
const OUTA: V3 = [SX - 0.28, 1.12, -1.85], OUTP: V3 = [SX - 0.5, 1.1, -1.45], TIP0: V3 = [SX - 0.36, 1.2, -1.8], TONG = 0.32;
/** where the tongs' tip is: waiting → into his mouth (grip) → out, with the fire */
const tipAt = (t: number, mouth: V3): V3 => { const g = ev('grip'), o = ev('out'); const inM = add(mouth, [0, 0.0, 0.02]);
  if (t < g + 0.1) return lerp3(TIP0, inM, sm((t - g + 0.4) / 0.32)); const k = cl((t - g - 0.1) / (o - g - 0.1)); return lerp3(inM, OUTA, 1 - Math.pow(1 - k, 3)); };
const cop = (C: Cast, t: number, tip: V3, o: GO & {left?: V3 | null} = {}) => { const a = guy(C, 'offA', OF.x, OF.z, OF_YAW, t, {face: 'angry', ...o});
  hand(a.I, 'R', toward(tip, CHEST, TONG), 'fist'); if (o.left) hand(a.I, 'L', o.left, 'fist'); a.w.updateMatrixWorld(true);
  return {...a, node: <><P o={a.w} /><Tongs17 a={bw(a.I, 'Bip01_R_Hand')} b={tip} open={t < ev('grip') - 0.45 ? 0.5 + 0.5 * Math.sin(t * 22) : t < ev('grip') ? 1 : 0} /></>}; };
const R4 = 0.096;                                                                        // ring radius of the size-4 cuffs
const CUFFP: V3 = [OUTP[0] - R4 * 1.45, OUTP[1] + 0.035, OUTP[2]];                          // one ring round the fire, the other on the officer's side
const PUD: V3[] = [[SX - 0.5, 0, -1.45], [SX - 0.5, 0, -1.05], [SX - 0.5, 0, -0.65]];
/** the stall scene from the tongs on: he is rid of it, the officer holds it up in the tongs */
const held = (C: Cast, t: number, o: {cuffs?: boolean} = {}) => { const m = man(C, t, {face: 'half', look: OF_HEAD}); const u = t - ev('cuff'); const hk = sm((t - ev('melt') + 0.35) / 0.35), mk = cl((t - ev('melt')) / (ev('melted') - ev('melt')));
  const cp = lerp3(add(CUFFP, [-0.4, 0.22, -0.2]), CUFFP, 1 - Math.pow(1 - cl((u + 0.3) / 0.3), 3)); const holding = o.cuffs && mk < 0.2;
  const a = cop(C, t, OUTP, {face: mk > 0.1 ? 'wide' : 'angry', look: OUTP, left: holding ? add(cp, [-0.16, 0.0, -0.03]) : null});
  return {m, node: <>{stall(t)}<P o={m.w} />{drips(m, t)}{a.node}<Fire position={add(OUTP, [0, -0.03, 0])} t={t} size={0.22} seed={2} />
    {o.cuffs && u > -0.3 && <HotCuffs position={cp} rotation={[Math.PI / 2, 0, 0]} size={4} heat={hk} melt={sm(mk)} t={t} />}
    {o.cuffs && near(t, [ev('cuff')], 0.3) && <Stars center={add(CUFFP, [0, 0.1, 0.1])} t={t * 3} r={0.2} size={0.07} />}
    <Puddle position={PUD[0]} k={sm((t - ev('melt') - 0.3) / 0.5)} hot={cl(1 - (t - ev('melted')) / 1.2)} seed={1} /></>}; };

// ---- interrogation (EP1 Interro: table at the origin, chairs at z ±0.85). The fire stands on an evidence tray; the officer sits opposite the camera.
const TRAY: V3 = [-0.05, TABLE_TOP, 0.12], FP: V3 = [0.25, TABLE_TOP + 0.005, -0.04], F_YAW = -0.1;
const room = (C: Cast, t: number, o: {soot?: boolean} = {}) => { const u = t - ev('slap'); const burn = cl((t - ev('ignite')) / (ev('ash') - ev('ignite'))); const burning = burn > 0 && burn < 1;
  const a = guy(C, 'offA', 0, -0.85, 0, t, {sit: true, clip: 'sit_table_idle_neutral_01', face: o.soot ? 'wide' : burn > 0.05 ? 'wide' : 'angry', look: o.soot ? [0.1, 1.2, 0.8] : burn > 0 ? FP : add(TRAY, [0, 0.2, 0]), soot: o.soot});
  const upH: V3 = [0.3, 1.32, -0.5], dn: V3 = add(FP, [0, 0.04, 0]), rest: V3 = [0.3, TABLE_TOP + 0.05, -0.36], back: V3 = [0.42, 1.2, -0.62];
  const lh = burn > 0.03 ? lerp3(rest, back, sm(burn / 0.15)) : u < 0 ? lerp3(upH, dn, cl((u + 0.1) / 0.1)) : lerp3(dn, rest, sm((u - 0.2) / 0.25));
  hand(a.I, 'L', lh, burn > 0.03 ? 'open' : u < 0.2 ? 'open' : 'fist'); hand(a.I, 'R', burn > 0.03 ? lerp3([-0.3, TABLE_TOP + 0.05, -0.38], [-0.42, 1.2, -0.62], sm(burn / 0.15)) : [-0.3, TABLE_TOP + 0.05, -0.38], 'open'); a.w.updateMatrixWorld(true);
  const fpos: V3 = u < 0 ? add(lh, [0, -0.045, 0.02]) : FP;
  return <><Interro t={t} swing={1} /><P o={a.w} /><Tray position={TRAY} /><mesh position={[0.25, TABLE_TOP + 0.002, -0.03]} receiveShadow><boxGeometry args={[0.6, 0.004, 0.6]} /><meshLambertMaterial color="#2C463F" /></mesh>   {/* a dark desk pad: the file and the flames read against it, not against the lamp-white steel */}<Fire position={add(TRAY, [0, 0.02, 0])} t={t} size={0.3} lean={0.55 * sm((t - ev('ignite') + 0.25) / 0.2) * (1 - sm((t - ev('ash')) / 0.3))} seed={1} />
    <BurnFolder position={fpos} yaw={F_YAW} burn={burn} t={t} />
    {burning && <Puffs at={add(FP, [0, 0.1, 0])} t={t} t0={ev('ignite')} n={6} size={0.07} color="#3A3734" rise={0.9} spread={0.12} life={0.9} />}</>; };

// ---- court / cell
const DOCK: V3 = [0.62, 1.5, -2.82];   // on the bench, at the judge's left hand
const courtRoom = (C: Cast, t: number) => { const I = C.judge; hideProps(I);
  const w = body(I, ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: add(DOCK, [0, 0.2, 0]), face: t > ev('gavel') - 0.35 && t < ev('gavel') + 0.5 ? 'shout' : 'angry'}), t, 1.25);
  prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]); const up = strike(t, ev('gavel'), 0.4);
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - up, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - up * 0.6, I.root); w.updateMatrixWorld(true);
  return <><Court t={t} /><P o={w} /><CourtLife t={t} C={C} look={DOCK} /><Tray position={DOCK} tag={false} /><Fire position={add(DOCK, [0, 0.02, 0])} t={t} size={0.36} seed={4} />
    <Drips from={hw(I, [0, 20, 10])} floor={2.3} t={t} t0={0} n={4} spread={0.1} /></>; };
const BOXP: V3 = [0.25, 0, -0.5], GUARD = {x: -0.85, z: 0.72};
const cellBlock = (C: Cast, t: number) => { const s = ev('shut'); const door = 1 - sm((t - s + 0.2) / 0.2); const after = Math.max(0, t - s); const glow = t < s ? 1 : Math.exp(-after * 2.2); const edge = doorEdge(BOXP, door);
  const g = guy(C, 'offB', GUARD.x, GUARD.z, Math.atan2(BOXP[0] - GUARD.x, BOXP[2] - GUARD.z), t, {face: 'angry', look: add(BOXP, [0, 1.0, 0])}); const push = cl((t - s + 0.32) / 0.2);
  hand(g.I, 'R', door > 0.45 ? add(edge, [-0.06, 0, 0.08]) : add(doorEdge(BOXP, 0.45), [0.1, 0, -0.05]), 'open'); g.w.updateMatrixWorld(true);
  return <><Cell t={t} days={0.45} marks={0} /><CellPlate text="ห้อง 23" position={[0, 2.12, 1.54]} w={0.64} /><P o={g.w} />
    <Icebox position={BOXP} door={door} glow={glow} frost={sm((after - 0.12) / 0.45)} />
    {t < s && <Fire position={[BOXP[0], ICEBOX.shelf + 0.012, BOXP[2] - 0.02]} t={t} size={0.34 - 0.06 * push} seed={5} light={1.6} />}
    {t > s && t < s + 0.9 && <Puffs at={[BOXP[0] + 0.3, 1.0, BOXP[2] + 0.42]} t={t} t0={s} n={6} size={0.07} color="#EEF8FF" rise={0.5} spread={0.25} life={0.8} />}
    <pointLight position={[0, 1.7, 1.0]} color="#DCE8F5" intensity={2.4} distance={4} decay={1.5} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.2]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8E918B" /></mesh>
    <mesh position={[0, 1.4, 5.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh></>; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: MCU at the stall, fork up, the plate in front of him — one chili on top
    const m = man(C, t, {face: 'open', look: add(PL, [0, 0.05, 0]), hands: () => ({R: REST_H, rs: 'fist'})});
    return {node: <>{stall(t)}<P o={m.w} />{fork(m, REST_T)}</>, cam: mv({pos: [SX + 0.32, 1.2, -0.95], look: [SX, 0.98, -2.35], fov: 46}, lt, {arrive: 0.06, push: 0.09}), bg: SKY};
  },
  plate: (t, lt, C) => {
    // straight down at the plate: his fork goes into the pile; a snap zoom on the one chili as it is named
    const d = sm((t - ev('dig') + 0.3) / 0.3), up = sm((t - ev('dig') - 0.15) / 0.3), z = sm((t - ev('chili')) / 0.13);
    const m = man(C, t, {face: 'open', look: PL, hands: () => ({R: add(lerp3(REST_H, DIG_H, d), [0, up * 0.12, -up * 0.04]), rs: 'fist'})});
    const ch = chiliW(t, 0);
    return {node: <>{stall(t)}<P o={m.w} />{fork(m, add(lerp3(REST_T, PILE, d), [0, up * 0.14, 0]), up)}</>,
      cam: mv({pos: [PL[0], TABLE_H + 1.12, PL[2] + 0.36], look: lerp3([PL[0], TABLE_H, PL[2] + 0.09], add(ch, [0, 0, 0.035]), z), fov: 40 - 17 * z}, lt, {arrive: 0, push: 0.05, shake: near(t, [ev('chili')], 0.1) ? 0.004 : 0}), bg: SKY};
  },
  bite: (t, lt, C) => {
    // MCU: the forkful goes in. He chews.
    const k = sm((t - ev('bite') + 0.4) / 0.4), back = sm((t - ev('bite') - 0.12) / 0.3); const eaten = t > ev('bite') + 0.04;
    let tip: V3 = PL; const m = man(C, t, {face: eaten ? 'half' : k > 0.5 ? 'talk' : 'open', hands: (mo) => { const f = lift(mo, k * (1 - back * 0.75)); tip = f.tip; return {R: f.R, rs: 'fist'}; }});
    return {node: <>{stall(t)}<P o={m.w} />{fork(m, tip, eaten ? 0 : 1)}</>, cam: mv({pos: [SX + 0.24, 1.17, -1.22], look: [SX, 1.08, -2.42], fov: 40}, lt, {arrive: 0.07, push: 0.1}), bg: SKY};
  },
  fire: (t, lt, C) => {
    // and it goes up: a jet of flame out of his mouth, steam from both ears, both hands in the air. Held through the silent beat.
    const u = t - ev('fire'); const on = u > 0;
    const m = man(C, t, {face: on ? 'wide' : 'half', hands: () => on ? {R: [SX - 0.36, 1.3 + Math.sin(t * 19) * 0.07, -2.22], L: [SX + 0.36, 1.3 + Math.cos(t * 19) * 0.07, -2.22]} : {R: REST_H, rs: 'fist'}});
    return {node: <>{stall(t)}<P o={m.w} />{!on && fork(m, REST_T)}{mouthFire(m, t, pop(u / 0.3) * (1 + 0.1 * Math.sin(t * 11)))}{steam(m, t, ev('fire') + 0.12)}</>,
      cam: mv({pos: [SX + 0.8, 1.24, -1.4], look: [SX - 0.02, 1.2, -2.22], fov: 42}, lt, {arrive: 0.06, push: 0.1, shake: near(t, [ev('fire')], 0.25) ? 0.02 : 0}), bg: SKY};
  },
  charge: (t, lt, C) => {
    // from the table top, the plate in the foreground: he points into his own burning mouth. Snap zoom, the plate drops.
    const z = sm((t - ev('zoom')) / 0.17);
    const m = man(C, t, {face: 'shout', hands: (mo) => ({R: add(mo, [-0.13, -0.05, 0.17]), rs: 'point'})});
    return {node: <>{stall(t)}<P o={m.w} />{mouthFire(m, t, 1 + 0.1 * Math.sin(t * 11))}</>,
      cam: mv({pos: [SX + 0.62, 0.92, -1.3], look: [SX + 0.04, 1.2, -2.42], fov: 60 - 12 * z}, lt, {arrive: 0.08, push: 0.05, shake: near(t, [ev('plate')], 0.1) ? 0.01 : 0}), bg: SKY};
  },
  phone: (t, lt, C) => {
    // the call: the phone comes up to his ear, the fire still going out of the other side of his face
    const k = sm((t - ev('phoneUp')) / 0.25); const m = man(C, t, {face: 'shout', hands: () => ({L: null})});
    const ph = lerp3([SX + 0.26, TABLE_H + 0.1, -2.16], add(hw(m.I, EAR_L), [0.03, -0.01, 0.01]), k); hand(m.I, 'L', add(ph, [0.03, -0.06, -0.02]), 'cup'); m.w.updateMatrixWorld(true);
    return {node: <>{stall(t)}<P o={m.w} /><Phone position={ph} rotation={[0, -Math.PI / 2, 0.18 * k]} />{mouthFire(m, t, 0.9 + 0.25 * Math.abs(Math.sin(t * 7)))}</>,
      cam: mv({pos: [SX + 0.66, 1.22, -1.42], look: [SX + 0.06, 1.18, -2.42], fov: 44 - 7 * sm((t - ev('phoneUp') - 0.45) / 0.17)}, lt, {arrive: 0.07, push: 0.08}), bg: SKY};
  },
  trucks: (t, lt, C) => {
    // down the village road: ten fire trucks in two lanes brake nose to tail in front of the lens; crane up over them on "สิบคัน"
    const k = sm((t - ev('ten') + 0.25) / 0.4); const m = man(C, t, {face: 'shout'});
    return {node: <>{stall(t)}<P o={m.w} />{mouthFire(m, t, 1)}</>,
      cam: mv({pos: [SX - 24.6, 1.0 + 5.2 * k, 0.9], look: [SX - 10 + 4 * k, 1.5 - 0.6 * k, 0.85], fov: 58}, lt, {arrive: 0, push: 0.01, shake: TP() - t > 0 ? 0.03 : near(t, [TP()], 0.2) ? 0.02 : 0}), bg: SKY};
  },
  hose: (t, lt, C) => {
    // from straight above (the road runs up the frame): ten jets from ten trucks, all into one small man at a table
    const j0 = ev('jets'), j1 = ev('jetsOff'); const water = t > j0 + 0.18;
    const m = man(C, t, {face: water ? 'closed' : 'shout', rx: water ? -0.14 : 0});
    return {node: <>{stall(t)}<P o={m.w} />{mouthFire(m, t, water ? 0.7 + 0.1 * Math.sin(t * 31) : 1)}
      {PARK.map((_, i) => <Jet key={i} a={nozzle(truckAt(i, t), Math.PI)} b={add(m.mouth, [(i % 2 ? 1 : -1) * 0.03, 0.02 * (i % 3), 0.05])} t={t} t0={j0 + i * 0.012} t1={j1 + i * 0.012} lift={0.4 + RANK[i] * 0.5} r={0.1} seed={i} />)}
      <Splash at={add(m.mouth, [0, 0, 0.08])} t={t} t0={j0 + 0.2} t1={j1 + 0.2} n={48} power={1.6} />{water && <Glow p={add(m.mouth, [0, 0.3, 0])} c="#F2FBFF" s={2.6 + Math.sin(t * 40) * 0.3} o={0.75} />}</>,
      cam: mv({pos: [SX, 13, -1.2], look: [SX, 0, -1.2], fov: 50}, lt, {arrive: 0.05, push: 0.06, roll0: 90, shake: water ? 0.05 : 0}), bg: SKY};
  },
  soaked: (t, lt, C) => {
    // the water stops. He is drenched — and it flares straight back up. A beat, no line.
    const fl = ev('flare'); const m = man(C, t, {face: 'shout'});
    return {node: <>{stall(t)}<P o={m.w} />{mouthFire(m, t, t < fl ? 0.55 + 0.08 * Math.sin(t * 31) : 1 + 0.7 * Math.exp(-(t - fl) * 5))}{drips(m, t)}
      <Splash at={add(m.mouth, [0, 0, 0.08])} t={t} t0={ev('jets') + 0.2} t1={ev('jetsOff') + 0.2} /></>,
      cam: mv({pos: [SX - 0.72, 1.26, -1.3], look: [SX + 0.02, 1.2, -2.24], fov: 42}, lt, {arrive: 0.07, push: 0.1, shake: near(t, [fl], 0.15) ? 0.015 : 0}), bg: SKY};
  },
  tongs: (t, lt, C) => {
    // the officer reaches into his mouth with the long tongs, grips the fire — and draws it out
    const m = man(C, t, {face: t < ev('grip') + 0.12 ? 'shout' : 'half', look: OF_HEAD}); const tip = tipAt(t, m.mouth); const inMouth = t < ev('grip') + 0.1;
    const a = cop(C, t, tip, {look: inMouth ? m.mouth : tip});
    return {node: <>{stall(t)}<P o={m.w} />{drips(m, t)}{a.node}
      {inMouth ? mouthFire(m, t, 1 + 0.1 * Math.sin(t * 11)) : <Fire position={add(tip, [0, -0.03, 0])} t={t} size={0.2} seed={2} />}
      {!inMouth && t < ev('grip') + 0.9 && <Puffs at={m.mouth} t={t} t0={ev('grip') + 0.1} n={4} size={0.035} color="#5A5A60" rise={0.3} spread={0.04} life={0.7} />}</>,
      cam: mv({pos: [SX - 0.1, 1.32, -0.25], look: [SX - 0.38, 1.2, -2.3], fov: 54}, lt, {arrive: 0.07, push: 0.08, roll0: 2}), bg: SKY};
  },
  cuff: (t, lt, C) => ({node: held(C, t, {cuffs: true}).node,
    // ECU: the cuffs come in from his other hand and snap shut round it
    cam: mv({pos: [SX - 1.15, 1.24, -0.72], look: [OUTP[0] - 0.06, OUTP[1] + 0.07, OUTP[2]], fov: 38}, lt, {arrive: 0.08, push: 0.12, shake: near(t, [ev('cuff')], 0.12) ? 0.012 : 0}), bg: SKY}),
  melt: (t, lt, C) => { const d = sm((t - ev('melt')) / 0.7);
    // …and go orange, sag, and run off it in drops
    return {node: held(C, t, {cuffs: true}).node, cam: mv({pos: [SX - 1.1, 1.14 - 0.1 * d, -0.8], look: [OUTP[0] - 0.05, OUTP[1] + 0.02 - 0.2 * d, OUTP[2]], fov: 42}, lt, {arrive: 0.06, push: 0.08, roll0: -3}), bg: SKY}; },
  three: (t, lt, C) => {
    // down at the road by the table: three silver puddles, three evidence markers. The second and third pair land already melted.
    const fall = (t0: number, i: number) => { const u = t - t0 + 0.24; if (u < 0 || u > 0.24) return null; return <HotCuffs key={i} position={[PUD[i][0], 1.3 - 0.5 * 9.8 * u * u * 4.6, PUD[i][2]]} rotation={[Math.PI / 2 + u * 5, 0, 0.3]} size={4} heat={1} melt={u / 0.24 * 0.7} t={t} />; };
    const T3 = [ev('melted'), ev('two'), ev('three')];
    return {node: <>{held(C, t).node}{fall(T3[1], 1)}{fall(T3[2], 2)}
      {[1, 2].map((i) => <Puddle key={i} position={PUD[i]} k={pop((t - T3[i]) / 0.2)} hot={cl(1 - (t - T3[i]) / 1.0)} seed={i + 1} />)}
      {[0, 1, 2].map((i) => <Marker key={i} position={[PUD[i][0] - 0.32, 0, PUD[i][2]]} n={i + 1} k={pop((t - (i ? T3[i] + 0.1 : sh('three').t0 + 0.04)) / 0.16)} a={0.95} />)}</>,
      cam: mv({pos: [SX - 0.64, 2.35, -0.57], look: [SX - 0.64, 0, -0.85], fov: 40}, lt, {arrive: 0, push: 0.05, shake: near(t, [T3[1], T3[2]], 0.1) ? 0.012 : 0}), bg: SKY};
  },
  interro: (t, lt, C) => ({node: room(C, t), cam: mv({pos: [0.9, 1.5, 1.75], look: [0.05, 0.98, -0.3], fov: 50}, lt, {arrive: 0.08, push: 0.08, shake: near(t, [ev('slap')], 0.1) ? 0.012 : 0})}),
  burn: (t, lt, C) => ({node: room(C, t), cam: mv({pos: [0.66, TABLE_TOP + 0.52, 0.62], look: [0.22, TABLE_TOP + 0.03, -0.05], fov: 40}, lt, {arrive: 0.06, push: 0.1, roll0: 3})}),
  soot: (t, lt, C) => ({node: room(C, t, {soot: true}), cam: mv({pos: [0.12, 1.2, 0.72], look: [0, 1.14, -0.85], fov: 36}, lt, {arrive: 0.06, push: 0.06})}),
  court: (t, lt, C) => ({node: courtRoom(C, t), cam: mv({pos: [0.45, 2.2, 1.1], look: [0.3, 1.84, -3.2], fov: 30}, lt, {arrive: 0.07, push: 0.07, shake: near(t, [ev('gavel')], 0.1) ? 0.012 : 0})}),
  fridge: (t, lt, C) => ({node: cellBlock(C, t), cam: mv({pos: [0.15, 1.4, 4.3], look: [-0.15, 1.2, 0.2], fov: 48}, lt, {arrive: 0.08, push: 0.07, roll0: -3, shake: near(t, [ev('shut')], 0.12) ? 0.02 : 0}), bg: CELL_BG}),
  chili: (t, lt, C) => {
    // back at the stall: the plate is full of hose water. The chili floats in it.
    const m = man(C, t, {face: 'half', look: PL}); const ch = chiliW(t, 1);
    return {node: <>{stall(t)}<P o={m.w} />{drips(m, t)}</>, cam: mv({pos: [PL[0] + 0.02, TABLE_H + 0.95, PL[2] + 0.36], look: [lerp(PL[0], ch[0], 0.5), TABLE_H + 0.03, PL[2] + 0.085], fov: 31}, lt, {arrive: 0.06, push: 0.11}), bg: SKY};
  },
  again: (t, lt, C) => {
    // no line, no caption: he takes another forkful. And it is back. Live to the last frame.
    const k = sm((t - ev('bite2') + 0.45) / 0.45), back = sm((t - ev('bite2') - 0.1) / 0.3); const eaten = t > ev('bite2') + 0.04; const u = t - ev('fire2'); const on = u > 0;
    let tip: V3 = PL; const m = man(C, t, {face: on ? 'shout' : eaten ? 'half' : k > 0.5 ? 'talk' : 'half', hands: (mo) => on ? {R: [SX - 0.36, 1.3 + Math.sin(t * 19) * 0.07, -2.22], L: [SX + 0.36, 1.3 + Math.cos(t * 19) * 0.07, -2.22]} : (() => { const f = lift(mo, k * (1 - back * 0.75)); tip = f.tip; return {R: f.R, rs: 'fist'}; })()});
    return {node: <>{stall(t)}<P o={m.w} />{!on && fork(m, tip, eaten ? 0 : 1)}{drips(m, t)}{mouthFire(m, t, pop(u / 0.3) * (1 + 0.1 * Math.sin(t * 11)))}{steam(m, t, ev('fire2') + 0.1)}</>,
      cam: mv({pos: [SX + 0.62, 1.2, -1.15], look: [SX + 0.04, 1.14, -2.4], fov: 42}, lt, {arrive: 0.06, push: 0.07, shake: near(t, [ev('fire2')], 0.25) ? 0.02 : 0}), bg: SKY};
  },
};
