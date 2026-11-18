import React from 'react';
import * as THREE from 'three';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {Mosquito, Handcuffs, Jar} from '../AbsurdEp1/props';
import {CellPlate, Fan} from '../AbsurdEp2/props';
import {Durian, Smell, SmellFog} from '../AbsurdEp4/props';
import {Bubbles, FoamRing, FoamPile} from '../AbsurdEp5/props';
import {PoliceCar} from '../AbsurdEp7/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {Moon} from '../AbsurdEp15/props';
import {Phone} from '../AbsurdEp16/props';
import {Icebox, ICEBOX, Fire} from '../AbsurdEp17/props';
import {makeFly} from '../AbsurdEp19/props';
import {Contract} from '../AbsurdEp20/props';
import {WallPlan} from '../AbsurdEp21/props';
import {SirenLights} from '../absurdkit';
import {ps, body, hideProps, P, CamRig, mv, near, sm, V3, Cast, ShotOut, hand, hw, bw} from '../lifekit/stage';
import {Soap, SoapStamp, Window24, WIN24, BlockOutside, WALL_Z, DOOR_X, Searchlight, Warrant} from './props';

export {CamRig};
/** EP22 · แก๊งห้อง 24 S1E3 หมายจับคนในคุก. Night, where EP21 stopped: he is flat as paper and stuck half out of the front bars of 24; the
 *  slippery thing on his hand is the soap (EP5, at large). It signs box 2 of the gang contract with its own print, soaps him all over and
 *  pulls — and slips out of his hand, the way soap does. He twangs back across the cell and lodges head first in the back window: top half
 *  OUTSIDE the prison. Abandoning a helpless person! He calls with the hand that is outside, so the police OUTSIDE answer. Ten cars ring the
 *  block, a searchlight finds a prisoner half out of the wall: escape from custody! They catch the soap at the yard door; it slips its cuffs.
 *  He gets a warrant for escaping — while still in jail. That night, cell 20 begins to smell (the durian: S1E4).
 *
 *  LAYOUT (metres; yaw 0 faces +z; a character's LEFT is +x at yaw 0) — the EP20/21 block, unchanged inside
 *  cells   a row along x, each an EP1 Cell (3 × 3, front bars at z 1.5, back wall z −1.5), CW 3.05 apart:
 *          23 fridge (−2CW) · 18 Earth + Moon (−CW) · 24 HIM (0) · 19 fan (+CW) · 20 durian (+2CW). All still staring at 24 (EP21 end state).
 *          Cell 24's back window is WIN24 (0.55 × 0.8 at x 0.6, y 2.03, bars x 0.45/0.6/0.75), bigger than EP1's, drawn over the old one.
 *  outside the block wall z −1.56…−1.66 (BlockOutside), a yard of asphalt to a fence at z −24; the yard door at x 8.6.
 *  him     A (until `snap`): flat (depth × 0.12), sideways (yaw π/2, front +x), at (0.35, z≈1.5) in the front bars — right half (+z) in the corridor.
 *          B (`snap`…`lodge`): twangs back and up, rolling −π/2 about his own forward axis.
 *          C (from `lodge`): lying on his LEFT side, head −z, feet at WIN_FEET (0.675, 2.0, −0.55): hips in the window, head/arms OUTSIDE
 *          (head ≈ z −2.3), legs inside the cell. Right side up. He faces +x, so his face is filmed from +x.
 *  the soap  on the contract in his right (outside) hand → stamps box 2 → rubs down his front → in his fist, pulling → squirts out at `slip`
 *          and skids off down the corridor (+x). Reappears out of the gap under the yard door at `catch`.
 *  police  offB alone on foot patrol in the yard at (2.6, −7.5) facing away (yaw π) when the call comes; turns to the wall at `lookup`.
 *          Ten cars on an arc r 8.5 round (0.6, −1.6), noses in. cmd1 at the yard door (catches the soap); cmd2–5 in front of cars.
 *          Searchlight on a tripod at (−2.4, 1.4, −8.6).
 *
 *  TRAPS OF THIS EPISODE
 *  1. "ครึ่งตัว" twice: the front bars (A) read only from the corridor diagonal; the window (C) reads from outside (head and arms out of a
 *     wall) AND inside (legs out of a window). Film C from both sides, never only one.
 *  2. Roll is set on his wrapper AFTER body(): no lookW in state B/C (body()'s head turn is computed in the upright frame).
 *  3. The soap has no face (rule 4) — EP22 Soap, not EP5's.
 *  4. The contract exists from frame 0 (in his right hand under the soap); it falls to the corridor floor at `rub0` and stays there.
 *  5. Box 2 is the soap's print, box 1 the mosquito's blood (EP20). ECU must show both.
 *  6. Count: ten cars — the aerial shows all ten on one arc.
 *  7. EP7's PoliceCar says "หน่วยปราบปรามไฟฟ้าสถิต" on the doors: pass `unit`.
 *  8. The warrant goes on the wall right under HIS window: the irony shot must hold poster + him + the wall in one frame.
 *  9. Phone in his RIGHT hand (the upper side when lying): EAR_R. The officer's phone in his LEFT hand. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CW = 3.05, X23 = -2 * CW, X18 = -CW, X19 = CW, X20 = 2 * CW;
const MAN = {x: 0.35, z: 1.5};
const EAR_R: V3 = [-12, 12, 2];
const WIN_FEET: V3 = [WIN24.bars[1] + 0.075, 2.0, -0.85];   // pelvis lands just outside the wall (z ≈ −1.73), head ≈ −2.4
const NIGHT_BG = {color: '#0E1424'}, OUT_BG = {color: '#0B1020'};

// =====================================================================================================
// THE BLOCK at night, every inmate still staring at 24 (EP21's end state)
// =====================================================================================================
const EARTH_C: V3 = [X18, 1.08, -0.15], EARTH_R = 0.95;
const ORB = {r: 1.2, y: 2.05, w: (Math.PI * 2) / 3.2};
const moonAt = (t: number): V3 => { const a = ORB.w * t; return [EARTH_C[0] + Math.cos(a) * ORB.r, ORB.y + 0.1 * Math.sin(a), EARTH_C[2] + Math.sin(a) * ORB.r]; };
const fridgeP: V3 = [X23 + 0.1, 0, -0.6];
const DURIAN: V3 = [X20 + 0.1, 0.32, -0.5];
type Who = 'fridge' | 'earth' | 'man' | 'fan' | 'durian';
const CELLS: {x: number; no: number; who: Who}[] = [{x: X23, no: 23, who: 'fridge'}, {x: X18, no: 18, who: 'earth'}, {x: 0, no: 24, who: 'man'}, {x: X19, no: 19, who: 'fan'}, {x: X20, no: 20, who: 'durian'}];
const inmate = (who: Who, t: number) => who === 'earth' ? <>
    <Earth t={t} position={EARTH_C} r={EARTH_R} yaw={1.2} shake={0.25} eyes={false} />
    <EarthCuff center={EARTH_C} r={EARTH_R} close={1} tilt={[0.3, 0, 0.25]} />
    <Moon t={t} position={moonAt(t)} r={0.28} glow={0.9} spin={Math.PI / 2 - ORB.w * t} />
    <pointLight position={add(moonAt(t), [0, 0.2, 0])} color="#FFF0C8" intensity={2.4} distance={5} decay={1.6} /></>
  : who === 'fan' ? <Fan position={[X19, 0, -0.2]} scale={1.35} headYaw={-0.95} blade={t * 31} blur={1} lit={3} />
  : who === 'fridge' ? <><Icebox position={fridgeP} door={0.47} glow={0.9} frost={0.3} />
    <Fire position={[fridgeP[0], ICEBOX.shelf + 0.02, fridgeP[2]]} t={t} size={0.3} light={0.5} /></>
  : who === 'durian' ? <Durian position={DURIAN} r={0.3} yaw={1.2} face={false} /> : null;
const jar25 = (t: number) => <><Jar position={[-0.45, 0, 2.15]} scale={1.6}><Mosquito t={t} position={[0, 0.06, 0]} flap={0.2} fill={1} scale={2} /></Jar>
  <CellPlate text="ห้อง 25" position={[-0.45, 0.36, 2.25]} w={0.16} /></>;
const block = (t: number, o: {only?: number[]} = {}) => <>
  {CELLS.filter((c) => !o.only || o.only.includes(c.no)).map((c) => <group key={c.no}><group position={[c.x, 0, 0]}>
    <Cell t={t} days={0.98} marks={c.no === 24 ? 11 : 9 + (c.no % 5)} rails={c.no === 24 ? [0.04, 2.6] : undefined} />
    <CellPlate text={`ห้อง ${c.no}`} position={[0, 2.12, 1.54]} w={0.64} /></group>{inmate(c.who, t)}</group>)}
  {(!o.only || o.only.includes(24)) && <><WallPlan position={[-1.48, 1.55, -0.2]} rotation={[0, Math.PI / 2, 0]} w={1.5} /><Window24 z={-1.493} /></>}
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 4.75]}><planeGeometry args={[22, 6.5]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.6, 8.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[22, 3.2]} /><meshLambertMaterial color="#6F736D" /></mesh>
  {[-4.5, 0, 4.5].map((x) => <pointLight key={x} position={[x, 2.6, 3.4]} color="#5A6EA8" intensity={0.5} distance={6} decay={1.5} />)}
  <pointLight position={[0.9, 2.4, -0.4]} color="#9AAEE6" intensity={1.4} distance={3} decay={1.4} />
  {jar25(t)}<FoamRing center={[0.42, 0.005, 1.68]} r={0.12} k={sm((t - ev('snap')) / 0.4)} n={18} t={t} size={0.03} /></>;

// =====================================================================================================
// OUTSIDE: the wall, the yard at night, the ten cars, the searchlight
// =====================================================================================================
const NCAR = 10, ARC = {c: [0.6, 0, -1.6] as V3, r: 8.5, a0: -1.08, a1: 1.08};
const carAt = (i: number, t: number) => { const a = lerp(ARC.a0, ARC.a1, i / (NCAR - 1)); const t0 = ev('cars0') + i * 0.04;
  const k = sm((t - t0) / 0.75); const r = ARC.r + 12 * (1 - k);
  return {p: [ARC.c[0] + Math.sin(a) * r, 0, ARC.c[2] - Math.cos(a) * r] as V3, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), moving: k < 0.98}; };
const cars = (t: number, only?: number[]) => t < ev('cars0') ? null : <>{Array.from({length: NCAR}, (_, i) => i).filter((i) => !only || only.includes(i)).map((i) => {
  const c = carAt(i, t); return <PoliceCar key={i} t={t} position={c.p} yaw={c.yaw} seed={i * 3} spin={c.moving ? -12 : 0} unit="สายตรวจนอกเรือนจำ · 191" />; })}
  {[1, 5, 8].map((i) => t > ev('cars0') + 0.4 && <SirenLights key={i} t={t + i * 0.07} position={add(carAt(i, t).p, [0, 2, 0])} power={4} />)}</>;
const LAMP: V3 = [-2.4, 1.4, -8.6];
const beamTo = (t: number): V3 => { const k = sm((t - ev('spot') + 0.9) / 0.9); return lerp3([-6.5, 1.6, WALL_Z], [0.55, 2.0, -2.0], k); };
const beamK = (t: number) => sm((t - ev('spot') + 1.1) / 0.2);
const outside = (t: number, o: {cars?: number[]; lamp?: boolean} = {}) => { const bk = beamK(t); const to = beamTo(t); return <>
  <BlockOutside cells={CELLS.map((c) => c.x)} />
  <hemisphereLight args={['#3A4E86', '#16181C', 0.95]} />
  <directionalLight position={[10, 14, -18]} color="#9FB2E0" intensity={0.9} />
  <pointLight position={[WIN24.x + 1.2, WIN24.y + 0.3, WALL_Z - 1.4]} color="#A8BCEA" intensity={1.6} distance={3.5} decay={1.4} />
  {cars(t, o.cars)}
  {o.lamp !== false && t > ev('cars1') - 0.6 && <Searchlight at={LAMP} to={to} k={bk} />}
  {bk > 0.01 && <spotLight position={LAMP} target-position={to} angle={0.09} penumbra={0.5} intensity={60 * bk} distance={30} decay={1.2} color="#FFF4D6" />}
  {bk > 0.01 && <pointLight position={add(to, [0.6, 0.2, -0.9])} color="#FFF4D6" intensity={2.2 * bk} distance={2.6} decay={1.3} />}</>; };

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

// ---- him
const pullK = (t: number) => t < ev('slip') ? sm((t - ev('pull')) / 0.3) : 0;
const manZ = (t: number) => { const u = t - ev('slip');
  return MAN.z + 0.1 * pullK(t) + 0.03 * Math.sin(t * 16) * pullK(t) + (u > 0 ? 0.08 * Math.exp(-u * 2.5) * Math.sin(u * 18) : 0); };
const flyK = (t: number) => cl((t - ev('snap')) / (ev('lodge') - ev('snap')));
/** where his wrapper sits (feet origin) and how far he is rolled onto his left side */
const manPose = (t: number): {p: V3; roll: number} => {
  if (t < ev('snap')) return {p: [MAN.x, 0, manZ(t)], roll: 0};
  const k = flyK(t), e = k * k * (3 - 2 * k);
  if (k < 1) { const s: V3 = [MAN.x, 0, manZ(ev('snap'))]; const p = lerp3(s, WIN_FEET, e); return {p: [p[0], p[1] + 0.7 * Math.sin(Math.PI * e), p[2]], roll: -Math.PI / 2 * sm(k * 1.4)}; }
  const u = t - ev('lodge'); const kick = 0.06 * Math.exp(-u * 1.6) * Math.sin(u * 15) + 0.035 * Math.sin(t * 9) + 0.02 * Math.sin(t * 13.7);
  return {p: [WIN_FEET[0], WIN_FEET[1] + kick * 0.3, WIN_FEET[2]], roll: -Math.PI / 2 + kick};
};
// the contract in his right (outside) hand, flat, face up, top edge away from the bars; falls to the floor at `rub0`
const C0: V3 = [0.49, 1.13, 1.99], C_FLOOR: V3 = [0.78, 0.004, 2.2];
const BOX2W: V3 = [C0[0] + 0.046, C0[1], C0[2] + 0.1127];
const contractAt = (t: number) => { const k = sm((t - ev('rub0')) / 0.5); const p = lerp3(C0, C_FLOOR, k);
  return {p: [p[0], p[1] + 0.15 * Math.sin(Math.PI * k), p[2]] as V3, r: [-Math.PI / 2, 0, 0.9 * k] as V3}; };
