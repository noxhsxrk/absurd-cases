import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex, M, MB, F} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {Pickup} from '../lifekit/props';
import {HANDLE} from './data';

/** EP12 offenders: a pair of flip-flops (รองเท้าแตะ), left (ซ) and right (ข). No faces — the printed letter on each insole is
 *  their identity, the asymmetric footprint (big-toe bulge) shows which foot each belongs to. Origin = middle of the sole,
 *  bottom; the toe points +z. Metres, real size 0.27 m long. */
type V3 = [number, number, number];
export const FF_L = 0.27, FF_T = 0.02;
const NAVY = '#152028', RED = '#D7262B', YEL = '#F2C230';
/** footprint for a LEFT foot (big toe on +x = the wearer's right… toward the midline when worn on the left foot, facing +z) */
const footprint = (side: 'L' | 'R') => { const m = side === 'L' ? 1 : -1; const s = new THREE.Shape();
  const P: [number, number][] = [[0, -0.135], [0.034, -0.128], [0.043, -0.09], [0.038, -0.02], [0.046, 0.05], [0.052, 0.1], [0.04, 0.128], [0.012, 0.136], [-0.018, 0.13], [-0.038, 0.11], [-0.048, 0.06], [-0.046, 0.0], [-0.038, -0.08], [-0.03, -0.124]];
  s.moveTo(P[0][0] * m, P[0][1]); P.slice(1).forEach(([x, y]) => s.lineTo(x * m, y)); s.closePath(); return s; };
const geoCache = new Map<string, THREE.BufferGeometry>();
const soleGeo = (side: 'L' | 'R') => { const k = 'sole' + side; if (!geoCache.has(k)) { const g = new THREE.ExtrudeGeometry(footprint(side), {depth: FF_T, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 6});
  g.rotateX(-Math.PI / 2); g.translate(0, 0.003, 0); geoCache.set(k, g); } return geoCache.get(k)!; };
const topGeo = (side: 'L' | 'R') => { const k = 'top' + side; if (!geoCache.has(k)) { const g = new THREE.ShapeGeometry(footprint(side), 6); g.rotateX(-Math.PI / 2);
  // planar UVs across the footprint box so the letter sits in the middle
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 0.06) / 0.12, (-p.getZ(i) + 0.14) / 0.28);
  geoCache.set(k, g); } return geoCache.get(k)!; };
const insole = (side: 'L' | 'R') => tex('ep12-insole-' + side, 128, 256, (g) => {
  g.fillStyle = '#5C8FC9'; g.fillRect(0, 0, 128, 256); g.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 40; i++) g.fillRect((i * 37) % 128, (i * 71) % 256, 3, 3);
  g.fillStyle = '#F4EEDB'; g.font = F(700, 92); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(side === 'L' ? 'ซ' : 'ข', 64, 150);
});
/** the thong strap: a post between the toes and two straps out to the sides of the arch */
const Strap: React.FC<{side: 'L' | 'R'; color: string}> = ({side, color}) => { const m = side === 'L' ? 1 : -1;
  const curve = useMemo(() => [-1, 1].map((k) => new THREE.CatmullRomCurve3([new THREE.Vector3(0.018 * m, FF_T + 0.006, 0.075), new THREE.Vector3((0.018 + k * 0.022) * m, FF_T + 0.032, 0.03), new THREE.Vector3(k * 0.044 * m + (k > 0 ? 0.004 * m : 0), FF_T + 0.004, -0.02)])), [m]);
  const mat = M(color, 0.6, 0, {}, 'ff-strap' + color);
  return <>{curve.map((c, i) => <mesh key={i} castShadow material={mat}><tubeGeometry args={[c, 10, 0.006, 6, false]} /></mesh>)}
    <mesh castShadow position={[0.018 * m, FF_T + 0.008, 0.075]} material={mat}><cylinderGeometry args={[0.004, 0.004, 0.016, 6]} /></mesh></>;
};
export type FlipFlopProps = {side: 'L' | 'R'; position?: V3; rotation?: V3; scale?: number; color?: string};
export const FlipFlop: React.FC<FlipFlopProps> = ({side, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, color = '#2F5E9E'}) => {
  const top = useMemo(() => new THREE.MeshLambertMaterial({map: insole(side)}), [side]);
  return <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={soleGeo(side)} material={PM('#DCD6C8', 'ff-sole')} castShadow receiveShadow />
    <mesh geometry={topGeo(side)} material={top} position={[0, FF_T + 0.0065, 0]} receiveShadow />
    <Strap side={side} color={color} />
  </group>;
};

/** a yellow wheel clamp (ล็อกล้อ) built round a thing at its origin: two jaws close over it, the lock disc faces +z.
 *  size = clear opening (m). closed 0 (open) … 1 (locked). */
