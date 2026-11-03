import React, {useMemo} from 'react';
import * as THREE from 'three';
import {FURN, COLS, ROWS, DESK, DOOR, SWITCH, PA, SEAT, TON_SEAT, BARRICADE, Furn} from './layout';
import {hash, smooth, clamp} from '../../lib/math';
import {Exterior} from './Exterior';

/** Classroom ม.5/3, ห้อง 325 — eye-level set in the kit's canvas-texture style. Pure function of its props. */
const CEIL = 3.0, W = 4.2, D = 5;
type V3 = [number, number, number];
const M: React.FC<{p?: V3; s: V3; c: string; r?: V3; rough?: number; metal?: number; e?: string; ei?: number; o?: number; map?: THREE.Texture; shadow?: boolean}> = ({p = [0, 0, 0], s, c, r, rough = 0.8, metal = 0, e, ei = 1, o = 1, map, shadow = true}) => (
  <mesh position={p} rotation={r} castShadow={shadow && o === 1} receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={rough} metalness={metal} emissive={e ?? '#000'} emissiveIntensity={e ? ei : 0} transparent={o < 1} opacity={o} map={map ?? null} depthWrite={o === 1} /></mesh>
);
import {canvasTex} from '../../lib/tex';
export {canvasTex};
const FONT = (w: number, px: number) => `${w} ${px}px Prompt, sans-serif`;

export type ClassState = {t: number; gun?: number; lightsK: number; clock: number; phonesRed: number; desks: Record<string, {x: number; z: number; yaw: number}>; handle: number; shadow: number; dust: number; fanK: number;
  /** EP2+: door swing (rad, + opens outward into the corridor) and thumbturn (0 locked … 1 open); `real` = a modelled corridor outside, so no painted backdrop and no window exterior (the episode brings its own) */
  doorAng?: number; turn?: number; real?: boolean};

