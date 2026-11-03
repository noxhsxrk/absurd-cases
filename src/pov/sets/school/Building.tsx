import React, {useMemo} from 'react';
import * as THREE from 'three';
import {canvasTex} from '../../lib/tex';
import {hash, smooth, clamp} from '../../lib/math';

/**
 * EP2 sets, all real geometry (no backdrops), metres, y = 0 is the 2nd-floor (ห้อง 325) floor, ground at −3.6.
 * Building 3: open corridor on the −x side (parapet at x = −6.6), ห้อง 325 at z ∈ [−5, 5] (EP1's classroom),
 * stair hall at z ∈ [−10, −5] across the building (U-stair, breeze-block wall on the front façade x = 4.2),
 * ห้อง 324 beyond it, 326 behind us. Behind the building: covered walkway → canteen → back yard → back fence + gate → alley.
 */
type V3 = [number, number, number];
export const GROUND = -3.6;
const G = GROUND;
const mats = new Map<string, THREE.MeshStandardMaterial>();
export const mat = (c: string, rough = 0.85, metal = 0, flat = false) => { const k = `${c}|${rough}|${metal}|${flat}`; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({color: c, roughness: rough, metalness: metal, flatShading: flat})); return mats.get(k)!; };
export const Box: React.FC<{p?: V3; s: V3; c?: string; r?: V3; rough?: number; metal?: number; m?: THREE.Material; shadow?: boolean}> = ({p = [0, 0, 0], s, c = "#DDD", r, rough = 0.85, metal = 0, m, shadow = true}) => (
  <mesh position={p} rotation={r} material={m ?? mat(c, rough, metal)} castShadow={shadow} receiveShadow><boxGeometry args={s} /></mesh>
);
const Cyl: React.FC<{p: V3; r0: number; r1?: number; h: number; c: string; rot?: V3; seg?: number; rough?: number; metal?: number}> = ({p, r0, r1, h, c, rot, seg = 10, rough = 0.6, metal = 0}) => (
  <mesh position={p} rotation={rot} material={mat(c, rough, metal)} castShadow receiveShadow><cylinderGeometry args={[r1 ?? r0, r0, h, seg]} /></mesh>
);
const F = (w: number, px: number) => `${w} ${px}px Prompt, sans-serif`;
const sign = (w: number, h: number, bg: string, fg: string, text: string, px: number, sub?: string) => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = F(700, px); g.fillText(text, w / 2, sub ? h * 0.4 : h / 2); if (sub) { g.font = F(500, px * 0.5); g.fillText(sub, w / 2, h * 0.76); }
});
const Plane: React.FC<{p: V3; s: [number, number]; r?: V3; map: THREE.Texture; basic?: boolean; c?: string}> = ({p, s, r, map, basic, c = '#fff'}) => (
  <mesh position={p} rotation={r}><planeGeometry args={s} />{basic ? <meshBasicMaterial map={map} color={c} toneMapped={false} /> : <meshStandardMaterial map={map} color={c} roughness={0.8} />}</mesh>
);

