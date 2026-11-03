import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F, glowTex} from '../../pov/lib/tex';
import {HANDLE} from './data';

const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ------------------------------------------------------------------------------------------------
// The mosquito (Aedes-style: black with white bands). Modelled ~6× life size (≈ 3.5 cm body) so it reads
// at phone size in room shots; macro shots just bring the camera close. Local frame: +z = head, +y = up.
// ------------------------------------------------------------------------------------------------
const stripes = () => tex('mq-stripes', 64, 256, (g) => {
  g.fillStyle = '#1C1C21'; g.fillRect(0, 0, 64, 256);
  g.fillStyle = '#E9E6DE'; for (let i = 0; i < 6; i++) g.fillRect(0, 22 + i * 38, 64, 9);
});
const legTex = () => tex('mq-leg', 16, 128, (g) => { g.fillStyle = '#1C1C21'; g.fillRect(0, 0, 16, 128); g.fillStyle = '#EDEAE2'; for (let i = 0; i < 5; i++) g.fillRect(0, 10 + i * 24, 16, 6); });
const wingMat = new THREE.MeshBasicMaterial({color: '#DCEBF7', transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false});
const wingGeo = (() => { const s = new THREE.Shape(); s.absellipse(0, 0.012, 0.0042, 0.012, 0, Math.PI * 2, false, 0); return new THREE.ShapeGeometry(s, 16); })();

type MqProps = {t: number; flap?: number; fill?: number; legsUp?: boolean; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number; eyes?: boolean};
export const Mosquito: React.FC<MqProps> = ({t, flap = 1, fill = 0, legsUp = false, position, rotation, scale = 1, eyes = true}) => {
  const abd = useMemo(() => new THREE.MeshStandardMaterial({map: stripes(), roughness: 0.45}), []);
  const blood = useMemo(() => new THREE.MeshStandardMaterial({color: '#B3232B', roughness: 0.3, transparent: true, opacity: 0.85, emissive: '#3A0508'}), []);
  const leg = useMemo(() => new THREE.MeshStandardMaterial({map: legTex(), roughness: 0.6}), []);
  const body = M('#26252B', 0.45);
  // wings: when flapping, three ghosted copies across the stroke read as a blur at 30 fps
  const strokes = flap > 0.01 ? [0, 1, 2].map((k) => 0.15 + 1.05 * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 9.7 + k * 2.1))) : [0.08];
  const legSet: [number, number, number][] = [[0.0048, 0.0042, 0.55], [0.0012, 0.0045, 1.35], [-0.0035, 0.0040, 2.25]]; // z, x, splay angle
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group rotation={[legsUp ? Math.PI : 0, 0, legsUp ? 0.25 : 0]}>
        {/* thorax + head + proboscis */}
        <mesh castShadow material={body} scale={[0.0048, 0.0052, 0.0062]}><sphereGeometry args={[1, 14, 10]} /></mesh>
        <mesh castShadow material={body} position={[0, 0.0012, 0.0072]} scale={[0.0032, 0.003, 0.003]}><sphereGeometry args={[1, 12, 8]} /></mesh>
        {eyes && [-1, 1].map((s) => <mesh key={s} position={[s * 0.0022, 0.0022, 0.0086]} material={M('#5A1418', 0.25)} scale={0.0016}><sphereGeometry args={[1, 8, 6]} /></mesh>)}
        {eyes && [-1, 1].map((s) => <mesh key={'h' + s} position={[s * 0.0021, 0.0031, 0.0098]} material={MB('#FFFFFF')} scale={0.00045}><sphereGeometry args={[1, 6, 4]} /></mesh>)}
        <mesh position={[0, -0.0018, 0.0155]} rotation={[1.25, 0, 0]} material={M('#1E1D22', 0.4)}><cylinderGeometry args={[0.00035, 0.0006, 0.016, 5]} /></mesh>
        {[-1, 1].map((s) => <mesh key={'a' + s} position={[s * 0.0016, 0.0035, 0.0115]} rotation={[0.9, 0, s * -0.5]} material={M('#2A2A30', 0.6)}><cylinderGeometry args={[0.0003, 0.0003, 0.008, 4]} /></mesh>)}
        {/* abdomen: swells and reddens with blood */}
        <group position={[0, 0.0012, -0.0125]} rotation={[0.18, 0, 0]} scale={[1 + fill * 0.75, 1 + fill * 0.75, 1 + fill * 0.25]}>
          <mesh castShadow material={abd} rotation={[Math.PI / 2, 0, 0]} scale={[0.0036, 0.0125, 0.0036]}><sphereGeometry args={[1, 14, 12]} /></mesh>
          {fill > 0.02 && <mesh material={blood} rotation={[Math.PI / 2, 0, 0]} scale={[0.0038 * Math.min(1, fill * 1.4), 0.0118, 0.0038 * Math.min(1, fill * 1.4)]}><sphereGeometry args={[1, 12, 10]} /></mesh>}
        </group>
        {/* six long banded legs: femur up and out, tibia down to the surface */}
        {legSet.map(([z, x, a], i) => [-1, 1].map((s) => (
          <group key={i + '' + s} position={[s * x * 0.6, -0.002, z]} rotation={[0, s * (a - Math.PI / 2) * 0.55, 0]}>
            <mesh material={leg} position={[s * 0.0055, 0.004, 0]} rotation={[0, 0, s * -1.0]}><cylinderGeometry args={[0.00035, 0.00045, 0.013, 4]} /></mesh>
            <mesh material={leg} position={[s * 0.0125, -0.0015, 0]} rotation={[0, 0, s * 0.55]}><cylinderGeometry args={[0.00025, 0.00035, 0.016, 4]} /></mesh>
          </group>
        )))}
        {/* wings */}
        {[-1, 1].map((s) => strokes.map((a, k) => (
          <group key={s + ':' + k} position={[s * 0.002, 0.0045, 0.002]} rotation={[0, 0, s * -a]}>
            <mesh geometry={wingGeo} material={strokes.length > 1 ? wingMatGhost : wingMat} rotation={[-Math.PI / 2 + 0.12, 0, s * (Math.PI / 2 + 0.25)]} />
          </group>
        )))}
      </group>
    </group>
  );
};
const wingMatGhost = new THREE.MeshBasicMaterial({color: '#DCEBF7', transparent: true, opacity: 0.17, side: THREE.DoubleSide, depthWrite: false});

