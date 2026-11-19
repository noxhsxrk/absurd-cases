import React from 'react';
import * as THREE from 'three';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {Mosquito, Handcuffs, Jar} from '../AbsurdEp1/props';
import {CellPlate, Fan} from '../AbsurdEp2/props';
import {Durian} from '../AbsurdEp4/props';
import {ShadowSheet} from '../AbsurdEp8/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {Moon} from '../AbsurdEp15/props';
import {Phone, Accused} from '../AbsurdEp16/props';
import {Icebox, ICEBOX, Fire} from '../AbsurdEp17/props';
import {makeFly} from '../AbsurdEp19/props';
import {Contract} from '../AbsurdEp20/props';
import {WallPlan, makeGasMask} from '../AbsurdEp21/props';
import {Window24} from '../AbsurdEp22/props';
import {Wrap, HazardSign, GuardPost} from '../AbsurdEp23/props';
import {WallHole, Rubble, WallCrack, Cloak} from '../AbsurdEp24/props';
import {ps, body, hideProps, P, CamRig, mv, near, sm, V3, Cast, ShotOut, hand, hw, bw, headFr} from '../lifekit/stage';
import {Ring, Chain} from './props';

export {CamRig};
/** EP25 · แก๊งห้อง 24 S1E6 ดาวบริวาร. Night, weightless, where EP24 stopped: the Moon pulls him off the ceiling of 24. He grabs his floating
 *  phone, slides out between the bars (he is flat), along the corridor, in between the bars of 18, and into orbit round the Earth like the
 *  Moon: once every 3.17 s, face to the Earth (tidal lock), never stopping. Kidnapping! He calls; the line drops every time he goes behind the
 *  Earth; twelve calls. The guard swims over from 22, reaches through the bars and cuffs his wrist — and the other ring onto the Moon.
 *  Reporter and suspect orbit together. That night the door of the floating fridge in 23 swings open.
 *
 *  LAYOUT — the EP24 block, everything afloat (EP24 end state): 22 (hole, empty cuffs g = 0) · 23 fridge · 18 Earth + Moon · 24 (his shadow on
 *  the floor) · 19 wrapped fan · 20 durian. End walls x −10.7 / 9.8.
 *  orbit   centre O = Earth centre + (0, 0.25, 0.05), radius 1.1, horizontal, angle a decreasing (a = −w (t − orbit0)); position
 *          O + R (cos a, 0, sin a). He lies flat in the orbit plane, face up, along his motion (thin axis vertical). a = π/2 is the front, nearest the bars;
 *          w is tuned so he is there at `cuff1`. The Moon orbits on the same rule at r 1.2, 0.72 m higher, 0.35 s behind him.
 *  path    feet origin; body extends 1.75 m along "up" (his head). In 24: from the ceiling, rolls to thin-axis-x, out between the bars at
 *          x 0.35, along the corridor (z 3.4), in between 18's bars at X18 + 0.35, eases into the orbit at a = 0 (moving −z, head first).
 *  guard   offA, masked: AIR (X22 + 0.35, 2.0) at the start → swims (`swim0`…`garrive`) to G18 (X18 + 0.5, 1.95) facing −z, right arm through
 *          the bars at `reach`; ring 1 to his LEFT wrist at `cuff1`, ring 2 round the Moon at `cuff2`.
 *
 *  TRAPS
 *  1. Flat man: never film along his thin axis. Corridor: thin axis x — film along x. Orbit: thin axis vertical — film from ≥ 35° above.
 *  2. His 1.75 m body is a chord of the orbit: the ends reach r 1.41 from O — the back wall is 1.40 away (O shifted +0.05 z).
 *  3. The phone: grabbed on screen (`grab`), in his RIGHT hand at his ear from `dial`; status plate "สายหลุด" only while he is behind.
 *  4. "สิบสองรอบ": the call counter plate reads 12 by the end of l007.
 *  5. The guard can't get in (no door): only his arm and the cuffs pass the bars.
 *  6. Weightless: everything loose keeps floating; the shadow stays on the floor of 24. No outside shots.
 *  7. Place swaps happen on cuts: cut(name). */
const cut = (name: string) => SHOTS.find((x) => x.name === name)!.t0;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CW = 3.05, X22 = -3 * CW, X23 = -2 * CW, X18 = -CW, X19 = CW, X20 = 2 * CW;
const FAN: V3 = [X19 - 0.37, 0, 1.3], FAN_S = 1.35, BAR_X = X19 - 0.25;
const EAR_R: V3 = [-12, 12, 2];
const NIGHT_BG = {color: '#0E1424'};
const POST: V3 = [1.6, 0, 3.9];
const GRAV: V3 = [X22, 1.5, 0.0];
const BODY = 1.75;

