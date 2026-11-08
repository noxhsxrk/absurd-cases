import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, fingers, handTo, V} from '../../pov/acting/ik';
import {ev, V3, sm, cl, lerp, lerp3, pop, SHOTS, TOTAL, FPS} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Interro, Court, Cell, TABLE_TOP} from '../AbsurdEp1/sets';
import {Handcuffs, makeGavel} from '../AbsurdEp1/props';
import {Fan, Wind, EchoRing, Bolt} from '../AbsurdEp2/props';
import {Plate} from '../AbsurdEp3/props';
import {Durian, lobePoint, Smell, Phone3D, Stars} from '../AbsurdEp4/props';
import {camMove, SirenLights, Cam, MoveOpts} from '../absurdkit';
import {Bathroom, ShowerWater, Soap, SOAP, makeSoapObj, FoamRing, FoamPile, Bubble, Bubbles, WetSign, TapeRing5, makeShield5, makeTaser, makeBombHelmet, Tongs, Tray, Report, Clipboard, ExitSign, DOOR} from './props';
import {SWAT} from './cast';

type Inst = any; type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const shotT0 = (name: string) => SHOTS.find((x: any) => x.name === name)!.t0;

// ---- people (same staging helpers as EP1–4)
type PSo = {clip?: string; moving?: boolean; run?: boolean; talkK?: number; fear?: number; lookW?: V3; face?: string; poseId?: string};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...POSES.stand({t, phase: 0, talking: false, seed: id.length, speed: 0}), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, loco: o.run ? 'run' : undefined, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: o.moving ? t * 3.2 : 0, poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
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
/** every prop is shown only by the shot that wants it (props persist on the bones across shots) */
const hideProps = (I: Inst) => { const a = attached.get(I); if (a) Object.values(a).forEach((o) => { o.visible = false; }); };
const objWorld = (o: THREE.Object3D, p: V3): V3 => { o.updateMatrixWorld(true); const v = o.localToWorld(new THREE.Vector3(...p)); return [v.x, v.y, v.z]; };

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.01; c.far = 400; c.updateProjectionMatrix();
  return null;
};
/** every shot: base framing + arrival + push-in (ref8) */
const mv = (base: Cam, lt: number, o: MoveOpts = {}) => camMove(base, lt, {arrive: 0.1, push: 0.11, ...o});

// =====================================================================================================
// BATHROOM. The man showers in the back-left corner facing +z. The soap's trap spot is just in front of his feet.
// =====================================================================================================
const MAN: V3 = [-0.5, 0, -1.08];
const TRAP: V3 = [-0.45, SOAP.h / 2, -0.66];
const LAND: V3 = [-0.47, SOAP.h / 2, -0.86];
const scrubPhase = (t: number) => Math.sin(Math.min(t, ev('slip')) * 11);
/** the man under the shower: right forearm held out, the left hand scrubs it with the soap (hidden once it slips) */
const man = (C: Cast, t: number, o: {face?: string; scrub?: boolean; yaw?: number; lookW?: V3} = {}) => {
  const I = C.naiBath; hideProps(I);
  const s = ps('naiBath', MAN[0], MAN[2], o.yaw ?? 0, t, {clip: 'idle_neutral_01', face: o.face ?? 'half', lookW: o.lookW}); const w = body(I, s, t);
  if (o.scrub !== false) {
    resetTurn(I); const k = 1, ph = scrubPhase(t), held = t < ev('slip');
    ik(I, 'R', V(-6, 112, 30), V(-0.6, -1, 0), k); handTo(I, 'R', V(0.6, 0, 1), V(0, 1, 0), k); fingers(I, 'R', 'relaxed', 1);
    const shock = held ? 0 : sm((t - ev('slip')) / 0.15);   // the empty left hand jerks after the soap
    ik(I, 'L', V(-2 + ph * 7 - shock * 6, 118 + shock * 6, 36 + shock * 10), V(0.6, -1, 0), k); fingers(I, 'L', held ? 'cup' : 'claw', 1);
    const so = prop(I, 'soap', 'Bip01_L_Hand', makeSoapObj, [8, -3, 0], [Math.PI / 2, 0, 0.2]); so.visible = held;
    w.updateMatrixWorld(true);
  }
  return w;
};
/** where the slipped soap is: a ballistic squirt from the hand to the floor, then a slide that stops right at his feet */
const LANDT = () => ev('slip') + 0.34;
const soapAt = (t: number, from: V3): {p: V3; spin: number} => {
  const s0 = ev('slip'), l = LANDT(), e = ev('trap');
  if (t <= s0) return {p: from, spin: 0};
  if (t < l) { const u = (t - s0) / (l - s0); const p = lerp3(from, LAND, u); p[1] = lerp(from[1], LAND[1], u * u) + Math.sin(u * Math.PI) * 0.12; return {p, spin: u * 9}; }
  const u = cl((t - l) / (e - l)); const k = 1 - Math.pow(1 - u, 3);
  return {p: lerp3(LAND, TRAP, k), spin: 9 + k * 2.4};
};
const REL0: V3 = [-0.47, 1.18, -0.74];
let REL: V3 = REL0;
const foamK = (t: number) => sm((t - LANDT()) / 0.5);
const bath = (t: number, o: {burst?: boolean; hideS?: boolean; hideW?: boolean; ceiling?: boolean; water?: boolean} = {}) => {
  const fall = o.burst ? cl((t - ev('kick')) / 0.3) + Math.max(0, t - ev('kick') - 0.3) : 0;
  const shakeK = o.burst && t > ev('bang') && t < ev('kick') ? 1 : 0;
  return <><Bathroom t={t} doorFall={fall} doorShake={shakeK} hideS={o.hideS} hideW={o.hideW} ceiling={o.ceiling} />
    {o.water !== false && t < ev('kick') + 0.2 && <ShowerWater t={t} />}</>;
};
const floorSoap = (t: number, look: V3, extra: React.ReactNode = null) => <>
  <Soap position={TRAP} look={[look[0], TRAP[1], look[2]]} />
  <FoamRing center={[TRAP[0], 0, TRAP[2]]} k={foamK(t)} t={t} />{extra}</>;
