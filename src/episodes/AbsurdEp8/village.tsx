import React from 'react';
import * as THREE from 'three';
import {M, MB, tex, speckle, grime} from '../../pov/lib/tex';
import {Bx} from '../AbsurdEp1/sets';
import {V3} from './data';

/** Thai housing-estate street (หมู่บ้านจัดสรร) by day: a 6 m road along x (z in [-3, 3]), kerbs, grass verges and footpaths,
 *  detached two-storey houses on both sides behind low walls with sliding gates, small yards with trees, street lamps,
 *  power poles and a parked pickup. Original design; reused by any episode that starts "ชายคนนี้เดินเล่นในหมู่บ้าน". */
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const cache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, base: string, draw: (g: CanvasRenderingContext2D) => void, rep: [number, number], rough = 0.9) => {
  const k = key + rep.join('x');
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({map: tex(key, 512, 512, (g) => { g.fillStyle = base; g.fillRect(0, 0, 512, 512); draw(g); }, rep), roughness: rough}));
  return cache.get(k)!;
};
const plaster = (key: string, base: string) => tm('vp-' + key, base, (g) => { speckle(g, 512, 512, 2600, ['#000', '#fff'], 0.02, 0.06, 1, 3, key.length); grime(g, 512, 512, 0.22, 5, key.length + 3); }, [2, 2]);
const ROAD_W = 6;
const PASTEL = ['#E0D3A8', '#C9D6BD', '#E2C7AE', '#D2CFC6', '#E4DBB8', '#C2D0D8'];
const ROOF = ['#8C3F2A', '#4E5C6E', '#6E3524', '#5B605A'];
const GLASS = M('#2A3A44', 0.15, 0.2); const FRAME = M('#5A3B24', 0.7); const TRIM = M('#EDEBE4', 0.8); const GATE = M('#30353A', 0.45, 0.6);

/** a pitched roof: triangular prism, ridge along x */
const Roof: React.FC<{p: V3; w: number; d: number; h: number; c: string}> = ({p, w, d, h, c}) => {
  const geo = React.useMemo(() => { const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: w, bevelEnabled: false}); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2); return g; }, [w, d, h]);
  return <mesh geometry={geo} position={p} castShadow receiveShadow material={M(c, 0.75)} />;
};
const Tree: React.FC<{p: V3; seed: number}> = ({p, seed}) => {
  const h = 2.6 + hash(seed) * 1.0; const leaf = M(['#3F5E2A', '#466A2E', '#3A5628'][seed % 3], 0.85);
  return <group position={p}>
    <mesh castShadow position={[0, h / 2, 0]} material={M('#5A4330', 0.9)}><cylinderGeometry args={[0.1, 0.14, h, 7]} /></mesh>
    {[0, 1, 2, 3, 4].map((k) => <mesh key={k} castShadow position={[(hash(seed + k) - 0.5) * 1.4, h + (hash(seed * 3 + k) - 0.3) * 0.9, (hash(seed * 7 + k) - 0.5) * 1.4]} material={leaf}>
      <icosahedronGeometry args={[0.8 + hash(seed + k * 5) * 0.5, 0]} /></mesh>)}
  </group>;
};
/** one house; side = -1 (z < 0) or +1 (z > 0); its front faces the road */
const House: React.FC<{x: number; side: number; i: number}> = ({x, side, i}) => {
  const W = 7 + hash(i) * 1.5, D = 7.5; const s = side;
  const front = s * (ROAD_W / 2 + 1.6 + 1.0 + 3.6); const zc = front + s * D / 2;
  const wall = plaster('h' + (i % 6), PASTEL[i % 6]); const fz = front - s * 0.03;
  const yard = s * (ROAD_W / 2 + 2.6 + 1.8); const fenceZ = s * (ROAD_W / 2 + 2.6);
  return <group>
    <Bx p={[x, 3.0, zc]} s={[W, 6.0, D]} m={wall} />
    <Bx p={[x, 3.05, zc]} s={[W + 0.3, 0.18, D + 0.3]} m={TRIM} />
    <Roof p={[x, 6.0, zc]} w={W + 1.0} d={D + 1.2} h={2.2} c={ROOF[i % 4]} />
    {[-1, 1].map((k) => [0, 1].map((fl) => (fl === 0 && k === -1) ? null :
      <group key={`${k}${fl}`} position={[x + k * W * 0.28, fl ? 4.4 : 1.6, fz]}>
        <Bx p={[0, 0, -s * 0.01]} s={[1.75, 1.45, 0.05]} m={FRAME} cast={false} /><Bx p={[0, 0, -s * 0.03]} s={[1.6, 1.3, 0.04]} m={GLASS} cast={false} />
        <Bx p={[0, -0.74, -s * 0.09]} s={[1.9, 0.06, 0.16]} m={TRIM} />
      </group>))}
    <Bx p={[x - W * 0.28, 1.1, fz - s * 0.01]} s={[1.0, 2.2, 0.06]} m={FRAME} cast={false} />
    <Bx p={[x - W * 0.28, 2.5, front - s * 0.8]} s={[2.2, 0.12, 1.8]} m={M(ROOF[i % 4], 0.75)} />
    {[-1, 1].map((k) => <Bx key={k} p={[x - W * 0.28 + k * 1.0, 1.25, front - s * 1.6]} s={[0.14, 2.5, 0.14]} m={TRIM} />)}
    <Bx p={[x + W * 0.28, 3.2, fz - s * 0.25]} s={[0.8, 0.55, 0.3]} m={TRIM} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, yard]} material={M('#5E7A3A', 0.95)}><planeGeometry args={[W + 1.0, 3.6]} /></mesh>
    <Bx p={[x - W * 0.33, 0.6, fenceZ]} s={[W * 0.34, 1.2, 0.18]} m={plaster('fence', '#E6E2D6')} />
    <Bx p={[x + W * 0.3, 0.6, fenceZ]} s={[W * 0.4, 1.2, 0.18]} m={plaster('fence', '#E6E2D6')} />
    {Array.from({length: 10}, (_, b) => <Bx key={b} p={[x - 0.3 - 1.1 + b * 0.25, 0.75, fenceZ]} s={[0.04, 1.4, 0.05]} m={GATE} />)}
    <Bx p={[x - 0.3, 1.43, fenceZ]} s={[2.6, 0.06, 0.06]} m={GATE} />
    {hash(i * 3) < 0.85 && <Tree p={[x + W * 0.32, 0.06, s * (ROAD_W / 2 + 4.4)]} seed={i * 11 + 3} />}
    {hash(i * 5) < 0.4 && <mesh castShadow position={[x - W * 0.42, 0.4, s * (ROAD_W / 2 + 3.2)]} material={M('#3E7D45', 0.9)}><sphereGeometry args={[0.35, 10, 8]} /></mesh>}
  </group>;
};