const StudentDesk: React.FC<{x: number; z: number; yaw?: number; i: number; tex: Record<string, THREE.Texture>; phoneRed: number; empty?: boolean; mine?: boolean}> = ({x, z, yaw = 0, i, tex, phoneRed, empty, mine}) => {
  const h = (k: number) => hash(i * 7.1 + k);
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <M p={[0, DESK.h - 0.015, 0]} s={[DESK.w, 0.03, DESK.d]} c="#C9A878" rough={0.55} map={tex.wood} />
      <M p={[0, DESK.h - 0.11, 0.02]} s={[DESK.w - 0.06, 0.12, DESK.d - 0.08]} c="#8E949C" rough={0.6} metal={0.3} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], k) => <M key={k} p={[a * (DESK.w / 2 - 0.03), (DESK.h - 0.05) / 2, b * (DESK.d / 2 - 0.03)]} s={[0.025, DESK.h - 0.05, 0.025]} c="#5E646C" metal={0.5} rough={0.4} />)}
      {/* notebook + pen + pencil case + phone (screen glows red after the alert) */}
      {empty && <group position={[0.02, DESK.h, 0.02]} rotation={[0, 0.25, 0]}>{/* Ton's things: bag left on the desk, notebook still open */}
        <M p={[0, 0.17, 0]} s={[0.32, 0.34, 0.15]} c="#2C3550" rough={0.85} /><M p={[0, 0.12, 0.08]} s={[0.24, 0.16, 0.03]} c="#3A4566" rough={0.85} /><M p={[0, 0.355, 0]} s={[0.2, 0.03, 0.03]} c="#1D2236" />
        <M p={[-0.17, 0.004, 0.16]} s={[0.21, 0.008, 0.29]} c="#F6F4EE" rough={0.9} r={[0, -0.5, 0]} map={tex.page} shadow={false} /></group>}
      {!empty && <>
        <M p={[-0.08 + h(1) * 0.05, DESK.h + 0.004, 0.02]} s={[0.21, 0.008, 0.29]} c="#F6F4EE" rough={0.9} r={[0, (h(2) - 0.5) * 0.4, 0]} map={tex.page} shadow={false} />
        {h(3) > 0.3 && <M p={[0.2, DESK.h + 0.018, -0.12]} s={[0.18, 0.035, 0.06]} c={['#2E4E7A', '#B33A3A', '#E2B842', '#3E7A55', '#6A4C93'][i % 5]} rough={0.8} r={[0, h(4), 0]} />}
        {h(5) > 0.2 && !mine && <group position={[0.2 - h(6) * 0.08, DESK.h + 0.006, 0.12]} rotation={[0, (h(7) - 0.5) * 0.8, 0]}>
          <M s={[0.072, 0.009, 0.15]} c="#16181D" rough={0.3} shadow={false} />
          <mesh position={[0, 0.0048, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.064, 0.14]} /><meshBasicMaterial color={phoneRed > 0.02 ? '#FF4B3E' : '#1C2027'} toneMapped={false} transparent opacity={0.35 + 0.65 * Math.max(phoneRed, 0.15)} /></mesh>
        </group>}
      </>}
    </group>
  );
};
const Chair: React.FC<{x: number; z: number; yaw?: number; bag?: boolean}> = ({x, z, yaw = Math.PI, bag}) => (
  <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
    <M p={[0, 0.44, 0]} s={[0.4, 0.025, 0.38]} c="#B08A5C" rough={0.6} />
    <M p={[0, 0.76, -0.19]} s={[0.38, 0.2, 0.02]} c="#B08A5C" rough={0.6} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], k) => <M key={k} p={[a * 0.17, 0.22, b * 0.16]} s={[0.022, 0.44, 0.022]} c="#5E646C" metal={0.5} rough={0.4} />)}
    {[-1, 1].map((a) => <M key={a} p={[a * 0.17, 0.6, -0.19]} s={[0.022, 0.34, 0.022]} c="#5E646C" metal={0.5} rough={0.4} />)}
    {bag && <group position={[0, 0.62, -0.26]}><M s={[0.32, 0.38, 0.14]} c="#2C3550" rough={0.85} /><M p={[0, -0.05, 0.075]} s={[0.24, 0.18, 0.03]} c="#3A4566" rough={0.85} /><M p={[0, 0.19, 0]} s={[0.22, 0.03, 0.03]} c="#1D2236" /></group>}
  </group>
);

