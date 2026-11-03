import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hash} from '../../lib/math';
import {tex, F, speckle, grime, M, MB, glowTex} from '../../lib/tex';
import {Dog, Cat} from '../../fx/animals';

/**
 * Exit 2 · ถนนนิลกาฬ — the night street at the top of the station stairs (EP3 close). Own origin: top of the exit stair at (0, 0, 0),
 * the stair runs down toward +z (16 steps, 2.9 m); the glass canopy over it is the last reflection. Road along x at z ≈ -6.
 * Alive: drizzle, a noodle stall's steam, a motorbike-taxi stand (people from the episode), a tuk-tuk and cars passing, a dog trotting, a cat on a wall.
 */
export const STREET = {road: -6.2, kerb: -3.6};
const shopTex = (i: number, ready: boolean) => tex('shop' + i + ready, 512, 512, (g) => {
  const base = ['#C9B79A', '#9FB0A8', '#D2C2B0', '#B7A594', '#A9B6C2'][i % 5]; g.fillStyle = base; g.fillRect(0, 0, 512, 512); grime(g, 512, 512, 0.45, 14, i);
  for (let f = 0; f < 3; f++) for (let w = 0; w < 3; w++) { const lit = hash(i * 31 + f * 7 + w) > 0.45; g.fillStyle = lit ? '#FFD898' : '#2A2E36'; g.fillRect(40 + w * 160, 30 + f * 120, 110, 70); g.fillStyle = 'rgba(0,0,0,.35)'; for (let b = 0; b < 4; b++) g.fillRect(40 + w * 160 + b * 28, 30 + f * 120, 3, 70); }
  g.fillStyle = '#5A5E66'; for (let y = 400; y < 512; y += 8) g.fillRect(0, y, 512, 4);
  if (!ready) return; const names = ['ร้านทองเจริญดี', 'ซ่อมมือถือ', 'ข้าวต้มโต้รุ่ง', 'ร้านยาสุขใจ', 'ร้านตัดผมนิลกาฬ'];
  g.fillStyle = ['#C8231E', '#1E4E8C', '#2E6B47', '#7A2E8C', '#B8402E'][i % 5]; g.fillRect(0, 360, 512, 40); g.fillStyle = '#fff'; g.font = F(700, 30); g.textAlign = 'center'; g.fillText(names[i % 5], 256, 390);
});
const storeTex = (ready: boolean) => tex('store' + ready, 1024, 256, (g) => { g.fillStyle = '#F4F7F2'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#2E9E5B'; g.fillRect(0, 0, 1024, 70); g.fillStyle = '#E8642B'; g.fillRect(0, 70, 1024, 16); if (!ready) return; g.fillStyle = '#fff'; g.font = F(700, 52); g.textAlign = 'center'; g.fillText('สะดวกดี 24 ชม.', 512, 54); });
const roadTex = () => tex('road', 512, 512, (g) => { g.fillStyle = '#2A2D33'; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 6000, ['#3A3E45', '#1E2025', '#4A4E55'], 0.2, 0.5, 1, 3); for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(10,12,16,.35)'; g.beginPath(); g.ellipse(hash(k) * 512, hash(k * 3) * 512, 30 + hash(k * 5) * 60, 10 + hash(k * 7) * 20, 0, 0, 7); g.fill(); } }, [20, 4]);

const B: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => <mesh position={p} rotation={r} material={m} castShadow receiveShadow><boxGeometry args={s} /></mesh>;

const Moto: React.FC<{p: [number, number, number]; ry: number; c: string}> = ({p, ry, c}) => <group position={p} rotation={[0, ry, 0]}>
  {[-0.62, 0.62].map((z) => <mesh key={z} position={[0, 0.3, z]} rotation={[0, 0, Math.PI / 2]} material={M('#141416', 0.8)}><torusGeometry args={[0.26, 0.07, 6, 14]} /></mesh>)}
  <B p={[0, 0.62, 0]} s={[0.3, 0.3, 1.2]} m={M(c, 0.4, 0.3)} /><B p={[0, 0.82, -0.1]} s={[0.28, 0.1, 0.62]} m={M('#1A1A1C', 0.7)} /><B p={[0, 0.98, 0.58]} s={[0.6, 0.04, 0.04]} m={M('#555', 0.4, 0.6)} />
</group>;

export const Street: React.FC<{t: number; ready: boolean; dogT0?: number}> = ({t, ready, dogT0}) => {
  const m = useMemo(() => ({
    road: new THREE.MeshStandardMaterial({map: roadTex(), roughness: 0.18, metalness: 0.25, color: '#9AA0AA'}), walk: M('#7E7A74', 0.5), kerb: M('#B7B2A8', 0.6), step: M('#9C988E', 0.6), steel: M('#9AA2AA', 0.3, 0.7),
    glass: new THREE.MeshStandardMaterial({color: '#1A2430', roughness: 0.02, metalness: 0.9, transparent: true, opacity: 0.55}),
    lamp: new THREE.MeshStandardMaterial({color: '#FFF4E0', emissive: '#FFD8A0', emissiveIntensity: 2.5}),
  }), []);
  const glow = glowTex();
  const tuk = ((t * 6) % 70) - 35, car = 30 - ((t * 9 + 20) % 70), dog = dogT0 !== undefined ? -6 + (t - dogT0) * 1.05 : -8 + ((t * 0.9) % 16);
  const rain = useMemo(() => Array.from({length: 180}, (_, i) => [(hash(i) - 0.5) * 22, hash(i * 3) * 6, -2 - hash(i * 7) * 12] as [number, number, number]), []);
  return (
    <group>
      {/* exit stair down toward +z, canopy over it */}
      {Array.from({length: 16}, (_, i) => <B key={i} p={[0, -0.12 - i * 0.18, 0.15 + i * 0.3]} s={[2.4, 0.18, 0.3]} m={m.step} />)}
      {[-1.3, 1.3].map((x) => <B key={x} p={[x, -1.3, 2.4]} s={[0.2, 3.2, 5.0]} m={m.kerb} />)}
      {[-1.25, 1.25].map((x) => <mesh key={'r' + x} position={[x, -0.4, 2.4]} rotation={[0.55, 0, 0]} material={m.steel}><cylinderGeometry args={[0.025, 0.025, 5.4, 6]} /></mesh>)}
      <B p={[0, 2.6, 2.0]} s={[3.0, 0.06, 5.0]} m={m.glass} />
      {[-1.4, 1.4].map((x) => [0, 4].map((z) => <B key={x + '' + z} p={[x, 1.3, z]} s={[0.08, 2.6, 0.08]} m={m.steel} />))}
      <mesh position={[1.42, 1.3, 2.0]} rotation={[0, -Math.PI / 2, 0]} material={m.glass}><planeGeometry args={[4, 2.4]} /></mesh>
      <Stairwell t={t} ready={ready} />
      {/* pavement, kerb, road */}
      <mesh position={[0, 0.0, -1.8]} rotation={[-Math.PI / 2, 0, 0]} material={m.walk} receiveShadow><planeGeometry args={[60, 3.6]} /></mesh>
      {/* pavement beside the stairwell only (a plane over the opening would z-fight with the top step) */}
      {[-1, 1].map((sd) => <mesh key={'pv' + sd} position={[sd * 15.7, 0.0, 0.8]} rotation={[-Math.PI / 2, 0, 0]} material={m.walk} receiveShadow><planeGeometry args={[28.6, 1.6]} /></mesh>)}
      <B p={[0, -0.06, STREET.kerb]} s={[60, 0.18, 0.2]} m={m.kerb} />
      <mesh position={[0, -0.15, STREET.road]} rotation={[-Math.PI / 2, 0, 0]} material={m.road} receiveShadow><planeGeometry args={[80, 5]} /></mesh>
      {Array.from({length: 14}, (_, i) => <mesh key={i} position={[-32 + i * 5, -0.145, STREET.road]} rotation={[-Math.PI / 2, 0, 0]} material={MB('#C9C4B0')}><planeGeometry args={[2, 0.12]} /></mesh>)}
      {/* shophouses across the road + beside the exit */}
      {Array.from({length: 8}, (_, i) => <group key={i} position={[-21 + i * 6, 0, -12.5]}>
        <B p={[0, 5, 0]} s={[5.9, 10, 6]} m={M('#ffffff', 0.8, 0, {map: shopTex(i, ready)}, 'shop' + i + ready)} />
        <B p={[0, 3.1, 3.2]} s={[5.9, 0.1, 1.2]} m={M('#7A7E86', 0.6)} />
      </group>)}
      {/* convenience store beside the exit (left) */}
      <group position={[-6.5, 0, 2.5]}>
        <B p={[0, 2.0, 0]} s={[6, 4, 6]} m={M('#E8E6E0', 0.7)} />
        <mesh position={[3.01, 3.4, 0]} rotation={[0, Math.PI / 2, 0]} material={M('#ffffff', 0.5, 0, {map: storeTex(ready), emissive: '#ffffff', emissiveMap: storeTex(ready), emissiveIntensity: 0.9}, 'store' + ready)}><planeGeometry args={[5.8, 1.4]} /></mesh>
        <mesh position={[3.01, 1.3, 0]} rotation={[0, Math.PI / 2, 0]} material={new THREE.MeshStandardMaterial({color: '#E8F4FF', emissive: '#DDEEFF', emissiveIntensity: 1.4})}><planeGeometry args={[5.2, 2.4]} /></mesh>
        <pointLight position={[4.5, 1.6, 0]} intensity={4} distance={9} decay={1.6} color="#E0EEFF" />
      </group>
      {/* noodle stall with steam, under a striped awning */}
      <group position={[5.5, 0, -2.4]}>
        <B p={[0, 0.5, 0]} s={[1.6, 1.0, 0.8]} m={M('#B7BEC6', 0.35, 0.5)} />
        <B p={[0, 2.2, 0.2]} s={[2.4, 0.05, 1.8]} m={M('#C8402E', 0.6)} />
        {[-1.1, 1.1].map((x) => <B key={x} p={[x, 1.1, -0.6]} s={[0.05, 2.2, 0.05]} m={m.steel} />)}
        <mesh position={[-0.4, 1.12, 0]} material={M('#8A8E92', 0.3, 0.7)}><cylinderGeometry args={[0.22, 0.2, 0.25, 14]} /></mesh>
        {Array.from({length: 10}, (_, i) => { const u = ((t * 0.5 + i / 10) % 1); return <sprite key={i} position={[-0.4 + Math.sin(i * 2 + t) * 0.1 * u + u * 0.25, 1.3 + u * 1.2, 0]} scale={[0.25 + u * 0.6, 0.25 + u * 0.6, 1]}><spriteMaterial map={glow} color="#E8E4DA" transparent opacity={0.22 * (1 - u)} depthWrite={false} /></sprite>; })}
        <pointLight position={[0, 1.9, 0.4]} intensity={2.2} distance={5} decay={1.8} color="#FFB86B" />
        <mesh position={[0, 1.95, 0.4]} material={m.lamp}><sphereGeometry args={[0.06, 8, 6]} /></mesh>
      </group>
      {/* motorbike-taxi stand: bench, parked bikes, a sign */}
      <B p={[-1.6, 0.42, -2.4]} s={[1.6, 0.06, 0.5]} m={M('#3A3E46', 0.6)} />
      <Moto p={[-1.6, 0, -4.4]} ry={0.2} c="#C8231E" /><Moto p={[-3.0, 0, -4.5]} ry={-0.1} c="#1E4E8C" /><Moto p={[-4.2, 0, -4.4]} ry={0.15} c="#2A2A2E" />
      {/* passing traffic */}
      <group position={[tuk, -0.15, STREET.road - 1.2]} rotation={[0, Math.PI / 2, 0]}>
        <B p={[0, 0.9, 0]} s={[1.3, 1.1, 2.4]} m={M('#2E5C8F', 0.4, 0.3)} /><B p={[0, 1.6, -0.1]} s={[1.4, 0.08, 2.2]} m={M('#1A1A1C', 0.6)} />
        <mesh position={[0, 0.8, 1.22]} material={m.lamp}><sphereGeometry args={[0.08, 8, 6]} /></mesh>
        <spotLight position={[0, 0.8, 1.3]} angle={0.5} penumbra={0.5} intensity={6} distance={12} color="#FFF2D8" />
      </group>
      <group position={[car, -0.15, STREET.road + 1.2]} rotation={[0, -Math.PI / 2, 0]}>
        <B p={[0, 0.55, 0]} s={[1.75, 0.7, 4.3]} m={M('#C9CDD2', 0.25, 0.6)} /><B p={[0, 1.1, -0.2]} s={[1.6, 0.5, 2.2]} m={M('#1A2028', 0.1, 0.5)} />
        {[-0.6, 0.6].map((x) => <mesh key={x} position={[x, 0.6, 2.16]} material={m.lamp}><boxGeometry args={[0.3, 0.1, 0.02]} /></mesh>)}
        {[-0.6, 0.6].map((x) => <mesh key={'t' + x} position={[x, 0.6, -2.16]} material={MB('#FF2A20')}><boxGeometry args={[0.3, 0.1, 0.02]} /></mesh>)}
      </group>
      {/* a street dog trotting along the pavement (real diagonal gait), a cat on the wall watching the stairs */}
      <group position={[dog, 0, dogT0 !== undefined ? -1.6 : -0.6]} rotation={[0, Math.PI / 2, 0]}><Dog phase={t * 1.9} /></group>
      {/* a concrete planter beside the exit with a cat on it, watching whoever comes up the stairs */}
      <B p={[-2.0, 0.33, -0.7]} s={[0.7, 0.66, 1.3]} m={M('#9A968C', 0.85)} />
      <mesh position={[-2.0, 0.665, -0.7]} rotation={[-Math.PI / 2, 0, 0]} material={M('#3E4A32', 0.9)}><planeGeometry args={[0.62, 1.22]} /></mesh>
      <group position={[-1.9, 0.67, -0.35]} rotation={[0, 2.3, 0]}><Cat t={t} look={-0.35 + Math.sin(t * 0.35) * 0.25} /></group>
      <B p={[2.2, 0.75, 4.6]} s={[0.3, 1.5, 3]} m={M('#8E8A80', 0.8)} />
      {/* street lamps */}
      {[-14, -2, 10].map((x) => <group key={x} position={[x, 0, -3.3]}>
        <mesh position={[0, 3.2, 0]} material={m.steel}><cylinderGeometry args={[0.06, 0.08, 6.4, 8]} /></mesh>
        <mesh position={[0, 6.3, -0.6]} material={m.lamp}><boxGeometry args={[0.3, 0.1, 0.5]} /></mesh>
        <sprite position={[0, 6.2, -0.6]} scale={[2.4, 2.4, 1]}><spriteMaterial map={glow} color="#FFD8A0" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} /></sprite>
        <pointLight position={[0, 6.0, -0.8]} intensity={14} distance={20} decay={1.3} color="#FFD8A0" />
      </group>)}
      {/* drizzle */}
      {rain.map(([x, y, z], i) => <mesh key={i} position={[x, (y - t * 7) % 6 < 0 ? ((y - t * 7) % 6) + 6 : (y - t * 7) % 6, z]} material={MB('#C9D4E0')}><boxGeometry args={[0.004, 0.18, 0.004]} /></mesh>)}
    </group>
  );
};

/** cream wall tiles with grime for the underground passage */
const tileTex = () => tex('passTile', 256, 256, (g) => { g.fillStyle = '#D6CFBF'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(90,84,70,.45)'; g.lineWidth = 2; for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); } grime(g, 256, 256, 0.35, 8, 4); }, [6, 3]);
const signTex = (ready: boolean) => tex('pass0' + ready, 1024, 256, (g) => { g.fillStyle = '#1E2A3C'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#F28C1E'; g.fillRect(0, 0, 1024, 12); if (!ready) return; g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = F(700, 92); g.fillText('สถานีศูนย์', 512, 130); g.fillStyle = '#C9D2E8'; g.font = F(500, 46); g.fillText('Station 0  ·  ทางออก 2', 512, 210); grime(g, 1024, 256, 0.3, 10, 2); });
/**
 * Below the exit stair: the stair keeps going under a concrete slab into a tiled passage — side walls, ceiling with fluorescent tubes
 * (one flickering), a landing, and at the far end the lit Station 0 sign over dark glass doors. Seen when the camera looks back down the stairs.
 * Stair: 16 steps from z 0.15 (y −0.03) down to z ≈ 4.65 (y ≈ −2.73); landing at y −2.82 from z 4.8 to 10.
 */
const Stairwell: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  const m = useMemo(() => ({tile: M('#ffffff', 0.55, 0, {map: tileTex()}, 'passTile'), conc: M('#8A8780', 0.9), floor: M('#7C786F', 0.7), glass: new THREE.MeshStandardMaterial({color: '#0E141C', roughness: 0.05, metalness: 0.6}), steel: M('#9AA2AA', 0.3, 0.7), sign: M('#ffffff', 0.5, 0, {map: signTex(ready), emissive: '#ffffff', emissiveMap: signTex(ready), emissiveIntensity: 0.9}, 'pass0' + ready)}), [ready]);
  const tube = useMemo(() => new THREE.MeshStandardMaterial({color: '#F4F8FF', emissive: '#EAF2FF', emissiveIntensity: 1.6}), []);
  const flick = (Math.floor(t * 9) % 11 === 3 || Math.floor(t * 13) % 17 === 5) ? 0.15 : 1;
  const Y0 = -2.82, ceilY = -0.32;
  return <group>
    {/* side walls of the stairwell + passage (tiles), down to the landing */}
    {[-1.2, 1.2].map((x) => <mesh key={x} position={[x, (Y0 + 0.2) / 2, 5.0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={m.tile} receiveShadow><planeGeometry args={[10, -Y0 + 0.2]} /></mesh>)}
    {/* the concrete ground slab the stair dives under (street level above it) + its underside as the passage ceiling */}
    <mesh position={[0, -0.16, 7.3]} material={m.conc} receiveShadow><boxGeometry args={[2.8, 0.32, 6.0]} /></mesh>
    <mesh position={[0, 0.0, 4.47]} material={m.conc}><boxGeometry args={[2.8, 0.64, 0.1]} /></mesh>
    {/* landing + far wall with the Station 0 sign and dark glass doors */}
    <mesh position={[0, Y0, 7.4]} rotation={[-Math.PI / 2, 0, 0]} material={m.floor} receiveShadow><planeGeometry args={[2.4, 5.4]} /></mesh>
    <mesh position={[0, (Y0 + ceilY) / 2, 10.0]} rotation={[0, Math.PI, 0]} material={m.tile} receiveShadow><planeGeometry args={[2.4, ceilY - Y0]} /></mesh>
    <mesh position={[0, ceilY - 0.42, 9.97]} rotation={[0, Math.PI, 0]} material={m.sign}><planeGeometry args={[1.9, 0.48]} /></mesh>
    {[-0.48, 0.48].map((x) => <group key={x} position={[x, Y0 + 1.05, 9.96]}>
      <mesh rotation={[0, Math.PI, 0]} material={m.glass}><planeGeometry args={[0.9, 2.1]} /></mesh>
      <mesh position={[0, 0, -0.01]} material={m.steel}><boxGeometry args={[0.95, 0.04, 0.03]} /></mesh>
    </group>)}
    {/* fluorescent tubes on the ceiling over the lower stair and the landing; the middle one flickers */}
    {[[5.2, 1], [7.2, flick], [9.2, 1]].map(([z, k], i) => <group key={i}>
      <mesh position={[0, ceilY - 0.03, z]} material={k < 0.5 ? M('#55585C', 0.5) : tube}><boxGeometry args={[0.08, 0.04, 1.2]} /></mesh>
      <pointLight position={[0, ceilY - 0.25, z]} intensity={2.4 * k} distance={6} decay={1.6} color="#E6EEF8" />
    </group>)}
    {/* a cooler light on the stair itself so the steps read from the top */}
    <pointLight position={[0, -0.6, 3.2]} intensity={1.6} distance={5} decay={1.6} color="#DCE4F0" />
    <pointLight position={[0, Y0 + 2.0, 9.4]} intensity={1.2} distance={3} decay={2} color="#9FB4D8" />
  </group>;
};
