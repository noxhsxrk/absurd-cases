import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl, pop} from './data';
import {Court, Cell} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {Stars} from '../AbsurdEp4/props';
import {Village} from '../AbsurdEp8/village';
import {Phone} from '../AbsurdEp16/props';
import {Splash, Drips} from '../AbsurdEp17/props';
import {ps, body, bw, hideProps, prop, P, CamRig, mv, strike, near, sm, V3, Cast, ShotOut, DAY, SKY, CELL_BG, hand, headFr, hw} from '../lifekit/stage';
import {VillageLife, CourtLife} from '../lifekit/presets';
import {Washer, WASH, tubTop, makeDiveMask, Tank, Fin, Sock, FootSock, WasherCuff, Basket} from './props';
import {FROGS, INMATES} from './cast';

export {CamRig};
/** EP28 คดีถุงเท้าหาย. He does the laundry in his front yard and one sock comes back alone: theft. Three police frogmen dive into the tub, the
 *  machine goes into its spin cycle and spins all three, so the whole machine is cuffed. Twenty years, doing the laundry of the whole prison —
 *  now every inmate wears one sock. The washer only ever washes and spins; all the escalation is the people's.
 *
 *  LAYOUT (metres; yaw 0 faces +z; root +x is the character's LEFT)
 *  yard    EP8 village, lot 3 (x 0.34, side −z): fence z −5.6 with the gate at x 0.04, the house front at z −9.2 (door x −1.93).
 *          The washer WP (−0.6, 0, −8.75) stands against the house wall, front (+z) to the road, lid hinged at the back, open all episode.
 *          He stands at MAN (0.05, −8.45) yaw −1.2: facing the washer, his left hand (+z side) is the camera side. From `frogs` on he steps back to MAN2.
 *          The frogmen line up at z −6.9 (x −1.2, −0.7, −0.2) facing the washer; after the spin they lie on the grass at LIE[i] with stars over their heads.
 *          The officer with the giant cuff stands at OF (0.6, −7.7). Cameras stand in the yard (z −5.9 … −7.6) looking at the house; the reverse (frogs) from behind the washer.
 *  court   EP1 Court: judge at (0, −3.25) raised 1.25 with the gavel and a block (EP17 courtRoom); the washer, cuffed, on the floor at (0.95, 0, −1.75).
 *  cell    EP1 Cell, plate "ห้อง 26" (first free number); the washer at (0.2, 0, −0.5), chained to the bars; the guard puts down a basket at `drop`.
 *          Corridor z 1.5 … 6: cells 27 and 28 at x 3 and 6 for the queue; five inmates (prison brown, bare feet, one white sock on the LEFT foot each).
 *
 *  TRAPS OF THIS EPISODE (written before the first shot)
 *  1. The one sock is the case: red with white stripes so it reads at any size; in `tub` the tub is empty below it (the pair is missing).
 *  2. "สามนาย" must count: the frogmen stand in one row (frogs) and go in one after another (dive); in `spin` three masks circle the tub.
 *  3. A man going into a 0.47 m tub: he shrinks as he goes in (scale 1 → 0.3) — the washer walls hide what is below the rim.
 *  4. The giant cuff ring must be wider than the washer's half diagonal (0.43): r 0.47. It locks at `cuff` with a flash.
 *  5. The man's hand on the camera side is his LEFT (he faces −x/+z), so the sock and the phone are in his left hand.
 *  6. The gavel needs a block under it (EP17 courtRoom). The washer in court sits low: the court camera stands high enough to keep it above the captions.
 *  7. The closer must read without sound: every inmate's left foot wears a white sock, the right is bare (skin), in one tracking shot at foot level.
 *  8. Borrowed props: EP16 phone without cracks; plates use keys that start with ep28-. Cell 26 is new (13, 18–25 are taken). */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// =====================================================================================================
