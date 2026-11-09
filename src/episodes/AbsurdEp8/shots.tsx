import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, fingers, V} from '../../pov/acting/ik';
import {ev, V3, sm, cl, lerp, lerp3, pop, SHOTS, TOTAL, FPS} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Street, Interro, Court, TABLE_TOP} from '../AbsurdEp1/sets';
import {Handcuffs, makeGavel, Van} from '../AbsurdEp1/props';
import {PrisonOutside} from '../AbsurdEp3/props';
import {Smell, SmellFog, TapeRing, makeGasMask, Phone3D, Stars} from '../AbsurdEp4/props';
import {FB, FootBridge, PrisonGate, Chain} from '../AbsurdEp6/props';
import {Puffs, makeSoot} from '../AbsurdEp7/props';
import {camMove, SirenLights, Cam, MoveOpts} from '../absurdkit';
import {SHADOW_MAT, makeEyes, setEyes, eyeMode, GroundEyes, SoiSign, Floodlight, LightPool, Spatula, Vest, Anklet, Broom, BusStop, SunBall, Report} from './props';

type Inst = any; type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;

// ---- people (same staging helpers as EP1–7)
type PSo = {clip?: string; moving?: boolean; talkK?: number; fear?: number; lookW?: V3; face?: string; poseId?: string; odo?: number};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...POSES[(o.poseId ?? 'stand') as 'stand']({t, phase: 0, talking: false, seed: id.length, speed: 0} as any), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: o.odo ?? (o.moving ? t * 1.4 : 0), poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
};
const wraps = new Map<Inst, THREE.Group>();
const body = (I: Inst, s: any, t: number, y = 0, pitch = 0, roll = 0): THREE.Group => {
  let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, y, s.z); w.rotation.set(pitch, s.yaw, roll, 'YXZ'); w.scale.setScalar(I.scale); w.updateMatrixWorld(true);
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
const headProp = (I: Inst, key: string, make: () => THREE.Object3D) => {
  let a = attached.get(I); if (!a) { a = {}; attached.set(I, a); }
  if (!a[key]) { const hb = I.bones.Bip01_Head as THREE.Object3D; const fr = hb.children.find((c) => (c as any).isGroup && c.children.some((m: any) => m.geometry?.type === 'CylinderGeometry')) ?? hb;
    const o = make(); fr.add(o); a[key] = o; }
  return a[key];
};
const hideProps = (I: Inst) => { const a = attached.get(I); if (a) Object.values(a).forEach((o) => { o.visible = false; }); };
const casts = (I: Inst, on: boolean) => I.root.traverse((o: any) => { if (o.isMesh) o.castShadow = on; });

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.01; c.far = 600; c.updateProjectionMatrix();
  return null;
};
const mv = (base: Cam, lt: number, o: MoveOpts = {}) => camMove(base, lt, {arrive: 0.1, push: 0.11, ...o});
const DAY: Bg = {color: '#BFD6E4'};
const strobe = (t: number, at: V3, power = 10) => <SirenLights t={t} position={at} power={power} />;

// =====================================================================================================
// THE SHADOW. On the street it is a true planar projection of its own body (the `shade` instance, all black)
// onto the pavement along the sun direction, so its legs swing as it walks. From the raid on it is a loose
// black sheet: the same body, lying flat (pitch −90°, squashed thin) or standing up as a cut-out.
// =====================================================================================================
const SUN_D = new THREE.Vector3(-0.8, -0.75, -0.25).normalize();   // direction the sunlight travels (street)
const PAVE = 0.125;                                                 // pavement top (EP1 street kerb)
const projMatrix = (d: THREE.Vector3, h: number) => { const a = d.x / d.y, c = d.z / d.y;
  return new THREE.Matrix4().set(1, -a, 0, a * h, 0, 0, 0, h, 0, -c, 1, c * h, 0, 0, 0, 1); };
