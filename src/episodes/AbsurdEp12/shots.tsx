import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot, fingers, rootLocal} from '../../pov/acting/ik';
import {gait, pace} from '../../pov/acting/motion';
import {ev, SHOTS, TOTAL, FPS} from './data';
import {Court, Cell} from '../AbsurdEp1/sets';
import {makeGavel, Van} from '../AbsurdEp1/props';
import {CellPlate} from '../AbsurdEp2/props';
import {PrisonOutside} from '../AbsurdEp3/props';
import {Phone3D, Stars} from '../AbsurdEp4/props';
import {PrisonGate} from '../AbsurdEp6/props';
import {Puffs} from '../AbsurdEp7/props';
import {Village} from '../AbsurdEp8/village';
import {SirenLights} from '../absurdkit';
import {tex, F} from '../../pov/lib/tex';
import {ps, walker, body, bw, hideProps, prop, P, CamRig, mv, strike, wobble, near, sm, add3, V3, Cast, ShotOut, Bg} from '../lifekit/stage';
import {VillageLife, VILLAGE_FOLK, CourtLife, OpenAirLife} from '../lifekit/presets';
import {Townsfolk, Extra} from '../lifekit/people';
import {Motorbike, SwayTree, FallingLeaves, CloudsDrift, Hills} from '../lifekit/props';
import {FlipFlop, WheelClamp, TowTruck, towHook, EvidenceCard, RoadSign} from './props';

export {CamRig};
/** EP12 คดีรองเท้าแตะสลับข้าง. The offenders are a pair of flip-flops left on the step the wrong way round. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const SKY: Bg = {color: '#BFD6E4'}, CELL_BG: Bg = {color: '#2A2E33'};
const FP = 0.12;                       // footpath top
const DAY = () => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} /><directionalLight position={[-8, 16, 10]} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} shadow-bias={-0.0004} shadow-normalBias={0.03} /></>;

// =====================================================================================================
// HOME: village lot 10 (x −1.22, side +1, W 8.12): door at x −3.49 on the house front z 9.17; gate centred x −1.52 in the fence z 5.6
// =====================================================================================================
const LOT = 10, DOOR: V3 = [-3.49, 0.06, 8.85], GATE_X = -1.6;
const STEP: V3 = [-3.49, 0.06, 8.55];            // where the flip-flops wait, toes toward the yard
const FALL_AT: V3 = [-4.6, FP, 4.6];              // he hits the footpath here, face toward −x
// where the flung slippers come to rest (the R one he wore on the left foot, the L one on the right)
const LAND = {R: {p: [-5.55, FP, 4.35] as V3, yaw: -2.2}, L: {p: [-4.2, FP, 5.0] as V3, yaw: 0.9}};
// the folk who stop and stare at the scene (they replace the footpath walkers on this side of the road)
const STARE: V3 = [-5, 0.4, 4.6];
const FOLK: Extra[] = [...VILLAGE_FOLK.filter((e) => !['tw1', 'tw4', 'tw5', 'tw7'].includes(e.id)),
  {id: 'tw5', kind: 'stand', at: [-14, 4.6], yaw: Math.PI / 2, y: FP, look: STARE, clip: 'idle_touch_face_01'},
  {id: 'tw7', kind: 'stand', at: [-1.2, 4.3], yaw: -Math.PI / 2, y: FP, look: STARE, clip: 'idle_scratch_head_01'},
  {id: 'tw1', kind: 'stand', at: [-6.0, 1.2], yaw: 0.2, look: STARE, clip: 'take_picture'}];
const street = (t: number, C: Cast, o: {gate?: number; door?: number; folk?: boolean; traffic?: boolean; dog?: boolean} = {}) => <><Village gates={{[LOT]: o.gate ?? 1}} doors={{[LOT]: o.door ?? 0}} />{DAY()}
  <VillageLife t={t} C={o.folk === false ? undefined : C} plan={FOLK} traffic={o.traffic !== false} dog={o.dog === true} /></>;

/** flip-flop that sits under a foot: centred under the foot bone, turned along the foot (drawn in world space) */
const onFoot = (I: any, foot: 'L' | 'R', wear: 'L' | 'R', y0: number) => {
  const F = bw(I, `Bip01_${foot}_Foot`), T = bw(I, `Bip01_${foot}_Toe0`); const dx = T[0] - F[0], dz = T[2] - F[2], d = Math.hypot(dx, dz) || 1;
  const lift = Math.max(0, (rootLocal(I, F).y - I.footY0) * I.scale);
  return <FlipFlop key={foot} side={wear} position={[F[0] + (dx / d) * 0.05, y0 + lift, F[2] + (dz / d) * 0.05]} rotation={[0, Math.atan2(dx, dz), 0]} />;
};
/** red annotation ON the ground around each foot (dashed box) + a label over it that faces the camera: this foot, wrong flip-flop */
const markM = new THREE.MeshBasicMaterial({color: '#E0262B', toneMapped: false});
const labelM = (txt: string) => new THREE.MeshBasicMaterial({toneMapped: false, transparent: true, depthTest: false, map: tex('ep12-lbl-' + txt, 256, 128, (g) => {
  g.clearRect(0, 0, 256, 128); g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); (g as any).roundRect(6, 6, 244, 116, 18); g.fill();
  g.fillStyle = '#E0262B'; g.textAlign = 'center'; g.font = F(700, 44); g.fillText(txt.split('|')[0], 128, 56); g.font = F(700, 34); g.fillText(txt.split('|')[1], 128, 104); })});
