import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {PhoneGrip, handQuat} from '../cast/FpvHands';
import {useFontsReady, useScreens} from '../ui/story';

/** QA: the POV phone grip at the episode's two phone positions (frame 0 = up close, 1 = low in the lap, 2 = side view) */
export const PhoneTest: React.FC = () => {
  const f = useCurrentFrame(); const fonts = useFontsReady(); const screens = useScreens(fonts);
  type T3 = [number, number, number]; const P = ([[[0.03, -0.03, -0.3], [-0.05, 1, -0.12], [0, 0.12, 1]], [[0.13, -0.165, -0.45], [-0.22, 0.86, -0.46], [-0.12, 0.45, 0.88]], [[0.03, -0.03, -0.3], [-0.05, 1, -0.12], [0, 0.12, 1]]] as T3[][])[f % 3];
  const q = handQuat(P[1], P[2]);
  return (<AbsoluteFill style={{background: '#30343C'}}><ThreeCanvas width={1080} height={1920} camera={{fov: f % 3 === 2 ? 40 : 62, near: 0.02, position: f % 3 === 2 ? [0.45, 0.05, 0.0] : [0, 0, 0]}} onCreated={({camera, gl}) => { if (f % 3 === 2) camera.lookAt(0.03, -0.05, -0.3); gl.toneMapping = THREE.ACESFilmicToneMapping; }}>
    <hemisphereLight args={['#FFF8EC', '#6A6050', 1.2]} /><directionalLight position={[2, 3, 2]} intensity={1.8} />
    {screens && <group position={P[0]} quaternion={q}><PhoneGrip screen={screens.alert} /></group>}
  </ThreeCanvas></AbsoluteFill>);
};

import {useRb, useCast, RbPerson} from '../cast/RbPerson';
import {POSES} from '../cast/poses';
import type {PersonState} from '../life/world';
import {MAIN} from '../cast/library/lockdown';
/** QA: classmates holding phones — Phum seated (sitPhone), Prae standing (standPhone); frame 0 front, 1 three-quarter */
export const NpcPhoneTest: React.FC = () => {
  const f = useCurrentFrame(), t = 2 + f * 0.37;
  const lib = useRb([], 'toon'); const P = useCast(['phum', 'prae'], lib); void MAIN;
  const mk = (id: string, x: number, pose: string) => ({id, x, z: 0, yaw: f % 2 ? 0.7 : 0, pose: POSES.stand({t, phase: 0, talking: false, seed: 0, speed: 0}), held: 'phone', heldL: 'none', front: 'none', visible: true, moving: false, label: '', next: '', talking: false, odo: 0, poseId: pose, talkK: 0} as PersonState);
  return (<AbsoluteFill style={{background: '#CFD6E0'}}><ThreeCanvas width={1080} height={1080} shadows camera={{fov: 24, position: [0, 1.25, 4]}} onCreated={({camera, gl}) => { camera.lookAt(0, 1.0, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; }}>
    <hemisphereLight args={['#ffffff', '#8a8070', 1.3]} /><directionalLight position={[2, 5, 4]} intensity={2.2} castShadow />
    {P.phum && <RbPerson I={P.phum} s={mk('phum', -0.45, 'sitPhone')} t={t} />}{P.prae && <RbPerson I={P.prae} s={mk('prae', 0.45, 'standPhone')} t={t} />}
  </ThreeCanvas></AbsoluteFill>);
};
