import React, {useMemo} from 'react';
import * as THREE from 'three';
import {MB, M, tex, F} from '../../pov/lib/tex';

/** EP21 — the new things only: the escape plan drawn on his cell wall, the swarm (the mosquito's million relatives), the fogging machine,
 *  the guard's gas mask, and the fog that fills the block. Everything else comes from earlier episodes. */
export type V3 = [number, number, number];
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// =====================================================================================================
// THE PLAN on the wall, in chalk: a fat man at the bars ✗ → a mosquito drinking → a flat man slipping through ✓. Faces local +z.
// =====================================================================================================
const planTex = () => tex('ep21-wallplan', 1024, 512, (g) => {
  g.clearRect(0, 0, 1024, 512); g.strokeStyle = 'rgba(245,245,236,0.92)'; g.fillStyle = 'rgba(245,245,236,0.92)'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.font = F(800, 64); g.textAlign = 'center'; g.fillText('แผนแหกคุก', 512, 70);
  const bars = (x: number) => { g.lineWidth = 7; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + i * 34, 140); g.lineTo(x + i * 34, 440); g.stroke(); } };
  const man = (x: number, w: number) => { g.lineWidth = 9; g.beginPath(); g.arc(x, 190, 34, 0, 7); g.stroke(); g.beginPath(); g.ellipse(x, 320, w, 90, 0, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(x - w * 0.5, 400); g.lineTo(x - w * 0.5, 450); g.moveTo(x + w * 0.5, 400); g.lineTo(x + w * 0.5, 450); g.stroke(); };
  bars(70); man(120, 70);
  g.strokeStyle = '#E8564A'; g.lineWidth = 12; g.beginPath(); g.moveTo(60, 160); g.lineTo(200, 420); g.moveTo(200, 160); g.lineTo(60, 420); g.stroke();
  g.strokeStyle = 'rgba(245,245,236,0.92)';
  const arrow = (x0: number, x1: number) => { g.lineWidth = 9; g.beginPath(); g.moveTo(x0, 300); g.lineTo(x1, 300); g.moveTo(x1 - 26, 278); g.lineTo(x1, 300); g.lineTo(x1 - 26, 322); g.stroke(); };
  arrow(240, 340);
  // the mosquito, drinking: body, wings, a long nose into a drop
  g.lineWidth = 8; g.beginPath(); g.ellipse(450, 290, 60, 20, -0.3, 0, 7); g.stroke(); g.beginPath(); g.ellipse(430, 240, 40, 16, -1.1, 0, 7); g.ellipse(470, 245, 40, 16, -1.6, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(398, 305); g.lineTo(370, 345); g.stroke(); g.fillStyle = '#E8564A'; g.beginPath(); g.arc(366, 360, 13, 0, 7); g.fill(); g.fillStyle = 'rgba(245,245,236,0.92)';
  arrow(560, 660);
  bars(760); g.lineWidth = 9; g.beginPath(); g.arc(803, 190, 30, 0, 7); g.stroke(); g.beginPath(); g.moveTo(803, 222); g.lineTo(803, 440); g.stroke();
  g.strokeStyle = '#7FD27A'; g.lineWidth = 12; g.beginPath(); g.moveTo(900, 290); g.lineTo(930, 330); g.lineTo(990, 240); g.stroke();
});
export const WallPlan: React.FC<{position: V3; rotation?: V3; w?: number; k?: number}> = ({position, rotation = [0, 0, 0], w = 1.3, k = 1}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: planTex(), transparent: true, depthWrite: false, toneMapped: false}), []);
  mat.opacity = cl(k); return <mesh position={position} rotation={rotation} material={mat}><planeGeometry args={[w, w / 2]} /></mesh>;
};

