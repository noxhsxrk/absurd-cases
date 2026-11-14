import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot, fingers, ik} from '../../pov/acting/ik';
import {ev, SHOTS, FPS, lerp, lerp3, cl} from './data';
import {Court, Cell} from '../AbsurdEp1/sets';
import {makeGavel, Handcuffs} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {Stars} from '../AbsurdEp4/props';
import {Puffs, PoliceCar} from '../AbsurdEp7/props';
import {Village, lots} from '../AbsurdEp8/village';
import {label} from '../AbsurdEp8/props';
import {Crack} from '../AbsurdEp14/props';
import {ps, body, bw, hideProps, prop, P, CamRig, mv, strike, near, sm, loc, V3, Cast, ShotOut, Bg} from '../lifekit/stage';
import {VillageLife, CourtLife} from '../lifekit/presets';
import {TOWN} from '../lifekit/people';
import {G, drift, Phone, CallPhone, Note, Tripod, Rope, Hook, Hole, Clods, Accused, CopCrowd, copSpots, Bits, DirtPatch, RIG} from './props';

export {CamRig};
/** EP16 คดีแรงโน้มถ่วง. His phone slips; gravity pulls it to the road and the glass cracks (property damage). The officer throws cuffs at it:
 *  they fall too (resisting arrest). Five hundred officers haul it up out of the road on a rope and cuff it — and with gravity in custody
 *  everything floats: the car, the houses, the court. Life sentence. His phone never falls again.
 *  Gravity is never drawn; it only does what it does (things fall at 9.8 m/s² until the arrest, nothing falls after it). */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const SKY: Bg = {color: '#BFD6E4'}, CELL_BG: Bg = {color: '#2A2E33'};
const DAY = (at: V3 = [0, 0, 0]) => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} /><directionalLight position={[at[0] - 8, at[1] + 16, at[2] + 10]} target-position={at} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={70} shadow-bias={-0.0006} /></>;

// =====================================================================================================
// THE STREET (EP8 village, road along x, z −3…3). The same village in every shot (X0…X1) so nothing jumps between cuts.
// He stands on the road in front of his own gate (HOME); SPOT is where the phone lands — and where they later dig.
// =====================================================================================================
const X0 = -34, X1 = 92;
const LOTS = lots(X0, X1);
const HOME = LOTS.filter((l) => l.side < 0).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0];
const KEEP = [1, LOTS.length - 2];   // VillageLife hangs its laundry in these two yards: they stay on the ground
const MX = HOME.x - 0.3, MAN = {x: MX, z: -0.7};
const SPOT: V3 = [MX + 0.1, 0, -0.25];
const CAR: V3 = [MX + 3.2, 0, 2.2], CAR_YAW = Math.PI + 0.25;   // the patrol car, parked skewed on the far lane (PoliceCar faces local +x)
const TF = () => ev('float');
/** how high / tilted lot i is at time t (undefined = on the ground) */
const lotLift = (t: number, boost = 0) => (i: number): V3 | undefined => { if (KEEP.includes(i)) return undefined; const u = t - TF() - 0.6 - (i % 5) * 0.25 + boost; if (u <= 0) return undefined;
  const d = drift(i * 7 + 3, u, i === HOME.i ? 1.5 : 1.1); return [d[0], d[1] * 0.25, d[2] * 0.25]; };
const street = (t: number, o: {float?: boolean; boost?: number; hole?: number; burst?: number; cracks?: number; lifts?: (i: number) => V3 | undefined} = {}) => { const lf = o.lifts ?? (o.float ? lotLift(t, o.boost) : undefined);
  return <><Village x0={X0} x1={X1} lift={lf} truck={o.float ? (() => { const d = drift(91, t - TF() - 0.4 + (o.boost ?? 0), 0.8); return [d[0], d[1], d[2]] as V3; })() : undefined} />
    <VillageLife t={t} x0={X0} x1={X1} traffic={false} dog={false} animals={!o.float} />{DAY([MX, 0, 0])}
    {lf && LOTS.filter((l) => lf(l.i)).map((l) => <DirtPatch key={l.i} x={l.x} side={l.side} W={l.W} />)}
    {o.hole !== undefined && <><Hole position={SPOT} k={o.hole} burst={o.burst ?? 0} />
      {[0, 1, 2, 3].map((i) => { const a = 0.6 + i * 1.57; return <Crack key={i} pts={[[SPOT[0] + Math.cos(a) * 0.6, SPOT[2] + Math.sin(a) * 0.6], [SPOT[0] + Math.cos(a + 0.2) * 1.5, SPOT[2] + Math.sin(a + 0.2) * 1.4], [SPOT[0] + Math.cos(a - 0.1) * 2.6, SPOT[2] + Math.sin(a - 0.1) * 2.2]]} k={o.cracks ?? 1} w={0.07} y={0.012} seed={i + 2} />; })}</>}</>; };
