import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hash, clamp, smooth} from '../../lib/math';
import {tex, F, speckle, grime, M, MB, glowTex} from '../../lib/tex';

/**
 * Car 3 of Train 0 — metro car interior, origin = floor centre, car axis along z (19 m), width x ±1.45.
 * Three doors per side at z = -5.7 / 0 / 5.7. The POV sits on the left bench (x≈-1.12) at z≈2.6 facing +x;
 * May sits opposite at z≈1.6; window W3 (right wall, z 0.75…4.95) is the one that cracks (EP1) and breaks (EP2).
 * Everything that changes with the story is in CarState; the camera owner never sees itself in any glass (no reflections are rendered).
 */
export type Lcd = 'route' | 'zero' | 'rules' | 'pa' | 'off' | 'station';
export type CarState = {
  t: number;
  light: number;        // main strips 0…1 (flicker drives this)
  emergency: number;    // amber emergency lamps 0…1
  lcd: Lcd; rulesShown: number; ruleLit: number; chime: number; // chime icon flash (1 or 2 dots lit)
  crack: number;        // W3 crack growth 0…1
  broken: boolean;      // W3 shattered
  doorsR: number;       // right-side doors open 0…1 (Station 0)
  sway: number;         // car body sway amplitude 0…1 (≈ speed)
  lever: number;        // emergency lever cover opened 0…1 (EP2)
  station?: string;     // LCD station name
};
export const CAR_DEFAULT: CarState = {t: 0, light: 1, emergency: 0, lcd: 'route', rulesShown: 0, ruleLit: 0, chime: 0, crack: 0, broken: false, doorsR: 0, sway: 1, lever: 0};

export const HALF_W = 1.45, HALF_L = 9.5, CEIL = 2.15;
export const DOORS_Z = [-5.7, 0, 5.7];
const DOOR_W = 1.3, DOOR_H = 1.95, WIN_Y0 = 0.95, WIN_Y1 = 1.85;
export const BENCHES: [number, number][] = [[-9.3, -6.45], [-4.95, -0.75], [0.75, 4.95], [6.45, 9.3]];
/** seats (x, z, yaw) for people, used by the episodes' staging */
export const SEAT = {
  pov: [-1.12, 2.6, Math.PI / 2] as [number, number, number],
  may: [1.12, 1.55, -Math.PI / 2] as [number, number, number],
  aunt: [1.12, -7.75, -Math.PI / 2] as [number, number, number],
  boy: [1.12, 8.6, -Math.PI / 2] as [number, number, number],
};
export const W3: [number, number] = [0.75, 4.95];

const LINE = ['บางแสงจันทร์', 'ตลาดนิลกาฬ', 'ท่าเรือเก่า', 'วงเวียนทอง', 'สะพานหิน', 'นิลกาฬใต้'];
const RULES = ['เสียงประกาศจริง มีสัญญาณ 2 ครั้ง', 'ไฟกะพริบ ห้ามมองกระจก', 'ห้ามบอกชื่อจริงกับใคร', 'ห้ามให้บัตรกับคนที่ไม่มีเงา'];

/** door-top LCD: route map / "0" / the rules typing in / the PA card / a station name */
export const lcdTex = (ready: boolean, st: Pick<CarState, 'lcd' | 'rulesShown' | 'ruleLit' | 'chime' | 'station'>) => {
  const shown = Math.floor(st.rulesShown * 4 + 1e-6) / 4;
  const key = `lcd${ready}${st.lcd}${shown}${st.ruleLit}${st.chime}${st.station ?? ''}`;
  return tex(key, 1024, 280, (g) => {
    g.fillStyle = '#05070A'; g.fillRect(0, 0, 1024, 280);
    if (!ready || st.lcd === 'off') return;
    if (st.lcd === 'route' || st.lcd === 'station') {
      g.fillStyle = '#0E1420'; g.fillRect(0, 0, 1024, 280);
      g.fillStyle = '#3B2F6B'; g.fillRect(0, 0, 1024, 54); g.fillStyle = '#fff'; g.font = F(600, 30); g.textAlign = 'left'; g.fillText('สายนิลกาฬ', 24, 38);
      g.textAlign = 'right'; g.font = F(400, 24); g.fillStyle = '#C9D2E8'; g.fillText(st.lcd === 'station' ? 'สถานีถัดไป' : 'ปลายทาง นิลกาฬใต้', 1000, 38);
      if (st.lcd === 'station') { g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = F(700, 96); g.fillText(st.station ?? '', 512, 190); return; }
      g.strokeStyle = '#7B6CC4'; g.lineWidth = 10; g.beginPath(); g.moveTo(80, 160); g.lineTo(944, 160); g.stroke();
      LINE.forEach((n, i) => { const x = 80 + i * (864 / (LINE.length - 1)); g.fillStyle = i < 2 ? '#5D5F6A' : '#fff'; g.beginPath(); g.arc(x, 160, 14, 0, 7); g.fill(); g.strokeStyle = '#7B6CC4'; g.lineWidth = 5; g.stroke();
        g.fillStyle = i < 2 ? '#7E828E' : '#E8ECF6'; g.font = F(500, 22); g.textAlign = 'center'; g.save(); g.translate(x, 205); g.fillText(n, 0, 12); g.restore(); });
      g.fillStyle = '#FFD15A'; g.beginPath(); g.moveTo(210, 128); g.lineTo(232, 128); g.lineTo(221, 146); g.fill();
      return;
    }
    if (st.lcd === 'zero') { g.fillStyle = '#C8231E'; g.font = F(700, 230); g.textAlign = 'center'; g.fillText('0', 512, 232); g.fillStyle = '#7A1512'; g.font = F(600, 28); g.textAlign = 'left'; g.fillText('ขบวน', 40, 60); return; }
    if (st.lcd === 'pa') { g.fillStyle = '#16191F'; g.fillRect(0, 0, 1024, 280); g.fillStyle = '#E8ECF6'; g.font = F(600, 54); g.textAlign = 'center'; g.fillText('ประกาศ', 512, 150);
      for (let i = 0; i < 2; i++) { g.fillStyle = i < st.chime ? '#FFD15A' : '#3A3E48'; g.beginPath(); g.arc(470 + i * 84, 214, 18, 0, 7); g.fill(); } return; }
    // rules
    g.fillStyle = '#0A0505'; g.fillRect(0, 0, 1024, 280);
    g.fillStyle = '#C8231E'; g.fillRect(0, 0, 1024, 50); g.fillStyle = '#fff'; g.font = F(700, 30); g.textAlign = 'left'; g.fillText('ประกาศฉุกเฉิน — ขบวน 0', 22, 36);
    for (let i = 0; i < 2; i++) { g.fillStyle = i < st.chime ? '#FFD15A' : '#5A1E1C'; g.beginPath(); g.arc(940 + i * 40, 25, 11, 0, 7); g.fill(); }
    const n = Math.round(shown * 4);
    for (let i = 0; i < n; i++) {
      const lit = st.ruleLit === i + 1; const y = 92 + i * 52;
      if (lit) { g.fillStyle = '#7A1512'; g.fillRect(10, y - 36, 1004, 48); }
      g.fillStyle = lit ? '#FFFFFF' : '#FF6A5E'; g.font = F(700, 34); g.fillText(`${i + 1}`, 30, y); g.fillStyle = lit ? '#FFFFFF' : '#F2D6D2'; g.font = F(600, 32); g.fillText(RULES[i], 80, y);
    }
  });
};

