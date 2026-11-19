import React from 'react';
import * as THREE from 'three';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {Mosquito, Handcuffs, Jar} from '../AbsurdEp1/props';
import {CellPlate, Fan} from '../AbsurdEp2/props';
import {Durian} from '../AbsurdEp4/props';
import {PoliceCar} from '../AbsurdEp7/props';
import {ShadowSheet} from '../AbsurdEp8/props';
import {Earth, EarthCuff, tremble} from '../AbsurdEp14/props';
import {Moon} from '../AbsurdEp15/props';
import {Phone, Accused} from '../AbsurdEp16/props';
import {Icebox, ICEBOX, Fire} from '../AbsurdEp17/props';
import {makeFly} from '../AbsurdEp19/props';
import {Contract} from '../AbsurdEp20/props';
import {WallPlan, makeGasMask, FogBank} from '../AbsurdEp21/props';
import {Window24, WIN24, BlockOutside, WALL_Z, Warrant} from '../AbsurdEp22/props';
import {Wrap, HazardSign, GuardPost, Hooded} from '../AbsurdEp23/props';
import {ps, body, hideProps, P, CamRig, mv, near, sm, V3, Cast, ShotOut, hand, hw, bw, headFr} from '../lifekit/stage';
import {WallHole, Rubble, WallCrack, GravityArrow, Cloak} from './props';

export {CamRig};
/** EP24 · แก๊งห้อง 24 S1E5 แรงโน้มถ่วงหลุด. Night, where EP23 stopped: the guard has led a hooded "new prisoner" to the bars of 24. The cloak
 *  drops — nobody inside it, only a flat shadow holding a broom: his own shadow (EP8, sentenced to shade the bus stop, fled at noon). It slides
 *  along the floor through the bars and stops under his feet. The gang's plan: the Earth in 18 shakes the wall down. The whole block quakes and
 *  a wall does come down — cell 22's, at the far end: gravity's cell (EP16: cuffs round nothing, a red arrow, "g = 9.8"). Gravity slips out
 *  of the hole and everything lifts. He comes out of the window and floats up to the ceiling. Neglect of duty! His phone floats away before he
 *  can call. The guard swims over and snaps his cuffs shut on air. Everything floats; only his shadow stays on the floor. The moon starts to pull.
 *
 *  LAYOUT (metres; yaw 0 faces +z; a character's LEFT is +x at yaw 0) — the EP20–23 block plus cell 22 at the far left end
 *  cells   EP1 Cells along x, CW 3.05 apart, bars z 1.5, back wall z −1.5: 22 gravity (−3CW) · 23 fridge (−2CW) · 18 Earth + Moon (−CW) ·
 *          24 HIM (0) · 19 fan, wrapped in plastic, cuffed to the bars (+CW) · 20 durian (+2CW). End walls at x −10.7 and 9.8.
 *          Cell 22's back wall gets a hole at (X22, 1.3, −1.49) at `collapse`; gravity = EP16 `Accused` at (X22, 1.5, 0.0).
 *  him     EP22 state C until `unlodge` (flat, on his LEFT side in the back window, feet WIN_FEET, face +x). Then slides in and rolls face-down
 *          to the ceiling: feet CEIL_FEET (0.6, 2.66, 0.75), head −z. Flat along his own front-back axis: never film him along that axis.
 *  shadow  EP8 ShadowSheet, pose broom, NO eyes. Lying on the floor head +z (yaw π). Under the cloak at drop, heels (0.42, 1.75) → slides
 *          to SH_END (0.6, −1.42), under his feet. Never lifts (shadows don't float).
 *  guard   offA, masked (EP21/23). At the bars of 24 with the hood until `drop`, then at his desk (1.6, 4.45) facing −z; floats up at `lift`;
 *          from `swim0` drifts along the corridor to AIR (X22 + 0.35, 2.0) facing −z, cuffs snap shut on nothing at `aircuff`.
 *
 *  TRAPS OF THIS EPISODE
 *  1. Floating = every loose thing in the block (jar 25, contract, desk/stool/cup, cloak, rubble, durian, fridge, Earth+Moon, guard, him,
 *     the cuffs) — but NOT the shadow, and not the fan (cuffed to a bar in EP23) beyond a tilt.
 *  2. Gravity's tag reads g = 9.8 while hanging and g = 0 once floating (EP16 `Accused` does it from `float`): float only after `escape`.
 *  3. Order the audience needs: the aimed-at wall (crack in 24 by the chalk plan) — the burst — "ห้อง 22" readable at the burst.
 *  4. No outside shots after `lift` (the yard and the ten cars would have to float too).
 *  5. The guard believes 24 is empty: he never looks into 24.
 *  6. The phone must leave his hand/pocket on screen and drift, not vanish.
 *  7. Swaps of place happen on cuts: cut(name). */
