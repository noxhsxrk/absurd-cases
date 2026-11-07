import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, fingers, handTo, hc} from '../../pov/acting/ik';
import {ev, V3, sm, cl, lerp, lerp3, pop, LN, SHOTS} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Interro, Court, Cell, TABLE_TOP} from '../AbsurdEp1/sets';
import {Mosquito, Handcuffs, makeGavel, makePhone} from '../AbsurdEp1/props';
import {Fan, Wind, EchoRing} from '../AbsurdEp2/props';
import {Plate} from '../AbsurdEp3/props';
import {camMove, whip, SirenLights, Cam, MoveOpts} from '../absurdkit';
import {Kitchen, Fridge, FRIDGE, FRIDGE_LIGHT, Durian, lobePoint, LOBES, Smell, SmellFog, TapeRing, makeGasMask, Phone3D, TransferForm, Stars, KITCHEN_DOOR} from './props';
import {SWAT} from './cast';

type Inst = any; type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const durOf = (name: string) => { const s = SHOTS.find((x: any) => x.name === name)!; return s.dur / 30; };

// ---- people (same staging helpers as EP1–3)
type PSo = {clip?: string; moving?: boolean; talkK?: number; fear?: number; lookW?: V3; face?: string; poseId?: string};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...POSES.stand({t, phase: 0, talking: false, seed: id.length, speed: 0}), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: 0, poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
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
const mask = (I: Inst) => { prop(I, 'gasmask', 'Bip01_Head', makeGasMask, [0, -2, 0], [0, 0, 0]).visible = true; };

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
// KITCHEN. The man stands in front of the fridge facing it (−z). Durian on the middle shelf.
// =====================================================================================================
const MAN: V3 = [0.12, 0, -0.62];
const DUR: V3 = [-0.12, 0.98, -1.68];
const doorK = (t: number) => sm((t - ev('doorOpen')) / 0.35);
const lightK = (t: number) => cl((t - ev('light')) / 0.05);
const kitchen = (t: number, o: {hideS?: boolean; burst?: boolean} = {}) => {
  const fall = o.burst ? cl((t - ev('doorBurst')) / 0.32) + Math.max(0, t - ev('doorBurst') - 0.32) : 0;
  return <><Kitchen t={t} light={lightK(t)} hideS={o.hideS} doorFall={fall} /><Fridge door={doorK(t)} light={lightK(t)} />
    <Durian position={DUR} r={0.15} look={[0.1, 1.5, 2]} /></>;
};
const man = (C: Cast, t: number, o: {face?: string; recoil?: number; yaw?: number; x?: number} = {}) => {
  const s = ps('nai', o.x ?? MAN[0], MAN[2], o.yaw ?? Math.PI, t, {clip: 'idle_neutral_01', face: o.face ?? 'half', lookW: DUR}); const w = body(C.nai, s, t); const I = C.nai;
  if (o.recoil) { rot(I.bones.Bip01_Spine2, 1, 0, 0, -o.recoil * 0.35, I.root); rot(I.bones.Bip01_Head, 1, 0, 0, -o.recoil * 0.4, I.root); w.updateMatrixWorld(true); }
  return w;
};
const recoilK = (t: number) => { const u = t - ev('blast'); return u < 0 ? 0 : u < 0.08 ? u / 0.08 * 1.1 : u < 0.2 ? lerp(1.1, 1, (u - 0.08) / 0.12) : 1; };
const strobe = (t: number, p: V3 = [1.6, 2.0, 0.6]) => t >= ev('siren') ? <><SirenLights t={t} position={p} power={9} /><hemisphereLight args={['#C8D4F0', '#2A2A33', 0.9]} /><spotLight position={[2.4, 1.7, 0.4]} target-position={[0, 1.1, -1.4]} angle={0.5} penumbra={0.5} color="#F4F8FF" intensity={10} distance={8} decay={1.2} /></> : null;

