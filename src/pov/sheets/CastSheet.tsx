import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import '../cast/library/lockdown';
import {useRb, useCast, RbPerson} from '../cast/RbPerson';
import type {PersonState} from '../life/world';
import {POSES} from '../cast/poses';
import {EXTRAS} from '../cast/library/lockdown';

/** model sheet: main cast in 2 poses + a row of extras, school uniforms */
const ROW1: [string, string, Partial<PersonState>][] = [['kru', 'chat', {talkK: 1}], ['prae', 'crouch', {fear: 1}], ['phum', 'crouchTalk', {fear: 0.8}], ['ton', 'nervous', {fear: 1}]];
const ROW2 = EXTRAS.slice(0, 9);
export const CastSheet: React.FC = () => {
  const t = useCurrentFrame() / 30 + 2;
  const ids = Array.from(new Set([...ROW1.map((r) => r[0]), ...ROW2]));
  const lib = useRb([], 'toon'); const P = useCast(ids, lib);
  const mk = (id: string, x: number, z: number, pose: string, ex: Partial<PersonState> = {}) => ({id, x, z, yaw: 0.2, pose: POSES.stand({t, phase: 0, talking: false, seed: 0, speed: 0}), held: pose === 'standPhone' ? 'phone' : 'none', heldL: 'none', front: 'none', visible: true, moving: false, label: '', next: '', talking: false, odo: 0, poseId: pose, talkK: 0, ...ex} as PersonState);
  return (<AbsoluteFill style={{background: '#DDE2EA'}}><ThreeCanvas width={1920} height={1080} shadows camera={{fov: 22, position: [0, 1.5, 11]}} onCreated={({camera, gl}) => { camera.lookAt(0, 0.85, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; }}>
    <hemisphereLight args={['#ffffff', '#8a8070', 1.4]} /><ambientLight intensity={0.4} /><directionalLight position={[3, 6, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#C3C7CF" /></mesh>
    {P[ids[0]] && ROW1.map(([id, pose, ex], i) => <RbPerson key={id + i} I={i === 0 || ROW1.findIndex((r) => r[0] === id) === i ? P[id] : P[id]} s={mk(id, -3.3 + i * 1.1, 0.8, pose, ex)} t={t} />)}
    {P[ids[0]] && ROW2.map((id, i) => <RbPerson key={id} I={P[id]} s={mk(id, -3.6 + i * 0.9, -1.4, i % 3 === 0 ? 'chat' : 'stand')} t={t} />)}
  </ThreeCanvas></AbsoluteFill>);
};

/** close-up: one girl + one boy in uniform, facing the camera (compare with the reference photo) */
import {TOON} from '../cast/Toon';
export const UniformSheet: React.FC = () => {
  const t = useCurrentFrame() / 30 + 2;
  const g = EXTRAS.find((id) => TOON[id].female && TOON[id].hairStyle === 'long')!, b = EXTRAS.find((id) => !TOON[id].female && TOON[id].glasses) ?? EXTRAS.find((id) => !TOON[id].female)!;
  const lib = useRb([], 'toon'); const P = useCast([g, b], lib);
  const mk = (id: string, x: number) => ({id, x, z: 0, yaw: 0, pose: POSES.stand({t, phase: 0, talking: false, seed: 0, speed: 0}), held: 'none', heldL: 'none', front: 'none', visible: true, moving: false, label: '', next: '', talking: false, odo: 0, poseId: 'stand', talkK: 0} as PersonState);
  return (<AbsoluteFill style={{background: '#CFE0EE'}}><ThreeCanvas width={1080} height={1920} shadows camera={{fov: 30, position: [0, 0.95, 4.2]}} onCreated={({camera, gl}) => { camera.lookAt(0, 0.88, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; }}>
    <hemisphereLight args={['#ffffff', '#8a8070', 1.3]} /><ambientLight intensity={0.35} /><directionalLight position={[2.5, 6, 5]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#BDBFC2" /></mesh>
    {P[g] && <RbPerson I={P[g]} s={mk(g, -0.36)} t={t} />}{P[b] && <RbPerson I={P[b]} s={mk(b, 0.36)} t={t} />}
  </ThreeCanvas></AbsoluteFill>);
};

/** QA: skinned garments + crouch-walk across poses (boy in shorts, girl in pleated skirt, Kru) */
const GPOSES: [string, Partial<PersonState>][] = [['stand', {}], ['walk', {moving: true}], ['hunch', {moving: true, upper: 'hunch'}], ['sitIdle', {}], ['crouch', {}], ['sitPhone', {held: 'phone'}]];
export const GarmentSheet: React.FC = () => {
  const fr = useCurrentFrame(), t = (fr % 20) / 30 + 2;
  const g = EXTRAS.find((id) => TOON[id].female && TOON[id].hairStyle === 'long')!, b = EXTRAS.find((id) => !TOON[id].female)!;
  const rows = [[b, g, 'kru'][Math.floor(fr / 20) % 3]];  // frame 0–19 boy, 20–39 girl, 40–59 Kru
  const ids = rows.flatMap((id) => GPOSES.map((_, i) => id + '#' + i));
  GPOSES.forEach((_, i) => rows.forEach((id) => { TOON[id + '#' + i] = TOON[id]; }));
  const lib = useRb([], 'toon'); const P = useCast(ids, lib);
  const mk = (id: string, x: number, z: number, i: number) => { const [pose, ex] = GPOSES[i]; return {id, x, z, yaw: i === 1 || i === 2 ? 1.2 : 0.35, pose: POSES.stand({t, phase: 0, talking: false, seed: 0, speed: 0}), held: 'none', heldL: 'none', front: 'none', visible: true, moving: false, label: '', next: '', talking: false, odo: t * 1.3, poseId: pose, talkK: 0, ...ex} as PersonState; };
  return (<AbsoluteFill style={{background: '#DDE2EA'}}><ThreeCanvas width={1920} height={1080} shadows camera={{fov: 17, position: [0, 1.3, 11]}} onCreated={({camera, gl}) => { camera.lookAt(0, 0.75, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; }}>
    <hemisphereLight args={['#ffffff', '#8a8070', 1.3]} /><ambientLight intensity={0.35} /><directionalLight position={[3, 6, 5]} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#C3C7CF" /></mesh>
    {P[ids[0]] && rows.flatMap((id, r) => GPOSES.map((_, i) => <RbPerson key={id + i} I={P[id + '#' + i]} s={mk(id + '#' + i, -2.9 + i * 1.16, 0, i)} t={t} />))}
  </ThreeCanvas></AbsoluteFill>);
};

/** QA: the arm gestures (IK) — frame n shows gesture n on Kru standing, Prae crouched, Phum crouched; 3/4 front view */
import {drive} from '../cast/RbPerson';
import {GEST} from '../acting/ik';
const GLIST: [string, (I: any, k: number, t: number) => void][] = [
  ['stopPalm', (I, k, t) => GEST.stopPalm(I, 'L', k, t)],
  ['point', (I, k) => GEST.point(I, 'R', new THREE.Vector3(-120, 60, 200), k)],
  ['palmsDown', (I, k) => { GEST.palmsDown(I, 'L', k); GEST.palmsDown(I, 'R', k); }],
  ['shh', (I, k) => GEST.shh(I, 'R', k)],
  ['holdRoom', (I, k, t) => GEST.holdRoom(I, 'L', k, t)],
  ['reach', (I, k) => GEST.reach(I, 'R', new THREE.Vector3(-30, 100, 60), k)],
  ['shrug', (I, k) => { GEST.shrug(I, 'L', k); GEST.shrug(I, 'R', k); }],
  ['earCup', (I, k) => GEST.earCup(I, 'R', k)],
  ['coverHead', (I, k) => { GEST.coverHead(I, 'L', k); GEST.coverHead(I, 'R', k); }],
  ['beckon', (I, k, t) => GEST.beckon(I, 'L', new THREE.Vector3(60, 120, 250), k, 0.5 + 0.5 * Math.sin(t * 14))],
];
export const GestureSheet: React.FC = () => {
  const f = useCurrentFrame(), t = 2 + f / 30; const g = GLIST[f % GLIST.length];
  TOON['kru#c'] = TOON.kru; const ids = ['kru', 'kru#c', 'phum']; const lib = useRb([], 'toon'); const P = useCast(ids, lib);
  const st = (id: string, x: number, pose: string) => ({id, x, z: 0, yaw: 0.45, pose: POSES.stand({t, phase: 0, talking: false, seed: 0, speed: 0}), held: 'none', heldL: 'none', front: 'none', visible: true, moving: false, label: '', next: '', talking: false, odo: 0, poseId: pose, talkK: 0} as PersonState);
  const Guy: React.FC<{id: string; x: number; pose: string}> = ({id, x, pose}) => { const I = P[id]; const s = st(id, x, pose); drive(I as any, s, t); g[1](I, 1, t); (I as any).root.updateMatrixWorld(true);
    return <group position={[s.x, 0, s.z]} rotation={[0, s.yaw, 0]} scale={(I as any).scale}><primitive object={(I as any).root} /></group>; };
  return (<AbsoluteFill style={{background: '#DDE2EA'}}><div style={{position: 'absolute', left: 40, top: 30, fontSize: 60, fontFamily: 'sans-serif', zIndex: 2}}>{g[0]}</div>
    <ThreeCanvas width={1920} height={1080} shadows camera={{fov: 26, position: [1.6, 1.3, 6.2]}} onCreated={({camera, gl}) => { camera.lookAt(0, 0.85, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; }}>
    <hemisphereLight args={['#ffffff', '#8a8070', 1.4]} /><ambientLight intensity={0.4} /><directionalLight position={[3, 6, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#C3C7CF" /></mesh>
    {P.kru && <><Guy id="kru" x={-1.3} pose="stand" /><Guy id="kru#c" x={0.1} pose="crouch" /><Guy id="phum" x={1.4} pose="crouch" /></>}
  </ThreeCanvas></AbsoluteFill>);
};
