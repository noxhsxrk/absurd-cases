import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Exterior} from '../sets/school/Exterior';

/** QA: the view out of the window over time (frame = seconds × 30) — is something always moving, does it react? */
const Cam: React.FC<{wide: boolean}> = ({wide}) => {
  const {camera} = useThree();
  useLayoutEffect(() => { camera.position.set(3.9, 1.55, wide ? 2 : 0); camera.lookAt(wide ? 50 : 30, wide ? -4 : -5, wide ? -40 : -3); (camera as THREE.PerspectiveCamera).fov = wide ? 50 : 62; (camera as THREE.PerspectiveCamera).updateProjectionMatrix(); });
  return null;
};
export const WindowTest: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30;
  return <AbsoluteFill style={{background: '#B9D3E8'}}>{[false, true].map((wide) => <div key={String(wide)} style={{position: 'absolute', left: 0, top: wide ? 960 : 0, width: 1080, height: 960}}>
    <ThreeCanvas width={1080} height={960} camera={{fov: 62, near: 0.1, far: 400}}>
      <Cam wide={wide} /><color attach="background" args={['#B9D3E8']} />
      <hemisphereLight args={['#FFF8EC', '#9A8F7C', 1.3]} /><directionalLight position={[12, 7.5, -3]} intensity={1.7} color="#FFE7C4" />
      <Exterior t={t} dark={0} />
    </ThreeCanvas></div>)}</AbsoluteFill>;
};
