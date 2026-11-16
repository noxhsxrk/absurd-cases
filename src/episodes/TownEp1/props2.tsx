import React from 'react';
import * as THREE from 'three';
import {MB, M, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {Glow} from '../AbsurdEp8/props';
import {card} from './props';
import {HANDLE} from './data';

/** ในเมืองนี้ EP1 — acts 2–5: the town hall, the living room TV, the calendar, the megaphone, grandma's slate, the drawing, the clock, the jobless hens. */
export type V3 = [number, number, number];
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const BOXG = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 12), SPH = new THREE.SphereGeometry(1, 12, 8);
const Bx: React.FC<{p: V3; s: V3; m: THREE.Material; r?: V3}> = ({p, s, m, r = [0, 0, 0]}) => <mesh geometry={BOXG} position={p} scale={s} rotation={r} material={m} castShadow receiveShadow />;
const Plane: React.FC<{p: V3; w: number; h: number; m: THREE.Material; r?: V3}> = ({p, w, h, m, r = [0, 0, 0]}) => <mesh position={p} rotation={r} material={m}><planeGeometry args={[w, h]} /></mesh>;

// ---- a slide of the head's presentation (also shown on every TV)
const slideDraw = (n: number, app: number) => (g: CanvasRenderingContext2D) => {
  g.fillStyle = '#F4F1E6'; g.fillRect(0, 0, 640, 360); g.fillStyle = '#2E4A6A'; g.fillRect(0, 0, 640, 64); g.fillStyle = '#F4F1E6'; g.font = F(700, 34); g.textAlign = 'left'; g.fillText('วิสัยทัศน์หัวหน้าคนใหม่', 24, 44);
  g.fillStyle = '#1A1A1A'; g.font = F(800, 92); g.textAlign = 'center';
  if (app > 0) { g.fillText(`ภาคผนวก ${app}`, 320, 200); g.font = F(600, 40); g.fillText(`/ 900`, 320, 270); }
  else { g.fillText(`${n}`, 320, 200); g.font = F(600, 40); g.fillText('/ 300', 320, 262); }
  g.font = F(500, 22); g.fillStyle = '#6A6A6A'; g.textAlign = 'left'; ['• ข้อดีของการฟังให้จบ', '• ทำไมสไลด์ต้องมีตัวหนังสือเยอะ'].forEach((s, i) => g.fillText(s, 40, 312 + i * 0 + (i ? 28 : 0))); };
export const Slide: React.FC<{p: V3; w: number; n: number; app?: number; r?: V3}> = ({p, w, n, app = 0, r}) => { const m = card(`slide-${n}-${app}`, 640, 360, slideDraw(n, app)); return <Plane p={p} w={w} h={w * 0.5625} m={m} r={r} />; };

