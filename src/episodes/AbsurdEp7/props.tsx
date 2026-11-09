import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F, glowTex} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {Handcuffs} from '../AbsurdEp1/props';
import {HANDLE, V3} from './data';
import MAP from '../thailand_map.json';

/** EP7 props. Everything is a pure function of its props (Remotion renders frames out of order). */
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const CREAM = '#E6E7CF', NAVY = '#152028', TEAL = '#476F66', BRICK = '#B0402E', INK = '#1E2228', YEL = '#FFD84A';
const once = <T,>(k: string, f: () => T): T => { const c = (once as any).c ?? ((once as any).c = new Map()); if (!c.has(k)) c.set(k, f()); return c.get(k); };
const seg = (a: THREE.Vector3, b: THREE.Vector3, w: number, m: THREE.Material, key: string, d = w) => {
  const v = b.clone().sub(a), L = v.length(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
  return <mesh key={key} position={a.clone().add(b).multiplyScalar(0.5)} quaternion={q} material={m}><boxGeometry args={[w, L + w * 0.6, d]} /></mesh>;
};
export const Glow: React.FC<{p: V3; c: string; s: number; o: number}> = ({p, c, s, o}) => o <= 0.01 ? null :
  <sprite position={p} scale={s}><spriteMaterial map={glowTex()} color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></sprite>;

// =====================================================================================================
// THE ACCUSED: นช. ฟ้าผ่า — a thick yellow zigzag bolt with an angry ink face on its top stroke (same face
// language as the durian). Origin at its bottom tip, height 1 (scale it), faces +z. `waist()` = cuff point.
// =====================================================================================================
const ZIG: [number, number][] = [[0.04, 1.0], [0.26, 0.64], [0.05, 0.58], [0.24, 0.26], [0.02, 0.22], [0.12, 0.0]];
export const ZAP_WAIST: V3 = [0.145, 0.42, 0];
const faceTex = (mode: string) => tex('zapface-' + mode, 256, 192, (g) => {
  g.clearRect(0, 0, 256, 192); g.strokeStyle = '#1A1408'; g.fillStyle = '#1A1408'; g.lineCap = 'round';
  // brows: angry V
  g.lineWidth = 16; g.beginPath(); g.moveTo(34, 52); g.lineTo(112, 82); g.moveTo(222, 52); g.lineTo(144, 82); g.stroke();
  // eyes
  const shut = mode === 'blink';
  [92, 164].forEach((x) => { if (shut) { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 18, 112); g.lineTo(x + 18, 112); g.stroke(); } else { g.beginPath(); g.ellipse(x, 112, 15, 19, 0, 0, 7); g.fill(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x + 5, 105, 5, 0, 7); g.fill(); g.fillStyle = '#1A1408'; } });
  // mouth: a flat scowl, open when it "answers"
  g.lineWidth = 9; if (mode === 'shout') { g.beginPath(); g.ellipse(128, 160, 26, 16, 0, 0, 7); g.fill(); } else { g.beginPath(); g.moveTo(98, 162); g.quadraticCurveTo(128, 150, 158, 162); g.stroke(); }
});
type ZapP = {position?: V3; scale?: number; yaw?: number; roll?: number; t: number; face?: 'angry' | 'blink' | 'shout'; glow?: number; cuffed?: number; arcs?: number; seed?: number; tag?: boolean};
export const Zap: React.FC<ZapP> = ({position, scale = 1, yaw = 0, roll = 0, t, face = 'angry', glow = 1, cuffed = 0, arcs = 1, seed = 0, tag = true}) => {
  const fr = Math.floor(t * 30); const j = (i: number) => (hash(fr * 3.1 + i * 7 + seed) - 0.5) * 0.012;
  const P = ZIG.map(([x, y], i) => new THREE.Vector3(x + j(i), y + j(i + 9), 0));
  const flick = 0.85 + 0.15 * hash(fr + seed * 5);
  const yel = MB(YEL, 'zap'), wh = MB('#FFFBEA', 'zapc');
  const blink = face === 'angry' && ((t + seed * 0.7) % 2.7) < 0.08 ? 'blink' : face;
  const fm = useMemo(() => ({angry: new THREE.MeshBasicMaterial({map: faceTex('angry'), transparent: true, toneMapped: false, depthWrite: false}), blink: new THREE.MeshBasicMaterial({map: faceTex('blink'), transparent: true, toneMapped: false, depthWrite: false}), shout: new THREE.MeshBasicMaterial({map: faceTex('shout'), transparent: true, toneMapped: false, depthWrite: false})}), []);
  return <group position={position} rotation={[0, yaw, roll]} scale={scale}>
    {P.slice(1).map((p, i) => seg(P[i], p, 0.085, yel, 'y' + i, 0.06))}
    {P.slice(1).map((p, i) => seg(P[i], p, 0.034, wh, 'w' + i, 0.064))}
    {/* face on the top stroke */}
    <mesh position={[0.15, 0.79, 0.036]} rotation={[0, 0, -0.98]} material={fm[blink]}><planeGeometry args={[0.2, 0.15]} /></mesh>
    {/* little crackling arcs */}
    {arcs > 0 && Array.from({length: 3}, (_, i) => { const a = (hash(fr * 1.3 + i * 11 + seed) * 2 - 1) * Math.PI; const base = P[1 + i];
      const tip = base.clone().add(new THREE.Vector3(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0)); const mid = base.clone().lerp(tip, 0.5).add(new THREE.Vector3(j(i + 20) * 4, j(i + 30) * 4, 0));
      return hash(fr + i * 5 + seed) < 0.7 * arcs ? <group key={'a' + i}>{seg(base, mid, 0.012, wh, 'a1')}{seg(mid, tip, 0.012, wh, 'a2')}</group> : null; })}
    <Glow p={[0.14, 0.5, -0.02]} c="#FFE07A" s={1.5 * glow} o={0.55 * glow * flick} />
    {glow > 0.05 && <pointLight position={[0.14, 0.5, 0.3]} color="#FFE07A" intensity={3.5 * glow * flick} distance={4} decay={1.6} />}
    {cuffed > 0 && <InsulCuff position={ZAP_WAIST} rotation={[Math.PI / 2, 0, 0.35]} k={cuffed} size={2.6} tag={tag} />}
  </group>;
};
/** a sky-to-target strike: a thick jagged bolt from a to b (redrawn every frame), white core */
export const Strike: React.FC<{a: V3; b: V3; t: number; n?: number; amp?: number; w?: number; seed?: number}> = ({a, b, t, n = 9, amp = 0.15, w = 0.05, seed = 0}) => {
  const fr = Math.floor(t * 30) + seed * 13; const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const pts = Array.from({length: n + 1}, (_, i) => { const p = A.clone().lerp(B, i / n); if (i && i < n) p.add(new THREE.Vector3(hash(fr + i * 3) - 0.5, hash(fr + i * 5) - 0.5, hash(fr + i * 7) - 0.5).multiplyScalar(amp * 2)); return p; });
  return <group>{pts.slice(1).map((p, i) => seg(pts[i], p, w, MB(YEL, 'zap'), 'y' + i))}{pts.slice(1).map((p, i) => seg(pts[i], p, w * 0.4, MB('#FFFFFF'), 'w' + i))}</group>;
};

