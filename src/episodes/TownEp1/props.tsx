import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {MB, M, tex, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {Glow} from '../AbsurdEp8/props';
import {Curtain} from '../lifekit/props';
import {RockingChair} from '../AbsurdEp13/props';
import {HANDLE} from './data';

/** ในเมืองนี้ EP1 (หาว) — the new things: the sun that sets one hour per yawn, grandma's dark room, the nursery, the 5-minute classroom,
 *  the law against long books, the yawn camera on every lamp post, the tape, and the sign with the forbidden word. */
export type V3 = [number, number, number];
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x: number) => { const c = cl(x); return c * c * (3 - 2 * c); };
const BOXG = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 12), SPH = new THREE.SphereGeometry(1, 12, 8);
const Bx: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r = [0, 0, 0]}) => <mesh geometry={BOXG} position={p} scale={s} rotation={r} material={m} castShadow receiveShadow />;
/** a flat text card material (cached by key: put everything that changes in the key) */
export const card = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) =>
  useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false, side: THREE.DoubleSide, map: tex('town1-' + key, w, h, draw)}), [key]);   // eslint-disable-line react-hooks/exhaustive-deps

// =====================================================================================================
// THE SKY. The sun is far away: it sits at camera + a fixed direction (EP15 farMoon), so it never slides when the camera moves.
// Its elevation (degrees) is the whole story of the town: −6 = night, 0 = on the horizon, 35 = afternoon.
// =====================================================================================================
export const SUN_AZ = -Math.PI / 2;          // it stands at the far −x end of the road: cameras looking down the road see it over the vista (the houses hide it from the road otherwise)
export const dayK = (el: number) => sm((el + 4) / 22);
export const skyColor = (el: number) => { const k = dayK(el), dusk = Math.max(0, 1 - Math.abs(el - 2) / 10);
  const c = new THREE.Color('#121830').lerp(new THREE.Color('#BFD6E4'), k).lerp(new THREE.Color('#E89A6A'), dusk * 0.55); return '#' + c.getHexString(); };
const sunDir = (el: number) => { const e = el * Math.PI / 180; return new THREE.Vector3(Math.sin(SUN_AZ) * Math.cos(e), Math.sin(e), Math.cos(SUN_AZ) * Math.cos(e)); };
export const SunSky: React.FC<{el: number; at?: V3; show?: boolean}> = ({el, at = [0, 0, 0], show = true}) => {
  const cam = useThree((s) => s.camera); const d = sunDir(el), k = dayK(el); const p = cam.position.clone().addScaledVector(d, 90);
  const lp: V3 = [at[0] + d.x * 30, at[1] + Math.max(2, d.y * 30), at[2] + d.z * 30];
  const sunC = new THREE.Color('#FFE2A0').lerp(new THREE.Color('#FF8A4A'), cl(1 - el / 14)).getHexString();
  return <>
    {show && el > -3 && <group position={[p.x, p.y, p.z]}><mesh geometry={SPH} scale={4.2} material={MB('#' + sunC, 'sun')} /><Glow p={[0, 0, 0]} c={'#' + sunC} s={30} o={0.75} /></group>}
    <hemisphereLight args={['#DCE8F2', '#4A4636', 0.25 + 0.85 * k]} />
    {k > 0.02 && <directionalLight position={lp} target-position={at} color={'#' + sunC} intensity={2.2 * k} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={80} shadow-bias={-0.0006} />}
    {k < 0.6 && <directionalLight position={[at[0] + 10, at[1] + 20, at[2] - 6]} target-position={at} color="#7F95D8" intensity={0.55 * (1 - k)} />}
  </>;
};

