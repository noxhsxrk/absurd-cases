import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {HANDLE} from './data';

type V3 = [number, number, number];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const CREAM = '#E6E7CF', NAVY = '#152028', TEAL = '#476F66', BRICK = '#B0402E';

// -----------------------------------------------------------------------------------------------------
// The accused: one speck of PM 2.5. A flat-shaded grey low-poly chunk with two bean eyes. It never emotes.
// `look` turns the eyes toward a world point (defaults to facing +z).
// -----------------------------------------------------------------------------------------------------
const dustGeo = (() => { const g = new THREE.IcosahedronGeometry(1, 0); const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const k = 0.82 + hash(Math.round(p.getX(i) * 7 + p.getY(i) * 13 + p.getZ(i) * 17)) * 0.32; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.9, p.getZ(i) * k); }
  g.computeVertexNormals(); return g; })();
const dustMat = new THREE.MeshLambertMaterial({color: '#8B8E88', flatShading: true});
export const Dust: React.FC<{position: V3; r: number; look?: V3; spin?: number; eyes?: boolean}> = ({position, r, look, spin = 0, eyes = true}) => {
  const yaw = look ? Math.atan2(look[0] - position[0], look[2] - position[2]) : 0;
  const pitch = look ? -Math.atan2(look[1] - position[1], Math.hypot(look[0] - position[0], look[2] - position[2])) * 0.5 : 0;
  return <group position={position} rotation={[pitch, yaw, 0]} scale={r}>
    <mesh geometry={dustGeo} material={dustMat} castShadow rotation={[0.4, spin, 0.2]} />
    {eyes && [-1, 1].map((s) => <mesh key={s} position={[s * 0.3, 0.12, 0.86]} scale={[0.09, 0.15, 0.05]} material={MB('#111316')}><sphereGeometry args={[1, 10, 8]} /></mesh>)}
  </group>;
};
/** a grey smog blob for the sky (no eyes, softer, slightly transparent) */
const smogMat = new THREE.MeshLambertMaterial({color: '#9A9C95', flatShading: true, transparent: true, opacity: 0.92});
export const Smog: React.FC<{position: V3; r: number; spin?: number}> = ({position, r, spin = 0}) => r <= 0.001 ? null :
  <mesh geometry={dustGeo} material={smogMat} position={position} scale={[r * 1.5, r, r * 1.2]} rotation={[0.3, spin, 0.1]} />;