const LBL: Record<string, THREE.MeshBasicMaterial> = {};
const SwapMarks: React.FC<{I: any; cam: V3; k: number}> = ({I, cam, k}) => <>{(['L', 'R'] as const).map((sd) => {
  const F = bw(I, `Bip01_${sd}_Foot`), T = bw(I, `Bip01_${sd}_Toe0`); const yaw = Math.atan2(T[0] - F[0], T[2] - F[2]); const c: V3 = [F[0] + (T[0] - F[0]) * 0.5, 0.075, F[2] + (T[2] - F[2]) * 0.5];
  const txt = sd === 'L' ? 'เท้าซ้าย|✕ ใส่ข้างขวา' : 'เท้าขวา|✕ ใส่ข้างซ้าย'; const m = LBL[txt] ?? (LBL[txt] = labelM(txt));
  const dash = (len: number) => Array.from({length: Math.floor(len / 0.045)}, (_, i) => -len / 2 + 0.0225 + i * 0.045);
  const lp: V3 = [c[0], 0.36, c[2] - 0.08]; const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(...cam), new THREE.Vector3(...lp), new THREE.Vector3(0, 1, 0)));
  return <group key={sd}>
    <group position={c} rotation={[0, yaw, 0]} scale={[k, 1, k]}>
      {dash(0.32).map((z, i) => [-1, 1].map((x) => <mesh key={i + ':' + x} position={[x * 0.075, 0, z]} material={markM}><boxGeometry args={[0.012, 0.004, 0.028]} /></mesh>))}
      {dash(0.15).map((x, i) => [-1, 1].map((z) => <mesh key={'h' + i + ':' + z} position={[x, 0, z * 0.16]} material={markM}><boxGeometry args={[0.028, 0.004, 0.012]} /></mesh>))}
    </group>
    {k > 0.5 && <mesh position={lp} quaternion={q} material={m} renderOrder={10}><planeGeometry args={[0.17, 0.085]} /></mesh>}
  </group>; })}</>;
const wornSwapped = (I: any, y0: number) => <>{onFoot(I, 'L', 'R', y0)}{onFoot(I, 'R', 'L', y0)}</>;

/** the man on his way out: door → porch → (shot cut) → yard toward the gate. Barefoot until `slip`. */
const manHome = (C: Cast, t: number, o: {from: [number, number]; to: [number, number]; t0: number; clip?: string; tangle?: number; look?: V3; face?: string}) => {
  const I = C.naiB; hideProps(I); const clip = o.clip ?? 'walk_neutral_01';
  const g = gait([o.from, o.to], t, {t0: o.t0, speed: pace(clip) * (o.tangle ? 0.75 : 1)});
  const s = walker('naiB', g, t, {locoClip: clip, lookW: o.look, face: o.face}); const w = body(I, s, t, 0.06); resetTurn(I);
  const k = o.tangle ?? 0;
  if (k > 0.01) { // the swapped soles turn his feet in: thighs twist and cross, a stumble wobble on top
    rot(I.bones.Bip01_L_Thigh, 0, 1, 0, -0.35 * k, I.root); rot(I.bones.Bip01_R_Thigh, 0, 1, 0, 0.35 * k, I.root);
    rot(I.bones.Bip01_L_Thigh, 0, 0, 1, 0.12 * k, I.root); rot(I.bones.Bip01_R_Thigh, 0, 0, 1, -0.12 * k, I.root);
    rot(I.bones.Bip01_Spine1, 0, 0, 1, Math.sin(t * 9) * 0.08 * k, I.root);
    (['L', 'R'] as const).forEach((sd) => rot(I.bones[`Bip01_${sd}_UpperArm`], 0, 0, 1, (sd === 'L' ? 1 : -1) * (0.5 + Math.sin(t * 11) * 0.15) * k, I.root));
    w.updateMatrixWorld(true); }
  return {I, w, g};
};

/** the fall: stumble 0.25 s, topple (gravity) 0.25 s, impact at ev('fall'), a small bounce, then flat on the footpath, face toward −x */
const fallK = (t: number) => { const u = t - ev('fall') + 0.5; if (u <= 0) return 0; if (u < 0.25) return 0.12 * Math.sin((u / 0.25) * Math.PI * 0.5);
  if (u < 0.5) { const k = (u - 0.25) / 0.25; return 0.12 + (Math.PI / 2 - 0.12) * k * k; } const b = u - 0.5; return Math.PI / 2 - 0.06 * Math.exp(-b * 9) * Math.abs(Math.sin(b * 22)); };