const cut = (name: string) => SHOTS.find((x) => x.name === name)!.t0;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CW = 3.05, X22 = -3 * CW, X23 = -2 * CW, X18 = -CW, X19 = CW, X20 = 2 * CW;
const FAN: V3 = [X19 - 0.37, 0, 1.3], FAN_S = 1.35;
const BAR_X = X19 - 0.25;
const EAR_R: V3 = [-12, 12, 2];
const WIN_FEET: V3 = [WIN24.bars[1] + 0.075, 2.0, -0.85];
const CEIL_FEET: V3 = [0.6, 2.66, 0.75];
const NIGHT_BG = {color: '#0E1424'}, OUT_BG = {color: '#0B1020'};
const POST: V3 = [1.6, 0, 3.9], DESK: V3 = [POST[0], 0, POST[2] + 0.55];
const GRAV: V3 = [X22, 1.5, 0.0];

// ---- time functions
const liftK = (t: number) => sm((t - ev('lift')) / 1.8);
const quakeK = (t: number) => sm((t - ev('quake0')) / 0.3) * (1 - sm((t - ev('quake1')) / 0.5));
const shakeK = (t: number) => Math.max(quakeK(t), 0.5 * sm((t - ev('shake0')) / 0.4) * (1 - sm((t - ev('quake0')) / 0.2)));
const holeK = (t: number) => sm((t - ev('collapse')) / 0.18);
/** a loose object's float: its own height h, a slow bob and a tumble; plus the quake rattle */
const flo = (t: number, h: number, seed: number): {d: V3; r: V3} => { const k = liftK(t); const q = tremble(t, 0.02 * quakeK(t), seed);
  return {d: [q[0] + k * 0.08 * Math.sin(t * 0.6 + seed), q[1] + k * (h + 0.06 * Math.sin(t * 1.1 + seed)), q[2] + k * 0.08 * Math.cos(t * 0.5 + seed)],
    r: [k * 0.35 * Math.sin(t * 0.4 + seed), k * (0.3 * t + seed), k * 0.3 * Math.cos(t * 0.3 + seed)]}; };
const Floating: React.FC<{t: number; h: number; seed: number; at?: V3; children: React.ReactNode}> = ({t, h, seed, at = [0, 0, 0], children}) => { const f = flo(t, h, seed);
  return <group position={add(at, f.d)}><group rotation={f.r}>{children}</group></group>; };

// =====================================================================================================
// THE BLOCK at night
// =====================================================================================================
const EARTH_C: V3 = [X18, 1.08, -0.15], EARTH_R = 0.95;
const earthC = (t: number): V3 => { const q = tremble(t, 0.05 * shakeK(t), 3); const lean = 0.18 * sm((t - ev('push')) / 0.3) * (1 - sm((t - ev('quake1')) / 0.6));
  return add(EARTH_C, [q[0] + lean, q[1] + liftK(t) * (0.22 + 0.05 * Math.sin(t)), q[2]]); };   // low lift: the Moon's orbit must stay under the ceiling
const ORB = {r: 1.2, y: 0.97, w: (Math.PI * 2) / 3.2};
const moonAt = (t: number): V3 => { const c = earthC(t), a = ORB.w * t; return [c[0] + Math.cos(a) * ORB.r, c[1] + ORB.y + 0.1 * Math.sin(a), c[2] + Math.sin(a) * ORB.r]; };
const moonGlow = (t: number) => 0.9 + 1.8 * sm((t - ev('moon')) / 0.6);
const fridgeP: V3 = [X23 + 0.1, 0, -0.6];
const DURIAN: V3 = [X20 + 0.1, 0.32, -0.5];
const fanYaw = (t: number) => 0.85 * Math.sin(t * Math.PI * 2 / 3.2);
type Who = 'gravity' | 'fridge' | 'earth' | 'man' | 'fan' | 'durian';
const CELLS: {x: number; no: number; who: Who}[] = [{x: X22, no: 22, who: 'gravity'}, {x: X23, no: 23, who: 'fridge'}, {x: X18, no: 18, who: 'earth'}, {x: 0, no: 24, who: 'man'},
  {x: X19, no: 19, who: 'fan'}, {x: X20, no: 20, who: 'durian'}];
const fanCuffs = (() => { const a: V3 = [FAN[0], 1.0, FAN[2]], b: V3 = [BAR_X, 1.0, 1.5]; const d = [b[0] - a[0], b[2] - a[2]];
  return <><group position={[FAN[0] + 0.104, 0.78, FAN[2]]}><Handcuffs k={1} rotation={[Math.PI / 2, 0, 0]} size={3} /></group>
    <group position={[(a[0] + b[0]) / 2, 1.0, (a[2] + b[2]) / 2]} rotation={[0, Math.atan2(-d[1], d[0]), 0]}><Handcuffs k={1} rotation={[Math.PI / 2, 0, 0]} size={Math.hypot(d[0], d[1]) / (2 * 1.45 * 0.024)} /></group></>; })();
