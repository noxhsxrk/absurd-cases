import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {rootLocal, fingers, ik} from '../../pov/acting/ik';
import {Gait, headTurn, chestTurn, yawTo} from '../../pov/acting/motion';
import {autoFace, setFace} from '../AbsurdEp1/boxcast';
import {camMove, Cam, MoveOpts} from '../absurdkit';

/**
 * lifekit staging (2026-11-11): the per-shot helpers every episode used to copy into its shots.tsx, in one place,
 * plus the motion upgrades (crossfade, one-shot clips, any walk clip on the odometer, eyes → head → chest look).
 * New episodes import from here; EP1–11 keep their own copies so their pictures do not change.
 */
export type V3 = [number, number, number];
export type Inst = any; export type Cast = Record<string, Inst>;
export type Bg = {color: string; fog?: [string, number, number]} | null;
export type ShotOut = {node: React.ReactNode; cam: Cam; bg?: Bg};
export const sm = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export type PSo = {clip?: string; /** seconds into `clip` (one-shot, starts on the word) */ clipT?: number; /** crossfade from this clip… */ clipB?: string; clipBT?: number; /** …by this much (0…1) */ mix?: number;
  moving?: boolean; odo?: number; /** walk/run clip stepped by the odometer */ locoClip?: string; loco?: 'run' | 'walk';
  /** look at this world point: pitch + yaw, eyes → head → chest */ lookW?: V3; /** when the look started (s); omit for an already-settled look */ lookT0?: number;
  face?: string; poseId?: string};
/** the state object drive() wants */
export const ps = (id: string, x: number, z: number, yaw: number, t: number, o: PSo = {}) => {
  const pose: any = {...(POSES as any)[o.poseId ?? 'stand']({t, phase: 0, talking: false, seed: id.length, speed: 0} as any), hy: 0};
  return {id, x, z, yaw, pose, held: 'none', heldL: 'none', front: 'none', visible: true, moving: !!o.moving, label: '', next: '', talking: false,
    odo: o.odo ?? (o.moving ? t * 1.4 : 0), poseId: o.poseId ?? 'stand', talkK: 0, fear: 0, t, ...o} as any;
};
/** state for a character on a gait(): walking on `locoClip` while it moves, then `idle` with a 0.3 s crossfade out of the walk */
export const walker = (id: string, g: Gait, t: number, o: PSo & {idle?: string} = {}) => {
  const locoClip = o.locoClip ?? 'walk_neutral_01';
  return ps(id, g.x, g.z, g.yaw, t, {...o, moving: g.moving, odo: g.odo, locoClip, clip: o.clip ?? o.idle ?? 'idle_neutral_01', ...(g.moving || g.since < 0 ? {} : {clipB: locoClip, mix: sm(g.since / 0.3)})});
};
const wraps = new Map<Inst, THREE.Group>();
/** pose the character for this frame and return its wrapper group (y lifts it, rx = −π/2 lays it on its back) */
export const body = (I: Inst, s: any, t: number, y = 0, rx = 0): THREE.Group => {
  let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, y, s.z); w.rotation.set(rx, s.yaw, 0, 'YXZ'); w.scale.setScalar(I.scale); w.updateMatrixWorld(true);
  let chest = 0;
  if (s.lookW) { s.pose.lookL = rootLocal(I, s.lookW);
    if (!rx) { const tu = headTurn(s.lookT0 === undefined ? 9 : t - s.lookT0, Math.max(-1.25, Math.min(1.25, yawTo(s, s.lookW)))); s.pose.hy = tu.head / 0.85; chest = tu.chest; } }
  drive(I, s, t); if (chest) chestTurn(I, chest); w.updateMatrixWorld(true);
  if (s.face) setFace(I, s.face); else autoFace(I, t, {talk: 0, fear: 0, seed: s.id.length * 3.1});
  return w;
};
/** world position of a bone */
export const bw = (I: Inst, bone: string): V3 => { const v = I.bones[bone].getWorldPosition(new THREE.Vector3()); return [v.x, v.y, v.z]; };
export const P: React.FC<{o: THREE.Object3D}> = ({o}) => <primitive object={o} />;
const attached = new WeakMap<Inst, Record<string, THREE.Object3D>>();
/** a hand prop on a bone (bone space is cm); created once per character, shown for this frame */
export const prop = (I: Inst, key: string, bone: string, make: () => THREE.Object3D, p: V3, r: V3) => {
  let a = attached.get(I); if (!a) { a = {}; attached.set(I, a); }
  if (!a[key]) { const o = make(); o.position.set(...p); o.rotation.set(...r); I.bones[bone].add(o); a[key] = o; }
  a[key].visible = true; return a[key];
};
/** call first for every character in every shot: props attached in another shot stay hidden */
export const hideProps = (I: Inst) => { const a = attached.get(I); if (a) Object.values(a).forEach((o) => { o.visible = false; }); };
/** world point → the character's root space (works for lying / lifted characters) */
export const loc = (I: Inst, w: V3) => rootLocal(I, w);

