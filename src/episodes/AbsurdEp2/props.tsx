import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {HANDLE} from './data';

type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const CREAM = '#E6E7CF', NAVY = '#152028', TEAL = '#476F66', TAN = '#C9BA9B', BRICK = '#B0402E';

// -----------------------------------------------------------------------------------------------------
// The accused: a stand fan. Origin at the floor, faces local +z, control box on the stem, head at y = 1.2.
// -----------------------------------------------------------------------------------------------------
export const PANEL = {y: 0.92, z: 0.042};
/** y offset of each button on the control box, local */
export const BTN: Record<string, number> = {off: 0.066, b1: 0.022, b2: -0.022, b3: -0.066};
const panelTex = (lit: number) => tex('fan-panel' + lit, 128, 256, (g) => {
  g.fillStyle = NAVY; g.fillRect(0, 0, 128, 256);
  ['ปิด', '1', '2', '3'].forEach((s, i) => {
    const y = 40 + i * 58; g.fillStyle = i === lit ? '#F08A6E' : CREAM; g.beginPath(); g.roundRect(18, y - 24, 92, 48, 8); g.fill();
    g.fillStyle = NAVY; g.font = F(700, i === 0 ? 28 : 38); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 64, y + 2);
  });
});
const bladeGeo = (() => { const s = new THREE.Shape(); s.absellipse(0, 0.105, 0.052, 0.098, 0, Math.PI * 2, false, 0.2); return new THREE.ShapeGeometry(s, 18); })();
type FanP = {position?: V3; yaw?: number; scale?: number; headYaw?: number; blade?: number; blur?: number; lit?: number; tilt?: number};
export const Fan: React.FC<FanP> = ({position, yaw = 0, scale = 1, headYaw = 0, blade = 0, blur = 0, lit = 3, tilt = 0}) => {
  const body = PM(CREAM, 'fan'), dk = PM(NAVY, 'fan'), bl = useMemo(() => { const m = (PM(TEAL, 'blade') as THREE.MeshLambertMaterial).clone(); m.side = THREE.DoubleSide; return m; }, []);
  const wire = M('#D8DAC4', 0.7);
  const panel = useMemo(() => new THREE.MeshBasicMaterial({map: panelTex(lit), toneMapped: false}), [lit]);
  const spokes = Array.from({length: 12}, (_, i) => i * Math.PI / 6);
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.025, 0]} material={body}><cylinderGeometry args={[0.16, 0.19, 0.05, 8]} /></mesh>
      <mesh castShadow position={[0, 0.55, 0]} material={body}><cylinderGeometry args={[0.018, 0.024, 1.05, 8]} /></mesh>
      <mesh castShadow position={[0, PANEL.y, 0]} material={body}><boxGeometry args={[0.1, 0.2, 0.08]} /></mesh>
      <mesh position={[0, PANEL.y, PANEL.z]} material={panel}><planeGeometry args={[0.085, 0.17]} /></mesh>
      <group position={[0, 1.2, 0]} rotation={[tilt, headYaw, 0]}>
        <mesh castShadow position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]} material={body}><cylinderGeometry args={[0.078, 0.07, 0.15, 10]} /></mesh>
        <mesh castShadow position={[0, -0.08, -0.08]} material={body}><boxGeometry args={[0.05, 0.1, 0.05]} /></mesh>
        <mesh position={[0, 0, 0.012]} rotation={[0, 0, blade]}>
          {[0, 1, 2, 3].map((i) => <group key={i} rotation={[0, 0, i * Math.PI / 2]}><mesh geometry={bladeGeo} material={bl} castShadow /></group>)}
        </mesh>
        {blur > 0.01 && <mesh position={[0, 0, 0.018]} material={useBlur(blur)}><circleGeometry args={[0.2, 24]} /></mesh>}
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]} material={dk}><cylinderGeometry args={[0.038, 0.038, 0.03, 12]} /></mesh>
        {/* cage: front + back rings and radial wires */}
        {[0.05, -0.03].map((z) => <mesh key={z} position={[0, 0, z]} material={body}><torusGeometry args={[0.225, 0.008, 6, 28]} /></mesh>)}
        {[0.11, 0.17].map((r) => <mesh key={r} position={[0, 0, 0.05]} material={wire}><torusGeometry args={[r, 0.003, 4, 24]} /></mesh>)}
        {spokes.map((a) => <group key={a} rotation={[0, 0, a]}><mesh position={[0, 0.13, 0.05]} material={wire}><boxGeometry args={[0.004, 0.19, 0.004]} /></mesh></group>)}
      </group>
    </group>
  );
};
const blurMat = new THREE.MeshBasicMaterial({color: '#9FBDB5', transparent: true, opacity: 0.4, depthWrite: false});
const useBlur = (k: number) => { blurMat.opacity = 0.42 * k; return blurMat; };
/** world position of a fan button, for a fan with this position / yaw / scale */
export const btnWorld = (pos: V3, yaw: number, scale: number, b: keyof typeof BTN): V3 => {
  const lz = (PANEL.z + 0.004) * scale, ly = (PANEL.y + BTN[b] * (0.17 / 0.2)) * scale;
  return [pos[0] + Math.sin(yaw) * lz, pos[1] + ly, pos[2] + Math.cos(yaw) * lz];
};