// gravity: hanging in its cuffs with its red arrow; the arrow slides out through the hole at `escape`; the empty cuffs float, tag g = 0
const arrowAt = (t: number): V3 | null => { const u = t - ev('escape'); if (u < 0) return add(GRAV, [0, -0.05, 0]); if (u > 1.6) return null;
  const k = sm(u / 1.4); return [GRAV[0] + 0.2 * Math.sin(k * 3), GRAV[1] - 0.05 - 0.15 * k, lerp(GRAV[2], -3.2, k)]; };
const gravity = (t: number) => { const a = arrowAt(t); const fk = sm((t - ev('escape') - 0.4) / 1.2);
  return <><Accused t={t} position={add(GRAV, [0, liftK(t) * 0.3, 0])} size={7} float={fk} arrow={false} />{a && <GravityArrow position={a} s={0.9} />}</>; };
const inmate = (who: Who, t: number) => who === 'earth' ? <>
    <Earth t={t} position={earthC(t)} r={EARTH_R} yaw={1.2} shake={0.25 + 2.5 * shakeK(t)} eyes={false} />
    <EarthCuff center={earthC(t)} r={EARTH_R} close={1} tilt={[0.3, 0, 0.25]} />
    <Moon t={t} position={moonAt(t)} r={0.28} glow={moonGlow(t)} spin={Math.PI / 2 - ORB.w * t} />
    <pointLight position={add(moonAt(t), [0, 0.2, 0])} color="#FFF0C8" intensity={1.6 + 2 * sm((t - ev('moon')) / 0.6)} distance={5} decay={1.6} /></>
  : who === 'fan' ? <><group rotation={[0, 0, 0.12 * liftK(t)]}><Fan position={FAN} scale={FAN_S} headYaw={fanYaw(t)} blade={t * 31} blur={1} lit={3} /></group>{fanCuffs}</>
  : who === 'fridge' ? <Floating t={t} h={0.6} seed={2} at={fridgeP}><Icebox position={[0, 0, 0]} door={0.47} glow={0.9} frost={0.3} />
    <Fire position={[0, ICEBOX.shelf + 0.02, 0]} t={t} size={0.3} light={0.5} /></Floating>
  : who === 'durian' ? <Floating t={t} h={0.9} seed={5} at={DURIAN}><Durian position={[0, 0, 0]} r={0.3} yaw={1.2} face={false} /></Floating>
  : who === 'gravity' ? <>{gravity(t)}<WallHole c={[X22, 1.3, -1.49]} r={0.75} k={holeK(t)} />
    <Rubble center={[X22, 0, -1.0]} size={[2.2, 0.8]} k={holeK(t)} lift={liftK(t)} t={t} seed={1} />
    <FogBank t={t} center={[X22, 0, -0.6]} size={[2.6, 2.2, 1.6]} k={sm((t - ev('collapse')) / 0.3) * (1 - sm((t - ev('collapse') - 2.5) / 2))} n={40} /></>
  : null;
const jar25 = (t: number) => <><Floating t={t} h={1.1} seed={7} at={[-0.45, 0, 2.15]}><Jar position={[0, 0, 0]} scale={1.6}><Mosquito t={t} position={[0, 0.03, 0]} rotation={[Math.PI, 0, 0.3]} flap={0} fill={1} scale={2} legsUp /></Jar></Floating>
  <Floating t={t} h={1.3} seed={8} at={[-0.45, 0.36, 2.25]}><CellPlate text="ห้อง 25" position={[0, 0, 0]} w={0.16} /></Floating></>;
const endWalls = <group>
  <mesh position={[9.8, 1.6, 3.2]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[9.6, 3.2]} /><meshLambertMaterial color="#7A7E78" /></mesh>
  <mesh position={[9.79, 1.05, 3.0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[1.1, 2.1]} /><meshBasicMaterial color="#3A4260" /></mesh>
  <mesh position={[-10.7, 1.6, 3.2]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[9.6, 3.2]} /><meshLambertMaterial color="#7A7E78" /></mesh></group>;
const block = (t: number, o: {only?: number[]} = {}) => <>
  {CELLS.filter((c) => !o.only || o.only.includes(c.no)).map((c) => <group key={c.no}><group position={[c.x, 0, 0]}>
    <Cell t={t} days={0.98} marks={c.no === 24 ? 11 : 9 + (c.no % 5)} rails={c.no === 24 ? [0.04, 2.6] : undefined} />
    <CellPlate text={`ห้อง ${c.no}`} position={[0, 2.12, 1.54]} w={0.64} /></group>{inmate(c.who, t)}</group>)}
  {(!o.only || o.only.includes(24)) && <><WallPlan position={[-1.48, 1.55, -0.2]} rotation={[0, Math.PI / 2, 0]} w={1.5} /><Window24 z={-1.493} dark="#5A6E9C" />
    <WallCrack at={[-1.47, 2.5, 0.75]} len={1.9} k={sm((t - ev('push')) / 0.6)} /></>}
  {(!o.only || o.only.includes(19)) && <><Wrap x0={X19 - 1.5} x1={X19 + 1.5} z={1.5} k={1} /><HazardSign position={[X19 - 0.05, 1.5, 1.6]} /></>}
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 4.75]}><planeGeometry args={[22, 6.5]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.6, 8.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[22, 3.2]} /><meshLambertMaterial color="#6F736D" /></mesh>
  {endWalls}
  <Floating t={t} h={1.0} seed={4} at={[0.78, 0.004, 2.2]}><group rotation={[-Math.PI / 2, 0, 0.9]}><Contract position={[0, 0, 0]} blood={1} /></group></Floating>
  <Floating t={t} h={0.8} seed={9} at={POST}><GuardPost position={[0, 0, 0]} yaw={Math.PI} /></Floating>
  {t > ev('drop') + 0.15 && <Cloak position={[0.42, 0, 2.02]} lift={liftK(t)} t={t} />}
  {[-7.5, -3, 1.5, 6].map((x) => <pointLight key={x} position={[x, 2.6, 3.4]} color="#5A6EA8" intensity={0.55} distance={7} decay={1.5} />)}
  <pointLight position={[0.9, 2.4, -0.4]} color="#9AAEE6" intensity={1.4} distance={3} decay={1.4} />
  {jar25(t)}{shadow(t)}</>;

