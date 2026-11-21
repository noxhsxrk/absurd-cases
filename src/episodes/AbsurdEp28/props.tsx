import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, M, tex} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {label} from '../AbsurdEp8/props';
import {HANDLE} from './data';

/** EP28 คดีถุงเท้าหาย — the new things only. The accused is a plain top-load washing machine (no face): it washes, it spins, and it gives
 *  back one sock. Everything else (court, cell, cuffs, phone) comes from earlier episodes. */
export type V3 = [number, number, number];
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const UP = new THREE.Vector3(0, 1, 0);

// =====================================================================================================
// THE WASHER (the accused). Top loader, origin = the middle of its foot print on the floor, front = +z.
// lid 0 shut … 1 open (hinged at the back) · spin = the tub's angle (rad) · wob = how hard the body rattles (0…1)
// water 0…1 = how full · mode 0 wash / 1 rinse / 2 spin lights the panel
// =====================================================================================================
export const WASH = {w: 0.6, d: 0.62, h: 0.92, r: 0.235, depth: 0.58, panel: 0.15};
const SIDE = new THREE.CylinderGeometry(1, 1, 1, 28, 1, true);
const topGeo = (() => { const {w, d, r} = WASH; const s = new THREE.Shape(); s.moveTo(-w / 2, -d / 2); s.lineTo(w / 2, -d / 2); s.lineTo(w / 2, d / 2 - 0.1); s.lineTo(-w / 2, d / 2 - 0.1); s.closePath();
  const h = new THREE.Path(); h.absarc(0, 0.04, r + 0.02, 0, Math.PI * 2, true); s.holes.push(h); const g = new THREE.ShapeGeometry(s, 28); g.rotateX(-Math.PI / 2); return g; })();