// -----------------------------------------------------------------------------------------------------
// A cut-in forearm for ECUs: the fingertip at the origin, the arm running back along −z.
// -----------------------------------------------------------------------------------------------------
export const Arm: React.FC<{position: V3; back: V3; sleeve?: string; skin?: string; grip?: boolean; len?: number; unlit?: boolean}> = ({position, back, sleeve = '#8FB0D2', skin = '#D9A879', grip = false, len = 0.55, unlit = false}) => {
  const S = unlit ? MB(skin) : PM(skin, 'arm', 0.025), C = unlit ? MB(sleeve) : PM(sleeve, 'arm');
  // `back` = the direction the arm runs away from the fingertip
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(...back).normalize());
  return <group position={position} quaternion={q}>
    {!grip && <mesh castShadow position={[0, 0, -0.04]} material={S}><boxGeometry args={[0.017, 0.017, 0.08]} /></mesh>}
    <mesh castShadow position={[0, -0.008, -0.13]} material={S}><boxGeometry args={[0.078, 0.036, 0.1]} /></mesh>
    {[-0.019, 0.003, 0.025].map((x, i) => <mesh key={i} castShadow position={[x, -0.016, -0.074]} rotation={[0.9, 0, 0]} material={S}><boxGeometry args={[0.018, 0.018, 0.045]} /></mesh>)}
    {grip && <mesh castShadow position={[-0.019 - 0.022, -0.016, -0.074]} rotation={[0.9, 0, 0]} material={S}><boxGeometry args={[0.018, 0.018, 0.045]} /></mesh>}
    <mesh castShadow position={[0.05, -0.002, -0.1]} rotation={[0, -0.7, 0]} material={S}><boxGeometry args={[0.018, 0.02, 0.06]} /></mesh>
    <mesh castShadow position={[0, -0.01, -0.235]} material={S}><boxGeometry args={[0.058, 0.044, 0.12]} /></mesh>
    <mesh castShadow position={[0, -0.01, -0.29 - len / 2]} material={C}><boxGeometry args={[0.078, 0.066, len]} /></mesh>
  </group>;
};

// -----------------------------------------------------------------------------------------------------
// Flat FX: a jagged 2-colour bolt, moving wind streaks, one thin echo ring. No particles, no bloom.
// -----------------------------------------------------------------------------------------------------
const seg = (a: THREE.Vector3, b: THREE.Vector3, w: number, m: THREE.Material, key: string) => {
  const d = b.clone().sub(a), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh key={key} position={a.clone().add(b).multiplyScalar(0.5)} quaternion={q} material={m}><boxGeometry args={[w, L + w, w]} /></mesh>;
};
export const Bolt: React.FC<{a: V3; b: V3; t: number; seed?: number; n?: number; amp?: number; w?: number}> = ({a, b, t, seed = 1, n = 6, amp = 0.05, w = 0.012}) => {
  const ph = Math.floor(t * 15) + seed * 17; const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const pts = Array.from({length: n + 1}, (_, i) => { const p = A.clone().lerp(B, i / n); if (i && i < n) p.add(new THREE.Vector3(hash(ph + i * 3) - 0.5, hash(ph + i * 5) - 0.5, hash(ph + i * 7) - 0.5).multiplyScalar(amp * 2)); return p; });
  const y = MB('#FFD84A'), wh = MB('#FFFFFF');
  return <group>{pts.slice(1).map((p, i) => seg(pts[i], p, w, y, 'y' + i))}{pts.slice(1).map((p, i) => seg(pts[i], p, w * 0.42, wh, 'w' + i))}</group>;
};
/** white straight streaks flowing along a polyline */
export const Wind: React.FC<{path: V3[]; t: number; n?: number; speed?: number; len?: number; w?: number; spread?: number}> = ({path, t, n = 22, speed = 0.55, len = 0.1, w = 0.008, spread = 0.2}) => {
  const P = path.map((p) => new THREE.Vector3(...p)); const L = P.slice(1).map((p, i) => p.distanceTo(P[i])); const tot = L.reduce((a, b) => a + b, 0);
  const at = (u: number) => { let d = u * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) return P[i].clone().lerp(P[i + 1], Math.min(1, d / L[i])); d -= L[i]; } return P[0].clone(); };
  const m = MB('#F4F6EE');
  return <group>{Array.from({length: n}, (_, i) => {
    const u = (hash(i * 1.7) + t * speed * (0.8 + hash(i) * 0.5)) % 1; const u2 = Math.min(1, u + len);
    const off = new THREE.Vector3(hash(i * 3.1) - 0.5, hash(i * 5.3) - 0.5, hash(i * 7.7) - 0.5).multiplyScalar(spread * 2);
    return seg(at(u).add(off), at(u2).add(off), w, m, String(i));
  })}</group>;
};
export const EchoRing: React.FC<{position: V3; k: number; quaternion?: THREE.Quaternion; r?: number}> = ({position, k, quaternion, r = 0.05}) => {
  if (k <= 0 || k >= 1) return null;
  return <mesh position={position} quaternion={quaternion} scale={0.4 + k * 1.8}><ringGeometry args={[r, r + 0.0035, 36]} /><meshBasicMaterial color="#F4F6EE" transparent opacity={1 - k} side={THREE.DoubleSide} depthWrite={false} /></mesh>;
};