// =====================================================================================================
// OUTSIDE (only before `lift`): the wall at night, ten parked cars, the warrant
// =====================================================================================================
const NCAR = 10, ARC = {c: [0.6, 0, -1.6] as V3, r: 8.5, a0: -1.08, a1: 1.08};
const carAt = (i: number) => { const a = lerp(ARC.a0, ARC.a1, i / (NCAR - 1)); return {p: [ARC.c[0] + Math.sin(a) * ARC.r, 0, ARC.c[2] - Math.cos(a) * ARC.r] as V3, yaw: Math.atan2(-Math.cos(a), -Math.sin(a))}; };
const outside = (t: number) => <>
  <BlockOutside cells={CELLS.filter((c) => c.no !== 22).map((c) => c.x)} />
  <hemisphereLight args={['#3A4E86', '#16181C', 0.95]} /><directionalLight position={[10, 14, -18]} color="#9FB2E0" intensity={0.9} />
  <pointLight position={[WIN24.x + 1.2, WIN24.y + 0.3, WALL_Z - 1.4]} color="#A8BCEA" intensity={1.6} distance={3.5} decay={1.4} />
  {Array.from({length: NCAR}, (_, i) => { const c = carAt(i); return <PoliceCar key={i} t={t} position={c.p} yaw={c.yaw} seed={i * 3} spin={0} unit="สายตรวจนอกเรือนจำ · 191" />; })}
  <Warrant position={[1.3, 1.22, WALL_Z - 0.008]} rotation={[0, Math.PI, 0]} /></>;

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

// ---- him
const Q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, -Math.PI / 2, 'YXZ'));   // on his left side in the window, face +x
const Q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0, 'YXZ'));       // face down under the ceiling, head −z
const outK = (t: number) => sm((t - ev('unlodge')) / 0.7);          // slides in out of the window
const upK = (t: number) => sm((t - ev('unlodge') - 0.5) / (ev('ceil') - ev('unlodge') - 0.5));   // rolls face-down and rises to the ceiling
const pullK = (t: number) => sm((t - ev('pull')) / 3.0);
const manFeet = (t: number): V3 => { const inP: V3 = [WIN_FEET[0], WIN_FEET[1], WIN_FEET[2] + 1.6]; const a = lerp3(WIN_FEET, inP, outK(t)); const b = lerp3(a, CEIL_FEET, upK(t));
  const bump = t > ev('ceil') ? 0.03 * Math.exp(-(t - ev('ceil')) * 6) * Math.sin((t - ev('ceil')) * 30) : 0;
  return add(b, [-0.35 * pullK(t) + 0.04 * Math.sin(t * 0.9) * upK(t), bump - 0.05 * (0.5 - 0.5 * Math.cos(t * 1.7)) * upK(t), 0.55 * pullK(t) + 0.05 * Math.sin(t * 0.7) * upK(t)]); };   // weightless: he drifts and bobs off the ceiling
const manFace = (t: number) => t < ev('stick') ? 'half' : t < ev('quake0') ? 'open' : t < ev('unlodge') ? 'wide' : t < ev('miss') + 0.6 && t > ev('phone0') ? 'angry' : 'wide';
const phoneAt = (t: number, hip: V3): {p: V3; r: V3} | null => { const u = t - ev('phone0'); if (u < 0) return null;
  return {p: add(hip, [0.12 + 0.05 * u, -0.12 - 0.06 * u, 0.15 + 0.32 * u]), r: [u * 1.6, u * 2.3, u * 0.9]}; };