const drumMat = () => new THREE.MeshStandardMaterial({side: THREE.DoubleSide, roughness: 0.35, metalness: 0.7, map: tex('ep28-drum', 256, 256, (g) => {
  g.fillStyle = '#C6CDD2'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#5E666C';
  for (let y = 10; y < 256; y += 20) for (let x = (y / 20) % 2 ? 10 : 0; x < 256; x += 20) { g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill(); }
}, [3, 1])});
const swirlMat = () => new THREE.MeshBasicMaterial({transparent: true, opacity: 0.9, toneMapped: false, map: tex('ep28-swirl', 256, 256, (g) => {
  g.fillStyle = '#7FB6D2'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#E8F6FF'; g.lineCap = 'round';
  for (let k = 0; k < 5; k++) { g.lineWidth = 7 - k; g.beginPath(); for (let a = 0; a < 7; a += 0.05) { const r = 8 + a * 16; const x = 128 + Math.cos(a + k * 1.256) * r, y = 128 + Math.sin(a + k * 1.256) * r; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }
})});
const CLOTH = ['#C8503C', '#3F6FA8', '#E8E2D2', '#5E8C4A', '#D8A23A', '#7A4E8E'];
export const Washer: React.FC<{position: V3; yaw?: number; lid?: number; spin?: number; wob?: number; water?: number; mode?: number; t: number; clothes?: number; tag?: boolean}> = ({position, yaw = 0, lid = 0, spin = 0, wob = 0, water = 0.55, mode = 0, t, clothes = 5, tag = false}) => {
  const {w, d, h, r, depth, panel} = WASH; const body = PM('#E6E8E4', 'wash'), trim = M('#9AA2A8', 0.4, 0.5), dark = MB('#1C2024');
  const drum = useMemo(drumMat, []), swirl = useMemo(swirlMat, []);
  const disp = label('ep28-panel' + mode, 512, 128, '#1E2A33', '#8EF0C8', [['ซัก', 'ล้าง', 'ปั่น'].map((s, i) => (i === mode ? `[${s}]` : s)).join('  ')], 62);
  const rx = wob * 0.018 * Math.sin(t * 61), rz = wob * 0.018 * Math.sin(t * 53 + 1), lift = wob * 0.008 * Math.abs(Math.sin(t * 47));
  const wl = h - 0.06 - depth + 0.08 + water * (depth - 0.16);   // water surface height
  return <group position={position} rotation={[0, yaw, 0]}>
    <group position={[0, lift, 0]} rotation={[rx, 0, rz]}>
      {/* walls (open top), feet, a dark plinth */}
      <mesh position={[0, h / 2, d / 2 - 0.015]} material={body} castShadow receiveShadow><boxGeometry args={[w, h, 0.03]} /></mesh>
      <mesh position={[0, h / 2, -d / 2 + 0.015]} material={body} castShadow><boxGeometry args={[w, h, 0.03]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 - 0.015), h / 2, 0]} material={body} castShadow receiveShadow><boxGeometry args={[0.03, h, d]} /></mesh>)}
      <mesh position={[0, 0.03, 0.01]} material={MB('#3A3F44')}><boxGeometry args={[w - 0.02, 0.06, d - 0.01]} /></mesh>
      <mesh geometry={topGeo} position={[0, h, 0]} material={body} receiveShadow />
      {/* the control panel along the back edge: a slanted strip with the mode display and a knob */}
      <group position={[0, h, -d / 2 + 0.06]}>
        <mesh position={[0, panel / 2, 0]} rotation={[-0.35, 0, 0]} material={body} castShadow><boxGeometry args={[w, panel, 0.1]} /></mesh>
        <mesh position={[-0.08, panel / 2 + 0.005, 0.052]} rotation={[-0.35, 0, 0]} material={disp}><planeGeometry args={[0.3, 0.075]} /></mesh>
        <group position={[0.2, panel / 2 + 0.005, 0.055]} rotation={[-0.35, 0, 0]}><mesh rotation={[Math.PI / 2, mode * 1.2, 0]} material={trim}><cylinderGeometry args={[0.032, 0.036, 0.03, 12]} /></mesh>
          <mesh position={[Math.sin(-mode * 1.2) * 0.022, Math.cos(mode * 1.2) * 0.022, 0.017]} material={MB('#E04A2A')}><boxGeometry args={[0.008, 0.008, 0.004]} /></mesh></group>
      </group>
      {/* the lid: hinged on the back edge, clear smoked panel in a white frame */}
      <group position={[0, h + 0.012, -d / 2 + 0.11]} rotation={[-lid * 1.75, 0, 0]}>
        <mesh position={[0, 0, (d - 0.1) / 2]} material={body} castShadow><boxGeometry args={[w - 0.02, 0.022, d - 0.12]} /></mesh>
        <mesh position={[0, 0.013, (d - 0.1) / 2 + 0.02]} material={M('#3E4A52', 0.1, 0.2, {transparent: true, opacity: 0.7}, 'lidglass')}><boxGeometry args={[w - 0.12, 0.004, d - 0.26]} /></mesh>
      </group>
      {/* the tub: a perforated steel drum that turns, a pulsator at the bottom, water and clothes */}
      <group position={[0, h, 0.04]}>
        <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={MB('#B8BEC2')}><ringGeometry args={[r, r + 0.025, 28]} /></mesh>
        <group rotation={[0, spin, 0]}>
          <mesh geometry={SIDE} position={[0, -depth / 2 - 0.03, 0]} scale={[r, depth, r]} material={drum} />
          <mesh position={[0, -depth - 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M('#AEB6BB', 0.4, 0.6)}><circleGeometry args={[r, 28]} /></mesh>
          <mesh position={[0, -depth + 0.01, 0]} material={M('#DADFE2', 0.5, 0.2)}><coneGeometry args={[r * 0.55, 0.08, 6]} /></mesh>
          {water > 0.02 && <mesh position={[0, wl - h, 0]} rotation={[-Math.PI / 2, 0, 0]} material={swirl}><circleGeometry args={[r - 0.004, 28]} /></mesh>}
          {Array.from({length: clothes}, (_, i) => { const a = i * 2.3 + hash(i) * 0.6, rr = r * (0.35 + hash(i * 3) * 0.4);
            return <mesh key={i} position={[Math.cos(a) * rr, wl - h + 0.012, Math.sin(a) * rr]} rotation={[0.3 * hash(i * 5), a, 0.2]} material={PM(CLOTH[i % CLOTH.length], 'cl')}><boxGeometry args={[0.11, 0.025, 0.07]} /></mesh>; })}
        </group>
        <mesh position={[0, -0.031, 0]} rotation={[-Math.PI / 2, 0, 0]} material={dark}><ringGeometry args={[r + 0.022, r + 0.03, 28]} /></mesh>
      </group>
      {tag && <mesh position={[w / 2 + 0.002, h * 0.62, 0.05]} rotation={[0, Math.PI / 2, 0]} material={label('ep28-tag2', 512, 320, '#F4EFE2', '#1C1A18', ['ของกลาง', 'คดีถุงเท้า', HANDLE], 70, '#A8322A')}><planeGeometry args={[0.32, 0.2]} /></mesh>}
    </group>
  </group>;
};
/** the world point at the mouth of the tub (for divers, splashes, the overhead camera) */
export const tubTop = (position: V3, yaw = 0): V3 => [position[0] + Math.sin(yaw) * 0.04, position[1] + WASH.h, position[2] + Math.cos(yaw) * 0.04];