/** the crack on W3 (canvas with alpha): radial cracks from an impact point near the top-left, revealed by radius `k` */
const crackTex = (k: number) => tex('crack' + Math.round(k * 20), 1024, 512, (g) => {
  g.clearRect(0, 0, 1024, 512); if (k <= 0) return;
  const cx = 310, cy = 190, R = 40 + k * 900;
  g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    let a = i / 26 * Math.PI * 2 + (hash(i * 3.3) - 0.5) * 0.3, x = cx, y = cy, r = 0;
    g.strokeStyle = `rgba(235,242,250,${0.55 + hash(i) * 0.35})`; g.lineWidth = 2.6 - hash(i * 1.9) * 1.4; g.beginPath(); g.moveTo(x, y);
    while (r < R && r < 950) { const st = 18 + hash(i * 7 + r) * 30; a += (hash(i * 13 + r * 0.7) - 0.5) * 0.35; x += Math.cos(a) * st; y += Math.sin(a) * st; r += st; g.lineTo(x, y);
      if (hash(i * 5 + r) > 0.86 && r < R * 0.8) { g.moveTo(x, y); const b = a + (hash(r) - 0.5) * 1.8; g.lineTo(x + Math.cos(b) * 40, y + Math.sin(b) * 40); g.moveTo(x, y); } }
    g.stroke();
  }
  // concentric rings of the impact
  for (let j = 1; j < 6; j++) { const rr = j * 26 * (0.6 + k); if (rr > R) break; g.strokeStyle = 'rgba(230,238,248,.5)'; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= 26; i++) { const a = i / 26 * Math.PI * 2; const q = rr * (0.85 + hash(i + j * 9) * 0.3); i ? g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : g.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.stroke(); }
  const rg = g.createRadialGradient(cx, cy, 0, cx, cy, 34); rg.addColorStop(0, 'rgba(255,255,255,.9)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(cx - 40, cy - 40, 80, 80);
});

type Tx = ReturnType<typeof carTextures>;
const CREAM = '#EDE8DA';
/** priority-seat cover (red, Bangkok-metro style): "thank you for giving up your seat", a pregnant woman and an elder with a cane, hearts between */
const prioTex = (ready: boolean) => tex('prioSeat' + ready, 380, 480, (g) => {
  g.fillStyle = '#C8102E'; g.beginPath(); g.roundRect(0, 0, 380, 480, 34); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 4; g.beginPath(); g.roundRect(10, 10, 360, 460, 28); g.stroke();
  if (ready) { g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = F(800, 44); g.fillText('ขอบคุณที่', 190, 92); g.fillText('เอื้อเฟื้อที่นั่ง', 190, 148); }
  g.fillStyle = '#F5F5F5'; g.strokeStyle = '#F5F5F5'; g.lineCap = 'round';
  // pregnant woman (left)
  g.beginPath(); g.arc(98, 222, 24, 0, 7); g.fill();
  g.beginPath(); g.moveTo(80, 254); g.quadraticCurveTo(70, 330, 76, 440); g.lineTo(128, 440); g.quadraticCurveTo(150, 360, 128, 330); g.quadraticCurveTo(160, 300, 114, 254); g.closePath(); g.fill();
  g.fillStyle = '#C8102E'; const heart = (x: number, y: number, r: number) => { g.beginPath(); g.moveTo(x, y + r); g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r); g.fill(); };
  heart(124, 352, 12);
  // elder with a cane (right)
  g.fillStyle = '#F5F5F5'; g.beginPath(); g.arc(292, 236, 22, 0, 7); g.fill();
  g.lineWidth = 22; g.beginPath(); g.moveTo(296, 266); g.quadraticCurveTo(286, 300, 290, 340); g.stroke();
  g.lineWidth = 16; g.beginPath(); g.moveTo(290, 336); g.lineTo(276, 440); g.moveTo(292, 336); g.lineTo(316, 440); g.stroke();
  g.lineWidth = 12; g.beginPath(); g.moveTo(292, 282); g.lineTo(256, 318); g.stroke();
  g.lineWidth = 6; g.beginPath(); g.moveTo(252, 314); g.lineTo(246, 440); g.moveTo(252, 314); g.quadraticCurveTo(262, 300, 270, 314); g.stroke();
  // hearts between
  heartW(g, 190, 262, 14); heartW(g, 206, 312, 10);
  function heartW(c: CanvasRenderingContext2D, x: number, y: number, r: number) { c.fillStyle = '#F5F5F5'; c.beginPath(); c.moveTo(x, y + r); c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4); c.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r); c.fill(); }
});

