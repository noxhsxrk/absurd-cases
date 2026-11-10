import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {resetTurn, toLocal, rot, ik, fingers} from '../../pov/acting/ik';
import {tex, F, M, MB} from '../../pov/lib/tex';
import {ev, V3, sm, lerp3, pop, SHOTS, TOTAL, FPS} from './data';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {Bedroom, Interro, Court, Cell, TABLE_TOP, BED_TOP} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {PrisonOutside} from '../AbsurdEp3/props';
import {Phone3D, Stars} from '../AbsurdEp4/props';
import {PrisonGate} from '../AbsurdEp6/props';
import {Village} from '../AbsurdEp8/village';
import {camMove, SirenLights, Cam, MoveOpts} from '../absurdkit';
import {Router, Tower5G, SteelBox, Led} from './props';

/** EP10 คดีเราเตอร์ Wi-Fi. The offender is a home router: LEDs = its face, antennas = its arms, Wi-Fi waves = its voice. */
type Inst = any; type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;

// ---- people (same staging helpers as EP1–9)
type PSo = {clip?: string; moving?: boolean; lookW?: V3; face?: string; poseId?: string; odo?: number};
const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...(POSES as any)[o.poseId ?? 'stand']({t, phase: 0, talking: false, seed: id.length, speed: 0} as any), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: false,
    odo: o.odo ?? (o.moving ? t * 1.4 : 0), poseId: o.poseId ?? 'stand', talkK: 0, fear: 0, clip: o.clip, lookW: o.lookW, face: o.face} as any;
};
const wraps = new Map<Inst, THREE.Group>();
const body = (I: Inst, s: any, t: number, y = 0, rx = 0): THREE.Group => {
  let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, y, s.z); w.rotation.set(rx, s.yaw, 0, 'YXZ'); w.scale.setScalar(I.scale); w.updateMatrixWorld(true);
  if (s.lookW) s.pose.lookL = new THREE.Vector3(...toLocal(I, s, s.lookW) as any);
  drive(I, s, t); w.updateMatrixWorld(true);
  if (s.face) setFace(I, s.face); else autoFace(I, t, {talk: 0, fear: 0, seed: s.id.length * 3.1});
  return w;
};
const bw = (I: Inst, bone: string): V3 => { const v = I.bones[bone].getWorldPosition(new THREE.Vector3()); return [v.x, v.y, v.z]; };
const P: React.FC<{o: THREE.Object3D}> = ({o}) => <primitive object={o} />;
const attached = new WeakMap<Inst, Record<string, THREE.Object3D>>();
const prop = (I: Inst, key: string, bone: string, make: () => THREE.Object3D, p: V3, r: V3) => {
  let a = attached.get(I); if (!a) { a = {}; attached.set(I, a); }
  if (!a[key]) { const o = make(); o.position.set(...p); o.rotation.set(...r); I.bones[bone].add(o); a[key] = o; }
  a[key].visible = true; return a[key];
};
const hideProps = (I: Inst) => { const a = attached.get(I); if (a) Object.values(a).forEach((o) => { o.visible = false; }); };
const loc = (I: Inst, s: any, w: V3) => new THREE.Vector3(...(toLocal(I, s, w) as any));
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** a phone held in the fist (bone space is cm), screen toward the holder's face */
const makePhone = () => { const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 15, 7.5), new THREE.MeshStandardMaterial({color: '#1B232C', roughness: 0.4})); b.position.set(6, 0, 0); g.add(b);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 13.5), new THREE.MeshBasicMaterial({color: '#BFE0FF', toneMapped: false})); s.position.set(5.4, 0, 0); s.rotation.y = -Math.PI / 2; g.add(s);
  g.traverse((o: any) => { if (o.isMesh) o.castShadow = true; }); return g; };

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.01; c.far = 600; c.updateProjectionMatrix();
  return null;
};
const mv = (base: Cam, lt: number, o: MoveOpts = {}) => camMove(base, lt, {arrive: 0.1, push: 0.11, ...o});
const NIGHT: Bg = {color: '#10141C'}, DARK: Bg = {color: '#1A1E22'}, SKY: Bg = {color: '#BFD6E4'};
const strike = (t: number, t0: number, up = 0.3) => { const u = t - t0; return u < -up ? 0 : u < -0.1 ? sm((u + up) / (up - 0.1)) : u < 0 ? 1 - (u + 0.1) / 0.1 : u < 0.15 ? 0.12 * Math.sin((u / 0.15) * Math.PI) : 0; };
const wobble = (t: number, hits: number[], amp = 0.05) => hits.reduce((a, h) => { const u = t - h; return u > 0 ? a + amp * Math.exp(-u * 7) * Math.sin(u * 38) : a; }, 0);
const near = (t: number, hits: number[], d = 0.12) => hits.some((h) => t > h && t < h + d);

