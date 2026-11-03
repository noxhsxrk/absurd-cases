import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F, speckle, grime, glowTex, canvasTex} from '../../pov/lib/tex';
import {Cat} from '../../pov/fx/animals';

type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** a box: centre, size, material (cast/receive shadows) */
export const Bx: React.FC<{p: V3; s: V3; m: THREE.Material | THREE.Material[]; r?: V3; cast?: boolean}> = ({p, s, m, r, cast = true}) => (
  <mesh position={p} rotation={r} castShadow={cast} receiveShadow material={m}><boxGeometry args={s} /></mesh>
);
const texMat = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rough = 0.85, repeat?: [number, number]) => {
  const k = key + (repeat ? repeat.join('x') : '');
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({map: tex(key, w, h, draw, repeat), roughness: rough}));
  return matCache.get(k)!;
};
const matCache = new Map<string, THREE.MeshStandardMaterial>();
const paint = (key: string, base: string, rep: [number, number] = [1, 1], dirt = 0.18) => texMat(key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 2600, ['#000000', '#FFFFFF'], 0.02, 0.06, 1, 3, key.length); grime(g, 512, 512, dirt, 5, key.length + 3);
}, 0.9, rep);
const planks = (key: string, a: string, b: string, rep: [number, number]) => texMat(key, 512, 512, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(0, i * 64, 512, 64); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * 64, 512, 2); const off = hash(i) * 512; g.fillRect(off, i * 64, 2, 64); }
  speckle(g, 512, 512, 1800, ['#000', '#fff'], 0.03, 0.08, 1, 4, 9);
}, 0.7, rep);
const tiles = (key: string, base: string, line: string, n: number, rep: [number, number]) => texMat(key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 2000, ['#000', '#fff'], 0.03, 0.07, 1, 3, 4);
  g.fillStyle = line; const s = 512 / n; for (let i = 0; i <= n; i++) { g.fillRect(i * s - 1, 0, 2, 512); g.fillRect(0, i * s - 1, 512, 2); }
}, 0.6, rep);

/** room shell: floor, 4 walls (each skippable for camera access), optional ceiling */
const Room: React.FC<{w: number; d: number; h: number; wall: THREE.Material; floor: THREE.Material; ceil?: THREE.Material | null; skip?: ('n' | 's' | 'e' | 'w')[]; base?: string}> = ({w, d, h, wall, floor, ceil, skip = [], base = '#EDEAE2'}) => (
  <group>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={floor}><planeGeometry args={[w, d]} /></mesh>
    {!skip.includes('n') && <mesh receiveShadow position={[0, h / 2, -d / 2]} material={wall}><planeGeometry args={[w, h]} /></mesh>}
    {!skip.includes('s') && <mesh receiveShadow position={[0, h / 2, d / 2]} rotation={[0, Math.PI, 0]} material={wall}><planeGeometry args={[w, h]} /></mesh>}
    {!skip.includes('w') && <mesh receiveShadow position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wall}><planeGeometry args={[d, h]} /></mesh>}
    {!skip.includes('e') && <mesh receiveShadow position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={wall}><planeGeometry args={[d, h]} /></mesh>}
    {ceil && <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} material={ceil}><planeGeometry args={[w, d]} /></mesh>}
    {/* skirting */}
    {!skip.includes('n') && <Bx p={[0, 0.05, -d / 2 + 0.01]} s={[w, 0.1, 0.02]} m={M(base, 0.6)} cast={false} />}
    {!skip.includes('w') && <Bx p={[-w / 2 + 0.01, 0.05, 0]} s={[0.02, 0.1, d]} m={M(base, 0.6)} cast={false} />}
    {!skip.includes('e') && <Bx p={[w / 2 - 0.01, 0.05, 0]} s={[0.02, 0.1, d]} m={M(base, 0.6)} cast={false} />}
  </group>
);

const Glow: React.FC<{p: V3; c: string; s: number; o?: number}> = ({p, c, s, o = 0.6}) => (
  <sprite position={p} scale={s}><spriteMaterial map={glowTex()} color={c} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
);

