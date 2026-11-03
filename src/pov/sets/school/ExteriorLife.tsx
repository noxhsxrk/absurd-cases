import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hash, smooth, clamp} from '../../lib/math';

/**
 * Life outside the windows: everything seen at a distance is a real 3D body going somewhere, and it reacts.
 * Before the alert: a PE class jogs the track, students walk the corridors of the opposite block, a guard minds the
 * gate, a dog noses along the field, traffic runs on the road behind the block, birds sit on the roof ridge.
 * Alert (t≈0.5): the PE teacher whistles, the class gathers and runs inside; corridor students check phones and
 * duck into rooms; the guard shuts the gate. Sirens → a police pickup closes the road (~36–44 s), traffic stops.
 * Gunshot (PA cut): the flock bursts off the roof (delay = distance/343 + reaction), the dog bolts, the guard drops
 * behind his booth; later two officers crouch-run along the fence toward the gate. Reactions persist.
 */
const G = -7.2;
type K = [number, number, number, Mode?];             // [t, x, z, mode from here]
type Mode = 'walk' | 'run' | 'crouch' | 'stand' | 'jog' | 'hide';
const mats = new Map<string, THREE.MeshStandardMaterial>();
const mat = (c: string) => { if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({color: c, roughness: 0.85, flatShading: true})); return mats.get(c)!; };

/** position on a keyframed route + distance travelled (for the stride) + heading */
const route = (ks: K[], t: number) => {
  let d = 0;
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, x0, z0] = ks[i], [t1, x1, z1] = ks[i + 1]; const L = Math.hypot(x1 - x0, z1 - z0);
    if (t < t1) { const u = clamp((t - t0) / (t1 - t0)); return {x: x0 + (x1 - x0) * u, z: z0 + (z1 - z0) * u, d: d + L * u, yaw: L > 0.01 ? Math.atan2(x1 - x0, z1 - z0) : NaN, mode: (ks[i][3] ?? 'walk') as Mode, moving: L > 0.01 && t >= t0}; }
    d += L;
  }
  const l = ks[ks.length - 1]; return {x: l[1], z: l[2], d, yaw: NaN, mode: (l[3] ?? 'stand') as Mode, moving: false};
};

const Person: React.FC<{x: number; z: number; y?: number; yaw: number; d: number; mode: Mode; moving: boolean; top: string; pants: string; skin: string; s?: number; arm?: number}> = ({x, z, y = G, yaw, d, mode, moving, top, pants, skin, s = 1, arm = 0}) => {
  if (mode === 'hide') return null;
  const run = mode === 'run' || mode === 'jog', crouch = mode === 'crouch';
  const ph = (d / (run ? 1.9 : 1.3)) * Math.PI * 2, sw = moving ? Math.sin(ph) * (run ? 0.75 : 0.45) : 0;
  const lean = run && moving ? 0.25 : crouch ? 0.6 : 0, drop = crouch ? 0.42 : 0, bob = moving ? Math.abs(Math.sin(ph)) * (run ? 0.06 : 0.03) : 0;
  return (
    <group position={[x, y - drop + bob, z]} rotation={[0, yaw, 0]} scale={s}>
      {[-1, 1].map((k) => <group key={k} position={[k * 0.1, 0.86, 0]} rotation={[(crouch ? -1.1 : 0) + k * sw, 0, 0]}><mesh material={mat(pants)} position={[0, -0.42, 0]}><boxGeometry args={[0.13, 0.84, 0.15]} /></mesh></group>)}
      <group position={[0, 0.86, 0]} rotation={[lean, 0, 0]}>
        <mesh material={mat(top)} position={[0, 0.32, 0]}><boxGeometry args={[0.38, 0.62, 0.22]} /></mesh>
        <mesh material={mat(skin)} position={[0, 0.76, 0.02]}><icosahedronGeometry args={[0.13, 1]} /></mesh>
        {[-1, 1].map((k) => <group key={k} position={[k * 0.23, 0.58, 0]} rotation={[-k * sw * 0.9 - (k === 1 ? arm : 0), 0, k * 0.08 + (k === 1 && arm ? -0.2 : 0)]}><mesh material={mat(top)} position={[0, -0.28, 0]}><boxGeometry args={[0.1, 0.58, 0.11]} /></mesh></group>)}
      </group>
    </group>
  );
};