// =====================================================================================================
// BEDROOM (EP1, night): he lies in bed watching clips; the router sits on the nightstand, LEDs facing the bed
// =====================================================================================================
const NS: V3 = [1.25, 0.54, -1.72];
const NS_YAW = -1.15;
const HEAD: V3 = [0.12, 0.78, -1.82];
const PHONE: V3 = [0.16, 1.16, -1.42];
const bedLed = (t: number): Led => t < ev('oneBar') ? 'ok' : t < ev('red') ? 'weak' : t < sh('raid').t0 ? 'red' : 'blink';
const bedWaves = (t: number) => t < ev('oneBar') ? 1 : t < ev('red') ? 0.35 : 0;
const bedRouter = (t: number, o: {tied?: number; jolt?: number; scale?: number} = {}) => <Router position={NS} yaw={NS_YAW} scale={o.scale ?? 1.6} t={t} led={bedLed(t)} waves={bedWaves(t)} tied={o.tied ?? 0} jolt={o.jolt ?? 0} />;
/** him lying on his back, phone held up in both hands; `look` turns his head; `point` swings his left arm out at the router */
const lying = (C: Cast, t: number, o: {face?: string; look?: V3; point?: number; phone?: boolean} = {}) => {
  const I = C.nai; hideProps(I);
  const s = ps('nai', 0.12, -0.22, 0, t, {clip: 'idle_neutral_01', face: o.face ?? 'half', lookW: o.look});
  const w = body(I, s, t, BED_TOP + 0.13, -Math.PI / 2); resetTurn(I);
  fingers(I, 'R', 'fist', 1);
  if (o.phone !== false) {
    const bob = Math.sin(t * 1.7) * 0.01;
    ik(I, 'R', loc(I, s, [PHONE[0] + 0.05, PHONE[1] - 0.05 + bob, PHONE[2] + 0.03]), V(0.5, 0, -1), 1);
    prop(I, 'phone', 'Bip01_R_Hand', makePhone, [6, 0, 2], [0, 0, 0]);
  }
  const pk = o.point ?? 0;
  if (pk > 0.01) { fingers(I, 'L', 'point', 1); const jab = Math.sin(t * 16) * 0.02;
    ik(I, 'L', loc(I, s, [0.62 + jab, 0.95, -1.62]), V(0, -1, 0), pk); }
  else if (o.phone !== false) { fingers(I, 'L', 'fist', 1); ik(I, 'L', loc(I, s, [PHONE[0] - 0.07, PHONE[1] - 0.06, PHONE[2] + 0.03]), V(-0.5, 0, -1), 1); }
  w.updateMatrixWorld(true); return w;
};
const bedroom = (t: number) => <><Bedroom st={{t, lamp: 0.25, made: false}} />
  <mesh castShadow receiveShadow position={[0.12, 0.69, -0.62]} scale={[0.78, 0.13, 0.62]} material={M('#5E8FA6', 0.95)}><sphereGeometry args={[1, 18, 12]} /></mesh></>;
/** phone glow on his face */
const PhoneGlow = () => <pointLight position={[PHONE[0], PHONE[1] - 0.12, PHONE[2]]} color="#A8CCF0" intensity={0.7} distance={1.1} decay={1.6} />;