const fallen = (C: Cast, t: number, o: {headUp?: number; face?: string; look?: V3} = {}) => {
  const I = C.naiB; hideProps(I); const rx = fallK(t), u = t - ev('fall');
  const s = ps('naiB', FALL_AT[0] + 0.6, FALL_AT[2], -Math.PI / 2, t, {clip: u < 0 ? 'walk_neutral_01' : 'idle_neutral_01', clipT: u < 0 ? 0.3 : undefined, face: o.face ?? (u < 0.15 ? 'wide' : u < 0.9 ? 'closed' : 'angry'), lookW: o.look});
  const lie = sm(rx / (Math.PI / 2)); const w = body(I, s, t, FP + 0.11 * lie, rx); resetTurn(I);
  const B = I.bones, r = I.root;
  // arms fling forward as he goes, splayed on the ground after
  const fling = u < 0 ? sm((u + 0.35) / 0.2) : 1;
  (['L', 'R'] as const).forEach((sd) => { const m = sd === 'L' ? 1 : -1; rot(B[`Bip01_${sd}_UpperArm`], 1, 0, 0, -1.5 * fling, r); rot(B[`Bip01_${sd}_UpperArm`], 0, 0, 1, m * 0.5 * fling, r); rot(B[`Bip01_${sd}_Forearm`], 1, 0, 0, -0.3 * fling, r); fingers(I, sd, 'open', 1); });
  // one leg kicks up behind on impact (the feet were tied in a knot)
  if (u > -0.2) rot(B.Bip01_R_Calf, 1, 0, 0, -0.9 * sm((u + 0.2) / 0.2) * (1 - 0.5 * sm((u - 0.6) / 0.4)), r);
  if (o.headUp) { rot(B.Bip01_Neck, 1, 0, 0, -0.6 * o.headUp, r); rot(B.Bip01_Head, 1, 0, 0, -0.35 * o.headUp, r); }
  w.updateMatrixWorld(true); return {I, w};
};
/** the flip-flops: on his feet until the impact, then flung, tumbling, to where they land */
const flung = (t: number, I?: any) => { const u = t - ev('fall') + 0.1;
  if (u < 0 && I) return wornSwapped(I, FP);
  return (['R', 'L'] as const).map((side, i) => { const L = LAND[side]; const k = Math.min(1, Math.max(0, u) / 0.45);
    const from: V3 = add3(FALL_AT, [0.55 + i * 0.1, 0.05, i ? 0.2 : -0.2]); const p: V3 = [from[0] + (L.p[0] - from[0]) * k, FP + Math.sin(k * Math.PI) * (0.5 - i * 0.15), from[2] + (L.p[2] - from[2]) * k];
    return <FlipFlop key={side} side={side} position={p} rotation={[k < 1 ? k * 9 : 0, L.yaw - (1 - k) * 4, k < 1 ? k * 5 : 0]} />; });
};
const slippersDown = () => (['R', 'L'] as const).map((sd) => <FlipFlop key={sd} side={sd} position={LAND[sd].p} rotation={[0, LAND[sd].yaw, 0]} />);

// traffic police: trf1 crouches at the clamp, trf2 waves the tow truck in
const CLAMP_AT = LAND.R.p;
const clampK = (t: number) => sm((t - ev('clamp') + 0.22) / 0.22);
const copBike = (t: number) => <><Motorbike position={[-8.4, 0, 2.3]} yaw={Math.PI / 2 + 0.35} t={t} color="#EDEBE4" rider={false} /><SirenLights t={t} position={[-8.3, 1.2, 2.3]} power={2.5} /></>;
const cop1 = (C: Cast, t: number, crouch: boolean) => { const I = C.trf1; hideProps(I);
  if (!crouch) { const g = gait([[-8.0, 2.6], [-6.2, 4.1]], t, {t0: ev('cop') - 0.2, speed: pace('walk_fast_01')});
    return body(I, walker('trf1', g, t, {locoClip: 'walk_fast_01', idle: 'idle_angry_01', lookW: CLAMP_AT, lookT0: ev('cop') + 0.5}), t, FP); }
  return body(I, ps('trf1', CLAMP_AT[0] - 0.55, CLAMP_AT[2] - 0.35, 1.0, t, {clip: 'crouch_idle', lookW: CLAMP_AT, face: 'angry'}), t, FP); };
const cop2 = (C: Cast, t: number, clip = 'idle_angry_01', at: [number, number] = [-3.2, 3.2], yaw = -2.3) => { const I = C.trf2; hideProps(I);
  return body(I, ps('trf2', at[0], at[1], yaw, t, {clip, clipT: clip === 'wave_01' ? t - ev('tow') + 0.2 : undefined, lookW: [-9, 1.2, 1.6]}), t, at[1] > 3.5 ? FP : 0); };