// THE YARD
// =====================================================================================================
const X0 = -34, X1 = 34;
const WP: V3 = [0.9, 0, -8.75], TUB = tubTop(WP), MAN = {x: 1.55, z: -8.45, yaw: -1.2}, MAN2 = {x: 2.45, z: -8.35, yaw: -1.5};
const ROWX = [0.3, 0.8, 1.3], ROWZ = -6.9, LIE: [number, number, number][] = [[-0.05, -7.05, 0.5], [0.9, -6.55, -0.4], [1.85, -7.15, 0.9]];
const OF = {x: 2.1, z: -7.7};
/** the washer's state through the yard scenes */
const spinA = (t: number) => { const s = ev('spin'); return t < s ? Math.sin(t * 5) * 0.6 : 0.6 * Math.sin(s * 5) + 4 * (t - s) + 16 * Math.max(0, t - s - 0.2) ** 1.2; };
const wobAt = (t: number) => t < ev('spin') ? 0.08 : t < ev('fling') + 0.3 ? 1 : t < ev('cuff') ? 0.35 : 0.05 * Math.exp(-(t - ev('cuff')) * 2);
const washer = (t: number, o: {water?: number; clothes?: number} = {}) => <Washer position={WP} t={t} lid={1} spin={spinA(t)} wob={wobAt(t)} mode={t < ev('mode') ? 0 : 2}
  water={o.water ?? (t > ev('dive1') ? 0.55 : t < ev('sock') ? 0.25 : 0)} clothes={o.clothes ?? (t < ev('sock') - 0.4 ? 4 : 0)} />;
const yard = (t: number, o: {water?: number; clothes?: number} = {}) => <><Village x0={X0} x1={X1} gates={{3: 1}} /><VillageLife t={t} x0={X0} x1={X1} traffic={false} dog={false} />{DAY([1.5, 0, -7])}{washer(t, o)}</>;

// ---- people
type GO = {clip?: string; face?: string; look?: V3; y?: number; rx?: number; s?: number};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? 'idle_neutral_01', ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {})}), t, o.y ?? 0, o.rx ?? 0);
  if (o.s !== undefined) { w.scale.multiplyScalar(o.s); w.updateMatrixWorld(true); }
  return {I, w}; };
const EAR_L: V3 = [12, 12, 2];
const man = (C: Cast, t: number, o: GO & {L?: V3 | null; ls?: string; R?: V3 | null; rs?: string; at?: {x: number; z: number; yaw: number}} = {}) => { const a = o.at ?? MAN;
  const m = guy(C, 'nai', a.x, a.z, a.yaw, t, o);
  if (o.L) hand(m.I, 'L', o.L, o.ls ?? 'open'); if (o.R) hand(m.I, 'R', o.R, o.rs ?? 'open'); m.w.updateMatrixWorld(true); return m; };
/** a frogman: dive mask on his head, tank on his back, fins on his feet (scaled with him) */
const masks = new WeakMap<any, THREE.Object3D>();
const frog = (C: Cast, i: number, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const g = guy(C, FROGS[i], x, z, yaw, t, {face: 'angry', ...o}); const s = o.s ?? 1;
  let mk = masks.get(g.I); if (!mk) { mk = makeDiveMask(); headFr(g.I).add(mk); masks.set(g.I, mk); } mk.visible = true;
  hand(g.I, 'L', add(bw(g.I, 'Bip01_L_Thigh'), [Math.cos(yaw) * 0.12 * s, -0.05 * s, -Math.sin(yaw) * 0.12 * s]), 'open'); hand(g.I, 'R', add(bw(g.I, 'Bip01_R_Thigh'), [-Math.cos(yaw) * 0.12 * s, -0.05 * s, Math.sin(yaw) * 0.12 * s]), 'open'); g.w.updateMatrixWorld(true);
  return {...g, node: <><P o={g.w} /><Tank chest={bw(g.I, 'Bip01_Spine2')} yaw={yaw} rx={o.rx ?? 0} s={s} />
    {(['L', 'R'] as const).map((sd) => <Fin key={sd} heel={bw(g.I, `Bip01_${sd}_Foot`)} toe={bw(g.I, `Bip01_${sd}_Toe0`)} s={s} />)}</>}; };
