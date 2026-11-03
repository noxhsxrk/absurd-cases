import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hash, smooth, clamp} from '../../lib/math';
import {tex, F, speckle, grime, M, MB, glowTex} from '../../lib/tex';

/**
 * Island-platform metro station in car-frame coordinates (our track at x = 0, car floor y = 0 = platform top, the line runs along z).
 * Bangkok-metro look: full-height platform screen doors (stainless frames, tinted glass, ad posters on the fixed panels) with a stainless
 * header band (blue direction signs with an orange arrow, exit pictograms, an orange accent line), polished terrazzo floor with yellow
 * boarding arrows and queue lines, a perforated metal ceiling with long light rows, granite columns with an orange band, round hanging
 * clocks, a black hanging exit sign with a yellow arrow, tilted TV screens, a granite stair with a steel-and-glass balustrade.
 * Platform x 1.62…9.4 (PSD both sides), opposite track x = 11, far wall x = 13, track-side wall behind our track x = -2.1.
 * `zero` = Station 0: same architecture, old and dim, lights out in places, faded ads, clocks stopped, nobody there but it is alive.
 */
export const PLAT = {x0: 1.62, x1: 9.4, psd: 1.62, psd2: 9.4, len: 150, opp: 11, far: 13, back: -2.1, ceil: 3.3, hdr: 2.25};
/** PSD openings line up with the train's doors (5.7 m apart, cars 19.6 m apart); fixed panels between them */
export const PSD_OPEN: number[] = []; for (let c = -3; c <= 3; c++) for (const d of [-5.7, 0, 5.7]) PSD_OPEN.push(c * 19.6 + d);
const PSD_FIX: [number, number][] = (() => { const z = [...PSD_OPEN].sort((a, b) => a - b), out: [number, number][] = []; for (let i = 0; i + 1 < z.length; i++) out.push([z[i] + 0.82, z[i + 1] - 0.82]); return out; })();

