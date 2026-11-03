import React, {useMemo} from 'react';
import * as THREE from 'three';
import {canvasTex} from '../../lib/tex';
import {Box, mat, useTex, Shophouse} from './Building';
import {hash, smooth} from '../../lib/math';
/** Police car arrival: drives in from z 62 over [inFrom, inTo] and parks at `park`; siren from `siren`; doors open over [a, b] windows (story seconds). */
export type CarCue = {inFrom: number; inTo: number; siren: number; park: {x: number; z: number; yaw: number}; doors: {front: [number, number]; rear: [number, number]}};
export const CAR_DEFAULT: CarCue = {inFrom: 2, inTo: 6, siren: 1.5, park: {x: -21.0, z: 21.0, yaw: 1.45}, doors: {front: [5.7, 8.2], rear: [6.1, 9.2]}};

/** EP3 sets: the alley's far end (more shophouses, the school boundary wall, the temple's wall + arch), the police car, and the temple yard (sala, rescue tent, vehicles, chedi, tape, sign). All real geometry. */
type V3 = [number, number, number];
const G = -3.6;
const F = (w: number, px: number) => `${w} ${px}px Prompt, sans-serif`;
const Cyl: React.FC<{p: V3; r0: number; r1?: number; h: number; c: string; seg?: number; rough?: number; metal?: number; rot?: V3}> = ({p, r0, r1, h, c, seg = 12, rough = 0.6, metal = 0, rot}) => (
  <mesh position={p} rotation={rot} material={mat(c, rough, metal)} castShadow receiveShadow><cylinderGeometry args={[r1 ?? r0, r0, h, seg]} /></mesh>
);
const signTex = (w: number, h: number, bg: string, fg: string, text: string, px: number, sub?: string) => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = F(700, px); g.fillText(text, w / 2, sub ? h * 0.4 : h / 2); if (sub) { g.font = F(500, px * 0.5); g.fillText(sub, w / 2, h * 0.78); }
});
const Wall: React.FC<{p: V3; s: V3; tex: THREE.Texture; rep?: number}> = ({p, s, tex}) => (
  <group position={p}>
    <mesh castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial map={tex} roughness={0.9} /></mesh>
    <Box p={[0, s[1] / 2 + 0.07, 0]} s={[s[0] + 0.12, 0.14, s[2] + 0.12]} c="#C26A2E" />
  </group>
);