// hand targets keep x ≈ his own x: he is scaled 0.12 along world x, so any x offset is ×8 in his frame and the arm overreaches
const HAND_C: V3 = [0.37, 1.1, 1.88];
const pullHand = (t: number): V3 => [0.37, 1.16, 2.1 + 0.16 * pullK(t) + 0.04 * Math.sin(t * 16) * pullK(t)];
const man = (C: Cast, t: number, o: {face?: string} = {}) => {
  const {p, roll} = manPose(t);
  const m = guy(C, 'nai', p[0], p[2], Math.PI / 2, t, {face: o.face ?? 'half', y: p[1]});
  m.w.rotation.set(0, Math.PI / 2, roll, 'YXZ'); m.w.scale.z *= 0.12; m.w.updateMatrixWorld(true);
  const nodes: React.ReactNode[] = [];
  if (t < ev('snap')) {
    if (t < ev('rub0')) hand(m.I, 'R', HAND_C, 'open');
    else if (t < ev('pull') - 0.25) hand(m.I, 'R', [0.36, 1.0, 1.72], 'open');
    else if (t < ev('slip')) hand(m.I, 'R', lerp3([0.36, 1.0, 1.72], pullHand(t), sm((t - ev('pull') + 0.25) / 0.25)), 'fist');
    else hand(m.I, 'R', lerp3(pullHand(ev('slip')), [0.36, 1.3, 1.75], sm((t - ev('slip')) / 0.15)), 'open');
  } else if (t > ev('lodge')) {
    const hang = (s: number): V3 => [WIN_FEET[0] + 0.005 * s, (s > 0 ? 1.72 : 1.5) + 0.02 * Math.sin(t * 2 + s), -2.3];
    const ph0 = phoneK(t);
    if (ph0 > 0.01) { const ear = add(hw(m.I, EAR_R), [0.0, 0.03, 0.0]); const ph = lerp3(hang(1), ear, ph0); hand(m.I, 'R', add(ph, [0.0, -0.02, 0.13]), 'cup');
      nodes.push(<Phone key="ph" position={ph} rotation={[0, Math.PI / 2, -Math.PI / 2 + 0.2]} lit={1} />); }
    else hand(m.I, 'R', hang(1), 'open');
    hand(m.I, 'L', hang(-1), 'open');
  }
  m.w.updateMatrixWorld(true); flyOn(m.I);
  return {...m, node: <><P o={m.w} />{nodes}</>}; };