/** A flying path that wobbles like a real mosquito: drifting with quick side-steps. */
export const mqPath = (t: number, a: [number, number, number], b: [number, number, number], t0: number, t1: number, wob = 0.05): {p: [number, number, number]; yaw: number} => {
  const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  const e = k * k * (3 - 2 * k);
  const n = (s: number) => Math.sin(t * 7.3 + s) * 0.6 + Math.sin(t * 13.1 + s * 2) * 0.4;
  const p: [number, number, number] = [a[0] + (b[0] - a[0]) * e + n(1) * wob, a[1] + (b[1] - a[1]) * e + n(2) * wob * 0.7, a[2] + (b[2] - a[2]) * e + n(3) * wob];
  return {p, yaw: Math.atan2(b[0] - a[0], b[2] - a[2]) + n(4) * 0.3};
};

// ------------------------------------------------------------------------------------------------
// Handcuffs: big glossy white cuffs (comically larger than the suspect), popped on with a spring.
// ------------------------------------------------------------------------------------------------
export const Handcuffs: React.FC<{k: number; position?: [number, number, number]; rotation?: [number, number, number]; size?: number}> = ({k, position, rotation, size = 1}) => {
  if (k <= 0.001) return null;
  const m = M('#F3F3F0', 0.18, 0.35);
  const r = 0.024 * size;
  return (
    <group position={position} rotation={rotation} scale={k}>
      {[-1, 1].map((s) => <group key={s} position={[s * r * 1.45, 0, 0]}>
        <mesh castShadow material={m}><torusGeometry args={[r, r * 0.16, 10, 28]} /></mesh>
        <mesh castShadow material={m} position={[s * r * 0.95, 0, 0]} scale={[r * 0.5, r * 0.42, r * 0.34]}><boxGeometry /></mesh>
      </group>)}
      {[-1, 0, 1].map((i) => <mesh key={i} material={M('#DADAD6', 0.2, 0.6)} position={[i * r * 0.32, 0, 0]} rotation={[0, i === 0 ? Math.PI / 2 : 0, 0]}><torusGeometry args={[r * 0.17, r * 0.05, 6, 12]} /></mesh>)}
    </group>
  );
};

