import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F, glowTex} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {HANDLE, V3} from './data';

/** EP8 props. Everything is a pure function of its props (Remotion renders frames out of order). */
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const CREAM = '#E6E7CF', NAVY = '#152028', BRICK = '#B0402E', INK = '#14110F', ORANGE = '#F07A24', SHADE = '#0D0E11';
const mats = new Map<string, THREE.Material>();
const once = <T extends THREE.Material>(k: string, f: () => T) => { if (!mats.has(k)) mats.set(k, f()); return mats.get(k) as T; };
export const label = (key: string, w: number, h: number, bg: string, fg: string, lines: string[], size: number, border?: string) => once('lbl8' + key, () => new THREE.MeshBasicMaterial({toneMapped: false, side: THREE.DoubleSide, map: tex('lbl8-' + key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = border; g.lineWidth = Math.max(4, h * 0.05); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = F(700, size);
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.18));
})}));
export const Glow: React.FC<{p: V3; c: string; s: number; o: number}> = ({p, c, s, o}) => o <= 0.01 ? null :
  <sprite position={p} scale={s}><spriteMaterial map={glowTex()} color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></sprite>;

// =====================================================================================================
// THE ACCUSED: the man's own shadow. Its body is a second instance of the man with every material set to
// flat black (shots.tsx); these are its eyes: two white scowling eyes that blink (same ink language as the
// durian/bolt). `mode`: 'angry' | 'blink' | 'wide' | 'shut'
// =====================================================================================================
export const SHADOW_MAT = new THREE.MeshBasicMaterial({color: SHADE, toneMapped: false});
const eyesTex = (mode: string) => tex('shade-eyes-' + mode, 256, 112, (g) => {
  g.clearRect(0, 0, 256, 112); g.fillStyle = '#FFFFFF'; g.strokeStyle = '#FFFFFF'; g.lineCap = 'round';
  if (mode === 'shut' || mode === 'blink') { g.lineWidth = 12; [[30, 112], [144, 226]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a, 64); g.lineTo(b, 64); g.stroke(); }); return; }
  const open = mode === 'wide' ? 1.35 : 1;
  [[70, 1], [186, -1]].forEach(([x, s]) => {
    // an eye cut flat on top by an angry brow (slanting down to the nose)
    g.save(); g.beginPath(); g.ellipse(x, 66, 44, 30 * open, 0, 0, Math.PI * 2); g.clip();
    g.fillRect(x - 50, 0, 100, 112);
    if (mode !== 'wide') { g.fillStyle = SHADE; g.beginPath(); g.moveTo(x - 60, 20); g.lineTo(x + 60, 20); g.lineTo(x + 60, s > 0 ? 56 : 26); g.lineTo(x - 60, s > 0 ? 26 : 56); g.closePath(); g.fill(); }
    g.fillStyle = SHADE; g.beginPath(); g.arc(x + 4 * s, 76, 11, 0, 7); g.fill();
    g.restore(); g.fillStyle = '#FFFFFF';
  });
});
const eyeMat = (mode: string) => once('eyes8-' + mode, () => new THREE.MeshBasicMaterial({map: eyesTex(mode), transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide}));
export const eyeMode = (t: number, base = 'angry') => { const per = 2.7; const k = (t + 0.9) % per; return k < 0.08 ? 'blink' : base; };
/** eyes on the shadow's box head (head-frame cm units, like the shades in EP7) */
export const makeEyes = () => {
  const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(21, 9.2), eyeMat('angry')); m.position.set(0, 15.2, 15.6); m.name = 'eyes'; g.add(m);
  g.traverse((o: any) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = 5; } });
  return g;
};
export const setEyes = (g: THREE.Object3D, mode: string) => { const m = g.getObjectByName('eyes') as THREE.Mesh | undefined; if (m) m.material = eyeMat(mode); };
/** the eyes lying on the ground on the projected (street) shadow's head */
export const GroundEyes: React.FC<{p: V3; yaw: number; s?: number; mode?: string}> = ({p, yaw, s = 1, mode = 'angry'}) =>
  <mesh position={[p[0], 0.012, p[2]]} rotation={[-Math.PI / 2, 0, yaw]} material={eyeMat(mode)} renderOrder={6}><planeGeometry args={[0.21 * s, 0.092 * s]} /></mesh>;

