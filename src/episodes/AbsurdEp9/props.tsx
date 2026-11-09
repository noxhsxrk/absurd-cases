import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Reflector} from 'three/examples/jsm/objects/Reflector.js';

/** EP9 offender: a tabletop mirror. The glass is a real planar reflection (three Reflector), so whatever anyone
 *  does in front of it, "the man in the mirror" does back — the whole joke is plain optics. */
const wood = new THREE.MeshStandardMaterial({color: '#8A5A36', roughness: 0.55});
const woodNew = new THREE.MeshStandardMaterial({color: '#F2F0EA', roughness: 0.4});
const woodD = new THREE.MeshStandardMaterial({color: '#5E3A22', roughness: 0.6});
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const fogTex = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (t) return t; const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(236,240,242,1)'; g.fillRect(0, 0, 256, 320);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + hash(i) * 0.4})`; g.beginPath(); g.arc(hash(i * 3) * 256, hash(i * 7) * 320, 1 + hash(i * 11) * 3, 0, Math.PI * 2); g.fill(); }
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }; })();

let _wm: THREE.MeshBasicMaterial | null = null;
const wordM = (o: number) => { if (!_wm) _wm = new THREE.MeshBasicMaterial({map: fogWord(), transparent: true, depthWrite: false}); _wm.opacity = o; return _wm; };
let _mm: THREE.MeshBasicMaterial | null = null;
/** makeup drawn straight onto the glass: lashes, blush, red lips (the mirror's own "face") */
const makeupM = (o: number) => { if (!_mm) _mm = new THREE.MeshBasicMaterial({transparent: true, depthWrite: false, toneMapped: false, map: tex('ep9-makeup', 360, 480, (g) => {
  g.clearRect(0, 0, 360, 480); g.strokeStyle = '#1A1416'; g.lineWidth = 7; g.lineCap = 'round';
  [[110, 170], [250, 170]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y + 20, 36, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); for (let i = 0; i < 5; i++) { const a = Math.PI * (1.15 + i * 0.17); g.beginPath(); g.moveTo(x + Math.cos(a) * 36, y + 20 + Math.sin(a) * 36); g.lineTo(x + Math.cos(a) * 52, y + 20 + Math.sin(a) * 52); g.stroke(); } });
  g.fillStyle = 'rgba(240,120,140,0.45)'; [[85, 270], [275, 270]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 42, 26, 0, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = '#D7262B'; g.beginPath(); g.moveTo(120, 340); g.quadraticCurveTo(150, 310, 180, 328); g.quadraticCurveTo(210, 310, 240, 340); g.quadraticCurveTo(180, 395, 120, 340); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(160, 345, 30, 6);
})}); _mm.opacity = Math.min(1, o); return _mm; };
let _tm: THREE.MeshBasicMaterial | null = null;
const tagM = () => _tm ?? (_tm = new THREE.MeshBasicMaterial({map: tex('ep9-tag', 128, 72, (g) => { g.clearRect(0, 0, 128, 72); g.fillStyle = '#B0402E'; g.font = F(700, 34); g.textAlign = 'center'; g.fillText('฿199', 64, 48); }), transparent: true, toneMapped: false}));
export const MIR_W = 0.36, MIR_H = 0.48;
/** origin = bottom-centre of the stand on the table; glass faces +z */
export const Mirror: React.FC<{position?: [number, number, number]; yaw?: number; tilt?: number; scale?: number; fog?: number; ring?: number; dark?: boolean; res?: number; roll?: number; word?: number; fresh?: boolean; makeup?: number}> =
  ({position = [0, 0, 0], yaw = 0, tilt = -0.08, scale = 1, fog = 0, ring = 0, dark, res = 1024, roll = 0, word = 0, fresh, makeup = 0}) => {
  const refl = useMemo(() => {
    const r = new Reflector(new THREE.PlaneGeometry(MIR_W, MIR_H), {textureWidth: res, textureHeight: Math.round(res * MIR_H / MIR_W), color: new THREE.Color('#C8CDCF'), clipBias: 0.003});
    return r;
  }, [res]);
  const fogM = useMemo(() => new THREE.MeshBasicMaterial({map: fogTex(), transparent: true, opacity: 0, depthWrite: false}), []);
  fogM.opacity = Math.min(0.97, fog);
  refl.visible = !dark;
  const cy = 0.07 + MIR_H / 2;
  const bars: [number, number, number, number][] = [[0, MIR_H / 2 + 0.02, MIR_W + 0.08, 0.04], [0, -MIR_H / 2 - 0.02, MIR_W + 0.08, 0.04], [-MIR_W / 2 - 0.02, 0, 0.04, MIR_H], [MIR_W / 2 + 0.02, 0, 0.04, MIR_H]];
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}><group rotation={[0, 0, roll]}>
      {/* stand: a base and two arms holding the frame on pivots */}
      <mesh castShadow receiveShadow position={[0, 0.012, -0.02]} material={woodD}><boxGeometry args={[MIR_W * 0.8, 0.024, 0.16]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} castShadow position={[s * (MIR_W / 2 + 0.055), cy * 0.6, -0.02]} material={woodD}><boxGeometry args={[0.03, cy * 1.2, 0.03]} /></mesh>)}
      <group position={[0, cy, 0]} rotation={[tilt, 0, 0]}>
        {bars.map(([x, y, w, h], i) => <mesh key={i} castShadow receiveShadow position={[x, y, 0]} material={fresh ? woodNew : wood}><boxGeometry args={[w, h, 0.035]} /></mesh>)}
        <mesh castShadow position={[0, 0, -0.019]} material={woodD}><boxGeometry args={[MIR_W + 0.02, MIR_H + 0.02, 0.006]} /></mesh>
        <primitive object={refl} position={[0, 0, 0.003]} />
        {dark && <mesh position={[0, 0, 0.004]} material={new THREE.MeshStandardMaterial({color: '#0B0D10', roughness: 0.15, metalness: 0.3})}><planeGeometry args={[MIR_W, MIR_H]} /></mesh>}
        {fog > 0.005 && <mesh position={[0, 0, 0.008]} material={fogM}><planeGeometry args={[MIR_W, MIR_H]} /></mesh>}
        {fresh && <group position={[MIR_W / 2 + 0.02, MIR_H / 2 - 0.02, 0.03]} rotation={[0, 0, -0.5]}><mesh position={[0.035, -0.06, 0]} material={MB('#F6D365')}><planeGeometry args={[0.07, 0.04]} /></mesh><mesh position={[0.035, -0.06, 0.001]} material={tagM()}><planeGeometry args={[0.07, 0.04]} /></mesh></group>}
        {makeup > 0.005 && <mesh position={[0, 0, 0.009]} material={makeupM(makeup)}><planeGeometry args={[MIR_W, MIR_H]} /></mesh>}
        {ring > 0.005 && <RingLight on={ring} />}
        {word > 0.005 && <mesh position={[0, 0, 0.01]} material={wordM(word)}><planeGeometry args={[MIR_W, MIR_H]} /></mesh>}
      </group>
    </group></group>
  );
};