const projG = (() => { const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(projMatrix(SUN_D, PAVE + 0.004)); g.updateMatrixWorld(true); return g; })();
const projected = (I: Inst, s: any, t: number) => { hideProps(I); const w = body(I, s, t, PAVE); if (w.parent !== projG) projG.add(w); projG.updateMatrixWorld(true); return projG; };
/** where the projected head lands on the pavement (+ the yaw of the shadow's long axis) */
const headOnGround = (I: Inst): V3 => bw(I, 'Bip01_Head');
const SH_YAW = Math.atan2(-SUN_D.x, -SUN_D.z);
type SheetO = {pos: V3; yaw: number; up?: number; s?: number; sy?: number; fold?: number; arms?: 'down' | 'out' | 'broom'; eyes?: string; clip?: string; pitch0?: number};
/** the shadow as a sheet. up 0 = lying flat on its back on the ground (head away along −yaw), 1 = standing; fold 0..1 = folded in half at the waist */
const sheet = (C: Cast, t: number, o: SheetO) => {
  const I = C.shade; hideProps(I); const up = o.up ?? 1;
  const s = ps('shade', o.pos[0], o.pos[2], o.yaw, t, {clip: o.clip ?? 'idle_neutral_01', face: 'closed'});
  const pitch = -Math.PI / 2 * (1 - up) + (o.pitch0 ?? 0);
  const w = body(I, s, t, o.pos[1], pitch); resetTurn(I);
  if (o.arms === 'out') { ik(I, 'R', V(-78, 138, 6), V(0, -1, -0.4), 1); ik(I, 'L', V(78, 138, 6), V(0, -1, -0.4), 1); fingers(I, 'R', 'flat', 1); fingers(I, 'L', 'flat', 1); }
  if (o.arms === 'broom') { ik(I, 'R', V(-22, 98, 26), V(-1, -0.5, 0), 1); ik(I, 'L', V(-14, 118, 24), V(1, -0.5, 0), 1); fingers(I, 'R', 'fist', 1); fingers(I, 'L', 'fist', 1); }
  if (o.fold) rot(I.bones.Bip01_Spine, 1, 0, 0, Math.PI * 0.97 * o.fold, I.root);
  const k = o.s ?? 1; const thin = lerp(0.06, 1, sm(up * 1.6));
  w.scale.set(I.scale * k, I.scale * k * (o.sy ?? 1), I.scale * k * thin); w.updateMatrixWorld(true);
  const e = headProp(I, 'eyes', makeEyes); e.visible = true; setEyes(e, o.eyes ?? eyeMode(t));
  return w;
};

// =====================================================================================================
// STREET (EP1 street by day): he walks along the house-side pavement toward +x; the sun is behind him
// =====================================================================================================
const WALK_Z = -4.05, X0 = -3.2, SPEED = 1.15;
const manX = (t: number) => X0 + SPEED * Math.min(t, ev('stop'));
/** the shadow body's own x: walks with him, then keeps creeping on its own (two extra steps) */
const step = (t: number, t0: number) => cl((t - t0) / 0.5);
const shadeX = (t: number) => manX(t) + 0.55 * (step(t, ev('lag')) + step(t, ev('step2')));
const shadeMoving = (t: number) => t < ev('stop') || (t > ev('lag') && t < ev('lag') + 0.5) || (t > ev('step2') && t < ev('step2') + 0.5);
const DAYLIGHT = () => <>
  <hemisphereLight args={['#DCE8F2', '#5A5446', 1.15]} />
  <directionalLight position={[-SUN_D.x * 30, -SUN_D.y * 30, -SUN_D.z * 30]} color="#FFF1D6" intensity={1.9} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0006} />
</>;
const street = (t: number) => <><Street t={t} out={2} /><SoiSign position={[3.6, 0.12, -3.75]} yaw={-0.3} />{DAYLIGHT()}</>;
const man = (C: Cast, t: number, o: {phone?: boolean; x?: number; face?: string; yaw?: number} = {}) => {
  const I = C.nai; hideProps(I); casts(I, false);
  const walking = t < ev('stop');
  const s = ps('nai', o.x ?? manX(t), WALK_Z, o.yaw ?? Math.PI / 2, t, {moving: walking, odo: manX(t) - X0, clip: o.phone ? 'cell_phone_talk_01' : 'idle_neutral_01', face: o.face ?? (t > ev('lag') ? 'wide' : 'half')});
  const w = body(I, s, t, PAVE); return w;
};
const streetShadow = (C: Cast, t: number) => {
  const I = C.shade; casts(I, false);
  const s = ps('shade', shadeX(t), WALK_Z, Math.PI / 2, t, {moving: shadeMoving(t), odo: shadeX(t) - X0});
  const g = projected(I, s, t); const h = headOnGround(I);
  return <><P o={g} /><GroundEyes p={h} yaw={SH_YAW + Math.PI / 2} s={1.6} mode={eyeMode(t, t > ev('plate') - 0.3 ? 'angry' : 'angry')} /></>;
};

