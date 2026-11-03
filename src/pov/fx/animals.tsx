import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * Code-built street animals (no downloads): a Thai street dog that trots with a real diagonal gait, and a cat sitting on a wall.
 * Local frame: the animal faces +z, up +y, metres. Both are smooth-shaded with a few colour zones (lighter belly/muzzle, dark nose/pads).
 */
const std = (c: string, r = 0.85) => new THREE.MeshStandardMaterial({color: c, roughness: r});
/** a tapered limb segment from a to b (capsule-like lathe) */
const Limb: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r0: number; r1: number; m: THREE.Material}> = ({a, b, r0, r1, m}) => {
  const len = a.distanceTo(b);
  const g = useMemo(() => { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 4; i++) { const t = (i / 4) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(t) * r0, -Math.cos(t) * r0)); } for (let i = 0; i <= 4; i++) { const t = (i / 4) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(t) * r1, len + Math.sin(t) * r1)); } return new THREE.LatheGeometry(pts, 10); }, [len, r0, r1]);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return <mesh geometry={g} material={m} position={a} quaternion={q} castShadow />;
};
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** a two-bone leg from the hip/shoulder: upper swings by `a`, lower bends back by `knee` (hind legs bend the other way at the hock) */
const leg = (root: THREE.Vector3, up: number, lo: number, a: number, knee: number, hind: boolean) => {
  const k = root.clone().add(V(0, -Math.cos(a) * up, Math.sin(a) * up));
  const b2 = a + (hind ? knee : -knee);
  const p = k.clone().add(V(0, -Math.cos(b2) * lo, Math.sin(b2) * lo));
  return {k, p};
};