const Car: React.FC<{x: number; z: number; dir: number; c: string; police?: boolean; t: number}> = ({x, z, dir, c, police, t}) => {
  const blink = Math.sin(t * 14) > 0;
  return (
    <group position={[x, G, z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <mesh material={mat(c)} position={[0, 0.55, 0]}><boxGeometry args={[1.8, 0.7, 4.3]} /></mesh>
      <mesh material={mat(police ? '#F2F2F0' : '#2C3440')} position={[0, 1.1, police ? 0.5 : -0.1]}><boxGeometry args={[1.6, 0.5, police ? 1.9 : 2.3]} /></mesh>
      {[-1.4, 1.4].flatMap((zz) => [-0.85, 0.85].map((xx) => <mesh key={`${xx}${zz}`} material={mat('#16171A')} position={[xx, 0.3, zz]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.2, 10]} /></mesh>))}
      {police && <>
        <mesh position={[-0.35, 1.42, 0.5]}><boxGeometry args={[0.5, 0.12, 0.25]} /><meshBasicMaterial color={blink ? '#FF2A2A' : '#4A1010'} toneMapped={false} /></mesh>
        <mesh position={[0.35, 1.42, 0.5]}><boxGeometry args={[0.5, 0.12, 0.25]} /><meshBasicMaterial color={!blink ? '#3A6BFF' : '#10183A'} toneMapped={false} /></mesh>
        <pointLight position={[0, 2.2, 0.5]} intensity={6} distance={14} color={blink ? '#FF3030' : '#3A6BFF'} />
      </>}
    </group>
  );
};

const Bird: React.FC<{p: [number, number, number]; flap: number; yaw: number}> = ({p, flap, yaw}) => (
  <group position={p} rotation={[0, yaw, 0]} scale={1.6}>
    <mesh material={mat('#2A2A2E')}><boxGeometry args={[0.07, 0.07, 0.22]} /></mesh>
    {[-1, 1].map((k) => <mesh key={k} material={mat('#2A2A2E')} position={[k * 0.12, 0, 0]} rotation={[0, 0, k * flap]}><boxGeometry args={[0.24, 0.015, 0.1]} /></mesh>)}
  </group>
);

/** `gun` = story time (s) of the gunshot the outside world reacts to; omit for a calm day. */
export const ExteriorLife: React.FC<{t: number; gun?: number}> = ({t, gun = 1e9}) => {
  const GUN = gun;
  const P = useMemo(() => {
    const out: {ks: K[]; top: string; pants: string; skin: string; s: number; y?: number; arm?: (t: number) => number}[] = [];
    const skins = ['#E0B08B', '#C99069', '#B97E58', '#D9A67F'];
    // PE class: jogging the track (ellipse) → stop on the whistle → gather → run in through the ground-floor door
    for (let i = 0; i < 12; i++) {
      const ks: K[] = []; const a0 = i * 0.42 + hash(i) * 0.2, w = 0.11 + hash(i * 3) * 0.02, stop = 2.7 + hash(i * 5) * 1.0;
      for (let tt = -1; tt < stop; tt += 0.5) { const a = a0 + w * tt; ks.push([tt, 25 + Math.sin(a) * 12.5, -2 + Math.cos(a) * 18.5, 'jog']); }
      const gx = 21 + (i % 4) * 0.7, gz = -4 + Math.floor(i / 4) * 0.7, go = 6.2 + hash(i * 7) * 1.5;
      ks.push([stop + 1.2, gx, gz, 'stand'], [go, gx, gz, 'run'], [go + 3.4 + hash(i) * 0.6, 7.2, 2 + (i % 3) * 0.6, 'run'], [go + 4.2 + hash(i) * 0.6, 6.0, 2.4, 'hide']);
      out.push({ks, top: '#E8E4D8', pants: '#2C3A63', skin: skins[i % 4], s: 0.95});
    }
    // PE teacher: whistle (arm up), waves them in, follows them inside
    out.push({ks: [[-1, 20, -2, 'stand'], [6.6, 20, -2, 'run'], [10.5, 7.2, 1.6, 'run'], [11.3, 6, 2, 'hide']], top: '#C4372D', pants: '#1E2230', skin: '#C99069', s: 1.02, arm: (tt) => (tt > 0.3 && tt < 3.2 ? 2.6 : tt > 3.2 && tt < 6.4 ? 1.6 + 0.6 * Math.sin(tt * 9) : 0)});
    // corridor students on the opposite block: walking, stop to read phones, duck into rooms
    for (let i = 0; i < 7; i++) {
      const f = 1 + (i % 3), y = G + f * 3.6, z0 = -18 + i * 5.5, dz = i % 2 ? 1 : -1, stop = 1.2 + hash(i * 9) * 1.5, inn = stop + 2.5 + hash(i * 4) * 3;
      out.push({ks: [[-1, 34.1, z0, 'walk'], [stop, 34.1, z0 + dz * (stop + 1) * 1.2, 'stand'], [inn, 34.1, z0 + dz * (stop + 1) * 1.2, 'run'], [inn + 0.8, 35.6, z0 + dz * (stop + 1) * 1.2, 'hide']], top: '#ECEAE2', pants: i % 2 ? '#2A3550' : '#B39A72', skin: skins[(i + 1) % 4], s: 0.95, y, arm: (tt) => (tt > stop && tt < inn ? 1.3 : 0)});
    }
    // gate guard: shuts the gate after the alert, drops behind his booth at the gunshot
    out.push({ks: [[-1, 9.4, -21, 'stand'], [5, 9.4, -21, 'walk'], [9, 10.5, -26.5, 'stand'], [GUN + 0.45, 10.5, -26.5, 'run'], [GUN + 1.6, 9.0, -24.2, 'crouch']], top: '#3B4A6B', pants: '#2A3042', skin: '#B97E58', s: 1});
    // police officers: out of the pickup, crouch-running along the fence toward the gate
    for (let i = 0; i < 2; i++) out.push({ks: [[-1, 48.5, -30, 'hide'], [52 + i * 0.6, 48.5, -31 - i, 'crouch'], [80, 30 - i * 1.2, -27.8 - i * 0.4, 'crouch']], top: '#2E2C2A', pants: '#2E2C2A', skin: '#B97E58', s: 1.02});
    return out;
  }, [GUN]);
  // dog: sniffing along the field edge, bolts at the shot
  const dog = route([[-1, 40, -20, 'walk'], [GUN + 0.4, 31, 8, 'run'], [GUN + 4.5, 44, 30, 'hide']], t);
  // traffic on the road behind the block (x 49–53) until the police close it; the pickup arrives with lights going
  const cars = useMemo(() => Array.from({length: 9}, (_, i) => ({lane: i % 2 ? 1 : -1, t0: -10 + i * 4.6 + hash(i) * 2, v: 9 + hash(i * 3) * 4, c: ['#B23A3A', '#E8E6E0', '#2F4F7A', '#6E7378', '#D7C9A6', '#1F2A36'][i % 6]})), []);
  const policeZ = t < 36 ? -150 : -30 - 110 * (1 - smooth((t - 36) / 8));
  // birds on the roof ridge of the opposite block; they burst off at the gunshot and wheel high, a few come back later
  const birds = useMemo(() => Array.from({length: 18}, (_, i) => ({z: -18 + i * 2.1 + hash(i) * 0.8, x: 38.6 + hash(i * 2) * 0.6, d: 0.1 + hash(i * 5) * 0.35, a: hash(i * 7) * 6.28, back: i % 6 === 0})), []);
  const ridgeY = G + 3.6 * 4 + 2.6;
  return (
    <group>
      {/* the road behind the block + gate booth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[51, G + 0.02, 0]} material={mat('#5A5D63')}><planeGeometry args={[8, 300]} /></mesh>
      <mesh position={[9.2, G + 1.1, -24.0]} material={mat('#D8D2C4')}><boxGeometry args={[1.6, 2.2, 1.6]} /></mesh>
      <mesh position={[11.5, G + 0.9, -27]} material={mat('#7D8590')}><boxGeometry args={[4.5, 1.8, 0.08]} /></mesh>
      {P.map((p, i) => { const r = route(p.ks, t); return <Person key={i} x={r.x} z={r.z} y={p.y} yaw={isNaN(r.yaw) ? -Math.PI / 2 : r.yaw} d={r.d} mode={r.mode} moving={r.moving} top={p.top} pants={p.pants} skin={p.skin} s={p.s} arm={p.arm?.(t) ?? 0} />; })}
      {dog.mode !== 'hide' && <group position={[dog.x, G, dog.z]} rotation={[0, isNaN(dog.yaw) ? 0 : dog.yaw, 0]}>
        <mesh material={mat('#B88A55')} position={[0, 0.42 + (dog.moving ? Math.abs(Math.sin(dog.d * 4)) * 0.04 : 0), 0]}><boxGeometry args={[0.28, 0.28, 0.75]} /></mesh>
        <mesh material={mat('#B88A55')} position={[0, 0.56, 0.45]} rotation={[t < GUN ? 0.5 : -0.2, 0, 0]}><boxGeometry args={[0.2, 0.22, 0.3]} /></mesh>
        {[-1, 1].flatMap((a) => [-1, 1].map((b) => <mesh key={`${a}${b}`} material={mat('#9C7244')} position={[a * 0.1, 0.15, b * 0.28]} rotation={[dog.moving ? Math.sin(dog.d * 6 + a * b) * 0.6 : 0, 0, 0]}><boxGeometry args={[0.07, 0.3, 0.07]} /></mesh>))}
      </group>}
      {cars.map((c, i) => {
        if (c.t0 > 38.5) return null;                       // the road is closed from here on
        const tt = t < 38.5 ? t : 38.5 + (1 - Math.exp(-(t - 38.5) / 1.1)) * 1.1;   // traffic brakes to a stop and stays
        const z = (c.lane > 0 ? -150 : 150) + c.lane * (tt - c.t0) * c.v;
        return t > c.t0 && Math.abs(z) < 150 ? <Car key={i} x={51 + c.lane * 1.8} z={z} dir={c.lane} c={c.c} t={t} /> : null;
      })}
      <Car x={49.2} z={policeZ} dir={1} c="#2B4C8C" police t={t} />
      {birds.map((b, i) => {
        const t0 = GUN + b.d;
        if (t < t0) return <Bird key={i} p={[b.x, ridgeY + Math.max(0, Math.sin(t * 3 + b.a)) * 0.05, b.z]} flap={0.15} yaw={b.a} />;
        const u = t - t0;
        if (b.back && u > 22) { const k = smooth((u - 22) / 6); return <Bird key={i} p={[b.x + 30 * (1 - k), ridgeY + 18 * (1 - k), b.z + 10 * (1 - k)]} flap={k < 1 ? Math.sin(u * 18) * 0.9 : 0.15} yaw={b.a + Math.PI} />; }
        const r = 8 + u * 2.2, a = b.a + u * 0.45;
        return <Bird key={i} p={[b.x + 12 + Math.cos(a) * r, ridgeY + Math.min(22, u * 6) + Math.sin(u * 2 + b.a) * 1.2, b.z + Math.sin(a) * r]} flap={Math.sin(u * 22 + b.a) * 0.9} yaw={a + Math.PI / 2} />;
      })}
    </group>
  );
};