// =====================================================================================================
// THE RAID: the shadow is now a loose sheet lying on the road; six SWAT, twenty floodlights, three tape rings
// =====================================================================================================
const SPOT: V3 = [1.2, 0.006, 0.6];                 // the sheet's feet on the road
const SH_LIE = Math.PI / 2;                          // lying with the head toward −x (sheet yaw)
const RING = Array.from({length: 20}, (_, i) => { const a = (i / 20) * Math.PI * 2; return [SPOT[0] - 0.85 + Math.cos(a) * 4.2, 0, SPOT[2] + Math.sin(a) * 3.0] as V3; });
const lightOn = (t: number, i: number) => cl((t - ev('lights') - i * 0.035) / 0.05);
const peelK = (t: number) => t < ev('peel') - 0.6 ? 0.0 : t < ev('peel') ? 0.12 * sm((t - ev('peel') + 0.6) / 0.6) : 0.12 + 0.88 * sm((t - ev('peel')) / 0.8);
const SWAT_POS: [number, number, number][] = [[-3.6, 2.2, 0.9], [-2.4, -2.0, 0.5], [3.4, 2.6, -2.4], [4.0, -1.4, -1.9], [0.4, 3.4, Math.PI], [-0.8, -3.2, 0.1]];
const raid = (C: Cast, t: number, o: {lights?: boolean; swat?: boolean; close?: boolean; tape?: boolean} = {}) => {
  const tape = [0, 1, 2].map((i) => sm((t - sh('swat').t0 - 0.1 - i * 0.12) / 0.3));
  const swat = (o.swat ?? true) ? ['cmd2', 'cmd3', 'cmd4', 'cmd5', 'cmd6'].map((id, i) => { const I = C[id]; hideProps(I); const [x, z, yaw] = SWAT_POS[i + 1];
    const s = ps(id, SPOT[0] + x, SPOT[2] + z, yaw, t, {clip: i % 2 ? 'idle_angry_01' : 'idle_neutral_01', lookW: [SPOT[0] - 0.8, 0.2, SPOT[2]]}); return <P key={id} o={body(I, s, t)} />; }) : null;
  return <>
    <Street t={t} out={2} />{DAYLIGHT()}
    {RING.map((p, i) => <Floodlight key={i} position={p} aim={[SPOT[0] - 0.85, 0, SPOT[2]]} on={o.lights === false ? 0 : lightOn(t, i)} t={t} seed={i} beam={o.close ? 0 : 1} />)}
    {!o.close && <LightPool center={[SPOT[0] - 0.85, 0, SPOT[2]]} r={1.6} k={lightOn(t, 19)} />}
    {!o.close && o.tape !== false && [1.9, 2.5, 3.1].map((r, i) => <TapeRing key={i} center={[SPOT[0] - 0.85, 0, SPOT[2]]} r={r} y={0.8 + i * 0.12} k={tape[i]} />)}
    <Van t={t} position={[-9, 0, 1.8]} yaw={0.1} />
    {swat}{strobe(t, [-9, 2.6, 1.8], 10)}
  </>;
};
/** the commando with the spatula, kneeling at the sheet's head (cmd1) */
const scraper = (C: Cast, t: number, k: number) => {
  const I = C.cmd1; hideProps(I);
  const kneel = k < 0.2;
  const hx = SPOT[0] - 1.75;   // head end of the lying sheet
  const s = ps('cmd1', kneel ? hx - 0.55 : SPOT[0] + 0.5, kneel ? SPOT[2] + 0.1 : SPOT[2] + 0.35, kneel ? Math.PI / 2 : -Math.PI / 2 + 0.15, t, {poseId: kneel ? 'crouch' : 'stand', clip: kneel ? 'crouch_idle' : 'idle_neutral_01', lookW: [hx, 0.1, SPOT[2]]});
  const w = body(I, s, t); resetTurn(I);
  if (kneel) { ik(I, 'R', V(-12, 40, 46), V(-1, -0.4, 0), 1); ik(I, 'L', V(10, 34, 58), V(1, -0.4, 0), 1); fingers(I, 'R', 'fist', 1); fingers(I, 'L', 'fist', 1); }
  w.updateMatrixWorld(true); return w;
};

// =====================================================================================================
// INTERROGATION (EP1 room): the sheet propped against a little chair on the table; three officers behind
// =====================================================================================================
const ZT: V3 = [0, TABLE_TOP + 0.01, 0.1];
const OFFS: [string, number, number, number][] = [['offA', -0.55, -0.9, 0.12], ['offB', 0.0, -1.1, 0], ['offC', 0.55, -0.9, -0.12]];
const shrinkS = (t: number) => { const a = sm((t - ev('shrink')) / 0.18), b = sm((t - ev('answer')) / 0.12); return 0.4 * (1 - 0.62 * a) * (1 - 0.45 * b); };
const lampOn = (t: number) => (t >= ev('lamp') ? 1 : 0);
const interroRoom = (C: Cast, t: number) => {
  const nodes = OFFS.map(([id, x, z, yaw]) => { const I = C[id]; hideProps(I);
    const s = ps(id, x, z, yaw, t, {clip: id === 'offA' ? 'idle_angry_01' : 'idle_neutral_01', lookW: add3(ZT, [0, 0.2, 0]), face: t > ev('shrink') + 0.1 ? 'wide' : undefined});
    return <P key={id} o={body(I, s, t)} />; });
  const sc = shrinkS(t);
  const w = sheet(C, t, {pos: ZT, yaw: 0, s: sc, pitch0: -0.12, eyes: t > ev('lamp') && t < ev('lamp') + 0.5 ? 'shut' : eyeMode(t)});
  return <><Interro t={t} swing={1} hideS /><P o={w} />{nodes}
    <mesh position={[0, TABLE_TOP + 0.09, -0.02]} material={new THREE.MeshLambertMaterial({color: '#6B5B4A'})}><boxGeometry args={[0.16, 0.18, 0.06]} /></mesh>
    {lampOn(t) > 0 && <><spotLight position={[0, 1.9, 0.15]} target-position={ZT} angle={0.5} penumbra={0.4} intensity={22} distance={4} color="#FFF4D8" />
      <mesh position={[0, 1.35, 0.12]} renderOrder={2}><cylinderGeometry args={[0.08, 0.5, 1.15, 16, 1, true]} /><meshBasicMaterial color="#FFF6D8" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh></>}
  </>;
};

