import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F, glowTex} from '../../pov/lib/tex';

/** EP10 offender: a home Wi-Fi router. No face — its LEDs are its expression, its antennas are its arms,
 *  its "voice" is the Wi-Fi waves it sends (or refuses to send). Origin = bottom-centre, front (LEDs) faces +z. Metres. */
type V3 = [number, number, number];
export type Led = 'ok' | 'weak' | 'red' | 'blink' | 'off';
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
export const RW = 0.26, RH = 0.045, RD = 0.17;   // body size (real router)
const shell = M('#ECEBE6', 0.45, 0, {}, 'rt-shell'), shellD = M('#C9C8C2', 0.6, 0, {}, 'rt-shellD'), rod = M('#141518', 0.55, 0, {}, 'rt-rod');
const cableM = M('#2F7FD6', 0.45, 0, {}, 'rt-lan'), plugM = M('#DDE6EE', 0.2, 0, {transparent: true, opacity: 0.85}, 'rt-plug');
const GREEN = '#46E07A', AMBER = '#FFB23A', RED = '#FF2E2E';
const iconTex = () => tex('ep10-icons', 512, 64, (g) => {
  g.clearRect(0, 0, 512, 64); g.strokeStyle = '#7A7C80'; g.fillStyle = '#7A7C80'; g.lineWidth = 5; g.lineCap = 'round';
  // power, globe, wifi, lan — one icon above each LED (x = 64, 192, 320, 448)
  g.beginPath(); g.arc(64, 34, 16, -1.1, 4.2); g.stroke(); g.beginPath(); g.moveTo(64, 12); g.lineTo(64, 32); g.stroke();
  g.beginPath(); g.arc(192, 34, 18, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(192, 34, 8, 18, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(174, 34); g.lineTo(210, 34); g.stroke();
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(320, 50, 8 + i * 10, -2.4, -0.74); g.stroke(); }
  g.strokeRect(434, 20, 28, 24); g.fillRect(442, 44, 12, 6);
});
/** LED colours at time t for a mode; `n` = how many LEDs are still alive from the left (closer: they die one by one) */
const ledCols = (mode: Led, t: number, n = 4): (string | null)[] => {
  const b = Math.floor(t * 4) % 2 === 0;   // red blink 2 Hz
  const fl = (s: number) => hash(Math.floor(t * 12) + s) > 0.35;   // activity flicker
  const c: (string | null)[] = mode === 'ok' ? [GREEN, fl(1) ? GREEN : null, fl(2) ? GREEN : null, GREEN]
    : mode === 'weak' ? [GREEN, hash(Math.floor(t * 3)) > 0.5 ? AMBER : null, AMBER, GREEN]
    : mode === 'red' ? [GREEN, RED, null, GREEN]
    : mode === 'blink' ? [GREEN, b ? RED : null, null, GREEN]
    : [null, null, null, null];
  return c.map((x, i) => (i < n ? x : null));
};
export type RouterProps = {position?: V3; yaw?: number; scale?: number; t: number; led?: Led; alive?: number;
  /** 0 = antennas up; 1 = pulled back, crossed and tied with the LAN cable */ tied?: number;
  /** Wi-Fi waves sent upward (0…1) */ waves?: number; tag?: boolean; tilt?: number; jolt?: number};
export const Router: React.FC<RouterProps> = ({position = [0, 0, 0], yaw = 0, scale = 1, t, led = 'ok', alive = 4, tied = 0, waves = 0, tag, tilt = 0, jolt = 0}) => {
  const lm = useMemo(() => [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({color: '#333', toneMapped: false})), []);
  const gm = useMemo(() => [0, 1, 2, 3].map(() => new THREE.SpriteMaterial({map: glowTex(), color: '#fff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false})), []);
  const icon = useMemo(() => new THREE.MeshBasicMaterial({map: iconTex(), transparent: true, toneMapped: false}), []);
  const cols = ledCols(led, t, alive);
  cols.forEach((c, i) => { lm[i].color.set(c ?? '#2A2C30'); gm[i].color.set(c ?? '#000'); gm[i].opacity = c ? 0.95 : 0; });
  const anyRed = cols.some((c) => c === RED);
  // antennas: hinge on the back edge; up = slight splay; tied = pitched back and crossed behind the body
  const AX = [-0.085, 0, 0.085];
  return (
    <group position={position} rotation={[tilt, yaw, jolt]} scale={scale}>
      {/* body: a low slab with a bevelled top and vent slots */}
      <mesh castShadow receiveShadow position={[0, RH / 2, 0]} material={shell}><boxGeometry args={[RW, RH, RD]} /></mesh>
      <mesh castShadow position={[0, RH + 0.004, -0.005]} material={shell}><boxGeometry args={[RW - 0.02, 0.008, RD - 0.03]} /></mesh>
      {Array.from({length: 7}, (_, i) => <mesh key={i} position={[-0.075 + i * 0.025, RH + 0.0085, -0.02]} material={shellD}><boxGeometry args={[0.012, 0.001, 0.08]} /></mesh>)}
      {[-1, 1].map((s) => [-1, 1].map((u) => <mesh key={s + '' + u} position={[s * (RW / 2 - 0.02), 0.003, u * (RD / 2 - 0.02)]} material={rod}><cylinderGeometry args={[0.008, 0.008, 0.006, 8]} /></mesh>))}
      {/* front LEDs + icons */}
      <mesh position={[0, RH * 0.72, RD / 2 + 0.0006]} material={icon}><planeGeometry args={[0.2, 0.025]} /></mesh>
      {[0, 1, 2, 3].map((i) => { const x = -0.075 + i * 0.05; return <group key={i} position={[x, RH * 0.3, RD / 2 + 0.001]}>
        <mesh material={lm[i]}><circleGeometry args={[0.0045, 12]} /></mesh>
        <sprite material={gm[i]} position={[0, 0, 0.004]} scale={i === 1 && anyRed ? 0.07 : 0.035} />
      </group>; })}
      {anyRed && cols[1] && <pointLight position={[0, RH * 0.3, RD / 2 + 0.05]} color={RED} intensity={0.12} distance={0.35} decay={2} />}
      {/* antennas */}
      {AX.map((x, i) => {
        const splay = (i - 1) * 0.22;
        const pitch = -1.75 * tied;                       // tip swings back over the body
        const roll = splay * (1 - tied) + (i - 1) * 0.52 * tied;   // outer ones fold in so all three tips meet behind its back
        return <group key={i} position={[x, RH * 0.7, -RD / 2 + 0.01]} rotation={[pitch, 0, roll]}>
          <mesh castShadow material={rod}><boxGeometry args={[0.022, 0.018, 0.018]} /></mesh>
          <mesh castShadow position={[0, 0.095, 0]} material={rod}><cylinderGeometry args={[0.0075, 0.0095, 0.17, 10]} /></mesh>
          <mesh castShadow position={[0, 0.182, 0]} material={rod}><sphereGeometry args={[0.0076, 10, 6]} /></mesh>
        </group>;
      })}
      {tied > 0.5 && <LanTie k={(tied - 0.5) * 2} />}
      {waves > 0.01 && <Waves t={t} k={waves} />}
      {tag && <EvidenceTag />}
    </group>
  );
};
/** the blue LAN cable wound round the crossed antennas (behind the body), with the plug dangling */
const LanTie: React.FC<{k: number}> = ({k}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([[0.0, 0.012, -0.2], [0.03, 0.02, -0.23], [0.07, 0.01, -0.24], [0.1, 0.004, -0.21], [0.13, 0.004, -0.23]].map((p) => new THREE.Vector3(...p))), []);
  return <group scale={[1, 1, 1]}>
    {[0, 1, 2].map((i) => <mesh key={i} castShadow position={[0, 0.014, -0.215 + i * 0.012]} rotation={[0, 0, 0.3 * i]} scale={0.7 + 0.3 * Math.min(1, k)} material={cableM}><torusGeometry args={[0.024, 0.0055, 6, 18]} /></mesh>)}
    <mesh castShadow material={cableM}><tubeGeometry args={[curve, 24, 0.004, 6, false]} /></mesh>
    <mesh castShadow position={[0.135, 0.008, -0.235]} rotation={[0, 0.6, 0]} material={plugM}><boxGeometry args={[0.012, 0.012, 0.02]} /></mesh>
  </group>;
};
/** Wi-Fi arcs rising off the top (pure function of t) */
const waveM = [0, 1, 2].map(() => new THREE.MeshBasicMaterial({color: '#CFE9FF', transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide}));
export const Waves: React.FC<{t: number; k: number}> = ({t, k}) => <group position={[0, RH + 0.03, 0]}>
  {[0, 1, 2].map((i) => { const u = (t * 0.9 + i / 3) % 1; waveM[i].opacity = k * 0.7 * Math.sin(u * Math.PI);
    return <mesh key={i} position={[0, u * 0.12, 0]} rotation={[0, 0, Math.PI / 2 - 0.7]} material={waveM[i]} scale={0.04 + u * 0.12}><torusGeometry args={[1, 0.06, 4, 18, 1.4]} /></mesh>; })}
</group>;
/** evidence tag tied to an antenna in court — pause-bait, every field a joke */
const tagTex = () => tex('ep10-tag', 512, 340, (g) => {
  g.fillStyle = '#F4E7C2'; g.fillRect(0, 0, 512, 340); g.strokeStyle = '#B79C5E'; g.lineWidth = 6; g.strokeRect(6, 6, 500, 328);
  g.fillStyle = '#152028'; g.font = F(700, 40); g.textAlign = 'center'; g.fillText('ของกลาง หมายเลข 10', 256, 58);
  g.textAlign = 'left'; const row = (y: number, k: string, v: string, red = false) => { g.fillStyle = '#6A6A70'; g.font = F(600, 24); g.fillText(k, 26, y); g.fillStyle = red ? '#C8302A' : '#14110F'; g.font = F(700, 32); g.fillText(v, 170, y); };
  row(120, 'ชื่อ', 'นาย เราเตอร์ ขีดเดียว'); row(170, 'ชื่อ Wi-Fi', 'บ้านนี้ไม่มีเน็ต'); row(220, 'รหัสผ่าน', 'ขอใช้สิทธิ์ไม่ให้การ', true); row(270, 'ความเร็ว', '0.2 Mbps (ตอนดีๆ)');
  g.fillStyle = '#9A9AA0'; g.font = F(500, 20); g.textAlign = 'right'; g.fillText('@absurd.cases', 490, 322);
});
const EvidenceTag = () => { const m = useMemo(() => new THREE.MeshBasicMaterial({map: tagTex(), toneMapped: false, side: THREE.DoubleSide}), []);
  return <group position={[0.11, 0.06, RD / 2 + 0.02]} rotation={[-0.1, -0.25, 0.08]}>
    <mesh position={[0, 0.02, -0.04]} rotation={[0.8, 0, 0]} material={MB('#B33A2E')}><boxGeometry args={[0.002, 0.002, 0.1]} /></mesh>
    <mesh position={[0, -0.03, 0]} material={m}><planeGeometry args={[0.15, 0.1]} /></mesh></group>; };

// =====================================================================================================
// 5G tower: a lattice mast with panel antennas, a red aviation light and a big "5G" plate. Origin = base centre.
// =====================================================================================================
const steel = M('#C3C7CC', 0.45, 0.4, {}, 'tw-steel'), steelD = M('#8E949B', 0.5, 0.4, {}, 'tw-steelD'), panel = M('#F2F2EE', 0.5, 0, {}, 'tw-panel');
const bar = (a: V3, b: V3, r: number, key: string, m = steel) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A); const L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return <mesh key={key} castShadow position={A.clone().add(B).multiplyScalar(0.5)} quaternion={q} material={m}><cylinderGeometry args={[r, r, L, 6]} /></mesh>; };
export const Tower5G: React.FC<{position?: V3; t: number; h?: number; glow?: number; yaw?: number}> = ({position = [0, 0, 0], t, h = 24, glow = 1, yaw = 0}) => {
  const plate = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false, map: tex('ep10-5g', 256, 160, (g) => { g.fillStyle = '#152028'; g.fillRect(0, 0, 256, 160); g.strokeStyle = '#E6E7CF'; g.lineWidth = 6; g.strokeRect(8, 8, 240, 144); g.fillStyle = '#7FE3FF'; g.font = F(700, 110); g.textAlign = 'center'; g.fillText('5G', 128, 120); })}), []);
  const lamp = Math.floor(t * 1.5) % 2 === 0;
  const w0 = 1.4, w1 = 0.35; const corner = (y: number, sx: number, sz: number): V3 => { const w = w0 + (w1 - w0) * (y / h); return [sx * w, y, sz * w]; };
  const C: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const lv = Array.from({length: 9}, (_, i) => (i * h) / 8);
  const parts: React.ReactNode[] = [];
  C.forEach(([sx, sz], i) => parts.push(bar(corner(0, sx, sz), corner(h, sx, sz), 0.07, 'leg' + i)));
  lv.forEach((y, j) => C.forEach(([sx, sz], i) => { const [nx, nz] = C[(i + 1) % 4]; parts.push(bar(corner(y, sx, sz), corner(y, nx, nz), 0.035, `r${j}${i}`, steelD));
    if (j < 8) parts.push(bar(corner(y, sx, sz), corner(lv[j + 1], nx, nz), 0.025, `x${j}${i}`, steelD)); }));
  return <group position={position} rotation={[0, yaw, 0]}>
    {parts}
    {/* antenna platform + three panel sectors + dish */}
    <mesh castShadow position={[0, h - 1.2, 0]} material={steelD}><cylinderGeometry args={[1.0, 1.0, 0.08, 16]} /></mesh>
    {[0, 1, 2].map((i) => { const a = (i * Math.PI * 2) / 3 + 0.4; return <mesh key={i} castShadow position={[Math.sin(a) * 0.95, h - 0.2, Math.cos(a) * 0.95]} rotation={[0, a, 0]} material={panel}><boxGeometry args={[0.36, 1.6, 0.14]} /></mesh>; })}
    <mesh castShadow position={[0, h + 1.0, 0]} material={steel}><cylinderGeometry args={[0.05, 0.08, 2.0, 8]} /></mesh>
    <mesh position={[0, h + 2.05, 0]} material={MB(lamp ? '#FF3B30' : '#5A1512')}><sphereGeometry args={[0.12, 10, 8]} /></mesh>
    {lamp && <sprite position={[0, h + 2.05, 0]} scale={1.4} material={new THREE.SpriteMaterial({map: glowTex(), color: '#FF3B30', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})} />}
    <mesh position={[0, h * 0.55, w0 + (w1 - w0) * 0.55 + 0.05]} material={plate}><planeGeometry args={[1.6, 1.0]} /></mesh>
    {glow > 0 && <Waves5G t={t} y={h - 0.2} k={glow} />}
    {/* concrete footing */}
    <mesh receiveShadow castShadow position={[0, 0.15, 0]} material={M('#BDB8AE', 0.9, 0, {}, 'tw-foot')}><boxGeometry args={[3.6, 0.3, 3.6]} /></mesh>
  </group>;
};
/** big confident 5G waves rolling off the mast (cyan rings) */
const w5M = [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({color: '#7FE3FF', transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide}));
const Waves5G: React.FC<{t: number; y: number; k: number}> = ({t, y, k}) => <group position={[0, y, 0]}>
  {[0, 1, 2, 3].map((i) => { const u = (t * 0.6 + i / 4) % 1; w5M[i].opacity = k * 0.55 * Math.sin(u * Math.PI);
    return <mesh key={i} rotation={[Math.PI / 2, 0, 0]} scale={1.2 + u * 9} material={w5M[i]}><torusGeometry args={[1, 0.025, 4, 48]} /></mesh>; })}