export const Dog: React.FC<{phase: number; trot?: number; coat?: string}> = ({phase, trot = 1, coat = '#C2955E'}) => {
  const m = useMemo(() => ({coat: std(coat), belly: std('#E3C79E'), dark: std('#3A2A1E', 0.6), nose: std('#151213', 0.35), eye: std('#120E0C', 0.2), pad: std('#2A201B', 0.7)}), [coat]);
  const ph = phase * Math.PI * 2, bob = Math.abs(Math.sin(ph)) * 0.018 * trot;
  // diagonal pairs: front-left with hind-right
  const swing = (o: number) => Math.sin(ph + o) * 0.45 * trot, bend = (o: number) => Math.max(0, Math.sin(ph + o + 1.2)) * 0.9 * trot + 0.12;
  const legs = [
    {r: V(0.08, 0.49, 0.22), o: 0, hind: false}, {r: V(-0.08, 0.49, 0.22), o: Math.PI, hind: false},
    {r: V(0.08, 0.49, -0.24), o: Math.PI, hind: true}, {r: V(-0.08, 0.49, -0.24), o: 0, hind: true},
  ];
  const tailWag = Math.sin(ph * 1.5) * 0.35;
  return (
    <group position={[0, bob, 0]}>
      {/* body: ribcage, waist, haunch */}
      <mesh position={[0, 0.5, 0.12]} scale={[0.14, 0.16, 0.21]} material={m.coat} castShadow><sphereGeometry args={[1, 18, 14]} /></mesh>
      <mesh position={[0, 0.5, -0.08]} scale={[0.125, 0.13, 0.2]} material={m.coat} castShadow><sphereGeometry args={[1, 18, 14]} /></mesh>
      <mesh position={[0, 0.51, -0.22]} scale={[0.13, 0.14, 0.13]} material={m.coat} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
      <mesh position={[0, 0.45, 0.12]} scale={[0.1, 0.07, 0.16]} material={m.belly}><sphereGeometry args={[1, 14, 10]} /></mesh>
      {/* neck + head: skull, muzzle, nose, pointed upright ears, eyes */}
      <Limb a={V(0, 0.56, 0.24)} b={V(0, 0.68, 0.33)} r0={0.095} r1={0.08} m={m.coat} />
      <group position={[0, 0.74, 0.38]} rotation={[0.12 + Math.sin(ph) * 0.03, Math.sin(phase * 0.7) * 0.15, 0]} scale={1.35}>
        <mesh scale={[0.075, 0.07, 0.085]} material={m.coat} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
        <Limb a={V(0, -0.02, 0.04)} b={V(0, -0.03, 0.13)} r0={0.05} r1={0.04} m={m.coat} />
        <mesh position={[0, -0.04, 0.12]} scale={[0.04, 0.025, 0.035]} material={m.belly}><sphereGeometry args={[1, 10, 8]} /></mesh>
        <mesh position={[0, -0.022, 0.168]} scale={[0.024, 0.018, 0.016]} material={m.nose}><sphereGeometry args={[1, 10, 8]} /></mesh>
        <mesh position={[0, -0.06, 0.12]} scale={[0.03, 0.01, 0.045]} material={m.dark}><sphereGeometry args={[1, 8, 6]} /></mesh>
        {[-1, 1].map((sd) => <group key={sd}>
          <mesh position={[sd * 0.045, 0.075, -0.01]} rotation={[-0.15, 0, -sd * 0.28]} material={m.coat} castShadow><coneGeometry args={[0.04, 0.1, 5]} /></mesh>
          <mesh position={[sd * 0.044, 0.073, 0.0]} rotation={[-0.15, 0, -sd * 0.28]} scale={[0.6, 0.8, 0.4]} material={m.dark}><coneGeometry args={[0.03, 0.07, 4]} /></mesh>
          <mesh position={[sd * 0.04, 0.018, 0.068]} scale={[0.011, 0.011, 0.008]} material={m.eye}><sphereGeometry args={[1, 8, 6]} /></mesh>
        </group>)}
      </group>
      {/* tail: three segments curling up over the back, wagging */}
      <group position={[0, 0.56, -0.31]} rotation={[0, tailWag, 0]}>
        <Limb a={V(0, 0, 0)} b={V(0, 0.09, -0.08)} r0={0.025} r1={0.022} m={m.coat} />
        <Limb a={V(0, 0.09, -0.08)} b={V(0, 0.18, -0.06)} r0={0.022} r1={0.018} m={m.coat} />
        <Limb a={V(0, 0.18, -0.06)} b={V(0, 0.22, 0.02)} r0={0.018} r1={0.012} m={m.belly} />
      </group>
      {/* legs */}
      {legs.map((L, i) => { const {k, p} = leg(L.r, L.hind ? 0.23 : 0.22, L.hind ? 0.24 : 0.24, swing(L.o), bend(L.o), L.hind); return <group key={i}>
        <Limb a={L.r} b={k} r0={L.hind ? 0.068 : 0.058} r1={0.038} m={m.coat} />
        <Limb a={k} b={p} r0={0.036} r1={0.03} m={m.coat} />
        <mesh position={[p.x, Math.max(0.018, p.y), p.z + 0.02]} scale={[0.038, 0.024, 0.05]} material={m.pad} castShadow><sphereGeometry args={[1, 8, 6]} /></mesh>
      </group>; })}
    </group>
  );
};