// =====================================================================================================
// GRANDMA'S ROOM: 3.6 × 3.6, the window in the back wall (z = −1.8) behind three blackout curtains; thin hot lines of daylight leak
// round their edges (the sun she has not seen). Her rocking chair at (0, −0.75) faces +z. A framed photo on the +x wall.
// =====================================================================================================
export const YAI_CHAIR: V3 = [0, 0, -0.75], PHOTO: V3 = [1.78, 1.55, -0.2];
export const YaiRoom: React.FC<{t: number; open?: number; leak?: number; win?: string}> = ({t, open = 0, leak = 1, win = '#FFF0C8'}) => {
  const wall = PM('#3B3446', 'yaiwall'), floor = PM('#5A4030', 'yaifloor'), dark = M('#191419', 0.9);
  const photo = card('photo', 256, 320, (g) => {
    g.fillStyle = '#C9B48A'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#E6D6B0'; g.fillRect(14, 14, 228, 292);
    g.fillStyle = '#5A4632';   // a young woman on a stage, megaphone up to her mouth, in sepia
    g.beginPath(); g.ellipse(120, 120, 26, 32, 0, 0, Math.PI * 2); g.fill(); g.fillRect(92, 150, 58, 110); g.beginPath(); g.ellipse(120, 100, 32, 22, 0, Math.PI, 0); g.fill();
    g.save(); g.translate(150, 128); g.rotate(-0.25); g.beginPath(); g.moveTo(0, -8); g.lineTo(60, -26); g.lineTo(60, 26); g.lineTo(0, 8); g.closePath(); g.fill(); g.restore();
    g.fillRect(40, 262, 176, 10); g.font = F(600, 18); g.textAlign = 'center'; g.fillText('2539', 128, 296); });
  const cur = ['#2A1E26', '#3A2A2E', '#141114'];
  return <group>
    <Bx p={[0, -0.05, 0]} s={[3.6, 0.1, 3.6]} m={floor} /><Bx p={[0, 2.6, 0]} s={[3.6, 0.1, 3.6]} m={dark} />
    <Bx p={[0, 1.3, -1.85]} s={[3.6, 2.7, 0.1]} m={wall} /><Bx p={[-1.85, 1.3, 0]} s={[0.1, 2.7, 3.6]} m={wall} /><Bx p={[1.85, 1.3, 0]} s={[0.1, 2.7, 3.6]} m={wall} />
    <Bx p={[0, 1.3, 1.85]} s={[3.6, 2.7, 0.1]} m={wall} />
    {/* the window opening (bright), then the curtains in front of it */}
    <mesh position={[0, 1.45, -1.79]} material={MB(win, 'yaiwin' + win)}><planeGeometry args={[1.3, 1.4]} /></mesh>
    {win !== '#FFF0C8' && <><mesh position={[0.25, 1.75, -1.78]} material={MB('#F4F0D8', 'moon')}><circleGeometry args={[0.13, 20]} /></mesh><Glow p={[0.25, 1.75, -1.77]} c="#DDE6FF" s={0.7} o={0.35} /></>}
    {leak > 0 && open < 0.05 && [[-0.79, 1.45, 0.025, 1.55], [0.79, 1.45, 0.025, 1.55], [0, 2.25, 1.6, 0.025], [0, 1.45, 0.012, 1.5], [0, 0.66, 1.5, 0.02]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, -1.5]} material={MB('#FFD98A', 'leak')}><planeGeometry args={[w, h]} /></mesh>)}
    {leak > 0 && open < 0.05 && <pointLight position={[0, 1.5, -1.3]} color="#FFC870" intensity={0.35} distance={2.2} decay={1.6} />}
    {cur.map((c, i) => <Curtain key={i} position={[(-0.36 - 0.4 * open) * (i === 1 ? -1 : 1), 1.45, -1.62 - i * 0.05]} w={0.75 * (1 - open * 0.6)} h={1.62} t={t} color={c} seed={i} />)}
    {cur.map((c, i) => <Curtain key={'b' + i} position={[(0.36 + 0.4 * open) * (i === 1 ? -1 : 1), 1.45, -1.62 - i * 0.05]} w={0.75 * (1 - open * 0.6)} h={1.62} t={t} color={c} seed={i + 5} />)}
    <Bx p={[0, 2.29, -1.6]} s={[1.9, 0.05, 0.05]} m={M('#3A2A20', 0.6)} />
    <RockingChair position={YAI_CHAIR} rock={Math.sin(t * 1.6) * 0.05} />
    {/* side table with a cold cup of tea, a clock with no hands */}
    <Bx p={[-0.75, 0.3, -0.85]} s={[0.45, 0.6, 0.45]} m={M('#4A3426', 0.7)} />
    <mesh position={[-0.75, 0.65, -0.85]} geometry={CYL} scale={[0.05, 0.09, 0.05]} material={M('#E8E2D4', 0.5)} />
    <group position={PHOTO} rotation={[0, -Math.PI / 2, 0]}><Bx p={[0, 0, -0.01]} s={[0.46, 0.56, 0.03]} m={M('#3A2A1A', 0.6)} /><mesh position={[0, 0, 0.012]} material={photo}><planeGeometry args={[0.38, 0.475]} /></mesh></group>
  </group>;
};
/** a torch held under the chin: a short steel tube, a lens disc, and a warm cone of light up the face */
export const Torch: React.FC<{a: V3; dir: V3; on: boolean}> = ({a, dir, on}) => { const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
  const tip = new THREE.Vector3(...dir).normalize().multiplyScalar(0.11).add(new THREE.Vector3(...a));
  return <><group position={a} quaternion={q}><mesh geometry={CYL} position={[0, 0.05, 0]} scale={[0.018, 0.13, 0.018]} material={M('#2A2C30', 0.4, 0.5)} />
      <mesh geometry={CYL} position={[0, 0.12, 0]} scale={[0.026, 0.03, 0.026]} material={on ? MB('#FFE2A0', 'lens') : M('#55575C', 0.4)} /></group>
    {on && <><Glow p={[tip.x, tip.y, tip.z]} c="#FFE9B0" s={0.1} o={0.3} /><pointLight position={[tip.x, tip.y + 0.16, tip.z + 0.06]} color="#FFE2A8" intensity={0.22} distance={0.7} decay={2} /></>}</>; };

