import React from 'react';
import * as THREE from 'three';
import {resetTurn} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl} from './data';
import {Cell} from '../AbsurdEp1/sets';
import {Mosquito, Handcuffs, Jar} from '../AbsurdEp1/props';
import {CellPlate, Fan, Wind} from '../AbsurdEp2/props';
import {Durian, Smell} from '../AbsurdEp4/props';
import {PoliceCar} from '../AbsurdEp7/props';
import {Earth, EarthCuff} from '../AbsurdEp14/props';
import {Moon} from '../AbsurdEp15/props';
import {Phone} from '../AbsurdEp16/props';
import {Icebox, ICEBOX, Fire} from '../AbsurdEp17/props';
import {makeFly} from '../AbsurdEp19/props';
import {Contract} from '../AbsurdEp20/props';
import {WallPlan, makeGasMask} from '../AbsurdEp21/props';
import {Window24, WIN24, BlockOutside, WALL_Z, Warrant} from '../AbsurdEp22/props';
import {ps, body, hideProps, P, CamRig, mv, near, sm, V3, Cast, ShotOut, hand, hw, bw, headFr} from '../lifekit/stage';
import {GasBank, GasJet, Wrap, WrapRoll, HazardSign, EscapeFile, RubberStamp, GuardPost, Hooded} from './props';

export {CamRig};
/** EP23 · แก๊งห้อง 24 S1E4 แผนรมผู้คุม. Dawn after EP22: he is flat and stuck in the back window of 24, top half outside the prison (ten cars
 *  and a warrant below him). The smell from cell 20 is the gang's plan: the durian gasses the guard. Morning, it lets it all go — and the fan
 *  in 19 oscillates the way it always does and blows the whole cloud down the corridor into 24 and out of the window round his head. Chemical
 *  weapons! He calls; the guard, arriving for his shift, answers, pulls his gas mask down and walks in through the gas. He hooks the fan
 *  through the bars, cuffs it to a bar (a second pair), wraps the front of 19 in plastic and slaps a hazard sign on it. The plan gassed
 *  everyone (him, the police outside, the mosquito in its jar) except the guard. He peers into 24: only smoke. Files him as escaped.
 *  That night he leads a hooded new prisoner to cell 24. Black.
 *
 *  LAYOUT (metres; yaw 0 faces +z; a character's LEFT is +x at yaw 0) — the EP20–22 block
 *  cells   a row along x, EP1 Cells (3 × 3, bars z 1.5, back wall z −1.5), CW 3.05 apart: 23 fridge (−2CW) · 18 Earth + Moon (−CW) ·
 *          24 HIM (0) · 19 fan (+CW) · 20 durian (+2CW). The block's end wall is at x 9.8 with an open steel door (the guard comes in there).
 *  him     EP22 state C all episode: flat, lying on his LEFT side, feet at WIN_FEET (0.675, 2.0, −0.85), head/arms OUTSIDE (head ≈ z −2.3),
 *          legs in the cell. Face filmed from +x. Phone in his RIGHT (upper) hand for the call. Faints at `faint`.
 *  fan     moved forward to FAN (X19 − 0.37, 0, 1.3), just behind the bars, between the bars at X19 − 0.49 and X19 − 0.25, oscillating ±0.85
 *          all episode (that is what it does). An old pair of cuffs round its pole at y 0.78; the new pair pole → bar X19 − 0.25 at y 1.0.
 *  gas     cell 20 bank (from `stink`) → burst out of 20 (`puff`) → a corridor cloud in front of 20 → swept along the corridor to 24 (`sweep`)
 *          → fills 24 (`flood`) → pours out of the window round his head (`window`). Thins out over the morning, gone by `night`.
 *  guard   offA. ENTRY (7.9, 3.0) facing −x: phone (LEFT hand) → mask → walks to GRAB (X19 − 0.57, 1.78) facing −z: RIGHT hand through the
 *          gap to the pole, LEFT hand brings the cuffs → walks the front of 19 with the roll (`wrap0`…`wrap1`) → slaps the sign → turns to
 *          the camera (`except`) → at the bars of 24 (`peer`) → behind his desk POST (1.6, 3.9) stamping the file → at night leads the hooded
 *          prisoner from x 6.5 to the front of 24.
 *  outside the EP22 yard at dawn: ten parked cars on the arc, the warrant on the wall under his window, cmd2/cmd3 under the wall looking up.
 *  jar 25  on the corridor floor (−0.45, 0, 2.15), the contract on the floor at (0.78, 0, 2.2) — both from EP21/22, still there.
 *
 *  TRAPS OF THIS EPISODE
 *  1. The gas must read as ONE cloud travelling 20 → 19's wind → 24 → his window: same green everywhere, and the shots in that order.
 *  2. He is flat along his own front-back axis: film his window half from ≥ 35° off his thin plane (from +x outside, never along x).
 *  3. The call: the guard is SEEN answering (phone at his ear at the entry) — that is why he comes (EP22's call went outside).
 *  4. "อีกคู่": the old pair must be in the cuff ECU with the new one. Two pairs, both readable.
 *  5. The fan keeps oscillating after the arrest and inside the plastic (it does what it does).
 *  6. "ยกเว้นผู้คุม": everybody else visibly gassed first (him closed eyes, the cops on their backs, the mosquito legs-up), then the guard alone.
 *  7. "เห็นแต่ควัน": the gas in 24 must hide his legs in the window from the bars (thick bank up to 2.8 m).
 *  8. The hooded prisoner has no features (rule 4 spirit: unknown). Night: gas gone, his legs still in the window.
 *  9. Old props with baggage: the EP20 contract (box 1 blood, box 2 soap), the jar label "ห้อง 25": both intended callbacks. */
const cut = (name: string) => SHOTS.find((x) => x.name === name)!.t0;   // a teleport between places happens on a cut, never inside a shot
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CW = 3.05, X23 = -2 * CW, X18 = -CW, X19 = CW, X20 = 2 * CW;
const FAN: V3 = [X19 - 0.37, 0, 1.3], FAN_S = 1.35, FAN_HEAD: V3 = [FAN[0], 1.2 * FAN_S, FAN[2]];
const BAR_X = X19 - 0.25;
const EAR_R: V3 = [-12, 12, 2], EAR_L: V3 = [12, 12, 2];
const WIN_FEET: V3 = [WIN24.bars[1] + 0.075, 2.0, -0.85];
const DAY_BG = {color: '#C9D6DE'}, NIGHT_BG = {color: '#0E1424'}, DAWN_BG = {color: '#E8B48C'};
const POST: V3 = [1.6, 0, 3.9];
const dayK = (t: number) => sm((t - ev('stink') - 1.6) / 1.2);   // pre-dawn blue → morning (lands on "เช้านั้น")

