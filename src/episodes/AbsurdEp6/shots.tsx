import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, fingers, handTo, V} from '../../pov/acting/ik';
import {ev, V3, sm, cl, lerp, lerp3, pop, SHOTS, TOTAL, FPS} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Court, Cell} from '../AbsurdEp1/sets';
import {Handcuffs, makeGavel} from '../AbsurdEp1/props';
import {Fan, Wind} from '../AbsurdEp2/props';
import {Plate, Heli, PrisonOutside} from '../AbsurdEp3/props';
import {Durian, Smell, Phone3D, Stars} from '../AbsurdEp4/props';
import {camMove, SirenLights, Cam, MoveOpts} from '../absurdkit';
import {FB, FootBridge, pathPoint, Road8, Crane, Cable, makeSaw, Sparks, GiantCuff, CourtHouse, WallHole, DeckStub, PrisonGate, Chain, Swarm, Notice, FootSign, PillarSign} from './props';

type Inst = any; type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const shotT0 = (name: string) => SHOTS.find((x: any) => x.name === name)!.t0;

// ---- people (same staging helpers as EP1–5)
type PSo = {clip?: string; moving?: boolean; run?: boolean; talkK?: number; fear?: number; lookW?: V3; face?: string; poseId?: string};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...POSES.stand({t, phase: 0, talking: false, seed: id.length, speed: 0}), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, loco: o.run ? 'run' : undefined, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: o.moving ? t * 1.4 : 0, poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
};
const wraps = new Map<Inst, THREE.Group>();
const body = (I: Inst, s: any, t: number, y = 0, pitch = 0): THREE.Group => {
  let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, y, s.z); w.rotation.set(pitch, s.yaw, 0, 'YXZ'); w.scale.setScalar(I.scale); w.updateMatrixWorld(true);
  if (s.lookW) s.pose.lookL = new THREE.Vector3(...toLocal(I, s, s.lookW) as any);
  drive(I, s, t); w.updateMatrixWorld(true);
  if (s.face) setFace(I, s.face); else autoFace(I, t, {talk: s.talkK, fear: s.fear, seed: s.id.length * 3.1});
  return w;
};
const bw = (I: Inst, bone: string): V3 => { const v = I.bones[bone].getWorldPosition(new THREE.Vector3()); return [v.x, v.y, v.z]; };
const P: React.FC<{o: THREE.Object3D}> = ({o}) => <primitive object={o} />;
const attached = new WeakMap<Inst, Record<string, THREE.Object3D>>();
const prop = (I: Inst, key: string, bone: string, make: () => THREE.Object3D, p: V3, r: V3) => {
  let a = attached.get(I); if (!a) { a = {}; attached.set(I, a); }
  if (!a[key]) { const o = make(); o.position.set(...p); o.rotation.set(...r); I.bones[bone].add(o); a[key] = o; }
  return a[key];
};
const hideProps = (I: Inst) => { const a = attached.get(I); if (a) Object.values(a).forEach((o) => { o.visible = false; }); };

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.05; c.far = 600; c.updateProjectionMatrix();
  return null;
};
const mv = (base: Cam, lt: number, o: MoveOpts = {}) => camMove(base, lt, {arrive: 0.1, push: 0.11, ...o});
const SKY: Bg = {color: '#BFD6E4', fog: ['#C9DCE6', 70, 260]};

