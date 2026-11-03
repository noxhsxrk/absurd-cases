import React, {useMemo} from 'react';
import * as THREE from 'three';
import {FURN, ELEV, MEET_DOOR, COLS, ROWS, SEAT, Furn} from './layout';
import {hash, smooth} from '../lib/math';

export const Steam: React.FC<{x: number; y: number; z: number; t: number}> = ({x, y, z, t}) => (
  <>{Array.from({length: 7}, (_, i) => { const age = ((t * 0.7 + i / 7) % 1); return <mesh key={i} position={[x + Math.sin(i * 2 + t) * 0.03, y + age * 0.45, z]} scale={0.04 + age * 0.06}><sphereGeometry args={[1, 6, 5]} /><meshBasicMaterial color="#fff" transparent opacity={0.4 * (1 - age)} depthWrite={false} /></mesh>; })}</>
);

/** Eye-level office interior: closed ceiling, cubicles, signage, city outside. Same floor plan as the life sim (layout.ts). */
const CEIL = 2.85;
type V3 = [number, number, number];
const M: React.FC<{p?: V3; s: V3; c: string; r?: V3; rough?: number; metal?: number; e?: string; ei?: number; o?: number; map?: THREE.Texture; shadow?: boolean}> = ({p = [0, 0, 0], s, c, r, rough = 0.8, metal = 0, e, ei = 1, o = 1, map, shadow = true}) => (
  <mesh position={p} rotation={r} castShadow={shadow && o === 1} receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={rough} metalness={metal} emissive={e ?? '#000'} emissiveIntensity={e ? ei : 0} transparent={o < 1} opacity={o} map={map ?? null} depthWrite={o === 1} /></mesh>
);
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t;
};
const sign = (text: string, bg: string, fg: string, w = 512, h = 128, size = 64, sub?: string) => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${size}px Prompt, Arial, sans-serif`; g.fillText(text, w / 2, sub ? h * 0.4 : h / 2);
  if (sub) { g.font = `500 ${size * 0.45}px Prompt, Arial, sans-serif`; g.fillText(sub, w / 2, h * 0.78); }
});

const Chair: React.FC<{x: number; z: number; yaw?: number; c?: string}> = ({x, z, yaw = 0, c = '#2F3440'}) => (
  <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
    <M p={[0, 0.45, 0]} s={[0.5, 0.08, 0.48]} c={c} rough={0.9} /><M p={[0, 0.82, -0.27]} s={[0.46, 0.56, 0.07]} c={c} rough={0.9} r={[-0.1, 0, 0]} />
    <M p={[0, 0.24, 0]} s={[0.06, 0.4, 0.06]} c="#9AA0AA" metal={0.6} rough={0.4} />
    {[0, 1, 2, 3, 4].map((k) => <M key={k} p={[Math.sin(k * 1.2566) * 0.2, 0.04, Math.cos(k * 1.2566) * 0.2]} s={[0.05, 0.04, 0.4]} r={[0, k * 1.2566, 0]} c="#24272E" />)}
  </group>
);

/** One workstation: desk, partitions, monitor, keyboard, shelf with binders, clutter. Seat is on the -z side, monitor faces -z. */
const Cubicle: React.FC<{f: Furn; i: number; screen: THREE.Texture}> = ({f, i, screen}) => {
  const fab = ['#7D8796', '#8A8F9C', '#77818F'][i % 3], cap = '#C9CDD4';
  return (
    <group position={[f.x, 0, f.z]}>
      <M p={[0, 0.73, 0]} s={[1.6, 0.04, 0.8]} c="#E7E1D5" rough={0.6} />
      <M p={[-0.78, 0.36, 0]} s={[0.04, 0.72, 0.74]} c="#BFC3CA" /><M p={[0.78, 0.36, 0]} s={[0.04, 0.72, 0.74]} c="#BFC3CA" />
      {/* partitions: back (behind monitor) + two short sides */}
      <M p={[0, 0.62, 0.44]} s={[1.72, 1.24, 0.06]} c={fab} rough={1} /><M p={[0, 1.255, 0.44]} s={[1.74, 0.03, 0.08]} c={cap} metal={0.4} rough={0.4} />
      {[-0.86, 0.86].map((x) => <group key={x}><M p={[x, 0.62, 0.0]} s={[0.06, 1.24, 0.9]} c={fab} rough={1} /><M p={[x, 1.255, 0.0]} s={[0.08, 0.03, 0.92]} c={cap} metal={0.4} rough={0.4} /></group>)}
      {/* shelf + binders on the back partition */}
      <M p={[0, 1.42, 0.36]} s={[1.5, 0.03, 0.26]} c="#D9D4C8" />
      {Array.from({length: 7}, (_, k) => <M key={k} p={[-0.6 + k * 0.075 + (k > 3 ? 0.35 : 0), 1.565, 0.36]} s={[0.06, 0.26, 0.22]} c={['#B33A3A', '#2E4E7A', '#E2B842', '#2F6B4F', '#1F2430', '#B33A3A', '#E7E2D6'][(k + i) % 7]} rough={0.7} />)}
      {/* monitor, keyboard, mouse, phone, mug, papers */}
      <M p={[0, 1.04, 0.2]} s={[0.6, 0.36, 0.03]} c="#1A1D23" rough={0.4} />
      <mesh position={[0, 1.04, 0.183]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.56, 0.32]} /><meshBasicMaterial map={screen} toneMapped={false} /></mesh>
      <M p={[0, 0.83, 0.22]} s={[0.05, 0.16, 0.05]} c="#2A2D33" /><M p={[0, 0.755, 0.22]} s={[0.22, 0.015, 0.16]} c="#2A2D33" />
      <M p={[0, 0.76, -0.12]} s={[0.44, 0.02, 0.15]} c="#2B2E35" rough={0.5} /><M p={[0.32, 0.76, -0.12]} s={[0.06, 0.02, 0.1]} c="#2B2E35" />
      {hash(i * 3.1) > 0.35 && <mesh position={[-0.55, 0.8, -0.05]} castShadow><cylinderGeometry args={[0.04, 0.036, 0.1, 14]} /><meshStandardMaterial color={['#F2EEE6', '#C8483F', '#3E6E9E'][i % 3]} roughness={0.5} /></mesh>}
      <M p={[0.52, 0.755, 0.05]} s={[0.24, 0.012, 0.32]} c="#F7F5EF" r={[0, 0.25, 0]} /><M p={[0.55, 0.765, 0.08]} s={[0.24, 0.012, 0.32]} c="#F1EEE6" r={[0, -0.1, 0]} />
      <M p={[-0.6, 0.775, 0.22]} s={[0.18, 0.05, 0.2]} c="#2B2E35" />
      {i % 2 === 0 && <group position={[0.62, 0.75, 0.3]}><mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.06, 0.05, 0.13, 10]} /><meshStandardMaterial color="#D9D2C2" /></mesh><mesh position={[0, 0.2, 0]} castShadow><icosahedronGeometry args={[0.1, 1]} /><meshStandardMaterial color="#4E8A55" roughness={0.9} /></mesh></group>}
    </group>
  );
};

export const Interior: React.FC<{t: number; marks: Record<string, number>; boxOnDesk: boolean; clock: number}> = ({t, marks, boxOnDesk, clock}) => {
  const tex = useMemo(() => {
    const ceiling = canvasTex(256, 256, (g) => { g.fillStyle = '#F1EFEA'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(150,145,135,${0.08 + hash(k) * 0.12})`; g.fillRect(hash(k * 2.1) * 256, hash(k * 3.7) * 256, 1.5, 1.5); } g.strokeStyle = '#C9C5BC'; g.lineWidth = 4; g.strokeRect(0, 0, 256, 256); }, [18, 28]);
    const carpet = canvasTex(256, 256, (g) => { g.fillStyle = '#5F6878'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 4000; k++) { const v = hash(k * 1.3); g.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'; g.fillRect(hash(k * 2.9) * 256, hash(k * 5.1) * 256, 2, 2); } g.strokeStyle = 'rgba(0,0,0,0.10)'; g.lineWidth = 2; g.strokeRect(0, 0, 256, 256); }, [22, 32]);
    const vinyl = canvasTex(256, 256, (g) => { g.fillStyle = '#BDB9B1'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 1500; k++) { g.fillStyle = `rgba(120,115,105,${hash(k) * 0.12})`; g.fillRect(hash(k * 2.3) * 256, hash(k * 4.7) * 256, 2, 2); } g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 2; g.strokeRect(0, 0, 256, 256); }, [3, 20]);
    const facade = canvasTex(256, 512, (g) => { g.fillStyle = '#B7BCC4'; g.fillRect(0, 0, 256, 512); for (let r = 0; r < 32; r++) for (let c = 0; c < 8; c++) { const lit = hash(r * 31 + c * 7); g.fillStyle = lit > 0.82 ? '#F3E7C2' : lit > 0.4 ? '#5E7590' : '#6F87A3'; g.fillRect(c * 32 + 5, r * 16 + 3, 22, 10); } });
    const screen = canvasTex(256, 160, (g) => { const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, '#DCEBFA'); gr.addColorStop(1, '#BBD3EE'); g.fillStyle = gr; g.fillRect(0, 0, 256, 160); g.fillStyle = '#2F5E92'; g.fillRect(0, 0, 256, 14); for (let k = 0; k < 9; k++) { g.fillStyle = k % 3 ? '#8EA9C8' : '#4C79AA'; g.fillRect(14, 24 + k * 14, 60 + hash(k) * 150, 6); } });
    return {ceiling, carpet, vinyl, facade, screen,
      exit: sign('EXIT', '#1D7A46', '#FFFFFF', 256, 96, 62), elev: sign('ELEVATORS  ลิฟต์', '#2A2F38', '#F4F1EA', 640, 110, 52), meet: sign('MEETING 12A', '#FFFFFF', '#2A2F38', 512, 110, 54, 'ห้องประชุม'),
      floor: sign('12', '#2A2F38', '#F4F1EA', 160, 160, 110), company: sign('NORTHWIND', '#00000000', '#3B4250', 768, 140, 96, 'ชั้น 12 · ฝ่ายปฏิบัติการ')};
  }, []);
  const city = useMemo(() => Array.from({length: 60}, (_, i) => { const ang = -1.25 + (i / 60) * 2.5, d = 60 + hash(i * 3.3) * 160; return {x: Math.sin(ang) * d, z: -12 - Math.cos(ang) * d * 0.9, h: 20 + hash(i * 1.7) * 90, w: 12 + hash(i * 7.7) * 18, c: ['#C6CCD6', '#B8C0CC', '#D2D0C8', '#A9B3C2'][i % 4]}; }), []);
  const e0 = (a: number, b: number) => smooth((t - a) / 0.8) * (1 - smooth((t - b + 0.8) / 0.8));
  const eo = [Math.max(e0(marks.elev1 - 0.9, marks.elev1 + 3.0), e0(marks.elev2 - 0.9, marks.elev2 + 3.3)), e0(marks.elev3 - 0.9, marks.elev3 + 3.0)];
  const pd = smooth((t - (marks.pimDoor - 0.3)) / 0.6) * (1 - smooth((t - 26) / 0.8));
  const hh = (clock / 3600) % 12, mm = (clock / 60) % 60;
  return (
    <group>
      {/* floor: carpet in the work area, vinyl walkway + lobby */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]} receiveShadow><planeGeometry args={[11.2, 16.2]} /><meshStandardMaterial map={tex.carpet} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.45, 0.003, -4]} receiveShadow><planeGeometry args={[1.7, 16.2]} /><meshStandardMaterial map={tex.vinyl} roughness={0.55} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.0, 0.002, 2.0]} receiveShadow><planeGeometry args={[5.2, 4.2]} /><meshStandardMaterial map={tex.vinyl} roughness={0.5} /></mesh>
      {/* ceiling: tiles, light panels, vents, sprinklers */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL, -4]}><planeGeometry args={[11.2, 16.4]} /><meshStandardMaterial map={tex.ceiling} roughness={1} /></mesh>
      {[-3.6, -0.6, 2.4].flatMap((x) => [-10.2, -7.2, -4.2, -1.2, 1.8].map((z) => <M key={`l${x}${z}`} p={[x, CEIL - 0.01, z]} s={[1.18, 0.02, 0.58]} c="#FFFFFF" e="#FFF9EE" ei={1.4} shadow={false} />))}
      {[-2.1, 0.9, 3.9].flatMap((x) => [-8.7, -2.7, 0.3].map((z) => <M key={`v${x}${z}`} p={[x, CEIL - 0.012, z]} s={[0.56, 0.02, 0.56]} c="#D8D6D0" shadow={false} />))}
      {/* walls with baseboards */}
      <M p={[-5.6, CEIL / 2, -4]} s={[0.1, CEIL, 16.2]} c="#ECE8DF" /><M p={[5.6, CEIL / 2, -5.4]} s={[0.1, CEIL, 13.4]} c="#ECE8DF" /><M p={[5.6, 2.55, 2.1]} s={[0.1, 0.6, 3.2]} c="#ECE8DF" /><M p={[5.6, CEIL / 2, 3.6]} s={[0.1, CEIL, 0.8]} c="#ECE8DF" />
      <M p={[0, CEIL / 2, 4.05]} s={[11.2, CEIL, 0.1]} c="#ECE8DF" />
      <M p={[-5.54, 0.05, -4]} s={[0.02, 0.1, 16.2]} c="#6A6E76" /><M p={[5.54, 0.05, -5.4]} s={[0.02, 0.1, 13.4]} c="#6A6E76" />
      {[-9.5, -6, -2.5, 1].map((z) => <M key={z} p={[-5.35, CEIL / 2, z]} s={[0.4, CEIL, 0.5]} c="#E4E0D6" />)}
      {/* company wordmark + clock on the left wall */}
      <mesh position={[-5.54, 1.95, 2.3]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2.2, 0.4]} /><meshBasicMaterial map={tex.company} transparent /></mesh>
      <group position={[-5.52, 2.25, -0.8]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><cylinderGeometry args={[0.2, 0.2, 0.04, 32]} /><meshStandardMaterial color="#2A2D33" /></mesh>
        <mesh position={[0, 0, 0.021]}><circleGeometry args={[0.18, 32]} /><meshStandardMaterial color="#FAFAF7" /></mesh>
        <M p={[Math.sin((hh / 12) * 2 * Math.PI) * 0.045, Math.cos((hh / 12) * 2 * Math.PI) * 0.045, 0.03]} s={[0.012, 0.1, 0.004]} r={[0, 0, -(hh / 12) * 2 * Math.PI]} c="#1A1A1A" shadow={false} />
        <M p={[Math.sin((mm / 60) * 2 * Math.PI) * 0.07, Math.cos((mm / 60) * 2 * Math.PI) * 0.07, 0.032]} s={[0.008, 0.15, 0.004]} r={[0, 0, -(mm / 60) * 2 * Math.PI]} c="#1A1A1A" shadow={false} />
      </group>
      {/* window wall: sill, glass, mullions, blinds, city */}
      <M p={[0, 0.45, -12.05]} s={[11.2, 0.9, 0.2]} c="#E2DED4" /><M p={[0, 0.91, -11.95]} s={[11.2, 0.04, 0.3]} c="#CFCAC0" /><M p={[0, 2.75, -12.05]} s={[11.2, 0.2, 0.2]} c="#E2DED4" />
      {Array.from({length: 10}, (_, i) => <M key={i} p={[-5.4 + i * 1.2, 1.8, -12.05]} s={[0.12, 1.9, 0.16]} c="#8F949C" metal={0.5} rough={0.35} />)}
      {Array.from({length: 9}, (_, i) => <M key={'b' + i} p={[-4.8 + i * 1.2, 2.55, -11.98]} s={[1.06, 0.3, 0.02]} c="#F1EFE9" shadow={false} />)}
      <mesh position={[0, 1.8, -12.06]}><planeGeometry args={[11.2, 1.9]} /><meshStandardMaterial color="#BFD8EA" transparent opacity={0.12} roughness={0.05} metalness={0.2} depthWrite={false} /></mesh>
      <mesh position={[0, 20, -260]}><planeGeometry args={[900, 260]} /><meshBasicMaterial color="#CFE0EE" fog={false} toneMapped={false} /></mesh>
      {city.map((b, i) => <mesh key={i} position={[b.x, -40 + b.h / 2, b.z]}><boxGeometry args={[b.w, b.h, b.w * 0.8]} /><meshStandardMaterial color={b.c} map={tex.facade} roughness={0.8} /></mesh>)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -40, -150]}><planeGeometry args={[800, 400]} /><meshStandardMaterial color="#9DA6B0" /></mesh>
      {/* cubicles + chairs */}
      {FURN.filter((f) => f.kind === 'desk').map((f, i) => <Cubicle key={f.id} f={f} i={i} screen={tex.screen} />)}
      {ROWS.flatMap((z, r) => COLS.map((x, c) => { const [sx, sz] = SEAT(c, r); return <Chair key={`ch${c}${r}`} x={sx} z={sz - 0.05} />; }))}
      {FURN.filter((f) => f.kind === 'bin').map((f) => <mesh key={f.id} position={[f.x, 0.2, f.z]} castShadow><cylinderGeometry args={[0.15, 0.13, 0.4, 14]} /><meshStandardMaterial color="#5B6573" roughness={0.6} /></mesh>)}
      {FURN.filter((f) => f.kind === 'plant').map((f) => <group key={f.id} position={[f.x, 0, f.z]}><mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.22, 0.17, 0.44, 16]} /><meshStandardMaterial color="#D8D2C4" /></mesh>{[0, 1, 2, 3].map((k) => <mesh key={k} position={[Math.sin(k * 1.9) * 0.12, 0.65 + k * 0.2, Math.cos(k * 1.9) * 0.12]} castShadow><icosahedronGeometry args={[0.28 - k * 0.04, 1]} /><meshStandardMaterial color={['#3D7A47', '#4C8E52', '#5E9F5E', '#6FB06A'][k]} roughness={0.9} /></mesh>)}</group>)}
      {/* reception */}
      {(() => { const f = FURN.find((q) => q.id === 'reception')!; return (<group position={[f.x, 0, f.z]}>
        <M p={[0, 0.52, 0]} s={[f.w, 1.04, f.d]} c="#3A3F49" rough={0.5} /><M p={[0, 1.06, 0.05]} s={[f.w + 0.12, 0.04, f.d + 0.25]} c="#D9CDB6" rough={0.4} /><M p={[0, 0.5, 0.2]} s={[f.w - 0.1, 0.9, 0.01]} c="#4A505C" rough={0.4} />
        <M p={[0.5, 1.26, -0.08]} s={[0.5, 0.32, 0.03]} c="#1A1D23" /><mesh position={[0.5, 1.26, -0.097]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.46, 0.28]} /><meshBasicMaterial map={tex.screen} toneMapped={false} /></mesh>
        <M p={[-0.6, 1.11, 0.0]} s={[0.12, 0.07, 0.12]} c="#E8B84A" />
        {boxOnDesk && <M p={[-0.15, 1.24, 0.08]} s={[0.44, 0.3, 0.32]} c="#B98A55" rough={0.95} />}</group>); })()}
      <Chair x={2.8} z={-0.3} yaw={Math.PI} c="#7A2E2A" />
      <mesh position={[2.8, 2.05, 4.0]}><planeGeometry args={[2.4, 0.44]} /><meshBasicMaterial map={tex.company} transparent /></mesh>
      {/* meeting room glass, frames, door, table, whiteboard, sign */}
      {FURN.filter((f) => f.kind === 'wall').map((f) => <group key={f.id}><M p={[f.x, 1.3, f.z]} s={[f.w, 2.6, f.d]} c="#CFE6F2" o={0.18} rough={0.05} /><M p={[f.x, 2.62, f.z]} s={[f.w + 0.04, 0.06, f.d + 0.04]} c="#8F949C" metal={0.5} rough={0.35} /><M p={[f.x, 0.03, f.z]} s={[f.w + 0.04, 0.06, f.d + 0.04]} c="#8F949C" metal={0.5} rough={0.35} /><M p={[f.x, 1.0, f.z]} s={[f.w + 0.01, 0.1, f.d + 0.01]} c="#F4F4F2" o={0.55} /></group>)}
      <M p={[1.3, 1.42, -7.5]} s={[0.08, CEIL, 0.08]} c="#8F949C" metal={0.5} rough={0.35} />
      <mesh position={[4.0, 1.85, -7.44]}><planeGeometry args={[0.9, 0.2]} /><meshBasicMaterial map={tex.meet} /></mesh>
      <group position={[MEET_DOOR.x - MEET_DOOR.w / 2, 0, MEET_DOOR.z]} rotation={[0, -pd * 1.5, 0]}><M p={[MEET_DOOR.w / 2, 1.2, 0]} s={[MEET_DOOR.w, 2.4, 0.04]} c="#CFE6F2" o={0.25} rough={0.05} /><M p={[MEET_DOOR.w - 0.12, 1.05, 0.04]} s={[0.03, 0.4, 0.03]} c="#9AA0AA" metal={0.7} rough={0.3} /></group>
      <M p={[3.5, 0.74, -9.6]} s={[2.0, 0.05, 1.0]} c="#6E5440" rough={0.45} /><M p={[3.5, 0.37, -9.6]} s={[0.1, 0.72, 0.6]} c="#3A3F49" />
      {[2.7, 3.5, 4.3].map((x) => <Chair key={x} x={x} z={-10.75} yaw={Math.PI} c="#33475E" />)}<Chair x={3.5} z={-8.4} yaw={0} c="#33475E" />
      <M p={[3.5, 1.45, -11.92]} s={[2.2, 1.1, 0.04]} c="#FBFBF8" rough={0.2} /><M p={[3.5, 0.88, -11.88]} s={[2.2, 0.04, 0.08]} c="#9AA0AA" />
      {/* pantry */}
      <M p={[5.2, 0.46, -4.1]} s={[0.7, 0.92, 3.4]} c="#F0ECE4" rough={0.5} /><M p={[5.18, 0.94, -4.1]} s={[0.76, 0.04, 3.46]} c="#3D3A36" rough={0.3} />
      <M p={[5.3, 1.75, -4.1]} s={[0.4, 0.6, 3.4]} c="#F0ECE4" rough={0.5} />
      <M p={[5.12, 1.18, -3.3]} s={[0.36, 0.46, 0.34]} c="#2A2D33" rough={0.4} /><M p={[4.93, 1.1, -3.3]} s={[0.02, 0.06, 0.08]} c="#7CFFB0" e="#7CFFB0" ei={1.5} />
      <Steam x={4.88} y={1.04} z={-3.3} t={t} />
      <M p={[5.1, 0.55, -5.95]} s={[0.36, 1.1, 0.36]} c="#E8ECEF" /><mesh position={[5.1, 1.32, -5.95]}><cylinderGeometry args={[0.13, 0.13, 0.38, 16]} /><meshStandardMaterial color="#9CCBEA" transparent opacity={0.75} roughness={0.1} /></mesh>
      {/* printer */}
      <M p={[-5.15, 0.42, 0.6]} s={[0.66, 0.84, 0.74]} c="#D5D7DB" rough={0.5} /><M p={[-5.12, 0.9, 0.6]} s={[0.5, 0.12, 0.5]} c="#B9BCC2" /><M p={[-4.8, 0.72, 0.85]} s={[0.03, 0.03, 0.03]} c="#7CFFB0" e={Math.sin(t * 6) > 0 ? '#7CFFB0' : '#335544'} ei={1.6} shadow={false} />
      {/* elevators: brushed steel doors, frame, floor indicator, call button, EXIT + ELEVATORS signs */}
      <M p={[5.6, 1.2, 2.0]} s={[0.12, 2.4, 2.6]} c="#8C929B" metal={0.6} rough={0.35} />
      {ELEV.zs.map((z, k) => { const o = eo[k] * 0.46; return (<group key={k}>
        <M p={[5.95, 1.1, z]} s={[0.8, 2.2, 1.0]} c="#3A3F49" e="#F3E9D2" ei={0.25 + eo[k] * 0.6} />
        <M p={[5.55, 1.08, z - 0.24 - o]} s={[0.05, 2.16, 0.48]} c="#B9BEC6" metal={0.75} rough={0.3} /><M p={[5.55, 1.08, z + 0.24 + o]} s={[0.05, 2.16, 0.48]} c="#B9BEC6" metal={0.75} rough={0.3} />
        <M p={[5.53, 2.4, z]} s={[0.04, 0.16, 0.36]} c="#15171B" e="#FF9A2E" ei={eo[k] > 0.05 ? 1.4 : 0.15} shadow={false} /></group>); })}
      <M p={[5.53, 1.1, 2.0]} s={[0.04, 0.22, 0.1]} c="#C9CDD3" metal={0.6} rough={0.3} /><M p={[5.5, 1.13, 2.0]} s={[0.02, 0.04, 0.04]} c="#FFB347" e="#FFB347" ei={eo[0] > 0.05 ? 1.5 : 0.1} shadow={false} />
      <mesh position={[5.53, 2.7, 2.0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[1.5, 0.26]} /><meshBasicMaterial map={tex.elev} toneMapped={false} /></mesh>
      <mesh position={[4.2, 2.62, 3.98]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.42, 0.16]} /><meshBasicMaterial map={tex.exit} toneMapped={false} /></mesh>
      <mesh position={[-5.53, 2.55, -11.0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.42, 0.16]} /><meshBasicMaterial map={tex.exit} toneMapped={false} /></mesh>
      <M p={[4.4, 0.33, 3.45]} s={[1.6, 0.42, 0.7]} c="#4F5E78" rough={0.95} /><M p={[4.4, 0.72, 3.72]} s={[1.6, 0.5, 0.16]} c="#4F5E78" rough={0.95} />
    </group>
  );
};