// -----------------------------------------------------------------------------------------------------
// Police helicopter, low-poly. Origin at the cabin centre, nose along +x. `t` spins the rotor.
// -----------------------------------------------------------------------------------------------------
const heliSide = (flip: boolean) => tex('heli-side' + flip, 512, 160, (g) => {
  g.fillStyle = TEAL; g.fillRect(0, 0, 512, 160); g.fillStyle = CREAM; g.fillRect(0, 96, 512, 26);
  g.save(); if (flip) { g.translate(512, 0); g.scale(-1, 1); }
  g.fillStyle = CREAM; g.font = F(700, 64); g.textAlign = 'center'; g.fillText('ปราบปรามฝุ่น', 256, 76);
  g.fillStyle = NAVY; g.font = F(600, 22); g.fillText('ตำรวจ · ' + HANDLE, 256, 116); g.restore();
});
export const Heli: React.FC<{t: number; position: V3; yaw?: number; bank?: number; light?: V3 | null; scale?: number; seed?: number}> = ({t, position, yaw = 0, bank = 0, light = null, scale = 1, seed = 0}) => {
  const body = PM(TEAL, 'heli'), dark = PM(NAVY, 'heli2'), cream = PM(CREAM, 'heli3');
  const side = useMemo(() => [new THREE.MeshLambertMaterial({map: heliSide(false)}), new THREE.MeshLambertMaterial({map: heliSide(true)})], []);
  const glass = M('#BFD4D2', 0.15, 0.2); const rot = t * 26 + seed;
  const blur = useMemo(() => new THREE.MeshBasicMaterial({color: '#2A3A3A', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide}), []);
  // spotlight from the belly toward a world point: a long flat cone, cream, see-through (a geometric light ray)
  let beam: React.ReactNode = null;
  if (light) {
    const P = new THREE.Vector3(...position), L = new THREE.Vector3(...light), d = L.clone().sub(P), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize());
    beam = <mesh position={P.clone().add(d.clone().multiplyScalar(0.5))} quaternion={q}><cylinderGeometry args={[0.12, 1.1, len, 12, 1, true]} /><meshBasicMaterial color="#FFF6D8" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
  }
  return <>
    <group position={position} rotation={[0, yaw, bank]} scale={scale}>
      <mesh castShadow material={[body, body, body, dark, side[0], side[1]]}><boxGeometry args={[2.6, 1.5, 1.5]} /></mesh>
      <mesh castShadow position={[1.55, -0.1, 0]} rotation={[0, 0, -0.5]} material={glass}><boxGeometry args={[0.9, 1.1, 1.36]} /></mesh>
      <mesh castShadow position={[-2.4, 0.25, 0]} material={body}><boxGeometry args={[2.6, 0.34, 0.34]} /></mesh>
      <mesh castShadow position={[-3.55, 0.75, 0]} rotation={[0, 0, 0.3]} material={dark}><boxGeometry args={[0.6, 1.0, 0.1]} /></mesh>
      <group position={[-3.6, 0.35, 0.2]} rotation={[0, 0, rot * 1.3]}>{[0, 1].map((i) => <mesh key={i} rotation={[0, 0, i * Math.PI / 2]} material={dark}><boxGeometry args={[0.08, 1.1, 0.03]} /></mesh>)}</group>
      <mesh position={[0, 0.95, 0]} material={dark}><cylinderGeometry args={[0.12, 0.16, 0.4, 8]} /></mesh>
      <group position={[0, 1.18, 0]} rotation={[0, rot, 0]}>{[0, 1].map((i) => <mesh key={i} rotation={[0, i * Math.PI / 2, 0]} material={dark}><boxGeometry args={[7.2, 0.04, 0.26]} /></mesh>)}</group>
      <mesh position={[0, 1.17, 0]} material={blur} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[3.6, 28]} /></mesh>
      {[-1, 1].map((s) => <group key={s}>
        <mesh castShadow position={[0.1, -1.05, s * 0.62]} rotation={[0, 0, Math.PI / 2]} material={cream}><cylinderGeometry args={[0.06, 0.06, 2.6, 6]} /></mesh>
        {[-0.6, 0.6].map((x) => <mesh key={x} position={[x, -0.88, s * 0.6]} material={cream}><boxGeometry args={[0.06, 0.34, 0.06]} /></mesh>)}
      </group>)}
      <mesh position={[0.6, -0.82, 0]} material={MB('#FFF6D8')}><cylinderGeometry args={[0.16, 0.12, 0.12, 10]} /></mesh>
    </group>
    {beam}
  </>;
};

// -----------------------------------------------------------------------------------------------------
// The national-grade vacuum: a cream canister slung under the lead helicopter, a hose, a wide nozzle.
// Origin at the canister centre; the nozzle mouth position is returned by nozzleAt() for the suction FX.
// -----------------------------------------------------------------------------------------------------
const vacLabel = () => tex('vac-label', 512, 256, (g) => {
  g.fillStyle = BRICK; g.fillRect(0, 0, 512, 256); g.strokeStyle = CREAM; g.lineWidth = 10; g.strokeRect(12, 12, 488, 232);
  g.fillStyle = CREAM; g.font = F(700, 78); g.textAlign = 'center'; g.fillText('แรงดูด', 256, 112); g.fillText('ระดับชาติ', 256, 200);
});
export const NOZZLE: V3 = [3.4, 3.2, 0];   // relative to the canister
export const Vacuum: React.FC<{position: V3; t: number; on: number}> = ({position, t, on}) => {
  const cream = PM(CREAM, 'vac'), navy = PM(NAVY, 'vac2'), teal = PM(TEAL, 'vac3');
  const label = useMemo(() => new THREE.MeshBasicMaterial({map: vacLabel(), toneMapped: false}), []);
  const hose = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(1.9, 0.2, 0), new THREE.Vector3(3.0, 0.4, 0), new THREE.Vector3(3.3, 1.6, 0), new THREE.Vector3(3.4, 2.6, 0)]), 24, 0.32, 10), []);
  const jit = on * Math.sin(t * 60) * 0.03;
  return <group position={[position[0], position[1] + jit, position[2]]}>
    <mesh castShadow rotation={[0, 0, Math.PI / 2]} material={cream}><cylinderGeometry args={[1.25, 1.25, 3.6, 12]} /></mesh>
    {[-1.3, 1.3].map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={navy}><cylinderGeometry args={[1.3, 1.3, 0.3, 12]} /></mesh>)}
    <mesh position={[0, 0, 1.27]} material={label}><planeGeometry args={[2.0, 1.0]} /></mesh>
    <mesh position={[0, 0, -1.27]} rotation={[0, Math.PI, 0]} material={label}><planeGeometry args={[2.0, 1.0]} /></mesh>
    <mesh geometry={hose} material={teal} castShadow />
    <mesh position={NOZZLE} material={navy}><cylinderGeometry args={[1.3, 0.34, 1.0, 12, 1, true]} /></mesh>
    <mesh position={[NOZZLE[0], NOZZLE[1] + 0.49, NOZZLE[2]]} rotation={[-Math.PI / 2, 0, 0]} material={MB('#0D1216')}><circleGeometry args={[1.25, 16]} /></mesh>
    {/* sling cables up to the helicopter */}
    {[-1, 1].map((s) => <mesh key={s} position={[s * 1.1, 2.2, 0]} rotation={[0, 0, -s * 0.18]} material={MB('#1A1E22')}><cylinderGeometry args={[0.02, 0.02, 3.4, 4]} /></mesh>)}
  </group>;
};

