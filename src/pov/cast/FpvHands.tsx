import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * The POV owner's arms, built in code in the same low-poly toon style as the cast.
 * Hand-local frame (metres): wrist at the origin, fingers along +y, palm facing +z, thumb on the +x side for the right hand.
 * A grip is a set of joint curls (0 = straight, 1 = fully bent); grips blend linearly, so any hand pose is a pure function of time.
 */
export type Grip = {f: [number, number, number, number]; tip: number; spread: number; th: [number, number, number]; prop?: 'mug' | 'phone' | 'pen' | 'none'};
export const GRIPS: Record<string, Grip> = {
  open: {f: [0.12, 0.1, 0.12, 0.15], tip: 0.5, spread: 0.6, th: [0.25, 0.1, 0.1]},
  relaxed: {f: [0.35, 0.4, 0.45, 0.5], tip: 0.7, spread: 0.2, th: [0.4, 0.25, 0.2]},
  mug: {f: [0.62, 0.66, 0.68, 0.72], tip: 0.85, spread: 0.05, th: [0.55, 0.15, 0.2], prop: 'mug'},
  phone: {f: [0.1, 0.12, 0.14, 0.2], tip: 0.25, spread: 0.0, th: [0.62, 0.3, 0.25], prop: 'phone'},
  point: {f: [0.02, 0.95, 0.98, 1.0], tip: 0.9, spread: 0.1, th: [0.7, 0.5, 0.4]},
  press: {f: [0.18, 0.92, 0.95, 0.98], tip: 0.9, spread: 0.1, th: [0.7, 0.5, 0.4]},
  fist: {f: [1, 1, 1, 1], tip: 1, spread: 0, th: [0.8, 0.6, 0.6]},
  wave: {f: [0.02, 0.0, 0.02, 0.05], tip: 0.2, spread: 0.9, th: [0.1, 0.0, 0.0]},
  pen: {f: [0.42, 0.55, 0.78, 0.85], tip: 0.55, spread: 0.0, th: [0.55, 0.25, 0.15], prop: 'pen'},
  deskPush: {f: [0.18, 0.2, 0.22, 0.26], tip: 0.35, spread: 0.35, th: [0.2, 0.1, 0.05]},
  knee: {f: [0.55, 0.6, 0.62, 0.66], tip: 0.6, spread: 0.1, th: [0.35, 0.2, 0.15]},
  floor: {f: [0.1, 0.12, 0.14, 0.18], tip: 0.25, spread: 0.5, th: [0.15, 0.05, 0.05]},
  // fist closed round a vertical pole or strap (no prop: the pole belongs to the set)
  pole: {f: [0.7, 0.74, 0.76, 0.8], tip: 0.9, spread: 0.0, th: [0.6, 0.2, 0.25]},
  // thumb-index pinch holding a flat card
  pinch: {f: [0.45, 0.55, 0.7, 0.78], tip: 0.5, spread: 0.05, th: [0.45, 0.2, 0.1]},
};
export const mixGrip = (a: Grip, b: Grip, k: number): Grip => {
  const l = (x: number, y: number) => x + (y - x) * k;
  return {f: a.f.map((v, i) => l(v, b.f[i])) as Grip['f'], tip: l(a.tip, b.tip), spread: l(a.spread, b.spread), th: a.th.map((v, i) => l(v, b.th[i])) as Grip['th'], prop: k < 0.5 ? a.prop : b.prop};
};

const mat = (c: string, r = 0.7) => new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: 0});
const capsule = (r: number, len: number) => { const g = new THREE.CapsuleGeometry(r, len, 4, 10); g.translate(0, len / 2 + r * 0.2, 0); return g; };
const lathe = (prof: [number, number][], seg = 14) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// finger layout from the thumb side outwards: index, middle, ring, little
const FING = [{x: 0.026, len: [0.042, 0.026, 0.021], r: 0.0092, base: 0.083}, {x: 0.008, len: [0.046, 0.029, 0.022], r: 0.0095, base: 0.087}, {x: -0.01, len: [0.043, 0.027, 0.021], r: 0.0091, base: 0.084}, {x: -0.027, len: [0.034, 0.021, 0.018], r: 0.0082, base: 0.077}];