/** a frogman's path into the tub: k 0…1 (jump, flip head-down, shrink and go in) */
const UPV = new THREE.Vector3(0, 1, 0);
const TM = {suit: new THREE.MeshLambertMaterial({color: '#1F2329'}), yel: new THREE.MeshLambertMaterial({color: '#F2C21E'}), glass: new THREE.MeshBasicMaterial({color: '#9CD0E6'}), fin: new THREE.MeshLambertMaterial({color: '#1C1F23'}), shirt: new THREE.MeshLambertMaterial({color: '#3F6FA8'})};
const diver = (C: Cast, i: number, t: number) => { const k = cl((t - ev('dive' + (i + 1))) / 0.5); if (k >= 1) return null;
  const yaw = Math.PI; const rx = Math.PI * sm(k / 0.6); const s = lerp(1, 0.3, sm((k - 0.45) / 0.55));
  const c0: V3 = [ROWX[i], 0.9, ROWZ], c1: V3 = add(TUB, [0, -0.5, 0]); const c = lerp3(c0, c1, k); c[1] += Math.sin(k * Math.PI) * 0.6;
  const up = UPV.clone().applyEuler(new THREE.Euler(rx, yaw, 0, 'YXZ')).multiplyScalar(0.9 * s); const feet: V3 = [c[0] - up.x, c[1] - up.y, c[2] - up.z];
  const f = frog(C, i, feet[0], feet[2], yaw, t, {y: feet[1], rx, s, face: 'shout'}); return f.node; };
/** the three of them going round in the tub (only their masks, snorkels and fins show above the water) */
const inTub = (t: number, at: V3 = TUB) => <group position={add(at, [0, -0.2, 0])}>{[0, 1, 2].map((i) => { const a = spinA(t) * 1.1 + i * 2.094; const r = 0.12;
  return <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, -a + Math.PI / 2, 0]}>
    <mesh material={TM.suit}><sphereGeometry args={[0.055, 10, 8]} /></mesh>
    <mesh position={[0, 0.012, 0.045]} material={TM.yel}><boxGeometry args={[0.09, 0.05, 0.02]} /></mesh>
    <mesh position={[0, 0.013, 0.056]} material={TM.glass}><planeGeometry args={[0.07, 0.035]} /></mesh>
    <mesh position={[0.05, 0.08, 0]} material={TM.yel}><cylinderGeometry args={[0.007, 0.007, 0.13, 6]} /></mesh>
    <mesh position={[-0.04, 0.05, -0.07]} rotation={[0.5, 0.3, 0.2]} material={TM.fin}><boxGeometry args={[0.07, 0.006, 0.14]} /></mesh>
  </group>; })}</group>;
/** after the spin: thrown out of the tub (fling) onto the grass (land), lying dizzy */
const lying = (C: Cast, i: number, t: number) => { const [x, z, yaw] = LIE[i]; const k = cl((t - ev('fling') - i * 0.06) / (ev('land') - ev('fling'))); if (k <= 0) return null;
  const c = lerp3(add(TUB, [0, 0.2, 0]), [x, 0.15, z], k); c[1] += Math.sin(k * Math.PI) * 1.2; const rx = -Math.PI / 2 * sm(k) + (1 - k) * 6 * k;
  const f = frog(C, i, c[0], c[2], yaw, t, {y: c[1], rx, s: lerp(0.5, 1, sm(k / 0.4)), face: 'closed'});
  return <>{f.node}{k >= 1 && <Stars center={add(hw(f.I, [0, 12, 0]), [0, 0.22, 0])} t={t * 2 + i} r={0.16} size={0.05} />}</>; };