// =====================================================================================================
// COURT (EP1): the judge in a gas mask, green durian haze drifting in behind the bench from the prison side
// =====================================================================================================
const courtRoom = (C: Cast, t: number, gavelShot: boolean) => {
  const I = C.judge; hideProps(I); const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.2, 0.6]}); const w = body(I, s, t, 0.5);
  prop(I, 'gasmask', 'Bip01_Head', makeGasMask, [0, -2, 0], [0, 0, 0]).visible = true;
  const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 1, 3], [0, 0, Math.PI / 2]); g.visible = true;
  const u = t - ev('gavel'); const lift = u < -0.25 ? 0 : u < 0 ? sm((u + 0.25) / 0.25) : Math.max(0, 1 - u / 0.07);
  const cough = t - ev('cough'); const jolt = cough > 0 && cough < 0.4 ? Math.sin(cough * 40) * 0.08 * (1 - cough / 0.4) : 0;
  rot(I.bones.Bip01_Spine1, 1, 0, 0, jolt, I.root);
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.6 - lift * 0.9, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.5 - lift * 0.5, I.root); w.updateMatrixWorld(true);
  const sw = sheet(C, t, {pos: [-0.05, 1.04, 0.6], yaw: 0, s: 0.24, eyes: eyeMode(t)});
  return <><Court t={t} /><P o={w} /><P o={sw} />
    <SmellFog center={[-1.6, 1.8, -3.9]} k={1} t={t} size={1.6} /><SmellFog center={[1.8, 2.2, -3.9]} k={0.8} t={t + 2} size={1.4} />
    <Smell from={[-2.6, 2.6, -4.2]} to={[0.4, 2.2, -3.6]} t={t} k={1} n={3} amp={0.2} w={0.04} speed={1.2} />
    {gavelShot && u > 0.03 && u < 0.5 && <Stars center={add3(bw(I, 'Bip01_R_Hand'), [0, -0.05, 0.1])} t={t * 3} r={0.08} size={0.03} />}</>;
};

