import React from 'react';
import * as THREE from 'three';
import {MB, M} from '../../pov/lib/tex';

/** EP27 — the new things only: a wall lamp at the corner of the prison wall, and soft blob shadows thrown away from it (the cell-block
 *  renders have no real shadow maps outside; these are the no-shadow gag: four of them, none under him). Everything else comes from earlier
 *  episodes. */
export type V3 = [number, number, number];
const blob = (() => { const m = new THREE.MeshBasicMaterial({color: '#05070C', transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false}); return m; })();
/** an elliptical shadow on the ground at `at`, stretched away from the light at `from` (size ≈ the thing's width) */
export const BlobShadow: React.FC<{at: V3; from: V3; size: number}> = ({at, from, size}) => {
  const dx = at[0] - from[0], dz = at[2] - from[2]; const d = Math.hypot(dx, dz) || 1; const len = size * (1.4 + 0.5 * d / Math.max(0.5, from[1]));
  return <mesh position={[at[0] + dx / d * len * 0.42, at[1], at[2] + dz / d * len * 0.42]} rotation={[-Math.PI / 2, 0, Math.atan2(-dz, dx)]} scale={[len * 0.42, size * 0.38, 1]} material={blob}>
    <circleGeometry args={[1, 24]} /></mesh>;
};
/** a caged bulkhead lamp on the wall (faces −z), lit when `on` */
export const WallLamp: React.FC<{position: V3; on: boolean}> = ({position, on}) => <group position={position}>
  <mesh position={[0, 0, 0.08]} material={M('#2A2E33', 0.6, 0.4)}><boxGeometry args={[0.32, 0.22, 0.06]} /></mesh>
  <mesh position={[0, -0.02, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={MB(on ? '#FFF1C8' : '#5A5E66')}><cylinderGeometry args={[0.1, 0.12, 0.12, 14]} /></mesh>
  {on && <pointLight position={[0, -0.1, -0.25]} color="#FFE7B8" intensity={1.6} distance={3} decay={1.4} />}
</group>;