export const Cat: React.FC<{t: number; look?: number}> = ({t, look = 0}) => {
  const m = useMemo(() => ({fur: std('#3A3532'), chest: std('#D9D2C6'), nose: std('#C78A8A', 0.4), eye: new THREE.MeshStandardMaterial({color: '#C9D86A', emissive: '#A8C040', emissiveIntensity: 1.2, roughness: 0.1}), pupil: std('#050505', 0.2), ear: std('#B07A78', 0.7)}), []);
  const tip = Math.sin(t * 2.3) * 0.5 + Math.sin(t * 0.7) * 0.3, blink = (t % 4.3) < 0.12 ? 0.15 : 1;
  return (
    <group>
      {/* sitting: haunches, upright chest, front legs straight down, tail wrapped round the paws */}
      <mesh position={[0, 0.09, -0.04]} scale={[0.1, 0.09, 0.11]} material={m.fur} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
      <mesh position={[0, 0.17, 0.02]} rotation={[0.35, 0, 0]} scale={[0.075, 0.12, 0.07]} material={m.fur} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
      <mesh position={[0, 0.17, 0.065]} rotation={[0.35, 0, 0]} scale={[0.045, 0.08, 0.03]} material={m.chest}><sphereGeometry args={[1, 12, 10]} /></mesh>
      {[-1, 1].map((sd) => <group key={sd}>
        <Limb a={V(sd * 0.03, 0.15, 0.07)} b={V(sd * 0.03, 0.015, 0.08)} r0={0.017} r1={0.014} m={m.fur} />
        <mesh position={[sd * 0.03, 0.012, 0.09]} scale={[0.018, 0.012, 0.024]} material={m.chest}><sphereGeometry args={[1, 8, 6]} /></mesh>
        <mesh position={[sd * 0.075, 0.04, -0.02]} scale={[0.035, 0.035, 0.07]} material={m.fur}><sphereGeometry args={[1, 10, 8]} /></mesh>
      </group>)}
      <group position={[0.02, 0.02, -0.12]}>
        <Limb a={V(0, 0, 0)} b={V(0.09, 0, 0.0)} r0={0.017} r1={0.016} m={m.fur} />
        <Limb a={V(0.09, 0, 0)} b={V(0.12, 0.0, 0.1)} r0={0.016} r1={0.014} m={m.fur} />
        <group position={[0.12, 0, 0.1]} rotation={[0, 0, tip * 0.6]}><Limb a={V(0, 0, 0)} b={V(-0.04, 0.03 + Math.max(0, tip) * 0.03, 0.08)} r0={0.014} r1={0.01} m={m.fur} /></group>
      </group>
      {/* head turns to follow whoever passes */}
      <group position={[0, 0.29, 0.06]} rotation={[0.05, look, Math.sin(t * 0.9) * 0.05]}>
        <mesh scale={[0.058, 0.05, 0.052]} material={m.fur} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
        <mesh position={[0, -0.016, 0.04]} scale={[0.03, 0.022, 0.022]} material={m.chest}><sphereGeometry args={[1, 10, 8]} /></mesh>
        <mesh position={[0, -0.006, 0.058]} rotation={[0.5, 0, Math.PI]} material={m.nose}><coneGeometry args={[0.007, 0.007, 3]} /></mesh>
        {[-1, 1].map((sd) => <group key={sd}>
          <mesh position={[sd * 0.034, 0.045, -0.005]} rotation={[0, 0, -sd * 0.35]} material={m.fur} castShadow><coneGeometry args={[0.022, 0.045, 4]} /></mesh>
          <mesh position={[sd * 0.033, 0.042, 0.002]} rotation={[0, 0, -sd * 0.35]} scale={[0.6, 0.75, 0.3]} material={m.ear}><coneGeometry args={[0.02, 0.04, 4]} /></mesh>
          <group position={[sd * 0.022, 0.008, 0.044]} scale={[1, blink, 1]}>
            <mesh scale={[0.012, 0.01, 0.006]} material={m.eye}><sphereGeometry args={[1, 10, 8]} /></mesh>
            <mesh position={[0, 0, 0.004]} scale={[0.003, 0.009, 0.004]} material={m.pupil}><sphereGeometry args={[1, 6, 6]} /></mesh>
          </group>
        </group>)}
        {[-1, 1].flatMap((sd) => [0, 1, 2].map((i) => <mesh key={sd + '_' + i} position={[sd * 0.035, -0.014 + i * 0.006, 0.045]} rotation={[0, 0, sd * (0.15 - i * 0.12)]} material={m.chest}><boxGeometry args={[0.05, 0.0012, 0.0012]} /></mesh>))}
      </group>
    </group>
  );
};