// =====================================================================================================
// PRISON FRONT (EP3 wall + EP6 gate & chained footbridge) + the bus stop. Sun low in front (from +z).
// =====================================================================================================
const PB = {pos: [0, 0, 6.5] as V3, s: 0.55, yaw: Math.PI / 2};
const toPrison = (p: V3): V3 => { const x = p[2], z = -p[0]; return [PB.pos[0] + x * PB.s, PB.pos[1] + p[1] * PB.s, PB.pos[2] + z * PB.s]; };
const BUS: V3 = [-6.5, 0, 11.5];
const SHADE_AT: V3 = [BUS[0], 0, BUS[2] + 1.15];
const VIL: [string, number, number][] = [['vil1', -0.35, -0.25], ['vil2', 0.35, -0.45]];
const sunY = (t: number) => { const u = sm((t - ev('sunStart')) / (ev('bell') - ev('sunStart'))); return u; };
const squashK = (t: number) => sm((t - ev('squash')) / 0.45);
const prisonFront = (t: number, o: {noonLight?: number} = {}) => {
  const n = o.noonLight ?? 0;
  const sunPos: V3 = lerp3([-6, 7, 40], [BUS[0] + 0.5, 40, BUS[2] + 0.8], n);
  return <>
    <PrisonOutside t={t} beam={0.4 + Math.sin(t * 0.7) * 0.3} /><PrisonGate t={t} />
    <FootBridge position={PB.pos} yaw={PB.yaw} scale={PB.s} faces={['-x']} sign="นช. สะพานลอย (กักบริเวณหน้าคุก)" />
    <Chain a={toPrison([0, 1.4, FB.L / 2 - 1.2])} b={[6.2, 1.4, 4.2]} n={20} r={0.1} sag={0.25} />
    <Chain a={toPrison([0, 1.4, -FB.L / 2 + 1.2])} b={[-10.5, 0.5, 9.5]} n={22} r={0.1} sag={0.25} />
    <Handcuffs k={1} position={add3(toPrison([0, 1.4, FB.L / 2 - 1.2]), [0, 0, 0.35])} rotation={[0, 0.3, 0]} size={7} />
    {[1, 3, 5].map((i) => <Smell key={i} from={[-9 + i * 3, 5.2, 0.7]} to={[-9 + i * 3 + 2.5, 9.5, 5]} t={t} k={1.3} n={3} amp={0.35} w={0.09} speed={2.6} seed={i * 3} />)}
    <SmellFog center={[-3, 7.5, 2]} k={0.7} t={t} size={3} />
    <BusStop position={BUS} clock={t >= ev('bell') - 0.1 ? '12:00' : '11:59'} />
    <directionalLight position={sunPos} target-position={SHADE_AT} color="#FFF1D6" intensity={1.6 + n * 0.8} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0006} />
  </>;
};
const villagers = (C: Cast, t: number) => VIL.map(([id, dx, dz]) => { const I = C[id]; hideProps(I); casts(I, true);
  const burnt = t >= ev('burn');
  const s = ps(id, SHADE_AT[0] + dx, SHADE_AT[2] - 1.0 + dz, 0, t, {clip: burnt ? 'idle_nervous_01' : 'idle_neutral_01', face: burnt ? 'wide' : 'half'});
  const w = body(I, s, t); const so = headProp(I, 'soot', makeSoot); so.visible = burnt; return <P key={id} o={w} />; });