const man = (C: Cast, t: number) => {
  const p = manFeet(t); const m = guy(C, 'nai', p[0], p[2], Math.PI / 2, t, {face: manFace(t), y: p[1]});
  const kick = t < ev('unlodge') ? 0.035 * Math.sin(t * 9) + 0.02 * Math.sin(t * 13.7) : 0;
  const q = new THREE.Quaternion().slerpQuaternions(Q0, Q1, upK(t)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), kick + 0.15 * pullK(t)));
  m.w.quaternion.copy(q); m.w.scale.z *= 0.12; m.w.updateMatrixWorld(true);
  const nodes: React.ReactNode[] = [];
  if (t < ev('unlodge')) { const hang = (s: number): V3 => [WIN_FEET[0] + 0.005 * s, (s > 0 ? 1.72 : 1.5) + 0.02 * Math.sin(t * 2 + s), -2.3]; hand(m.I, 'R', hang(1), 'open'); hand(m.I, 'L', hang(-1), 'open'); }
  const hip = bw(m.I, 'Bip01_Spine'); const ph = phoneAt(t, hip);
  if (ph) { nodes.push(<Phone key="ph" position={ph.p} rotation={ph.r} lit={1} />); if (t > ev('miss') - 0.5) hand(m.I, 'R', lerp3(add(hip, [0.15, -0.2, 0.2]), add(ph.p, [0, 0, -0.12]), sm((t - ev('miss') + 0.5) / 0.4)), 'claw'); }
  m.w.updateMatrixWorld(true); flyOn(m.I);
  return {...m, hip, node: <><P o={m.w} />{nodes}</>}; };

// ---- his shadow: under the cloak at `drop`, slides through the bars to under his feet; never floats
const SH0: V3 = [0.42, 0.006, 1.75], SH_END: V3 = [0.6, 0.006, -1.42];
const shadow = (t: number) => { if (t < ev('drop')) return null; const k = sm((t - ev('slide0')) / (ev('slide1') - ev('slide0')));
  return <ShadowSheet position={lerp3(SH0, SH_END, k)} yaw={Math.PI} pose="broom" peel={0} eyes="none" s={0.95} />; };

// ---- the guard (masked)
const masks = new WeakMap<any, THREE.Object3D>();
const maskOn = (I: any) => { let m = masks.get(I); if (!m) { m = makeGasMask(); headFr(I).add(m); masks.set(I, m); } m.visible = true; m.position.y = 0; return m; };
const BARS24: V3 = [1.05, 0, 2.4];
const AIR: V3 = [X22 + 0.35, 0, 2.0];
type GS = {p: V3; yaw: number; y: number; rx: number};
const guardAt = (t: number): GS => {
  if (t < cut('slide') + 1.0) return {p: BARS24, yaw: -Math.PI / 2 - 0.4, y: 0, rx: 0};
  if (t < ev('swim0')) return {p: DESK, yaw: Math.PI, y: liftK(t) * (0.9 + 0.05 * Math.sin(t * 1.2)), rx: 0.15 * liftK(t) * Math.sin(t * 0.8)};
  const arrive = ev('aircuff') - 0.5; const k = cl((t - ev('swim0')) / (arrive - ev('swim0')));
  const p = lerp3(DESK, AIR, sm(k) * 0.3 + k * 0.7); const y = 0.9 - 0.55 * sm((k - 0.8) / 0.2) + 0.06 * Math.sin(t * 2.4);
  return k < 1 ? {p, yaw: -Math.PI / 2 - 0.25 * (1 - k), y, rx: 0.65 * (1 - sm((k - 0.85) / 0.15))} : {p: AIR, yaw: Math.PI, y: 0.35 + 0.04 * Math.sin(t * 1.5), rx: 0.05};
};
const cuffSize = (t: number) => lerp(3.2, 0.6, sm((t - ev('aircuff')) / 0.12));
const AIRCUFF: V3 = [AIR[0] + 0.02, 1.55, 1.62];
const guard = (C: Cast, t: number, face = 'angry') => {
  const s = guardAt(t); const g = guy(C, 'offA', s.p[0], s.p[2], s.yaw, t, {face, y: s.y, rx: s.rx}); maskOn(g.I);
  const nodes: React.ReactNode[] = [];
  const fw: V3 = [Math.sin(s.yaw), 0, Math.cos(s.yaw)], lf: V3 = [Math.cos(s.yaw), 0, -Math.sin(s.yaw)];
  if (t < ev('drop')) hand(g.I, 'R', [0.55, 1.42, 2.15], 'open');
  else if (t > ev('swim0') && t < ev('aircuff') - 0.5) { const head = bw(g.I, 'Bip01_Head'); const ph = (t - ev('swim0')) * 4.2;
    for (const [sd, sg] of [['R', -1], ['L', 1]] as const) { const sw = 0.5 + 0.5 * Math.sin(ph); hand(g.I, sd, add(head, [fw[0] * (0.25 + 0.2 * sw) + lf[0] * sg * (0.18 + 0.28 * (1 - sw)), -0.2, fw[2] * (0.25 + 0.2 * sw) + lf[2] * sg * (0.18 + 0.28 * (1 - sw))]), 'open'); } }
  else if (t > ev('aircuff') - 0.5 && t < ev('aircuff') + 2.5) { hand(g.I, 'R', add(AIRCUFF, [0.04, -0.03, 0.12]), 'fist');
    nodes.push(<group key="c" position={AIRCUFF}><Handcuffs k={1} rotation={[Math.PI / 2, 0, 0]} size={cuffSize(t)} /></group>); }
  g.w.updateMatrixWorld(true); return {...g, node: <><P o={g.w} />{nodes}</>}; };
