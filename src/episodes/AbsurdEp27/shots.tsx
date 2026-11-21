import React from 'react';
import * as THREE from 'three';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {Mosquito, Jar, Handcuffs} from '../AbsurdEp1/props';
import {CellPlate, Fan} from '../AbsurdEp2/props';
import {Durian} from '../AbsurdEp4/props';
import {PoliceCar} from '../AbsurdEp7/props';
import {ShadowSheet} from '../AbsurdEp8/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {Moon} from '../AbsurdEp15/props';
import {Phone, Accused} from '../AbsurdEp16/props';
import {Icebox, Fire} from '../AbsurdEp17/props';
import {makeFly} from '../AbsurdEp19/props';
import {Contract} from '../AbsurdEp20/props';
import {WallPlan, makeGasMask} from '../AbsurdEp21/props';
import {Window24, BlockOutside, WALL_Z} from '../AbsurdEp22/props';
import {Wrap, HazardSign, GuardPost} from '../AbsurdEp23/props';
import {WallHole, Rubble, WallCrack, Cloak, GravityArrow} from '../AbsurdEp24/props';
import {Ring, Chain} from '../AbsurdEp25/props';
import {FireBall, MeltBars, Extinguisher} from '../AbsurdEp26/props';
import {SirenLights} from '../absurdkit';
import {ps, body, hideProps, P, CamRig, mv, near, sm, V3, Cast, ShotOut, hand, bw, headFr} from '../lifekit/stage';
import {BlobShadow, WallLamp} from './props';

export {CamRig};
/** EP27 · แก๊งห้อง 24 S1E8 (season finale) แหกคุกสำเร็จ. Night, where EP26 stopped: no guard. The fire ball melts the bars of 19 and 20; the
 *  gang floats out and gathers in 22 at the hole. He counts: five — a criminal gang! He calls; outside, the cuffed guard's phone rings on the
 *  ground by car 0, out of reach of his cuffed hands. Nobody comes: one by one they float out through the hole and gravity outside drops each
 *  to the ground. He stands up outside the wall: escaped. Under the lamp everyone has a shadow but him — it is still on the floor of 24, and
 *  that night it starts to slide to the bars.
 *
 *  LAYOUT — EP26's block: 22, 23, 18 bars melted (MeltBars m 1), 24 barred (his shadow on the floor), 19 (fan) melts at `m19`, 20 (durian) at
 *  `m20`. Outside: EP22's yard and ten cars; the guard sits cuffed (behind his back) at G_OUT by car 0, three cops round him; his phone on the
 *  ground at PHONE_OUT, 1 m out of reach.
 *  gang    0 fire · 1 fan · 2 durian · 3 jar (the mosquito) · 4 him. Inside: from home to SLOT[i] (cell 22, by the hole) between `out0` and
 *          `gather`. Through the hole: SLOT → HOLE_IN at ex_i − 0.9 … ex_i (outside face), then fall to LAND[i] by ld_i. After `walk` they go
 *          to LAMP_SPOT[i] by `lamp` (he walks; fan, jar and fire hop; the durian rolls). Outside everything stands on the ground.
 *  him     flat (scale 0.12 along his facing). Inside he faces −z (to the gang and the hole); outside he lands facing −z, turns to −x for
 *          the walk. Thin axis = his facing: film within ~50° of it.
 *
 *  TRAPS
 *  1. Flat man facing −x on the walk: film from the −x side (in front of him), never from −z (edge on).
 *  2. Count = five, readable: number tags pop over each one in order, 5 over himself while he points at his chest.
 *  3. Inside no gravity (all float); outside gravity: nothing floats, the fire burns upright again.
 *  4. The guard's phone must be visibly out of his reach, his hands behind his back.
 *  5. The cops face the guard and car 0: their backs to the hole (nobody sees the gang).
 *  6. No-shadow gag: four blob shadows from the lamp, none under him.
 *  7. Earth and Moon stay in 18 (not gang members here). */
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CW = 3.05, X22 = -3 * CW, X23 = -2 * CW, X18 = -CW, X19 = CW, X20 = 2 * CW;
const FAN: V3 = [X19 - 0.37, 0, 1.3], FAN_S = 1.35;
const NIGHT_BG = {color: '#0E1424'}, OUT_BG = {color: '#101830'};
const POST: V3 = [1.6, 0, 3.9];
const GRAV: V3 = [X22, 1.5, 0.0];
const flo = (t: number, h: number, seed: number): {d: V3; r: V3} => ({d: [0.08 * Math.sin(t * 0.6 + seed), h + 0.06 * Math.sin(t * 1.1 + seed), 0.08 * Math.cos(t * 0.5 + seed)],
  r: [0.35 * Math.sin(t * 0.4 + seed), 0.3 * t + seed, 0.3 * Math.cos(t * 0.3 + seed)]});
const Floating: React.FC<{t: number; h: number; seed: number; at?: V3; spin?: boolean; children: React.ReactNode}> = ({t, h, seed, at = [0, 0, 0], spin = true, children}) => { const f = flo(t, h, seed);
  return <group position={add(at, f.d)}><group rotation={spin ? f.r : [0.05 * Math.sin(t * 0.4), 0.08 * Math.sin(t * 0.3), 0.05 * Math.cos(t * 0.5)]}>{children}</group></group>; };
const EARTH_C: V3 = [X18, 1.08, -0.15], EARTH_R = 0.95;
const earthC = (t: number): V3 => add(EARTH_C, [0, 0.22 + 0.05 * Math.sin(t), 0]);
const moonAng = (t: number) => -2 * Math.PI / 3.17 * t;
const moonAt = (t: number): V3 => { const c = earthC(t), a = moonAng(t); return [c[0] + Math.cos(a) * 1.2, c[1] + 0.97, c[2] + 0.05 + Math.sin(a) * 1.2]; };
const fridgeP: V3 = [X23 + 0.1, 0, -0.6];
const DURIAN0: V3 = [X20 + 0.1, 1.22, -0.5];