const busShade = (C: Cast, t: number) => {
  const q = squashK(t); casts(C.shade, true);
  const w = sheet(C, t, {pos: SHADE_AT, yaw: 0, arms: 'out', sy: lerp(1, 0.04, q), s: lerp(1, 1.25, q), eyes: q > 0.2 ? 'wide' : eyeMode(t)});
  return w;
};
/** the vest on the standing sheet (it falls when the shadow squashes at noon) */
const vestOn = (t: number, base: V3, s = 1) => { const q = squashK(t); const fall = q > 0 ? Math.min(1, (t - ev('squash')) / 0.35) : 0;
  return <><Vest position={[base[0], lerp(1.22 * s, 0.03, fall * fall), base[2] + 0.06 + fall * 0.15]} pitch={-Math.PI / 2 * fall} w={0.5 * s} h={0.6 * s} />
    {q < 0.5 && <Anklet position={[base[0] + 0.1 * s, 0.1 * s, base[2] + 0.02]} t={t} s={s} />}</>; };

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  walk: (t, lt, C) => {
    // frame 0 mid-stride: eye-level MCU tracking him along the house-side pavement; his shadow trails behind on the slabs
    const w = man(C, t); const x = manX(t);
    return {node: <>{street(t)}<P o={w} />{streetShadow(C, t)}</>, cam: mv({pos: [x + 1.9, 1.5, WALK_Z + 2.5], look: [x - 0.1, 1.15, WALK_Z], fov: 50}, lt, {arrive: 0.1, push: 0.1, side: 0.4, roll0: -2, roll: 2}), bg: DAY};
  },
  look: (t, lt, C) => {
    // he stops dead; the camera tilts down to the pavement behind him
    const w = man(C, t); const x = manX(t); const k = sm(lt / 1.1);
    return {node: <>{street(t)}<P o={w} />{streetShadow(C, t)}</>,
      cam: mv({pos: [x + 1.6, lerp(1.45, 2.6, k), WALK_Z + 2.1], look: [x - lerp(0.2, 1.1, k), lerp(1.1, 0.15, k), WALK_Z - lerp(0, 0.3, k)], fov: 50}, lt, {arrive: 0, push: 0.06}), bg: DAY};
  },
  shadowStep: (t, lt, C) => {
    // top-down over the pavement behind him: he stands still, the black shape takes one more step… then another. Snap zoom on its eyes.
    const w = man(C, t); const node = <>{street(t)}<P o={w} />{streetShadow(C, t)}</>; const h = headOnGround(C.shade); const x = manX(t);
    const zk = sm((t - ev('step2') - 0.45) / 0.12);
    const tgt: V3 = lerp3([x - 1.0, 0.12, WALK_Z - 0.3], [h[0], 0.12, h[2]], zk);
    return {node, cam: mv({pos: [tgt[0] + 0.2, lerp(3.6, 1.1, zk), tgt[2] + 0.9], look: tgt, fov: 50}, lt, {arrive: 0.08, push: 0.05}), bg: DAY};
  },
  charge: (t, lt, C) => {
    // ground level beside the shadow's head, looking along it to his heels; the plate drops on the charge word
    const w = man(C, t); const x = manX(t);
    return {node: <>{street(t)}<P o={w} />{streetShadow(C, t)}</>,
      cam: mv({pos: [x - 2.6, 0.32, WALK_Z + 0.9], look: [x - 0.2, 0.5, WALK_Z - 0.2], fov: 52}, lt, {push: 0.1, arrive: 0.1, shake: t > ev('plate') && t < ev('plate') + 0.25 ? 0.012 : 0, roll0: 4, roll: -2}), bg: DAY};
  },
  phone: (t, lt, C) => {
    // his POV looking down at it; the 3D phone slides up and the thumb presses 191
    const x = manX(t); const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [x + 0.05, 1.6, WALK_Z + 0.05], look: [x - 1.0, 0.1, WALK_Z - 0.35], fov: 54}, lt, {push: 0.08, arrive: 0});
    return {node: <>{street(t)}{streetShadow(C, t)}<Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: DAY};
  },
  callUI: (t, lt, C) => SHOT_FN.phone(t, lt + 0.6, C),
  swat: (t, lt, C) => {
    // extreme wide from high: the van, six SWAT, twenty floodlights on tripods ringed round one flat shadow; tape goes up in three rings
    const I = C.nai; hideProps(I); casts(I, false); const sm1 = ps('nai', -3.2, -3.4, 0.6, t, {clip: 'cell_phone_talk_01', face: 'half'}); const wm = body(I, sm1, t, PAVE);
    const sw = sheet(C, t, {pos: SPOT, yaw: SH_LIE, up: 0, eyes: eyeMode(t)});
    const I1 = C.cmd1; hideProps(I1); const s1 = ps('cmd1', SPOT[0] + SWAT_POS[0][0], SPOT[2] + SWAT_POS[0][1], SWAT_POS[0][2], t, {clip: 'idle_angry_01'}); const w1 = body(I1, s1, t);
    return {node: <>{raid(C, t)}<P o={wm} /><P o={sw} /><P o={w1} /></>, cam: mv({pos: [7.5, 11, 13], look: [-0.5, 0, 0.2], fov: 52}, lt, {push: -0.06, arrive: 0.12, roll: -3}), bg: DAY};
  },
  lights: (t, lt, C) => {
    // low inside the ring: the floodlights bang on one after another; the shadow squints but stays pinned flat
    const sw = sheet(C, t, {pos: SPOT, yaw: SH_LIE, up: 0, eyes: t > ev('lights') ? (Math.floor(t * 30) % 5 ? 'shut' : 'angry') : eyeMode(t)});
    const u = t - ev('lights');
    return {node: <>{raid(C, t, {tape: false, close: true})}<P o={sw} /></>, cam: mv({pos: [SPOT[0] + 1.6, 0.55, SPOT[2] + 2.6], look: [SPOT[0] - 1.6, 1.1, SPOT[2] - 1.2], fov: 62}, lt, {push: 0.14, arrive: 0.1, shake: u > 0 && u < 0.7 ? 0.01 : 0, roll0: -6, roll: 3}), bg: DAY};
  },
  scrape: (t, lt, C) => {
    // CU: a kneeling commando works the spatula under the shadow's head and starts to lift it off the asphalt like a sticker
    const k = peelK(t); const sw = sheet(C, t, {pos: SPOT, yaw: SH_LIE, up: k, eyes: 'wide'});
    const w = scraper(C, t, k); const g = cl((t - ev('scrape')) / 0.6);
    const head: V3 = [SPOT[0] - 1.75 + 0.1 * g, 0.02, SPOT[2]];
    return {node: <>{raid(C, t, {swat: false, close: true})}<P o={sw} /><P o={w} />
      <Spatula position={add3(head, [-0.9 + 0.35 * g, 0.18 - 0.05 * g, 0])} rotation={[0.18, Math.PI / 2, 0]} s={1.15} /></>,
      cam: mv({pos: [SPOT[0] - 2.6, 1.55, SPOT[2] + 2.1], look: [SPOT[0] - 1.2, 0.05, SPOT[2] - 0.1], fov: 46}, lt, {push: 0.14, arrive: 0.1, side: 0.5}), bg: DAY};
  },
  peel: (t, lt, C) => {
    // the whole sheet comes up off the road, hinged at its heels, and stands — limp, scowling
    const k = peelK(t); const sw = sheet(C, t, {pos: SPOT, yaw: SH_LIE, up: k, eyes: eyeMode(t, 'angry')});
    const w = scraper(C, t, k);
    return {node: <>{raid(C, t, {close: true})}<P o={sw} /><P o={w} /></>, cam: mv({pos: [SPOT[0] + 3.2, 1.1, SPOT[2] + 1.6], look: [SPOT[0] - 0.6, 0.7, SPOT[2]], fov: 48}, lt, {push: 0.12, arrive: 0.1, roll0: 3}), bg: DAY};
  },
  fold: (t, lt, C) => {
    // folded in half like laundry
    const f = sm((t - ev('fold')) / 0.45); const sw = sheet(C, t, {pos: SPOT, yaw: SH_LIE + 0.25, fold: f, eyes: f > 0.3 ? 'wide' : 'angry'});
    const w = scraper(C, t, 1);
    return {node: <>{raid(C, t, {close: true})}<P o={sw} /><P o={w} /></>, cam: mv({pos: [SPOT[0] + 2.3, 1.15, SPOT[2] - 1.7], look: [SPOT[0], 0.75, SPOT[2]], fov: 46}, lt, {push: 0.12, arrive: 0.1, side: -0.4}), bg: DAY};
  },
  cuffs: (t, lt, C) => {
    // ECU: a giant pair of cuffs snaps shut round the folded middle
    const sw = sheet(C, t, {pos: SPOT, yaw: SH_LIE + 0.25, fold: 1, eyes: 'wide'});
    const mid = bw(C.shade, 'Bip01_Spine'); const k = pop((t - ev('cuff')) / 0.25);
    return {node: <>{raid(C, t, {swat: false, close: true})}<P o={sw} /><Handcuffs k={t > ev('cuff') - 0.05 ? Math.max(0.05, k) : 0} position={add3(mid, [0.02, 0.05, 0.12])} rotation={[0, SH_LIE + 0.25 + Math.PI / 2, 0.2]} size={7} /></>,
      cam: mv({pos: add3(mid, [1.5, 0.35, -1.3]), look: add3(mid, [0, -0.05, 0]), fov: 42}, lt, {push: 0.22, shake: t > ev('cuff') && t < ev('cuff') + 0.12 ? 0.012 : 0, roll0: -5}), bg: DAY};
  },
  interro: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: [0, 1.48, 2.0], look: [0, 1.0, -0.4], fov: 50}, lt, {push: 0.08, arrive: 0.1}), bg: {color: '#1A2236'}}),
  shrink: (t, lt, C) => {
    // ECU on the table: under the lamp it shrinks to the size of a coaster — then shrinks again. It says nothing.
    return {node: interroRoom(C, t), cam: mv({pos: add3(ZT, [0.05, 0.32, 0.95]), look: add3(ZT, [0, 0.16, 0]), fov: 42}, lt, {push: 0.18, arrive: 0.08}), bg: {color: '#1A2236'}};
  },
  lamp: (t, lt, C) => {
    // from the table top looking up: the officer's hand on the swing lamp, it clicks on hard
    return {node: interroRoom(C, t), cam: mv({pos: add3(ZT, [0.25, 0.12, 0.55]), look: [0, 1.75, 0.1], fov: 54}, lt, {push: 0.12, arrive: 0.08, roll0: 5, shake: t > ev('lamp') && t < ev('lamp') + 0.1 ? 0.006 : 0})};
  },
  answerCU: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: add3(ZT, [0.0, 0.12, 0.36]), look: add3(ZT, [0, 0.06, 0]), fov: 38}, lt, {push: 0.2, arrive: 0.06}), bg: {color: '#1A2236'}}),
  anklet: (t, lt, C) => {
    // ECU on its flat ankle: the EM tag blinks green
    const base: V3 = [0.6, 0, 9.6]; const sw = sheet(C, t, {pos: base, yaw: 0.15, arms: 'broom', eyes: eyeMode(t)});
    const hR = bw(C.shade, 'Bip01_R_Hand');
    return {node: <>{prisonFront(t)}<P o={sw} />{vestOn(t, base)}<Broom position={add3(hR, [0.02, -0.75, 0.04])} rotation={[0.1, 0, 0.08]} /></>,
      cam: mv({pos: [0.95, 0.28, 10.25], look: [0.7, 0.12, 9.62], fov: 40}, lt, {push: 0.16, arrive: 0.08}), bg: DAY};
  },
  court: (t, lt, C) => ({node: courtRoom(C, t, false), cam: mv({pos: [0, 1.95, 3.3], look: [0, 1.35, -1.5], fov: 44}, lt, {push: 0.12, arrive: 0.1})}),
  gavel: (t, lt, C) => {
    const u = t - ev('gavel');
    return {node: courtRoom(C, t, true), cam: mv({pos: [0.35, 1.75, -1.2], look: [0.05, 1.45, -3.2], fov: 44}, lt, {push: 0.14, arrive: 0.1, shake: u > 0 && u < 0.12 ? 0.02 : 0})};
  },
  vest: (t, lt, C) => {
    // outside the court: the sheet in an orange hi-vis vest, an EM tag on its flat ankle, a flat broom in its hands; dolly back
    const base: V3 = [0.6, 0, 9.6]; const sw = sheet(C, t, {pos: base, yaw: 0.15, arms: 'broom', eyes: eyeMode(t)});
    const hR = bw(C.shade, 'Bip01_R_Hand');
    return {node: <>{prisonFront(t)}<P o={sw} />{vestOn(t, base)}<Broom position={add3(hR, [0.02, -0.75, 0.04])} rotation={[0.1, 0, 0.08]} /></>,
      cam: mv({pos: [0.8, 1.35, 11.4], look: [0.6, 1.1, 9.6], fov: 46}, lt, {push: -0.12, arrive: 0.1}), bg: DAY};
  },
  busStop: (t, lt, C) => {
    // wide: the bus stop in front of the prison wall (the chained footbridge, green durian smoke blasting from the windows);
    // the sheet stands arms out across the sun; two people wait in its shade
    const w = busShade(C, t);
    return {node: <>{prisonFront(t)}<P o={w} />{vestOn(t, SHADE_AT)}{villagers(C, t)}</>, cam: mv({pos: [-2.2, 4.4, 22], look: [-4.0, 3.0, 6.0], fov: 50}, lt, {push: 0.08, arrive: 0.12, roll: 2}), bg: DAY};
  },
  busWide: (t, lt, C) => {
    const w = busShade(C, t);
    return {node: <>{prisonFront(t)}<P o={w} />{vestOn(t, SHADE_AT)}{villagers(C, t)}</>, cam: mv({pos: [SHADE_AT[0] + 1.8, 1.4, SHADE_AT[2] + 3.6], look: [SHADE_AT[0] - 0.2, 1.15, SHADE_AT[2] - 0.6], fov: 48}, lt, {push: 0.1, arrive: 0.1, side: -0.4}), bg: DAY};
  },
  sun: (t, lt, C) => {
    // low angle from behind the stop: the sun climbs to dead overhead; the stop's clock flips to 12:00
    const u = sunY(t); const sp = lerp3([BUS[0] + 6, 14, BUS[2] + 30], [BUS[0] + 1.5, 34, BUS[2] + 1.5], u);
    const w = busShade(C, t); const cp: V3 = [BUS[0] + 2.6, 0.9, BUS[2] - 2.6];
    return {node: <>{prisonFront(t, {noonLight: u})}<P o={w} />{villagers(C, t)}<SunBall position={sp} r={2.2} /></>,
      cam: mv({pos: cp, look: lerp3([BUS[0] + 2.2, 5, BUS[2] + 8], [BUS[0] + 1.8, 9, BUS[2] + 0.6], u), fov: 70}, lt, {push: 0.04, arrive: 0.08, roll0: -6}), bg: DAY};
  },
  squash: (t, lt, C) => {
    // sun straight overhead: the shadow shrinks down into a blob at its own feet, the vest drops; the two behind it fry
    const w = busShade(C, t);
    return {node: <>{prisonFront(t, {noonLight: 1})}<P o={w} />{vestOn(t, SHADE_AT)}{villagers(C, t)}</>,
      cam: mv({pos: [SHADE_AT[0] + 1.2, 1.25, SHADE_AT[2] + 2.9], look: [SHADE_AT[0] - 0.1, lerp(1.0, 0.45, squashK(t)), SHADE_AT[2] - 0.4], fov: 50}, lt, {push: 0.1, arrive: 0.1}), bg: DAY};
  },
  report: (t, lt) => {
    // the probation officer's log on a clipboard — held for the pause; red "อู้งาน" stamp. The last frames freeze.
    const tEnd = TOTAL / FPS - 0.5; const tt = Math.min(t, tEnd); const L = Math.min(lt, tEnd - sh('report').t0);
    const st = tt - ev('stamp');
    return {node: <><mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3, 3]} /><meshLambertMaterial color="#6E5A44" /></mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0.04]}><planeGeometry args={[0.7, 0.9]} /><meshLambertMaterial color="#8C6A40" /></mesh>
      <Report position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0.04]} w={0.6} stamp={st > 0 ? st / 0.12 : 0} />
      <hemisphereLight args={['#FFF6E8', '#3A3028', 1.4]} /><directionalLight position={[1, 3, 1]} intensity={0.8} /></>,
      cam: mv({pos: [0.02, 1.62, 0.22], look: [0, 0, -0.01], fov: 40}, L, {push: 0.05, arrive: 0.08, shake: st > 0 && st < 0.15 ? 0.006 : 0}), bg: {color: '#2A2420'}};
  },
};
void rot; void Puffs;