export const Village: React.FC<{x0?: number; x1?: number; clear?: [number, number]}> = ({x0 = -34, x1 = 34, clear}) => {
  const road = tm('vroad', '#3E4044', (g) => { speckle(g, 512, 512, 7000, ['#000', '#888'], 0.05, 0.18, 1, 3, 21); grime(g, 512, 512, 0.25, 6, 4); }, [24, 2], 0.92);
  const path = tm('vpath', '#A8A39A', (g) => { speckle(g, 512, 512, 2200, ['#000', '#fff'], 0.03, 0.07, 1, 3, 5); g.fillStyle = '#8A867E'; for (let k = 0; k <= 4; k++) g.fillRect(k * 128 - 1, 0, 2, 512); }, [60, 1], 0.8);
  const grass = tm('vgrass', '#5B7838', (g) => { speckle(g, 512, 512, 9000, ['#2E4A1E', '#8BA65A'], 0.08, 0.25, 1, 2, 31); }, [40, 8], 0.95);
  const xs: [number, number][] = []; for (const s of [-1, 1]) { let x = x0 + hash(s + 7) * 4; let i = 0; while (x < x1) { xs.push([x, s]); x += 9.6 + hash(x) * 1.4; i++; } }
  const L = x1 - x0 + 40, cx = (x0 + x1) / 2;
  return <group>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.02, 0]} material={grass}><planeGeometry args={[L + 40, 140]} /></mesh>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, 0]} material={road}><planeGeometry args={[L, ROAD_W]} /></mesh>
    {Array.from({length: Math.floor(L / 3)}, (_, k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[x0 - 20 + k * 3, 0.003, 0]} material={M('#E8E3CF', 0.8)}><planeGeometry args={[1.4, 0.1]} /></mesh>)}
    {[-1, 1].map((s) => <group key={s}>
      <Bx p={[cx, 0.07, s * (ROAD_W / 2 + 0.08)]} s={[L, 0.14, 0.16]} m={M('#BDBAB2', 0.85)} cast={false} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.12, s * (ROAD_W / 2 + 1.6)]} material={path}><planeGeometry args={[L, 1.1]} /></mesh>
      <Bx p={[cx, 0.06, s * (ROAD_W / 2 + 1.6)]} s={[L, 0.12, 1.1]} m={M('#8F8B84', 0.9)} cast={false} />
    </group>)}
    {xs.map(([x, s], i) => <House key={i} x={x} side={s} i={i} />)}
    {Array.from({length: 5}, (_, k) => x0 + 6 + k * 16).filter((x) => !clear || x < clear[0] || x > clear[1]).map((x) => <group key={x} position={[x, 0, -(ROAD_W / 2 + 0.5)]}>
      <mesh castShadow position={[0, 3.2, 0]} material={M('#6C7076', 0.5, 0.5)}><cylinderGeometry args={[0.06, 0.09, 6.4, 8]} /></mesh>
      <Bx p={[0, 6.35, 0.7]} s={[0.1, 0.1, 1.4]} m={M('#6C7076', 0.5, 0.5)} />
      <mesh position={[0, 6.27, 1.35]} material={MB('#F4EEDC')}><boxGeometry args={[0.3, 0.06, 0.18]} /></mesh>
    </group>)}
    {Array.from({length: 4}, (_, k) => x0 + 2 + k * 22).filter((x) => !clear || x < clear[0] || x > clear[1]).map((x) => <group key={x} position={[x, 0, ROAD_W / 2 + 0.5]}>
      <mesh castShadow position={[0, 4.5, 0]} material={M('#A8A49C', 0.8)}><cylinderGeometry args={[0.12, 0.16, 9, 8]} /></mesh>
      <Bx p={[0, 8.3, 0]} s={[0.12, 0.12, 1.6]} m={M('#7D7A74', 0.8)} />
    </group>)}
    <group position={[clear ? clear[1] + 7 : x1 - 6, 0, -(ROAD_W / 2 - 1.1)]}>
      <Bx p={[0, 0.75, 0]} s={[4.6, 0.8, 1.8]} m={M('#B9BCC0', 0.35, 0.3)} />
      <Bx p={[-0.6, 1.4, 0]} s={[2.2, 0.7, 1.7]} m={M('#B9BCC0', 0.35, 0.3)} />
      <Bx p={[-0.6, 1.42, 0]} s={[2.25, 0.5, 1.6]} m={GLASS} cast={false} />
      {[-1.5, 1.5].map((ax) => [-0.85, 0.85].map((z) => <Bx key={`${ax}${z}`} p={[ax, 0.35, z]} s={[0.7, 0.7, 0.25]} m={M('#151515', 0.9)} />))}
    </group>
  </group>;
};