// -----------------------------------------------------------------------------------------------------
// The jar for this case: own label, a lid that can be lifted (lid = height above its seat)
// -----------------------------------------------------------------------------------------------------
const jarLabel3 = () => tex('jar-label-3', 256, 128, (g) => {
  g.fillStyle = '#F4EFE2'; g.fillRect(0, 0, 256, 128); g.strokeStyle = BRICK; g.lineWidth = 6; g.strokeRect(6, 6, 244, 116);
  g.fillStyle = BRICK; g.font = F(700, 30); g.textAlign = 'center'; g.fillText('ผู้ต้องหา', 128, 44); g.fillStyle = '#2A2A2E'; g.font = F(700, 26); g.fillText('ฝุ่น พีเอ็ม 2.5', 128, 82); g.font = F(500, 15); g.fillStyle = '#6A6A70'; g.fillText(HANDLE, 128, 112);
});
export const JAR_R = 0.055;
export const Jar3: React.FC<{position?: V3; lid?: number; children?: React.ReactNode; tip?: number}> = ({position, lid = 0, children, tip = 0}) => {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({color: '#D8EEF2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide}), []);
  const rim = useMemo(() => new THREE.MeshStandardMaterial({color: '#E9F6F8', roughness: 0.1, transparent: true, opacity: 0.55}), []);
  const label = useMemo(() => new THREE.MeshStandardMaterial({map: jarLabel3(), roughness: 0.8, side: THREE.DoubleSide}), []);
  return (
    <group position={position} rotation={[0, 0, tip]}>
      {children}
      <mesh material={glass} position={[0, 0.075, 0]}><cylinderGeometry args={[JAR_R, JAR_R, 0.15, 28, 1, true]} /></mesh>
      <mesh material={rim} position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[JAR_R, 28]} /></mesh>
      <mesh material={rim} position={[0, 0.15, 0]}><torusGeometry args={[JAR_R, 0.003, 6, 28]} /></mesh>
      <group position={[0, lid, 0]}>
        <mesh castShadow material={M('#9AA3AC', 0.3, 0.8)} position={[0, 0.162, 0]}><cylinderGeometry args={[0.058, 0.058, 0.022, 28]} /></mesh>
        {[0, 1, 2, 3, 4].map((i) => <mesh key={i} material={M('#2A2E33', 0.5)} position={[Math.cos(i * 1.26) * 0.025, 0.1735, Math.sin(i * 1.26) * 0.025]}><cylinderGeometry args={[0.003, 0.003, 0.003, 6]} /></mesh>)}
      </group>
      {/* the label sits ON the glass (radius + a hair), facing +z */}
      <mesh material={label} position={[0, 0.06, 0]}><cylinderGeometry args={[JAR_R + 0.0015, JAR_R + 0.0015, 0.05, 20, 1, true, -0.75, 1.5]} /></mesh>
    </group>
  );
};
/** a steel ring bolted to the table, for the cuffs */
export const TableRing: React.FC<{position: V3}> = ({position}) => <group position={position}>
  <mesh material={M('#7E868C', 0.3, 0.8)} position={[0, 0.006, 0]}><cylinderGeometry args={[0.02, 0.02, 0.012, 10]} /></mesh>
  <mesh material={M('#9AA2A8', 0.3, 0.8)} position={[0, 0.04, 0]}><torusGeometry args={[0.03, 0.005, 6, 16]} /></mesh>
</group>;

// -----------------------------------------------------------------------------------------------------
// Paper and plates with big text
// -----------------------------------------------------------------------------------------------------
const folderTex3 = () => tex('case-folder-3', 1024, 1280, (g) => {
  g.fillStyle = '#C9A86A'; g.fillRect(0, 0, 1024, 1280);
  g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 1500; i++) g.fillRect(hash(i) * 1024, hash(i * 2.3) * 1280, 3, 3);
  g.fillStyle = '#B8975A'; g.fillRect(0, 0, 1024, 120); g.fillStyle = '#F4EFE2'; g.fillRect(90, 160, 844, 560);
  g.strokeStyle = BRICK; g.lineWidth = 8; g.strokeRect(110, 180, 804, 520);
  g.textAlign = 'center'; g.fillStyle = '#1E2B3C'; g.font = F(700, 86); g.fillText('แฟ้มคดี 193/2569', 512, 300);
  g.fillStyle = '#2A2A2E'; g.font = F(600, 60); g.fillText('จำเลย: ฝุ่น พีเอ็ม 2.5', 512, 420);
  g.fillStyle = BRICK; g.font = F(700, 64); g.fillText('ข้อหา: บุกรุกเคหสถาน', 512, 540);
  g.fillStyle = '#6A6A70'; g.font = F(500, 44); g.fillText(HANDLE, 512, 650);
  g.save(); g.translate(512, 990); g.rotate(-0.12); g.globalAlpha = 0.9; g.strokeStyle = BRICK; g.lineWidth = 12; g.strokeRect(-420, -100, 840, 180); g.fillStyle = BRICK; g.font = F(700, 104); g.fillText('ลอยเข้าจมูก', 0, 36); g.restore();
});
export const CaseFolder3: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [0, 0, 0]}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: folderTex3(), toneMapped: false}), []);
  return <group position={position} rotation={rotation}>
    <mesh castShadow receiveShadow material={M('#C9A86A', 0.9)}><boxGeometry args={[0.24, 0.014, 0.32]} /></mesh>
    <mesh position={[0, 0.0075, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat}><planeGeometry args={[0.24, 0.32]} /></mesh>
  </group>;
};
/** a flat plate with one or two lines of text, auto-fitted */
const plateTex = (lines: string[], bg: string, fg: string, w: number, h: number) => tex('plate3-' + lines.join('|') + bg, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = Math.max(6, h * 0.04); g.strokeRect(h * 0.055, h * 0.055, w - h * 0.11, h - h * 0.11);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((s, i) => { const big = i === 0; let px = h * (lines.length > 1 ? (big ? 0.44 : 0.22) : 0.5); g.font = F(700, px); while (g.measureText(s).width > w * 0.86 && px > 10) { px -= 4; g.font = F(700, px); }
    g.fillText(s, w / 2, lines.length > 1 ? (big ? h * 0.42 : h * 0.77) : h * 0.54); });
});
export const Plate: React.FC<{lines: string[]; position: V3; w?: number; aspect?: number; bg?: string; fg?: string; rotation?: V3; scale?: number}> = ({lines, position, w = 0.6, aspect = 2, bg = NAVY, fg = CREAM, rotation, scale = 1}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: plateTex(lines, bg, fg, 512, Math.round(512 / aspect)), toneMapped: false}), [lines.join('|'), bg, fg, aspect]);
  return <mesh position={position} rotation={rotation} scale={scale} material={mat}><planeGeometry args={[w, w / aspect]} /></mesh>;
};
export const Calendar3: React.FC<{position: V3; rotation?: V3}> = ({position, rotation}) => {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({roughness: 0.9, map: tex('cal-3', 256, 340, (g) => {
    g.fillStyle = '#FBFAF6'; g.fillRect(0, 0, 256, 340); g.fillStyle = TEAL; g.fillRect(0, 0, 256, 64); g.fillStyle = '#fff'; g.font = F(700, 34); g.textAlign = 'center'; g.fillText('วันนี้', 128, 46);
    g.fillStyle = NAVY; g.font = F(700, 120); g.fillText('7', 128, 200); g.fillStyle = BRICK; g.font = F(700, 44); g.fillText('วันอากาศดี', 128, 286);
  })}), []);
  return <mesh position={position} rotation={rotation} material={mat}><planeGeometry args={[0.26, 0.345]} /></mesh>;
};