// Cyber Police: three officers burst in through the door (east wall) and pin the router on the nightstand
const CY: [string, V3, number][] = [['cyb1', [1.45, 0, -1.05], Math.PI + 0.3], ['cyb2', [0.75, 0, -0.35], Math.PI * 0.85], ['cyb3', [1.75, 0, -0.2], Math.PI + 0.6]];
const DOOR_IN: V3 = [2.4, 0, 1.2];
const cyberIn = (C: Cast, t: number, o: {pin?: boolean; pull?: number} = {}) => CY.map(([id, at, yaw], i) => {
  const I = C[id]; hideProps(I);
  const k = sm((t - ev('door') - 0.05 - i * 0.09) / 0.45);
  const p = lerp3(add3(DOOR_IN, [0, 0, i * 0.25]), at, k); const running = k > 0 && k < 1;
  const yy = running ? Math.atan2(at[0] - DOOR_IN[0], at[2] - DOOR_IN[2]) : yaw;
  const s = ps(id, p[0], p[2], yy, t, {moving: running, odo: k * 3, clip: running ? 'run_neutral_01' : 'idle_angry_01', lookW: add3(NS, [0, 0.1, 0]), face: 'angry'});
  const w = body(I, s, t); resetTurn(I);
  if (i === 0 && k >= 1 && (o.pin || o.pull !== undefined)) {
    // cyb1: both hands slam down on the router (pin), then haul the antennas back (pull)
    const up = o.pin ? strike(t, ev('pin'), 0.25) : 0; const pull = o.pull ?? 0;
    fingers(I, 'R', 'flat', 1); fingers(I, 'L', o.pull !== undefined ? 'fist' : 'flat', 1);
    ik(I, 'R', loc(I, s, add3(NS, [0.06, 0.1 + up * 0.3, 0.02])), V(0.6, -1, 0), 1);
    ik(I, 'L', loc(I, s, add3(NS, [-0.04 + pull * 0.05, 0.14 + up * 0.3 + pull * 0.05, -0.12 - pull * 0.12])), V(-0.6, -1, 0), 1);
  }
  w.updateMatrixWorld(true); return <P key={id} o={w} />;
});
const tieK = (t: number) => t < sh('lan').t0 ? 0 : t < ev('tie') ? 0.55 * sm((t - sh('lan').t0) / 0.9) : 0.55 + 0.45 * sm((t - ev('tie')) / 0.25);

// =====================================================================================================
// INTERROGATION (EP1): router on the table facing the lieutenant (offA); a Cyber cop stands by
// =====================================================================================================
const RT_INT: V3 = [0, TABLE_TOP, -0.12];
const lieutenant = (C: Cast, t: number, phone = false) => {
  const I = C.offA; hideProps(I);
  const s = ps('offA', 0, 0.85, Math.PI, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: add3(RT_INT, [0, 0.1, 0])});
  const w = body(I, s, t); resetTurn(I);
  const up = strike(t, ev('slam'), 0.35);
  fingers(I, 'R', 'flat', 1); ik(I, 'R', loc(I, s, [0.24, TABLE_TOP + 0.05 + up * 0.4, 0.3 - up * 0.06]), V(0.6, -1, -0.3), 1);
  if (phone) { fingers(I, 'L', 'fist', 1); prop(I, 'phone', 'Bip01_L_Hand', makePhone, [6, 0, -2], [0, Math.PI, 0]);
    ik(I, 'L', loc(I, s, [-0.08, TABLE_TOP + 0.28, 0.25]), V(-0.6, -1, -0.3), sm((t - ev('noSignal') + 1.2) / 0.3)); }
  setFace(I, t > ev('slam') - 0.35 && t < ev('slam') + 0.45 ? 'shout' : 'angry');
  w.updateMatrixWorld(true); return w;
};
const standby = (C: Cast, t: number) => { const I = C.cyb2; hideProps(I); const s = ps('cyb2', -0.85, 0.2, Math.PI * 0.75, t, {clip: 'idle_neutral_01', lookW: add3(RT_INT, [0, 0.1, 0]), face: 'half'}); return body(I, s, t); };
const interroRoom = (C: Cast, t: number, o: {phone?: boolean} = {}) => {
  const w = lieutenant(C, t, o.phone); const c = standby(C, t);
  return <><Interro t={t} swing={0.3} /><P o={w} /><P o={c} />
    <Router position={RT_INT} scale={1.5} t={t} led="blink" tied={1} jolt={wobble(t, [ev('slam')], 0.04)} /></>;
};

