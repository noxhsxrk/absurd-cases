import React from 'react';
import * as THREE from 'three';
import {resetTurn, rot} from '../../pov/acting/ik';
import {ev, SHOTS, lerp, cl, shotAt} from './data';
import {Village} from '../AbsurdEp8/village';
import {VillageLife, CourtLife} from '../lifekit/presets';
import {Court} from '../AbsurdEp1/sets';
import {makeGavel} from '../AbsurdEp1/props';
import {StreetLamp, Chickens} from '../lifekit/props';
import {ps, body, bw, hideProps, prop, strike, P, CamRig, mv, near, sm, V3, Cast, ShotOut, hand, headFr, hw, hdir} from '../lifekit/stage';
import {KID_SCALE} from './cast';
import {SunSky, skyColor, dayK, YaiRoom, YAI_CHAIR, PHOTO, Torch, Crib, Baby, BABY_MOUTH, CoffeeBottle, Classroom, BELL, Book, Shears, YawnCam, BanSign, makeTape} from './props';
import {Hall, STAGE_Y, BOSS_AT, SCREEN, TVCAM, SEATS, makeBeard, LivingRoom, SOFA, TV, CAL, TVSet, Tally, Megaphone, Slate, Drawing, StreetClock, HenSign, LeanTree} from './props2';

export {CamRig};
/** ในเมืองนี้ EP1 (หาว). In this town, every yawn sets the sun one hour. A kid tells it: his grandmother has not seen the sun in thirty years.
 *  The town's rules are enforced like a police state (5-minute lessons, books over three pages are illegal, a yawn camera on every lamp post,
 *  tape on yawning mouths, the word "น่าเบื่อ" is banned). The new head's 300-slide live speech makes the whole town yawn: three years of night.
 *  Grandma's secret: a jaw-drop raises the sun. The kid says the forbidden word on live TV; 30,000 jaws drop; the sun stays up three and a half years;
 *  he gets her sentence. Tomorrow the head presents part two.
 *
 *  LAYOUT (metres; yaw 0 faces +z; root +x is the character's LEFT)
 *  room    YaiRoom at the origin: window + three blackout curtains in the back wall (z −1.8), her rocking chair at (0, −0.75) facing +z,
 *          the photo on the +x wall. The kid stands at KID (0.5, 0.35). Cameras stand at +z looking back.
 *  street  EP8 Village x −30…30, road along x (z −3…3), pavements z ±4.6. The sun stands over the −z houses (SUN_AZ): cameras on the +z pavement
 *          looking −z see the houses with the sun above them. The yawner tw2 stands at YW (0.6, 4.3) facing +z.
 *          Lamp + yawn camera at LAMP (2.0, 4.15); the yawner caught under it: tw4 at (2.6, 4.3). The ban sign at (−6, −4.4) facing +z.
 *  nursery / school / office: small rooms at the origin, built in props.tsx; cameras at +z.
 *
 *  TRAPS OF THIS EPISODE (written before the first shot)
 *  1. Yawn vs jaw-drop is the whole story and must read with the sound off: yawn = eyes squeezed shut + huge mouth + tear (face 'yawn' + clip
 *     idle_yawn_01); jaw-drop = saucer eyes + long O (face 'gasp'). Never use the old 'wide'/'shout' for either.
 *  2. Cause and effect in one frame: every sun drop is seen from a camera that also has the yawner (or the yawning town) in it.
 *  3. The sun is far: camera + fixed direction (SunSky). Elevation is a function of t only (sunEl), so it stays right across cuts.
 *  4. The kid is a box character scaled to KID_SCALE with a bigger head: camera heights for him are ~0.7 of an adult's (eye ~1.05).
 *  5. The room is dark: the only light is the leak round the curtains and grandma's torch. Fill must keep the kid's face readable.
 *  6. Nobody yawns in the background unless the plan says so (it would set the sun).
 *  7. Text props carry the handle (the yawn-camera sign); keys start with town1- so nothing from absurd-cases comes back. */
const sh = (name: string) => SHOTS.find((x: any) => x.name === name)!;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---- the sun: elevation in degrees, a function of t only
const notch = (t: number, t0: number, deg: number, d = 0.4) => deg * sm((t - t0) / d);
export const sunEl = (t: number) => {
  if (t < sh('wideEyed').t0) return 28 - notch(t, ev('drop1'), 12) - notch(t, ev('drop2a'), 12) - notch(t, ev('drop2b'), 8);
  if (FLASH.includes(shotAt(t).name)) return -20 + notch(t, ev('dawn30'), 45, 0.6);                       // thirty years ago: five days of night, then the gasp
  return 28 - notch(t, ev('dropU'), 12) - notch(t, ev('dropUnit'), 12) - notch(t, ev('plunge'), 44, 0.8)   // the uncle, the unit man, the whole town
    + notch(t, ev('rise'), 103, 0.9);                                                                        // 30,000 jaws: −28 → 75, and it stays
};
const X0 = -30, X1 = 30;
const town = (t: number, o: {life?: boolean} = {}) => { const el = sunEl(t), night = 1 - dayK(el);
  return <><Village x0={X0} x1={X1} night={night} t={t} />{o.life !== false && <VillageLife t={t} x0={X0} x1={X1} night={night} traffic={false} dog={false} />}<SunSky el={el} /></>; };
const townBg = (t: number) => ({color: skyColor(sunEl(t))});

// ---- people
type GO = {clip?: string; clipT?: number; face?: string; look?: V3; y?: number; sit?: boolean; kid?: boolean; tape?: boolean};
const base = new WeakMap<any, number>(); const tapes = new WeakMap<any, THREE.Object3D>();
const guy = (C: Cast, id: string, x: number, z: number, yaw: number, t: number, o: GO = {}) => { const I = C[id]; hideProps(I); resetTurn(I);
  if (!base.has(I)) base.set(I, I.scale); I.scale = base.get(I)! * (o.kid || id === 'dek' ? KID_SCALE : 1);
  const w = body(I, ps(id, x, z, yaw, t, {clip: o.clip ?? (o.sit ? 'sit_chair_idle_neutral_01' : 'idle_neutral_01'), ...(o.clipT !== undefined ? {clipT: o.clipT} : {}), ...(o.face ? {face: o.face} : {}), ...(o.look ? {lookW: o.look} : {}), ...(o.sit ? {poseId: 'sitIdle'} : {})}), t, o.y ?? 0);
  let tp = tapes.get(I); if (o.tape && !tp) { tp = makeTape(); headFr(I).add(tp); tapes.set(I, tp); } if (tp) tp.visible = !!o.tape;
  return {I, w}; };
/** a yawn that starts at t0: the mocap yawn + the yawn face while the mouth is open (0.15 … 1.5 s in) */
const yawning = (t: number, t0: number) => t > t0 - 0.2 && t < t0 + 2.6 ? {clip: 'idle_yawn_01', clipT: Math.max(0, t - t0 + 0.6), face: t > t0 + 0.05 && t < t0 + 1.6 ? 'yawn' : 'half'} : {};

// =====================================================================================================
// GRANDMA'S ROOM
// =====================================================================================================
const KID: V3 = [0.5, 0, 0.35];
const yai = (C: Cast, t: number, o: GO & {torch?: boolean} = {}) => { const m = guy(C, 'yai', YAI_CHAIR[0], YAI_CHAIR[2] + 0.05, 0, t, {sit: true, face: o.face ?? 'half', y: 0.02, ...o});
  let node: React.ReactNode = null;
  if (o.torch) { const chin = hw(m.I, [0, -2, 13]); const a = add(chin, [-0.02, -0.15, 0.1]); hand(m.I, 'R', add(a, [0, -0.02, 0]), 'fist'); m.w.updateMatrixWorld(true);
    node = <Torch a={bw(m.I, 'Bip01_R_Hand')} dir={[0.05, 1, -0.25]} on={t > ev('torch')} />; }
  return {...m, node: <><P o={m.w} />{node}</>}; };
const room = (t: number) => <><YaiRoom t={t} /><pointLight position={[0.6, 2.0, 1.2]} color="#8A94C8" intensity={0.5} distance={5} decay={1.5} /></>;
const DARK = {color: '#0E0C12'};

