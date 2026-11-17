import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, lerp3, cl, pop} from './data';
import {Court, Cell} from '../AbsurdEp1/sets';
import {makeGavel, Handcuffs} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {Stars} from '../AbsurdEp4/props';
import {PoliceCar} from '../AbsurdEp7/props';
import {Village} from '../AbsurdEp8/village';
import {Phone} from '../AbsurdEp16/props';
import {ps, body, bw, hideProps, prop, P, CamRig, mv, strike, near, sm, V3, Cast, ShotOut, DAY, SKY, CELL_BG, hand, hw, walker} from '../lifekit/stage';
import {VillageLife, CourtLife, CellBlockLife} from '../lifekit/presets';
import {SirenLights} from '../absurdkit';
import {DejaVu, CloudArm, Binoculars, BigJar, JAR, makeFly, Note, FlipSign, FilePile, FILE, ghostify} from './props';

export {CamRig};
/** EP19 คดีเดจาวู. He trips over his own feet in front of his house and it feels familiar — he has tripped exactly like this before. That
 *  feeling is déjà vu, and it is lying to him (it never happened): fraud. He calls the police. Déjà vu floats out of his head, sees that his
 *  fly is open and calls the police back on him: indecent exposure. Both are arrested. In court the judge gets déjà vu ("this court has
 *  already decided this case"): double jeopardy, déjà vu walks free. The fly case is not familiar at all: ten years, alone. Since that day the
 *  court dismisses every case, because they all feel familiar.
 *  Déjà vu only does what déjà vu does: it makes a moment feel like it came round again. Shown as a violet thought-cloud with a looping arrow
 *  (no face), and as see-through violet DOUBLES of the person having it, repeating what they do.
 *
 *  LAYOUT (metres; yaw 0 faces +z; root +x is the character's LEFT)
 *  town    EP8 village, road along x (z −3…3). He walks along the road edge z = ZW (−2.3) heading +x (yaw π/2), houses behind him (−z side).
 *          He trips at x = XT (0) and staggers to STAND (XT + 0.45), where he stays, facing +x. Cameras stand on the +z side (the road), 3/4 front.
 *          Déjà vu sits over his head (HEAD_DV) from `dv`, lifts off at `lift` to FLEE (1.5 m ahead of him over the road, 1.8 m up) and hovers there.
 *          Twelve patrol cars brake in, six per lane: lane z −0.3 from −x, lane z 2.0 from +x. offA cuffs him from his front-right (+z side);
 *          offB stands beyond the cloud (+x) and sweeps the big jar over it sideways, mouth towards −x.
 *  court   EP1 Court. Judge at (0, −3.25) raised 1.25; his double gjudge sits 0.2 m to his right (−x) and 0.08 behind. The jar stands on the
 *          bench at his left hand (JB). He stands to the left of the dock at (−0.7, 0.75) facing the bench (yaw π), cuffed; offA beside him.
 *          The pile of case files lies under the gavel's strike point.
 *  cell    EP1 Cell, plate "ห้อง 24", the sentence plate on the bar beam. He sits on the bench. The neighbours (CellBlockLife) either side.
 *
 *  TRAPS OF THIS EPISODE (written before the first shot)
 *  1. "สะดุดขาตัวเอง" must be SEEN: the walk keeps stepping while the body pitches forward ~24°, arms fly out, then he catches himself.
 *  2. "ท่านี้เป๊ะ": the double trips on the SAME spot in the SAME pose — the man stands just past it and watches it.
 *  3. The cloud over his head has to sit below the plate band (top 25 %) in the charge shot: low camera, cloud near the top third.
 *  4. The open fly is tiny: an ECU with the red annotation "ซิป" on "ซิป", and it stays open in court (zipcase) — continuity.
 *  5. "จับทั้งคู่": both arrests in ONE frame, stacked vertically for 9:16 — cuffs below, the jar sweeping over the cloud above.
 *  6. The judge's déjà vu = his own double sliding out of him (no cloud on him). The real cloud is in the jar on the bench until `out`.
 *  7. The closer must read as (ข): only the judge and his double, striking every file; the cloud is never in the last court shots.
 *  8. The gavel needs something under it: the file pile is placed from the strike pose.
 *  9. Cell 24 is the first free number (13 and 18–23 are taken). The cloud drifts past the bars on "คนเดียว", then is gone.
 *  10. Borrowed props carry old things: EP7's patrol car (small side text), EP1's jar label — this episode has its own jar. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// =====================================================================================================
// THE VILLAGE ROAD
// =====================================================================================================
const X0 = -45, X1 = 40, XT = 0, ZW = -2.3, STAND = XT + 0.45, YAW = Math.PI / 2;
const town = (t: number, o: {cars?: boolean} = {}) => <><Village x0={X0} x1={X1} /><VillageLife t={t} x0={X0} x1={X1} traffic={false} dog={false} />{DAY([XT, 0, ZW])}
  {o.cars && cars(t)}</>;
type GO = {clip?: string; face?: string; look?: V3; y?: number; rx?: number; sit?: boolean};
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? (o.sit ? 'sit_table_idle_neutral_01' : 'idle_neutral_01'), ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {}), ...(o.sit ? {poseId: 'sitIdle'} : {})}), t, o.y ?? 0, o.rx ?? 0);
  return {I, w}; };
// ---- the trip: walking +x at 1.25 m/s until `tt`, then a 0.45 m stagger; the body pitches forward and comes back; arms fly out
const WALK = 1.25;
const tripX = (u: number) => u < 0 ? WALK * u : 0.45 * (1 - Math.pow(1 - cl(u / 0.55), 2));
const tripRx = (u: number) => u < 0 ? 0 : u < 0.12 ? 0.42 * sm(u / 0.12) : u < 0.28 ? 0.42 : u < 0.8 ? 0.42 * (1 - sm((u - 0.28) / 0.5)) : -0.03 * Math.exp(-(u - 0.8) * 5) * Math.sin((u - 0.8) * 14);
/** a walker who trips at time tt on x = XT + dx (u = t − tt). Returns the person. Used for the man and for his doubles. */
const tripper = (C: Cast, id: string, t: number, tt: number, o: {dz?: number; face?: string; look?: V3} = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  const u = t - tt; const x = XT + tripX(u), z = ZW + (o.dz ?? 0); I.root.visible = !(id !== 'nai' && u > 1.1); const stop = 0.5; const moving = u < stop;
  const s = walker(id, {x, z, yaw: YAW, odo: x + 20, moving, since: u - stop}, t, {face: o.face ?? (u > 0 && u < 1.0 ? 'wide' : 'open'), ...(o.look && u > 0.9 ? {lookW: o.look} : {})});
  const w = body(I, s, t, 0, tripRx(u));
  if (u > 0 && u < 0.85) { const f = Math.sin(u * 21) * 0.1, k = sm(u / 0.1) * (1 - sm((u - 0.55) / 0.3));   // flailing: both arms out and up, then down
    hand(I, 'R', lerp3([x + 0.15, 0.95, z - 0.25], [x + 0.42, 1.55 + f, z - 0.45], k), 'open'); hand(I, 'L', lerp3([x + 0.15, 0.95, z + 0.25], [x + 0.4, 1.5 - f, z + 0.5], k), 'open'); }
  w.updateMatrixWorld(true); return {I, w, x, z}; };