// =====================================================================================================
// THE STREET: bridge at the origin (deck along z over the 8 lanes), sidewalk 0.15 high. Stair B comes down
// along +x at z 16.1; its foot (x ≈ 9.8) is where the man stands, facing −x up the stairs.
// =====================================================================================================
const BY = 0.15; const SZ = FB.L / 2 - FB.sw / 2; const FOOT_X = FB.W / 2 + FB.steps * FB.run;
const MAN: V3 = [FOOT_X + 0.75, BY, SZ];
const liftK = (t: number) => sm((t - ev('lift')) / 1.4) * 1.6;
const strobe = (t: number, at: V3) => t >= ev('siren') && t < shotT0('courtExt') ? <SirenLights t={t} position={at} power={14} /> : null;
const CRANES: {p: V3; yaw: number; side: number; z: number}[] = [{p: [-11, 0, -7], yaw: 0, side: -1, z: -7}, {p: [-11, 0, 7], yaw: 0, side: -1, z: 7}, {p: [11, 0, -7], yaw: Math.PI, side: 1, z: -7}, {p: [11, 0, 7], yaw: Math.PI, side: 1, z: 7}];
const street = (t: number, o: {cranes?: boolean; closed?: boolean; heli?: boolean; face?: string; lift?: number; cuff?: number} = {}) => {
  const lift = o.lift ?? 0;
  return <>
    <Road8 t={t} closed={o.closed ? sm((t - ev('cones')) / 1.0) + (t > ev('cones') + 1 ? 1 : 0) : 0} tape={o.closed ? sm((t - ev('cranes')) / 1.4) : 0} />
    <FootBridge position={[0, BY, 0]} lift={lift} faces={['-x', '+x']} face={o.face ?? 'open'} />
    <FootSign position={[MAN[0] + 0.5, BY, SZ - 1.25]} yaw={Math.PI / 2} />
    {o.cranes && CRANES.map((c, i) => { const hook: V3 = [0, BY + FB.H + 0.05 + lift, c.z]; return <Crane key={i} position={c.p} yaw={c.yaw} tip={[c.side * 2.5, 15 + lift * 0.4, c.z]} hook={hook} t={t} />; })}
    {o.heli && <Heli t={t} position={[-6 + Math.sin(t * 0.4) * 3, 19, 10 + Math.cos(t * 0.4) * 3]} yaw={t * 0.4} bank={0.15} light={[0, FB.H, 0]} scale={2.2} />}
    {(o.cuff ?? 0) > 0 && <GiantCuff position={[0, BY + FB.H - FB.T / 2 + lift, 0]} r={1.6} gap={4} k={o.cuff} />}
  </>;
};
const walker = (C: Cast, t: number, o: {face?: string; step?: number; lookW?: V3} = {}) => {
  const I = C.nai; hideProps(I);
  const s = ps('nai', MAN[0] - (o.step ?? 0) * 0.62, MAN[2], -Math.PI / 2, t, {clip: 'idle_neutral_01', face: o.face ?? 'half', lookW: o.lookW});
  return body(I, s, t, BY + (o.step ?? 0) * (FB.H / FB.steps));
};