const phoneK = (t: number) => sm((t - ev('dial') + 0.3) / 0.3) * (1 - sm((t - ev('cars0')) / 0.3));
/** his head, wherever he is */
const headW = (I: any): V3 => bw(I, 'Bip01_Head');

// ---- the soap
const soapRub = (u: number): V3 => { const pts: V3[] = [add(BOX2W, [0, 0.03, 0]), [0.39, 1.48, 1.68], [0.39, 1.25, 1.62], [0.39, 0.95, 1.66], [0.39, 0.5, 1.66], [0.4, 0.95, 1.7], [0.44, 1.12, 1.95]];
  const f = cl(u) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)); return lerp3(pts[i], pts[i + 1], sm(f - i)); };
const soapAt = (t: number): {p: V3; r: V3; squash: number} => {
  const S = ev('stamp');
  if (t < S - 0.35) return {p: add(BOX2W, [0, 0.032, 0]), r: [0, 0.3, 0], squash: 0};
  if (t < S) { const k = sm((t - S + 0.35) / 0.25); return {p: add(BOX2W, [0, 0.032 + 0.07 * k * (t < S - 0.1 ? 1 : (S - t) / 0.1), 0]), r: [0, 0.3, 0], squash: 0}; }
  if (t < ev('rub0')) return {p: add(BOX2W, [0, 0.026, 0]), r: [0, 0.3, 0], squash: Math.exp(-(t - S) * 8)};
  if (t < ev('pull') - 0.1) { const u = (t - ev('rub0')) / (ev('pull') - 0.1 - ev('rub0')); return {p: soapRub(u), r: [0, 0.3 + u * 6, Math.PI / 2 * sm(u * 3)], squash: 0.2}; }
  if (t < ev('slip')) return {p: add(pullHand(t), [0.01, 0.0, 0.06]), r: [0, 0, Math.PI / 2], squash: 0.15 * Math.sin(t * 16)};
  const u = t - ev('slip'), p0 = add(pullHand(ev('slip')), [0.01, 0, 0.06]);
  if (u < 0.5) return {p: [p0[0] + 0.6 * u, p0[1] + 2.6 * u - 6.2 * u * u, p0[2] + 3.2 * u], r: [u * 20, u * 14, 0], squash: 0};
  const land: V3 = [p0[0] + 0.3, 0.03, p0[2] + 1.6]; const s = u - 0.5;
  return {p: [land[0] + 4.5 * (1 - Math.exp(-s * 1.2)), 0.03, land[2] + 0.4 * (1 - Math.exp(-s * 1.2))], r: [0, s * 9, 0], squash: 0};
};
const SOAP_S = 1.4;
const soap = (t: number) => { if (t > ev('slip') + 3) return null; const s = soapAt(t); return <Soap position={s.p} rotation={s.r} squash={s.squash} scale={SOAP_S} />; };
const contract = (t: number) => { const c = contractAt(t);
  return <group position={c.p} rotation={c.r}><Contract position={[0, 0, 0]} blood={1} /><SoapStamp k={sm((t - ev('stamp')) / 0.08)} /></group>; };