// =====================================================================================================
// CELLS (EP3 layout): 18 at x −3.05 (mosquito on its wall), 19 at 0 (the fan), 20 at +3.05 (now the durian)
// =====================================================================================================
const CX = {c18: -3.05, c19: 0, c20: 3.05};
const FAN_C: V3 = [0.25, 0, -0.3]; const FAN_C_YAW = -0.25; const WALL18: V3 = [-1.475, 1.32, -0.25];
const fanYaw = (t: number) => { const T = ev('turn'), F = ev('flow'); return t < T ? 0.9 * Math.sin(t * 1.3) : t < F ? lerp(0.9 * Math.sin(T * 1.3), -0.9, sm((t - T) / (F - T))) : -0.9 + Math.sin(t * 30) * 0.01; };
const CELL_BG: Bg = {color: '#2E3A38'};
const cellLight = <pointLight position={[0, 2.6, 3.4]} color="#E8EEF6" intensity={1.6} distance={9} decay={1.4} />;
const Corridor: React.FC = () => <group>
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.4]}><planeGeometry args={[14, 4]} /><meshLambertMaterial color="#8E918B" /></mesh>
  <mesh position={[0, 1.4, 5.4]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh>
  <mesh position={[0, 4.6, 1.47]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8C9088" /></mesh>
  <Plate lines={['แดนขัง']} position={[0, 3.3, 1.5]} w={1.5} aspect={3.4} />
</group>;
const mosquitoPeel = (t: number) => cl((t - ev('peel')) / 0.5);
const Block: React.FC<{t: number; durian?: boolean}> = ({t, durian = true}) => {
  const pk = mosquitoPeel(t); const fall = pk * pk;
  const mq: V3 = [WALL18[0] + 0.05 + pk * 0.25, WALL18[1] - fall * 1.22, WALL18[2] + pk * 0.1];
  return <group>
    <group position={[CX.c18, 0, 0]}>
      <Cell t={t} days={0.45} marks={9} />
      <Mosquito t={t} position={mq} rotation={pk < 1 ? [-Math.PI / 2 * (1 - pk), 0, -Math.PI / 2 * (1 - pk)] : [0, 0, Math.PI]} flap={0} scale={3.2} legsUp={pk >= 1} />
      <Plate lines={['ห้อง 18']} position={[0, 2.12, 1.54]} w={0.64} />
    </group>
    <group>
      <Cell t={t} days={0.45} marks={0} />
      <Fan position={FAN_C} yaw={FAN_C_YAW} headYaw={fanYaw(t)} blade={t * 31} blur={1} lit={3} />
      {[0.42, 0.2].map((y, i) => <Handcuffs key={i} k={1} position={[FAN_C[0] + 0.024 * 1.6 * 1.45, y, FAN_C[2]]} rotation={[Math.PI / 2, 0, i ? -0.25 : 0.3]} size={1.6} />)}
      <Plate lines={['นช. พัดลม 019']} position={[FAN_C[0] - 0.01, 0.72, FAN_C[2] + 0.03]} rotation={[0, FAN_C_YAW, 0]} w={0.17} aspect={2.8} bg="#E6E7CF" fg="#152028" />
      <Plate lines={['ห้อง 19']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['50 ปี']} position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />
    </group>
    <group position={[CX.c20, 0, 0]}>
      <Cell t={t} days={0.45} marks={0} />
      <Plate lines={['ห้อง 20']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['ทุเรียน']} position={[0, 1.76, 1.54]} w={0.64} bg="#476F66" />
      {durian && <><Durian position={[-0.1, 0.17, -0.4]} r={0.15} look={[0, 1, 5]} />{[0, 1, 2].map((i) => { const lp = lobePoint(i); return <Handcuffs key={i} k={1} position={[-0.1 + lp[0] * 0.15, 0.17 + lp[1] * 0.15, -0.4 + lp[2] * 0.15]} rotation={[0, i, 0.4]} size={0.9} />; })}</>}
    </group>
    <Corridor />
  </group>;
};
// smell path from cell 20 out through its bars, along the corridor past the fan, into 18
const FLOW: V3[] = [[CX.c20 - 0.1, 0.4, -0.3], [CX.c20 - 0.9, 1.0, 1.9], [0.3, 1.25, 2.1], [CX.c18 + 0.9, 1.2, 1.9], [CX.c18 - 0.9, 1.3, -0.2]];

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  fridgeOpen: (t, lt, C) => {
    // frame 0 is mid-action: his hand on the door, it swings, the light floods out inside 0.8 s
    const w = man(C, t, {face: 'half'}); const I = C.nai; resetTurn(I);
    ik(I, 'L', new THREE.Vector3(-30, 125, 38), new THREE.Vector3(0, -1, 0), 0.8); fingers(I, 'L', 'fist', 0.6); w.updateMatrixWorld(true);
    return {node: <>{kitchen(t)}<P o={w} /></>, cam: mv({pos: [1.05, 1.42, 0.85], look: [-0.1, 1.2, -1.45], fov: 48}, lt, {arrive: 0.14, side: 0.6, push: 0.12, roll0: -3, roll: 2})};
  },
  fridgeFace: (t, lt, C) => {
    const w = man(C, t, {face: 'half'}); const h = bw(C.nai, 'Bip01_Head');
    return {node: <>{kitchen(t)}<P o={w} /></>, cam: mv({pos: add3(h, [-0.45, 0.1, -1.05]), look: add3(h, [0, 0.12, 0]), fov: 40}, lt, {push: 0.12, roll: -3})};
  },
  durianIn: (t, lt) => ({node: kitchen(t), cam: mv({pos: [0.15, 1.12, -0.55], look: [-0.12, 1.0, -1.68], fov: 42}, lt, {push: 0.18, arrive: 0.12, side: -0.5})}),
  smellBlast: (t, lt, C) => {
    const rk = recoilK(t); const w = man(C, t, {face: rk > 0.5 ? 'wide' : 'half', recoil: rk}); const h = bw(C.nai, 'Bip01_Head');
    const k = sm((t - ev('blast')) / 0.35);
    return {node: <>{kitchen(t)}<P o={w} /><Smell from={add3(DUR, [0.05, 0.05, 0.12])} to={add3(h, [0, 0.12, -0.1])} t={t} k={k} n={4} amp={0.07} w={0.016} speed={1.4} /></>,
      cam: mv({pos: [0.75, 1.3, -0.25], look: [-0.05, 1.35, -1.2], fov: 50}, lt, {push: 0.1, shake: t > ev('blast') && t < ev('blast') + 0.25 ? 0.012 : 0, roll0: 2, roll: -4})};
  },
  charge: (t, lt, C) => {
    // wide: he stands frozen in the fridge light, the smell curling out; the plate drops on the charge word (overlay)
    const w = man(C, t, {face: 'closed', recoil: 0.6});
    return {node: <>{kitchen(t)}<P o={w} /><Smell from={add3(DUR, [0.05, 0.05, 0.12])} to={[0.1, 1.7, -0.5]} t={t} k={1} n={3} amp={0.1} w={0.014} /></>,
      cam: mv({pos: [1.5, 1.1, 1.75], look: [-0.1, 1.15, -1.0], fov: 52}, lt, {push: 0.09, arrive: 0.1, roll: 2})};
  },
  deadpan: (t, lt, C) => {
    const w = man(C, t, {face: 'half', recoil: 0.3}); const h = bw(C.nai, 'Bip01_Head');
    return {node: <>{kitchen(t)}<P o={w} /><Smell from={add3(DUR, [0.05, 0.05, 0.12])} to={add3(h, [0.1, 0.15, -0.1])} t={t} k={1} n={2} amp={0.06} w={0.012} /></>,
      cam: mv({pos: add3(h, [0.12, 0.1, -0.95]), look: add3(h, [0, 0.11, 0]), fov: 38}, lt, {push: 0.14})};
  },
  phone: (t, lt, C) => {
    // the 3D phone slides up from the bottom edge (5 frames), the thumb presses call
    const k = sm((lt * 30) / 5); const th = sm((lt - 0.3) / 0.12); const pressed = lt > 0.42;
    const c = mv({pos: [0.4, 1.55, 0.25], look: [0.2, 1.35, -1.6], fov: 50}, lt, {push: 0.08, arrive: 0});
    return {node: <>{kitchen(t)}<P o={man(C, t)} /><Phone3D cam={c.pos} look={c.look} k={k} pressed={pressed} thumb={th} /></>, cam: c};
  },
  phoneEar: (t, lt, C) => {
    const s = ps('nai', MAN[0], MAN[2], Math.PI * 0.82, t, {clip: 'idle_neutral_01', face: 'half'}); const w = body(C.nai, s, t); const I = C.nai;
    resetTurn(I); const raise = sm(lt / 0.12); const ear = hc(I).add(new THREE.Vector3(16, -12, -2));
    fingers(I, 'L', 'cup', 1); ik(I, 'L', ear, new THREE.Vector3(0.9, -1, -0.45), raise); handTo(I, 'L', new THREE.Vector3(-0.1, 1, 0.25), new THREE.Vector3(0, 0, 1), raise);
    const ph = prop(I, 'phone', 'Bip01_L_Hand', makePhone, [9, 3.5, 0], [Math.PI / 2 - 0.5, 0, Math.PI / 2]); ph.visible = true; w.updateMatrixWorld(true);
    const h = bw(I, 'Bip01_Head');
    return {node: <>{kitchen(t)}<P o={w} /></>, cam: mv({pos: add3(h, [0.75, 0.02, -0.65]), look: add3(h, [0, 0.05, 0]), fov: 42}, lt, {push: 0.16})};
  },
  doorBurst: (t, lt, C) => {
    // the side door falls flat inward (gravity), dust puffs, the SWAT pour in under the strobe
    const u = t - ev('doorBurst'); const nodes = SWAT.slice(0, 4).map((id, i) => {
      const enter = cl((u - 0.12 - i * 0.12) / 0.6); const x = lerp(2.9, 1.3 - i * 0.18, enter), z = 0.25 + (i - 1.5) * 0.32;
      const s = ps(id, x, z, -Math.PI / 2, t, {clip: enter < 1 ? 'run_01' : 'idle_angry_01', moving: enter < 1}); const w = body(C[id], s, t); mask(C[id]); return <P key={id} o={w} />; });
    const puff = cl((u - 0.3) / 0.4);
    return {node: <>{kitchen(t, {burst: true})}<P o={man(C, t, {face: 'wide', yaw: Math.PI * 0.6})} />{nodes}{strobe(t)}
      {puff > 0 && puff < 1 && <SmellFog center={[1.6, 0.1, 0.25]} k={puff} t={t} size={0.8} />}</>,
      cam: mv({pos: [-0.9, 1.35, 1.45], look: [1.9, 1.1, 0.2], fov: 56}, lt, {arrive: 0.12, side: -0.8, push: 0.1, shake: u > 0.3 && u < 0.5 ? 0.03 : 0, roll0: 5, roll: -3})};
  },
  swatMasks: (t, lt, C) => {
    const nodes = SWAT.slice(0, 5).map((id, i) => { const s = ps(id, 1.2 - i * 0.12, -0.6 + i * 0.35, -Math.PI / 2 + 0.2, t, {clip: 'idle_angry_01', lookW: FRIDGE}); const w = body(C[id], s, t); mask(C[id]); return <P key={id} o={w} />; });
    return {node: <>{kitchen(t, {burst: true})}{nodes}{strobe(t)}</>, cam: mv({pos: [-0.3, 1.0, 1.3], look: [1.1, 1.45, -0.1], fov: 52}, lt, {push: 0.12, arrive: 0.1, roll: 4})};
  },
  swatWide: (t, lt, C) => {
    // twelve masked men packed into a tiny kitchen around one fridge; the man squeezed in the corner
    const nodes = SWAT.map((id, i) => { const a = (i / SWAT.length) * Math.PI * 1.3 - 0.2, r = 0.95 + (i % 3) * 0.32;
      const x = FRIDGE[0] + Math.cos(a) * r, z = FRIDGE[2] + 0.7 + Math.sin(a) * r * 0.8; const s = ps(id, x, z, Math.atan2(FRIDGE[0] - x, FRIDGE[2] - z), t, {clip: i % 2 ? 'idle_angry_01' : 'idle_neutral_01'}); const w = body(C[id], s, t); mask(C[id]); return <P key={id} o={w} />; });
    const s = ps('nai', -1.75, 0.9, Math.PI * 0.75, t, {clip: 'idle_neutral_01', face: 'half'});
    return {node: <>{kitchen(t, {burst: true, hideS: true})}{nodes}<P o={body(C.nai, s, t)} />{strobe(t, [0, 2.6, 0])}</>,
      cam: mv({pos: [0.05, 4.6, 1.6], look: [0, 0, -0.4], fov: 64}, lt, {push: -0.08, arrive: 0.1, roll: 6})};
  },
  tape: (t, lt) => {
    const k = sm((t - ev('tape0')) / 0.9);
    return {node: <>{kitchen(t, {burst: true})}{strobe(t)}<TapeRing center={FRIDGE} r={0.75} y={1.0} k={k} /></>,
      cam: mv({pos: [0.9, 1.15, 0.2], look: [0, 1.0, -1.55], fov: 50}, lt, {push: 0.12, arrive: 0.1, side: 0.8})};
  },
  tapeTop: (t, lt) => {
    const k = [0, 1, 2].map((i) => sm((t - ev('tapeTop') + 0.6 - i * 0.25) / 0.6));
    return {node: <>{kitchen(t, {burst: true, hideS: true})}{strobe(t, [0, 2.6, 0])}{[0.75, 1.1, 1.45].map((r, i) => <TapeRing key={i} center={FRIDGE} r={r} y={0.7 + i * 0.25} k={k[i]} tilt={0.02 * i} />)}</>,
      cam: mv({pos: [0.4, 5.6, -0.6], look: [0, 0, -1.55], fov: 50}, lt, {push: -0.1, arrive: 0.1, roll: 8})};
  },
  cuffLobe: (t, lt) => {
    const k = pop((t - ev('cuff')) / 0.25); const lp = lobePoint(0);
    return {node: <>{kitchen(t, {burst: true})}{strobe(t)}<Handcuffs k={k} position={add3(DUR, [lp[0] * 0.15, lp[1] * 0.15, lp[2] * 0.15])} rotation={[0.2, 0.3, 0.5]} size={1.0} /></>,
      cam: mv({pos: add3(DUR, [0.2, 0.1, 0.55]), look: add3(DUR, [0.04, 0.02, 0.05]), fov: 40}, lt, {push: 0.22, shake: t > ev('cuff') && t < ev('cuff') + 0.12 ? 0.004 : 0})};
  },
  cuffAll: (t, lt) => {
    const cuffs = Array.from({length: LOBES}, (_, i) => { const lp = lobePoint(i); const k = pop((t - ev('lobes') - i * 0.06 + 0.35) / 0.2);
      return <Handcuffs key={i} k={k} position={add3(DUR, [lp[0] * 0.15, lp[1] * 0.15, lp[2] * 0.15])} rotation={[0.2, i * 1.25, 0.5]} size={1.0} />; });
    return {node: <>{kitchen(t, {burst: true})}{strobe(t)}{cuffs}</>, cam: mv({pos: add3(DUR, [0.05, 0.12, 0.55]), look: DUR, fov: 42}, lt, {push: -0.2, arrive: 0})};
  },
  interro: (t, lt, C) => interro(t, lt, C, 'wide'),
  officerAsk: (t, lt, C) => interro(t, lt, C, 'ask'),
  askClose: (t, lt, C) => interro(t, lt, C, 'close'),
  durianAnswer: (t, lt, C) => interro(t, lt, C, 'answer'),
  smellRoom: (t, lt, C) => interro(t, lt, C, 'fog'),
  faint: (t, lt, C) => interro(t, lt, C, 'faint'),
  faintTop: (t, lt, C) => interro(t, lt, C, 'top'),
  court: (t, lt, C) => {
    // the judge wears a gas mask; the durian sits cuffed on the dock cushion
    const I = C.judge; const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.1, 0.6]}); const w = body(I, s, t, 0.5); mask(I);
    const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 1, 3], [0, 0, Math.PI / 2]); g.visible = true;
    const u = t - ev('gavel'); const lift = u < -0.25 ? 0 : u < 0 ? sm((u + 0.25) / 0.25) : Math.max(0, 1 - u / 0.07);
    rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.6 - lift * 0.9, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.5 - lift * 0.5, I.root); w.updateMatrixWorld(true);
    return {node: <><Court t={t} /><P o={w} />
      <mesh castShadow position={[0, 1.075, 0.6]}><boxGeometry args={[0.32, 0.05, 0.32]} /><meshLambertMaterial color="#8C2A2E" /></mesh>
      <Durian position={[0, 1.27, 0.6]} r={0.15} look={[0, 1.5, 4]} /><Smell from={[0, 1.35, 0.6]} to={[0, 1.9, -3.0]} t={t} k={1} n={2} amp={0.12} w={0.02} /></>,
      cam: mv({pos: [0, 1.35, 3.2], look: [0, 1.5, -1.5], fov: 44}, lt, {push: 0.12, arrive: 0.1, shake: u > 0 && u < 0.12 ? 0.02 : 0})};
  },
  cell20: (t, lt) => ({node: <><Block t={t} />{cellLight}</>, cam: mv({pos: [CX.c20, 1.55, 5.2], look: [CX.c20, 1.35, 0], fov: 46}, lt, {push: 0.12, arrive: 0.12, side: -0.5}), bg: CELL_BG}),
  fan19: (t, lt) => ({node: <><Block t={t} />{cellLight}</>, cam: mv({pos: [-0.35, 1.3, 0.95], look: [0.28, 1.15, -0.3], fov: 44}, lt, {push: 0.14, arrive: 0.1}), bg: CELL_BG}),
  smellFlow: (t, lt) => {
    const k = sm((t - ev('flow') + 0.1) / 1.2);
    const segs = FLOW.slice(0, -1).map((a, i) => <Smell key={i} from={a} to={FLOW[i + 1]} t={t} k={cl(k * 4 - i)} n={3} amp={0.1} w={0.02} seed={i * 3} speed={1.3} />);
    return {node: <><Block t={t} />{cellLight}{segs}<Wind path={[[FAN_C[0] - 0.2, 1.2, FAN_C[2] + 0.2], [-1.4, 1.2, 1.8], [-2.4, 1.2, 2.0]]} t={t} n={20} speed={1.3} len={0.1} w={0.008} spread={0.18} /></>,
      cam: mv({pos: [0.2, 1.65, 4.6], look: [0, 1.25, 0.6], fov: 62}, lt, {push: -0.06, arrive: 0.1, roll: -4}), bg: CELL_BG};
  },
  cell18: (t, lt) => ({node: <><Block t={t} />{cellLight}<Smell from={[CX.c18 + 0.9, 1.2, 1.9]} to={[CX.c18 - 1.3, 1.3, -0.25]} t={t} k={1} n={3} amp={0.1} w={0.02} /></>,
    cam: mv({pos: [CX.c18 - 0.15, 1.5, 2.1], look: [CX.c18 - 1.45, 1.3, -0.25], fov: 46}, lt, {push: 0.14, arrive: 0.1}), bg: CELL_BG}),
  form: (t, lt) => {
    // pause-bait: the mosquito, legs up on the floor of 18, next to its transfer request. The last ~15 frames freeze.
    const tt = Math.min(t, LN.l013.t1 + 1.3); const L = Math.min(lt, (LN.l013.t1 + 1.3) - SHOTS.find((s: any) => s.name === 'form')!.t0);
    return {node: <><Block t={tt} />{cellLight}<TransferForm position={[CX.c18 - 0.35, 0.004, -0.15]} rotation={[-Math.PI / 2, 0, 0.25]} w={0.2} /></>,
      cam: mv({pos: [CX.c18 - 0.42, 0.42, 0.08], look: [CX.c18 - 0.36, 0.0, -0.17], fov: 44}, L, {push: 0.08, arrive: 0.12, roll: -3}), bg: CELL_BG};
  },
};