const Finger: React.FC<{x: number; base: number; len: number[]; r: number; curl: number; tip: number; splay: number; m: THREE.Material; nail: THREE.Material}> = ({x, base, len, r, curl, tip, splay, m, nail}) => {
  const a0 = curl * 1.45, a1 = curl * 1.55, a2 = curl * 1.1 * tip;
  return (
    <group position={[x, base, 0]} rotation={[0, 0, splay]}>
      <group rotation={[a0, 0, 0]}>
        <mesh geometry={capsule(r, len[0] - r)} material={m} castShadow />
        <group position={[0, len[0], 0]} rotation={[a1, 0, 0]}>
          <mesh geometry={capsule(r * 0.93, len[1] - r)} material={m} castShadow />
          <group position={[0, len[1], 0]} rotation={[a2, 0, 0]}>
            <mesh geometry={capsule(r * 0.86, len[2] - r * 0.8)} material={m} castShadow />
            <mesh position={[0, len[2] * 0.62, -r * 0.62]} rotation={[0.25, 0, 0]} scale={[r * 0.8, len[2] * 0.36, r * 0.25]} material={nail}><sphereGeometry args={[1, 8, 6]} /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

/** One hand + forearm. `side` R or L; `grip` resolved grip; `sleeve`/`cuff`/`skin` colours. The forearm extends from the wrist along -y. */
export const Hand: React.FC<{side: 'R' | 'L'; grip: Grip; skin?: string; sleeve?: string; cuff?: string; forearm?: number; bare?: boolean; watch?: string; rolled?: boolean; band?: string; scale?: number}> = ({side, grip, skin = '#D9A27E', sleeve = '#F2F2EF', cuff = '#E3E3DF', forearm = 0.3, bare = false, watch, rolled = false, band, scale = 1}) => {
  const m = useMemo(() => ({skin: mat(skin, 0.62), nail: mat('#F1D2C0', 0.35), sleeve: mat(sleeve, 0.85), cuff: mat(cuff, 0.8), line: mat('#C98E6C', 0.7)}), [skin, sleeve, cuff]);
  const geo = useMemo(() => ({
    palm: new RoundedBoxGeometry(0.084, 0.088, 0.03, 3, 0.013),
    heel: new RoundedBoxGeometry(0.07, 0.035, 0.032, 2, 0.013),
    arm: lathe([[0.0001, -forearm], [0.034, -forearm], [0.036, -forearm * 0.55], [0.03, -0.03], [0.027, 0.005], [0.0001, 0.012]]),
    // rolled sleeve: the cloth starts near the elbow with a fat rolled band (mid-forearm and wrist bare)
    sleeve: rolled ? lathe([[0.043, -forearm - 0.05], [0.043, -forearm + 0.02], [0.0001, -forearm + 0.02]], 16) : lathe([[0.041, -forearm - 0.05], [0.042, -0.11], [0.039, -0.08], [0.0001, -0.08]], 16),
    cuff: rolled ? lathe([[0.042, -forearm + 0.0], [0.047, -forearm + 0.015], [0.047, -forearm + 0.05], [0.041, -forearm + 0.065], [0.0001, -forearm + 0.065]], 16) : lathe([[0.0405, -0.1], [0.042, -0.095], [0.042, -0.068], [0.0405, -0.063], [0.0001, -0.063]], 16),
  }), [forearm, rolled]);
  const s = side === 'R' ? 1 : -1;
  return (
    <group scale={[s * scale, scale, scale]}>
      {band && <mesh position={[0, -0.025, 0]} scale={[1, 1, 0.84]}><torusGeometry args={[0.031, 0.0025, 6, 20]} /><meshStandardMaterial color={band} roughness={0.7} /></mesh>}
      {/* forearm in sleeve with cuff */}
      <mesh geometry={geo.arm} material={m.skin} castShadow scale={[1, 1, 0.82]} />
      {!bare && <mesh geometry={geo.sleeve} material={m.sleeve} castShadow scale={[1, 1, 0.86]} />}
      {!bare && <mesh geometry={geo.cuff} material={m.cuff} castShadow scale={[1, 1, 0.86]} />}
      {watch && <group position={[0, -0.04, 0]}><mesh scale={[1, 1, 0.84]} castShadow><cylinderGeometry args={[0.0335, 0.0335, 0.02, 18, 1, true]} /><meshStandardMaterial color={watch} roughness={0.6} side={THREE.DoubleSide} /></mesh><mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.017, 0.017, 0.008, 20]} /><meshStandardMaterial color="#202226" roughness={0.3} /></mesh><mesh position={[0, 0, 0.0345]}><circleGeometry args={[0.013, 20]} /><meshBasicMaterial color="#C9D2D8" /></mesh></group>}
      {/* palm */}
      <mesh geometry={geo.heel} material={m.skin} position={[0.002, 0.012, -0.001]} castShadow />
      <mesh geometry={geo.palm} material={m.skin} position={[0, 0.046, 0]} castShadow />
      <mesh position={[0.0, 0.06, 0.0152]} scale={[0.03, 0.002, 0.001]} material={m.line}><boxGeometry args={[1, 1, 1]} /></mesh>
      {/* fingers */}
      {FING.map((d, i) => <Finger key={i} x={d.x} base={d.base} len={d.len} r={d.r} curl={grip.f[i]} tip={grip.tip} splay={(1.5 - i) * 0.07 * grip.spread} m={m.skin} nail={m.nail} />)}
      {/* thumb: rooted at the heel of the palm, angled out and forward */}
      <group position={[0.034, 0.018, 0.006]} rotation={[0.35 + grip.th[0] * 0.7, -0.5 - grip.th[0] * 0.45, -0.75 + grip.th[0] * 0.55]}>
        <mesh geometry={capsule(0.0125, 0.03)} material={m.skin} castShadow />
        <group position={[0, 0.036, 0]} rotation={[grip.th[1] * 0.9, 0, 0]}>
          <mesh geometry={capsule(0.0108, 0.018)} material={m.skin} castShadow />
          <group position={[0, 0.022, 0]} rotation={[grip.th[2] * 0.9, 0, 0]}>
            <mesh geometry={capsule(0.0098, 0.013)} material={m.skin} castShadow />
            <mesh position={[0, 0.012, -0.007]} rotation={[0.2, 0, 0]} scale={[0.008, 0.008, 0.0025]} material={m.nail}><sphereGeometry args={[1, 8, 6]} /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

// ---- props held in the hand (hand-local) ----
const mugM = new THREE.MeshStandardMaterial({color: '#F7F5F0', roughness: 0.35, side: THREE.DoubleSide}), coffee = mat('#4A2E1E', 0.15), phoneM = mat('#17191F', 0.25);
export const MugInHand: React.FC<{logo?: THREE.Texture}> = ({logo}) => (
  <group position={[0.032, 0.062, 0.058]} rotation={[0, 0, -Math.PI / 2]}>
    <mesh material={mugM} castShadow><cylinderGeometry args={[0.044, 0.04, 0.105, 28, 1, true]} /></mesh>
    <mesh material={mugM} position={[0, 0.047, 0]} scale={[1, 1, 1]}><cylinderGeometry args={[0.04, 0.037, 0.01, 28, 1, true]} /></mesh>
    <mesh material={coffee} position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.041, 24]} /></mesh>
    <mesh material={mugM} position={[0, -0.0525, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.04, 24]} /></mesh>
    <mesh material={mugM} position={[0, 0, -0.048]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.024, 0.0075, 8, 16, Math.PI]} /></mesh>
    {logo && <mesh position={[0, 0.0, 0.0445]} rotation={[0, 0, -Math.PI / 2]}><planeGeometry args={[0.05, 0.035]} /><meshBasicMaterial map={logo} transparent /></mesh>}
  </group>
);
export const PenInHand: React.FC = () => (
  <group position={[0.012, 0.075, 0.03]} rotation={[0.55, 0.15, -0.35]}>
    <mesh castShadow><cylinderGeometry args={[0.0045, 0.0045, 0.13, 10]} /><meshStandardMaterial color="#2B4C9B" roughness={0.4} /></mesh>
    <mesh position={[0, -0.072, 0]}><coneGeometry args={[0.0045, 0.014, 10]} /><meshStandardMaterial color="#D9D9DC" metalness={0.6} roughness={0.3} /></mesh>
    <mesh position={[0.005, 0.045, 0]}><boxGeometry args={[0.002, 0.03, 0.004]} /><meshStandardMaterial color="#D9D9DC" metalness={0.6} roughness={0.3} /></mesh>
  </group>
);
/** phone resting on the fingers (they support its back), thumb at the near edge, screen facing out of the palm */
export const PhoneInHand: React.FC<{screen?: THREE.Texture}> = ({screen}) => (
  <group position={[-0.004, 0.09, 0.024]} rotation={[0.04, 0, 0]}>
    <mesh material={phoneM} castShadow><boxGeometry args={[0.072, 0.15, 0.009]} /></mesh>
    <mesh position={[0, 0, 0.0047]}><planeGeometry args={[0.066, 0.142]} /><meshBasicMaterial map={screen ?? null} color={screen ? '#ffffff' : '#9CC7F2'} toneMapped={false} /></mesh>
  </group>
);