</group>;

// =====================================================================================================
// the sentence: a signal-proof steel box (riveted, stencilled), lid hinged at the back. Origin = base centre.
// =====================================================================================================
const boxM = M('#6E767E', 0.55, 0.55, {}, 'sb-steel'), boxD = M('#4E555C', 0.55, 0.5, {}, 'sb-steelD'), rivet = M('#A8AFB6', 0.35, 0.7, {}, 'sb-rivet');
const stencil = () => tex('ep10-box', 512, 320, (g) => { g.clearRect(0, 0, 512, 320); g.fillStyle = 'rgba(240,206,70,0.95)'; g.font = F(700, 78); g.textAlign = 'center'; g.fillText('ทึบคลื่น', 256, 120);
  g.font = F(700, 46); g.fillText('นช. เราเตอร์ · 2 ปี', 256, 200); g.fillStyle = 'rgba(240,206,70,0.85)'; for (let i = 0; i < 8; i++) { g.save(); g.translate(30 + i * 64, 270); g.transform(1, 0, -0.6, 1, 0, 0); g.fillRect(0, -18, 30, 36); g.restore(); }
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 400; i++) g.fillRect(hash(i) * 512, hash(i * 3) * 320, 3, 3); });
export const SteelBox: React.FC<{position?: V3; yaw?: number; s?: number; lid?: number}> = ({position = [0, 0, 0], yaw = 0, s = 0.62, lid = 0}) => {
  const st = useMemo(() => new THREE.MeshBasicMaterial({map: stencil(), transparent: true, toneMapped: false, depthWrite: false}), []);
  const r: V3[] = []; for (let i = 0; i < 6; i++) for (const y of [0.04, s - 0.04]) r.push([-s / 2 + 0.05 + i * (s - 0.1) / 5, y, s / 2 + 0.003]);
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh castShadow receiveShadow position={[0, s / 2, 0]} material={boxM}><boxGeometry args={[s, s, s]} /></mesh>
    {[-1, 1].map((k) => <mesh key={k} castShadow position={[0, s * 0.16, k * (s / 2 + 0.006)]} material={boxD}><boxGeometry args={[s * 0.96, 0.04, 0.012]} /></mesh>)}
    {r.map((p, i) => <mesh key={i} position={p} material={rivet}><sphereGeometry args={[0.009, 6, 4]} /></mesh>)}
    <mesh position={[0, s * 0.56, s / 2 + 0.008]} material={st}><planeGeometry args={[s * 0.9, s * 0.56]} /></mesh>
    {/* lid: hinged on the back top edge */}
    <group position={[0, s, -s / 2]} rotation={[-lid * 1.9, 0, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.015, s / 2]} material={boxD}><boxGeometry args={[s + 0.03, 0.03, s + 0.03]} /></mesh>
      <mesh castShadow position={[0, 0.04, s / 2]} material={rivet}><boxGeometry args={[0.12, 0.025, 0.04]} /></mesh>
    </group>
    {/* padlock on the front */}
    {lid < 0.05 && <group position={[0, s - 0.06, s / 2 + 0.03]}><mesh castShadow material={M('#C9A23A', 0.35, 0.8, {}, 'sb-lock')}><boxGeometry args={[0.07, 0.06, 0.025]} /></mesh>
      <mesh position={[0, 0.045, 0]} material={rivet}><torusGeometry args={[0.022, 0.006, 6, 12, Math.PI]} /></mesh></group>}
  </group>;
};