const hooded = (t: number) => { if (t > ev('drop') + 0.3) return null; const k = sm((t - ev('drop')) / 0.3);
  return <group position={[0.42, 0, 2.02]} scale={[1 + 0.3 * k, 1 - k * 0.95, 1 + 0.3 * k]}><Hooded position={[0, 0, 0]} yaw={Math.PI} t={t} /></group>; };

// =====================================================================================================
const lamp = (p: V3, i = 1.4, c = '#9AAEE6') => <pointLight position={p} color={c} intensity={i} distance={4} decay={1.4} />;
const qs = (t: number, a = 0.03) => a * quakeK(t);
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0, outside at night: his flat face out of the wall, awake; something is happening inside (he can't see it)
    const m = man(C, t);
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [2.5, 2.25, -3.95], look: [0.75, 1.98, -2.45], fov: 44}, lt, {arrive: 0.08, push: 0.22}), bg: OUT_BG};
  },
  cloak: (t, lt, C) => {
    // at the bars of 24: the hood drops — nobody inside it; on the floor, a flat dark shape holding a broom
    const g = guard(C, t, 'half');
    return {node: <>{block(t, {only: [24, 19, 18]})}{g.node}{hooded(t)}{lamp([0.9, 2.3, 3.4], 1.6)}</>,
      cam: mv({pos: [-1.0, 2.3, 4.1], look: [0.45, 0.05, 2.45], fov: 48}, lt, {arrive: 0.04, push: 0.14}), bg: NIGHT_BG};
  },
  slide: (t, lt, C) => {
    // floor level: the shadow slides through the gap under the bars, into the cell
    const g = guard(C, t, 'half');
    return {node: <>{block(t, {only: [24]})}{g.node}{lamp([0.8, 1.2, 2.6], 1.6)}</>,
      cam: mv({pos: [1.55, 0.45, 3.4], look: [0.5, 0.0, 0.9], fov: 50}, lt, {arrive: 0.04, push: 0.16}), bg: NIGHT_BG};
  },
  stick: (t, lt, C) => {
    // inside 24: his legs up in the window; the shadow arrives on the floor right under his feet
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.2, 1.6, 0.4], 1.6)}</>,
      cam: mv({pos: [-1.0, 1.0, 1.2], look: [0.6, 1.0, -1.25], fov: 54}, lt, {arrive: 0.04, push: 0.15}), bg: NIGHT_BG};
  },
  earth: (t, lt, C) => {
    // "คืนนั้น": cell 18, the Earth in its giant cuffs, the Moon going round it
    return {node: <>{block(t, {only: [18, 24, 23]})}{lamp([X18 + 0.8, 2.2, 2.6], 1.2)}</>,
      cam: mv({pos: [X18 + 1.1, 1.65, 3.6], look: [X18, 1.15, -0.1], fov: 50}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  earth2: (t, lt, C) => {
    // close: the Earth begins to tremble
    return {node: <>{block(t, {only: [18]})}{lamp([X18 + 0.6, 1.6, 2.0], 1.2)}</>,
      cam: mv({pos: [X18 + 0.65, 1.25, 2.45], look: [X18 + 0.05, 1.1, -0.15], fov: 44}, lt, {arrive: 0.04, push: 0.14, shake: 0.004}), bg: NIGHT_BG};
  },
  aim: (t, lt, C) => {
    // the target: inside 24, next to the chalk plan, the shared wall shudders and a hairline crack runs down it (a flat wall: the camera itself moves)
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.4, 2.0, 0.6], 1.6)}</>,
      cam: mv({pos: [0.85, 1.6 - 0.12 * lt, 0.95 + 0.35 * lt], look: [-1.48, 1.7, 0.5 + 0.15 * lt], fov: 46}, lt, {arrive: 0.06, push: 0.22, shake: 0.012}), bg: NIGHT_BG};
  },
  quake: (t, lt, C) => {
    // the whole block quakes: wide down the corridor from the far end
    const m = man(C, t);
    return {node: <>{block(t)}{m.node}</>, cam: mv({pos: [7.6, 2.1, 6.2], look: [-3.0, 1.0, 1.0], fov: 50}, lt, {arrive: 0.02, push: 0.1, shake: qs(t)}), bg: NIGHT_BG};
  },
  collapse: (t, lt, C) => {
    // a back wall bursts open: rubble, dust, the night sky through the hole
    return {node: <>{block(t, {only: [22, 23]})}{lamp([X22 + 0.6, 2.2, 1.6], 1.6)}</>,
      cam: mv({pos: [X22 + 0.95, 1.4, 3.1], look: [X22, 1.15, -1.2], fov: 50}, lt, {arrive: 0.03, push: 0.12, shake: near(t, [ev('collapse')], 0.25) ? 0.02 : qs(t)}), bg: NIGHT_BG};
  },
  wrong: (t, lt, C) => {
    // from the bars of 24, looking all the way down the row: 24 intact, the dust settling at the far end
    const m = man(C, t);
    return {node: <>{block(t)}{m.node}</>, cam: mv({pos: [1.5, 1.6, 3.0], look: [-8.6, 1.2, 0.8], fov: 40}, lt, {arrive: 0.03, push: 0.12, shake: qs(t, 0.015)}), bg: NIGHT_BG};
  },
  cell22: (t, lt, C) => {
    // frontal: "ห้อง 22", a hole in its back wall — and hanging in the middle, gravity: cuffs round nothing, "g = 9.8", a red arrow
    return {node: <>{block(t, {only: [22, 23]})}{lamp([X22, 2.3, 2.4], 1.8)}</>,
      cam: mv({pos: [X22, 1.6, 4.3], look: [X22, 1.45, 0.0], fov: 42}, lt, {arrive: 0.04, push: 0.12}), bg: NIGHT_BG};
  },
  gravity: (t, lt, C) => {
    // close on the tag: "ผู้ต้องหา · g = 9.8"
    return {node: <>{block(t, {only: [22]})}{lamp([X22 + 0.6, 1.8, 1.0], 1.6)}</>,
      cam: mv({pos: [X22 + 0.55, 1.5, 0.95], look: [X22 + 0.25, 1.45, 0.0], fov: 42}, lt, {arrive: 0.04, push: 0.12}), bg: NIGHT_BG};
  },
  escape: (t, lt, C) => {
    // the red arrow slips down out of the cuffs and out through the hole into the night
    return {node: <>{block(t, {only: [22]})}{lamp([X22 + 0.8, 2.0, 1.2], 1.6)}</>,
      cam: mv({pos: [X22 + 1.35, 1.45, 1.25], look: [X22, 1.25, -0.9], fov: 50}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  lift: (t, lt, C) => {
    // the corridor: the guard's desk, stool and cup, the cloak, the contract, jar 25 — all lifting off the floor
    const g = guard(C, t, 'wide');
    return {node: <>{block(t)}{g.node}</>, cam: mv({pos: [-0.6, 1.0, 6.9], look: [1.3, 1.0, 3.5], fov: 52}, lt, {arrive: 0.02, push: 0.1}), bg: NIGHT_BG};
  },
  lift2: (t, lt, C) => {
    // closer: the desk turning slowly in mid-air, the guard rising behind it with it
    const g = guard(C, t, 'wide');
    return {node: <>{block(t, {only: [24, 19]})}{g.node}{lamp([1.0, 2.4, 3.0], 1.5)}</>,
      cam: mv({pos: [-0.4, 1.1, 5.6], look: [1.3, 1.25, 3.6], fov: 46}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  man: (t, lt, C) => {
    // "ชายคนนี้": inside 24, his legs in the window, kicking; the shadow below
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.9, 2.2, 0.6], 1.6)}</>,
      cam: mv({pos: [1.4, 1.55, 0.45], look: [0.55, 1.95, -1.2], fov: 50}, lt, {arrive: 0.04, push: 0.12}), bg: NIGHT_BG};
  },
  unlodge: (t, lt, C) => {
    // he slides back in out of the window and rolls over as he rises
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.9, 2.3, 0.8], 1.6)}</>,
      cam: mv({pos: [1.4, 1.3, 1.3], look: [0.4, 2.1, -0.4], fov: 54}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  ceiling: (t, lt, C) => {
    // from the floor looking up: bump — flat against the ceiling, face down
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.6, 1.4, 0.6], 1.8)}</>,
      cam: mv({pos: [1.05, 0.55, 1.3], look: [0.55, 2.7, -0.1], fov: 56}, lt, {arrive: 0.03, push: 0.22, roll: 4, side: 0.6, shake: near(t, [ev('ceil')], 0.1) ? 0.006 : 0}), bg: NIGHT_BG};
  },
  plate: (t, lt, C) => {
    // the institution, frontal: cell 22 with its hole, the empty cuffs drifting up — "g = 0". The plate drops.
    return {node: <>{block(t, {only: [22, 23]})}{lamp([X22, 2.3, 2.4], 1.8)}</>,
      cam: mv({pos: [X22, 1.55, 4.7], look: [X22, 1.55, 0.0], fov: 40}, lt, {arrive: 0.05, push: 0.12, shake: near(t, [ev('plate')], 0.1) ? 0.012 : 0}), bg: NIGHT_BG};
  },
  phone: (t, lt, C) => {
    // close under the ceiling: his phone slips out of his pocket and drifts away
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([1.0, 2.0, 1.0], 1.8)}</>,
      cam: mv({pos: [1.25, 2.05, 1.0], look: [m.hip[0] + 0.1, m.hip[1] - 0.2, m.hip[2] + 0.2], fov: 46}, lt, {arrive: 0.04, push: 0.22, roll: 4, side: 0.6}), bg: NIGHT_BG};
  },
  miss: (t, lt, C) => {
    // his hand grabs — and misses; the phone tumbles off towards the bars
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.6, 1.8, 1.4], 1.8)}</>,
      cam: mv({pos: [-0.35, 1.75, 1.15], look: [0.7, 2.3, 0.5], fov: 50}, lt, {arrive: 0.04, push: 0.22, roll: 4, side: 0.6}), bg: NIGHT_BG};
  },
  swim: (t, lt, C) => {
    // the guard, masked, swimming through the air down the corridor
    const g = guard(C, t, 'angry'); const s = guardAt(t);
    return {node: <>{block(t)}{g.node}{lamp([s.p[0] + 0.8, 2.4, 3.6], 1.6)}</>,
      cam: mv({pos: [s.p[0] + 2.0, 1.7, 5.2], look: [s.p[0] - 0.4, 1.4, s.p[2]], fov: 48}, lt, {arrive: 0.02, push: 0.06}), bg: NIGHT_BG};
  },
  aircuff: (t, lt, C) => {
    // close at the bars of 22: snap — the cuffs close on nothing
    const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [22]})}{g.node}{lamp([AIR[0] + 0.5, 2.0, 2.4], 1.6)}</>,
      cam: mv({pos: [AIR[0] - 0.15, 1.65, 0.85], look: [AIRCUFF[0], AIRCUFF[1] + 0.05, AIRCUFF[2]], fov: 44}, lt, {arrive: 0.04, push: 0.1, shake: near(t, [ev('aircuff')], 0.08) ? 0.006 : 0}), bg: NIGHT_BG};
  },
  allfloat: (t, lt, C) => {
    // high over the corridor: the whole block adrift — desk, jar, fridge, durian, the Earth, the guard
    const g = guard(C, t, 'angry'); const m = man(C, t);
    return {node: <>{block(t)}{g.node}{m.node}</>, cam: mv({pos: [-2.2, 2.9, 7.2], look: [0.9, 1.3, 2.9], fov: 58}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  shadow: (t, lt, C) => {
    // through the bars of 24: him on the ceiling — and on the floor below, his shadow, lying where it lay
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.8, 1.3, 1.2], 2.0)}</>,
      cam: mv({pos: [1.25, 1.35, 3.6], look: [0.5, 1.3, -0.4], fov: 46}, lt, {arrive: 0.03, push: 0.22, roll: 4, side: 0.6}), bg: NIGHT_BG};
  },
  stuck: (t, lt, C) => {
    // straight down at the floor: the shadow with its broom, flat, not floating
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.6, 1.5, 0.0], 2.0)}</>,
      cam: mv({pos: [0.65, 1.95, 0.75], look: [0.6, 0.0, -0.45], fov: 56}, lt, {arrive: 0.03, push: 0.22, roll: 4, side: 0.6}), bg: NIGHT_BG};
  },
  moon: (t, lt, C) => {
    // cell 18: the Moon, still circling the floating Earth, glows brighter
    return {node: <>{block(t, {only: [18, 24]})}{lamp([X18 + 0.8, 2.2, 2.4], 1.2)}</>,
      cam: mv({pos: [X18 + 1.2, 3.2, 4.4], look: add(earthC(t), [0, 0.7, 0]), fov: 58}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  pull: (t, lt, C) => {
    // under the ceiling of 24: he begins to slide towards the bars — towards 18
    const m = man(C, t);
    return {node: <>{block(t, {only: [24, 18]})}{m.node}{lamp([0.4, 2.0, 1.6], 1.8, '#FFF0C8')}</>,
      cam: mv({pos: [1.3, 1.85, 2.7], look: [0.2, 2.45, 0.2], fov: 50}, lt, {arrive: 0.03, push: 0.22, roll: 4, side: 0.6}), bg: NIGHT_BG};
  },
  pull2: (t, lt, C) => {
    // from the corridor: moonlight from 18 on him as he drifts; his shadow stays behind on the floor. Black.
    const m = man(C, t);
    return {node: <>{block(t, {only: [24, 18]})}{m.node}{lamp([-1.2, 2.2, 2.0], 1.6, '#FFF0C8')}</>,
      cam: mv({pos: [0.95, 1.25, 1.15], look: [-0.05, 2.55, -0.1], fov: 58}, lt, {arrive: 0, push: 0.22, roll: 4, side: 0.6}), bg: NIGHT_BG};
  },
};
void [cl, hw, EAR_R, FAN_S];