// ---- weightless everything (EP24's end state)
const flo = (t: number, h: number, seed: number): {d: V3; r: V3} => ({d: [0.08 * Math.sin(t * 0.6 + seed), h + 0.06 * Math.sin(t * 1.1 + seed), 0.08 * Math.cos(t * 0.5 + seed)],
  r: [0.35 * Math.sin(t * 0.4 + seed), 0.3 * t + seed, 0.3 * Math.cos(t * 0.3 + seed)]});
const Floating: React.FC<{t: number; h: number; seed: number; at?: V3; spin?: boolean; children: React.ReactNode}> = ({t, h, seed, at = [0, 0, 0], spin = true, children}) => { const f = flo(t, h, seed);
  return <group position={add(at, f.d)}><group rotation={spin ? f.r : [0.05 * Math.sin(t * 0.4), 0.08 * Math.sin(t * 0.3), 0.05 * Math.cos(t * 0.5)]}>{children}</group></group>; };

// ---- the Earth, the orbits
const EARTH_C: V3 = [X18, 1.08, -0.15], EARTH_R = 0.95;
const earthC = (t: number): V3 => add(EARTH_C, [0, 0.22 + 0.05 * Math.sin(t), 0]);
const O = (t: number): V3 => add(earthC(t), [0, 0.25, 0.05]);
const R_MAN = 1.1, R_MOON = 1.2;
const W = (() => { const span = ev('cuff1') - ev('orbit0'); const k = Math.round(span / 3.0 + 0.25); return (2 * Math.PI * k - Math.PI / 2) / span; })();   // ≈ 2π / 3.17
const ang = (t: number) => -W * (t - ev('orbit0'));                       // him: a = 0 at orbit0, π/2 (front) at cuff1
const LAG = W * (ev('cuff2') - ev('cuff1'));                               // the Moon trails him by this angle
const moonAng = (t: number) => ang(t) + LAG;
const moonAt = (t: number): V3 => { const c = earthC(t), a = moonAng(t); return [c[0] + Math.cos(a) * R_MOON, c[1] + 0.97, c[2] + 0.05 + Math.sin(a) * R_MOON]; };
const behindK = (t: number) => Math.sin(ang(t)) < -0.1;                    // on the far side of the Earth from the bars
const fridgeP: V3 = [X23 + 0.1, 0, -0.6];
const DURIAN: V3 = [X20 + 0.1, 0.32, -0.5];
const fanYaw = (t: number) => 0.85 * Math.sin(t * Math.PI * 2 / 3.2);
const doorK = (t: number) => lerp(0.47, 1.0, sm((t - ev('door')) / 0.8));
type Who = 'gravity' | 'fridge' | 'earth' | 'man' | 'fan' | 'durian';
const CELLS: {x: number; no: number; who: Who}[] = [{x: X22, no: 22, who: 'gravity'}, {x: X23, no: 23, who: 'fridge'}, {x: X18, no: 18, who: 'earth'}, {x: 0, no: 24, who: 'man'},
  {x: X19, no: 19, who: 'fan'}, {x: X20, no: 20, who: 'durian'}];
const fanCuffs = (() => { const a: V3 = [FAN[0], 1.0, FAN[2]], b: V3 = [BAR_X, 1.0, 1.5]; const d = [b[0] - a[0], b[2] - a[2]];
  return <><group position={[FAN[0] + 0.104, 0.78, FAN[2]]}><Handcuffs k={1} rotation={[Math.PI / 2, 0, 0]} size={3} /></group>
    <group position={[(a[0] + b[0]) / 2, 1.0, (a[2] + b[2]) / 2]} rotation={[0, Math.atan2(-d[1], d[0]), 0]}><Handcuffs k={1} rotation={[Math.PI / 2, 0, 0]} size={Math.hypot(d[0], d[1]) / (2 * 1.45 * 0.024)} /></group></>; })();