const carTextures = (ready: boolean) => ({
  floor: tex('carFloor2', 512, 512, (g) => { g.fillStyle = '#6A6F74'; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 12000, ['#565A5F', '#8A8F94', '#4A4D51', '#9DA2A7'], 0.25, 0.6, 1, 3); grime(g, 512, 512, 0.08, 0); }, [3, 18]),
  wall: tex('carWall2', 512, 512, (g) => { g.fillStyle = CREAM; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 1600, ['#E0DACB', '#F5F1E6'], 0.2, 0.4); g.fillStyle = 'rgba(150,140,120,.35)'; for (let x = 0; x < 512; x += 256) g.fillRect(x, 0, 2, 512); grime(g, 512, 512, 0.22, 6, 4); }, [5, 1]),
  ceil: tex('carCeil2', 256, 256, (g) => { g.fillStyle = '#F2EFE6'; g.fillRect(0, 0, 256, 256); speckle(g, 256, 256, 600, ['#E2DED3'], 0.2, 0.4); g.fillStyle = 'rgba(140,130,110,.35)'; g.fillRect(0, 0, 256, 2); }, [1, 12]),
  vent: tex('carVent2', 128, 128, (g) => { g.fillStyle = '#D9D5CA'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#9A968C'; for (let y = 6; y < 128; y += 10) g.fillRect(10, y, 108, 3); }, [1, 8]),
  steel: tex('carSteel', 256, 256, (g) => { g.fillStyle = '#B9C0C6'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y++) { g.fillStyle = `rgba(255,255,255,${hash(y) * 0.12})`; g.fillRect(0, y, 256, 1); } grime(g, 256, 256, 0.18, 4, 9); }),
  door: tex('carDoor2' + ready, 256, 512, (g) => { g.fillStyle = '#C9CCCC'; g.fillRect(0, 0, 256, 512); for (let y = 0; y < 512; y++) { g.fillStyle = `rgba(255,255,255,${hash(y * 1.3) * 0.08})`; g.fillRect(0, y, 256, 1); }
    g.fillStyle = '#F2C21B'; g.fillRect(14, 300, 228, 30); if (ready) { g.fillStyle = '#1A1A1A'; g.font = F(600, 20); g.textAlign = 'center'; g.fillText('ระวังประตูหนีบ', 128, 322); } grime(g, 256, 512, 0.2, 3, 5); }),
  map: tex('carMap' + ready, 2048, 96, (g) => { g.fillStyle = '#F8F7F2'; g.fillRect(0, 0, 2048, 96); g.strokeStyle = '#2C4FA8'; g.lineWidth = 7; g.beginPath(); g.moveTo(40, 40); g.lineTo(2008, 40); g.stroke();
    const N = 14; for (let i = 0; i < N; i++) { const x = 40 + i * (1968 / (N - 1)); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, 40, 10, 0, 7); g.fill(); g.strokeStyle = '#2C4FA8'; g.lineWidth = 4; g.stroke(); if (ready) { g.fillStyle = '#334'; g.font = F(500, 18); g.textAlign = 'center'; g.fillText(['บางแสงจันทร์', 'ตลาดนิลกาฬ', 'ท่าเรือเก่า', 'วงเวียนทอง', 'สะพานหิน', 'ศาลเจ้าเก่า', 'หัวลำโพงใหม่', 'สามแยกทอง', 'ทุ่งนิมิต', 'ป่ามะม่วง', 'คลองนิล', 'บ้านเก่า', 'ตลาดน้ำ', 'นิลกาฬใต้'][i], x, 80); } } }),
  ads: [0, 1, 2].map((i) => tex('ad2' + i + ready, 1024, 300, (g) => {
    const bg = ['#FFF4D6', '#E8F1FF', '#F2FFF0'][i]; g.fillStyle = bg; g.fillRect(0, 0, 1024, 300); g.fillStyle = ['#F2A21B', '#2C4FA8', '#2E9E5B'][i]; g.fillRect(0, 0, 1024, 26);
    if (!ready) return; g.textAlign = 'left';
    if (i === 0) { g.fillStyle = '#C65A2E'; g.font = F(700, 70); g.fillText('แชมพูใบชาเย็น', 40, 140); g.fillStyle = '#5A4632'; g.font = F(400, 36); g.fillText('ผมนุ่ม หอมทั้งวัน', 44, 200); g.fillStyle = '#E6B98F'; g.beginPath(); g.arc(850, 160, 90, 0, 7); g.fill(); g.fillStyle = '#2A1F18'; g.beginPath(); g.arc(850, 130, 92, Math.PI, 0); g.fill(); }
    if (i === 1) { g.fillStyle = '#2C4FA8'; g.font = F(700, 64); g.fillText('นิลกาฬ ริเวอร์ไซด์', 40, 130); g.fillStyle = '#5A6E8C'; g.font = F(400, 34); g.fillText('คอนโดติดสถานี เริ่ม 1.9 ล้าน', 44, 190); for (let k = 0; k < 5; k++) { g.fillStyle = '#7A90B8'; g.fillRect(700 + k * 56, 280 - (80 + hash(k) * 140), 46, 80 + hash(k) * 140); } }
    if (i === 2) { g.fillStyle = '#2E6B47'; g.font = F(700, 58); g.fillText('ลุกให้ผู้ที่ต้องการ', 40, 130); g.fillStyle = '#3F5547'; g.font = F(400, 32); g.fillText('ผู้สูงอายุ · ผู้พิการ · สตรีมีครรภ์ · เด็ก', 44, 190); }
  })),
  intercom: tex('intercom' + ready, 256, 384, (g) => { g.fillStyle = '#E3C21E'; g.fillRect(0, 0, 256, 384); g.fillStyle = '#C8231E'; g.fillRect(16, 16, 224, 64); if (ready) { g.fillStyle = '#fff'; g.font = F(700, 30); g.textAlign = 'center'; g.fillText('ติดต่อพนักงาน', 128, 60); g.fillStyle = '#1A1A1A'; g.font = F(500, 22); g.fillText('กดปุ่มค้างไว้แล้วพูด', 128, 330); }
    g.fillStyle = '#2A2A2A'; for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) { g.beginPath(); g.arc(78 + x * 20, 120 + y * 16, 4, 0, 7); g.fill(); } g.fillStyle = '#B81D19'; g.beginPath(); g.arc(128, 262, 34, 0, 7); g.fill(); }),
  lever: tex('lever' + ready, 256, 256, (g) => { g.fillStyle = '#D72A22'; g.fillRect(0, 0, 256, 256); if (ready) { g.fillStyle = '#fff'; g.font = F(700, 28); g.textAlign = 'center'; g.fillText('เปิดประตูฉุกเฉิน', 128, 50); g.font = F(500, 20); g.fillText('ใช้เมื่อได้รับแจ้งจากพนักงาน', 128, 230); } }),
  carNo: tex('carNo' + ready, 256, 128, (g) => { g.fillStyle = '#20232A'; g.fillRect(0, 0, 256, 128); if (ready) { g.fillStyle = '#fff'; g.font = F(700, 52); g.textAlign = 'center'; g.fillText('ตู้ 3', 128, 82); } }),
});
/** window-band panel with two rounded window openings (alpha-cut), inside cream / outside stainless */
const BAND_Y0 = 0.82, BAND_Y1 = 2.02;
const bandTex = (L: number, outside: boolean) => tex('band' + L.toFixed(2) + outside, 1024, Math.round(1024 * (BAND_Y1 - BAND_Y0) / L), (g) => {
  const W = g.canvas.width, H = g.canvas.height, px = W / L;
  g.fillStyle = outside ? '#B9C0C6' : CREAM; g.fillRect(0, 0, W, H);
  if (outside) for (let y = 0; y < H; y++) { g.fillStyle = `rgba(255,255,255,${hash(y) * 0.1})`; g.fillRect(0, y, W, 1); }
  const n = L > 3.5 ? 2 : 1, gap = 0.16, ww = (L - gap * (n + 1)) / n, y0 = (BAND_Y1 - WIN_Y1) * px, hh = (WIN_Y1 - WIN_Y0) * px, r = 0.09 * px;
  for (let i = 0; i < n; i++) { const x0 = (gap + i * (ww + gap)) * px;
    g.fillStyle = '#16171A'; g.beginPath(); g.roundRect(x0 - 0.035 * px, y0 - 0.035 * px, ww * px + 0.07 * px, hh + 0.07 * px, r * 1.3); g.fill();
    g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.roundRect(x0, y0, ww * px, hh, r); g.fill(); g.restore(); }
});