const strobe = (t: number) => t >= ev('siren') && t < shotT0('interro') ? <SirenLights t={t} position={[DOOR[0] + 0.6, 1.9, DOOR[2]]} power={7} /> : null;

// ---- the raid: entry spots, the five who slip, the ring of ten
const ENTER = (i: number): V3 => { const c = i % 4, r = Math.floor(i / 4); return [1.3 - r * 0.42, 0, -0.55 + c * 0.45 + (r % 2) * 0.12]; };
const FIVE = SWAT.slice(0, 5), TEN = SWAT.slice(5);
const slipT = (i: number) => ev('slip0') + i * 0.16;
/** one of the first five: runs at the soap along −x, steps on it, legs fly up, lands flat on his back */
const faller = (C: Cast, id: string, i: number, t: number) => {
  const I = C[id]; hideProps(I); const zs = TRAP[2] + (i - 2) * 0.17, ts = slipT(i), speed = 3.1;
  if (t < ts) { const x = TRAP[0] + (ts - t) * speed + 0.05; const s = ps(id, x, zs, -Math.PI / 2, t, {moving: true, run: true}); return {w: body(I, s, t), down: 0}; }
  const u = t - ts, fu = cl(u / 0.42);
  const pitch = -(fu < 0.7 ? (Math.PI / 2 + 0.55) * (fu / 0.7) : Math.PI / 2 + 0.55 * (1 - (fu - 0.7) / 0.3)) + (fu >= 1 ? 0.04 * Math.sin(u * 30) * Math.exp(-(u - 0.42) * 8) : 0);
  const y = Math.sin(Math.min(1, fu) * Math.PI) * 0.45 + (fu >= 1 ? 0.13 : 0.13 * fu);
  const x = TRAP[0] - 0.18 - Math.min(u, 0.3) * 1.4;
  const s = ps(id, x, zs, -Math.PI / 2, t, {clip: 'idle_nervous_01', face: fu >= 1 ? 'closed' : 'wide'}); const w = body(I, s, t, y, pitch);
  if (fu < 1) { rot(I.bones.Bip01_L_UpperArm, 0, 0, 1, -1.2 * Math.sin(fu * 3), I.root); rot(I.bones.Bip01_R_UpperArm, 0, 0, 1, 1.2 * Math.sin(fu * 3), I.root); w.updateMatrixWorld(true); }
  return {w, down: fu};
};
const fallenNodes = (C: Cast, t: number) => FIVE.map((id, i) => { const f = faller(C, id, i, Math.max(t, slipT(4) + 0.7)); return <P key={id} o={f.w} />; });
const ringPos = (i: number) => { const a = Math.PI * 0.42 + (i / (TEN.length - 1)) * Math.PI * 1.16, r = 1.0; const p: V3 = [TRAP[0] - Math.cos(a) * r, 0, TRAP[2] + Math.sin(a) * r]; return {p, yaw: Math.atan2(TRAP[0] - p[0], TRAP[2] - p[2])}; };
/** a commando on his knees, leaning in, taser aimed at the soap */
const crawler = (C: Cast, id: string, i: number, t: number) => {
  const I = C[id]; hideProps(I); const {p, yaw} = ringPos(i);
  const creep = Math.sin(t * 2.2 + i) * 0.015;
  const s = ps(id, p[0] + Math.sin(yaw) * creep, p[2] + Math.cos(yaw) * creep, yaw, t, {clip: 'crouch_idle', poseId: 'crouch', lookW: [TRAP[0], 0.05, TRAP[2]]});
  const w = body(I, s, t, 0, 0.32); resetTurn(I);
  ik(I, 'R', V(-6, 62, 52), V(-0.5, -1, 0), 1); handTo(I, 'R', V(0, -0.35, 1), V(-1, 0, 0), 1); fingers(I, 'R', 'fist', 1);
  const tz = prop(I, 'taser', 'Bip01_R_Hand', makeTaser, [6, 0, -2], [0, 0, 0]); tz.visible = true; w.updateMatrixWorld(true);
  return {w, nose: objWorld(tz, [17.5, 0, 0])};
};

