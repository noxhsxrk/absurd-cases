import React from 'react';
import * as THREE from 'three';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {Mosquito, Jar} from '../AbsurdEp1/props';
import {CellPlate, Fan} from '../AbsurdEp2/props';
import {Durian} from '../AbsurdEp4/props';
import {PoliceCar} from '../AbsurdEp7/props';
import {ShadowSheet} from '../AbsurdEp8/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {Moon} from '../AbsurdEp15/props';
import {Phone, Accused} from '../AbsurdEp16/props';
import {Icebox, ICEBOX, Fire} from '../AbsurdEp17/props';
import {makeFly} from '../AbsurdEp19/props';
import {Contract} from '../AbsurdEp20/props';
import {WallPlan, makeGasMask} from '../AbsurdEp21/props';
import {Window24, BlockOutside, WALL_Z} from '../AbsurdEp22/props';
import {Wrap, HazardSign, GuardPost} from '../AbsurdEp23/props';
import {WallHole, Rubble, WallCrack, Cloak, GravityArrow} from '../AbsurdEp24/props';
import {Ring, Chain} from '../AbsurdEp25/props';
import {SirenLights} from '../absurdkit';
import {ps, body, hideProps, P, CamRig, mv, near, sm, V3, Cast, ShotOut, hand, hw, bw, headFr} from '../lifekit/stage';
import {FireBall, MeltBars, Extinguisher, HORN, Jet26} from './props';
import {Handcuffs} from '../AbsurdEp1/props';

export {CamRig};
/** EP26 · แก๊งห้อง 24 S1E7 ผู้คุมแหกคุก. Night, weightless, where EP25 stopped: the fridge door in 23 is open; the fire flares and floats out.
 *  With no gravity a flame has no "up": it burns as a ball. It drifts to the bars of 23, along to 22, back to 18 — every bar it touches melts.
 *  In 18 it hangs at the front of the orbit; the chain between his wrist and the Moon passes through it and parts; he flies off the orbit and
 *  out through the melted bars. Helping a prisoner escape! He calls; the guard, right there at 18, answers, grabs the floating extinguisher and
 *  sprays the fire — the recoil shoots him backwards down the corridor, into 22 and out through the hole. Outside there is gravity: he stops,
 *  hangs, drops. The police outside run over and cuff him — escaping. That night the block has no guard.
 *
 *  LAYOUT — the EP24/25 block, everything afloat: 22 (hole, empty cuffs g = 0) · 23 fridge · 18 Earth + Moon · 24 (his shadow on the floor) ·
 *  19 wrapped fan · 20 durian. Cells every 3.05 on x, bars at z 1.5, corridor z 1.5…8. End walls x −10.7 / 9.8.
 *  fire    in the fridge on its shelf until `fireout`; then a FireBall on the keyed path FIRE_K (23 → bars 23 → bars 22 → bars 18 → the
 *          front of the orbit at `cut` → out to the corridor in front of 24 by `spray`, then slow drift).
 *  melt    MeltBars per cell: 23 at `m23`, 22 at `m22`, 18 at `m18` (gap 1.05 m each side of y 1.45 — a man fits). 24, 19, 20 stay barred.
 *  him     EP25's orbit (r 1.1, lying flat in the orbit plane, thin axis vertical), phased so he is at the front (a = π/2) at `cut`; the
 *          Moon trails 0.35 s. From `free0` a curve out through the melted bars to FREE (X18 + 1.3, z 3.0), upright, facing +z (thin axis z).
 *  guard   offA, masked, floating at G18 (X18 + 0.5, z 1.95) facing −z (EP25 end). Phone at `ring`/`answer`, turns +x and grabs EXT0 at `grab`,
 *          sprays +x at `spray`; from `spray` the recoil carries him −x down the corridor (GUARD_K) into 22 through the melted bars, out of
 *          the hole at `hole`, out at `out`, hangs at HANG by `hang`, drops to the ground at `land`.
 *  outside the EP22 yard: BlockOutside (+ the wall beyond x −9.6 for 22), hole on the outer face at (X22, 1.3, WALL_Z); EP22's ten cars on
 *          their arc; offB, cmd2, cmd3 run from car 0 and cuff him on the ground at `cuff`.
 *
 *  TRAPS
 *  1. Flat man: in orbit his thin axis is vertical — film from ≥ 35° above. Free in the corridor he faces +z — film from the corridor.
 *  2. The fire must touch every bar that melts: the melt time of each cell = when FIRE_K passes it.
 *  3. The chain must visibly pass THROUGH the fire at `cut`: fire sits at the chain midpoint of that moment (CUT_AT).
 *  4. The guard flies backwards: horn points +x, he moves −x. The jet keeps going until he is through the hole.
 *  5. Inside: no gravity, everything floats. Outside: gravity — the guard falls, nothing outside floats.
 *  6. His phone: in his RIGHT hand (EP25 end), at his ear from `dial`.
 *  7. The hole on the outside wall must line up with the inside one (x X22, y 1.3).
 *  8. The shadow stays on the floor of 24 the whole time. */
const cut_ = (name: string) => SHOTS.find((x) => x.name === name)!.t0;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CW = 3.05, X22 = -3 * CW, X23 = -2 * CW, X18 = -CW, X19 = CW, X20 = 2 * CW;
const FAN: V3 = [X19 - 0.37, 0, 1.3], FAN_S = 1.35, BAR_X = X19 - 0.25;
const EAR_R: V3 = [-12, 12, 2];
const NIGHT_BG = {color: '#0E1424'}, OUT_BG = {color: '#101830'};
const POST: V3 = [1.6, 0, 3.9];
const GRAV: V3 = [X22, 1.5, 0.0];
const BODY = 1.75;