// =====================================================================================================
// CELL BLOCK (EP3–5 layout): 18 at x −3.05 (empty now: the soap escaped), 19 the fan, 20 the durian
// =====================================================================================================
const CX = {c18: -3.05, c19: 0, c20: 3.05};
const FAN_C: V3 = [0.25, 0, -0.3];
const Block: React.FC<{t: number}> = ({t}) => <group>
  <group position={[CX.c18, 0, 0]}><Cell t={t} days={0.45} marks={0} />
    <Plate lines={['ห้อง 18']} position={[0.05, 2.08, 1.54]} rotation={[0, 0, 0.22 + 0.04 * Math.sin(t * 9) * Math.exp(-((t - ev('thump') + 10) % 0.45) * 6)]} w={0.64} /></group>
  <group><Cell t={t} days={0.45} marks={0} />
    <Fan position={FAN_C} yaw={-0.25} headYaw={Math.sin(t * 1.3) * 0.9} blade={t * 31} blur={1} lit={3} />
    <Plate lines={['ห้อง 19']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['100 ปี']} position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" /></group>
  <group position={[CX.c20, 0, 0]}><Cell t={t} days={0.45} marks={0} />
    <Plate lines={['ห้อง 20']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['ทุเรียน']} position={[0, 1.76, 1.54]} w={0.64} bg="#476F66" />
    <Durian position={[-0.1, 0.17, -0.4]} r={0.15} look={[0, 1, 5]} /></group>
  <Smell from={[CX.c20 - 0.4, 0.6, 0.6]} to={[CX.c20 - 1.2, 1.3, 2.4]} t={t} k={1} n={3} amp={0.08} w={0.016} />
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.4]}><planeGeometry args={[14, 4]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.4, 5.4]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh>
  <mesh position={[0, 4.6, 1.47]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8C9088" /></mesh>
  <pointLight position={[0, 2.6, 3.4]} color="#E8EEF6" intensity={1.6} distance={9} decay={1.4} />
</group>;

// =====================================================================================================
// PRISON FRONT: EP3's wall (z 0) + gate + booth; the bridge (×0.55) stands across the approach, deck along x
// =====================================================================================================
const PB = {pos: [0, 0, 6.5] as V3, s: 0.55, yaw: Math.PI / 2};
const toPrison = (p: V3): V3 => { const x = p[2], z = -p[0]; return [PB.pos[0] + x * PB.s, PB.pos[1] + p[1] * PB.s, PB.pos[2] + z * PB.s]; };
const route = (u: number): V3 => {
  const far: V3 = [-24, 3.5, 11], footA = toPrison(pathPoint(0)), footB = toPrison(pathPoint(1)), gate: V3 = [0, 1.5, 0.8];
  if (u < 0.18) return lerp3(far, footA, u / 0.18);
  if (u < 0.86) return toPrison(pathPoint((u - 0.18) / 0.68));
  return lerp3(footB, gate, (u - 0.86) / 0.14);
};
const prison = (t: number) => <>
  <PrisonOutside t={t} beam={0.4 + Math.sin(t * 0.7) * 0.3} /><PrisonGate t={t} />
  <FootBridge position={PB.pos} yaw={PB.yaw} scale={PB.s} faces={['-x']} sign="นช. สะพานลอย (กักบริเวณหน้าคุก)" />
  <Chain a={toPrison([0, 1.4, FB.L / 2 - 1.2])} b={[6.2, 1.4, 4.2]} n={20} r={0.1} sag={0.25} />
  <Chain a={toPrison([0, 1.4, -FB.L / 2 + 1.2])} b={[-10.5, 0.5, 9.5]} n={22} r={0.1} sag={0.25} />
  <mesh position={[-10.5, 0.3, 9.5]} material={new THREE.MeshLambertMaterial({color: '#6F736D'})}><boxGeometry args={[0.8, 0.6, 0.8]} /></mesh>
  <Handcuffs k={1} position={add3(toPrison([0, 1.4, FB.L / 2 - 1.2]), [0, 0, 0.35])} rotation={[0, 0.3, 0]} size={7} />
</>;

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  foot: (t, lt, C) => {
    // he stands at the foot of the stairs; the camera tilts up the flight with his eyes
    const w = walker(C, t, {lookW: [FB.W / 2, BY + 4.5, SZ]}); const k = sm((lt - 0.5) / 1.4);
    return {node: <>{street(t)}<P o={w} /></>, cam: mv({pos: [MAN[0] + 1.6, 1.65, MAN[2] + 1.15], look: lerp3([MAN[0], 1.55, MAN[2]], [FB.W / 2 + 2, BY + 5.5, SZ], k), fov: 48}, lt, {arrive: 0.12, push: 0.06, roll0: -3, roll: 2}), bg: SKY};
  },
  stairsUp: (t, lt, C) => {
    // from the bottom step: fifty steps up to a scowling deck; crash zoom onto the face at the top
    const w = walker(C, t, {lookW: [FB.W / 2, BY + 5, SZ]});
    const crash = sm((lt - 1.0) / 0.25);
    return {node: <>{street(t)}<P o={w} /></>, cam: mv({pos: [MAN[0] - 0.45, 0.45, SZ - 0.35], look: [FB.W / 2 + 0.6, BY + FB.H - 0.7, SZ - 3.2], fov: lerp(74, 40, crash)}, lt, {push: 0.05, arrive: 0.08, roll0: 6, roll: -4}), bg: SKY};
  },
  knee: (t, lt, C) => {
    // side view: the first step — the knee cracks (stars), the face winces
    const u = t - ev('knee'); const step = sm((t - shotT0('knee') - 0.15) / 0.35);
    const w = walker(C, t, {step, face: u > 0 ? 'closed' : 'half', lookW: [FB.W / 2, BY + 3, SZ]});
    const knee = add3(bw(C.nai, 'Bip01_R_Calf'), [0, 0.02, 0]);
    return {node: <>{street(t)}<P o={w} />{u > 0 && u < 0.9 && <Stars center={knee} t={t * 2} r={0.13} size={0.04} />}</>,
      cam: mv({pos: [MAN[0] - 0.3, 1.25, MAN[2] + 3.6], look: [MAN[0] - 0.4, 0.95, MAN[2]], fov: 50}, lt, {push: 0.14, arrive: 0.1, shake: u > 0 && u < 0.14 ? 0.02 : 0})};
  },
  charge: (t, lt) => {
    // scale: the whole bridge over eight lanes, the man a speck at the foot; the plate drops on the charge word
    const u = t - ev('plate');
    return {node: street(t), cam: mv({pos: [-42, 5.5, -10], look: [0, 4.5, 3], fov: 46}, lt, {push: 0.08, arrive: 0.1, shake: u > 0 && u < 0.3 ? 0.05 : 0}), bg: SKY};
  },
  phone: (t, lt) => {
    const k = sm((lt * 30) / 5); const th = sm((lt - 0.22) / 0.12);
    const c = mv({pos: [MAN[0] - 0.1, 1.72, MAN[2] + 0.1], look: [FB.W / 2 + 1.5, BY + 5.2, SZ - 1.5], fov: 52}, lt, {push: 0.08, arrive: 0});
    return {node: <>{street(t)}<Phone3D cam={c.pos} look={c.look} k={k} pressed={lt > 0.32} thumb={th} /></>, cam: c, bg: SKY};
  },
  callUI: (t, lt) => ({node: street(t), cam: mv({pos: [-20, 3, 10], look: [0, 4, 0], fov: 50}, lt), bg: SKY}),
  cranes: (t, lt) => {
    // four olive army cranes ring the bridge; the camera rises and pulls back over the closed road
    const k = sm((t - ev('cranes')) / 0.5);
    return {node: <>{street(t, {cranes: k > 0, closed: true, heli: true})}{strobe(t, [-8, 3, 12])}</>,
      cam: mv({pos: [-30, 15, 30], look: [0, 4, 0], fov: 50}, lt, {push: -0.08, arrive: 0.12, roll: 3}), bg: SKY};
  },
  heli: (t, lt) => ({node: <>{street(t, {cranes: true, closed: true, heli: true})}{strobe(t, [-8, 3, 12])}</>,
    cam: mv({pos: [-24, 26, -14], look: [0, 2, 2], fov: 54}, lt, {push: 0.1, arrive: 0.1, roll0: 0, roll: 6}), bg: SKY}),
  lanes: (t, lt) => ({node: <>{street(t, {cranes: true, closed: true})}{strobe(t, [-15, 3, 0])}</>,
    cam: mv({pos: [-26, 7, -26], look: [0, 1, 2], fov: 54}, lt, {push: 0.1, arrive: 0.1, side: 0.8}), bg: SKY}),
  saw: (t, lt, C) => {
    // a commando with a giant circular saw cuts the median pillar — sparks, shake
    const I = C.cmd1; hideProps(I); const px = -0.6 - 0.28; const on = t > ev('saw');
    const s = ps('cmd1', px - 0.95, 0.15, Math.PI / 2, t, {clip: 'idle_angry_01', lookW: [px, 1.0, 0]}); const w = body(I, s, t, 0, 0.12); resetTurn(I);
    const j = on ? Math.sin(t * 70) * 1.5 : 0;
    ik(I, 'R', V(-12 + j, 108, 42), V(-0.5, -1, 0), 1); fingers(I, 'R', 'fist', 1); ik(I, 'L', V(14, 112, 40 + j), V(0.5, -1, 0), 1); fingers(I, 'L', 'fist', 1);
    const saw = prop(I, 'saw', 'Bip01_R_Hand', makeSaw, [6, 0, 0], [0, 0, -0.2]); saw.visible = true;
    const disc = saw.getObjectByName('disc'); if (disc) disc.rotation.y = t * 60; w.updateMatrixWorld(true);
    const cut: V3 = [px, 1.0, 0.0];
    return {node: <>{street(t, {cranes: true, closed: true})}<P o={w} /><PillarSign position={[px - 0.005, 1.75, 0]} yaw={-Math.PI / 2} />
      <Sparks at={cut} t={t} on={on} dir={[-0.6, 0.5, 0.8]} n={34} />{on && <pointLight position={add3(cut, [-0.3, 0.2, 0.3])} color="#FFB24A" intensity={3 + Math.sin(t * 50) * 1.5} distance={3} decay={1.5} />}
      {t > ev('sawCut') && <mesh position={[px - 0.001, 1.0, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.56, 0.04]} /><meshBasicMaterial color="#1C1A18" /></mesh>}{strobe(t, [-6, 3, 4])}</>,
      cam: mv({pos: [-3.1, 1.55, 1.9], look: [-1.0, 1.15, 0.1], fov: 46}, lt, {push: 0.12, arrive: 0.1, shake: on ? 0.012 : 0}), bg: SKY};
  },
  cuffs: (t, lt) => {
    // the slings lift the whole bridge off the road; a cuff the size of a truck wheel locks round the deck
    const lift = liftK(t); const k = pop((t - ev('cuff')) / 0.3);
    return {node: <>{street(t, {cranes: true, closed: true, lift, cuff: t > ev('cuff') ? k : 0.001})}{strobe(t, [-6, 3, 8])}</>,
      cam: mv({pos: [-8.5, 4.6 + lift, 6.5], look: [0, BY + FB.H - 0.6 + lift, 0], fov: 44}, lt, {push: 0.2, arrive: 0.1, shake: t > ev('cuff') && t < ev('cuff') + 0.15 ? 0.03 : 0}), bg: SKY};
  },
  courtExt: (t, lt) => ({node: <><CourtHouse t={t} holeY={4.0} holeH={1.7} holeW={2.6} /><FootBridge position={[0, 0, 0]} yaw={Math.PI / 2} scale={0.8} pillars={false} faces={['-x']} />{rubble(t)}</>,
    cam: mv({pos: [-24, 6, 40], look: [0, 4, 0], fov: 55}, lt, {push: 0.09, arrive: 0.12, roll: -3}), bg: SKY}),
  hole: (t, lt) => ({node: <><CourtHouse t={t} holeY={4.0} holeH={1.7} holeW={2.6} /><FootBridge position={[0, 0, 0]} yaw={Math.PI / 2} scale={0.8} pillars={false} faces={['-x']} />{rubble(t)}</>,
    cam: mv({pos: [-12.5, 3.2, 5.5], look: [-7.2, 4.0, 0], fov: 46}, lt, {push: 0.14, arrive: 0.1, roll0: 4}), bg: SKY}),
  courtIn: (t, lt, C) => court(t, lt, C, 'wide'),
  judgeCU: (t, lt, C) => court(t, lt, C, 'judge'),
  girder: (t, lt, C) => court(t, lt, C, 'face'),
  wind: (t, lt, C) => court(t, lt, C, 'wind'),
  gavel: (t, lt, C) => court(t, lt, C, 'gavel'),
  cellPush: (t, lt, C) => {
    // three officers ram a flight of the bridge's stairs at cell 18's bars: it doesn't go in
    const hits = [ev('thump'), ev('thump') + 0.55, ev('thump') + 1.1];
    const ram = hits.reduce((acc, h) => { const u = t - h; return u > -0.35 && u < 0.2 ? (u < 0 ? 1 - sm((u + 0.35) / 0.35) : sm(u / 0.2)) : acc; }, 1);
    const zc = 3.55 + ram * 0.35;
    const offs: [string, number][] = [['offA', -0.55], ['offB', 0.0], ['offC', 0.55]];
    const nodes = offs.map(([id, dx]) => { const I = C[id]; hideProps(I); const s = ps(id, CX.c18 + dx, zc + 1.2, Math.PI, t, {clip: 'idle_angry_01', lookW: [CX.c18, 1.0, 1.5]});
      const w = body(I, s, t, 0, 0.35); resetTurn(I); ik(I, 'R', V(-14, 118, 48), V(-0.5, -1, 0), 1); ik(I, 'L', V(14, 118, 48), V(0.5, -1, 0), 1); fingers(I, 'R', 'cup', 1); fingers(I, 'L', 'cup', 1); w.updateMatrixWorld(true); return <P key={id} o={w} />; });
    const hitNow = hits.some((h) => t > h && t < h + 0.12);
    return {node: <><Block t={t} /><DeckStub position={[CX.c18, 1.25, zc]} yaw={Math.PI} len={2.2} scale={0.5} face={false} stepsAtEnd={14} />{nodes}</>,
      cam: mv({pos: [CX.c18 + 2.6, 1.75, 6.6], look: [CX.c18, 1.05, 3.0], fov: 56}, lt, {push: 0.1, arrive: 0.1, shake: hitNow ? 0.03 : 0}), bg: {color: '#2E3A38'}};
  },
  prisonFront: (t, lt) => ({node: prison(t), cam: mv({pos: [-5, 4.5, 21], look: [0, 3, 5], fov: 52}, lt, {push: 0.08, arrive: 0.12, roll: 2}), bg: SKY}),
  chains: (t, lt) => {
    const u = t - ev('chain');
    return {node: prison(t), cam: mv({pos: [8.6, 2.0, 7.4], look: [6.6, 1.3, 4.9], fov: 44}, lt, {push: 0.16, arrive: 0.1, shake: u > 0 && u < 0.15 ? 0.02 : 0}), bg: SKY};
  },
  swarm: (t, lt) => {
    // a million relatives fly in, climb the stairs step by step, cross the deck and come down to visit
    const dur = ev('notice') - ev('swarm') - 0.1; const head = cl((t - ev('swarm')) / dur * 1.15 - 0.1);
    const hp = route(head);
    return {node: <>{prison(t)}<Swarm path={route} t={t} t0={ev('swarm')} dur={dur * 0.75} n={1600} spread={0.9} size={0.05} /></>,
      cam: mv({pos: [hp[0] * 0.6, 4.2, 22], look: [hp[0] * 0.8, 2.6, 6], fov: 50}, lt, {push: 0.05, arrive: 0.1}), bg: SKY};
  },
  notice: (t, lt) => {
    // pause-bait: the visiting rules pinned to a bridge pillar; the red stamp; the last frames freeze
    const tEnd = TOTAL / FPS - 0.5; const tt = Math.min(t, tEnd); const L = Math.min(lt, tEnd - shotT0('notice'));
    const st = (tt - ev('stamp')) / 0.12;
    return {node: <>
      <mesh position={[0, 1.6, -0.3]}><boxGeometry args={[1.0, 3.2, 0.6]} /><meshLambertMaterial color="#9E988B" /></mesh>
      <Notice position={[0, 1.55, 0.005]} w={0.6} stamp={st} />
      <hemisphereLight args={['#FFF1DA', '#3A3A30', 1.1]} /><directionalLight position={[-2, 4, 3]} intensity={1.2} color="#FFF0D6" /></>,
      cam: mv({pos: [0, 1.56, 1.3], look: [0, 1.55, 0], fov: 46}, L, {push: 0.05, arrive: 0.12, roll: -2, shake: st > 1 && st < 1.8 ? 0.002 : 0}), bg: {color: '#C9DCE6'}};
  },
};
const rubble = (t: number) => { const u = t - ev('rubble'); if (u < 0) return null;
  return <group>{[-1, 1].map((s) => Array.from({length: 8}, (_, i) => { const tt = (u + i * 0.13) % 1.2; const y = 4.6 - 4.9 * tt * tt; return y < 0.2 ? null : <mesh key={s + ':' + i} position={[s * (7.3 + (i % 3) * 0.35), y, -0.8 + (i % 4) * 0.5]} rotation={[tt * 5, i, tt * 3]}><boxGeometry args={[0.28, 0.2, 0.22]} /><meshLambertMaterial color={i % 3 ? '#E2D7BE' : '#B0402E'} /></mesh>; }))}</group>; };