// ---- melting: 22, 23, 18 from EP26 (done), 19 and 20 now
const MELT: Record<number, string | null> = {22: null, 23: null, 18: null, 19: 'm19', 20: 'm20'};
const meltK = (no: number, t: number) => !(no in MELT) ? 0 : MELT[no] === null ? 1 : sm((t - ev(MELT[no]!) + 0.15) / 0.7);
const heatK = (no: number, t: number) => !MELT[no] ? 0 : sm((t - ev(MELT[no]!) + 0.25) / 0.3) * (1 - 0.8 * sm((t - ev(MELT[no]!) - 1.0) / 3.0));

// ---- the gang: 0 fire · 1 fan · 2 durian · 3 jar · 4 him. Positions are the centre (fire, durian, jar) / the base (fan) / the feet (him).
const N = 5;
const HOME = (): V3[] => [[X18 + 2.6, 1.9, 2.6], FAN, DURIAN0, [-0.45, 1.1, 2.15], [X23 + 1.6, 0.5, 3.0]];
const SLOT: V3[] = [[X22 + 0.75, 1.75, -0.35], [X22 + 0.95, 0.45, 0.25], [X22 - 0.75, 1.3, -0.2], [X22 - 0.35, 1.95, 0.35], [X22 + 0.05, 0.25, 0.75]];
const HOLE_IN: V3 = [X22, 1.3, -1.35], HOLE_OUT: V3 = [X22, 1.2, -2.05];
const LAND: V3[] = [[X22 - 1.2, 0, -3.4], [X22 - 0.7, 0, -2.55], [X22 + 1.15, 0.3, -3.0], [X22 - 0.15, 0, -3.55], [X22 + 0.45, 0, -2.55]];
const LAMP_SPOT: V3[] = [[-11.2, 0, -2.55], [-11.95, 0, -2.9], [-12.6, 0.3, -2.45], [-11.6, 0, -3.25], [-12.2, 0, -3.6]];
const FIRE_K = (): [number, V3][] => [[0, HOME()[0]], [ev('m19'), [X19 - 0.65, 1.45, 1.6]], [ev('m20'), [X20 - 0.65, 1.45, 1.6]], [ev('out0') + 0.6, [X20 - 0.9, 1.6, 2.3]], [ev('gather') + 0.4, SLOT[0]]];
const keyed = (K: [number, V3][], t: number): V3 => { if (t <= K[0][0]) return K[0][1]; let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++; return lerp3(K[i][1], K[i + 1][1], sm((t - K[i][0]) / (K[i + 1][0] - K[i][0]))); };
type Phase = 'home' | 'float' | 'hole' | 'fall' | 'ground' | 'walk' | 'lamp';
/** where gang member i is at t, and in which phase */
const gangAt = (i: number, t: number): {p: V3; ph: Phase} => {
  const ex = ev(`ex${i}`), ld = ev(`ld${i}`);
  if (t >= ev('walk')) { const k = sm((t - ev('walk') - i * 0.1) / (ev('lamp') - ev('walk') + 0.2)); return {p: lerp3(LAND[i], LAMP_SPOT[i], k), ph: k < 1 ? 'walk' : 'lamp'}; }
  if (t >= ld) return {p: LAND[i], ph: 'ground'};
  if (t >= ex) { const k = (t - ex) / (ld - ex); const a: V3 = HOLE_OUT, b: V3 = add(LAND[i], [0, i === 0 ? 0.2 : i === 2 ? 0 : i === 3 ? 0.25 : 0, 0]);
    return {p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k * k), lerp(a[2], b[2], k)], ph: 'fall'}; }
  if (t >= ex - 0.9) { const k = sm((t - ex + 0.9) / 0.9); const s = SLOT[i]; const mid = HOLE_IN;
    return {p: k < 0.6 ? lerp3(s, mid, k / 0.6) : lerp3(mid, HOLE_OUT, (k - 0.6) / 0.4), ph: 'hole'}; }
  const t0 = ev('out0') + i * 0.25, t1 = ev('gather') - (4 - i) * 0.12;
  if (i === 0) return {p: add(keyed(FIRE_K(), t), [0.03 * Math.sin(t * 2.1), 0.03 * Math.sin(t * 1.7), 0.03 * Math.cos(t * 1.9)]), ph: t < ev('out0') ? 'home' : 'float'};
  if (t < t0) return {p: HOME()[i], ph: 'home'};
  const k = sm((t - t0) / (t1 - t0)); const h = HOME()[i], s = SLOT[i]; const mid: V3 = [lerp(h[0], s[0], 0.5), Math.max(h[1], s[1]) + 0.2, 2.6];   // out through the bars into the corridor, along, into 22
  const bob: V3 = [0.03 * Math.sin(t * 1.3 + i), 0.04 * Math.sin(t * 1.1 + i), 0];
  return {p: add(k < 0.5 ? lerp3(h, mid, k / 0.5) : lerp3(mid, s, (k - 0.5) / 0.5), bob), ph: 'float'}; };
const hop = (t: number, ph: Phase, i: number) => ph === 'walk' ? 0.13 * Math.abs(Math.sin((t - ev('walk')) * 7 + i)) : 0;
const fireNode = (t: number) => { const g = gangAt(0, t); if (g.ph === 'home' || g.ph === 'float' || g.ph === 'hole' || (g.ph === 'fall' && t < ev('ex0') + 0.15)) return <FireBall position={g.p} t={t} r={0.22} light={1.6} />;
  return <Fire position={add(g.p, [0, hop(t, g.ph, 0), 0])} t={t} size={0.42} light={1.0} />; };