// =====================================================================================================
// THE NURSERY, THE SCHOOL, THE OFFICE (small sets at the origin)
// =====================================================================================================
const nursery = (t: number) => <><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6, 6]} /><meshStandardMaterial color="#D9C6A8" /></mesh>
  <mesh position={[0, 1.5, -1.6]} receiveShadow><planeGeometry args={[6, 3]} /><meshStandardMaterial color="#F2D6DC" /></mesh>
  <mesh position={[-1.4, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[6, 3]} /><meshStandardMaterial color="#CFE2EC" /></mesh>
  <Crib position={[0, 0, -0.6]} /><Crib position={[-0.85, 0, -0.6]} />
  <directionalLight position={[2, 4, 3]} intensity={1.6} castShadow /><hemisphereLight args={['#FFF4E8', '#8A7A6A', 0.7]} /></>;
const BABY: V3 = [0, 0.58, -0.6];
const sipK = (t: number) => sm((t - ev('sip') + 0.25) / 0.3) * (1 - sm((t - ev('sip') - 0.9) / 0.3));
const babyMouth = (b: V3, sc = 1.35): V3 => [b[0] - BABY_MOUTH[0] * sc, b[1] + BABY_MOUTH[1] * sc, b[2] - BABY_MOUTH[2] * sc];   // the baby lies yaw π
/** a bottle whose nipple is in the mouth, angled up over the chest; k lifts it (a big swig) */
const bottleAt = (m: V3, k: number, t: number, level: number) => { const th = -(2.35 - 0.25 * k); const d: V3 = [0, Math.cos(th), Math.sin(th)];
  return <CoffeeBottle position={[m[0] - d[0] * 0.2, m[1] - d[1] * 0.2, m[2] - d[2] * 0.2]} rot={[th, 0, 0]} t={t} level={level} />; };
const babies = (t: number) => { const k = sipK(t); const B2: V3 = [-0.85, 0.58, -0.6];
  return <><Baby position={BABY} t={t} yaw={Math.PI} /><Baby position={B2} t={t + 1.3} yaw={Math.PI} />
    {bottleAt(babyMouth(BABY), k, t, 0.85 - 0.3 * sm((t - ev('sip')) / 0.9))}{bottleAt(babyMouth(B2), 0, t + 0.4, 0.45)}</>; };
const school = (t: number) => <><Classroom t={t} left={Math.max(0, ev('bell') - t) * 1.0} ring={t > ev('bell') ? 1 : 0} />
  <directionalLight position={[3, 5, 4]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} /><hemisphereLight args={['#FFF4E8', '#7A6A5A', 0.75]} /></>;
const OFFICE_TOP = 0.76;
const office = (t: number) => { const snipK = sm((t - ev('snip')) / 0.12); const thick = lerp(0.36, 0.014, snipK); const chunkFall = t > ev('snip') ? Math.min(0.76, 4.9 * (t - ev('snip')) ** 2) : 0;
  const stampK = t > ev('stamp') - 0.25 && t < ev('stamp') + 0.5 ? (t < ev('stamp') ? 1 - sm((ev('stamp') - t) / 0.25) : 1 - sm((t - ev('stamp') - 0.15) / 0.3)) : 0;
  return <><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[8, 8]} /><meshStandardMaterial color="#6A6258" /></mesh>
    <mesh position={[0, 1.5, -1.4]} receiveShadow><planeGeometry args={[8, 3]} /><meshStandardMaterial color="#B9C4C0" /></mesh>
    <mesh position={[0, OFFICE_TOP - 0.02, 0]} receiveShadow castShadow><boxGeometry args={[1.4, 0.04, 0.8]} /><meshStandardMaterial color="#8A6A4A" /></mesh>
    <mesh position={[0, OFFICE_TOP / 2 - 0.02, 0]}><boxGeometry args={[1.3, OFFICE_TOP - 0.04, 0.7]} /><meshStandardMaterial color="#6A4E36" /></mesh>
    <Book position={[0.05, OFFICE_TOP, 0.05]} thick={thick} stamped={t > ev('stamp') ? 1 : 0} />
    {t > ev('snip') && chunkFall < 0.76 && <group position={[0.05, OFFICE_TOP + 0.014 - chunkFall, 0.05]} rotation={[0, 0, (t - ev('snip')) * 2]}><mesh position={[0, 0.17, 0]}><boxGeometry args={[0.24, 0.34, 0.32]} /><meshStandardMaterial color="#F2ECD8" /></mesh></group>}
    {stampK > 0 && <group position={[0.05, OFFICE_TOP + 0.03 + 0.4 * (1 - stampK), 0.07]}><mesh position={[0, 0.03, 0]}><boxGeometry args={[0.2, 0.06, 0.08]} /><meshStandardMaterial color="#5A2A1A" /></mesh><mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.025, 0.03, 0.16, 10]} /><meshStandardMaterial color="#2A1A12" /></mesh></group>}
    <directionalLight position={[2, 5, 3]} intensity={1.7} castShadow shadow-mapSize={[2048, 2048]} /><hemisphereLight args={['#F4F1E8', '#6A6258', 0.6]} /></>; };

// =====================================================================================================
// THE STREET
// =====================================================================================================
const YW: V3 = [0.4, 0, -4.2], LAMP: V3 = [2.0, 0, -4.15], CAUGHT: V3 = [2.6, 0, -4.25], SIGN: V3 = [-6, 0, -4.4];
const kidOnPath = (C: Cast, t: number, o: GO = {}) => guy(C, 'dek', -0.7, -3.85, Math.PI / 2 - 0.35, t, {face: 'half', ...o});
const lamps = (t: number, caught: number, pan: number) => <>{[LAMP[0], LAMP[0] + 16, LAMP[0] - 16].map((x, i) => <group key={i}>
  <StreetLamp position={[x, 0, LAMP[2]]} yaw={0} t={t} on={1 - dayK(sunEl(t))} moths={false} h={5.6} />
  <YawnCam position={[x, 4.6, LAMP[2] + 0.06]} pan={i ? 0.3 : pan} caught={i ? 0 : caught} /></group>)}</>;
const towns4: [string, number, number][] = [['tw1', -0.75, 1.0], ['tw3', 0.2, 0.7], ['tw5', 0.75, 1.6], ['tw6', -0.2, 2.2]];