// =====================================================================================================
// THE SWARM: n mosquitoes as one InstancedMesh (dark body + two pale wing flecks). Each one has its own place in a cloud of radius r round
// `center`, wobbling fast; `k` 0…1 is how many are present (they arrive in hash order); `red` 0…1 is how many have a full red belly;
// `from` (optional, with `inK`) — they stream in from there. Pure function of t.
// =====================================================================================================
const dummy = new THREE.Object3D();
const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 2.6), wingGeo = new THREE.PlaneGeometry(1.2, 0.6);
export const Swarm: React.FC<{t: number; center: V3; r: V3; n?: number; k?: number; red?: number; from?: V3; inK?: number; size?: number; seed?: number; avoid?: V3}> = ({t, center, r, n = 600, k = 1, red = 0, from, inK = 1, size = 0.009, seed = 0, avoid}) => {
  const [bm, wm] = useMemo(() => [new THREE.MeshLambertMaterial({color: '#FFFFFF'}), new THREE.MeshBasicMaterial({color: '#D8DEE6', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false})], []);
  const [body, wing] = useMemo(() => { const b = new THREE.InstancedMesh(bodyGeo, bm, n), w = new THREE.InstancedMesh(wingGeo, wm, n); b.frustumCulled = w.frustumCulled = false; return [b, w]; }, [n, bm, wm]);
  const dark = new THREE.Color('#1E1D22'), blood = new THREE.Color('#D0141F');
  let m = 0;
  for (let i = 0; i < n; i++) {
    const j = i + seed * 1013; if (hash(j * 0.37) > k) continue;
    const u = hash(j * 1.7) * 6.283, v = Math.acos(2 * hash(j * 2.9) - 1), rr = Math.cbrt(hash(j * 4.1));
    let p: V3 = [center[0] + Math.sin(v) * Math.cos(u) * r[0] * rr + 0.06 * Math.sin(t * (5 + hash(j) * 4) + j), center[1] + Math.cos(v) * r[1] * rr + 0.05 * Math.sin(t * (6 + hash(j * 3) * 5) + j * 2),
      center[2] + Math.sin(v) * Math.sin(u) * r[2] * rr + 0.06 * Math.cos(t * (5 + hash(j * 5) * 4) + j)];
    if (from) { const a = cl(inK * 1.5 - hash(j * 6.3) * 0.5); p = [from[0] + (p[0] - from[0]) * a, from[1] + (p[1] - from[1]) * a, from[2] + (p[2] - from[2]) * a]; }
    if (avoid && (p[0] - avoid[0]) ** 2 + (p[1] - avoid[1]) ** 2 + (p[2] - avoid[2]) ** 2 < 0.45 ** 2) continue;   // none in the lens
    const s = size * (0.8 + hash(j * 7.7) * 0.5); const yaw = hash(j * 8.9) * 6.283 + t * 2;
    dummy.position.set(...p); dummy.rotation.set(0, yaw, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); body.setMatrixAt(m, dummy.matrix);
    body.setColorAt(m, hash(j * 9.3) < red ? blood : dark);
    dummy.position.y += s * 0.5; dummy.rotation.set(-Math.PI / 2 + 0.6 * Math.sin(t * 60 + j), yaw, 0); dummy.updateMatrix(); wing.setMatrixAt(m, dummy.matrix); m++;
  }
  body.count = wing.count = m; body.instanceMatrix.needsUpdate = wing.instanceMatrix.needsUpdate = true; if (body.instanceColor) body.instanceColor.needsUpdate = true;
  return m ? <><primitive object={body} /><primitive object={wing} /></> : null;
};

// =====================================================================================================
// THE FOGGING MACHINE (เครื่องพ่นหมอกควัน): a red tank, a long steel barrel out to the front, a pistol grip. Built along local +x, origin at the
// grip (bone space is cm, so the whole thing is in cm when hung on a hand bone). NOZZLE = the barrel's mouth in that frame.
// =====================================================================================================
export const NOZZLE: V3 = [92, 6, 0];
export const makeFogger = () => {
  const g = new THREE.Group(); const red = new THREE.MeshLambertMaterial({color: '#C8352B', flatShading: true}), steel = new THREE.MeshLambertMaterial({color: '#B7BCC0'}), blk = new THREE.MeshLambertMaterial({color: '#1E2226'});
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 30, 12), red); tank.rotation.z = Math.PI / 2; tank.position.set(14, 18, 0); g.add(tank);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, 66, 10), steel); barrel.rotation.z = Math.PI / 2; barrel.position.set(58, 6, 0); g.add(barrel);
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 3.2, 6, 10), steel); mouth.rotation.z = Math.PI / 2; mouth.position.set(90, 6, 0); g.add(mouth);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), blk); grip.position.set(0, -2, 0); g.add(grip);
  const engine = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 14), blk); engine.position.set(10, 4, 0); g.add(engine);
  g.traverse((o: any) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } }); return g;
};
/** gas mask over the box head, built in the head frame of lifekit's headFr (cm; x = his left, y = up, z = forward; ears sit at y 12):
 *  a dark rubber face plate, two round glass eyes in olive rims, one olive filter canister out front under them */