const inmate = (who: Who, t: number) => who === 'earth' ? <>
    <Earth t={t} position={earthC(t)} r={EARTH_R} yaw={1.2} shake={0.25} eyes={false} />
    <EarthCuff center={earthC(t)} r={EARTH_R} close={1} tilt={[0.3, 0, 0.25]} />
    <Moon t={t} position={moonAt(t)} r={0.28} glow={2.2} spin={Math.PI / 2 + moonAng(t)} />
    <pointLight position={add(moonAt(t), [0, 0.2, 0])} color="#FFF0C8" intensity={3} distance={5} decay={1.6} /></>
  : who === 'fan' ? <><group rotation={[0, 0, 0.12]}><Fan position={FAN} scale={FAN_S} headYaw={fanYaw(t)} blade={t * 31} blur={1} lit={3} /></group>{fanCuffs}</>
  : who === 'fridge' ? <Floating t={t} h={0.6} seed={2} at={fridgeP} spin={false}><Icebox position={[0, 0, 0]} door={doorK(t)} glow={0.9 + 1.2 * sm((t - ev('door')) / 0.6)} frost={0.3} />
    <Fire position={[0, ICEBOX.shelf + 0.02, 0]} t={t} size={0.3 + 0.25 * sm((t - ev('door')) / 0.8)} light={0.5 + 0.8 * sm((t - ev('door')) / 0.8)} /></Floating>
  : who === 'durian' ? <Floating t={t} h={0.9} seed={5} at={DURIAN}><Durian position={[0, 0, 0]} r={0.3} yaw={1.2} face={false} /></Floating>
  : who === 'gravity' ? <><Accused t={t} position={add(GRAV, [0, 0.3, 0])} size={7} float={1} arrow={false} /><WallHole c={[X22, 1.3, -1.49]} r={0.75} k={1} />
    <Rubble center={[X22, 0, -1.0]} size={[2.2, 0.8]} k={1} lift={1} t={t} seed={1} /><Rubble center={[X22 + 0.3, 0, 2.2]} size={[2.4, 1.0]} n={10} k={1} lift={1} t={t} seed={3} /></>
  : null;
const jar25 = (t: number) => <><Floating t={t} h={1.1} seed={7} at={[-0.45, 0, 2.15]}><Jar position={[0, 0, 0]} scale={1.6}><Mosquito t={t} position={[0, 0.03, 0]} rotation={[Math.PI, 0, 0.3]} flap={0} fill={1} scale={2} legsUp /></Jar></Floating>
  <Floating t={t} h={1.3} seed={8} at={[-0.45, 0.36, 2.25]}><CellPlate text="ห้อง 25" position={[0, 0, 0]} w={0.16} /></Floating></>;
const endWalls = <group>
  <mesh position={[9.8, 1.6, 3.2]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[9.6, 3.2]} /><meshLambertMaterial color="#7A7E78" /></mesh>
  <mesh position={[9.79, 1.05, 3.0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[1.1, 2.1]} /><meshBasicMaterial color="#3A4260" /></mesh>
  <mesh position={[-10.7, 1.6, 3.2]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[9.6, 3.2]} /><meshLambertMaterial color="#7A7E78" /></mesh></group>;
const SH_END: V3 = [0.6, 0.006, -1.42];
const block = (t: number, o: {only?: number[]} = {}) => <>
  {CELLS.filter((c) => !o.only || o.only.includes(c.no)).map((c) => <group key={c.no}><group position={[c.x, 0, 0]}>
    <Cell t={t} days={0.98} marks={c.no === 24 ? 11 : 9 + (c.no % 5)} rails={c.no === 24 ? [0.04, 2.6] : undefined} />
    <CellPlate text={`ห้อง ${c.no}`} position={[0, 2.12, 1.54]} w={0.64} /></group>{inmate(c.who, t)}</group>)}
  {(!o.only || o.only.includes(24)) && <><WallPlan position={[-1.48, 1.55, -0.2]} rotation={[0, Math.PI / 2, 0]} w={1.5} /><Window24 z={-1.493} dark="#5A6E9C" />
    <WallCrack at={[-1.47, 2.5, 0.75]} len={1.9} k={1} /><ShadowSheet position={SH_END} yaw={Math.PI} pose="broom" peel={0} eyes="none" s={0.95} /></>}
  {(!o.only || o.only.includes(19)) && <><Wrap x0={X19 - 1.5} x1={X19 + 1.5} z={1.5} k={1} /><HazardSign position={[X19 - 0.05, 1.5, 1.6]} /></>}
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 4.75]}><planeGeometry args={[22, 6.5]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.6, 8.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[22, 3.2]} /><meshLambertMaterial color="#6F736D" /></mesh>
  {endWalls}
  <Floating t={t} h={1.0} seed={4} at={[0.78, 0.004, 2.2]}><group rotation={[-Math.PI / 2, 0, 0.9]}><Contract position={[0, 0, 0]} blood={1} /></group></Floating>
  <Floating t={t} h={0.8} seed={9} at={POST}><GuardPost position={[0, 0, 0]} yaw={Math.PI} /></Floating>
  <Cloak position={[0.42, 0, 2.02]} lift={1} t={t} />
  {[-7.5, -3, 1.5, 6].map((x) => <pointLight key={x} position={[x, 2.6, 3.4]} color="#5A6EA8" intensity={0.55} distance={7} decay={1.5} />)}
  <pointLight position={[0.9, 2.4, -0.4]} color="#9AAEE6" intensity={1.4} distance={3} decay={1.4} />
  {jar25(t)}</>;