// =====================================================================================================
// THE BLOCK
// =====================================================================================================
const EARTH_C: V3 = [X18, 1.08, -0.15], EARTH_R = 0.95;
const ORB = {r: 1.2, y: 2.05, w: (Math.PI * 2) / 3.2};
const moonAt = (t: number): V3 => { const a = ORB.w * t; return [EARTH_C[0] + Math.cos(a) * ORB.r, ORB.y + 0.1 * Math.sin(a), EARTH_C[2] + Math.sin(a) * ORB.r]; };
const fridgeP: V3 = [X23 + 0.1, 0, -0.6];
const DURIAN: V3 = [X20 + 0.1, 0.32, -0.5];
const fanYaw = (t: number) => 0.85 * Math.sin(t * Math.PI * 2 / 3.2);
type Who = 'fridge' | 'earth' | 'man' | 'fan' | 'durian';
const CELLS: {x: number; no: number; who: Who}[] = [{x: X23, no: 23, who: 'fridge'}, {x: X18, no: 18, who: 'earth'}, {x: 0, no: 24, who: 'man'}, {x: X19, no: 19, who: 'fan'}, {x: X20, no: 20, who: 'durian'}];
const durianSquash = (t: number) => { const u = t - ev('puff'); return u < -0.25 ? 0 : u < 0 ? 0.25 * sm((u + 0.25) / 0.25) : 0.25 * Math.exp(-u * 4) * Math.cos(u * 18); };
const oldCuffs = <group position={[FAN[0] + 0.104, 0.78, FAN[2]]}><Handcuffs k={1} rotation={[Math.PI / 2, 0, 0]} size={3} /></group>;
const cuffK = (t: number) => sm((t - ev('cuff') + 0.05) / 0.08);
const NEW_CUFF = (() => { const a: V3 = [FAN[0], 1.0, FAN[2]], b: V3 = [BAR_X, 1.0, 1.5]; const d = [b[0] - a[0], b[2] - a[2]];
  return {mid: [(a[0] + b[0]) / 2, 1.0, (a[2] + b[2]) / 2] as V3, yaw: Math.atan2(-d[1], d[0]), size: Math.hypot(d[0], d[1]) / (2 * 1.45 * 0.024)}; })();
const newCuffs = (t: number, hold?: V3) => { if (t < ev('cuff') - 0.45) return null;
  const k = cuffK(t); const p = k > 0.5 ? NEW_CUFF.mid : lerp3(hold ?? add(NEW_CUFF.mid, [0.15, 0.1, 0.35]), NEW_CUFF.mid, sm((t - ev('cuff') + 0.45) / 0.4));
  return <group position={p} rotation={[0, NEW_CUFF.yaw, 0]}><Handcuffs k={1} rotation={[Math.PI / 2, 0, 0]} size={NEW_CUFF.size * (k > 0.5 ? 1 : 1.06)} /></group>; };
const inmate = (who: Who, t: number) => who === 'earth' ? <>
    <Earth t={t} position={EARTH_C} r={EARTH_R} yaw={1.2} shake={0.25} eyes={false} />
    <EarthCuff center={EARTH_C} r={EARTH_R} close={1} tilt={[0.3, 0, 0.25]} />
    <Moon t={t} position={moonAt(t)} r={0.28} glow={0.9} spin={Math.PI / 2 - ORB.w * t} /></>
  : who === 'fan' ? <><Fan position={FAN} scale={FAN_S} headYaw={fanYaw(t)} blade={t * 31} blur={1} lit={3} />{oldCuffs}{newCuffs(t)}</>
  : who === 'fridge' ? <><Icebox position={fridgeP} door={0.47} glow={0.9} frost={0.3} />
    <Fire position={[fridgeP[0], ICEBOX.shelf + 0.02, fridgeP[2]]} t={t} size={0.3} light={0.5} /></>
  : who === 'durian' ? <Durian position={DURIAN} r={0.3} yaw={1.2} face={false} squash={durianSquash(t)} /> : null;
const mqDown = (t: number) => sm((t - ev('mqfall')) / 0.25);
const jar25 = (t: number) => { const d = mqDown(t);
  return <><Jar position={[-0.45, 0, 2.15]} scale={1.6}><Mosquito t={t} position={[0, 0.06 - 0.03 * d, 0]} rotation={[Math.PI * d, 0, 0.3 * d]} flap={d > 0.5 ? 0 : 0.2} fill={1} scale={2} legsUp={d > 0.5} /></Jar>
    <CellPlate text="ห้อง 25" position={[-0.45, 0.36, 2.25]} w={0.16} /></>; };
