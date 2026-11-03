import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hash, clamp} from '../../lib/math';
import {tex, F, speckle, grime, M, MB, glowTex} from '../../lib/tex';

/**
 * The bored tunnel around the moving car, in the car frame (car floor y = 0, the train runs toward -z).
 * `s` = distance the car has travelled (m); a world object at line position S sits at car-frame z = s - S.
 * Lining: one cylinder R = 2.9 centred at (0, 1.25), cut into 12 m segments that recycle; track bed, rails, sleepers, a walkway with a handrail on
 * the left, cable trays on the right, wall lamps every 12 m, signals, refuge niches, cross-passage doors, chainage plates, rats and drips.
 * `gaps` = line ranges where a station box replaces the tube.
 */
export const TUBE = {R: 2.9, cy: 1.25, seg: 12, rail: -1.03, bed: -1.1};
export const LAMP_EVERY = 12;
const RANGE = 84;                     // draw ±RANGE metres around the car

const lining = () => tex('tubeLining', 512, 512, (g) => {
  g.fillStyle = '#6E6B66'; g.fillRect(0, 0, 512, 512);
  speckle(g, 512, 512, 6000, ['#5C5955', '#85827C', '#4B4946'], 0.15, 0.45, 1, 4, 3);
  // ring joints across (v), segment joints along (u)
  g.fillStyle = 'rgba(30,29,27,.75)'; g.fillRect(0, 0, 512, 6); g.fillStyle = 'rgba(160,156,148,.25)'; g.fillRect(0, 6, 512, 2);
  for (let x = 0; x < 512; x += 128) { g.fillStyle = 'rgba(30,29,27,.55)'; g.fillRect(x + (x / 128 % 2) * 30, 0, 4, 512); }
  // bolt pockets
  for (let x = 20; x < 512; x += 64) { g.fillStyle = 'rgba(25,24,22,.7)'; g.fillRect(x, 16, 12, 8); g.fillRect(x, 488, 12, 8); }
  // water stains and efflorescence
  for (let k = 0; k < 8; k++) { const x = hash(k * 3.1) * 512, w = 6 + hash(k) * 30; const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, 'rgba(200,196,180,.0)'); gr.addColorStop(0.5, `rgba(${hash(k) > 0.5 ? '210,206,190' : '40,36,30'},.18)`); gr.addColorStop(1, 'rgba(40,36,30,0)'); g.fillStyle = gr; g.fillRect(x, 0, w, 512); }
}, [10, 10]);
const plateTex = (n: number, ready: boolean) => tex('plate' + n + ready, 256, 128, (g) => { g.fillStyle = '#F2F2EE'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 122); if (!ready) return; g.fillStyle = '#111'; g.font = F(700, 48); g.textAlign = 'center'; g.fillText(`กม.${12 + Math.floor(n / 20)}+${String((n % 20) * 50).padStart(3, '0')}`, 128, 82); });
const exitTex = (ready: boolean) => tex('tExit' + ready, 256, 96, (g) => { g.fillStyle = '#119A4F'; g.fillRect(0, 0, 256, 96); if (!ready) return; g.fillStyle = '#fff'; g.font = F(700, 38); g.textAlign = 'center'; g.fillText('ทางหนีภัย', 128, 60); });

/** positions (car-frame z) of everything that repeats every `every` m, within ±RANGE */
const reps = (s: number, every: number, phase = 0, range = RANGE) => {
  const out: {z: number; k: number}[] = []; const k0 = Math.ceil((s - range - phase) / every), k1 = Math.floor((s + range - phase) / every);
  for (let k = k0; k <= k1; k++) out.push({z: s - (k * every + phase), k}); return out;
};
const inGap = (S: number, gaps: [number, number][]) => gaps.some(([a, b]) => S > a && S < b);

/** the warm wall lamps nearest the car (for CarLights' sweeping point lights) */
export const nearLamps = (s: number, gaps: [number, number][] = []) => reps(s, LAMP_EVERY, 0, 14).filter((r) => !inGap(r.k * LAMP_EVERY, gaps)).sort((a, b) => Math.abs(a.z) - Math.abs(b.z)).slice(0, 2).map((r) => r.z);

const Inst: React.FC<{geo: THREE.BufferGeometry; mat: THREE.Material; items: THREE.Matrix4[]; shadow?: boolean}> = ({geo, mat, items, shadow}) => {
  const im = useMemo(() => new THREE.InstancedMesh(geo, mat, 400), [geo, mat]);
  im.count = Math.min(400, items.length); items.slice(0, 400).forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.castShadow = !!shadow; im.receiveShadow = true; im.frustumCulled = false;
  return <primitive object={im} />;
};
const mtx = (x: number, y: number, z: number, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), new THREE.Vector3(sx, sy, sz));