const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]; shadow?: boolean}> = ({p, s, m, r, shadow = true}) => (
  <mesh position={p} rotation={r} material={m} castShadow={shadow} receiveShadow><boxGeometry args={s} /></mesh>
);
const Rod: React.FC<{a: [number, number, number]; b: [number, number, number]; r?: number; m: THREE.Material}> = ({a, b, r = 0.018, m}) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh position={A.clone().add(B).multiplyScalar(0.5)} quaternion={q} material={m} castShadow><cylinderGeometry args={[r, r, d.length(), 10]} /></mesh>;
};

/** a blue loop strap hanging from the overhead bar (clip + elongated loop), swinging with the car */
const Strap: React.FC<{x: number; z: number; t: number; sway: number; m: THREE.Material; ring: THREE.Material}> = ({x, z, t, sway, m, ring}) => {
  const ph = hash(z * 3.1 + x) * 6.28;
  const a = sway * (0.09 * Math.sin(t * 1.7 + ph) + 0.05 * Math.sin(t * 3.9 + ph * 2)), b = sway * 0.05 * Math.sin(t * 1.1 + ph * 0.5);
  return <group position={[x, 1.96, z]} rotation={[b, Math.PI / 2, a]}>
    <mesh position={[0, -0.04, 0]} material={m} castShadow><boxGeometry args={[0.036, 0.06, 0.03]} /></mesh>
    <mesh position={[0, -0.16, 0]} scale={[1, 1.9, 1]} material={ring} castShadow><torusGeometry args={[0.05, 0.009, 6, 18]} /></mesh>
  </group>;
};

/** one door leaf pair (light grey, tall window); `open` 0…1 slides along z */
const DoorPair: React.FC<{side: 1 | -1; z: number; open: number; tx: Tx}> = ({side, z, open, tx}) => {
  const doorM = useMemo(() => M('#ffffff', 0.45, 0.25, {map: tx.door}, 'door2'), [tx.door]);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({color: '#0A0E14', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.25, depthWrite: false}), []);
  const x = side * (HALF_W - 0.03), slide = open * 0.62, ww = DOOR_W / 2 - 0.18, wy0 = 0.95, wy1 = 1.8;
  return <>{[-1, 1].map((d) => <group key={d} position={[x, 0, z + d * (DOOR_W / 4 + slide)]}>
    {/* leaf in 4 pieces around the window opening */}
    <mesh position={[0, wy0 / 2, 0]} material={doorM} castShadow receiveShadow><boxGeometry args={[0.04, wy0, DOOR_W / 2 - 0.01]} /></mesh>
    <mesh position={[0, (wy1 + DOOR_H) / 2, 0]} material={doorM} castShadow receiveShadow><boxGeometry args={[0.04, DOOR_H - wy1, DOOR_W / 2 - 0.01]} /></mesh>
    {[-1, 1].map((e) => <mesh key={e} position={[0, (wy0 + wy1) / 2, e * (ww / 2 + (DOOR_W / 2 - 0.01 - ww) / 4)]} material={doorM}><boxGeometry args={[0.04, wy1 - wy0, (DOOR_W / 2 - 0.01 - ww) / 2]} /></mesh>)}
    <mesh position={[0, (wy0 + wy1) / 2, 0]} material={glass}><boxGeometry args={[0.01, wy1 - wy0, ww]} /></mesh>
    {[[0, wy1, ww + 0.03, 0.025], [0, wy0, ww + 0.03, 0.025], [ww / 2, (wy0 + wy1) / 2, 0.025, wy1 - wy0], [-ww / 2, (wy0 + wy1) / 2, 0.025, wy1 - wy0]].map(([zz, yy, w, h], i) => <mesh key={i} position={[-side * 0.022, yy, zz]} material={M('#1A1C20', 0.6)}><boxGeometry args={[0.012, h, w]} /></mesh>)}
    <mesh position={[0, DOOR_H / 2, -d * (DOOR_W / 4 - 0.01)]} material={M('#1A1A1C', 0.8)}><boxGeometry args={[0.05, DOOR_H, 0.025]} /></mesh>
  </group>)}</>;
};

