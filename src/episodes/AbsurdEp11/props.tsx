import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {HANDLE} from './data';

/** EP11 offender: a twin-bell analog alarm clock. No face — its hands are its expression (the second hand "talks back"),
 *  the bells are its voice. Origin = bottom-centre between the feet, the dial faces +z. Metres (real size; scale 2–4 in shots). */
type V3 = [number, number, number];
const TAU = Math.PI * 2;
export const CR = 0.062, CD = 0.05, CC = 0.022 + CR;   // dial radius, body depth, centre height
const INK = '#1B1B1F', CREAM = '#F4EEDB', NAVY = '#152028', RED = '#D7262B';
const dialTex = () => tex('ep11-dial', 512, 512, (g) => {
  g.fillStyle = CREAM; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'round';
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU, big = i % 5 === 0; g.lineWidth = big ? 8 : 3; g.beginPath();
    g.moveTo(256 + Math.sin(a) * (big ? 216 : 228), 256 - Math.cos(a) * (big ? 216 : 228)); g.lineTo(256 + Math.sin(a) * 240, 256 - Math.cos(a) * 240); g.stroke(); }
  g.font = F(700, 60); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let n = 1; n <= 12; n++) { const a = (n / 12) * TAU; g.fillText(String(n), 256 + Math.sin(a) * 170, 259 - Math.cos(a) * 170); }
  g.font = F(600, 20); g.fillStyle = '#6A6A70'; g.fillText(HANDLE, 256, 335);
});
const robeM = () => PM('#C9822B', 'ep11-robe', 0.09);
/** the front drape: the part of the dial below a slanted chord (the centre pin stays visible) */
const drapeGeo = (() => { let g: THREE.ShapeGeometry | null = null; return () => { if (!g) { const s = new THREE.Shape(); const r = CR + 0.004, a0 = (188 * Math.PI) / 180, a1 = (346 * Math.PI) / 180;
  s.moveTo(Math.cos(a0) * r, Math.sin(a0) * r); s.absarc(0, 0, r, a0, a1, false); s.closePath(); g = new THREE.ShapeGeometry(s, 24); } return g; }; })();

export type ClockProps = {position?: V3; yaw?: number; scale?: number; t: number;
  /** time shown, hours (6 = 06:00) */ time?: number; /** second-hand position in seconds (default: runs with t) */ sec?: number;
  hands?: boolean; /** 0…1 alarm ringing: bells and hammer rattle, the body shivers */ ring?: number; battery?: boolean; robe?: boolean; tilt?: number; jolt?: number; lit?: number};