// =====================================================================================================
// THE STREET (day): a "ซอยเปลี่ยว" sign at the corner
// =====================================================================================================
export const SoiSign: React.FC<{position: V3; yaw?: number}> = ({position, yaw = 0}) => <group position={position} rotation={[0, yaw, 0]}>
  <mesh castShadow position={[0, 1.2, 0]} material={M('#8E949A', 0.5, 0.5)}><cylinderGeometry args={[0.035, 0.035, 2.4, 8]} /></mesh>
  <mesh position={[0, 2.25, 0.04]} material={label('soi', 512, 160, '#2E6B4A', '#F4F6F2', ['ซอยเปลี่ยว'], 84, '#F4F6F2')}><planeGeometry args={[0.9, 0.28]} /></mesh>
</group>;

// =====================================================================================================
// THE RAID: floodlights on tripods (20 of them) aimed at the shadow, a cake-spatula the size of a shovel
// =====================================================================================================
export const Floodlight: React.FC<{position: V3; aim: V3; on: number; t: number; seed?: number; beam?: number}> = ({position, aim, on, t, seed = 0, beam = 1}) => {
  const p = new THREE.Vector3(...position), a = new THREE.Vector3(...aim); const head = p.clone().add(new THREE.Vector3(0, 2.2, 0));
  const dir = a.clone().sub(head).normalize(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  const L = a.distanceTo(head); const flick = on > 0 && on < 1 ? (Math.floor(t * 30 + seed) % 2 ? 0.5 : 1) : 1;
  const leg = M('#3A3E44', 0.6, 0.4);
  return <group>
    {[0, 1, 2].map((i) => { const ang = i * 2.09 + seed; const foot = p.clone().add(new THREE.Vector3(Math.cos(ang) * 0.45, 0, Math.sin(ang) * 0.45));
      const mid = foot.clone().add(head).multiplyScalar(0.5); const v = head.clone().sub(foot); const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
      return <mesh key={i} position={mid} quaternion={qq} material={leg}><cylinderGeometry args={[0.025, 0.025, v.length(), 5]} /></mesh>; })}
    <group position={head} quaternion={q}>
      <mesh material={M('#2A2D32', 0.5, 0.5)} castShadow><boxGeometry args={[0.55, 0.3, 0.42]} /></mesh>
      <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]} material={on > 0 ? MB('#FFFBE8') : MB('#4A4E54')}><planeGeometry args={[0.48, 0.36]} /></mesh>
      {on > 0 && <mesh position={[0, -L / 2, 0]} renderOrder={2}><cylinderGeometry args={[0.24, 1.1, L, 16, 1, true]} /><meshBasicMaterial color="#FFF6D8" transparent opacity={0.045 * on * flick * beam} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>}
    </group>
    {on > 0 && <Glow p={[head.x + dir.x * 0.2, head.y + dir.y * 0.2, head.z + dir.z * 0.2]} c="#FFF2C8" s={beam ? 1.6 : 0.8} o={(beam ? 0.6 : 0.35) * on * flick} />}
  </group>;
};
/** a pool of hard white light on the road where the floodlights meet */
export const LightPool: React.FC<{center: V3; r: number; k: number}> = ({center, r, k}) => k <= 0 ? null :
  <mesh position={[center[0], 0.006, center[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}><circleGeometry args={[r, 40]} /><meshBasicMaterial color="#FFFBEA" transparent opacity={0.3 * k} depthWrite={false} toneMapped={false} /></mesh>;
/** the giant cake spatula ("เกรียงแซะขนมโตเกียว"), blade forward along +z, handle along −z; origin at the handle grip */
export const Spatula: React.FC<{position: V3; rotation?: V3; s?: number}> = ({position, rotation = [0, 0, 0], s = 1}) => {
  const steel = M('#C9CED6', 0.3, 0.8);
  return <group position={position} rotation={rotation} scale={s}>
    <mesh castShadow position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]} material={M('#7A4A2A', 0.8)}><cylinderGeometry args={[0.035, 0.035, 0.6, 8]} /></mesh>
    <mesh castShadow position={[0, -0.02, 0.32]} rotation={[0.18, 0, 0]} material={steel}><boxGeometry args={[0.05, 0.02, 0.3]} /></mesh>
    <mesh castShadow position={[0, -0.06, 0.66]} rotation={[0.05, 0, 0]} material={steel}><boxGeometry args={[0.42, 0.012, 0.44]} /></mesh>
    <mesh position={[0, 0.04, -0.15]} rotation={[0, 0, 0]} material={label('spat', 512, 96, '#F4EFE2', INK, ['อุปกรณ์เก็บกู้เงา'], 54, BRICK)}><planeGeometry args={[0.36, 0.07]} /></mesh>
  </group>;
};