const endWall = <group>
  <mesh position={[9.8, 1.6, 3.2]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[9.6, 3.2]} /><meshLambertMaterial color="#7A7E78" /></mesh>
  <mesh position={[9.79, 1.05, 3.0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[1.1, 2.1]} /><meshBasicMaterial color="#EAE2C8" /></mesh>
  <mesh position={[9.3, 1.05, 2.42]} rotation={[0, -0.5, 0]}><boxGeometry args={[1.05, 2.05, 0.05]} /><meshLambertMaterial color="#4A5058" /></mesh></group>;
const block = (t: number, o: {only?: number[]; night?: boolean} = {}) => { const dk = o.night ? 0 : dayK(t);
  return <>
  {CELLS.filter((c) => !o.only || o.only.includes(c.no)).map((c) => <group key={c.no}><group position={[c.x, 0, 0]}>
    <Cell t={t} days={0.98} marks={c.no === 24 ? 11 : 9 + (c.no % 5)} rails={c.no === 24 ? [0.04, 2.6] : undefined} />
    <CellPlate text={`ห้อง ${c.no}`} position={[0, 2.12, 1.54]} w={0.64} /></group>{inmate(c.who, t)}</group>)}
  {(!o.only || o.only.includes(24)) && <><WallPlan position={[-1.48, 1.55, -0.2]} rotation={[0, Math.PI / 2, 0]} w={1.5} /><Window24 z={-1.493} dark={dk > 0.5 ? '#E8C9A0' : o.night ? '#5A6E9C' : '#141B2C'} /></>}
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 4.75]}><planeGeometry args={[22, 6.5]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.6, 8.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[22, 3.2]} /><meshLambertMaterial color="#6F736D" /></mesh>
  {endWall}
  <group position={[0.78, 0.004, 2.2]} rotation={[-Math.PI / 2, 0, 0.9]}><Contract position={[0, 0, 0]} blood={1} /></group>
  <GuardPost position={POST} yaw={Math.PI} />
  {[-4.5, 0, 4.5].map((x) => <pointLight key={x} position={[x, 2.6, 3.4]} color={dk > 0.5 ? '#FFE2B8' : '#5A6EA8'} intensity={0.5 + 0.5 * dk} distance={7} decay={1.5} />)}
  {dk > 0.01 && <><hemisphereLight args={['#FFE6C4', '#5A5446', 0.6 * dk]} /><directionalLight position={[3, 6, 9]} color="#FFD7A0" intensity={0.9 * dk} /></>}
  <pointLight position={[0.9, 2.4, -0.4]} color={dk > 0.5 ? '#FFD9A8' : '#9AAEE6'} intensity={1.4} distance={3} decay={1.4} />
  {jar25(t)}</>; };

// ---- the gas, inside
const corrX = (t: number) => lerp(X20 - 0.7, 0.5, sm((t - ev('sweep') + 0.3) / 1.6));
const clearK = (t: number) => 1 - sm((t - ev('night') + 0.6) / 0.5);
const gas = (t: number, o: {thick24?: number} = {}) => { const c = clearK(t); if (c <= 0.01) return null;
  const k20 = (0.35 * sm((t - ev('stink')) / 1.5) + 0.65 * sm((t - ev('puff')) / 0.6)) * c;
  const kc = sm((t - ev('puff')) / 0.8) * c * (1 - 0.45 * sm((t - ev('flood') - 1.2) / 2));
  const k24 = sm((t - ev('flood') + 0.2) / 0.9) * c;
  const kAll = sm((t - ev('flood')) / 2.5) * c * 0.7;
  return <>
    <GasBank t={t} center={[X20, 0, 0]} size={[2.6, 2.5, 2.6]} k={k20} n={40} seed={1} o={0.26} />
    {kc > 0.01 && <GasBank t={t} center={[corrX(t), 0, 2.6]} size={[3.4, 2.2, 2.0]} k={kc} n={46} seed={2} o={0.24} puff={0.36} />}
    <GasBank t={t} center={[0, 0, 0]} size={[2.8, 2.75, 2.8]} k={k24} n={o.thick24 ? 90 : 45} seed={3} o={o.thick24 ?? 0.2} puff={o.thick24 ? 0.42 : 0.3} />
    <GasBank t={t} center={[2.5, 0, 2.8]} size={[10, 1.8, 2.6]} k={kAll} n={36} seed={4} o={0.13} puff={0.4} />
    <GasJet t={t} from={[X20 - 0.6, 0.7, 1.6]} dir={[-0.9, 0.2, 0.42]} t0={ev('puff')} t1={ev('flood') + 2} reach={2.0} n={20} o={0.34 * c} />
    {t > ev('turn') - 0.2 && t < ev('flood') + 1.2 && <Wind path={[add(FAN_HEAD, [0, 0, 0.3]), [FAN[0] - 0.4, 1.45, 2.3], [1.4, 1.25, 2.55], [0.35, 1.3, 1.7]]} t={t} n={22} speed={0.9} len={0.16} w={0.01} spread={0.35} />}
  </>; };

// =====================================================================================================
// OUTSIDE at dawn: the wall, the yard, the ten parked cars, the warrant, two cops under the wall
// =====================================================================================================
const NCAR = 10, ARC = {c: [0.6, 0, -1.6] as V3, r: 8.5, a0: -1.08, a1: 1.08};
const carAt = (i: number) => { const a = lerp(ARC.a0, ARC.a1, i / (NCAR - 1)); return {p: [ARC.c[0] + Math.sin(a) * ARC.r, 0, ARC.c[2] - Math.cos(a) * ARC.r] as V3, yaw: Math.atan2(-Math.cos(a), -Math.sin(a))}; };
const cars = (t: number) => <>{Array.from({length: NCAR}, (_, i) => { const c = carAt(i); return <PoliceCar key={i} t={t} position={c.p} yaw={c.yaw} seed={i * 3} spin={0} unit="สายตรวจนอกเรือนจำ · 191" />; })}</>;
const POSTER: V3 = [1.3, 1.22, WALL_Z - 0.008];
const outGas = (t: number) => { if (t < ev('window') - 0.2) return null; const k = sm((t - ev('window')) / 1.2) * clearK(t);
  return <><GasJet t={t} from={[WIN24.x - 0.35, WIN24.y + 0.15, WALL_Z - 0.2]} dir={[-0.55, 0.75, -0.35]} t0={ev('window')} t1={ev('night')} reach={1.6} n={18} o={0.4} size={0.4} spread={0.4} />
    <GasJet t={t} from={[WIN24.x + 0.3, WIN24.y + 0.2, WALL_Z - 0.2]} dir={[0.5, 0.8, -0.3]} t0={ev('window') + 0.3} t1={ev('night')} reach={1.6} n={16} o={0.4} size={0.4} spread={0.4} />
    <GasBank t={t} center={[0.7, 2.2, -1.95]} size={[1.9, 1.3, 0.5]} k={k} n={18} seed={7} o={0.22} puff={0.22} /></>; };
const outside = (t: number) => { const dk = dayK(t); return <>
  <BlockOutside cells={CELLS.map((c) => c.x)} win={'#3A3A46'} />
  <hemisphereLight args={[dk > 0.5 ? '#FFD9B8' : '#3A4E86', '#2A2420', 0.75 + 0.45 * dk]} />
  <directionalLight position={[-12, 5, -20]} color={dk > 0.5 ? '#FFB27A' : '#9FB2E0'} intensity={0.7 + 0.6 * dk} />
  <pointLight position={[WIN24.x + 1.2, WIN24.y + 0.3, WALL_Z - 1.4]} color="#FFE2C4" intensity={1.2} distance={3.5} decay={1.4} />
  {cars(t)}<Warrant position={POSTER} rotation={[0, Math.PI, 0]} />{outGas(t)}</>; };