// -----------------------------------------------------------------------------------------------------
// The suspect's plug and the power strip on the interrogation table
// -----------------------------------------------------------------------------------------------------
export const PowerStrip: React.FC<{position: V3}> = ({position}) => <group position={position}>
  <mesh castShadow receiveShadow position={[0, 0.014, 0]} material={PM(CREAM, 'strip')}><boxGeometry args={[0.07, 0.028, 0.24]} /></mesh>
  {[-0.07, 0, 0.07].map((z) => <mesh key={z} position={[0, 0.0285, z]} rotation={[-Math.PI / 2, 0, 0]} material={MB('#3A4148')}><circleGeometry args={[0.018, 14]} /></mesh>)}
  <mesh position={[0, 0.0285, -0.105]} rotation={[-Math.PI / 2, 0, 0]} material={MB('#E2553F')}><circleGeometry args={[0.008, 10]} /></mesh>
</group>;
export const Plug: React.FC<{position: V3}> = ({position}) => <group position={position}>
  <mesh castShadow position={[0, 0.03, 0]} material={PM(NAVY, 'plug')}><boxGeometry args={[0.038, 0.05, 0.032]} /></mesh>
  {[-0.009, 0.009].map((x) => <mesh key={x} position={[x, -0.006, 0]} material={M('#C9CDD2', 0.3, 0.8)}><boxGeometry args={[0.004, 0.024, 0.008]} /></mesh>)}
</group>;
/** a sagging cable through given points */
export const Cord: React.FC<{pts: V3[]; r?: number}> = ({pts, r = 0.004}) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, r, 5), [JSON.stringify(pts), r]);
  return <mesh geometry={geo} material={PM(NAVY, 'cord')} />;
};