/** an individual contoured plastic seat (seat pan with a front lip + tilted back), seat-local: x out from the wall, faces -x for the right bench */
const Seat: React.FC<{m: THREE.Material}> = ({m}) => (
  <group>
    <mesh position={[-0.02, 0.43, 0]} material={m} castShadow receiveShadow><boxGeometry args={[0.44, 0.05, 0.43]} /></mesh>
    <mesh position={[-0.235, 0.445, 0]} rotation={[0, 0, 0.5]} material={m}><boxGeometry args={[0.06, 0.03, 0.43]} /></mesh>
    <mesh position={[0.18, 0.74, 0]} rotation={[0, 0, -0.14]} material={m} castShadow><boxGeometry args={[0.05, 0.58, 0.42]} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[0.0, 0.47, s * 0.205]} material={m}><boxGeometry args={[0.36, 0.03, 0.025]} /></mesh>)}
  </group>
);

/** the car interior (Bangkok-metro style: cream walls, blue individual seats, Y-branch poles, blue loop straps, rounded black windows). `lite` = neighbouring cars */
export const TrainCar: React.FC<{st: CarState; ready: boolean; lite?: boolean; lag?: number}> = ({st, ready, lite = false}) => {
  const tx = useMemo(() => carTextures(ready), [ready]);
  const lcd = lcdTex(ready, st);
  const m = useMemo(() => ({
    floor: M('#ffffff', 0.8, 0, {map: tx.floor}, 'floorM2'), wall: M('#ffffff', 0.6, 0, {map: tx.wall}, 'wallM2'), ceil: M('#ffffff', 0.7, 0, {map: tx.ceil}, 'ceilM2'),
    vent: M('#ffffff', 0.7, 0.1, {map: tx.vent}, 'ventM2'), seat: M('#2E6BC4', 0.32, 0.05), base: M('#3A3D42', 0.7), steel: M('#ffffff', 0.32, 0.65, {map: tx.steel}, 'steelM'),
    pole: M('#DDE2E6', 0.2, 0.9), rubber: M('#17181B', 0.85), clip: M('#5C6168', 0.5, 0.3), loop: M('#2C5AB0', 0.45), frame: M('#B5BCC2', 0.3, 0.7), yellow: M('#E8B820', 0.6), cream: M(CREAM, 0.6),
    glass: new THREE.MeshStandardMaterial({color: '#05080C', roughness: 0.04, metalness: 0.35, transparent: true, opacity: 0.4, depthWrite: false}),
    screenGlass: new THREE.MeshStandardMaterial({color: '#DDEBF2', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.18, depthWrite: false}),
    map: M('#ffffff', 0.6, 0, {map: tx.map}, 'mapM' + ready),
    prio: M('#ffffff', 0.4, 0.02, {map: prioTex(ready), transparent: true, alphaTest: 0.1}, 'prioM' + ready),
  }), [tx, ready]);
  const stripM = useMemo(() => new THREE.MeshStandardMaterial({color: '#F8FAFF', emissive: '#F2F6FF', emissiveIntensity: 1, roughness: 0.4}), []);
  stripM.emissiveIntensity = 0.06 + st.light * 0.85; stripM.color.setScalar(0.3 + st.light * 0.5);
  const lcdM = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  lcdM.map = lcd; lcdM.color.setScalar(0.55 + 0.45 * Math.max(st.light, 0.6)); lcdM.needsUpdate = true;
  const crackM = useMemo(() => new THREE.MeshBasicMaterial({transparent: true, depthWrite: false, toneMapped: false}), []);
  crackM.map = crackTex(st.crack); crackM.opacity = 0.9; crackM.needsUpdate = true;
  const t = st.t, sway = st.sway;
  const winSegs: [number, number][] = [[-9.2, -6.45], [-4.95, -0.75], [0.75, 4.95], [6.45, 9.2]];
  const ad = (i: number) => M('#ffffff', 0.55, 0, {map: tx.ads[i]}, 'ad2' + i + ready);
  const bandM = (L: number, out: boolean) => M('#ffffff', out ? 0.32 : 0.6, out ? 0.6 : 0, {map: bandTex(L, out), alphaTest: 0.5, side: THREE.FrontSide}, 'band' + L.toFixed(2) + out);
  return (
    <group>
      {/* floor, door thresholds */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.floor} receiveShadow><planeGeometry args={[HALF_W * 2, HALF_L * 2]} /></mesh>
      {DOORS_Z.flatMap((z) => [-1, 1].map((sd) => <mesh key={'th' + z + sd} position={[sd * (HALF_W - 0.07), 0.003, z]} rotation={[-Math.PI / 2, 0, 0]} material={m.steel} receiveShadow><planeGeometry args={[0.14, DOOR_W]} /></mesh>))}
      {[-1, 1].map((sd) => <group key={sd}>
        {winSegs.map(([z0, z1], i) => {
          const zc = (z0 + z1) / 2, L = z1 - z0, isW3 = sd === 1 && i === 2;
          return <group key={i}>
            <Box p={[sd * HALF_W, BAND_Y0 / 2, zc]} s={[0.06, BAND_Y0, L]} m={m.wall} />
            {/* window band: inner cream panel + outer stainless panel, both alpha-cut with two rounded windows */}
            <mesh position={[sd * (HALF_W - 0.031), (BAND_Y0 + BAND_Y1) / 2, zc]} rotation={[0, -sd * Math.PI / 2, 0]} material={bandM(L, false)} receiveShadow><planeGeometry args={[L, BAND_Y1 - BAND_Y0]} /></mesh>
            <mesh position={[sd * (HALF_W + 0.031), (BAND_Y0 + BAND_Y1) / 2, zc]} rotation={[0, sd * Math.PI / 2, 0]} material={bandM(L, true)}><planeGeometry args={[L, BAND_Y1 - BAND_Y0]} /></mesh>
            {!(isW3 && st.broken) && <mesh position={[sd * HALF_W, (WIN_Y0 + WIN_Y1) / 2, zc]} rotation={[0, -sd * Math.PI / 2, 0]} material={m.glass}><planeGeometry args={[L, WIN_Y1 - WIN_Y0]} /></mesh>}
            {isW3 && !st.broken && st.crack > 0 && <mesh position={[sd * (HALF_W - 0.04), (WIN_Y0 + WIN_Y1) / 2, zc]} rotation={[0, -Math.PI / 2, 0]} material={crackM}><planeGeometry args={[L, WIN_Y1 - WIN_Y0]} /></mesh>}
            {isW3 && st.broken && <BrokenEdge zc={zc} L={L} />}
            {/* individual seats + dark base */}
            {(() => { const n = Math.round((L - 0.1) / 0.47), w = (L - 0.1) / n; return <>
              <Box p={[sd * 1.2, 0.2, zc]} s={[0.4, 0.4, L - 0.12]} m={m.base} />
              {Array.from({length: n}, (_, k) => <group key={k} position={[sd * 1.18, 0, z0 + 0.05 + w * (k + 0.5)]} scale={[sd, 1, 1]}><Seat m={m.seat} /></group>)}
              {/* priority seats: the end seat beside each door gets the red cover on its back (world-space so the print isn't mirrored) */}
              {!lite && [0, n - 1].filter((k) => Math.abs(Math.abs(k === 0 ? z0 : z1) - HALF_L) > 0.6).map((k) => <group key={'prio' + k} position={[sd * (1.18 + 0.152), 0.745, z0 + 0.05 + w * (k + 0.5)]} rotation={[0, -sd * Math.PI / 2, 0]}>
                <mesh rotation={[-0.14, 0, 0]} material={m.prio}><planeGeometry args={[0.36, 0.46]} /></mesh>
              </group>)}
            </>; })()}
            {/* glass windscreen + curved grab pole at bench ends beside the doors */}
            {[z0, z1].map((ze) => Math.abs(Math.abs(ze) - HALF_L) < 0.6 ? null : <group key={ze}>
              <mesh position={[sd * 1.15, 0.95, ze + (ze === z0 ? -0.04 : 0.04)]} material={m.screenGlass}><boxGeometry args={[0.55, 0.9, 0.012]} /></mesh>
              <Rod a={[sd * 0.88, 0.5, ze + (ze === z0 ? -0.04 : 0.04)]} b={[sd * 0.88, 1.4, ze + (ze === z0 ? -0.04 : 0.04)]} r={0.012} m={m.frame} />
              <Rod a={[sd * 0.86, 0, ze + (ze === z0 ? -0.08 : 0.08)]} b={[sd * 0.86, 1.62, ze + (ze === z0 ? -0.08 : 0.08)]} m={m.pole} />
              <Rod a={[sd * 0.86, 1.62, ze + (ze === z0 ? -0.08 : 0.08)]} b={[sd * 0.75, 1.96, ze + (ze === z0 ? -0.08 : 0.08)]} m={m.pole} />
            </group>)}
          </group>;
        })}
        {[-1, 1].map((e) => <Box key={e} p={[sd * HALF_W, 1.01, e * (HALF_L - 0.15)]} s={[0.06, 2.02, 0.3]} m={m.wall} />)}
        {/* door frames, panels above doors, door-top LCD */}
        {DOORS_Z.map((z) => <group key={z}>
          <Box p={[sd * HALF_W, (DOOR_H + 2.02) / 2, z]} s={[0.06, 2.02 - DOOR_H, DOOR_W + 0.1]} m={m.cream} />
          {[-1, 1].map((d) => <Box key={d} p={[sd * (HALF_W - 0.04), DOOR_H / 2, z + d * (DOOR_W / 2 + 0.03)]} s={[0.08, DOOR_H, 0.07]} m={m.cream} />)}
          <DoorPair side={sd as 1 | -1} z={z} open={sd === 1 ? st.doorsR : 0} tx={tx} />
          <group position={[sd * (HALF_W - 0.17), 2.0, z]} rotation={[0, -sd * Math.PI / 2, 0]}>
            <group rotation={[-0.35, 0, 0]}>
              <mesh material={M('#22252B', 0.5)}><boxGeometry args={[0.7, 0.21, 0.06]} /></mesh>
              {!lite && <mesh position={[0, 0, 0.032]} material={lcdM}><planeGeometry args={[0.64, 0.175]} /></mesh>}
            </group>
          </group>
        </group>)}
        {/* cove above the windows: route-map strip + ad frames */}
        <mesh position={[sd * 1.2, 2.12, 0]} rotation={[0, 0, sd * 0.95]} material={m.cream} receiveShadow><boxGeometry args={[0.03, 0.56, HALF_L * 2]} /></mesh>
        {!lite && winSegs.map(([z0, z1], i) => <group key={'cv' + i} position={[sd * 1.25, 2.085, (z0 + z1) / 2]} rotation={[0, -sd * Math.PI / 2, 0]}><group rotation={[-(Math.PI / 2 - 0.95), 0, 0]}>
          <mesh position={[0, -0.13, 0.02]} material={m.map}><planeGeometry args={[z1 - z0 - 0.2, 0.09]} /></mesh>
          <mesh position={[0, 0.06, 0.02]} material={ad((i + (sd > 0 ? 1 : 0)) % 3)}><planeGeometry args={[Math.min(1.5, z1 - z0 - 0.4), 0.3]} /></mesh>
          <mesh position={[0, 0.06, 0.014]} material={m.frame}><boxGeometry args={[Math.min(1.5, z1 - z0 - 0.4) + 0.05, 0.35, 0.01]} /></mesh>
        </group></group>)}
        {/* overhead bar + loop straps */}
        <Rod a={[sd * 0.75, 1.96, -HALF_L + 0.3]} b={[sd * 0.75, 1.96, HALF_L - 0.3]} r={0.017} m={m.pole} />
        {Array.from({length: 30}, (_, k) => -8.7 + k * 0.6).filter((z) => DOORS_Z.every((dz) => Math.abs(z - dz) > 0.4)).map((z) => <Strap key={z} x={sd * 0.75} z={z} t={t} sway={sway} m={m.clip} ring={m.loop} />)}
        {/* light diffuser row */}
        <mesh position={[sd * 0.72, CEIL - 0.03, 0]} material={stripM}><boxGeometry args={[0.24, 0.04, HALF_L * 2 - 0.5]} /></mesh>
        {/* hanging info monitors near the door bays */}
        {!lite && DOORS_Z.map((z) => <group key={'mon' + z} position={[sd * 0.95, 1.98, z + 0.95]}>
          <Rod a={[0, 0.1, 0]} b={[0, 0.2, 0]} r={0.01} m={m.frame} />
          <group rotation={[0.2, 0, 0]}><mesh material={M('#E8E8E4', 0.5)}><boxGeometry args={[0.36, 0.24, 0.05]} /></mesh>
            <mesh position={[0, 0, 0.027]} material={lcdM}><planeGeometry args={[0.32, 0.18]} /></mesh>
            <mesh position={[0, 0, -0.027]} rotation={[0, Math.PI, 0]} material={lcdM}><planeGeometry args={[0.32, 0.18]} /></mesh></group>
        </group>)}
      </group>)}
      {/* Y-branch poles in the aisle: a stem that splits to both overhead bars; straight poles at the door bays */}
      {[-7.9, -2.85, 2.85, 7.9].map((z) => <group key={'y' + z}>
        <Rod a={[0, 0, z]} b={[0, 1.42, z]} m={m.pole} />
        {[-1, 1].map((sd) => <Rod key={sd} a={[0, 1.42, z]} b={[sd * 0.75, 1.96, z]} m={m.pole} />)}
        <mesh position={[0, 1.42, z]} material={m.frame}><sphereGeometry args={[0.03, 10, 8]} /></mesh>
      </group>)}
      {DOORS_Z.map((z) => <Rod key={'dp' + z} a={[0, 0, z]} b={[0, CEIL, z]} r={0.019} m={m.pole} />)}
      {/* ceiling: centre panel + AC vent, CCTV */}
      <mesh position={[0, CEIL, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.ceil}><planeGeometry args={[1.7, HALF_L * 2]} /></mesh>
      <mesh position={[0, CEIL - 0.006, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.vent}><planeGeometry args={[0.36, HALF_L * 2 - 1]} /></mesh>
      {!lite && <group position={[0, CEIL - 0.04, -3.0]}><mesh material={M('#1A1C20', 0.4)}><sphereGeometry args={[0.07, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></mesh><mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]} material={M('#DDE0E2', 0.5)}><ringGeometry args={[0.07, 0.1, 18]} /></mesh></group>}
      {/* roof + underframe (seen from the platform), violet stripe on the outside */}
      <Box p={[0, CEIL + 0.22, 0]} s={[HALF_W * 2 + 0.06, 0.3, HALF_L * 2]} m={m.steel} />
      {/* underframe: its top sits 3 cm below the floor (a box face flush with the floor plane z-fights) */}
      <Box p={[0, -0.28, 0]} s={[HALF_W * 2 - 0.1, 0.5, HALF_L * 2 - 0.4]} m={M('#2A2C30', 0.8)} />
      {[-1, 1].flatMap((sd) => winSegs.map(([z0, z1], i) => <mesh key={'stripe' + sd + i} position={[sd * (HALF_W + 0.032), 0.55, (z0 + z1) / 2]} rotation={[0, sd * Math.PI / 2, 0]} material={M('#3B2F6B', 0.5)}><planeGeometry args={[z1 - z0, 0.18]} /></mesh>))}
      {/* end walls with gangway doors */}
      {[-1, 1].map((e) => <group key={e} position={[0, 0, e * HALF_L]}>
        {[-1, 1].map((sd) => <Box key={sd} p={[sd * 0.95, 1.07, 0]} s={[1.0, 2.15, 0.08]} m={m.wall} />)}
        <Box p={[0, 2.05, 0]} s={[0.9, 0.2, 0.08]} m={m.wall} />
        <Box p={[0, 0.98, 0]} s={[0.9, 1.96, 0.04]} m={m.steel} />
        <mesh position={[0, 1.35, -e * 0.025]} rotation={[0, e > 0 ? Math.PI : 0, 0]} material={m.glass}><planeGeometry args={[0.6, 0.8]} /></mesh>
        {!lite && <mesh position={[0.62, 1.9, -e * 0.05]} rotation={[0, e > 0 ? Math.PI : 0, 0]} material={M('#ffffff', 0.5, 0, {map: tx.carNo}, 'carNo')}><planeGeometry args={[0.36, 0.18]} /></mesh>}
      </group>)}
      {!lite && <>
        <mesh position={[-HALF_W + 0.07, 1.3, -0.9]} rotation={[0, Math.PI / 2, 0]} material={M('#ffffff', 0.6, 0, {map: tx.intercom}, 'icM')}><planeGeometry args={[0.2, 0.3]} /></mesh>
        <group position={[HALF_W - 0.07, 1.15, 0.92]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh material={M('#ffffff', 0.6, 0, {map: tx.lever}, 'lvM')}><planeGeometry args={[0.24, 0.24]} /></mesh>
          <mesh position={[0, -0.01, 0.03]} rotation={[0, 0, 0.4 - st.lever * 1.2]} material={M('#E8E8E8', 0.4, 0.4)}><boxGeometry args={[0.12, 0.03, 0.04]} /></mesh>
          <group position={[0, 0.12, 0.01]} rotation={[-st.lever * 1.6, 0, 0]}><mesh position={[0, -0.12, 0.05]} material={new THREE.MeshStandardMaterial({color: '#E8F2FF', roughness: 0.05, transparent: true, opacity: 0.25})}><boxGeometry args={[0.25, 0.25, 0.1]} /></mesh></group>
        </group>
      </>}
    </group>
  );
};


/** jagged rim of the broken W3 (glass teeth left in the frame) */
const BrokenEdge: React.FC<{zc: number; L: number}> = ({zc, L}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: '#AFC4D2', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.55, side: THREE.DoubleSide}), []);
  const teeth = useMemo(() => Array.from({length: 22}, (_, i) => {
    const edge = i % 4; const u = hash(i * 3.7);
    const h = 0.05 + hash(i * 1.3) * 0.16;
    return {edge, u, h, w: 0.06 + hash(i * 2.1) * 0.12};
  }), []);
  const H = WIN_Y1 - WIN_Y0, y0 = WIN_Y0;
  return <group position={[HALF_W - 0.01, 0, zc]}>{teeth.map((q, i) => {
    const pos: [number, number, number] = q.edge === 0 ? [0, y0 + q.h / 2, -L / 2 + q.u * L] : q.edge === 1 ? [0, y0 + H - q.h / 2, -L / 2 + q.u * L] : q.edge === 2 ? [0, y0 + q.u * H, -L / 2 + q.h / 2] : [0, y0 + q.u * H, L / 2 - q.h / 2];
    const shape = new THREE.Shape(); shape.moveTo(-q.w / 2, -q.h / 2); shape.lineTo(q.w / 2, -q.h / 2); shape.lineTo((hash(i) - 0.5) * q.w, q.h / 2); shape.closePath();
    const rot: [number, number, number] = [q.edge === 1 ? Math.PI : q.edge === 2 ? -Math.PI / 2 : q.edge === 3 ? Math.PI / 2 : 0, 0, 0];
    return <group key={i} position={pos} rotation={[0, -Math.PI / 2, 0]}><mesh rotation={[0, 0, rot[0]]} material={m}><shapeGeometry args={[shape]} /></mesh></group>;
  })}</group>;
};