// =====================================================================================================
// PEOPLE
// =====================================================================================================
type GO = {clip?: string; face?: string; look?: V3; y?: number; rx?: number};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {})}), t, o.y ?? 0, o.rx ?? 0);
  return {I, w}; };
const flies = new WeakMap<any, THREE.Object3D>();
const flyOn = (I: any) => { let f = flies.get(I);
  if (!f) { let hipsFr: THREE.Object3D | null = null; I.bones.Bip01_Spine.traverse((o: any) => { if (!hipsFr && o.isMesh && o.geometry?.parameters?.height === 20 && o.geometry?.parameters?.depth === 19) hipsFr = o.parent; });
    f = makeFly(); (hipsFr ?? I.bones.Bip01_Spine).add(f); flies.set(I, f); }
  f.visible = true; };

// ---- him: an orientation from (forward = thin axis, up = head)
const basis = (fwd: V3, up: V3) => { const z = new THREE.Vector3(...fwd).normalize(), y = new THREE.Vector3(...up).normalize(); const x = new THREE.Vector3().crossVectors(y, z).normalize();
  y.crossVectors(z, x); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); };
const Q_CEIL = basis([0, -1, 0], [0, 0, -1]);          // EP24 end: face down under the ceiling, head −z
const Q_PATH = basis([-1, 0, 0], [0, 0, -1]);          // thin axis x (fits between bars), head −z
const orbitPose = (t: number): {feet: V3; q: THREE.Quaternion} => { const a = ang(t), o = O(t);
  const c: V3 = [o[0] + Math.cos(a) * R_MAN, o[1], o[2] + Math.sin(a) * R_MAN]; const head: V3 = [Math.sin(a), 0, -Math.cos(a)];   // along his motion (a decreasing)
  return {feet: add(c, [-head[0] * BODY / 2, 0, -head[2] * BODY / 2]), q: basis([0, 1, 0], head)}; };   // lying flat in the orbit plane, face up: reads from above and from the elevated front
const PATH: [number, V3][] = [[0, [0.25, 2.66, 1.3]], [0, [0.35, 1.9, 1.15]], [0, [0.35, 1.9, 3.4]], [0, [X18 + 0.35, 1.9, 3.4]], [0, [X18 + 0.35, 1.75, 1.2]]];
const pathT = () => [0, ev('out24') - 0.25, ev('out24') + 0.55, ev('in18') - 0.45, ev('in18')];
const manPose = (t: number): {feet: V3; q: THREE.Quaternion} => {
  const T = pathT();
  if (t >= ev('orbit0')) return orbitPose(t);
  if (t >= T[4]) { const k = sm((t - T[4]) / (ev('orbit0') - T[4])); const o = orbitPose(t); return {feet: lerp3(PATH[4][1], o.feet, k), q: new THREE.Quaternion().slerpQuaternions(Q_PATH, o.q, k)}; }
  let i = 0; while (i < 3 && t >= T[i + 1]) i++; const k = sm((t - T[i]) / (T[i + 1] - T[i]));
  return {feet: lerp3(PATH[i][1], PATH[i + 1][1], k), q: t < T[1] ? new THREE.Quaternion().slerpQuaternions(Q_CEIL, Q_PATH, sm((t - 0.9) / (T[1] - 0.9))) : Q_PATH}; };   // face down under the ceiling until 0.9 s, then rolls to slip the bars