// ------------------------------------------------------------------------------------------------
// Evidence jar
// ------------------------------------------------------------------------------------------------
const jarLabel = () => tex('jar-label', 256, 128, (g) => {
  g.fillStyle = '#F4EFE2'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#B0302E'; g.lineWidth = 6; g.strokeRect(6, 6, 244, 116);
  g.fillStyle = '#B0302E'; g.font = F(700, 40); g.textAlign = 'center'; g.fillText('หลักฐาน', 128, 58); g.fillStyle = '#2A2A2E'; g.font = F(600, 26); g.fillText('คดีที่ 191/2569', 128, 92); g.font = F(500, 15); g.fillStyle = '#6A6A70'; g.fillText(HANDLE, 128, 114);
});
export const Jar: React.FC<{position?: [number, number, number]; scale?: number; children?: React.ReactNode}> = ({position, scale = 1, children}) => {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({color: '#D8EEF2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide}), []);
  const rim = useMemo(() => new THREE.MeshStandardMaterial({color: '#E9F6F8', roughness: 0.1, transparent: true, opacity: 0.55}), []);
  const label = useMemo(() => new THREE.MeshStandardMaterial({map: jarLabel(), roughness: 0.8, side: THREE.DoubleSide}), []);
  return (
    <group position={position} scale={scale}>
      {children}
      <mesh material={glass} position={[0, 0.075, 0]}><cylinderGeometry args={[0.055, 0.055, 0.15, 28, 1, true]} /></mesh>
      <mesh material={rim} position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.055, 28]} /></mesh>
      <mesh material={rim} position={[0, 0.15, 0]}><torusGeometry args={[0.055, 0.003, 6, 28]} /></mesh>
      <mesh castShadow material={M('#9AA3AC', 0.3, 0.8)} position={[0, 0.162, 0]}><cylinderGeometry args={[0.058, 0.058, 0.022, 28]} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} material={M('#2A2E33', 0.5)} position={[Math.cos(i * 1.26) * 0.025, 0.1735, Math.sin(i * 1.26) * 0.025]}><cylinderGeometry args={[0.003, 0.003, 0.003, 6]} /></mesh>)}
      <mesh material={label} position={[0, 0.06, 0]}><cylinderGeometry args={[0.0565, 0.0565, 0.05, 20, 1, true, -0.75, 1.5]} /></mesh>
    </group>
  );
};

// ------------------------------------------------------------------------------------------------
// Police van with a flashing light bar (red / blue). `phase` drives the flash; lights are real point lights.
// ------------------------------------------------------------------------------------------------
const vanSide = () => tex('van-side', 512, 192, (g) => {
  g.fillStyle = '#F2F3F5'; g.fillRect(0, 0, 512, 192); g.fillStyle = '#1F3A68'; g.fillRect(0, 108, 512, 34); g.fillStyle = '#C8323A'; g.fillRect(0, 142, 512, 8);
  g.fillStyle = '#1F3A68'; g.font = F(700, 64); g.textAlign = 'center'; g.fillText('ตำรวจ', 300, 92); g.fillStyle = '#F2F3F5'; g.font = F(600, 22); g.fillText('หน่วยปฏิบัติการพิเศษ · 191', 256, 133);
});
export const Van: React.FC<{t: number; position: [number, number, number]; yaw: number; flashing?: boolean; roll?: number}> = ({t, position, yaw, flashing = true, roll = 0}) => {
  const side = useMemo(() => new THREE.MeshStandardMaterial({map: vanSide(), roughness: 0.45}), []);
  const white = M('#EEF0F2', 0.45), glass = M('#1A2330', 0.15, 0.4), tyre = M('#16171A', 0.9), rimM = M('#A7ADB4', 0.4, 0.6);
  const ph = Math.floor(t * 7) % 2; const on = flashing ? 1 : 0;
  const red = ph === 0 ? on : 0.12 * on, blue = ph === 1 ? on : 0.12 * on;
  return (
    <group position={position} rotation={[0, yaw, roll]}>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]} material={[white, white, white, white, side, side]}><boxGeometry args={[4.8, 1.55, 1.95]} /></mesh>
      <mesh castShadow position={[2.05, 0.75, 0]} material={white}><boxGeometry args={[0.9, 0.9, 1.9]} /></mesh>
      <mesh position={[2.0, 1.45, 0]} rotation={[0, 0, -0.35]} material={glass}><boxGeometry args={[0.6, 0.62, 1.8]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[0.9, 1.45, s * 0.985]} material={glass}><boxGeometry args={[2.8, 0.42, 0.02]} /></mesh>)}
      {[[-1.6, -1], [-1.6, 1], [1.7, -1], [1.7, 1]].map(([x, s], i) => <group key={i} position={[x, 0.36, s * 0.93]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow material={tyre}><cylinderGeometry args={[0.36, 0.36, 0.26, 18]} /></mesh>
        <mesh material={rimM} position={[0, s * 0.135, 0]}><cylinderGeometry args={[0.2, 0.2, 0.02, 12]} /></mesh>
      </group>)}
      {/* headlights */}
      {[-1, 1].map((s) => <mesh key={'h' + s} position={[2.51, 0.82, s * 0.65]} material={MB('#FFF6D8')}><boxGeometry args={[0.02, 0.16, 0.3]} /></mesh>)}
      {/* light bar */}
      <mesh position={[0.6, 1.88, 0]} material={M('#2A2D33', 0.5)}><boxGeometry args={[0.5, 0.1, 1.5]} /></mesh>
      <mesh position={[0.6, 1.98, -0.38]} material={new THREE.MeshBasicMaterial({color: new THREE.Color('#FF2A2A').multiplyScalar(0.25 + red * 1.4), toneMapped: false})}><boxGeometry args={[0.42, 0.14, 0.66]} /></mesh>
      <mesh position={[0.6, 1.98, 0.38]} material={new THREE.MeshBasicMaterial({color: new THREE.Color('#2A5BFF').multiplyScalar(0.25 + blue * 1.4), toneMapped: false})}><boxGeometry args={[0.42, 0.14, 0.66]} /></mesh>
      <pointLight position={[0.6, 2.3, -0.8]} color="#FF3030" intensity={red * 9} distance={11} decay={1.6} />
      <pointLight position={[0.6, 2.3, 0.8]} color="#3D6BFF" intensity={blue * 9} distance={11} decay={1.6} />
      {[-1, 1].map((s) => <sprite key={'g' + s} position={[0.6, 2.0, s * 0.38]} scale={1.6}><spriteMaterial map={glowTex()} color={s < 0 ? '#FF3B3B' : '#4A74FF'} transparent opacity={(s < 0 ? red : blue) * 0.85} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>)}
    </group>
  );
};