const rubK = (t: number) => sm((t - ev('rub0')) / (ev('rub1') - ev('rub0') + 0.6)) * (1 - sm((t - ev('snap')) / 0.15));
const foamOnHim = (t: number) => <>
  <FoamRing center={add(t < ev('rub0') ? HAND_C : [0.36, 1.0, 1.72], [0, -0.05, 0])} r={0.06} k={t < ev('snap') ? 1 : 0} n={20} t={t} size={0.026} />
  <FoamPile center={[0.38, 0, 1.64]} size={[0.1, 1.55, 0.28]} k={rubK(t)} t={t} n={46} puff={0.045} />
  {t < ev('slip') + 1 && <Bubbles center={[0.6, 0.6, 1.9]} size={[0.7, 1.2, 0.5]} t={t} n={12} r={0.03} k={1} rise={0.25} seed={4} />}</>;

// ---- outside police
const OB = {x: 3.4, z: -7.3};
const offB = (C: Cast, t: number, face = 'half') => {
  const turned = sm((t - ev('lookup')) / 0.3); const yaw = Math.PI * (1 - turned);
  const g = guy(C, 'offB', OB.x, OB.z, yaw, t, {face, look: turned > 0.5 ? [0.6, 2.2, -1.8] : [OB.x + 3 * Math.sin(yaw), 1.6, OB.z + 3 * Math.cos(yaw)]});
  const nodes: React.ReactNode[] = [];
  const up = ev('answer'), down = ev('lookup') - 0.15; const ear = sm((t - up) / 0.22) * (1 - sm((t - down) / 0.25));
  if (t > ev('ring') - 0.1 && t < down + 0.4) { const low = add(bw(g.I, 'Bip01_Spine2'), [0, -0.12, 0]); const lowF: V3 = [low[0] + 0.25 * Math.sin(yaw), low[1], low[2] + 0.25 * Math.cos(yaw)];
    const e = add(hw(g.I, [12, 12, 2]), [0, -0.01, 0]); const buzz = t < up ? 0.006 * Math.sin(t * 90) : 0; const ph = lerp3(lowF, e, ear); const p2: V3 = [ph[0] + buzz, ph[1], ph[2]];
    hand(g.I, 'L', add(p2, [0, -0.06, 0]), 'cup'); nodes.push(<Phone key="p" position={p2} rotation={[0, yaw + Math.PI / 2 * ear, 0.18 * ear]} lit={1} />); }
  if (turned > 0.6) hand(g.I, 'R', [0.9, 2.6, -3.5], 'point');
  g.w.updateMatrixWorld(true); return {...g, node: <><P o={g.w} />{nodes}</>}; };