/** ring light clipped around the mirror frame (the makeup-channel ending) */
export const RingLight: React.FC<{on: number}> = ({on}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: '#FFFFFF', emissive: '#FFF6E6', emissiveIntensity: 0}), []);
  m.emissiveIntensity = 2.4 * on;
  return <group position={[0, 0, 0.02]}>
    <mesh material={m}><torusGeometry args={[MIR_H * 0.56, 0.01, 10, 48]} /></mesh>
    <pointLight position={[0, 0, 0.25]} color="#FFF4E2" intensity={2.2 * on} distance={2.5} decay={1.6} />
  </group>;
};

/** black garbage bag thrown over the mirror: a lumpy shell with a cinched neck at the bottom */
export const BlackBag: React.FC<{k: number; position?: [number, number, number]; yaw?: number}> = ({k, position = [0, 0, 0], yaw = 0}) => {
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(2, 2, 2, 10, 12, 6); const p = g.attributes.position as THREE.BufferAttribute;
    // a bag pulled over a rectangle: a box rounded 35 % toward a sphere, then crumpled
    for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)); v.lerp(v.clone().normalize().multiplyScalar(1.15), 0.35); p.setXYZ(i, v.x, v.y, v.z); }
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = 1 + 0.07 * Math.sin(x * 9 + y * 5) * Math.cos(z * 7 - y * 3) + 0.04 * Math.sin(x * 21 + z * 17);
      const neck = y < -0.55 ? 0.75 + (y + 1) * 0.4 : 1;
      p.setXYZ(i, x * n * neck, y, z * n * neck); }
    g.computeVertexNormals(); return g; }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({color: '#141416', roughness: 0.25, metalness: 0.1}), []);
  if (k <= 0.001) return null;
  // drops from above and settles (k 0→1)
  const drop = (1 - Math.min(1, k)) * 0.6;
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh castShadow receiveShadow geometry={geo} material={mat} position={[0, 0.34 + drop, 0]} scale={[0.24, 0.31, 0.08]} />
    <mesh castShadow material={mat} position={[0, 0.03 + drop, 0]} scale={[0.2, 0.04, 0.1]}><sphereGeometry args={[1, 16, 8]} /></mesh>
    <mesh castShadow material={mat} position={[0.05, 0.62 + drop, 0.02]} rotation={[0.3, 0, 0.6]} scale={[0.03, 0.06, 0.03]}><coneGeometry args={[1, 1.4, 6]} /></mesh>
  </group>;
};