// =====================================================================================================
// Insulated handcuffs: the series' big white cuffs, each ring wrapped in thick black rubber, with a tag
// =====================================================================================================
const tagTex = () => tex('insul-tag', 256, 128, (g) => { g.fillStyle = '#F2C230'; g.fillRect(0, 0, 256, 128); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(5, 5, 246, 118);
  g.fillStyle = INK; g.textAlign = 'center'; g.font = F(700, 44); g.fillText('ฉนวนกันไฟ', 128, 60); g.font = F(700, 34); g.fillText('มอก. ✓', 128, 104); });
export const InsulCuff: React.FC<{position?: V3; rotation?: V3; k: number; size?: number; tag?: boolean}> = ({position, rotation, k, size = 1, tag = true}) => {
  const tm = useMemo(() => new THREE.MeshBasicMaterial({map: tagTex(), toneMapped: false, side: THREE.DoubleSide}), []);
  if (k <= 0.001) return null; const r = 0.024 * size; const rub = M('#141416', 0.9);
  return <group position={position} rotation={rotation} scale={k}>
    <Handcuffs k={1} size={size} />
    {[-1, 1].map((s) => <mesh key={s} position={[s * r * 1.45, 0, 0]} material={rub}><torusGeometry args={[r, r * 0.34, 8, 20]} /></mesh>)}
    {tag && <group position={[0, -r * 1.6, r * 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, -r * 0.9]} material={MB('#3A3E42')}><boxGeometry args={[r * 0.08, r * 0.08, r * 1.8]} /></mesh>
      <mesh position={[0, -r * 0.02, -r * 2.4]} rotation={[Math.PI / 2, 0, 0]} material={tm}><planeGeometry args={[r * 2.4, r * 1.2]} /></mesh></group>}
  </group>;
};