// ---- weightless everything (EP24's end state)
const flo = (t: number, h: number, seed: number): {d: V3; r: V3} => ({d: [0.08 * Math.sin(t * 0.6 + seed), h + 0.06 * Math.sin(t * 1.1 + seed), 0.08 * Math.cos(t * 0.5 + seed)],
  r: [0.35 * Math.sin(t * 0.4 + seed), 0.3 * t + seed, 0.3 * Math.cos(t * 0.3 + seed)]});
const Floating: React.FC<{t: number; h: number; seed: number; at?: V3; spin?: boolean; children: React.ReactNode}> = ({t, h, seed, at = [0, 0, 0], spin = true, children}) => { const f = flo(t, h, seed);
  return <group position={add(at, f.d)}><group rotation={spin ? f.r : [0.05 * Math.sin(t * 0.4), 0.08 * Math.sin(t * 0.3), 0.05 * Math.cos(t * 0.5)]}>{children}</group></group>; };

// ---- the Earth, the orbits (EP25), phased so he is at the front at `cut`
const EARTH_C: V3 = [X18, 1.08, -0.15], EARTH_R = 0.95;
const earthC = (t: number): V3 => add(EARTH_C, [0, 0.22 + 0.05 * Math.sin(t), 0]);
const O = (t: number): V3 => add(earthC(t), [0, 0.25, 0.05]);
const R_MAN = 1.1, R_MOON = 1.2;
const W = 2 * Math.PI / 3.17;
const ang = (t: number) => Math.PI / 2 - W * (t - ev('cut'));
const LAG = W * 0.35;
const moonAng = (t: number) => ang(t) + LAG;
const moonAt = (t: number): V3 => { const c = earthC(t), a = moonAng(t); return [c[0] + Math.cos(a) * R_MOON, c[1] + 0.97, c[2] + 0.05 + Math.sin(a) * R_MOON]; };
const fridgeP: V3 = [X23 + 0.1, 0, -0.6];
const DURIAN: V3 = [X20 + 0.1, 0.32, -0.5];
const fanYaw = (t: number) => t > ev('look') - 0.3 ? lerp(0.85 * Math.sin(t * Math.PI * 2 / 3.2), 1.4, sm((t - ev('look') + 0.3) / 0.5)) : 0.85 * Math.sin(t * Math.PI * 2 / 3.2);

// ---- the fire's path (world), keyed on the plan. Before `fireout` it is EP17's fire on the fridge shelf.
const shelfAt = (t: number): V3 => { const f = flo(t, 0.6, 2); return add(add(fridgeP, f.d), [0, ICEBOX.shelf + 0.05, 0]); };
const CUT_AT = (): V3 => { const t = ev('cut'), o = O(t); const me: V3 = [o[0] + 0.25, o[1] + 0.05, o[2] + R_MAN], mo = moonAt(t); return lerp3(me, mo, 0.5); };
const FIRE_K = (): [number, V3][] => [[ev('fireout'), shelfAt(ev('fireout'))], [ev('ball'), [X23 + 0.1, 1.55, 0.8]], [ev('m23'), [X23 - 0.2, 1.45, 1.5]],
  [ev('m22'), [X22 + 0.3, 1.45, 1.6]], [ev('m18') - 0.25, [X18 - 0.9, 1.5, 1.75]], [ev('m18'), [X18 - 0.2, 1.5, 1.5]], [ev('cut') - 0.35, CUT_AT()], [ev('cut') + 0.4, add(CUT_AT(), [0, 0, 0.05])],
  [ev('spray'), [X18 + 1.6, 1.6, 2.3]], [ev('land'), [X18 + 1.9, 1.7, 2.4]], [ev('end') + 3, [X18 + 2.6, 1.9, 2.6]]];
const fireAt = (t: number): V3 => { const K = FIRE_K(); if (t <= K[0][0]) return K[0][1];
  let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++; const k = sm((t - K[i][0]) / (K[i + 1][0] - K[i][0]));
  return add(lerp3(K[i][1], K[i + 1][1], k), [0.03 * Math.sin(t * 2.1), 0.03 * Math.sin(t * 1.7), 0.03 * Math.cos(t * 1.9)]); };
const fireR = (t: number) => t < ev('ball') ? lerp(0.16, 0.24, sm((t - ev('fireout')) / (ev('ball') - ev('fireout')))) : 0.24 - 0.05 * sm((t - ev('spray')) / 0.6) * (1 - sm((t - ev('spray') - 1.4) / 1.0));
const freeFire = (t: number) => t < ev('fireout') ? null : <FireBall position={fireAt(t)} t={t} r={fireR(t)} light={1.6} />;