// =====================================================================================================
// THE NURSERY: a white crib; a swaddled newborn (no rig — a bundle with an ink face) holding a baby bottle full of black coffee.
// =====================================================================================================
export const Crib: React.FC<{position: V3}> = ({position}) => { const w = M('#F2EEE6', 0.7);
  return <group position={position}><Bx p={[0, 0.5, 0]} s={[0.66, 0.06, 1.1]} m={w} /><Bx p={[0, 0.55, 0]} s={[0.6, 0.06, 1.04]} m={M('#BFD8E8', 0.9)} />
    {[-0.33, 0.33].map((x) => <Bx key={x} p={[x, 0.75, 0]} s={[0.03, 0.04, 1.1]} m={w} />)}
    {[-0.55, 0.55].map((z) => <Bx key={z} p={[0, 0.75, z]} s={[0.66, 0.04, 0.03]} m={w} />)}
    {[-0.33, 0.33].flatMap((x) => [-0.55, 0.55].map((z) => <Bx key={x + '' + z} p={[x, 0.42, z]} s={[0.04, 0.84, 0.04]} m={w} />))}
    {Array.from({length: 9}, (_, i) => <Bx key={'s' + i} p={[0.33, 0.66, -0.44 + i * 0.11]} s={[0.018, 0.2, 0.018]} m={w} />)}</group>; };
export const BABY_MOUTH: V3 = [0, 0.168, 0.15];   // in the baby's own frame
export const Baby: React.FC<{position: V3; t: number; eyes?: 'wide' | 'open'; s?: number; yaw?: number}> = ({position, t, eyes = 'wide', s = 1.35, yaw = 0}) => {
  const face = card('babyface-' + eyes, 256, 256, (g) => { g.fillStyle = '#E7B998'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#14110F'; g.fillStyle = '#14110F'; g.lineWidth = 6;
    [96, 160].forEach((x) => { if (eyes === 'wide') { g.beginPath(); g.arc(x, 104, 24, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, 104, 6, 0, Math.PI * 2); g.fill(); } else { g.beginPath(); g.arc(x, 104, 8, 0, Math.PI * 2); g.fill(); } });
    g.fillStyle = 'rgba(220,110,100,.45)'; g.beginPath(); g.arc(70, 150, 16, 0, 7); g.arc(186, 150, 16, 0, 7); g.fill(); });
  return <group position={position} rotation={[0, yaw, Math.sin(t * 1.3) * 0.04]} scale={s}>
    <mesh geometry={SPH} position={[0, 0.07, -0.06]} scale={[0.15, 0.09, 0.22]} material={M('#F3E3A8', 0.95)} castShadow />
    <mesh geometry={SPH} position={[0, 0.08, 0.16]} scale={[0.11, 0.08, 0.1]} material={M('#E7B998', 0.9)} castShadow />
    <mesh geometry={SPH} position={[0, 0.07, 0.25]} scale={[0.13, 0.085, 0.06]} material={M('#F3E3A8', 0.95)} />
    <mesh position={[0, 0.162, 0.16]} rotation={[-Math.PI / 2, 0, Math.PI]} material={face}><circleGeometry args={[0.09, 20]} /></mesh>
  </group>; };