// =====================================================================================================
// PEOPLE
// =====================================================================================================
type GO = {clip?: string; face?: string; look?: V3; y?: number; rx?: number; moving?: boolean; odo?: number; loco?: string};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {}),
    ...(o.moving ? {moving: true, odo: o.odo, locoClip: o.loco ?? 'walk_neutral_01'} : {})}), t, o.y ?? 0, o.rx ?? 0);
  return {I, w}; };
const flies = new WeakMap<any, THREE.Object3D>();
const flyOn = (I: any) => { let f = flies.get(I);
  if (!f) { let hipsFr: THREE.Object3D | null = null; I.bones.Bip01_Spine.traverse((o: any) => { if (!hipsFr && o.isMesh && o.geometry?.parameters?.height === 20 && o.geometry?.parameters?.depth === 19) hipsFr = o.parent; });
    f = makeFly(); (hipsFr ?? I.bones.Bip01_Spine).add(f); flies.set(I, f); }
  f.visible = true; };

// ---- him (EP22 state C, all episode)
const fainted = (t: number) => sm((t - ev('faint')) / 0.35);
const manFace = (t: number) => t > ev('faint') ? 'closed' : t > ev('dial') - 0.2 && t < ev('ring') + 1.2 ? 'angry' : t > ev('window') - 0.15 ? 'wide' : 'half';
const phoneK = (t: number) => sm((t - ev('dial') + 0.3) / 0.3) * (1 - sm((t - ev('ring') - 1.0) / 0.3));
const man = (C: Cast, t: number) => {
  const f = fainted(t); const u = t; const kick = (0.035 * Math.sin(u * 9) + 0.02 * Math.sin(u * 13.7)) * (1 - f) + (t > ev('window') ? 0.03 * Math.sin(u * 23) * (1 - f) : 0);
  const p: V3 = [WIN_FEET[0], WIN_FEET[1] + kick * 0.3, WIN_FEET[2]];
  const m = guy(C, 'nai', p[0], p[2], Math.PI / 2, t, {face: manFace(t), y: p[1]});
  m.w.rotation.set(0, Math.PI / 2, -Math.PI / 2 + kick, 'YXZ'); m.w.scale.z *= 0.12; m.w.updateMatrixWorld(true);
  const nodes: React.ReactNode[] = [];
  const hang = (s: number): V3 => [WIN_FEET[0] + 0.005 * s, (s > 0 ? 1.72 : 1.5) - 0.12 * f + 0.02 * Math.sin(t * 2 + s) * (1 - f), -2.3];
  const ph0 = phoneK(t);
  if (ph0 > 0.01) { const ear = add(hw(m.I, EAR_R), [0.0, 0.03, 0.0]); const ph = lerp3(hang(1), ear, ph0); hand(m.I, 'R', add(ph, [0.0, -0.02, 0.13]), 'cup');
    nodes.push(<Phone key="ph" position={ph} rotation={[0, Math.PI / 2, -Math.PI / 2 + 0.2]} lit={1} />); }
  else hand(m.I, 'R', hang(1), 'open');
  hand(m.I, 'L', hang(-1), 'open');
  m.w.updateMatrixWorld(true); flyOn(m.I);
  return {...m, node: <><P o={m.w} />{nodes}</>}; };

// ---- cops outside: under the wall, looking up at him; fall on their backs at `faint`
const COPS = [{id: 'cmd2', x: 1.7, z: -3.0}, {id: 'cmd3', x: -0.3, z: -3.1}];
const cops = (C: Cast, t: number) => <>{COPS.map(({id, x, z}, i) => { const k = sm((t - ev('faint') - 0.12 - i * 0.15) / 0.35);
  const g = guy(C, id, x, z, 0, t, {face: k > 0.3 ? 'closed' : 'wide', look: k > 0.3 ? undefined : [0.6, 2.0, -2.2], y: 0.14 * k, rx: -Math.PI / 2 * k});
  if (k < 0.3) hand(g.I, 'R', add(bw(g.I, 'Bip01_Head'), [0.0, 0.0, 0.25]), 'cup');
  g.w.updateMatrixWorld(true); return <P key={id} o={g.w} />; })}</>;