/** the man after the trip: standing at STAND facing +x. hands: optional targets */
const man = (C: Cast, t: number, o: GO & {R?: V3; L?: V3; rs?: string; ls?: string; fly?: boolean} = {}) => { const m = guy(C, 'nai', STAND, ZW, YAW, t, o);
  if (o.R) hand(m.I, 'R', o.R, o.rs ?? 'open'); if (o.L) hand(m.I, 'L', o.L, o.ls ?? 'open'); m.w.updateMatrixWorld(true); flyOn(m.I, o.fly !== false); return m; };
// ---- the open fly, built once into his hips box (props.tsx makeFly): shown from the first shot, the joke is only pointed at later
const flies = new WeakMap<any, THREE.Object3D>();
const flyOn = (I: any, on: boolean) => { let f = flies.get(I);
  if (!f) { let hipsFr: THREE.Object3D | null = null; I.bones.Bip01_Spine.traverse((o: any) => { if (!hipsFr && o.isMesh && o.geometry?.parameters?.height === 20 && o.geometry?.parameters?.depth === 19) hipsFr = o.parent; });
    f = makeFly(); (hipsFr ?? I.bones.Bip01_Spine).add(f); flies.set(I, f); }
  f.visible = on; };
const HEAD_DV = (t: number): V3 => [STAND + 0.04, 2.1 + 0.03 * Math.sin(t * 2.2), ZW];
const FLEE: V3 = [STAND + 1.5, 1.65, ZW + 1.0];
const cloudAt = (t: number): V3 => { const k = sm((t - ev('lift')) / 1.4); const a = HEAD_DV(t); const arc = Math.sin(k * Math.PI) * 0.35;
  const p = lerp3(a, FLEE, k); return [p[0], p[1] + arc + 0.04 * Math.sin(t * 1.9), p[2]]; };
const dv = (t: number, o: {tag?: boolean; pulse?: number; r?: number} = {}) => <DejaVu position={cloudAt(t)} t={t} k={pop((t - ev('dv')) / 0.35)} tag={o.tag} pulse={o.pulse ?? 0} r={o.r} />;
/** its arm out of the cloud's +z side, holding binoculars or a phone */
const cloudHand = (t: number, what: 'bino' | 'phone', k: number) => { const c = cloudAt(t); const from: V3 = add(c, [-0.05, -0.05, 0.16]);
  const h: V3 = lerp3(add(c, [0.05, -0.3, 0.26]), what === 'bino' ? add(c, [-0.2, 0.0, 0.2]) : add(c, [-0.12, 0.05, 0.27]), k);
  const aim = new THREE.Vector3(STAND + 0.12 - h[0], 0.93 - h[1], ZW - h[2]).normalize(); const bq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), aim);
  return <><CloudArm from={from} hand={h} />{what === 'bino' ? <group position={add(h, [aim.x * 0.05, aim.y * 0.05, aim.z * 0.05])} quaternion={bq}><Binoculars position={[0, 0, 0]} /></group> : <Phone position={add(h, [-0.03, 0.02, 0.02])} rotation={[0, 0.35, 0.15]} scale={1.3} />}</>; };