const manFace = (t: number) => t < ev('orbit0') ? 'wide' : t < ev('dial') - 0.2 ? 'closed' : t < ev('cuff1') ? (behindK(t) ? 'angry' : 'shout') : 'wide';
const PHONE0: V3 = [0.4, 2.35, 1.2];   // where EP24's phone drifted to, under the ceiling by the bars
const callK = (t: number) => sm((t - ev('dial') + 0.3) / 0.3) * (1 - sm((t - ev('cuff1') + 0.2) / 0.3));
const man = (C: Cast, t: number) => {
  const {feet, q} = manPose(t); const m = guy(C, 'nai', feet[0], feet[2], 0, t, {face: manFace(t), y: feet[1]});
  m.w.quaternion.copy(q); m.w.scale.z *= 0.12; m.w.updateMatrixWorld(true);
  const nodes: React.ReactNode[] = []; const handR = bw(m.I, 'Bip01_R_Hand');
  if (t < ev('grab')) nodes.push(<Phone key="ph" position={add(PHONE0, [0.03 * Math.sin(t * 2), 0.02 * Math.sin(t * 1.3), 0])} rotation={[t * 0.8, t * 1.1, 0.4]} lit={1} />);
  else { const ck = callK(t); let ph: V3;
    if (ck > 0.01) { const ear = add(hw(m.I, EAR_R), [0, 0, 0]); ph = ear; hand(m.I, 'R', ear, 'cup'); }
    else { if (t < ev('grab') + 0.25) hand(m.I, 'R', lerp3(handR, PHONE0, 1 - sm((t - ev('grab')) / 0.25)), 'claw'); ph = bw(m.I, 'Bip01_R_Hand'); }
    nodes.push(<Phone key="ph" position={ph} quaternion={q} lit={1} />); }
  m.w.updateMatrixWorld(true); flyOn(m.I);
  return {...m, node: <><P o={m.w} />{nodes}</>, wristL: bw(m.I, 'Bip01_L_Hand'), head: bw(m.I, 'Bip01_Head')}; };
/** the call status and counter, floating by his head while he is calling */
const calls = (t: number) => { const base = 1 + Math.max(0, Math.floor(W * (t - ev('dial')) / (2 * Math.PI)));
  return Math.round(t < ev('redial0') ? base : lerp(base, 12, sm((t - ev('redial0')) / (ev('redial1') - ev('redial0'))))); };
/** an annotation board hovering over the Earth (EP16's red notes style): status of his call and the count */
const callTag = (t: number, _at: V3) => { if (callK(t) < 0.5) return null; const drop = behindK(t);
  return <group position={add(earthC(t), [0, 1.55, 0.1])}><CellPlate text={drop ? 'สายหลุด' : 'กำลังโทร…'} position={[0, 0, 0]} w={0.42} bg={drop ? '#B0302E' : '#1F6F4A'} />
    <CellPlate text={`โทรครั้งที่ ${calls(t)}`} position={[0, -0.16, 0]} w={0.42} /></group>; };

// ---- the guard (masked, weightless)
const masks = new WeakMap<any, THREE.Object3D>();
const maskOn = (I: any) => { let m = masks.get(I); if (!m) { m = makeGasMask(); headFr(I).add(m); masks.set(I, m); } m.visible = true; m.position.y = 0; return m; };
const AIR: V3 = [X22 + 0.35, 0, 2.0], G18: V3 = [X18 + 0.5, 0, 1.95];
const guardAt = (t: number) => { const k = cl((t - ev('swim0')) / (ev('garrive') - ev('swim0')));
  if (k <= 0) return {p: AIR, yaw: Math.PI, y: 0.35 + 0.04 * Math.sin(t * 1.5), rx: 0.05, swim: false};
  if (k < 1) return {p: lerp3(AIR, G18, sm(k) * 0.3 + k * 0.7), yaw: Math.PI / 2 + 0.2 * (1 - k), y: 0.75 - 0.35 * sm((k - 0.8) / 0.2) + 0.06 * Math.sin(t * 2.4), rx: 0.6 * (1 - sm((k - 0.85) / 0.15)), swim: true};
  return {p: G18, yaw: Math.PI, y: 0.4 + 0.04 * Math.sin(t * 1.5), rx: 0.05, swim: false}; };
const REACH: V3 = [X18 + 0.25, 1.62, 1.28];
const guard = (C: Cast, t: number, face = 'angry') => {
  const s = guardAt(t); const g = guy(C, 'offA', s.p[0], s.p[2], s.yaw, t, {face, y: s.y, rx: s.rx}); maskOn(g.I);
  const fw: V3 = [Math.sin(s.yaw), 0, Math.cos(s.yaw)], lf: V3 = [Math.cos(s.yaw), 0, -Math.sin(s.yaw)];
  if (s.swim) { const head = bw(g.I, 'Bip01_Head'); const ph = (t - ev('swim0')) * 4.2;
    for (const [sd, sg] of [['R', -1], ['L', 1]] as const) { const sw = 0.5 + 0.5 * Math.sin(ph); hand(g.I, sd, add(head, [fw[0] * (0.25 + 0.2 * sw) + lf[0] * sg * (0.18 + 0.28 * (1 - sw)), -0.2, fw[2] * (0.25 + 0.2 * sw) + lf[2] * sg * (0.18 + 0.28 * (1 - sw))]), 'open'); } }
  else if (t > ev('reach') - 0.4 && t < ev('cuff2') + 0.8) hand(g.I, 'R', lerp3(add(bw(g.I, 'Bip01_Spine2'), [0.15, 0, 0.2]), REACH, sm((t - ev('reach') + 0.4) / 0.4)), 'fist');
  g.w.updateMatrixWorld(true); return {...g, node: <P o={g.w} />}; };