// ------------------------------------------------------------------------------------------------
// The swarm: a million relatives, drawn as a flowing cloud of dark points around a moving centre.
// ------------------------------------------------------------------------------------------------
const dotTex = () => tex('swarm-dot', 32, 32, (g) => { g.clearRect(0, 0, 32, 32); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(16, 16, 13, 9, 0.4, 0, Math.PI * 2); g.fill(); });
export const Swarm: React.FC<{t: number; center: [number, number, number]; radius: [number, number, number]; n?: number; size?: number; color?: string; opacity?: number}> = ({t, center, radius, n = 6000, size = 0.06, color = '#0B0C10', opacity = 0.95}) => {
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); return g; }, [n]);
  const mat = useMemo(() => new THREE.PointsMaterial({color, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false, fog: false, map: dotTex(), alphaTest: 0.35}), [color, size, opacity]);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < n; i++) {
    const u = hash(i * 1.7), v = hash(i * 2.3 + 1), w = hash(i * 3.1 + 2);
    // denser core: radius ~ cube root of a skewed random
    const rr = Math.pow(hash(i * 4.7 + 3), 0.6);
    const th = u * Math.PI * 2 + t * (0.6 + v * 0.8) * (i % 2 ? 1 : -1), ph = Math.acos(2 * v - 1);
    const wob = 0.12 * Math.sin(t * (3 + w * 5) + i);
    pos.setXYZ(i, center[0] + radius[0] * rr * Math.sin(ph) * Math.cos(th) * (1 + wob), center[1] + radius[1] * rr * Math.cos(ph) + Math.sin(t * 4 + i) * 0.04 * radius[1], center[2] + radius[2] * rr * Math.sin(ph) * Math.sin(th) * (1 + wob));
  }
  pos.needsUpdate = true; geo.computeBoundingSphere();
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

// ------------------------------------------------------------------------------------------------
// Riot shield (held on a commando's left forearm) and the judge's gavel (in the right hand). Bone space = cm.
// ------------------------------------------------------------------------------------------------
const shieldTex = () => tex('shield', 256, 512, (g) => {
  g.clearRect(0, 0, 256, 512); g.fillStyle = 'rgba(190,215,235,0.28)'; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = 'rgba(30,40,55,0.9)'; g.lineWidth = 14; g.strokeRect(7, 7, 242, 498);
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.font = F(700, 56); g.textAlign = 'center'; g.fillText('ตำรวจ', 128, 120);
});
export const makeShield = () => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(52, 92, 1.2), new THREE.MeshStandardMaterial({map: shieldTex(), transparent: true, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide}));
  m.castShadow = false; return m;
};
export const makeGavel = () => {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({color: '#6B3E22', roughness: 0.5});
  const h = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 26, 8), wood); h.rotation.z = Math.PI / 2; h.position.x = 10; g.add(h);
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 11, 12), wood); hd.position.x = 22; g.add(hd);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 1.2, 12), new THREE.MeshStandardMaterial({color: '#C9A15A', roughness: 0.35, metalness: 0.7})); b.position.set(22, s * 3.6, 0); g.add(b); }
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  return g;
};
export const makePhone = () => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(7.4, 15, 1), new THREE.MeshStandardMaterial({color: '#1C1F27', roughness: 0.3})));
  const s = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 13.6), new THREE.MeshBasicMaterial({color: '#7FE0A0'})); s.position.z = 0.55; g.add(s);
  return g;
};