// ---- the call
const EAR_L: V3 = [12, 12, 2];
const onPhone = (C: Cast, t: number, face: string, look: V3) => { const m = man(C, t, {face, look}); const k = sm((t - ev('phoneUp')) / 0.25);
  const ph = lerp3([STAND + 0.1, 0.95, ZW - 0.22], add(hw(m.I, EAR_L), [0.01, -0.01, -0.03]), k); hand(m.I, 'L', add(ph, [0.02, -0.06, -0.03]), 'cup'); m.w.updateMatrixWorld(true);
  return {m, node: <><P o={m.w} /><Phone position={ph} rotation={[0, YAW + Math.PI / 2, 0.18 * k]} /></>}; };
// ---- twelve patrol cars, braking in nose to tail: six per lane, from both ends
const STOPS: [number, number][] = [[-26, 0], [-21.5, 0], [-17, 0], [-12.5, 0], [-8, 0], [-3.5, 0], [4.5, 1], [8.5, 1], [12.5, 1], [16.5, 1], [20.5, 1], [24.5, 1]];
const LANE = [-0.3, 2.0];
const TP = () => ev('cars');
const roll = (t: number) => { const u = TP() - t; return u > 0 ? 9 * u * u : 0; };
const dive = (t: number) => { const u = TP() - t; return u > 0 ? -0.03 * cl(u * 4) : 0.025 * Math.exp(u * 7) * Math.sin(-u * 22); };
const carAt = (i: number, t: number): V3 => [STOPS[i][0] + (STOPS[i][1] ? roll(t) : -roll(t)), 0, LANE[STOPS[i][1]]];
const cars = (t: number) => t < TP() - 2.2 ? null : <>{STOPS.map((s, i) => <PoliceCar key={i} t={t} position={carAt(i, t)} yaw={s[1] ? Math.PI : 0} pitch={dive(t)} seed={i} />)}
  <SirenLights t={t} position={[XT + 1, 3, 0.8]} power={5} /></>;
// ---- the arrest: offA cuffs his wrists in front of him; offB sweeps the jar over the cloud (jar on its side, mouth towards −x)
const WRIST: V3 = [STAND + 0.3, 1.0, ZW + 0.02];
const OB = {x: FLEE[0] + 0.9, z: FLEE[2] + 0.15};
const jarState = (t: number) => { const u = t - ev('jar'); const k = 1 - Math.pow(1 - cl((u + 0.35) / 0.35), 3);
  const c = cloudAt(t); const bottom: V3 = [c[0] + JAR.h * 0.5 + 0.55 * (1 - k), c[1] - 0.02, c[2]]; return {bottom, lid: u < 0.25 ? 1 : 1 - sm((u - 0.25) / 0.12), k}; };
const arrested = (C: Cast, t: number) => { const cuffed = t > ev('cuff');
  const m = man(C, t, {face: cuffed ? 'wide' : 'shout', look: [OB.x, 1.6, OB.z], R: cuffed ? add(WRIST, [0, 0, -0.04]) : [STAND + 0.2, 0.88, ZW - 0.1], L: cuffed ? add(WRIST, [0, 0, 0.04]) : [STAND + 0.2, 0.88, ZW + 0.05], rs: 'fist', ls: 'fist'});
  const a = guy(C, 'offA', STAND + 0.6, ZW - 0.55, Math.atan2(-0.3, 0.55), t, {face: 'angry', look: WRIST});
  hand(a.I, 'R', add(WRIST, [0.06, -0.03, 0.08]), 'fist'); hand(a.I, 'L', add(WRIST, [0.1, 0.06, 0.02]), 'fist'); a.w.updateMatrixWorld(true);
  const j = jarState(t); const cen: V3 = add(j.bottom, [-JAR.h * 0.5, 0, 0]);
  const b = guy(C, 'offB', OB.x, OB.z, -Math.PI / 2 + 0.25, t, {face: 'angry', look: cen});
  hand(b.I, 'R', add(j.bottom, [0.05, -0.04, -0.14]), 'open'); hand(b.I, 'L', add(j.bottom, [0.05, -0.04, 0.14]), 'open');   // on the jar's base, outside the glass b.w.updateMatrixWorld(true);
  const c = cloudAt(t);
  return <><P o={m.w} /><P o={a.w} /><P o={b.w} />
    <Handcuffs k={pop((t - ev('cuff') + 0.08) / 0.15)} position={WRIST} rotation={[0, Math.PI / 2, Math.PI / 2]} size={1.4} />
    {near(t, [ev('cuff')], 0.35) && <Stars center={add(WRIST, [0, 0.15, 0])} t={t * 3} r={0.14} size={0.04} />}
    <DejaVu position={c} t={t} r={t > ev('jar') ? 0.17 : 0.22} pulse={near(t, [ev('jar')], 0.3) ? 1 : 0} />
    <BigJar position={j.bottom} rotation={[0, 0, Math.PI / 2]} lid={j.lid} />
    {near(t, [ev('jar')], 0.35) && <Stars center={add(c, [0, 0.3, 0])} t={t * 3} r={0.2} size={0.05} />}</>; };

