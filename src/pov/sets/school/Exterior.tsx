import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hash} from '../../lib/math';
import {canvasTex} from '../../lib/tex';
import {ExteriorLife} from './ExteriorLife';

/**
 * The view out of the windows of ห้อง 325 (3rd floor, right wall at x = 4.2): real geometry, not a backdrop.
 * School field with a running track and goals, flagpole, rain trees, the opposite four-storey classroom block
 * (open corridors, pillars, railings, hip roof), a sports hall, distant town blocks and clouds. Ground is 7.2 m below the room floor.
 */
const G = -7.2;
type V3 = [number, number, number];
const mats = new Map<string, THREE.MeshStandardMaterial>();
const mat = (c: string, rough = 0.9, flat = false) => { const k = c + rough + flat; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({color: c, roughness: rough, flatShading: flat})); return mats.get(k)!; };
const Box: React.FC<{p: V3; s: V3; c: string; r?: V3; rough?: number; map?: THREE.Texture}> = ({p, s, c, r, rough = 0.9, map}) => (
  <mesh position={p} rotation={r} material={map ? undefined : mat(c, rough)} receiveShadow castShadow><boxGeometry args={s} />{map && <meshStandardMaterial color={c} roughness={rough} map={map} />}</mesh>
);

/** a rain tree: short trunk, wide flat crown of faceted blobs */
const Tree: React.FC<{p: V3; s: number; seed: number; t: number}> = ({p, s, seed, t}) => {
  // wind: one gust field shared by the whole view (neighbours move together), crowns sway more than trunks
  const gust = Math.sin(t * 0.47 + p[2] * 0.03) * 0.6 + Math.sin(t * 1.3 + seed) * 0.25 + Math.sin(t * 3.1 + seed * 2) * 0.08;
  const blobs = useMemo(() => Array.from({length: 7}, (_, i) => { const a = (i / 7) * Math.PI * 2 + seed; const rr = i === 0 ? 0 : 1.6 + hash(seed + i) * 1.2; return {x: Math.cos(a) * rr, z: Math.sin(a) * rr, y: 4.6 + hash(seed * 2 + i) * 1.3 - (i === 0 ? -0.6 : 0), r: 1.7 + hash(seed * 3 + i) * 0.9, c: ['#3E7A38', '#4A8A40', '#356C31', '#5A9648'][Math.floor(hash(seed + i * 7) * 4)]}; }), [seed]);
  return (
    <group position={p} scale={s} rotation={[gust * 0.012, 0, gust * 0.02]}>
      <mesh material={mat('#5B4634')} castShadow position={[0, 1.9, 0]}><cylinderGeometry args={[0.22, 0.34, 3.8, 7]} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} material={mat('#5B4634')} position={[k * 0.7, 3.7, 0.2]} rotation={[0.2, 0, -k * 0.7]}><cylinderGeometry args={[0.1, 0.16, 2.0, 6]} /></mesh>)}
      {blobs.map((b, i) => <mesh key={i} rotation={[0, 0, gust * 0.03 * (b.y - 4)]} material={mat(b.c, 0.95, true)} position={[b.x, b.y, b.z]} scale={[b.r, b.r * 0.62, b.r]} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>)}
    </group>
  );
};

/** four-storey classroom block facing the room (its front at x = x0), open corridor on every floor */
const Block: React.FC<{x0: number; z0: number; len: number; floors: number; win: THREE.Texture}> = ({x0, z0, len, floors, win}) => {
  const FH = 3.6, depth = 9, cor = 2.2;
  const pillars = Array.from({length: Math.round(len / 4.5) + 1}, (_, i) => z0 - len / 2 + i * (len / Math.round(len / 4.5)));
  return (
    <group>
      {/* classrooms behind the corridor: cream wall with windows */}
      <Box p={[x0 + cor + depth / 2, G + (FH * floors) / 2, z0]} s={[depth, FH * floors, len]} c="#EFE6D2" map={win} />
      {Array.from({length: floors + 1}, (_, f) => <group key={f}>
        {/* floor slab + edge beam */}
        <Box p={[x0 + cor / 2, G + f * FH - 0.12, z0]} s={[cor + 0.3, 0.24, len + 0.3]} c="#E2D8C2" />
        {f > 0 && f < floors + 1 && <>
          {/* railing: low wall with a steel rail */}
          <Box p={[x0 + 0.08, G + f * FH + 0.45, z0]} s={[0.16, 0.9, len]} c={f % 2 ? '#F2EBDC' : '#F2EBDC'} />
          <Box p={[x0 + 0.08, G + f * FH + 0.98, z0]} s={[0.08, 0.06, len]} c="#3F6E8C" rough={0.5} />
          {/* orange stripe along the slab edge (the school colour) */}
          <Box p={[x0 - 0.02, G + f * FH - 0.12, z0]} s={[0.04, 0.24, len + 0.3]} c="#D0643A" />
        </>}
      </group>)}
      {pillars.map((z, i) => <Box key={i} p={[x0 + 0.2, G + (FH * floors) / 2, z]} s={[0.4, FH * floors, 0.4]} c="#E9DFC9" />)}
      {/* hip roof */}
      <mesh position={[x0 + (cor + depth) / 2, G + FH * floors + 1.5, z0]} scale={[(cor + depth) / 2 + 0.9, 1.5, len / 2 + 0.9]} rotation={[0, Math.PI / 4, 0]} material={mat('#B5502F', 0.8, true)} castShadow>
        <cylinderGeometry args={[0, 1.414, 2, 4, 1]} />
      </mesh>
      {/* stair tower at the end */}
      <Box p={[x0 + 2.5, G + (FH * floors + 2) / 2, z0 + len / 2 + 2.2]} s={[5, FH * floors + 2, 4.4]} c="#E6DCC6" />
    </group>
  );
};