type ShotFn = (t: number, lt: number, C: Cast) => ShotOut;
const WRITTEN: Record<string, ShotFn> = {
  // ---- l001 ยายฉัน / ไม่ได้เห็นดวงอาทิตย์ / มาสามสิบปีแล้ว
  open: (t, lt, C) => { const k = guy(C, 'dek', KID[0], KID[2], -0.35, t, {face: 'half'}); const y = yai(C, t, {torch: true, face: 'half'});
    return {node: <>{room(t)}<P o={k.w} />{y.node}</>, cam: mv({pos: [0.58, 1.1, 1.62], look: [0.28, 0.92, -0.25], fov: 50}, lt, {arrive: 0.06, push: 0.08}), bg: DARK}; },
  curtains: (t, lt, C) => { const y = yai(C, t, {torch: true});
    return {node: <>{room(t)}{y.node}</>, cam: mv({pos: [0.45, 1.5, -0.35], look: [0, 1.5, -1.7], fov: 46}, lt, {arrive: 0.07, push: 0.1}), bg: DARK}; },
  yaiTorch: (t, lt, C) => { const y = yai(C, t, {torch: true});
    return {node: <>{room(t)}{y.node}</>, cam: mv({pos: [0.3, 1.2, 0.55], look: [0.02, 1.13, -0.7], fov: 38}, lt, {arrive: 0.06, push: 0.12}), bg: DARK}; },
  // ---- l002 เพราะในเมืองนี้ / ถ้าคุณหาว / ดวงอาทิตย์จะตกหนึ่งชั่วโมง
  street: (t, lt, C) => { const k = kidOnPath(C, t, {look: [-12, 5, -4]}); const y = guy(C, 'tw2', YW[0], YW[2], Math.PI / 2, t);
    return {node: <>{town(t)}<P o={k.w} /><P o={y.w} /></>, cam: mv({pos: [5.2, 1.35, -3.05], look: [-8, 2.5, -5.6], fov: 54}, lt, {arrive: 0.08, push: 0.07}), bg: townBg(t)}; },
  yawner: (t, lt, C) => { const y = guy(C, 'tw2', YW[0], YW[2], Math.PI / 2, t, yawning(t, ev('yawn1')));
    return {node: <>{town(t)}<P o={y.w} /></>, cam: mv({pos: [1.62, 1.52, -3.95], look: [0.4, 1.55, -4.2], fov: 40}, lt, {arrive: 0.06, push: 0.14}), bg: townBg(t)}; },
  sunDrop: (t, lt, C) => { const y = guy(C, 'tw2', YW[0], YW[2], Math.PI / 2, t, yawning(t, ev('yawn1'))); const k = kidOnPath(C, t, {look: [-12, 4, -4], face: 'half'});
    return {node: <>{town(t)}<P o={y.w} /><P o={k.w} /></>, cam: mv({pos: [3.6, 1.0, -4.0], look: [-10, 3.2, -4.6], fov: 60}, lt, {arrive: 0.05, push: 0.04, shake: near(t, [ev('drop1')], 0.4) ? 0.01 : 0}), bg: townBg(t)}; },
  // ---- l003 หาวสองที / ก็สองชั่วโมง
  yawnTwice: (t, lt, C) => { const y = guy(C, 'tw2', YW[0], YW[2], Math.PI / 2, t, yawning(t, ev('yawn2a')));
    return {node: <>{town(t)}<P o={y.w} /></>, cam: mv({pos: [1.6, 1.1, -3.7], look: [0.4, 1.95, -4.3], fov: 52}, lt, {arrive: 0.06, push: 0.1, shake: near(t, [ev('drop2a')], 0.4) ? 0.01 : 0}), bg: townBg(t)}; },
  sunDrop2: (t, lt, C) => { const y = guy(C, 'tw2', YW[0], YW[2], Math.PI / 2, t, {...yawning(t, ev('drop2b') - 0.45)}); const k = kidOnPath(C, t, {look: [-12, 2, -4]});
    return {node: <>{town(t)}<P o={y.w} /><P o={k.w} /></>, cam: mv({pos: [4.6, 1.55, -2.55], look: [-10, 2.3, -4.6], fov: 62}, lt, {arrive: 0.05, push: -0.05, shake: near(t, [ev('drop2b')], 0.4) ? 0.012 : 0}), bg: townBg(t)}; },
  // ---- l004 ที่นี่เลยไม่มีใครกล้าง่วง
  wideEyed: (t, lt, C) => { const ws = towns4.map(([id, x, z]) => guy(C, id, x, z, Math.atan2(-x * 0.3, 4), t, {face: 'wide'}));
    ws.forEach(({I, w}, i) => { hand(I, 'R', add(hw(I, [0, -14, 22]), [i % 2 ? 0.05 : -0.05, -0.06, 0]), 'cup'); w.updateMatrixWorld(true); });
    return {node: <>{town(t)}{ws.map(({w}, i) => <P key={i} o={w} />)}{ws.map(({I}, i) => { const h = bw(I, 'Bip01_R_Hand'); return <CoffeeBottle key={'c' + i} position={add(h, [0, 0.03, 0.05])} t={t + i} level={0.7} />; })}</>,
      cam: mv({pos: [0.05, 1.5, 4.3], look: [0, 1.45, 1.2], fov: 50}, lt, {arrive: 0.07, push: 0.1}), bg: townBg(t)}; },
  // ---- l005 เด็กทุกคน / ดื่มกาแฟตั้งแต่เกิด
  crib: (t, lt) => ({node: <>{nursery(t)}{babies(t)}</>, cam: mv({pos: [-0.25, 1.55, 0.5], look: [-0.4, 0.72, -0.75], fov: 46}, lt, {arrive: 0.07, push: 0.08}), bg: {color: '#F2D6DC'}}),
  bottle: (t, lt) => ({node: <>{nursery(t)}{babies(t)}</>, cam: mv({pos: [0.05, 1.25, 0.1], look: [0, 0.78, -0.62], fov: 36}, lt, {arrive: 0.06, push: 0.14}), bg: {color: '#F2D6DC'}}),
  // ---- l006 โรงเรียน / เรียนคาบละห้านาที
  school: (t, lt, C) => { const te = guy(C, 'tw6', 0.95, -1.9, -0.35, t, {clip: 'gestic_presentation_right_01', face: 'talk'});
    const kids = [['dek', -1.1, 0.95], ['tw4', 0, 0.95], ['tw8', 1.1, 0.95]].map(([id, x, z]) => guy(C, id as string, x as number, z as number, Math.PI, t, {kid: true, sit: true, face: 'wide'}));
    return {node: <>{school(t)}<P o={te.w} />{kids.map(({w}, i) => <P key={i} o={w} />)}</>, cam: mv({pos: [0.4, 1.35, 2.7], look: [0, 1.25, -1.6], fov: 52}, lt, {arrive: 0.07, push: 0.09}), bg: {color: '#E6DCC2'}}; },
  bell: (t, lt, C) => { const te = guy(C, 'tw6', 0.95, -1.9, -0.35, t, {clip: 'gestic_presentation_right_01', face: t > ev('bell') ? 'wide' : 'talk'});
    return {node: <>{school(t)}<P o={te.w} /></>, cam: mv({pos: [0.35, 1.85, -0.75], look: [1.2, 2.12, -2.36], fov: 44}, lt, {arrive: 0.06, push: 0.12, shake: t > ev('bell') ? 0.006 : 0}), bg: {color: '#E6DCC2'}}; },
  // ---- l007 หนังสือเกินสามหน้า / ผิดกฎหมาย
  book: (t, lt, C) => { const u = guy(C, 'unit1', -0.15, -0.6, 0, t, {face: 'angry'}); const open = t < ev('snip') ? 0.5 + 0.5 * Math.sin(Math.min(1, (t - sh('book').t0) / (ev('snip') - sh('book').t0)) * Math.PI * 1.5) : 0;
    const piv: V3 = [-0.24, OFFICE_TOP + 0.03 + lerp(0.36, 0.014, sm((t - ev('snip')) / 0.12)), 0.05]; hand(u.I, 'R', add(piv, [-0.2, 0.02, 0]), 'fist'); u.w.updateMatrixWorld(true);
    return {node: <>{office(t)}<P o={u.w} /><Shears position={piv} rot={[0, 0, 0]} open={open} size={1.3} /></>, cam: mv({pos: [0.55, 1.12, 2.0], look: [-0.02, 1.1, -0.2], fov: 46}, lt, {arrive: 0.06, push: 0.1, shake: near(t, [ev('snip')], 0.15) ? 0.01 : 0}), bg: {color: '#B9C4C0'}}; },
  illegal: (t, lt) => ({node: <>{office(t)}</>, cam: mv({pos: [0.05, OFFICE_TOP + 0.75, 0.32], look: [0.05, OFFICE_TOP, 0.06], fov: 40}, lt, {arrive: 0.05, push: 0.12, shake: near(t, [ev('stamp')], 0.12) ? 0.012 : 0}), bg: {color: '#B9C4C0'}}),
  // ---- l008 ทุกเสาไฟ / มีกล้องจับหาว
  lamppost: (t, lt, C) => { const k = kidOnPath(C, t, {look: [LAMP[0], 4.5, LAMP[2]]}); const tilt = sm(lt / 1.0);
    return {node: <>{town(t)}{lamps(t, 0, 0.3)}<P o={k.w} /></>, cam: {...mv({pos: [0.2, 1.0, -0.4], look: [1.9, lerp(1.4, 4.4, tilt), -4.15], fov: 54}, lt, {arrive: 0.05, push: 0.05})}, bg: townBg(t)}; },
  camera: (t, lt) => { const pan = lerp(-0.6, 0.25, sm((t - ev('camTurn')) / 0.25));
    return {node: <>{town(t, {life: false})}{lamps(t, t > ev('camTurn') + 0.3 ? 1 : 0, pan)}</>, cam: mv({pos: [2.35, 4.3, -2.75], look: [2.0, 4.35, -3.95], fov: 40}, lt, {arrive: 0.06, push: 0.14}), bg: townBg(t)}; },
  // ---- l009 ใครหาว / โดนแปะเทปกาวที่ปาก
  caught: (t, lt, C) => { const y = guy(C, 'tw4', CAUGHT[0], CAUGHT[2], -0.25, t, yawning(t, ev('yawnSt')));
    return {node: <>{town(t)}{lamps(t, t > ev('flash') ? 1 : 0, -0.25)}<P o={y.w} /></>, cam: mv({pos: [3.05, 0.9, -1.2], look: [2.45, 3.0, -4.2], fov: 60}, lt, {arrive: 0.06, push: 0.08}), bg: townBg(t)}; },
  tape: (t, lt, C) => { const y = guy(C, 'tw4', CAUGHT[0], CAUGHT[2], -0.25, t, {face: t > ev('tape') ? 'wide' : 'yawn', tape: t > ev('tape')});
    const u = guy(C, 'unit2', CAUGHT[0] + 0.62, CAUGHT[2] + 0.12, -1.75, t, {face: 'angry', look: hw(y.I, [0, 6, 10])}); const mouth = hw(y.I, [0, 6.5, 16]);
    const k = cl(1 - Math.abs(t - ev('tape') + 0.05) / 0.3); if (k > 0) { hand(u.I, 'R', add(mouth, [0.12 * (1 - k), -0.05 * (1 - k), 0.04]), 'open'); u.w.updateMatrixWorld(true); }
    return {node: <>{town(t)}{lamps(t, 1, -0.25)}<P o={y.w} /><P o={u.w} /></>, cam: mv({pos: [1.75, 1.58, -2.75], look: [2.65, 1.5, -4.2], fov: 42}, lt, {arrive: 0.06, push: 0.1, shake: near(t, [ev('tape')], 0.12) ? 0.012 : 0}), bg: townBg(t)}; },
  // ---- l010 คำที่ห้ามพูดที่สุดในเมือง / คือ "น่าเบื่อ"
  sign: (t, lt, C) => { const k = guy(C, 'dek', SIGN[0] + 1.1, -3.2, Math.PI + 0.3, t, {look: add(SIGN, [0, 2, 0])});
    return {node: <>{town(t)}<BanSign position={SIGN} reveal={0} /><P o={k.w} /></>, cam: mv({pos: [SIGN[0] + 0.6, 1.25, 0.4], look: [SIGN[0], 1.85, SIGN[2]], fov: 52}, lt, {arrive: 0.07, push: 0.09}), bg: townBg(t)}; },
  word: (t, lt) => ({node: <>{town(t, {life: false})}<BanSign position={SIGN} reveal={sm((t - ev('word') + 0.1) / 0.25)} /></>, cam: mv({pos: [SIGN[0] + 0.12, 1.4, SIGN[2] + 3.6], look: [SIGN[0], 1.35, SIGN[2]], fov: 38}, lt, {arrive: 0.05, push: 0.1}), bg: townBg(t)}),
};

// =====================================================================================================
// ACTS 2–5 (and the end of act 1): the hall, the living room, the night, the secret, the move, the sentence
// =====================================================================================================
const NIGHT_WIN = '#1A2440';
/** the slide on screen: 1 → 10 → 50 → 200 → 300 on the plan's beats, then the appendix */
const slideAt = (t: number) => { const k = [[sh('slide1').t0, 1], [ev('s10'), 10], [ev('s50'), 50], [ev('s200'), 200], [ev('s300'), 300]] as [number, number][];
  if (t <= k[0][0]) return 1; for (let i = 1; i < k.length; i++) if (t < k[i][0]) return Math.round(lerp(k[i - 1][1], k[i][1], (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]))); return 300; };
const appAt = (t: number) => t < ev('app1') ? 0 : 1 + Math.floor((t - ev('app1')) * 3);
const beards = new WeakMap<any, THREE.Object3D>();
/** the head on the stage: at the podium facing the hall; after three years a beard */
const boss = (C: Cast, t: number, o: GO = {}) => { const b = guy(C, 'boss', BOSS_AT[0], BOSS_AT[2], 0, t, {clip: 'gestic_presentation_right_01', face: 'talk', y: STAGE_Y, ...o});
  let bd = beards.get(b.I); const on = t > sh('stillBoss').t0; if (on && !bd) { bd = makeBeard(); headFr(b.I).add(bd); beards.set(b.I, bd); } if (bd) bd.visible = on; return b; };