// =====================================================================================================
// THE TOWN HALL: a stage (top y 0.6) across z −4.25…−1.75, a big screen on the back wall, the podium at PODIUM, the live camera with ON AIR
// on its tripod at TVCAM, a stack of printed slides, a banner. Rows of chairs face the stage from z 0.6…3.4.
// =====================================================================================================
export const STAGE_Y = 0.6, PODIUM: V3 = [0.9, STAGE_Y, -2.55], BOSS_AT: V3 = [0.9, STAGE_Y, -3.05], SCREEN: V3 = [0, 3.05, -4.38], TVCAM: V3 = [-1.25, 0, -0.55];
export const SEATS: V3[] = [-2.1, -1.2, 0.9, 1.8].flatMap((x, i) => [1.0, 2.0, 3.0].map((z, j) => [x + (j % 2) * 0.1, 0, z] as V3)).slice(0, 10);
export const Hall: React.FC<{t: number; slide: number; app?: number; stack?: number; onAir?: boolean; night?: number; count?: number}> = ({t, slide, app = 0, stack = 1, onAir = true, night = 0, count = -1}) => {
  const wall = PM('#C9B48A', 'hallwall'), floor = PM('#7A5A3A', 'hallfloor'), stageM = PM('#5A3A2A', 'stage'), curtain = M('#8A2430', 0.9);
  const banner = card('banner', 1024, 160, (g) => { g.fillStyle = '#2E4A6A'; g.fillRect(0, 0, 1024, 160); g.fillStyle = '#F2C230'; g.font = F(800, 70); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ยินดีต้อนรับหัวหน้าคนใหม่', 512, 70); g.font = F(500, 24); g.fillStyle = '#F4F1E6'; g.fillText(`ถ่ายทอดสดทุกบ้าน · ${HANDLE}`, 512, 132); });
  const counter = count >= 0 ? card(`count-${Math.round(count / 1000)}`, 640, 360, (g) => { g.fillStyle = '#101418'; g.fillRect(0, 0, 640, 360); g.fillStyle = '#F2C230'; g.font = F(600, 34); g.textAlign = 'center'; g.fillText('อ้าปากค้างทั้งหมด', 320, 90);
    g.font = F(800, 120); g.fillText(Math.round(count).toLocaleString('en-US'), 320, 230); g.font = F(600, 40); g.fillText('คน', 320, 300); }) : null;
  const sh = 3.5 * stack;
  return <group>
    <Bx p={[0, -0.05, 0]} s={[8, 0.1, 10]} m={floor} /><Bx p={[0, 3, -4.5]} s={[8, 6, 0.1]} m={wall} /><Bx p={[-4, 3, 0]} s={[0.1, 6, 10]} m={wall} /><Bx p={[4, 3, 0]} s={[0.1, 6, 10]} m={wall} />
    <Bx p={[0, STAGE_Y / 2, -3]} s={[7, STAGE_Y, 2.6]} m={stageM} />
    {[-3.4, 3.4].map((x) => <Bx key={x} p={[x, 3, -4.2]} s={[1.1, 6, 0.2]} m={curtain} />)}
    <Bx p={[0, 5.3, -4.2]} s={[7.9, 0.9, 0.2]} m={curtain} />
    <Bx p={[SCREEN[0], SCREEN[1], SCREEN[2] - 0.03]} s={[4.3, 2.5, 0.05]} m={M('#1A1A1A', 0.5)} />
    {counter ? <Plane p={SCREEN} w={4.1} h={2.3} m={counter} /> : <Slide p={SCREEN} w={4.1} n={slide} app={app} />}
    <Plane p={[0, 4.65, -4.08]} w={4.8} h={0.75} m={banner} />
    {/* the podium */}
    <group position={PODIUM}><Bx p={[0, 0.55, 0]} s={[0.7, 1.1, 0.45]} m={M('#3A2A20', 0.6)} /><Bx p={[0, 1.12, -0.02]} s={[0.78, 0.05, 0.52]} m={M('#2A1E16', 0.6)} />
      <mesh geometry={CYL} position={[0, 1.25, 0.12]} rotation={[0.5, 0, 0]} scale={[0.008, 0.3, 0.008]} material={M('#222', 0.4, 0.5)} /><mesh geometry={SPH} position={[0, 1.38, 0.2]} scale={0.025} material={M('#111', 0.5)} /></group>
    {/* the printed slides: a stack as tall as the speech */}
    <group position={[-1.7, STAGE_Y, -3.1]}><Bx p={[0, sh / 2, 0]} s={[0.42, sh, 0.3]} m={PM('#F2F0E8', 'paper')} />{Array.from({length: Math.floor(sh / 0.25)}, (_, i) => <Bx key={i} p={[0, 0.12 + i * 0.25, 0.152]} s={[0.4, 0.008, 0.004]} m={M('#C9C4B8', 0.9)} />)}</group>
    {/* the live camera */}
    <group position={TVCAM} rotation={[0, Math.atan2(BOSS_AT[0] - TVCAM[0], BOSS_AT[2] - TVCAM[2]), 0]}>
      {[0, 2.1, 4.2].map((a) => <mesh key={a} geometry={CYL} position={[Math.sin(a) * 0.25, 0.55, Math.cos(a) * 0.25]} rotation={[Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4]} scale={[0.015, 1.15, 0.015]} material={M('#2A2A2E', 0.5, 0.4)} />)}
      <Bx p={[0, 1.25, 0]} s={[0.3, 0.32, 0.55]} m={M('#3A3D44', 0.4, 0.3)} /><mesh geometry={CYL} position={[0, 1.27, 0.38]} rotation={[Math.PI / 2, 0, 0]} scale={[0.1, 0.22, 0.1]} material={M('#151515', 0.3)} />
      <Bx p={[0, 1.5, 0.05]} s={[0.22, 0.09, 0.05]} m={onAir && Math.floor(t * 2) % 2 === 0 ? MB('#FF2A1A', 'onair') : M('#5A1A16', 0.5)} />
      {onAir && <Glow p={[0, 1.5, 0.1]} c="#FF2A1A" s={0.25} o={Math.floor(t * 2) % 2 === 0 ? 0.6 : 0.1} />}</group>
    {/* chairs */}
    {SEATS.map((p, i) => <group key={i} position={p}><Bx p={[0, 0.45, 0]} s={[0.46, 0.05, 0.44]} m={M('#8A3A30', 0.7)} /><Bx p={[0, 0.75, 0.21]} s={[0.46, 0.55, 0.05]} m={M('#8A3A30', 0.7)} />
      {[[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].map(([x, z], k) => <Bx key={k} p={[x, 0.22, z]} s={[0.03, 0.44, 0.03]} m={M('#333', 0.5)} />)}</group>)}
    <spotLight position={[0, 5.5, 1.5]} target-position={[0.9, 1.2, -3]} angle={0.5} penumbra={0.6} intensity={night ? 8 : 14} distance={14} castShadow color="#FFF0D0" />
    <hemisphereLight args={['#FFF4E4', '#5A4A3A', 0.6]} />
  </group>;
};
/** a full beard after three years at the podium (head frame, cm) */
export const makeBeard = () => { const g = new THREE.Group(); const m = new THREE.MeshLambertMaterial({color: '#2A2420'});
  const b = new THREE.Mesh(new THREE.BoxGeometry(22, 26, 8), m); b.position.set(0, -6, 10); g.add(b); const b2 = new THREE.Mesh(new THREE.BoxGeometry(14, 16, 6), m); b2.position.set(0, -24, 9); g.add(b2); return g; };

// =====================================================================================================
// THE LIVING ROOM: a sofa facing the TV (TV at z −1.5 facing +z), a window in the back wall left of the TV (its sky follows the sun), a wall calendar.
// =====================================================================================================
export const SOFA: V3 = [0, 0, 0.9], TV: V3 = [0, 0.95, -1.5], CAL: V3 = [-1.45, 1.6, -0.2];
const tvDraw = (n: number, app: number, part2: boolean) => (g: CanvasRenderingContext2D) => { slideDraw(n, app)(g);
  if (part2) { g.fillStyle = '#101418'; g.fillRect(0, 0, 640, 360); g.fillStyle = '#F2C230'; g.font = F(800, 64); g.textAlign = 'center'; g.fillText('พรุ่งนี้ 9 โมง', 320, 130); g.fillStyle = '#F4F1E6'; g.font = F(800, 88); g.fillText('ภาค 2', 320, 236); g.font = F(600, 34); g.fillText('900 สไลด์', 320, 300); }
  g.fillStyle = '#D8231C'; g.fillRect(500, 78, 120, 44); g.fillStyle = '#FFF'; g.font = F(800, 30); g.textAlign = 'center'; g.fillText('LIVE', 560, 111); };
export const TVSet: React.FC<{p: V3; n: number; app?: number; part2?: boolean; w?: number; t: number}> = ({p, n, app = 0, part2 = false, w = 1.1, t}) => {
  const m = card(`tv-${n}-${app}-${part2}`, 640, 360, tvDraw(n, app, part2)); const h = w * 0.5625;
  return <group position={p}><Bx p={[0, 0, -0.04]} s={[w + 0.08, h + 0.08, 0.06]} m={M('#151515', 0.4)} /><Plane p={[0, 0, 0]} w={w} h={h} m={m} />
    <pointLight position={[0, 0, 0.5]} color="#9FC2FF" intensity={0.5 + 0.1 * Math.sin(t * 17)} distance={3} decay={1.5} /></group>; };
export const Calendar: React.FC<{p: V3; year: number; flip?: number; r?: V3}> = ({p, year, flip = 0, r = [0, Math.PI / 2, 0]}) => {
  const m = card(`cal-${year}`, 256, 320, (g) => { g.fillStyle = '#F4F1E6'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#C8382E'; g.fillRect(0, 0, 256, 70); g.fillStyle = '#FFF'; g.font = F(700, 40); g.textAlign = 'center'; g.fillText('มกราคม', 128, 50);
    g.fillStyle = '#1A1A1A'; g.font = F(800, 70); g.fillText(`${year}`, 128, 160); g.font = F(500, 20); for (let k = 0; k < 28; k++) g.fillText(`${k + 1}`, 32 + (k % 7) * 32, 200 + Math.floor(k / 7) * 28); });
  return <group position={p} rotation={r}><Bx p={[0, 0, -0.01]} s={[0.42, 0.52, 0.01]} m={M('#3A2A20', 0.6)} /><Plane p={[0, 0, 0.002]} w={0.4} h={0.5} m={m} />
    {flip > 0.02 && flip < 0.35 && <group position={[0, 0.25, 0.006]} rotation={[-Math.PI * flip / 0.35, 0, 0]}><Plane p={[0, -0.25, 0]} w={0.4} h={0.5} m={M('#F4F1E6', 0.9, 0, {side: THREE.DoubleSide})} /></group>}</group>; };
export const LivingRoom: React.FC<{t: number; skyC: string; n: number; app?: number; part2?: boolean; year: number; flip?: number}> = ({t, skyC, n, app = 0, part2 = false, year, flip = 0}) => {
  const wall = PM('#D9C9A8', 'lrwall'), floor = PM('#8A6A4A', 'lrfloor');
  return <group>
    <Bx p={[0, -0.05, 0]} s={[4, 0.1, 4]} m={floor} /><Bx p={[0, 1.4, -1.85]} s={[4, 2.8, 0.1]} m={wall} /><Bx p={[-1.7, 1.4, 0]} s={[0.1, 2.8, 4]} m={wall} /><Bx p={[1.7, 1.4, 0]} s={[0.1, 2.8, 4]} m={wall} />
    <Plane p={[1.05, 1.55, -1.79]} w={0.9} h={1.0} m={MB(skyC, 'lrsky' + skyC)} /><Bx p={[1.05, 1.55, -1.78]} s={[0.98, 0.05, 0.02]} m={M('#F4F1E6', 0.6)} /><Bx p={[1.05, 1.55, -1.78]} s={[0.05, 1.05, 0.02]} m={M('#F4F1E6', 0.6)} />
    <Bx p={[0, 0.3, -1.55]} s={[1.4, 0.6, 0.4]} m={M('#5A3A2A', 0.6)} /><TVSet p={TV} n={n} app={app} part2={part2} t={t} />
    <group position={SOFA}><Bx p={[0, 0.25, 0]} s={[1.8, 0.5, 0.8]} m={M('#4A6A7A', 0.9)} /><Bx p={[0, 0.65, 0.35]} s={[1.8, 0.6, 0.15]} m={M('#4A6A7A', 0.9)} />{[-0.95, 0.95].map((x) => <Bx key={x} p={[x, 0.42, 0]} s={[0.15, 0.4, 0.8]} m={M('#4A6A7A', 0.9)} />)}</group>
    <Calendar p={CAL} year={year} flip={flip} />
    <hemisphereLight args={['#FFF0DA', '#5A4A3A', 0.55]} /><pointLight position={[0, 2.6, 0.5]} color="#FFE2B8" intensity={1.4} distance={6} decay={1.4} />
  </group>; };
/** the kid's notepad of tally marks: n strokes in fives */
export const Tally: React.FC<{p: V3; n: number; r?: V3}> = ({p, n, r = [-Math.PI / 2, 0, 0]}) => { const k = Math.min(300, Math.round(n));
  const m = card(`tally-${k}`, 256, 320, (g) => { g.fillStyle = '#FBF8EE'; g.fillRect(0, 0, 256, 320); g.strokeStyle = '#9FC2E0'; g.lineWidth = 1; for (let y = 30; y < 320; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    g.strokeStyle = '#1A2A6A'; g.lineWidth = 3; const shown = Math.min(k, 100); for (let i = 0; i < shown; i++) { const grp = Math.floor(i / 5), j = i % 5, x = 16 + (grp % 5) * 48, y = 14 + Math.floor(grp / 5) * 22;
      g.beginPath(); if (j < 4) { g.moveTo(x + j * 8, y); g.lineTo(x + j * 8, y + 18); } else { g.moveTo(x - 4, y + 16); g.lineTo(x + 30, y + 2); } g.stroke(); }
    g.fillStyle = '#C8382E'; g.font = F(800, 40); g.textAlign = 'right'; g.fillText(`${k}`, 246, 306); });
  return <group position={p} rotation={r}><Plane p={[0, 0, 0]} w={0.2} h={0.25} m={m} /></group>; };

// =====================================================================================================
// THE MEGAPHONE: a white cone with a red rim and a pistol grip; axis = which way it shouts. Rings fly out of it when it is used.
// =====================================================================================================
export const Megaphone: React.FC<{at: V3; dir: V3; size?: number; t?: number; shout?: number}> = ({at, dir, size = 1, t = 0, shout = -1}) => {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()); const u = t - shout;
  return <group position={at} quaternion={q} scale={size}>
    <mesh position={[0, 0.13, 0]} material={M('#F2F0EA', 0.5)}><cylinderGeometry args={[0.11, 0.04, 0.26, 14, 1, true]} /></mesh>
    <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]} material={M('#C8382E', 0.5)}><torusGeometry args={[0.11, 0.012, 6, 16]} /></mesh>
    <mesh geometry={CYL} position={[0, -0.02, 0]} scale={[0.045, 0.08, 0.045]} material={M('#C8382E', 0.5)} />
    <mesh geometry={BOXG} position={[0, 0.02, -0.06]} scale={[0.03, 0.03, 0.09]} material={M('#2A2A2E', 0.5)} />
    {shout >= 0 && u > 0 && u < 1.6 && [0, 1, 2, 3].map((i) => { const k = ((u * 1.6 + i / 4) % 1); return <mesh key={i} position={[0, 0.3 + k * 1.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={M('#FFFFFF', 1, 0, {transparent: true, opacity: 0.8 * (1 - k), side: THREE.DoubleSide})}><torusGeometry args={[0.12 + k * 0.9, 0.012 + k * 0.01, 4, 24]} /></mesh>; })}
  </group>; };

// =====================================================================================================
// GRANDMA'S SLATE: two drawings — yawn → sun down; jaw-drop → sun up. hi = 0 none, 1 the yawn panel, 2 both, 3 the up arrow ringed.
// =====================================================================================================
export const Slate: React.FC<{p: V3; r?: V3; hi: number; w?: number}> = ({p, r = [0, 0, 0], hi, w = 0.5}) => {
  const m = card(`slate-${hi}`, 512, 300, (g) => { g.fillStyle = '#2C3A34'; g.fillRect(0, 0, 512, 300); g.strokeStyle = '#EDEAE0'; g.fillStyle = '#EDEAE0'; g.lineWidth = 5; g.lineCap = 'round';
    const face = (cx: number, yawn: boolean) => { g.beginPath(); g.arc(cx, 150, 52, 0, Math.PI * 2); g.stroke();
      if (yawn) { [cx - 20, cx + 20].forEach((x) => { g.beginPath(); g.arc(x, 136, 9, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }); g.beginPath(); g.ellipse(cx, 174, 16, 20, 0, 0, Math.PI * 2); g.stroke(); }
      else { [cx - 20, cx + 20].forEach((x) => { g.beginPath(); g.arc(x, 134, 11, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, 134, 2, 0, Math.PI * 2); g.fill(); }); g.beginPath(); g.ellipse(cx, 178, 8, 20, 0, 0, Math.PI * 2); g.stroke(); } };
    const sun = (cx: number, cy: number, up: boolean) => { g.beginPath(); g.arc(cx, cy, 18, 0, Math.PI * 2); g.stroke(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); g.lineTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32); g.stroke(); }
      const ax = cx + 52; g.beginPath(); g.moveTo(ax, up ? 200 : 100); g.lineTo(ax, up ? 100 : 200); g.stroke(); g.beginPath(); g.moveTo(ax - 14, up ? 116 : 184); g.lineTo(ax, up ? 100 : 200); g.lineTo(ax + 14, up ? 116 : 184); g.stroke(); };
    if (hi >= 1) { face(70, true); sun(160, 120, false); }
    if (hi >= 2) { face(326, false); sun(416, 180, true); }
    if (hi >= 3) { g.strokeStyle = '#F2C230'; g.lineWidth = 6; g.beginPath(); g.ellipse(468, 150, 34, 70, 0, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = 'rgba(237,234,224,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(256, 20); g.lineTo(256, 280); g.stroke(); });
  return <group position={p} rotation={r}><Bx p={[0, 0, -0.012]} s={[w + 0.04, w * 0.586 + 0.04, 0.02]} m={M('#6A4A30', 0.6)} /><Plane p={[0, 0, 0]} w={w} h={w * 0.586} m={m} /></group>; };
/** a child's crayon drawing: a house, grass, and the sun drawn as a light bulb */
export const Drawing: React.FC<{p: V3; r?: V3; w?: number}> = ({p, r = [-Math.PI / 2, 0, Math.PI], w = 0.3}) => {
  const m = card('drawing', 400, 300, (g) => { g.fillStyle = '#FBF8EE'; g.fillRect(0, 0, 400, 300); g.lineWidth = 6; g.lineCap = 'round'; g.strokeStyle = '#3A8A3A'; g.beginPath(); g.moveTo(10, 260); g.lineTo(390, 260); g.stroke();
    g.strokeStyle = '#C8382E'; g.strokeRect(60, 170, 110, 90); g.beginPath(); g.moveTo(50, 172); g.lineTo(115, 120); g.lineTo(180, 172); g.stroke();
    g.strokeStyle = '#E8B020'; g.beginPath(); g.arc(290, 80, 36, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#6A6A6A'; g.strokeRect(274, 116, 32, 24); g.beginPath(); g.moveTo(274, 128); g.lineTo(306, 128); g.stroke(); g.beginPath(); g.moveTo(282, 146); g.lineTo(298, 146); g.stroke();
    g.strokeStyle = '#E8B020'; g.beginPath(); g.moveTo(280, 92); g.lineTo(290, 70); g.lineTo(300, 92); g.stroke(); g.fillStyle = '#1A2A6A'; g.font = F(700, 26); g.fillText('ดวงอาทิตย์', 230, 190); });
  return <group position={p} rotation={r}><Plane p={[0, 0, 0]} w={w} h={w * 0.75} m={m} /></group>; };
/** a street clock on a post: hh, mm drive the hands (mm may run away) */
export const StreetClock: React.FC<{p: V3; hh: number; mm: number; yaw?: number}> = ({p, hh, mm, yaw = 0}) => { const face = card('clockface', 256, 256, (g) => { g.fillStyle = '#F4F1E6'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.fillStyle = '#1A1A1A'; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.fillRect(128 + Math.sin(a) * 104 - 4, 128 - Math.cos(a) * 104 - 10, 8, 20); } });
  return <group position={p} rotation={[0, yaw, 0]}><mesh geometry={CYL} position={[0, 1.6, -0.06]} scale={[0.06, 3.2, 0.06]} material={M('#2A3A34', 0.5, 0.4)} />
    <mesh geometry={CYL} position={[0, 3.3, -0.04]} rotation={[Math.PI / 2, 0, 0]} scale={[0.42, 0.08, 0.42]} material={M('#2A3A34', 0.5, 0.4)} /><mesh position={[0, 3.3, 0.005]} material={face}><circleGeometry args={[0.38, 24]} /></mesh>
    <group position={[0, 3.3, 0.02]} rotation={[0, 0, -(hh % 12 + mm / 60) * Math.PI / 6]}><mesh geometry={BOXG} position={[0, 0.1, 0]} scale={[0.03, 0.2, 0.01]} material={MB('#1A1A1A', 'hand')} /></group>
    <group position={[0, 3.3, 0.025]} rotation={[0, 0, -(mm / 60) * Math.PI * 2]}><mesh geometry={BOXG} position={[0, 0.15, 0]} scale={[0.02, 0.3, 0.01]} material={MB('#1A1A1A', 'hand')} /></group></group>; };
/** the jobless hen's cardboard sign */
export const HenSign: React.FC<{p: V3; yaw?: number}> = ({p, yaw = 0}) => { const m = card('hensign', 256, 160, (g) => { g.fillStyle = '#C8A06A'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#2A1A10'; g.font = F(700, 34); g.textAlign = 'center'; g.fillText('รับขัน', 128, 62); g.font = F(600, 26); g.fillText('ทุกเวลา · ราคาถูก', 128, 112); });
  return <group position={p} rotation={[0, yaw, 0]}><Bx p={[0, 0.14, -0.01]} s={[0.36, 0.24, 0.01]} m={M('#A88050', 0.9)} /><Plane p={[0, 0.14, 0]} w={0.34} h={0.21} m={m} /><Bx p={[0.18, 0.06, -0.12]} s={[0.22, 0.12, 0.18]} m={M('#B8925A', 0.9)} /></group>; };
/** a street tree that leans its whole crown toward a lamp (lean 0…1) */
export const LeanTree: React.FC<{p: V3; lean: number; dir?: number}> = ({p, lean, dir = 1}) => <group position={p} rotation={[0, 0, -dir * lean * 0.75]}>
  <mesh geometry={CYL} position={[0, 1.3, 0]} scale={[0.11, 2.6, 0.11]} material={M('#5A4030', 0.8)} /><mesh position={[0, 3.0, 0]} material={M('#3E6A34', 0.85)} castShadow><icosahedronGeometry args={[1.0, 0]} /></mesh>
  <mesh position={[0.3 * dir, 3.5, 0.2]} material={M('#4A7A3C', 0.85)}><icosahedronGeometry args={[0.7, 0]} /></mesh></group>;
export const lean01 = (k: number) => cl(k);