// =====================================================================================================
// COURT (EP1): the router in the dock facing the bench (evidence tag on), the judge can't get on the court Wi-Fi
// =====================================================================================================
const RT_CT: V3 = [0, 1.04, 0.6];
const GAVELS = () => [ev('gavel1'), ev('gavel2'), ev('gavel3'), ev('gavel4'), ev('gavel5'), ev('gavel6')];
const judgeFace = (t: number) => {
  if (t < ev('mad')) return 'half';
  if (GAVELS().some((g) => t > g - 0.03 && t < g + 0.22)) return 'shout';
  const b = ev('mad') + 0.5; if (t > b && t < b + 2 / 30) return 'blink';
  return 'angry';
};
const courtRoom = (C: Cast, t: number) => {
  const I = C.judge; hideProps(I);
  const s = ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: t < ev('mad') ? [0.15, 1.5, -2.9] : [0, 1.2, 0.6], face: judgeFace(t)});
  const w = body(I, s, t, 0.5);
  const phoneUp = t < ev('mad') + 0.15;
  if (phoneUp) { prop(I, 'phone', 'Bip01_L_Hand', makePhone, [6, 0, -2], [0, Math.PI, 0]); fingers(I, 'L', 'fist', 1);
    ik(I, 'L', loc(I, s, [0.12, 1.75, -2.95]), V(-0.6, -1, 0.2), sm((t - sh('court').t0 - 0.15) / 0.35)); }
  prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]);
  const lift = Math.max(...GAVELS().map((g, i) => strike(t, g, i === 0 ? 0.3 : 0.13)));
  const lean = t > ev('mad') ? 0.16 * sm((t - ev('mad')) / 0.2) : 0;
  rot(I.bones.Bip01_Spine1, 1, 0, 0, lean, I.root);
  rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - lift * 1.0, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - lift * 0.6, I.root); w.updateMatrixWorld(true);
  const hop = GAVELS().reduce((a, g) => { const u = t - g; return u > 0 && u < 0.25 ? Math.max(a, Math.sin((u / 0.25) * Math.PI) * 0.04) : a; }, 0);
  return {I, node: <><Court t={t} /><P o={w} /><Router position={add3(RT_CT, [0, hop, 0])} yaw={Math.PI} scale={2.2} t={t} led="blink" tied={1} tag jolt={wobble(t, GAVELS(), 0.03)} /></>};
};

// =====================================================================================================
// prison / street props
// =====================================================================================================
const DAY = () => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.15]} /><directionalLight position={[-10, 20, 12]} color="#FFF1D6" intensity={1.9} /></>;
const DUSK = () => <><hemisphereLight args={['#C9A98E', '#3A3440', 0.85]} /><directionalLight position={[-20, 4, 6]} color="#FFB073" intensity={1.6} /></>;
const signM = (key: string, lines: [string, string][], w = 512, h = 300, bg = '#F6F2E6') => new THREE.MeshBasicMaterial({toneMapped: false, map: tex(key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#152028'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.textAlign = 'center';
  lines.forEach(([txt, col], i) => { g.fillStyle = col; g.font = F(700, i === 0 ? 70 : 46); g.fillText(txt, w / 2, 95 + i * 80); }); })});
let _cv: THREE.MeshBasicMaterial | null = null, _gate: THREE.MeshBasicMaterial | null = null;
const cvM = () => _cv ?? (_cv = signM('ep10-cv', [['รับงาน', '#C8302A'], ['ปล่อยเน็ต ราคาถูก', '#152028'], ['ประสบการณ์ 5 ปี', '#6A6A70']]));
const gateM = () => _gate ?? (_gate = signM('ep10-gate', [['ใช้ 5G แล้ว', '#1C9AAA'], ['ไม่รับ Wi-Fi', '#C8302A'], ['@absurd.cases', '#9A9AA0']]));
/** the router hopping along on its stand like a little job-seeker, a placard on one antenna */
const hopper = (t: number, x: number, z: number, yaw: number, led: Led = 'ok', placard = true) => {
  const hop = Math.abs(Math.sin(t * 9)) * 0.12; const tilt = Math.sin(t * 9) * 0.12;
  return <group position={[x, hop, z]} rotation={[0, yaw, tilt]}>
    <Router t={t} scale={1.6} led={led} />
    {placard && <group position={[0.15, 0.5, -0.1]} rotation={[0, 0, -0.05]}><mesh position={[0, -0.18, 0]} material={MB('#5A4632')}><boxGeometry args={[0.01, 0.4, 0.01]} /></mesh>
      <mesh position={[0, 0.06, 0.006]} material={cvM()}><planeGeometry args={[0.32, 0.19]} /></mesh></group>}
  </group>;
};