// ---- the guard
const masks = new WeakMap<any, THREE.Object3D>();
const maskOn = (I: any) => { let m = masks.get(I); if (!m) { m = makeGasMask(); headFr(I).add(m); masks.set(I, m); } return m; };
const ENTRY: V3 = [7.9, 0, 3.0], GRAB: V3 = [X19 - 0.57, 0, 1.78], SIGN_AT: V3 = [X19 - 0.35, 0, 1.95], PEER: V3 = [0.4, 0, 1.78], DESK: V3 = [POST[0], 0, POST[2] + 0.55];
const ARRIVE = () => ev('grab') - 0.35;
const POLE: V3 = [FAN[0], 1.0, FAN[2]];
type GS = {p: V3; yaw: number; moving?: boolean; odo?: number};
const guardAt = (t: number): GS => {
  if (t < ev('walk0')) return {p: ENTRY, yaw: -Math.PI / 2};
  if (t < ARRIVE()) { const k = (t - ev('walk0')) / (ARRIVE() - ev('walk0')); const p = lerp3(ENTRY, GRAB, sm(k) * 0.15 + k * 0.85);
    return {p, yaw: lerp(-Math.PI / 2 - 0.2, -Math.PI / 2 - 0.2, k) - (k > 0.85 ? (Math.PI / 2 - 0.2) * sm((k - 0.85) / 0.15) : 0), moving: true, odo: k * 5.4}; }
  if (t < ev('wrap0') - 0.1) return {p: GRAB, yaw: Math.PI};
  if (t < ev('wrap1')) { const k = sm((t - ev('wrap0') + 0.1) / (ev('wrap1') - ev('wrap0') + 0.1)); return {p: [X19 - 1.35 + 2.7 * k, 0, 1.92], yaw: Math.PI / 2, moving: true, odo: k * 2.7}; }
  if (t < cut('peer')) return {p: SIGN_AT, yaw: t > ev('faint') ? 0 : Math.PI};
  if (t < ev('stamp') - 1.6) return {p: PEER, yaw: Math.PI};
  if (t < ev('night')) return {p: DESK, yaw: Math.PI};
  const k = cl((t - ev('night')) / (ev('arrive') - ev('night'))); return {p: lerp3([6.5, 0, 2.45], [1.05, 0, 2.4], k), yaw: k < 1 ? -Math.PI / 2 : -Math.PI / 2 - 0.4, moving: k < 1, odo: k * 5.4};
};
const guard = (C: Cast, t: number, face = 'half') => {
  const s = guardAt(t);
  const g = guy(C, 'offA', s.p[0], s.p[2], s.yaw, t, {face, moving: s.moving, odo: s.odo, loco: 'walk_fast_01'});
  const nodes: React.ReactNode[] = [];
  // phone, LEFT hand: buzzing at the hip, up to his ear at `answer`, down just before the mask
  if (t > ev('ring') - 0.4 && t < ev('mask') + 0.1) { const up = ev('answer'), down = ev('mask') - 0.35; const ear = sm((t - up) / 0.22) * (1 - sm((t - down) / 0.2));
    const fw: V3 = [Math.sin(s.yaw), 0, Math.cos(s.yaw)], lf: V3 = [Math.cos(s.yaw), 0, -Math.sin(s.yaw)];   // held in front of his belly, screen up
    const low = add(bw(g.I, 'Bip01_Spine2'), [fw[0] * 0.3 + lf[0] * 0.1, -0.22, fw[2] * 0.3 + lf[2] * 0.1]); const e = add(hw(g.I, EAR_L), [0, -0.01, 0]); const buzz = t < up ? 0.006 * Math.sin(t * 90) : 0;
    const ph = lerp3(low, e, ear); const p2: V3 = [ph[0], ph[1], ph[2] + buzz];
    hand(g.I, 'L', add(p2, [0, -0.06, 0]), 'cup'); nodes.push(<Phone key="p" position={p2} rotation={[0, s.yaw + Math.PI / 2 * ear, 0.18 * ear]} lit={1} />); }
  // mask comes down at `mask` (right hand pulls it)
  const mk = maskOn(g.I); mk.visible = t > ev('mask') - 0.25; mk.position.y = 26 * (1 - sm((t - ev('mask') + 0.25) / 0.25));
  if (t > ev('mask') - 0.45 && t < ev('mask') + 0.2) hand(g.I, 'R', add(hw(g.I, [-4, 18 + 10 * (1 - sm((t - ev('mask') + 0.45) / 0.45)), 16]), [0, 0, 0]), 'fist');
  // the arrest: right hand through the gap to the pole, left hand brings the cuffs
  if (t > ev('grab') - 0.3 && t < ev('wrap0') - 0.1) {
    const reach = sm((t - ev('grab') + 0.3) / 0.3); hand(g.I, 'R', lerp3([GRAB[0] + 0.25, 1.05, 1.62], add(POLE, [0.03, 0.06, 0.02]), reach), 'fist');
    if (t > ev('cuff') - 0.5) { const hold: V3 = lerp3([GRAB[0] - 0.05, 1.0, 1.66], add(NEW_CUFF.mid, [-0.05, -0.03, 0.06]), sm((t - ev('cuff') + 0.5) / 0.4)); hand(g.I, 'L', hold, 'fist'); }
  }
  // wrapping: the roll in both hands in front of him
  if (t > ev('wrap0') - 0.1 && t < ev('wrap1')) { const r: V3 = [s.p[0] + 0.05, 1.15, s.p[2] - 0.32]; hand(g.I, 'R', add(r, [0, 0.2, 0.02]), 'fist'); hand(g.I, 'L', add(r, [0, -0.2, 0.02]), 'fist'); nodes.push(<WrapRoll key="r" position={r} />); }
  // the sign: right hand slaps it on the plastic
  if (t > ev('wrap1') && t < ev('sign') + 0.5) { const k = sm((t - ev('sign') + 0.3) / 0.3); hand(g.I, 'R', lerp3([SIGN_AT[0] + 0.22, 1.2, 1.75], [X19 - 0.05, 1.5, 1.62], k), 'open'); }
  // peering into 24: both hands round the mask's eyes on the bars
  if (t > cut('peer') && t < ev('stamp') - 1.6) { hand(g.I, 'R', [PEER[0] + 0.16, 1.62, 1.6], 'open'); hand(g.I, 'L', [PEER[0] - 0.16, 1.62, 1.6], 'open'); }
  // the file: left hand flat on it, right hand with the stamp, down at `stamp`
  if (t > ev('stamp') - 1.6 && t < ev('night')) { const st = add(POST, [0.05, 0.77, 0.03]);
    hand(g.I, 'L', add(POST, [-0.17, 0.79, 0.05]), 'open');
    const k = 1 - Math.abs(cl((t - ev('stamp')) / 0.12, -1, 1)); const hp = add(st, [0.02, 0.11 + 0.18 * (1 - k) - (t > ev('stamp') + 0.12 ? 0.0 : 0), 0.04]);
    const hpos: V3 = t < ev('stamp') - 0.35 ? add(st, [0.18, 0.2, 0.08]) : hp; hand(g.I, 'R', add(hpos, [0, 0.1, 0]), 'fist');
    nodes.push(<RubberStamp key="st" position={hpos} />); }
  // night: right hand on the hooded prisoner's shoulder
  if (t > ev('night')) { const h = hoodAt(t); hand(g.I, 'R', [h.p[0] + 0.12, 1.42, h.p[2] + 0.1], 'open'); }
  g.w.updateMatrixWorld(true); return {...g, node: <><P o={g.w} />{nodes}</>}; };
const hoodAt = (t: number): {p: V3; yaw: number; walking: boolean} => { const g = guardAt(t); const k = cl((t - ev('night')) / (ev('arrive') - ev('night')));
  return k < 1 ? {p: [g.p[0] - 0.55, 0, 2.05], yaw: -Math.PI / 2, walking: true} : {p: [0.42, 0, 2.02], yaw: Math.PI, walking: false}; };