const fanNode = (t: number) => { const g = gangAt(1, t); const inside = g.ph === 'home' || g.ph === 'float' || g.ph === 'hole';
  const tilt = inside && g.ph !== 'home' ? 0.12 + 0.3 * Math.sin(t * 0.8) : g.ph === 'home' ? 0.12 : 0; const yaw = g.ph === 'walk' || g.ph === 'lamp' ? -Math.PI / 2 : 0;
  const p = add(g.p, [0, hop(t, g.ph, 1), 0]);
  return <group position={p} rotation={[0, yaw, tilt]}><Fan position={[0, 0, 0]} scale={FAN_S * (inside ? 1 : 0.8)} headYaw={0.85 * Math.sin(t * Math.PI * 2 / 3.2)} blade={t * 31} blur={1} lit={3} />
    <group position={[0.104, 0.78, 0]}><Handcuffs k={1} rotation={[Math.PI / 2, 0, 0]} size={3} /></group></group>; };
const durianNode = (t: number) => { const g = gangAt(2, t); const inside = g.ph === 'home' || g.ph === 'float' || g.ph === 'hole';
  const roll = g.ph === 'walk' ? (t - ev('walk')) * 5 : 0;
  return inside ? <Floating t={t} h={0} seed={5} at={g.p}><Durian position={[0, 0, 0]} r={0.3} yaw={1.2} face={false} /></Floating>
    : <group position={g.p} rotation={[0, 0, roll]}><Durian position={[0, 0, 0]} r={0.3} yaw={1.2} face={false} /></group>; };
const jarNode = (t: number) => { const g = gangAt(3, t); const inside = g.ph === 'home' || g.ph === 'float' || g.ph === 'hole';
  const j = <><Jar position={[0, 0, 0]} scale={1.6}><Mosquito t={t} position={[0, 0.03, 0]} rotation={inside ? [Math.PI, 0, 0.3] : [0, 0, 0]} flap={inside ? 0 : 1} fill={1} scale={2} legsUp={inside} /></Jar>
    <CellPlate text="ห้อง 25" position={[0, 0.36, 0.1]} w={0.16} /></>;
  return inside ? <Floating t={t} h={0} seed={7} at={g.p}>{j}</Floating> : <group position={add(g.p, [0, hop(t, g.ph, 3), 0])}>{j}</group>; };

type Who = 'gravity' | 'fridge' | 'earth' | 'man' | 'fan' | 'durian';
const CELLS: {x: number; no: number; who: Who}[] = [{x: X22, no: 22, who: 'gravity'}, {x: X23, no: 23, who: 'fridge'}, {x: X18, no: 18, who: 'earth'}, {x: 0, no: 24, who: 'man'},
  {x: X19, no: 19, who: 'fan'}, {x: X20, no: 20, who: 'durian'}];
const inmate = (who: Who, t: number) => who === 'earth' ? <>
    <Earth t={t} position={earthC(t)} r={EARTH_R} yaw={1.2} shake={0.25} eyes={false} />
    <EarthCuff center={earthC(t)} r={EARTH_R} close={1} tilt={[0.3, 0, 0.25]} />
    <Moon t={t} position={moonAt(t)} r={0.28} glow={2.2} spin={Math.PI / 2 + moonAng(t)} />
    <Ring p={moonAt(t)} r={0.33} />
    <pointLight position={add(moonAt(t), [0, 0.2, 0])} color="#FFF0C8" intensity={3} distance={5} decay={1.6} /></>
  : who === 'fridge' ? <Floating t={t} h={0.6} seed={2} at={fridgeP} spin={false}><Icebox position={[0, 0, 0]} door={1} glow={0.5} frost={0.3} /></Floating>
  : who === 'gravity' ? <><Accused t={t} position={add(GRAV, [0, 0.3, 0])} size={7} float={1} arrow={false} /><WallHole c={[X22, 1.3, -1.49]} r={0.75} k={1} />
    <Rubble center={[X22 + 1.6, 0, 2.6]} size={[2.2, 0.8]} k={1} lift={1} t={t} seed={1} /></>
  : null;