// =====================================================================================================
// BEDROOM (night). Floor plan, metres: room x −2.1…2.1, z −2.2…2.2, ceiling 2.7.
// Bed against the north wall (x −0.8…0.8, z −2.2…−0.1, mattress top 0.56). Nightstand + lamp at x 1.15.
// Window on the west wall (z −0.9 … −0.1). Door on the east wall at z 1.2. Wardrobe NW corner of the south wall.
// The mosquito's wall spot (for the raid): west wall at z 0.9, y 1.45.
// =====================================================================================================
export const BED_TOP = 0.56;
export const MQ_WALL: V3 = [-2.085, 1.45, 0.95];
const calendar = () => tex('calendar', 256, 320, (g) => {
  g.fillStyle = '#FBFAF6'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#D9534A'; g.fillRect(0, 0, 256, 70); g.fillStyle = '#fff'; g.font = F(700, 40); g.textAlign = 'center'; g.fillText('พฤศจิกายน', 128, 50);
  g.fillStyle = '#333'; g.font = F(400, 20); for (let i = 0; i < 30; i++) g.fillText(String(i + 1), 26 + (i % 7) * 34, 108 + Math.floor(i / 7) * 44);
  g.strokeStyle = '#D9534A'; g.lineWidth = 3; g.beginPath(); g.arc(26 + 2 * 34, 102, 16, 0, Math.PI * 2); g.stroke();
});
const poster = () => tex('poster-bed', 256, 340, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 340); gr.addColorStop(0, '#F2B66B'); gr.addColorStop(1, '#D9645A'); g.fillStyle = gr; g.fillRect(0, 0, 256, 340);
  g.fillStyle = '#FCE7C5'; g.beginPath(); g.arc(128, 150, 60, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3B2F4A'; g.beginPath(); g.moveTo(0, 270); g.lineTo(90, 190); g.lineTo(160, 250); g.lineTo(256, 170); g.lineTo(256, 340); g.lineTo(0, 340); g.fill();
  g.fillStyle = '#fff'; g.font = F(700, 30); g.textAlign = 'center'; g.fillText('ทะเลหมอก', 128, 316);
});
const moonSky = () => tex('moon-sky', 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#0E1A33'); gr.addColorStop(1, '#2B3E66'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  speckle(g, 256, 140, 70, ['#FFFFFF'], 0.4, 0.9, 1, 2, 3);
  const r = g.createRadialGradient(170, 70, 0, 170, 70, 60); r.addColorStop(0, 'rgba(255,250,230,1)'); r.addColorStop(0.35, 'rgba(255,250,230,1)'); r.addColorStop(0.42, 'rgba(200,215,255,0.35)'); r.addColorStop(1, 'rgba(200,215,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#121A26'; for (let i = 0; i < 6; i++) { const x = i * 46, hh = 40 + hash(i) * 50; g.fillRect(x, 256 - hh, 42, hh); }
  g.fillStyle = '#F2D27A'; for (let i = 0; i < 14; i++) g.fillRect(hash(i * 3) * 250, 256 - hash(i * 5) * 70, 4, 4);
});