const AUD = ['tw1', 'tw2', 'tw3', 'tw4', 'tw5', 'tw6', 'tw7', 'tw8'];
/** the audience in the hall: seated (or standing to clap), asleep after the night falls */
const audience = (C: Cast, t: number, o: {clap?: boolean; asleep?: boolean; face?: string} = {}) => AUD.map((id, i) => { const p = SEATS[i];
  const g = guy(C, id, p[0], p[2] - (o.clap ? 0.35 : 0.05), Math.PI, t, o.clap ? {clip: 'claphands_01', face: o.face ?? 'open'} : {sit: true, clip: o.asleep ? 'sit_chair_idle_relaxed_01' : 'sit_chair_idle_neutral_01', face: o.face ?? (o.asleep ? 'closed' : 'open')}); return <P key={id} o={g.w} />; });
const hall = (C: Cast, t: number, o: {clap?: boolean; count?: number; face?: string} = {}) => { const night = sunEl(t) < -2 ? 1 : 0;
  return <><Hall t={t} slide={slideAt(t)} app={appAt(t)} night={night} count={o.count ?? -1} />{audience(C, t, {clap: o.clap, asleep: !!night && t < ev('gasp'), face: o.face})}</>; };
const HALL_BG = {color: '#2A2420'};
/** the living room: the TV shows the live slide; its window shows the sky */
const living = (t: number, o: {part2?: boolean; year?: number; flip?: number} = {}) => <LivingRoom t={t} skyC={skyColor(sunEl(t))} n={slideAt(t)} app={appAt(t)} part2={o.part2} year={o.year ?? 2569} flip={o.flip} />;
const yearAt = (t: number, a: number, b: number, y0: number, n: number) => { const k = cl((t - a) / (b - a)) * n; return {year: y0 + Math.floor(k), flip: k >= n ? 0 : k % 1}; };
const kidSofa = (C: Cast, t: number, o: GO = {}) => guy(C, 'dek', SOFA[0] + 0.05, SOFA[2] + 0.05, Math.PI, t, {sit: true, face: 'half', ...o});
const parents = (C: Cast, t: number) => [['tw7', -0.6], ['tw3', 0.65]].map(([id, x]) => { const g = guy(C, id as string, x as number, 1.75, Math.PI, t, {clip: 'claphands_01', face: 'open'}); return <P key={id as string} o={g.w} />; });
// ---- grandma's room: the window is night or day by the sun; she can stand at the window and open the curtains
const roomAt = (t: number, o: {open?: number} = {}) => { const el = sunEl(t), k = dayK(el);
  const op = o.open ?? 0;
  return <><YaiRoom t={t} open={op} leak={0.25 + k} win={k > 0.5 ? '#FFF0C8' : NIGHT_WIN} /><pointLight position={[0.6, 2.0, 1.2]} color="#8A94C8" intensity={0.5} distance={5} decay={1.5} />
    {op > 0.05 && <pointLight position={[0, 1.6, -1.45]} color={k > 0.5 ? '#FFE6B0' : '#8FA8E8'} intensity={1.6 * op} distance={3.5} decay={1.4} />}<pointLight position={[1.2, 1.6, 0.3]} color="#FFD9A0" intensity={0.35} distance={1.6} decay={1.6} /></>; };