/** a baby bottle of black coffee, with a curl of steam */
export const CoffeeBottle: React.FC<{position: V3; rot?: V3; t: number; level?: number}> = ({position, rot = [0, 0, 0], t, level = 0.8}) =>
  <group position={position} rotation={rot}>
    <mesh geometry={CYL} position={[0, 0.07, 0]} scale={[0.032, 0.14, 0.032]} material={M('#E9F2F4', 0.15, 0, {transparent: true, opacity: 0.45})} />
    <mesh geometry={CYL} position={[0, 0.07 * level, 0]} scale={[0.029, 0.14 * level, 0.029]} material={M('#2A1608', 0.3)} />
    <mesh geometry={CYL} position={[0, 0.15, 0]} scale={[0.035, 0.02, 0.035]} material={M('#7FB6D6', 0.5)} />
    <mesh position={[0, 0.18, 0]} material={M('#E8B76A', 0.6)}><coneGeometry args={[0.016, 0.05, 8]} /></mesh>
    {[0, 1, 2].map((i) => { const u = ((t * 0.7 + i / 3) % 1); return <mesh key={i} geometry={SPH} position={[Math.sin(u * 6 + i) * 0.02, 0.22 + u * 0.16, 0]} scale={0.012 + u * 0.02} material={M('#F4F6F7', 1, 0, {transparent: true, opacity: 0.5 * (1 - u)})} />; })}
  </group>;