const endWalls = <group>
  <mesh position={[9.8, 1.6, 3.2]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[9.6, 3.2]} /><meshLambertMaterial color="#7A7E78" /></mesh>
  <mesh position={[9.79, 1.05, 3.0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[1.1, 2.1]} /><meshBasicMaterial color="#3A4260" /></mesh>
  <mesh position={[-10.7, 1.6, 3.2]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[9.6, 3.2]} /><meshLambertMaterial color="#7A7E78" /></mesh></group>;
const SH_END: V3 = [0.6, 0.006, -1.42];
const shadowAt = (t: number): V3 => lerp3(SH_END, [0.6, 0.006, 0.55], sm((t - ev('slide')) / 2.2));
const inside = (t: number, o: {only?: number[]} = {}) => <>
  {CELLS.filter((c) => !o.only || o.only.includes(c.no)).map((c) => <group key={c.no}><group position={[c.x, 0, 0]}>
    <Cell t={t} days={0.98} marks={c.no === 24 ? 11 : 9 + (c.no % 5)} rails={c.no === 24 ? [0.04, 2.6] : undefined} bars={!(c.no in MELT)} />
    {c.no in MELT && <MeltBars t={t} m={meltK(c.no, t)} heat={heatK(c.no, t)} seed={c.no} />}
    <CellPlate text={`ห้อง ${c.no}`} position={[0, 2.12, 1.54]} w={0.64} /></group>{inmate(c.who, t)}</group>)}
  {(!o.only || o.only.includes(24)) && <><WallPlan position={[-1.48, 1.55, -0.2]} rotation={[0, Math.PI / 2, 0]} w={1.5} /><Window24 z={-1.493} dark="#5A6E9C" />
    <WallCrack at={[-1.47, 2.5, 0.75]} len={1.9} k={1} /><ShadowSheet position={shadowAt(t)} yaw={Math.PI} pose="broom" peel={0} eyes="none" s={0.95} /></>}
  {(!o.only || o.only.includes(19)) && <><Wrap x0={X19 - 1.5} x1={X19 + 1.5} z={1.5} k={1 - meltK(19, t)} />{meltK(19, t) < 0.3 && <HazardSign position={[X19 - 0.05, 1.5, 1.6]} />}</>}
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 4.75]}><planeGeometry args={[22, 6.5]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.6, 8.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[22, 3.2]} /><meshLambertMaterial color="#6F736D" /></mesh>
  {endWalls}
  {!o.only && <><Floating t={t} h={1.0} seed={4} at={[0.78, 0.004, 2.2]}><group rotation={[-Math.PI / 2, 0, 0.9]}><Contract position={[0, 0, 0]} blood={1} /></group></Floating>
    <Cloak position={[0.42, 0, 2.02]} lift={1} t={t} /></>}
  <Floating t={t} h={0.8} seed={9} at={POST}><GuardPost position={[0, 0, 0]} yaw={Math.PI} /></Floating>
  {[-7.5, -3, 1.5, 6].map((x) => <pointLight key={x} position={[x, 2.6, 3.4]} color="#5A6EA8" intensity={0.55} distance={7} decay={1.5} />)}
  <pointLight position={[0.9, 2.4, -0.4]} color="#9AAEE6" intensity={1.4} distance={3} decay={1.4} />
  {gangIn(t)}</>;
const isIn = (i: number, t: number) => { const ph = gangAt(i, t).ph; return ph === 'home' || ph === 'float' || ph === 'hole'; };
const gangIn = (t: number) => <>{isIn(0, t) && fireNode(t)}{isIn(1, t) && fanNode(t)}{isIn(2, t) && durianNode(t)}{isIn(3, t) && jarNode(t)}</>;
const gangOut = (t: number) => <>{!isIn(0, t) && fireNode(t)}{!isIn(1, t) && fanNode(t)}{!isIn(2, t) && durianNode(t)}{!isIn(3, t) && jarNode(t)}</>;
/** the count: a tag pops over member i at c(i+1) */
const tags = (t: number, headOf: V3) => <>{[0, 1, 2, 3, 4].map((i) => { const k = sm((t - ev(`c${i + 1}`)) / 0.12); if (k <= 0.01 || t > ev('dial') + 0.3) return null;
  const p = i === 4 ? add(headOf, [0, 0.35, 0]) : add(gangAt(i, t).p, [0, i === 1 ? 1.15 : 0.32, 0.25]);
  return <group key={i} position={p} scale={0.6 + 0.4 * k}><CellPlate text={`${i + 1}`} position={[0, 0, 0]} w={0.36} bg={i === 4 ? '#B0302E' : '#152028'} /></group>; })}</>;

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
/** which way a rig faces (EP26: up × (R − L) comes out backwards for these rigs, so negate) */
const facing = (I: any): THREE.Vector3 => { const l = bw(I, 'Bip01_L_UpperArm'), r = bw(I, 'Bip01_R_UpperArm'); return new THREE.Vector3(0, 1, 0).cross(new THREE.Vector3(r[0] - l[0], 0, r[2] - l[2])).normalize().negate(); };

// ---- him (flat)
const manPos = (t: number): {feet: V3; yaw: number; rx: number; clip: string} => { const g = gangAt(4, t);
  if (g.ph === 'home' || g.ph === 'float') { const turn = sm((t - ev('c5') + 0.35) / 0.3) * (1 - sm((t - ev('enter') + 0.6) / 0.4));   // turns round to count himself, faces us for the call
    return {feet: g.p, yaw: lerp(Math.PI, 0, turn), rx: 0, clip: 'idle_neutral_01'}; }
  if (g.ph === 'hole') { const k = sm((t - ev('ex4') + 0.9) / 0.5); return {feet: add(g.p, [0, -0.45 * k, 0]), yaw: Math.PI, rx: 1.35 * k, clip: 'idle_neutral_01'}; }   // dives head first through the hole
  if (g.ph === 'fall') { const k = (t - ev('ex4')) / (ev('ld4') - ev('ex4')); return {feet: g.p, yaw: Math.PI, rx: 1.35 * (1 - sm(k * 1.3)), clip: 'idle_neutral_01'}; }
  if (g.ph === 'ground') { const turn = sm((t - ev('walk') + 0.5) / 0.5); return {feet: g.p, yaw: lerp(Math.PI, -Math.PI / 2, turn), rx: 0, clip: 'idle_neutral_01'}; }
  return {feet: g.p, yaw: lerp(-Math.PI / 2, -Math.PI, sm((t - ev('lamp') + 0.1) / 0.4)), rx: 0, clip: g.ph === 'walk' ? 'walk_neutral_01' : 'idle_neutral_01'}; };   // at the lamp he turns to face the yard (−z)