export const Exterior: React.FC<{t: number; dark?: number; gun?: number}> = ({t, dark = 0, gun}) => {
  // the room lights going off must not dim the sunny day outside: exterior materials make up the lost fill light
  mats.forEach((m) => { m.emissive.copy(m.color); m.emissiveIntensity = 0.42 * dark; });
  const tex = useMemo(() => {
    const field = canvasTex(1024, 1024, (g) => {
      g.fillStyle = '#6FA34E'; g.fillRect(0, 0, 1024, 1024);
      for (let k = 0; k < 9000; k++) { g.fillStyle = `rgba(${hash(k) > 0.5 ? '40,80,30' : '150,200,110'},${0.05 + hash(k * 1.3) * 0.08})`; g.fillRect(hash(k * 2.1) * 1024, hash(k * 3.9) * 1024, 3, 3); }
      for (let s = 0; s < 8; s++) { g.fillStyle = s % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; g.fillRect(0, s * 128, 1024, 128); } // mowing stripes
      // running track (red with white lanes) around the pitch
      const track = (r: number, w: number, c: string) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.roundRect(512 - 300 - r, 512 - 420 - r, 600 + 2 * r, 840 + 2 * r, 300 + r); g.stroke(); };
      track(50, 100, '#B85A45'); for (let l = 0; l < 6; l++) track(4 + l * 18, 2, 'rgba(255,255,255,0.85)');
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 4; g.strokeRect(272, 152, 480, 720); g.beginPath(); g.moveTo(272, 512); g.lineTo(752, 512); g.stroke(); g.beginPath(); g.arc(512, 512, 70, 0, 7); g.stroke();
    });
    const win = canvasTex(512, 256, (g) => {
      g.fillStyle = '#EFE6D2'; g.fillRect(0, 0, 512, 256);
      for (let f = 0; f < 4; f++) for (let c = 0; c < 12; c++) { const x = 10 + c * 42, y = 18 + f * 64; g.fillStyle = '#4E6577'; g.fillRect(x, y, 30, 34); g.fillStyle = 'rgba(190,215,235,0.55)'; g.fillRect(x + 2, y + 2, 12, 30); g.fillStyle = '#C9BFA8'; g.fillRect(x - 2, y + 36, 34, 4); }
    });
    win.wrapS = THREE.RepeatWrapping; win.repeat.set(1.6, 1);
    const flag = canvasTex(96, 64, (g) => { [['#A51931', 0], ['#F4F5F8', 1], ['#2D2A4A', 2], ['#2D2A4A', 3], ['#F4F5F8', 4], ['#A51931', 5]].forEach(([c, i]) => { g.fillStyle = c as string; g.fillRect(0, (i as number) * 64 / 6, 96, 64 / 6 + 1); }); });
    return {field, win, flag};
  }, []);
  const trees = useMemo(() => [[15, -12.5], [16.8, 14.5], [12.5, 21], [26, -14], [27.5, -6], [27, 8], [28, 15], [44, -18], [46, 2], [43, 20]].map(([x, z], i) => ({x, z, s: (x < 20 ? 1.45 : 1.15) + hash(i * 3.7) * 0.25, seed: i * 1.37})), []);
  const town = useMemo(() => Array.from({length: 26}, (_, i) => ({x: 75 + hash(i) * 50, z: -70 + i * 5.6 + hash(i * 2) * 3, w: 6 + hash(i * 3) * 10, h: 8 + hash(i * 5) * (i % 5 === 0 ? 40 : 18), c: ['#D9D4C8', '#C8CED6', '#E3D7C1', '#BFC6CC', '#D6C9B5'][i % 5]})), []);
  const clouds = useMemo(() => Array.from({length: 9}, (_, i) => ({x: 90 + hash(i * 1.1) * 60, y: 28 + hash(i * 2.3) * 22, z: -80 + i * 19 + hash(i * 3.1) * 8, s: 5 + hash(i * 4.7) * 6})), []);
  const wave = Math.sin(t * 3.1);
  return (
    // outside keeps its own clear air: the room's haze (scene fog) must not wash out the view
    <group ref={(g) => { g?.traverse((o: any) => { if (o.material && o.material.fog !== false) { o.material.fog = false; o.material.needsUpdate = true; } }); }}>
      {/* our own building's outer wall below/above the windows, so looking down shows a façade, not a void */}
      <Box p={[4.36, G / 2 - 0.05, 0]} s={[0.2, -G + 0.1, 30]} c="#EDE4D0" />
      {/* the corridor runs on the door side, so the window wall drops straight to the ground: a sunshade ledge only */}
      <Box p={[4.75, 0.82, 0]} s={[0.9, 0.08, 30]} c="#E2D8C2" />
      {/* ground: field, track, paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, G, 0]} receiveShadow><planeGeometry args={[42, 60]} /><meshStandardMaterial map={tex.field} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[60, G - 0.02, 0]}><planeGeometry args={[220, 260]} /><meshStandardMaterial color="#8DA36E" roughness={1} /></mesh>
      <Box p={[6.6, G + 0.03, 0]} s={[4, 0.06, 60]} c="#B9B3A6" />
      {/* goals */}
      {[-14.5, 14.5].map((z) => <group key={z} position={[25, G, z]}>{[-1.8, 1.8].map((x) => <Box key={x} p={[x, 1.1, 0]} s={[0.1, 2.2, 0.1]} c="#F4F4F2" rough={0.4} />)}<Box p={[0, 2.2, 0]} s={[3.7, 0.1, 0.1]} c="#F4F4F2" rough={0.4} /></group>)}
      {/* flagpole with the national flag, stirring */}
      <group position={[8.4, G, -6]}>
        <Box p={[0, 0.25, 0]} s={[1.6, 0.5, 1.6]} c="#D8D2C4" />
        <mesh position={[0, 6.5, 0]} material={mat('#D9DCE0', 0.3)}><cylinderGeometry args={[0.05, 0.07, 12, 8]} /></mesh>
        <mesh position={[0, 11.4, 0.75]} rotation={[0, Math.PI / 2 + wave * 0.12, wave * 0.04]}><planeGeometry args={[1.5, 1.0, 8, 1]} /><meshStandardMaterial map={tex.flag} side={THREE.DoubleSide} roughness={0.8} /></mesh>
      </group>
      {trees.map((tr, i) => <Tree key={i} p={[tr.x, G, tr.z]} s={tr.s} seed={tr.seed} t={t} />)}
      <ExteriorLife t={t} gun={gun} />
      {/* opposite classroom block + sports hall */}
      <Block x0={33} z0={-2} len={44} floors={4} win={tex.win} />
      <group position={[36, G, 31]}>
        <Box p={[0, 4.5, 0]} s={[16, 9, 14]} c="#D7DEE3" />
        <mesh position={[0, 9.6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8.2, 7.2, 1.2]} material={mat('#5E7F9A', 0.6, true)}><cylinderGeometry args={[1, 1, 1, 12, 1, false, -Math.PI / 2, Math.PI]} /></mesh>
      </group>
      {/* distant town and clouds */}
      {town.map((b, i) => <Box key={i} p={[b.x, G + b.h / 2, b.z]} s={[b.w, b.h, b.w * 0.8]} c={b.c} />)}
      {clouds.map((c, i) => <group key={i} position={[c.x, c.y, c.z + t * 0.12]} scale={c.s}>{[[0, 0, 0, 1], [1.1, -0.15, 0.3, 0.75], [-1.0, -0.2, -0.2, 0.7], [0.4, 0.35, -0.4, 0.7]].map(([x, y, z, r], k) => <mesh key={k} position={[x, y, z]} scale={[r, r * 0.6, r]}><icosahedronGeometry args={[1, 2]} /><meshStandardMaterial color="#FFFFFF" roughness={1} emissive="#F4F7FA" emissiveIntensity={0.55} /></mesh>)}</group>)}
    </group>
  );
};