export const Clock: React.FC<ClockProps> = ({position = [0, 0, 0], yaw = 0, scale = 1, t, time = 6, sec, hands = true, ring = 0, battery = true, robe = false, tilt = 0, jolt = 0, lit = 0.5}) => {
  const face = useMemo(() => new THREE.MeshStandardMaterial({map: dialTex(), emissiveMap: dialTex(), emissive: '#FFFFFF', emissiveIntensity: lit, roughness: 0.7}), [lit]);
  const body = robe ? robeM() : M('#C94A3C', 0.45, 0.1, {}, 'ck-body');
  const brass = M('#DDBB58', 0.35, 0.55, {side: THREE.DoubleSide}, 'ck-brass'), steel = M('#D6D2C6', 0.3, 0.7, {}, 'ck-steel'), dark = M('#1E1F23', 0.5, 0.2, {}, 'ck-dark');
  const s = sec ?? t;
  const hr = -((time % 12) / 12) * TAU, mn = -(time % 1) * TAU, sc = -(s / 60) * TAU;
  const lineOn = ring > 0.3 && Math.floor(t * 15) % 2 === 0;
  return (
    <group position={position} rotation={[tilt, yaw, jolt]} scale={scale}>
      <group position={[Math.sin(t * 83) * 0.003 * ring, Math.abs(Math.sin(t * 47)) * 0.004 * ring, 0]} rotation={[0, 0, Math.sin(t * 61) * 0.04 * ring]}>
        {/* body, rim, dial */}
        <mesh castShadow receiveShadow position={[0, CC, 0]} rotation={[Math.PI / 2, 0, 0]} material={body}><cylinderGeometry args={[CR, CR, CD, 32]} /></mesh>
        <mesh castShadow position={[0, CC, CD / 2]} material={steel}><torusGeometry args={[CR - 0.004, 0.005, 8, 36]} /></mesh>
        <mesh position={[0, CC, CD / 2 + 0.0015]} material={face}><circleGeometry args={[CR - 0.007, 40]} /></mesh>
        <group position={[0, CC, CD / 2 + 0.003]}>
          {hands && <>
            <group rotation={[0, 0, hr]}><mesh position={[0, 0.013, 0]} material={dark}><boxGeometry args={[0.0065, 0.034, 0.0012]} /></mesh></group>
            <group rotation={[0, 0, mn]} position={[0, 0, 0.0012]}><mesh position={[0, 0.02, 0]} material={dark}><boxGeometry args={[0.0045, 0.05, 0.0012]} /></mesh></group>
            <group rotation={[0, 0, sc]} position={[0, 0, 0.0024]}><mesh position={[0, 0.017, 0]} material={MB(RED)}><boxGeometry args={[0.002, 0.058, 0.001]} /></mesh></group>
          </>}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]} material={brass}><cylinderGeometry args={[0.0045, 0.0045, 0.006, 12]} /></mesh>
        </group>
        {/* back: plate, battery bay, knobs */}
        <mesh position={[0, CC, -CD / 2 - 0.0006]} rotation={[0, Math.PI, 0]} material={M('#4A4D52', 0.6, 0.2, {}, 'ck-back')}><circleGeometry args={[CR - 0.003, 32]} /></mesh>
        <mesh position={[0, CC - 0.018, -CD / 2 - 0.001]} material={MB('#0C0D0F')}><boxGeometry args={[0.066, 0.024, 0.003]} /></mesh>
        {battery && <Battery position={[0, CC - 0.018, -CD / 2 - 0.007]} />}
        {[-1, 1].map((x) => <mesh key={x} position={[x * 0.026, CC + 0.026, -CD / 2 - 0.005]} rotation={[Math.PI / 2, 0, 0]} material={brass}><cylinderGeometry args={[0.006, 0.006, 0.01, 10]} /></mesh>)}
        {/* feet */}
        {[-1, 1].map((x) => <group key={x}><mesh castShadow position={[x * 0.04, 0.02, 0]} rotation={[0, 0, x * 0.5]} material={steel}><cylinderGeometry args={[0.005, 0.006, 0.042, 8]} /></mesh>
          <mesh castShadow position={[x * 0.05, 0.006, 0]} material={steel}><sphereGeometry args={[0.007, 10, 8]} /></mesh></group>)}
        {/* bells, hammer, carry handle */}
        {[-1, 1].map((x) => <group key={x} position={[x * 0.041, CC + CR * 0.77, 0]} rotation={[0, 0, -x * 0.6 + Math.sin(t * 97 + x) * 0.14 * ring]}>
          <mesh castShadow position={[0, 0.011, 0]} material={brass}><sphereGeometry args={[0.028, 18, 9, 0, TAU, 0, Math.PI / 2]} /></mesh>
          <mesh position={[0, 0.006, 0]} material={dark}><cylinderGeometry args={[0.003, 0.003, 0.02, 6]} /></mesh>
          <mesh position={[0, 0.041, 0]} material={brass}><sphereGeometry args={[0.005, 8, 6]} /></mesh>
        </group>)}
        <group position={[0, CC + CR + 0.002, 0]} rotation={[0, 0, Math.sin(t * 75) * 0.8 * ring]}>
          <mesh position={[0, 0.014, 0]} material={dark}><cylinderGeometry args={[0.002, 0.002, 0.028, 6]} /></mesh>
          <mesh position={[0, 0.03, 0]} material={dark}><sphereGeometry args={[0.006, 10, 8]} /></mesh>
        </group>
        <mesh position={[0, CC + CR + 0.022, -0.008]} material={steel}><torusGeometry args={[0.03, 0.003, 6, 18, Math.PI]} /></mesh>
        {/* ring lines */}
        {lineOn && [-1, 1].map((x) => [0, 1, 2].map((i) => { const a = x * (0.55 + i * 0.3); const r = CR + 0.075;
          return <mesh key={x + ':' + i} position={[Math.sin(a) * r, CC + Math.cos(a) * r, 0]} rotation={[0, 0, -a]} material={MB('#FFF3C4')}><boxGeometry args={[0.004, 0.028, 0.002]} /></mesh>; }))}
        {robe && <>
          <mesh position={[0, CC, CD / 2 + 0.008]} material={robeM()} geometry={drapeGeo()} castShadow />
          <mesh castShadow position={[0.049, CC + 0.016, CD / 2 + 0.0075]} rotation={[0, 0, -0.2]} material={robeM()}><boxGeometry args={[0.026, 0.085, 0.005]} /></mesh>
          <mesh castShadow position={[0.044, CC + CR * 0.82, 0]} rotation={[0, 0, -0.62]} material={robeM()}><boxGeometry args={[0.034, 0.016, CD + 0.022]} /></mesh>
        </>}
      </group>
    </group>
  );
};
/** an AA cell lying along x (centre origin) */
export const Battery: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position = [0, 0, 0], rotation = [0, 0, 0], scale = 1}) => <group position={position} rotation={rotation} scale={scale}>
  <mesh castShadow rotation={[0, 0, Math.PI / 2]} material={M('#E8B23A', 0.4, 0.3, {}, 'bat-b')}><cylinderGeometry args={[0.0075, 0.0075, 0.05, 12]} /></mesh>
  <mesh position={[0.017, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M('#1B1B1F', 0.35, 0.5, {}, 'bat-c')}><cylinderGeometry args={[0.0078, 0.0078, 0.017, 12]} /></mesh>
  <mesh position={[0.027, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M('#D6D2C6', 0.3, 0.7, {}, 'ck-steel')}><cylinderGeometry args={[0.003, 0.003, 0.004, 8]} /></mesh>
</group>;
/** the clock's three hands as a loose bundle (after the court order) */
export const LooseHands: React.FC<{position: V3; rotation?: V3; scale?: number}> = ({position, rotation = [0, 0, 0], scale = 1}) => <group position={position} rotation={rotation} scale={scale}>
  <mesh position={[0, 0.013, 0]} material={M('#1E1F23', 0.5, 0.2, {}, 'ck-dark')}><boxGeometry args={[0.0065, 0.034, 0.0012]} /></mesh>
  <mesh position={[0.004, 0.02, 0.002]} rotation={[0, 0, -0.3]} material={M('#1E1F23', 0.5, 0.2, {}, 'ck-dark')}><boxGeometry args={[0.0045, 0.05, 0.0012]} /></mesh>
  <mesh position={[-0.004, 0.017, 0.004]} rotation={[0, 0, 0.35]} material={MB(RED)}><boxGeometry args={[0.002, 0.058, 0.001]} /></mesh>
</group>;

/** giant bomb-disposal pliers from the handle end `tail` to the jaw tip `tip` (world); open 0…1 */
export const Pliers: React.FC<{tail: V3; tip: V3; open?: number}> = ({tail, tip, open = 0}) => {
  const A = new THREE.Vector3(...tail), d = new THREE.Vector3(...tip).sub(A), L = d.length(), J = 0.2;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize());
  const steel = M('#AEB5BA', 0.3, 0.8, {}, 'pl-steel'), grip = M('#D8452F', 0.7, 0, {}, 'pl-grip');
  const a = 0.035 + open * 0.11;
  return <group position={tail} quaternion={q}>
    {[-1, 1].map((s) => <group key={s} position={[0, s * 0.012, L - J]} rotation={[0, s * a, 0]}>
      <mesh castShadow position={[0, 0, -(L - J) / 2]} material={steel}><boxGeometry args={[0.024, 0.022, L - J]} /></mesh>
      <mesh castShadow position={[0, 0, -(L - J) + 0.17]} material={grip}><boxGeometry args={[0.04, 0.036, 0.36]} /></mesh>
      <mesh castShadow position={[s * 0.004, 0, J / 2]} material={steel}><boxGeometry args={[0.03, 0.022, J]} /></mesh>
      <mesh position={[-s * 0.012, 0, J - 0.04]} material={M('#3A3F44', 0.6, 0.4, {}, 'pl-tooth')}><boxGeometry args={[0.008, 0.024, 0.07]} /></mesh>
    </group>)}
    <mesh position={[0, 0, L - J]} material={M('#3A3F44', 0.6, 0.4, {}, 'pl-tooth')}><cylinderGeometry args={[0.022, 0.022, 0.056, 12]} /></mesh>
  </group>;
};

/** his phone, screen toward `face` (world): the real time, big */
const phoneTex = () => tex('ep11-phone', 360, 760, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 760); gr.addColorStop(0, '#1B2A4A'); gr.addColorStop(1, '#0E1524'); g.fillStyle = gr; g.fillRect(0, 0, 360, 760);
  g.textAlign = 'center'; g.fillStyle = '#BFD0EA'; g.font = F(500, 30); g.fillText('จันทร์ 11 พ.ย.', 180, 150);
  g.fillStyle = '#FFFFFF'; g.font = F(700, 132); g.fillText('05:30', 180, 300);
  g.fillStyle = '#7FE0A0'; g.font = F(600, 28); g.fillText('เวลามาตรฐานประเทศไทย', 180, 372);
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); (g as any).roundRect(30, 470, 300, 120, 22); g.fill();
  g.fillStyle = '#FFFFFF'; g.font = F(600, 28); g.fillText('ตั้งปลุกไว้  06:00', 180, 525); g.fillStyle = '#BFD0EA'; g.font = F(500, 24); g.fillText('อีก 30 นาที', 180, 565);
});
export const PhoneTime: React.FC<{position: V3; face: V3; scale?: number; roll?: number}> = ({position, face, scale = 1, roll = 0}) => {
  const q = useMemo(() => new THREE.Quaternion(), []);
  q.setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(...face), new THREE.Vector3(...position), new THREE.Vector3(0, 1, 0))).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
  return <group position={position} quaternion={q} scale={scale}>
    <mesh castShadow material={M('#1B232C', 0.4, 0.2, {}, 'ph-b')}><boxGeometry args={[0.078, 0.16, 0.009]} /></mesh>
    <mesh position={[0, 0, 0.0048]} material={useMemo(() => new THREE.MeshBasicMaterial({map: phoneTex(), toneMapped: false}), [])}><planeGeometry args={[0.07, 0.148]} /></mesh>
  </group>;
};