// ------------------------------------------------------------------------------------------------
// The charge on a small navy plate IN the scene (reference: "ATTEMPTED MURDER" is a tilted 3D sign next to the
// accused, not a 2D overlay). Billboarded toward the camera by the shot that places it.
// ------------------------------------------------------------------------------------------------
const plateTex = (text: string) => tex('plate-' + text, 1024, 256, (g) => {
  g.fillStyle = '#1E2B3C'; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * 1024, Math.random() * 256, 2, 2);
  g.fillStyle = '#F1EFE6'; g.font = F(600, 112); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 512, 134);
});
export const ChargePlate: React.FC<{text: string; position: [number, number, number]; lookAt: [number, number, number]; width?: number; tilt?: number}> = ({text, position, lookAt, width = 0.36, tilt = 0.12}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: plateTex(text), toneMapped: false, side: THREE.DoubleSide}), [text]);
  const q = useMemo(() => {
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(...lookAt), new THREE.Vector3(...position), new THREE.Vector3(0, 1, 0));  // +z toward the camera
    const e = new THREE.Euler().setFromRotationMatrix(m); return [e.x, e.y + tilt, e.z] as [number, number, number];
  }, [position, lookAt, tilt]);
  return <group position={position} rotation={q}>
    <mesh material={mat}><planeGeometry args={[width, width / 4]} /></mesh>
    <mesh position={[0, 0, -0.004]} material={M('#121A26', 0.9)}><boxGeometry args={[width + 0.012, width / 4 + 0.012, 0.006]} /></mesh>
  </group>;
};

// the case folder for the ECU insert (reference: "CASE 003: COCONUT", "RECORD")
const folderTex = () => tex('case-folder', 1024, 1280, (g) => {
  g.fillStyle = '#C9A86A'; g.fillRect(0, 0, 1024, 1280);
  g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 1500; i++) g.fillRect(Math.random() * 1024, Math.random() * 1280, 3, 3);
  g.fillStyle = '#B8975A'; g.fillRect(0, 0, 1024, 120); g.fillStyle = '#F4EFE2'; g.fillRect(90, 160, 844, 560);
  g.strokeStyle = '#B0302E'; g.lineWidth = 8; g.strokeRect(110, 180, 804, 520);
  g.textAlign = 'center'; g.fillStyle = '#1E2B3C'; g.font = F(700, 86); g.fillText('แฟ้มคดี 191/2569', 512, 300);
  g.fillStyle = '#2A2A2E'; g.font = F(600, 64); g.fillText('ผู้ต้องหา: ยุง 1 ตัว', 512, 420);
  g.fillStyle = '#B0302E'; g.font = F(700, 72); g.fillText('ข้อหา: ทำร้ายร่างกาย', 512, 540);
  g.fillStyle = '#6A6A70'; g.font = F(500, 44); g.fillText(HANDLE, 512, 650);
  g.fillStyle = '#B0302E'; g.font = F(700, 120); g.save(); g.translate(512, 980); g.rotate(-0.18); g.globalAlpha = 0.85; g.strokeStyle = '#B0302E'; g.lineWidth = 12; g.strokeRect(-330, -90, 660, 170); g.fillText('ลับ', 0, 44); g.restore();
});
export const CaseFolder: React.FC<{position: [number, number, number]; rotation?: [number, number, number]}> = ({position, rotation = [0, 0, 0]}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: folderTex(), toneMapped: false}), []);  // unlit so the paper reads flat under the lamp
  return <group position={position} rotation={rotation}>
    <mesh castShadow receiveShadow material={M('#C9A86A', 0.9)}><boxGeometry args={[0.24, 0.014, 0.32]} /></mesh>
    <mesh position={[0, 0.0075, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat}><planeGeometry args={[0.24, 0.32]} /></mesh>
  </group>;
};