const hooded = (t: number) => t < ev('night') ? null : (() => { const h = hoodAt(t); return <Hooded position={h.p} yaw={h.yaw} t={t} walking={h.walking} />; })();
const wrap = (t: number) => <Wrap x0={X19 - 1.5} x1={X19 + 1.5} z={1.5} k={sm((t - ev('wrap0') + 0.1) / (ev('wrap1') - ev('wrap0') + 0.1))} />;
const sign = (t: number) => t > ev('sign') ? <HazardSign position={[X19 - 0.05, 1.5, 1.6]} s={0.62 * (1 + 0.15 * Math.exp(-(t - ev('sign')) * 12))} /> : null;
const file = (t: number) => <EscapeFile position={add(POST, [0.05, 0.765, 0.03])} rotation={[0, Math.PI, 0]} k={sm((t - ev('stamp')) / 0.06)} />;

// =====================================================================================================
const lamp = (p: V3, i = 1.4, c = '#FFE2C0') => <pointLight position={p} color={c} intensity={i} distance={4} decay={1.4} />;
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0, where EP22 left him: his flat face out of the prison wall at first light, arms hanging, the warrant below
    const m = man(C, t);
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [2.5, 2.25, -3.95], look: [0.75, 1.98, -2.45], fov: 44}, lt, {arrive: 0.08, push: 0.22}), bg: DAWN_BG};
  },
  legs: (t, lt, C) => {
    // inside: the other half — legs out of the window, kicking
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{lamp([0.6, 1.6, 0.4], 1.4, '#9AAEE6')}</>,
      cam: mv({pos: [-1.25, 1.15, 0.6], look: [0.55, 1.95, -1.15], fov: 56}, lt, {arrive: 0.04, push: 0.18}), bg: NIGHT_BG};
  },
  durian: (t, lt, C) => {
    // cell 20 before dawn: the durian, green ribbons rising off it and out through the bars
    const k = sm((t - ev('stink') + 0.6) / 0.7);
    return {node: <>{block(t, {only: [19, 20]})}{gas(t)}{lamp([X20 + 0.6, 1.6, 1.2], 1.2, '#7C8FC8')}
      <Smell from={add(DURIAN, [0, 0.2, 0])} to={[X20 - 0.3, 2.2, 2.4]} t={t} k={k} n={4} amp={0.14} w={0.04} />
      <Smell from={add(DURIAN, [0.1, 0.25, 0.05])} to={[X20 + 0.8, 2.4, 2.2]} t={t} k={k * 0.9} n={3} amp={0.12} w={0.034} seed={3} /></>,
      cam: mv({pos: [X20 + 0.5, 1.15, 2.7], look: [X20 + 0.05, 0.75, -0.4], fov: 50}, lt, {arrive: 0, push: 0.12}), bg: NIGHT_BG};
  },
  post: (t, lt, C) => {
    // the plan: the ribbons snake along the corridor floor to the guard's empty desk ("ผู้คุม")
    const k = sm((t - ev('creep') + 0.3) / 1.0);
    return {node: <>{block(t, {only: [24, 19]})}{lamp([2.0, 2.0, 3.0], 1.3, '#9AAEE6')}
      <Smell from={[4.6, 0.25, 2.6]} to={add(POST, [0.15, 0.85, -0.2])} t={t} k={k} n={4} amp={0.12} w={0.035} />
      <Smell from={[4.6, 0.2, 2.9]} to={add(POST, [-0.3, 0.3, -0.5])} t={t} k={k * 0.85} n={3} amp={0.1} w={0.03} seed={5} /></>,
      cam: mv({pos: [0.35, 1.35, 2.2], look: [1.75, 0.8, 3.9], fov: 50}, lt, {arrive: 0.06, push: 0.24}), bg: NIGHT_BG};
  },
  dawn: (t, lt, C) => {
    // "เช้านั้น": high over the yard at sunrise — the block, the ring of cars, a man sticking out of the wall; the sun comes up behind
    const m = man(C, t);
    return {node: <>{outside(t)}{m.node}{cops(C, t)}<mesh position={[-22, 9, 40]}><sphereGeometry args={[3.2, 20, 14]} /><meshBasicMaterial color="#FFD58E" toneMapped={false} /></mesh></>,
      cam: mv({pos: [8.0, 5.0, -14.0], look: [0.6, 1.8, -2.0], fov: 50}, lt, {arrive: 0, push: 0.08}), bg: DAWN_BG};
  },
  puff: (t, lt, C) => {
    // the durian lets it all go: it swells, and a green cloud bursts out through the bars of 20
    return {node: <>{block(t, {only: [19, 20]})}{gas(t)}{lamp([X20 - 0.4, 1.8, 2.4], 1.2)}</>,
      cam: mv({pos: [X20 - 1.15, 1.25, 3.7], look: [X20 + 0.05, 0.75, 0.2], fov: 50}, lt, {arrive: 0.04, push: 0.1, shake: near(t, [ev('puff')], 0.25) ? 0.008 : 0}), bg: DAY_BG};
  },
  fan: (t, lt, C) => {
    // "แต่พัดลมห้องสิบเก้า": the fan behind the bars, turning its head the way it always does; green drifting past
    return {node: <>{block(t, {only: [19, 20, 24]})}{gas(t)}{lamp([FAN[0] + 0.5, 2.0, 2.6], 1.2)}</>,
      cam: mv({pos: [FAN[0] + 0.85, 1.55, 3.0], look: [FAN[0], 1.45, 1.3], fov: 42}, lt, {arrive: 0.04, push: 0.1}), bg: DAY_BG};
  },
  sway: (t, lt, C) => {
    // from above: the fan's wind catches the green cloud and turns it towards 24
    return {node: <>{block(t, {only: [24, 19, 20]})}{gas(t)}</>, cam: mv({pos: [X19 + 1.3, 3.9, 4.9], look: [X19 - 0.6, 0.9, 1.6], fov: 50}, lt, {arrive: 0.03, push: 0.08}), bg: DAY_BG};
  },
  blow: (t, lt, C) => {
    // down the corridor: the whole cloud rolls along the cells towards us — towards 24
    const m = man(C, t);
    return {node: <>{block(t)}{m.node}{gas(t)}</>, cam: mv({pos: [-2.4, 1.55, 4.1], look: [3.6, 1.15, 1.6], fov: 48}, lt, {arrive: 0.02, push: 0.1}), bg: DAY_BG};
  },
  flood: (t, lt, C) => {
    // into 24: it pours through the bars and fills the cell; his legs at the window
    const m = man(C, t);
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{gas(t)}{lamp([0.9, 2.2, 1.0], 1.2)}</>,
      cam: mv({pos: [1.1, 1.45, 3.7], look: [0.4, 1.6, -0.6], fov: 50}, lt, {arrive: 0.03, push: 0.12}), bg: DAY_BG};
  },
  window: (t, lt, C) => {
    // outside: green pours out of the window round his head; he gags (no caption)
    const m = man(C, t);
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [2.55, 2.3, -3.85], look: [0.72, 2.0, -2.2], fov: 44}, lt, {arrive: 0.04, push: 0.15, shake: 0.003}), bg: DAWN_BG};
  },
  plate: (t, lt, C) => {
    // the accused, frontal: the fan behind its bars, wind lines, the green — the plate drops
    return {node: <>{block(t, {only: [24, 19, 20]})}{gas(t)}{lamp([FAN[0], 2.1, 2.8], 1.3)}</>,
      cam: mv({pos: [FAN[0], 1.55, 4.3], look: [FAN[0], 1.35, 1.3], fov: 40}, lt, {arrive: 0.05, push: 0.12, shake: near(t, [ev('plate')], 0.1) ? 0.012 : 0}), bg: DAY_BG};
  },
  phone: (t, lt, C) => {
    // the outside hand brings the phone to his ear, in the gas
    const m = man(C, t);
    return {node: <>{outside(t)}{m.node}</>, cam: mv({pos: [2.1, 2.1, -3.2], look: [0.75, 2.02, -2.3], fov: 40}, lt, {arrive: 0.05, push: 0.1}), bg: DAWN_BG};
  },
  guard: (t, lt, C) => {
    // the far end of the block, morning shift: the guard in the doorway, his phone buzzes, he answers, looks down the green corridor
    const g = guard(C, t, 'half');
    return {node: <>{block(t, {only: [20, 19]})}{gas(t)}{g.node}{lamp([7.2, 2.2, 3.6], 1.4)}</>,
      cam: mv({pos: [6.55, 1.6, 4.25], look: [7.9, 1.55, 3.0], fov: 42}, lt, {arrive: 0.04, push: 0.12}), bg: DAY_BG};
  },
  masks: (t, lt, C) => {
    // close: phone down, the gas mask comes down over his face
    const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [20]})}{gas(t)}{g.node}{lamp([7.2, 2.0, 3.4], 1.4)}</>,
      cam: mv({pos: [7.1, 1.72, 3.25], look: [7.9, 1.68, 3.0], fov: 38}, lt, {arrive: 0.04, push: 0.16}), bg: DAY_BG};
  },
  walk: (t, lt, C) => {
    // down the corridor, the masked guard walks through the gas towards cell 19
    const g = guard(C, t, 'angry');
    return {node: <>{block(t)}{gas(t)}{g.node}</>, cam: mv({pos: [1.0, 1.45, 3.9], look: [6.2, 1.35, 2.7], fov: 46}, lt, {arrive: 0.04, push: 0.2}), bg: DAY_BG};
  },
  grab: (t, lt, C) => {
    // at the bars of 19: his arm goes through the gap and grabs the fan by the neck
    const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [19, 24, 20]})}{gas(t)}{g.node}{lamp([FAN[0] + 0.8, 2.0, 2.4], 1.4)}</>,
      cam: mv({pos: [FAN[0] + 1.0, 1.4, 2.6], look: [FAN[0] - 0.05, 1.05, 1.45], fov: 48}, lt, {arrive: 0.04, push: 0.1}), bg: DAY_BG};
  },
  cuff: (t, lt, C) => {
    // ECU: a second pair clicks shut, pole to bar — just above the old pair
    const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [19]})}{g.node}{lamp([FAN[0] + 0.4, 1.4, 2.0], 1.2)}</>,
      cam: mv({pos: [FAN[0] + 0.3, 1.12, 2.2], look: [FAN[0] + 0.03, 0.9, 1.38], fov: 40}, lt, {arrive: 0.04, push: 0.1, shake: near(t, [ev('cuff')], 0.08) ? 0.006 : 0}), bg: DAY_BG};
  },
  wrap: (t, lt, C) => {
    // wide: he walks the front of 19 with a roll of plastic, wrapping the whole cell — fan, bars and all
    const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [24, 19, 20]})}{gas(t)}{g.node}{wrap(t)}</>, cam: mv({pos: [X19, 1.65, 7.3], look: [X19, 1.3, 1.5], fov: 50}, lt, {arrive: 0.02, push: 0.05}), bg: DAY_BG};
  },
  sign: (t, lt, C) => {
    // close: slap — the hazard sign on the plastic, the fan still turning its head behind it
    const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [19]})}{g.node}{wrap(t)}{sign(t)}{lamp([X19 + 0.4, 2.0, 2.8], 1.3)}</>,
      cam: mv({pos: [X19 + 0.45, 1.55, 3.05], look: [X19 - 0.05, 1.45, 1.6], fov: 44}, lt, {arrive: 0.04, push: 0.08, shake: near(t, [ev('sign')], 0.1) ? 0.008 : 0}), bg: DAY_BG};
  },
  proud: (t, lt, C) => {
    // "แผนรมผู้คุม": the durian, low and close, sitting in its own green — very pleased
    return {node: <>{block(t, {only: [19, 20]})}{gas(t)}{wrap(t)}{sign(t)}{lamp([X20 + 0.4, 1.0, 1.6], 1.2)}</>,
      cam: mv({pos: [X20 + 0.55, 0.55, 0.95], look: [X20 + 0.1, 0.4, -0.5], fov: 48}, lt, {arrive: 0.05, push: 0.2}), bg: DAY_BG};
  },
  faint: (t, lt, C) => {
    // outside: his head drops, eyes shut; under the wall the two cops keel over on their backs
    const m = man(C, t);
    return {node: <>{outside(t)}{m.node}{cops(C, t)}</>, cam: mv({pos: [4.0, 1.6, -7.0], look: [0.9, 0.75, -3.0], fov: 54}, lt, {arrive: 0.03, push: 0.1}), bg: DAWN_BG};
  },
  jar: (t, lt, C) => {
    // the mosquito in its jar flips onto its back
    return {node: <>{block(t, {only: [24]})}{gas(t)}{lamp([-0.2, 1.0, 2.9], 1.2)}</>,
      cam: mv({pos: [-0.12, 0.62, 1.7], look: [-0.45, 0.2, 2.15], fov: 42}, lt, {arrive: 0.03, push: 0.12}), bg: DAY_BG};
  },
  except: (t, lt, C) => {
    // frontal, symmetric: the guard alone in the green, mask on, standing. Behind him the wrapped cell 19 and its sign.
    const g = guard(C, t, 'angry');
    return {node: <>{block(t, {only: [24, 19, 20]})}{gas(t)}{g.node}{wrap(t)}{sign(t)}{lamp([SIGN_AT[0], 2.4, 3.2], 1.4)}</>,
      cam: mv({pos: [SIGN_AT[0], 1.55, 4.6], look: [SIGN_AT[0], 1.45, 1.9], fov: 44}, lt, {arrive: 0.04, push: 0.12}), bg: DAY_BG};
  },
  peer: (t, lt, C) => {
    // from inside 24, through the gas: the masked guard pressed to the bars, peering in
    const g = guard(C, t, 'angry'); const m = man(C, t);
    return {node: <>{block(t, {only: [24, 19]})}{m.node}{gas(t)}{g.node}{lamp([0.4, 2.0, 2.5], 1.4)}</>,
      cam: mv({pos: [0.25, 1.62, 0.35], look: [0.4, 1.62, 1.8], fov: 46}, lt, {arrive: 0.03, push: 0.12}), bg: DAY_BG};
  },
  smoke: (t, lt, C) => {
    // his view: a wall of green behind the bars. No one in there.
    const m = man(C, t);
    return {node: <>{block(t, {only: [24]})}{m.node}{gas(t, {thick24: 0.6})}</>, cam: mv({pos: [0.4, 1.68, 2.2], look: [0.45, 1.8, -1.2], fov: 50}, lt, {arrive: 0.03, push: 0.1}), bg: DAY_BG};
  },
  file: (t, lt, C) => {
    // at his desk: the file of cell 24 open in front of him, the stamp in his hand
    const g = guard(C, t, 'half');
    return {node: <>{block(t, {only: [24, 19]})}{gas(t)}{g.node}{file(t)}{lamp([POST[0] - 0.3, 2.0, POST[2] - 0.6], 1.4)}</>,
      cam: mv({pos: [1.05, 1.5, 2.6], look: [1.62, 1.25, 4.3], fov: 50}, lt, {arrive: 0.04, push: 0.1}), bg: DAY_BG};
  },
  stamp: (t, lt, C) => {
    // ECU from above: bang — "หลบหนีแล้ว" in red across cell 24's file
    const g = guard(C, t, 'half');
    return {node: <>{block(t, {only: [24]})}{g.node}{file(t)}{lamp([POST[0], 1.6, POST[2] - 0.4], 1.2)}</>,
      cam: mv({pos: [POST[0] + 0.02, 1.32, POST[2] - 0.32], look: [POST[0] + 0.04, 0.77, POST[2] + 0.04], fov: 40}, lt, {arrive: 0.04, push: 0.1, shake: near(t, [ev('stamp')], 0.1) ? 0.008 : 0}), bg: DAY_BG};
  },
  irony: (t, lt, C) => {
    // outside: the "escaped" man, fainted, sticking out of the wall right above his own warrant (no caption)
    const m = man(C, t);
    return {node: <>{outside(t)}{m.node}{cops(C, t)}</>, cam: mv({pos: [3.7, 1.45, -5.0], look: [1.0, 1.7, -1.9], fov: 42}, lt, {arrive: 0.04, push: 0.12}), bg: DAWN_BG};
  },
  night: (t, lt, C) => {
    // "คืนนั้น": the corridor at night, gas gone; far down it, the guard and a hooded figure come in
    const m = man(C, t); const g = guard(C, t, 'half');
    return {node: <>{block(t, {night: true})}{m.node}{g.node}{hooded(t)}</>, cam: mv({pos: [-2.2, 1.55, 4.6], look: [4.2, 1.2, 2.4], fov: 46}, lt, {arrive: 0, push: 0.06}), bg: NIGHT_BG};
  },
  lead: (t, lt, C) => {
    // tracking: the guard's hand on the shoulder of a featureless hooded prisoner, walking towards 24
    const g = guard(C, t, 'half'); const h = hoodAt(t);
    return {node: <>{block(t, {night: true})}{g.node}{hooded(t)}{lamp([h.p[0] - 0.5, 2.3, 3.4], 1.2, '#9AAEE6')}</>,
      cam: mv({pos: [h.p[0] - 1.9, 1.35, 3.9], look: [h.p[0] + 0.2, 1.25, 2.2], fov: 46}, lt, {arrive: 0, push: 0.04}), bg: NIGHT_BG};
  },
  cell24: (t, lt, C) => {
    // they stop at cell 24. The hooded one faces the bars. Inside, up in the window, his legs.
    const m = man(C, t); const g = guard(C, t, 'half');
    return {node: <>{block(t, {only: [24, 18, 19], night: true})}{m.node}{g.node}{hooded(t)}{lamp([0.9, 2.3, 2.9], 1.2, '#9AAEE6')}{lamp([0.9, 2.3, -0.4], 3.0, '#A8B8E8')}</>,
      cam: mv({pos: [-0.6, 1.7, 4.2], look: [0.9, 1.5, 0.0], fov: 50}, lt, {arrive: 0.03, push: 0.08}), bg: NIGHT_BG};
  },
  legs2: (t, lt, C) => {
    // high behind the hooded one: its dark shape at the bars, and at the back of the cell, his legs in the window. Then black.
    const m = man(C, t); const g = guard(C, t, 'half');
    return {node: <>{block(t, {only: [24], night: true})}{m.node}{g.node}{hooded(t)}{lamp([0.9, 2.3, -0.4], 3.0, '#A8B8E8')}</>,
      cam: mv({pos: [0.2, 2.7, 4.2], look: [0.45, 1.5, -0.8], fov: 48}, lt, {arrive: 0, push: 0.1}), bg: NIGHT_BG};
  },
};
void [cl, SHOTS];