/** a wrapper that is already posed by body(): add a weightless drift d = [rise, rx, rz, yaw], turning about the body's middle (c above the feet) */
const floatW = (w: THREE.Group, d: number[], c = 0.95) => { const e = new THREE.Euler(w.rotation.x + d[1], w.rotation.y + d[3], d[2], 'YXZ'); const off = new THREE.Vector3(0, c, 0).applyEuler(e);
  w.rotation.copy(e); w.position.set(w.position.x - off.x, w.position.y + d[0] + c - off.y, w.position.z - off.z); w.updateMatrixWorld(true); return w; };
type GO = {clip?: string; face?: string; look?: V3; y?: number; rx?: number; fl?: number[]; c?: number; poseId?: string};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', face: o.face, lookW: o.look, ...(o.poseId ? {poseId: o.poseId} : {})}), t, o.y ?? 0, o.rx ?? 0); if (o.fl) floatW(w, o.fl, o.c); return {I, w}; };
const hand = (I: any, sd: 'L' | 'R', to: V3, shape = 'fist') => { fingers(I, sd, shape as any, 1); ik(I, sd, loc(I, to), new THREE.Vector3(sd === 'R' ? 1 : -1, -1, 0), 1); };

// ---- the phone: one ballistic arc from the slip (τ = its own clock: real time, except the slow-motion shot)
const HOLD: V3 = [MX, 1.2, MAN.z + 0.32], VY = 1.47, T_HIT = (VY + Math.sqrt(VY * VY + 2 * G * HOLD[1])) / G;   // 0.667 s from slip to road
const FACE_UP = -Math.PI / 2;
const phoneAt = (tau: number): {p: V3; r: V3; crack: number} => {
  if (tau <= 0) return {p: HOLD, r: [FACE_UP - 0.5, 0, 0], crack: 0};
  if (tau < T_HIT) { const k = tau / T_HIT; return {p: [lerp(HOLD[0], SPOT[0], k), HOLD[1] + VY * tau - 0.5 * G * tau * tau, lerp(HOLD[2], SPOT[2], k)], r: [lerp(FACE_UP - 0.5, FACE_UP - Math.PI * 2, k), k * 0.5, Math.sin(k * 5) * 0.3 * (1 - k)], crack: 0}; }
  const u = tau - T_HIT, hop = u < 0.16 ? 0.78 * u - 0.5 * G * u * u : 0;   // one small bounce, then it lies there, screen up
  return {p: [SPOT[0], 0.008 + Math.max(0, hop), SPOT[2]], r: [FACE_UP, 0.5, 0], crack: cl(u / 0.14)};
};
const tauOpen = (t: number) => t - ev('slip');
const TAU_CUT = () => sh('fall').t0 - ev('slip');
const tauFall = (t: number) => lerp(TAU_CUT(), T_HIT - (ev('hit') - sh('crack').t0), cl((t - sh('fall').t0) / (sh('crack').t0 - sh('fall').t0)));   // slow motion
const tauCrack = (t: number) => T_HIT + (t - ev('hit'));
/** the man in front of his gate. hold = his hands follow this point (the phone) */
const man = (C: Cast, t: number, o: GO & {yaw?: number; hold?: V3 | null; grab?: number; point?: V3 | null} = {}) => {
  const m = guy(C, 'nai', MAN.x, MAN.z, o.yaw ?? 0, t, o);
  if (o.hold) { const g = o.grab ?? 0; (['R', 'L'] as const).forEach((sd) => { const k = sd === 'R' ? -1 : 1; hand(m.I, sd, [o.hold![0] + k * (0.05 + g * 0.07), o.hold![1] - 0.02 + g * 0.05, o.hold![2] - 0.02], g > 0.3 ? 'open' : 'cup'); }); }
  if (o.point) hand(m.I, 'R', o.point, 'point');
  m.w.updateMatrixWorld(true); return m;
};

// ---- the officer and the thrown cuffs: real ballistics from his hand (1.9 m up, 2 m/s upward: 0.86 s to the road), two short bounces
const COP = {x: MX - 2.6, z: -0.15}, REL: V3 = [COP.x + 0.42, 1.9, COP.z + 0.3], LAND: V3 = [SPOT[0] - 0.5, 0.03, SPOT[2] + 0.25];
const FL = ev('clat') - ev('throw'), VY0 = (0.5 * G * FL * FL - (REL[1] - LAND[1])) / FL;   // the plan owns the flight time; this is the upward speed that lands them on it
const cuffsAt = (t: number): {p: V3; r: V3; air: boolean} => { const u = t - ev('throw'); const vx = (LAND[0] - REL[0]) / FL, vz = (LAND[2] - REL[2]) / FL;
  if (u < FL) return {p: [REL[0] + vx * u, REL[1] + VY0 * u - 0.5 * G * u * u, REL[2] + vz * u], r: [u * 9, u * 4, 0.3], air: true};
  let w = u - FL, x = LAND[0], z = LAND[2];
  for (const [vy, k] of [[1.6, 0.35], [0.5, 0.15]] as const) { const d = (2 * vy) / G; if (w < d) return {p: [x + vx * k * w, LAND[1] + vy * w - 0.5 * G * w * w, z + vz * k * w], r: [Math.PI / 2 + (d - w) * 3, 0.4, 0], air: false}; w -= d; x += vx * k * d; z += vz * k * d; }
  return {p: [x, LAND[1], z], r: [Math.PI / 2, 0.4, 0], air: false}; };