// =====================================================================================================
// BEDROOM additions: the desk with his computer (screen states), the router with its sign, the chair
// Desk against the west wall south of the window; monitor faces +x; he sits facing −x.
// =====================================================================================================
export const DESK = {x: -1.78, z: 0.62, top: 0.74};
export const ROUTER: V3 = [-1.86, DESK.top, 0.08];
const gameTex = () => tex('ep7-game', 512, 320, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#3A2D6E'); gr.addColorStop(1, '#C2577A'); g.fillStyle = gr; g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#1E1A3A'; for (let i = 0; i < 9; i++) { const h = 60 + hash(i) * 120; g.fillRect(i * 60, 320 - h, 52, h); }
  g.fillStyle = '#FFE07A'; for (let i = 0; i < 40; i++) g.fillRect(hash(i * 3) * 512, hash(i * 5) * 180, 4, 4);
  g.fillStyle = '#7FE0A0'; g.fillRect(230, 190, 40, 40); g.fillStyle = '#FFFFFF'; g.font = F(700, 30); g.fillText('LV 99', 20, 40); g.fillStyle = '#E0322E'; g.fillRect(380, 20, 112, 16);
});
const noNetTex = () => tex('ep7-nonet', 512, 320, (g) => {
  g.fillStyle = '#2A2E36'; g.fillRect(0, 0, 512, 320); g.strokeStyle = '#E0322E'; g.lineWidth = 22; g.lineCap = 'round';
  g.beginPath(); g.moveTo(206, 70); g.lineTo(306, 170); g.moveTo(306, 70); g.lineTo(206, 170); g.stroke();
  g.fillStyle = '#F2F2F0'; g.font = F(700, 46); g.textAlign = 'center'; g.fillText('ไม่มีอินเทอร์เน็ต', 256, 250);
});
export const Computer: React.FC<{dead: boolean; t: number}> = ({dead, t}) => {
  const scr = useMemo(() => [new THREE.MeshBasicMaterial({map: gameTex(), toneMapped: false}), new THREE.MeshBasicMaterial({map: noNetTex(), toneMapped: false})], []);
  const wood = PM('#8A6A4A', 'desk7'), dk = M('#22252B', 0.5);
  const flick = dead ? 1 : 0.92 + 0.08 * Math.sin(t * 23);
  return <group position={[DESK.x, 0, DESK.z]}>
    <mesh castShadow receiveShadow position={[0, DESK.top - 0.02, 0]} material={wood}><boxGeometry args={[0.62, 0.04, 1.3]} /></mesh>
    {[[-0.27, -0.6], [-0.27, 0.6], [0.27, -0.6], [0.27, 0.6]].map(([x, z], i) => <mesh key={i} castShadow position={[x, (DESK.top - 0.04) / 2, z]} material={wood}><boxGeometry args={[0.04, DESK.top - 0.04, 0.04]} /></mesh>)}
    {/* monitor faces +x */}
    <mesh castShadow position={[-0.2, DESK.top + 0.3, 0.05]} material={dk}><boxGeometry args={[0.04, 0.36, 0.6]} /></mesh>
    <mesh position={[-0.178, DESK.top + 0.3, 0.05]} rotation={[0, Math.PI / 2, 0]} material={scr[dead ? 1 : 0]}><planeGeometry args={[0.56, 0.32]} /></mesh>
    <mesh castShadow position={[-0.2, DESK.top + 0.06, 0.05]} material={dk}><boxGeometry args={[0.12, 0.12, 0.05]} /></mesh>
    <mesh position={[-0.2, DESK.top + 0.005, 0.05]} material={dk}><boxGeometry args={[0.18, 0.01, 0.2]} /></mesh>
    {/* keyboard + mouse */}
    <mesh castShadow position={[0.08, DESK.top + 0.012, 0.05]} material={dk}><boxGeometry args={[0.15, 0.02, 0.44]} /></mesh>
    <mesh castShadow position={[0.1, DESK.top + 0.015, 0.4]} material={M('#E8E8E6', 0.4)}><boxGeometry args={[0.1, 0.03, 0.06]} /></mesh>
    {/* the glow of the screen on his face */}
    <pointLight position={[0.05, DESK.top + 0.32, 0.05]} color={dead ? '#C9D2E6' : '#B9A2FF'} intensity={(dead ? 1.0 : 1.8) * flick} distance={2.2} decay={1.5} />
    {/* a gaming chair */}
    <group position={[0.72, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow position={[0, 0.45, 0]} material={M('#2A2D33', 0.6)}><boxGeometry args={[0.48, 0.07, 0.46]} /></mesh>
      <mesh castShadow position={[0, 0.88, 0.24]} material={M('#2A2D33', 0.6)}><boxGeometry args={[0.46, 0.78, 0.07]} /></mesh>
      <mesh position={[0, 0.98, 0.205]} material={M('#C8323A', 0.6)}><boxGeometry args={[0.2, 0.42, 0.01]} /></mesh>
      <mesh castShadow position={[0, 0.22, 0]} material={M('#6A6F76', 0.3, 0.6)}><cylinderGeometry args={[0.03, 0.03, 0.42, 8]} /></mesh>
      <mesh castShadow position={[0, 0.03, 0]} material={M('#2A2D33', 0.6)}><cylinderGeometry args={[0.26, 0.26, 0.04, 5]} /></mesh>
    </group>
  </group>;
};
const routerSign = () => tex('router-sign', 256, 96, (g) => { g.fillStyle = '#F2C230'; g.fillRect(0, 0, 256, 96); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(4, 4, 248, 88);
  g.fillStyle = INK; g.font = F(700, 46); g.textAlign = 'center'; g.fillText('เน็ตแรงมาก', 128, 64); });
export const Router: React.FC<{dead: number; t: number}> = ({dead, t}) => {
  const body = dead > 0.5 ? M('#151517', 0.9) : M('#F2F2EF', 0.4), ant = dead > 0.5 ? M('#1A1A1C', 0.9) : M('#1E2228', 0.5);
  const sm_ = useMemo(() => new THREE.MeshBasicMaterial({map: routerSign(), toneMapped: false, side: THREE.DoubleSide}), []);
  const blinkOn = (i: number) => (Math.floor(t * 9 + i * 1.7) % 3) !== 0;
  return <group position={ROUTER}>
    <mesh castShadow position={[0, 0.03, 0]} material={body}><boxGeometry args={[0.16, 0.06, 0.24]} /></mesh>
    {[-0.08, 0, 0.08].map((z, i) => <mesh key={z} castShadow position={[-0.06, 0.06 + 0.09, z]} rotation={[dead > 0.5 ? (i - 1) * 0.6 : 0, 0, dead > 0.5 ? 0.5 + i * 0.3 : -0.08]} material={ant}><boxGeometry args={[0.012, 0.18, 0.012]} /></mesh>)}
    {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0.081, 0.035, -0.07 + i * 0.045]} rotation={[0, Math.PI / 2, 0]} material={MB(dead > 0.5 ? '#2A2A2A' : blinkOn(i) ? '#57E08A' : '#1F5A33')}><circleGeometry args={[0.007, 8]} /></mesh>)}
    {/* the sign on a little stand */}
    <group position={[0.02, 0.12, 0.2]} rotation={[0, Math.PI / 2, 0]}><mesh material={sm_} rotation={[0, 0, dead > 0.5 ? 0.25 : 0]}><planeGeometry args={[0.14, 0.052]} /></mesh></group>
    <mesh position={[0.02, 0.05, 0.2]} material={M('#3A3E42', 0.5)}><boxGeometry args={[0.004, 0.1, 0.004]} /></mesh>
  </group>;
};
/** grey-black smoke puffs rising from a point after t0 */
export const Puffs: React.FC<{at: V3; t: number; t0: number; n?: number; size?: number; color?: string; rise?: number; spread?: number; life?: number; seed?: number}> = ({at, t, t0, n = 7, size = 0.08, color = '#2A2A2E', rise = 0.5, spread = 0.12, life = 1.2, seed = 0}) => {
  const u = t - t0; if (u < 0) return null;
  return <group position={at}>{Array.from({length: n}, (_, i) => { const tt = ((u + i * life / n) % life) / life; if (u < i * 0.05) return null;
    const s = size * (0.5 + tt * 1.6) * (0.7 + hash(i + seed) * 0.6); const o = Math.round((1 - tt) * 8) / 8 * 0.85;
    return <mesh key={i} position={[(hash(i * 3 + seed) - 0.5) * spread * (1 + tt * 2), tt * rise, (hash(i * 7 + seed) - 0.5) * spread * (1 + tt * 2)]} scale={s} material={fadeMat(color, o)}><icosahedronGeometry args={[1, 0]} /></mesh>; })}</group>;
};
const fadeMat = (c: string, o: number) => once('fade' + c + o, () => new THREE.MeshLambertMaterial({color: c, flatShading: true, transparent: true, opacity: o, depthWrite: false}));
/** sparks: little white-yellow dashes flying out of a point for `dur` after t0 */
export const Sparks7: React.FC<{at: V3; t: number; t0: number; dur?: number; n?: number; speed?: number; seed?: number}> = ({at, t, t0, dur = 0.5, n = 16, speed = 1.6, seed = 0}) => {
  const u = t - t0; if (u < 0 || u > dur) return null;
  return <group position={at}>{Array.from({length: n}, (_, i) => { const a = hash(i + seed) * Math.PI * 2, e = hash(i * 3 + seed) * 1.2 - 0.2; const v = speed * (0.5 + hash(i * 5 + seed));
    const d = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)); const p = d.clone().multiplyScalar(v * u).add(new THREE.Vector3(0, -2.5 * u * u, 0));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    return <mesh key={i} position={p} quaternion={q} material={MB(i % 3 ? '#FFE07A' : '#FFFFFF')}><boxGeometry args={[0.008, 0.05, 0.008]} /></mesh>; })}</group>;
};