// the tow truck: reverses up the road (+x → backing toward −x), stops at x −4.2, lifts the clamped pair, drives off to +x
const TRUCK_Z = 1.6;
const truckX = (t: number) => { const a = ev('tow'), h = ev('hook'), l = ev('lift'); if (t < h) return -4.2 + 6 * (1 - sm((t - a + 0.3) / (h - a + 0.3)));
  if (t < l + 0.25) return -4.2; const u = t - l - 0.25; return -4.2 + 0.9 * u * u + 1.2 * u; };
const towScene = (C: Cast, t: number) => { const x = truckX(t), lift = sm((t - ev('lift')) / 0.35), pos: V3 = [x, 0, TRUCK_Z], yaw = Math.PI / 2;
  const hk = towHook(pos, yaw, lift); const hooked = t > ev('hook'); const sw = hooked ? Math.sin((t - ev('hook')) * 5) * 0.25 * Math.exp(-(t - ev('hook')) * 0.8) : 0;
  const pair = hooked ? <group position={hk} rotation={[sw, 0, sw * 0.6]}>
    <group position={[0, -0.32, 0]} rotation={[Math.PI / 2 - 0.2, 0, 0.3]}><FlipFlop side="R" position={[0.03, 0, 0]} /><FlipFlop side="L" position={[-0.03, 0.03, 0.04]} rotation={[0, 0.4, 0]} />
      <WheelClamp size={0.32} closed={1} rotation={[0, 0, 0]} position={[0, -0.02, 0]} /></group>
    <mesh position={[0, -0.16, 0]} material={new THREE.MeshLambertMaterial({color: '#2A2D30'})}><cylinderGeometry args={[0.008, 0.008, 0.32, 5]} /></mesh></group>
    : <><>{slippersDown()}</><WheelClamp position={CLAMP_AT} rotation={[0, LAND.R.yaw, 0]} size={0.32} closed={1} /></>;
  return {node: <><TowTruck position={pos} yaw={yaw} t={t} lift={lift} roll={-(x + 4.2) / 0.37} />{pair}</>, x};
};

// =====================================================================================================
// COURT / CELLS / PRISON
// =====================================================================================================
const DOCK: V3 = [0, 1.04, 0.6], CT_S = 3;
const crossedPair = (p: V3, s = CT_S, yaw = Math.PI) => <group position={p} rotation={[0, yaw, 0]} scale={s}>
  <FlipFlop side="R" position={[0.03, 0, 0]} rotation={[0, 0.35, 0]} /><FlipFlop side="L" position={[-0.03, 0.022, 0.0]} rotation={[0.08, -0.35, 0]} /></group>;
const judgeAt = (C: Cast, t: number) => { const I = C.judge; hideProps(I);
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.2, 0.6], face: t > ev('gavel') - 0.3 && t < ev('gavel') + 0.4 ? 'shout' : 'angry'});
  const w = body(I, s, t, 0.5); prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  const lift = strike(t, ev('gavel'), 0.4); rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - lift, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - lift * 0.6, I.root); w.updateMatrixWorld(true); return {I, w}; };
const courtRoom = (C: Cast, t: number) => { const {I, w} = judgeAt(C, t); return {I, node: <><Court t={t} /><P o={w} /><CourtLife t={t} C={C} />
  <group position={[0, wobble(t, [ev('gavel')], 0.02), 0]}>{crossedPair(DOCK)}</group><EvidenceCard position={[0.0, 0.62, 0.86]} w={0.4} /></>}; };