// =====================================================================================================
// COMMUNITY SERVICE: orange hi-vis vest (front + back text), an EM ankle tag, a broom
// =====================================================================================================
const vestTex = (back: boolean) => tex('vest8-' + (back ? 'b' : 'f'), 256, 320, (g) => {
  g.fillStyle = ORANGE; g.fillRect(0, 0, 256, 320); g.fillStyle = '#E8ECEA'; g.fillRect(0, 196, 256, 22); g.fillRect(0, 248, 256, 22);
  if (!back) { g.fillStyle = SHADE; g.beginPath(); g.moveTo(84, 0); g.lineTo(128, 110); g.lineTo(172, 0); g.closePath(); g.fill(); }
  g.fillStyle = INK; g.textAlign = 'center'; g.font = F(700, back ? 52 : 30);
  if (back) g.fillText('คุมประพฤติ', 128, 120); else { g.fillText('บริการสังคม', 128, 150); g.font = F(700, 34); g.fillText('500 ชม.', 128, 186); }
});
export const Vest: React.FC<{position: V3; yaw?: number; w?: number; h?: number; pitch?: number}> = ({position, yaw = 0, w = 0.46, h = 0.56, pitch = 0}) => {
  const f = useMemo(() => new THREE.MeshBasicMaterial({map: vestTex(false), toneMapped: false}), []);
  const b = useMemo(() => new THREE.MeshBasicMaterial({map: vestTex(true), toneMapped: false}), []);
  return <group position={position} rotation={[pitch, yaw, 0]}>
    <mesh position={[0, 0, 0.012]} material={f}><planeGeometry args={[w, h]} /></mesh>
    <mesh position={[0, 0, -0.012]} rotation={[0, Math.PI, 0]} material={b}><planeGeometry args={[w, h]} /></mesh>
  </group>;
};
export const Anklet: React.FC<{position: V3; t: number; s?: number}> = ({position, t, s = 1}) => <group position={position} scale={s}>
  <mesh material={M('#1A1C20', 0.6)}><torusGeometry args={[0.07, 0.018, 6, 16]} /></mesh>
  <mesh position={[0, 0, 0.08]} material={M('#24272C', 0.5)}><boxGeometry args={[0.08, 0.06, 0.04]} /></mesh>
  <mesh position={[0.02, 0.012, 0.102]} material={MB(Math.floor(t * 2.5) % 2 ? '#40E070' : '#1A3A22')}><circleGeometry args={[0.009, 8]} /></mesh>