// =====================================================================================================
// FROGMEN GEAR. The dive mask goes in the head's frame (cm, z out of the face) like the EP21 gas mask; the tank and the fins are placed
// in world space each frame from the body (yaw) and the foot bones.
// =====================================================================================================
export const makeDiveMask = () => {
  const g = new THREE.Group(); const yel = new THREE.MeshLambertMaterial({color: '#F2C21E', flatShading: true}), blk = new THREE.MeshLambertMaterial({color: '#1A1D21', flatShading: true}),
    glass = new THREE.MeshBasicMaterial({color: '#9CD0E6'});
  const rim = new THREE.Mesh(new THREE.BoxGeometry(23, 13, 4), yel); rim.position.set(0, 12, 15); g.add(rim);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(19, 9.5), glass); gl.position.set(0, 12, 17.1); g.add(gl);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(26, 3.5, 26), blk); strap.position.set(0, 13, 1); g.add(strap);
  // the snorkel: up the left side of the head, mouthpiece at the mouth
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 30, 8), yel); tube.position.set(13, 18, 6); g.add(tube);
  const bend = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 12, 8), yel); bend.rotation.z = Math.PI / 2; bend.position.set(7, 3.5, 13); g.add(bend);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.4, 3, 8), blk); top.position.set(13, 34, 6); g.add(top);
  g.traverse((o: any) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } }); return g;
};
/** the air tank on his back: chest = the chest bone in world; yaw / rx = the body's turn and pitch (same 'YXZ' order as body()); s = his scale */
export const Tank: React.FC<{chest: V3; yaw: number; rx?: number; s?: number}> = ({chest, yaw, rx = 0, s = 1}) => {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, yaw, 0, 'YXZ')); const o = new THREE.Vector3(0, -0.05, -0.2).multiplyScalar(s).applyQuaternion(q);
  return <group position={[chest[0] + o.x, chest[1] + o.y, chest[2] + o.z]} quaternion={q} scale={s}>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.065, 0, 0]} material={M('#E8E4DA', 0.35, 0.5)} castShadow><capsuleGeometry args={[0.06, 0.4, 4, 10]} /></mesh>)}
    <mesh position={[0, 0.3, 0]} material={M('#2A2E33', 0.5, 0.6)}><boxGeometry args={[0.1, 0.06, 0.06]} /></mesh>
  </group>;
};
/** a fin on one foot: heel = the foot bone, toe = the toe bone (world). Points on past the toe, flat. */
export const Fin: React.FC<{heel: V3; toe: V3; s?: number}> = ({heel, toe, s = 1}) => {
  const dir = new THREE.Vector3(toe[0] - heel[0], toe[1] - heel[1], toe[2] - heel[2]); const len = (dir.length() || 0.1) / s; dir.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  return <group position={heel} quaternion={q} scale={s}>
    <mesh position={[0, -0.03, len + 0.17]} material={M('#1C1F23', 0.6)} castShadow><boxGeometry args={[0.2, 0.018, 0.42]} /></mesh>
    <mesh position={[0, -0.03, len * 0.5]} material={M('#F2C21E', 0.6)} castShadow><boxGeometry args={[0.13, 0.07, len + 0.08]} /></mesh>
  </group>;
};