// =====================================================================================================
// THE COURT
// =====================================================================================================
const JB: V3 = [0.55, 1.5, -2.92];   // the jar on the bench at the judge's left hand
const DOCK = {x: -0.7, z: 0.75};
const HITS = (() => { const h0 = ev('hit0'); return Array.from({length: 14}, (_, i) => h0 + i * 0.52); })();
const nextHit = (t: number, hits: number[]) => hits.find((h) => t < h + 0.25) ?? 1e9;
const gavelFor = (ghost: boolean) => ghost ? () => { const g = makeGavel(); ghostify(g); return g; } : makeGavel;
/** a judge (the real one or his double) on the bench: gavel strikes at `hits`, the left hand can lift the jar's lid */
const judgeAt = (C: Cast, id: string, t: number, o: {dx?: number; dz?: number; hits?: number[]; face?: string; look?: V3; lidHand?: V3 | null; point?: boolean} = {}) => { const I = C[id];
  const pose = (tt: number) => { hideProps(I); resetTurn(I);
    const w = body(I, ps(id, o.dx ?? 0, -3.25 + (o.dz ?? 0), 0, tt, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: o.look ?? [-0.7, 1.5, 0.75], face: o.face ?? 'angry'}), tt, 1.25);
    const g = prop(I, 'gavel', 'Bip01_R_Hand', gavelFor(id !== 'judge'), [8, 0, 0], [0, Math.PI / 2, 0]); const up = strike(tt, nextHit(tt, o.hits ?? []), 0.3);
    rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - up, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - up * 0.6, I.root);
    if (o.lidHand) hand(I, 'L', o.lidHand, 'fist'); else if (o.point) hand(I, 'L', [(o.dx ?? 0) + 0.3, 2.3, -3.25 + 0.42], 'point');
    w.updateMatrixWorld(true); return {w, g}; };
  return pose(t).w; };