// =====================================================================================================
// CELLS (EP3/EP4 layout): 18 at x −3.05 (now the soap), 19 at 0 (the fan), 20 at +3.05 (the durian)
// =====================================================================================================
const CX = {c18: -3.05, c19: 0, c20: 3.05};
const FAN_C: V3 = [0.25, 0, -0.3]; const FAN_C_YAW = -0.25;
const fanYaw = (t: number) => { const T = ev('fanTurn'), F = ev('foam'); return t < T ? 0.85 + Math.sin(t * 1.3) * 0.1 : t < F + 0.2 ? lerp(0.85 + Math.sin(T * 1.3) * 0.1, -0.9, sm((t - T) / (F + 0.2 - T))) : -0.9 + Math.sin(t * 1.4) * 0.12; };
const CELL_BG: Bg = {color: '#2E3A38'};
const cellLight = <pointLight position={[0, 2.6, 3.4]} color="#E8EEF6" intensity={1.6} distance={9} decay={1.4} />;
const SOAP18: V3 = [CX.c18 + 0.12, SOAP.h / 2, 0.1];
const foamLevel = (t: number) => sm((t - ev('foam')) / 1.6);
const Corridor: React.FC<{t: number}> = ({t}) => <group>
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.4]}><planeGeometry args={[14, 4]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.4, 5.4]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh>
  <mesh position={[0, 4.6, 1.47]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8C9088" /></mesh>
  <Plate lines={['แดนขัง']} position={[0, 3.3, 1.5]} w={1.5} aspect={3.4} />
  <ExitSign position={[5.6, 2.35, 5.38]} rotation={[0, Math.PI, 0]} />
</group>;
/** cell 18's name plate: "ยุง" peels off and falls, "สบู่" slaps on */
const NamePlate18: React.FC<{t: number}> = ({t}) => {
  const pk = cl((t - ev('peel')) / 0.45), st = pop((t - ev('stick')) / 0.25);
  const fall = pk * pk;
  return <group position={[0, 1.76, 1.54]}>
    {pk < 1 && <group position={[0.1 * pk, -fall * 1.6, 0.05 * pk]} rotation={[0.4 * pk, 0, -1.2 * pk]}><Plate lines={['ยุง']} position={[0, 0, 0]} w={0.64} bg="#476F66" /></group>}
    {st > 0 && <group scale={[st, st, 1]}><Plate lines={['สบู่']} position={[0, 0, 0.01]} w={0.64} bg="#C9667E" /></group>}
    {st > 0.9 && <Plate lines={['(ยุงย้ายออกแล้ว)']} position={[0, -0.27, 0.01]} w={0.64} aspect={5.5} bg="#E6E7CF" fg="#152028" />}
  </group>;
};
const Block: React.FC<{t: number; soap?: boolean}> = ({t, soap = true}) => <group>
  <group position={[CX.c18, 0, 0]}>
    <Cell t={t} days={0.45} marks={0} />
    <Plate lines={['ห้อง 18']} position={[0, 2.12, 1.54]} w={0.64} />
    <NamePlate18 t={t} />
  </group>
  {soap && t < ev('glide') && <Soap position={SOAP18} look={[CX.c18 + 0.4, SOAP.h / 2, 3]} />}
  <group>
    <Cell t={t} days={0.45} marks={0} />
    <Fan position={FAN_C} yaw={FAN_C_YAW} headYaw={fanYaw(t)} blade={t * 31} blur={1} lit={3} />
    {[0.42, 0.2, 0.62].map((y, i) => <Handcuffs key={i} k={1} position={[FAN_C[0] + 0.024 * 1.6 * 1.45, y, FAN_C[2]]} rotation={[Math.PI / 2, 0, [0.3, -0.25, 0.1][i]]} size={1.6} />)}
    <Plate lines={['นช. พัดลม 019']} position={[FAN_C[0] - 0.01, 0.72, FAN_C[2] + 0.03]} rotation={[0, FAN_C_YAW, 0]} w={0.17} aspect={2.8} bg="#E6E7CF" fg="#152028" />
    <Plate lines={['ห้อง 19']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['50 ปี']} position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />
  </group>
  <group position={[CX.c20, 0, 0]}>
    <Cell t={t} days={0.45} marks={0} />
    <Plate lines={['ห้อง 20']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['ทุเรียน']} position={[0, 1.76, 1.54]} w={0.64} bg="#476F66" />
    <Durian position={[-0.1, 0.17, -0.4]} r={0.15} look={[0, 1, 5]} />
    {[0, 1, 2].map((i) => { const lp = lobePoint(i); return <Handcuffs key={i} k={1} position={[-0.1 + lp[0] * 0.15, 0.17 + lp[1] * 0.15, -0.4 + lp[2] * 0.15]} rotation={[0, i, 0.4]} size={0.9} />; })}
  </group>
  <Corridor t={t} />
</group>;
/** the soap's escape path: across the wet floor of 18, through the bars (z 1.5), then down the corridor (+x) */
const escape = (t: number): {p: V3; yaw: number} => {
  const g = ev('glide'), th = ev('through'), c = ev('chase');
  const BAR: V3 = [CX.c18 + 0.12, SOAP.h / 2, 1.5], OUT: V3 = [CX.c18 + 0.12, SOAP.h / 2, 2.6];
  if (t < g) return {p: SOAP18, yaw: 0.3};
  if (t < th) { const u = sm((t - g) / (th - g)); return {p: lerp3(SOAP18, BAR, u), yaw: lerp(0.3, 0, u)}; }
  if (t < c) { const u = cl((t - th) / (c - th)); return {p: lerp3(BAR, OUT, 1 - Math.pow(1 - u, 2)), yaw: 0}; }
  const u = t - c; return {p: [OUT[0] + u * 4.6 + u * u * 1.2, SOAP.h / 2, OUT[2] + Math.sin(u * 6) * 0.05], yaw: Math.PI / 2};
};

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  shower: (t, lt, C) => {
    // frame 0 mid-action: water running, the soap already going round his forearm
    const w = man(C, t, {lookW: [MAN[0], 1.15, MAN[2] + 0.5]});
    return {node: <>{bath(t)}<P o={w} /></>, cam: mv({pos: [MAN[0] + 0.32, 1.48, MAN[2] + 1.25], look: [MAN[0] + 0.02, 1.36, MAN[2]], fov: 44}, lt, {arrive: 0.14, side: 0.6, push: 0.12, roll0: -3, roll: 2})};
  },
  slip: (t, lt, C) => {
    const w = man(C, t, {lookW: [MAN[0], 1.15, MAN[2] + 0.5], face: t > ev('slip') + 0.1 ? 'wide' : 'half'});
    const so = attached.get(C.naiBath)?.soap; if (so && t <= ev('slip')) REL = objWorld(so, [0, 0, 0]);
    const s = soapAt(t, REL); const free = t > ev('slip');
    // camera: on the hands, then a fast pan down after the soap
    const k = sm((t - ev('slip') - 0.05) / 0.35); const look = lerp3([MAN[0] + 0.02, 1.15, MAN[2] + 0.2], [s.p[0], Math.max(0.15, s.p[1]), s.p[2]], k);
    return {node: <>{bath(t)}<P o={w} />{free && <Soap position={s.p} yaw={s.spin} roll={t < LANDT() ? s.spin * 0.6 : 0} />}<FoamRing center={[LAND[0], 0, LAND[2]]} k={foamK(t) * 0.6} t={t} r={0.05} n={8} /></>,
      cam: mv({pos: [MAN[0] + 0.42, lerp(1.32, 0.75, k), MAN[2] + 0.85], look, fov: 42}, lt, {push: 0.1, arrive: 0.08, shake: free && t < ev('slip') + 0.1 ? 0.006 : 0})};
  },
  trap: (t, lt, C) => {
    const w = man(C, t, {face: 'half', lookW: [TRAP[0], 0, TRAP[2]]}); const s = soapAt(t, REL0);
    return {node: <>{bath(t)}<P o={w} /><Soap position={s.p} yaw={s.spin} /><FoamRing center={[s.p[0], 0, s.p[2]]} k={foamK(t)} t={t} /></>,
      cam: mv({pos: [TRAP[0] + 0.3, 0.1, TRAP[2] + 0.46], look: [TRAP[0] - 0.04, 0.12, TRAP[2] - 0.3], fov: 44}, lt, {push: 0.16, arrive: 0.1, side: -0.5})};
  },
  charge: (t, lt, C) => {
    // scale: from the tiles the soap towers in the foreground, the man small above it
    const w = man(C, t, {face: 'wide', lookW: [TRAP[0], 0, TRAP[2]]}); const u = t - ev('plate');
    return {node: <>{bath(t)}<P o={w} />{floorSoap(t, [TRAP[0] + 0.12, 0, TRAP[2] + 1])}</>,
      cam: mv({pos: [TRAP[0] + 0.06, 0.05, TRAP[2] + 0.5], look: [MAN[0] + 0.02, 0.45, MAN[2]], fov: 62}, lt, {push: 0.1, arrive: 0.12, roll0: 4, roll: -3, shake: u > 0 && u < 0.18 ? 0.006 : 0})};
  },
  phone: (t, lt) => {
    // his POV down at the soap; the 3D phone slides up from the bottom edge (5 frames), the thumb presses call
    const k = sm((lt * 30) / 5); const th = sm((lt - 0.22) / 0.12); const pressed = lt > 0.32;
    const c = mv({pos: [MAN[0] + 0.05, 1.58, MAN[2] + 0.18], look: [TRAP[0], 0.05, TRAP[2] + 0.1], fov: 50}, lt, {push: 0.08, arrive: 0});
    return {node: <>{bath(t)}{floorSoap(t, [MAN[0], 0, MAN[2]])}<Phone3D cam={c.pos} look={c.look} k={k} pressed={pressed} thumb={th} /></>, cam: c};
  },
  callUI: (t, lt) => ({node: bath(t), cam: mv({pos: [0, 1.5, 1.2], look: [0, 1.2, -1], fov: 50}, lt)}),   // covered by the full-screen call
  doorBurst: (t, lt, C) => {
    // bangs shake the door, it falls flat inward on the kick, fifteen SWAT pour into a tiny bathroom
    const u = t - ev('kick');
    const nodes = SWAT.map((id, i) => {
      const I = C[id]; hideProps(I); const enter = cl((u - 0.08 - i * 0.075) / 0.5); if (enter <= 0) return null;
      const to = ENTER(i); const from: V3 = [DOOR[0] + 0.9, 0, DOOR[2]];
      const p = lerp3(from, to, 1 - Math.pow(1 - enter, 2));
      const s = ps(id, p[0], p[2], -Math.PI / 2 + (enter >= 1 ? (hash(i) - 0.5) * 0.6 : 0), t, {moving: enter < 1, run: enter < 1, clip: 'idle_angry_01', lookW: [TRAP[0], 0.3, TRAP[2]]});
      const w = body(I, s, t);
      if (i === 0) { const sh = prop(I, 'shield', 'Bip01_L_Forearm', makeShield5, [14, 0, 10], [0, Math.PI / 2, Math.PI / 2]); sh.visible = true; w.updateMatrixWorld(true); }
      return <P key={id} o={w} />;
    });
    const wm = man(C, t, {face: u > 0 ? 'wide' : 'half', scrub: false, yaw: 0.9, lookW: [DOOR[0], 1.2, DOOR[2]]});
    const puff = cl((u - 0.25) / 0.45);
    return {node: <>{bath(t, {burst: true, hideW: true})}<P o={wm} />{floorSoap(t, [0, 0, 1])}{nodes}{strobe(t)}
      {puff > 0 && puff < 1 && <FoamPile center={[DOOR[0] - 1.05, 0, DOOR[2]]} size={[0.8, 0.25, 0.9]} k={1 - puff * 0.6} t={t} n={14} puff={0.08 * (0.5 + puff)} />}</>,
      cam: mv({pos: [-1.55, 1.5, -0.35], look: [1.7, 1.05, 0.45], fov: 60}, lt, {arrive: 0.12, side: -0.8, push: 0.1, shake: u > 0 && u < 0.22 ? 0.03 : (t > ev('bang') && u < 0 ? 0.006 : 0), roll0: 4, roll: -3})};
  },
  domino: (t, lt, C) => {
    // side view: the first five run at the soap one after another, step on it, legs up, down like dominoes
    const f = FIVE.map((id, i) => faller(C, id, i, t));
    const cur = Math.min(4, Math.max(0, Math.floor((t - ev('slip0')) / 0.16)));
    const behind = SWAT.slice(5, 9).map((id, i) => { const I = C[id]; hideProps(I); const s = ps(id, 1.35 + (i % 2) * 0.35, -0.5 + i * 0.32, -Math.PI / 2, t, {clip: 'idle_angry_01', lookW: [TRAP[0], 0.3, TRAP[2]]}); return <P key={id} o={body(I, s, t)} />; });
    const lookX = lerp(TRAP[0] + 0.7, TRAP[0] - 0.05, sm((t - ev('slip0') + 0.3) / 1.0));
    return {node: <>{bath(t, {burst: true, hideS: true})}{floorSoap(t, [0, 0, 2])}{f.map((x, i) => <P key={FIVE[i]} o={x.w} />)}{behind}{strobe(t)}
      <WetSign position={[0.55, 0.03, -0.15]} rotation={[0, 0.6, Math.PI / 2 * sm((t - slipT(1)) / 0.3)]} /></>,
      cam: mv({pos: [lookX + 0.25, 0.7, 1.55], look: [lookX, 0.55, TRAP[2]], fov: 62}, lt, {push: 0.06, arrive: 0.1, side: 0.6, shake: f.some((x) => x.down > 0.95 && x.down < 1) ? 0.01 : 0, roll: cur * 0.6})};
  },
  pileup: (t, lt, C) => {
    // low on the tiles: five heads down, stars circling, the soap sitting there untouched
    const f = FIVE.map((id, i) => faller(C, id, i, t));
    const stars = FIVE.map((id, i) => f[i].down >= 1 ? <Stars key={id} center={add3(bw(C[id], 'Bip01_Head'), [0, 0.14, 0])} t={t + i * 0.7} r={0.14} size={0.035} /> : null);
    return {node: <>{bath(t, {burst: true, hideS: true})}{floorSoap(t, [0.5, 0, 0.5])}{f.map((x, i) => <P key={FIVE[i]} o={x.w} />)}{stars}{strobe(t)}<WetSign position={[0.55, 0.03, -0.15]} rotation={[0, 0.6, Math.PI / 2]} /></>,
      cam: mv({pos: [TRAP[0] + 0.55, 1.7, TRAP[2] + 1.45], look: [TRAP[0] + 0.55, 0.1, TRAP[2]], fov: 56}, lt, {push: 0.12, arrive: 0.1, side: -0.6, roll0: -5, roll: 3})};
  },
  crawl: (t, lt, C) => {
    // top-down: five out cold, ten on their knees in a ring round a soap bar, tasers in
    const ring = TEN.map((id, i) => <P key={id} o={crawler(C, id, i, t).w} />);
    return {node: <>{bath(t, {burst: true, hideS: true, ceiling: false})}{floorSoap(t, [0, 0, 2])}{fallenNodes(C, t)}{ring}{strobe(t)}
      <TapeRing5 center={[0.95, 0, -1.5]} r={0.42} y={0.9} k={sm((t - shotT0('crawl')) / 0.9)} /></>,
      cam: mv({pos: [TRAP[0] + 0.1, 3.4, TRAP[2] + 0.35], look: [TRAP[0] + 0.1, 0, TRAP[2]], fov: 62}, lt, {push: 0.08, arrive: 0.1, roll0: 0, roll: 8})};
  },
  taser: (t, lt, C) => {
    // close on the soap: taser noses poke in from the ring, arcs crackle into the foam
    const near = [1, 3, 5, 7].map((i) => ({id: TEN[i], i}));
    const cr = near.map(({id, i}) => crawler(C, id, i, t));
    const on = t > ev('taser');
    const bolts = on ? cr.map((c, j) => (Math.floor(t * 15) + j) % 3 !== 0 ? <Bolt key={j} a={c.nose} b={add3(TRAP, [(hash(j) - 0.5) * 0.08, 0.02, (hash(j * 3) - 0.5) * 0.08])} t={t} seed={j + 1} n={5} amp={0.02} w={0.004} /> : null) : null;
    return {node: <>{bath(t, {burst: true, hideS: true})}{floorSoap(t, [TRAP[0] + 0.3, 0, TRAP[2] + 0.4])}{cr.map((c, j) => <P key={near[j].id} o={c.w} />)}{bolts}{strobe(t)}
      {on && <pointLight position={add3(TRAP, [0, 0.12, 0])} color="#BFD8FF" intensity={(Math.floor(t * 15) % 2) ? 3 : 1} distance={1.5} decay={1.5} />}</>,
      cam: mv({pos: [TRAP[0] + 0.32, 0.26, TRAP[2] + 0.42], look: [TRAP[0] - 0.02, 0.1, TRAP[2] - 0.02], fov: 46}, lt, {push: 0.16, arrive: 0.1, side: 0.5, shake: on ? 0.0025 : 0})};
  },
  tongs: (t, lt, C) => {
    // the bomb-squad officer kneels in, long steel tongs close on the soap and lift it — hands trembling
    const I = C.bomb; hideProps(I); const bp: V3 = [TRAP[0] + 0.78, 0, TRAP[2] + 0.12];
    const s = ps('bomb', bp[0], bp[2], -Math.PI / 2, t, {clip: 'crouch_idle', poseId: 'crouch', lookW: [TRAP[0], 0.1, TRAP[2]]}); const w = body(I, s, t, 0, 0.18); resetTurn(I);
    const tr = Math.sin(t * 47) * 0.6 + Math.sin(t * 31) * 0.4;
    ik(I, 'R', V(-4 + tr, 78, 46), V(-0.5, -1, 0), 1); fingers(I, 'R', 'fist', 1); ik(I, 'L', V(4, 76, 40), V(0.5, -1, 0), 1); fingers(I, 'L', 'fist', 1);
    const hm = prop(I, 'helmet', 'Bip01_Head', makeBombHelmet, [0, 2, 0], [0, 0, 0]); hm.visible = true; w.updateMatrixWorld(true);
    const hand = bw(I, 'Bip01_R_Hand'); const lift = sm((t - ev('lift')) / 0.8) * 0.3; const jit = Math.sin(t * 53) * 0.004;
    const sp: V3 = [TRAP[0] + jit, TRAP[1] + lift, TRAP[2]]; const open = 1 - sm((t - ev('grab')) / 0.15);
    return {node: <>{bath(t, {burst: true, hideS: true})}<P o={w} />{fallenNodes(C, t)}<Soap position={sp} look={[TRAP[0] + 0.3, sp[1], TRAP[2] + 1]} squash={t > ev('grab') ? 0.15 : 0} />
      <FoamRing center={[TRAP[0], 0, TRAP[2]]} k={1} t={t} /><Tongs a={hand} b={add3(sp, [0.03, 0.0, 0])} open={open} />{strobe(t)}</>,
      cam: mv({pos: [TRAP[0] - 0.08, 0.36, TRAP[2] + 0.55], look: [TRAP[0] + 0.12, 0.16, TRAP[2]], fov: 48}, lt, {push: 0.14, arrive: 0.1})};
  },
  cuffOn: (t, lt) => {
    // mid-air: the soap trembling in the tongs, an open cuff edges in to close round its middle
    const H: V3 = [TRAP[0], TRAP[1] + 0.3, TRAP[2]]; const jit = Math.sin(t * 53) * 0.003; const sp: V3 = [H[0] + jit, H[1], H[2]];
    const r = 0.024 * 2.0; const k = sm((t - ev('cuffOn')) / 0.7);
    const cuffPos: V3 = lerp3(add3(sp, [-0.25, 0.12, 0.15]), add3(sp, [0, 0, -1.45 * r]), k);
    return {node: <>{bath(t, {burst: true, hideS: true})}<Soap position={sp} look={[sp[0], sp[1], sp[2] + 1]} squash={0.15} />
      <Tongs a={add3(sp, [0.85, 0.25, 0.05])} b={add3(sp, [0.03, 0, 0])} open={0} /><Handcuffs k={1} position={cuffPos} rotation={[0, Math.PI / 2, 0.3 * (1 - k)]} size={2.0} />{strobe(t)}</>,
      cam: mv({pos: add3(H, [0.06, 0.05, 0.42]), look: H, fov: 38}, lt, {push: 0.18, arrive: 0.1, side: 0.4})};
  },
  cuffSlip: (t, lt) => {
    // ECU: the cuff clicks shut — the soap squeezes and shoots out of the ring into the wall; the cuff stays locked on nothing
    const H: V3 = [TRAP[0], TRAP[1] + 0.3, TRAP[2]]; const r = 0.024 * 2.0;
    const lockK = pop((t - ev('lock')) / 0.18); const sq = t > ev('lock') ? sm((t - ev('lock')) / 0.15) : 0; const u = t - ev('squirt');
    const sp: V3 = u < 0 ? H : [H[0] + u * 7, H[1] + u * 0.6, H[2]];
    return {node: <>{bath(t, {burst: true, hideS: true})}{u < 0.25 && <Soap position={sp} look={[sp[0], sp[1], sp[2] + 1]} squash={u < 0 ? 0.15 + sq * 0.7 : 0.4} roll={u > 0 ? u * 20 : 0} />}
      <Tongs a={add3(H, [0.85, 0.25, 0.05])} b={add3(H, [0.03, 0, 0])} open={u > 0 ? 1 : 0} />
      <group position={add3(H, [0, 0, -1.45 * r])} rotation={[0, Math.PI / 2, 0]} scale={1 + 0.08 * (1 - lockK)}><Handcuffs k={1} size={2.0} /></group>
      {u > 0 && u < 0.4 && <FoamRing center={add3(H, [0.05, -0.02, 0])} r={0.02 + u * 0.15} k={1 - u * 2.5} n={10} t={t} size={0.008} />}{strobe(t)}</>,
      cam: mv({pos: add3(H, [0.02, 0.03, 0.3]), look: H, fov: 36}, lt, {push: 0.12, arrive: 0, shake: u > 0 && u < 0.15 ? 0.006 : (t > ev('lock') && t < ev('lock') + 0.08 ? 0.003 : 0)})};
  },
  cage: (t, lt) => {
    // ECU: caught on the 4th try — four cuffs crossed round it like a cage, in an evidence tray
    const TP: V3 = [TRAP[0] + 0.15, 0, TRAP[2] + 0.1]; const C0: V3 = add3(TP, [0, 0.016 + SOAP.h / 2, 0]);
    const ks = [1, pop((t - ev('cage')) / 0.2), pop((t - ev('cage') - 0.13) / 0.2), pop((t - ev('cage') - 0.26) / 0.2)];
    const r = (s: number) => 0.024 * s;
    return {node: <>{bath(t, {burst: true, hideS: true})}<Tray position={TP} /><Soap position={C0} look={[C0[0] + 0.3, C0[1], C0[2] + 1]} face="shut" />
      <Handcuffs k={ks[0]} position={add3(C0, [-0.025, 0, -1.45 * r(1.9)])} rotation={[0, Math.PI / 2, 0]} size={1.9} />
      <Handcuffs k={ks[1]} position={add3(C0, [0.025, 0, -1.45 * r(1.9)])} rotation={[0, Math.PI / 2, 0.15]} size={1.9} />
      <Handcuffs k={ks[2]} position={add3(C0, [1.45 * r(2.4), 0, 0])} rotation={[0, 0, 0]} size={2.4} />
      <Handcuffs k={ks[3]} position={add3(C0, [-1.45 * r(2.6), 0, 0])} rotation={[Math.PI / 2, 0, 0.4]} size={2.6} />{strobe(t)}</>,
      cam: mv({pos: add3(TP, [0.16, 0.34, 0.34]), look: add3(TP, [0.02, 0.03, 0]), fov: 40}, lt, {push: 0.14, arrive: 0.1, side: 0.4, shake: ks.slice(1).some((k, i) => t > ev('cage') + i * 0.13 && t < ev('cage') + i * 0.13 + 0.06) ? 0.003 : 0})};
  },
  interro: (t, lt, C) => interro(t, lt, C, 'wide'),
  soapAnswer: (t, lt, C) => interro(t, lt, C, 'answer'),
  court: (t, lt, C) => {
    const I = C.judge; hideProps(I); const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.1, 0.6]}); const w = body(I, s, t, 0.5);
    const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 1, 3], [0, 0, Math.PI / 2]); g.visible = true;
    const u = t - ev('gavel'); const liftK = u < -0.25 ? 0 : u < 0 ? sm((u + 0.25) / 0.25) : Math.max(0, 1 - u / 0.07);
    rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.6 - liftK * 0.9, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.5 - liftK * 0.5, I.root); w.updateMatrixWorld(true);
    const D: V3 = [0, 1.075, 0.6];
    return {node: <><Court t={t} /><P o={w} />
      <mesh castShadow position={D}><boxGeometry args={[0.32, 0.05, 0.32]} /><meshLambertMaterial color="#8C2A2E" /></mesh>
      <Soap position={[0, 1.1 + SOAP.h / 2, 0.6]} look={[0, 1.3, 4]} />
      <Handcuffs k={1} position={[0, 1.1 + SOAP.h / 2, 0.6 - 1.45 * 0.024 * 1.9]} rotation={[0, Math.PI / 2, 0]} size={1.9} />
      <Bubbles center={[0, 1.15, 0.6]} size={[0.15, 0.6, 0.15]} t={t} n={5} r={0.018} rise={0.12} /></>,
      cam: mv({pos: [0, 1.35, 3.2], look: [0, 1.5, -1.5], fov: 44}, lt, {push: 0.12, arrive: 0.1, shake: u > 0 && u < 0.12 ? 0.02 : 0})};
  },
  cell18: (t, lt) => ({node: <><Block t={t} />{cellLight}</>, cam: mv({pos: [CX.c18, 1.55, 4.6], look: [CX.c18, 1.3, 0], fov: 46}, lt, {push: 0.12, arrive: 0.12, side: -0.5, shake: t > ev('clang') && t < ev('clang') + 0.12 ? 0.012 : 0}), bg: CELL_BG}),
  fan19: (t, lt) => {
    const k = 1 - sm((t - ev('fanTurn')) / 0.6);
    return {node: <><Block t={t} />{cellLight}<Smell from={[CX.c20 - 0.9, 1.0, 1.9]} to={[FAN_C[0] + 0.3, 1.1, FAN_C[2] + 0.4]} t={t} k={0.5 + 0.5 * k} n={3} amp={0.08} w={0.016} /></>,
      cam: mv({pos: [-0.35, 1.3, 0.95], look: [0.28, 1.15, -0.3], fov: 44}, lt, {push: 0.14, arrive: 0.1}), bg: CELL_BG};
  },
  foamFlood: (t, lt) => {
    // the fan blows across the soap: giant bubbles + the durian's green smell flood the corridor, the "50 ปี" plate goes under
    const k = foamLevel(t);
    return {node: <><Block t={t} />{cellLight}
      <FoamPile center={[CX.c18 + 0.4, 0, 0.3]} size={[2.4, 0.9, 2.2]} k={k} t={t} n={40} puff={0.2} seed={1} />
      <FoamPile center={[-1.2, 0, 2.6]} size={[6.5, 1.5, 2.2]} k={k} t={t} n={70} puff={0.3} seed={2} />
      <Bubbles center={[-1.0, 0.4, 2.4]} size={[6, 2.6, 2]} t={t} n={22} r={0.16} k={k} rise={0.35} seed={3} />
      <Smell from={[CX.c20 - 0.9, 1.0, 1.9]} to={[CX.c18 + 0.6, 1.4, 2.2]} t={t} k={0.4 + k} n={3} amp={0.12} w={0.02} seed={2} speed={1.3} />
      <Wind path={[[FAN_C[0] - 0.2, 1.2, FAN_C[2] + 0.2], [-1.4, 1.2, 1.8], [-2.6, 1.0, 1.2]]} t={t} n={22} speed={1.4} len={0.1} w={0.008} spread={0.2} /></>,
      cam: mv({pos: [0.3, 1.7, 5.0], look: [-0.6, 1.2, 0.8], fov: 62}, lt, {push: -0.07, arrive: 0.1, roll: -4}), bg: CELL_BG};
  },
  slide: (t, lt) => {
    // on the wet floor of 18: the soap glides to the bars and through the gap, cool as anything
    const e = escape(t); const k = foamLevel(t);
    return {node: <><Block t={t} soap={false} />{cellLight}<Soap position={e.p} yaw={e.yaw + Math.PI} look={undefined} />
      <mesh position={[CX.c18, 0.003, 0.9]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.9, 2.6]} /><meshBasicMaterial color="#CFE6F2" transparent opacity={0.35} depthWrite={false} /></mesh>
      <FoamPile center={[CX.c18 + 0.6, 0, 0.6]} size={[1.6, 0.25, 1.6]} k={Math.max(0.5, k)} t={t} n={22} puff={0.08} seed={4} />
      <FoamRing center={[e.p[0], 0, e.p[2]]} k={1} t={t} r={0.06} n={8} size={0.012} /></>,
      cam: mv({pos: [e.p[0] + 0.55, 0.24, Math.max(e.p[2] + 0.75, 1.9)], look: [e.p[0], 0.06, e.p[2]], fov: 46}, lt, {push: 0.06, arrive: 0.1, side: 0.5, roll: 3}), bg: CELL_BG};
  },
  chase: (t, lt, C) => {
    // the corridor: the soap shoots toward us leaving a foam trail; the guard chasing it hits the foam, legs up
    const e = escape(t); const I = C.guard; hideProps(I); const gs = ev('guardSlip');
    let gw: THREE.Group;
    if (t < gs) gw = body(I, ps('guard', CX.c18 - 0.4 + (t - ev('chase')) * 3.2, 2.9, Math.PI / 2, t, {moving: true, run: true, face: 'wide'}), t);
    else { const u = cl((t - gs) / 0.4); const x0 = CX.c18 - 0.4 + (gs - ev('chase')) * 3.2;
      gw = body(I, ps('guard', x0 + Math.min(t - gs, 0.3) * 1.5, 2.9, Math.PI / 2, t, {clip: 'idle_nervous_01', face: 'closed'}), t, Math.sin(u * Math.PI) * 0.5 + 0.13 * u, -(Math.PI / 2 + 0.4 * Math.sin(u * Math.PI))); }
    const trail = Array.from({length: 8}, (_, i) => { const tt = t - i * 0.12; if (tt < ev('chase')) return null; const p = escape(tt).p; return <FoamRing key={i} center={[p[0], 0, p[2]]} k={1 - i * 0.08} t={t} r={0.05} n={6} size={0.014} />; });
    return {node: <><Block t={t} soap={false} />{cellLight}<Soap position={e.p} yaw={e.yaw} /><P o={gw} />{trail}
      <SirenLights t={t} position={[e.p[0] + 1, 2.4, 3.2]} power={t > ev('prisonSiren') ? 6 : 0} /></>,
      cam: mv({pos: [e.p[0] + 1.6, 0.45, 3.2], look: [e.p[0] - 0.6, 0.15, 2.7], fov: 58}, lt, {push: 0.04, arrive: 0.08, roll: -3}), bg: CELL_BG};
  },
  report: (t, lt) => {
    // pause-bait: the guard's escape report on a clipboard; the red stamp slams on; the last frames freeze
    const tEnd = TOTAL / FPS - 0.5; const tt = Math.min(t, tEnd); const L = Math.min(lt, tEnd - shotT0('report'));
    const st = (tt - ev('stamp')) / 0.12;
    return {node: <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.74, 0]}><planeGeometry args={[2, 2]} /><meshLambertMaterial color="#6E4A2E" /></mesh>
      <Clipboard position={[0, 0.745, 0]} rotation={[-Math.PI / 2, 0, 0.12]} w={0.25} />
      <Report position={[0, 0.752, 0.01]} rotation={[-Math.PI / 2, 0, 0.12]} w={0.23} stamp={st} />
      <hemisphereLight args={['#FFF1DA', '#3A2A20', 1.1]} /><pointLight position={[0.3, 1.6, 0.4]} intensity={2} color="#FFE8C8" distance={4} decay={1.4} /></>,
      cam: mv({pos: [0.0, 1.3, 0.08], look: [0, 0.75, 0.0], fov: 44}, L, {push: 0.06, arrive: 0.12, roll: -2, shake: st > 1 && st < 1.8 ? 0.002 : 0}), bg: {color: '#2A2420'}};
  },
};