/** the cuffs: in the guard's hand from `reach`, ring 1 snaps onto his left wrist at `cuff1`, ring 2 round the Moon at `cuff2`; chain between */
const cuffs = (t: number, wrist: V3) => { if (t < ev('reach') - 0.2) return null;
  const r1 = t < ev('cuff1') ? lerp3(REACH, wrist, sm((t - ev('cuff1') + 0.15) / 0.15)) : wrist;
  const mp = moonAt(t); const r2 = t < ev('cuff2') ? lerp3(add(REACH, [-0.05, 0.05, 0]), mp, sm((t - ev('cuff2') + 0.2) / 0.2)) : mp;
  const rr = t < ev('cuff2') ? 0.06 : lerp(0.45, 0.33, sm((t - ev('cuff2')) / 0.1));
  return <><Ring p={r1} r={t < ev('cuff1') ? 0.06 : lerp(0.09, 0.05, sm((t - ev('cuff1')) / 0.1))} /><Ring p={r2} r={rr} /><Chain a={r1} b={r2} sag={t > ev('cuff2') ? 0.0 : 0.06} /></>; };

// =====================================================================================================
const lamp = (p: V3, i = 1.4, c = '#9AAEE6') => <pointLight position={p} color={c} intensity={i} distance={4} decay={1.4} />;
const all = (t: number, C: Cast, o: {only?: number[]; guard?: boolean} = {}) => { const m = man(C, t); const g = o.guard ? guard(C, t) : null;
  return {m, node: <>{block(t, o.only ? {only: o.only} : {})}{m.node}{g?.node}{cuffs(t, m.wristL)}{callTag(t, m.head)}</>}; };
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: under the ceiling of 24, being pulled to the bars — he snatches his floating phone as he goes
    const {node} = all(t, C, {only: [24]});
    return {node: <>{node}{lamp([0.5, 1.5, 0.4], 2.4, '#FFF0C8')}</>, cam: mv({pos: [1.05, 0.55, 1.45], look: [0.3, 2.6, -0.15], fov: 56}, lt, {arrive: 0.06, push: 0.2}), bg: NIGHT_BG};
  },
  bars: (t, lt, C) => {
    // the corridor: out between the bars of 24, along the cells, in between the bars of 18
    const {node} = all(t, C, {only: [24, 18, 23]});
    return {node: <>{node}{lamp([-1.5, 2.4, 3.4], 1.4, '#FFF0C8')}</>, cam: mv({pos: [3.6, 2.1, 3.3], look: [-3.0, 1.85, 3.1], fov: 46}, lt, {arrive: 0.02, push: 0.06}), bg: NIGHT_BG};
  },
  into18: (t, lt, C) => {
    // side-on along the corridor: flat as paper, he slips in between the bars of 18
    const {node} = all(t, C, {only: [18, 24]});
    return {node: <>{node}{lamp([X18 + 1.2, 2.3, 2.6], 1.6, '#FFF0C8')}</>, cam: mv({pos: [X18 + 2.5, 1.95, 2.1], look: [X18 + 0.2, 1.75, 1.2], fov: 50}, lt, {arrive: 0.03, push: 0.14}), bg: NIGHT_BG};
  },
  orbit: (t, lt, C) => {
    // frontal, cell 18: the Earth, the Moon going round it — and now him, round it too
    const {node} = all(t, C, {only: [18, 24, 23]});
    return {node: <>{node}{lamp([X18, 2.6, 2.6], 1.4)}</>, cam: mv({pos: [X18, 3.6, 3.6], look: [X18, 1.45, -0.1], fov: 52}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  tidal: (t, lt, C) => {
    // from above: three bodies in a ring — he always faces the Earth, like the Moon
    const {node} = all(t, C, {only: [18]});
    return {node: <>{node}{lamp([X18, 2.7, 0.0], 1.6)}</>, cam: mv({pos: [X18 + 0.05, 4.6, 0.1], look: [X18, 1.3, -0.1], fov: 54}, lt, {arrive: 0.02, push: 0.08, roll0: 90, roll: 5}), bg: NIGHT_BG};
  },
  lap: (t, lt, C) => {
    // a little lower, the whole lap: round and round, every three seconds
    const {node} = all(t, C, {only: [18, 24]});
    return {node: <>{node}{lamp([X18 + 0.6, 2.6, 2.0], 1.4)}<CellPlate text="1 รอบ = 3 วินาที" position={[X18 - 0.75, 2.5, 1.62]} w={0.62} /></>,
      cam: mv({pos: [X18 + 1.0, 4.0, 3.0], look: [X18, 1.45, -0.1], fov: 52}, lt, {arrive: 0.02, push: 0.1, side: 0.6}), bg: NIGHT_BG};
  },
  dizzy: (t, lt, C) => {
    // straight down, the frame turning: round and round, eyes shut
    const {node} = all(t, C, {only: [18]});
    return {node: <>{node}{lamp([X18, 1.9, 2.0], 1.8)}</>, cam: mv({pos: [X18 + 0.05, 4.3, 0.15], look: [X18, 1.3, -0.1], fov: 56}, lt, {arrive: 0.02, push: 0.1, roll0: 90, roll: 6}), bg: NIGHT_BG};
  },
  plate: (t, lt, C) => {
    // the institution, frontal and symmetric: cell 18, the Moon and its victim going round. The plate drops.
    const {node} = all(t, C, {only: [18, 23, 24]});
    return {node: <>{node}{lamp([X18, 2.6, 2.8], 1.6)}</>, cam: mv({pos: [X18, 3.0, 5.0], look: [X18, 1.6, -0.1], fov: 44}, lt, {arrive: 0.04, push: 0.12, shake: near(t, [ev('plate')], 0.1) ? 0.012 : 0}), bg: NIGHT_BG};
  },
  call: (t, lt, C) => {
    // close as he comes round the front: phone to his ear
    const {node} = all(t, C, {only: [18]});
    return {node: <>{node}{lamp([X18 + 0.4, 2.0, 1.9], 1.8)}</>, cam: mv({pos: [X18 + 0.6, 3.2, 3.4], look: [X18, 1.9, 0.5], fov: 50}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  drop: (t, lt, C) => {
    // frontal: round he goes behind the Earth — the plate over his head flips to "สายหลุด"
    const {node} = all(t, C, {only: [18]});
    return {node: <>{node}{lamp([X18, 2.6, 2.4], 1.6)}</>, cam: mv({pos: [X18 + 0.2, 3.4, 3.8], look: [X18, 1.7, -0.1], fov: 52}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  behind: (t, lt, C) => {
    // high and wide: every lap, behind the Earth, the line drops; in front, it rings again
    const {node} = all(t, C, {only: [18, 24, 23]});
    return {node: <>{node}{lamp([X18, 2.7, 1.6], 1.6)}</>, cam: mv({pos: [X18 - 1.2, 3.5, 3.8], look: [X18, 1.35, -0.1], fov: 52}, lt, {arrive: 0.02, push: 0.08, side: -0.5}), bg: NIGHT_BG};
  },
  behind2: (t, lt, C) => {
    // from above again: round and round, red and green
    const {node} = all(t, C, {only: [18]});
    return {node: <>{node}{lamp([X18, 2.7, 0.0], 1.6)}</>, cam: mv({pos: [X18 + 0.05, 4.4, 0.6], look: [X18, 1.3, -0.1], fov: 56}, lt, {arrive: 0.02, push: 0.08, roll0: 90, roll: -4}), bg: NIGHT_BG};
  },
  redial: (t, lt, C) => {
    // close on the counter as he redials: 3, 4, 5 …
    const {node} = all(t, C, {only: [18]});
    return {node: <>{node}{lamp([X18 + 0.3, 2.6, 2.0], 1.8)}</>, cam: mv({pos: [X18 - 0.3, 3.05, 2.9], look: [X18, 2.6, 0.0], fov: 46}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  count12: (t, lt, C) => {
    // … twelve
    const {node} = all(t, C, {only: [18]});
    return {node: <>{node}{lamp([X18 + 0.3, 2.6, 2.0], 1.8)}</>, cam: mv({pos: [X18 + 0.15, 2.95, 2.4], look: [X18, 2.75, 0.0], fov: 40}, lt, {arrive: 0.03, push: 0.12, roll: -3}), bg: NIGHT_BG};
  },
  guardfly: (t, lt, C) => {
    // down the corridor the masked guard swims over from 22 and stops at the bars of 18
    const {node} = all(t, C, {guard: true});
    return {node: <>{node}{lamp([X18 - 1.0, 2.4, 3.4], 1.6)}</>, cam: mv({pos: [X18 + 2.6, 1.75, 5.2], look: [X18 + 0.2, 1.5, 2.0], fov: 50}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  reach: (t, lt, C) => {
    // behind the guard: his arm through the bars, cuffs open, waiting for the next pass
    const {node} = all(t, C, {only: [18], guard: true});
    return {node: <>{node}{lamp([X18 + 0.6, 2.4, 2.8], 1.6)}</>, cam: mv({pos: [X18 + 1.65, 1.95, 2.7], look: [X18 + 0.2, 1.6, 1.2], fov: 50}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  snap1: (t, lt, C) => {
    // close at the bars: click — round his wrist as he passes
    const {node} = all(t, C, {only: [18], guard: true});
    return {node: <>{node}{lamp([X18 + 0.4, 2.0, 2.0], 1.8)}</>, cam: mv({pos: [X18 - 0.75, 1.95, 2.35], look: [X18 + 0.1, 1.5, 1.0], fov: 52}, lt, {arrive: 0.03, push: 0.12, shake: near(t, [ev('cuff1'), ev('cuff2')], 0.08) ? 0.006 : 0}), bg: NIGHT_BG};
  },
  snap2: (t, lt, C) => {
    // the other ring round the Moon: chained together
    const {node} = all(t, C, {only: [18], guard: true});
    return {node: <>{node}{lamp([X18, 2.6, 1.8], 1.8)}</>, cam: mv({pos: [X18 - 0.9, 3.0, 2.7], look: [X18, 2.1, 0.6], fov: 50}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  since: (t, lt, C) => {
    // "ตั้งแต่นั้น": frontal, the guard outside the bars looking in
    const {node} = all(t, C, {only: [18, 23, 24], guard: true});
    return {node: <>{node}{lamp([X18, 2.6, 3.0], 1.6)}</>, cam: mv({pos: [X18 + 0.7, 1.7, 5.2], look: [X18, 1.6, -0.1], fov: 44}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  pair: (t, lt, C) => {
    // the reporter and the suspect, cuffed together, coming round
    const {node} = all(t, C, {only: [18], guard: true});
    return {node: <>{node}{lamp([X18 - 0.4, 2.6, 2.0], 1.8)}</>, cam: mv({pos: [X18 - 0.5, 3.3, 2.5], look: [X18, 1.8, 0.3], fov: 54}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  coorbit: (t, lt, C) => {
    // high frontal: the two of them, chained, round and round the Earth
    const {node} = all(t, C, {only: [18, 23, 24], guard: true});
    return {node: <>{node}{lamp([X18, 2.7, 2.0], 1.6)}</>, cam: mv({pos: [X18 + 0.4, 3.2, 4.4], look: [X18, 1.5, -0.1], fov: 50}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  topdown: (t, lt, C) => {
    // straight down: the chain between them, the Earth in the middle
    const {node} = all(t, C, {only: [18]});
    return {node: <>{node}{lamp([X18, 2.7, 0.0], 1.6)}</>, cam: mv({pos: [X18 + 0.05, 4.6, 0.1], look: [X18, 1.3, -0.1], fov: 54}, lt, {arrive: 0, push: 0.1, roll0: 90, roll: 6}), bg: NIGHT_BG};
  },
  night: (t, lt, C) => {
    // "คืนนั้น": the corridor towards 23, everything adrift, the orbit going on in 18
    const {node} = all(t, C, {guard: true});
    return {node: <>{node}{lamp([X23 + 1.0, 2.4, 3.0], 1.2)}</>, cam: mv({pos: [0.5, 1.8, 5.6], look: [X23 + 0.4, 1.3, 1.0], fov: 46}, lt, {arrive: 0, push: 0.08}), bg: NIGHT_BG};
  },
  fridge: (t, lt, C) => {
    // cell 23: the fridge adrift, its door held just ajar, the fire inside glowing
    return {node: <>{block(t, {only: [23]})}{lamp([X23 + 0.8, 2.0, 1.6], 1.2)}</>, cam: mv({pos: [X23 + 0.25, 1.45, 3.7], look: [X23 + 0.1, 1.15, -0.6], fov: 46}, lt, {arrive: 0.03, push: 0.14}), bg: NIGHT_BG};
  },
  door: (t, lt, C) => {
    // the door floats open — firelight spills out
    return {node: <>{block(t, {only: [23]})}{lamp([X23 + 0.6, 1.8, 1.2], 1.2)}</>, cam: mv({pos: [X23 + 0.55, 1.4, 2.6], look: [X23 + 0.05, 1.1, -0.6], fov: 46}, lt, {arrive: 0.03, push: 0.16}), bg: NIGHT_BG};
  },
  fire: (t, lt, C) => {
    // close: the fire, free in the open fridge. Black.
    return {node: <>{block(t, {only: [23]})}</>, cam: mv({pos: [X23 + 0.35, 1.45, 1.85], look: [X23 + 0.1, 1.15, -0.6], fov: 44}, lt, {arrive: 0, push: 0.18}), bg: NIGHT_BG};
  },
};
void [cl, bw, ICEBOX];