export const makeGasMask = () => {
  const g = new THREE.Group(); const blk = new THREE.MeshLambertMaterial({color: '#23272B', flatShading: true}), olive = new THREE.MeshLambertMaterial({color: '#5D6648', flatShading: true}),
    glass = new THREE.MeshBasicMaterial({color: '#9FB8C4'});
  const plate = new THREE.Mesh(new THREE.BoxGeometry(24, 22, 4), blk); plate.position.set(0, 9, 14); g.add(plate);
  [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.CircleGeometry(4.5, 14), glass); e.position.set(s * 6, 13, 16.2); g.add(e);
    const r = new THREE.Mesh(new THREE.TorusGeometry(4.8, 1.0, 6, 16), olive); r.position.set(s * 6, 13, 16.2); g.add(r); });
  const f = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 8, 12), olive); f.rotation.x = Math.PI / 2; f.position.set(0, 3, 19); g.add(f);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(27, 3, 27), blk); strap.position.set(0, 14, 0); g.add(strap);
  g.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); return g;
};

// =====================================================================================================
// FOG: big pale low-poly puffs. A jet out of `from` along `dir` while `on`, and a bank that fills the box `fill` (centre, size) by `k`.
// =====================================================================================================
const fogMats = new Map<string, THREE.Material>();
const fogM = (o: number) => { const key = (Math.round(o * 10) / 10).toFixed(1); if (!fogMats.has(key)) fogMats.set(key, new THREE.MeshLambertMaterial({color: '#E4E6E2', emissive: '#8E9290', emissiveIntensity: 0.25, flatShading: true, transparent: true, opacity: +key, depthWrite: false})); return fogMats.get(key)!; };
const puffGeo = new THREE.IcosahedronGeometry(1, 1);
export const FogJet: React.FC<{t: number; from: V3; dir: V3; t0: number; t1: number; n?: number; life?: number; reach?: number}> = ({t, from, dir, t0, t1, n = 26, life = 1.4, reach = 3.2}) => {
  if (t < t0 || t > t1 + life) return null;
  return <group position={from}>{Array.from({length: n}, (_, i) => { const born = t0 + (i / n) * life; const age = ((t - born) % life + life) % life; if (t - born < 0 || born + Math.floor((t - born) / life) * life > t1) return null;
    const u = age / life; const d = reach * Math.sqrt(u); const s = 0.08 + 0.75 * u * (0.7 + hash(i) * 0.6);
    return <mesh key={i} geometry={puffGeo} material={fogM(0.9 * (1 - u * u))} scale={s} rotation={[i, i * 2, 0]}
      position={[dir[0] * d + (hash(i * 3) - 0.5) * u * 0.8, dir[1] * d + (hash(i * 7) - 0.3) * u * 0.6, dir[2] * d + (hash(i * 5) - 0.5) * u * 0.8]} />; })}</group>;
};
export const FogBank: React.FC<{t: number; center: V3; size: V3; k: number; n?: number; seed?: number; avoid?: V3}> = ({t, center, size, k, n = 60, seed = 0, avoid}) => k <= 0.01 ? null : <group position={center}>
  {Array.from({length: n}, (_, i) => { const j = i + seed * 53; const a = cl(k * 1.5 - hash(j * 1.9) * 0.5); if (a <= 0.01) return null;
    const p: V3 = [(hash(j) - 0.5) * size[0] + 0.15 * Math.sin(t * 0.4 + j), hash(j * 2.3) * size[1], (hash(j * 3.7) - 0.5) * size[2] + 0.15 * Math.cos(t * 0.3 + j)];
    if (avoid && (p[0] + center[0] - avoid[0]) ** 2 + (p[1] + center[1] - avoid[1]) ** 2 + (p[2] + center[2] - avoid[2]) ** 2 < 1.1 ** 2) return null;
    return <mesh key={i} geometry={puffGeo} material={fogM(0.22 * a)} position={[p[0], Math.min(p[1], 1.5), p[2]]} scale={(0.25 + hash(j * 5.1) * 0.3) * (0.6 + 0.4 * a)} rotation={[j, j * 1.7, t * 0.1]} />; })}
</group>;
export {MB, M};