// the cops in front of the cars, pointing up at him
const COPS: {id: string; i: number}[] = [{id: 'cmd2', i: 2}, {id: 'cmd3', i: 4}, {id: 'cmd4', i: 5}, {id: 'cmd5', i: 7}];
const cops = (C: Cast, t: number) => <>{COPS.map(({id, i}) => { const c = carAt(i, t); const d = [ARC.c[0] - c.p[0], ARC.c[2] - c.p[2]]; const n = Math.hypot(d[0], d[1]);
  const x = c.p[0] + d[0] / n * 2.0, z = c.p[2] + d[1] / n * 2.0; const g = guy(C, id, x, z, Math.atan2(d[0], d[1]), t, {face: 'angry', look: [0.6, 2.0, -2.2]});
  hand(g.I, 'R', add(bw(g.I, 'Bip01_Head'), [d[0] / n * 0.45 + (0.6 - x) * 0.02, 0.15, d[1] / n * 0.45]), 'point'); g.w.updateMatrixWorld(true); return <P key={id} o={g.w} />; })}</>;
// cmd1 at the yard door: catches the soap at `grab` in both hands, cuffs it at `cuff`, it squirts up out of them at `slip2`
const D1 = {x: DOOR_X - 0.55, z: -2.2, yaw: Math.PI - 0.6};
const HOLD: V3 = [D1.x + 0.19, 1.12, D1.z - 0.28];
const soap2 = (t: number): {p: V3; r: V3} | null => { const g = ev('grab');
  if (t < g - 0.6) return null;
  if (t < g - 0.3) { const k = (t - g + 0.6) / 0.3; return {p: [DOOR_X + 0.1 - 0.15 * k, 0.03, WALL_Z - 0.04 - 0.75 * k], r: [0, k * 6, 0]}; }
  if (t < g) { const k = (t - g + 0.3) / 0.3; const a: V3 = [DOOR_X - 0.05, 0.03, WALL_Z - 0.79]; return {p: [lerp(a[0], HOLD[0], k), lerp(a[1], HOLD[1], k) + 0.35 * Math.sin(Math.PI * k), lerp(a[2], HOLD[2], k)], r: [k * 9, k * 4, 0]}; }
  if (t < ev('slip2')) return {p: HOLD, r: [0, 0.4, 0]};
  const u = t - ev('slip2'); if (u > 0.9) return null; return {p: [HOLD[0] - 0.6 * u, HOLD[1] + 6 * u - 3 * u * u, HOLD[2] - 1.4 * u], r: [u * 18, u * 11, 0]}; };
const cmd1 = (C: Cast, t: number, face = 'half') => { const s = soap2(t);
  const g = guy(C, 'cmd1', D1.x, D1.z, D1.yaw, t, {face, look: s ? s.p : [DOOR_X, 0.2, WALL_Z]});
  const nodes: React.ReactNode[] = [];
  const holding = t > ev('grab') - 0.05; const after = t > ev('slip2');
  if (holding) { hand(g.I, 'L', after ? add(HOLD, [-0.12, -0.05, -0.05]) : add(HOLD, [-0.06, -0.03, -0.02]), after ? 'open' : 'cup');
    const RING: V3 = add(HOLD, [-0.033, 0, -0.077]);   // ring 1 centred on the bar (cuffs yawed 0.4 + π/2, size 2.4: ring offset r·1.45 along their x)
    const cuffP: V3 = t < ev('cuff') ? lerp3([D1.x - 0.2, 1.0, D1.z - 0.25], RING, sm((t - ev('cuff') + 0.35) / 0.3)) : add(RING, [0, after ? -0.14 * sm((t - ev('slip2') - 0.1) / 0.3) : 0, 0]);
    hand(g.I, 'R', add(cuffP, [-0.05, -0.02, -0.06]), 'fist');
    nodes.push(<Handcuffs key="c" k={1} position={cuffP} rotation={[after ? 0.9 * sm((t - ev('slip2') - 0.1) / 0.3) : 0, 0.4 + Math.PI / 2, 0]} size={2.4} />); }
  if (s) nodes.push(<Soap key="s" position={s.p} rotation={s.r} scale={1.8} />);
  g.w.updateMatrixWorld(true); return {...g, node: <><P o={g.w} />{nodes}</>}; };
// offB at the wall under his window with the warrant: slaps it up at `slap`
const WB = {x: 1.4, z: -2.35};
const POSTER: V3 = [1.3, 1.22, WALL_Z - 0.008];
const offBWall = (C: Cast, t: number) => { const g = guy(C, 'offB', WB.x, WB.z, 0, t, {face: 'angry', look: POSTER});
  const k = sm((t - ev('slap') + 0.3) / 0.3); const pp = lerp3([WB.x - 0.05, 1.15, WB.z + 0.3], POSTER, k);
  hand(g.I, 'R', add(pp, [0.05, 0.0, -0.05]), 'open'); if (t > ev('slap') + 0.5) hand(g.I, 'R', [WB.x - 0.25, 0.95, WB.z + 0.15], 'open');
  g.w.updateMatrixWorld(true);
  return <><P o={g.w} /><Warrant position={pp} rotation={[0, Math.PI, 0]} /></>; };
const posterUp = (t: number) => t > ev('slap') ? <Warrant position={POSTER} rotation={[0, Math.PI, 0]} /> : null;

