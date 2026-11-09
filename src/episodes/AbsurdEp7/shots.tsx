import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, fingers, V} from '../../pov/acting/ik';
import {ev, V3, sm, cl, lerp, lerp3, pop, SHOTS, TOTAL, FPS} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Bedroom, Street, Town, Interro, Court, Cell, TABLE_TOP} from '../AbsurdEp1/sets';
import {Handcuffs, makeGavel} from '../AbsurdEp1/props';
import {Fan, Wind, Bolt, HairSpikes, PANEL, btnWorld} from '../AbsurdEp2/props';
import {Plate} from '../AbsurdEp3/props';
import {Durian, lobePoint, Smell, Phone3D, Stars} from '../AbsurdEp4/props';
import {Chain} from '../AbsurdEp6/props';
import {camMove, SirenLights, Cam, MoveOpts} from '../absurdkit';
import {Zap, ZAP_WAIST, Strike, InsulCuff, DESK, ROUTER, Computer, Router, Puffs, Sparks7, PoliceCar, Clouds, Rain, Mic, Flames, makeSoot, makeShades, makeHardHat, RubberMat,
  Readout, FlyingButtons, Aura, TownTop, SmellCloud, ThailandMap, AlertPhone, Glow} from './props';

type Inst = any; type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---- people (same staging helpers as EP1–6)
type PSo = {clip?: string; moving?: boolean; run?: boolean; talkK?: number; fear?: number; lookW?: V3; face?: string; poseId?: string};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...POSES[(o.poseId ?? 'stand') as 'stand']({t, phase: 0, talking: false, seed: id.length, speed: 0} as any), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, loco: o.run ? 'run' : undefined, label: '', next: '', talking: (o.talkK ?? 0) > 0.3,
    odo: o.moving ? t * 1.4 : 0, poseId: o.poseId ?? 'stand', talkK: o.talkK ?? 0, fear: o.fear ?? 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
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
/** props on the box head go on the head's own frame group (boxcast builds the head in a BODY_Q-rotated frame) */
const headProp = (I: Inst, key: string, make: () => THREE.Object3D) => {
  let a = attached.get(I); if (!a) { a = {}; attached.set(I, a); }
  if (!a[key]) { const hb = I.bones.Bip01_Head as THREE.Object3D; const fr = hb.children.find((c) => (c as any).isGroup && c.children.some((m: any) => m.geometry?.type === 'CylinderGeometry')) ?? hb;
    const o = make(); fr.add(o); a[key] = o; }
  return a[key];
};
const hideProps = (I: Inst) => { const a = attached.get(I); if (a) Object.values(a).forEach((o) => { o.visible = false; }); };

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.01; c.far = 600; c.updateProjectionMatrix();
  return null;
};
const mv = (base: Cam, lt: number, o: MoveOpts = {}) => camMove(base, lt, {arrive: 0.1, push: 0.11, ...o});
const NIGHT: Bg = {color: '#1A2236'};
const STORM: Bg = {color: '#39404E', fog: ['#39404E', 6, 46]};
const strobe = (t: number, at: V3, power = 10) => <SirenLights t={t} position={at} power={power} />;

// =====================================================================================================
// BEDROOM (EP1 room, night, storm). Desk against the west wall south of the window, he sits facing −x.
// =====================================================================================================
const SEAT: V3 = [DESK.x + 0.72, 0, DESK.z];
const WIN: V3 = [-2.12, 1.45, -0.5];
const zapIn = (t: number): V3 => { const u = cl((t - ev('strike') + 0.12) / 0.16); return lerp3([-3.6, 2.4, -0.6], add3(ROUTER, [0.0, 0.1, -0.02]), u * u); };
const zapOut = (t: number): V3 => { const u = cl((t - ev('boltOut')) / 0.2); return lerp3(add3(ROUTER, [0.01, 0.12, -0.02]), [-3.8, 2.5, -0.6], u * u); };
const routerDead = (t: number) => (t >= ev('routerBoom') ? 1 : 0);
const lightning = (t: number) => { const u = t - ev('strike'); return u > -0.05 && u < 0.25 ? (Math.floor(u * 30) % 2 ? 0.4 : 1) : (Math.floor(t * 30) % 97 === 3 ? 0.5 : 0); };
const room = (t: number, o: {open?: number} = {}) => <>
  <Bedroom st={{t, lamp: 0.12, day: 0, open: o.open ?? (t > ev('strike') ? 1 : 0)}} />
  <Computer dead={t >= ev('routerBoom') + 0.15} t={t} /><Router dead={routerDead(t)} t={t} />
  {lightning(t) > 0 && <directionalLight position={[-8, 6, -0.5]} target-position={[0, 0.5, 0.2]} color="#E6EEFF" intensity={4 * lightning(t)} />}