/** pause-bait: the national-security file on the interrogation table (lies flat, top toward −z) */
const fileTex = () => tex('ep11-file', 720, 940, (g) => {
  g.fillStyle = '#F2E9D2'; g.fillRect(0, 0, 720, 940); g.strokeStyle = NAVY; g.lineWidth = 8; g.strokeRect(18, 18, 684, 904);
  g.textAlign = 'center'; g.fillStyle = RED; g.font = F(700, 62); g.fillText('ลับที่สุด', 360, 100);
  g.fillStyle = NAVY; g.font = F(700, 46); g.fillText('แฟ้มสอบสวนความมั่นคง', 360, 172);
  g.fillRect(60, 200, 600, 5);
  g.textAlign = 'left';
  const rows: [string, string][] = [['ผู้ต้องหา', 'นาฬิกาปลุก (2 กระดิ่ง)'], ['ข้อหา', 'ปลอมแปลงเวลาราชการ'], ['พฤติการณ์', 'เดินเร็วกว่าชาติ 30 นาที'], ['อาชีพ', 'ปลุกคน'], ['อาวุธ', 'กระดิ่ง 2 ใบ ค้อน 1 อัน'], ['คำให้การ', '"ติ๊ก… ต็อก…"'], ['ท่าที', 'กระดิกเข็มใส่เจ้าหน้าที่']];
  rows.forEach(([k, v], i) => { const y = 275 + i * 86; g.fillStyle = '#6A6A70'; g.font = F(600, 30); g.fillText(k, 64, y); g.fillStyle = INK; g.font = F(700, 38); g.fillText(v, 64, y + 42); });
  g.textAlign = 'right'; g.fillStyle = '#6A6A70'; g.font = F(600, 26); g.fillText(HANDLE, 660, 900);
  g.save(); g.translate(540, 300); g.rotate(-0.25); g.strokeStyle = RED; g.fillStyle = RED; g.lineWidth = 6; g.strokeRect(-110, -44, 220, 88); g.textAlign = 'center'; g.font = F(700, 44); g.fillText('ภัยความมั่นคง', 0, 16); g.restore();
});
export const SecurityFile: React.FC<{position: V3; yaw?: number; w?: number}> = ({position, yaw = 0, w = 0.3}) => <group position={position} rotation={[0, yaw, 0]}>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} material={M('#C9A35E', 0.9, 0, {}, 'file-cover')} receiveShadow><planeGeometry args={[w * 1.08, w * 1.38]} /></mesh>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} material={useMemo(() => new THREE.MeshBasicMaterial({map: fileTex(), toneMapped: false}), [])}><planeGeometry args={[w, w * (940 / 720)]} /></mesh>
</group>;