export const Tunnel: React.FC<{s: number; t: number; ready: boolean; gaps?: [number, number][]; flick?: number}> = ({s, t, ready, gaps = [], flick = 1}) => {
  const {R, cy, seg} = TUBE;
  const G = useMemo(() => ({
    tube: new THREE.CylinderGeometry(R, R, seg, 40, 1, true), sleeper: new THREE.BoxGeometry(2.3, 0.14, 0.24), bracket: new THREE.BoxGeometry(0.42, 0.04, 0.05),
    post: new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), lamp: new THREE.BoxGeometry(0.12, 0.16, 0.32),
  }), []);
  const mats = useMemo(() => ({
    tube: new THREE.MeshStandardMaterial({map: lining(), roughness: 0.92, side: THREE.BackSide}),
    bed: M('#4A4844', 0.95), rail: M('#8A8E92', 0.3, 0.8), sleeper: M('#8C8880', 0.9), steel: M('#7C8186', 0.5, 0.5), cable: M('#1D1E20', 0.7), cableR: M('#5A2A1E', 0.7), walk: M('#7A766E', 0.9),
    lampOn: new THREE.MeshStandardMaterial({color: '#FFF1D6', emissive: '#FFC27A', emissiveIntensity: 2.2}),
    water: new THREE.MeshStandardMaterial({color: '#20242A', roughness: 0.05, metalness: 0.4}),
  }), []);
  mats.lampOn.emissiveIntensity = 2.2 * flick;
  const tubes = reps(s, seg, seg / 2, RANGE + seg).filter((r) => !inGap(r.k * seg + seg / 2, gaps));
  const sleepers = reps(s, 0.6).filter((r) => !inGap(r.k * 0.6, gaps)).map((r) => mtx(0, TUBE.bed + 0.08, r.z));
  const brackets = reps(s, 1.2).filter((r) => !inGap(r.k * 1.2, gaps)).flatMap((r) => [mtx(2.42, 1.62, r.z, 0, 0.35), mtx(2.33, 1.95, r.z, 0, 0.5)]);
  const posts = reps(s, 2.4, 0.3).filter((r) => !inGap(r.k * 2.4, gaps)).map((r) => mtx(-2.0, 0.25, r.z));
  const lamps = reps(s, LAMP_EVERY).filter((r) => !inGap(r.k * LAMP_EVERY, gaps));
  const plates = reps(s, 50, 7).filter((r) => !inGap(r.k * 50 + 7, gaps));
  const niches = reps(s, 36, 19).filter((r) => !inGap(r.k * 36 + 19, gaps));
  const signals = reps(s, 80, 41).filter((r) => !inGap(r.k * 80 + 41, gaps));
  const doors = reps(s, 108, 63).filter((r) => !inGap(r.k * 108 + 63, gaps));
  const glow = glowTex();
  // continuous pieces only where there is tube
  const spans = useMemo(() => [[-RANGE, RANGE]] as [number, number][], []);
  void spans;
  return (
    <group>
      {tubes.map((r) => <mesh key={r.k} geometry={G.tube} material={mats.tube} position={[0, cy, r.z]} rotation={[Math.PI / 2, 0, 0]} receiveShadow />)}
      {tubes.map((r) => <group key={'b' + r.k} position={[0, 0, r.z]}>
        <mesh position={[0, TUBE.bed - 0.05, 0]} material={mats.bed} receiveShadow><boxGeometry args={[3.8, 0.1, seg]} /></mesh>
        <mesh position={[0, TUBE.bed - 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.water}><planeGeometry args={[0.5, seg]} /></mesh>
        {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, TUBE.rail, 0]} material={mats.rail} receiveShadow><boxGeometry args={[0.07, 0.14, seg]} /></mesh>)}
        <mesh position={[-2.25, -0.32, 0]} material={mats.walk} receiveShadow castShadow><boxGeometry args={[0.8, 0.12, seg]} /></mesh>
        <mesh position={[-2.0, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.steel}><cylinderGeometry args={[0.025, 0.025, seg, 6]} /></mesh>
        {[[2.47, 1.66, mats.cable], [2.41, 1.74, mats.cableR], [2.38, 1.99, mats.cable], [2.31, 2.06, mats.cable]].map(([x, y, mm], i) => <mesh key={i} position={[x as number, y as number, 0]} rotation={[Math.PI / 2, 0, 0]} material={mm as THREE.Material}><cylinderGeometry args={[0.035, 0.035, seg, 6]} /></mesh>)}
      </group>)}
      <Inst geo={G.sleeper} mat={mats.sleeper} items={sleepers} />
      <Inst geo={G.bracket} mat={mats.steel} items={brackets} />
      <Inst geo={G.post} mat={mats.steel} items={posts} />
      {/* wall lamps both sides, staggered */}
      {lamps.map((r) => [-1, 1].map((sd) => { const z = r.z + (sd > 0 ? 6 : 0); if (Math.abs(z) > RANGE) return null; const x = sd * 2.62, y = 2.05;
        return <group key={r.k + '' + sd} position={[x, y, z]}>
          <mesh geometry={G.lamp} material={mats.lampOn} />
          <sprite position={[-sd * 0.1, 0, 0]} scale={[1.1, 1.1, 1]}><spriteMaterial map={glow} color="#FFC27A" transparent opacity={0.55 * flick} blending={THREE.AdditiveBlending} depthWrite={false} /></sprite>
          {/* drip falling through the lamp's light now and then */}
          {hash(r.k * 7.7 + sd) > 0.5 && <mesh position={[-sd * 0.25, -((t * 2.4 + hash(r.k)) % 1) * 2.6, 0.1]} material={MB('#E8EEF4')}><boxGeometry args={[0.004, 0.05, 0.004]} /></mesh>}
        </group>; }))}
      {plates.map((r) => <mesh key={'p' + r.k} position={[-2.68, 1.1, r.z]} rotation={[0, Math.PI / 2 - 0.3, 0]} material={M('#ffffff', 0.6, 0, {map: plateTex(r.k, ready)}, 'plate' + r.k + ready)}><planeGeometry args={[0.5, 0.25]} /></mesh>)}
      {/* refuge niche: dark recess frame, red phone box, small lamp */}
      {niches.map((r) => <group key={'n' + r.k} position={[-2.66, 0.55, r.z]} rotation={[0, Math.PI / 2 - 0.25, 0]}>
        <mesh material={M('#1E1D1B', 0.95)}><planeGeometry args={[1.0, 1.9]} /></mesh>
        <mesh position={[0, 0.2, 0.02]} material={M('#B81D19', 0.5)}><boxGeometry args={[0.28, 0.36, 0.12]} /></mesh>
        <mesh position={[0, 1.05, 0.03]} material={MB('#FFE2A0')}><boxGeometry args={[0.18, 0.06, 0.06]} /></mesh>
        {Array.from({length: 4}, (_, i) => { const a = t * (5 + i) + i * 2; return <mesh key={i} position={[Math.cos(a) * 0.18, 1.0 + Math.sin(a * 1.3) * 0.08, 0.15 + Math.sin(a) * 0.1]} material={MB('#D9CDB4')}><planeGeometry args={[0.02, 0.014]} /></mesh>; })}
      </group>)}
      {/* signals at track level (right) */}
      {signals.map((r) => <group key={'s' + r.k} position={[1.95, -0.2, r.z]}>
        <mesh material={M('#2A2C30', 0.6)}><boxGeometry args={[0.2, 0.5, 0.16]} /></mesh>
        <mesh position={[0, 0.1, 0.09]} material={MB(hash(r.k) > 0.3 ? '#FF2A20' : '#33FF66')}><circleGeometry args={[0.045, 12]} /></mesh>
        <sprite position={[0, 0.1, 0.2]} scale={[0.5, 0.5, 1]}><spriteMaterial map={glow} color={hash(r.k) > 0.3 ? '#FF2A20' : '#33FF66'} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} /></sprite>
      </group>)}
      {/* cross-passage door with a lit exit sign (left) */}
      {doors.map((r) => <group key={'d' + r.k} position={[-2.64, 0.6, r.z]} rotation={[0, Math.PI / 2 - 0.22, 0]}>
        <mesh material={M('#5C6066', 0.5, 0.4)}><planeGeometry args={[0.95, 1.95]} /></mesh>
        <mesh position={[0, 1.18, 0.02]} material={M('#ffffff', 0.5, 0, {map: exitTex(ready), emissive: '#ffffff', emissiveMap: exitTex(ready), emissiveIntensity: 0.9}, 'tExitM' + ready)}><planeGeometry args={[0.6, 0.22]} /></mesh>
      </group>)}
      <Rats s={s} t={t} />
    </group>
  );
};