/** the charge, big: a brick-red slab slammed in front of the camera (EP2 style), text auto-fitted */
const bigPlateTex = (text: string) => tex('bigplate3-' + text, 1024, 300, (g) => {
  g.fillStyle = BRICK; g.fillRect(0, 0, 1024, 300);
  g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 500; i++) g.fillRect(hash(i) * 1024, hash(i * 2.3) * 300, 3, 3);
  g.strokeStyle = CREAM; g.lineWidth = 12; g.strokeRect(20, 20, 984, 260);
  let px = 172; g.font = F(700, px); while (g.measureText(text).width > 900) { px -= 6; g.font = F(700, px); }
  g.fillStyle = '#F7F4E6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 512, 158);
});
export const BigPlate3: React.FC<{text: string; cam: V3; look: V3; k: number; up?: number; dist?: number; width?: number; roll?: number}> = ({text, cam, look, k, up = 0.2, dist = 0.9, width = 0.66, roll = -0.05}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({map: bigPlateTex(text), toneMapped: false, transparent: true, depthTest: false}), [text]);
  if (k <= 0) return null;
  const C = new THREE.Vector3(...cam), f = new THREE.Vector3(...look).sub(C).normalize(), r = f.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), u = r.clone().cross(f);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate())).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
  const pos = C.clone().add(f.clone().multiplyScalar(dist)).add(u.clone().multiplyScalar(up));
  return <mesh position={pos} quaternion={q} scale={k} material={mat} renderOrder={10}><planeGeometry args={[width, width * 300 / 1024]} /></mesh>;
};