const CUFF_END = cuffsAt(1e3).p;
const thrower = (C: Cast, t: number, o: GO & {point?: V3} = {}) => { const a = guy(C, 'offA', COP.x, COP.z, Math.PI / 2, t, {clip: 'idle_angry_01', ...o}); const u = t - ev('throw');
  if (o.point) hand(a.I, 'R', o.point, 'point');
  else if (u > -0.5 && u < 0.5) { const back: V3 = [COP.x - 0.3, 1.95, COP.z + 0.38], thru: V3 = [COP.x + 0.6, 1.15, COP.z + 0.2];
    const to = u < -0.1 ? lerp3([COP.x + 0.2, 1.2, COP.z + 0.3], back, sm((u + 0.5) / 0.3)) : u < 0 ? lerp3(back, REL, (u + 0.1) / 0.1) : lerp3(REL, thru, sm(u / 0.2));
    hand(a.I, 'R', to, u < 0 ? 'fist' : 'open'); }
  a.w.updateMatrixWorld(true); return a; };

// ---- the dig: tripod + pulley over SPOT, the rope down the road (+x), three officers at its head, 496 more behind them
const RZ = SPOT[2], PULLEY: V3 = [SPOT[0], RIG.h, SPOT[2]], RY = 1.15;
const HEAD: [string, number, number][] = [['offB', 3.4, -1], ['pol3', 4.4, 1], ['pol4', 5.4, -1]];
const SPOTS = copSpots(SPOT[0] + 6.6, 496, RZ);
const BOSS = {x: SPOT[0] - 1.25, z: SPOT[2] + 0.75};   // offA beside the rig: he runs the operation, then does the cuffing
const hookY = (t: number) => { const u = t - ev('pop'); if (u < 0) { const k = cl((t - ev('heave')) / Math.max(0.1, ev('pop') - ev('heave'))); return -0.55 + 0.3 * k + Math.sin(t * 40) * 0.012 * k; }
  const top = 2.75; const y = -0.25 + 26 * u; return y < top ? y : top + 0.32 * Math.exp(-(u - 0.115) * 5) * Math.cos((u - 0.115) * 11); };
const ACC = (t: number): V3 => [SPOT[0], hookY(t) - 0.95, SPOT[2]];
const SIDE = {x: MX + 0.7, z: 1.45};   // where he watches the dig from: clear of the tripod's feet and of the pit
const watchers = (C: Cast, t: number) => { const tf = TF(); const up = t > tf + 0.15; const done = t > ev('cuff') + 0.1;
  const I = C.nai; hideProps(I); resetTurn(I);
  const w = body(I, ps('nai', SIDE.x, SIDE.z, -2.8, t, {clip: up ? 'dancing_silly' : done ? 'cheer_01' : 'idle_neutral_01', face: up ? 'wide' : done ? 'open' : near(t, [ev('pop')], 0.7) ? 'wide' : 'half', lookW: up ? undefined : [SPOT[0], Math.max(1, hookY(t) - 0.5), SPOT[2]]}), t);
  if (up) floatW(w, drift(3, t - tf - 0.15, 0.7)); const c = drift(21, t - tf - 0.35, 0.6);
  return <><P o={w} /><PoliceCar t={t} position={[CAR[0], CAR[1] + c[0], CAR[2]]} yaw={CAR_YAW + c[3]} pitch={c[1]} roll={c[2]} /></>; };