/** glass shards on the bench and floor after W3 breaks (deterministic scatter) */
export const Shards: React.FC<{k?: number}> = ({k = 1}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: '#CFE0EC', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.8, side: THREE.DoubleSide}), []);
  const list = useMemo(() => Array.from({length: 140}, (_, i) => {
    const onBench = hash(i * 1.7) < 0.45;
    const z = W3[0] + 0.2 + hash(i * 2.3) * (W3[1] - W3[0] - 0.4);
    const x = onBench ? 0.98 + hash(i * 3.1) * 0.4 : 0.1 + hash(i * 4.7) * 0.85 * (0.4 + hash(i * 9.1) * 0.6);
    const y = onBench ? 0.437 : 0.004; const s = 0.012 + hash(i * 5.3) ** 2 * 0.05;
    return {x, y, z, s, r: hash(i * 6.1) * 6.28};
  }), []);
  return <group>{list.slice(0, Math.round(list.length * k)).map((q, i) => <mesh key={i} position={[q.x, q.y, q.z]} rotation={[-Math.PI / 2, 0, q.r]} material={m}><circleGeometry args={[q.s, 3]} /></mesh>)}</group>;
};

/**
 * Car lighting. Strips = soft key from above (+ one shadow-casting overhead light for contact shadows);
 * warm tunnel lamps sweep past outside the windows; emergency = low amber spots at bench level that throw long shadows across the floor.
 */
