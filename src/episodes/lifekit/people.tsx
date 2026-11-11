import React, {useMemo} from 'react';
import * as THREE from 'three';
import {TOON} from '../../pov/cast/Toon';
import {BOX, PM} from '../AbsurdEp1/boxcast';
import {gait, pace, sitFloor, FLOOR_SIT_Y} from '../../pov/acting/motion';
import {ps, walker, body, hideProps, P, Cast, V3} from './stage';

/**
 * lifekit people (2026-11-11): background townsfolk for any scene.
 *  - TOWN: eight extras with their own looks (add `...TOWN` to the episode's IDS, they get the box look like everyone else)
 *  - <Townsfolk C t plan />: walkers on looped paths (feet locked to the odometer), standers, chatting pairs, people on benches
 *  - <FarWalkers />: instanced box figures for the far distance (no rig, a few hundred triangles)
 *  - <Bench />, and seat helpers for court galleries and floor audiences
 * Extras never look at the camera and keep to muted colours: they are there to be noticed only when missing.
 */
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

type Look = {skin: string; hair: string; hairStyle: 'messy' | 'short' | 'slick' | 'none'; top: string; pants: string; shoes: string; female?: boolean; build?: number; stubble?: number;
  hairLong?: boolean; skirt?: string; hat?: string; vest?: string; cap?: string; glasses?: boolean; sleeves?: 'short' | 'shirt'; tie?: string};
const LOOKS: Record<string, Look> = {
  tw1: {skin: '#D9A783', hair: '#1E1614', hairStyle: 'short', top: '#D98C5F', pants: '#3A4660', shoes: '#2A2A2E', female: true, hairLong: true, skirt: '#3A4660', build: 0.9, stubble: 0},
  tw2: {skin: '#B98559', hair: '#141210', hairStyle: 'short', top: '#EDEAE0', pants: '#7A6A4E', shoes: '#3A2E24', hat: '#D8C48A', build: 1.02, stubble: 0.5},
  tw3: {skin: '#C8935F', hair: '#141210', hairStyle: 'short', top: '#5E6B78', pants: '#2E3640', shoes: '#1C1C20', vest: '#E07B2E', build: 1.08, stubble: 0.7},
  tw4: {skin: '#DDB088', hair: '#1A1513', hairStyle: 'messy', top: '#F2F0E8', pants: '#8A7A5A', shoes: '#F2F0E8', build: 0.88, stubble: 0},
  tw5: {skin: '#C99A6E', hair: '#2B211C', hairStyle: 'short', top: '#6FA39A', pants: '#4A3A30', shoes: '#2A221C', female: true, hairLong: true, skirt: '#7A4A3A', hat: '#D8C48A', build: 0.95, stubble: 0},
  tw6: {skin: '#D3A27C', hair: '#16120F', hairStyle: 'slick', top: '#E9EDF2', pants: '#2B3040', shoes: '#141416', tie: '#7C1F27', glasses: true, sleeves: 'shirt', stubble: 0.3},
  tw7: {skin: '#C58E67', hair: '#B9B6B0', hairStyle: 'short', top: '#9A7FA8', pants: '#5A4A3A', shoes: '#3A2E24', female: true, hairLong: true, skirt: '#6A4A3E', build: 1.0, stubble: 0, glasses: true},
  tw8: {skin: '#D9A879', hair: '#1A1513', hairStyle: 'messy', top: '#D9B84A', pants: '#39424E', shoes: '#E8E6E0', build: 0.94, stubble: 0.2},
};
export const TOWN = Object.keys(LOOKS);
TOWN.forEach((id) => { const L = LOOKS[id];
  TOON[id] = {skin: L.skin, hair: L.hair, hairStyle: L.female ? 'long' : 'crew', top: L.top, pants: L.pants, shoes: L.shoes, outfit: 'shirt', female: !!L.female, build: L.build ?? 1} as any;
  BOX[id] = {face: {skin: L.skin, hair: L.hair, hairStyle: L.hairStyle, stubble: L.stubble ?? 0.3, glasses: L.glasses}, jacket: L.top, shirt: L.top, pants: L.pants, shoes: L.shoes, sleeves: L.sleeves ?? 'short',
    build: L.build, hairLong: L.hairLong, skirt: L.skirt, hat: L.hat, vest: L.vest, cap: L.cap, tie: L.tie}; });