const MEGA_WALL: V3 = [1.7, 1.0, -0.2];
const openK = (t: number) => sm((t - ev('curtain')) / 0.55);
// ---- the court
const courtRoom = (C: Cast, t: number, gv: string, dockId: string, dockFace = 'half') => { const I = C.judge;
  const pose = (tt: number) => { hideProps(I);
    const w = body(I, ps('judge', 0, -3.25, 0, tt, {poseId: 'sitIdle', clip: 'sit_table_idle_neutral_01', lookW: [0, 1.3, 0.6], face: tt > ev(gv) - 0.35 && tt < ev(gv) + 0.5 ? 'shout' : 'angry'}), tt, 1.25);
    const g = prop(I, 'gavel', 'Bip01_R_Hand', makeGavel, [8, 0, 0], [0, Math.PI / 2, 0]); const up = strike(tt, ev(gv), 0.4);
    rot(I.bones.Bip01_R_UpperArm, 1, 0, 0, -0.25 - up, I.root); rot(I.bones.Bip01_R_Forearm, 1, 0, 0, -0.7 - up * 0.6, I.root); w.updateMatrixWorld(true); return {w, g}; };
  let bb = new THREE.Box3(), top = -1e9; pose(ev(gv)).g.traverse((o: any) => { if (!o.isMesh) return; const b = new THREE.Box3().setFromObject(o); const cy = (b.min.y + b.max.y) / 2; if (cy > top) { top = cy; bb = b; } });
  const blk: V3 = [(bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2];
  const {w} = pose(t); const d = guy(C, dockId, 0, 0.85, Math.PI, t, {face: dockFace, look: [0, 2.4, -3.2]});
  return <><Court t={t} /><P o={w} /><P o={d.w} /><CourtLife t={t} C={C} look={[0, 1.2, 0.6]} />
    <mesh position={[blk[0], blk[1] - 0.03, blk[2]]} castShadow><boxGeometry args={[0.3, 0.06, 0.26]} /><meshLambertMaterial color="#5A3019" /></mesh></>; };
const COURT_BG = {color: '#E7DCC6'};
// ---- the street at night / at noon
const crowd = (C: Cast, t: number, face: (i: number) => GO) => towns4.map(([id, x, z], i) => { const g = guy(C, id, x, z, Math.atan2(-x * 0.3, 4), t, face(i)); return <P key={id} o={g.w} />; });
const LINE: [string, number, number][] = [['tw1', -5.5, -4.1], ['tw3', -3.2, -4.3], ['tw5', -1.0, -4.0], ['tw6', 1.4, -4.2], ['tw7', 3.6, -4.1], ['tw8', -4.4, 4.1], ['tw2', -1.8, 4.3], ['tw4', 1.0, 4.0], ['unit1', 3.0, 4.2], ['unit2', 5.0, 4.1]];
const street10 = (C: Cast, t: number, o: (i: number) => GO) => LINE.map(([id, x, z], i) => { const g = guy(C, id, x, z, z < 0 ? 0 : Math.PI, t, o(i)); return <P key={id} o={g.w} />; });
const HEN: V3 = [-0.6, 0, -4.05];
/** grandma's house seen from the street: a wall, a window with the curtains shut, a roof edge */
const facade = () => <group position={[0, 0, 0]}><mesh position={[0, 2.4, -0.1]} receiveShadow><boxGeometry args={[7, 4.8, 0.2]} /><meshStandardMaterial color="#C9B9A0" /></mesh>
  <mesh position={[0, 4.95, 0.25]} rotation={[0.5, 0, 0]}><boxGeometry args={[7.4, 0.15, 1.2]} /><meshStandardMaterial color="#7A3A2A" /></mesh>
  <mesh position={[0, 3.0, 0.01]}><planeGeometry args={[1.5, 1.3]} /><meshStandardMaterial color="#F4F1E6" /></mesh><mesh position={[0, 3.0, 0.02]}><planeGeometry args={[1.35, 1.15]} /><meshStandardMaterial color="#181418" /></mesh>
  <mesh position={[0, 3.0, 0.03]}><planeGeometry args={[0.02, 1.15]} /><meshBasicMaterial color="#FFD98A" /></mesh>
  <mesh position={[0, 1.05, 0.01]}><planeGeometry args={[0.95, 2.1]} /><meshStandardMaterial color="#6A4A30" /></mesh>
  <directionalLight position={[-6, 8, 6]} intensity={2} castShadow /><hemisphereLight args={['#DCE8F2', '#5A5446', 0.8]} /></group>;
const FLASH = ['flashback', 'fiveDays', 'youngYai', 'megaphone30', 'gasp30', 'dawn30', 'court30', 'sentence30', 'curtainShut'];

const WRITTEN2: Record<string, ShotFn> = {
  // ---- l011 ยายฉันอยู่แต่ในห้อง / ปิดม่านทึบสามชั้น
  yaiDoor: (t, lt, C) => { const y = yai(C, t); return {node: <>{roomAt(t)}{y.node}</>, cam: mv({pos: [-0.9, 1.45, 1.55], look: [0, 0.95, -0.85], fov: 50}, lt, {arrive: 0.07, push: 0.06}), bg: DARK}; },
  yaiChair: (t, lt, C) => { const y = yai(C, t); return {node: <>{roomAt(t)}{y.node}</>, cam: mv({pos: [0.32, 1.12, 0.5], look: [0, 1.08, -0.7], fov: 40}, lt, {arrive: 0.06, push: 0.1}), bg: DARK}; },
  layers: (t, lt) => ({node: <>{roomAt(t)}</>, cam: mv({pos: [0.95, 1.5, -1.05], look: [0.2, 1.5, -1.65], fov: 40}, lt, {arrive: 0.06, push: 0.12}), bg: DARK}),
  // ---- l012 บนผนังมีรูปยายตอนสาว / ถือโทรโข่ง
  wall: (t, lt, C) => { const k = guy(C, 'dek', 0.9, 0.1, Math.PI / 2 + 0.5, t, {look: PHOTO}); return {node: <>{roomAt(t)}<P o={k.w} /><Megaphone at={MEGA_WALL} dir={[-1, -0.25, 0]} /></>, cam: mv({pos: [0.1, 1.35, 0.95], look: [1.6, 1.3, -0.3], fov: 50}, lt, {arrive: 0.07, push: 0.08}), bg: DARK}; },
  photo: (t, lt) => ({node: <>{roomAt(t)}<Megaphone at={MEGA_WALL} dir={[-1, -0.25, 0]} /></>, cam: mv({pos: [1.05, 1.55, -0.18], look: [1.78, 1.55, -0.2], fov: 36}, lt, {arrive: 0.05, push: 0.14}), bg: DARK}),
  megaphone: (t, lt) => ({node: <>{roomAt(t)}<Megaphone at={MEGA_WALL} dir={[-1, -0.25, 0]} /><pointLight position={[1.2, 1.3, 0.2]} color="#FFD9A0" intensity={0.9} distance={1.4} /></>, cam: mv({pos: [1.0, 1.15, 0.05], look: [1.65, 1.05, -0.2], fov: 36}, lt, {arrive: 0.05, push: 0.14}), bg: DARK}),
  // ---- l013 ทุกคนบอกว่า / ยายเคยทำผิด / เรื่องเดียว
  gossip: (t, lt, C) => { const a = guy(C, 'tw1', -3.0, -4.0, 0.9, t, {face: 'talk'}); const b = guy(C, 'tw5', -2.45, -4.25, -0.6, t, {face: 'half'});
    return {node: <>{town(t)}<P o={a.w} /><P o={b.w} /></>, cam: mv({pos: [-1.2, 1.45, -2.2], look: [-2.75, 1.45, -4.15], fov: 44}, lt, {arrive: 0.07, push: 0.08}), bg: townBg(t)}; },
  gossipCU: (t, lt, C) => { const a = guy(C, 'tw1', -3.0, -4.0, 0.9, t, {face: 'talk'}); hand(a.I, 'L', add(hw(a.I, [9, 4, 14]), [0, 0, 0.02]), 'cup'); a.w.updateMatrixWorld(true);
    const b = guy(C, 'tw5', -2.45, -4.25, -0.6, t, {face: 'wide'});
    return {node: <>{town(t)}<P o={a.w} /><P o={b.w} /></>, cam: mv({pos: [-2.0, 1.6, -2.85], look: [-2.75, 1.5, -4.1], fov: 40}, lt, {arrive: 0.05, push: 0.12}), bg: townBg(t)}; },
  // ---- l014 ไม่มีใครบอกว่าเรื่องอะไร
  yaiWindow: (t, lt) => ({node: <>{facade()}</>, cam: mv({pos: [0.4, 1.3, 6.5], look: [0, 3.0, 0], fov: 44}, lt, {arrive: 0.07, push: 0.06}), bg: {color: '#BFD6E4'}}),
  windowCU: (t, lt) => ({node: <>{facade()}</>, cam: mv({pos: [0.1, 2.9, 2.3], look: [0, 3.0, 0], fov: 40}, lt, {arrive: 0.05, push: 0.16}), bg: {color: '#BFD6E4'}}),
  // ---- l015 แล้ววันหนึ่ง / เมืองนี้ได้หัวหน้าคนใหม่
  hall: (t, lt, C) => { const b = boss(C, t, {clip: 'wave_01', face: 'open'}); return {node: <>{hall(C, t)}<P o={b.w} /></>, cam: mv({pos: [0.2, 2.5, 4.6], look: [0.4, 1.9, -3.5], fov: 50}, lt, {arrive: 0.08, push: 0.07}), bg: HALL_BG}; },
  boss: (t, lt, C) => { const b = boss(C, t, {clip: 'wave_01', face: 'open'}); return {node: <>{hall(C, t)}<P o={b.w} /></>, cam: mv({pos: [0.55, 1.75, -1.35], look: [0.9, 2.15, -3.05], fov: 40}, lt, {arrive: 0.06, push: 0.12}), bg: HALL_BG}; },
  // ---- l016 เขาจะพรีเซนต์วิสัยทัศน์ / ถ่ายทอดสดทุกบ้าน
  podium: (t, lt, C) => { const b = boss(C, t); return {node: <>{hall(C, t)}<P o={b.w} /></>, cam: mv({pos: [-0.5, 1.6, -0.2], look: [0.35, 2.4, -3.6], fov: 54}, lt, {arrive: 0.07, push: 0.08}), bg: HALL_BG}; },
  tvTown: (t, lt) => ({node: <><Village x0={X0} x1={X1} night={1} t={t} /><VillageLife t={t} x0={X0} x1={X1} traffic={false} dog={false} /><SunSky el={sunEl(t)} /></>, cam: mv({pos: [7, 5.2, 1.5], look: [-6, 1.5, -5.5], fov: 54}, lt, {arrive: 0.07, push: 0.06}), bg: townBg(t)}),
  // ---- l017 สไลด์ทั้งหมด / สามร้อยแผ่น
  slide1: (t, lt, C) => ({node: <>{hall(C, t)}</>, cam: mv({pos: [0.1, 3.0, -1.4], look: SCREEN, fov: 48}, lt, {arrive: 0.06, push: 0.12}), bg: HALL_BG}),
  stack: (t, lt, C) => { const b = boss(C, t); const k = sm(lt / 1.0); return {node: <>{hall(C, t)}<P o={b.w} /></>, cam: mv({pos: [-0.75, 1.3, -1.2], look: [-1.7, lerp(1.2, 4.2, k), -3.1], fov: 52}, lt, {arrive: 0.04, push: 0.04}), bg: HALL_BG}; },
  // ---- l018 ทั้งเมืองปรบมือ
  clapHall: (t, lt, C) => { const b = boss(C, t, {clip: 'wave_01', face: 'open'}); return {node: <>{hall(C, t, {clap: true})}<P o={b.w} /></>, cam: mv({pos: [0.5, 1.9, -1.2], look: [1.3, 1.25, 1.9], fov: 50}, lt, {arrive: 0.06, push: 0.07}), bg: HALL_BG}; },
  clapHome: (t, lt, C) => { const k = kidSofa(C, t); return {node: <>{living(t)}<P o={k.w} />{parents(C, t)}</>, cam: mv({pos: [0.35, 1.3, -1.05], look: [0, 0.95, 1.1], fov: 54}, lt, {arrive: 0.06, push: 0.07}), bg: DARK}; },
  // ---- l019 มีฉันคนเดียว / ที่นั่งนับสไลด์
  kidTV: (t, lt, C) => { const k = kidSofa(C, t); hand(k.I, 'R', [SOFA[0] - 0.02, 0.62, SOFA[2] - 0.22], 'fist'); k.w.updateMatrixWorld(true);
    return {node: <>{living(t)}<P o={k.w} /><Tally p={[SOFA[0] + 0.08, 0.6, SOFA[2] - 0.22]} n={slideAt(t)} /></>, cam: mv({pos: [0.25, 0.92, -0.1], look: [0.05, 0.8, 0.9], fov: 42}, lt, {arrive: 0.06, push: 0.1}), bg: DARK}; },
  tally: (t, lt, C) => { const k = kidSofa(C, t); hand(k.I, 'R', [SOFA[0] - 0.02, 0.62, SOFA[2] - 0.22], 'fist'); k.w.updateMatrixWorld(true);
    return {node: <>{living(t)}<P o={k.w} /><Tally p={[SOFA[0] + 0.08, 0.6, SOFA[2] - 0.22]} n={slideAt(t)} /></>, cam: mv({pos: [0.1, 1.0, 0.42], look: [0.08, 0.6, 0.67], fov: 38}, lt, {arrive: 0.05, push: 0.1}), bg: DARK}; },
  // ---- l020 สไลด์ที่สิบ / ลุงข้างบ้านหาว
  slide10: (t, lt, C) => { const k = kidSofa(C, t); return {node: <>{living(t)}<P o={k.w} /></>, cam: mv({pos: [0.15, 1.05, -0.55], look: TV, fov: 44}, lt, {arrive: 0.05, push: 0.14}), bg: DARK}; },
  uncle: (t, lt, C) => { const y = guy(C, 'tw2', YW[0], YW[2], Math.PI / 2, t, yawning(t, ev('yawnU'))); return {node: <>{town(t)}<P o={y.w} /></>, cam: mv({pos: [1.62, 1.52, -3.95], look: [0.4, 1.55, -4.2], fov: 40}, lt, {arrive: 0.06, push: 0.14}), bg: townBg(t)}; },
  sunDrop3: (t, lt, C) => { const y = guy(C, 'tw2', YW[0], YW[2], Math.PI / 2, t, yawning(t, ev('yawnU')));
    return {node: <>{town(t)}<P o={y.w} /></>, cam: mv({pos: [3.6, 1.0, -4.0], look: [-10, 3.2, -4.6], fov: 60}, lt, {arrive: 0.05, push: 0.04, shake: near(t, [ev('dropU')], 0.4) ? 0.01 : 0}), bg: townBg(t)}; },
  // ---- l021 สไลด์ที่ห้าสิบ / หน่วยกันหาว / หาวเอง
  slide50: (t, lt, C) => { const b = boss(C, t); return {node: <>{hall(C, t)}<P o={b.w} /></>, cam: mv({pos: [-0.7, 2.4, -1.0], look: [0, 2.9, -4.38], fov: 50}, lt, {arrive: 0.06, push: 0.1}), bg: HALL_BG}; },
  unit: (t, lt, C) => { const a = guy(C, 'unit1', -1.9, -4.0, Math.PI / 2 - 0.2, t, {face: 'angry'}); const b = guy(C, 'unit2', -1.2, -4.15, Math.PI / 2 - 0.3, t, {face: 'angry'});
    return {node: <>{town(t)}{lamps(t, 0, 0.3)}<P o={a.w} /><P o={b.w} /></>, cam: mv({pos: [1.0, 1.35, -3.3], look: [-1.55, 1.45, -4.05], fov: 46}, lt, {arrive: 0.07, push: 0.08}), bg: townBg(t)}; },
  unitYawn: (t, lt, C) => { const a = guy(C, 'unit1', -1.9, -4.0, Math.PI / 2 - 0.2, t, {...yawning(t, ev('yawnUnit')), ...(t > ev('tapeU') ? {face: 'wide', tape: true} : {})});
    const b = guy(C, 'unit2', -1.2, -4.15, Math.PI / 2 + 0.9, t, {face: 'angry', look: hw(a.I, [0, 6, 10])}); const k = cl(1 - Math.abs(t - ev('tapeU') + 0.05) / 0.3);
    if (k > 0) { hand(b.I, 'R', add(hw(a.I, [0, 6.5, 16]), [0.1 * (1 - k), -0.05 * (1 - k), 0.03]), 'open'); b.w.updateMatrixWorld(true); }
    return {node: <>{town(t)}{lamps(t, 0, 0.3)}<P o={a.w} /><P o={b.w} /></>, cam: mv({pos: [0.25, 1.55, -3.35], look: [-1.55, 1.5, -4.1], fov: 40}, lt, {arrive: 0.05, push: 0.1, shake: near(t, [ev('tapeU')], 0.12) ? 0.012 : 0}), bg: townBg(t)}; },
  // ---- l022 สไลด์ที่สองร้อย / ทั้งเมืองหาวพร้อมกัน
  slide200: (t, lt, C) => { const k = kidSofa(C, t); return {node: <>{living(t)}<P o={k.w} /></>, cam: mv({pos: [-0.35, 1.0, 0.3], look: TV, fov: 46}, lt, {arrive: 0.05, push: 0.12}), bg: DARK}; },
  massYawn: (t, lt, C) => ({node: <>{town(t, {life: false})}{street10(C, t, (i) => yawning(t, ev('mass') + i * 0.04))}</>, cam: mv({pos: [2.6, 1.6, -1.6], look: [-3.2, 1.55, -4.3], fov: 54}, lt, {arrive: 0.06, push: 0.05}), bg: townBg(t)}),
  // ---- l023 ดวงอาทิตย์ / ตกไปสามปี
  sunGone: (t, lt) => ({node: <>{town(t, {life: false})}</>, cam: mv({pos: [6, 1.4, -2.6], look: [-10, 2.6, -3.4], fov: 56}, lt, {arrive: 0.05, push: 0.04, shake: near(t, [ev('plunge')], 0.6) ? 0.012 : 0}), bg: townBg(t)}),
  calendar: (t, lt) => ({node: <>{living(t, yearAt(t, ev('cal1'), ev('cal1e'), 2569, 3))}</>, cam: mv({pos: [-0.85, 1.6, -0.2], look: CAL, fov: 40}, lt, {arrive: 0.05, push: 0.12}), bg: DARK}),
  // ---- l024 ไก่ทั้งเมืองตกงาน
  rooster: (t, lt) => ({node: <>{town(t)}{lamps(t, 0, 0.3)}<Chickens center={HEN} r={0.5} n={4} t={t} /><HenSign p={[0.05, 0, -4.1]} yaw={-0.4} /></>, cam: mv({pos: [1.0, 0.85, -2.5], look: [-0.35, 0.45, -4.1], fov: 46}, lt, {arrive: 0.07, push: 0.08}), bg: townBg(t)}),
  roosterBox: (t, lt) => ({node: <>{town(t)}{lamps(t, 0, 0.3)}<Chickens center={HEN} r={0.5} n={4} t={t} /><HenSign p={[0.05, 0, -4.1]} yaw={-0.4} /></>, cam: mv({pos: [0.6, 0.42, -3.45], look: [0.05, 0.18, -4.1], fov: 38}, lt, {arrive: 0.05, push: 0.12}), bg: townBg(t)}),
  // ---- l025 ต้นไม้หันไปหาเสาไฟ
  trees: (t, lt) => ({node: <>{town(t, {life: false})}<StreetLamp position={[-0.4, 0, -4.15]} t={t} on={1} moths h={5.6} />{[-2.4, -4.4].map((x, i) => <LeanTree key={i} p={[x, 0, -3.75]} lean={0.15 + 0.1 * i} />)}</>, cam: mv({pos: [-1.6, 1.6, 2.0], look: [-1.9, 2.8, -4], fov: 56}, lt, {arrive: 0.07, push: 0.06}), bg: townBg(t)}),
  treesLean: (t, lt) => { const k = sm(lt / 0.8); return {node: <>{town(t, {life: false})}<StreetLamp position={[-0.4, 0, -4.15]} t={t} on={1} moths h={5.6} />{[-2.4, -4.4].map((x, i) => <LeanTree key={i} p={[x, 0, -3.75]} lean={lerp(0.15 + 0.1 * i, 0.85 + 0.1 * i, k)} />)}</>, cam: mv({pos: [-1.6, 1.6, 2.0], look: [-1.9, 2.8, -4], fov: 56}, lt, {arrive: 0, push: 0.1}), bg: townBg(t)}; },
  // ---- l026 เด็กรุ่นใหม่ / วาดดวงอาทิตย์เป็นหลอดไฟ
  drawing: (t, lt, C) => { const kids = [['tw4', -1.1, 0.95], ['tw8', 0, 0.95]].map(([id, x, z]) => guy(C, id as string, x as number, z as number, Math.PI, t, {kid: true, sit: true, face: 'open'}));
    return {node: <>{school(t)}{kids.map(({w}, i) => <P key={i} o={w} />)}<Drawing p={[0, 0.578, 0.6]} /><Drawing p={[-1.1, 0.578, 0.6]} /></>, cam: mv({pos: [0.05, 1.2, -0.15], look: [-0.15, 0.75, 0.85], fov: 50}, lt, {arrive: 0.07, push: 0.08}), bg: {color: '#E6DCC2'}}; },
  drawingCU: (t, lt) => ({node: <>{school(t)}<Drawing p={[0, 0.578, 0.6]} /></>, cam: mv({pos: [0.02, 1.05, 0.38], look: [0, 0.578, 0.6], fov: 36}, lt, {arrive: 0.05, push: 0.1}), bg: {color: '#E6DCC2'}}),
  // ---- l027 และหัวหน้า / ยังพรีเซนต์อยู่
  stillBoss: (t, lt, C) => { const b = boss(C, t); return {node: <>{hall(C, t)}<P o={b.w} /></>, cam: mv({pos: [-0.5, 1.6, -0.2], look: [0.35, 2.4, -3.6], fov: 54}, lt, {arrive: 0.07, push: 0.06}), bg: HALL_BG}; },
  appendix: (t, lt, C) => { const b = boss(C, t); return {node: <>{hall(C, t)}<P o={b.w} /></>, cam: mv({pos: [0.4, 2.6, -1.3], look: [0.1, 2.75, -4.38], fov: 50}, lt, {arrive: 0.05, push: 0.12}), bg: HALL_BG}; },
  // ---- l028 คืนนั้น / ยายเปิดม่านครั้งแรก
  curtainOpen: (t, lt, C) => { const y = guy(C, 'yai', 0.05, -1.2, Math.PI, t, {face: 'half'}); return {node: <>{roomAt(t, {open: openK(t)})}<P o={y.w} /></>, cam: mv({pos: [0.7, 1.4, 0.95], look: [0, 1.45, -1.7], fov: 50}, lt, {arrive: 0.07, push: 0.08}), bg: DARK}; },
  yaiFace: (t, lt, C) => { const y = guy(C, 'yai', 0.05, -1.2, Math.PI, t, {face: 'wide'}); return {node: <>{roomAt(t, {open: openK(t)})}<P o={y.w} /><pointLight position={[0, 1.6, -1.7]} color="#8FA8E8" intensity={0.8} distance={2} /></>, cam: mv({pos: [0.5, 1.6, -1.68], look: [0.05, 1.55, -1.15], fov: 50}, lt, {arrive: 0.06, push: 0.1}), bg: DARK}; },
  // ---- l029 ยายบอกว่า / หาว / ทำให้ดวงอาทิตย์ตก   l030 แต่อ้าปากค้าง / ทำให้มันขึ้น
  yaiTells: (t, lt, C) => { const y = yai(C, t, {face: 'talk', torch: true}); const k = guy(C, 'dek', 0.8, -0.45, -1.2, t, {face: 'half', look: hw(y.I, [0, 4, 10])});
    return {node: <>{roomAt(t, {open: 1})}{y.node}<P o={k.w} /><Slate p={[0.05, 1.0, -0.15]} r={[-0.25, 0, 0]} hi={0} /></>, cam: mv({pos: [0.3, 1.25, 1.05], look: [0.25, 1.0, -0.55], fov: 50}, lt, {arrive: 0.07, push: 0.08}), bg: DARK}; },
  diagramYawn: (t, lt) => ({node: <>{roomAt(t, {open: 1})}<Slate p={[0.05, 1.0, -0.15]} r={[-0.25, 0, 0]} hi={1} /></>, cam: mv({pos: [-0.08, 1.15, 0.38], look: [-0.06, 1.0, -0.15], fov: 36}, lt, {arrive: 0.05, push: 0.1}), bg: DARK}),
  diagramGasp: (t, lt) => ({node: <>{roomAt(t, {open: 1})}<Slate p={[0.05, 1.0, -0.15]} r={[-0.25, 0, 0]} hi={2} /></>, cam: mv({pos: [0.05, 1.15, 0.55], look: [0.05, 1.0, -0.15], fov: 40}, lt, {arrive: 0.05, push: 0.08}), bg: DARK}),
  diagramUp: (t, lt) => ({node: <>{roomAt(t, {open: 1})}<Slate p={[0.05, 1.0, -0.15]} r={[-0.25, 0, 0]} hi={3} /></>, cam: mv({pos: [0.18, 1.12, 0.3], look: [0.17, 1.0, -0.15], fov: 34}, lt, {arrive: 0.05, push: 0.14}), bg: DARK}),
  // ---- l031 สามสิบปีก่อน / เมืองนี้มืดห้าวัน (sepia, the same street thirty years ago)
  flashback: (t, lt, C) => ({node: <>{town(t)}{crowd(C, t, () => ({face: 'half'}))}</>, cam: mv({pos: [0.3, 2.2, 4.6], look: [0, 1.3, 0.5], fov: 54}, lt, {arrive: 0.07, push: 0.06}), bg: townBg(t)}),
  fiveDays: (t, lt) => ({node: <>{town(t, {life: false})}<StreetClock p={[1.0, 0, -4.2]} hh={(t - sh('fiveDays').t0) * 40} mm={((t - sh('fiveDays').t0) * 2400) % 60} /></>, cam: mv({pos: [2.2, 2.7, -2.4], look: [1.0, 3.3, -4.2], fov: 44}, lt, {arrive: 0.05, push: 0.1}), bg: townBg(t)}),
  // ---- l032 ยายเลยพูดคำต้องห้ามใส่โทรโข่ง
  youngYai: (t, lt, C) => { const y = guy(C, 'yaiY', 0.3, -3.6, Math.PI / 2 + 0.2, t, {face: t > ev('shout30') - 0.1 ? 'shout' : 'half', y: 0.35}); const m = hw(y.I, [0, 6.5, 16]); const dir = hdir(y.I, [0, 0.05, 1]) as V3;
    hand(y.I, 'R', add(m, [dir[0] * 0.06, -0.05, dir[2] * 0.06]), 'fist'); y.w.updateMatrixWorld(true);
    return {node: <>{town(t)}<mesh position={[0.3, 0.17, -3.6]}><boxGeometry args={[0.6, 0.34, 0.5]} /><meshStandardMaterial color="#8A6A4A" /></mesh><P o={y.w} /><Megaphone at={add(m, [dir[0] * 0.05, -0.01, dir[2] * 0.05])} dir={dir} t={t} shout={ev('shout30')} />{crowd(C, t, () => ({face: 'half'}))}</>,
      cam: mv({pos: [2.3, 0.95, -2.3], look: [0.3, 1.95, -3.9], fov: 52}, lt, {arrive: 0.07, push: 0.08}), bg: townBg(t)}; },
  megaphone30: (t, lt, C) => { const y = guy(C, 'yaiY', 0.3, -3.6, Math.PI / 2 + 0.2, t, {face: 'shout', y: 0.35}); const m = hw(y.I, [0, 6.5, 16]); const dir = hdir(y.I, [0, 0.05, 1]) as V3;
    hand(y.I, 'R', add(m, [dir[0] * 0.06, -0.05, dir[2] * 0.06]), 'fist'); y.w.updateMatrixWorld(true);
    return {node: <>{town(t)}<P o={y.w} /><Megaphone at={add(m, [dir[0] * 0.05, -0.01, dir[2] * 0.05])} dir={dir} t={t} shout={ev('shout30')} /></>, cam: mv({pos: [1.35, 2.15, -3.15], look: [0.45, 2.0, -3.55], fov: 40}, lt, {arrive: 0.05, push: 0.14, shake: 0.006}), bg: townBg(t)}; },
  // ---- l033 ทั้งเมืองอ้าปากค้าง / ฟ้าสว่างทันที
  gasp30: (t, lt, C) => ({node: <>{town(t)}{crowd(C, t, () => ({face: 'gasp'}))}</>, cam: mv({pos: [0.05, 1.5, 4.3], look: [0, 1.45, 1.2], fov: 50}, lt, {arrive: 0.05, push: 0.16}), bg: townBg(t)}),
  dawn30: (t, lt) => ({node: <>{town(t, {life: false})}</>, cam: mv({pos: [6, 1.4, -2.6], look: [-10, 3.2, -3.4], fov: 58}, lt, {arrive: 0.05, push: -0.04}), bg: townBg(t)}),
  // ---- l034 ศาลตัดสิน / ห้ามยายเห็นแดดตลอดชีวิต
  court30: (t, lt, C) => ({node: courtRoom(C, t, 'gavel30', 'yaiY'), cam: mv({pos: [0.35, 1.55, 2.6], look: [-0.1, 1.7, -2.0], fov: 46}, lt, {arrive: 0.07, push: 0.07, shake: near(t, [ev('gavel30')], 0.1) ? 0.012 : 0}), bg: COURT_BG}),
  sentence30: (t, lt, C) => ({node: courtRoom(C, t, 'gavel30', 'yaiY'), cam: mv({pos: [0.45, 1.65, -0.45], look: [0, 1.55, 0.85], fov: 40}, lt, {arrive: 0.05, push: 0.1}), bg: COURT_BG}),
  curtainShut: (t, lt, C) => { const y = guy(C, 'yaiY', 0.05, -1.2, Math.PI, t, {face: 'half'}); return {node: <>{roomAt(t, {open: 1 - sm((t - ev('shut30')) / 0.5)})}<P o={y.w} /></>, cam: mv({pos: [0.7, 1.4, 0.95], look: [0, 1.45, -1.7], fov: 50}, lt, {arrive: 0.06, push: 0.06}), bg: DARK}; },
  // ---- l035 ฉันยืมโทรโข่งยาย
  borrow: (t, lt, C) => { const k = guy(C, 'dek', 1.3, -0.15, Math.PI / 2, t, {face: 'half', look: MEGA_WALL}); const g = t > ev('grab'); const hp: V3 = g ? lerp3v(MEGA_WALL, [1.2, 0.85, 0.05], sm((t - ev('grab')) / 0.4)) : MEGA_WALL;
    hand(k.I, 'R', add(hp, [-0.04, -0.03, 0]), 'fist'); k.w.updateMatrixWorld(true); const y = yai(C, t);
    return {node: <>{roomAt(t)}{y.node}<P o={k.w} /><Megaphone at={hp} dir={g ? [-0.3, 0.2, 1] : [-1, -0.25, 0]} /></>, cam: mv({pos: [1.72, 1.15, 0.75], look: [1.2, 0.95, -0.2], fov: 50}, lt, {arrive: 0.07, push: 0.08}), bg: DARK}; },
  // ---- l036 ปีนขึ้นไปหน้ากล้อง / ถ่ายทอดสด
  climb: (t, lt, C) => { const b = boss(C, t); const up = sm((t - ev('climb')) / 0.7); const k = guy(C, 'dek', -0.4, lerp(-1.45, -2.0, up), Math.PI, t, {y: STAGE_Y * up, face: 'half'});
    return {node: <>{hall(C, t)}<P o={b.w} /><P o={k.w} /></>, cam: mv({pos: [-0.1, 1.35, 1.4], look: [0, 1.25, -2.4], fov: 52}, lt, {arrive: 0.07, push: 0.08}), bg: HALL_BG}; },
  onAir: (t, lt, C) => ({node: <>{hall(C, t)}</>, cam: mv({pos: [-0.65, 1.55, -1.55], look: [-1.25, 1.4, -0.55], fov: 38}, lt, {arrive: 0.05, push: 0.14}), bg: HALL_BG}),
  // ---- l037 แล้วพูดว่า / "หัวหน้าครับ / น่าเบื่อ"
  kidMic: (t, lt, C) => { const m = kidStage(C, t); return {node: <>{hall(C, t)}{m.node}</>, cam: mv({pos: [-1.75, 1.3, -0.45], look: [-0.5, 1.25, -2.0], fov: 46}, lt, {arrive: 0.06, push: 0.1}), bg: HALL_BG}; },
  bossTurns: (t, lt, C) => { const b = boss(C, t, {clip: 'idle_neutral_01', face: 'half', look: [-0.5, 1.4, -2.0]}); const m = kidStage(C, t); return {node: <>{hall(C, t)}<P o={b.w} />{m.node}</>, cam: mv({pos: [0.35, 2.0, -1.55], look: [0.9, 2.15, -3.05], fov: 40}, lt, {arrive: 0.05, push: 0.12}), bg: HALL_BG}; },
  boring: (t, lt, C) => { const m = kidStage(C, t); const z = sm((t - ev('shout')) / 0.15); return {node: <>{hall(C, t)}{m.node}</>, cam: mv({pos: [-1.12, 1.75, -0.75], look: [-0.5, 1.68, -2.0], fov: 50 - 16 * z}, lt, {arrive: 0.04, push: 0.05, shake: near(t, [ev('shout')], 0.5) ? 0.016 : 0}), bg: HALL_BG}; },
  // ---- l038 ทั้งเมือง / อ้าปากค้าง
  townGasp: (t, lt, C) => ({node: <>{town(t, {life: false})}{crowd(C, t, () => ({face: t > sh('townGasp').t0 + 0.25 ? 'gasp' : 'half'}))}<pointLight position={[0, 1.8, 3.2]} color="#9FC2FF" intensity={1.6} distance={6} decay={1.4} /></>, cam: mv({pos: [0.05, 1.5, 4.3], look: [0, 1.45, 1.2], fov: 50}, lt, {arrive: 0.05, push: 0.08}), bg: townBg(t)}),
  bossGasp: (t, lt, C) => { const b = boss(C, t, {clip: 'idle_neutral_01', face: t > ev('gasp') ? 'gasp' : 'half', look: [-0.5, 1.4, -2.0]}); return {node: <>{hall(C, t, {face: 'gasp'})}<P o={b.w} /></>, cam: mv({pos: [0.62, 2.05, -1.65], look: [0.9, 2.2, -3.05], fov: 40}, lt, {arrive: 0.04, push: 0.16, shake: near(t, [ev('gasp')], 0.15) ? 0.012 : 0}), bg: HALL_BG}; },
  // ---- l039 สามหมื่นคน / สามหมื่นชั่วโมง
  count: (t, lt, C) => ({node: <>{hall(C, t, {count: 30000 * sm((t - ev('count0')) / 0.9), face: 'gasp'})}</>, cam: mv({pos: [0.1, 3.0, -1.5], look: SCREEN, fov: 48}, lt, {arrive: 0.05, push: 0.12}), bg: HALL_BG}),
  sunRise: (t, lt) => { const k = sm((t - ev('rise')) / 0.9); return {node: <>{town(t, {life: false})}</>, cam: mv({pos: [6, 1.4, -2.6], look: [-10, lerp(2.4, 26, k), -3.4], fov: 60}, lt, {arrive: 0.04, push: 0.02}), bg: townBg(t)}; },
  // ---- l040 ดวงอาทิตย์ / ไม่ตกอีกเลย / สามปีครึ่ง
  blaze: (t, lt, C) => { const k = kidOnPath(C, t, {face: 'half', look: [-6, 20, -4]}); hand(k.I, 'R', hw(k.I, [-2, 16, 12]), 'open'); k.w.updateMatrixWorld(true);
    return {node: <>{town(t)}<P o={k.w} /></>, cam: mv({pos: [0.35, 0.8, -3.05], look: [-0.65, 1.25, -3.85], fov: 50}, lt, {arrive: 0.05, push: 0.06}), bg: townBg(t)}; },
  clockSpin: (t, lt) => ({node: <>{town(t)}<StreetClock p={[1.0, 0, -4.2]} hh={(t - sh('clockSpin').t0) * 30} mm={((t - sh('clockSpin').t0) * 1800) % 60} /></>, cam: mv({pos: [2.3, 2.6, -2.3], look: [0.6, 4.6, -4.4], fov: 52}, lt, {arrive: 0.05, push: 0.08}), bg: townBg(t)}),
  calendar2: (t, lt) => ({node: <>{living(t, yearAt(t, ev('cal2'), ev('cal2e'), 2572, 3.5))}</>, cam: mv({pos: [-0.85, 1.6, -0.2], look: CAL, fov: 40}, lt, {arrive: 0.05, push: 0.12}), bg: DARK}),
  // ---- l041 ไม่มีใครได้นอน
  insomnia: (t, lt, C) => ({node: <>{town(t)}{crowd(C, t, () => ({face: 'wide'}))}<StreetClock p={[1.6, 0, 0.0]} hh={3} mm={0} /></>, cam: mv({pos: [0.05, 1.5, 4.4], look: [0.4, 1.9, 0.8], fov: 54}, lt, {arrive: 0.07, push: 0.08}), bg: townBg(t)}),
  insomniaWide: (t, lt, C) => { const b = boss(C, t); return {node: <>{hall(C, t, {face: 'wide'})}<P o={b.w} /></>, cam: mv({pos: [0.2, 2.5, 4.6], look: [0.4, 1.9, -3.5], fov: 50}, lt, {arrive: 0.06, push: 0.06}), bg: HALL_BG}; },
  // ---- l042 ศาลตัดสินฉันเหมือนยาย
  courtKid: (t, lt, C) => ({node: courtRoom(C, t, 'gavel', 'dek'), cam: mv({pos: [0, 1.5, 3.2], look: [0, 1.75, -3.0], fov: 40}, lt, {arrive: 0.07, push: 0.07}), bg: COURT_BG}),
  gavel: (t, lt, C) => ({node: courtRoom(C, t, 'gavel', 'dek'), cam: mv({pos: [0.6, 2.4, -1.3], look: [0.15, 2.35, -3.2], fov: 40}, lt, {arrive: 0.05, push: 0.1, shake: near(t, [ev('gavel')], 0.1) ? 0.014 : 0}), bg: COURT_BG}),
  // ---- l043 ตอนนี้ / เรานั่งในห้องมืดด้วยกัน
  darkRoom: (t, lt, C) => { const y = yai(C, t, {torch: true}); const k = guy(C, 'dek', 0.6, -0.55, -0.3, t, {sit: true, face: 'half', y: -0.05});
    return {node: <>{roomAt(t)}{y.node}<P o={k.w} /></>, cam: mv({pos: [0.55, 1.2, 1.6], look: [0.25, 0.9, -0.7], fov: 50}, lt, {arrive: 0.07, push: 0.06}), bg: DARK}; },
  together: (t, lt, C) => { const y = yai(C, t, {torch: true}); const k = guy(C, 'dek', 0.6, -0.55, -0.3, t, {sit: true, face: 'half', y: -0.05});
    return {node: <>{roomAt(t)}{y.node}<P o={k.w} /></>, cam: mv({pos: [0.5, 1.15, 0.95], look: [0.3, 1.0, -0.65], fov: 46}, lt, {arrive: 0.05, push: 0.1}), bg: DARK}; },
  togetherWide: (t, lt, C) => { const y = yai(C, t, {torch: true}); const k = guy(C, 'dek', 0.6, -0.55, -0.3, t, {sit: true, face: 'half', y: -0.05});
    return {node: <>{roomAt(t)}{y.node}<P o={k.w} /></>, cam: mv({pos: [0.3, 1.4, 1.62], look: [0.1, 1.2, -1.2], fov: 54}, lt, {arrive: 0.04, push: -0.06}), bg: DARK}; },
  // ---- l044 ยายบอกว่า / ไม่ต้องห่วง / เดี๋ยวก็มืด
  yaiSays: (t, lt, C) => { const y = yai(C, t, {torch: true, face: 'talk'}); return {node: <>{roomAt(t)}{y.node}</>, cam: mv({pos: [0.3, 1.2, 0.55], look: [0.02, 1.13, -0.7], fov: 38}, lt, {arrive: 0.06, push: 0.08}), bg: DARK}; },
  yaiSmile: (t, lt, C) => { const y = yai(C, t, {torch: true, face: 'half'}); return {node: <>{roomAt(t)}{y.node}</>, cam: mv({pos: [0.2, 1.17, 0.25], look: [0.02, 1.13, -0.7], fov: 34}, lt, {arrive: 0.05, push: 0.12}), bg: DARK}; },
  // ---- l045 เพราะพรุ่งนี้ / หัวหน้าจะพรีเซนต์ / ภาคสอง — then grandma yawns (silent), and the light round the curtains dims one notch
  tvPart2: (t, lt, C) => { const y = yai(C, t); const k = guy(C, 'dek', 0.6, -0.55, -0.3, t, {sit: true, face: 'half', y: -0.05});
    return {node: <>{roomAt(t)}{y.node}<P o={k.w} />{smallTV(t, false)}</>, cam: mv({pos: [0.55, 1.0, 1.9], look: [-0.1, 0.9, -0.6], fov: 54}, lt, {arrive: 0.06, push: 0.08}), bg: DARK}; },
  part2: (t, lt) => ({node: <>{roomAt(t)}{smallTV(t, true)}</>, cam: mv({pos: [0.05, 0.75, 0.22], look: [0.05, 0.7, 0.85], fov: 42}, lt, {arrive: 0.05, push: 0.14}), bg: DARK}),
  yaiYawn: (t, lt, C) => { const yw = t > ev('yaiYawn') && t < ev('yaiYawn') + 1.6; const y = yai(C, t, {face: yw ? 'yawn' : 'half'}); const k = guy(C, 'dek', 0.6, -0.55, -0.3, t, {sit: true, face: t > ev('yaiYawn') + 0.5 ? 'wide' : 'half', y: -0.05, look: hw(y.I, [0, 4, 8])});
    return {node: <>{roomAt(t)}{y.node}<P o={k.w} />{smallTV(t, true)}</>, cam: mv({pos: [0.45, 1.25, 0.95], look: [0.22, 1.15, -0.65], fov: 48}, lt, {arrive: 0.05, push: 0.05}), bg: DARK}; },
};
const lerp3v = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
/** a small TV on a stool in grandma's room, facing them (−z) */
const smallTV = (t: number, part2: boolean) => <group position={[0.05, 0.5, 0.85]}><mesh position={[0, -0.25, 0]}><boxGeometry args={[0.45, 0.5, 0.4]} /><meshStandardMaterial color="#4A3426" /></mesh>
  <group position={[0, 0.2, 0]} rotation={[0, Math.PI, 0]}><TVSet p={[0, 0, 0]} n={300} app={part2 ? 0 : appAt(t)} part2={part2} w={0.5} t={t} /></group></group>;
/** the kid on the stage with grandma's megaphone up, facing the live camera */
const kidStage = (C: Cast, t: number) => { const k = guy(C, 'dek', -0.5, -2.0, Math.atan2(TVCAM[0] + 0.5, TVCAM[2] + 2.0), t, {y: STAGE_Y, face: t > ev('shout') - 0.08 ? 'shout' : 'half'});
  const up = sm((t - ev('shout') + 0.35) / 0.25); const m = add(hw(k.I, [0, 6.5, 16]), [0, -0.28 * (1 - up), 0]); const dir = hdir(k.I, [0, 0.1, 1]) as V3;   // at his chest, then up to his mouth for the word
  hand(k.I, 'R', add(m, [dir[0] * 0.05, -0.05, dir[2] * 0.05]), 'fist'); k.w.updateMatrixWorld(true);
  return {k, node: <><P o={k.w} /><Megaphone at={add(m, [dir[0] * 0.04, -0.01, dir[2] * 0.04])} dir={dir} size={0.8} t={t} shout={ev('shout')} /></>}; };

/** until a shot is written: the kid on the pavement in daylight */
const stub: ShotFn = (t, lt, C) => { const k = kidOnPath(C, t, {look: [0, 1.2, 8]});
  return {node: <>{town(t)}<P o={k.w} /></>, cam: mv({pos: [-0.9, 1.05, 5.4], look: [-1.1, 0.95, 4.35], fov: 44}, lt, {arrive: 0.06, push: 0.06}), bg: townBg(t)}; };
const ALL: Record<string, ShotFn> = {...WRITTEN, ...WRITTEN2};
export const SHOT_FN: Record<string, ShotFn> = Object.fromEntries(SHOTS.map((s) => [s.name, ALL[s.name] ?? stub]));
export const WRITTEN_SHOTS = Object.keys(ALL);
export {FLASH};
void BELL;