// -----------------------------------------------------------------------------------------------------
// Paper with big text
// -----------------------------------------------------------------------------------------------------
const folderTex = () => tex('case-folder-2', 1024, 1280, (g) => {
  g.fillStyle = '#C9A86A'; g.fillRect(0, 0, 1024, 1280);
  g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 1500; i++) g.fillRect(hash(i) * 1024, hash(i * 2.3) * 1280, 3, 3);
  g.fillStyle = '#B8975A'; g.fillRect(0, 0, 1024, 120); g.fillStyle = '#F4EFE2'; g.fillRect(90, 160, 844, 560);
  g.strokeStyle = BRICK; g.lineWidth = 8; g.strokeRect(110, 180, 804, 520);
  g.textAlign = 'center'; g.fillStyle = '#1E2B3C'; g.font = F(700, 86); g.fillText('แฟ้มคดี 192/2569', 512, 300);
  g.fillStyle = '#2A2A2E'; g.font = F(600, 64); g.fillText('ผู้ต้องหา: พัดลม 1 ตัว', 512, 420);
  g.fillStyle = BRICK; g.font = F(700, 72); g.fillText('ข้อหา: พยายามฆ่า', 512, 540);
  g.fillStyle = '#6A6A70'; g.font = F(500, 44); g.fillText(HANDLE, 512, 650);
  g.fillStyle = BRICK; g.font = F(700, 120); g.save(); g.translate(512, 980); g.rotate(-0.18); g.globalAlpha = 0.85; g.strokeStyle = BRICK; g.lineWidth = 12; g.strokeRect(-330, -90, 660, 170); g.fillText('ไฟรั่ว', 0, 44); g.restore();
});
export const CaseFolder: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: folderTex(), toneMapped: false}), []);
  return <group position={position} rotation={rotation}>
    <mesh castShadow receiveShadow material={M('#C9A86A', 0.9)}><boxGeometry args={[0.24, 0.014, 0.32]} /></mesh>
    <mesh position={[0, 0.0075, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat}><planeGeometry args={[0.24, 0.32]} /></mesh>
  </group>;
};
const formTex = () => tex('report-form', 1024, 1400, (g) => {
  g.fillStyle = '#F4EFE2'; g.fillRect(0, 0, 1024, 1400);
  g.fillStyle = 'rgba(0,0,0,0.04)'; for (let i = 0; i < 1500; i++) g.fillRect(hash(i) * 1024, hash(i * 2.3) * 1400, 3, 3);
  g.fillStyle = '#1E2B3C'; g.fillRect(0, 0, 1024, 190); g.fillStyle = '#F4EFE2'; g.font = F(700, 104); g.textAlign = 'center'; g.fillText('ใบแจ้งความ', 512, 130);
  g.textAlign = 'left'; const row = (y: number, a: string, b: string, red = false) => {
    g.fillStyle = '#6A6A70'; g.font = F(500, 48); g.fillText(a, 76, y); g.fillStyle = red ? BRICK : '#1E2B3C'; g.font = F(700, 78); g.fillText(b, 76, y + 88);
    g.fillStyle = 'rgba(30,43,60,0.25)'; g.fillRect(76, y + 112, 872, 3);
  };
  row(290, 'ผู้แจ้ง', 'ยุง (ห้อง 18)'); row(510, 'ผู้ถูกกล่าวหา', 'พัดลม (ห้อง 19)'); row(730, 'ข้อหา', 'กักขังหน่วงเหนี่ยว', true); row(950, 'คำให้การ', 'หึ่ง…');
  g.fillStyle = '#6A6A70'; g.font = F(500, 42); g.textAlign = 'center'; g.fillText(HANDLE, 512, 1320);
});
export const ReportForm: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: formTex(), toneMapped: false}), []);
  return <group position={position} rotation={rotation}>
    <mesh receiveShadow castShadow position={[0, -0.002, 0]} material={M('#7A6A55', 0.8)}><boxGeometry args={[0.262, 0.006, 0.352]} /></mesh>
    <mesh position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat}><planeGeometry args={[0.25, 0.342]} /></mesh>
  </group>;
};
const plateTex2 = (text: string, bg: string, fg: string) => tex('cellplate-' + text, 512, 256, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(14, 14, 484, 228);
  g.fillStyle = fg; g.font = F(700, 120); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 136);
});
/** a physical plate on the bars */
export const CellPlate: React.FC<{text: string; position: V3; w?: number; bg?: string; fg?: string}> = ({text, position, w = 0.6, bg = NAVY, fg = CREAM}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: plateTex2(text, bg, fg), toneMapped: false}), [text, bg, fg]);
  return <mesh position={position} material={mat}><planeGeometry args={[w, w / 2]} /></mesh>;
};
/** long insulated cutter pole for the street shot */
export const CutterPole: React.FC<{a: V3; b: V3}> = ({a, b}) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <group><mesh castShadow position={A.clone().add(B).multiplyScalar(0.5)} quaternion={q} material={PM('#E8B23A', 'pole')}><cylinderGeometry args={[0.04, 0.05, L, 8]} /></mesh>
    <group position={B} quaternion={q}>{[-1, 1].map((s) => <mesh key={s} position={[s * 0.06, 0.12, 0]} rotation={[0, 0, s * -0.4]} material={PM(BRICK, 'jaw')}><boxGeometry args={[0.035, 0.3, 0.035]} /></mesh>)}</group></group>;
};
/** the man's hair, standing on end after the shock */
export const HairSpikes: React.FC<{head: V3}> = ({head}) => {
  const m = PM('#1A1513', 'spike');
  return <group position={head}>{Array.from({length: 11}, (_, i) => { const a = i * 2.39996, r = 0.03 + 0.085 * Math.sqrt(i / 10), x = Math.cos(a) * r, z = Math.sin(a) * r;
    return <mesh key={i} castShadow position={[x, 0.07, z]} rotation={[z * 3.2, 0, -x * 3.2]} material={m}><coneGeometry args={[0.018, 0.14, 4]} /></mesh>; })}</group>;
};