/** sleeping Z's drifting up from his head */
const zM = [0, 1, 2].map(() => new THREE.SpriteMaterial({transparent: true, depthWrite: false, toneMapped: false}));
export const Zs: React.FC<{from: V3; t: number; k?: number}> = ({from, t, k = 1}) => {
  const map = tex('ep11-z', 64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = 6; g.font = F(700, 56); g.textAlign = 'center'; g.strokeText('Z', 32, 52); g.fillText('Z', 32, 52); });
  return <group position={from}>{[0, 1, 2].map((i) => { const u = (t * 0.55 + i / 3) % 1; zM[i].map = map; zM[i].opacity = k * Math.sin(u * Math.PI);
    return <sprite key={i} material={zM[i]} position={[0.1 + u * 0.22 + Math.sin(u * 7) * 0.03, u * 0.42, 0]} scale={0.07 + u * 0.08} />; })}</group>;
};

// =====================================================================================================
// The meditation centre: an open wooden hall on a lawn. Origin = centre of the platform, front faces +z.
// =====================================================================================================
const signTex = () => tex('ep11-sign', 1024, 300, (g) => {
  g.fillStyle = '#F2E9D2'; g.fillRect(0, 0, 1024, 300); g.strokeStyle = NAVY; g.lineWidth = 12; g.strokeRect(10, 10, 1004, 280);
  g.textAlign = 'center'; g.fillStyle = NAVY; g.font = F(700, 104); g.fillText('สำนักสอนสมาธิ', 512, 130);
  g.fillStyle = '#B5533A'; g.font = F(700, 58); g.fillText('อาจารย์ไร้เข็ม · ที่นี่ไม่มีเวลา', 512, 216);
  g.fillStyle = '#6A6A70'; g.font = F(600, 30); g.fillText(HANDLE, 512, 268);
});
export const SALA_SEAT: V3 = [0, 0.66, -1.0];   // top of the master's cushion (local)
export const Sala: React.FC<{position?: V3; /** no back wall (camera behind the master) */ open?: boolean}> = ({position = [0, 0, 0], open}) => {
  const wood = PM('#A87A52', 'sala-wood'), woodD = PM('#7A4D2E', 'sala-woodD'), cream = PM('#EDE5D2', 'sala-cream'), roof = PM('#B5533A', 'sala-roof');
  const sign = useMemo(() => new THREE.MeshBasicMaterial({map: signTex(), toneMapped: false}), []);
  return <group position={position}>
    <mesh receiveShadow castShadow position={[0, 0.15, 0]} material={wood}><boxGeometry args={[5.2, 0.3, 4.2]} /></mesh>
    <mesh receiveShadow castShadow position={[0, 0.075, 2.3]} material={woodD}><boxGeometry args={[1.8, 0.15, 0.5]} /></mesh>
    {[-1, 1].map((x) => [-1, 1].map((z) => <mesh key={x + ':' + z} castShadow position={[x * 2.4, 1.6, z * 1.9]} material={cream}><boxGeometry args={[0.2, 2.6, 0.2]} /></mesh>))}
    {!open && <mesh receiveShadow position={[0, 1.6, -2.0]} material={cream}><boxGeometry args={[5.0, 2.6, 0.1]} /></mesh>}
    {[-1, 1].map((z) => <mesh key={z} castShadow position={[0, 3.52, z * 1.28]} rotation={[z * 0.52, 0, 0]} material={roof}><boxGeometry args={[6.0, 0.12, 3.0]} /></mesh>)}
    <mesh position={[0, 2.92, 0]} material={woodD}><boxGeometry args={[5.4, 0.12, 4.4]} /></mesh>
    {/* the sign under the front eave */}
    <mesh position={[0, 2.38, 2.14]} material={woodD}><boxGeometry args={[3.7, 1.12, 0.06]} /></mesh>
    <mesh position={[0, 2.38, 2.175]} material={sign}><planeGeometry args={[3.5, 3.5 * (300 / 1024)]} /></mesh>
    {/* the master's seat */}
    <mesh castShadow receiveShadow position={[0, 0.43, -1.0]} material={woodD}><boxGeometry args={[1.3, 0.26, 1.0]} /></mesh>
    <mesh castShadow receiveShadow position={[0, 0.61, -1.0]} material={PM('#8C2F2A', 'sala-cushion')}><cylinderGeometry args={[0.42, 0.46, 0.1, 20]} /></mesh>
  </group>;
};
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
export const Lawn: React.FC = () => <group>
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}><planeGeometry args={[400, 400]} /><meshLambertMaterial color="#9FBE8B" /></mesh>
  {Array.from({length: 14}, (_, i) => { const x = -26 + i * 4 + hash(i) * 2, z = -9 - hash(i * 3) * 8, s = 1 + hash(i * 7) * 0.8;
    return <group key={i} position={[x, 0, z]} scale={s}><mesh castShadow position={[0, 1, 0]} material={PM('#7A4D2E', 'sala-woodD')}><cylinderGeometry args={[0.14, 0.18, 2, 6]} /></mesh>
      <mesh castShadow position={[0, 2.8, 0]} material={PM('#5E8F62', 'tree')}><icosahedronGeometry args={[1.35, 0]} /></mesh></group>; })}