// =====================================================================================================
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  bed: (t, lt, C) => {
    // frame 0: night, he lies in bed lit by his phone; the router glows green on the nightstand, waves rising
    const w = lying(C, t, {look: PHONE});
    return {node: <>{bedroom(t)}<P o={w} /><PhoneGlow />{bedRouter(t)}</>,
      cam: mv({pos: [1.85, 1.5, 0.15], look: [0.72, 0.72, -1.6], fov: 54}, lt, {arrive: 0.1, push: 0.09, side: 0.4, roll0: -2, roll: 1}), bg: NIGHT};
  },
  spinner: (t, lt, C) => SHOT_FN.bed(t, lt, C),      // covered by the full-frame ClipScreen
  oneBar: (t, lt, C) => SHOT_FN.bed(t, lt, C),
  grumble: (t, lt, C) => {
    // over the router: he turns his head and grumbles at it, phone still up
    const ang = [ev('grumble') + 0.15, ev('grumble') + 0.75];
    const face = ang.some((g) => t > g && t < g + 0.28) ? 'shout' : 'angry';
    const w = lying(C, t, {look: add3(NS, [0, 0.05, 0]), face});
    return {node: <>{bedroom(t)}<P o={w} /><PhoneGlow />{bedRouter(t)}</>,
      cam: mv({pos: [1.75, 0.74, -1.45], look: [0.2, 0.7, -1.82], fov: 46}, lt, {arrive: 0.1, push: 0.12, side: -0.4, roll0: 3})};
  },
  redLight: (t, lt, C) => {
    // ECU on the LEDs: the internet light snaps to red — it answered back. Small jolt as it does.
    const j = t > ev('red') ? 0.04 * Math.exp(-(t - ev('red')) * 8) * Math.sin((t - ev('red')) * 50) : 0;
    const w = lying(C, t, {look: add3(NS, [0, 0.05, 0]), face: 'angry'});
    const f: V3 = [Math.sin(NS_YAW), 0, Math.cos(NS_YAW)];
    return {node: <>{bedroom(t)}<P o={w} />{bedRouter(t, {jolt: j})}</>,
      cam: mv({pos: add3(NS, [f[0] * 0.85, 0.32, f[2] * 0.85]), look: add3(NS, [f[0] * 0.1, 0.1, f[2] * 0.1]), fov: 36}, lt, {arrive: 0.08, push: 0.12, shake: near(t, [ev('red')], 0.15) ? 0.006 : 0})};
  },
  charge: (t, lt, C) => {
    // he flings a finger at it; the plate drops on "ละทิ้งหน้าที่"
    const w = lying(C, t, {look: add3(NS, [0, 0.05, 0]), face: 'shout', point: sm((t - sh('charge').t0 - 0.1) / 0.18)});
    return {node: <>{bedroom(t)}<P o={w} /><PhoneGlow />{bedRouter(t)}</>,
      cam: mv({pos: [0.62, 1.8, 0.05], look: [0.66, 0.72, -1.75], fov: 60}, lt, {arrive: 0.1, push: 0.12, roll0: -3, shake: near(t, [ev('plate1')], 0.2) ? 0.01 : 0})};
  },
  phone: (t, lt, C) => {
    // his POV: the 3D phone slides up, thumb on 191
    const k = sm((lt * 30) / 5); const th = sm((t - ev('press') + 0.12) / 0.12);
    const c = mv({pos: [0.12, 1.0, -1.5], look: [0.3, 1.3, 0.6], fov: 54}, lt, {push: 0.08, arrive: 0});
    return {node: <>{bedroom(t)}{bedRouter(t)}<Phone3D cam={c.pos} look={c.look} k={k} pressed={t > ev('press')} thumb={th} /></>, cam: c, bg: NIGHT};
  },
  callUI: (t, lt, C) => SHOT_FN.phone(t, lt + 0.5, C),
  raid: (t, lt, C) => {
    // wide from the bed head: the door bursts, the Cyber Police pour in under the strobe
    const d = sm((t - ev('door')) / 0.08);
    const w = lying(C, t, {face: 'wide', look: [2.0, 1.4, 1.0]});
    return {node: <><Bedroom st={{t, lamp: 0.25, made: false, door: d}} /><P o={w} /><PhoneGlow />{bedRouter(t)}{cyberIn(C, t)}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={6} /></>,
      cam: mv({pos: [-1.3, 1.85, -1.9], look: [1.5, 1.0, 0.3], fov: 52}, lt, {arrive: 0.12, push: 0.08, roll0: -4, shake: near(t, [ev('door')], 0.2) ? 0.02 : 0}), bg: NIGHT};
  },
  grab: (t, lt, C) => {
    // "บุกรวบคาโต๊ะ": cyb1 slams both hands down and pins it on the nightstand; stars
    const j = wobble(t, [ev('pin')], 0.08);
    return {node: <><Bedroom st={{t, lamp: 0.25, made: false, door: 1}} />{bedRouter(t, {jolt: j})}{cyberIn(C, t, {pin: true})}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={5} />
      {t > ev('pin') && t < ev('pin') + 0.45 && <Stars center={add3(NS, [0, 0.22, 0])} t={t * 3} r={0.14} size={0.04} />}</>,
      cam: mv({pos: [-0.05, 1.5, -0.65], look: [1.25, 0.8, -1.5], fov: 46}, lt, {arrive: 0.1, push: 0.14, roll0: 4, shake: near(t, [ev('pin')], 0.18) ? 0.02 : 0}), bg: NIGHT};
  },
  lan: (t, lt, C) => {
    // he hauls the antennas back behind its back
    return {node: <><Bedroom st={{t, lamp: 0.25, made: false, door: 1}} />{bedRouter(t, {tied: tieK(t)})}{cyberIn(C, t, {pull: tieK(t) / 0.55})}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={4} /></>,
      cam: mv({pos: [0.15, 1.35, -0.85], look: [1.25, 0.75, -1.6], fov: 42}, lt, {arrive: 0.08, push: 0.15, roll0: -3}), bg: NIGHT};
  },
  tie: (t, lt) => {
    // low ECU behind it: the LAN cable cinches the crossed antennas; the red LED blinks
    const b: V3 = [-Math.sin(NS_YAW), 0, -Math.cos(NS_YAW)]; const sd: V3 = [Math.cos(NS_YAW), 0, -Math.sin(NS_YAW)];
    return {node: <><Bedroom st={{t, lamp: 0.25, made: false, door: 1}} />{bedRouter(t, {tied: tieK(t), jolt: wobble(t, [ev('tie')], 0.04)})}<SirenLights t={t} position={[2.6, 2.0, 1.4]} power={3} /></>,
      cam: mv({pos: add3(NS, [sd[0] * 0.6 + b[0] * 0.25, 0.35, sd[2] * 0.6 + b[2] * 0.25]), look: add3(NS, [b[0] * 0.15, 0.04, b[2] * 0.15]), fov: 40}, lt, {arrive: 0.1, push: 0.12, roll0: 4}), bg: NIGHT};
  },
  interro: (t, lt, C) => ({node: interroRoom(C, t), cam: mv({pos: [0.9, 1.7, 2.5], look: [0, 0.95, -0.1], fov: 42}, lt, {push: 0.09, arrive: 0.1}), bg: DARK}),
  blink: (t, lt, C) => ({node: interroRoom(C, t),
    cam: mv({pos: [0.62, 1.45, 1.1], look: add3(RT_INT, [0, 0.05, 0]), fov: 36}, lt, {push: 0.2, arrive: 0.08, roll0: -3, shake: near(t, [ev('slam')]) ? 0.014 : 0}), bg: DARK}),
  silent: (t, lt, C) => ({node: interroRoom(C, t, {phone: true}),
    cam: mv({pos: [0.32, TABLE_TOP + 0.2, 0.45], look: add3(RT_INT, [0, 0.05, 0]), fov: 38}, lt, {push: 0.16, arrive: 0.08, roll0: 3}), bg: DARK}),
  noSignal: (t, lt, C) => SHOT_FN.silent(t, lt, C),   // covered by the full-frame NoNet screen
  court: (t, lt, C) => {
    // frontal, symmetric from the gallery: the router in the dock; the judge squints at his phone
    const {node} = courtRoom(C, t); return {node, cam: mv({pos: [0, 2.2, 3.4], look: [0, 1.5, -2.6], fov: 44}, lt, {push: 0.12, arrive: 0.1})};
  },
  wifiFail: (t, lt, C) => SHOT_FN.court(t, lt, C),    // covered by WifiFail
  judgeMad: (t, lt, C) => {
    // CU: the judge lowers the phone, glaring at the dock
    const {node} = courtRoom(C, t);
    return {node, cam: mv({pos: [0.1, 2.05, -1.6], look: [0.0, 1.85, -3.25], fov: 36}, lt, {push: 0.22, arrive: 0.06, roll0: 3})};
  },
  gavel: (t, lt, C) => {
    // over the judge's shoulder onto the dock: he hammers, the router hops with every blow
    const {I, node} = courtRoom(C, t);
    return {node: <>{node}{GAVELS().map((g, i) => t > g && t < g + 0.25 ? <Stars key={i} center={add3(bw(I, 'Bip01_R_Hand'), [0, -0.05, 0.1])} t={t * 3} r={0.08} size={0.03} /> : null)}</>,
      cam: mv({pos: [0.15, 1.55, 1.8], look: [0.05, 1.35, -1.5], fov: 50}, lt, {push: 0.06, arrive: 0.06, shake: near(t, GAVELS(), 0.08) ? 0.02 : 0, roll0: 4})};
  },
  gavelRage: (t, lt, C) => {
    // frontal on the bench: three more rage slams, shouting
    const {I, node} = courtRoom(C, t);
    return {node: <>{node}{GAVELS().slice(3).map((g, i) => t > g && t < g + 0.25 ? <Stars key={i} center={add3(bw(I, 'Bip01_R_Hand'), [0, -0.05, 0.1])} t={t * 3} r={0.08} size={0.03} /> : null)}</>,
      cam: mv({pos: [0.15, 2.0, -1.45], look: [0.05, 1.7, -3.25], fov: 42}, lt, {push: 0.15, arrive: 0.1, shake: near(t, GAVELS().slice(3), 0.08) ? 0.018 : 0, roll0: -3})};
  },
  charge2: (t, lt, C) => {
    // the accused in the dock, evidence tag hanging off it (pause-bait); the plate drops
    const {node} = courtRoom(C, t);
    return {node, cam: mv({pos: [0.5, 1.65, -0.75], look: add3(RT_CT, [0.0, 0.1, 0.1]), fov: 34}, lt, {push: 0.12, arrive: 0.08, shake: near(t, [ev('plate2')], 0.2) ? 0.01 : 0})};
  },
  box: (t, lt) => {
    // the cell: the steel box lid slams shut over the router; dust, shake
    const lid = 1 - sm((t - ev('boxShut') + 0.18) / 0.18);
    return {node: <><Cell t={t} days={0} marks={0} /><SteelBox position={[-0.2, 0, -0.6]} lid={lid} /><Router position={[-0.2, 0, -0.6]} scale={1.6} t={t} led="red" tied={1} />
      {t > ev('boxShut') && t < ev('boxShut') + 0.4 && <Stars center={[-0.2, 0.7, -0.6]} t={t * 3} r={0.3} size={0.05} />}</>,
      cam: mv({pos: [0.65, 1.45, 1.3], look: [-0.2, 0.42, -0.6], fov: 42}, lt, {arrive: 0.1, push: 0.12, shake: near(t, [ev('boxShut')], 0.2) ? 0.015 : 0}), bg: {color: '#2A2E33'}};
  },
  guardsNet: (t, lt, C) => {
    // corridor: the lid propped open, Wi-Fi pouring out; two guards glued to their phones, the router's LEDs green again
    const lid = sm((t - ev('lidOpen')) / 0.3) * 0.55;
    const guards = [['offA', [0.35, 0, 2.55], Math.PI + 0.55], ['offB', [-1.25, 0, 2.75], Math.PI - 0.6]].map(([id, at, yaw]: any) => {
      const I = C[id]; hideProps(I); const s = ps(id, at[0], at[2], yaw, t, {clip: 'idle_neutral_01', face: t > ev('guardsNet') ? 'half' : 'open'});
      const w = body(I, s, t); resetTurn(I); prop(I, 'phone', 'Bip01_R_Hand', makePhone, [6, 0, 2], [0, 0, 0]); fingers(I, 'R', 'fist', 1);
      const h = bw(I, 'Bip01_Head'); const f: V3 = [Math.sin(yaw), 0, Math.cos(yaw)];
      ik(I, 'R', loc(I, s, [h[0] + f[0] * 0.3, h[1] - 0.25, h[2] + f[2] * 0.3]), V(0.5, -1, 0), 1); rot(I.bones.Bip01_Head, 1, 0, 0, 0.35, I.root);
      w.updateMatrixWorld(true); return <P key={id} o={w} />; });
    const on = t > ev('guardsNet');
    return {node: <><Cell t={t} days={0.3} marks={0} /><mesh position={[0, 0, 3.2]} rotation={[-Math.PI / 2, 0, 0]} material={M('#8E918B')}><planeGeometry args={[6, 4]} /></mesh>
      <SteelBox position={[-0.45, 0, 2.2]} yaw={0.2} lid={lid} /><Router position={[-0.45, 0.62, 2.2]} yaw={0.2} scale={1.5} t={t} led={on ? 'ok' : 'red'} waves={on ? 1 : 0} />{guards}
      {on && <pointLight position={[-0.45, 1.0, 2.2]} color="#9DE6B0" intensity={0.8} distance={2.5} />}</>,
      cam: mv({pos: [1.2, 1.55, 4.6], look: [-0.45, 0.95, 2.2], fov: 46}, lt, {push: 0.1, arrive: 0.1, side: 0.4}), bg: {color: '#2A2E33'}};
  },
  release: (t, lt) => {
    // prison front, low and wide: the gate, the router set down outside it, a hop of freedom
    const hop = Math.max(0, Math.sin((t - ev('gate') - 0.5) * 7)) * 0.1 * (t > ev('gate') + 0.5 ? 1 : 0);
    return {node: <><PrisonOutside t={t} beam={0.4} /><PrisonGate t={t} /><Router position={[0.3, hop, 2.4]} scale={2.6} t={t} led="ok" />
      <hemisphereLight args={['#DCE8F2', '#5A5446', 1.0]} /><directionalLight position={[-6, 9, 14]} color="#FFF1D6" intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} /></>,
      cam: mv({pos: [1.4, 0.9, 5.6], look: [0.2, 1.0, 1.5], fov: 50}, lt, {push: 0.08, arrive: 0.1, roll0: -2}), bg: SKY};
  },
  jobHunt: (t, lt) => {
    // the village street: it hops along the pavement with a placard — "รับงาน ปล่อยเน็ต"
    const x = -3 + lt * 1.6;
    return {node: <><Village clear={[-8, 8]} />{DAY()}{hopper(t, x, -4.6, Math.PI / 2, 'ok')}</>,
      cam: mv({pos: [x + 2.3, 0.65, -3.9], look: [x, 0.4, -4.6], fov: 46}, lt, {push: 0.06, arrive: 0.1}), bg: SKY};
  },
  tower: (t, lt) => ({node: <><Village clear={[-6, 6]} />{DAY()}<Tower5G position={[30, 0, -13]} yaw={-Math.PI / 2 + 0.35} t={t} />
    <group position={[-3.4, 0, -2.25]} rotation={[0, -Math.PI / 2 - 0.35, 0]}><Router t={t} scale={1.4} led="weak" /></group></>,
    cam: mv({pos: [-5.0, 0.32, -2.0], look: [-1.5, 1.6, -2.6], fov: 62}, lt, {arrive: 0.06, push: 0.05}), bg: SKY}),
  rejected: (t, lt) => {
    // at a gate: the sign says "ใช้ 5G แล้ว · ไม่รับ Wi-Fi"; 5G rings sweep past; its LEDs drop to amber
    const fz = -(3 + 2.6);
    return {node: <><Village clear={[-6, 6]} />{DAY()}<Tower5G position={[14, 0, -26]} t={t} />
      <mesh position={[0.2, 1.05, fz + 0.12]} material={gateM()}><planeGeometry args={[0.7, 0.41]} /></mesh>
      <group position={[0.15, 0.12, fz + 0.55]} rotation={[0, Math.PI, 0]}><Router t={t} scale={1.6} led={t > ev('reject') ? 'weak' : 'ok'} waves={t > ev('reject') ? 0 : 0.6} /></group></>,
      cam: mv({pos: [0.6, 0.55, fz + 2.1], look: [0.15, 0.5, fz], fov: 48}, lt, {arrive: 0.08, push: 0.1, roll0: 2}), bg: SKY};
  },
  lastLight: (t, lt) => {
    // dusk on the kerb: alone, the LEDs die one by one; the last frames hold still
    const tEnd = TOTAL / FPS - 0.6; const tt = Math.min(t, tEnd); const L = Math.min(lt, tEnd - sh('lastLight').t0);
    const alive = tt < ev('led1') ? 4 : tt < ev('led2') ? 3 : tt < ev('led3') ? 2 : tt < ev('led4') ? 1 : 0;
    return {node: <><Village clear={[-6, 6]} />{DUSK()}<group position={[0.4, 0.12, -4.25]} rotation={[0, 0.25, 0]}><Router t={tt} scale={1.6} led="weak" alive={alive} /></group></>,
      cam: mv({pos: [0.15, 0.55, -2.8], look: [0.45, 0.25, -4.3], fov: 40}, L, {push: 0.07, arrive: 0.08}), bg: {color: '#D9A98A'}};
  },
};
void pop;
