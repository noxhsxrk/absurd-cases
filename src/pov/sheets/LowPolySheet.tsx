import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useRb, useCast, RbPerson, CASTING, Style} from '../cast/RbPerson';
import type {PersonState} from '../life/world';
import {POSES} from '../cast/poses';

const IDS = ['mali', 'jay', 'ton', 'pim', 'beam', 'lek', 'fon', 'oat'];
const POSE: Record<string, [string, Partial<PersonState>]> = {mali: ['stand', {}], jay: ['standPhone', {}], ton: ['walk', {moving: true}], pim: ['standDrink', {}], beam: ['chat', {talkK: 1}], lek: ['stand', {}], fon: ['wave', {}], oat: ['chat', {talkK: 1}]};
const Row: React.FC<{t: number; style: Style; z: number}> = ({t, style, z}) => {
  const lib = useRb(IDS.map((i) => CASTING[i]), style); const P = useCast(IDS, lib);
  if (!P[IDS[0]]) return null;
  return <>{IDS.map((id, i) => { const [pose, ex] = POSE[id]; const s = {id, x: i * 0.8 - 2.8, z, yaw: 0.25, pose: POSES.stand({t, phase: 0, talking: false, seed: 0, speed: 0}), held: 'none', heldL: 'none', front: 'none', visible: true, moving: false, label: '', next: '', talking: false, odo: t * 1.25, poseId: pose, talkK: 0, ...ex} as PersonState; return <RbPerson key={id} I={P[id]} s={s} t={t} />; })}</>;
};
export const LowPolySheet: React.FC<{style?: Style}> = () => {
  const t = useCurrentFrame() / 30 + 2;
  return (<AbsoluteFill style={{background: '#DDE2EA'}}><ThreeCanvas width={1920} height={1080} shadows camera={{fov: 20, position: [0, 1.6, 9.5]}} onCreated={({camera, gl}) => { camera.lookAt(0, 0.95, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; }}>
    <hemisphereLight args={['#ffffff', '#8a8070', 1.4]} /><ambientLight intensity={0.4} /><directionalLight position={[3, 6, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#C3C7CF" /></mesh>
    <group position={[0, 0, 0]}><Row t={t} style="toon" z={0} /></group>
  </ThreeCanvas></AbsoluteFill>);
};