// =====================================================================================================
// POLICE CAR (sedan) that flies: wheels fold flat (`fold` 0→1), blue jet flames at the back (`jet`).
// Origin at the ground under its centre, nose along +x. `burnt` = soot-black after the strike.
// =====================================================================================================
const carSide = () => tex('car7-side', 512, 160, (g) => {
  g.fillStyle = '#F2F3F5'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#1F3A68'; g.fillRect(0, 86, 512, 40); g.fillStyle = '#C8323A'; g.fillRect(0, 126, 512, 7);
  g.fillStyle = '#1F3A68'; g.font = F(700, 54); g.textAlign = 'center'; g.fillText('ตำรวจ', 256, 72); g.fillStyle = '#F2F3F5'; g.font = F(600, 21); g.fillText('หน่วยปราบปรามไฟฟ้าสถิต · 191', 256, 113);
});
export const PoliceCar: React.FC<{t: number; position: V3; yaw?: number; pitch?: number; roll?: number; fold?: number; jet?: number; burnt?: number; door?: number; seed?: number; spin?: number}> = ({t, position, yaw = 0, pitch = 0, roll = 0, fold = 0, jet = 0, burnt = 0, door = 0, seed = 0, spin = 0}) => {
  const side = useMemo(() => new THREE.MeshStandardMaterial({map: carSide(), roughness: 0.45}), []);
  const soot = M('#1B1B1E', 0.95);
  const white = burnt > 0.5 ? soot : M('#EEF0F2', 0.45), sideM = burnt > 0.5 ? soot : side, glass = M('#1A2330', 0.15, 0.4), tyre = M('#16171A', 0.9);
  const ph = (Math.floor(t * 8 + seed) % 2); const red = ph === 0 ? 1 : 0.12, blue = ph === 1 ? 1 : 0.12;
  const wheelA = fold * Math.PI / 2;
  const fl = 0.75 + 0.25 * hash(Math.floor(t * 30) + seed * 7);
  return <group position={position} rotation={[roll, yaw, pitch, 'YXZ'] as any}>
    <mesh castShadow position={[0, 0.55, 0]} material={[white, white, white, white, sideM, sideM]}><boxGeometry args={[3.6, 0.6, 1.6]} /></mesh>
    <mesh castShadow position={[-0.15, 1.08, 0]} material={white}><boxGeometry args={[1.9, 0.48, 1.48]} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[-0.15, 1.08, s * 0.745]} material={glass}><boxGeometry args={[1.7, 0.36, 0.02]} /></mesh>)}
    <mesh position={[0.83, 1.06, 0]} rotation={[0, 0, -0.5]} material={glass}><boxGeometry args={[0.02, 0.44, 1.36]} /></mesh>
    {/* driver's door (z+ side) swings open */}
    {door > 0 && <group position={[0.35, 0.55, 0.8]} rotation={[0, door * 1.2, 0]}><mesh castShadow position={[-0.55, 0.25, 0]} material={white}><boxGeometry args={[1.1, 1.0, 0.06]} /></mesh></group>}
    {[[1.15, -1], [1.15, 1], [-1.15, -1], [-1.15, 1]].map(([x, s], i) => <group key={i} position={[x, 0.32, s * 0.78]} rotation={[Math.PI / 2 - s * wheelA, spin * t, 0]}>
      <mesh castShadow material={tyre}><cylinderGeometry args={[0.32, 0.32, 0.24, 14]} /></mesh>
      <mesh position={[0, s * 0.125, 0]} material={M('#A7ADB4', 0.4, 0.6)}><cylinderGeometry args={[0.18, 0.18, 0.02, 10]} /></mesh>
    </group>)}
    {[-1, 1].map((s) => <mesh key={'h' + s} position={[1.81, 0.62, s * 0.55]} material={MB('#FFF6D8')}><boxGeometry args={[0.02, 0.12, 0.3]} /></mesh>)}
    {/* light bar */}
    <mesh position={[-0.15, 1.36, 0]} material={M('#2A2D33', 0.5)}><boxGeometry args={[0.4, 0.08, 1.2]} /></mesh>
    <mesh position={[-0.15, 1.44, -0.3]} material={new THREE.MeshBasicMaterial({color: new THREE.Color('#FF2A2A').multiplyScalar(0.25 + red * 1.4), toneMapped: false})}><boxGeometry args={[0.34, 0.12, 0.5]} /></mesh>
    <mesh position={[-0.15, 1.44, 0.3]} material={new THREE.MeshBasicMaterial({color: new THREE.Color('#2A5BFF').multiplyScalar(0.25 + blue * 1.4), toneMapped: false})}><boxGeometry args={[0.34, 0.12, 0.5]} /></mesh>
    <Glow p={[-0.15, 1.5, -0.3]} c="#FF3B3B" s={1.8} o={red * 0.8} /><Glow p={[-0.15, 1.5, 0.3]} c="#4A74FF" s={1.8} o={blue * 0.8} />
    {/* jet flames out of two exhausts */}
    {jet > 0.01 && [-0.45, 0.45].map((z) => <group key={z} position={[-1.85, 0.42, z]} rotation={[0, 0, Math.PI / 2]}>
      <mesh position={[0, 0.55 * jet * fl, 0]} material={MB('#5AA8FF', 'jet')}><coneGeometry args={[0.16, 1.1 * jet * fl, 8]} /></mesh>
      <mesh position={[0, 0.35 * jet * fl, 0]} material={MB('#E8F4FF', 'jetc')}><coneGeometry args={[0.08, 0.7 * jet * fl, 8]} /></mesh>
      <Glow p={[0, 0.3, 0]} c="#7FC0FF" s={1.4 * jet} o={0.7 * jet} />
    </group>)}
  </group>;
};