export const Car: React.FC<{t: number; cue?: CarCue}> = ({t, cue = CAR_DEFAULT}) => {
  const CAR = cue.park, DOORS = cue.doors;
  const a = cue.inFrom, b = cue.inTo, k = Math.min(1, Math.max(0, (t - a) / (b - a))), e = 1 - Math.pow(1 - k, 2.2);   // brakes hard
  const z = 62 + (CAR.z - 62) * e, x = -22.0 + (CAR.x + 22.0) * smooth((k - 0.55) / 0.45);
  const yaw = Math.PI + (CAR.yaw - Math.PI) * smooth((k - 0.55) / 0.45);
  const nose = k >= 1 ? 0 : 0.03 * Math.sin(Math.PI * Math.min(1, k * 1.2)) * (k > 0.8 ? 1 : 0.3);
  const on = t > cue.siren - 0.6, fl = Math.floor(t * 5) % 2;
  const tex = useMemo(() => signTex(256, 96, '#1F3F8F', '#FFFFFF', 'ตำรวจ', 60), []);
  if (t < a - 0.6) return null;
  const dk = (w: number[]) => smooth((t - w[0]) / 0.4) * (1 - smooth((t - w[1]) / 0.4));
  const red = on && fl === 0, blue = on && fl === 1;
  return (
    <group position={[x, G, z]} rotation={[nose, yaw, 0]}>
      <Box p={[0, 0.62, 0]} s={[1.85, 0.78, 4.5]} c="#F2F2EE" rough={0.35} />
      <Box p={[0, 0.58, 0]} s={[1.88, 0.2, 4.52]} c="#1F3F8F" rough={0.4} />
      <Box p={[0, 1.2, -0.15]} s={[1.6, 0.58, 2.35]} c="#EDEDEA" rough={0.35} />
      <mesh position={[0, 1.24, 0.5]} rotation={[0.55, 0, 0]} material={mat('#1D262F', 0.1, 0.4)}><boxGeometry args={[1.5, 0.55, 0.05]} /></mesh>
      {[-1, 1].map((s) => <Box key={s} p={[s * 0.805, 1.22, -0.15]} s={[0.04, 0.42, 2.0]} c="#1D262F" rough={0.1} metal={0.4} />)}
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.94, 0.85, -0.2]} rotation={[0, s * Math.PI / 2, 0]}><planeGeometry args={[0.9, 0.34]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>)}
      {[-1, 1].map((s) => [1.55, -1.5].map((zz) => <Cyl key={`${s}${zz}`} p={[s * 0.9, 0.34, zz]} r0={0.34} h={0.26} c="#18191C" rot={[0, 0, Math.PI / 2]} />))}
      {[[DOORS.front, 0.85], [DOORS.rear, -0.1]].map(([w, hz], i) => (
        <group key={i} position={[0.94, 0.85, hz as number]} rotation={[0, -1.25 * dk(w as number[]), 0]}>
          <Box p={[0, 0, -0.45]} s={[0.05, 0.62, 0.9]} c="#F2F2EE" rough={0.35} />
          <Box p={[0.01, 0.3, -0.45]} s={[0.05, 0.3, 0.8]} c="#1D262F" rough={0.1} metal={0.4} />
        </group>
      ))}
      {/* light bar */}
      <Box p={[0, 1.58, -0.15]} s={[1.0, 0.1, 0.34]} c="#2A2D33" />
      <mesh position={[-0.28, 1.66, -0.15]}><boxGeometry args={[0.4, 0.12, 0.3]} /><meshBasicMaterial color={red ? '#FF3030' : '#4A1212'} toneMapped={false} /></mesh>
      <mesh position={[0.28, 1.66, -0.15]}><boxGeometry args={[0.4, 0.12, 0.3]} /><meshBasicMaterial color={blue ? '#3A7BFF' : '#12224A'} toneMapped={false} /></mesh>
      {[-0.6, 0.6].map((s) => <mesh key={s} position={[s, 0.7, 2.27]}><boxGeometry args={[0.3, 0.14, 0.04]} /><meshBasicMaterial color="#FFF4D0" toneMapped={false} /></mesh>)}
      <pointLight position={[-0.4, 2.0, 0.3]} color="#FF2A2A" intensity={red ? 7 : 0} distance={14} decay={1.6} />
      <pointLight position={[0.4, 2.0, 0.3]} color="#2A6BFF" intensity={blue ? 7 : 0} distance={14} decay={1.6} />
    </group>
  );
};

const Frangi: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <Cyl p={[0, 1.3, 0]} r0={0.2} r1={0.13} h={2.6} c="#6B5A4A" rough={0.9} />
    {[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[Math.cos(k * 1.3) * 1.3, 3.0 + (k % 2) * 0.6, Math.sin(k * 1.3) * 1.3]} scale={[1.5, 0.9, 1.5]} material={mat(['#4E8C45', '#5E9A4A', '#3F7A38'][k % 3], 0.95, 0, true)} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>)}
    {[0, 1, 2, 3, 4, 5].map((k) => <mesh key={'f' + k} position={[Math.cos(k * 1.1 + 0.4) * 1.9, 2.6 + (k % 3) * 0.5, Math.sin(k * 1.1) * 1.9]} material={mat('#FFF4D8', 0.8)}><sphereGeometry args={[0.1, 6, 5]} /></mesh>)}
  </group>
);