</group>;
export const Broom: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => <group position={position} rotation={rotation}>
  <mesh castShadow position={[0, 0.65, 0]} material={M('#B48B5A', 0.8)}><cylinderGeometry args={[0.018, 0.018, 1.3, 6]} /></mesh>
  <mesh castShadow position={[0, -0.05, 0]} material={M('#D9C27E', 0.9)}><coneGeometry args={[0.16, 0.3, 10]} /></mesh>
</group>;

// =====================================================================================================
// THE BUS STOP in front of the prison: shelter, bench, the stop sign, a digital clock
// =====================================================================================================
const clockTex = (txt: string) => tex('clock8-' + txt, 256, 112, (g) => {
  g.fillStyle = '#101214'; g.fillRect(0, 0, 256, 112); g.fillStyle = txt.startsWith('12') ? '#FF5A3C' : '#FFB23C'; g.font = F(700, 64); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 48);
  g.font = F(600, 22); g.fillText(txt.startsWith('12') ? 'เที่ยงตรง' : 'เวลา', 128, 96);
});
export const BusStop: React.FC<{position: V3; yaw?: number; clock: string}> = ({position, yaw = 0, clock}) => {
  const cm = useMemo(() => new THREE.MeshBasicMaterial({map: clockTex(clock), toneMapped: false}), [clock]);
  const post = M('#5E636B', 0.5, 0.5);
  return <group position={position} rotation={[0, yaw, 0]}>
    {[-1.4, 1.4].map((x) => <mesh key={x} castShadow position={[x, 1.25, -0.5]} material={post}><boxGeometry args={[0.08, 2.5, 0.08]} /></mesh>)}
    <mesh castShadow receiveShadow position={[0, 2.52, -0.1]} rotation={[0.08, 0, 0]} material={PM('#2E6F8E', 'busroof')}><boxGeometry args={[3.2, 0.08, 1.4]} /></mesh>
    <mesh castShadow position={[0, 0.45, -0.55]} material={PM('#C9B48A', 'bench')}><boxGeometry args={[2.4, 0.06, 0.38]} /></mesh>
    {[-1, 1].map((x) => <mesh key={x} position={[x, 0.22, -0.55]} material={post}><boxGeometry args={[0.05, 0.44, 0.3]} /></mesh>)}
    <mesh position={[0, 1.4, -0.56]} material={PM('#9FB8C2', 'busback')}><boxGeometry args={[2.8, 1.5, 0.03]} /></mesh>
    <group position={[2.0, 0, 0.1]}>
      <mesh castShadow position={[0, 1.3, 0]} material={post}><cylinderGeometry args={[0.04, 0.04, 2.6, 8]} /></mesh>
      <mesh position={[0, 2.4, 0.05]} material={label('busstop', 512, 320, '#1D5C9E', '#F4F6F8', ['ป้ายรถเมล์', 'หน้าเรือนจำ'], 82, '#F4F6F8')}><planeGeometry args={[0.8, 0.5]} /></mesh>
      <mesh position={[0, 2.4, 0.03]} rotation={[0, Math.PI, 0]} material={MB('#1D5C9E')}><planeGeometry args={[0.8, 0.5]} /></mesh>
      <mesh position={[0, 1.85, 0.05]} material={cm}><planeGeometry args={[0.5, 0.22]} /></mesh>
      <mesh position={[0, 1.85, -0.05]} rotation={[0, Math.PI, 0]} material={cm}><planeGeometry args={[0.5, 0.22]} /></mesh>
    </group>
  </group>;
};
/** the low-poly sun: a faceted yellow ball with a glow */
export const SunBall: React.FC<{position: V3; r?: number}> = ({position, r = 1.6}) => <group position={position}>
  <mesh material={MB('#FFD84A')}><icosahedronGeometry args={[r, 1]} /></mesh>
  <Glow p={[0, 0, 0]} c="#FFE9A0" s={r * 7} o={0.85} />
</group>;