// =====================================================================================================
// Storm clouds: flat-shaded low-poly blobs. CloudWall = a sheet of blobs the camera flies through.
// =====================================================================================================
export const Clouds: React.FC<{center: V3; size: V3; n?: number; color?: string; seed?: number; r?: number; t?: number; drift?: number}> = ({center, size, n = 30, color = '#4A5160', seed = 0, r = 3, t = 0, drift = 0}) => {
  const m = useMemo(() => new THREE.MeshLambertMaterial({color, flatShading: true}), [color]);
  return <group position={center}>{Array.from({length: n}, (_, i) => <mesh key={i} material={m}
    position={[(hash(i + seed) - 0.5) * size[0] + drift * t, (hash(i * 3 + seed) - 0.5) * size[1], (hash(i * 7 + seed) - 0.5) * size[2]]}
    scale={[r * (0.6 + hash(i * 11 + seed)), r * (0.4 + hash(i * 13 + seed) * 0.5), r * (0.6 + hash(i * 17 + seed))]} rotation={[hash(i * 5) * 3, hash(i * 9) * 3, 0]}><icosahedronGeometry args={[1, 1]} /></mesh>)}</group>;
};
/** rain: thin white streaks falling diagonally through a box */
export const Rain: React.FC<{center: V3; size: V3; t: number; n?: number; len?: number; speed?: number}> = ({center, size, t, n = 120, len = 0.8, speed = 14}) => {
  const m = MB('#DCE6F2', 'rain');
  return <group position={center}>{Array.from({length: n}, (_, i) => { const y = ((hash(i * 3) * size[1] - t * speed * (0.8 + hash(i) * 0.4)) % size[1] + size[1]) % size[1] - size[1] / 2;
    return <mesh key={i} position={[(hash(i) - 0.5) * size[0] + y * 0.15, y, (hash(i * 7) - 0.5) * size[2]]} rotation={[0, 0, 0.15]} material={m}><boxGeometry args={[0.02, len, 0.02]} /></mesh>; })}</group>;
};

// =====================================================================================================
// INTERROGATION additions: a table microphone (explodes), soot faces, shades, a rubber mat + chain
// =====================================================================================================
export const Mic: React.FC<{position: V3; burst: number; t: number}> = ({position, burst, t}) => {
  const metal = burst > 0 ? M('#1B1B1E', 0.95) : M('#2A2D33', 0.35, 0.6);
  const head = burst > 0 ? M('#141416', 0.95) : M('#9AA2A8', 0.4, 0.6);
  return <group position={position}>
    <mesh castShadow position={[0, 0.008, 0]} material={metal}><cylinderGeometry args={[0.06, 0.07, 0.016, 14]} /></mesh>
    <mesh castShadow position={[0, 0.12, 0]} rotation={[0, 0, burst > 0 ? 0.5 : 0.1]} material={metal}><cylinderGeometry args={[0.008, 0.008, 0.22, 6]} /></mesh>
    <mesh castShadow position={[burst > 0 ? -0.05 : -0.012, 0.24, 0]} scale={burst > 0 ? [1, 0.6, 1] : 1} material={head}><sphereGeometry args={[0.035, 10, 8]} /></mesh>
    {burst > 0 && <Flames at={[-0.04, 0.23, 0]} t={t} k={cl(1 - (burst - 1) / 2.5)} s={0.12} />}
  </group>;
};
/** flat two-colour flames that flicker every 2 frames */
export const Flames: React.FC<{at: V3; t: number; k: number; s?: number}> = ({at, t, k, s = 0.2}) => {
  if (k <= 0) return null; const fr = Math.floor(t * 15);
  return <group position={at} scale={s * k}>{Array.from({length: 5}, (_, i) => { const h = 0.7 + hash(fr + i * 3) * 0.8; const x = (i - 2) * 0.22;
    return <group key={i}><mesh position={[x, h / 2, 0]} material={MB('#FF7A2A', 'fl1')}><coneGeometry args={[0.2, h, 5]} /></mesh><mesh position={[x, h * 0.32, 0.05]} material={MB('#FFD84A', 'fl2')}><coneGeometry args={[0.1, h * 0.6, 5]} /></mesh></group>; })}
    <Glow p={[0, 0.5, 0.1]} c="#FF9A4A" s={3} o={0.5} /></group>;
};
/** a sooty face: black mask over the face of a box head, with two white blinking eyes (on the head bone) */
export const makeSoot = () => {
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(21, 22), new THREE.MeshBasicMaterial({map: tex('soot-face', 128, 128, (c) => {
    c.fillStyle = '#121214'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(60,60,64,0.6)'; for (let i = 0; i < 30; i++) { c.beginPath(); c.arc(hash(i) * 128, hash(i * 3) * 128, 4 + hash(i * 5) * 9, 0, 7); c.fill(); }
    c.fillStyle = '#FFFFFF'; [40, 88].forEach((x) => { c.beginPath(); c.arc(x, 56, 9, 0, 7); c.fill(); }); }), toneMapped: false}));
  face.position.set(0, 13, 14.4); g.add(face);
  const smoke = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 0), new THREE.MeshLambertMaterial({color: '#5A5A60', flatShading: true, transparent: true, opacity: 0.7})); smoke.position.set(4, 26, 2); smoke.name = 'smoke'; g.add(smoke);
  g.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; });
  return g;
};
/** black wrap-around shades (head bone, cm units) */
export const makeShades = () => {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({color: '#0E0F12', roughness: 0.15, metalness: 0.6});
  [-4.6, 4.6].forEach((x) => { const l = new THREE.Mesh(new THREE.BoxGeometry(7.6, 4.0, 1.0), m); l.position.set(x, 15.5, 14.6); g.add(l); });
  const b = new THREE.Mesh(new THREE.BoxGeometry(21, 1.0, 1.0), m); b.position.set(0, 17.2, 14.6); g.add(b);
  g.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; });
  return g;
};
/** the judge's yellow safety helmet over the wig */
export const makeHardHat = () => {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({color: '#F2C230', roughness: 0.45});
  const dome = new THREE.Mesh(new THREE.SphereGeometry(12.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.position.set(0, 27, 1.2); g.add(dome);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(15.5, 15.5, 1.2, 18), m); brim.position.set(0, 27, 3); g.add(brim);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2, 22), m); ridge.position.set(0, 38.5, 1.2); g.add(ridge);
  g.traverse((o: any) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
  return g;
};
export const RubberMat: React.FC<{position: V3; w?: number; d?: number}> = ({position, w = 0.5, d = 0.4}) => <group position={position}>
  <mesh receiveShadow castShadow position={[0, 0.012, 0]} material={M('#141416', 0.95)}><boxGeometry args={[w, 0.024, d]} /></mesh>
  {Array.from({length: 6}, (_, i) => <mesh key={i} position={[-w / 2 + (i + 0.5) * w / 6, 0.025, 0]} material={M('#232327', 0.95)}><boxGeometry args={[0.012, 0.004, d * 0.9]} /></mesh>)}