const rig = (C: Cast, t: number, o: {boss?: 'shout' | 'cuff' | 'float'; arrow?: boolean} = {}) => { const tp = ev('pop'), tf = TF(); const hy = hookY(t);
  const head = HEAD.map(([id, dx, side], i) => { const up = t - tp - i * 0.06; const lean = t < ev('heave') ? 0.15 : up < 0 ? 0.32 + 0.12 * Math.sin((t - ev('heave')) * 9 + i * 0.7) : Math.min(1.45, 0.32 + up * up * 16);
    const fl = t > tf + 0.3 + i * 0.15 ? drift(40 + i, t - tf - 0.3 - i * 0.15) : undefined; const x = SPOT[0] + dx + (up > 0 ? Math.min(0.5, up * 1.6) : Math.sin((t - ev('heave')) * 9 + i * 0.7) * 0.04);
    const g = guy(C, id, x, RZ + side * 0.42, -Math.PI / 2, t, {clip: fl ? 'dancing_silly' : 'idle_angry_01', face: up > 0 ? 'wide' : 'shout', rx: -lean, y: up > 0.25 ? 0.1 : 0, fl});
    if (up < 0.12) { hand(g.I, 'R', [x - 0.45, RY + 0.02, RZ + side * 0.06]); hand(g.I, 'L', [x - 0.25, RY - 0.02, RZ + side * 0.06]); g.w.updateMatrixWorld(true); }
    return <P key={id} o={g.w} />; });
  const slack = cl((t - tp) / 0.3); const end: V3 = [SPOT[0] + 88, RY - slack * 0.6, RZ];
  let boss: React.ReactNode = null;
  if (o.boss) { const acc = ACC(t); const fl = o.boss === 'float' && t > tf + 0.2 ? drift(50, t - tf - 0.2) : undefined;
    const b = guy(C, 'offA', BOSS.x, BOSS.z, 2.1, t, {clip: fl ? 'dancing_silly' : 'idle_angry_01', face: fl ? 'wide' : o.boss === 'cuff' ? 'angry' : near(t, [tp], 0.6) ? 'wide' : 'shout', look: o.boss === 'shout' ? [SPOT[0] + 6, 1.4, RZ] : acc, fl});
    if (o.boss === 'shout') hand(b.I, 'R', [BOSS.x + 0.5, 1.75 + Math.sin(t * 9) * 0.06, BOSS.z - 0.25], 'point');
    if (o.boss === 'cuff') { const k = sm((t - ev('cuff') + 0.3) / 0.25); (['R', 'L'] as const).forEach((sd) => hand(b.I, sd, lerp3([BOSS.x + 0.3, 1.2, BOSS.z - 0.2], [acc[0] - 0.42, acc[1] + 0.02, acc[2] + (sd === 'R' ? 0.3 : 0.05)], k), 'fist')); }
    b.w.updateMatrixWorld(true); boss = <P o={b.w} />; }
  const caught = t > ev('cuff') - 0.12; const fk = sm((t - tf) / 0.5);
  return <><Tripod position={SPOT} /><Rope pts={[[SPOT[0], hy, SPOT[2]], PULLEY, [SPOT[0] + 3.0, RY + 0.05, RZ], end]} /><Hook position={[SPOT[0], hy, SPOT[2]]} swing={t > tp ? Math.sin((t - tp) * 5) * 0.12 * Math.exp(-(t - tp)) : 0} />
    {head}{boss}{watchers(C, t)}<CopCrowd t={t} spots={SPOTS} heave={ev('heave')} pop={tp + 0.2} float={tf + 0.5} />
    <Clods at={[SPOT[0], 0.1, SPOT[2]]} t={t} t0={tp} />{t > tp && t < tp + 0.8 && <Puffs at={[SPOT[0], 0.2, SPOT[2]]} t={t} t0={tp} n={12} size={0.35} color="#B9A58A" rise={1.6} spread={0.9} life={1.0} />}
    {caught && <Accused t={t} position={ACC(t)} k={0.6 + 0.4 * sm((t - ev('cuff') + 0.12) / 0.12)} tagK={sm((t - ev('cuff') - 0.1) / 0.14)} float={fk} arrow={o.arrow} />}
    {near(t, [ev('cuff')], 0.35) && <Stars center={[SPOT[0] + 0.5, ACC(t)[1] + 0.5, SPOT[2] + 0.4]} t={t * 3} r={0.5} size={0.14} />}</>; };

// ---- court / cell
const DOCK: V3 = [0, 1.9, 0.6];
const judgeAt = (C: Cast, t: number, spin = 0) => { const I = C.judge; hideProps(I);
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: spin ? undefined : DOCK, face: spin > 0.15 ? 'wide' : t > ev('gavel') - 0.35 ? 'shout' : 'angry'});
  const w = body(I, s, t, 1.25 + Math.sin(t * 1.3) * 0.05); prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  const lift = strike(t, ev('gavel'), 0.4); rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - lift, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - lift * 0.6, I.root);
  floatW(w, [0, spin, 0.12 + Math.sin(t * 0.9) * 0.04, 0], 0.75); return {I, w}; };
const courtRoom = (C: Cast, t: number) => { const u = Math.max(0, t - ev('gavel')); const {w} = judgeAt(C, t, u * u * 5 + u * 1.2);   // he swings at a bench that is no longer under him, and goes over
  const aud = TOWN.slice(0, 6).map((id, i) => { const g = guy(C, id, [-1.25, 1.2, -0.55, 0.7, -1.5, 1.6][i], [3.3, 2.9, 2.0, 1.7, 0.9, 0.5][i], Math.PI + (i - 2.5) * 0.25, t, {poseId: 'sitIdle', clip: i % 2 ? 'sit_chair_idle_look_around' : 'sit_chair_idle_nervous_01', face: 'wide', look: [0, 2.5, -3],
    fl: [0.9 + (i * 0.37 % 1) * 1.3 + Math.sin(t * 1.1 + i * 2.1) * 0.07, (i % 3 - 1) * 0.35 + t * 0.12 * (i % 2 ? 1 : -1), (i % 2 ? 0.4 : -0.3), t * 0.1], c: 0.6}); return <P key={id} o={g.w} />; });
  return <><Court t={t} /><P o={w} /><CourtLife t={t} />{aud}
    <Accused t={t} position={[DOCK[0], DOCK[1] + Math.sin(t * 1.2) * 0.05, DOCK[2]]} size={5} float={1} yaw={0.3} />
    {Array.from({length: 7}, (_, i) => <mesh key={i} position={[-1.2 + i * 0.4, 1.9 + (i * 0.53 % 1) * 1.2 + Math.sin(t + i) * 0.06, -2.3 + (i % 3) * 0.5]} rotation={[t * 0.6 + i, i, t * 0.4 + i * 2]}><planeGeometry args={[0.21, 0.297]} /><meshLambertMaterial color="#F4F1E6" side={THREE.DoubleSide} /></mesh>)}</>; };