const texes = (ready: boolean, name: string, zero: boolean) => ({
  floor: tex('stFloor2' + zero, 512, 512, (g) => { g.fillStyle = zero ? '#8E8B84' : '#B9BCBE'; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 14000, zero ? ['#6E6B64', '#ABA79E', '#55524C', '#C4C0B6'] : ['#9EA2A5', '#D6D9DB', '#8A8E92', '#E8EAEC', '#7C7F82'], 0.25, 0.65, 1, 3);
    g.strokeStyle = zero ? 'rgba(60,56,48,.35)' : 'rgba(120,125,130,.4)'; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke(); if (zero) grime(g, 512, 512, 0.25, 0); }, [6, 120]),
  ceil: tex('stCeil2' + zero, 256, 256, (g) => { g.fillStyle = zero ? '#9C9890' : '#E2E4E4'; g.fillRect(0, 0, 256, 256); g.fillStyle = zero ? 'rgba(40,38,34,.35)' : 'rgba(80,84,88,.22)'; for (let y = 8; y < 248; y += 7) for (let x = 8 + ((y / 7) % 2) * 3; x < 248; x += 7) g.fillRect(x, y, 2, 2);
    g.fillStyle = '#5A5E62'; g.fillRect(0, 0, 256, 5); g.fillRect(0, 0, 5, 256); if (zero) speckle(g, 256, 256, 300, ['#6A665E'], 0.1, 0.3, 2, 9); }, [7, 110]),
  granite: tex('stGranite' + zero, 256, 512, (g) => { g.fillStyle = zero ? '#7E7A74' : '#9A9C9E'; g.fillRect(0, 0, 256, 512); speckle(g, 256, 512, 9000, ['#5A5C5E', '#C8CACC', '#3E4042', '#E2E2E0'], 0.3, 0.7, 1, 3);
    g.fillStyle = '#E8822A'; g.fillRect(0, 60, 256, 34); g.fillStyle = '#2A2C2E'; g.fillRect(0, 480, 256, 32); if (zero) grime(g, 256, 512, 0.35, 6, 2); }),
  header: tex('stHdr' + zero, 512, 256, (g) => { g.fillStyle = zero ? '#9EA0A0' : '#C6CACD'; g.fillRect(0, 0, 512, 256); for (let y = 0; y < 256; y++) { g.fillStyle = `rgba(255,255,255,${hash(y * 2.1) * 0.09})`; g.fillRect(0, y, 512, 1); }
    g.fillStyle = 'rgba(80,84,88,.5)'; g.fillRect(0, 0, 2, 256); g.fillStyle = '#E8822A'; g.fillRect(0, 0, 512, 14); if (zero) grime(g, 512, 256, 0.4, 8, 6); }, [30, 1]),
  dir: tex('stDir' + name + ready + zero, 1024, 300, (g) => { g.fillStyle = zero ? '#2A3A6A' : '#2340A0'; g.fillRect(0, 0, 1024, 300);
    g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(46, 60, 120, 120); if (!ready) return; g.fillStyle = '#fff'; g.font = F(700, 96); g.textAlign = 'center'; g.fillText('2', 106, 160); g.font = F(500, 26); g.fillText('ชานชาลา', 106, 222); g.fillText('Platform', 106, 254);
    g.textAlign = 'left'; g.font = F(700, 86); g.fillText(zero ? 'สถานีศูนย์' : 'ไปนิลกาฬใต้', 230, 140); g.fillStyle = '#F2A23A'; g.font = F(500, 50); g.fillText(zero ? 'Station 0' : 'To Nilakan Tai', 236, 220);
    g.fillStyle = '#F28C1E'; g.beginPath(); g.arc(900, 150, 76, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 16; g.beginPath(); g.moveTo(850, 150); g.lineTo(950, 150); g.moveTo(915, 110); g.lineTo(955, 150); g.lineTo(915, 190); g.stroke(); if (zero) grime(g, 1024, 300, 0.45, 10, 4); }),
  exitPic: tex('stExitPic', 256, 128, (g) => { g.fillStyle = '#1E2A22'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 9; g.beginPath(); g.moveTo(70, 64); g.lineTo(26, 64); g.moveTo(44, 42); g.lineTo(22, 64); g.lineTo(44, 86); g.stroke();
    g.strokeRect(96, 22, 64, 84); g.beginPath(); g.arc(130, 40, 7, 0, 7); g.fill(); g.lineWidth = 6; g.beginPath(); g.moveTo(128, 50); g.lineTo(122, 76); g.lineTo(134, 98); g.moveTo(122, 76); g.lineTo(112, 96); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.arc(214, 76, 22, 0, 7); g.stroke(); g.beginPath(); g.arc(206, 34, 7, 0, 7); g.fill(); }),
  ads: [0, 1, 2, 3].map((i) => tex('stAd2' + i + zero + ready, 512, 512, (g) => {
    const bgs = ['#DCEBFA', '#1F4AA8', '#F6EFE0', '#E7F6EE']; g.fillStyle = bgs[i]; g.fillRect(0, 0, 512, 512);
    if (ready) { g.textAlign = 'left';
      if (i === 0) { g.fillStyle = '#D8262E'; g.font = F(700, 230); g.fillText('0%', 30, 300); g.fillStyle = '#1F4AA8'; g.font = F(700, 46); g.fillText('ผ่อนสบาย 10 เดือน', 34, 380); g.font = F(400, 28); g.fillStyle = '#2A3448'; g.fillText('บัตรนิลกาฬพลัส', 36, 430); }
      if (i === 1) { g.fillStyle = '#fff'; g.font = F(700, 52); g.fillText('เงินสดพร้อมใช้', 30, 150); g.fillStyle = '#FFD15A'; g.font = F(700, 120); g.fillText('9.9%', 30, 300); g.fillStyle = '#fff'; g.font = F(400, 30); g.fillText('ต่อปี · ธนาคารสายนิล', 34, 360); }
      if (i === 2) { g.fillStyle = '#B8402E'; g.font = F(700, 58); g.fillText('ชานมไข่มุก', 30, 150); g.fillText('นิลกาฬ', 30, 220); g.fillStyle = '#5A4632'; g.font = F(400, 32); g.fillText('ซื้อ 1 แถม 1 ทุกศุกร์', 34, 290); g.fillStyle = '#C9A06A'; g.fillRect(330, 300, 120, 170); }
      if (i === 3) { g.fillStyle = '#2E6B47'; g.font = F(700, 56); g.fillText('กรุณาให้ผู้โดยสาร', 30, 160); g.fillText('ออกจากขบวนก่อน', 30, 230); g.fillStyle = '#3F5547'; g.font = F(400, 30); g.fillText('Please let passengers exit first', 34, 300); } }
    if (zero) { g.fillStyle = 'rgba(30,26,20,.55)'; g.fillRect(0, 0, 512, 512); grime(g, 512, 512, 0.5, 10, 8 + i); }
  })),
  arrows: tex('stArrows', 512, 256, (g) => { g.clearRect(0, 0, 512, 256); g.fillStyle = '#F2C21B';
    const arrow = (x: number, y: number, dir: number) => { g.save(); g.translate(x, y); g.scale(dir, 1); g.beginPath(); g.moveTo(-40, -10); g.lineTo(10, -10); g.lineTo(10, -28); g.lineTo(44, 0); g.lineTo(10, 28); g.lineTo(10, 10); g.lineTo(-40, 10); g.closePath(); g.fill(); g.restore(); };
    arrow(256, 70, 1); arrow(256, 130, -1); arrow(256, 190, 1);
    g.fillRect(40, 20, 10, 216); g.fillRect(40, 20, 90, 10); g.fillRect(462, 20, 10, 216); g.fillRect(382, 20, 90, 10); }),
  clock: tex('stClock', 256, 256, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#1A1A1A'; g.lineWidth = 10; g.stroke(); g.fillStyle = '#1A1A1A'; for (let i = 0; i < 60; i++) { g.save(); g.translate(128, 128); g.rotate(i / 60 * Math.PI * 2); g.fillRect(-(i % 5 ? 1.5 : 4), -112, i % 5 ? 3 : 8, i % 5 ? 10 : 22); g.restore(); } }),
  exitHang: tex('stExitH' + ready, 768, 256, (g) => { g.fillStyle = '#16171A'; g.fillRect(0, 0, 768, 256); if (!ready) return; g.fillStyle = '#fff'; g.font = F(700, 96); g.textAlign = 'left'; g.fillText('ทางออก', 40, 130); g.fillStyle = '#F2C21B'; g.font = F(600, 64); g.fillText('Exit', 116, 218);
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(420, 64, 110, 130); g.fillStyle = '#F2C21B'; g.beginPath(); g.arc(650, 128, 80, 0, 7); g.fill(); g.strokeStyle = '#16171A'; g.lineWidth = 18; g.beginPath(); g.moveTo(615, 165); g.lineTo(685, 95); g.moveTo(640, 92); g.lineTo(688, 92); g.lineTo(688, 140); g.stroke(); }),
  tv: tex('stTv' + zero, 512, 288, (g) => { const gr = g.createLinearGradient(0, 0, 512, 288); gr.addColorStop(0, zero ? '#101820' : '#0E3A8A'); gr.addColorStop(1, zero ? '#05080C' : '#3A7BD5'); g.fillStyle = gr; g.fillRect(0, 0, 512, 288); if (!zero) { g.fillStyle = '#7CF2C0'; g.beginPath(); g.moveTo(180, 90); g.lineTo(330, 70); g.lineTo(350, 190); g.lineTo(190, 210); g.closePath(); g.fill(); } }),
  backWall: tex('stBack' + zero, 512, 512, (g) => { g.fillStyle = zero ? '#3A3A38' : '#4A4E52'; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 3000, ['#3A3E42', '#5A5E62'], 0.2, 0.4, 1, 4); g.fillStyle = 'rgba(0,0,0,.3)'; for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 3, 512); grime(g, 512, 512, 0.4, 10, 3); }, [20, 1]),
});