export const CarLights: React.FC<{st: CarState; lampZ: number[]}> = ({st, lampZ}) => {
  const L = st.light, E = st.emergency;
  const tg = useMemo(() => { const o = new THREE.Object3D(); o.position.set(0, 0, 1.5); return o; }, []);
  const eTg = useMemo(() => [new THREE.Object3D(), new THREE.Object3D()], []);
  eTg[0].position.set(0.3, 0, 6); eTg[1].position.set(-0.4, 0, -2);
  return <>
    <hemisphereLight args={['#E8F0FF', '#4A4E55', 0.75 * L]} />
    {/* night fill that never lets the car go pure black (blue-grey), stronger as the strips die */}
    <hemisphereLight args={['#6A7EA8', '#3A3F4A', 1.6 * (1 - L) + 0.1]} />
    <ambientLight intensity={0.05 + 0.12 * L} color="#BFD0E8" />
    <primitive object={tg} />
    <directionalLight target={tg} position={[0.2, 6, 1.6]} intensity={1.35 * L} color="#EEF4FF" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-near={1} shadow-camera-far={10} shadow-bias={-0.0006} shadow-radius={6} />
    {[-6, 0, 6].map((z) => <pointLight key={z} position={[0, 2.0, z]} intensity={1.6 * L} distance={7} decay={1.6} color="#EAF2FF" />)}
    {/* spill from the lit car through the window bands onto the tunnel wall (and onto anything pressed to the glass) */}
    {[-1, 1].flatMap((sd) => [-6, 0, 6].map((z) => <pointLight key={sd + '' + z} position={[sd * 2.05, 1.45, z]} intensity={0.55 * L + 0.05} distance={5} decay={1.8} color="#DCE6F5" />))}
    {/* tunnel lamps passing: warm sweeps through both window bands */}
    {lampZ.map((z, i) => <pointLight key={i} position={[(i % 2 ? 1 : -1) * 2.45, 1.7, z]} intensity={0.9 + 1.4 * (1 - L)} distance={5} decay={1.8} color="#FFC27A" />)}
    {E > 0.01 && <>
      {eTg.map((o, i) => <primitive key={'t' + i} object={o} />)}
      <spotLight target={eTg[0]} position={[-1.2, 0.32, -8.6]} angle={0.7} penumbra={0.5} intensity={70 * E} distance={30} decay={1.0} color="#FFB95A" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} />
      <spotLight target={eTg[1]} position={[1.2, 0.32, 8.6]} angle={0.7} penumbra={0.5} intensity={25 * E} distance={30} decay={1.0} color="#FFB95A" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0008} />
      {[-8.9, 8.9].map((z) => <mesh key={z} position={[z < 0 ? -1.2 : 1.2, 0.32, z]} material={MB('#FFD08A')}><boxGeometry args={[0.18, 0.06, 0.06]} /></mesh>)}
    </>}
    {/* green LED over each door (still lit when the power is out) */}
    {DOORS_Z.flatMap((z) => [-1, 1].map((sd) => <mesh key={z + '' + sd} position={[sd * (HALF_W - 0.06), DOOR_H + 0.03, z + 0.5]} material={MB('#3CFF7A')}><boxGeometry args={[0.02, 0.02, 0.06]} /></mesh>))}
    <sprite position={[0, CEIL - 0.06, 0]} scale={[0.01, 0.01, 0.01]}><spriteMaterial map={glowTex()} transparent opacity={0} /></sprite>
  </>;
};

/** the flicker driver: 2–3 stutters then a dip, deterministic. Returns light 0…1 for time u since the flicker started */
export const flicker = (u: number, len = 1.6, floor = 0.12) => {
  if (u < 0 || u > len + 0.5) return 1;
  const k = Math.floor(u * 22); const on = hash(k * 1.37) > (u < 0.5 ? 0.35 : 0.6);
  const env = 1 - smooth((u - len) / 0.5) * 0;
  const v = on ? 0.95 : floor + hash(k) * 0.1;
  return u > len ? floor + (1 - floor) * smooth((u - len) / 0.5) : v * env;
};
export const _keep = {clamp};