export const Classroom: React.FC<{st: ClassState}> = ({st}) => {
  const {t, lightsK, clock, phonesRed, desks, handle, shadow, dust, fanK, doorAng = 0, turn = 0, real = false} = st;
  const tex = useMemo(() => {
    const floor = canvasTex(256, 256, (g) => { g.fillStyle = '#D8D2C6'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(${hash(k) > 0.5 ? '90,84,74' : '255,255,250'},${0.05 + hash(k * 1.7) * 0.1})`; g.fillRect(hash(k * 2.3) * 256, hash(k * 4.1) * 256, 2, 2); } g.strokeStyle = 'rgba(120,112,100,0.35)'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256); }, [14, 17]);
    const ceiling = canvasTex(256, 256, (g) => { g.fillStyle = '#F2F0EB'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 700; k++) { g.fillStyle = `rgba(150,145,135,${0.06 + hash(k) * 0.1})`; g.fillRect(hash(k * 2.1) * 256, hash(k * 3.7) * 256, 1.5, 1.5); } g.strokeStyle = '#CFCAC0'; g.lineWidth = 5; g.strokeRect(0, 0, 256, 256); }, [7, 8]);
    const wood = canvasTex(128, 64, (g) => { g.fillStyle = '#C9A878'; g.fillRect(0, 0, 128, 64); for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(120,85,50,${0.08 + hash(k) * 0.12})`; g.lineWidth = 1 + hash(k * 3) * 2; g.beginPath(); const y = hash(k * 1.9) * 64; g.moveTo(0, y); g.bezierCurveTo(40, y + 4, 80, y - 4, 128, y + 2); g.stroke(); } });
    const page = canvasTex(64, 96, (g) => { g.fillStyle = '#F6F4EE'; g.fillRect(0, 0, 64, 96); g.strokeStyle = 'rgba(80,110,170,0.35)'; for (let y = 10; y < 96; y += 7) { g.beginPath(); g.moveTo(4, y); g.lineTo(60, y); g.stroke(); } g.fillStyle = 'rgba(40,50,90,0.6)'; for (let k = 0; k < 8; k++) g.fillRect(6, 12 + k * 7, 18 + hash(k) * 34, 2); });
    const board = canvasTex(1440, 480, (g) => {
      g.fillStyle = '#FBFBF8'; g.fillRect(0, 0, 1440, 480);
      g.fillStyle = '#1F3F8F'; g.font = FONT(700, 46); g.fillText('บทที่ 2  การเคลื่อนที่แนวตรง', 60, 80);
      g.fillStyle = '#1C1C22'; g.font = FONT(600, 54);
      g.fillText('v = u + at', 80, 180); g.fillText('s = ut + ½at²', 80, 270); g.fillText('v² = u² + 2as', 80, 360);
      g.fillStyle = '#B3262E'; g.font = FONT(600, 40); g.fillText('ตัวอย่าง: รถออกตัวจากหยุดนิ่ง a = 2 m/s²', 640, 180);
      g.fillStyle = '#1C1C22'; g.font = FONT(400, 40); g.fillText('t = 5 s  →  v = ?', 640, 250); g.fillText('v = 0 + (2)(5) = 10 m/s', 640, 320);
      g.strokeStyle = '#1C1C22'; g.lineWidth = 4; g.beginPath(); g.moveTo(640, 352); g.lineTo(1060, 352); g.stroke();
      g.fillStyle = '#2E6B3E'; g.font = FONT(400, 34); g.fillText('การบ้าน: แบบฝึกหัด 2.3 ข้อ 1–5', 640, 430);
    });
    const sign = canvasTex(512, 160, (g) => { g.fillStyle = '#1F3F8F'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = FONT(700, 70); g.fillText('ห้อง 325', 256, 82); g.font = FONT(400, 34); g.fillText('ม.5/3', 256, 132); });
    const notice = canvasTex(512, 320, (g) => { g.fillStyle = '#A0693E'; g.fillRect(0, 0, 512, 320); g.fillStyle = '#8B5A33'; g.fillRect(10, 10, 492, 300);
      const cards: [number, number, number, number, string, string][] = [[30, 30, 150, 110, '#FFF6C9', 'เวรทำความสะอาด'], [200, 26, 130, 160, '#FFFFFF', 'ตารางสอน'], [350, 40, 135, 100, '#D7F0FF', 'กีฬาสี'], [40, 170, 140, 120, '#FFE1E1', 'ซ้อมหนีไฟ'], [210, 200, 120, 95, '#E6FFE0', 'ชมรม'], [350, 160, 135, 130, '#FFFFFF', 'ประกาศ']];
      cards.forEach(([x, y, w, h, c, s], k) => { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate((hash(k) - 0.5) * 0.1); g.fillStyle = c; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = '#C0392B'; g.beginPath(); g.arc(0, -h / 2 + 8, 5, 0, 7); g.fill(); g.fillStyle = '#333'; g.font = FONT(600, 20); g.textAlign = 'center'; g.fillText(s, 0, -h / 2 + 34); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let l = 0; l < 4; l++) g.fillRect(-w / 2 + 12, -h / 2 + 50 + l * 14, w - 24 - hash(k + l) * 30, 4); g.restore(); }); });
    const poster = canvasTex(256, 360, (g) => { g.fillStyle = '#F4EFE6'; g.fillRect(0, 0, 256, 360); g.fillStyle = '#2E6B9E'; g.fillRect(0, 0, 256, 70); g.fillStyle = '#fff'; g.font = FONT(700, 34); g.textAlign = 'center'; g.fillText('ตารางธาตุ', 128, 48); for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) if (!(r < 3 && c > 1 && c < 7)) { g.fillStyle = ['#F2C14E', '#7DBE8A', '#86B5E0', '#E58C8A'][(r + c) % 4]; g.fillRect(14 + c * 26, 90 + r * 36, 22, 30); } });
    const corridor = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#E9E4D6'); gr.addColorStop(1, '#BDB6A6'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
    const field = canvasTex(512, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#9CC9EC'); gr.addColorStop(0.45, '#D7E9F2'); gr.addColorStop(0.46, '#7DAF5B'); gr.addColorStop(1, '#5E9445'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
      for (let k = 0; k < 14; k++) { const x = hash(k * 3.3) * 512, r = 18 + hash(k) * 22; g.fillStyle = ['#3F7A3A', '#4E8C45', '#356B33'][k % 3]; g.beginPath(); g.arc(x, 112 - r * 0.4, r, 0, 7); g.fill(); g.fillStyle = '#5A4632'; g.fillRect(x - 3, 112, 6, 14); }
      g.fillStyle = '#EDE6D6'; g.fillRect(300, 70, 160, 50); g.fillStyle = '#B95C45'; g.fillRect(292, 60, 176, 14); g.fillStyle = '#9FB3C4'; for (let k = 0; k < 6; k++) g.fillRect(310 + k * 25, 82, 14, 24); });
    return {floor, ceiling, wood, page, board, sign, notice, poster, corridor, field};
  }, []);
  const motes = useMemo(() => Array.from({length: 70}, (_, i) => ({x: 1.0 + hash(i) * 3.0, y: 0.6 + hash(i * 2.3) * 2.0, z: -4.2 + hash(i * 4.7) * 8.4, s: 0.004 + hash(i * 1.9) * 0.005, sp: 0.03 + hash(i * 6.1) * 0.05, ph: hash(i * 8.3) * 6.28})), []);
  const fall = useMemo(() => Array.from({length: 90}, (_, i) => ({x: -2.5 + hash(i * 1.1) * 6.2, z: -3 + hash(i * 2.9) * 7.5, s: 0.004 + hash(i * 3.3) * 0.006, d: hash(i * 5.7) * 1.2})), []);
  const hh = (clock / 3600) % 12, mm = (clock / 60) % 60, ss = clock % 60;
  const tubeE = lightsK; // fluorescent tubes: emissive follows the switch
  const doorX = DOOR.x + 0.02;
  return (
    <group>
      {/* floor + ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[W * 2, D * 2]} /><meshStandardMaterial map={tex.floor} roughness={0.35} metalness={0.05} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL, 0]}><planeGeometry args={[W * 2, D * 2]} /><meshStandardMaterial map={tex.ceiling} roughness={1} /></mesh>
      {/* fluorescent fixtures (2 rows × 3) */}
      {[-1.6, 1.6].flatMap((x) => [-3, 0, 3].map((z) => <group key={`f${x}${z}`} position={[x, CEIL - 0.04, z]}>
        <M s={[0.22, 0.06, 1.3]} c="#E9E9E6" rough={0.5} shadow={false} />
        {[-0.05, 0.05].map((dx) => <mesh key={dx} position={[dx, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.016, 0.016, 1.2, 10]} /><meshStandardMaterial color={tubeE > 0.5 ? '#FFFFFF' : '#C9CCD0'} emissive="#FFFDF5" emissiveIntensity={tubeE * 2.2} /></mesh>)}
      </group>))}
      {/* ceiling fans */}
      {[[-1.6, -1.5], [1.6, -1.5], [-1.6, 1.5], [1.6, 1.5]].map(([x, z], k) => <group key={k} position={[x, CEIL, z]}>
        <M p={[0, -0.18, 0]} s={[0.04, 0.36, 0.04]} c="#E8E8E5" shadow={false} />
        <group position={[0, -0.4, 0]} rotation={[0, t * 9 * fanK + k, 0]}>
          <mesh><cylinderGeometry args={[0.1, 0.12, 0.09, 16]} /><meshStandardMaterial color="#EDEDEA" roughness={0.5} /></mesh>
          {[0, 1, 2].map((b) => <M key={b} p={[Math.sin(b * 2.094) * 0.42, -0.01, Math.cos(b * 2.094) * 0.42]} r={[0.08, b * 2.094, 0]} s={[0.12, 0.012, 0.66]} c="#F3F3F0" rough={0.5} />)}
        </group>
      </group>)}
      {/* walls: pale yellow dado + white upper, trim line */}
      {([[0, -D, 0, W * 2], [0, D, Math.PI, W * 2]] as [number, number, number, number][]).map(([x, z, ry, w], k) => <group key={k} position={[x, 0, z]} rotation={[0, ry, 0]}>
        <M p={[0, 0.6, 0]} s={[w, 1.2, 0.06]} c="#E9D9A6" rough={0.9} /><M p={[0, 0.6 + 1.2 + (CEIL - 1.2) / 2 - 0.6, 0]} s={[w, CEIL - 1.2, 0.06]} c="#F4F2EC" rough={0.95} /><M p={[0, 1.22, 0.035]} s={[w, 0.04, 0.02]} c="#B5A36F" />
      </group>)}
      {/* left (corridor) wall with the door gap + high vent transoms */}
      {[[-D, DOOR.z - DOOR.w / 2], [DOOR.z + DOOR.w / 2, D]].map(([z0, z1], k) => { const zc = (z0 + z1) / 2, len = z1 - z0; return <group key={k}>
        <M p={[-W, 0.6, zc]} s={[0.06, 1.2, len]} c="#E9D9A6" rough={0.9} /><M p={[-W, 1.2 + (CEIL - 1.2) / 2, zc]} s={[0.06, CEIL - 1.2, len]} c="#F4F2EC" rough={0.95} /><M p={[-W + 0.035, 1.22, zc]} s={[0.02, 0.04, len]} c="#B5A36F" /></group>; })}
      <M p={[-W, (CEIL + DOOR.h) / 2, DOOR.z]} s={[0.06, CEIL - DOOR.h, DOOR.w]} c="#F4F2EC" />
      {[-1.5, 0.5, 2.5].map((z) => <group key={z}><M p={[-W + 0.03, 2.55, z]} s={[0.02, 0.32, 1.4]} c="#A8B6BF" o={0.5} rough={0.1} /><M p={[-W + 0.04, 2.55, z]} s={[0.02, 0.34, 1.42]} c="#8E949C" o={0.0} />{[0, 1, 2].map((r) => <M key={r} p={[-W + 0.045, 2.44 + r * 0.11, z]} s={[0.01, 0.02, 1.4]} c="#8E949C" metal={0.4} rough={0.4} />)}</group>)}
      {/* door: frame, leaf with narrow glass, handle (rattles), thumbturn lock; corridor behind the glass with a passing shadow */}
      <group position={[doorX, 0, DOOR.z]}>
        <M p={[0, DOOR.h + 0.04, 0]} s={[0.12, 0.08, DOOR.w + 0.16]} c="#6B4E36" /><M p={[0, DOOR.h / 2, -DOOR.w / 2 - 0.04]} s={[0.12, DOOR.h, 0.08]} c="#6B4E36" /><M p={[0, DOOR.h / 2, DOOR.w / 2 + 0.04]} s={[0.12, DOOR.h, 0.08]} c="#6B4E36" />
        {/* the leaf swings on its hinge (the −z jamb); everything below until the frame closes belongs to the leaf */}
        <group position={[0, 0, -DOOR.w / 2]} rotation={[0, -doorAng, 0]}><group position={[0, 0, DOOR.w / 2]}>
        {/* leaf in four pieces around the vision panel so the corridor (and whoever passes) shows through the glass */}
        {([[-0.45, -0.29, 0, DOOR.h], [-0.15, 0.45, 0, DOOR.h], [-0.29, -0.15, 0, 1.14], [-0.29, -0.15, 1.76, DOOR.h]] as [number, number, number, number][]).map(([z0, z1, y0, y1], k) =>
          <M key={k} p={[0, (y0 + y1) / 2, (z0 + z1) / 2]} s={[0.045, y1 - y0, z1 - z0]} c="#8A6444" rough={0.6} map={tex.wood} />)}
        <M p={[0.026, 1.45, -0.29]} s={[0.012, 0.66, 0.015]} c="#5E4430" /><M p={[0.026, 1.45, -0.15]} s={[0.012, 0.66, 0.015]} c="#5E4430" />
        <M p={[0.0, 1.45, -0.22]} s={[0.006, 0.62, 0.14]} c="#9FB4C2" o={0.18} rough={0.05} />
        {!real && <mesh position={[-0.35, 1.45, -0.22]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.6, 1.6]} /><meshBasicMaterial map={tex.corridor} color={lightsK > 0.5 ? '#ffffff' : '#d9d4c6'} toneMapped={false} /></mesh>}
        {!real && shadow > 0 && <mesh renderOrder={5} position={[-0.12, 1.4, -0.22 + (shadow - 0.5) * 0.5]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.42, 1.3]} /><meshBasicMaterial color="#050505" transparent opacity={0.96 * Math.min(1, Math.sin(shadow * Math.PI) * 1.6)} toneMapped={false} depthWrite={false} /></mesh>}
        <group position={[0.05, 1.02, 0.36]} rotation={[handle * 0.55, 0, 0]}><M p={[0.03, 0, 0]} s={[0.05, 0.03, 0.03]} c="#C8CCD2" metal={0.8} rough={0.25} /><M p={[0.06, 0, -0.06]} s={[0.025, 0.025, 0.14]} c="#C8CCD2" metal={0.8} rough={0.25} /></group>
        <M p={[0.04, 1.02, 0.36]} s={[0.012, 0.16, 0.06]} c="#AEB3BA" metal={0.7} rough={0.3} />
        {/* thumbturn: the bar turns a quarter when the lock opens */}
        <group position={[0.05, 1.2, 0.36]} rotation={[turn * Math.PI / 2, 0, 0]}><M s={[0.03, 0.035, 0.05]} c="#AEB3BA" metal={0.7} rough={0.3} /><M p={[0.02, 0, 0]} s={[0.014, 0.012, 0.042]} c="#C8CCD2" metal={0.8} rough={0.25} /></group>
        {/* the corridor side of the leaf: a handle there too */}
        {real && <group position={[-0.05, 1.02, 0.36]}><M p={[-0.03, 0, 0]} s={[0.05, 0.03, 0.03]} c="#C8CCD2" metal={0.8} rough={0.25} /><M p={[-0.06, 0, -0.06]} s={[0.025, 0.025, 0.14]} c="#C8CCD2" metal={0.8} rough={0.25} /></group>}
        </group></group>
      </group>
      {/* light switch plate */}
      <M p={[SWITCH[0], SWITCH[1], SWITCH[2]]} s={[0.012, 0.12, 0.08]} c="#F4F4F0" rough={0.4} /><M p={[SWITCH[0] + 0.01, SWITCH[1] + (lightsK > 0.5 ? 0.012 : -0.012), SWITCH[2]]} s={[0.012, 0.025, 0.03]} c="#E2E2DC" rough={0.4} />
      {/* right wall: windows with glass louvres + steel grille, field outside (afternoon sun) */}
      <M p={[W, 0.45, 0]} s={[0.06, 0.9, D * 2]} c="#E9D9A6" rough={0.9} /><M p={[W, 2.65, 0]} s={[0.06, 0.7, D * 2]} c="#F4F2EC" />
      {[-4, -2, 0, 2, 4].map((z) => <group key={z}>
        <M p={[W, 1.6, z - 1]} s={[0.1, 1.4, 0.08]} c="#D2CBB8" />
        {Array.from({length: 9}, (_, r) => <M key={r} p={[W - 0.02, 0.98 + r * 0.15, z]} r={[0, 0, -0.5]} s={[0.012, 0.11, 1.84]} c="#CFE3EE" o={0.28} rough={0.05} shadow={false} />)}
        {Array.from({length: 6}, (_, c) => <M key={'g' + c} p={[W - 0.06, 1.6, z - 0.75 + c * 0.3]} s={[0.012, 1.4, 0.012]} c="#4E5560" metal={0.5} rough={0.5} />)}
      </group>)}
      {!real && <Exterior t={t} dark={1 - lightsK} gun={st.gun} />}
      {/* front wall: whiteboard + tray, room sign, clock bound to story time, PA loudspeaker, notice board */}
      <group position={[0, 0, -D + 0.04]}>
        <M p={[0.2, 1.55, 0]} s={[3.75, 1.3, 0.04]} c="#9AA0A8" metal={0.5} rough={0.35} />
        <mesh position={[0.2, 1.55, 0.022]}><planeGeometry args={[3.6, 1.2]} /><meshStandardMaterial map={tex.board} roughness={0.25} /></mesh>
        <M p={[0.2, 0.88, 0.06]} s={[3.6, 0.04, 0.1]} c="#9AA0A8" metal={0.5} rough={0.35} />
        {[['#1F3F8F', 0.9], ['#B3262E', 1.0], ['#1C1C22', 1.1]].map(([c, x], k) => <M key={k} p={[x as number, 0.915, 0.06]} s={[0.12, 0.02, 0.02]} c={c as string} r={[0, 0.1 * k, 0]} />)}
        <group position={[0.2, 2.6, 0.04]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.05, 32]} /><meshStandardMaterial color="#2A2D33" /></mesh>
          <mesh position={[0, 0, 0.027]}><circleGeometry args={[0.18, 32]} /><meshStandardMaterial color="#FAFAF7" /></mesh>
          {Array.from({length: 12}, (_, k) => <M key={k} p={[Math.sin(k * 0.5236) * 0.155, Math.cos(k * 0.5236) * 0.155, 0.03]} s={[0.01, 0.025, 0.003]} r={[0, 0, -k * 0.5236]} c="#1A1A1A" shadow={false} />)}
          <M p={[Math.sin((hh / 12) * 6.283) * 0.045, Math.cos((hh / 12) * 6.283) * 0.045, 0.032]} s={[0.014, 0.1, 0.004]} r={[0, 0, -(hh / 12) * 6.283]} c="#1A1A1A" shadow={false} />
          <M p={[Math.sin((mm / 60) * 6.283) * 0.065, Math.cos((mm / 60) * 6.283) * 0.065, 0.034]} s={[0.009, 0.14, 0.004]} r={[0, 0, -(mm / 60) * 6.283]} c="#1A1A1A" shadow={false} />
          <M p={[Math.sin((ss / 60) * 6.283) * 0.06, Math.cos((ss / 60) * 6.283) * 0.06, 0.036]} s={[0.004, 0.15, 0.003]} r={[0, 0, -(ss / 60) * 6.283]} c="#C0392B" shadow={false} />
        </group>
        <mesh position={[2.85, 2.55, 0.03]}><planeGeometry args={[0.6, 0.19]} /><meshBasicMaterial map={tex.sign} /></mesh>
        <mesh position={[3.2, 1.55, 0.03]}><planeGeometry args={[1.0, 0.62]} /><meshStandardMaterial map={tex.notice} roughness={0.9} /></mesh>
      </group>
      <group position={PA}>
        <M s={[0.36, 0.26, 0.16]} c="#E9E6DD" rough={0.6} /><mesh position={[0, 0, 0.081]}><circleGeometry args={[0.1, 24]} /><meshStandardMaterial color="#3A3D44" roughness={0.9} /></mesh>
        {Array.from({length: 5}, (_, k) => <M key={k} p={[0, -0.08 + k * 0.04, 0.083]} s={[0.22, 0.008, 0.004]} c="#55585F" shadow={false} />)}
      </group>
      {/* back wall: notice board, periodic table poster, steel cabinet */}
      <group position={[0, 0, D - 0.04]} rotation={[0, Math.PI, 0]}>
        <mesh position={[-0.6, 1.75, 0.03]}><planeGeometry args={[1.8, 1.1]} /><meshStandardMaterial map={tex.notice} roughness={0.9} /></mesh>
        <mesh position={[1.6, 1.75, 0.03]}><planeGeometry args={[0.6, 0.85]} /><meshStandardMaterial map={tex.poster} roughness={0.8} /></mesh>
      </group>
      {(() => { const f = FURN.find((q) => q.id === 'cab')!; return <group position={[f.x, 0, f.z]}><M p={[0, f.h / 2, 0]} s={[f.w, f.h, f.d]} c="#9AA3AE" metal={0.35} rough={0.5} /><M p={[0, f.h / 2, -f.d / 2 - 0.003]} s={[0.006, f.h - 0.06, 0.004]} c="#6D747E" /><M p={[0, f.h + 0.1, 0]} s={[0.6, 0.2, 0.3]} c="#C49A57" rough={0.9} /></group>; })()}
      {/* teacher's desk */}
      {(() => { const f = FURN.find((q) => q.id === 'tdesk')!; return <group position={[f.x, 0, f.z]}>
        <M p={[0, f.h - 0.02, 0]} s={[f.w, 0.04, f.d]} c="#8C6B4B" rough={0.5} map={tex.wood} /><M p={[0, f.h / 2, -0.28]} s={[f.w, f.h - 0.04, 0.03]} c="#7A5C40" /><M p={[-0.55, f.h / 2, 0]} s={[0.04, f.h - 0.04, f.d]} c="#7A5C40" /><M p={[0.55, f.h / 2, 0]} s={[0.04, f.h - 0.04, f.d]} c="#7A5C40" />
        <M p={[-0.25, f.h + 0.04, 0.02]} s={[0.26, 0.06, 0.34]} c="#2E4E7A" rough={0.8} /><M p={[-0.25, f.h + 0.09, 0.02]} s={[0.24, 0.04, 0.32]} c="#B33A3A" rough={0.8} />
        <M p={[0.25, f.h + 0.012, 0.05]} s={[0.34, 0.016, 0.24]} c="#2A2D33" rough={0.4} /><mesh position={[0.25, f.h + 0.12, -0.07]} rotation={[-0.25, 0, 0]}><planeGeometry args={[0.32, 0.2]} /><meshBasicMaterial color={lightsK > 0.5 ? '#CFE0F2' : '#5D7088'} toneMapped={false} /></mesh>
      </group>; })()}
      {/* student desks + chairs (barricade desks move) */}
      {FURN.filter((f: Furn) => f.kind === 'desk').map((f, i) => { const mv = desks[f.id]; const empty = f.id === 'desk43'; return <StudentDesk key={f.id} x={mv ? mv.x : f.x} z={mv ? mv.z : f.z} yaw={mv ? mv.yaw : 0} i={i} tex={tex} phoneRed={phonesRed * (hash(i * 2.2) > 0.25 ? 1 : 0)} empty={empty} mine={f.id === 'desk33'} />; })}
      {COLS.flatMap((x, c) => ROWS.map((z, r) => { const [sx, sz] = SEAT(c, r); return <Chair key={`ch${c}${r}`} x={sx} z={sz + 0.08} bag={sx === TON_SEAT[0] && sz === TON_SEAT[1]} />; }))}
      {/* dust: motes in the window light + a fall from the ceiling after the thuds */}
      {motes.map((m, i) => <mesh key={i} position={[m.x + Math.sin(t * m.sp * 3 + m.ph) * 0.08, m.y + ((t * m.sp) % 1) * 0.15, m.z]}><sphereGeometry args={[m.s, 4, 3]} /><meshBasicMaterial color="#FFF6DD" transparent opacity={0.55} depthWrite={false} /></mesh>)}
      {dust > 0 && fall.map((f, i) => { const k = clamp(dust - f.d * 0.15); const y = CEIL - 0.05 - k * k * 2.4; return k > 0 && y > 0.1 ? <mesh key={'d' + i} position={[f.x + Math.sin(i + t) * 0.03, y, f.z]}><sphereGeometry args={[f.s, 4, 3]} /><meshBasicMaterial color="#E9E3D2" transparent opacity={0.8 * (1 - smooth((k - 0.7) / 0.3))} depthWrite={false} /></mesh> : null; })}
    </group>
  );
};
export {BARRICADE};