export type BedroomState = {t: number; lamp: number; made?: boolean; ceiling?: boolean; swarm?: number; door?: number; hideN?: boolean; hideS?: boolean};
export const Bedroom: React.FC<{st: BedroomState}> = ({st}) => {
  const wall = paint('bed-wall', '#B9D1C6', [2, 1], 0.12), floor = planks('bed-floor', '#B07A4E', '#A5714A', [2.5, 2.5]);
  const ceil = paint('bed-ceil', '#E9E7E0', [1, 1], 0.0);
  const sheet = M('#F1E6C8', 0.9), pillow = M('#FBF8F0', 0.9), blanket = M('#5E8FA6', 0.95), wood = M('#7A4D2E', 0.6), woodL = M('#A87A52', 0.6);
  const glassM = useMemo(() => new THREE.MeshStandardMaterial({map: moonSky(), roughness: 0.2, emissive: '#FFFFFF', emissiveMap: moonSky(), emissiveIntensity: 0.55}), []);
  const lampShade = useMemo(() => new THREE.MeshStandardMaterial({color: '#F6E4C2', roughness: 0.8, emissive: '#FFC772', emissiveIntensity: 0.15 + st.lamp * 1.6}), [st.lamp]);
  const skip: ('n' | 's' | 'e' | 'w')[] = [];
  if (st.hideS) skip.push('s'); if (st.hideN) skip.push('n');
  return (
    <group>
      <Room w={4.2} d={4.4} h={2.7} wall={wall} floor={floor} ceil={st.ceiling === false ? null : ceil} skip={skip} />
      {/* rug */}
      <mesh receiveShadow position={[0.1, 0.004, 0.75]} rotation={[-Math.PI / 2, 0, 0]} material={M('#C9B79A', 1)}><planeGeometry args={[2.0, 1.3]} /></mesh>
      {/* bed */}
      <Bx p={[0, 1.0, -2.16]} s={[1.75, 1.0, 0.08]} m={wood} />
      <Bx p={[0, 0.2, -1.15]} s={[1.7, 0.28, 2.1]} m={wood} />
      <Bx p={[0, 0.44, -1.15]} s={[1.62, 0.22, 2.02]} m={sheet} />
      {[-0.42, 0.42].map((x) => <mesh key={x} castShadow receiveShadow position={[x, 0.63, -1.88]} scale={[0.34, 0.08, 0.2]} material={pillow}><sphereGeometry args={[1, 14, 10]} /></mesh>)}
      {st.made !== false && <Bx p={[0.0, 0.6, -0.55]} s={[1.66, 0.09, 0.95]} m={blanket} />}
      <Bx p={[0.0, 0.36, -0.06]} s={[1.66, 0.5, 0.06]} m={blanket} cast={false} />
      {/* slippers */}
      {[-0.08, 0.1].map((x, i) => <mesh key={x} castShadow position={[0.55 + x, 0.025, 0.25 + i * 0.04]} rotation={[0, 0.2 * i, 0]} scale={[0.05, 0.025, 0.12]} material={M('#E07A5F', 0.9)}><sphereGeometry args={[1, 10, 8]} /></mesh>)}
      {/* nightstand + lamp + clock + water glass */}
      <Bx p={[1.17, 0.27, -1.9]} s={[0.48, 0.54, 0.42]} m={woodL} />
      <Bx p={[1.17, 0.3, -1.685]} s={[0.4, 0.02, 0.01]} m={M('#5A3A22', 0.6)} cast={false} />
      <mesh castShadow position={[1.1, 0.6, -1.95]} material={M('#3B3F46', 0.4, 0.5)}><cylinderGeometry args={[0.05, 0.07, 0.12, 12]} /></mesh>
      <mesh position={[1.1, 0.78, -1.95]} material={lampShade}><cylinderGeometry args={[0.1, 0.15, 0.2, 18, 1, true]} /></mesh>
      {st.lamp > 0.02 && <><pointLight position={[1.1, 0.8, -1.95]} color="#FFC27A" intensity={st.lamp * 3.2} distance={5} decay={1.7} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
        <Glow p={[1.1, 0.8, -1.95]} c="#FFC27A" s={0.9} o={0.5 * st.lamp} /></>}
      <Bx p={[1.3, 0.585, -1.82]} s={[0.12, 0.07, 0.05]} m={M('#24262B', 0.4)} />
      <mesh position={[1.3, 0.585, -1.794]} material={MB('#FF6A4A')}><planeGeometry args={[0.08, 0.03]} /></mesh>
      <mesh position={[1.02, 0.6, -1.78]} material={new THREE.MeshStandardMaterial({color: '#DDEFF7', transparent: true, opacity: 0.45, roughness: 0.05})}><cylinderGeometry args={[0.03, 0.026, 0.11, 12]} /></mesh>
      {/* air conditioner above the bed */}
      <Bx p={[0, 2.25, -2.1]} s={[0.95, 0.3, 0.22]} m={M('#F4F4F2', 0.5)} />
      {[0, 1, 2, 3].map((i) => <Bx key={i} p={[0, 2.13 + i * 0.012, -1.985]} s={[0.85, 0.006, 0.01]} m={M('#C9CCCF', 0.5)} cast={false} />)}
      <mesh position={[0.38, 2.3, -1.988]} material={MB('#57E08A')}><circleGeometry args={[0.008, 8]} /></mesh>
      {/* window (west wall) with curtains and moonlit sky */}
      <group position={[-2.095, 1.45, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={glassM}><planeGeometry args={[0.9, 1.0]} /></mesh>
        <Bx p={[0, 0.52, 0.02]} s={[1.0, 0.05, 0.05]} m={M('#F2EFE8', 0.6)} /><Bx p={[0, -0.52, 0.04]} s={[1.06, 0.05, 0.1]} m={M('#F2EFE8', 0.6)} />
        <Bx p={[-0.47, 0, 0.02]} s={[0.05, 1.08, 0.05]} m={M('#F2EFE8', 0.6)} /><Bx p={[0.47, 0, 0.02]} s={[0.05, 1.08, 0.05]} m={M('#F2EFE8', 0.6)} />
        <Bx p={[0, 0, 0.02]} s={[0.03, 1.0, 0.03]} m={M('#F2EFE8', 0.6)} />
        {[-1, 1].map((s) => <mesh key={s} castShadow position={[s * 0.62, -0.05, 0.08]} material={M('#D9A5A0', 0.95)}><boxGeometry args={[0.3, 1.35, 0.04]} /></mesh>)}
        <Bx p={[0, 0.72, 0.09]} s={[1.6, 0.03, 0.03]} m={M('#8A8F96', 0.4, 0.6)} />
        {/* the swarm pressing on the glass at the end */}
        {(st.swarm ?? 0) > 0 && <mesh position={[0, 0, 0.005]} material={new THREE.MeshBasicMaterial({color: '#05060A', transparent: true, opacity: Math.min(0.95, st.swarm!)})}><planeGeometry args={[0.9, 1.0]} /></mesh>}
      </group>
      {/* moonlight from the window */}
      <directionalLight position={[-6, 3.6, -0.8]} target-position={[0, 0.5, -0.6]} color="#9DB7FF" intensity={0.9 + (1 - st.lamp) * 0.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0006} />
      {/* wardrobe + door + switch */}
      <Bx p={[-1.45, 1.0, 1.95]} s={[1.1, 2.0, 0.55]} m={woodL} />
      <Bx p={[-1.45, 1.0, 1.672]} s={[0.01, 1.9, 0.005]} m={M('#5A3A22', 0.6)} cast={false} />
      {[-1, 1].map((s) => <Bx key={s} p={[-1.45 + s * 0.06, 1.05, 1.66]} s={[0.02, 0.18, 0.02]} m={M('#C9CDD2', 0.3, 0.8)} cast={false} />)}
      {/* door hinged at its south edge (z 0.77); opens into the room */}
      <group position={[2.07, 0, 0.77]} rotation={[0, -Math.PI / 2 - (st.door ?? 0) * 1.6, 0]}>
        <Bx p={[0.43, 1.02, 0]} s={[0.86, 2.04, 0.04]} m={M('#8C5B37', 0.6)} />
        <Bx p={[0.75, 1.0, 0.04]} s={[0.1, 0.03, 0.05]} m={M('#C9CDD2', 0.3, 0.8)} cast={false} />
      </group>
      {(st.door ?? 0) > 0.05 && <mesh position={[2.11, 1.02, 1.2]} rotation={[0, -Math.PI / 2, 0]} material={MB('#FFE6B0')}><planeGeometry args={[0.84, 2.0]} /></mesh>}
      <Bx p={[2.095, 1.2, 0.62]} s={[0.01, 0.12, 0.08]} m={M('#F7F7F3', 0.5)} cast={false} />
      {/* wall dressing */}
      <mesh position={[2.09, 1.55, -0.6]} rotation={[0, -Math.PI / 2, 0]} material={new THREE.MeshStandardMaterial({map: calendar(), roughness: 0.9})}><planeGeometry args={[0.32, 0.4]} /></mesh>
      <mesh position={[0.95, 1.65, -2.195]} material={new THREE.MeshStandardMaterial({map: poster(), roughness: 0.9})}><planeGeometry args={[0.42, 0.56]} /></mesh>
      <mesh position={[-1.1, 1.9, -2.195]} material={M('#F7F4EC', 0.5)}><circleGeometry args={[0.14, 24]} /></mesh>
      <mesh position={[-1.1, 1.9, -2.192]} rotation={[0, 0, -0.9]} material={M('#222', 0.5)}><planeGeometry args={[0.008, 0.1]} /></mesh>
      {/* ceiling lamp (off) */}
      <mesh position={[0, 2.68, 0.2]} material={M('#F2F0EA', 0.4)}><cylinderGeometry args={[0.25, 0.25, 0.04, 24]} /></mesh>
      {/* a fan on the floor, a laundry basket, a shelf */}
      <group position={[1.6, 0, 1.75]}><mesh castShadow position={[0, 0.3, 0]} material={M('#E8E6E0', 0.5)}><cylinderGeometry args={[0.03, 0.12, 0.6, 10]} /></mesh>
        <mesh castShadow position={[0, 0.72, 0.05]} rotation={[Math.PI / 2 - 0.1, 0, 0]} material={M('#7FB8D8', 0.5)}><torusGeometry args={[0.2, 0.015, 6, 24]} /></mesh></group>
      <mesh castShadow position={[1.55, 0.2, 0.15]} material={M('#C7A570', 0.95)}><cylinderGeometry args={[0.2, 0.17, 0.4, 14]} /></mesh>
      <Bx p={[1.88, 1.35, -0.6 + 1.2]} s={[0.3, 0.03, 0.7]} m={woodL} />
      {[0, 1, 2, 3].map((i) => <Bx key={i} p={[1.92, 1.47, 0.35 + i * 0.12]} s={[0.18, 0.22, 0.08]} m={M(['#C0504D', '#4F81BD', '#9BBB59', '#E2B33C'][i], 0.7)} />)}
      <hemisphereLight args={[st.lamp > 0.5 ? '#E8D8C4' : '#6C80B4', '#2A2A33', st.lamp > 0.5 ? 0.85 : 0.75]} />
    </group>
  );
};

// =====================================================================================================
// STREET (night): a row of two-storey townhouses, his bedroom window lit upstairs, power poles, a cat on the wall.
// Road runs along x; houses on z < −3.5 facing +z. Camera stands on the far kerb.
// =====================================================================================================
const facade = (seed: number, lit: number[]) => tex('facade' + seed + lit.join(''), 512, 512, (g) => {
  const cols = ['#E8D7B8', '#CFE0D6', '#E6C4B4', '#D8D4E6']; g.fillStyle = cols[seed % 4]; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 2500, ['#000', '#fff'], 0.02, 0.06, 1, 3, seed); grime(g, 512, 512, 0.3, 8, seed);
  // upstairs windows
  [[70, 70], [290, 70]].forEach(([x, y], i) => { g.fillStyle = lit[i] ? '#FFD98A' : '#22303F'; g.fillRect(x, y, 150, 130); g.fillStyle = '#F2EFE8'; g.fillRect(x + 72, y, 6, 130); g.fillRect(x, y + 62, 150, 6); g.strokeStyle = '#F2EFE8'; g.lineWidth = 8; g.strokeRect(x, y, 150, 130); });
  g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 240, 512, 14);
  // roller shutter downstairs
  g.fillStyle = '#9BA3AA'; g.fillRect(40, 280, 432, 232); g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 284; y < 512; y += 12) g.fillRect(40, y, 432, 3);
  g.fillStyle = '#C23A30'; g.fillRect(170, 262, 172, 14);
});
export const Street: React.FC<{t: number; out?: number}> = ({t, out = 0}) => {
  const road = texMat('road', 512, 512, (g) => { g.fillStyle = '#3B3E43'; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 6000, ['#000', '#777'], 0.05, 0.2, 1, 3, 11); g.fillStyle = '#E9E2C8'; for (let x = 0; x < 512; x += 128) g.fillRect(x, 250, 70, 10); }, 0.9, [6, 1]);
  const walk = tiles('kerb', '#9D9A93', '#7F7C76', 4, [16, 2]);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={road}><planeGeometry args={[60, 7]} /></mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, -4.6]} material={walk}><planeGeometry args={[60, 2.2]} /></mesh>
      <Bx p={[0, 0.06, -4.6]} s={[60, 0.12, 2.2]} m={M('#8C8984', 0.9)} cast={false} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 4.6]} material={walk}><planeGeometry args={[60, 2.2]} /></mesh>
      <Bx p={[0, 0.06, 4.6]} s={[60, 0.12, 2.2]} m={M('#8C8984', 0.9)} cast={false} />
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => { const dark = (out >= 1 && Math.abs(i) >= 2) || (out >= 2 && Math.abs(i) >= 1) || out >= 3; const lit = dark ? [0, 0] : i === 0 ? [0, 1] : [hash(i) > 0.6 ? 1 : 0, hash(i + 9) > 0.7 ? 1 : 0];
        const m = new THREE.MeshStandardMaterial({map: facade(Math.abs(i) + 1, lit), roughness: 0.9, emissive: '#FFFFFF', emissiveMap: facade(Math.abs(i) + 1, lit), emissiveIntensity: 0.06});
        return <group key={i} position={[i * 5.2, 0, -6.0]}>
          <Bx p={[0, 3.5, 0]} s={[5.0, 7.0, 2.5]} m={[M('#CFC7B8', 0.9), M('#CFC7B8', 0.9), M('#8A4B3A', 0.8), M('#CFC7B8', 0.9), m, M('#CFC7B8', 0.9)]} />
          <Bx p={[0, 3.6, 1.35]} s={[5.0, 0.12, 0.6]} m={M('#B9B2A5', 0.8)} />
          <Bx p={[0, 7.1, 1.35]} s={[5.2, 0.2, 0.5]} m={M('#8A4B3A', 0.8)} />
          {lit[1] ? <><pointLight position={[1.45, 5.4, 1.6]} color="#FFC77A" intensity={2.2} distance={6} decay={1.8} /><Glow p={[1.45, 5.3, 1.3]} c="#FFC77A" s={2.2} o={0.35} /></> : null}
          {/* a pot plant and a motorbike outside some houses */}
          {hash(i * 4) > 0.5 && <mesh castShadow position={[-1.9, 0.45, 1.6]} material={M('#3E7D45', 0.9)}><sphereGeometry args={[0.35, 10, 8]} /></mesh>}
        </group>; })}
      {/* power poles + cables */}
      {[-7.8, 2.6, 13].map((x) => <group key={x} position={[x, 0, -3.7]}>
        <mesh castShadow position={[0, 4.5, 0]} material={M('#A8A49C', 0.8)}><cylinderGeometry args={[0.11, 0.15, 9, 8]} /></mesh>
        <Bx p={[0, 8.2, 0]} s={[0.12, 0.12, 1.6]} m={M('#7D7A74', 0.8)} />
      </group>)}
      {[-0.6, 0, 0.6].map((z, i) => <mesh key={i} position={[2.6, 8.05 - i * 0.05, -3.7 + z]} rotation={[0, 0, Math.PI / 2]} material={M('#151515', 0.8)}><cylinderGeometry args={[0.012, 0.012, 21, 4]} /></mesh>)}
      {/* street lamp */}
      <group position={[-3.0, 0, -3.8]}>
        <mesh castShadow position={[0, 3.2, 0]} material={M('#5E636B', 0.5, 0.5)}><cylinderGeometry args={[0.06, 0.09, 6.4, 8]} /></mesh>
        <Bx p={[0, 6.35, 0.6]} s={[0.12, 0.1, 1.2]} m={M('#5E636B', 0.5, 0.5)} />
        <mesh position={[0, 6.27, 1.15]} material={MB(out >= 2 ? '#3A3F46' : '#FFE7B0')}><boxGeometry args={[0.3, 0.05, 0.16]} /></mesh>
        {out < 2 && <pointLight position={[0, 6.0, 1.2]} color="#FFD49A" intensity={14} distance={16} decay={1.7} castShadow shadow-mapSize={[1024, 1024]} />}
        {out < 2 && <Glow p={[0, 6.2, 1.15]} c="#FFD49A" s={2.6} o={0.6} />}
      </group>
      {/* wall + the neighbourhood cat watching the raid */}
      <Bx p={[9, 0.7, -4.0]} s={[3, 1.4, 0.2]} m={paint('wall-out', '#C9C2B4', [2, 1], 0.4)} />
      <group position={[8.6, 1.4, -4.0]} rotation={[0, 0.5, 0]} scale={1.3}><Cat t={t} look={-0.6} /></group>
      {/* the far side: low trees + a dark block so the background is never empty */}
      {[-14, -9, -4, 1, 6, 11, 16].map((x, i) => <mesh key={x} castShadow position={[x + hash(i) * 2, 1.6 + hash(i + 2), 7.5]} material={M('#1F3B2E', 0.9)}><sphereGeometry args={[1.4 + hash(i) * 0.6, 10, 8]} /></mesh>)}
      <hemisphereLight args={['#5D74B8', '#1C1C24', 0.65]} />
      <directionalLight position={[-10, 14, 8]} color="#8EA6E8" intensity={0.55} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-0.0006} />
    </group>
  );
};