</group>;

// =====================================================================================================
// FAN additions: buttons popping off, the digital readout that runs up to 3,000, an electric aura
// =====================================================================================================
const dialTex = (n: string) => tex('dial7-' + n, 512, 256, (g) => {
  g.fillStyle = '#0C1410'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#2E3A34'; g.lineWidth = 10; g.strokeRect(5, 5, 502, 246);
  g.fillStyle = '#7CFF9A'; g.font = F(700, 52); g.textAlign = 'center'; g.fillText('เบอร์', 256, 70); g.font = '700 140px monospace'; g.fillText(n, 256, 210);
});
const DIAL_STEPS = ['3', '7', '12', '38', '95', '240', '610', '1,200', '2,450', '3,000'];
export const Readout: React.FC<{position: V3; rotation?: V3; k: number; w?: number}> = ({position, rotation, k, w = 0.16}) => {
  const n = DIAL_STEPS[Math.min(DIAL_STEPS.length - 1, Math.max(0, Math.floor(k * (DIAL_STEPS.length - 1) + 1e-6)))];
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: dialTex(n), toneMapped: false}), [n]);
  return <group position={position} rotation={rotation}><mesh position={[0, 0, -0.004]} material={M('#3A3E42', 0.4, 0.5)}><boxGeometry args={[w * 1.08, w * 0.56, 0.008]} /></mesh>
    <mesh position={[0, 0, 0.006]} material={m}><planeGeometry args={[w, w / 2]} /></mesh></group>;
};
/** the old buttons, flying off the panel (local to the panel: +z out of it) */
export const FlyingButtons: React.FC<{position: V3; rotation?: V3; t: number; t0: number; s?: number}> = ({position, rotation, t, t0, s = 1}) => {
  const u = Math.max(0, t - t0);
  return <group position={position} rotation={rotation} scale={s}>{['ปิด', '1', '2', '3'].map((_, i) => { const y0 = 0.066 - i * 0.044; const go = u - i * 0.06; if (go < 0) return <mesh key={i} position={[0, y0 * 0.85, 0.004]} material={M(i === 3 ? '#F08A6E' : CREAM, 0.5)}><boxGeometry args={[0.07, 0.034, 0.008]} /></mesh>;
    const vx = (hash(i) - 0.5) * 1.2, vz = 0.8 + hash(i * 3) * 0.6;
    return <mesh key={i} position={[vx * go, y0 * 0.85 + 1.2 * go - 3 * go * go, 0.004 + vz * go]} rotation={[go * 14, go * 9, 0]} material={M(i === 3 ? '#F08A6E' : CREAM, 0.5)}><boxGeometry args={[0.07, 0.034, 0.008]} /></mesh>; })}</group>;
};
/** crackling arcs over a fan: short bolts that jump between random points on a sphere */
export const Aura: React.FC<{center: V3; r: number; t: number; n?: number; k?: number}> = ({center, r, t, n = 6, k = 1}) => {
  if (k <= 0) return null; const fr = Math.floor(t * 20);
  const pt = (i: number): THREE.Vector3 => { const a = hash(fr * 1.7 + i) * Math.PI * 2, b = (hash(fr * 2.3 + i * 3) - 0.5) * Math.PI; return new THREE.Vector3(Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r); };
  return <group position={center}>{Array.from({length: n}, (_, i) => { if (hash(fr + i * 7) > k) return null; const a = pt(i), b = pt(i + 50), m = a.clone().lerp(b, 0.5).multiplyScalar(1.15);
    return <group key={i}>{seg(a, m, 0.012 * r * 4, MB(YEL, 'zap'), 'a')}{seg(m, b, 0.012 * r * 4, MB(YEL, 'zap'), 'b')}</group>; })}
    <Glow p={[0, 0, 0]} c="#FFE07A" s={r * 5} o={0.45 * k} /><pointLight color="#FFE07A" intensity={4 * k} distance={3} decay={1.5} /></group>;
};