const cellBlock = (t: number) => { const f = sm((t - ev('flip')) / 0.1);   // 9:16 has no room for a floating guard beside the plate and the tag: the cell is only the cuffs, the tag and the dust
  return <><Cell t={t} days={0.45} marks={0} /><CellPlate text="ห้อง 22" position={[0, 2.12, 1.54]} w={0.64} />
    <group position={[0, 1.9, 1.55]} rotation={[(1 - f) * 1.5, 0, 0]}><mesh position={[0, -0.16, 0]} material={label('ep16-life', 768, 256, '#B0302E', '#F2E6C8', ['ตลอดชีวิต'], 130)}><planeGeometry args={[0.9, 0.3]} /></mesh></group>
    <Accused t={t} position={[0.3, 1.05 + Math.sin(t * 1.4) * 0.06, 0.55]} size={6.5} float={1} yaw={0.35} />
    <pointLight position={[0, 1.6, 0.9]} color="#FFF0D8" intensity={2.2} distance={3.5} decay={1.5} />
    <Bits center={[0, 0.3, 1]} size={[3, 3]} t={t} t0={sh('cell').t0 - 2.2} n={26} seed={4} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.2]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8E918B" /></mesh>
    <mesh position={[0, 1.4, 5.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh></>; };

// ---- the sky over the village, long after: he lies on nothing, 24 m up; the phone hovers over him
const UP = 24, BOOST = 14;
const skyWorld = (C: Cast, t: number) => { const c = drift(7, 9); const lt = t - sh('relax').t0;
  const cops = (['offA', 'offB', 'pol3'] as const).map((id, i) => { const g = guy(C, id, MX + [-2.4, 2.6, 1.6][i], MP[2] + [-2.2, -3.6, -6.2][i], i * 2.1, t, {clip: 'dancing_silly', face: 'wide', fl: [UP + [1.6, -1.4, 2.2][i] + lt * 0.3, 0.8 + i + lt * 0.3, 0.5 * i + lt * 0.2, lt * 0.3]}); return <P key={id} o={g.w} />; });
  const lifts = (i: number): V3 | undefined => KEEP.includes(i) ? undefined : i === HOME.i ? [UP - 9 + lt * 0.3, 0.1, -0.07] : [4 + ((i * 7.31) % 1) * (UP - 4) + lt * 0.3, ((i * 3.7) % 1 - 0.5) * 0.5, ((i * 5.3) % 1 - 0.5) * 0.5];
  return <>{street(t, {float: true, boost: BOOST, lifts, hole: 1, burst: 1})}<Tripod position={SPOT} />
    <PoliceCar t={t} position={[MX - 3.6, UP + 2.4 + lt * 0.3, MP[2] - 6.0]} yaw={CAR_YAW + lt * 0.2} pitch={0.5 + c[1]} roll={0.9 + lt * 0.15} spin={2} />{cops}
    <group position={[0, 9, 0]}><CopCrowd t={t} spots={SPOTS} heave={0} pop={0} float={0} /></group></>; };
const MP: V3 = [MX, UP, MAN.z + 1.0];   // his feet; he lies back along −z, face up
const skyMan = (C: Cast, t: number) => { const lg = t - ev('letgo'); const bob = Math.sin(t * 1.1) * 0.05; const k = sm(lg / 0.35);
  const ph: V3 = [MX + 0.02, UP + 0.52 + bob + Math.max(0, lg) * 0.05, MP[2] - 1.22];
  const I = C.nai; hideProps(I); resetTurn(I); const w = body(I, ps('nai', MP[0], MP[2], 0, t, {clip: 'idle_neutral_01', face: lg > 0.3 ? 'closed' : 'half'}), t, UP + bob, -Math.PI / 2);
  (['R', 'L'] as const).forEach((sd) => { const s = sd === 'R' ? -1 : 1;   // both hands on the phone, then behind his head
    hand(I, sd, lerp3([ph[0] + s * 0.06, ph[1] - 0.03, ph[2] + 0.02], [MX + s * 0.2, UP + 0.1 + bob, MP[2] - 1.62], k), k > 0.5 ? 'open' : 'cup'); });
  w.updateMatrixWorld(true);
  return <><P o={w} /><Phone position={ph} rotation={[lerp(Math.PI / 2 - 0.25, -Math.PI / 2 + 0.45, sm(lg / 0.9)), Math.max(0, lg - 0.9) * 0.35, Math.max(0, lg) * 0.12]} crack={1} scale={1.6} /></>; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: MCU in front of his gate, thumbing his phone. It slips: a fumble, and it is gone out of the bottom of the frame
    const tau = tauOpen(t), ph = phoneAt(tau); const m = man(C, t, {face: tau > 0 ? 'wide' : 'half', look: ph.p, hold: tau > 0 ? [ph.p[0], Math.max(ph.p[1], 0.95), ph.p[2]] : HOLD, grab: sm(tau / 0.08)});
    return {node: <>{street(t)}<P o={m.w} /><Phone position={ph.p} rotation={ph.r} /></>,
      cam: mv({pos: [MX + 0.5, 1.5, MAN.z + 1.75], look: [MX, 1.36, MAN.z], fov: 46}, lt, {arrive: 0.06, push: 0.07, shake: near(t, [ev('slip')], 0.12) ? 0.008 : 0}), bg: SKY};
  },
  fall: (t, lt, C) => {
    // slow motion from the road: the phone turns over on its way down; he reaches after it. On "แรงโน้มถ่วง" the red note marks who is doing it
    const ph = phoneAt(tauFall(t)); const slow = sh('fall').t0 + lt * 0.12; const k = cl(lt / (sh('fall').dur / FPS));
    const m = man(C, slow, {face: 'shout', look: ph.p, rx: 0.12 + 0.3 * k, hold: [ph.p[0], Math.max(ph.p[1] + 0.18, 0.72), ph.p[2] - 0.05], grab: 1});
    const cam = mv({pos: [MX + 1.25, 0.25, SPOT[2] + 1.3], look: [MX + 0.0, 0.72, SPOT[2] - 0.05], fov: 50}, lt, {arrive: 0.06, push: 0.035, roll0: -3});
    return {node: <>{street(slow)}<P o={m.w} /><Phone position={ph.p} rotation={ph.r} scale={1.15} />
      <Note position={[ph.p[0] - 0.24, ph.p[1] - 0.12, ph.p[2] + 0.2]} cam={cam.pos} h={0.5} k={sm((t - ev('note')) / 0.1)} /></>, cam, bg: SKY};
  },
  crack: (t, lt, C) => {
    // ECU on the road, real time again: it lands, hops, and the glass goes
    const ph = phoneAt(tauCrack(t)); const m = man(C, t, {face: 'wide', look: SPOT, rx: 0.3});
    return {node: <>{street(t)}<P o={m.w} /><Phone position={ph.p} rotation={ph.r} crack={ph.crack} />
      {t > ev('hit') && <Puffs at={[SPOT[0], 0.02, SPOT[2]]} t={t} t0={ev('hit')} n={5} size={0.011} color="#8E8A80" rise={0.08} spread={0.1} life={0.7} />}</>,
      cam: mv({pos: [SPOT[0] + 0.16, 0.42, SPOT[2] + 0.34], look: [SPOT[0], 0.0, SPOT[2] - 0.02], fov: 40}, lt, {arrive: 0, push: 0.1, shake: near(t, [ev('hit')], 0.12) ? 0.012 : 0}), bg: SKY};
  },
  charge: (t, lt, C) => {
    // from the road, beside the broken phone: he towers over it and points straight down at the ground. Snap zoom, the plate drops.
    const z = sm((t - ev('zoom')) / 0.17); const ph = phoneAt(9);
    const m = man(C, t, {clip: 'idle_angry_01', face: 'shout', look: t > ev('plate1') + 0.15 ? [SPOT[0] + 0.55, 0.3, SPOT[2] + 1.1] : SPOT, point: [SPOT[0] - 0.12, 0.5, SPOT[2] + 0.05], rx: 0.16});
    return {node: <>{street(t)}<P o={m.w} /><Phone position={ph.p} rotation={ph.r} crack={1} /></>,
      cam: mv({pos: [SPOT[0] + 0.6, 0.2, SPOT[2] + 1.45], look: [MX + 0.05, 1.85, MAN.z], fov: 62 - 10 * z}, lt, {arrive: 0.08, push: 0.05, shake: near(t, [ev('plate1')], 0.1) ? 0.01 : 0}), bg: SKY};
  },
  phone: (t, lt) => {
    // his POV down at the road: the phone comes up in his hand, glass cracked, 191
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [MX, 1.55, MAN.z], look: [SPOT[0], 0, SPOT[2] + 0.7], fov: 54}, lt, {push: 0.08, arrive: 0});
    return {node: <>{street(t)}<CallPhone cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: SKY};
  },
  throw: (t, lt, C) => {
    // over the officer's shoulder: he winds up and throws the cuffs at it. They go where everything goes.
    const a = thrower(C, t, {face: t > ev('throw') + 0.5 ? 'wide' : 'angry', look: SPOT}); const u = t - ev('throw'); const c = cuffsAt(t); const cp: V3 = u < 0 ? bw(a.I, 'Bip01_R_Hand') : c.p;
    const m = man(C, t, {yaw: -Math.PI / 2 + 0.5, clip: 'idle_angry_01', face: 'angry', look: u > 0 ? c.p : [COP.x, 1.5, COP.z], point: [SPOT[0], 0.75, SPOT[2] - 0.15]});
    const b = guy(C, 'offB', CAR[0] - 1.7, CAR[2] - 1.15, -Math.PI / 2 - 0.3, t, {clip: 'idle_neutral_01', look: u > 0 ? c.p : [COP.x, 1.5, COP.z]});
    const cam = mv({pos: [MX - 4.9, 2.0, 1.1], look: [MX - 1.15, 0.95, -0.25], fov: 54}, lt, {arrive: 0.07, push: 0.04, roll0: 2});
    return {node: <>{street(t)}<P o={a.w} /><P o={m.w} /><P o={b.w} /><PoliceCar t={t} position={CAR} yaw={CAR_YAW} />
      <Handcuffs k={1} size={2.6} position={cp} rotation={u < 0 ? [0.4, 0, 0.3] : c.r} />
      {c.air && <Note position={[c.p[0], c.p[1] + 0.12, c.p[2]]} cam={cam.pos} h={0.6} k={sm((t - ev('note2')) / 0.1)} />}</>, cam, bg: SKY};
  },
  clatter: (t, lt, C) => {
    // ECU on the road: the cuffs hit, hop twice and lie there. A beat.
    const c = cuffsAt(t); const a = thrower(C, t, {face: 'wide', look: c.p}); const m = man(C, t, {yaw: -Math.PI / 2 + 0.5, face: 'half', look: c.p});
    const cam = mv({pos: [CUFF_END[0] - 0.75, 0.28, CUFF_END[2] + 0.95], look: [CUFF_END[0] - 0.05, 0.12, CUFF_END[2]], fov: 44}, lt, {arrive: 0, push: 0.09, shake: near(t, [ev('clat')], 0.1) ? 0.01 : 0});
    return {node: <>{street(t)}<P o={a.w} /><P o={m.w} /><Handcuffs k={1} size={2.6} position={c.p} rotation={c.r} />
      {t > ev('clat') && <Puffs at={[LAND[0], 0.02, LAND[2]]} t={t} t0={ev('clat')} n={5} size={0.014} color="#8E8A80" rise={0.08} spread={0.1} life={0.6} />}
      <Note position={[c.p[0], c.p[1] + 0.1, c.p[2]]} cam={cam.pos} h={0.36} k={c.air ? 1 : 1 - sm((t - ev('clat') - 0.45) / 0.1)} /></>, cam, bg: SKY};
  },
  resist: (t, lt, C) => {
    // low on the officer: he points down at them, furious. The second plate drops.
    const a = thrower(C, t, {face: 'shout', look: [COP.x + 1.2, 0.6, COP.z + 1.4], point: [COP.x + 0.55, 0.85, COP.z + 0.25]});
    return {node: <>{street(t)}<P o={a.w} /><PoliceCar t={t} position={CAR} yaw={CAR_YAW} /></>,
      cam: mv({pos: [COP.x + 1.15, 0.75, COP.z + 1.5], look: [COP.x, 1.42, COP.z], fov: 46}, lt, {arrive: 0.08, push: 0.09, roll0: -3, shake: near(t, [ev('plate2')], 0.1) ? 0.01 : 0}), bg: SKY};
  },
  army: (t, lt, C) => {
    // the crane-up: a tripod over the spot, a rope — and five hundred officers on it, all the way down the road
    const k = 1 - Math.pow(1 - cl(lt / 0.3), 3);
    return {node: <>{street(t, {hole: 0, cracks: 0})}{rig(C, t, {boss: 'shout'})}</>,
      cam: mv({pos: [SPOT[0] - 3.4 - 1.2 * k, 1.2 + 2.6 * k, RZ - 1.9], look: [SPOT[0] + 7 + 5 * k, 1.1 - 0.2 * k, RZ + 0.25], fov: 60}, lt, {arrive: 0, push: 0.02}), bg: SKY};
  },
  pull: (t, lt, C) => {
    // low at the rig: the rope sings, the road lifts and cracks round the hole
    const k = cl((t - ev('heave')) / (ev('pop') - ev('heave')));
    return {node: <>{street(t, {hole: k, cracks: k})}{rig(C, t, {boss: 'shout'})}
      <Puffs at={[SPOT[0], 0.05, SPOT[2]]} t={t} t0={ev('heave')} n={6} size={0.12} color="#B9A58A" rise={0.5} spread={0.7} life={0.9} /></>,
      cam: mv({pos: [SPOT[0] - 2.5, 0.8, RZ - 1.15], look: [SPOT[0] + 2.6, 1.4, RZ], fov: 58}, lt, {arrive: 0.07, push: 0.08, roll0: 4, shake: 0.008 + 0.012 * k}), bg: SKY};
  },
  pop: (t, lt, C) => {
    // it comes out: clods in the air, the hook slams up to the pulley, the whole line goes over backwards
    const k = sm((t - ev('pop')) / 0.1);
    return {node: <>{street(t, {hole: 1, burst: k, cracks: 1})}{rig(C, t, {boss: 'shout'})}</>,
      cam: mv({pos: [SPOT[0] - 4.2, 3.2, RZ + 2.2], look: [SPOT[0] + 1.5, 1.6, RZ], fov: 62}, lt, {arrive: 0.07, push: 0.05, roll0: -3, shake: near(t, [ev('pop')], 0.25) ? 0.04 : 0.006}), bg: SKY};
  },
  cuffed: (t, lt, C) => {
    // he reaches up under the hook and snaps the cuffs shut on it. A tag: ผู้ต้องหา, g = 9.8
    const a = ACC(t);
    return {node: <>{street(t, {hole: 1, burst: 1})}{rig(C, t, {boss: 'cuff'})}</>,
      cam: mv({pos: [SPOT[0] - 2.0, 0.7, RZ + 2.1], look: [SPOT[0] - 0.25, a[1] - 0.1, RZ], fov: 50}, lt, {arrive: 0.08, push: 0.1, shake: near(t, [ev('cuff')], 0.12) ? 0.025 : 0}), bg: SKY};
  },
  lift: (t, lt, C) => {
    // a beat. A pebble leaves the road. Then his feet do, and the officers', and the car's.
    const tf = TF();
    return {node: <>{street(t, {float: true, hole: 1, burst: 1})}{rig(C, t, {boss: 'float'})}
      <Bits center={[SPOT[0] + 0.5, 0, 0]} size={[9, 5.5]} t={t} t0={tf - 0.25} n={60} seed={1} /></>,
      cam: mv({pos: [MX - 3.6, 0.3, 2.6], look: [SPOT[0] + 1.0, 1.55, RZ + 0.5], fov: 62}, lt, {arrive: 0.06, push: 0.03, roll: 5}), bg: SKY};
  },
  car: (t, lt, C) => {
    // from underneath: the patrol car, lights still going, turning over in the air; an officer swims after it
    const u = t - TF() + 1.4; const c = drift(21, u, 1.5); const p: V3 = [CAR[0], c[0], CAR[2]];
    const b = guy(C, 'offB', CAR[0] - 1.6, CAR[2] - 1.0, 1.2, t, {clip: 'dancing_silly', face: 'wide', fl: [c[0] - 0.9, 0.9 + lt * 0.6, 0.4, lt * 0.5]});
    return {node: <>{street(t, {float: true, boost: 2, hole: 1, burst: 1})}<PoliceCar t={t} position={p} yaw={CAR_YAW + c[3] + lt * 0.4} pitch={0.35 + c[1]} roll={0.6 + lt * 0.5} spin={3} /><P o={b.w} />
      <Bits center={[CAR[0], 0.5, CAR[2]]} size={[5, 4]} t={t} t0={TF()} n={30} seed={2} /></>,
      cam: mv({pos: [CAR[0] - 1.6, 0.45, CAR[2] + 3.6], look: [p[0] - 0.2, p[1] + 0.5, p[2]], fov: 56}, lt, {arrive: 0.06, push: 0.05, roll0: -5}), bg: SKY};
  },
  house: (t, lt) => {
    // his own house, yard, fence and gate: the whole lot has let go of the ground
    const y = (lotLift(t, 3.2)(HOME.i) ?? [0, 0, 0])[0];
    return {node: <>{street(t, {float: true, boost: 3.2, hole: 1, burst: 1})}<Bits center={[HOME.x, 0.5, -8]} size={[9, 8]} t={t} t0={t - 2 - lt} n={40} seed={3} /></>,
      cam: mv({pos: [HOME.x + 3.4, 1.0, 2.4], look: [HOME.x - 0.3, 3.4 + y, -11], fov: 62}, lt, {arrive: 0.06, push: 0.03, roll0: 5}), bg: SKY};
  },
  court: (t, lt, C) => ({node: courtRoom(C, t), cam: mv({pos: [0.6, 2.9, 4.3], look: [0, 2.3, -3.0], fov: 44}, lt, {arrive: 0.07, push: 0.06, roll0: -4})}),
  gavel: (t, lt, C) => ({node: courtRoom(C, t), cam: mv({pos: [1.5, 2.3, -0.6], look: [0, 2.35, -3.2], fov: 46}, lt, {arrive: 0.08, push: 0.09, roll0: 3})}),
  cell: (t, lt) => ({node: cellBlock(t), cam: mv({pos: [0.55, 1.45, 4.4], look: [0.05, 1.5, 0.6], fov: 50}, lt, {arrive: 0.08, push: 0.07, roll0: -3, shake: near(t, [ev('flip')], 0.12) ? 0.015 : 0}), bg: CELL_BG}),
  relax: (t, lt, C) => {
    // high over the village: he lies back on nothing, holds the phone up — and lets go of it
    return {node: <>{skyWorld(C, t)}{skyMan(C, t)}</>, cam: mv({pos: [MX + 1.0, UP + 1.75, MP[2] + 0.75], look: [MX, UP + 0.3, MP[2] - 1.15], fov: 50}, lt, {arrive: 0.06, push: 0.03, roll: 4}), bg: SKY};
  },
  sky: (t, lt, C) => {
    // wide: the whole neighbourhood is up here with him. No freeze: it is all still drifting on the last frame.
    return {node: <>{skyWorld(C, t)}{skyMan(C, t)}</>, cam: mv({pos: [MX + 2.0, UP + 1.7, MP[2] + 2.1], look: [MX - 0.1, UP + 0.4, MP[2] - 1.2], fov: 56}, lt, {arrive: 0.06, push: -0.1, roll0: 3, roll: 5}), bg: SKY};
  },
};