/** A whole POV arm placed in camera space: wrist position + orientation (euler, radians), grip, optional prop. */
/** Orientation from where the fingers point and where the palm faces (camera space). */
export const handQuat = (fingers: [number, number, number], palm: [number, number, number]) => {
  const y = new THREE.Vector3(...fingers).normalize(); const z = new THREE.Vector3(...palm); z.addScaledVector(y, -z.dot(y)).normalize(); const x = new THREE.Vector3().crossVectors(y, z);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
};
export const FpvArm: React.FC<{side: 'R' | 'L'; wrist: [number, number, number]; rot?: [number, number, number]; q?: THREE.Quaternion; grip: Grip; skin?: string; sleeve?: string; cuff?: string; screen?: THREE.Texture; bare?: boolean; watch?: string; rolled?: boolean; band?: string; scale?: number}> = ({side, wrist, rot, q, grip, skin, sleeve, cuff, screen, bare, watch, rolled, band, scale}) => (
  <group position={wrist} rotation={rot} quaternion={q}>
    <Hand side={side} grip={grip} skin={skin} sleeve={sleeve} cuff={cuff} forearm={0.34} bare={bare} watch={watch} rolled={rolled} band={band} scale={scale} />
    {grip.prop === 'mug' && <MugInHand />}
    {grip.prop === 'pen' && <PenInHand />}
    {grip.prop === 'phone' && <PhoneInHand screen={screen} />}
  </group>
);