// =====================================================================================================
// INTERROGATION ROOM: 4 × 4 m, teal walls, one-way mirror on the east wall, steel table in the middle,
// a lamp on a cord swinging over it. The jar sits at the table centre (0, 0.76, 0).
// =====================================================================================================
export const TABLE_TOP = 0.76;
export const Interro: React.FC<{t: number; swing: number; hideS?: boolean}> = ({t, swing, hideS}) => {
  const wall = paint('int-wall', '#5E8587', [2, 1], 0.25), floor = tiles('int-floor', '#7C8286', '#6A6F73', 6, [3, 3]);
  const sway = Math.sin(t * 2.1) * 0.22 * swing;
  const steel = M('#9AA2A8', 0.35, 0.7);
  return (
    <group>
      <Room w={4} d={4} h={2.8} wall={wall} floor={floor} ceil={paint('int-ceil', '#4A5557', [1, 1], 0)} skip={hideS ? ['s'] : []} base="#2B3436" />
      {/* one-way mirror */}
      <mesh position={[1.99, 1.4, 0]} rotation={[0, -Math.PI / 2, 0]} material={M('#141C22', 0.08, 0.9)}><planeGeometry args={[2.4, 1.1]} /></mesh>
      <Bx p={[1.985, 1.4, 0]} s={[0.04, 1.2, 2.5]} m={M('#2A3032', 0.5, 0.5)} cast={false} />
      {/* door with a small window */}
      <Bx p={[-1.98, 1.02, 1.1]} s={[0.05, 2.04, 0.9]} m={M('#4B5254', 0.5, 0.4)} />
      <mesh position={[-1.95, 1.55, 1.1]} rotation={[0, Math.PI / 2, 0]} material={M('#1C2A30', 0.1, 0.5)}><planeGeometry args={[0.3, 0.3]} /></mesh>
      {/* table + chairs */}
      <Bx p={[0, TABLE_TOP - 0.02, 0]} s={[1.5, 0.04, 0.85]} m={steel} />
      {[[-0.7, -0.38], [0.7, -0.38], [-0.7, 0.38], [0.7, 0.38]].map(([x, z], i) => <Bx key={i} p={[x, (TABLE_TOP - 0.04) / 2, z]} s={[0.04, TABLE_TOP - 0.04, 0.04]} m={steel} />)}
      {[[0, -0.85, 0], [0, 0.85, Math.PI]].map(([x, z, r], i) => <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
        <Bx p={[0, 0.45, 0]} s={[0.44, 0.04, 0.42]} m={M('#2F3437', 0.6, 0.3)} /><Bx p={[0, 0.72, -0.2]} s={[0.44, 0.5, 0.03]} m={M('#2F3437', 0.6, 0.3)} />
        {[[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].map(([a, b], k) => <Bx key={k} p={[a, 0.22, b]} s={[0.025, 0.44, 0.025]} m={steel} />)}
      </group>)}
      {/* a case folder + a pen + a cup on the table */}
      <Bx p={[-0.45, TABLE_TOP + 0.008, 0.1]} s={[0.24, 0.016, 0.32]} m={M('#C9A86A', 0.9)} cast={false} />
      <mesh castShadow position={[0.5, TABLE_TOP + 0.05, -0.2]} material={M('#F2F0EA', 0.5)}><cylinderGeometry args={[0.04, 0.035, 0.1, 12]} /></mesh>
      {/* the swinging lamp */}
      <group position={[0, 2.8, 0]} rotation={[0, 0, sway]}>
        <mesh position={[0, -0.45, 0]} material={M('#111', 0.6)}><cylinderGeometry args={[0.006, 0.006, 0.9, 4]} /></mesh>
        <mesh castShadow position={[0, -0.97, 0]} material={M('#2B3033', 0.4, 0.6)}><coneGeometry args={[0.22, 0.18, 18, 1, true]} /></mesh>
        <mesh position={[0, -1.02, 0]} material={MB('#FFF0C8')}><sphereGeometry args={[0.05, 10, 8]} /></mesh>
        <spotLight position={[0, -1.0, 0]} target-position={[0, -3, 0]} angle={1.05} penumbra={0.6} intensity={30} distance={6} decay={1.6} color="#FFE2A8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.001} />
        <Glow p={[0, -1.05, 0]} c="#FFE2A8" s={0.6} o={0.6} />
      </group>
      <hemisphereLight args={['#86A4A8', '#2A2F31', 1.1]} />
      <pointLight position={[0, 1.9, 1.4]} color="#BFD6DA" intensity={2.2} distance={6} decay={1.5} />
      {/* wall clock + a "no smoking" sign */}
      <mesh position={[0, 2.15, -1.99]} material={M('#F0EEE8', 0.5)}><circleGeometry args={[0.16, 24]} /></mesh>
      <mesh position={[0, 2.15, -1.985]} rotation={[0, 0, t * 0.5]} material={M('#222', 0.5)}><planeGeometry args={[0.01, 0.12]} /></mesh>
      <mesh position={[-1.0, 1.6, -1.99]} material={new THREE.MeshStandardMaterial({map: tex('nosmoke', 256, 128, (g) => { g.fillStyle = '#F4F1EA'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#B03030'; g.font = F(700, 36); g.textAlign = 'center'; g.fillText('ห้องสอบสวน 2', 128, 78); }), roughness: 0.8})}><planeGeometry args={[0.5, 0.25]} /></mesh>
    </group>
  );
};

// =====================================================================================================
// COURTROOM: warm wood, the bench raised at the north wall, the dock (a small stand for the jar) in front.
// =====================================================================================================
const scales = () => tex('scales', 256, 256, (g) => {
  g.fillStyle = '#E9DDC2'; g.beginPath(); g.arc(128, 128, 122, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#B08A3E'; g.lineWidth = 10; g.stroke();
  g.strokeStyle = '#7A5A22'; g.lineWidth = 8; g.beginPath(); g.moveTo(128, 50); g.lineTo(128, 200); g.moveTo(60, 90); g.lineTo(196, 90); g.moveTo(90, 210); g.lineTo(166, 210); g.stroke();
  [[60, 90], [196, 90]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 26, y + 60); g.moveTo(x, y); g.lineTo(x + 26, y + 60); g.stroke(); g.beginPath(); g.arc(x, y + 62, 28, 0, Math.PI); g.stroke(); });
});
export const Court: React.FC<{t: number}> = () => {
  const wall = paint('court-wall', '#E7DCC6', [2, 1], 0.1), floor = planks('court-floor', '#7B4A2E', '#6E4229', [3, 3]);
  const wood = M('#7A4526', 0.55), woodD = M('#5A3019', 0.55);
  return (
    <group>
      <Room w={8} d={9} h={4.5} wall={wall} floor={floor} ceil={paint('court-ceil', '#EEE6D4', [1, 1], 0)} base="#5A3019" />
      {/* wainscot */}
      <Bx p={[0, 0.6, -4.48]} s={[8, 1.2, 0.04]} m={wood} cast={false} />
      {[-1, 1].map((s) => <Bx key={s} p={[s * 3.98, 0.6, 0]} s={[0.04, 1.2, 9]} m={wood} cast={false} />)}
      {/* the bench */}
      <Bx p={[0, 0.25, -3.4]} s={[4.4, 0.5, 1.6]} m={woodD} />
      <Bx p={[0, 0.85, -2.65]} s={[4.4, 1.2, 0.12]} m={wood} />
      <Bx p={[0, 1.47, -2.85]} s={[4.5, 0.06, 0.6]} m={woodD} />
      <mesh position={[0, 3.2, -4.47]} material={new THREE.MeshStandardMaterial({map: scales(), roughness: 0.6, transparent: true})}><circleGeometry args={[0.7, 32]} /></mesh>
      {/* tall drapes either side of the emblem */}
      {[-1, 1].map((s) => <Bx key={s} p={[s * 1.6, 2.6, -4.42]} s={[0.9, 3.6, 0.06]} m={M('#7C1F27', 0.9)} />)}
      {/* nameplate on the bench */}
      <mesh position={[0, 1.15, -2.585]} material={new THREE.MeshStandardMaterial({map: tex('court-name', 256, 64, (g) => { g.fillStyle = '#C9A15A'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#2B1A0E'; g.font = F(700, 34); g.textAlign = 'center'; g.fillText('ผู้พิพากษา', 128, 44); }), roughness: 0.4, metalness: 0.5})}><planeGeometry args={[0.8, 0.2]} /></mesh>
      {/* the dock (a stand for the jar) */}
      <Bx p={[0, 0.5, 0.6]} s={[0.5, 1.0, 0.5]} m={wood} />
      <Bx p={[0, 1.02, 0.6]} s={[0.6, 0.04, 0.6]} m={woodD} />
      {/* gallery benches */}
      {[2.4, 3.4].map((z) => [-2.2, 2.2].map((x) => <group key={x + ':' + z}><Bx p={[x, 0.45, z]} s={[2.6, 0.08, 0.5]} m={wood} /><Bx p={[x, 0.75, z + 0.24]} s={[2.6, 0.6, 0.06]} m={wood} /></group>))}
      {/* clerk desk */}
      <Bx p={[2.6, 0.45, -1.8]} s={[1.2, 0.9, 0.6]} m={wood} />
      {/* window light */}
      {[-1.2, 1.2].map((z) => <mesh key={z} position={[-3.97, 2.6, z]} rotation={[0, Math.PI / 2, 0]} material={MB('#FFF4DC')}><planeGeometry args={[0.9, 2.0]} /></mesh>)}
      <directionalLight position={[-8, 7, 2]} target-position={[0, 0, -1]} color="#FFE6BF" intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-0.0006} />
      <hemisphereLight args={['#FFF1DA', '#4A3020', 0.75]} />
    </group>
  );
};

// =====================================================================================================
// CELL: concrete box, bars on the south side, a bench, a high barred window whose light patch sweeps across
// the wall as days pass (`days`). Tally marks drawn on the back wall: `marks` 0…14.
// =====================================================================================================
const tally = (n: number) => {
  const c = canvasTex(512, 256, (g) => {
    g.clearRect(0, 0, 512, 256); g.strokeStyle = 'rgba(245,242,232,0.92)'; g.lineWidth = 9; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const grp = Math.floor(i / 5), k = i % 5, x0 = 40 + grp * 150 + k * 26, y0 = 50 + (grp % 2) * 8;
      g.beginPath(); if (k < 4) { g.moveTo(x0, y0); g.lineTo(x0 + 3 * Math.sin(i), y0 + 140); } else { g.moveTo(x0 - 112, y0 + 110); g.lineTo(x0 + 6, y0 + 30); } g.stroke();
    }
  });
  return c;
};
export const Cell: React.FC<{t: number; days: number; marks: number}> = ({days, marks}) => {
  const wall = paint('cell-wall', '#AEB3AA', [2, 1], 0.3), floor = paint('cell-floor', '#8E918B', [2, 2], 0.2);
  const tallyTex = useMemo(() => tally(marks), [marks]);
  // sun patch from the high window moves across the back wall once per "day"
  const ph = days % 1; const day = Math.sin(ph * Math.PI);
  return (
    <group>
      <Room w={3} d={3} h={2.8} wall={wall} floor={floor} ceil={paint('cell-ceil', '#6F736D', [1, 1], 0)} skip={['s']} base="#5D615B" />
      {/* bars */}
      {Array.from({length: 13}, (_, i) => <mesh key={i} castShadow position={[-1.45 + i * 0.24, 1.4, 1.5]} material={M('#3A3E42', 0.4, 0.8)}><cylinderGeometry args={[0.018, 0.018, 2.8, 8]} /></mesh>)}
      {[0.15, 1.2, 2.6].map((y) => <Bx key={y} p={[0, y, 1.5]} s={[3, 0.05, 0.06]} m={M('#3A3E42', 0.4, 0.8)} />)}
      {/* bench + blanket */}
      <Bx p={[-0.6, 0.42, -1.2]} s={[1.6, 0.08, 0.5]} m={M('#7A6A55', 0.8)} />
      <Bx p={[-1.3, 0.21, -1.2]} s={[0.08, 0.42, 0.4]} m={M('#55585A', 0.6, 0.5)} /><Bx p={[0.1, 0.21, -1.2]} s={[0.08, 0.42, 0.4]} m={M('#55585A', 0.6, 0.5)} />
      <Bx p={[-1.05, 0.48, -1.2]} s={[0.5, 0.05, 0.45]} m={M('#55657A', 0.95)} />
      {/* toilet bucket */}
      <mesh castShadow position={[1.05, 0.2, -1.1]} material={M('#8B8F93', 0.5, 0.5)}><cylinderGeometry args={[0.16, 0.13, 0.4, 14]} /></mesh>
      {/* high window */}
      <mesh position={[0.6, 2.25, -1.495]} material={MB(day > 0.2 ? '#FFF2D0' : '#26324A')}><planeGeometry args={[0.5, 0.35]} /></mesh>
      {[-0.15, 0, 0.15].map((x) => <Bx key={x} p={[0.6 + x, 2.25, -1.48]} s={[0.025, 0.36, 0.025]} m={M('#3A3E42', 0.4, 0.8)} />)}
      {/* tally marks */}
      <mesh position={[0.35, 1.25, -1.49]} material={useMemo(() => new THREE.MeshStandardMaterial({map: tallyTex, transparent: true, roughness: 0.9}), [tallyTex])}><planeGeometry args={[1.5, 0.75]} /></mesh>
      <directionalLight position={[0.6 + (ph - 0.5) * 6, 5, -6]} target-position={[0, 0.5, 0]} color="#FFE2B0" intensity={2.2 * day + 0.05} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.001} />
      <hemisphereLight args={[day > 0.2 ? '#D2D8D0' : '#8494C0', '#3A3C3A', 1.0 + 0.35 * day]} />
      <pointLight position={[0, 2.4, 2.4]} color="#D8E4FF" intensity={1.2} distance={6} decay={1.6} />
    </group>
  );
};

// =====================================================================================================
// TOWN at night from the air: an instanced grid of blocks with lit windows, roads, street lights.
// =====================================================================================================
const winTex = () => tex('town-win', 128, 256, (g) => {
  g.fillStyle = '#2A2F3A'; g.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 256; y += 32) for (let x = 8; x < 128; x += 30) { g.fillStyle = hash(x * 7 + y * 3) > 0.55 ? '#FFD37A' : '#151922'; g.fillRect(x, y, 18, 18); }
}, [1, 1]);
export const Town: React.FC<{t: number}> = () => {
  const N = 14, S = 9;
  const blocks = useMemo(() => { const out: {p: V3; s: V3; c: string}[] = []; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < 3; k++) {
    const h = 3 + Math.pow(hash(i * 31 + j * 7 + k), 2.2) * (i > 5 && i < 9 && j < 6 ? 30 : 12); const w = 2.2 + hash(i + j * 3 + k) * 1.4;
    out.push({p: [(i - N / 2) * S + (k - 1) * 2.8, h / 2, (j - N) * S + hash(k + i) * 3], s: [w, h, w * (0.8 + hash(j + k) * 0.4)], c: ['#3A4152', '#444B5E', '#353B4A', '#4A4452'][(i + j + k) % 4]}); } return out; }, []);
  const wm = useMemo(() => new THREE.MeshStandardMaterial({map: winTex(), emissive: '#FFFFFF', emissiveMap: winTex(), emissiveIntensity: 0.9, roughness: 0.9}), []);
  const roof = M('#2A2E38', 0.9);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -N * S / 2]} material={M('#1E222A', 0.95)}><planeGeometry args={[N * S + 60, N * S + 60]} /></mesh>
      {blocks.map((b, i) => <mesh key={i} position={b.p} material={[wm, wm, roof, roof, wm, wm]}><boxGeometry args={b.s} /></mesh>)}
      {Array.from({length: 40}, (_, i) => <Glow key={i} p={[((i % 8) - 4) * S + S / 2, 0.6, -Math.floor(i / 8) * S * 2.6 - 3]} c="#FFC676" s={3} o={0.7} />)}
      {/* the moon */}
      <mesh position={[30, 48, -150]} material={MB('#FFF6DA')}><circleGeometry args={[5, 32]} /></mesh>
      <Glow p={[30, 48, -149]} c="#C8D6FF" s={28} o={0.35} />
      <hemisphereLight args={['#4C5F9A', '#141820', 0.8]} />
      <directionalLight position={[20, 30, -40]} color="#9AB0F0" intensity={0.6} />
    </group>
  );
};