// =====================================================================================================
// THE PRISON FROM ABOVE (top-down): a walled compound in a grid town; the smell spreads as green blobs
// =====================================================================================================
export const TownTop: React.FC = () => {
  const blocks = useMemo(() => { const o: {p: V3; s: V3; c: string}[] = []; for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j++) { if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;
    for (let k = 0; k < 4; k++) { const h = 0.6 + hash(i * 31 + j * 7 + k) * 2.4; o.push({p: [i * 8 + (k % 2 ? 1.7 : -1.7), h / 2, j * 8 + (k > 1 ? 1.7 : -1.7)], s: [2.6, h, 2.6], c: ['#C9583F', '#D7C7A4', '#8FA7B4', '#E2B33C', '#B9C3A2'][(i * 3 + j * 5 + k) & 3]}); } } return o; }, []);
  return <group>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={M('#6E746C', 0.95)}><planeGeometry args={[400, 400]} /></mesh>
    {blocks.map((b, i) => <mesh key={i} castShadow position={b.p} material={M(b.c, 0.9)}><boxGeometry args={b.s} /></mesh>)}
    {/* the prison: a grey walled square with three cell blocks and a yard */}
    <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M('#A4A79C', 0.95)}><planeGeometry args={[18, 18]} /></mesh>
    {[[0, 9, 18.6, 0.6], [0, -9, 18.6, 0.6], [9, 0, 0.6, 18.6], [-9, 0, 0.6, 18.6]].map(([x, z, w, d], i) => <mesh key={i} castShadow position={[x, 1.2, z]} material={M('#8C9088', 0.9)}><boxGeometry args={[w, 2.4, d]} /></mesh>)}
    {[-4.5, 0, 4.5].map((x) => <mesh key={x} castShadow position={[x, 1.1, -2]} material={M('#B8BBB2', 0.9)}><boxGeometry args={[3, 2.2, 9]} /></mesh>)}
    {[-4.5, 0, 4.5].map((x) => <mesh key={'r' + x} position={[x, 2.22, -2]} material={M(NAVY, 0.8)}><boxGeometry args={[3.1, 0.05, 9.1]} /></mesh>)}
    <mesh position={[0, 2.26, -2]} rotation={[-Math.PI / 2, 0, 0]} material={useMemo(() => new THREE.MeshBasicMaterial({map: tex('roof-20', 256, 96, (g) => { g.fillStyle = NAVY; g.fillRect(0, 0, 256, 96); g.fillStyle = CREAM; g.font = F(700, 52); g.textAlign = 'center'; g.fillText('แดน 18-20', 128, 66); }), toneMapped: false}), [])}><planeGeometry args={[2.8, 1.05]} /></mesh>
    <hemisphereLight args={['#E2E8EC', '#3C4038', 1.05]} />
    <directionalLight position={[-30, 60, 20]} color="#FFF1D6" intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} />
  </group>;
};
/** murky green smell blobs filling a disc of radius r around the origin */
export const SmellCloud: React.FC<{r: number; t: number; n?: number; y?: number; size?: number; seed?: number}> = ({r, t, n = 70, y = 3, size = 4, seed = 0}) => {
  const m = useMemo(() => new THREE.MeshLambertMaterial({color: '#7E9A3A', flatShading: true, transparent: true, opacity: 0.82}), []);
  if (r <= 0) return null;
  return <group>{Array.from({length: n}, (_, i) => { const a = hash(i + seed) * Math.PI * 2, d = Math.sqrt(hash(i * 3 + seed)); if (d * 60 > r) return null;
    const edge = cl((r - d * 60) / 8); const s = size * (0.6 + hash(i * 5) * 0.7) * edge;
    return <mesh key={i} position={[Math.cos(a) * d * 60, y + hash(i * 9) * 1.5 + Math.sin(t * 1.3 + i) * 0.2, Math.sin(a) * d * 60]} scale={[s, s * 0.55, s]} rotation={[0, i, 0]} material={m}><icosahedronGeometry args={[1, 0]} /></mesh>; })}</group>;
};

// =====================================================================================================
// THAILAND (Natural Earth, public domain; see thailand_map.json). Laid on the XZ plane: x = east,
// −z = north, 1 unit = 1° of longitude (Mercator). Provinces turn murky green one by one as the
// smell front passes them (distance from the prison pin); the smell is drawn ONLY over Thai provinces,
// so it stops exactly at the border.
// =====================================================================================================
type Poly = {o: number[][]; h: number[][][]};
const shapeOf = (p: Poly) => { const s = new THREE.Shape(p.o.map(([x, y]) => new THREE.Vector2(x, y))); p.h.forEach((h) => s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))))); return s; };
const extrude = (ps: Poly[], depth: number) => { const g = new THREE.ExtrudeGeometry(ps.map(shapeOf), {depth, bevelEnabled: false}); g.rotateX(-Math.PI / 2); return g; };   // shape y (north) → −z
const PRISON_PIN = MAP.prison as [number, number];
export const MAP_PIN: V3 = [PRISON_PIN[0], 0.12, -PRISON_PIN[1]];
const PROV = (MAP.provinces as unknown as {name: string; c: [number, number]; p: Poly[]}[]).map((q) => ({...q, d: Math.hypot(q.c[0] - PRISON_PIN[0], q.c[1] - PRISON_PIN[1])}));
export const PROV_MAXD = Math.max(...PROV.map((q) => q.d));
const outline = (ps: Poly[], y: number, w: number, m: THREE.Material, key: string) => ps.flatMap((p, pi) => p.o.map(([x, z], i) => { const [x2, z2] = p.o[(i + 1) % p.o.length];
  return seg(new THREE.Vector3(x, y, -z), new THREE.Vector3(x2, y, -z2), w, m, key + pi + ':' + i, 0.004); }));