export const CamRig: React.FC<{cam: Cam; bg?: Bg}> = ({cam, bg}) => {
  const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = bg ? new THREE.Color(bg.color) : null;
  scene.fog = bg?.fog ? new THREE.Fog(bg.fog[0], bg.fog[1], bg.fog[2]) : null;
  c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look);
  if (c.fov !== cam.fov) c.fov = cam.fov; c.near = 0.01; c.far = 600; c.updateProjectionMatrix();
  return null;
};
export const mv = (base: Cam, lt: number, o: MoveOpts = {}) => camMove(base, lt, {arrive: 0.1, push: 0.11, ...o});
/** a hand/tool strike that lands at t0: lift over `up` s, whip down in 0.1 s, small rebound */
export const strike = (t: number, t0: number, up = 0.3) => { const u = t - t0; return u < -up ? 0 : u < -0.1 ? sm((u + up) / (up - 0.1)) : u < 0 ? 1 - (u + 0.1) / 0.1 : u < 0.15 ? 0.12 * Math.sin((u / 0.15) * Math.PI) : 0; };
/** decaying wobble of a thing that was hit at each time in `hits` */
export const wobble = (t: number, hits: number[], amp = 0.05) => hits.reduce((a, h) => { const u = t - h; return u > 0 ? a + amp * Math.exp(-u * 7) * Math.sin(u * 38) : a; }, 0);
export const near = (t: number, hits: number[], d = 0.12) => hits.some((h) => t > h && t < h + d);

// ---- staging helpers shared by the episodes (moved here from AbsurdEp17/shots.tsx, 2026-11-16)
/** daylight for the village: sun from the −x / +z side, aimed at `at` */
export const DAY = (at: V3 = [0, 0, 0]) => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} /><directionalLight position={[at[0] - 8, at[1] + 16, at[2] + 10]} target-position={at} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={70} shadow-bias={-0.0006} /></>;
export const SKY: Bg = {color: '#BFD6E4'}, CELL_BG: Bg = {color: '#2A2E33'};
/** the point d metres from a towards b */
export const toward = (a: V3, b: V3, d: number): V3 => { const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize().multiplyScalar(d); return [a[0] + v.x, a[1] + v.y, a[2] + v.z]; };
/** put a hand on a world point. Root +x is the character's LEFT, so the elbow goes out, down and a little back, never into the chest.
 *  Call w.updateMatrixWorld(true) afterwards before reading bone positions with bw(). */
export const hand = (I: Inst, sd: 'L' | 'R', to: V3, shape = 'fist') => { fingers(I, sd, shape as any, 1); ik(I, sd, loc(I, to), new THREE.Vector3(sd === 'R' ? -1 : 1, -1, -0.3), 1); };
/** the head's own frame (the group the box face is built in): cm, y up, z out of the face */
export const headFr = (I: Inst): THREE.Object3D => { const hb = I.bones.Bip01_Head as THREE.Object3D; return hb.children.find((c: any) => c.isGroup && c.children.some((m: any) => m.geometry?.type === 'CylinderGeometry')) ?? hb; };
/** a point / a direction given in the head's frame → world. Mouth = [0, 6.5, 15], left ear [12, 12, 2], right ear [−12, 12, 2]. Follows the head turn. */
export const hw = (I: Inst, p: V3): V3 => { const fr = headFr(I); fr.updateWorldMatrix(true, false); const v = fr.localToWorld(new THREE.Vector3(...p)); return [v.x, v.y, v.z]; };
export const hdir = (I: Inst, d: V3): V3 => { const fr = headFr(I); fr.updateWorldMatrix(true, false); const v = new THREE.Vector3(...d).transformDirection(fr.matrixWorld); return [v.x, v.y, v.z]; };