// =====================================================================================================
// INTERROGATION: the caged soap in a tray; three officers lean over it; its answer is two bubbles
// =====================================================================================================
const TRAYI: V3 = [0, TABLE_TOP, 0];
const interro = (t: number, lt: number, C: Cast, mode: string): ShotOut => {
  const offs: [string, number, number, number][] = [['offA', -0.55, -0.8, 0.2], ['offB', 0.55, -0.8, -0.2], ['offC', 0.0, -1.05, 0]];
  const nodes = offs.map(([id, x, z, yaw]) => { hideProps(C[id]); const s = ps(id, x, z, yaw, t, {clip: id === 'offA' ? 'idle_angry_01' : 'idle_neutral_01', lookW: [0, 0.8, 0]}); return <P key={id} o={body(C[id], s, t, 0, 0.12)} />; });
  const C0 = add3(TRAYI, [0, 0.016 + SOAP.h / 2, 0]); const r = (s: number) => 0.024 * s;
  const a = ev('answer'), p = ev('pop');
  const b1 = t < a ? null : <Bubble position={add3(C0, [0.01, 0.04 + (t - a) * 0.12, 0.01])} r={Math.min(0.022, (t - a) * 0.09)} pop={cl((t - p) / 0.12)} />;
  const b2 = t < a + 0.16 ? null : <Bubble position={add3(C0, [-0.022, 0.035 + (t - a - 0.16) * 0.1, 0.0])} r={Math.min(0.016, (t - a - 0.16) * 0.08)} pop={cl((t - p - 0.24) / 0.12)} />;
  const ring = cl((t - p) / 0.45);
  const tray = <><Tray position={TRAYI} tag={false} /><Soap position={C0} look={[0, C0[1], 2]} face={mode === 'answer' && t > a - 0.1 ? 'open' : 'open'} />
    <Handcuffs k={1} position={add3(C0, [-0.025, 0, -1.45 * r(1.9)])} rotation={[0, Math.PI / 2, 0]} size={1.9} />
    <Handcuffs k={1} position={add3(C0, [0.025, 0, -1.45 * r(1.9)])} rotation={[0, Math.PI / 2, 0.15]} size={1.9} />
    <Handcuffs k={1} position={add3(C0, [1.45 * r(2.4), 0, 0])} size={2.4} />
    <Handcuffs k={1} position={add3(C0, [-1.45 * r(2.6), 0, 0])} rotation={[Math.PI / 2, 0, 0.4]} size={2.6} />
    {b1}{b2}{ring > 0 && ring < 1 && <EchoRing position={add3(C0, [0, 0.05, 0.05])} k={ring} r={0.03} />}</>;
  const scene = <><Interro t={t} swing={1} hideS />{nodes}{tray}</>;
  const cams: Record<string, () => Cam> = {
    wide: () => mv({pos: [0, 1.6, 1.9], look: [0, 1.15, -0.5], fov: 50}, lt, {push: 0.12, arrive: 0.1}),
    answer: () => mv({pos: add3(C0, [0.05, 0.1, 0.4]), look: add3(C0, [0, 0.04, 0]), fov: 40}, lt, {push: 0.18, shake: t > p && t < p + 0.1 ? 0.002 : 0}),
  };
  return {node: scene, cam: cams[mode]()};
};