export const WheelClamp: React.FC<{position?: V3; rotation?: V3; size?: number; closed?: number}> = ({position = [0, 0, 0], rotation = [0, 0, 0], size = 0.3, closed = 1}) => {
  const y = PM(YEL, 'clamp'), dk = M('#2A2D30', 0.5, 0.4, {}, 'clamp-dk'), s = size;
  const tag = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false, side: THREE.DoubleSide, map: tex('ep12-clamp-tag', 256, 160, (g) => { g.fillStyle = RED; g.fillRect(0, 0, 256, 160); g.fillStyle = '#fff'; g.font = F(700, 40); g.textAlign = 'center'; g.fillText('ห้ามเคลื่อนย้าย', 128, 70); g.font = F(600, 26); g.fillText('ติดต่อ สน.จราจร', 128, 112); g.font = F(500, 18); g.fillText(HANDLE, 128, 145); })}), []);
  const open = 1 - closed;
  return <group position={position} rotation={rotation}>
    {/* the base plate under the thing, the two jaws hinging up and over it */}
    <mesh castShadow receiveShadow position={[0, 0.02 * s, 0]} material={y}><boxGeometry args={[1.2 * s, 0.06 * s, 0.4 * s]} /></mesh>
    {[-1, 1].map((k) => <group key={k} position={[k * 0.58 * s, 0.04 * s, 0]} rotation={[0, 0, k * open * 0.9]}>
      <mesh castShadow position={[0, 0.22 * s, 0]} material={y}><boxGeometry args={[0.1 * s, 0.44 * s, 0.32 * s]} /></mesh>
      <mesh castShadow position={[-k * 0.2 * s, 0.42 * s, 0]} material={y}><boxGeometry args={[0.4 * s, 0.09 * s, 0.32 * s]} /></mesh>
      {[-1, 1].map((j) => <mesh key={j} position={[-k * 0.34 * s, 0.37 * s, j * 0.12 * s]} material={dk}><coneGeometry args={[0.03 * s, 0.08 * s, 5]} /></mesh>)}
    </group>)}
    {/* the lock disc with its keyhole, and the tag */}
    <group position={[0.58 * s, 0.3 * s, 0.2 * s]} rotation={[0, 0, open * 0.9]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]} material={y}><cylinderGeometry args={[0.16 * s, 0.16 * s, 0.08 * s, 20]} /></mesh>
      <mesh position={[0, 0, 0.042 * s]} material={dk}><circleGeometry args={[0.05 * s, 12]} /></mesh>
      <mesh position={[0, -0.25 * s, 0.03 * s]} rotation={[0, 0, 0.12]} material={tag}><planeGeometry args={[0.36 * s, 0.22 * s]} /></mesh>
    </group>
  </group>;
};

/** the tow truck (รถยก): a pickup with a yellow boom over its bed, a cable and a hook. Truck faces +z (local).
 *  hook(…) gives the world position of the hook for a placement, so whatever it carries can hang from it. */