</>;
const gamer = (C: Cast, t: number, o: {face?: string} = {}) => {
  const I = C.nai; hideProps(I);
  const s = ps('nai', SEAT[0], SEAT[2], -Math.PI / 2, t, {poseId: 'sitIdle', clip: 'sit_chair_idle_neutral_01', face: o.face ?? 'half', lookW: [DESK.x - 0.2, DESK.top + 0.3, DESK.z + 0.05]});
  const w = body(I, s, t, 0.0); resetTurn(I);
  // right hand on the mouse, clicking; left on the keyboard
  const click = Math.max(0, Math.sin(t * 19)) > 0.85 ? 1 : 0;
  ik(I, 'R', V(-16, 74 - click * 1.2, 42), V(0, -1, 0.3), 0.9); fingers(I, 'R', 'cup', 0.7);
  ik(I, 'L', V(16, 74, 42), V(0, -1, 0.3), 0.9); fingers(I, 'L', 'cup', 0.6);
  w.updateMatrixWorld(true); return w;
};

// =====================================================================================================
// STREET (EP1, night): ten police cars in two rows on the road, nose to +x
// =====================================================================================================
const CARS: [number, number][] = Array.from({length: 10}, (_, i) => [-2 - Math.floor(i / 2) * 4.6 + (i % 2) * 1.4, i % 2 ? 1.35 : -1.35]);
const rise = (t: number) => { const u = t - ev('liftoff'); return u < 0 ? 0 : 4 * u * u + 14 * Math.max(0, u - 0.3); };
const foldK = (t: number) => sm((t - ev('liftoff') + 0.25) / 0.3);
const carsOnStreet = (t: number, fly = false) => CARS.map(([x, z], i) => { const y = fly ? rise(t - i * 0.03) : 0;
  return <PoliceCar key={i} t={t} seed={i} position={[x + (fly ? rise(t) * 0.6 : 0), y, z]} fold={fly ? foldK(t) : 0} jet={fly ? foldK(t) : 0} spin={fly ? 0 : 40} pitch={fly ? 0.12 * foldK(t) : 0} />; });

// =====================================================================================================
// THE SKY: formation of ten flying cars (local frame moving with the chase); the bolt flees ahead
// =====================================================================================================
const FORM: V3[] = Array.from({length: 10}, (_, i) => [((i % 3) - 1) * 4.2 + (i > 8 ? 0 : 0), ((i * 7) % 3) * 0.9, -Math.floor(i / 3) * 5.5 + 6]);
const bob = (t: number, i: number) => Math.sin(t * 3 + i * 1.7) * 0.25;

// =====================================================================================================
// INTERROGATION (EP1 room): the bolt cuffed on a rubber mat in the middle of the table, chained down;
// three officers in shades behind it, the jumper (hair on end) by the door; a table mic in front-right
// =====================================================================================================
const ZT: V3 = [0, TABLE_TOP + 0.024, 0.02];
const MIC: V3 = [0.42, TABLE_TOP, 0.22];
const OFFS: [string, number, number, number][] = [['offA', -0.55, -0.9, 0.12], ['offB', 0.0, -1.1, 0], ['offC', 0.55, -0.9, -0.12]];
const interroRoom = (t: number, C: Cast, mode: string) => {
  const sooty = t >= ev('zap') + 0.03;
  const nodes = OFFS.map(([id, x, z, yaw]) => { const I = C[id]; hideProps(I);
    const s = ps(id, x, z, yaw, t, {clip: id === 'offA' ? 'idle_angry_01' : 'idle_neutral_01', lookW: add3(ZT, [0, 0.25, 0]), talkK: id === 'offA' && mode === 'wide' && t > ev('jump') + 2.2 ? 1 : 0, face: sooty ? 'wide' : undefined});
    const w = body(I, s, t); headProp(I, 'shades', makeShades).visible = !sooty || mode !== 'faces';
    const so = headProp(I, 'soot', makeSoot); so.visible = sooty;
    const sm1 = so.getObjectByName('smoke'); if (sm1) { const u = ((t + x) % 1.2) / 1.2; sm1.position.set(4, 30 + u * 14, 2); sm1.scale.setScalar(0.6 + u); }
    w.updateMatrixWorld(true); return <P key={id} o={w} />; });
  const J = C.rubber; hideProps(J); const sj = ps('rubber', 1.35, -1.3, -0.5, t, {clip: 'idle_neutral_01', lookW: ZT, face: 'half'}); const wj = body(J, sj, t); const hd = bw(J, 'Bip01_Head');
  const burst = t - ev('zap');
  return <><Interro t={t} swing={1} hideS />{nodes}<P o={wj} /><HairSpikes head={add3(hd, [0, 0.08, 0])} />
    <RubberMat position={[0, TABLE_TOP, 0.02]} />
    <Zap position={ZT} scale={0.42} t={t} cuffed={1} face={mode === 'glare' || (burst > -0.2 && burst < 0.6) ? 'shout' : 'angry'} glow={mode === 'glare' ? 1 + sm((t - sh('glare').t0) / 0.8) : 1} />
    <Chain a={add3(ZT, [0.06, 0.18, 0.02])} b={[0.2, TABLE_TOP + 0.01, 0.3]} n={8} r={0.012} sag={0.04} />
    <Mic position={MIC} burst={burst > 0 ? 1 + burst : 0} t={t} />
    {burst > 0 && burst < 0.18 && <Strike a={add3(ZT, [0.1, 0.25, 0.02])} b={add3(MIC, [-0.03, 0.24, 0])} t={t} n={6} amp={0.04} w={0.02} />}
    <Sparks7 at={add3(MIC, [-0.03, 0.24, 0])} t={t} t0={ev('zap')} dur={0.6} n={22} speed={1.3} />
    <Puffs at={add3(MIC, [-0.04, 0.3, 0])} t={t} t0={ev('zap') + 0.1} n={8} size={0.06} color="#3A3A3E" rise={0.9} life={1.4} />
    {mode === 'glare' && <Sparks7 at={add3(ZT, [0.12, 0.3, 0.05])} t={t} t0={sh('glare').t0 + 0.2} dur={0.8} n={10} speed={0.5} seed={4} />}
  </>;
};