/** toothbrush held in the right fist (attach to Bip01_R_Hand) */
export const makeToothbrush = () => {
  const g = new THREE.Group();
  const h = new THREE.Mesh(new THREE.BoxGeometry(17, 1.3, 1.0), new THREE.MeshStandardMaterial({color: '#4FA3D9', roughness: 0.4})); h.position.x = 3; g.add(h);
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.0), new THREE.MeshStandardMaterial({color: '#F4F4F2', roughness: 0.9})); b.position.set(10.5, 1.3, 0); g.add(b);
  g.traverse((o: any) => { if (o.isMesh) o.castShadow = true; });
  return g;
};

// ---------------------------------------------------------------------------------------------------------
// EP9 extras: baton, interrogation note (pause-bait), sentence sign, steam
// ---------------------------------------------------------------------------------------------------------
import {tex, F, MB} from '../../pov/lib/tex';
import {HANDLE} from './data';
export const makeBaton = () => {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({color: '#1B1D20', roughness: 0.45});
  const s = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 60, 10), m); s.rotation.z = Math.PI / 2; s.position.x = 22; g.add(s);
  const h = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 9, 8), m); h.position.set(4, 0, 3); g.add(h);
  g.traverse((o: any) => { if (o.isMesh) o.castShadow = true; }); return g;
};
const INK = '#14110F', RED = '#D7262B';
const noteTex = () => tex('ep9-note', 768, 1024, (g) => {
  g.fillStyle = '#FBF8EF'; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = 'rgba(80,110,160,0.25)'; g.lineWidth = 2; for (let y = 150; y < 1000; y += 46) { g.beginPath(); g.moveTo(30, y); g.lineTo(738, y); g.stroke(); }
  g.fillStyle = INK; g.textAlign = 'center'; g.font = F(700, 52); g.fillText('บันทึกปากคำผู้ต้องหา', 384, 90);
  g.textAlign = 'left';
  const row = (y: number, k: string, v: string, red = false, size = 38) => { g.fillStyle = '#6A6A70'; g.font = F(600, 28); g.fillText(k, 46, y); g.fillStyle = red ? RED : INK; g.font = F(700, size); g.fillText(v, 46, y + 48); };
  row(190, 'ชื่อผู้ต้องหา', 'นาย กระจก เงาวับ');
  row(300, 'ลายนิ้วมือ', 'เต็มไปหมด (ของเจ้าหน้าที่)');
  row(410, 'คำให้การ', 'ถามอะไร ตอบคำถามนั้นกลับมา');
  row(520, 'พฤติการณ์', 'ตบโต๊ะใส่ผู้หมวด 2 ครั้ง');
  g.fillStyle = '#6A6A70'; g.font = F(600, 28); g.fillText('ความเห็นพนักงานสอบสวน', 46, 650);
  g.fillStyle = RED; g.font = F(700, 46); g.fillText('ผู้ต้องหาปากดี', 46, 712); g.fillText('และท้าทายเจ้าพนักงาน', 46, 770);
  g.strokeStyle = RED; g.lineWidth = 5; g.beginPath(); g.moveTo(46, 788); g.quadraticCurveTo(300, 800, 560, 784); g.stroke();
  g.fillStyle = '#9A9AA0'; g.font = F(500, 26); g.textAlign = 'right'; g.fillText(HANDLE, 722, 990);
});
/** k = how much of the red comment is written (0…1): a white mask slides off left→right */
export const NoteSheet: React.FC<{position: [number, number, number]; rotation?: [number, number, number]; w?: number; write: number}> = ({position, rotation, w = 0.4, write}) => {
  const pm = useMemo(() => new THREE.MeshBasicMaterial({map: noteTex(), toneMapped: false}), []); const h = w * 1024 / 768;
  const k = Math.max(0, Math.min(1, write));
  return <group position={position} rotation={rotation}>
    <mesh material={pm}><planeGeometry args={[w, h]} /></mesh>
    {k < 1 && <mesh position={[(k * w * 0.9) / 2, h * (0.5 - 735 / 1024), 0.001]} material={MB('#FBF8EF')}><planeGeometry args={[w * 0.9 * (1 - k), h * 0.16]} /></mesh>}
  </group>;
};
/** the sentence plate in the cell: "3 ปี" with a red ✕ and "1 ปี" when the sentence is cut */
const signTex = (cut: boolean) => tex('ep9-sign' + cut, 512, 256, (g) => {
  g.fillStyle = '#152028'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#E6E7CF'; g.lineWidth = 6; g.strokeRect(14, 14, 484, 228);
  g.fillStyle = '#E6E7CF'; g.textAlign = 'center'; g.font = F(700, 120); g.fillText('3 ปี', 256, 170);
  g.font = F(600, 30); g.fillText('ห้องมืด · นช. กระจก', 256, 225);
  if (cut) { g.strokeStyle = RED; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(130, 60); g.lineTo(380, 190); g.moveTo(380, 60); g.lineTo(130, 190); g.stroke(); }
});
export const SentenceSign: React.FC<{position: [number, number, number]; cut: number; w?: number}> = ({position, cut, w = 0.7}) => {
  const m0 = useMemo(() => new THREE.MeshBasicMaterial({map: signTex(false), toneMapped: false}), []);
  const m1 = useMemo(() => new THREE.MeshBasicMaterial({map: signTex(true), toneMapped: false}), []);
  const m2 = useMemo(() => new THREE.MeshBasicMaterial({map: tex('ep9-1yr', 256, 128, (g) => { g.clearRect(0, 0, 256, 128); g.fillStyle = RED; g.font = F(700, 84); g.textAlign = 'center'; g.fillText('1 ปี', 128, 96); }), transparent: true, toneMapped: false}), []);
  return <group position={position}>
    <mesh material={cut > 0 ? m1 : m0}><planeGeometry args={[w, w / 2]} /></mesh>
    {cut > 0 && <mesh position={[w * 0.42, -w * 0.2, 0.01]} rotation={[0, 0, -0.12]} scale={0.6 + 0.4 * Math.min(1, cut)} material={m2}><planeGeometry args={[w * 0.5, w * 0.25]} /></mesh>}
  </group>;
};
/** steam puffs drifting from `from` toward `to` (pure function of t) */
export const Steam: React.FC<{from: [number, number, number]; to: [number, number, number]; t: number; t0: number; n?: number; size?: number}> = ({from, to, t, t0, n = 14, size = 0.22}) => {
  const u = t - t0; const mats = useMemo(() => Array.from({length: 4}, (_, i) => new THREE.MeshBasicMaterial({color: '#F4F6F7', transparent: true, opacity: 0.12 + i * 0.06, depthWrite: false})), []);
  if (u < 0) return null;
  return <group>{Array.from({length: n}, (_, i) => { const life = 1.6; const tt = ((u + i * life / n) % life) / life; if (u < i * 0.06) return null;
    const p = [from[0] + (to[0] - from[0]) * tt + Math.sin(i * 3 + u) * 0.08, from[1] + (to[1] - from[1]) * tt + tt * 0.25, from[2] + (to[2] - from[2]) * tt + Math.cos(i * 2 + u) * 0.08] as [number, number, number];
    const s = size * (0.6 + tt * 1.4) * (0.7 + hash(i) * 0.6);
    return <mesh key={i} position={p} scale={s} material={mats[Math.min(3, Math.floor((1 - Math.abs(tt - 0.5) * 2) * 4))]}><icosahedronGeometry args={[1, 1]} /></mesh>; })}</group>;
};
/** finger-written word wiped into the fog (clear strokes that show the glass behind) */
export const fogWord = () => tex('ep9-fogword', 256, 320, (g) => {
  g.clearRect(0, 0, 256, 320); g.fillStyle = 'rgba(30,36,44,0.85)'; g.font = F(700, 92); g.textAlign = 'center'; g.fillText('แค้น', 128, 190);
  g.fillStyle = 'rgba(30,36,44,0.5)'; for (let i = 0; i < 5; i++) g.fillRect(70 + i * 26, 200, 5, 30 + i * 9);   // drips
});