const BOOM = {base: [0, 1.0, -1.6] as V3, len: 2.1};
export const towHookLocal = (lift: number): V3 => { const a = 0.45 + lift * 0.35; return [0, BOOM.base[1] + Math.sin(a) * BOOM.len - 0.55 + lift * 0.35, BOOM.base[2] - Math.cos(a) * BOOM.len]; };
export const towHook = (pos: V3, yaw: number, lift: number): V3 => { const l = towHookLocal(lift), c = Math.cos(yaw), s = Math.sin(yaw); return [pos[0] + l[0] * c + l[2] * s, pos[1] + l[1], pos[2] - l[0] * s + l[2] * c]; };
export const TowTruck: React.FC<{position: V3; yaw?: number; t: number; lift?: number; roll?: number; beacon?: boolean}> = ({position, yaw = 0, t, lift = 0, roll = 0, beacon = true}) => {
  const y = PM(YEL, 'boom'), dk = M('#2A2D30', 0.5, 0.4, {}, 'clamp-dk'); const a = 0.45 + lift * 0.35; const hk = towHookLocal(lift);
  const tip: V3 = [0, BOOM.base[1] + Math.sin(a) * BOOM.len, BOOM.base[2] - Math.cos(a) * BOOM.len];
  const on = beacon && Math.floor(t * 6) % 2 === 0;
  const side = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false, map: tex('ep12-tow', 512, 128, (g) => { g.fillStyle = YEL; g.fillRect(0, 0, 512, 128); g.fillStyle = NAVY; g.font = F(700, 64); g.textAlign = 'center'; g.fillText('รถยก สน.จราจร', 256, 78); g.font = F(600, 24); g.fillText(HANDLE, 256, 114); })}), []);
  return <group position={position} rotation={[0, yaw, 0]}>
    <Pickup position={[0, 0, 0]} color="#E8E6E0" cargo={false} roll={roll} lights={0} />
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.905, 0.72, 0.4]} rotation={[0, s * Math.PI / 2, 0]} material={side}><planeGeometry args={[1.5, 0.37]} /></mesh>)}
    {/* boom: a yellow arm hinged at the cab end of the bed, rising back over the tailgate */}
    <group position={BOOM.base} rotation={[a, 0, 0]}><mesh castShadow position={[0, 0, -BOOM.len / 2]} material={y}><boxGeometry args={[0.18, 0.18, BOOM.len]} /></mesh></group>
    <mesh castShadow position={[0, 0.85, -1.6]} material={y}><boxGeometry args={[0.5, 0.3, 0.4]} /></mesh>
    <mesh position={[(tip[0] + hk[0]) / 2, (tip[1] + hk[1]) / 2, (tip[2] + hk[2]) / 2]} material={dk}><cylinderGeometry args={[0.012, 0.012, tip[1] - hk[1], 6]} /></mesh>
    <mesh castShadow position={hk} rotation={[0, Math.PI / 2, 0]} material={dk}><torusGeometry args={[0.06, 0.015, 6, 12, Math.PI * 1.4]} /></mesh>
    {/* amber beacon */}
    <mesh position={[0, 1.83, 0.25]} material={MB(on ? '#FFB23A' : '#7A5A2A')}><cylinderGeometry args={[0.09, 0.1, 0.12, 12]} /></mesh>
    {on && <pointLight position={[0, 2.0, 0.25]} color="#FFB23A" intensity={4} distance={6} />}
  </group>;
};

/** the court evidence tag for the dock — pause-bait */
export const EvidenceCard: React.FC<{position: V3; rotation?: V3; w?: number}> = ({position, rotation = [0, 0, 0], w = 0.42}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false, side: THREE.DoubleSide, map: tex('ep12-evid', 512, 340, (g) => {
    g.fillStyle = '#F2E9D2'; g.fillRect(0, 0, 512, 340); g.strokeStyle = NAVY; g.lineWidth = 8; g.strokeRect(8, 8, 496, 324);
    g.fillStyle = RED; g.font = F(700, 44); g.textAlign = 'center'; g.fillText('ของกลาง', 256, 60);
    g.textAlign = 'left'; const rows: [string, string][] = [['ผู้ต้องหา', 'รองเท้าแตะ 1 คู่ (ซ้าย/ขวา)'], ['ข้อหา', 'ดัดแปลงสภาพทางสัญจร'], ['พฤติการณ์', 'สลับข้างกันโดยเจตนา'], ['ผู้เสียหาย', 'หน้า 1 หน้า']];
    rows.forEach(([k, v], i) => { const yy = 110 + i * 56; g.fillStyle = '#6A6A70'; g.font = F(600, 24); g.fillText(k, 30, yy); g.fillStyle = NAVY; g.font = F(700, 30); g.fillText(v, 160, yy); });
    g.fillStyle = '#6A6A70'; g.font = F(500, 20); g.textAlign = 'right'; g.fillText(HANDLE, 490, 324);
  })}), []);
  return <mesh position={position} rotation={rotation} material={m}><planeGeometry args={[w, w * (340 / 512)]} /></mesh>;
};
/** a road sign on a post (two lines), faces +z */
export const RoadSign: React.FC<{position: V3; yaw?: number; lines: [string, string]; w?: number}> = ({position, yaw = 0, lines, w = 2.2}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false, map: tex('ep12-sign-' + lines.join('|'), 512, 200, (g) => {
    g.fillStyle = '#1F6F4A'; g.fillRect(0, 0, 512, 200); g.strokeStyle = '#F4EEDB'; g.lineWidth = 6; g.strokeRect(10, 10, 492, 180);
    g.fillStyle = '#F4EEDB'; g.textAlign = 'center'; g.font = F(700, 56); g.fillText(lines[0], 256, 90); g.font = F(600, 40); g.fillText(lines[1], 256, 155); })}), [lines.join('|')]);
  return <group position={position} rotation={[0, yaw, 0]}>
    {[-1, 1].map((s) => <mesh key={s} castShadow position={[s * w * 0.4, 1.4, -0.02]} material={M('#9AA0A6', 0.5, 0.5)}><cylinderGeometry args={[0.04, 0.04, 2.8, 8]} /></mesh>)}
    <mesh castShadow position={[0, 2.5, 0]} material={m}><boxGeometry args={[w, w * 0.39, 0.03]} /></mesh>
  </group>;
};