// =====================================================================================================
// THE CLASSROOM: a green board "คาบที่ 1 · 5 นาที", a big countdown clock, a school bell on the wall.
// =====================================================================================================
export const BOARD: V3 = [0, 1.55, -2.4], BELL: V3 = [1.35, 2.2, -2.36];
export const Classroom: React.FC<{t: number; left: number; ring: number}> = ({t, left, ring}) => {
  const mm = Math.max(0, Math.floor(left / 60)), ss = Math.max(0, Math.floor(left % 60)); const txt = `${mm}:${String(ss).padStart(2, '0')}`;
  const board = card('board', 512, 256, (g) => { g.fillStyle = '#2E5A44'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#F2F0E6'; g.font = F(700, 46); g.textAlign = 'center'; g.fillText('คาบที่ 1', 256, 96); g.font = F(600, 40); g.fillText('วิชา: ทุกวิชา', 256, 160); g.font = F(500, 26); g.fillText('(5 นาที)', 256, 214); });
  const clock = card('clock-' + txt, 256, 128, (g) => { g.fillStyle = '#111'; g.fillRect(0, 0, 256, 128); g.fillStyle = left < 60 ? '#FF4A3A' : '#FFB43A'; g.font = F(700, 86); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 68); });
  const wall = PM('#E6DCC2', 'classwall'), floor = PM('#9A7B5A', 'classfloor'); const sh = ring > 0 ? Math.sin(t * 80) * 0.03 * ring : 0;
  return <group>
    <Bx p={[0, -0.05, 0]} s={[6, 0.1, 6]} m={floor} /><Bx p={[0, 1.5, -2.5]} s={[6, 3, 0.1]} m={wall} /><Bx p={[-2.8, 1.5, 0]} s={[0.1, 3, 6]} m={wall} /><Bx p={[2.8, 1.5, 0]} s={[0.1, 3, 6]} m={wall} />
    <Bx p={[BOARD[0], BOARD[1], BOARD[2]]} s={[2.5, 1.25, 0.04]} m={M('#3A2A1A', 0.6)} /><mesh position={[BOARD[0], BOARD[1], BOARD[2] + 0.025]} material={board}><planeGeometry args={[2.36, 1.12]} /></mesh>
    <group position={[-0.95, 2.45, -2.42]}><Bx p={[0, 0, 0]} s={[0.66, 0.36, 0.06]} m={M('#222', 0.5)} /><mesh position={[0, 0, 0.035]} material={clock}><planeGeometry args={[0.6, 0.3]} /></mesh></group>
    <group position={BELL} rotation={[0, 0, sh]}><mesh geometry={SPH} scale={[0.16, 0.16, 0.08]} material={M('#C8382E', 0.4, 0.3)} /><mesh geometry={SPH} position={[0, 0, 0.07]} scale={0.03} material={M('#D9D9D9', 0.3, 0.8)} /></group>
    {ring > 0 && <>{[0, 1, 2].map((i) => { const u = (t * 6 + i / 3) % 1; return <mesh key={i} position={[BELL[0], BELL[1], BELL[2] + 0.06]} material={MB('#FFFFFF', 'ring')}><ringGeometry args={[0.2 + u * 0.35, 0.215 + u * 0.35, 24]} /></mesh>; })}</>}
    {/* rows of small desks */}
    {[-1, 0, 1].flatMap((x) => [-0.6, 0.6].map((z) => <group key={x + ',' + z} position={[x * 1.1, 0, z]}><Bx p={[0, 0.55, 0]} s={[0.6, 0.04, 0.42]} m={M('#B98A5A', 0.6)} /><Bx p={[0, 0.27, 0]} s={[0.5, 0.54, 0.04]} m={M('#6A6E74', 0.5, 0.4)} /></group>))}
  </group>;
};

// =====================================================================================================
// THE LAW AGAINST LONG BOOKS: a fat book (pages = thickness) and giant scissors; the stamp "ผิดกฎหมาย".
// =====================================================================================================
export const Book: React.FC<{position: V3; thick: number; rot?: number; stamped?: number}> = ({position, thick, rot = 0, stamped = 0}) => {
  const cover = card('cover', 256, 320, (g) => { g.fillStyle = '#8A2A2A'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#E8D9A8'; g.font = F(700, 34); g.textAlign = 'center'; g.fillText('นิทาน', 128, 120); g.fillText('ก่อนนอน', 128, 165); g.font = F(500, 20); g.fillText('ฉบับสมบูรณ์', 128, 210); });
  const stamp = card('stamp', 512, 200, (g) => { g.strokeStyle = '#D8231C'; g.lineWidth = 14; g.strokeRect(14, 14, 484, 172); g.fillStyle = '#D8231C'; g.font = F(800, 92); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ผิดกฎหมาย', 256, 104); });
  return <group position={position} rotation={[0, rot, 0]}>
    <Bx p={[0, thick / 2, 0]} s={[0.24, thick, 0.32]} m={M('#F2ECD8', 0.9)} />
    <Bx p={[0, thick + 0.004, 0]} s={[0.25, 0.008, 0.33]} m={M('#8A2A2A', 0.6)} /><Bx p={[0, 0.004, 0]} s={[0.25, 0.008, 0.33]} m={M('#8A2A2A', 0.6)} />
    <mesh position={[0, thick + 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]} material={cover}><planeGeometry args={[0.23, 0.3]} /></mesh>
    {stamped > 0 && <mesh position={[0, thick + 0.011, 0.02]} rotation={[-Math.PI / 2, 0, 0.22]} scale={0.7 + 0.3 * (1 - stamped) + 0.3} material={stamp}><planeGeometry args={[0.3, 0.117]} /></mesh>}
  </group>; };
/** big tailor's shears; open 0…1, drawn from the pivot along +x */
export const Shears: React.FC<{position: V3; rot?: V3; open: number; size?: number}> = ({position, rot = [0, 0, 0], open, size = 1}) => { const st = M('#C9CDD2', 0.25, 0.85), hd = M('#1E1E22', 0.5);
  return <group position={position} rotation={rot} scale={size}>{[1, -1].map((s) => <group key={s} rotation={[0, 0, s * open * 0.35]}>
    <Bx p={[0.22, 0, s * 0.004]} s={[0.44, 0.03, 0.006]} m={st} /><mesh geometry={CYL} position={[-0.1, -s * 0.03, s * 0.004]} rotation={[Math.PI / 2, 0, 0]} scale={[0.05, 0.012, 0.035]} material={hd} /></group>)}
    <mesh geometry={CYL} rotation={[Math.PI / 2, 0, 0]} scale={[0.012, 0.02, 0.012]} material={st} /></group>; };

// =====================================================================================================
// THE YAWN CAMERA on a lamp post: a CCTV body with a yellow sign "กล้องจับหาว" and a red eye that lights when it catches one.
// =====================================================================================================
export const YawnCam: React.FC<{position: V3; pan: number; caught?: number}> = ({position, pan, caught = 0}) => {
  const sign = card('camsign', 512, 160, (g) => { g.fillStyle = '#F2C230'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#1A1A1A'; g.font = F(800, 70); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('กล้องจับหาว', 256, 70); g.font = F(500, 26); g.fillText(`เทศบาลเมือง · ${HANDLE}`, 256, 132); });
  return <group position={position}>
    <Bx p={[0, 0, 0]} s={[0.06, 0.06, 0.3]} m={M('#5A5E64', 0.5, 0.4)} />
    <group position={[0, -0.07, 0.15]} rotation={[0.25, pan, 0]}>
      <Bx p={[0, 0, 0.12]} s={[0.16, 0.14, 0.34]} m={M('#E8E8E4', 0.4)} /><Bx p={[0, 0.08, 0.14]} s={[0.2, 0.02, 0.4]} m={M('#E8E8E4', 0.4)} />
      <mesh geometry={CYL} position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} scale={[0.05, 0.02, 0.05]} material={M('#111', 0.2, 0.3)} />
      <mesh geometry={SPH} position={[0.05, 0.04, 0.31]} scale={0.012} material={MB(caught > 0.5 ? '#FF2A1A' : '#5A1A16', 'led' + (caught > 0.5 ? 1 : 0))} />
      {caught > 0.5 && <Glow p={[0.05, 0.04, 0.32]} c="#FF2A1A" s={0.1} o={0.7} />}
    </group>
    <mesh position={[0, -0.36, 0.12]} material={sign}><planeGeometry args={[0.5, 0.156]} /></mesh>
  </group>; };
/** the forbidden-word sign at the town entrance: "ห้ามพูดคำว่า" + the word under a red ban stroke */
export const BanSign: React.FC<{position: V3; yaw?: number; reveal: number}> = ({position, yaw = 0, reveal}) => {
  const top = card('ban-top', 512, 300, (g) => { g.fillStyle = '#F4F1E6'; g.fillRect(0, 0, 512, 300); g.strokeStyle = '#B5261E'; g.lineWidth = 18; g.strokeRect(9, 9, 494, 282);
    g.fillStyle = '#1A1A1A'; g.font = F(800, 64); g.textAlign = 'center'; g.fillText('เขตห้ามพูด', 256, 100); g.font = F(600, 44); g.fillText('คำว่า', 256, 170); g.font = F(500, 26); g.fillText('ฝ่าฝืน ปรับวันละ 1 ชั่วโมงแดด', 256, 250); });
  const word = card('ban-word', 512, 200, (g) => { g.fillStyle = '#F4F1E6'; g.fillRect(0, 0, 512, 200); g.fillStyle = '#1A1A1A'; g.font = F(800, 96); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('น่าเบื่อ', 256, 104);
    g.strokeStyle = '#D8231C'; g.lineWidth = 22; g.beginPath(); g.arc(256, 100, 86, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(195, 39); g.lineTo(317, 161); g.stroke(); });
  const cover = MB('#22262C', 'bancover');
  return <group position={position} rotation={[0, yaw, 0]}>
    {[-0.9, 0.9].map((x) => <mesh key={x} geometry={CYL} position={[x, 1.4, -0.03]} scale={[0.05, 2.8, 0.05]} material={M('#7A7E84', 0.5, 0.5)} />)}
    <mesh position={[0, 2.25, 0]} material={top}><planeGeometry args={[2.0, 1.17]} /></mesh>
    <mesh position={[0, 1.3, 0]} material={word}><planeGeometry args={[2.0, 0.78]} /></mesh>
    {reveal < 1 && <mesh position={[0, 1.3 + 0.39 * reveal, 0.01]} scale={[1, 1 - reveal, 1]} material={cover}><planeGeometry args={[2.0, 0.78]} /></mesh>}
  </group>; };
/** an X of grey duct tape over a mouth: add to the head frame (cm) once per character */
export const makeTape = () => { const g = new THREE.Group(); const m = new THREE.MeshLambertMaterial({color: '#B8BCC2'});
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(17, 4.6, 0.6), m); b.rotation.z = s * 0.42; g.add(b); }
  g.position.set(0, 6.5, 13.4); return g; };
