import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Reflector} from 'three/examples/jsm/objects/Reflector.js';

/** EP9 offender: a tabletop mirror. The glass is a real planar reflection (three Reflector), so whatever anyone
 *  does in front of it, "the man in the mirror" does back — the whole joke is plain optics. */
const wood = new THREE.MeshStandardMaterial({color: '#8A5A36', roughness: 0.55});
const woodD = new THREE.MeshStandardMaterial({color: '#5E3A22', roughness: 0.6});
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const fogTex = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (t) return t; const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(236,240,242,1)'; g.fillRect(0, 0, 256, 320);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + hash(i) * 0.4})`; g.beginPath(); g.arc(hash(i * 3) * 256, hash(i * 7) * 320, 1 + hash(i * 11) * 3, 0, Math.PI * 2); g.fill(); }
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }; })();

export const MIR_W = 0.36, MIR_H = 0.48;
/** origin = bottom-centre of the stand on the table; glass faces +z */
export const Mirror: React.FC<{position?: [number, number, number]; yaw?: number; tilt?: number; scale?: number; fog?: number; ring?: number; dark?: boolean; res?: number}> =
  ({position = [0, 0, 0], yaw = 0, tilt = -0.08, scale = 1, fog = 0, ring = 0, dark, res = 1024}) => {
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
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {/* stand: a base and two arms holding the frame on pivots */}
      <mesh castShadow receiveShadow position={[0, 0.012, -0.02]} material={woodD}><boxGeometry args={[MIR_W * 0.8, 0.024, 0.16]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} castShadow position={[s * (MIR_W / 2 + 0.055), cy * 0.6, -0.02]} material={woodD}><boxGeometry args={[0.03, cy * 1.2, 0.03]} /></mesh>)}
      <group position={[0, cy, 0]} rotation={[tilt, 0, 0]}>
        {bars.map(([x, y, w, h], i) => <mesh key={i} castShadow receiveShadow position={[x, y, 0]} material={wood}><boxGeometry args={[w, h, 0.035]} /></mesh>)}
        <mesh castShadow position={[0, 0, -0.019]} material={woodD}><boxGeometry args={[MIR_W + 0.02, MIR_H + 0.02, 0.006]} /></mesh>
        <primitive object={refl} position={[0, 0, 0.003]} />
        {dark && <mesh position={[0, 0, 0.004]} material={new THREE.MeshStandardMaterial({color: '#0B0D10', roughness: 0.15, metalness: 0.3})}><planeGeometry args={[MIR_W, MIR_H]} /></mesh>}
        {fog > 0.005 && <mesh position={[0, 0, 0.008]} material={fogM}><planeGeometry args={[MIR_W, MIR_H]} /></mesh>}
        {ring > 0.005 && <RingLight on={ring} />}
      </group>
    </group>
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
    const g = new THREE.SphereGeometry(1, 28, 20); const p = g.attributes.position as THREE.BufferAttribute;
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
    <mesh castShadow receiveShadow geometry={geo} material={mat} position={[0, 0.33 + drop, 0]} scale={[0.3, 0.36, 0.13]} />
    <mesh castShadow material={mat} position={[0, 0.03 + drop, 0]} scale={[0.22, 0.04, 0.12]}><sphereGeometry args={[1, 16, 8]} /></mesh>
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