// =====================================================================================================
// SOCKS. The stolen pair: red with white stripes. A sock is a leg tube and a foot tube at a right angle.
// Sock: a held sock (top = where the fingers pinch it, it hangs straight down) · FootSock: worn on a foot (ankle → heel → toe, world points)
// =====================================================================================================
const sockMat = (c: string) => new THREE.MeshLambertMaterial({map: tex('ep28-sock' + c, 64, 128, (g) => { g.fillStyle = c; g.fillRect(0, 0, 64, 128); g.fillStyle = '#F4F1E8'; for (let y = 8; y < 60; y += 18) g.fillRect(0, y, 64, 7); g.fillStyle = '#F4F1E8'; g.fillRect(0, 110, 64, 18); })});
const sockMats = new Map<string, THREE.Material>(); const sm8 = (c: string) => { if (!sockMats.has(c)) sockMats.set(c, sockMat(c)); return sockMats.get(c)!; };
export const Sock: React.FC<{top: V3; c?: string; swing?: number; s?: number}> = ({top, c = '#C8382E', swing = 0, s = 1}) => <group position={top} rotation={[0, 0, swing]} scale={s}>
  <mesh position={[0, -0.12, 0]} material={sm8(c)} castShadow><cylinderGeometry args={[0.034, 0.03, 0.24, 10]} /></mesh>
  <mesh position={[0, -0.25, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={sm8(c)} castShadow><capsuleGeometry args={[0.031, 0.1, 4, 10]} /></mesh>
</group>;
const seg = (a: V3, b: V3) => { const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = d.length(); return {p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] as V3, q: new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), L}; };
export const FootSock: React.FC<{ankle: V3; heel: V3; toe: V3; c?: string}> = ({ankle, heel, toe, c = '#F2F0EA'}) => { const a = seg([ankle[0], ankle[1] + 0.13, ankle[2]], heel), b = seg(heel, toe);
  return <><mesh position={a.p} quaternion={a.q} material={MB(c)} castShadow><cylinderGeometry args={[0.058, 0.06, a.L + 0.04, 10]} /></mesh>
    <mesh position={b.p} quaternion={b.q} material={MB(c)} castShadow><capsuleGeometry args={[0.056, b.L, 4, 10]} /></mesh></>; };

// =====================================================================================================
// THE WASHER'S CUFF: one giant ring round the whole machine, a chain to an ordinary ring on the officer's wrist (or a bar).
// at = the ring's centre (it lies flat), r = its radius, b = the other end, k = how shut (1 = locked)
// =====================================================================================================
export const WasherCuff: React.FC<{at: V3; r?: number; b: V3; k?: number; sag?: number}> = ({at, r = 0.47, b, k = 1, sag = 0.18}) => {
  const steel = M('#C3C8CC', 0.25, 0.9), dark = M('#6E7479', 0.4, 0.7); const open = 1 - cl(k);
  const lock: V3 = [at[0], at[1], at[2] + r]; const n = 9;
  const pts = Array.from({length: n}, (_, i) => { const u = (i + 0.5) / n; return [lock[0] + (b[0] - lock[0]) * u, lock[1] + (b[1] - lock[1]) * u - Math.sin(u * Math.PI) * sag, lock[2] + (b[2] - lock[2]) * u] as V3; });
  return <>
    <group position={at} rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={steel} castShadow rotation={[0, 0, open * 0.9]}><torusGeometry args={[r * (1 + open * 0.15), 0.028, 8, 40, Math.PI * 2 - open * 1.4]} /></mesh>
    </group>
    <mesh position={[lock[0], lock[1], lock[2] + 0.02]} material={dark} castShadow><boxGeometry args={[0.12, 0.07, 0.07]} /></mesh>
    {pts.map((p, i) => <mesh key={i} position={p} rotation={[0, i % 2 ? Math.PI / 2 : 0, Math.PI / 2]} material={steel}><torusGeometry args={[0.03, 0.008, 6, 12]} /></mesh>)}
    <mesh position={b} rotation={[0, 0, Math.PI / 2]} material={steel} castShadow><torusGeometry args={[0.05, 0.011, 6, 18]} /></mesh>
  </>;
};

// =====================================================================================================
// LAUNDRY: a plastic basket heaped with clothes (prison brown by default)
// =====================================================================================================
export const Basket: React.FC<{position: V3; yaw?: number; c?: string; heap?: number; s?: number}> = ({position, yaw = 0, c = '#3C7FC2', heap = 1, s = 1}) => {
  const pl = M(c, 0.6, 0); const BR = ['#B0703A', '#C08448', '#9C6233', '#E8E2D2'];
  return <group position={position} rotation={[0, yaw, 0]} scale={s}>
    <mesh position={[0, 0.16, 0]} material={pl} castShadow><boxGeometry args={[0.55, 0.3, 0.4]} /></mesh>
    {[-1, 1].map((q) => <mesh key={q} position={[q * 0.28, 0.27, 0]} material={MB('#1F2A33')}><boxGeometry args={[0.01, 0.04, 0.16]} /></mesh>)}
    {heap > 0 && Array.from({length: 7}, (_, i) => <mesh key={i} position={[(hash(i) - 0.5) * 0.4, 0.31 + hash(i * 3) * 0.1 * heap, (hash(i * 7) - 0.5) * 0.26]} rotation={[hash(i * 2) * 0.6, hash(i * 5) * 3, hash(i * 9) * 0.5]} material={PM(BR[i % BR.length], 'cl')} castShadow>
      <boxGeometry args={[0.24, 0.07 * heap, 0.18]} /></mesh>)}
  </group>;
};
