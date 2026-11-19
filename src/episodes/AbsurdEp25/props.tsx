import React from 'react';
import * as THREE from 'three';
import {MB, M} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';

/** EP25 — the new thing only: the cuffs that join him to the Moon (a wrist ring, a big ring round the Moon, a chain between, the same
 *  chrome as EP1's Handcuffs). Everything else comes from earlier episodes. */
export type V3 = [number, number, number];
const chrome = () => M('#F3F3F0', 0.18, 0.35);
/** a ring of radius r at p, its axis along `axis` (default vertical) */
export const Ring: React.FC<{p: V3; r: number; axis?: V3}> = ({p, r, axis = [0, 1, 0]}) => {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...axis).normalize());
  return <mesh position={p} quaternion={q} material={chrome()} castShadow><torusGeometry args={[r, Math.max(0.006, r * 0.16), 10, 28]} /></mesh>; };
/** a chain from a to b: links as small alternating rings along the line, sagging a little */
export const Chain: React.FC<{a: V3; b: V3; sag?: number}> = ({a, b, sag = 0.05}) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const L = A.distanceTo(B); const n = Math.max(3, Math.round(L / 0.035));
  const d = B.clone().sub(A).normalize(); const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d);
  return <group>{Array.from({length: n}, (_, i) => { const u = (i + 0.5) / n; const p = A.clone().lerp(B, u); p.y -= sag * 4 * u * (1 - u);
    const q = q0.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (i % 2) * Math.PI / 2));
    return <mesh key={i} position={p} quaternion={q} material={chrome()}><torusGeometry args={[0.012, 0.0035, 6, 12]} /></mesh>; })}</group>;
};
export {MB, M, PM};
