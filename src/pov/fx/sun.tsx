import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * A shadow-casting sun that follows the camera without the "floor flicker": the follow point is snapped to whole shadow-map
 * texels in light space, so head bob never slides the shadow map by fractions of a texel (lockdown-class EP2 `snapSun`).
 *   <SnapSun p={head.p} />   — p = the eye; covers ±half metres around it.
 */
type V3 = [number, number, number];
export const SnapSun: React.FC<{p: V3; dir?: V3; half?: number; map?: number; intensity?: number; color?: string; far?: number}> = ({p, dir = [10, 14, -5], half = 12, map = 2048, intensity = 2.1, color = '#FFE7C4', far = 45}) => {
  const tg = useMemo(() => new THREE.Object3D(), []);
  const {X, Y, Z, off} = useMemo(() => {
    const off = new THREE.Vector3(...dir), Z = off.clone().normalize(), X = new THREE.Vector3(0, 1, 0).cross(Z).normalize(), Y = Z.clone().cross(X).normalize();
    return {X, Y, Z, off};
  }, [dir.join()]);
  const texel = (2 * half) / map;
  const v = new THREE.Vector3(p[0], p[1] - 1, p[2]);
  const a = X.clone().multiplyScalar(Math.round(v.dot(X) / texel) * texel).add(Y.clone().multiplyScalar(Math.round(v.dot(Y) / texel) * texel)).add(Z.clone().multiplyScalar(Math.round(v.dot(Z) / 2) * 2));
  tg.position.copy(a); tg.updateMatrixWorld();
  return (
    <>
      <primitive object={tg} />
      <directionalLight target={tg} position={[a.x + off.x, a.y + off.y, a.z + off.z]} intensity={intensity} color={color} castShadow shadow-mapSize={[map, map]}
        shadow-camera-left={-half} shadow-camera-right={half} shadow-camera-top={half} shadow-camera-bottom={-half} shadow-camera-near={1} shadow-camera-far={far} shadow-bias={-0.0008} shadow-normalBias={0.03} />
    </>
  );
};