// =====================================================================================================
// CELL BLOCK (EP3–6 layout): 18 now holds the bolt, 19 the fan (cuffed, speed 3), 20 the durian
// =====================================================================================================
const CX = {c18: -3.05, c19: 0, c20: 3.05};
const FAN_C: V3 = [0.25, 0, -0.3]; const FAN_YAW = -0.25;
const PANEL_W = btnWorld(FAN_C, FAN_YAW, 1, 'b2');
const fanBoost = (t: number) => sm((t - ev('plugIn')) / 1.0);
const fanHead = (t: number) => { const T = ev('blow') - 0.25; return t < T ? 0.9 * Math.sin(t * 1.3) : lerp(0.9 * Math.sin(T * 1.3), 1.85, sm((t - T) / 0.25)); };
const CELL_BG: Bg = {color: '#2E3A38'};
const BAR_PATH: V3[] = [[CX.c18 + 0.15, 0.95, 0.3], [CX.c18 + 0.6, 1.2, 1.5], [-0.5, 1.2, 1.5], [-0.2, 1.05, 0.6], PANEL_W];
const pathAt = (u: number): V3 => { const n = BAR_PATH.length - 1; const f = cl(u) * n; const i = Math.min(n - 1, Math.floor(f)); return lerp3(BAR_PATH[i], BAR_PATH[i + 1], f - i); };
const Block: React.FC<{t: number; inCell?: boolean}> = ({t, inCell = true}) => {
  const doorHit = t - ev('cellDoor'); const shake = doorHit > 0 && doorHit < 0.3 ? Math.sin(doorHit * 80) * 0.01 * (1 - doorHit / 0.3) : 0;
  const boost = fanBoost(t);
  return <group>
    <group position={[CX.c18 + shake, 0, 0]}><Cell t={t} days={0.45} marks={0} />
      <Plate lines={['ห้อง 18']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['ฟ้าผ่า (ตลอดชีวิต)']} position={[0, 1.76, 1.54]} w={0.9} aspect={3.2} bg="#B0402E" />
      {inCell && <Zap position={[0.0, 0.55, 0.25]} scale={0.7} t={t} />}</group>
    <group><Cell t={t} days={0.45} marks={0} />
      <Fan position={FAN_C} yaw={FAN_YAW} headYaw={fanHead(t)} blade={t * 31 * (1 + boost * 6)} blur={1} lit={3} />
      {[0.42, 0.2].map((y, i) => <Handcuffs key={i} k={1} position={[FAN_C[0] + 0.024 * 1.6 * 1.45, y, FAN_C[2]]} rotation={[Math.PI / 2, 0, i ? -0.25 : 0.3]} size={1.6} />)}
      <Plate lines={['นช. พัดลม 019']} position={[FAN_C[0] - 0.01, 0.72, FAN_C[2] + 0.03]} rotation={[0, FAN_YAW, 0]} w={0.17} aspect={2.8} bg="#E6E7CF" fg="#152028" />
      <Plate lines={['ห้อง 19']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['100 ปี']} position={[0, 1.76, 1.54]} w={0.64} bg="#B0402E" />
      {boost > 0 && <Aura center={[FAN_C[0], 1.2, FAN_C[2]]} r={0.3} t={t} k={boost} n={7} />}
      {boost > 0 && <Aura center={add3(PANEL_W, [0, 0, 0.02])} r={0.08} t={t + 3} k={boost} n={4} />}</group>
    <group position={[CX.c20, 0, 0]}><Cell t={t} days={0.45} marks={0} />
      <Plate lines={['ห้อง 20']} position={[0, 2.12, 1.54]} w={0.64} /><Plate lines={['ทุเรียน']} position={[0, 1.76, 1.54]} w={0.64} bg="#476F66" />
      <Durian position={[-0.1, 0.17, -0.4]} r={0.15} look={[-2, 1, 3]} squash={t > ev('blow') ? 0.2 * Math.abs(Math.sin(t * 30)) : 0} />
      {[0, 1, 2].map((i) => { const lp = lobePoint(i); return <Handcuffs key={i} k={1} position={[-0.1 + lp[0] * 0.15, 0.17 + lp[1] * 0.15, -0.4 + lp[2] * 0.15]} rotation={[0, i, 0.4]} size={0.9} />; })}</group>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.4]}><planeGeometry args={[14, 4]} /><meshLambertMaterial color="#8E918B" /></mesh>
    <mesh position={[0, 1.4, 5.4]} rotation={[0, Math.PI, 0]}><planeGeometry args={[14, 2.8]} /><meshLambertMaterial color="#6F736D" /></mesh>
    <mesh position={[0, 4.6, 1.47]}><planeGeometry args={[14, 3.6]} /><meshLambertMaterial color="#8C9088" /></mesh>
    <Plate lines={['แดนขัง']} position={[0, 3.3, 1.5]} w={1.5} aspect={3.4} />
    <pointLight position={[0, 2.6, 3.4]} color="#E8EEF6" intensity={1.6} distance={9} decay={1.4} />
  </group>;
};

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  bedroom: (t, lt, C) => {
    // frame 0 mid-action: he clicks away in the dark, lit by the game; the router's green lights blink beside the window
    const w = gamer(C, t); const h = bw(C.nai, 'Bip01_Head');
    void h; return {node: <>{room(t)}<P o={w} /></>, cam: mv({pos: [0.7, 1.45, 1.8], look: [-1.45, 0.98, 0.35], fov: 54}, lt, {arrive: 0.12, side: 0.5, push: 0.12, roll0: -3, roll: 2}), bg: NIGHT};
  },
  strike: (t, lt, C) => {
    // wide from the room: the bolt smashes the window open and dives onto the router
    const w = gamer(C, t); const u = t - ev('strike');
    return {node: <>{room(t)}<P o={w} />{u > -0.12 && <Zap position={zapIn(t)} scale={0.22} yaw={Math.PI / 2 - 0.3} t={t} />}
      {u > 0 && u < 0.14 && <Strike a={[-7, 6, -0.6]} b={WIN} t={t} amp={0.25} w={0.08} />}<Sparks7 at={WIN} t={t} t0={ev('strike')} dur={0.5} n={18} speed={2.2} /></>,
      cam: mv({pos: [0.25, 1.75, 0.75], look: [-2.0, 1.15, -0.35], fov: 54}, lt, {arrive: 0.1, push: 0.16, shake: u > 0 && u < 0.2 ? 0.03 : 0}), bg: NIGHT};
  },
  router: (t, lt, C) => {
    // ECU: the router pops, smoke, sparks; the screen behind goes "no internet"; he doesn't blink
    const w = gamer(C, t); const u = t - ev('routerBoom');
    return {node: <>{room(t)}<P o={w} /><Zap position={add3(ROUTER, [0.0, 0.1, -0.02])} scale={0.2} yaw={Math.PI / 2 - 0.3} t={t} />
      <Sparks7 at={add3(ROUTER, [0, 0.07, 0])} t={t} t0={ev('routerBoom')} dur={0.5} n={20} speed={1.2} /><Puffs at={add3(ROUTER, [0, 0.08, 0])} t={t} t0={ev('routerBoom')} n={8} size={0.022} rise={0.45} spread={0.06} /></>,
      cam: mv({pos: add3(ROUTER, [0.6, 0.2, 0.55]), look: add3(ROUTER, [0, 0.1, 0]), fov: 44}, lt, {push: 0.2, arrive: 0.1, shake: u > 0 && u < 0.18 ? 0.012 : 0}), bg: NIGHT};
  },
  charge: (t, lt, C) => {
    // low angle: the culprit hovers over the dead router, scowling; the plate drops on the charge word; then it bolts out of the window
    const w = gamer(C, t); const p = t < ev('boltOut') ? add3(ROUTER, [0.01, 0.12, -0.02]) : zapOut(t);
    return {node: <>{room(t)}<P o={w} /><Zap position={p} scale={0.24} yaw={Math.PI / 2 - 0.2} t={t} />
      <Puffs at={add3(ROUTER, [0, 0.08, 0])} t={t} t0={ev('routerBoom')} n={6} size={0.022} rise={0.4} spread={0.05} /></>,
      cam: mv({pos: add3(ROUTER, [0.62, 0.14, 0.5]), look: add3(ROUTER, [-0.05, 0.3, -0.05]), fov: 50}, lt, {push: 0.1, arrive: 0.1, shake: t > ev('plate') && t < ev('plate') + 0.25 ? 0.01 : 0, roll0: 4, roll: -2}), bg: NIGHT};
  },
  phone: (t, lt, C) => {
    // his POV on the dead screen; the 3D phone slides up, the thumb presses (the 191 screen takes over in the 2D layer)
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [SEAT[0] - 0.05, 1.18, SEAT[2]], look: [DESK.x - 0.2, DESK.top + 0.28, DESK.z + 0.05], fov: 52}, lt, {push: 0.08, arrive: 0});
    void C; return {node: <>{room(t)}<Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: NIGHT};
  },
  throttle: (t, lt) => {
    // low on the road: ten cars, wheels spinning, smoke; a 6-frame insert of a boot stamping the pedal flat
    const pu = t - ev('pedal'); const insert = pu > 0 && pu < 0.2;
    if (insert) { const k = sm(pu / 0.05); return {node: <group>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.2, 0.02, 1.2]} /><meshLambertMaterial color="#5A6068" /></mesh>
      <mesh position={[0, 0.5, -0.25]}><boxGeometry args={[1.2, 0.25, 0.04]} /><meshLambertMaterial color="#2A2E34" /></mesh>
      <group position={[0, 0.42, -0.12]} rotation={[-0.75 + 0.55 * k, 0, 0]}><mesh position={[0, 0.11, 0]}><boxGeometry args={[0.1, 0.22, 0.025]} /><meshStandardMaterial color="#C9CED6" metalness={0.6} roughness={0.35} /></mesh>
        {[0.04, 0.09, 0.14, 0.19].map((y) => <mesh key={y} position={[0, y, 0.014]}><boxGeometry args={[0.09, 0.008, 0.004]} /><meshLambertMaterial color="#2A2E34" /></mesh>)}</group>
      <group position={[0, 0.62 - 0.14 * k, 0.02 + 0.03 * k]} rotation={[0.3 + 0.4 * k, 0, 0]}>
        <mesh position={[0, 0, -0.04]}><boxGeometry args={[0.12, 0.09, 0.3]} /><meshLambertMaterial color="#3A2A20" /></mesh>
        <mesh position={[0, 0.2, 0.08]}><boxGeometry args={[0.11, 0.32, 0.11]} /><meshLambertMaterial color="#2F3F5E" /></mesh></group>
      <hemisphereLight args={['#E8EEF8', '#3A3A44', 1.6]} /><pointLight position={[0.5, 1.2, 0.8]} color="#FFFFFF" intensity={5} distance={4} />{strobe(t, [0.4, 1.0, 0.6], 6)}</group>,
      cam: mv({pos: [0.42, 0.88, 0.62], look: [0, 0.5, -0.05], fov: 44}, pu, {push: 0.2, shake: 0.006}), bg: {color: '#2A2E34'}}; }
    return {node: <><Street t={t} />{carsOnStreet(t)}{CARS.map(([x, z], i) => <Puffs key={i} at={[x - 1.15, 0.15, z]} t={t} t0={ev('tyres') + i * 0.04} n={6} size={0.35} color="#D8DCE0" rise={0.8} spread={0.9} life={0.9} seed={i} />)}
      {strobe(t, [2, 2.4, 0], 16)}</>,
      cam: mv({pos: [9.5, 1.3, 4.2], look: [-6, 0.9, -0.4], fov: 46}, lt, {arrive: 0.12, side: -0.6, push: 0.12, roll0: 3, shake: 0.008}), bg: NIGHT};
  },
  liftoff: (t, lt) => {
    // scale shot: wheels fold flat, jets light, the ten cars lift off over the street; the houses shrink below
    const y = rise(t);
    return {node: <><group position={[0, 0, -10]}><Town t={t} /></group><Street t={t} />{carsOnStreet(t, true)}{strobe(t, [-6, 3 + y, 0], 20)}</>,
      cam: mv({pos: [18, 16 + y * 0.6, 20], look: [-8, 2 + y * 0.8, -1], fov: 56}, lt, {push: -0.05, arrive: 0.12, roll: -4}), bg: NIGHT};
  },
  chase: (t, lt) => {
    // behind the formation high over the town, the bolt zigzagging away ahead; at the end the camera punches through a cloud
    const u = t - ev('cloud'); const zx = Math.sin(t * 4) * 5; const fly = (t - sh('chase').t0) * 26;
    return {node: <><group position={[0, -40, fly - 60]}><Town t={t} /></group>
      {FORM.map((p, i) => <PoliceCar key={i} t={t} seed={i} position={[p[0], p[1] + bob(t, i), p[2]]} yaw={Math.PI / 2} fold={1} jet={1} pitch={0.05} roll={Math.sin(t * 2 + i) * 0.1} />)}
      <Zap position={[zx, 3, -34]} scale={5} t={t} roll={Math.sin(t * 4 + 1) * 0.3} />
      <Clouds center={[0, 6, -40]} size={[70, 10, 20]} n={22} r={6} color="#5A6272" seed={3} />
      {u > -0.05 && u < 0.15 && <Clouds center={[0, 5, 16 - (u + 0.05) * 60]} size={[14, 6, 3]} n={18} r={3} color="#E6E9EE" seed={9} />}
      {strobe(t, [0, 3, 2], 20)}</>,
      cam: mv({pos: [1, 5.5, 18], look: [0, 3.2, -20], fov: 56}, lt, {push: 0.12, arrive: 0.1, roll: -3}), bg: {color: '#2A3346', fog: ['#2A3346', 40, 160]}};
  },
  stormHit: (t, lt) => {
    // inside the rain cloud: the formation dodges; the bolt whips round and fries one car — black, smoking, still flying
    const u = t - ev('carHit'); const hitI = 4; const zp: V3 = [9, 6, -6];
    return {node: <><Clouds center={[-24, 0, -4]} size={[16, 24, 40]} n={14} r={5} color="#4A5160" seed={5} /><Clouds center={[24, 0, -4]} size={[16, 24, 40]} n={14} r={5} color="#4A5160" seed={6} /><Clouds center={[0, -14, -4]} size={[50, 6, 40]} n={14} r={6} color="#3E4553" seed={7} /><Clouds center={[0, 4, 30]} size={[50, 20, 8]} n={12} r={6} color="#4A5160" seed={12} /><Rain center={[0, 2, 4]} size={[20, 14, 16]} t={t} n={160} />
      {FORM.map((p, i) => <PoliceCar key={i} t={t} seed={i} position={[p[0] + Math.sin(t * 5 + i) * 0.6, p[1] + bob(t, i), p[2]]} yaw={-Math.PI / 2} fold={1} jet={1} roll={Math.sin(t * 5 + i) * 0.25} burnt={i === hitI && u > 0 ? 1 : 0} />)}
      <Zap position={zp} scale={4} t={t} yaw={-0.6} face={u > -0.3 && u < 0.4 ? 'shout' : 'angry'} />
      {u > 0 && u < 0.15 && <Strike a={add3(zp, [0.4, 2, 0])} b={[FORM[hitI][0], FORM[hitI][1] + 1, FORM[hitI][2]]} t={t} amp={0.6} w={0.18} />}
      <Puffs at={[FORM[hitI][0], FORM[hitI][1] + 1.2, FORM[hitI][2]]} t={t} t0={ev('carHit')} n={10} size={0.5} color="#2A2A2E" rise={2.5} spread={1.2} life={1} />
      {strobe(t, [0, 3, 0], 20)}<hemisphereLight args={['#9AA6BC', '#2A2E36', 0.9]} /></>,
      cam: mv({pos: [-1.5, 3.2, -12.5], look: [1.5, 1.5, 4], fov: 58}, lt, {push: 0.1, arrive: 0.1, roll0: -4, roll: 6, shake: u > 0 && u < 0.2 ? 0.08 : 0.01}), bg: STORM};
  },
  jump: (t, lt, C) => {
    // beside the lead car: the door flies open and the officer in the yellow rubber suit dives out, giant cuffs first. No parachute.
    const u = t - ev('jump'); const door = sm(u / 0.12);
    const J = C.rubber; hideProps(J); const go = Math.max(0, u - 0.05);
    const pos: V3 = [0.35 + go * 1.5, 0.5 + go * 0.8 - 2.2 * go * go, 1.1 + go * 3.2];
    const s = ps('rubber', pos[0], pos[2], 0.3, t, {clip: 'idle_angry_01', face: 'wide'}); const w = body(J, s, t, pos[1], 0.9 * sm(go / 0.25)); resetTurn(J);
    ik(J, 'R', V(-14, 150, 38), V(-0.3, 1, 0), 1); ik(J, 'L', V(14, 150, 38), V(0.3, 1, 0), 1); fingers(J, 'R', 'fist', 1); fingers(J, 'L', 'fist', 1); w.updateMatrixWorld(true);
    const hR = bw(J, 'Bip01_R_Hand'), hL = bw(J, 'Bip01_L_Hand');
    return {node: <><Clouds center={[0, -2, -6]} size={[40, 14, 30]} n={26} r={4} color="#4A5160" seed={7} /><Rain center={[0, 0, 0]} size={[12, 10, 10]} t={t} n={110} />
      <PoliceCar t={t} position={[0, -0.2, 0]} fold={1} jet={1} door={door} roll={0.05} />
      <P o={w} /><InsulCuff position={lerp3(hR, hL, 0.5)} rotation={[0.3, 0.3, 0]} k={1} size={5} tag={false} />{strobe(t, [0, 2, 1], 12)}<hemisphereLight args={['#9AA6BC', '#2A2E36', 1.0]} /></>,
      cam: mv({pos: [4.6, 0.9, 6.0], look: [0.6, 0.6, 1.0], fov: 54}, lt, {push: 0.14, arrive: 0.12, side: 0.8, roll0: 8, roll: -2}), bg: STORM};
  },
  cuffECU: (t, lt) => {
    // the insulated cuff snaps round the bolt's waist — sparks bounce off the rubber
    const k = pop((t - ev('cuff')) / 0.25); const zp: V3 = [0.1, -0.4, 0];
    return {node: <><Clouds center={[0, 0, -8]} size={[30, 12, 10]} n={18} r={3} color="#4A5160" seed={2} /><Rain center={[0, 0, 1]} size={[4, 4, 3]} t={t} n={60} len={0.3} />
      <Zap position={zp} scale={1.0} t={t} cuffed={t > ev('cuff') - 0.04 ? Math.max(0.05, k) : 0} face="shout" />
      <Sparks7 at={add3(zp, [ZAP_WAIST[0] * 1.0, ZAP_WAIST[1] * 1.0, 0.05])} t={t} t0={ev('cuff')} dur={0.45} n={24} speed={1.1} /><hemisphereLight args={['#9AA6BC', '#2A2E36', 1.0]} /></>,
      cam: mv({pos: [0.65, 0.2, 1.7], look: [0.25, 0.05, 0], fov: 44}, lt, {push: 0.24, shake: t > ev('cuff') && t < ev('cuff') + 0.12 ? 0.02 : 0, roll0: -5}), bg: STORM};
  },
  midair: (t, lt, C) => {
    // hero shot: officer and cuffed bolt falling together, nine cars circling with sirens, lightning behind
    const fall = (t - sh('midair').t0) * 2.4; const c: V3 = [0, 4 - fall, 0];
    const J = C.rubber; hideProps(J); const s = ps('rubber', c[0] - 0.55, c[2] + 0.1, Math.PI / 2, t, {clip: 'idle_angry_01', face: 'wide'}); const w = body(J, s, t, c[1] - 0.6, 0.2, 0.2); resetTurn(J);
    const waist = add3(c, [ZAP_WAIST[0] * 1.6, ZAP_WAIST[1] * 1.6, 0]);
    ik(J, 'R', V(-10, 130, 40), V(0, 0, 1), 0.8); ik(J, 'L', V(10, 110, 40), V(0, 0, 1), 0.8); fingers(J, 'R', 'fist', 1); fingers(J, 'L', 'fist', 1); w.updateMatrixWorld(true); void waist;
    const ring = Array.from({length: 9}, (_, i) => { const a = t * 1.1 + i * Math.PI * 2 / 9; return <PoliceCar key={i} t={t} seed={i} position={[Math.cos(a) * 9, c[1] + 1 + Math.sin(a * 2) * 1.2, Math.sin(a) * 9]} yaw={-a} roll={0.35} fold={1} jet={1} burnt={i === 4 ? 1 : 0} />; });
    const far = Math.floor(t * 30) % 11 === 0;
    return {node: <><Clouds center={[0, 2, -30]} size={[90, 26, 20]} n={30} r={7} color="#4A5160" seed={8} />{ring}
      <Zap position={c} scale={1.6} t={t} cuffed={1} face="angry" /><P o={w} />
      {far && <Strike a={[-20, 30, -40]} b={[-14, 0, -40]} t={t} amp={1.5} w={0.4} />}
      <SirenLights t={t} position={[0, c[1] + 2, 3]} power={26} /><hemisphereLight args={['#9AA6BC', '#2A2E36', 0.9]} /></>,
      cam: mv({pos: [1.6, c[1] - 1.6, 4.4], look: [0, c[1] + 1.0, 0], fov: 58}, lt, {push: 0.1, arrive: 0.1, roll0: 6, roll: -4}), bg: STORM};
  },
  interro: (t, lt, C) => ({node: interroRoom(t, C, 'wide'), cam: mv({pos: [0, 1.48, 2.0], look: [0, 1.05, -0.6], fov: 50}, lt, {push: 0.08, arrive: 0.1})}),
  glare: (t, lt, C) => ({node: interroRoom(t, C, 'glare'), cam: mv({pos: add3(ZT, [0.08, 0.4, 1.15]), look: add3(ZT, [0.1, 0.3, 0]), fov: 40}, lt, {push: 0.22})}),
  zap: (t, lt, C) => {
    const u = t - ev('zap');
    return {node: interroRoom(t, C, 'zap'), cam: mv({pos: [0.62, TABLE_TOP + 0.42, 1.05], look: [0.18, TABLE_TOP + 0.22, 0.08], fov: 46}, lt, {push: 0.12, arrive: 0.1, shake: u > 0 && u < 0.3 ? 0.02 : 0})};
  },
  blackFaces: (t, lt, C) => ({node: interroRoom(t, C, 'faces'), cam: mv({pos: [0, 1.62, 1.55], look: [0, 1.6, -0.9], fov: 44}, lt, {push: 0.05, arrive: 0.06})}),
  court: (t, lt, C) => {
    // frontal: the judge in a safety helmet over his wig; the cuffed bolt on a rubber mat on the dock; a rubber-wrapped gavel
    const I = C.judge; hideProps(I); const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.2, 0.6]}); const w = body(I, s, t, 0.5);
    headProp(I, 'hat', makeHardHat).visible = true;
    const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 1, 3], [0, 0, Math.PI / 2]); g.visible = true;
    const u = t - ev('gavel'); const lift = u < -0.25 ? 0 : u < 0 ? sm((u + 0.25) / 0.25) : Math.max(0, 1 - u / 0.07);
    rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.6 - lift * 0.9, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.5 - lift * 0.5, I.root); w.updateMatrixWorld(true);
    return {node: <><Court t={t} /><P o={w} /><RubberMat position={[0, 1.04, 0.6]} w={0.56} d={0.56} /><Zap position={[-0.05, 1.07, 0.6]} scale={0.36} t={t} cuffed={1} />
      {u > 0.03 && u < 0.5 && <Stars center={add3(bw(I, 'Bip01_R_Hand'), [0, -0.05, 0.1])} t={t * 3} r={0.08} size={0.03} />}</>,
      cam: mv({pos: [0, 1.95, 3.3], look: [0, 1.35, -1.5], fov: 44}, lt, {push: 0.12, arrive: 0.1, shake: u > 0 && u < 0.12 ? 0.02 : 0})};
  },
  cell18: (t, lt) => ({node: <Block t={t} />, cam: mv({pos: [CX.c18, 1.5, 4.6], look: [CX.c18, 1.15, 0], fov: 46}, lt, {push: 0.1, arrive: 0.12, side: -0.4, shake: t > ev('cellDoor') && t < ev('cellDoor') + 0.15 ? 0.015 : 0}), bg: CELL_BG}),
  barJump: (t, lt) => {
    // the bolt leaps onto the bars and runs along the iron rail into cell 19, straight into the fan
    const u = cl((t - ev('barJump')) / 0.55);
    return {node: <><Block t={t} inCell={t < ev('barJump')} />
      {t >= ev('barJump') && u < 1 && <Bolt a={pathAt(Math.max(0, u - 0.18))} b={pathAt(u)} t={t} n={7} amp={0.05} w={0.03} />}
      {t >= ev('barJump') && u < 1 && <Glow p={pathAt(u)} c="#FFE07A" s={0.9} o={0.8} />}
      {t >= ev('barJump') && u < 1 && <pointLight position={pathAt(u)} color="#FFE07A" intensity={4} distance={3} decay={1.5} />}</>,
      cam: mv({pos: [-1.5, 1.75, 6.6], look: [-1.5, 1.1, 0.4], fov: 62}, lt, {push: 0.06, arrive: 0.1, side: 0.8}), bg: CELL_BG};
  },
  fanPlug: (t, lt) => ({node: <><Block t={t} inCell={false} /><Sparks7 at={PANEL_W} t={t} t0={ev('plugIn')} dur={0.6} n={18} speed={0.9} /></>,
    cam: mv({pos: [0.62, 1.12, 0.62], look: [0.22, 1.0, -0.3], fov: 48}, lt, {push: 0.12, arrive: 0.1, shake: 0.004}), bg: CELL_BG}),
  dial: (t, lt) => {
    // ECU on the control box: the old buttons pop off, a digital readout races up to "เบอร์ 3,000" on the word
    const k = cl((t - (ev('dial') - 1.35)) / 1.35);
    return {node: <><Block t={t} inCell={false} />
      <group position={FAN_C} rotation={[0, FAN_YAW, 0]}>
        <FlyingButtons position={[0, PANEL.y, PANEL.z + 0.004]} t={t} t0={sh('dial').t0 + 0.15} />
        {t > sh('dial').t0 + 0.35 && <Readout position={[0, PANEL.y + 0.02, PANEL.z + 0.03]} k={k} w={0.15} />}
      </group></>,
      cam: mv({pos: add3(PANEL_W, [0.1, 0.06, 0.5]), look: add3(PANEL_W, [0, 0.03, 0]), fov: 40}, lt, {push: 0.12, shake: t > ev('dial') && t < ev('dial') + 0.2 ? 0.004 : 0.002}), bg: CELL_BG};
  },
  blowDurian: (t, lt) => {
    // the fan swings round to cell 20 and blasts the durian's smell through the wall and the roof
    const k = sm((t - ev('blow')) / 0.3);
    return {node: <><Block t={t} inCell={false} />
      <Wind path={[[FAN_C[0] + 0.2, 1.2, FAN_C[2]], [1.6, 1.2, -0.2], [CX.c20 - 0.2, 0.6, -0.4]]} t={t} n={34} speed={3} len={0.25} w={0.014} spread={0.25} />
      {[0, 1, 2, 3].map((i) => <Smell key={i} from={[CX.c20 - 0.1, 0.3, -0.4]} to={[CX.c20 + 0.6 + i * 0.5, 4.5, -0.8 - i * 0.3]} t={t} k={k * 1.5} n={3} amp={0.18} w={0.05} speed={2.5} seed={i * 5} />)}</>,
      cam: mv({pos: [1.6, 1.6, 4.6], look: [1.6, 1.0, -0.2], fov: 60}, lt, {push: 0.12, shake: 0.025, roll0: -4, roll: 4}), bg: CELL_BG};
  },
  prisonTop: (t, lt) => {
    // top-down over the prison: the green smell rolls out over the town; the camera pulls up fast, through a cloud
    const L = t - sh('prisonTop').t0, D = sh('prisonTop').t1 - sh('prisonTop').t0; const h = 22 + L * 45; const r = 6 + L * 70;
    const end = D - L;
    return {node: <><TownTop /><SmellCloud r={r} t={t} n={160} y={3} size={5} />
      {end < 0.17 && <Clouds center={[0, h - 4 + (0.17 - end) * 18, 1]} size={[30, 2, 40]} n={22} r={6} color="#EEF1F4" seed={11} />}</>,
      cam: {pos: [0, h, 3 + h * 0.08], look: [0, 0, 0], fov: 52, roll: L * 0.06}, bg: {color: '#CFD9E0'}};
  },
  thailand: (t, lt) => {
    // the whole of Thailand from orbit: the smell spreads from the prison pin to all 77 provinces and stops at the border
    const t0 = sh('thailand').t0; const front = Math.pow(cl((t - t0) / (ev('cover') - t0)), 0.85);
    return {node: <ThailandMap t={t} front={front} />, cam: mv({pos: [0.55, 25, 2.6], look: [0.55, 0, -0.05], fov: 40}, lt, {push: 0.05, arrive: 0.08, roll: 1.5}), bg: {color: '#16283A'}};
  },
  alert: (t, lt, C) => {
    // back in his dark room, his POV; the phone slides up with the national alert. The last 15 frames freeze.
    const tEnd = TOTAL / FPS - 0.5; const tt = Math.min(t, tEnd); const L = Math.min(lt, tEnd - sh('alert').t0);
    const k = sm((L * 30) / 5);
    const c = mv({pos: [SEAT[0] - 0.05, 1.18, SEAT[2]], look: [DESK.x - 0.2, DESK.top + 0.25, DESK.z + 0.05], fov: 48}, L, {push: 0.05, arrive: 0});
    void C; return {node: <>{room(tt)}<AlertPhone cam={c.pos} look={c.look} k={k} dist={0.46} /></>, cam: c, bg: NIGHT};
  },
};
void Flames; void rot; void hash;