// =====================================================================================================
// THE END CARD: the probation officer's community-service log (pause-bait: every field is a joke) + stamp
// =====================================================================================================
const reportTex = () => tex('report-8', 768, 1024, (g) => {
  g.fillStyle = '#F6F2E6'; g.fillRect(0, 0, 768, 1024); g.fillStyle = 'rgba(0,0,0,0.04)'; for (let i = 0; i < 2000; i++) g.fillRect(hash(i) * 768, hash(i * 2.3) * 1024, 2, 2);
  g.fillStyle = NAVY; g.fillRect(0, 0, 768, 150); g.fillStyle = CREAM; g.font = F(700, 48); g.textAlign = 'center'; g.fillText('ใบบันทึกการบำเพ็ญประโยชน์', 384, 72); g.font = F(600, 30); g.fillText('สำนักงานคุมประพฤติ · หน้าเรือนจำ', 384, 120);
  g.textAlign = 'left';
  const row = (y: number, k: string, v: string[], red = false, size = 40) => { g.fillStyle = '#6A6A70'; g.font = F(600, 28); g.fillText(k, 46, y); g.fillStyle = red ? BRICK : INK; g.font = F(700, size); v.forEach((l, i) => g.fillText(l, 46, y + 50 + i * (size + 10))); };
  row(206, 'ผู้คุมประพฤติ', ['นช. เงา (ไม่มีลายนิ้วมือ)']);
  row(330, 'งานที่ได้รับมอบหมาย', ['ยืนบังแดดป้ายรถเมล์ 500 ชั่วโมง']);
  row(454, 'สถานะ', ['หนีงานตอนเที่ยงตรง', '(หดตัวลงพื้น)'], true);
  row(628, 'ความเห็นเจ้าหน้าที่', ['รอจับกุมอีกครั้งตอนบ่ายสามโมง', '(รอแดดร่ม)'], false, 36);
  g.fillStyle = '#9A9AA0'; g.font = F(500, 26); g.textAlign = 'right'; g.fillText(HANDLE, 722, 990);
});
const stampTex = () => tex('stamp-8', 640, 256, (g) => {
  g.clearRect(0, 0, 640, 256); g.save(); g.translate(320, 128); g.strokeStyle = '#D7262B'; g.lineWidth = 14; g.strokeRect(-260, -110, 520, 220); g.lineWidth = 4; g.strokeRect(-242, -92, 484, 184);
  g.fillStyle = '#D7262B'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = F(700, 132); g.fillText('อู้งาน', 0, 8); g.restore();
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + hash(i) * 0.6})`; g.fillRect(hash(i * 2.7) * 640, hash(i * 5.1) * 256, 3 + hash(i) * 5, 2 + hash(i * 3) * 4); }
});
export const Report: React.FC<{position: V3; rotation?: V3; w?: number; stamp: number}> = ({position, rotation, w = 0.6, stamp}) => {
  const pm = useMemo(() => new THREE.MeshBasicMaterial({map: reportTex(), toneMapped: false}), []);
  const sm = useMemo(() => new THREE.MeshBasicMaterial({map: stampTex(), transparent: true, toneMapped: false, depthWrite: false, opacity: 0.92}), []);
  const h = w * 1024 / 768; const s = stamp <= 0 ? 0 : 1.8 - 0.8 * cl(stamp);
  return <group position={position} rotation={rotation}>
    <mesh material={pm}><planeGeometry args={[w, h]} /></mesh>
    <mesh position={[0, 0.47 * h, 0.004]} material={M('#9AA0A6', 0.4, 0.7)}><boxGeometry args={[w * 0.3, h * 0.03, 0.006]} /></mesh>
    {stamp > 0 && <mesh position={[0.12 * w, -0.08 * h, 0.002 + (1 - cl(stamp)) * 0.1]} rotation={[0, 0, -0.16]} scale={s} material={sm}><planeGeometry args={[w * 0.62, w * 0.62 * 256 / 640]} /></mesh>}
  </group>;
};