// =====================================================================================================
// INTERROGATION: the durian in an evidence tray; three officers; the answer is a smell
// =====================================================================================================
const TRAY: V3 = [0, TABLE_TOP, 0];
const interro = (t: number, lt: number, C: Cast, mode: string): ShotOut => {
  const fog = sm((t - ev('answer')) / 1.4);
  const fall = (i: number) => { const u = t - ev(['faint0', 'faint1', 'faint2'][i]); return u <= 0 ? 0 : u < 0.42 ? (Math.PI / 2) * Math.pow(u / 0.42, 2) : Math.PI / 2 - 0.08 * Math.abs(Math.sin((u - 0.42) * 16)) * Math.exp(-(u - 0.42) * 5); };
  const offs: [string, number, number, number][] = [['offA', -0.55, -0.85, 0.15], ['offB', 0.55, -0.85, -0.15], ['offC', 0.0, -1.15, 0]];
  const talking = mode === 'close' || (mode === 'ask' && t >= ev('ask'));
  const nodes = offs.map(([id, x, z, yaw], i) => {
    const s = ps(id, x, z, yaw, t, {clip: id === 'offA' ? 'idle_angry_01' : 'idle_neutral_01', lookW: [0, 0.95, 0], talkK: id === 'offA' && talking && t < LN.l008.t1 ? 1 : 0, fear: fog > 0.3 ? 1 : 0, face: fall(i) > 0.2 ? 'closed' : undefined});
    return <P key={id} o={body(C[id], s, t, 0, -fall(i))} />;
  });
  const tray = <><mesh position={[0, TABLE_TOP + 0.01, 0]} castShadow><boxGeometry args={[0.42, 0.02, 0.32]} /><meshLambertMaterial color="#9AA3AC" /></mesh>
    <Durian position={add3(TRAY, [0, 0.17, 0])} r={0.15} look={[0, 1.2, 2]} squash={mode === 'answer' ? 0.5 * Math.max(0, Math.sin((t - ev('answer')) * 10)) * (t > ev('answer') ? 1 : 0) : 0} />
    {Array.from({length: LOBES}, (_, i) => { const lp = lobePoint(i); return <Handcuffs key={i} k={1} position={add3(TRAY, [lp[0] * 0.15, 0.17 + lp[1] * 0.15, lp[2] * 0.15])} rotation={[0.2, i * 1.25, 0.5]} size={1.0} />; })}</>;
  const ring = cl((t - ev('answer')) / 0.5);
  const answerFx = t > ev('answer') ? <>{ring < 1 && <EchoRing position={add3(TRAY, [0, 0.18, 0.12])} k={ring} r={0.2} />}
    <Smell from={add3(TRAY, [0, 0.2, 0])} to={[-0.55, 1.65, -0.8]} t={t} k={fog * 1.5} n={2} amp={0.08} w={0.015} seed={1} />
    <Smell from={add3(TRAY, [0, 0.2, 0])} to={[0.55, 1.65, -0.8]} t={t} k={fog * 1.5} n={2} amp={0.08} w={0.015} seed={4} />
    <Smell from={add3(TRAY, [0, 0.2, 0])} to={[0, 1.7, -1.1]} t={t} k={fog * 1.5} n={2} amp={0.08} w={0.015} seed={7} /></> : null;
  const stars = mode === 'top' ? offs.map(([id], i) => fall(i) > 1.2 ? <Stars key={id} center={add3(bw(C[id], 'Bip01_Head'), [0, 0.12, 0])} t={t + i} /> : null) : null;
  const scene = <><Interro t={t} swing={1} hideS={mode !== 'top'} />{nodes}{tray}{answerFx}{stars}<SmellFog center={[0, 1.2, -1.4]} k={fog * (mode === 'fog' ? 1 : 0.45)} t={t} size={1.1} /></>;
  const cams: Record<string, () => Cam> = {
    wide: () => mv({pos: [0, 1.55, 1.7], look: [0, 1.0, -0.5], fov: 48}, lt, {push: 0.12, arrive: 0.1}),
    ask: () => mv({pos: [-0.2, 1.62, 0.15], look: [-0.5, 1.6, -0.85], fov: 42}, lt, {push: 0.14, arrive: 0.1, side: -0.5}),
    close: () => mv({pos: [0.2, 1.66, 0.75], look: [-0.55, 1.66, -0.85], fov: 34}, lt, {push: 0.16}),
    answer: () => mv({pos: [0, TABLE_TOP + 0.34, 0.72], look: add3(TRAY, [0, 0.15, 0]), fov: 38}, lt, {push: 0.18, shake: t > ev('answer') && t < ev('answer') + 0.15 ? 0.004 : 0}),
    fog: () => mv({pos: [0.1, 1.5, 1.6], look: [0, 1.2, -0.7], fov: 50}, lt, {push: 0.08, arrive: 0.1, roll: 3}),
    faint: () => mv({pos: [0.0, 1.25, 2.0], look: [0, 0.9, -0.8], fov: 56}, lt, {push: 0.06, arrive: 0.08}),
    top: () => mv({pos: [0.0, 3.3, -0.55], look: [0, 0, -0.9], fov: 58}, lt, {push: 0.1, arrive: 0.1, roll: 10}),
  };
  return {node: scene, cam: cams[mode]()};
};