/** rats running along the walkway in the world frame (they flee the light) */
const Rats: React.FC<{s: number; t: number}> = ({s, t}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const S0 = 120 + i * 173, v = 2.2 + hash(i) * 1.4; const S = S0 + v * t; const z = s - S;
    if (Math.abs(z) > 30) continue;
    const ph = t * 18 + i;
    out.push(<group key={i} position={[-2.2 + hash(i * 3) * 0.25, -0.22, z]} rotation={[0, Math.PI, 0]}>
      <mesh scale={[0.045, 0.04, 0.09]} position={[0, 0.04 + Math.abs(Math.sin(ph)) * 0.01, 0]} material={M('#2E2A27', 0.9)} castShadow><sphereGeometry args={[1, 8, 6]} /></mesh>
      <mesh position={[0, 0.05, 0.08]} scale={[0.025, 0.025, 0.035]} material={M('#3A3531', 0.9)}><sphereGeometry args={[1, 6, 5]} /></mesh>
      <mesh position={[0, 0.03, -0.17]} rotation={[Math.PI / 2 + 0.2, 0, Math.sin(ph * 0.5) * 0.4]} material={M('#4A3F3A', 0.8)}><cylinderGeometry args={[0.004, 0.008, 0.16, 4]} /></mesh>
    </group>);
  }
  return <>{out}</>;
};
export const _t = {clamp, grime};