// =====================================================================================================
const nightLight = (p: V3, i = 1.5) => <pointLight position={p} color="#8FA6E0" intensity={i} distance={4} decay={1.4} />;
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0, where EP21 stopped: close on his flat face in the bars, foam round the outside hand, a pink bar on the paper in it
    const m = man(C, t, {face: 'wide'});
    return {node: <>{block(t, {only: [24]})}{m.node}{soap(t)}{contract(t)}{foamOnHim(t)}{nightLight([1.1, 1.7, 2.3])}</>,
      cam: mv({pos: [1.8, 1.4, 2.4], look: [0.45, 1.3, 1.75], fov: 50}, lt, {arrive: 0.04, push: 0.09}), bg: NIGHT_BG};
  },
  halfwide: (t, lt, C) => {
    // EP21's last wide: flat, half out of the bars, at night; bubbles drift; every cell still staring
    const m = man(C, t, {face: 'half'});
    return {node: <>{block(t)}{m.node}{soap(t)}{contract(t)}{foamOnHim(t)}{nightLight([1.4, 2.2, 2.2], 1.6)}</>,
      cam: mv({pos: [3.2, 1.65, 2.1], look: [0.35, 1.2, 1.6], fov: 52}, lt, {arrive: 0.03, push: 0.06}), bg: NIGHT_BG};
  },
  soap: (t, lt, C) => {
    // low and close: in his outside hand the contract, and on it, a pink bar of soap. No face.
    const m = man(C, t, {face: 'half'});
    return {node: <>{block(t, {only: [24]})}{m.node}{soap(t)}{contract(t)}{foamOnHim(t)}{nightLight([0.9, 1.6, 2.4])}</>,
      cam: mv({pos: [0.98, 1.28, 2.42], look: [0.5, 1.14, 2.02], fov: 40}, lt, {arrive: 0.05, push: 0.12, roll: -3}), bg: NIGHT_BG};
  },
  sign: (t, lt, C) => {
    // ECU from above: the soap hops and presses itself into box 2 — a pink print next to the mosquito's blood in box 1
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{soap(t)}{contract(t)}{nightLight([0.6, 1.6, 2.3], 1.8)}</>,
      cam: mv({pos: [0.5, 1.5, 2.36], look: [0.5, 1.13, 2.03], fov: 36}, lt, {arrive: 0.04, push: 0.1, shake: near(t, [ev('stamp')], 0.08) ? 0.003 : 0}), bg: NIGHT_BG};
  },
  rub: (t, lt, C) => {
    // the soap slides down his outside half; foam piles up on him; the contract flutters to the floor
    const m = man(C, t, {face: 'closed'});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{soap(t)}{contract(t)}{foamOnHim(t)}{nightLight([1.3, 1.6, 2.4])}</>,
      cam: mv({pos: [1.75, 1.15, 2.35], look: [0.4, 1.0, 1.66], fov: 54}, lt, {arrive: 0.05, push: 0.08}), bg: NIGHT_BG};
  },
  pull: (t, lt, C) => {
    // low and wide: the soap in his fist, tugging him out into the corridor with all its might
    const m = man(C, t, {face: 'shout'});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{soap(t)}{contract(t)}{foamOnHim(t)}{nightLight([1.4, 1.8, 2.6])}</>,
      cam: mv({pos: [1.45, 0.85, 3.05], look: [0.48, 1.12, 2.05], fov: 52}, lt, {arrive: 0.05, push: 0.06, shake: t > ev('pull') ? 0.004 : 0}), bg: NIGHT_BG};
  },
  slip: (t, lt, C) => {
    // close on the fist: "แต่สบู่" … it squirts out of his hand and away
    const m = man(C, t, {face: t > ev('slip') ? 'wide' : 'shout'});
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{soap(t)}{contract(t)}{foamOnHim(t)}{nightLight([1.2, 1.7, 2.6])}</>,
      cam: mv({pos: [1.25, 1.32, 2.75], look: [0.48, 1.15, 2.12], fov: 46}, lt, {arrive: 0.05, push: 0.08, shake: near(t, [ev('slip')], 0.12) ? 0.008 : 0}), bg: NIGHT_BG};
  },
  away: (t, lt, C) => {
    // floor level in the corridor: the bar skids off into the dark; behind it, he wobbles in the bars (no caption)
    const m = man(C, t, {face: 'wide'}); const s = soapAt(t).p;
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{soap(t)}{contract(t)}{foamOnHim(t)}{nightLight([1.8, 1.0, 3.0])}</>,
      cam: mv({pos: [0.2, 0.28, 3.4], look: [s[0], 0.25, s[2]], fov: 52}, lt, {arrive: 0.04, push: 0.16}), bg: NIGHT_BG};
  },
  snap: (t, lt, C) => {
    // from the corridor through the bars: he twangs back across the cell and up into the back window
    const m = man(C, t, {face: 'wide'});
    return {node: <>{block(t, {only: [24]})}{m.node}{contract(t)}{nightLight([0.6, 2.2, 0.3], 1.6)}</>,
      cam: mv({pos: [2.9, 1.55, 3.5], look: [0.35, 1.5, -0.2], fov: 54}, lt, {arrive: 0.04, push: 0.05, shake: near(t, [ev('lodge')], 0.12) ? 0.014 : 0}), bg: NIGHT_BG};
  },
  lodge: (t, lt, C) => {
    // inside, low: his legs stick out of the window, kicking — the rest of him is outside
    const m = man(C, t, {face: 'shout'});
    return {node: <>{block(t, {only: [24]})}{m.node}{nightLight([0.6, 1.6, 0.4], 1.6)}</>,
      cam: mv({pos: [-1.25, 1.15, 0.6], look: [0.55, 1.95, -1.15], fov: 56}, lt, {arrive: 0.04, push: 0.2}), bg: NIGHT_BG};
  },
  outside: (t, lt, C) => {
    // the other side of the wall: a prison block at night, and out of one small window, a man to the waist (no caption)
    const m = man(C, t, {face: 'wide'});
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [3.1, 2.25, -4.9], look: [0.8, 1.95, -1.95], fov: 42}, lt, {arrive: 0.03, push: 0.16}), bg: OUT_BG};
  },
  legs: (t, lt, C) => {
    // back inside: the legs, kicking, helpless
    const m = man(C, t, {face: 'shout'});
    return {node: <>{block(t, {only: [24]})}{m.node}{nightLight([0.9, 1.6, 0.2], 1.6)}</>,
      cam: mv({pos: [1.4, 2.45, -0.15], look: [0.5, 1.9, -1.25], fov: 56}, lt, {arrive: 0.04, push: 0.2, roll: 3}), bg: NIGHT_BG};
  },
  helpless: (t, lt, C) => {
    // outside, close: his face, arms hanging limp down the wall. The plate drops.
    const m = man(C, t, {face: 'closed'});
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [2.9, 2.35, -4.25], look: [0.75, 1.9, -2.1], fov: 46}, lt, {arrive: 0.05, push: 0.18, shake: near(t, [ev('plate')], 0.1) ? 0.01 : 0}), bg: OUT_BG};
  },
  phone: (t, lt, C) => {
    // the hand that is outside brings the phone up to his ear
    const m = man(C, t, {face: 'angry'});
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [2.1, 2.1, -3.2], look: [0.75, 2.02, -2.3], fov: 40}, lt, {arrive: 0.05, push: 0.1}), bg: OUT_BG};
  },
  answer: (t, lt, C) => {
    // out in the dark yard, one officer on foot patrol, back to the prison: his phone buzzes; he answers
    const m = man(C, t, {face: 'angry'}); const b = offB(C, t, 'half');
    return {node: <>{outside(t)}{m.node}{b.node}<pointLight position={[OB.x, 2.4, OB.z - 1.2]} color="#AFC0E8" intensity={1.4} distance={4} decay={1.4} /></>,
      cam: mv({pos: [OB.x + 0.15, 1.62, OB.z - 2.2], look: [OB.x - 0.2, 1.55, OB.z + 1.0], fov: 44}, lt, {arrive: 0.05, push: 0.18}), bg: OUT_BG};
  },
  lookup: (t, lt, C) => {
    // low, in front of him: he turns round, looks up at the wall and points
    const m = man(C, t, {face: 'angry'}); const b = offB(C, t, 'wide');
    return {node: <>{outside(t)}{m.node}{b.node}<pointLight position={[OB.x - 0.5, 1.9, OB.z + 1.2]} color="#B8C8F0" intensity={1.6} distance={3} decay={1.4} /></>, cam: mv({pos: [OB.x - 0.9, 1.15, OB.z + 1.7], look: [OB.x, 1.7, OB.z], fov: 44}, lt, {arrive: 0.04, push: 0.18}), bg: OUT_BG};
  },
  cars: (t, lt, C) => {
    // straight down from the sky: ten patrol cars close in on the block in one arc
    const m = man(C, t, {face: 'wide'});
    return {node: <>{outside(t, {lamp: false})}{m.node}<hemisphereLight args={['#4A5A88', '#1A1C20', 0.6]} /></>,
      cam: mv({pos: [0.6, 23, -6.2], look: [0.6, 0, -6.4], fov: 50}, lt, {arrive: 0.03, push: 0.15, roll0: 90}), bg: OUT_BG};
  },
  ring: (t, lt, C) => {
    // ground level: they skid in, light bars flashing, noses at the wall
    const m = man(C, t, {face: 'wide'});
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [4.2, 1.6, -13.0], look: [0.6, 1.2, -4.0], fov: 52}, lt, {arrive: 0.04, push: 0.14, shake: 0.004}), bg: OUT_BG};
  },
  spot: (t, lt, C) => {
    // wide from the yard: the searchlight sweeps along the wall and lands on him
    const m = man(C, t, {face: 'wide'});
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [6.2, 2.5, -11.2], look: [0.6, 2.0, -1.9], fov: 40}, lt, {arrive: 0.03, push: 0.12}), bg: OUT_BG};
  },
  found: (t, lt, C) => {
    // close: caught in the light, half out of the wall
    const m = man(C, t, {face: 'wide'});
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [2.25, 2.25, -3.45], look: [0.7, 1.98, -2.25], fov: 40}, lt, {arrive: 0.05, push: 0.09}), bg: OUT_BG};
  },
  aim: (t, lt, C) => {
    // behind the line of officers: every one of them pointing up at him (no caption)
    const m = man(C, t, {face: 'wide'}); const b = offB(C, t, 'angry');
    return {node: <>{outside(t)}{m.node}{b.node}{cops(C, t)}</>, cam: mv({pos: [7.6, 2.4, -12.5], look: [0.7, 1.9, -2.2], fov: 40}, lt, {arrive: 0.04, push: 0.06}), bg: OUT_BG};
  },
  charge2: (t, lt, C) => {
    // the institution, frontal and symmetric: the block wall, the beam, him in the middle. Plate.
    const m = man(C, t, {face: 'shout'});
    return {node: <>{outside(t)}{m.node}{cops(C, t)}</>, cam: mv({pos: [4.6, 0.6, -6.6], look: [0.75, 2.1, -1.9], fov: 46}, lt, {arrive: 0.05, push: 0.14, shake: near(t, [ev('plate2')], 0.1) ? 0.012 : 0}), bg: OUT_BG};
  },
  catch: (t, lt, C) => {
    // the yard door: the pink bar shoots out of the gap under it, bounces — an officer snatches it out of the air
    const c = cmd1(C, t, 'angry');
    return {node: <>{outside(t, {cars: []})}{c.node}<SirenLights t={t} position={[DOOR_X - 2.5, 1.8, -6]} power={3} /><pointLight position={[DOOR_X - 0.6, 2.2, -3.6]} color="#C8D4F0" intensity={1.8} distance={4} decay={1.4} /></>,
      cam: mv({pos: [DOOR_X - 1.5, 0.95, -4.9], look: [DOOR_X - 0.25, 0.7, -2.1], fov: 50}, lt, {arrive: 0.04, push: 0.14}), bg: OUT_BG};
  },
  cuffs: (t, lt, C) => {
    // ECU: cuffs click round the soap — and it squirts straight up out of them
    const c = cmd1(C, t, 'angry');
    return {node: <>{outside(t, {cars: []})}{c.node}<pointLight position={add(HOLD, [-0.3, 0.4, -0.5])} color="#C8D4F0" intensity={1.4} distance={2} decay={1.4} /></>,
      cam: mv({pos: add(HOLD, [0.08, 0.14, -0.42]), look: add(HOLD, [0, 0.02, 0]), fov: 40}, lt, {arrive: 0.04, push: 0.2, shake: near(t, [ev('cuff')], 0.08) ? 0.004 : 0}), bg: OUT_BG};
  },
  empty: (t, lt, C) => {
    // empty cuffs swinging from his fingers; he looks up into the dark (no caption)
    const c = cmd1(C, t, 'open');
    return {node: <>{outside(t, {cars: []})}{c.node}<SirenLights t={t} position={[DOOR_X - 2.5, 1.8, -6]} power={3} /><pointLight position={[DOOR_X - 0.6, 2.2, -3.6]} color="#C8D4F0" intensity={1.8} distance={4} decay={1.4} /></>,
      cam: mv({pos: add(HOLD, [0.25, 0.25, -0.75]), look: add(HOLD, [0, 0.15, 0]), fov: 50}, lt, {arrive: 0.04, push: 0.2}), bg: OUT_BG};
  },
  warrant: (t, lt, C) => {
    // right under his window an officer puts a poster up on the prison wall
    const m = man(C, t, {face: 'open'});
    return {node: <>{outside(t)}{m.node}{offBWall(C, t)}</>, cam: mv({pos: [3.3, 1.5, -4.3], look: [1.0, 1.7, -1.9], fov: 46}, lt, {arrive: 0.04, push: 0.07}), bg: OUT_BG};
  },
  poster: (t, lt, C) => {
    // ECU: slap — "หมายจับ", his face, "หลบหนีจากที่คุมขัง", "ห้อง 24"
    const m = man(C, t, {face: 'open'});
    return {node: <>{outside(t)}{m.node}{offBWall(C, t)}</>, cam: mv({pos: [1.3, 1.25, -2.45], look: [1.3, 1.22, WALL_Z], fov: 42}, lt, {arrive: 0.04, push: 0.08, shake: near(t, [ev('slap')], 0.1) ? 0.008 : 0}), bg: OUT_BG};
  },
  irony: (t, lt, C) => {
    // wide: the warrant on the wall, and right above it, the wanted man — out of the wall to the waist
    const m = man(C, t, {face: 'half'});
    return {node: <>{outside(t)}{m.node}{posterUp(t)}</>, cam: mv({pos: [3.7, 1.45, -5.0], look: [1.0, 1.7, -1.9], fov: 40}, lt, {arrive: 0.04, push: 0.14}), bg: OUT_BG};
  },
  inside: (t, lt, C) => {
    // through the front bars of 24: the rest of him — legs out of the back window. In jail.
    const m = man(C, t, {face: 'half'});
    return {node: <>{block(t, {only: [24, 18, 19]})}{m.node}{contract(t)}{nightLight([0.6, 2.2, 0.6], 1.6)}</>,
      cam: mv({pos: [-1.75, 1.65, 2.7], look: [0.55, 1.85, -1.1], fov: 46}, lt, {arrive: 0.04, push: 0.07}), bg: NIGHT_BG};
  },
  quiet: (t, lt, C) => {
    // pull back high over the yard: ten cars, the beam, one prisoner sticking out of the wall (no caption)
    const m = man(C, t, {face: 'half'}); const b = offB(C, t, 'angry');
    return {node: <>{outside(t)}{m.node}{posterUp(t)}{b.node}{cops(C, t)}</>, cam: mv({pos: [9.0, 6.0, -15.0], look: [0.6, 1.6, -2.4], fov: 42}, lt, {arrive: 0, push: -0.08}), bg: OUT_BG};
  },
  corridor: (t, lt, C) => {
    // "คืนนั้น": back inside, the dark corridor, gliding along the cells towards 20
    const m = man(C, t, {face: 'half'});
    return {node: <>{block(t)}{m.node}</>, cam: mv({pos: [2.4 + 0.9 * lt, 1.5, 4.2], look: [6.3, 1.0, 0.0], fov: 50}, lt, {arrive: 0, push: 0.05}), bg: NIGHT_BG};
  },
  durian: (t, lt, C) => {
    // cell 20 in the dark: the durian; green ribbons begin to rise off it and curl out through the bars. Then black.
    const k = sm((t - ev('stink')) / 0.7);
    return {node: <>{block(t, {only: [19, 20]})}<pointLight position={[X20 + 0.6, 1.6, 1.2]} color="#7C8FC8" intensity={1.4} distance={4} decay={1.4} />
      <Smell from={add(DURIAN, [0, 0.2, 0])} to={[X20 - 0.3, 2.2, 2.4]} t={t} k={k} n={4} amp={0.14} w={0.04} />
      <Smell from={add(DURIAN, [0.1, 0.25, 0.05])} to={[X20 + 0.8, 2.4, 2.2]} t={t} k={k * 0.9} n={3} amp={0.12} w={0.034} seed={3} />
      <SmellFog center={add(DURIAN, [0, 0.2, 0])} k={0.8 * k} t={t} size={0.8} /></>,
      cam: mv({pos: [X20 + 0.45, 1.2, 2.9 - 0.3 * lt], look: [X20 + 0.05, 0.8, -0.4], fov: 52}, lt, {arrive: 0, push: 0.1}), bg: NIGHT_BG};
  },
};
void [cl, sh, headW];