// -----------------------------------------------------------------------------------------------------
// The prison from outside: a long grey wall with small barred windows, a watchtower with a sweeping beam
// -----------------------------------------------------------------------------------------------------
export const PRISON_WIN = (i: number): V3 => [-9 + i * 3, 5.2, 0.52];
export const PrisonOutside: React.FC<{t: number; beam: number}> = ({t, beam}) => {
  const wall = PM('#A9ACA4', 'pwall'), dark = PM('#6F736D', 'pwall2'), roof = PM(NAVY, 'proof');
  const sweep = -0.9 + beam;
  return <group>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]} material={PM('#8E9A7E', 'grass')}><planeGeometry args={[80, 30]} /></mesh>
    <mesh castShadow receiveShadow position={[0, 4, 0]} material={wall}><boxGeometry args={[24, 8, 1]} /></mesh>
    <mesh position={[0, 8.15, 0]} material={dark}><boxGeometry args={[24.4, 0.3, 1.3]} /></mesh>
    {Array.from({length: 7}, (_, i) => { const p = PRISON_WIN(i); return <group key={i} position={p}>
      <mesh material={MB('#1C2226')}><planeGeometry args={[0.9, 0.7]} /></mesh>
      {[-0.27, -0.09, 0.09, 0.27].map((x) => <mesh key={x} position={[x, 0, 0.02]} material={MB('#3A3E42')}><boxGeometry args={[0.05, 0.7, 0.03]} /></mesh>)}
    </group>; })}
    <mesh position={[0, 6.6, 0.52]} material={useMemo(() => new THREE.MeshBasicMaterial({map: tex('prison-sign', 512, 96, (g) => { g.fillStyle = NAVY; g.fillRect(0, 0, 512, 96); g.fillStyle = CREAM; g.font = F(700, 56); g.textAlign = 'center'; g.fillText('เรือนจำ · แดนขัง', 256, 66); }), toneMapped: false}), [])}><planeGeometry args={[4, 0.75]} /></mesh>
    {/* watchtower */}
    <group position={[13, 0, 1]}>
      <mesh castShadow position={[0, 5, 0]} material={dark}><boxGeometry args={[1.4, 10, 1.4]} /></mesh>
      <mesh castShadow position={[0, 10.6, 0]} material={wall}><boxGeometry args={[2.6, 1.4, 2.6]} /></mesh>
      <mesh castShadow position={[0, 11.6, 0]} material={roof}><coneGeometry args={[2.2, 0.9, 4]} /></mesh>
      <group position={[0, 10.7, 1.0]} rotation={[0, sweep, 0]}>
        <mesh position={[-0.2, 0, 7]} rotation={[Math.PI / 2 - 0.25, 0, 0]}><cylinderGeometry args={[0.15, 1.7, 14, 12, 1, true]} /><meshBasicMaterial color="#FFF6D8" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      </group>
    </group>
    {/* razor wire */}
    {Array.from({length: 40}, (_, i) => <mesh key={i} position={[-12 + i * 0.6, 8.5, 0]} rotation={[0, Math.PI / 2, 0]} material={MB('#4A4E52')}><torusGeometry args={[0.22, 0.015, 4, 10]} /></mesh>)}
    <hemisphereLight args={['#DDE6EA', '#3C4038', 1.0]} />
    <directionalLight position={[-12, 18, 14]} color="#FFF1D6" intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={14} shadow-camera-bottom={-4} shadow-bias={-0.0006} />
  </group>;
};