const manFace = (t: number) => t < ev('c1') ? 'open' : t < ev('plate') ? 'half' : t < ev('dial') + 1.5 ? 'shout' : t < ev('ld4') ? 'wide' : t < ev('lamp') ? 'open' : 'wide';
const man = (C: Cast, t: number) => { const s = manPos(t);
  const m = guy(C, 'nai', s.feet[0], s.feet[2], s.yaw, t, {face: manFace(t), y: s.feet[1], rx: s.rx, clip: s.clip});
  m.w.scale.z *= 0.12; m.w.updateMatrixWorld(true);
  const nodes: React.ReactNode[] = []; const f = facing(m.I); const chest = bw(m.I, 'Bip01_Spine2');
  // the count: his right hand points ahead at each tag, then at his own chest for 5
  if (t > ev('c1') - 0.2 && t < ev('dial') - 0.2) { const self = t > ev('c5') - 0.15; const r = new THREE.Vector3(0, 1, 0).cross(f).negate();
    const tgt: V3 = self ? [chest[0] + f.x * 0.02, chest[1] + 0.05, chest[2] + f.z * 0.02] : [chest[0] + f.x * 0.05 + r.x * (0.25 - 0.12 * Math.floor((t - ev('c1')) / 0.3)), chest[1] + 0.35, chest[2] + f.z * 0.05 + r.z * (0.25 - 0.12 * Math.floor((t - ev('c1')) / 0.3))];
    hand(m.I, 'R', tgt, 'point'); }
  // the call: phone up in his right hand in front of his chest (as EP26)
  if (t > ev('dial') - 0.2 && t < ev('enter')) { const r = new THREE.Vector3(0, 1, 0).cross(f).negate(); const tgt: V3 = [chest[0] + r.x * 0.15 + f.x * 0.025, chest[1] + 0.12, chest[2] + r.z * 0.15 + f.z * 0.025];
    hand(m.I, 'R', tgt, 'cup'); m.w.updateMatrixWorld(true); const hd = bw(m.I, 'Bip01_Head');   // weightless: the phone floats on speaker in front of his face
    const fy = [Math.sin(s.yaw), Math.cos(s.yaw)]; const ph: V3 = [hd[0] + fy[0] * 0.3, hd[1] - 0.05 + 0.02 * Math.sin(t * 2), hd[2] + fy[1] * 0.3]; nodes.push(<Phone key="ph" position={ph} rotation={[0, s.yaw + Math.PI, 0.15]} lit={1} />); }
  else if (t >= ev('enter')) { m.w.updateMatrixWorld(true); nodes.push(<Phone key="ph" position={bw(m.I, 'Bip01_R_Hand')} rotation={[0, s.yaw, 0]} lit={0.4} />); }
  m.w.updateMatrixWorld(true); flyOn(m.I);
  const wristL = bw(m.I, 'Bip01_L_Hand');
  return {...m, node: <><P o={m.w} />{nodes}<Ring p={wristL} r={0.05} /></>, head: bw(m.I, 'Bip01_Head'), feet: s.feet}; };

// ---- outside: the guard cuffed by car 0, his phone on the ground out of reach, the cops round him with their backs to the hole
const NCAR = 10, ARC = {c: [0.6, 0, -1.6] as V3, r: 8.5, a0: -1.08, a1: 1.08};
const carAt = (i: number) => { const a = lerp(ARC.a0, ARC.a1, i / (NCAR - 1)); return {p: [ARC.c[0] + Math.sin(a) * ARC.r, 0, ARC.c[2] - Math.cos(a) * ARC.r] as V3, yaw: Math.atan2(-Math.cos(a), -Math.sin(a))}; };
const G_OUT: V3 = [-6.7, 0, -3.7], PHONE_OUT: V3 = [-6.9, 0.03, -2.45];
const TETHER: V3 = [-6.85, 0.5, -4.75];   // the cops chained his cuffs to car 0's door handle
const masks = new WeakMap<any, THREE.Object3D>();
const maskOn = (I: any) => { let m = masks.get(I); if (!m) { m = makeGasMask(); headFr(I).add(m); masks.set(I, m); } m.visible = true; m.position.y = 0; return m; };
const guard = (C: Cast, t: number) => { const strain = t > ev('strain') - 0.2 && t < ev('strain') + 1.6 ? 1 : 0; const wig = strain * 0.12 * Math.sin(t * 22);
  const g = guy(C, 'offA', G_OUT[0], G_OUT[2], Math.PI + 0.25, t, {clip: 'sit_table_idle_neutral_01', face: t > ev('ring') ? 'shout' : 'angry', y: -0.42, rx: strain * 0.22, look: PHONE_OUT}); maskOn(g.I);
  const sp = bw(g.I, 'Bip01_Spine'); const fb = facing(g.I); const back: V3 = [sp[0] - fb.x * 0.2, sp[1] - 0.02, sp[2] - fb.z * 0.2]; const sd = new THREE.Vector3(0, 1, 0).cross(fb);
  hand(g.I, 'R', add(back, [-sd.x * (0.07 + wig), wig * 0.5, -sd.z * (0.07 + wig)]), 'fist'); hand(g.I, 'L', add(back, [sd.x * (0.07 + wig), -wig * 0.5, sd.z * (0.07 + wig)]), 'fist');
  g.w.updateMatrixWorld(true); const a = bw(g.I, 'Bip01_R_Hand'), b = bw(g.I, 'Bip01_L_Hand');
  const mid = lerp3(a, b, 0.5);
  return <><P o={g.w} /><Ring p={a} r={0.045} axis={[1, 0, 0]} /><Ring p={b} r={0.045} axis={[1, 0, 0]} /><Chain a={a} b={b} sag={0.01} /><Chain a={mid} b={TETHER} sag={0.12} /><Ring p={TETHER} r={0.05} axis={[0, 0, 1]} /></>; };