/** the far end of the alley + the temple wall and arch */
export const Alley3: React.FC<{t: number}> = ({t}) => {
  const tex = useTex();
  const wallTex = useMemo(() => canvasTex(256, 128, (g) => { g.fillStyle = '#EFE8D6'; g.fillRect(0, 0, 256, 128); for (let k = 0; k < 900; k++) { g.fillStyle = hash(k) > 0.5 ? 'rgba(80,72,58,.08)' : 'rgba(255,255,248,.1)'; g.fillRect(hash(k * 2.3) * 256, hash(k * 4.1) * 128, 3, 3); } const gr = g.createLinearGradient(0, 70, 0, 128); gr.addColorStop(0, 'rgba(60,54,44,0)'); gr.addColorStop(1, 'rgba(60,54,44,.35)'); g.fillStyle = gr; g.fillRect(0, 70, 256, 58); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,110,90,.18)'; g.fillRect(hash(i * 7.7) * 256, 0, 2, 40 + hash(i) * 50); } }), []);
  const arch = useMemo(() => signTex(512, 130, '#7A1E1E', '#F2D58A', 'วัดใหม่ศรีสุทธาราม', 70), []);
  return (
    <group>
      {/* shophouses on to z = 18 */}
      {[12, 16].map((z, i) => <Shophouse key={z} z={z} i={7 + i} tex={tex} t={t} />)}
      {/* pavement strip + asphalt on to the temple, the boundary wall on the other side */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-25.1, G + 0.003, 5]} receiveShadow><planeGeometry args={[1.0, 62]} /><meshStandardMaterial map={tex.concrete} roughness={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-22.2, G + 0.006, 46]} receiveShadow><planeGeometry args={[6.8, 40]} /><meshStandardMaterial map={tex.asphalt} roughness={0.95} /></mesh>
      <Wall p={[-17.6, G + 1.15, 36]} s={[0.3, 2.3, 60]} tex={wallTex} />
      {/* the temple's wall (east side of the yard) with the arch at z 25.2 .. 28.2 */}
      <Wall p={[-25.75, G + 1.3, 21.4]} s={[0.3, 2.6, 6.6]} tex={wallTex} />
      <Wall p={[-25.75, G + 1.3, 37.1]} s={[0.3, 2.6, 17.8]} tex={wallTex} />
      {[24.9, 28.5].map((z) => <group key={z}><Box p={[-25.75, G + 1.9, z]} s={[0.9, 3.8, 0.9]} c="#F2EBDC" /><Box p={[-25.75, G + 0.2, z]} s={[1.1, 0.4, 1.1]} c="#C9C0AC" /><Box p={[-25.75, G + 3.85, z]} s={[1.1, 0.16, 1.1]} c="#D9A93B" metal={0.5} rough={0.35} /></group>)}
      <Box p={[-25.75, G + 3.25, 26.7]} s={[0.7, 0.9, 4.5]} c="#F2EBDC" />
      <mesh position={[-25.2, G + 3.25, 26.7]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[3.4, 0.86]} /><meshStandardMaterial map={arch} roughness={0.7} /></mesh>
      {[0, 1].map((k) => <mesh key={k} position={[-25.75, G + 4.0 + k * 0.55, 26.7]} scale={[0.55 - k * 0.12, 0.7, 2.6 - k * 0.8]} material={mat('#D9651E', 0.7, 0, true)} castShadow><boxGeometry args={[1, 1, 1]} /></mesh>)}
      <Box p={[-25.75, G + 5.0, 26.7]} s={[0.2, 0.12, 2.0]} c="#D9A93B" metal={0.6} rough={0.3} />
      {/* power pole + wire at the far end, a few bits of street life */}
      <Cyl p={[-19.4, G + 3.5, 30]} r0={0.13} r1={0.1} h={7} c="#B9B3A6" />
      <Box p={[-19.4, G + 6.3, 30]} s={[0.12, 0.12, 1.2]} c="#8C877E" />
      <Frangi p={[-24.3, G, 44]} s={1.2} />
    </group>
  );
};