const WALKS = ['walk_stroll_01', 'walk_neutral_01', 'walk_slow_01', 'walk_cool_01', 'walk_fast_01'];
const IDLES = ['idle_neutral_01', 'idle_waiting_01', 'idle_look_around_01', 'idle_neutral_02', 'idle_scratch_head_01', 'idle_touch_face_01'];
const SITS = ['sit_chair_idle_neutral_01', 'sit_chair_idle_relaxed_01', 'sit_chair_idle_look_around', 'sit_chair_idle_waiting_01'];
const pick = <T,>(a: T[], id: string, k = 0) => a[Math.floor(hash(id.charCodeAt(id.length - 1) * 3.7 + id.length + k) * a.length) % a.length];

export type Extra =
  /** walks the polyline; loop (default) closes it and never stops. phase shifts where on the loop it is at t = 0 (seconds) */
  | {id: string; kind: 'walk'; path: [number, number][]; clip?: string; loop?: boolean; t0?: number; phase?: number; idle?: string; y?: number}
  | {id: string; kind: 'stand'; at: [number, number]; yaw: number; clip?: string; look?: V3; y?: number}
  /** two extras facing each other: `id` talks, `with` listens (they swap every ~4 s) */
  | {id: string; kind: 'chat'; with: string; at: [number, number]; yaw: number; gap?: number; y?: number}
  /** on a seat whose top is `y` (0.45 = bench/chair) */
  | {id: string; kind: 'sit'; at: [number, number]; yaw: number; clip?: string; y?: number; look?: V3}
  /** cross-legged on the ground */
  | {id: string; kind: 'floor'; at: [number, number]; yaw: number; bow?: number; y?: number};

/** background people. Every id in the plan must be in the episode's IDS (useCast) and have had applyBoxLook. */
export const Townsfolk: React.FC<{C: Cast; t: number; plan: Extra[]}> = ({C, t, plan}) => <>{plan.flatMap((e) => {
  const I = C[e.id]; if (!I) return []; hideProps(I);
  if (e.kind === 'walk') { const clip = e.clip ?? pick(WALKS, e.id);
    const g = gait(e.path, t + (e.phase ?? 0), {t0: e.t0, speed: pace(clip, TOON[e.id]?.female ? 'f' : 'm'), loop: e.loop !== false});
    return [<P key={e.id} o={body(I, walker(e.id, g, t, {locoClip: clip, idle: e.idle ?? pick(IDLES, e.id)}), t, e.y ?? 0)} />]; }
  if (e.kind === 'stand') return [<P key={e.id} o={body(I, ps(e.id, e.at[0], e.at[1], e.yaw, t, {clip: e.clip ?? pick(IDLES, e.id), lookW: e.look}), t, e.y ?? 0)} />];
  if (e.kind === 'sit') return [<P key={e.id} o={body(I, ps(e.id, e.at[0], e.at[1], e.yaw, t, {poseId: 'sitIdle', clip: e.clip ?? pick(SITS, e.id), lookW: e.look}), t, (e.y ?? 0.45) - 0.45)} />];
  if (e.kind === 'floor') { const w = body(I, ps(e.id, e.at[0], e.at[1], e.yaw, t, {poseId: 'sitIdle', clip: 'sit_chair_idle_neutral_01', face: 'closed'}), t, FLOOR_SIT_Y + (e.y ?? 0)); sitFloor(I, {bow: e.bow}); w.updateMatrixWorld(true); return [<P key={e.id} o={w} />]; }
  // chat: face each other across `gap`, the talker swaps every ~4 s
  const J = C[e.with]; if (!J) return []; hideProps(J); const d = (e.gap ?? 0.9) / 2, fx = Math.sin(e.yaw), fz = Math.cos(e.yaw); const turn = Math.floor(t / 4.2 + hash(e.id.length)) % 2 === 0;
  const a = ps(e.id, e.at[0] - fx * d, e.at[1] - fz * d, e.yaw, t, {clip: turn ? 'gestic_talk_neutral_01' : 'gestic_listen_neutral_01', clipB: turn ? 'gestic_listen_neutral_01' : 'gestic_talk_neutral_01', mix: Math.min(1, ((t / 4.2 + hash(e.id.length)) % 1) * 4.2 / 0.3), face: turn && Math.floor(t * 7) % 3 ? 'talk' : 'open'});
  const b = ps(e.with, e.at[0] + fx * d, e.at[1] + fz * d, e.yaw + Math.PI, t, {clip: turn ? 'gestic_listen_neutral_01' : 'gestic_talk_neutral_02', clipB: turn ? 'gestic_talk_neutral_02' : 'gestic_listen_neutral_01', mix: Math.min(1, ((t / 4.2 + hash(e.id.length)) % 1) * 4.2 / 0.3), face: !turn && Math.floor(t * 7 + 1) % 3 ? 'talk' : 'open'});
  return [<P key={e.id} o={body(I, a, t, e.y ?? 0)} />, <P key={e.with} o={body(J, b, t, e.y ?? 0)} />];
})}</>;