// =====================================================================================================
// COURT INTERIOR: a ×0.6 stub of the deck lies across the courtroom at z −1.9 (through both side walls),
// covering the witness box and half the bench; the judge leans over its railing to ask.
// =====================================================================================================
const DS = 0.6, DZ = -1.9, DY = 1.75; const FACEZ = DZ + FB.W * DS / 2; const RAILY = DY + 1.05 * DS; const RAILZ = DZ + (FB.W / 2 - 0.05) * DS;
const court = (t: number, lt: number, C: Cast, mode: string): ShotOut => {
  const I = C.judge; hideProps(I);
  const lean = mode === 'gavel' ? 0.2 : 0.35;
  const s = ps('judge', 0.1, -3.05, 0, t, {clip: 'idle_neutral_01', lookW: mode === 'judge' ? [0.1, 2.3, 2] : [0, 1.6, 2.5], talkK: (mode === 'judge' || mode === 'wide') && t > ev('ahem') ? 0.8 : 0});
  const w = body(I, s, t, 0.55, lean);
  const nodes: React.ReactNode[] = [<Court key="c" t={t} />, <P key="j" o={w} />,
    <DeckStub key="d" position={[0, DY, DZ]} yaw={Math.PI / 2} len={12} scale={DS} face plate="จำเลย" />,
    <WallHole key="h1" position={[-3.96, DY - 0.2, DZ]} face={1} w={1.9} h={1.1} />, <WallHole key="h2" position={[3.96, DY - 0.2, DZ]} face={-1} w={1.9} h={1.1} />];
  // the court's scales emblem got knocked crooked by the stairs
  if (mode === 'wind') nodes.push(<Wind key="w" path={[[-3.5, 1.5, FACEZ + 0.25], [0, 1.55, FACEZ + 0.2], [3.5, 1.5, FACEZ + 0.25]]} t={t} n={26} speed={2.2} len={0.3} w={0.01} spread={0.35} />);
  if (mode === 'gavel') {
    const u = t - ev('gavel'); const a = u < -0.3 ? -0.9 : u < 0 ? lerp(-0.9, -1.4, sm((u + 0.3) / 0.3)) : u < 0.06 ? lerp(-1.4, 0.05, u / 0.06) : 0.05 - 0.1 * Math.exp(-(u - 0.06) * 12) * Math.sin((u - 0.06) * 40);
    const pivot: V3 = [0.62, RAILY + 0.05, RAILZ - 0.02];
    nodes.push(<group key="g" position={pivot} rotation={[0, Math.PI, a]}><primitive object={GAVEL} scale={0.012} /></group>);
    nodes.push(<Cable key="arm" a={[0.9, RAILY + 0.35, RAILZ - 0.5]} b={add3(pivot, [0.02, 0, 0])} r={0.045} color="#151518" />);
    if (u > 0.06 && u < 0.5) nodes.push(<Stars key="st" center={[0.42, RAILY + 0.08, RAILZ]} t={t * 3} r={0.08} size={0.03} />);
  }
  const cams: Record<string, () => Cam> = {
    wide: () => mv({pos: [0, 1.8, 4.1], look: [0, 1.75, -2.2], fov: 52}, lt, {push: 0.12, arrive: 0.1}),
    judge: () => mv({pos: [0.15, 2.12, -0.35], look: [0.1, 1.98, -3.0], fov: 44}, lt, {push: 0.14, arrive: 0.1}),
    face: () => mv({pos: [0, DY - 0.15, FACEZ + 3.0], look: [0, DY - FB.T * DS / 2, FACEZ], fov: 44}, lt, {push: 0.05, arrive: 0.1}),
    wind: () => mv({pos: [0.3, DY - 0.1, FACEZ + 2.4], look: [0, DY - FB.T * DS / 2, FACEZ], fov: 48}, lt, {push: 0.04, arrive: 0.08}),
    gavel: () => mv({pos: [0.95, RAILY + 0.22, RAILZ + 0.62], look: [0.5, RAILY, RAILZ], fov: 42}, lt, {push: 0.1, arrive: 0.06, shake: t > ev('gavel') && t < ev('gavel') + 0.1 ? 0.01 : 0}),
  };
  return {node: <>{nodes}</>, cam: cams[mode]()};
};
const GAVEL = (() => { const g = makeGavel(); g.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); return g; })();
void rot; void handTo; void Cable;