/** the temple yard (x −52 .. −25.6, z 21.5 .. 46) */
export const Temple: React.FC<{t: number}> = ({t}) => {
  const tex = useTex();
  const wallTex = useMemo(() => canvasTex(256, 128, (g) => { g.fillStyle = '#EFE8D6'; g.fillRect(0, 0, 256, 128); for (let k = 0; k < 800; k++) { g.fillStyle = hash(k) > 0.5 ? 'rgba(80,72,58,.08)' : 'rgba(255,255,248,.1)'; g.fillRect(hash(k * 2.3) * 256, hash(k * 4.1) * 128, 3, 3); } }), []);
  const sala = useMemo(() => signTex(512, 130, '#7A1E1E', '#F2D58A', 'ศาลาการเปรียญ', 74), []);
  const assemble = useMemo(() => signTex(640, 300, '#1E7A4A', '#FFFFFF', 'จุดรวมพล', 140, 'ผู้อพยพ · นักเรียน'), []);
  const aid = useMemo(() => signTex(512, 130, '#F2F2EE', '#C23B3B', 'จุดปฐมพยาบาล', 64), []);
  const tape = useMemo(() => canvasTex(256, 32, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#F2F2EE' : '#D9302A'; g.fillRect(i * 16, 0, 16, 32); } }), []);
  const roofTile = '#D9651E', gold = '#D9A93B';
  const phase = Math.floor(t * 4) % 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-38.8, G + 0.01, 33.75]} receiveShadow><planeGeometry args={[26.4, 24.5]} /><meshStandardMaterial map={tex.concrete} roughness={0.95} /></mesh>
      {/* boundary walls */}
      <Wall p={[-38.8, G + 1.3, 21.4]} s={[26.4, 2.6, 0.3]} tex={wallTex} /><Wall p={[-38.8, G + 1.3, 46.1]} s={[26.4, 2.6, 0.3]} tex={wallTex} /><Wall p={[-52.0, G + 1.3, 33.75]} s={[0.3, 2.6, 24.8]} tex={wallTex} />
      {/* the sala: raised floor, steps, columns, two-tier gabled roof with gold trim, a gilded Buddha at the back */}
      <group position={[-45.5, G, 29.5]}>
        <Box p={[0, 0.25, 0]} s={[9.4, 0.5, 8.4]} c="#C9BFA8" rough={0.7} />
        {[0, 1].map((k) => <Box key={k} p={[4.85 + k * 0.4, 0.17 - k * 0.1 + 0.0, 0]} s={[0.5, 0.34 - k * 0.15, 5.2]} c="#D6CDB8" />)}
        {[-4, 0, 4].flatMap((z) => [-4.1, 4.1].map((x) => <group key={`${x}${z}`}><Cyl p={[x, 2.1, z]} r0={0.2} h={3.2} c="#F2EBDC" seg={10} /><Box p={[x, 0.55, z]} s={[0.55, 0.12, 0.55]} c="#D9A93B" metal={0.4} /></group>))}
        {[0, 1].map((k) => <group key={k} position={[0, 3.7 + k * 1.15, 0]} scale={[1 - k * 0.38, 1, 1 - k * 0.3]}>
          {[-1, 1].map((s) => <mesh key={s} position={[s * 2.9, 0.55, 0]} rotation={[0, 0, s * -0.5]} material={mat(roofTile, 0.65, 0, true)} castShadow receiveShadow><boxGeometry args={[6.6, 0.16, 9.8]} /></mesh>)}
          <Box p={[0, 1.7, 0]} s={[0.22, 0.2, 10.0]} c={gold} metal={0.6} rough={0.3} />
          {[-1, 1].map((s) => <Box key={s} p={[s * 5.3, -0.55, 0]} s={[0.18, 0.18, 9.9]} c={gold} metal={0.6} rough={0.3} />)}
          {[-1, 1].map((s) => <mesh key={'g' + s} position={[0, 0.8, s * 4.95]} material={mat('#EFE3C2', 0.7)}><boxGeometry args={[5.8, 1.9, 0.12]} /></mesh>)}
        </group>)}
        <mesh position={[4.2, 4.5, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3.4, 0.88]} /><meshStandardMaterial map={sala} roughness={0.7} /></mesh>
        <group position={[-3.4, 0.5, 0]}><Box p={[0, 0.3, 0]} s={[1.6, 0.6, 2.2]} c="#F2EBDC" /><Box p={[0, 0.95, 0]} s={[0.9, 0.7, 1.2]} c={gold} metal={0.7} rough={0.3} /><mesh position={[0, 1.65, 0]} material={mat(gold, 0.3, 0.7)} castShadow><sphereGeometry args={[0.32, 10, 8]} /></mesh></group>
        {/* offering trays + a few cushions on the floor */}
        {[-2.5, 0, 2.5].map((z) => <group key={z} position={[-1.2, 0.5, z]}><Cyl p={[0, 0.2, 0]} r0={0.35} r1={0.25} h={0.4} c={gold} metal={0.6} rough={0.35} /><mesh position={[0, 0.5, 0]} material={mat('#E24A8A', 0.7)}><coneGeometry args={[0.2, 0.3, 8]} /></mesh></group>)}
      </group>
      {/* the white chedi with a gold spire */}
      <group position={[-48.6, G, 41.2]}>
        <Box p={[0, 0.2, 0]} s={[4.6, 0.4, 4.6]} c="#E6DDC8" /><Box p={[0, 0.7, 0]} s={[3.6, 0.6, 3.6]} c="#F2EBDC" /><Box p={[0, 1.25, 0]} s={[2.8, 0.5, 2.8]} c="#E6DDC8" />
        <mesh position={[0, 2.6, 0]} material={mat('#F7F1E2', 0.6)} castShadow><sphereGeometry args={[1.35, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} /></mesh>
        <Cyl p={[0, 4.4, 0]} r0={0.75} r1={0.12} h={3.4} c="#F2EBDC" seg={14} />
        {[0, 1, 2, 3, 4, 5].map((k) => <Cyl key={k} p={[0, 3.3 + k * 0.5, 0]} r0={0.7 - k * 0.09} h={0.07} c={gold} metal={0.7} rough={0.3} seg={14} />)}
        <Cyl p={[0, 6.4, 0]} r0={0.05} r1={0.02} h={1.5} c={gold} metal={0.8} rough={0.3} />
      </group>
      {/* rescue tent (first aid): orange + white canopy, tables, blankets, a stretcher */}
      <group position={[-34.5, G, 41.0]}>
        {[-2.3, 2.3].flatMap((x) => [-1.8, 1.8].map((z) => <Cyl key={`${x}${z}`} p={[x, 1.3, z]} r0={0.05} h={2.6} c="#B9BEC4" metal={0.6} rough={0.35} seg={8} />))}
        <mesh position={[0, 2.75, 0]} rotation={[0, 0, 0]} material={mat('#F07A2A', 0.75)} castShadow><boxGeometry args={[5.1, 0.08, 4.1]} /></mesh>
        {[-2, -0.7, 0.7, 2].map((x, i) => i % 2 === 0 ? null : <Box key={x} p={[x, 2.8, 0]} s={[1.0, 0.04, 4.15]} c="#F2F2EE" shadow={false} />)}
        <mesh position={[0, 3.05, 0]} scale={[2.7, 0.35, 2.2]} material={mat('#F07A2A', 0.75, 0, true)} castShadow><boxGeometry args={[1, 1, 1]} /></mesh>
        <mesh position={[0, 2.2, -2.1]} material={mat('#F2F2EE', 0.8)}><planeGeometry args={[4.6, 0.56]} /></mesh>
        <mesh position={[0, 2.5, 2.1]} rotation={[0, Math.PI, 0]}><planeGeometry args={[3.4, 0.88]} /><meshStandardMaterial map={aid} roughness={0.7} /></mesh>
        <Box p={[0, 0.5, -0.4]} s={[3.2, 0.06, 0.9]} c="#E9E9E6" /><Box p={[-1.4, 0.25, -0.4]} s={[0.06, 0.5, 0.8]} c="#8E949A" /><Box p={[1.4, 0.25, -0.4]} s={[0.06, 0.5, 0.8]} c="#8E949A" />
        {[0, 1, 2].map((k) => <Box key={k} p={[-1.0 + k * 0.9, 0.58, -0.4]} s={[0.4, 0.16, 0.5]} c={['#C23B3B', '#F2F2EE', '#3E7CC9'][k]} />)}
        <Box p={[1.2, 0.3, 1.0]} s={[0.4, 0.6, 0.4]} c="#3E7CC9" /><Box p={[1.7, 0.3, 1.0]} s={[0.4, 0.6, 0.4]} c="#3E7CC9" />
      </group>
      {/* vehicles: an ambulance and an orange rescue pickup, lights going */}
      <group position={[-44.0, G, 44.0]} rotation={[0, 0.1, 0]}>
        <Box p={[0, 1.1, 0]} s={[2.1, 1.7, 4.9]} c="#F2F2EE" rough={0.35} /><Box p={[0, 1.15, 1.9]} s={[2.0, 1.2, 1.2]} c="#F2F2EE" /><Box p={[0, 0.6, 0]} s={[2.12, 0.18, 4.92]} c="#C23B3B" />
        <Box p={[1.06, 1.3, -0.4]} s={[0.04, 0.8, 0.8]} c="#C23B3B" /><Box p={[1.06, 1.3, -0.4]} s={[0.04, 0.2, 0.8]} c="#F2F2EE" />
        <mesh position={[-0.5, 2.0, 1.8]}><boxGeometry args={[0.5, 0.14, 0.3]} /><meshBasicMaterial color={phase ? '#FF3030' : '#4A1212'} toneMapped={false} /></mesh><mesh position={[0.5, 2.0, 1.8]}><boxGeometry args={[0.5, 0.14, 0.3]} /><meshBasicMaterial color={phase ? '#12224A' : '#3A7BFF'} toneMapped={false} /></mesh>
        {[-1, 1].map((s) => [1.6, -1.6].map((z) => <Cyl key={`${s}${z}`} p={[s * 1.0, 0.38, z]} r0={0.38} h={0.28} c="#18191C" rot={[0, 0, Math.PI / 2]} />))}
      </group>
      <group position={[-30.5, G, 44.4]} rotation={[0, 1.7, 0]}>
        <Box p={[0, 0.75, 0]} s={[1.9, 0.9, 4.8]} c="#F07A2A" rough={0.4} /><Box p={[0, 1.45, 0.6]} s={[1.75, 0.65, 1.9]} c="#F07A2A" rough={0.4} /><Box p={[0, 1.2, -1.3]} s={[1.8, 0.4, 1.6]} c="#2A2D33" />
        <mesh position={[0, 1.9, 0.6]}><boxGeometry args={[1.0, 0.12, 0.3]} /><meshBasicMaterial color={phase ? '#FFB020' : '#5A3A08'} toneMapped={false} /></mesh>
        {[-1, 1].map((s) => [1.5, -1.5].map((z) => <Cyl key={`${s}${z}`} p={[s * 0.95, 0.36, z]} r0={0.36} h={0.26} c="#18191C" rot={[0, 0, Math.PI / 2]} />))}
      </group>
      {/* the assembly sign, tape line, cones, water table */}
      <group position={[-38.0, G, 24.4]} rotation={[0, Math.PI / 2, 0]}>
        {[-1.0, 1.0].map((x) => <Cyl key={x} p={[x, 0.95, 0]} r0={0.04} h={1.9} c="#B9BEC4" metal={0.5} seg={8} />)}
        <mesh position={[0, 1.55, 0.06]}><planeGeometry args={[2.4, 1.1]} /><meshStandardMaterial map={assemble} roughness={0.7} /></mesh>
        <Box p={[0, 1.55, 0]} s={[2.5, 1.2, 0.05]} c="#2A2D33" />
      </group>
      <mesh position={[-33.5, G + 0.9, 42.5]}><planeGeometry args={[13, 0.09]} /><meshBasicMaterial map={tape} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      {[-40, -33.5, -27].map((x) => <Cyl key={x} p={[x, G + 0.5, 42.5]} r0={0.04} h={1.0} c="#D9302A" seg={8} />)}
      {[[-27.0, 33.4], [-27.0, 36], [-27.6, 24.2]].map(([x, z], i) => <group key={i} position={[x, G, z]}><mesh position={[0, 0.3, 0]} material={mat('#F07A2A', 0.6)}><coneGeometry args={[0.16, 0.6, 8]} /></mesh><Box p={[0, 0.02, 0]} s={[0.34, 0.04, 0.34]} c="#F07A2A" /></group>)}
      <group position={[-42.0, G, 36.5]}><Box p={[0, 0.4, 0]} s={[1.8, 0.8, 0.7]} c="#F2F2EE" />{[0, 1, 2].map((k) => <Cyl key={k} p={[-0.5 + k * 0.5, 1.0, 0]} r0={0.14} h={0.4} c="#3E7CC9" seg={8} />)}</group>
      {/* trees beyond the walls, tall and soft against the sky */}
      <Frangi p={[-56, G, 28]} s={1.6} /><Frangi p={[-56, G, 41]} s={1.5} /><Frangi p={[-44, G, 50]} s={1.6} /><Frangi p={[-32, G, 50]} s={1.3} /><Frangi p={[-46, G, 17]} s={1.4} /><Frangi p={[-34, G, 17.5]} s={1.2} />
      <Frangi p={[-30.5, G, 22.6]} s={0.8} />
    </group>
  );
};