const pile = (C: Cast, t: number) => <>{[0, 1, 2].map((i) => <React.Fragment key={i}>{lying(C, i, t)}</React.Fragment>)}</>;
/** the officer with the giant cuff: holds the open ring over the washer (lift), drops it round the machine (cuff), keeps the chain */
const RING_Y = 0.48, RING_C: V3 = [WP[0], RING_Y, WP[2] + 0.02];
const ringAt = (t: number): V3 => { const u = cl((t - ev('lift')) / 0.6), d = cl((t - ev('cuff') + 0.22) / 0.22); return [RING_C[0] + 0.5 * (1 - u), lerp(lerp(0.9, 1.45, sm(u)), RING_Y, d * d), RING_C[2] + 0.35 * (1 - u)]; };
const cop = (C: Cast, t: number) => { const rc = ringAt(t); const locked = t > ev('cuff'); const yaw = Math.atan2(WP[0] - OF.x, WP[2] - OF.z);
  const a = guy(C, 'offA', OF.x, OF.z, yaw, t, {face: locked ? 'angry' : 'shout', look: add(WP, [0, 0.8, 0])});
  const chainEnd: V3 = add(bw(a.I, 'Bip01_Spine2'), [-0.05, -0.35, 0.18]);
  if (!locked) { hand(a.I, 'R', add(rc, [0.42, 0.02, 0.22]), 'fist'); hand(a.I, 'L', add(rc, [0.3, 0.02, 0.38]), 'fist'); }
  else { hand(a.I, 'R', chainEnd, 'fist'); hand(a.I, 'L', add(chainEnd, [0.08, 0.06, 0.12]), 'fist'); }
  a.w.updateMatrixWorld(true); const b = locked ? bw(a.I, 'Bip01_R_Hand') : add(rc, [0.42, 0.02, 0.22]);
  return <><P o={a.w} /><WasherCuff at={rc} b={b} k={locked ? 1 : 0} sag={locked ? 0.25 : 0.05} />{near(t, [ev('cuff')], 0.35) && <Stars center={add(RING_C, [0, 0.35, 0.45])} t={t * 3} r={0.25} size={0.07} />}</>; };

// =====================================================================================================
// COURT (EP17 courtRoom with the washer on the floor instead of the fire on the bench)
// =====================================================================================================
const CW: V3 = [0.95, 0, -1.75];
const courtRoom = (C: Cast, t: number) => { const I = C.judge;
  const pose = (tt: number) => { hideProps(I);
    const w = body(I, ps('judge', 0, -3.25, 0, tt, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0.95, 0.8, -1.75], face: tt > ev('gavel') - 0.35 && tt < ev('gavel') + 0.5 ? 'shout' : 'angry'}), tt, 1.25);
    const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]); const up = strike(tt, ev('gavel'), 0.4);
    rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - up, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - up * 0.6, I.root); w.updateMatrixWorld(true); return {w, g}; };
  let bb = new THREE.Box3(), top = -1e9; pose(ev('gavel')).g.traverse((o: any) => { if (!o.isMesh) return; const b = new THREE.Box3().setFromObject(o); const cy = (b.min.y + b.max.y) / 2; if (cy > top) { top = cy; bb = b; } });
  const blk: V3 = [(bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2];
  const {w} = pose(t);
  return <><Court t={t} /><P o={w} /><CourtLife t={t} C={C} look={add(CW, [0, 0.8, 0])} />
    <Washer position={CW} yaw={-0.35} t={t} lid={0} wob={near(t, [ev('gavel')], 0.4) ? 0.6 : 0} water={0} clothes={0} tag />
    <WasherCuff at={add(CW, [0, RING_Y, 0.02])} b={[CW[0] - 0.2, 0.02, CW[2] + 0.85]} sag={0} />
    <mesh position={[blk[0], blk[1] - 0.03, blk[2]]} castShadow><boxGeometry args={[0.3, 0.06, 0.26]} /><meshLambertMaterial color="#5A3019" /></mesh>
    {blk[1] - 0.06 > 1.5 && <mesh position={[blk[0], (blk[1] - 0.06 + 1.5) / 2, blk[2]]}><boxGeometry args={[0.07, blk[1] - 0.06 - 1.5, 0.07]} /><meshLambertMaterial color="#7A4526" /></mesh>}</>; };

