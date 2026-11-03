import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {FpvArm, GRIPS} from '../cast/FpvHands';

const SHOW: [string, 'R' | 'L', [number, number, number]][] = [['open', 'R', [0.2, Math.PI, 0]], ['relaxed', 'R', [0.2, Math.PI * 0.5, 0]], ['mug', 'R', [0.3, -0.4, 0.15]], ['phone', 'R', [0.4, 0, 0]], ['point', 'R', [0.2, -0.8, 0]], ['press', 'L', [0.2, 0.8, 0]], ['fist', 'L', [0.2, -2.4, 0]], ['wave', 'L', [0.0, Math.PI, 0]]];
export const FpvSheet: React.FC = () => (
  <AbsoluteFill style={{background: '#E3E6EC'}}>
    <ThreeCanvas width={1920} height={1080} shadows camera={{fov: 30, position: [0, 0, 1.25]}} onCreated={({gl}) => { gl.toneMapping = THREE.ACESFilmicToneMapping; }}>
      <hemisphereLight args={['#ffffff', '#8a8070', 1.3]} /><ambientLight intensity={0.35} /><directionalLight position={[1, 2, 3]} intensity={2.2} castShadow />
      {SHOW.map(([g, side, rot], i) => <FpvArm key={g} side={side} wrist={[-0.42 + (i % 4) * 0.28, i < 4 ? 0.02 : -0.27, 0]} rot={rot} grip={GRIPS[g]} />)}
    </ThreeCanvas>
  </AbsoluteFill>
);