</group>;
/** the far disciples: instanced seated white figures, all facing `face` (world). Rows start at z0 and fan out. */
export const Crowd: React.FC<{face: V3; z0?: number; rows?: number; cols?: number; step?: number}> = ({face, z0 = 3.0, rows = 44, cols = 61, step = 0.95}) => {
  const {body, head, hair} = useMemo(() => {
    const n = rows * cols; const mk = (g: THREE.BufferGeometry, m: THREE.Material) => { const o = new THREE.InstancedMesh(g, m, n); o.frustumCulled = false; o.castShadow = true; return o; };
    const body = mk(new THREE.BoxGeometry(0.46, 0.5, 0.42), new THREE.MeshLambertMaterial({color: '#F2F0E8'}));
    const head = mk(new THREE.BoxGeometry(0.19, 0.23, 0.19), new THREE.MeshLambertMaterial({color: '#FFFFFF'}));
    const hair = mk(new THREE.BoxGeometry(0.2, 0.07, 0.2), new THREE.MeshLambertMaterial({color: '#1A1513'}));
    const d = new THREE.Object3D(); const skins = ['#C99A6E', '#B98559', '#D6A87C', '#DDB088']; const c = new THREE.Color(); let k = 0;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = (q - (cols - 1) / 2) * step + (hash(k) - 0.5) * 0.25 + (r % 2) * 0.4, z = z0 + r * step + (hash(k * 3.1) - 0.5) * 0.2;
      d.position.set(x, 0.25, z); d.rotation.set(0, Math.atan2(face[0] - x, face[2] - z), 0); d.scale.setScalar(0.92 + hash(k * 1.7) * 0.16); d.updateMatrix(); body.setMatrixAt(k, d.matrix);
      d.position.y = 0.63; d.updateMatrix(); head.setMatrixAt(k, d.matrix); head.setColorAt(k, c.set(skins[k % 4]));
      d.position.y = 0.775; d.updateMatrix(); hair.setMatrixAt(k, d.matrix); k++;
    }
    return {body, head, hair};
  }, [face[0], face[2], z0, rows, cols, step]);
  return <><primitive object={body} /><primitive object={head} /><primitive object={hair} /></>;
};