// ---------------- textures ----------------
export const useTex = () => useMemo(() => {
  const terrazzo = canvasTex(256, 256, (g) => { g.fillStyle = '#C9C3B6'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 2200; k++) { g.fillStyle = ['#8F887C', '#EDE8DD', '#A99C86', '#6E6A64'][k % 4]; g.globalAlpha = 0.35 + hash(k) * 0.4; const s = 1 + hash(k * 3.1) * 3; g.fillRect(hash(k * 1.7) * 256, hash(k * 2.9) * 256, s, s); } g.globalAlpha = 1; g.strokeStyle = 'rgba(80,74,66,.45)'; g.lineWidth = 2; g.strokeRect(1, 1, 254, 254); }, [3, 30]);
  const tread = canvasTex(128, 64, (g) => { g.fillStyle = '#BDB6A8'; g.fillRect(0, 0, 128, 64); for (let k = 0; k < 500; k++) { g.fillStyle = ['#8F887C', '#E6E1D6', '#776F65'][k % 3]; g.globalAlpha = 0.4; g.fillRect(hash(k * 1.3) * 128, hash(k * 2.2) * 64, 2, 2); } g.globalAlpha = 1; g.fillStyle = '#5C574F'; g.fillRect(0, 54, 128, 10); g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < 128; x += 6) g.fillRect(x, 56, 3, 6); });
  const concrete = canvasTex(256, 256, (g) => { g.fillStyle = '#A9A59C'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 3000; k++) { g.fillStyle = hash(k) > 0.5 ? 'rgba(60,58,52,.10)' : 'rgba(255,255,250,.10)'; g.fillRect(hash(k * 2.3) * 256, hash(k * 4.1) * 256, 3, 3); } for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(50,48,44,.25)'; g.lineWidth = 1; g.beginPath(); let x = hash(k * 7) * 256, y = 0; g.moveTo(x, y); while (y < 256) { x += (hash(k + y) - 0.5) * 18; y += 12; g.lineTo(x, y); } g.stroke(); } g.strokeStyle = 'rgba(60,56,50,.35)'; g.lineWidth = 2; g.strokeRect(0, 0, 256, 256); }, [1, 1]);
  concrete.repeat.set(1, 1);
  const breeze = canvasTex(256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.fillStyle = '#E8E1D1'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.save(); g.translate(i * 64 + 32, j * 64 + 32); g.globalCompositeOperation = 'destination-out'; g.beginPath(); for (let a = 0; a < 4; a++) { const ang = a * Math.PI / 2 + Math.PI / 4; g.moveTo(0, 0); g.arc(0, 0, 24, ang - 0.5, ang + 0.5); } g.fill(); g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); g.restore(); } }, [4, 2]);
  const notice = canvasTex(512, 320, (g) => { g.fillStyle = '#2F5B3A'; g.fillRect(0, 0, 512, 320); g.fillStyle = '#284F33'; g.fillRect(10, 10, 492, 300); const cards: [number, number, number, number, string, string][] = [[24, 24, 150, 120, '#FFFFFF', 'ตารางสอบ'], [190, 30, 140, 100, '#FFF3B8', 'ชุมนุม'], [346, 22, 140, 130, '#D8ECFF', 'กีฬาสี'], [30, 170, 160, 120, '#FFE0E0', 'แผนอพยพ'], [210, 160, 130, 130, '#FFFFFF', 'ประกาศ'], [356, 176, 130, 110, '#E5FFE1', 'อย. น้อย']]; cards.forEach(([x, y, w, h, c, s], k) => { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate((hash(k + 3) - 0.5) * 0.12); g.fillStyle = c; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = '#D33'; g.beginPath(); g.arc(0, -h / 2 + 8, 5, 0, 7); g.fill(); g.fillStyle = '#333'; g.font = F(600, 20); g.textAlign = 'center'; g.fillText(s, 0, -h / 2 + 34); g.fillStyle = 'rgba(0,0,0,.25)'; for (let l = 0; l < 4; l++) g.fillRect(-w / 2 + 12, -h / 2 + 50 + l * 14, w - 24 - hash(k + l) * 30, 4); g.restore(); }); });
  const exit = canvasTex(256, 96, (g) => { g.fillStyle = '#119A4F'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#fff'; g.font = F(700, 34); g.textAlign = 'left'; g.fillText('ทางหนีไฟ', 92, 48); g.font = F(500, 18); g.fillText('FIRE EXIT', 96, 76); g.beginPath(); g.arc(46, 26, 9, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(44, 38); g.lineTo(38, 62); g.lineTo(54, 84); g.moveTo(38, 62); g.lineTo(26, 84); g.moveTo(42, 46); g.lineTo(60, 52); g.moveTo(42, 46); g.lineTo(26, 54); g.stroke(); });
  const floor2 = sign(256, 128, '#1F3F8F', '#fff', 'ชั้น 2', 54, 'อาคาร 3');
  const floor1 = sign(256, 128, '#1F3F8F', '#fff', 'ชั้น 1', 54, 'อาคาร 3');
  const r324 = sign(512, 160, '#1F3F8F', '#fff', 'ห้อง 324', 66, 'ม.5/2');
  const r326 = sign(512, 160, '#1F3F8F', '#fff', 'ห้อง 326', 66, 'ม.5/4');
  const canteen = sign(1024, 200, '#B8432F', '#FFF6E6', 'โรงอาหาร', 110, 'กินให้หมด เก็บถาดให้เรียบร้อย');
  const stalls = ['ข้าวมันไก่ป้าแดง', 'ก๋วยเตี๋ยวลุงชัย', 'ข้าวราดแกง', 'น้ำหวาน · ไอติม'].map((s, i) => sign(512, 128, ['#F2C14E', '#E86A3B', '#4E9A5B', '#3E7CC9'][i], '#1C1C22', s, 54));
  const menu = canvasTex(256, 192, (g) => { g.fillStyle = '#1E2A22'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#F4EED8'; g.font = F(600, 22); ['ข้าวมันไก่ 35', 'ข้าวไก่ทอด 40', 'พิเศษ +10', 'น้ำซุป ฟรี'].forEach((s, i) => g.fillText(s, 16, 40 + i * 40)); });
  const wash = sign(256, 96, '#FFFFFF', '#1F6FB3', 'ล้างมือก่อนกิน', 34);
  const gateSign = sign(256, 110, '#F4F1E8', '#B3262E', 'ประตูหลัง', 44, 'เปิด 06:30-07:30 · 15:30-16:30');
  const shutter = canvasTex(128, 128, (g) => { g.fillStyle = '#9EA4AA'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 6) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y, 128, 2); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, y + 2, 128, 1); } });
  const shop = ['ร้านชำ ป้าหนู', 'ซ่อมรถ', 'ข้าวแกง', 'ตัดผม'].map((s, i) => sign(512, 110, ['#F6E7B0', '#D9E8F5', '#F5D9C9', '#E2F0D9'][i], '#30302E', s, 52));
  const corrugated = canvasTex(64, 64, (g) => { for (let x = 0; x < 64; x++) { const v = 150 + Math.sin(x / 64 * Math.PI * 8) * 40; g.fillStyle = `rgb(${v},${v + 4},${v + 8})`; g.fillRect(x, 0, 1, 64); } });
  const crate = canvasTex(64, 64, (g) => { g.fillStyle = '#2F6FB5'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#245A93'; for (let i = 0; i < 4; i++) g.fillRect(4 + i * 15, 8, 9, 48); });
  const asphalt = canvasTex(256, 256, (g) => { g.fillStyle = '#56585C'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 4000; k++) { g.fillStyle = hash(k) > 0.5 ? 'rgba(20,20,22,.18)' : 'rgba(200,200,190,.12)'; g.fillRect(hash(k * 1.9) * 256, hash(k * 3.3) * 256, 2, 2); } }, [3, 10]);
  const grass = canvasTex(256, 256, (g) => { g.fillStyle = '#7A9A55'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 6000; k++) { g.fillStyle = hash(k) > 0.5 ? 'rgba(50,80,30,.25)' : 'rgba(170,190,120,.2)'; g.fillRect(hash(k * 2.1) * 256, hash(k * 3.9) * 256, 2, 3); } }, [6, 6]);
  // weathered exterior plaster: cream top, grime gradient to the floor, rain streaks, patches (no flat walls anywhere)
  const plaster = (base: string, w = 512, h = 256, rep: [number, number] = [1, 1]) => canvasTex(w, h, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 2600; k++) { g.fillStyle = hash(k) > 0.5 ? 'rgba(70,64,52,.07)' : 'rgba(255,255,248,.08)'; g.fillRect(hash(k * 2.3) * w, hash(k * 4.1) * h, 3, 3); }
    const gr = g.createLinearGradient(0, h * 0.62, 0, h); gr.addColorStop(0, 'rgba(60,54,44,0)'); gr.addColorStop(1, 'rgba(60,54,44,.42)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 14; k++) { const x = hash(k * 9.1) * w, l = h * (0.15 + hash(k * 3.3) * 0.45); const st = g.createLinearGradient(0, 0, 0, l); st.addColorStop(0, 'rgba(70,66,58,.22)'); st.addColorStop(1, 'rgba(70,66,58,0)'); g.fillStyle = st; g.fillRect(x, 0, 2 + hash(k) * 5, l); }
    for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(${hash(k) > 0.5 ? '240,236,224' : '150,140,120'},.25)`; g.fillRect(hash(k * 5.7) * w, h * (0.2 + hash(k * 1.9) * 0.6), 20 + hash(k * 2.2) * 60, 10 + hash(k * 3.6) * 30); }
  }, rep);
  const kitchenWall = plaster('#E3D7BC', 1024, 512);
  const blockWall = plaster('#EADFC6', 512, 256, [6, 1]);
  const tiles = canvasTex(128, 128, (g) => { g.fillStyle = '#CFE0DC'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(80,96,92,.5)'; g.lineWidth = 2; for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); } for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(90,80,60,.12)'; g.fillRect(hash(k * 3.1) * 128, hash(k * 1.7) * 128, 6, 4); } }, [6, 2]);
  const stallSide = canvasTex(256, 512, (g) => { g.fillStyle = '#E4DCCB'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#CFE0DC'; g.fillRect(0, 300, 256, 212); g.strokeStyle = 'rgba(80,96,92,.45)'; g.lineWidth = 2; for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 300); g.lineTo(x, 512); g.stroke(); } for (let y = 300; y <= 512; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } g.fillStyle = '#4F6B87'; g.fillRect(0, 292, 256, 8); for (let k = 0; k < 900; k++) { g.fillStyle = hash(k) > 0.5 ? 'rgba(70,60,40,.08)' : 'rgba(255,255,250,.08)'; g.fillRect(hash(k * 2.3) * 256, hash(k * 4.1) * 300, 3, 3); } const gr = g.createLinearGradient(0, 380, 0, 512); gr.addColorStop(0, 'rgba(70,60,40,0)'); gr.addColorStop(1, 'rgba(70,60,40,.35)'); g.fillStyle = gr; g.fillRect(0, 380, 256, 132); for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(120,90,50,.18)'; g.beginPath(); g.arc(hash(k * 7.7) * 256, 330 + hash(k * 3.3) * 160, 6 + hash(k) * 12, 0, 7); g.fill(); } });
  const poster = canvasTex(256, 352, (g) => { const gr = g.createLinearGradient(0, 0, 0, 352); gr.addColorStop(0, '#1E88C8'); gr.addColorStop(1, '#0E4E86'); g.fillStyle = gr; g.fillRect(0, 0, 256, 352); g.fillStyle = '#FFFFFF'; g.font = F(800, 46); g.textAlign = 'center'; g.fillText('น้ำใสเย็น', 128, 60); g.font = F(500, 22); g.fillText('ชื่นใจทุกคาบ', 128, 94); g.fillStyle = '#E9F6FF'; g.beginPath(); g.roundRect(98, 120, 60, 170, 18); g.fill(); g.fillStyle = '#F2A531'; g.fillRect(98, 170, 60, 50); g.fillStyle = '#FFE14D'; g.font = F(800, 40); g.fillText('10.-', 128, 330); g.fillStyle = 'rgba(255,255,255,.15)'; for (let k = 0; k < 14; k++) { g.beginPath(); g.arc(hash(k) * 256, hash(k * 3) * 352, 4 + hash(k * 5) * 10, 0, 7); g.fill(); } });
  const calendar = canvasTex(128, 176, (g) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 128, 176); g.fillStyle = '#C23B3B'; g.fillRect(0, 0, 128, 40); g.fillStyle = '#fff'; g.font = F(700, 22); g.textAlign = 'center'; g.fillText('พ.ย.', 64, 28); g.fillStyle = '#333'; g.font = F(500, 12); for (let d = 0; d < 30; d++) g.fillText(String(d + 1), 12 + (d % 7) * 17, 62 + Math.floor(d / 7) * 24); g.strokeStyle = '#C23B3B'; g.lineWidth = 2; g.beginPath(); g.arc(12 + 3 * 17, 58 + 24, 9, 0, 7); g.stroke(); });
  const bldg1 = sign(512, 128, '#1F3F8F', '#fff', 'อาคาร 1', 64, 'อาคารเรียนรวม');
  const banner = sign(1024, 160, '#F4C542', '#7A1E1E', 'ยินดีต้อนรับสู่ปีการศึกษาใหม่', 64);
  return {terrazzo, tread, concrete, breeze, notice, exit, floor2, floor1, r324, r326, canteen, stalls, menu, wash, gateSign, shutter, shop, corrugated, crate, asphalt, grass, kitchenWall, blockWall, tiles, bldg1, banner, stallSide, poster, calendar};
}, []);

// ---------------- pieces ----------------
/** a classroom door seen from the corridor: frame, leaf (optionally ajar), narrow glass with the dark room behind */
const CorrDoor: React.FC<{z: number; ajar?: number; y?: number}> = ({z, ajar = 0, y = 0}) => (
  <group position={[-4.2, y, z]}>
    <Box p={[-0.02, 2.14, 0]} s={[0.14, 0.08, 1.06]} c="#6B4E36" /><Box p={[-0.02, 1.05, -0.49]} s={[0.14, 2.1, 0.08]} c="#6B4E36" /><Box p={[-0.02, 1.05, 0.49]} s={[0.14, 2.1, 0.08]} c="#6B4E36" />
    <group position={[-0.03, 0, -0.45]} rotation={[0, ajar, 0]}><group position={[0, 0, 0.45]}>
      <Box p={[0, 1.05, -0.37]} s={[0.045, 2.1, 0.16]} c="#8A6444" rough={0.6} /><Box p={[0, 1.05, 0.15]} s={[0.045, 2.1, 0.6]} c="#8A6444" rough={0.6} />
      <Box p={[0, 0.57, -0.22]} s={[0.045, 1.14, 0.14]} c="#8A6444" rough={0.6} /><Box p={[0, 1.93, -0.22]} s={[0.045, 0.34, 0.14]} c="#8A6444" rough={0.6} />
      <mesh position={[0, 1.45, -0.22]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.14, 0.62]} /><meshStandardMaterial color="#1A1E26" roughness={0.1} metalness={0.4} /></mesh>
      <Box p={[-0.05, 1.02, 0.36]} s={[0.05, 0.03, 0.12]} c="#C8CCD2" metal={0.8} rough={0.25} />
    </group></group>
  </group>
);
/** the corridor face of a classroom: dado + plaster, door(s), high louvre windows, a shoe rack, a sign */
const RoomFace: React.FC<{z0: number; z1: number; doors: number[]; y?: number; tex: any; signT?: THREE.Texture; ajar?: Record<number, number>}> = ({z0, z1, doors, y = 0, tex, signT, ajar = {}}) => {
  const len = z1 - z0, zc = (z0 + z1) / 2;
  const gaps = doors.map((d) => [d - 0.5, d + 0.5]).sort((a, b) => a[0] - b[0]);
  const pieces: [number, number][] = []; let a = z0; gaps.forEach(([g0, g1]) => { pieces.push([a, g0]); a = g1; }); pieces.push([a, z1]);
  return (
    <group position={[0, y, 0]}>
      {pieces.map(([p0, p1], i) => p1 - p0 > 0.01 && <group key={i}>
        <Box p={[-4.2, 0.6, (p0 + p1) / 2]} s={[0.2, 1.2, p1 - p0]} c="#E9D9A6" />
        <Box p={[-4.2, 1.2 + (2.1 - 1.2) / 2, (p0 + p1) / 2]} s={[0.2, 0.9, p1 - p0]} c="#F2EEE4" />
        <Box p={[-4.31, 1.22, (p0 + p1) / 2]} s={[0.02, 0.04, p1 - p0]} c="#B5A36F" />
      </group>)}
      <Box p={[-4.2, 2.55, zc]} s={[0.2, 0.9, len]} c="#F2EEE4" />
      {/* high louvre windows over the dado (glass, dark room behind) */}
      {Array.from({length: Math.floor(len / 2.2)}, (_, i) => z0 + 1.1 + i * 2.2).filter((z) => doors.every((d) => Math.abs(z - d) > 1.2)).map((z) => <group key={z}>
        <mesh position={[-4.31, 1.68, z]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[1.5, 0.66]} /><meshStandardMaterial color="#20252E" roughness={0.15} metalness={0.5} /></mesh>
        {Array.from({length: 4}, (_, r) => <Box key={r} p={[-4.33, 1.42 + r * 0.17, z]} s={[0.02, 0.025, 1.5]} c="#9AA3AE" metal={0.4} rough={0.4} shadow={false} />)}
      </group>)}
      {doors.map((d) => <CorrDoor key={d} z={d} ajar={ajar[d] ?? 0} />)}
      {signT && <Plane p={[-4.33, 2.4, doors[0] + 0.95]} s={[0.6, 0.19]} r={[0, -Math.PI / 2, 0]} map={signT} basic />}
      {/* shoe rack by the first door */}
      <group position={[-4.48, 0, doors[0] + 1.05]}>
        <Box p={[0, 0.35, 0]} s={[0.3, 0.04, 0.9]} c="#7E8792" metal={0.4} /><Box p={[0, 0.05, 0]} s={[0.3, 0.04, 0.9]} c="#7E8792" metal={0.4} />
        {[-0.38, 0.38].map((k) => <Box key={k} p={[0, 0.2, k]} s={[0.3, 0.4, 0.03]} c="#7E8792" metal={0.4} />)}
        {Array.from({length: 5}, (_, i) => <Box key={i} p={[0.02, 0.42, -0.32 + i * 0.16]} s={[0.24, 0.08, 0.1]} c={['#F2F2EE', '#1E1F22', '#8C3E2C', '#F2F2EE', '#24304D'][i]} rough={0.6} />)}
      </group>
    </group>
  );
};
/** parapet + column + beam line along the open side of a corridor floor */
const Parapet: React.FC<{y: number; z0: number; z1: number; cols: number[]}> = ({y, z0, z1, cols}) => {
  const len = z1 - z0, zc = (z0 + z1) / 2;
  return (
    <group>
      <Box p={[-6.52, y + 0.5, zc]} s={[0.16, 1.0, len]} c="#F2EBDC" />
      <Box p={[-6.52, y + 1.06, zc]} s={[0.22, 0.06, len]} c="#3F6E8C" rough={0.45} metal={0.3} />
      <Box p={[-6.62, y - 0.12, zc]} s={[0.04, 0.24, len]} c="#D0643A" />
      {cols.map((z) => <Box key={z} p={[-6.45, y + 1.8, z]} s={[0.34, 3.6, 0.34]} c="#ECE3CF" />)}
      <Box p={[-6.45, y + 3.0 + 0.15, zc]} s={[0.34, 0.3, len]} c="#E6DCC6" />
      {/* potted plants on the parapet, here and there */}
      {cols.slice(0, -1).map((z, i) => hash(i * 3.7 + y) > 0.45 && <group key={'p' + z} position={[-6.52, y + 1.1, z + 1.6]}><Cyl p={[0, 0.12, 0]} r0={0.1} r1={0.13} h={0.24} c="#A9583C" /><mesh position={[0, 0.34, 0]} material={mat(['#4E8C45', '#3E7A38'][i % 2], 0.9, 0, true)} scale={[0.22, 0.2, 0.22]} castShadow><icosahedronGeometry args={[1, 1]} /></mesh></group>)}
    </group>
  );
};
/** a flight of stairs from (x0, y0) to (x1, y1) across z ∈ [za, zb]; nosing strips; solid underside */
const Flight: React.FC<{x0: number; x1: number; y0: number; y1: number; za: number; zb: number; tex: any; n?: number}> = ({x0, x1, y0, y1, za, zb, tex, n = 12}) => {
  const run = (x1 - x0) / n, rise = (y1 - y0) / n, w = zb - za, zc = (za + zb) / 2;
  const len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
  return (
    <group>
      {Array.from({length: n}, (_, i) => { const x = x0 + run * (i + 0.5), top = y0 + rise * (i + 1) - (rise < 0 ? 0 : 0); const yt = rise < 0 ? y0 + rise * (i + 1) : y0 + rise * (i + 1);
        return <group key={i}>
          <mesh position={[x, yt - 0.075, zc]} castShadow receiveShadow><boxGeometry args={[Math.abs(run) + 0.005, 0.15, w]} /><meshStandardMaterial map={tex.tread} roughness={0.55} /></mesh>
          <Box p={[x - Math.sign(run) * (Math.abs(run) / 2 - 0.015), yt + 0.003, zc]} s={[0.03, 0.008, w]} c="#3E3A35" rough={0.4} shadow={false} />
          {top !== undefined && null}
        </group>; })}
      {/* the sloped slab under the steps */}
      <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2 - 0.32, zc]} rotation={[0, 0, ang]} material={mat('#D9D2C2')} castShadow receiveShadow><boxGeometry args={[len, 0.2, w]} /></mesh>
    </group>
  );
};
const Rail: React.FC<{a: V3; b: V3; posts?: number}> = ({a, b, posts = 4}) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize());
  return (
    <group>
      <mesh position={mid} quaternion={q} material={mat('#3F6E8C', 0.35, 0.5)} castShadow><cylinderGeometry args={[0.022, 0.022, len, 8]} /></mesh>
      {Array.from({length: posts}, (_, i) => { const u = (i + 0.5) / posts; return <Box key={i} p={[a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - 0.45, a[2] + (b[2] - a[2]) * u]} s={[0.025, 0.9, 0.025]} c="#3F6E8C" metal={0.5} rough={0.4} />; })}
    </group>
  );
};

/** stair hall: U-stair, 2F landing → flight A (+x, z ∈ [−7.5, −5.1]) → mid landing (breeze blocks) → flight B (−x, z ∈ [−9.9, −7.7]) → ground */
const StairHall: React.FC<{tex: any; t: number}> = ({tex, t}) => (
  <group>
    {/* 2F landing (y 0) and the upper flights' soffits */}
    <mesh position={[-2.6, -0.1, -7.5]} receiveShadow castShadow><boxGeometry args={[3.2, 0.2, 5.0]} /><meshStandardMaterial map={tex.terrazzo} roughness={0.5} /></mesh>
    <Flight x0={-1.0} x1={2.36} y0={0} y1={-1.8} za={-7.5} zb={-5.1} tex={tex} />
    <Box p={[3.23, -1.9, -7.5]} s={[1.74, 0.2, 4.8]} c="#BDB6A8" rough={0.5} />
    <Flight x0={2.36} x1={-1.0} y0={-1.8} y1={-3.6} za={-9.9} zb={-7.7} tex={tex} />
    <mesh position={[-2.6, G + 0.004, -8.8]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.2, 2.2]} /><meshStandardMaterial map={tex.terrazzo} roughness={0.5} polygonOffset polygonOffsetFactor={-2} /></mesh>
    {/* flight C going up from 2F (over flight B), mid landing above, flight D back over flight A: their undersides */}
    <Flight x0={-1.0} x1={2.36} y0={0} y1={1.8} za={-9.9} zb={-7.7} tex={tex} />
    <Box p={[3.23, 1.7, -7.5]} s={[1.74, 0.2, 4.8]} c="#BDB6A8" rough={0.5} />
    <Flight x0={2.36} x1={-1.0} y0={1.8} y1={3.6} za={-7.5} zb={-5.1} tex={tex} />
    {/* central partition (low wall) + handrails */}
    <mesh position={[0.68, -1.25, -7.6]} rotation={[0, 0, Math.atan2(-1.8, 3.36)]} material={mat('#E9E1CF')} castShadow receiveShadow><boxGeometry args={[3.9, 0.95, 0.16]} /></mesh>
    <Box p={[0.68, -2.55, -7.6]} s={[3.6, 2.2, 0.16]} c="#E9E1CF" />
    <Rail a={[-1.0, 0.9, -7.42]} b={[2.36, -0.9, -7.42]} /><Rail a={[2.36, -0.9, -7.78]} b={[-1.0, -2.7, -7.78]} />
    <Rail a={[-1.0, 0.9, -5.18]} b={[2.36, -0.9, -5.18]} /><Rail a={[2.36, -0.9, -9.82]} b={[-1.0, -2.7, -9.82]} />
    <Rail a={[-1.0, 0.9, -7.78]} b={[2.36, 2.7, -7.78]} />
    {/* walls: front façade with the breeze-block panels, the wall to 324, the wall to 325 is the classroom's */}
    <Box p={[4.2, G + 1.0, -7.5]} s={[0.2, 2.0, 5.0]} c="#EDE4D0" />
    {[-1.8, 1.8].map((y) => <group key={y}>
      <Box p={[4.2, y - 0.0, -7.5]} s={[0.2, 0.3, 5.0]} c="#EDE4D0" />
      <mesh position={[4.2, y + 1.35, -7.5]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow><planeGeometry args={[4.6, 2.3]} /><meshStandardMaterial map={tex.breeze} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.95} /></mesh>
      <Box p={[4.2, y + 2.6, -7.5]} s={[0.2, 0.4, 5.0]} c="#EDE4D0" />
      {[-9.95, -5.05].map((z) => <Box key={z} p={[4.2, y + 1.35, z]} s={[0.2, 2.6, 0.12]} c="#EDE4D0" />)}
    </group>)}
    <Box p={[4.2, 5.2, -7.5]} s={[0.2, 2.0, 5.0]} c="#EDE4D0" />
    <Box p={[4.2, 1.32, -7.5]} s={[0.2, 0.7, 5.0]} c="#EDE4D0" />
    <Box p={[0, G - 0.05, -7.5]} s={[8.4, 0.1, 5.0]} c="#BDB6A8" />
    <Box p={[0, 0, -10.05]} s={[8.6, 7.4, 0.12]} c="#EFE8D8" />
    <Box p={[0, G + 1.8, -5.05]} s={[8.4, 3.6, 0.1]} c="#EFE8D8" />
    {/* ceiling of the top floor */}
    <Box p={[0, 7.1, -7.5]} s={[8.4, 0.2, 5.1]} c="#F2F0EB" />
    {/* signs + notice board + fire extinguisher + a forgotten bag on the landing */}
    <Plane p={[-3.9, 2.15, -5.11]} s={[0.6, 0.3]} map={tex.floor2} basic />
    <Plane p={[-1.6, G + 2.1, -9.98]} s={[0.6, 0.3]} map={tex.floor1} basic />
    <Plane p={[-2.0, 2.55, -9.98]} s={[0.66, 0.25]} map={tex.exit} basic c="#E8FFF0" />
    <Plane p={[-2.9, 1.5, -9.98]} s={[1.3, 0.82]} map={tex.notice} />
    <group position={[-3.95, 0, -9.85]}><Cyl p={[0, 0.42, 0]} r0={0.085} h={0.6} c="#C8232C" rough={0.4} /><Cyl p={[0, 0.78, 0]} r0={0.03} h={0.12} c="#222" /><Box p={[0, 0.06, 0]} s={[0.24, 0.12, 0.24]} c="#555" /></group>
    <group position={[3.0, -1.8, -9.3]} rotation={[0, 0.6, 0]}><Box p={[0, 0.16, 0]} s={[0.32, 0.32, 0.16]} c="#2C3550" rough={0.85} /><Box p={[0, 0.1, 0.09]} s={[0.24, 0.16, 0.03]} c="#3A4566" rough={0.85} /></group>
    {/* stair lights (off) */}
    {[[-2.6, 2.95, -7.5], [3.0, 1.45, -7.5], [-2.6, -0.75, -8.8]].map((p, i) => <Box key={i} p={p as V3} s={[0.5, 0.06, 0.12]} c="#E9E9E6" rough={0.5} shadow={false} />)}
  </group>
);

/** corridor floor + ceiling + parapet for one storey */
const Storey: React.FC<{y: number; tex: any; ceil?: boolean}> = ({y, tex, ceil = true}) => (
  <group>
    <mesh position={[-5.4, y - 0.1, -3.0]} receiveShadow><boxGeometry args={[2.4, 0.2, 38]} /><meshStandardMaterial map={tex.terrazzo} roughness={0.45} /></mesh>
    {ceil && <Box p={[-5.4, y + 3.22, -3.0]} s={[2.4, 0.44, 38]} c="#EFECE4" rough={0.95} />}
    {ceil && [-17.8, -13.0, -7.6, -2.0, 3.4, 8.8, 13.6].map((z) => <Box key={z} p={[-5.3, y + 2.97, z]} s={[0.12, 0.05, 1.22]} c="#E9E9E6" rough={0.5} shadow={false} />)}
  </group>
);

// ---------------- behind the building ----------------
const Table: React.FC<{x: number; z: number; tex: any; stuff?: number}> = ({x, z, stuff = 0}) => (
  <group position={[x, G, z]}>
    <Box p={[0, 0.75, 0]} s={[2.4, 0.04, 0.74]} c="#C9CED3" metal={0.7} rough={0.3} />
    {[-1, 1].map((k) => <group key={k}><Box p={[k * 1.0, 0.37, 0]} s={[0.05, 0.74, 0.6]} c="#8E949C" metal={0.6} rough={0.4} />
      <Box p={[0, 0.44, k * 0.58]} s={[2.3, 0.04, 0.26]} c="#C9CED3" metal={0.7} rough={0.3} /><Box p={[-0.9, 0.22, k * 0.58]} s={[0.04, 0.44, 0.04]} c="#8E949C" metal={0.6} /><Box p={[0.9, 0.22, k * 0.58]} s={[0.04, 0.44, 0.04]} c="#8E949C" metal={0.6} /></group>)}
    {stuff > 0.5 && <group position={[-0.5 + stuff * 0.6, 0.78, 0.1]}><Box s={[0.36, 0.02, 0.26]} c="#9AA6B4" metal={0.5} rough={0.35} /><Cyl p={[0.24, 0.06, -0.15]} r0={0.035} h={0.12} c="#E25555" rough={0.3} /></group>}
  </group>
);
const Stall: React.FC<{z: number; i: number; tex: any; t: number}> = ({z, i, tex, t}) => (
  <group position={[-14.85, G, z]}>
    {/* counter (glass display front), kitchen back wall, side panels, sign board */}
    <Box p={[0.62, 0.45, 0]} s={[0.1, 0.9, 1.9]} c="#C9CED3" metal={0.6} rough={0.35} />
    <Box p={[0.38, 0.92, 0]} s={[0.6, 0.06, 1.95]} c="#B9BEC4" metal={0.6} rough={0.3} />
    <mesh position={[0.66, 1.12, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.8, 0.36]} /><meshStandardMaterial color="#CFE3EE" transparent opacity={0.3} roughness={0.05} /></mesh>
    <Box p={[-0.6, 1.4, 0]} s={[0.1, 2.8, 2.0]} c={['#E7D7B4', '#E3D2C8', '#D8E2CF', '#D6DFEA'][i]} />
    {[-1, 1].map((k) => <mesh key={k} position={[0, 1.2, k * 1.0]} castShadow receiveShadow><boxGeometry args={[1.3, 2.4, 0.06]} /><meshStandardMaterial map={tex.stallSide} roughness={0.7} /></mesh>)}
    {/* the end stalls' outer sides face the aisle: a drinks poster, a price board, a shelf of bottles, crates of empties */}
    {(i === 3 || i === 0) && (() => { const k = i === 3 ? 1 : -1, zf = k * 1.04; return <group>
      <Plane p={[0.05, 1.55, zf]} s={[0.78, 1.05]} r={[0, k > 0 ? 0 : Math.PI, 0]} map={tex.poster} />
      <Plane p={[-0.45, 2.05, zf]} s={[0.3, 0.42]} r={[0, k > 0 ? 0 : Math.PI, 0]} map={tex.calendar} />
      <Box p={[0.05, 0.95, k * 1.14]} s={[1.0, 0.03, 0.2]} c="#8A6444" />
      {Array.from({length: 7}, (_, b) => <Cyl key={b} p={[-0.38 + b * 0.13, 1.06, k * 1.14]} r0={0.035} h={0.2} c={['#B3262E', '#F2A531', '#3BA55C', '#E9E2D0'][b % 4]} rough={0.3} />)}
      {[0, 1, 2].map((c) => <mesh key={c} position={[0.3 - (c % 2) * 0.45, 0.16 + (c === 2 ? 0.32 : 0), k * 1.3]} castShadow><boxGeometry args={[0.44, 0.3, 0.32]} /><meshStandardMaterial map={tex.crate} color={c === 1 ? '#E8B53A' : '#fff'} roughness={0.6} /></mesh>)}
      <mesh position={[0.5, 1.75, k * 1.06]} rotation={[0, 0, 0.1]} material={mat('#F2F2EE', 0.9)}><boxGeometry args={[0.2, 0.3, 0.02]} /></mesh>
    </group>; })()}
    <Plane p={[0.68, 2.55, 0]} s={[1.9, 0.48]} r={[0, Math.PI / 2, 0]} map={tex.stalls[i]} />
    <Plane p={[-0.54, 1.9, 0.4]} s={[0.5, 0.38]} r={[0, Math.PI / 2, 0]} map={tex.menu} />
    {/* the big pot still on the burner (stall 0 and 1), a fridge with drinks (stall 3) */}
    {i < 2 && <group position={[-0.15, 0.95, -0.4]}><Cyl p={[0, 0.2, 0]} r0={0.24} r1={0.26} h={0.4} c="#B9BEC4" metal={0.7} rough={0.3} /><Cyl p={[0, 0.42, 0]} r0={0.27} h={0.03} c="#9EA4AA" metal={0.7} />
      <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[0.14, 0.1, 0.05, 12]} /><meshBasicMaterial color="#4A7BFF" transparent opacity={0.55 + 0.25 * Math.sin(t * 23 + i)} toneMapped={false} /></mesh></group>}
    {i === 3 && <group position={[-0.25, 0, 0.45]}><Box p={[0, 0.9, 0]} s={[0.6, 1.8, 0.6]} c="#D7262E" rough={0.4} /><mesh position={[0.31, 1.0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.48, 1.3]} /><meshBasicMaterial color="#DDEBFF" toneMapped={false} transparent opacity={0.85} /></mesh>
      {Array.from({length: 12}, (_, k) => <Cyl key={k} p={[0.2, 0.55 + Math.floor(k / 4) * 0.35, -0.18 + (k % 4) * 0.12]} r0={0.03} h={0.2} c={['#3BA55C', '#F2A531', '#E44040', '#3B7DD8'][k % 4]} rough={0.3} />)}</group>}
    {/* trays stacked, a ladle, a basket */}
    <group position={[0.35, 0.96, 0.62]}>{Array.from({length: 5}, (_, k) => <Box key={k} p={[0, k * 0.015, 0]} s={[0.34, 0.012, 0.26]} c="#9AA6B4" metal={0.5} rough={0.35} shadow={false} />)}</group>
  </group>
);
/** wrought-iron fence along x = −18.6 with the sliding back gate (chained) */
const Fence: React.FC<{t: number; chainK: number; open?: number; noChain?: boolean}> = ({t, chainK, open = 0, noChain = false}) => {
  const bars = useMemo(() => { const out: number[] = []; for (let z = -14; z <= 6; z += 0.14) if (z < -4.6 || z > -1.45) out.push(z); return out; }, []);
  const gate = useMemo(() => { const out: number[] = []; for (let z = -4.4; z <= -1.8; z += 0.14) out.push(z); return out; }, []);
  const rattle = chainK > 0 && chainK < 1 ? Math.sin(t * 38) * 0.012 : 0;
  return (
    <group>
      <Box p={[-18.6, G + 0.15, -4]} s={[0.24, 0.3, 20]} c="#B9B3A6" />
      {[-14, -9, -4.6, -1.45, 2, 6].map((z) => <Box key={z} p={[-18.6, G + 1.0, z]} s={[0.24, 2.0, 0.24]} c="#D9D2C2" />)}
      {bars.map((z) => <group key={z}><Box p={[-18.6, G + 1.0, z]} s={[0.025, 1.7, 0.025]} c="#2B2E33" metal={0.4} rough={0.5} /><mesh position={[-18.6, G + 1.9, z]} material={mat('#2B2E33', 0.5, 0.4)}><coneGeometry args={[0.03, 0.1, 4]} /></mesh></group>)}
      {[0.45, 1.62].map((y) => <Box key={y} p={[-18.6, G + y, -9.3]} s={[0.04, 0.04, 9.4]} c="#2B2E33" metal={0.4} />)}
      {[0.45, 1.62].map((y) => <Box key={'r' + y} p={[-18.6, G + y, 2.3]} s={[0.04, 0.04, 7.4]} c="#2B2E33" metal={0.4} />)}
      {/* the gate leaf (on its rail), a little rattle when Phum pulls the chain */}
      <group position={[-18.68 + rattle, 0, -2.75 * open]}>
        <Box p={[0, G + 0.08, -3.1]} s={[0.05, 0.05, 3.4]} c="#6E6E6E" metal={0.5} />
        {gate.map((z) => <Box key={z} p={[0, G + 1.0, z]} s={[0.028, 1.75, 0.028]} c="#30343A" metal={0.4} rough={0.5} />)}
        {[0.25, 1.0, 1.82].map((y) => <Box key={y} p={[0, G + y, -3.1]} s={[0.05, 0.05, 2.7]} c="#30343A" metal={0.4} />)}
        <Box p={[0, G + 1.0, -1.78]} s={[0.07, 1.9, 0.07]} c="#30343A" metal={0.4} />
        {[-4.2, -2.0].map((z) => <Cyl key={z} p={[0, G + 0.08, z]} r0={0.06} h={0.04} c="#555" rot={[0, 0, Math.PI / 2]} />)}
      </group>
      {/* chain wrapped round the leaf post and the fixed post, padlock hanging */}
      {!noChain && <group position={[-18.6, G + 1.0, -1.62]}>
        {Array.from({length: 14}, (_, i) => { const a = (i / 14) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.09 + rattle * 2, Math.sin(i * 1.7) * 0.03 + (i % 2) * 0.01, Math.sin(a) * 0.12]} rotation={[a, i % 2 ? Math.PI / 2 : 0, 0]} material={mat('#8E9298', 0.35, 0.8)}><torusGeometry args={[0.016, 0.005, 5, 8]} /></mesh>; })}
        <group position={[0.1, -0.13 + rattle, 0]} rotation={[0, 0, Math.sin(t * 9) * 0.3 * (chainK > 0 && chainK < 1 ? 1 : 0.1)]}><Box p={[0, -0.04, 0]} s={[0.03, 0.06, 0.05]} c="#C9A23A" metal={0.8} rough={0.3} /><mesh position={[0, 0.0, 0]} rotation={[0, Math.PI / 2, 0]} material={mat('#B9BEC4', 0.3, 0.9)}><torusGeometry args={[0.018, 0.004, 5, 8, Math.PI]} /></mesh></group>
      </group>}
    </group>
  );
};
export const Shophouse: React.FC<{z: number; i: number; tex: any; t: number; door?: number; hasDoor?: boolean}> = ({z, i, tex, t, door = 0, hasDoor = i === 2}) => (
  <group position={[-25.6, G, z]}>
    <Box p={[-2.5, 3.2, 0]} s={[5, 6.4, 3.95]} c={['#E8DCC2', '#D9E0E4', '#EAD7C8', '#DFE6D4', '#E6E0D0'][i % 5]} />
    <Box p={[0.1, 3.3, 0]} s={[0.2, 0.18, 4.0]} c="#7B5B40" />
    {/* ground floor: roll shutter half down or an open door */}
    <mesh position={[0.02, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3.2, 3.0]} /><meshStandardMaterial color="#2A2621" roughness={0.9} /></mesh>
    <mesh position={[0.04, 3.0 - (i % 2 ? 0.7 : 1.9), 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3.2, i % 2 ? 1.4 : 3.8]} /><meshStandardMaterial map={tex.shutter} roughness={0.6} metalness={0.4} /></mesh>
    {hasDoor && <group position={[0.03, 0, 1.0]} rotation={[0, door * 1.4, 0]}><Box p={[0, 1.05, -0.45]} s={[0.05, 2.1, 0.9]} c="#7A5236" /></group>}
    <Plane p={[0.22, 3.75, 0]} s={[3.2, 0.55]} r={[0, Math.PI / 2, 0]} map={tex.shop[i % 4]} />
    {/* upper floor: windows, a balcony with plants, laundry on a line moving in the breeze */}
    {[-1, 1].map((k) => <mesh key={k} position={[0.02, 4.9, k * 0.95]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.2, 1.1]} /><meshStandardMaterial color="#3A4652" roughness={0.2} metalness={0.3} /></mesh>)}
    <Box p={[0.45, 4.15, 0]} s={[0.9, 0.08, 3.8]} c="#CFC6B4" /><Box p={[0.86, 4.45, 0]} s={[0.04, 0.55, 3.8]} c="#5A4B3D" />
    {Array.from({length: 4}, (_, k) => <mesh key={k} position={[0.7, 4.75 - 0.18, -1.3 + k * 0.8]} rotation={[0, Math.PI / 2, Math.sin(t * 1.7 + k + i) * 0.06]} material={mat(['#D8423C', '#F2F2EE', '#3E6FB0', '#E9C14A'][(k + i) % 4], 0.9)}><planeGeometry args={[0.5, 0.42]} /></mesh>)}
    <mesh position={[0.55, 6.5, 0]} rotation={[0, 0, 0.18]} material={mat('#8C4A33', 0.8, 0, true)}><boxGeometry args={[1.6, 0.08, 4.1]} /></mesh>
    {/* pots at the shopfront */}
    {hash(i * 2.3) > 0.4 && <group position={[0.6, 0, 1.6]}><Cyl p={[0, 0.2, 0]} r0={0.18} r1={0.22} h={0.4} c="#A9583C" /><mesh position={[0, 0.6, 0]} material={mat('#4E8C45', 0.9, 0, true)} scale={[0.32, 0.36, 0.32]}><icosahedronGeometry args={[1, 1]} /></mesh></group>}
  </group>
);
/** the tropical almond tree in the back yard: tiered flat layers */
const Almond: React.FC<{p: V3; t: number}> = ({p, t}) => {
  const sway = Math.sin(t * 0.6 + 1) * 0.02 + Math.sin(t * 1.9) * 0.008;
  return (
    <group position={p}>
      <Cyl p={[0, 2.2, 0]} r0={0.24} r1={0.16} h={4.4} c="#5B4634" rough={0.9} />
      {[2.6, 3.6, 4.6].map((y, k) => <group key={y} rotation={[sway * (k + 1), k * 0.9, sway * (k + 1)]}>
        {Array.from({length: 5}, (_, i) => { const a = i * 1.257 + k; return <mesh key={i} position={[Math.cos(a) * (1.6 - k * 0.35), y, Math.sin(a) * (1.6 - k * 0.35)]} scale={[1.3 - k * 0.2, 0.32, 1.3 - k * 0.2]} material={mat(['#3F7A38', '#4E8C45', '#5E9A4A'][(i + k) % 3], 0.95, 0, true)} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>; })}
        <Cyl p={[0, y - 0.1, 0]} r0={0.06} h={0.3} c="#5B4634" />
      </group>)}
    </group>
  );
};
/** a stray dog: lies in the alley, gets up and barks at the chain, trots off */
const Dog: React.FC<{t: number; chain: number}> = ({t, chain}) => {
  const up = smooth((t - chain - 0.25) / 0.4), run = Math.max(0, t - chain - 2.2);
  const x = -21.6 - Math.min(run * 1.6, 9), z = -6.5 + Math.min(run * 1.6, 9) * 0.25;
  const bark = t > chain + 0.5 && t < chain + 2.2 ? Math.max(0, Math.sin((t - chain) * 14)) : 0;
  const leg = run > 0 && run < 5.6 ? Math.sin(t * 16) * 0.5 : 0;
  return (
    <group position={[x, G, z]} rotation={[0, run > 0 ? -Math.PI / 2 - 0.25 : 0.9, 0]}>
      <group position={[0, 0.1 + up * 0.22, 0]}>
        <mesh material={mat('#B9925E', 0.9, 0, true)} position={[0, 0.2, 0]} scale={[0.18, 0.17, 0.42]} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>
        <group position={[0, 0.3 + up * 0.05, 0.42]} rotation={[-0.2 - bark * 0.3, 0, 0]}><mesh material={mat('#B9925E', 0.9, 0, true)} scale={[0.12, 0.12, 0.15]} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>
          <mesh material={mat('#3A2A20', 0.9)} position={[0, -0.03, 0.15]} scale={[0.05, 0.04, 0.06]}><sphereGeometry args={[1, 6, 4]} /></mesh>
          {[-1, 1].map((k) => <mesh key={k} material={mat('#8C6B45', 0.9, 0, true)} position={[k * 0.07, 0.11, -0.02]} rotation={[0, 0, k * 0.4]} scale={[0.035, 0.07, 0.02]}><coneGeometry args={[1, 1, 4]} /></mesh>)}
        </group>
        {[[-0.1, 0.25], [0.1, 0.25], [-0.1, -0.28], [0.1, -0.28]].map(([a, b], k) => <mesh key={k} material={mat('#A9844F', 0.9)} position={[a, 0.05 - up * 0.1, b]} rotation={[(k % 2 ? leg : -leg) * up, 0, 0]} scale={[0.035, 0.12 + up * 0.1, 0.035]}><cylinderGeometry args={[1, 1, 1, 5]} /></mesh>)}
        <mesh material={mat('#B9925E', 0.9)} position={[0, 0.32, -0.42]} rotation={[-0.8 + Math.sin(t * 12) * 0.3 * up, 0, 0]} scale={[0.025, 0.18, 0.025]}><cylinderGeometry args={[1, 0.6, 1, 5]} /></mesh>
      </group>
    </group>
  );
};
/** the canteen cat on a table: bolts when the line comes past */
const Cat: React.FC<{t: number; go: number}> = ({t, go}) => {
  const k = Math.max(0, t - go), x = -11.0 + Math.min(k * 3.0, 6), z = -6.9 - Math.min(k * 3.0, 6) * 0.5, onTable = k <= 0;
  const leg = k > 0 && k < 2 ? Math.sin(t * 22) * 0.6 : 0;
  return (
    <group position={[x, G + (onTable ? 0.78 : 0) + (k > 0 && k < 0.25 ? -k * 3 : 0), z]} rotation={[0, onTable ? 2.2 : 2.03, 0]}>
      <mesh material={mat('#E7A65A', 0.9, 0, true)} position={[0, 0.13, 0]} scale={[0.09, 0.09, 0.2]} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>
      <mesh material={mat('#E7A65A', 0.9, 0, true)} position={[0, 0.24, 0.17]} scale={[0.075, 0.07, 0.07]} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={mat('#D18E44', 0.9)} position={[s * 0.04, 0.31, 0.17]} scale={[0.02, 0.04, 0.015]}><coneGeometry args={[1, 1, 4]} /></mesh>)}
      {[[-0.05, 0.12], [0.05, 0.12], [-0.05, -0.12], [0.05, -0.12]].map(([a, b], i) => <mesh key={i} material={mat('#E7A65A', 0.9)} position={[a, 0.05, b]} rotation={[(i % 2 ? leg : -leg), 0, 0]} scale={[0.018, 0.1, 0.018]}><cylinderGeometry args={[1, 1, 1, 4]} /></mesh>)}
      <mesh material={mat('#D18E44', 0.9)} position={[0, 0.2, -0.24]} rotation={[-0.6 + Math.sin(t * 3) * 0.2, 0, 0]} scale={[0.015, 0.2, 0.015]}><cylinderGeometry args={[1, 1, 1, 4]} /></mesh>
    </group>
  );
};
/** birds in the almond tree, burst out when the chain rattles */
const Birds: React.FC<{t: number; go: number}> = ({t, go}) => (
  <group>{Array.from({length: 9}, (_, i) => {
    const k = Math.max(0, t - go - i * 0.06), a = i * 0.7;
    const p: V3 = k <= 0 ? [-17.2 + Math.cos(a) * 1.2, G + 3.3 + (i % 3) * 0.9, -8.0 + Math.sin(a) * 1.2] : [-17.2 + Math.cos(a) * 1.2 - k * (2 + i * 0.3), G + 3.3 + (i % 3) * 0.9 + k * (2.2 + hash(i) * 1.5), -8.0 + Math.sin(a) * 1.2 + k * (1 + hash(i * 3) * 2) * (i % 2 ? 1 : -1)];
    const flap = k > 0 ? Math.sin(t * 30 + i) * 0.8 : 0;
    return <group key={i} position={p} rotation={[0, k > 0 ? -1.2 + i * 0.2 : a, 0]}><mesh material={mat('#4A3F38', 0.9)} scale={[0.04, 0.035, 0.08]}><sphereGeometry args={[1, 6, 4]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} material={mat('#4A3F38', 0.9)} position={[s * 0.06, 0, 0]} rotation={[0, 0, s * flap]} scale={[0.07, 0.006, 0.035]}><boxGeometry args={[1, 1, 1]} /></mesh>)}</group>;
  })}</group>
);
const Wires: React.FC = () => {
  const lines = useMemo(() => [-14, -2, 10].flatMap((z0, i, arr) => i < arr.length - 1 ? [0, 1, 2].map((k) => ({a: [-22.6, G + 6.2 - k * 0.35, z0] as V3, b: [-22.6, G + 6.2 - k * 0.35, arr[i + 1]] as V3})) : []), []);
  return (
    <group>
      {[-14, -2, 10].map((z) => <group key={z}><Cyl p={[-22.6, G + 3.5, z]} r0={0.13} r1={0.1} h={7} c="#B9B3A6" /><Box p={[-22.6, G + 6.3, z]} s={[0.12, 0.12, 1.2]} c="#8C877E" /></group>)}
      {lines.map((l, i) => { const pts = Array.from({length: 13}, (_, k) => { const u = k / 12; return new THREE.Vector3(l.a[0], l.a[1] - Math.sin(u * Math.PI) * 0.4, l.a[2] + (l.b[2] - l.a[2]) * u); }); return <mesh key={i}><tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 24, 0.012, 4, false]} /><meshStandardMaterial color="#1E1E20" roughness={0.6} /></mesh>; })}
    </group>
  );
};

export type SetState = {t: number; chainK: number; chainT: number; catT: number; birdsT: number; neighDoor: number; daylight: number; door324: number; gateOpen?: number; noChain?: boolean; doorI?: number; spiritZ?: number};
export const Building: React.FC<{st: SetState}> = ({st}) => {
  const tex = useTex(); const {t} = st;
  const steam = useMemo(() => Array.from({length: 18}, (_, i) => ({ph: hash(i * 3.1), x: (hash(i) - 0.5) * 0.25, z: (hash(i * 2.7) - 0.5) * 0.25, s: 0.05 + hash(i * 5.3) * 0.06})), []);
  return (
    <group>
      {/* ---- building 3, 2nd floor corridor (y 0), ground corridor (y −3.6), 3rd floor (y 3.6) seen from outside ---- */}
      <Storey y={0} tex={tex} /><Storey y={G} tex={tex} /><Storey y={3.6} tex={tex} />
      <Parapet y={0} z0={-22} z1={16} cols={[-21.2, -15.6, -10.1, -5.0, 0.1, 5.2, 10.3, 15.4]} />
      <Parapet y={3.6} z0={-22} z1={16} cols={[-21.2, -15.6, -10.1, -5.0, 0.1, 5.2, 10.3, 15.4]} />
      {[-21.2, -15.6, -10.1, -5.0, 0.1, 5.2, 10.3, 15.4].map((z) => <Box key={z} p={[-6.45, G + 1.8, z]} s={[0.34, 3.6, 0.34]} c="#ECE3CF" />)}
      <Box p={[-6.62, G + 3.48, -3]} s={[0.04, 0.24, 38]} c="#D0643A" />
      {/* hip roof over the whole block */}
      <mesh position={[0, 7.2 + 1.6, -3]} scale={[7.6, 1.6, 20.5]} rotation={[0, Math.PI / 4, 0]} material={mat('#B5502F', 0.8, 0, true)} castShadow><cylinderGeometry args={[0, 1.414, 2, 4, 1]} /></mesh>
      <Box p={[-1.2, 7.3, -3]} s={[11, 0.25, 39]} c="#E2D8C2" />
      {/* room faces along the 2F corridor: 324 (beyond the stairs), 326 (behind us); the 3F + ground floors too */}
      <RoomFace z0={-22} z1={-10.1} doors={[-11.25, -18.6]} tex={tex} signT={tex.r324} ajar={{[-11.25]: st.door324}} />
      <RoomFace z0={5.0} z1={16} doors={[6.35, 13.6]} tex={tex} signT={tex.r326} />
      <RoomFace z0={-22} z1={-10.1} doors={[-11.25, -18.6]} y={3.6} tex={tex} /><RoomFace z0={-5.0} z1={16} doors={[-3.65, 6.35, 13.6]} y={3.6} tex={tex} />
      <RoomFace z0={-22} z1={-10.1} doors={[-11.25, -18.6]} y={G} tex={tex} /><RoomFace z0={-5.0} z1={16} doors={[-3.65, 6.35, 13.6]} y={G} tex={tex} />
      {/* outer walls of the block (back to the field side) + the 2F room wall around 325 are the classroom's own */}
      <Box p={[4.3, 1.8, -21]} s={[0.2, 10.8, 2]} c="#EDE4D0" />
      <Box p={[0, 1.8, -22.1]} s={[8.6, 10.8, 0.2]} c="#EDE4D0" /><Box p={[0, 1.8, 16.1]} s={[8.6, 10.8, 0.2]} c="#EDE4D0" />
      <Box p={[-5.4, 1.8, -22.15]} s={[2.6, 10.8, 0.1]} c="#E6DCC6" />
      {/* a water cooler + bin on the 2F corridor by the stairs; the classroom 325 notice board outside */}
      <group position={[-6.15, 0, -9.0]}><Box p={[0, 0.55, 0]} s={[0.45, 1.1, 0.4]} c="#D9DDE2" metal={0.4} rough={0.4} /><Box p={[0.05, 1.12, 0]} s={[0.36, 0.06, 0.3]} c="#9EA4AA" metal={0.6} /><Cyl p={[0.22, 0.95, 0.1]} r0={0.015} h={0.06} c="#B9BEC4" rot={[0, 0, Math.PI / 2]} /></group>
      <group position={[-6.15, 0, -1.6]}><Cyl p={[0, 0.33, 0]} r0={0.2} r1={0.22} h={0.66} c="#2F7D4A" rough={0.6} /></group>
      <Plane p={[-4.32, 1.5, 1.5]} s={[1.3, 0.82]} r={[0, -Math.PI / 2, 0]} map={tex.notice} />
      <Plane p={[-4.32, 2.55, -2.6]} s={[0.66, 0.25]} r={[0, -Math.PI / 2, 0]} map={tex.exit} basic c="#E8FFF0" />
      <StairHall tex={tex} t={t} />
      {/* ---- the back lot (ground y −3.6) ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12.6, G + 0.002, -4]} receiveShadow><planeGeometry args={[12, 40]} /><meshStandardMaterial map={tex.concrete} roughness={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-48, G - 0.04, 0]} receiveShadow><planeGeometry args={[104, 160]} /><meshStandardMaterial map={tex.grass} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-21.7, G + 0.004, -4]} receiveShadow><planeGeometry args={[5.8, 60]} /><meshStandardMaterial map={tex.asphalt} roughness={0.95} /></mesh>
      {/* covered walkway */}
      {[[-7.2, -9.9], [-7.2, -7.7], [-9.0, -9.9], [-9.0, -7.7]].map(([x, z], i) => <Cyl key={i} p={[x, G + 1.35, z]} r0={0.06} h={2.7} c="#4F6B87" metal={0.5} rough={0.4} />)}
      <mesh position={[-8.1, G + 2.75, -8.8]} rotation={[0, 0, 0.04]} castShadow receiveShadow><boxGeometry args={[2.4, 0.04, 2.6]} /><meshStandardMaterial map={tex.corrugated} roughness={0.5} metalness={0.4} /></mesh>
      {/* the canteen: open sides, steel columns, gable roof, fans on the columns */}
      <mesh position={[-12.25, G - 0.044, -7.5]} receiveShadow><boxGeometry args={[6.6, 0.1, 12]} /><meshStandardMaterial map={tex.terrazzo} roughness={0.5} /></mesh>
      {[-13.5, -9.4, -5.3, -1.5].flatMap((z) => [-15.4, -9.1].map((x) => <Box key={`${x}${z}`} p={[x, G + 2.2, z]} s={[0.2, 4.4, 0.2]} c="#4F6B87" metal={0.4} rough={0.45} />))}
      {[-1, 1].map((k) => <mesh key={k} position={[-12.25 + k * 1.7, G + 4.85, -7.5]} rotation={[0, 0, k * -0.22]} castShadow receiveShadow><boxGeometry args={[3.6, 0.05, 12.6]} /><meshStandardMaterial map={tex.corrugated} color="#D8DCE0" roughness={0.7} metalness={0.05} /></mesh>)}
      <CanteenRoofUnder />
      <Box p={[-12.25, G + 4.4, -7.5]} s={[6.6, 0.12, 0.12]} c="#4F6B87" metal={0.4} />
      <Plane p={[-9.0, G + 3.9, -7.5]} s={[3.4, 0.66]} r={[0, Math.PI / 2, 0]} map={tex.canteen} />
      {[-9.4, -5.3].map((z, i) => <group key={z} position={[-9.2, G + 3.3, z]} rotation={[0, Math.PI / 2, 0]}><Box s={[0.2, 0.2, 0.12]} c="#E9E9E6" /><group position={[0, 0, 0.14]} rotation={[0, 0, t * 14 + i]}>{[0, 1, 2].map((b) => <mesh key={b} rotation={[0, 0, b * 2.094]} position={[0, 0, 0]} material={mat('#3E7CC9', 0.4)}><boxGeometry args={[0.06, 0.38, 0.01]} /></mesh>)}</group></group>)}
      {[-12.3, -10.7, -7.0, -5.4, -3.8].map((z, i) => <Table key={z} x={-10.8} z={z} tex={tex} stuff={hash(i * 4.4)} />)}
      {[0, 1, 2, 3].map((i) => <Stall key={i} z={-12.3 + i * 2.05} i={i} tex={tex} t={t} />)}
      <KitchenBack tex={tex} t={t} />
      {/* hand-wash trough + sign by the walkway */}
      <group position={[-9.6, G, -13.1]}><Box p={[0, 0.75, 0]} s={[2.2, 0.12, 0.5]} c="#B9BEC4" metal={0.6} rough={0.3} /><Box p={[0, 0.4, 0]} s={[2.2, 0.7, 0.1]} c="#D9D2C2" />{[-0.7, 0, 0.7].map((x) => <Cyl key={x} p={[x, 0.95, -0.15]} r0={0.012} h={0.16} c="#C8CCD2" metal={0.8} />)}<Plane p={[0, 1.4, -0.26]} s={[0.6, 0.22]} map={tex.wash} basic /></group>
      {/* steam off the pots that were left on */}
      {steam.map((s, i) => { const k = ((t * 0.35 + s.ph) % 1); return <mesh key={i} position={[-14.99 + s.x + k * 0.1, G + 1.45 + k * 1.1, -12.7 + (i % 2) * 2.05 + s.z]} scale={s.s * (1 + k * 2.2)}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#F4F2EE" transparent opacity={0.22 * (1 - k)} depthWrite={false} /></mesh>; })}
      <Cat t={t} go={st.catT} />
      {/* back yard: almond tree, water crates, a bike, a drain */}
      <Almond p={[-17.2, G, -8.0]} t={t} />
      <Birds t={t} go={st.birdsT} />
      <group position={[-18.0, G, -6.0]}>{Array.from({length: 9}, (_, i) => <mesh key={i} position={[(i % 3) * 0.0 + (i % 2) * 0.02, 0.17 + Math.floor(i / 3) * 0.32, -0.45 + (i % 3) * 0.46]} castShadow><boxGeometry args={[0.44, 0.3, 0.44]} /><meshStandardMaterial map={tex.crate} roughness={0.6} /></mesh>)}</group>
      <group position={[-18.25, G, 1.8]} rotation={[0.25, 0, 0]}><mesh position={[0, 0.35, -0.5]} rotation={[0, Math.PI / 2, 0]} material={mat('#1E1F22', 0.5)}><torusGeometry args={[0.3, 0.025, 6, 16]} /></mesh><mesh position={[0, 0.35, 0.5]} rotation={[0, Math.PI / 2, 0]} material={mat('#1E1F22', 0.5)}><torusGeometry args={[0.3, 0.025, 6, 16]} /></mesh><Box p={[0, 0.6, 0]} s={[0.04, 0.04, 1.0]} c="#C23B3B" metal={0.4} /><Box p={[0, 0.8, 0.45]} s={[0.04, 0.4, 0.04]} c="#C23B3B" metal={0.4} /></group>
      <Box p={[-16.2, G + 0.01, -4]} s={[0.4, 0.04, 20]} c="#6E6A64" metal={0.3} rough={0.6} />
      <Fence t={t} chainK={st.chainK} open={st.gateOpen ?? 0} noChain={st.noChain} />
      {!st.noChain && <Plane p={[-18.48, G + 2.2, -3.1]} s={[0.9, 0.39]} r={[0, Math.PI / 2, 0]} map={tex.gateSign} />}
      {/* the alley beyond: shophouses, poles + wires, a scooter, the spirit house, the dog */}
      {[-16, -12, -8, -4, 0, 4, 8].map((z, i) => <Shophouse key={z} z={z} i={i} tex={tex} t={t} door={i === (st.doorI ?? 2) ? st.neighDoor : 0} hasDoor={i === (st.doorI ?? 2)} />)}
      <Wires />
      <group position={[-21.0, G, -0.6]} rotation={[0, 0.3, 0]}><Box p={[0, 0.42, 0]} s={[0.3, 0.3, 1.2]} c="#B8432F" rough={0.4} /><Cyl p={[0, 0.25, 0.55]} r0={0.22} h={0.08} c="#1E1F22" rot={[0, 0, Math.PI / 2]} /><Cyl p={[0, 0.25, -0.55]} r0={0.22} h={0.08} c="#1E1F22" rot={[0, 0, Math.PI / 2]} /><Box p={[0, 0.95, 0.5]} s={[0.6, 0.05, 0.05]} c="#2B2E33" metal={0.5} /><Box p={[0, 0.65, -0.25]} s={[0.28, 0.12, 0.5]} c="#1E1F22" /></group>
      <group position={[-24.4, G, st.spiritZ ?? 3.9]}><Box p={[0, 0.6, 0]} s={[0.12, 1.2, 0.12]} c="#C9A23A" /><Box p={[0, 1.35, 0]} s={[0.5, 0.4, 0.5]} c="#E8C35A" rough={0.4} /><mesh position={[0, 1.7, 0]} material={mat('#B5502F', 0.6, 0, true)}><coneGeometry args={[0.42, 0.35, 4]} /></mesh></group>
      <Dog t={t} chain={st.chainT} />
      {/* beyond: the school's other buildings, trees, the sky's clouds (lit, never black) */}
      <FarBlock tex={tex} t={t} />
      {/* the block at the other end of the yard, built the same way (never a plain box) */}
      <group position={[-12, 0, 0]} rotation={[0, Math.PI, 0]}><FarBlock tex={tex} t={t + 3.1} /></group>
      {[[-30, -20], [-32, 12], [-12, 22], [-28, -30], [-40, 0]].map(([x, z], i) => <group key={i} position={[x, G, z]}><Cyl p={[0, 2, 0]} r0={0.3} h={4} c="#5B4634" />{[0, 1, 2, 3].map((k) => <mesh key={k} position={[Math.cos(k * 1.6 + i) * 1.6, 5 + (k % 2) * 0.8, Math.sin(k * 1.6 + i) * 1.6]} scale={[2.2, 1.5, 2.2]} material={mat(['#3E7A38', '#4A8A40', '#356C31'][(k + i) % 3], 0.95, 0, true)} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>)}</group>)}
    </group>
  );
};

// ---------------- the front (field side): seen through the classroom windows and the breeze blocks ----------------
export const Front: React.FC<{t: number}> = ({t}) => {
  const lightK = (Math.sin(t * 11) > 0 ? 1 : 0.15);
  return (
    <group>
      {/* our own façade below the windows (not across the stair hall: its breeze blocks are open) */}
      <Box p={[4.36, (G - 0.05) / 2, 5]} s={[0.2, -G - 0.05, 20]} c="#EDE4D0" /><Box p={[4.36, (G - 0.05) / 2, -12.6]} s={[0.2, -G - 0.05, 5]} c="#EDE4D0" />
      <Box p={[4.75, 0.82, 0]} s={[0.9, 0.08, 30]} c="#E2D8C2" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[26, G, 0]} receiveShadow><planeGeometry args={[44, 70]} /><meshStandardMaterial color="#76A752" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[26, G + 0.04, 0]}><ringGeometry args={[11, 13, 48, 1]} /><meshStandardMaterial color="#B85A45" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[70, G - 0.02, 0]}><planeGeometry args={[120, 220]} /><meshStandardMaterial color="#8DA36E" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[51, G + 0.02, 0]}><planeGeometry args={[8, 220]} /><meshStandardMaterial color="#5A5D63" roughness={1} /></mesh>
      {/* the opposite block */}
      <Box p={[38, G + 7.2, -2]} s={[9, 14.4, 44]} c="#EFE6D2" />
      <mesh position={[38, G + 16, -2]} scale={[5.5, 1.6, 23]} rotation={[0, Math.PI / 4, 0]} material={mat('#B5502F', 0.8, 0, true)}><cylinderGeometry args={[0, 1.414, 2, 4, 1]} /></mesh>
      {[-14, -6, 4, 12].map((z, i) => <group key={z} position={[16 + (i % 2) * 6, G, z]}><Cyl p={[0, 2, 0]} r0={0.3} h={4} c="#5B4634" />{[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[Math.cos(k * 1.3 + i) * 2.2, 4.8 + (k % 2) * 0.9, Math.sin(k * 1.3 + i) * 2.2]} scale={[2.4, 1.5, 2.4]} material={mat(['#3E7A38', '#4A8A40', '#356C31'][(k + i) % 3], 0.95, 0, true)} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>)}</group>)}
      {/* the front road, closed: police pickups with their lights going, an officer at the gate */}
      {[-6, 2, 9].map((z, i) => <group key={z} position={[51, G, z]} rotation={[0, i * 0.3, 0]}>
        <Box p={[0, 0.7, 0]} s={[1.9, 0.8, 4.6]} c={i === 1 ? '#F2F2EE' : '#1F3F8F'} rough={0.4} /><Box p={[0, 1.35, 0.4]} s={[1.7, 0.6, 1.8]} c={i === 1 ? '#F2F2EE' : '#1F3F8F'} rough={0.4} />
        <Box p={[0, 1.72, 0.4]} s={[1.2, 0.14, 0.3]} c="#222" />
        <mesh position={[-0.35, 1.82, 0.4]}><boxGeometry args={[0.4, 0.12, 0.26]} /><meshBasicMaterial color="#FF2A2A" toneMapped={false} transparent opacity={lightK * (i % 2 ? 1 : 0.2)} /></mesh>
        <mesh position={[0.35, 1.82, 0.4]}><boxGeometry args={[0.4, 0.12, 0.26]} /><meshBasicMaterial color="#2A6BFF" toneMapped={false} transparent opacity={(1.15 - lightK) * (i % 2 ? 0.2 : 1)} /></mesh>
      </group>)}
      <group position={[46, G, -2]}><Box p={[0, 0.9, 0]} s={[0.4, 1.8, 0.3]} c="#7D6A45" /><mesh position={[0, 1.95, 0]} material={mat('#C99069')}><sphereGeometry args={[0.13, 8, 6]} /></mesh></group>
      {/* distant town */}
      {Array.from({length: 18}, (_, i) => <Box key={i} p={[78 + hash(i) * 40, G + 6 + hash(i * 5) * 10, -60 + i * 7]} s={[7 + hash(i * 3) * 8, 12 + hash(i * 5) * 20, 6]} c={['#D9D4C8', '#C8CED6', '#E3D7C1', '#BFC6CC'][i % 4]} />)}
    </group>
  );
};

/** the back of the canteen kitchen, seen from the back yard: plaster with grime, a tiled splash band, a louvre vent row,
 *  a back door ajar, drain pipe, gas bottles, a sink + hose, tray stacks, a broom, a bin, a wall fan, a clock */
const KitchenBack: React.FC<{tex: any; t: number}> = ({tex, t}) => {
  const X = -15.55, z0 = -13.4, z1 = -5.3, zc = (z0 + z1) / 2, L = z1 - z0;
  return (
    <group>
      <mesh position={[X, G + 1.4, zc]} castShadow receiveShadow><boxGeometry args={[0.12, 2.8, L]} /><meshStandardMaterial map={tex.kitchenWall} roughness={0.9} /></mesh>
      {/* tiled splash band behind the sink + vent row high up + a top beam */}
      <mesh position={[X - 0.065, G + 1.15, -8.2]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[2.4, 0.7]} /><meshStandardMaterial map={tex.tiles} roughness={0.35} /></mesh>
      {[-12.6, -11.3, -10.0, -6.6].map((z) => <group key={z} position={[X - 0.07, G + 2.35, z]}><Box s={[0.02, 0.42, 0.9]} c="#7F8A93" metal={0.3} rough={0.5} />{[0, 1, 2, 3].map((r) => <Box key={r} p={[-0.02, -0.15 + r * 0.1, 0]} s={[0.04, 0.025, 0.86]} c="#5E676F" shadow={false} />)}</group>)}
      <Box p={[X - 0.08, G + 2.82, zc]} s={[0.16, 0.08, L]} c="#4F6B87" metal={0.4} rough={0.45} />
      {/* back door, ajar, dark kitchen behind */}
      <mesh position={[X - 0.062, G + 1.0, -11.95]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.9, 2.0]} /><meshStandardMaterial color="#15181D" roughness={1} /></mesh>
      <group position={[X - 0.06, G, -12.4]} rotation={[0, -0.7, 0]}><Box p={[0, 1.0, 0.45]} s={[0.04, 2.0, 0.9]} c="#6E8C9C" metal={0.3} rough={0.5} /><Box p={[-0.04, 1.0, 0.82]} s={[0.04, 0.03, 0.1]} c="#C8CCD2" metal={0.8} /></group>
      {/* drain pipe + water pipes */}
      <Cyl p={[X - 0.12, G + 1.45, -9.9]} r0={0.05} h={2.9} c="#8E9AA4" />
      <Box p={[X - 0.1, G + 1.9, -8.2]} s={[0.04, 0.04, 2.6]} c="#3E7CC9" metal={0.2} rough={0.5} />
      {/* sink + tap + hose coil */}
      <group position={[X - 0.35, G, -8.2]}><Box p={[0, 0.82, 0]} s={[0.55, 0.12, 1.1]} c="#B9BEC4" metal={0.6} rough={0.3} />{[-0.4, 0.4].map((z) => <Box key={z} p={[0, 0.4, z]} s={[0.05, 0.8, 0.05]} c="#8E949A" metal={0.5} />)}<Cyl p={[0.18, 1.0, 0]} r0={0.015} h={0.2} c="#C8CCD2" metal={0.8} /></group>
      <mesh position={[X - 0.22, G + 0.55, -7.0]} rotation={[0, Math.PI / 2, 0]} material={mat('#2E8B57', 0.6)}><torusGeometry args={[0.2, 0.025, 6, 18]} /></mesh>
      {/* gas bottles (chained), tray stacks, a bin, a broom */}
      {[-10.6, -10.25].map((z, i) => <group key={z} position={[X - 0.3, G, z]}><Cyl p={[0, 0.42, 0]} r0={0.16} h={0.8} c={i ? '#3C6FB4' : '#C23B3B'} rough={0.45} metal={0.2} /><mesh position={[0, 0.86, 0]} material={mat(i ? '#3C6FB4' : '#C23B3B', 0.45)}><sphereGeometry args={[0.16, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh><Cyl p={[0, 1.0, 0]} r0={0.04} h={0.1} c="#C9A23A" metal={0.6} /></group>)}
      {[0, 1].map((k) => <group key={k} position={[X - 0.3, G, -6.3 + k * 0.5]}>{Array.from({length: 7 + k * 3}, (_, i) => <Box key={i} p={[0, 0.03 + i * 0.035, 0]} s={[0.36, 0.025, 0.46]} c={['#4E9A5B', '#C9A23A'][k]} rough={0.5} shadow={i === 0} />)}</group>)}
      <group position={[X - 0.4, G, -5.6]}><Cyl p={[0, 0.38, 0]} r0={0.22} r1={0.25} h={0.76} c="#2F5B9A" rough={0.5} /><Box p={[0, 0.78, 0]} s={[0.52, 0.04, 0.52]} c="#264B80" /></group>
      <group position={[X - 0.18, G, -9.3]} rotation={[0.18, 0, 0]}><Cyl p={[0, 0.85, 0]} r0={0.015} h={1.3} c="#B5813F" /><Box p={[0, 0.12, 0]} s={[0.06, 0.24, 0.3]} c="#6E5A3A" /></group>
      {/* a wall fan (turning) + a clock (stopped at the time the power went) + a faded notice */}
      <group position={[X - 0.18, G + 2.2, -7.2]} rotation={[0, -Math.PI / 2, 0]}><Box s={[0.18, 0.18, 0.1]} c="#E9E9E6" /><group position={[0, 0, 0.08]} rotation={[0, 0, t * 12]}>{[0, 1, 2].map((b) => <mesh key={b} rotation={[0, 0, b * 2.094]} material={mat('#9AC8E8', 0.4)}><boxGeometry args={[0.05, 0.3, 0.01]} /></mesh>)}</group></group>
      <group position={[X - 0.07, G + 2.1, -11.0]} rotation={[0, -Math.PI / 2, 0]}><mesh material={mat('#F4F1E8', 0.6)}><cylinderGeometry args={[0.15, 0.15, 0.03, 20]} /></mesh></group>
      <Plane p={[X - 0.067, G + 1.55, -6.1]} s={[0.5, 0.35]} r={[0, -Math.PI / 2, 0]} map={tex.notice} />
    </group>
  );
};

/** the canteen roof from below: steel purlins, rafters, tube lights (off), so the underside reads as a roof, not a black slab */
const CanteenRoofUnder: React.FC = () => (
  <group>
    {[-1, 1].flatMap((k) => [0.5, 1.2, 1.9, 2.6].map((u) => <Box key={`${k}${u}`} p={[-12.25 + k * u, G + 4.86 - u * 0.22 - 0.07, -7.5]} s={[0.06, 0.08, 12.4]} c="#6F8399" metal={0.3} rough={0.5} shadow={false} />))}
    {[-13.3, -10.6, -7.5, -4.4, -1.7].map((z) => <group key={z}>{[-1, 1].map((k) => <mesh key={k} position={[-12.25 + k * 1.65, G + 4.72, z]} rotation={[0, 0, k * -0.22]} material={mat('#4F6B87', 0.45, 0.3)}><boxGeometry args={[3.4, 0.12, 0.1]} /></mesh>)}</group>)}
    {[-11.9, -9.0, -6.1, -3.2].map((z) => [-13.4, -11.1].map((x) => <group key={`${x}${z}`} position={[x, G + 4.25, z]}><Box s={[0.08, 0.05, 1.22]} c="#E9E9E6" rough={0.5} shadow={false} /><Box p={[0, 0.12, 0]} s={[0.01, 0.2, 0.01]} c="#555" shadow={false} /></group>))}
  </group>
);

/** the school's main block across the yard (behind the canteen): three open-corridor storeys, columns, parapets with
 *  railings, classroom doors + louvre windows, a stair tower, a name sign and a banner; a fan turns in one room */
const FarBlock: React.FC<{tex: any; t: number}> = ({tex, t}) => {
  const Z = -36, x0 = -21, x1 = 9, W = x1 - x0, xc = (x0 + x1) / 2, cols = Array.from({length: 9}, (_, i) => x0 + 0.2 + i * (W - 0.4) / 8);
  return (
    <group>
      {/* the classroom wall (set back) and the back of the block */}
      <mesh position={[xc, G + 5.4, Z - 2.2]} receiveShadow><boxGeometry args={[W, 10.8, 0.25]} /><meshStandardMaterial map={tex.blockWall} roughness={0.9} /></mesh>
      <Box p={[xc, G + 5.4, Z - 6]} s={[W, 10.8, 0.25]} c="#E2D8C2" />
      {[x0, x1].map((x) => <Box key={x} p={[x, G + 5.4, Z - 3.1]} s={[0.3, 10.8, 6.2]} c="#E6DCC6" />)}
      {[0, 1, 2].map((f) => { const y = G + f * 3.6; return <group key={f}>
        {/* slab + edge band + parapet + railing */}
        {f > 0 && <Box p={[xc, y - 0.1, Z - 1.0]} s={[W, 0.2, 2.6]} c="#D9D2C2" />}
        <Box p={[xc, y - 0.12, Z + 0.25]} s={[W, 0.24, 0.06]} c="#D0643A" />
        <Box p={[xc, y + 0.5, Z + 0.2]} s={[W, 1.0, 0.14]} c="#F2EBDC" />
        <Box p={[xc, y + 1.06, Z + 0.2]} s={[W, 0.06, 0.22]} c="#3F6E8C" metal={0.3} rough={0.45} />
        {/* doors (some open, dark inside) and louvre windows along the corridor wall */}
        {Array.from({length: 10}, (_, i) => x0 + 1.6 + i * 2.95).map((x, i) => <group key={x}>
          {i % 3 === 0 ? <><mesh position={[x, y + 1.05, Z - 2.06]}><planeGeometry args={[0.95, 2.1]} /><meshStandardMaterial color={hash(i + f * 7) > 0.5 ? '#1A1E26' : '#8A6444'} roughness={0.7} /></mesh><Box p={[x, y + 2.14, Z - 2.05]} s={[1.05, 0.08, 0.06]} c="#6B4E36" /></>
            : <><mesh position={[x, y + 1.7, Z - 2.06]}><planeGeometry args={[1.6, 0.8]} /><meshStandardMaterial color="#232A33" roughness={0.15} metalness={0.4} /></mesh>{[0, 1, 2, 3].map((r) => <Box key={r} p={[x, y + 1.38 + r * 0.2, Z - 2.03]} s={[1.6, 0.03, 0.02]} c="#9AA3AE" shadow={false} />)}</>}
        </group>)}
        {/* corridor ceiling lights (off) */}
        {cols.slice(0, -1).map((x) => <Box key={x} p={[x + 1.8, y + 3.32, Z - 1.0]} s={[1.2, 0.05, 0.12]} c="#E9E9E6" shadow={false} />)}
      </group>; })}
      {cols.map((x) => <Box key={x} p={[x, G + 5.4, Z + 0.15]} s={[0.36, 10.8, 0.36]} c="#ECE3CF" />)}
      {[1, 2, 3].map((f) => <Box key={f} p={[xc, G + f * 3.6 - 0.25, Z + 0.15]} s={[W, 0.3, 0.36]} c="#E6DCC6" />)}
      {/* stair tower with breeze blocks at the near end */}
      <mesh position={[x1 - 1.6, G + 5.4, Z + 0.32]}><planeGeometry args={[2.6, 10.2]} /><meshStandardMaterial map={tex.breeze} transparent alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
      {/* roof */}
      <Box p={[xc, G + 10.9, Z - 2.6]} s={[W + 0.6, 0.25, 7.4]} c="#E2D8C2" />
      <mesh position={[xc, G + 12.3, Z - 2.6]} scale={[16, 1.4, 4.4]} rotation={[0, Math.PI / 4, 0]} material={mat('#B5502F', 0.8, 0, true)}><cylinderGeometry args={[0, 1.414, 2, 4, 1]} /></mesh>
      {/* name sign, banner on the 2F parapet, pot plants, a fan turning in an open room, a mop bucket left out */}
      <Plane p={[xc - 4, G + 9.3, Z + 0.3]} s={[2.6, 0.65]} map={tex.bldg1} basic />
      <Plane p={[xc + 5, G + 4.15, Z + 0.28]} s={[6.5, 1.0]} map={tex.banner} />
      {cols.slice(0, -1).map((x, i) => hash(i * 2.3) > 0.4 && <group key={'pl' + x} position={[x + 1.2, G + 3.6 + 1.1, Z + 0.2]}><Cyl p={[0, 0.12, 0]} r0={0.1} r1={0.13} h={0.24} c="#A9583C" /><mesh position={[0, 0.34, 0]} material={mat('#3E7A38', 0.9, 0, true)} scale={0.22}><icosahedronGeometry args={[1, 1]} /></mesh></group>)}
      <group position={[x0 + 1.6, G + 3.6 + 2.6, Z - 2.3]}><group rotation={[0, 0, t * 9]}>{[0, 1, 2].map((b) => <mesh key={b} rotation={[0, 0, b * 2.094]} material={mat('#E9E9E6', 0.5)}><boxGeometry args={[0.08, 0.6, 0.01]} /></mesh>)}</group></group>
      <group position={[x0 + 5.5, G, Z - 0.8]}><Cyl p={[0, 0.2, 0]} r0={0.18} h={0.4} c="#E8B53A" rough={0.5} /><Cyl p={[0.05, 0.75, 0]} r0={0.015} h={1.2} c="#B5813F" rot={[0, 0, 0.2]} /></group>
    </group>
  );
};
export const _c = clamp;