/** a park/court bench: seat top at 0.45, sitters face +z (local) */
export const Bench: React.FC<{position: V3; yaw?: number; w?: number; color?: string}> = ({position, yaw = 0, w = 1.6, color = '#7A5A3A'}) => { const m = PM(color, 'bench'), leg = PM('#3A3E42', 'benchleg');
  return <group position={position} rotation={[0, yaw, 0]}>
    <mesh castShadow receiveShadow position={[0, 0.42, 0]} material={m}><boxGeometry args={[w, 0.06, 0.42]} /></mesh>
    <mesh castShadow position={[0, 0.72, -0.2]} rotation={[-0.12, 0, 0]} material={m}><boxGeometry args={[w, 0.42, 0.05]} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} castShadow position={[s * (w / 2 - 0.1), 0.2, 0]} material={leg}><boxGeometry args={[0.06, 0.4, 0.4]} /></mesh>)}
  </group>; };

/** far-distance pedestrians: instanced box figures walking back and forth along the segment a→b (use beyond ~25 m) */
export const FarWalkers: React.FC<{a: V3; b: V3; n?: number; t: number; seed?: number; spread?: number}> = ({a, b, n = 8, t, seed = 0, spread = 1.2}) => {
  const M = useMemo(() => { const mk = (g: THREE.BufferGeometry) => { const o = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({color: '#fff'}), n); o.frustumCulled = false; o.castShadow = true; return o; };
    return {torso: mk(new THREE.BoxGeometry(0.4, 0.62, 0.24)), head: mk(new THREE.BoxGeometry(0.2, 0.24, 0.2)), legL: mk(new THREE.BoxGeometry(0.15, 0.78, 0.17)), legR: mk(new THREE.BoxGeometry(0.15, 0.78, 0.17))}; }, [n]);
  const d = new THREE.Object3D(), c = new THREE.Color(); const L = Math.hypot(b[0] - a[0], b[2] - a[2]), ux = (b[0] - a[0]) / L, uz = (b[2] - a[2]) / L;
  const tops = ['#8FA6B8', '#C9B79A', '#9DAE8C', '#B88A7A', '#D8D4C8', '#7F8C9A'], skins = ['#C99A6E', '#B98559', '#D6A87C'];
  for (let i = 0; i < n; i++) { const sp = 0.95 + hash(seed + i * 3.1) * 0.5, dir = hash(seed + i * 7.7) > 0.5 ? 1 : -1, off = (hash(seed + i * 1.3) - 0.5) * spread;
    const u = (((hash(seed + i) * L + dir * sp * t) % L) + L) % L; const x = a[0] + ux * u - uz * off, z = a[2] + uz * u + ux * off, y = a[1];
    const ph = t * sp * 5.2 + i, sw = Math.sin(ph) * 0.5, bob = Math.abs(Math.sin(ph)) * 0.025, yaw = Math.atan2(ux * dir, uz * dir);
    d.rotation.set(0, yaw, 0); d.position.set(x, y + 1.1 + bob, z); d.updateMatrix(); M.torso.setMatrixAt(i, d.matrix); M.torso.setColorAt(i, c.set(tops[i % tops.length]));
    d.position.y = y + 1.55 + bob; d.updateMatrix(); M.head.setMatrixAt(i, d.matrix); M.head.setColorAt(i, c.set(skins[i % 3]));
    ([[M.legL, 1], [M.legR, -1]] as const).forEach(([m, s]) => { d.rotation.set(sw * s, yaw, 0, 'YXZ'); d.position.set(x - uz * 0.1 * s + Math.sin(yaw) * Math.sin(sw * s) * 0.39, y + 0.4 + bob, z + ux * 0.1 * s + Math.cos(yaw) * Math.sin(sw * s) * 0.39); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, c.set('#3A4250')); });
  }
  Object.values(M).forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  return <>{Object.values(M).map((m, i) => <primitive key={i} object={m} />)}</>;
};

/** seat positions on the Court set's gallery benches (AbsurdEp1/sets Court): up to 8 sitters facing the bench */
export const COURT_SEATS: [number, number][] = [[-2.9, 2.38], [-1.5, 2.38], [1.5, 2.38], [2.9, 2.38], [-2.2, 3.38], [-3.1, 3.38], [2.2, 3.38], [3.1, 3.38]];
export const courtAudience = (ids: string[], look: V3 = [0, 1.2, -3]): Extra[] => ids.slice(0, COURT_SEATS.length).map((id, i) => ({id, kind: 'sit' as const, at: COURT_SEATS[i], yaw: Math.PI, y: 0.49, look}));