/**
 * A right hand holding a phone, modelled around the phone itself (phone-local metres: x right, y up, z out of the screen).
 * The phone's back rests on the fingers; index/middle/ring wrap the left edge so their tips show on the bezel, the little
 * finger props the bottom corner, the thumb runs up the right edge and rests on the glass; palm + forearm leave down-right.
 */
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const Seg: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r0: number; r1?: number; m: THREE.Material}> = ({a, b, r0, r1 = r0, m}) => {
  const len = a.distanceTo(b); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  const g = useMemo(() => { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 5; i++) { const t = (i / 5) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(t) * r0, -Math.cos(t) * r0)); } for (let i = 0; i <= 5; i++) { const t = (i / 5) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(t) * r1, len + Math.sin(t) * r1)); } return new THREE.LatheGeometry(pts, 12); }, [len, r0, r1]);
  return <mesh geometry={g} material={m} position={a} quaternion={q} castShadow />;
};
const chain = (pts: THREE.Vector3[], r: number[], m: THREE.Material, key: string) => pts.slice(1).map((p, i) => <Seg key={key + i} a={pts[i]} b={p} r0={r[i]} r1={r[i + 1] ?? r[i] * 0.92} m={m} />);
const PW = 0.072, PH = 0.15, PT = 0.009;
export const PhoneGrip: React.FC<{screen?: THREE.Texture; skin?: string; watch?: string; tap?: number; phone?: boolean; hand?: boolean}> = ({screen, skin = '#D9A27A', tap = 0, phone = true, hand = true}) => {
  const m = useMemo(() => ({skin: mat(skin, 0.62), nail: mat('#E9B9A2', 0.3)}), [skin]);
  const L = -PW / 2, B = -PH / 2, F = PT / 2;
  const R = PW / 2, Bk = -PT / 2;
  // one-handed hold (right hand), as a real phone is held: the phone rests in the palm and on the curled fingers behind it.
  // finger chains: knuckle (behind the phone) → along the back → round the left edge → tip just on the edge (never on the glass)
  const fingers: [THREE.Vector3[], number][] = [
    [[V(0.012, 0.012, -0.03), V(-0.018, 0.02, Bk - 0.009), V(L - 0.007, 0.024, Bk - 0.002), V(L - 0.004, 0.026, F - 0.002)], 0.0088],
    [[V(0.012, -0.008, -0.031), V(-0.02, -0.004, Bk - 0.009), V(L - 0.0075, 0.0, Bk - 0.002), V(L - 0.0045, 0.001, F - 0.001)], 0.0092],
    [[V(0.013, -0.028, -0.03), V(-0.018, -0.027, Bk - 0.009), V(L - 0.007, -0.025, Bk - 0.002), V(L - 0.004, -0.024, F - 0.002)], 0.0087],
    [[V(0.014, -0.047, -0.028), V(-0.012, -0.05, Bk - 0.008), V(L - 0.005, -0.049, Bk - 0.002), V(L - 0.003, -0.048, F - 0.003)], 0.0076],
  ];
  // thumb: from the heel of the palm up along the right edge, pad resting on the side (tap swings the tip onto the glass)
  const tipRest = V(R + 0.004, 0.012, F - 0.001), tipTap = V(R - 0.022, -0.012, F + 0.006);
  const th = [V(0.042, -0.07, -0.02), V(R + 0.009, -0.045, -0.006), V(R + 0.007, -0.016, F - 0.003 + tap * 0.004), tipRest.clone().lerp(tipTap, tap)];
  return (
    <group>
      {phone && <><mesh material={phoneM} castShadow><boxGeometry args={[PW, PH, PT]} /></mesh>
      <mesh position={[0, 0, F + 0.0003]}><planeGeometry args={[PW - 0.006, PH - 0.008]} /><meshBasicMaterial map={screen ?? null} color={screen ? '#ffffff' : '#9CC7F2'} toneMapped={false} /></mesh></>}
      {hand && <>
      {/* palm cradling the back of the lower half, its outer edge showing past the right side; forearm leaving down-right toward the viewer */}
      <group position={[0.016, -0.03, -0.026]} rotation={[0.05, -0.12, -0.18]}><mesh material={m.skin} castShadow><primitive object={new RoundedBoxGeometry(0.078, 0.088, 0.026, 4, 0.012)} attach="geometry" /></mesh></group>
      <Seg a={V(0.03, -0.07, -0.03)} b={V(0.15, -0.34, 0.05)} r0={0.028} r1={0.034} m={m.skin} />
      {fingers.map(([pts, r], i) => <group key={i}>{chain(pts, [r, r * 0.93, r * 0.86], m.skin, 'f' + i)}</group>)}
      {chain(th, [0.0135, 0.0118, 0.0102], m.skin, 't')}
      {/* thumbnail */}
      <mesh position={[th[3].x + 0.004 * (1 - tap), th[3].y + 0.003, th[3].z + 0.006]} rotation={[0, 0.6 * (1 - tap), 0.2]} scale={[0.0045, 0.006, 0.0012]} material={m.nail}><sphereGeometry args={[1, 8, 6]} /></mesh>
      </>}
    </group>
  );
};