const B: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => <mesh position={p} rotation={r} material={m} castShadow receiveShadow><boxGeometry args={s} /></mesh>;

/** one line of platform screen doors at x = `x`, facing the platform interior on side `face` (+1 = platform at +x) */
const PsdLine: React.FC<{x: number; face: 1 | -1; open: number; m: any; T: ReturnType<typeof texes>; zero: boolean}> = ({x, face, open, m, T, zero}) => (
  <group>
    {/* header band up to the ceiling with direction signs, exit pictograms */}
    <mesh position={[x + face * 0.06, (PLAT.hdr + PLAT.ceil) / 2, 0]} rotation={[0, face > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={m.header}><planeGeometry args={[PLAT.len, PLAT.ceil - PLAT.hdr]} /></mesh>
    <B p={[x, PLAT.hdr - 0.03, 0]} s={[0.16, 0.08, PLAT.len]} m={m.frame} />
    {[-50, -30, -10, 10, 30, 50].map((zz) => <mesh key={zz} position={[x + face * 0.07, 2.72, zz]} rotation={[0, face > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={m.dir}><planeGeometry args={[2.1, 0.62]} /></mesh>)}
    {[-40, -20, 0, 20, 40].map((zz) => <mesh key={'e' + zz} position={[x + face * 0.07, 2.72, zz + 2.85]} rotation={[0, face > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={m.exitPic}><planeGeometry args={[0.5, 0.25]} /></mesh>)}
    {/* openings: posts + sliding glass leaves */}
    {PSD_OPEN.map((zz) => <group key={zz}>
      {[-1, 1].map((d) => <B key={'p' + d} p={[x, 1.1, zz + d * 0.8]} s={[0.12, 2.2, 0.07]} m={m.frame} />)}
      {[-1, 1].map((d) => <group key={d} position={[x, 1.08, zz + d * (0.385 + open * 0.76)]}>
        <mesh material={m.glassD}><boxGeometry args={[0.03, 2.14, 0.77]} /></mesh>
        {[[0, 1.06, 0.77, 0.04], [0, -1.06, 0.77, 0.04], [-d * 0.37, 0, 0.03, 2.14], [d * 0.37, 0, 0.03, 2.14]].map(([zo, yo, w, h], i) => <B key={i} p={[0, yo, zo]} s={[0.04, h, w]} m={m.frame} />)}
        <B p={[0, -0.1, 0]} s={[0.035, 0.05, 0.75]} m={m.frame} />
      </group>)}
    </group>)}
    {/* fixed panels: tinted glass above, ad poster below, stainless mullions */}
    {PSD_FIX.map(([z0, z1], i) => { const n = Math.max(1, Math.round((z1 - z0) / 1.25)), w = (z1 - z0) / n; return <group key={'f' + i}>
      {Array.from({length: n}, (_, k) => { const zc = z0 + w * (k + 0.5); const ad = (i * 3 + k) % 5; return <group key={k}>
        <mesh position={[x, 1.55, zc]} material={m.glassD}><boxGeometry args={[0.03, 1.3, w - 0.06]} /></mesh>
        <mesh position={[x, 0.48, zc]} material={m.glassD}><boxGeometry args={[0.03, 0.86, w - 0.06]} /></mesh>
        {ad < 4 && <mesh position={[x + face * 0.02, 0.5, zc]} rotation={[0, face > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={m.ads[ad]}><planeGeometry args={[w - 0.12, 0.78]} /></mesh>}
        <B p={[x, 0.93, zc]} s={[0.06, 0.05, w]} m={m.frame} />
        <B p={[x, 1.1, z0 + w * k]} s={[0.08, 2.2, 0.05]} m={m.frame} />
      </group>; })}
    </group>; })}
    {/* tactile strip + yellow boarding arrows and queue lines at every opening */}
    <mesh position={[x + face * 0.5, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.tactile} receiveShadow><planeGeometry args={[0.3, PLAT.len]} /></mesh>
    {!zero && PSD_OPEN.map((zz) => <mesh key={'a' + zz} position={[x + face * 1.25, 0.012, zz]} rotation={[-Math.PI / 2, 0, face > 0 ? -Math.PI / 2 : Math.PI / 2]} material={m.arrows}><planeGeometry args={[2.0, 1.0]} /></mesh>)}
    {zero && PSD_OPEN.map((zz) => <mesh key={'a' + zz} position={[x + face * 1.25, 0.012, zz]} rotation={[-Math.PI / 2, 0, face > 0 ? -Math.PI / 2 : Math.PI / 2]} material={m.arrowsOld}><planeGeometry args={[2.0, 1.0]} /></mesh>)}
  </group>
);

/** a round station clock hanging on a rod, two faces */
const Clock: React.FC<{p: [number, number, number]; sec: number; m: any}> = ({p, sec, m}) => {
  const hA = -(sec / 43200) * Math.PI * 2, mA = -((sec % 3600) / 3600) * Math.PI * 2;
  return <group position={p}>
    <mesh position={[0, 0.35, 0]} material={m.frame}><cylinderGeometry args={[0.012, 0.012, 0.5, 6]} /></mesh>
    <mesh rotation={[0, 0, Math.PI / 2]} material={m.dark}><cylinderGeometry args={[0.2, 0.2, 0.06, 28]} /></mesh>
    {[1, -1].map((s) => <group key={s} position={[s * 0.032, 0, 0]} rotation={[0, s * Math.PI / 2, 0]}>
      <mesh material={m.clock}><circleGeometry args={[0.19, 28]} /></mesh>
      <mesh position={[0, 0, 0.004]} rotation={[0, 0, s * hA]}><planeGeometry args={[0.018, 0.2]} /><meshBasicMaterial color="#111" /></mesh>
      <mesh position={[0, 0, 0.006]} rotation={[0, 0, s * mA]}><planeGeometry args={[0.012, 0.3]} /><meshBasicMaterial color="#111" /></mesh>
    </group>)}
  </group>;
};

export const Platform: React.FC<{z: number; t: number; name: string; zero?: boolean; open?: number; ready: boolean; flick?: number; clock?: number}> = ({z, t, name, zero = false, open = 0, ready, flick = 1, clock = 13 * 60}) => {
  const T = useMemo(() => texes(ready, name, zero), [ready, name, zero]);
  const m = useMemo(() => ({
    floor: new THREE.MeshStandardMaterial({map: T.floor, roughness: zero ? 0.5 : 0.16, metalness: 0.06}), ceil: M('#ffffff', 0.75, 0.2, {map: T.ceil}, 'cl2' + zero),
    granite: M('#ffffff', 0.35, 0, {map: T.granite}, 'gr' + zero), header: M('#ffffff', 0.32, 0.6, {map: T.header}, 'hdr' + zero),
    frame: M(zero ? '#9A9C9C' : '#C3C9CE', 0.28, 0.8), dark: M('#22252B', 0.6), bed: M('#4A4844', 0.95), rail: M('#8A8E92', 0.3, 0.8), tactile: M(zero ? '#7E7A70' : '#9A9EA2', 0.7),
    glassD: new THREE.MeshStandardMaterial({color: '#1A2026', roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.5, depthWrite: false}),
    dir: M('#ffffff', 0.5, 0, {map: T.dir, emissive: '#ffffff', emissiveMap: T.dir, emissiveIntensity: zero ? 0.2 : 0.45}, 'dir' + name + ready + zero),
    exitPic: M('#ffffff', 0.5, 0, {map: T.exitPic, emissive: '#ffffff', emissiveMap: T.exitPic, emissiveIntensity: 0.4}, 'exP'),
    ads: T.ads.map((a, i) => M('#ffffff', 0.4, 0, {map: a, emissive: '#ffffff', emissiveMap: a, emissiveIntensity: zero ? 0.12 : 0.35}, 'stad' + i + zero + ready)),
    arrows: new THREE.MeshStandardMaterial({map: T.arrows, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, roughness: 0.4}),
    arrowsOld: new THREE.MeshStandardMaterial({map: T.arrows, transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, roughness: 0.6}),
    clock: MB('#ffffff', 'clk'), exitHang: MB('#ffffff', 'exh' + ready), tv: MB('#ffffff', 'tv' + zero),
    back: M('#ffffff', 0.8, 0, {map: T.backWall}, 'bk' + zero),
  }), [T, zero, name, ready]);
  m.clock.map = T.clock; m.exitHang.map = T.exitHang; m.tv.map = T.tv;
  const lightM = useMemo(() => new THREE.MeshStandardMaterial({color: '#FFFFFF', emissive: zero ? '#FFE6B8' : '#F2F6FF', emissiveIntensity: 1.6}), [zero]);
  lightM.emissiveIntensity = (zero ? 0.9 : 1.6) * flick;
  const L = PLAT.len, h = PLAT.ceil;
  const cols = Array.from({length: 16}, (_, i) => -67.5 + i * 9);
  const clockSec = zero ? 0 : clock;
  const esc = (t * 0.45) % 0.4;
  return (
    <group position={[0, 0, z]}>
      {/* track beds */}
      <B p={[0, -1.15, 0]} s={[3.2, 0.1, L]} m={m.bed} />
      <B p={[PLAT.opp, -1.15, 0]} s={[3.2, 0.1, L]} m={m.bed} />
      {[-0.72, 0.72].map((x) => <B key={x} p={[x, -1.03, 0]} s={[0.07, 0.14, L]} m={m.rail} />)}
      {[-0.72, 0.72].map((x) => <B key={'o' + x} p={[PLAT.opp + x, -1.03, 0]} s={[0.07, 0.14, L]} m={m.rail} />)}
      {/* track-side walls */}
      <mesh position={[PLAT.back, h / 2 - 0.6, 0]} rotation={[0, Math.PI / 2, 0]} material={m.back} receiveShadow><planeGeometry args={[L, h + 1.2]} /></mesh>
      <mesh position={[PLAT.far, h / 2 - 0.6, 0]} rotation={[0, -Math.PI / 2, 0]} material={m.back} receiveShadow><planeGeometry args={[L, h + 1.2]} /></mesh>
      {/* platform slab + polished terrazzo */}
      <B p={[(PLAT.x0 + PLAT.x1) / 2, -0.58, 0]} s={[PLAT.x1 - PLAT.x0, 1.1, L]} m={m.dark} />
      <mesh position={[(PLAT.x0 + PLAT.x1) / 2, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.floor} receiveShadow><planeGeometry args={[PLAT.x1 - PLAT.x0, L]} /></mesh>
      <PsdLine x={PLAT.psd} face={1} open={open} m={m} T={T} zero={zero} />
      <PsdLine x={PLAT.psd2} face={-1} open={0} m={m} T={T} zero={zero} />
      {/* granite columns with an orange band, benches, bins */}
      {cols.map((zz, i) => <group key={zz}>
        <B p={[5.5, h / 2, zz]} s={[0.75, h, 0.75]} m={m.granite} />
        {i % 2 === 0 && <><B p={[4.6, 0.44, zz + 2.4]} s={[0.42, 0.05, 1.8]} m={m.frame} /><B p={[4.8, 0.66, zz + 2.4]} s={[0.04, 0.4, 1.8]} m={m.frame} />{[-0.8, 0.8].map((o) => <B key={o} p={[4.6, 0.22, zz + 2.4 + o]} s={[0.36, 0.44, 0.05]} m={m.frame} />)}</>}
        {i % 3 === 1 && <B p={[5.5, 0.4, zz + 0.62]} s={[0.36, 0.8, 0.36]} m={M(zero ? '#5A5446' : '#8A9096', 0.4, 0.5)} />}
        <Clock p={[5.5, 2.6, zz + 4.5]} sec={clockSec} m={m} />
      </group>)}
      {/* ceiling: perforated metal + long light rows along both PSD lines and down the middle */}
      <mesh position={[(PLAT.back + PLAT.far) / 2, h, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.ceil}><planeGeometry args={[PLAT.far - PLAT.back, L]} /></mesh>
      {[2.35, 4.3, 6.7, 8.65].map((x, j) => Array.from({length: 30}, (_, i) => -72 + i * 5).map((zz, i) => <mesh key={x + '_' + zz} position={[x, h - 0.025, zz]} material={zero && hash(i * 3.1 + j) > 0.68 ? M('#3A3832', 0.6) : lightM}><boxGeometry args={[j === 0 || j === 3 ? 0.35 : 0.14, 0.03, 4.6]} /></mesh>))}
      {/* hanging exit signs + tilted TV screens */}
      {[-24, 6, 36].map((zz) => <group key={'ex' + zz} position={[5.5, 2.75, zz]}>
        {[-0.4, 0.4].map((o) => <mesh key={o} position={[0, 0.28, o]} material={m.frame}><cylinderGeometry args={[0.01, 0.01, 0.5, 6]} /></mesh>)}
        <B p={[0, 0, 0]} s={[0.08, 0.38, 1.15]} m={m.dark} />
        {[1, -1].map((s) => <mesh key={s} position={[s * 0.042, 0, 0]} rotation={[0, s * Math.PI / 2, 0]} material={m.exitHang}><planeGeometry args={[1.1, 0.36]} /></mesh>)}
      </group>)}
      {[-14, 16, 46].map((zz) => <group key={'tv' + zz} position={[2.4, 2.55, zz]} rotation={[0, 0, -0.35]}>
        <mesh position={[0.15, 0.3, 0]} material={m.frame}><cylinderGeometry args={[0.012, 0.012, 0.5, 6]} /></mesh>
        <B p={[0, 0, 0]} s={[0.06, 0.62, 1.05]} m={m.dark} />
        <mesh position={[0.032, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={m.tv}><planeGeometry args={[0.98, 0.55]} /></mesh>
      </group>)}
      {/* stair up (granite steps, steel + glass balustrade) and an escalator, off-centre at z ≈ +24 */}
      <group position={[0, 0, 24]}>
        {Array.from({length: 18}, (_, i) => <B key={'s' + i} p={[7.6, 0.18 * i + 0.09, -4.6 + i * 0.4]} s={[1.6, 0.18, 0.4]} m={m.granite} />)}
        {Array.from({length: 18}, (_, i) => <B key={i} p={[5.9, 0.18 * i + 0.09 - esc * 0.45, -4.6 + i * 0.4 + esc]} s={[1.0, 0.04, 0.38]} m={m.frame} />)}
        <B p={[6.8, 1.6, -0.2]} s={[0.25, 3.2, 8.2]} m={m.granite} r={[0, 0, 0]} />
        {/* soffit under the stair and the escalator truss, so nothing reads as floating steps */}
        <B p={[7.6, 1.42, -1.2]} s={[1.62, 0.12, 7.6]} m={m.granite} r={[-0.42, 0, 0]} />
        <B p={[5.9, 1.38, -1.2]} s={[1.1, 0.3, 7.6]} m={m.frame} r={[-0.42, 0, 0]} />
        <B p={[8.42, 1.25, -1.2]} s={[0.06, 1.6, 7.6]} m={m.granite} r={[-0.42, 0, 0]} />
        {[5.3, 6.5, 8.5].map((x) => <group key={x} position={[x, 1.65, -0.2]} rotation={[-0.42, 0, 0]}>
          <Rod3 m={m.frame} /><mesh position={[0, -0.45, 0]} material={m.glassD}><boxGeometry args={[0.02, 0.9, 7.9]} /></mesh>
        </group>)}
      </group>
      {/* station lights */}
      {[-40, -10, 20, 50].map((zz) => <pointLight key={zz} position={[5.5, 3.0, zz]} intensity={(zero ? 3 : 14) * flick} distance={26} decay={1.3} color={zero ? '#FFE0B0' : '#F2F6FF'} />)}
      {zero && <StationLife t={t} />}
    </group>
  );
};
const Rod3: React.FC<{m: THREE.Material}> = ({m}) => <mesh rotation={[Math.PI / 2, 0, 0]} material={m}><cylinderGeometry args={[0.025, 0.025, 7.9, 8]} /></mesh>;


/** Station 0's own life: moths at the lights, a paper cup rolling in the draft, a vending machine humming and lighting up, a CCTV dome turning */
const StationLife: React.FC<{t: number}> = ({t}) => {
  const g = glowTex();
  const moths = Array.from({length: 14}, (_, i) => { const lz = -21 + (i % 4) * 6, lx = i % 2 ? 3.2 : 7.6, a = t * (3 + hash(i) * 3) + i, r = 0.25 + hash(i * 3) * 0.3;
    return [lx + Math.cos(a) * r, 3.45 - hash(i * 5) * 0.4 + Math.sin(a * 1.7) * 0.08, lz + Math.sin(a) * r] as [number, number, number]; });
  const cupZ = -6 + ((t * 0.55) % 14), cupR = t * 3.2;
  const vend = 0.6 + 0.4 * Math.max(0, Math.sin(t * 0.7)) * (hash(Math.floor(t * 8)) > 0.2 ? 1 : 0.3);
  return <group>
    {moths.map((p, i) => <mesh key={i} position={p} material={MB('#E8DCC0')}><planeGeometry args={[0.025, 0.018]} /></mesh>)}
    <group position={[3.0, 0.035, cupZ]} rotation={[cupR, 0, Math.PI / 2]}><mesh material={M('#F2EEE6', 0.7)} castShadow><cylinderGeometry args={[0.035, 0.028, 0.09, 10, 1, true]} /></mesh></group>
    <group position={[8.6, 0.9, 10]}>
      <mesh material={M('#7A2E2E', 0.5)} castShadow><boxGeometry args={[0.7, 1.8, 0.8]} /></mesh>
      <mesh position={[-0.36, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]} material={new THREE.MeshStandardMaterial({color: '#DDEBFF', emissive: '#BFD8FF', emissiveIntensity: vend})}><planeGeometry args={[0.6, 1.0]} /></mesh>
      <sprite position={[-0.5, 0.2, 0]} scale={[1.6, 1.8, 1]}><spriteMaterial map={g} color="#BFD8FF" transparent opacity={0.25 * vend} blending={THREE.AdditiveBlending} depthWrite={false} /></sprite>
    </group>
    <group position={[2.4, PLAT.ceil - 0.1, 2]} rotation={[0, Math.sin(t * 0.4) * 0.9, 0]}>
      <mesh material={M('#1A1C20', 0.3)}><sphereGeometry args={[0.1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></mesh>
      <mesh position={[0, -0.06, -0.06]} material={MB('#FF3030')}><sphereGeometry args={[0.01, 6, 4]} /></mesh>
    </group>
  </group>;
};

/** an exterior car shell (stainless body, violet stripe, lit windows) for trains seen from outside */
export const TrainShell: React.FC<{z: number; x?: number; cars?: number; lit?: number}> = ({z, x = PLAT.opp, cars = 4, lit = 1}) => {
  const body = M('#C3C9CF', 0.35, 0.6), stripe = M('#3B2F6B', 0.5), win = useMemo(() => new THREE.MeshStandardMaterial({color: '#DCE8F2', emissive: '#E8F0FF', emissiveIntensity: 1.2}), []);
  win.emissiveIntensity = 1.2 * lit;
  return <group position={[x, 0, z]}>{Array.from({length: cars}, (_, c) => <group key={c} position={[0, 0, c * 19.6]}>
    <B p={[0, 0.95, 0]} s={[2.9, 2.9, 19]} m={body} />
    {[-1, 1].map((sd) => <group key={sd}>
      <mesh position={[sd * 1.455, 0.55, 0]} rotation={[0, sd * Math.PI / 2, 0]} material={stripe}><planeGeometry args={[19, 0.18]} /></mesh>
      {[-7.6, -2.85, 2.85, 7.6].map((zz) => <mesh key={zz} position={[sd * 1.456, 1.4, zz]} rotation={[0, sd * Math.PI / 2, 0]} material={win}><planeGeometry args={[3.2, 0.85]} /></mesh>)}
      {[-5.7, 0, 5.7].map((zz) => <mesh key={'d' + zz} position={[sd * 1.457, 1.0, zz]} rotation={[0, sd * Math.PI / 2, 0]} material={M('#9AA2AA', 0.35, 0.6)}><planeGeometry args={[1.3, 1.95]} /></mesh>)}
    </group>)}
  </group>)}</group>;
};
export const _k = {smooth, clamp};