/** where the gavel head lands (the strike pose at a hit), for the pile under it */
let STRIKE: V3 | null = null;
const strikePoint = (C: Cast): V3 => { if (STRIKE) return STRIKE; const I = C.judge; const h = 50;   // any time works: pose at the bottom of a strike
  hideProps(I); resetTurn(I); body(I, ps('judge', 0, -3.25, 0, h, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01'}), h, 1.25); const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7, I.root); I.root.updateMatrixWorld(true);
  let bb = new THREE.Box3(), top = -1e9; g.traverse((o: any) => { if (!o.isMesh) return; const b = new THREE.Box3().setFromObject(o); const cy = (b.min.y + b.max.y) / 2; if (cy > top) { top = cy; bb = b; } });
  STRIKE = [(bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2]; return STRIKE; };
const lidHand = (t: number): V3 | null => { const u = t - ev('lid'); if (u < -0.45 || u > 1.0) return null; const k = sm((u + 0.45) / 0.45), up = sm(u / 0.3);
  return add(JB, [-0.05 + 0.25 * up, JAR.h + 0.05 + 0.25 * up, 0.02 * k]); };
const jarCloud = (t: number): V3 => { const u = t - ev('out'); const base: V3 = add(JB, [0, JAR.h * 0.48, 0]); if (u < 0) return [base[0] + 0.02 * Math.sin(t * 2.3), base[1] + 0.02 * Math.sin(t * 3.1), base[2]];
  return [base[0] + 0.5 * u * u + 0.3 * u, base[1] + 1.4 * u, base[2] + 0.4 * u]; };
const courtRoom = (C: Cast, t: number, o: {ghost?: number; ghostHits?: number[]; hits?: number[]; jar?: boolean; pile?: boolean; man?: boolean; judgeFace?: string; point?: boolean} = {}) => {
  const lid = lidHand(t); const g = o.ghost ?? 0;
  const jw = judgeAt(C, 'judge', t, {hits: o.hits, face: o.judgeFace, lidHand: o.jar ? lid : null, point: o.point});
  const gw = g > 0.01 ? judgeAt(C, 'gjudge', t - 0.06, {dx: -0.2 * g, dz: -0.08 * g, hits: o.ghostHits ?? o.hits, face: o.judgeFace, point: o.point}) : null;
  const sp = o.pile ? strikePoint(C) : null; const lidK = t < ev('lid') ? 0 : sm((t - ev('lid')) / 0.3);
  const m = o.man === false ? null : (() => { const mm = guy(C, 'nai', DOCK.x, DOCK.z, Math.PI, t, {face: 'half', look: [0, 2.3, -3.25]}); hand(mm.I, 'R', [DOCK.x + 0.04, 1.12, DOCK.z - 0.3], 'fist'); hand(mm.I, 'L', [DOCK.x - 0.04, 1.12, DOCK.z - 0.3], 'fist'); mm.w.updateMatrixWorld(true); flyOn(mm.I, true); return mm; })();
  const of = guy(C, 'offA', DOCK.x - 0.6, DOCK.z + 0.25, Math.PI, t, {face: 'angry'});
  return <><Court t={t} /><CourtLife t={t} C={C} look={[0, 2.3, -3.25]} /><P o={jw} />{gw && <P o={gw} />}{m && <><P o={m.w} /><Handcuffs k={1} position={[DOCK.x, 1.12, DOCK.z - 0.3]} rotation={[0, 0, Math.PI / 2]} size={1.4} /></>}<P o={of.w} />
    {o.jar && <><BigJar position={JB} lid={lidK} /><DejaVu position={jarCloud(t)} t={t} r={0.17} pulse={t > ev('dvj') - 0.2 && t < ev('dvj') + 0.5 ? 1 : 0} /></>}
    {sp && <><FilePile position={[sp[0], 1.5, sp[2]]} t={t} hits={o.hits ?? []} />{sp[1] - 14 * FILE.h > 1.5 && <mesh position={[sp[0], (sp[1] - 14 * FILE.h + 1.5) / 2 + 0.0, sp[2]]}><boxGeometry args={[0.3, 0.001, 0.26]} /></mesh>}</>}</>; };

// =====================================================================================================
// THE CELL (24)
// =====================================================================================================
const cellBlock = (C: Cast, t: number) => { const m = guy(C, 'nai', -0.6, -1.2, 0, t, {sit: true, y: 0, face: 'half', look: [0.2, 1.3, 2]}); flyOn(m.I, true);
  return <><Cell t={t} days={0.45} marks={0} /><CellPlate text="ห้อง 24" position={[-0.3, 2.12, 1.54]} w={0.42} /><FlipSign position={[0.28, 2.02, 1.58]} flip={t - ev('ten')} text="10 ปี" w={0.46} /><P o={m.w} />
    <CellBlockLife t={t} left={['fan', 'mosquito']} right={['durian']} />
    <pointLight position={[0, 1.7, 1.0]} color="#DCE8F5" intensity={2.0} distance={4} decay={1.5} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.2]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8E918B" /></mesh>
    <mesh position={[0, 1.4, 5.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh></>; };
const cellCloud = (t: number): V3 => { const u = t - ev('drift'); return [-0.6 + 1.3 * u, 1.45 + 0.08 * Math.sin(u * 3), 2.4]; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  open: (t, lt, C) => {
    // frame 0: MCU, walking along the road in front of the houses, a little pleased with himself
    const m = tripper(C, 'nai', t, ev('trip')); flyOn(m.I, true);
    return {node: <>{town(t)}<P o={m.w} /></>, cam: mv({pos: [m.x + 1.45, 1.42, ZW + 1.25], look: [m.x - 0.05, 1.3, ZW], fov: 40}, lt, {arrive: 0.06, push: 0.06}), bg: SKY};
  },
  trip: (t, lt, C) => {
    // medium, side-on: the foot catches, he pitches forward, arms out, staggers — and catches himself
    const m = tripper(C, 'nai', t, ev('trip')); flyOn(m.I, true);
    return {node: <>{town(t)}<P o={m.w} /></>, cam: mv({pos: [XT + 0.4, 1.3, ZW + 4.2], look: [XT + 0.05, 1.0, ZW], fov: 46}, lt, {arrive: 0.05, push: 0.05, shake: near(t, [ev('trip')], 0.15) ? 0.012 : 0}), bg: SKY};
  },
  familiar: (t, lt, C) => {
    // MCU: he stops. Squints. This feels… familiar.
    const m = man(C, t, {face: lt > 0.35 ? 'half' : 'open', look: [STAND + 0.7, 0.1, ZW + 0.1]});
    return {node: <>{town(t)}<P o={m.w} /></>, cam: mv({pos: [STAND + 1.45, 1.42, ZW + 0.55], look: [STAND, 1.38, ZW], fov: 40}, lt, {arrive: 0.06, push: 0.1}), bg: SKY};
  },
  replay: (t, lt, C) => {
    // wide, side-on: a see-through violet copy of him walks in from behind and trips on the same spot, in the same pose — exactly
    const m = man(C, t, {face: 'wide', look: [XT, 1.1, ZW]}); const g = tripper(C, 'gnai', t, ev('ghostTrip'), {face: 'wide', dz: -0.45});
    return {node: <>{town(t)}<P o={m.w} /><P o={g.w} /></>, cam: mv({pos: [XT + 0.2, 1.3, ZW + 3.6], look: [XT - 0.05, 1.0, ZW], fov: 46}, lt, {arrive: 0.06, push: 0.05}), bg: SKY};
  },
  name: (t, lt, C) => {
    // MCU from below: he scratches his head — and the violet cloud puffs into being above it, the loop arrow going round
    const m = man(C, t, {face: 'half', look: add(HEAD_DV(t), [0, 0.4, 0]), clip: 'idle_scratch_head_01'});
    return {node: <>{town(t)}<P o={m.w} />{dv(t)}</>, cam: mv({pos: [STAND + 1.3, 1.05, ZW + 1.0], look: [STAND, 1.7, ZW], fov: 46}, lt, {arrive: 0.06, push: 0.08}), bg: SKY};
  },
  cloud: (t, lt, C) => {
    // close on it: déjà vu, with its tag
    const m = man(C, t, {face: 'half', look: add(HEAD_DV(t), [0, 0.4, 0])});
    return {node: <>{town(t)}<P o={m.w} />{dv(t, {tag: true})}</>, cam: mv({pos: [STAND + 0.95, 2.0, ZW + 0.75], look: add(HEAD_DV(t), [0, -0.32, 0]), fov: 42}, lt, {arrive: 0.07, push: 0.1}), bg: SKY};
  },
  fool: (t, lt, C) => {
    // it pulses — and the world goes violet at the edges: it is playing him a rerun
    const p = Math.max(0, Math.sin((t - ev('fool')) * 9)) * (t > ev('fool') ? 1 : 0);
    const m = man(C, t, {face: t > ev('fool') + 0.1 ? 'wide' : 'half', look: [XT - 1, 1.0, ZW]});
    return {node: <>{town(t)}<P o={m.w} />{dv(t, {pulse: p})}</>, cam: mv({pos: [STAND + 1.15, 1.6, ZW + 1.05], look: [STAND - 0.05, 1.7, ZW], fov: 44}, lt, {arrive: 0.06, push: 0.1}), bg: SKY};
  },
  before: (t, lt, C) => {
    // wide: two doubles walk in behind him and trip on the same spot, one after the other — "it has happened before"
    const m = man(C, t, {face: 'wide', look: [XT, 1.0, ZW + 0.4]});
    const g1 = tripper(C, 'gnai', t, ev('g1'), {dz: -0.5}); const g2 = tripper(C, 'gnai2', t, ev('g2'), {dz: -1.0});
    return {node: <>{town(t)}<P o={m.w} /><P o={g1.w} /><P o={g2.w} />{dv(t, {pulse: 0.4})}</>, cam: mv({pos: [XT - 0.2, 1.45, ZW + 4.6], look: [XT - 0.2, 1.05, ZW - 0.4], fov: 46}, lt, {arrive: 0.05, push: 0.04}), bg: SKY};
  },
  charge: (t, lt, C) => {
    // low angle: he points up at the cloud over his own head. Snap zoom, the plate drops.
    const z = sm((t - ev('plate') + 0.05) / 0.17); const c = HEAD_DV(t);
    const m = man(C, t, {face: 'shout', look: c, R: add(c, [0.25, -0.35, -0.15]), rs: 'point'});
    return {node: <>{town(t)}<P o={m.w} />{dv(t)}</>, cam: mv({pos: [STAND + 2.1, 0.95, ZW + 1.3], look: [STAND, 2.12, ZW], fov: 62 - 10 * z}, lt, {arrive: 0.07, push: 0.14, roll: 4, shake: near(t, [ev('plate')], 0.1) ? 0.012 : 0}), bg: SKY};
  },
  phone: (t, lt, C) => {
    // the call: phone to his ear, glaring up at it
    const p = onPhone(C, t, 'angry', HEAD_DV(t));
    return {node: <>{town(t)}{p.node}{dv(t)}</>, cam: mv({pos: [STAND + 1.1, 1.45, ZW + 0.95], look: [STAND, 1.75, ZW], fov: 46}, lt, {arrive: 0.07, push: 0.08}), bg: SKY};
  },
  cloudup: (t, lt, C) => {
    // déjà vu lifts off his head — he is still on the phone
    const p = onPhone(C, t, 'angry', cloudAt(t));
    return {node: <>{town(t)}{p.node}{dv(t)}</>, cam: mv({pos: [STAND + 1.5, 1.25, ZW + 2.1], look: [STAND + 0.55, 1.75, ZW + 0.3], fov: 50}, lt, {arrive: 0.06, push: 0.06}), bg: SKY};
  },
  away: (t, lt, C) => {
    // wide from the far kerb: it drifts out over the road and hangs there, watching him
    const p = onPhone(C, t, 'angry', cloudAt(t));
    return {node: <>{town(t)}{p.node}{dv(t)}</>, cam: mv({pos: [STAND + 1.1, 1.35, ZW + 6.4], look: [STAND + 0.95, 1.3, ZW + 0.3], fov: 42}, lt, {arrive: 0.06, push: 0.05}), bg: SKY};
  },
  glance: (t, lt, C) => {
    // over the cloud's shoulder: a little arm comes out with binoculars, trained down on him
    const p = onPhone(C, t, 'angry', cloudAt(t)); const k = sm((t - ev('binoc')) / 0.25); const c = cloudAt(t);
    return {node: <>{town(t)}{p.node}{dv(t)}{cloudHand(t, 'bino', k)}</>, cam: mv({pos: add(c, [0.55, 0.4, 0.75]), look: [STAND, 0.95, ZW], fov: 46}, lt, {arrive: 0.06, push: 0.06}), bg: SKY};
  },
  zip: (t, lt, C) => {
    // ECU through its eyes: his trousers. The fly is open. A red ring and "ซิป" on the word.
    const p = onPhone(C, t, 'angry', cloudAt(t)); const k = sm((t - ev('zip') + 0.1) / 0.2);
    const fly: V3 = [STAND + 0.12, 0.93, ZW]; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, YAW, 0));
    return {node: <>{town(t)}{p.node}<Note position={add(fly, [0.06, 0.04, 0])} quaternion={q} s={0.17} k={k} word="ซิป" /></>,
      cam: mv({pos: [STAND + 0.95, 1.12, ZW + 0.12], look: fly, fov: 34 - 6 * sm((t - ev('zip') + 0.1) / 0.15)}, lt, {arrive: 0.06, push: 0.16, roll: -3}), bg: SKY};
  },
  cphone: (t, lt, C) => {
    // close on the cloud: the binoculars go, a phone comes out
    const p = onPhone(C, t, 'angry', cloudAt(t)); const k = sm((t - ev('cphone')) / 0.3); const c = cloudAt(t);
    return {node: <>{town(t)}{p.node}{dv(t)}{cloudHand(t, k > 0.5 ? 'phone' : 'bino', k > 0.5 ? (k - 0.5) * 2 : 1 - k * 2)}</>, cam: mv({pos: add(c, [0.35, -0.15, 1.75]), look: add(c, [-0.05, -0.1, 0]), fov: 42}, lt, {arrive: 0.06, push: 0.1}), bg: SKY};
  },
  counter: (t, lt, C) => {
    // the two of them, stacked: him on the phone below, it on the phone above — calling the police on each other
    const p = onPhone(C, t, 'angry', cloudAt(t));
    return {node: <>{town(t)}{p.node}{dv(t)}{cloudHand(t, 'phone', 1)}</>, cam: mv({pos: [STAND + 3.15, 0.95, ZW + 2.5], look: [STAND + 0.7, 1.35, ZW + 0.3], fov: 50}, lt, {arrive: 0.06, push: 0.06, roll0: -2}), bg: SKY};
  },
  charge2: (t, lt, C) => {
    // he looks down, sees it, and clamps both hands over his fly. The second plate drops.
    const cov = sm((t - ev('cover')) / 0.18); const fly: V3 = [STAND + 0.2, 0.93, ZW];
    const m = man(C, t, {face: cov > 0.5 ? 'wide' : 'angry', look: lerp3([FLEE[0], FLEE[1], FLEE[2]], fly, cov), R: lerp3([STAND + 0.2, 0.9, ZW - 0.25], add(fly, [0.02, 0.02, -0.06]), cov), L: lerp3([STAND + 0.2, 0.9, ZW + 0.25], add(fly, [0.02, -0.04, 0.06]), cov)});
    return {node: <>{town(t)}<P o={m.w} />{dv(t)}{cloudHand(t, 'phone', 1)}</>, cam: mv({pos: [STAND + 2.0, 1.2, ZW + 1.35], look: [STAND, 1.15, ZW], fov: 46}, lt, {arrive: 0.07, push: 0.14, roll: -4, shake: near(t, [ev('plate2')], 0.1) ? 0.012 : 0}), bg: SKY};
  },
  arrive: (t, lt, C) => {
    // down the road from the far end: twelve patrol cars brake in from both directions, nose to tail, sirens going; he is tiny in the middle
    const m = man(C, t, {face: 'wide', look: [XT + 6, 1.2, 1]}); const k = sm((t - TP() + 0.2) / 0.5);
    return {node: <>{town(t, {cars: true})}<P o={m.w} />{dv(t)}</>, cam: mv({pos: [XT + 14, 2.4 + 3.6 * k, 0.75], look: [XT + 1 - 1 * k, 1.0 - 0.2 * k, -1.2], fov: 52}, lt, {arrive: 0, push: 0.08, shake: TP() - t > 0 ? 0.025 : near(t, [TP()], 0.2) ? 0.02 : 0}), bg: SKY};
  },
  arrest: (t, lt, C) => ({node: <>{town(t, {cars: true})}{arrested(C, t)}</>,
    // both of them in one frame: the cuffs snap on his wrists below, the jar sweeps over the cloud above
    cam: mv({pos: [STAND + 3.6, 1.0, ZW + 2.9], look: [STAND + 0.95, 1.35, ZW + 0.2], fov: 52}, lt, {arrive: 0.06, push: 0.06, shake: near(t, [ev('cuff'), ev('jar')], 0.12) ? 0.014 : 0}), bg: SKY}),
  court: (t, lt, C) => ({node: courtRoom(C, t, {jar: true}),
    // wide, frontal, symmetric from the back of the room: him cuffed at the dock, the jar on the bench, the judge between
    cam: mv({pos: [-0.3, 1.9, 3.9], look: [-0.05, 1.7, -3.0], fov: 44}, lt, {arrive: 0.07, push: 0.16})}),
  judgedv: (t, lt, C) => { const g = sm((t - ev('dvj')) / 0.6);
    // MCU judge: the jar glows — and a violet double slides out of him, a moment behind
    return {node: courtRoom(C, t, {jar: true, ghost: g, judgeFace: g > 0.3 ? 'half' : 'angry'}), cam: mv({pos: [0.2, 2.35, -0.6], look: [0.1, 2.25, -3.25], fov: 34}, lt, {arrive: 0.07, push: 0.08})}; },
  quote: (t, lt, C) => ({node: courtRoom(C, t, {jar: true, ghost: 1, judgeFace: 'talk', point: true}),
    // "คดีนี้…": finger up
    cam: mv({pos: [0.35, 2.3, -1.0], look: [0, 2.3, -3.25], fov: 30}, lt, {arrive: 0.06, push: 0.1})}),
  ghostgavel: (t, lt, C) => ({node: courtRoom(C, t, {jar: true, ghost: 1, ghostHits: [ev('ggavel')], judgeFace: 'talk', point: true}),
    // "…ศาลเคยตัดสินไปแล้ว": the double bangs its gavel — the case, already decided
    cam: mv({pos: [-0.3, 2.25, -0.9], look: [-0.1, 2.1, -3.25], fov: 34}, lt, {arrive: 0.06, push: 0.08, shake: near(t, [ev('ggavel')], 0.1) ? 0.01 : 0})}),
  gavel: (t, lt, C) => ({node: courtRoom(C, t, {jar: true, ghost: 1, hits: [ev('gavel')]}),
    // "ห้ามฟ้องซ้ำ": both gavels come down
    cam: mv({pos: [0.15, 2.2, 0.2], look: [0, 1.95, -3.2], fov: 36}, lt, {arrive: 0.06, push: 0.08, shake: near(t, [ev('gavel')], 0.12) ? 0.015 : 0})}),
  free: (t, lt, C) => ({node: courtRoom(C, t, {jar: true, ghost: 1 - sm((t - ev('out') - 0.3) / 0.5), judgeFace: 'open'}),
    // the judge lifts the lid himself; déjà vu floats up out of the jar and away — dismissed
    cam: mv({pos: [1.0, 2.15, -1.2], look: [0.45, 2.15, -2.95], fov: 40}, lt, {arrive: 0.06, push: 0.06})}),
  zipcase: (t, lt, C) => { const k = sm((t - sh('zipcase').t0 - 0.35) / 0.2); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
    // "ส่วนคดีซิป": him at the dock, from the bench — the fly still open, the ring again
    return {node: <>{courtRoom(C, t, {man: true})}<Note position={[DOCK.x, 0.97, DOCK.z - 0.2]} quaternion={q.setFromEuler(new THREE.Euler(0, Math.PI, 0))} s={0.24} k={k} word="ซิป" /></>,
      cam: mv({pos: [DOCK.x + 0.2, 1.15, DOCK.z - 1.9], look: [DOCK.x, 1.1, DOCK.z], fov: 36}, lt, {arrive: 0.06, push: 0.08})}; },
  blank: (t, lt, C) => ({node: courtRoom(C, t, {judgeFace: 'open'}),
    // "ท่านไม่คุ้นเลย": the judge, alone on the bench, no double, blank
    cam: mv({pos: [0.05, 2.35, -0.9], look: [0, 2.3, -3.25], fov: 30}, lt, {arrive: 0.06, push: 0.07})}),
  cell: (t, lt, C) => ({node: cellBlock(C, t),
    // cell 24: him on the bench, the plate flips to 10 ปี
    cam: mv({pos: [0.0, 1.6, 4.0], look: [-0.05, 1.5, 0.2], fov: 52}, lt, {arrive: 0.07, push: 0.08, shake: near(t, [ev('ten')], 0.1) ? 0.015 : 0}), bg: CELL_BG}),
  alone: (t, lt, C) => ({node: <>{cellBlock(C, t)}<DejaVu position={cellCloud(t)} t={t} r={0.2} /></>,
    // alone. Outside the bars, déjà vu drifts past, free, and on out of frame.
    cam: mv({pos: [0.1, 1.45, 4.6], look: [-0.15, 1.15, 0.2], fov: 48}, lt, {arrive: 0.06, push: 0.05, roll0: -2}), bg: CELL_BG}),
  since: (t, lt, C) => ({node: courtRoom(C, t, {ghost: 1, hits: HITS, pile: true, man: false, judgeFace: 'half'}),
    // since that day: the judge and his double on the bench, the pile of case files
    cam: mv({pos: [0.1, 2.15, 0.6], look: [0, 1.9, -3.1], fov: 36}, lt, {arrive: 0.06, push: 0.07})}),
  every: (t, lt, C) => { const sp = strikePoint(C);
    // ECU on the pile: every gavel hit stamps a file ยกฟ้อง and it slides off — the next one, and the next
    return {node: courtRoom(C, t, {ghost: 1, hits: HITS, pile: true, man: false, judgeFace: 'half'}), cam: mv({pos: [sp[0] + 0.35, 2.15, sp[2] + 0.75], look: [sp[0], 1.62, sp[2]], fov: 40}, lt, {arrive: 0.06, push: 0.14, roll: 3, shake: near(t, HITS, 0.08) ? 0.008 : 0})}; },
  closing: (t, lt, C) => ({node: courtRoom(C, t, {ghost: 1, hits: HITS, pile: true, man: false, judgeFace: 'half'}),
    // because they all feel familiar: the judge strikes, his double strikes a moment after, files fly — on to the last frame
    cam: mv({pos: [0.25, 2.05, 1.6], look: [0, 1.95, -3.2], fov: 32}, lt, {arrive: 0.06, push: 0.04, shake: near(t, HITS, 0.06) ? 0.006 : 0})}),
};
void [bw, lerp, Phone];