const ringK = (t: number) => t > ev('ring') && t < ev('enter') + 0.5 ? 1 : 0;
const groundPhone = (t: number) => { const r = ringK(t); const buzz = r * 0.01 * Math.sin(t * 95);
  return <><Phone position={[PHONE_OUT[0] + buzz, PHONE_OUT[1], PHONE_OUT[2]]} rotation={[-Math.PI / 2, 0, 0.4]} lit={r ? 1 : 0.2} />
    {r > 0 && <><pointLight position={add(PHONE_OUT, [0, 0.25, 0])} color="#9FE0B0" intensity={0.8 + 0.4 * Math.sin(t * 12)} distance={1.6} decay={1.4} />
      <CellPlate text="สายเข้า · ห้อง 24" position={add(PHONE_OUT, [0, 0.42, 0])} w={0.42} bg="#1F6F4A" /></>}</>; };
const COPS: {id: string; at: V3}[] = [{id: 'offB', at: [-5.75, 0, -3.15]}, {id: 'cmd2', at: [-6.0, 0, -4.55]}, {id: 'cmd3', at: [-7.5, 0, -4.75]}];
const cops = (C: Cast, t: number) => <>{COPS.map(({id, at}) => { const tgt: V3 = [G_OUT[0], 0.7, G_OUT[2]]; const yaw = Math.atan2(tgt[0] - at[0], tgt[2] - at[2]);
  const g = guy(C, id, at[0], at[2], yaw, t, {face: 'half', look: tgt}); g.w.updateMatrixWorld(true); return <P key={id} o={g.w} />; })}</>;
const LAMP: V3 = [-10.35, 2.95, WALL_Z - 0.12];
const lampOn = (t: number) => t > ev('walk') - 0.4;
const outside = (t: number) => <>
  <BlockOutside cells={CELLS.filter((c) => c.no !== 22).map((c) => c.x)} />
  <mesh position={[(-9.6 - 10.75) / 2, 1.7, -1.61]}><boxGeometry args={[1.15, 3.4, 0.1]} /><meshLambertMaterial color="#8D9089" /></mesh>
  <mesh position={[(-9.6 - 10.75) / 2, 3.45, 3.2]}><boxGeometry args={[1.2, 0.12, 9.8]} /><meshLambertMaterial color="#5E625C" /></mesh>
  <mesh position={[-10.72, 1.7, 3.2]}><boxGeometry args={[0.1, 3.4, 9.7]} /><meshLambertMaterial color="#858881" /></mesh>
  <WallHole c={[X22, 1.3, WALL_Z - 0.01]} r={0.75} k={1} yaw={Math.PI} />
  <pointLight position={[X22, 1.3, WALL_Z + 0.5]} color="#5A6EA8" intensity={1.2} distance={2.5} decay={1.5} />
  <Rubble center={[X22, 0, WALL_Z - 0.7]} size={[1.8, 0.8]} n={9} k={1} t={t} seed={5} />
  <Extinguisher position={[X22 + 0.9, 0, -3.3]} rotation={[0, 0.4, Math.PI / 2]} />
  <hemisphereLight args={['#3A4E86', '#16181C', 0.95]} />
  <directionalLight position={[10, 14, -18]} color="#9FB2E0" intensity={0.9} />
  <pointLight position={[X22 - 0.4, 2.6, -4.6]} color="#C8D4F0" intensity={2.4} distance={6} decay={1.4} />
  <pointLight position={[-6.4, 2.2, -2.6]} color="#C8D4F0" intensity={1.8} distance={5} decay={1.4} />
  <WallLamp position={LAMP} on={lampOn(t)} />
  {lampOn(t) && <><spotLight position={LAMP} target-position={[-11.8, 0, -3.0]} angle={0.8} penumbra={0.5} intensity={34} distance={10} decay={1.3} color="#FFE7B8" /><pointLight position={[-11.6, 1.2, -3.4]} color="#FFE7B8" intensity={1.6} distance={4} decay={1.4} /></>}
  {Array.from({length: NCAR}, (_, i) => <PoliceCar key={i} t={t} position={carAt(i).p} yaw={carAt(i).yaw} seed={i * 3} unit="สายตรวจนอกเรือนจำ · 191" />)}
  {[0, 1, 3].map((i) => <SirenLights key={i} t={t + i * 0.07} position={add(carAt(i).p, [0, 2, 0])} power={3} />)}
  {groundPhone(t)}</>;
/** blob shadows from the lamp under the four that have one (not him) */
const shadows = (t: number) => !lampOn(t) ? null : <>{[0, 1, 2, 3].map((i) => { const p = gangAt(i, t).p; return <BlobShadow key={i} at={[p[0], 0.004, p[2]]} from={LAMP} size={[0.5, 0.95, 0.45, 0.4][i]} />; })}</>;

// =====================================================================================================
const lamp = (p: V3, i = 1.4, c = '#9AAEE6') => <pointLight position={p} color={c} intensity={i} distance={4} decay={1.4} />;
const IN = (t: number, C: Cast, o: {only?: number[]; man?: boolean; tags?: boolean} = {}) => { const m = o.man === false ? null : man(C, t);
  return {m, node: <>{inside(t, o.only ? {only: o.only} : {})}{m?.node}{m && o.tags && tags(t, m.head)}</>}; };
const OUT = (t: number, C: Cast, o: {man?: boolean} = {}) => { const m = o.man === false ? null : man(C, t);
  return {m, node: <>{outside(t)}{guard(C, t)}{cops(C, t)}{gangOut(t)}{m?.node}{shadows(t)}</>}; };