// =====================================================================================================
// THE CELL BLOCK: cell 26 with the washer at work, cells 27 / 28 beside it, a corridor in front
// =====================================================================================================
const CWP: V3 = [0.2, 0, -0.55], CTUB = tubTop(CWP), GUARD = {x: -0.8, z: 0.55}, DROP: V3 = [-0.55, 0, 0.35];
const cellBlock = (C: Cast, t: number, o: {cells?: boolean} = {}) => <>
  <Cell t={t} days={0.2} marks={0} /><CellPlate text="ห้อง 26" position={[0, 2.12, 1.54]} w={0.64} />
  {o.cells && [3, 6].map((x, i) => <group key={x} position={[x, 0, 0]}><Cell t={t} days={0.3} marks={0} /><CellPlate text={`ห้อง ${27 + i}`} position={[0, 2.12, 1.54]} w={0.64} /></group>)}
  <Washer position={CWP} t={t} lid={1} spin={t * 9} wob={0.35} water={0.6} clothes={6} tag />
  <WasherCuff at={add(CWP, [0, RING_Y, 0.02])} b={[0.75, 0.55, 1.45]} sag={0.2} />
  {[[0.85, 0, -0.9, 0.3], [0.95, 0.31, -0.85, 0.1], [-0.75, 0, -0.95, -0.2]].map(([x, y, z, yw], i) => <Basket key={i} position={[x, y, z]} yaw={yw} c="#3C7FC2" />)}
  <pointLight position={[0, 1.7, 1.0]} color="#DCE8F5" intensity={2.4} distance={4} decay={1.5} />
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[1.5, -0.002, 4.5]}><planeGeometry args={[20, 6]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[1.5, 1.4, 7.4]} rotation={[0, Math.PI, 0]}><planeGeometry args={[20, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh></>;
/** an inmate, barefoot, one white sock on his left foot; `basket` = he carries a full basket in front of him */
const inmate = (C: Cast, i: number, x: number, z: number, yaw: number, t: number, o: {basket?: boolean; face?: string} = {}) => {
  const g = guy(C, INMATES[i], x, z, yaw, t, {face: o.face ?? 'half', clip: 'idle_neutral_01'}); const f: V3 = [Math.sin(yaw), 0, Math.cos(yaw)], l: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const B: V3 = [x + f[0] * 0.36, 0.86, z + f[2] * 0.36];
  if (o.basket) { hand(g.I, 'L', add(B, [l[0] * 0.24, 0.12, l[2] * 0.24]), 'fist'); hand(g.I, 'R', add(B, [-l[0] * 0.24, 0.12, -l[2] * 0.24]), 'fist'); g.w.updateMatrixWorld(true); }
  const ft = bw(g.I, 'Bip01_L_Foot'), toe = bw(g.I, 'Bip01_L_Toe0');
  return <><P o={g.w} /><FootSock ankle={ft} heel={add(ft, [-f[0] * 0.04, -0.06, -f[2] * 0.04])} toe={add(toe, [f[0] * 0.04, -0.01, f[2] * 0.04])} />
    {o.basket && <Basket position={add(B, [0, -0.16, 0])} yaw={yaw} c="#3C7FC2" s={0.85} />}</>; };
const QX = [1.0, 1.75, 2.5, 3.25, 4.0];
const queue = (C: Cast, t: number) => <>{QX.map((x, i) => <React.Fragment key={i}>{inmate(C, i, x + Math.sin(t * 2 + i) * 0.02, 2.3 + (i % 2) * 0.08, -Math.PI / 2, t, {basket: true})}</React.Fragment>)}</>;
const LX = [1.6, 0.8, 0, -0.8, -1.6];
const lineup = (C: Cast, t: number) => <>{LX.map((x, i) => <React.Fragment key={i}>{inmate(C, i, x, 2.35, 0, t, {face: i % 2 ? 'closed' : 'half'})}</React.Fragment>)}</>;
const guard = (C: Cast, t: number) => { const u = sm((t - ev('drop') + 0.45) / 0.45); const pos: V3 = lerp3([GUARD.x + 0.05, 0.85, GUARD.z - 0.35], add(DROP, [0, 0.32, 0]), u);
  const g = guy(C, 'offB', GUARD.x, GUARD.z, Math.atan2(DROP[0] - GUARD.x, DROP[2] - GUARD.z) + 0.6, t, {face: 'angry', look: CTUB});
  hand(g.I, 'L', add(pos, [0.22, 0.1, 0.05]), 'fist'); hand(g.I, 'R', add(pos, [-0.22, 0.1, -0.05]), 'fist'); g.w.updateMatrixWorld(true);
  return <><P o={g.w} /><Basket position={add(pos, [0, -0.16, 0])} yaw={0.3} c="#3C7FC2" /></>; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: MCU in his yard at the washer, his left hand lifting a wet shirt out of the tub
    const k = sm((t - ev('pull') + 0.6) / 0.6); const hd: V3 = add(TUB, [0.12, -0.12 + 0.45 * k, 0.1 + 0.1 * k]);
    const m = man(C, t, {face: 'open', look: TUB, L: hd, ls: 'fist'});
    return {node: <>{yard(t)}<P o={m.w} /><mesh position={add(hd, [0, -0.18, 0])} rotation={[0.2, 0.4, 0.1]} material={TM.shirt}><boxGeometry args={[0.26, 0.34, 0.03]} /></mesh>
      {k > 0.3 && <Drips from={add(hd, [0, -0.3, 0])} floor={0.05} t={t} t0={0} n={6} spread={0.08} />}</>,
      cam: mv({pos: [0.85, 1.6, -6.7], look: [1.3, 1.28, -8.55], fov: 48}, lt, {arrive: 0.06, push: 0.08}), bg: SKY};
  },
  sock: (t, lt, C) => {
    // he holds up a red striped sock and looks for its pair
    const k = sm((t - ev('sock') + 0.2) / 0.35); const hd: V3 = lerp3(add(TUB, [0.15, 0.1, 0.12]), [MAN.x - 0.25, 1.42, MAN.z + 0.4], k);
    const m = man(C, t, {face: k > 0.8 ? 'half' : 'open', look: add(hd, [0, -0.1, 0]), L: hd, ls: 'fist'});
    return {node: <>{yard(t)}<P o={m.w} /><Sock top={add(hd, [0, -0.02, 0])} swing={Math.sin(t * 6) * 0.12} /></>,
      cam: mv({pos: [1.05, 1.5, -7.15], look: [1.5, 1.35, -8.45], fov: 44}, lt, {arrive: 0.07, push: 0.08}), bg: SKY};
  },
  tub: (t, lt, C) => {
    // down into the empty tub: one sock dangles from his fingers. Nothing else in there. Snap zoom on "ข้างเดียว".
    const z = sm((t - ev('one')) / 0.15); const hd: V3 = add(TUB, [0.08, 0.32, 0.12]);
    const m = man(C, t, {face: 'half', look: TUB, L: hd, ls: 'fist'});
    return {node: <>{yard(t)}<P o={m.w} /><Sock top={add(hd, [0, -0.02, 0])} swing={Math.sin(t * 4) * 0.15} /></>,
      cam: mv({pos: add(TUB, [0.22, 0.95, 0.42]), look: add(TUB, [0.04, -0.05, 0.08]), fov: 52 - 14 * z}, lt, {arrive: 0, push: 0.04, shake: near(t, [ev('one')], 0.1) ? 0.006 : 0}), bg: SKY};
  },
  charge: (t, lt, C) => {
    // low: he points the sock at the washer. Snap zoom, the plate drops.
    const z = sm((t - ev('plate')) / 0.17); const k = sm((t - ev('point') + 0.15) / 0.25);
    const jab = 0.05 * Math.sin(Math.max(0, t - ev('point')) * 14) * Math.exp(-Math.max(0, t - ev('plate')) * 0.5);   // he keeps jabbing the accusing finger
    const m = man(C, t, {face: 'shout', look: add(TUB, [0, 0.1, 0]), L: add(lerp3([MAN.x - 0.12, 1.3, MAN.z + 0.33], [MAN.x - 0.5, 1.3, MAN.z + 0.12], k), [-jab, jab * 0.4, 0]), ls: 'point'});
    return {node: <>{yard(t)}<P o={m.w} /><Sock top={add(bw(m.I, 'Bip01_L_Hand'), [0, -0.02, 0])} swing={0.3} /></>,
      cam: mv({pos: [1, 0.95, -7.0], look: [1.35, 1.3, -8.55], fov: 56 - 12 * z}, lt, {arrive: 0.08, push: 0.12, shake: near(t, [ev('plate')], 0.1) ? 0.01 : 0}), bg: SKY};
  },
  phone: (t, lt, C) => {
    // the call: the phone up in front of his mouth on speaker (edge-on at the ear it vanished), the sock still in his right hand, the washer beside him
    const k = sm((t - ev('phoneUp')) / 0.25); const m0 = man(C, t, {face: 'shout', look: [MAN.x - 0.6, 1.5, MAN.z + 1.4]});
    const ph = lerp3([MAN.x + 0.18, 1.0, MAN.z + 0.25], hw(m0.I, [9, 0, 19]), k); hand(m0.I, 'L', add(ph, [0.02, -0.07, -0.03]), 'cup');
    hand(m0.I, 'R', [MAN.x - 0.3, 1.05, MAN.z - 0.05], 'fist'); m0.w.updateMatrixWorld(true);
    return {node: <>{yard(t)}<P o={m0.w} /><Phone position={ph} rotation={[-0.35, -0.25, 0.1 * k]} /><Sock top={add(bw(m0.I, 'Bip01_R_Hand'), [0, -0.02, 0])} swing={Math.sin(t * 5) * 0.1} /></>,
      cam: mv({pos: [1.25, 1.6, -7.1], look: [1.5, 1.5, -8.5], fov: 46}, lt, {arrive: 0.07, push: 0.08}), bg: SKY};
  },
  frogs: (t, lt, C) => {
    // reverse, from behind the washer: three police frogmen in a row in his yard, masks on, fins on. Each one steps up on the count.
    const m = man(C, t, {at: MAN2, face: 'open', look: [0.8, 1.4, ROWZ]});
    return {node: <>{yard(t)}<P o={m.w} />{[0, 1, 2].map((i) => { const k = pop((t - ev('frogs') - i * 0.22) / 0.3); return <React.Fragment key={i}>{frog(C, i, ROWX[i] + 0.02 * Math.sin(t * 3 + i * 2), ROWZ + 0.25 * (1 - k), Math.PI + 0.06 * Math.sin(t * 2.3 + i), t, {y: 0.0}).node}</React.Fragment>; })}</>,
      cam: mv({pos: [0.95, 1.45, -9.0], look: [0.8, 1.4, -6.9], fov: 60}, lt, {arrive: 0.06, push: 0.14, roll0: -2}), bg: SKY};
  },
  dive: (t, lt, C) => {
    // from the side: one, two, three — head first into the tub, fins last
    const m = man(C, t, {at: MAN2, face: 'wide', look: TUB});
    return {node: <>{yard(t)}<P o={m.w} />{[0, 1, 2].map((i) => <React.Fragment key={i}>{t < ev('dive' + (i + 1)) ? frog(C, i, ROWX[i], ROWZ, Math.PI, t).node : diver(C, i, t)}</React.Fragment>)}
      {[1, 2, 3].map((i) => <Splash key={i} at={add(TUB, [0, 0.02, 0])} t={t} t0={ev('dive' + i) + 0.42} t1={ev('dive' + i) + 0.55} n={20} power={0.7} />)}</>,
      cam: mv({pos: [2.9, 3.0, -6.2], look: [0.85, 0.95, -7.95], fov: 52}, lt, {arrive: 0.05, push: 0.05}), bg: SKY};
  },
  panel: (t, lt, C) => {
    // ECU on the control panel: the knob turns by itself to "ปั่น"
    return {node: <>{yard(t)}</>, cam: mv({pos: add(WP, [0.15, 1.25, 0.45]), look: add(WP, [0.08, 1.02, -0.25]), fov: 40}, lt, {arrive: 0.06, push: 0.08, shake: near(t, [ev('mode')], 0.2) ? 0.006 : 0}), bg: SKY};
  },
  spin: (t, lt, C) => {
    // straight down into the tub: a whirlpool, three masks going round and round
    return {node: <>{yard(t)}{inTub(t)}<Splash at={add(TUB, [0, 0.02, 0])} t={t} t0={ev('spin') + 0.1} t1={ev('fling')} n={30} power={0.8} /></>,
      cam: mv({pos: add(TUB, [0, 1.0, 0.001]), look: add(TUB, [0, -0.3, 0]), fov: 52}, lt, {arrive: 0, push: 0.05, roll0: 90, shake: 0.012}), bg: SKY};
  },
  fling: (t, lt, C) => {
    // no line: the machine throws all three out onto the grass
    const m = man(C, t, {at: MAN2, face: 'wide', look: [0.9, 0.5, -7]});
    return {node: <>{yard(t)}<P o={m.w} />{pile(C, t)}</>,
      cam: mv({pos: [-0.2, 1.9, -5.3], look: [1, 0.65, -7.8], fov: 56}, lt, {arrive: 0, push: 0.04, shake: near(t, [ev('land')], 0.15) ? 0.02 : 0}), bg: SKY};
  },
  cuff: (t, lt, C) => {
    // the officer comes with a giant cuff and lifts it over the whole machine
    const m = man(C, t, {at: MAN2, face: 'open', look: add(WP, [0, 1, 0])});
    return {node: <>{yard(t)}<P o={m.w} />{pile(C, t)}{cop(C, t)}</>, cam: mv({pos: [-0.45, 1.6, -6.2], look: [1.35, 1.0, -8.2], fov: 50}, lt, {arrive: 0.07, push: 0.06}), bg: SKY};
  },
  lock: (t, lt, C) => {
    // it drops round the washer and snaps shut
    const m = man(C, t, {at: MAN2, face: 'half', look: add(WP, [0, 0.6, 0])});
    return {node: <>{yard(t)}<P o={m.w} />{pile(C, t)}{cop(C, t)}</>,
      cam: mv({pos: [2.05, 1.0, -7.0], look: [0.95, 0.62, -8.65], fov: 46}, lt, {arrive: 0.06, push: 0.06, shake: near(t, [ev('cuff')], 0.12) ? 0.018 : 0}), bg: SKY};
  },
  court: (t, lt, C) => ({node: courtRoom(C, t), cam: mv({pos: [2.1, 1.85, 0.6], look: [0.45, 1.35, -2.7], fov: 46}, lt, {arrive: 0.07, push: 0.06})}),
  gavel: (t, lt, C) => ({node: courtRoom(C, t), cam: mv({pos: [0.45, 2.2, 1.1], look: [0.3, 1.84, -3.2], fov: 30}, lt, {arrive: 0.07, push: 0.16, roll0: 1.5, shake: near(t, [ev('gavel')], 0.1) ? 0.012 : 0})}),
  cell: (t, lt, C) => ({node: <>{cellBlock(C, t)}{guard(C, t)}</>, cam: mv({pos: [0.15, 1.45, 4.0], look: [-0.1, 1.0, 0.0], fov: 50}, lt, {arrive: 0.08, push: 0.07, roll0: -2}), bg: CELL_BG}),
  queue: (t, lt, C) => ({node: <>{cellBlock(C, t, {cells: true})}{queue(C, t)}</>, cam: mv({pos: [-1.35, 1.6, 3.55], look: [2.3, 1.05, 2.2], fov: 46}, lt, {arrive: 0.06, push: 0.05}), bg: CELL_BG}),
  line: (t, lt, C) => ({node: <>{cellBlock(C, t, {cells: true})}{lineup(C, t)}</>, cam: mv({pos: [3.6, 1.35, 5.9], look: [-0.1, 0.95, 2.35], fov: 46}, lt, {arrive: 0.06, push: 0.05}), bg: CELL_BG}),
  feet: (t, lt, C) => { const k = (t - sh('feet').t0) / (sh('feet').t1 - sh('feet').t0); const x = lerp(1.25, -0.45, k);
    // at foot level along the row: every left foot in a white sock, every right foot bare
    return {node: <>{cellBlock(C, t, {cells: true})}{lineup(C, t)}</>, cam: mv({pos: [x + 0.4, 0.32, 3.25], look: [x - 0.25, 0.12, 2.35], fov: 52}, lt, {arrive: 0, push: 0}), bg: CELL_BG}; },
  socks: (t, lt, C) => ({node: <>{cellBlock(C, t)}{socksInTub(t)}</>,
    // no line: down into the prison washer — one-sock singles going round, and among them a red striped one
    cam: mv({pos: add(CTUB, [0, 1.05, 0.001]), look: add(CTUB, [0, -0.3, 0]), fov: 50}, lt, {arrive: 0, push: 0.07, roll0: 90}), bg: CELL_BG}),
};
const socksInTub = (t: number) => <group position={add(CTUB, [0, -0.2, 0])}>{Array.from({length: 7}, (_, i) => { const a = t * 9 + i * 0.9, r = 0.06 + (i % 3) * 0.05;
  return <group key={i} position={[Math.cos(a) * r, 0.01, Math.sin(a) * r]} rotation={[Math.PI / 2, 0, a]}><Sock top={[0, 0.12, 0]} c={i === 3 ? '#C8382E' : '#F2F0EA'} s={0.8} /></group>; })}</group>;
void [CTUB, WASH];