// cells: 21 (x 0) holds the right slipper, 22 (x −3.05) the left one; plates "3 ปี" on both
const CX = -3.05;
const pairCells = (t: number, o: {l?: boolean; r?: boolean; marks?: number} = {}) => <>
  <group><Cell t={t} days={0.45} marks={o.marks ?? 0} /><CellPlate text="ห้อง 21" position={[0, 2.12, 1.54]} w={0.64} /><CellPlate text="3 ปี" position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />
    {o.r !== false && <FlipFlop side="R" position={[-1.25, 0, 0.2]} rotation={[0, -Math.PI / 2, 0]} scale={3} />}</group>
  <group position={[CX, 0, 0]}><Cell t={t} days={0.45} marks={o.marks ?? 0} /><CellPlate text="ห้อง 22" position={[0, 2.12, 1.54]} w={0.64} /><CellPlate text="3 ปี" position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />
    {o.l !== false && <FlipFlop side="L" position={[1.25, 0, 0.2]} rotation={[0, Math.PI / 2, 0]} scale={3} />}</group>
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, -0.002, 3.2]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[-1.5, 1.4, 5.0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh></>;
// a long country road for the out-of-province prison van
const longRoad = (t: number) => <><mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -60]}><planeGeometry args={[400, 400]} /><meshLambertMaterial color="#A9B98A" /></mesh>
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]}><planeGeometry args={[6, 200]} /><meshLambertMaterial color="#4A4C50" /></mesh>
  {Array.from({length: 40}, (_, k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 30 - k * 5]}><planeGeometry args={[0.12, 2.2]} /><meshBasicMaterial color="#E8E3CF" /></mesh>)}
  {Array.from({length: 12}, (_, k) => <SwayTree key={k} position={[(k % 2 ? 1 : -1) * (6 + (k % 3) * 2), 0, 10 - k * 9]} t={t} seed={k + 3} kind={k % 3 ? 'round' : 'tall'} />)}
  <Hills /><CloudsDrift t={t} /><RoadSign position={[4.2, 0, -6]} yaw={-0.25} lines={['เรือนจำจังหวัดห่างไกล', '812 กม.']} /></>;

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  exit: (t, lt, C) => {
    // frame 0: MCU, he steps out of his front door into the morning, barefoot, stretching
    const {w} = manHome(C, t, {from: [-3.49, 9.42], to: [-3.49, 9.15], t0: -0.1, clip: 'walk_slow_01'});
    return {node: <>{street(t, C, {gate: 0, door: sm((t + 0.35) / 0.4)})}<P o={w} /><>{(['L', 'R'] as const).map((sd) => <FlipFlop key={sd} side={sd === 'L' ? 'R' : 'L'} position={add3(STEP, [sd === 'L' ? -0.1 : 0.1, 0, 0.05])} rotation={[0, Math.PI, 0]} />)}</></>,
      cam: mv({pos: [-2.6, 1.55, 7.2], look: [-3.45, 1.45, 8.9], fov: 40}, lt, {arrive: 0.1, push: 0.08, roll0: -2}), bg: SKY};
  },
  gate: (t, lt, C) => {
    // wide from the yard: his house, the porch, the flip-flops waiting on the step; he walks down to them
    const {w} = manHome(C, t, {from: [-3.49, 9.15], to: [-3.49, 8.98], t0: sh('gate').t0 + 0.05, clip: 'walk_slow_01'});
    return {node: <>{street(t, C, {gate: 0, door: 1})}<P o={w} />{(['L', 'R'] as const).map((sd) => <FlipFlop key={sd} side={sd === 'L' ? 'R' : 'L'} position={add3(STEP, [sd === 'L' ? -0.1 : 0.1, 0, 0.05])} rotation={[0, Math.PI, 0]} />)}</>,
      cam: mv({pos: [-3.2, 1.3, 6.2], look: [-3.45, 1.05, 8.7], fov: 50}, lt, {arrive: 0.1, push: 0.06, side: 0.4}), bg: SKY};
  },
  slip: (t, lt, C) => {
    // ECU, low from the side: standing on the step he lifts his left foot and sets it into the flip-flop marked ข, then the right foot into ซ
    const I = C.naiB; hideProps(I); const w = body(I, ps('naiB', STEP[0], STEP[2] + 0.12, Math.PI, t, {clip: 'idle_neutral_01', lookW: [STEP[0], 0, STEP[2] - 0.4], face: 'half'}), t, 0.06); resetTurn(I);
    const t0 = ev('step') - 0.25, lift = (u: number) => u < 0 ? 0 : u < 0.22 ? Math.sin((u / 0.22) * Math.PI * 0.5) : u < 0.42 ? Math.cos(((u - 0.22) / 0.2) * Math.PI * 0.5) : 0;
    const kL = lift(t - t0), kR = lift(t - t0 - 0.5);
    // rest-stance foot spots = where the flip-flops lie (measured before the lift)
    const spot = (sd: 'L' | 'R'): V3 => { const F = bw(I, `Bip01_${sd}_Foot`), T = bw(I, `Bip01_${sd}_Toe0`); return [F[0] + (T[0] - F[0]) * 0.45, 0.06, F[2] + (T[2] - F[2]) * 0.45]; };
    const yawOf = (sd: 'L' | 'R') => { const F = bw(I, `Bip01_${sd}_Foot`), T = bw(I, `Bip01_${sd}_Toe0`); return Math.atan2(T[0] - F[0], T[2] - F[2]); };
    const at = {L: spot('L'), R: spot('R')}, ya = {L: yawOf('L'), R: yawOf('R')};
    ([['L', kL], ['R', kR]] as const).forEach(([sd, k]) => { if (k > 0.001) { rot(I.bones[`Bip01_${sd}_Thigh`], 1, 0, 0, -0.55 * k, I.root); rot(I.bones[`Bip01_${sd}_Calf`], 1, 0, 0, 0.95 * k, I.root); rot(I.bones[`Bip01_${sd}_Foot`], 1, 0, 0, -0.3 * k, I.root); } });
    w.updateMatrixWorld(true);
    const inL = t > t0 + 0.42, inR = t > t0 + 0.92;   // the left foot wears R, the right foot wears L
    return {node: <>{street(t, C, {gate: 0, door: 1, traffic: false})}<P o={w} />
      {inL ? onFoot(I, 'L', 'R', 0.06) : <FlipFlop side="R" position={at.L} rotation={[0, ya.L, 0]} />}
      {inR ? onFoot(I, 'R', 'L', 0.06) : <FlipFlop side="L" position={at.R} rotation={[0, ya.R, 0]} />}</>,
      cam: mv({pos: [STEP[0] - 0.95, 0.5, STEP[2] - 0.5], look: [STEP[0], 0.16, STEP[2] + 0.1], fov: 40}, lt, {arrive: 0.08, push: 0.1, roll0: 3}), bg: SKY};
  },
  swapped: (t, lt, C) => {
    // front 3/4, a little above: both feet in frame; red dashed boxes on the ground round each foot and a label over each: wrong side
    const I = C.naiB; hideProps(I); const w = body(I, ps('naiB', STEP[0], STEP[2] + 0.12, Math.PI, t, {clip: 'idle_neutral_01', lookW: [STEP[0], 0, STEP[2] - 0.4]}), t, 0.06);
    const cam = mv({pos: [STEP[0] + 0.12, 1.05, STEP[2] - 1.0], look: [STEP[0], 0.22, STEP[2] + 0.12], fov: 40}, lt, {arrive: 0.06, push: 0.08, roll0: 2});
    return {node: <>{street(t, C, {gate: 0, door: 1, traffic: false})}<P o={w} />{wornSwapped(I, 0.06)}<SwapMarks I={I} cam={cam.pos} k={sm((lt - 0.3) / 0.15)} /></>, cam, bg: SKY};
  },
  tangle: (t, lt, C) => {
    // low, in front: out through the gate, his feet crossing over each other more with every step
    const {I, w} = manHome(C, t, {from: [GATE_X, 6.6], to: [GATE_X, 4.9], t0: sh('tangle').t0 - 0.3, tangle: sm((t - sh('tangle').t0) / 0.8) * 0.9, face: 'wide'});
    return {node: <>{street(t, C)}<P o={w} />{wornSwapped(I, 0.06)}</>,
      cam: mv({pos: [GATE_X - 0.35, 0.55, 3.0], look: [GATE_X, 0.6, 5.8], fov: 46}, lt, {arrive: 0.08, push: 0.12}), bg: SKY};
  },
  fall: (t, lt, C) => {
    // side-on from the road: he topples like a plank onto the footpath, the flip-flops fly
    const {I, w} = fallen(C, t);
    return {node: <>{street(t, C, {traffic: false})}<P o={w} />{flung(t, I)}<Puffs at={add3(FALL_AT, [-0.9, 0.05, 0])} t={t} t0={ev('fall')} n={8} size={0.18} color="#C9C2B2" />
      {t > ev('fall') && t < ev('fall') + 0.6 && <Stars center={add3(FALL_AT, [-1.3, 0.45, 0])} t={t * 3} r={0.22} size={0.05} />}</>,
      cam: mv({pos: [-4.3, 0.75, 1.0], look: [-4.6, 0.55, 4.6], fov: 46}, lt, {arrive: 0.06, push: 0.06, shake: near(t, [ev('fall')], 0.2) ? 0.02 : 0}), bg: SKY};
  },
  glare: (t, lt, C) => {
    // on the ground with him: he lifts his face off the pavement and glares at the flip-flops
    const {w} = fallen(C, t, {headUp: sm((lt - 0.1) / 0.3), face: 'angry'});
    return {node: <>{street(t, C, {traffic: false})}<P o={w} />{slippersDown()}</>,
      cam: mv({pos: [-7.9, 0.42, 4.25], look: [-5.5, 0.3, 4.6], fov: 40}, lt, {arrive: 0.08, push: 0.14, roll0: -4}), bg: SKY};
  },
  charge: (t, lt, C) => {
    // high and wide over the footpath: the man flat out, the two flip-flops where they landed; the plate drops
    const {w} = fallen(C, t, {headUp: 0.5, face: 'shout'});
    return {node: <>{street(t, C)}<P o={w} />{slippersDown()}</>,
      cam: mv({pos: [-2.0, 3.6, 1.2], look: [-5.0, 0.2, 4.6], fov: 50}, lt, {arrive: 0.08, push: 0.1, roll0: 3, shake: near(t, [ev('plate1')], 0.2) ? 0.01 : 0}), bg: SKY};
  },
  phone: (t, lt, C) => {
    // still face-down: the 3D phone slides up into his view, 191
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [-6.1, 0.38, 4.62], look: [-7.5, 0.5, 4.0], fov: 54}, lt, {push: 0.08, arrive: 0});
    return {node: <>{street(t, C, {traffic: false})}{slippersDown()}<Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: SKY};
  },
  callUI: (t, lt, C) => SHOT_FN.phone(t, lt + 0.7, C),
  cop: (t, lt, C) => {
    // the traffic police pull up on the footpath, blue light turning; one strides in, whistle up
    const {w} = fallen(C, t, {headUp: 0.6, face: 'half', look: [-8, 1.6, 2.5]}); const c1 = cop1(C, t, false), c2 = cop2(C, t, 'idle_angry_01', [-7.6, 2.0], 0.9);
    return {node: <>{street(t, C)}<P o={w} />{slippersDown()}{copBike(t)}<P o={c1} /><P o={c2} /></>,
      cam: mv({pos: [-3.2, 1.0, 5.4], look: [-6.8, 1.15, 3.4], fov: 44}, lt, {arrive: 0.12, push: 0.08, roll0: -3}), bg: SKY};
  },
  clamp: (t, lt, C) => {
    // ECU: a wheel clamp bigger than the flip-flop slams shut over it; a red tag swings
    const c1 = cop1(C, t, true); const k = clampK(t);
    return {node: <>{street(t, C, {traffic: false})}<P o={c1} />{slippersDown()}<WheelClamp position={CLAMP_AT} rotation={[0, LAND.R.yaw, 0]} size={0.32} closed={k} />
      {t > ev('clamp') && t < ev('clamp') + 0.45 && <Stars center={add3(CLAMP_AT, [0, 0.3, 0])} t={t * 3} r={0.18} size={0.04} />}</>,
      cam: mv({pos: add3(CLAMP_AT, [0.9, 0.75, -1.05]), look: add3(CLAMP_AT, [0, 0.12, 0]), fov: 42}, lt, {arrive: 0.08, push: 0.12, roll0: 3, shake: near(t, [ev('clamp')], 0.15) ? 0.012 : 0}), bg: SKY};
  },
  towCall: (t, lt, C) => {
    // the tow truck reverses up the road, amber light flashing; the second officer waves it in
    const {node} = towScene(C, t); const c2 = cop2(C, t, 'wave_01', [-7.0, 0.4], 1.4);
    return {node: <>{street(t, C, {traffic: false})}{node}<P o={c2} />{copBike(t)}</>,
      cam: mv({pos: [-8.6, 1.3, 4.9], look: [-3.6, 1.0, 1.8], fov: 50}, lt, {arrive: 0.1, push: 0.07, roll0: 2}), bg: SKY};
  },
  towed: (t, lt, C) => {
    // hooked, lifted and hauled away down the street, the pair dangling in their clamp; the neighbours watch it go
    const {node, x} = towScene(C, t); const c2 = cop2(C, t, 'idle_neutral_01', [-7.0, 0.4], 1.4);
    return {node: <>{street(t, C, {traffic: false})}{node}<P o={c2} />{copBike(t)}</>,
      cam: mv({pos: [-9.0, 1.7, 4.3], look: [Math.max(-5, x - 2.4), 0.8, 1.6], fov: 52}, lt, {arrive: 0.06, push: 0.04}), bg: SKY};
  },
  court: (t, lt, C) => ({node: courtRoom(C, t).node, cam: mv({pos: [0, 2.2, 3.4], look: [0, 1.5, -2.6], fov: 44}, lt, {push: 0.12, arrive: 0.1})}),
  crossed: (t, lt, C) => ({node: courtRoom(C, t).node, cam: mv({pos: [0.35, 1.75, 1.75], look: [0, 1.12, 0.62], fov: 36}, lt, {push: 0.14, arrive: 0.08, roll0: -3})}),
  gavel: (t, lt, C) => ({node: courtRoom(C, t).node, cam: mv({pos: [0.15, 2.0, -1.45], look: [0.05, 1.7, -3.25], fov: 42}, lt, {push: 0.14, arrive: 0.08, shake: near(t, [ev('gavel')], 0.1) ? 0.02 : 0, roll0: 3})}),
  split: (t, lt, C) => {
    // the cell block: two cells side by side, one flip-flop in each; the guard slams 22 shut
    const I = C.offA; hideProps(I); const w = body(I, ps('offA', CX - 1.6, 2.6, Math.PI * 0.8, t, {clip: 'idle_neutral_01', lookW: [CX, 0.4, 0]}), t);
    return {node: <>{pairCells(t)}<P o={w} /></>, cam: mv({pos: [-1.5, 1.6, 5.2], look: [-1.5, 0.9, 0.3], fov: 50}, lt, {arrive: 0.08, push: 0.08, shake: near(t, [ev('cellShut')], 0.2) ? 0.015 : 0}), bg: CELL_BG};
  },
  apart: (t, lt) => ({node: pairCells(t),
    cam: mv({pos: [-1.52, 3.25, 2.05], look: [-1.52, 0.0, 0.25], fov: 52}, lt, {arrive: 0.08, push: 0.1, roll0: -2}), bg: CELL_BG}),
  years: (t, lt) => ({node: pairCells(t, {marks: Math.min(30, Math.floor(Math.max(0, lt) * 14))}),
    cam: mv({pos: [0.35, 1.7, 2.9], look: [0, 1.75, 1.54], fov: 36}, lt, {arrive: 0.08, push: 0.12, roll0: 3}), bg: CELL_BG}),
  leftOut: (t, lt) => {
    // prison front: the left flip-flop hops out through the gate, early release
    const k = Math.max(0, t - ev('gate')); const hop = Math.abs(Math.sin(k * 6)) * 0.18 * (k > 0 ? 1 : 0);
    return {node: <><PrisonOutside t={t} beam={0.4} /><PrisonGate t={t} />{DAY()}<OpenAirLife t={t} arc={[-2.4, 2.4]} />
      <FlipFlop side="L" position={[0.2, hop, 1.2 + Math.min(k, 1.6) * 0.9]} rotation={[Math.sin(k * 6) * 0.15, 0.2, 0]} scale={3} /></>,
      cam: mv({pos: [0.9, 0.75, 4.6], look: [0.2, 0.5, 2.0], fov: 46}, lt, {push: 0.08, arrive: 0.1, roll0: -2}), bg: SKY};
  },
  early: (t, lt) => ({node: <><PrisonOutside t={t} beam={0.4} /><PrisonGate t={t} />{DAY()}<OpenAirLife t={t} arc={[-2.4, 2.4]} pigeons={[1.4, 0, 3.6]} scareAt={sh('early').t0 + 1.2} />
    <FallingLeaves center={[0.4, 2.5, 3.4]} size={[3, 3, 2]} t={t} n={8} seed={4} /><FlipFlop side="L" position={[0.25, 0, 3.0]} rotation={[0, Math.PI + 0.3 + Math.sin(lt * 1.3) * 0.05, 0]} scale={3} /></>,
    cam: mv({pos: [0.85, 0.42, 4.6], look: [0.2, 0.3, 2.6], fov: 40}, lt, {push: 0.1, arrive: 0.08, roll0: 2}), bg: SKY}),
  rightIn: (t, lt, C) => {
    // still inside: the right one alone in 21; the guard comes for it with a clipboard
    const I = C.offB; hideProps(I); const w = body(I, ps('offB', 0.7, 2.2, Math.PI + 0.3, t, {clip: 'documents_check', lookW: [-1.25, 0.2, 0.2]}), t);
    return {node: <>{pairCells(t, {l: false, marks: 30})}<P o={w} /></>, cam: mv({pos: [-0.9, 1.25, 3.9], look: [-0.9, 0.55, 0.3], fov: 44}, lt, {arrive: 0.08, push: 0.1}), bg: CELL_BG};
  },
  van: (t, lt) => {
    // the prison van drives off down a long country road past the sign: "เรือนจำจังหวัดห่างไกล 812 กม."; the right one at the barred rear window
    const z = 4 - Math.max(0, t - ev('vanGo') + 0.6) * 5.5; const yaw = Math.PI / 2;   // Van (EP1) faces local +x
    return {node: <>{longRoad(t)}{DAY()}<Van t={t} position={[-1.1, 0, z]} yaw={yaw} flashing={false} />
      <FlipFlop side="R" position={[-1.1, 1.35, z + 2.42]} rotation={[-Math.PI / 2 + 0.1, 0, Math.PI]} scale={1.6} /></>,
      cam: mv({pos: [1.6, 1.2, 9.5], look: [-0.6, 1.2, -4], fov: 44}, lt, {push: 0.05, arrive: 0.08}), bg: SKY};
  },
  alone: (t, lt, C) => ({node: <>{street(t, C, {gate: 0})}<FlipFlop side="L" position={add3(STEP, [-0.13, 0, -0.2])} rotation={[0, Math.PI, 0]} /></>,
    cam: mv({pos: [-3.1, 0.35, 7.6], look: [-3.55, 0.1, 8.4], fov: 40}, lt, {push: 0.12, arrive: 0.08, roll0: 2}), bg: SKY}),
  final: (t, lt, C) => {
    // the man walks out of the door again — in shoes — and steps past the lone flip-flop; the last frames hold
    const tEnd = TOTAL / FPS - 0.5; const tt = Math.min(t, tEnd); const L = Math.min(lt, tEnd - sh('final').t0);
    const I = C.nai; hideProps(I); const g = gait([[-3.49, 9.35], [-3.0, 6.9]], tt, {t0: ev('door'), speed: pace('walk_neutral_01')});
    const w = body(I, walker('nai', g, tt, {face: 'half'}), tt, 0.06);
    return {node: <>{street(tt, C, {gate: 0, door: sm((tt - ev('door') + 0.45) / 0.4)})}{tt > ev('door') - 0.1 && <P o={w} />}<FlipFlop side="L" position={add3(STEP, [-0.13, 0, -0.2])} rotation={[0, Math.PI, 0]} /></>,
      cam: mv({pos: [-2.2, 1.05, 5.4], look: [-3.4, 0.75, 8.4], fov: 50}, L, {push: 0.04, arrive: 0.08, roll: 1.5}), bg: SKY};
  },
};
void Townsfolk;