const kick = (t: number, hits: string[], d = 0.1, a = 0.012) => near(t, hits.map(ev), d) ? a : 0;
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: the corridor with no guard — his post adrift and empty; the fire ball drifts on along the cells
    const {node} = IN(t, C, {man: false});
    return {node: <>{node}{lamp([1.5, 2.4, 3.2], 1.4)}</>, cam: mv({pos: [-0.6, 1.9, 6.2], look: [X19 - 0.6, 1.3, 1.6], fov: 50}, lt, {arrive: 0.04, push: 0.1}), bg: NIGHT_BG};
  },
  melt19: (t, lt, C) => {
    // the bars of 19 melt, the plastic wrap shrivels: the fan
    const {node} = IN(t, C, {man: false, only: [24, 19]});
    return {node: <>{node}{lamp([X19, 2.4, 2.6], 1.2)}</>, cam: mv({pos: [X19 + 0.9, 1.65, 3.9], look: [X19 - 0.3, 1.2, 1.2], fov: 50}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  melt20: (t, lt, C) => {
    // and 20: the durian
    const {node} = IN(t, C, {man: false, only: [19, 20]});
    return {node: <>{node}{lamp([X20, 2.4, 2.6], 1.2)}</>, cam: mv({pos: [X20 + 0.9, 1.65, 3.9], look: [X20 - 0.3, 1.2, 1.0], fov: 50}, lt, {arrive: 0.03, push: 0.1}), bg: NIGHT_BG};
  },
  gang: (t, lt, C) => {
    // out they float into the corridor: the fan in its cuffs, the durian, the jar
    const {node} = IN(t, C, {man: false});
    return {node: <>{node}{lamp([X19 - 0.5, 2.5, 3.2], 1.4)}</>, cam: mv({pos: [X19 + 2.2, 2.0, 5.4], look: [X19 - 1.2, 1.2, 2.2], fov: 52}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  gather: (t, lt, C) => {
    // down the corridor towards 22, everyone adrift the same way
    const {node} = IN(t, C);
    return {node: <>{node}{lamp([X18, 2.4, 3.0], 1.4)}</>, cam: mv({pos: [X18 + 0.5, 2.0, 4.6], look: [X22 + 0.5, 1.2, 1.2], fov: 48}, lt, {arrive: 0.02, push: 0.06}), bg: NIGHT_BG};
  },
  hole: (t, lt, C) => {
    // cell 22: the gang round the hole, night sky through it
    const {node} = IN(t, C, {only: [22, 23]});
    return {node: <>{node}{lamp([X22 + 0.6, 2.4, 2.2], 1.6)}</>, cam: mv({pos: [X22 + 1.3, 1.5, 3.4], look: [X22, 1.2, -0.6], fov: 50}, lt, {arrive: 0.02, push: 0.1}), bg: NIGHT_BG};
  },
  count: (t, lt, C) => {
    // behind him, high: he counts them — 1, 2, 3, 4
    const {node} = IN(t, C, {only: [22, 23], tags: true});
    return {node: <>{node}{lamp([X22 + 0.4, 2.5, 1.8], 1.6)}</>, cam: mv({pos: [X22 + 0.9, 2.3, 3.4], look: [X22 - 0.1, 1.1, -0.2], fov: 60}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  five: (t, lt, C) => {
    // from the hole side: and five — himself
    const {node, m} = IN(t, C, {only: [22, 23], tags: true}); const h = m!.head;
    return {node: <>{node}{lamp([X22 + 0.2, 2.4, 0.2], 1.8, '#FFF0C8')}</>, cam: mv({pos: [X22 + 0.6, 1.75, 2.5], look: [h[0], h[1] - 0.1, h[2]], fov: 44}, lt, {arrive: 0.02, push: 0.1, shake: kick(t, ['c5'])}), bg: NIGHT_BG};
  },
  plate: (t, lt, C) => {
    // the institution, frontal: cell 22, the gang of five at the hole. The plate drops.
    const {node} = IN(t, C, {only: [22, 23]});
    return {node: <>{node}{lamp([X22, 2.6, 2.8], 1.6)}</>, cam: mv({pos: [X22 + 0.1, 1.9, 5.6], look: [X22, 1.3, -0.2], fov: 44}, lt, {arrive: 0.04, push: 0.1, shake: kick(t, ['plate'])}), bg: NIGHT_BG};
  },
  call: (t, lt, C) => {
    // close from the hole side: phone up — he reports his own gang
    const {node, m} = IN(t, C, {only: [22]}); const h = m!.head;
    return {node: <>{node}{lamp([X22 + 0.3, 2.3, 0.4], 1.8, '#FFF0C8')}</>, cam: mv({pos: [X22 + 0.8, 1.65, 2.75], look: [h[0], h[1] - 0.25, h[2]], fov: 50}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  pocket: (t, lt, C) => {
    // outside by car 0: the guard sits cuffed, the cops round him — and his phone, on the ground, rings
    const {node} = OUT(t, C, {man: false});
    return {node: <>{node}</>, cam: mv({pos: [-8.6 + 0.3 * lt, 1.5 - 0.1 * lt, -1.9 - 0.2 * lt], look: [-6.6, 0.6, -3.5], fov: 50}, lt, {arrive: 0.02, push: 0.2, roll: 2}), bg: OUT_BG};
  },
  ringcu: (t, lt, C) => {
    // close: "incoming call · cell 24"
    const {node} = OUT(t, C, {man: false});
    return {node: <>{node}</>, cam: mv({pos: [PHONE_OUT[0] - 0.95, 1.1, PHONE_OUT[2] + 0.85], look: add(PHONE_OUT, [0.1, 0.15, -0.2]), fov: 46}, lt, {arrive: 0.02, push: 0.12}), bg: OUT_BG};
  },
  cuffed: (t, lt, C) => {
    // his hands are cuffed behind his back
    const {node} = OUT(t, C, {man: false});
    return {node: <>{node}</>, cam: mv({pos: [G_OUT[0] - 1.25, 1.1, G_OUT[2] + 0.9], look: [G_OUT[0] - 0.05, 0.45, G_OUT[2] - 0.2], fov: 48}, lt, {arrive: 0.02, push: 0.12}), bg: OUT_BG};
  },
  cant: (t, lt, C) => {
    // he strains at the phone a metre away — can't
    const {node} = OUT(t, C, {man: false});
    return {node: <>{node}</>, cam: mv({pos: [-7.8, 1.05, -1.6], look: [-6.8, 0.45, -3.2], fov: 46}, lt, {arrive: 0.02, push: 0.12}), bg: OUT_BG};
  },
  noone: (t, lt, C) => {
    // inside: nobody comes — the corridor empty, the post adrift
    const {node} = IN(t, C);
    return {node: <>{node}{lamp([POST[0], 2.4, POST[2] + 0.4], 1.4)}</>, cam: mv({pos: [POST[0] - 2.2, 1.8, POST[2] + 2.4], look: [POST[0] - 4.5, 1.2, 1.6], fov: 50}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  through: (t, lt, C) => {
    // cell 22: one by one, out through the hole
    const {node} = IN(t, C, {only: [22, 23]});
    return {node: <>{node}{lamp([X22 + 0.6, 2.4, 2.0], 1.6)}</>, cam: mv({pos: [X22 + 1.2, 1.8, 3.2], look: [X22, 1.25, -1.0], fov: 48}, lt, {arrive: 0.02, push: 0.1}), bg: NIGHT_BG};
  },
  drops: (t, lt, C) => {
    // outside: out of the hole, and down — gravity, one at a time
    const {node} = OUT(t, C); const ar = [0, 1, 2, 3, 4].filter((i) => t > ev(`ex${i}`) - 0.05 && t < ev(`ld${i}`) + 0.25).map((i) => gangAt(i, t).p);
    return {node: <>{node}{ar.map((p, i) => <GravityArrow key={i} position={[p[0] + 0.45, Math.max(0.7, p[1] + 0.4), p[2]]} s={0.45} />)}</>,
      cam: mv({pos: [X22 - 2.2, 1.3, -6.6], look: [X22, 1.0, -2.4], fov: 46}, lt, {arrive: 0.02, push: 0.08}), bg: OUT_BG};
  },
  dropcu: (t, lt, C) => {
    // closer: the last one is him — thump, on his feet
    const {node} = OUT(t, C);
    return {node: <>{node}</>, cam: mv({pos: [X22 + 0.95, 1.15, -5.3], look: [X22 + 0.45, 0.95, -2.6], fov: 46}, lt, {arrive: 0.02, push: 0.1, shake: kick(t, ['ld4'], 0.12, 0.018)}), bg: OUT_BG};
  },
  stand: (t, lt, C) => {
    // outside the wall, on his feet, free
    const {node, m} = OUT(t, C); const h = m!.head;
    return {node: <>{node}</>, cam: mv({pos: [h[0] - 0.25, h[1] - 0.15, h[2] - 1.9], look: [h[0], h[1] - 0.3, h[2]], fov: 44}, lt, {arrive: 0.03, push: 0.12}), bg: OUT_BG};
  },
  free: (t, lt, C) => {
    // wide from the dark beyond the wall's end: the gang walks out towards us, the prison behind
    const {node} = OUT(t, C);
    return {node: <>{node}</>, cam: mv({pos: [-15.2, 1.4, -4.6], look: [-10.5, 1.2, -2.4], fov: 48}, lt, {arrive: 0.02, push: 0.08}), bg: OUT_BG};
  },
  lamp: (t, lt, C) => {
    // under the lamp at the corner: four shadows on the ground — and none under him
    const {node} = OUT(t, C);
    return {node: <>{node}</>, cam: mv({pos: [-11.9, 3.3, -6.9], look: [-11.9, 0.35, -2.9], fov: 48}, lt, {arrive: 0.02, push: 0.1}), bg: OUT_BG};
  },
  cell24: (t, lt, C) => {
    // inside, cell 24, barred: his shadow, still on the floor
    return {node: <>{inside(t, {only: [24]})}{lamp([0.6, 2.4, 0.2], 1.4)}</>, cam: mv({pos: [0.55, 2.3, 3.4], look: [0.6, 0.2, -0.7], fov: 48}, lt, {arrive: 0.03, push: 0.12}), bg: NIGHT_BG};
  },
  night: (t, lt, C) => {
    // "คืนนั้น": the block, empty but for the Earth and the Moon going round
    return {node: <>{inside(t)}{lamp([X18 + 1.5, 2.4, 3.0], 1.4)}</>, cam: mv({pos: [1.8, 1.9, 6.4], look: [-1.6, 1.2, 1.0], fov: 50}, lt, {arrive: 0.02, push: 0.08}), bg: NIGHT_BG};
  },
  slide: (t, lt, C) => {
    // his shadow begins to slide across the floor of 24 towards the bars
    return {node: <>{inside(t, {only: [24]})}{lamp([0.6, 2.4, 0.4], 1.4)}</>, cam: mv({pos: [0.65, 1.6, 3.1], look: [0.6, 0.1, -0.2], fov: 46}, lt, {arrive: 0.02, push: 0.12}), bg: NIGHT_BG};
  },
  slidecu: (t, lt, C) => {
    // low, at the bars: it keeps coming. Black.
    return {node: <>{inside(t, {only: [24]})}{lamp([0.6, 1.4, 1.2], 1.4)}</>, cam: mv({pos: [0.62, 0.45, 2.3], look: [0.6, 0.05, 0.0], fov: 50}, lt, {arrive: 0, push: 0.16}), bg: NIGHT_BG};
  },
};
void [cl, Icebox];