const thaiLabel = () => tex('thai-label', 1024, 256, (g) => { g.clearRect(0, 0, 1024, 256); g.fillStyle = CREAM; g.font = F(700, 190); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeStyle = 'rgba(21,32,40,0.55)'; g.lineWidth = 14; g.strokeText('ประเทศไทย', 512, 128); g.fillText('ประเทศไทย', 512, 128); });
export const ThailandMap: React.FC<{t: number; front: number}> = ({t, front}) => {
  // front: 0 → 1, fraction of the max prison→province distance the smell has reached
  const geo = useMemo(() => ({land: extrude(MAP.land as Poly[], 0.05), prov: PROV.map((q) => extrude(q.p, 0.12))}), []);
  const mats = useMemo(() => ({sea: new THREE.MeshLambertMaterial({color: '#1F3A54'}), land: new THREE.MeshLambertMaterial({color: '#7C8079'}), green: new THREE.MeshLambertMaterial({color: '#9CC48A'}),
    murk: new THREE.MeshLambertMaterial({color: '#5E7A2A'}), border: MB('#FFFFFF', 'border'), provLine: new THREE.LineBasicMaterial({color: '#2F4A2A', transparent: true, opacity: 0.45}),
    label: new THREE.MeshBasicMaterial({map: thaiLabel(), transparent: true, toneMapped: false, depthWrite: false}), fog: new THREE.MeshLambertMaterial({color: '#6F8C2E', flatShading: true, transparent: true, opacity: 0.85})}), []);
  const provLines = useMemo(() => { const pts: number[] = []; PROV.forEach((q) => q.p.forEach((p) => p.o.forEach(([x, y], i) => { const [x2, y2] = p.o[(i + 1) % p.o.length]; pts.push(x, 0.125, -y, x2, 0.125, -y2); })));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g; }, []);
  const border = useMemo(() => outline(MAP.thailand as Poly[], 0.13, 0.045, mats.border, 'b'), []);
  const R = front * PROV_MAXD;
  return <group>
    <mesh receiveShadow position={[0.5, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.sea}><planeGeometry args={[40, 40]} /></mesh>
    <mesh receiveShadow geometry={geo.land} material={mats.land} />
    {PROV.map((q, i) => { const k = cl((R - q.d) / 0.6); return <mesh key={q.name} receiveShadow castShadow geometry={geo.prov[i]} material={k > 0.5 ? mats.murk : mats.green} />; })}
    <lineSegments geometry={provLines} material={mats.provLine} />
    {border}
    <mesh position={[0.15, 0.6, -1.9]} rotation={[-Math.PI / 2, 0, 0]} material={mats.label}><planeGeometry args={[5.6, 1.4]} /></mesh>
    {/* the smell: puffs over each reached province (only Thai provinces, so it stops at the border) */}
    {PROV.map((q, i) => { const k = cl((R - q.d) / 0.9); if (k <= 0) return null; const n = 3;
      return <group key={'f' + i}>{Array.from({length: n}, (_, j) => { const s = (0.22 + hash(i * 5 + j) * 0.25) * k; const off = [(hash(i * 3 + j) - 0.5) * 0.35, (hash(i * 7 + j) - 0.5) * 0.35];
        return <mesh key={j} position={[q.c[0] + off[0], 0.35 + j * 0.06 + Math.sin(t * 1.5 + i + j) * 0.03, -(q.c[1] + off[1])]} scale={[s, s * 0.45, s]} rotation={[0, i + j, 0]} material={mats.fog}><icosahedronGeometry args={[1, 0]} /></mesh>; })}</group>; })}
    {/* the pin on the prison */}
    <group position={MAP_PIN}><mesh position={[0, 0.45, 0]} material={MB('#E0322E', 'pin')}><sphereGeometry args={[0.16, 12, 8]} /></mesh>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]} material={MB('#E0322E', 'pin')}><coneGeometry args={[0.09, 0.4, 8]} /></mesh>
      <Glow p={[0, 0.45, 0]} c="#FF5A4A" s={1.2 + 0.4 * Math.sin(t * 12)} o={0.7} /></group>
    <hemisphereLight args={['#EEF2F4', '#30343A', 1.15]} />
    <directionalLight position={[-6, 20, 8]} color="#FFF4E0" intensity={1.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
  </group>;
};
/** the y of the southern tip (largest z on the map) — where the front closes last */
export const MAP_SOUTH = -(MAP.bounds as number[])[1];

// =====================================================================================================
// THE ALERT PHONE: 3D phone slid up into frame, emergency notice on screen (original design, no real agency)
// =====================================================================================================
const fit = (g: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, weight: number, px: number) => { let p = px; g.font = F(weight, p); while (g.measureText(text).width > w && p > 18) { p -= 2; g.font = F(weight, p); } g.fillText(text, x, y); };
const alertTex = () => tex('alert7b', 720, 1440, (g) => {
  g.fillStyle = '#121820'; g.fillRect(0, 0, 720, 1440);
  g.fillStyle = '#C9232A'; g.fillRect(0, 0, 720, 240); g.fillStyle = '#FFFFFF'; g.textAlign = 'center';
  fit(g, '⚠ แจ้งเตือนฉุกเฉิน', 360, 92, 640, 700, 54); fit(g, 'ประกาศพื้นที่ภัยพิบัติระดับชาติ', 360, 185, 650, 700, 60);
  g.textAlign = 'left'; let y = 320;
  const row = (k: string, v: string[], col = '#F2F2F0', big = 46) => { g.fillStyle = '#8FA0AE'; g.font = F(600, 32); g.fillText(k, 44, y); y += 58; g.fillStyle = col; v.forEach((s) => { fit(g, s, 44, y, 632, 700, big); y += big + 16; }); y += 26; };
  row('พื้นที่', ['ประเทศไทย ทั้ง 77 จังหวัด (100%)'], '#FFD84A', 50);
  row('สาเหตุ', ['นช. ฟ้าผ่า (ห้อง 18)', 'ช็อต นช. พัดลม (ห้อง 19)'], '#F2F2F0', 44);
  row('ผลกระทบ', ['พัดลมอัปเกรดเป็นเบอร์ 3,000', 'เป่ากลิ่น นช. ทุเรียน (ห้อง 20)', 'คลุมทั้งประเทศ'], '#F2F2F0', 42);
  row('คำแนะนำ', ['ห้ามหายใจ จนกว่าพัดลมจะปลั๊กหลุด'], '#FF8A73', 44);
  row('ประเทศเพื่อนบ้าน', ['ปิดหน้าต่างแล้ว'], '#F2F2F0', 44);
  g.fillStyle = '#5E6B78'; fit(g, 'ผู้ต้องหาที่เกี่ยวข้อง: กระแสลม (ยังไม่ถูกจับ)', 44, 1370, 632, 500, 28); g.textAlign = 'right'; g.font = F(500, 26); g.fillText(HANDLE, 676, 1410);
});
export const AlertPhone: React.FC<{cam: V3; look: V3; k: number; dist?: number}> = ({cam, look, k, dist = 0.36}) => {
  const scr = useMemo(() => new THREE.MeshBasicMaterial({map: alertTex(), toneMapped: false}), []);
  const C = new THREE.Vector3(...cam), f = new THREE.Vector3(...look).sub(C).normalize(), r = f.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), u = r.clone().cross(f);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate())).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.03));
  const pos = C.clone().add(f.clone().multiplyScalar(dist)).add(u.clone().multiplyScalar(-0.42 + 0.42 * k));
  return <group position={pos} quaternion={q}>
    <mesh material={PM('#1B232C', 'ph7')}><boxGeometry args={[0.16, 0.32, 0.014]} /></mesh>
    <mesh position={[0, 0, 0.0075]} material={scr}><planeGeometry args={[0.15, 0.3]} /></mesh>
    {/* his thumb at the lower right edge */}
    <group position={[0.085, -0.13, 0.012]} rotation={[0, 0, 0.5]}><mesh material={PM('#D9A879', 'thumb')}><boxGeometry args={[0.035, 0.1, 0.03]} /></mesh></group>
  </group>;
};
