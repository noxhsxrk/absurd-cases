import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';


/**
 * A right hand holding a transit card the way people really do: the card upright between the thumb pad (on the front face) and
 * the index + middle fingers flat behind it, ring and little fingers curled under the bottom edge, palm and forearm leaving down-right.
 * Modelled around the card (card-local metres: x right, y up, z out of the front face), like the kit's PhoneGrip.
 * Place it with a quaternion whose +y is the card's up and +z its front.
 */
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const Seg: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r0: number; r1?: number; m: THREE.Material}> = ({a, b, r0, r1 = r0, m}) => {
  const len = a.distanceTo(b); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  const g = useMemo(() => { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 5; i++) { const t = (i / 5) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(t) * r0, -Math.cos(t) * r0)); } for (let i = 0; i <= 5; i++) { const t = (i / 5) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(t) * r1, len + Math.sin(t) * r1)); } return new THREE.LatheGeometry(pts, 12); }, [len, r0, r1]);
  return <mesh geometry={g} material={m} position={a} quaternion={q} castShadow />;
};
const chain = (pts: THREE.Vector3[], r: number, m: THREE.Material, key: string) => pts.slice(1).map((p, i) => <Seg key={key + i} a={pts[i]} b={p} r0={r * (1 - i * 0.07)} r1={r * (1 - (i + 1) * 0.07)} m={m} />);
const CW = 0.0856, CH = 0.054;

export const CardGrip: React.FC<{skin: string; sleeve: string; cuff: string; band?: string; map?: THREE.Texture | null; card?: boolean}> = ({skin, sleeve, cuff, band, map = null, card = true}) => {
  const m = useMemo(() => ({skin: new THREE.MeshStandardMaterial({color: skin, roughness: 0.62}), nail: new THREE.MeshStandardMaterial({color: '#EBC2AE', roughness: 0.3}), sleeve: new THREE.MeshStandardMaterial({color: sleeve, roughness: 0.85}), cuff: new THREE.MeshStandardMaterial({color: cuff, roughness: 0.8})}), [skin, sleeve, cuff]);
  const cm = useMemo(() => new THREE.MeshStandardMaterial({map, color: map ? '#ffffff' : '#2A3A6E', roughness: 0.4}), [map]);
  const palm = useMemo(() => new RoundedBoxGeometry(0.082, 0.09, 0.03, 4, 0.013), []);
  const B = -CH / 2, back = -0.0095;
  // index + middle: from the knuckles behind-below the card, flat up its back; tips just short of the top edge
  const fingers: [THREE.Vector3[], number][] = [
    [[V(0.022, B - 0.03, -0.03), V(0.008, B - 0.004, back - 0.004), V(-0.004, B + 0.022, back), V(-0.012, B + 0.044, back + 0.001)], 0.0088],
    [[V(0.038, B - 0.034, -0.031), V(0.026, B - 0.006, back - 0.004), V(0.017, B + 0.02, back), V(0.012, B + 0.041, back + 0.001)], 0.0092],
    // ring + little: curled into the palm under the card's bottom edge
    [[V(0.052, B - 0.038, -0.029), V(0.045, B - 0.014, -0.016), V(0.046, B - 0.022, -0.002), V(0.05, B - 0.036, 0.002)], 0.0086],
    [[V(0.064, B - 0.042, -0.026), V(0.06, B - 0.024, -0.016), V(0.061, B - 0.03, -0.005), V(0.064, B - 0.04, -0.002)], 0.0076],
  ];
  // thumb: from the heel of the palm, round the card's lower-right corner, pad flat on the front face
  const th = [V(0.07, B - 0.06, -0.012), V(0.056, B - 0.024, 0.012), V(0.036, B + 0.004, 0.0105), V(0.02, B + 0.018, 0.0092)];
  return (
    <group>
      {card && <mesh material={cm} castShadow><boxGeometry args={[CW, CH, 0.0009]} /></mesh>}
      {/* palm behind-below the card, angled; forearm leaving down-right toward the viewer */}
      <group position={[0.05, B - 0.06, -0.026]} rotation={[0.25, -0.35, -0.5]}><mesh geometry={palm} material={m.skin} castShadow /></group>
      <Seg a={V(0.06, B - 0.085, -0.03)} b={V(0.17, B - 0.36, 0.04)} r0={0.028} r1={0.035} m={m.skin} />
      {/* sleeve cuff over the forearm (her cardigan / his rolled shirt) + the red string */}
      <Seg a={V(0.115, B - 0.225, 0.006)} b={V(0.2, B - 0.44, 0.06)} r0={0.042} r1={0.045} m={m.sleeve} />
      <Seg a={V(0.108, B - 0.205, 0.002)} b={V(0.118, B - 0.232, 0.008)} r0={0.045} r1={0.045} m={m.cuff} />
      {band && <group position={[0.088, B - 0.15, -0.008]} rotation={[0.35, 0, -0.35]}><mesh><torusGeometry args={[0.031, 0.0028, 6, 20]} /><meshStandardMaterial color={band} roughness={0.7} /></mesh></group>}
      {fingers.map(([pts, r], i) => <group key={i}>{chain(pts, r, m.skin, 'f' + i)}</group>)}
      {chain(th, 0.0128, m.skin, 't')}
      <mesh position={[th[3].x - 0.003, th[3].y + 0.004, th[3].z + 0.006]} rotation={[0, 0, 0.6]} scale={[0.0045, 0.0062, 0.0012]} material={m.nail}><sphereGeometry args={[1, 8, 6]} /></mesh>
    </group>
  );
};