// ---- melting
const MELT: Record<number, string> = {23: 'm23', 22: 'm22', 18: 'm18'};
const meltK = (no: number, t: number) => MELT[no] ? sm((t - ev(MELT[no]) + 0.15) / 0.7) : 0;
const heatK = (no: number, t: number) => MELT[no] ? sm((t - ev(MELT[no]) + 0.25) / 0.3) * (1 - 0.8 * sm((t - ev(MELT[no]) - 1.0) / 3.0)) : 0;

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
  : who === 'fridge' ? <Floating t={t} h={0.6} seed={2} at={fridgeP} spin={false}><Icebox position={[0, 0, 0]} door={1} glow={t < ev('fireout') + 0.3 ? 2.1 : lerp(2.1, 0.5, sm((t - ev('fireout') - 0.3) / 0.6))} frost={0.3} />
    {t < ev('fireout') && <Fire position={[0, ICEBOX.shelf + 0.02, 0]} t={t} size={0.55 + 0.15 * sm((t - ev('flare')) / 0.5)} light={1.3 + 0.6 * sm((t - ev('flare')) / 0.5)} />}</Floating>
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
const EXT0: V3 = [X18 + 1.15, 2.25, 2.7];   // the extinguisher, adrift by the guard (it came off its wall bracket in EP24's quake)
const block = (t: number, o: {only?: number[]} = {}) => <>
  {CELLS.filter((c) => !o.only || o.only.includes(c.no)).map((c) => <group key={c.no}><group position={[c.x, 0, 0]}>
    <Cell t={t} days={0.98} marks={c.no === 24 ? 11 : 9 + (c.no % 5)} rails={c.no === 24 ? [0.04, 2.6] : undefined} bars={!MELT[c.no]} />
    {MELT[c.no] && <MeltBars t={t} m={meltK(c.no, t)} heat={heatK(c.no, t)} seed={c.no} />}
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
  {t < ev('grab') && <Floating t={t} h={0} seed={11} at={EXT0}><Extinguisher position={[0, -0.3, 0]} rotation={[0.4, 0.6, 0.3]} /></Floating>}
  {[-7.5, -3, 1.5, 6].map((x) => <pointLight key={x} position={[x, 2.6, 3.4]} color="#5A6EA8" intensity={0.55} distance={7} decay={1.5} />)}
  <pointLight position={[0.9, 2.4, -0.4]} color="#9AAEE6" intensity={1.4} distance={3} decay={1.4} />
  {jar25(t)}{freeFire(t)}</>;

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
const orbitPose = (t: number): {feet: V3; q: THREE.Quaternion} => { const a = ang(t), o = O(t);
  const c: V3 = [o[0] + Math.cos(a) * R_MAN, o[1], o[2] + Math.sin(a) * R_MAN]; const head: V3 = [Math.sin(a), 0, -Math.cos(a)];
  return {feet: add(c, [-head[0] * BODY / 2, 0, -head[2] * BODY / 2]), q: basis([0, 1, 0], head)}; };
const FREE: V3 = [X18 + 2.3, 0.5, 3.4];
const Q_UP = basis([0, 0, 1], [0, 1, 0]);
const DRIFT_TO: V3 = [X23 + 1.6, 0.5, 3.0];   // after the guard is gone he drifts down the corridor towards the hole
const freeFeet = (t: number): V3 => add(lerp3(FREE, DRIFT_TO, sm((t - ev('land')) / (ev('end') + 1.5 - ev('land')))), [0.04 * Math.sin(t * 0.9), 0.05 * Math.sin(t * 1.3), 0.03 * Math.cos(t * 0.7)]);
const manPose = (t: number): {feet: V3; q: THREE.Quaternion} => {
  if (t < ev('free0')) return orbitPose(t);
  const A = orbitPose(ev('free0')), k = cl((t - ev('free0')) / (ev('free1') - ev('free0'))); const u = 1 - Math.pow(1 - k, 2.2);
  const B: V3 = [X18 + 1.2, 1.0, 1.6], Cc = freeFeet(t);
  const p = lerp3(lerp3(A.feet, B, u), lerp3(B, Cc, u), u);
  const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (1 - u) * 0.0 + Math.sin(u * Math.PI) * 0.9);
  return {feet: p, q: new THREE.Quaternion().slerpQuaternions(A.q, Q_UP, sm(u * 1.15)).multiply(spin)}; };
const manFace = (t: number) => t < ev('cut') ? 'closed' : t < ev('free1') ? 'wide' : t < ev('dial') - 0.2 ? 'open' : t < ev('answer') + 0.6 ? 'shout' : 'wide';
const callK = (t: number) => sm((t - ev('dial') + 0.3) / 0.3) * (1 - sm((t - ev('answer') - 0.7) / 0.3));
const man = (C: Cast, t: number) => {
  const {feet, q} = manPose(t); const lookAt: V3 = t < ev('spray') ? add(fireAt(t), [0, 0.2, 0]) : t < ev('hole') ? guardFeet(t) : [X22, 1.3, -1.4];
  const m = guy(C, 'nai', feet[0], feet[2], 0, t, {face: manFace(t), y: feet[1], ...(t > ev('free1') ? {look: lookAt} : {})});
  m.w.quaternion.copy(q); m.w.scale.z *= 0.12; m.w.updateMatrixWorld(true);
  const ck = callK(t); let ph: V3;
  if (ck > 0.01) { const hd = bw(m.I, 'Bip01_Head'); const f = facing(m.I); const r = new THREE.Vector3(0, 1, 0).cross(f).negate();   // his right
    const ear: V3 = [hd[0] + r.x * 0.15 + f.x * 0.025, hd[1] - 0.04, hd[2] + r.z * 0.15 + f.z * 0.025];  /* he is flattened 0.12 along f: a world offset along f is 8x in the rig, so keep it tiny */ ph = lerp3(bw(m.I, 'Bip01_R_Hand'), ear, ck); hand(m.I, 'R', add(ph, [0, -0.07, 0]), 'cup'); m.w.updateMatrixWorld(true); ph = add(bw(m.I, 'Bip01_R_Hand'), [0, 0.07, 0]); }
  else ph = bw(m.I, 'Bip01_R_Hand');
  m.w.updateMatrixWorld(true); flyOn(m.I);
  const wristL = bw(m.I, 'Bip01_L_Hand');
  return {...m, node: <><P o={m.w} /><Phone position={ph} quaternion={q} lit={1} /></>, wristL, head: bw(m.I, 'Bip01_Head')}; };
/** the chain wrist ↔ Moon (EP25 end): whole until `cut`, then a stub on each ring, glowing where it parted */
const chains = (t: number, wrist: V3) => { const mp = moonAt(t);
  if (t < ev('cut')) { const hot = sm((t - ev('cut') + 0.4) / 0.35);
    return <><Ring p={wrist} r={0.05} /><Ring p={mp} r={0.33} /><Chain a={wrist} b={mp} sag={0} />{hot > 0.05 && <mesh position={lerp3(wrist, mp, 0.5)} scale={0.04 + 0.03 * hot}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#FF8A2E" toneMapped={false} /></mesh>}</>; }
  const d = new THREE.Vector3(mp[0] - wrist[0], mp[1] - wrist[1], mp[2] - wrist[2]).normalize();
  const sw: V3 = [wrist[0] + d.x * 0.16, wrist[1] + d.y * 0.16 - 0.03, wrist[2] + d.z * 0.16], sm2: V3 = [mp[0] - d.x * 0.42, mp[1] - d.y * 0.42, mp[2] - d.z * 0.42];
  return <><Ring p={wrist} r={0.05} /><Chain a={wrist} b={sw} sag={0.01} /><Ring p={mp} r={0.33} /><Chain a={mp} b={sm2} sag={0.01} /></>; };

/** which way a rig faces, from its shoulders: up × (right shoulder − left shoulder) */
const facing = (I: any): THREE.Vector3 => { const l = bw(I, 'Bip01_L_UpperArm'), r = bw(I, 'Bip01_R_UpperArm'); return new THREE.Vector3(0, 1, 0).cross(new THREE.Vector3(r[0] - l[0], 0, r[2] - l[2])).normalize(); };
// ---- the guard (masked, weightless inside; gravity outside)
const masks = new WeakMap<any, THREE.Object3D>();
const maskOn = (I: any) => { let m = masks.get(I); if (!m) { m = makeGasMask(); headFr(I).add(m); masks.set(I, m); } m.visible = true; m.position.y = 0; return m; };
const G18: V3 = [X18 + 0.5, 0.4, 1.95];
/** his flight, feet origin: creep from `spray`, the shove at `kick`, down the corridor, into 22 through the melted bars, out of the hole */
const GUARD_K: V3[] = [G18, [X18 + 0.2, 0.55, 2.35], [X23 + 0.6, 0.75, 2.5], [X22 + 0.9, 0.8, 2.1], [X22 + 0.15, 0.75, 1.0], [X22, 0.75, -1.2], [X22, 0.72, -2.0]];
const gCurve = new THREE.CatmullRomCurve3(GUARD_K.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
const HANG: V3 = [X22, 0.95, -3.3];
const gU = (t: number) => { if (t < ev('spray')) return 0; if (t < ev('kick')) return 0.05 * sm((t - ev('spray')) / (ev('kick') - ev('spray')));
  const k = cl((t - ev('kick')) / (ev('out') - ev('kick'))); return 0.05 + 0.95 * Math.pow(k, 1.35); };
const guardFeet = (t: number): V3 => { if (t < ev('out')) { const p = gCurve.getPointAt(gU(t)); return [p.x, p.y, p.z]; }
  const last = GUARD_K[GUARD_K.length - 1];
  if (t < ev('land') - 0.42) return lerp3(last, HANG, 1 - Math.pow(1 - cl((t - ev('out')) / (ev('hang') - ev('out'))), 2.5));
  const k = cl((t - ev('land') + 0.42) / 0.42); return [HANG[0], HANG[1] * (1 - k * k), HANG[2] - 0.15 * k]; };
type GS = {p: V3; yaw: number; y: number; rx: number; phase: 'post' | 'fly' | 'out' | 'ground'};
const guardState = (t: number): GS => {
  if (t < ev('spray')) { const turn = sm((t - ev('grab') + 0.2) / 0.4); return {p: G18, yaw: lerp(Math.PI, Math.PI / 2, turn), y: 0.4 + 0.04 * Math.sin(t * 1.5), rx: 0.05, phase: 'post'}; }
  const f = guardFeet(t);
  if (t < ev('out')) { const u = gU(t); const back = sm((u - 0.05) / 0.25); const turn = sm((u - 0.62) / 0.18);   // leans back as he speeds up; turns his back to the hole
    return {p: [f[0], 0, f[2]], yaw: lerp(Math.PI / 2, 0, turn), y: f[1], rx: -1.15 * back, phase: 'fly'}; }
  if (t < ev('land')) { const sit = sm((t - ev('hang')) / 0.4); return {p: [f[0], 0, f[2]], yaw: 0, y: f[1], rx: lerp(-1.15, -0.25, sit), phase: 'out'}; }
  return {p: [HANG[0], 0, HANG[2] - 0.15], yaw: 0, y: 0, rx: 0, phase: 'ground'}; };
const guard = (C: Cast, t: number) => {
  const s = guardState(t); const face = t < ev('ring') ? 'angry' : t < ev('kick') ? 'half' : t < ev('land') ? 'wide' : 'shout';
  const g = guy(C, 'offA', s.p[0], s.p[2], s.yaw, t, s.phase === 'ground' ? {clip: 'sit_table_idle_neutral_01', face, y: -0.42} : {face, y: s.y, rx: s.rx}); maskOn(g.I);
  const nodes: React.ReactNode[] = [];
  // the phone: buzzing at his hip from `ring`, at his ear from `answer`, dropped when he grabs the extinguisher
  if (t > ev('ring') - 0.05 && t < ev('grab')) { const up = sm((t - ev('answer')) / 0.22); const lowF = add(bw(g.I, 'Bip01_Spine'), [0.0, -0.05, -0.22]);
    const ph = lerp3(lowF, hw(g.I, [12, 12, 2]), up); const buzz = t < ev('answer') ? 0.006 * Math.sin(t * 90) : 0;
    hand(g.I, 'L', add(ph, [buzz, -0.05, 0]), 'cup'); nodes.push(<Phone key="gp" position={add(ph, [buzz, 0, 0])} rotation={[0, s.yaw + Math.PI / 2 * up, 0.18 * up]} lit={1} />); }
  else if (t >= ev('grab')) { const u = t - ev('grab'); const near0 = add(bw(g.I, 'Bip01_Head'), [-0.3, 0.2, 0.2]);   // tumbles by his head, goes out of the hole with him, outside it drops to the ground
    const ground: V3 = [X22 + 0.7, 0.02, -3.0]; const k = t < ev('out') ? 0 : cl((t - ev('out') - 0.2) / 0.5);
    const dp = k > 0 ? lerp3(near0, ground, k * k) : near0; nodes.push(<Phone key="gp" position={dp} rotation={k >= 1 ? [-Math.PI / 2, 0, 0.4] : [u * 2, u * 3, 0.4]} lit={0.6} />); }
  // the extinguisher: grabbed from EXT0, held at the hip, horn forward (+x in his frame)
  if (t >= ev('grab') - 0.3) { const grab = sm((t - ev('grab') + 0.3) / 0.3);
    const fw = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw)); const spine = bw(g.I, 'Bip01_Spine');
    const hold: V3 = [spine[0] + fw.x * 0.32, spine[1] - 0.1, spine[2] + fw.z * 0.32];
    if (t < ev('grab')) hand(g.I, 'R', lerp3(add(spine, [fw.x * 0.3, 0.1, fw.z * 0.3]), EXT0, grab), 'claw');
    else if (s.phase === 'ground') {}
    else { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw - Math.PI / 2);
      const qa = g.w.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
      const bottom: V3 = [hold[0], hold[1] - 0.35, hold[2]];
      hand(g.I, 'R', add(hold, [0, 0.25, 0]), 'fist'); hand(g.I, 'L', add(hold, [fw.x * 0.18, 0.05, fw.z * 0.18]), 'fist');
      const horn = new THREE.Vector3(...HORN).applyQuaternion(qa).add(new THREE.Vector3(...bottom));
      const dir = new THREE.Vector3(1, 0, 0).applyQuaternion(qa);
      nodes.push(<Extinguisher key="ex" position={bottom} quaternion={qa} />);
      const on = t > ev('spray') && t < ev('out') + 0.3 ? 1 : 0;
      if (on) nodes.push(<Jet26 key="jet" from={[horn.x, horn.y, horn.z]} dir={[dir.x, dir.y, dir.z]} t={t} k={1} len={t < ev('kick') ? 1.6 : 2.4} />);
      void q; } }
  if (s.phase === 'ground') { const sp = bw(g.I, 'Bip01_Spine'); const fb = facing(g.I); const back: V3 = [sp[0] - fb.x * 0.22, sp[1] - 0.05, sp[2] - fb.z * 0.22];   // hands together in front of him (cuffed in front: readable from the front)
    const sd = new THREE.Vector3(0, 1, 0).cross(fb); hand(g.I, 'R', add(back, [-sd.x * 0.07, 0, -sd.z * 0.07]), 'fist'); hand(g.I, 'L', add(back, [sd.x * 0.07, 0, sd.z * 0.07]), 'fist');
    if (t > ev('cuff')) { g.w.updateMatrixWorld(true); const a = bw(g.I, 'Bip01_R_Hand'), b = bw(g.I, 'Bip01_L_Hand'); nodes.push(<React.Fragment key="cf"><Ring p={a} r={0.045} axis={[1, 0, 0]} /><Ring p={b} r={0.045} axis={[1, 0, 0]} /><Chain a={a} b={b} sag={0.01} /></React.Fragment>); }
    const ext = add(sp, [0.7, -0.55, -0.2]); nodes.push(<Extinguisher key="ex" position={[ext[0], 0, ext[2]]} rotation={[0, 0, Math.PI / 2]} />); }
  g.w.updateMatrixWorld(true); return {...g, node: <><P o={g.w} />{nodes}</>, s}; };

// =====================================================================================================
// OUTSIDE: EP22's yard and cars; the wall extended past 22, the hole on its outer face
// =====================================================================================================
const NCAR = 10, ARC = {c: [0.6, 0, -1.6] as V3, r: 8.5, a0: -1.08, a1: 1.08};
const carAt = (i: number) => { const a = lerp(ARC.a0, ARC.a1, i / (NCAR - 1)); return {p: [ARC.c[0] + Math.sin(a) * ARC.r, 0, ARC.c[2] - Math.cos(a) * ARC.r] as V3, yaw: Math.atan2(-Math.cos(a), -Math.sin(a))}; };
const outside = (t: number) => <>
  <BlockOutside cells={CELLS.filter((c) => c.no !== 22).map((c) => c.x)} />
  <mesh position={[(-9.6 - 10.75) / 2, 1.7, -1.61]}><boxGeometry args={[1.15, 3.4, 0.1]} /><meshLambertMaterial color="#8D9089" /></mesh>
  <mesh position={[(-9.6 - 10.75) / 2, 3.45, 3.2]}><boxGeometry args={[1.2, 0.12, 9.8]} /><meshLambertMaterial color="#5E625C" /></mesh>
  <WallHole c={[X22, 1.3, WALL_Z - 0.01]} r={0.75} k={1} yaw={Math.PI} />
  <pointLight position={[X22, 1.3, WALL_Z + 0.5]} color="#5A6EA8" intensity={1.2} distance={2.5} decay={1.5} />
  <Rubble center={[X22, 0, WALL_Z - 0.7]} size={[1.8, 0.8]} n={9} k={1} t={t} seed={5} />
  <hemisphereLight args={['#3A4E86', '#16181C', 0.95]} />
  <directionalLight position={[10, 14, -18]} color="#9FB2E0" intensity={0.9} />
  <pointLight position={[X22 - 1.0, 2.6, -4.8]} color="#C8D4F0" intensity={3.2} distance={7} decay={1.4} />
  <pointLight position={[X22 + 0.8, 1.6, -2.4]} color="#9FB2E0" intensity={1.4} distance={3} decay={1.4} />
  {Array.from({length: NCAR}, (_, i) => <PoliceCar key={i} t={t} position={carAt(i).p} yaw={carAt(i).yaw} seed={i * 3} unit="สายตรวจนอกเรือนจำ · 191" />)}
  {[0, 1, 3].map((i) => <SirenLights key={i} t={t + i * 0.07} position={add(carAt(i).p, [0, 2, 0])} power={3} />)}</>;
// the three cops: by car 0 until `run`, then run to the guard and stand round him; cmd2 snaps the cuffs at `cuff`
const COPS: {id: string; from: V3; to: V3}[] = [{id: 'offB', from: [-6.2, 0, -5.4], to: [X22 + 0.85, 0, HANG[2] - 0.35]}, {id: 'cmd2', from: [-6.0, 0, -4.4], to: [X22 + 0.45, 0, HANG[2] - 0.7]},
  {id: 'cmd3', from: [-6.9, 0, -6.6], to: [X22 - 0.85, 0, HANG[2] - 0.45]}];
const cops = (C: Cast, t: number) => <>{COPS.map(({id, from, to}, i) => { const k = sm((t - ev('run') - i * 0.12) / 1.1); const p = lerp3(from, to, k); const running = k > 0.02 && k < 0.98;
  const tgt: V3 = [HANG[0], 0.8, HANG[2] - 0.15]; const yaw = Math.atan2(tgt[0] - p[0], tgt[2] - p[2]);
  const g = guy(C, id, p[0], p[2], running ? Math.atan2(to[0] - from[0], to[2] - from[2]) : yaw, t, {clip: running ? 'run_neutral_01' : 'idle_neutral_01', face: 'angry', look: tgt});
  if (id === 'cmd2' && t > ev('cuff') - 0.5 && t < ev('cuff') + 0.4) { hand(g.I, 'R', lerp3(add(bw(g.I, 'Bip01_Spine2'), [-0.1, -0.1, 0.2]), [HANG[0] + 0.05, 0.45, HANG[2] - 0.4], sm((t - ev('cuff') + 0.5) / 0.4)), 'fist'); }
  if (id === 'offB' && !running && t > ev('run') + 1) hand(g.I, 'R', add(bw(g.I, 'Bip01_Head'), [(tgt[0] - p[0]) * 0.25, 0.1, (tgt[2] - p[2]) * 0.25]), 'point');
  g.w.updateMatrixWorld(true); return <P key={id} o={g.w} />; })}</>;

// =====================================================================================================
const lamp = (p: V3, i = 1.4, c = '#9AAEE6') => <pointLight position={p} color={c} intensity={i} distance={4} decay={1.4} />;
const all = (t: number, C: Cast, o: {only?: number[]; guard?: boolean; man?: boolean} = {}) => { const m = o.man === false ? null : man(C, t); const g = o.guard ? guard(C, t) : null;
  return {m, g, node: <>{block(t, o.only ? {only: o.only} : {})}{m?.node}{g?.node}{m && chains(t, m.wristL)}</>}; };
const out = (t: number, C: Cast, o: {cops?: boolean} = {}) => { const g = guard(C, t); return {g, node: <>{outside(t)}{g.node}{o.cops !== false && cops(C, t)}</>}; };
const kick = (t: number, hits: string[], d = 0.1, a = 0.012) => near(t, hits.map(ev), d) ? a : 0;
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: the corridor, high — 23's fridge door wide open, fire in it; next door in 18 he goes round and round, chained to the Moon
    const {node} = all(t, C, {only: [23, 18, 24], guard: true});
    return {node: <>{node}{lamp([X23 + 1.5, 2.4, 3.0], 1.2)}</>, cam: mv({pos: [X23 + 0.55, 1.6, 3.5], look: [X23 + 0.1, 1.2, -0.5], fov: 46}, lt, {arrive: 0.04, push: 0.12}), bg: NIGHT_BG};
  },
  fire: (t, lt, C) => {
    // close on the open fridge: the fire on its shelf flares
    return {node: <>{block(t, {only: [23]})}{lamp([X23 + 0.8, 2.0, 1.6], 1.0)}</>, cam: mv({pos: [X23 + 0.35, 1.5, 2.2], look: [X23 + 0.1, 1.45, -0.6], fov: 44}, lt, {arrive: 0.03, push: 0.16}), bg: NIGHT_BG};
  },
  outfridge: (t, lt, C) => {
    // it lifts off the shelf and floats out of the fridge
    return {node: <>{block(t, {only: [23]})}{lamp([X23 + 0.8, 2.0, 1.6], 1.0)}</>, cam: mv({pos: [X23 + 1.0, 1.7, 2.9], look: [X23 + 0.1, 1.5, -0.1], fov: 48}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  ball: (t, lt, C) => {
    // no gravity: the flame has no "up" — it rounds into a ball
    return {node: <>{block(t, {only: [23]})}</>, cam: mv({pos: [X23 + 0.9, 1.75, 2.4], look: [X23 + 0.1, 1.55, 0.8], fov: 42}, lt, {arrive: 0.03, push: 0.14}), bg: NIGHT_BG};
  },
  ballcu: (t, lt, C) => {
    // close: a ball of fire, turning in the air
    const f = fireAt(t);
    return {node: <>{block(t, {only: [23]})}</>, cam: mv({pos: add(f, [0.5, 0.15, 1.35]), look: f, fov: 40}, lt, {arrive: 0.02, push: 0.12, roll: 4}), bg: NIGHT_BG};
  },
  drift: (t, lt, C) => {
    // along the bars of 23: where it touches them, they glow and melt away
    const {node} = all(t, C, {only: [22, 23, 18], man: false});
    return {node: <>{node}{lamp([X23, 2.4, 2.6], 1.2)}</>, cam: mv({pos: [X23 + 0.9, 1.7, 3.8], look: [fireAt(t)[0], 1.4, 1.5], fov: 50}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  melt22: (t, lt, C) => {
    // on to 22 at the end of the row: its bars go too (the hole in its back wall behind)
    const {node} = all(t, C, {only: [22, 23], man: false});
    return {node: <>{node}{lamp([X22 + 0.5, 2.4, 2.6], 1.2)}</>, cam: mv({pos: [X22 + 1.4, 1.7, 3.6], look: [X22 + 0.1, 1.35, 1.0], fov: 50}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  row: (t, lt, C) => {
    // high and wide: 22 and 23 open, drops of steel adrift, the ball heading back for 18
    const {node} = all(t, C, {only: [22, 23, 18], guard: true});
    return {node: <>{node}{lamp([X23, 2.7, 2.8], 1.4)}</>, cam: mv({pos: [X18 + 0.6, 1.75, 3.6], look: [X22, 1.35, 1.45], fov: 44}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  in18: (t, lt, C) => {
    // the bars of 18 melt; the ball drifts in to the orbit
    const {node} = all(t, C, {only: [18, 23], guard: true});
    return {node: <>{node}{lamp([X18, 2.6, 2.6], 1.4)}</>, cam: mv({pos: [X18 - 1.0, 3.1, 3.9], look: [X18 - 0.1, 1.5, 0.6], fov: 52}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  chain: (t, lt, C) => {
    // close from above: round he comes, the chain runs through the fire — and parts
    const c = CUT_AT(); const {node} = all(t, C, {only: [18], guard: true});
    return {node: <>{node}{lamp(add(c, [0.4, 0.6, 0.6]), 1.6)}</>, cam: mv({pos: [X18 + 0.05, 4.5, 0.55], look: [X18, 1.3, 0.15], fov: 56}, lt, {arrive: 0.02, push: 0.1, roll0: 90, roll: 4, shake: kick(t, ['cut'])}), bg: NIGHT_BG};
  },
  free: (t, lt, C) => {
    // from above and in front: off the orbit he flies, out through the melted bars
    const {node} = all(t, C, {only: [18, 24], guard: true});
    return {node: <>{node}{lamp([X18 + 0.6, 2.6, 2.4], 1.4)}</>, cam: mv({pos: [X18 + 1.3, 4.0, 4.6], look: [X18 + 1.0, 1.1, 1.6], fov: 52}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  freeface: (t, lt, C) => {
    // close: free in the corridor, flat, a broken chain on his wrist
    const {node} = all(t, C, {only: [18, 24], guard: true});
    return {node: <>{node}{lamp([X18 + 1.3, 2.2, 4.2], 1.8, '#FFF0C8')}</>, cam: mv({pos: [FREE[0] + 0.25, 2.2, FREE[2] + 1.55], look: [FREE[0], 2.0, FREE[2]], fov: 40}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  plate: (t, lt, C) => {
    // the institution, frontal: the open bars of 18, him free in front of them, the ball beside him, the guard. The plate drops.
    const {node} = all(t, C, {only: [23, 18, 24], guard: true});
    return {node: <>{node}{lamp([X18 + 0.6, 2.6, 3.6], 1.6)}</>, cam: mv({pos: [X18 + 1.4, 2.0, 7.6], look: [X18 + 1.4, 1.45, 1.8], fov: 50}, lt, {arrive: 0.04, push: 0.1, shake: kick(t, ['plate'])}), bg: NIGHT_BG};
  },
  call: (t, lt, C) => {
    // close: phone to his ear — he reports the one who freed him
    const {node} = all(t, C, {only: [18, 24], guard: true});
    return {node: <>{node}{lamp([X18 + 1.5, 2.2, 4.0], 1.8, '#FFF0C8')}</>, cam: mv({pos: [FREE[0] - 0.8, 2.25, FREE[2] + 1.2], look: [FREE[0] - 0.15, 2.15, FREE[2]], fov: 42}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  ring: (t, lt, C) => {
    // the guard, a metre away: his phone rings, he answers
    const {node} = all(t, C, {only: [18, 24], guard: true});
    return {node: <>{node}{lamp([X18 + 0.9, 2.3, 3.0], 1.8)}</>, cam: mv({pos: [X18 - 0.5, 1.85, 3.5], look: [X18 + 0.5, 1.75, 1.95], fov: 44}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  grab: (t, lt, C) => {
    // he turns and grabs the floating extinguisher
    const {node} = all(t, C, {only: [18, 24], guard: true});
    return {node: <>{node}{lamp([X18 + 1.0, 2.2, 3.2], 1.8)}</>, cam: mv({pos: [X18 - 0.3, 1.7, 3.7], look: [X18 + 0.75, 1.75, 2.2], fov: 46}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  spray: (t, lt, C) => {
    // side on: a white jet at the fire ball
    const {node} = all(t, C, {only: [18, 24], guard: true});
    return {node: <>{node}{lamp([X18 + 1.2, 2.4, 3.4], 1.6)}</>, cam: mv({pos: [X18 + 1.0, 1.65, 5.6], look: [X18 + 1.0, 1.4, 2.2], fov: 48}, lt, {arrive: 0.02, push: 0.1, shake: kick(t, ['spray'])}), bg: NIGHT_BG};
  },
  recoil: (t, lt, C) => {
    // and the jet pushes back: no gravity, nothing holds him — he starts to slide away backwards
    const {node} = all(t, C, {only: [18, 23, 24], guard: true});
    return {node: <>{node}{lamp([X18, 2.4, 3.4], 1.6)}</>, cam: mv({pos: [X18 - 1.3, 1.75, 4.8], look: [X18 + 0.3, 1.35, 2.2], fov: 50}, lt, {arrive: 0.02, push: 0.06}), bg: NIGHT_BG};
  },
  flyby: (t, lt, C) => {
    // down the corridor from the end wall: he rockets towards us, backwards, white jet behind
    const {node} = all(t, C, {guard: true});
    return {node: <>{node}{lamp([X22 + 1.5, 2.4, 3.0], 1.4)}</>, cam: mv({pos: [X22 - 0.6, 2.4, 4.4], look: [X18, 1.2, 2.4], fov: 50}, lt, {arrive: 0, push: 0.05}), bg: NIGHT_BG};
  },
  hole: (t, lt, C) => {
    // cell 22: in through the melted bars and out of the hole in its back wall
    const {node} = all(t, C, {only: [22, 23], guard: true, man: false});
    return {node: <>{node}{lamp([X22 + 0.6, 2.4, 2.4], 1.6)}</>, cam: mv({pos: [X22 + 1.4, 2.0, 4.2], look: [X22, 1.2, -0.6], fov: 50}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  outhole: (t, lt, C) => {
    // outside, the yard: out of the hole in the prison wall he shoots
    const {node} = out(t, C, {cops: false});
    return {node: <>{node}</>, cam: mv({pos: [X22 - 1.7, 1.45, -6.0], look: [X22, 1.25, -2.2], fov: 46}, lt, {arrive: 0.02, push: 0.08}), bg: OUT_BG};
  },
  hang: (t, lt, C) => {
    // out here there is gravity: he stops in the air — the red arrow — down
    const {node} = out(t, C, {cops: false}); const arrowK = sm((t - ev('hang') - 0.3) / 0.25);
    return {node: <>{node}{arrowK > 0.01 && <GravityArrow position={[HANG[0] + 0.55, 1.9, HANG[2] - 0.1]} s={0.7 * arrowK} />}</>,
      cam: mv({pos: [X22 - 1.6, 1.1, -7.6], look: [X22, 1.5, -3.3], fov: 46}, lt, {arrive: 0.02, push: 0.1}), bg: OUT_BG};
  },
  land: (t, lt, C) => {
    // thump, on the ground of the yard
    const {node} = out(t, C, {cops: false});
    return {node: <>{node}</>, cam: mv({pos: [X22 - 0.9, 0.85, -5.9], look: [X22, 0.45, -3.5], fov: 46}, lt, {arrive: 0.02, push: 0.1, shake: kick(t, ['land'], 0.12, 0.02)}), bg: OUT_BG};
  },
  cops: (t, lt, C) => {
    // the police outside, by their cars: someone just came out of the prison wall — they run over
    const {node} = out(t, C);
    return {node: <>{node}</>, cam: mv({pos: [X22 - 1.2, 2.6, -1.9], look: [-6.6, 0.6, -5.4], fov: 56}, lt, {arrive: 0.02, push: 0.08}), bg: OUT_BG};
  },
  cuff: (t, lt, C) => {
    // close: click, cuffs on the guard — behind his back
    const {node} = out(t, C);
    return {node: <>{node}</>, cam: mv({pos: [X22 - 1.0, 1.0, -4.4], look: [X22 + 0.05, 0.5, -3.6], fov: 48}, lt, {arrive: 0.02, push: 0.12, shake: kick(t, ['cuff'])}), bg: OUT_BG};
  },
  charge2: (t, lt, C) => {
    // frontal: the guard on the ground in his mask, three cops round him, the hole behind — "escaping"
    const {node} = out(t, C);
    return {node: <>{node}</>, cam: mv({pos: [X22 + 0.2, 1.35, -7.0], look: [X22, 0.95, -3.0], fov: 44}, lt, {arrive: 0.03, push: 0.1, shake: kick(t, ['plate2'])}), bg: OUT_BG};
  },
  night: (t, lt, C) => {
    // "คืนนั้น": inside, the guard's post adrift and empty
    const {node} = all(t, C);
    return {node: <>{node}{lamp([POST[0], 2.4, POST[2] + 0.4], 1.4)}</>, cam: mv({pos: [POST[0] + 1.6, 1.7, POST[2] + 2.6], look: [POST[0], 1.0, POST[2]], fov: 46}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  look: (t, lt, C) => {
    // down the corridor to 22: him, the fire, the fan turned — everyone looking at the hole. Black.
    const {node} = all(t, C);
    return {node: <>{node}{lamp([X22 + 1.0, 2.2, 2.4], 1.6)}</>, cam: mv({pos: [X22 + 2.6, 1.9, 4.6], look: [X22, 1.3, -1.0], fov: 46}, lt, {arrive: 0, push: 0.12}), bg: NIGHT_BG};
  },
};
void [cl, ICEBOX, cut_, WALL_Z];
