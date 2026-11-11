import * as THREE from 'three';
import {RB} from '../cast/rbManifest';
import {rot, ik, fingers, lp} from './ik';

/**
 * lifekit motion helpers (2026-11-11). Everything is a pure function of time, so Remotion can render frames in any order.
 *  - env():    the asymmetric gesture envelope (wind-up → fast in past the target → settle → moving hold → faster drop)
 *  - arc():    hands travel on an arc, not a straight line
 *  - gait():   walk a polyline with eased start/stop; returns the odometer so the walk clip never slides (use with s.locoClip)
 *  - pace():   the ground speed that matches a walk/run clip's own stride
 *  - headTurn(): eyes first, head a few frames later, chest last
 *  - sitFloor() / sitUp(): floor poses the mocap library does not have
 */
type V3 = [number, number, number];
const sm = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export type EnvOpts = {antic?: number; in?: number; over?: number; hold?: number; out?: number};
/** 0 → 1 → 0 for a gesture that starts at u = 0 (seconds). Slightly negative during the wind-up, slightly above 1 at the overshoot. */
export const env = (u: number, o: EnvOpts = {}) => {
  const a = o.antic ?? 0.07, i = o.in ?? 0.18, ov = o.over ?? 0.06, h = o.hold ?? 0.4, out = o.out ?? 0.12;
  if (u <= 0) return 0;
  if (u < a) return -0.08 * Math.sin((u / a) * Math.PI);
  u -= a; if (u < i) return (1 + ov) * (1 - (1 - u / i) ** 3);
  u -= i; if (u < 0.1) return 1 + ov * (1 - u / 0.1);
  u -= 0.1; if (u < h) return 1 + 0.012 * Math.sin(u * 5.3);
  u -= h; if (u < out) return 1 - (u / out) ** 2;
  return 0;
};
export const envLen = (o: EnvOpts = {}) => (o.antic ?? 0.07) + (o.in ?? 0.18) + 0.1 + (o.hold ?? 0.4) + (o.out ?? 0.12);

/** a point on the arc from a to b at k (0…1): the middle is lifted `lift` metres (and pushed along `out` if given) */
export const arc = (a: V3, b: V3, k: number, lift = 0.15, out: V3 = [0, 1, 0]): V3 => {
  const u = 1 - k, w = 2 * u * k * lift * 2;
  return [u * a[0] + k * b[0] + out[0] * w, u * a[1] + k * b[1] + out[1] * w, u * a[2] + k * b[2] + out[2] * w];
};

/** metres per second that keeps the feet planted for this clip */
export const pace = (clip = 'walk_neutral_01', g: 'm' | 'f' = 'm') => { const c = (RB.clips as any)[g][clip]; return c && c.stride > 0.05 ? c.stride / c.dur : 1.3; };

export type Gait = {x: number; z: number; yaw: number; odo: number; moving: boolean; /** seconds since it stopped (≤ 0 while moving) */ since: number};
/** walk the polyline `pts` ([x, z] metres) starting at o.t0: ease in/out over `acc` s; `loop` closes the path and never stops */
export const gait = (pts: [number, number][], t: number, o: {t0?: number; speed?: number; acc?: number; loop?: boolean} = {}): Gait => {
  const speed = o.speed ?? 1.3, acc = o.acc ?? 0.35, u = t - (o.t0 ?? 0);
  const P = o.loop ? [...pts, pts[0]] : pts; const seg = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1])); const L = seg.reduce((a, b) => a + b, 0);
  const at = (d: number): [number, number] => { let r = o.loop ? ((d % L) + L) % L : Math.min(L, Math.max(0, d));
    for (let i = 0; i < seg.length; i++) { if (r <= seg[i] || i === seg.length - 1) { const k = seg[i] ? Math.min(1, r / seg[i]) : 0; return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k]; } r -= seg[i]; }
    return P[P.length - 1]; };
  const T = L / speed + acc;
  const d = o.loop ? speed * u : u <= 0 ? 0 : u < acc ? (speed * u * u) / (2 * acc) : u < T - acc ? speed * (u - acc / 2) : u < T ? L - (speed * (T - u) ** 2) / (2 * acc) : L;
  const p = at(d), a = at(d - 0.3), b = at(d + 0.3);
  // heading from a short chord, so corners are rounded over ~0.6 m instead of snapping
  const flat = Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-4; const h = flat ? Math.atan2(P[P.length - 1][0] - P[P.length - 2][0], P[P.length - 1][1] - P[P.length - 2][1]) : Math.atan2(b[0] - a[0], b[1] - a[1]);
  return {x: p[0], z: p[1], yaw: h, odo: d, moving: o.loop ? true : u > 0 && u < T, since: o.loop ? -1 : u - T};
};

/** turn the gaze by `yaw` (radians, relative to the body) starting at u = 0: eyes lead, the head follows 2 frames later, the chest 5 */
export const headTurn = (u: number, yaw: number) => ({eyes: yaw * sm(u / 0.07), head: yaw * sm((u - 0.07) / 0.27), chest: yaw * 0.3 * sm((u - 0.17) / 0.33)});
/** body-relative yaw from a character at (x, z, yaw) to a world point */
export const yawTo = (s: {x: number; z: number; yaw: number}, w: V3) => wrap(Math.atan2(w[0] - s.x, w[2] - s.z) - s.yaw);
export const chestTurn = (I: any, a: number) => { if (Math.abs(a) > 1e-3) { rot(I.bones.Bip01_Spine1, 0, 1, 0, a * 0.6, I.root); rot(I.bones.Bip01_Spine2, 0, 1, 0, a * 0.4, I.root); } };

// ---------------------------------------------------------------- floor poses (call after drive(), on a chair-sit clip)
/** drop the character's wrapper this far (metres) when sitting on the ground with sitFloor() */
export const FLOOR_SIT_Y = -0.36;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** cross-legged on the ground from any sit_chair_* clip: thighs opened, shins folded in, hands on the knees.
 *  bow 0…1 folds forward into a prostration (hands slide out onto the ground). */
export const sitFloor = (I: any, o: {bow?: number; hands?: boolean} = {}) => {
  const B = I.bones, r = I.root, bow = o.bow ?? 0;
  ([['L', 1], ['R', -1]] as const).forEach(([sd, k]) => { rot(B[`Bip01_${sd}_Thigh`], 0, 1, 0, k * 0.9, r); rot(B[`Bip01_${sd}_Calf`], 0, 0, 1, -k * 1.4, r); });
  if (bow > 0.001) { rot(B.Bip01_Spine, 1, 0, 0, bow * 0.75, r); rot(B.Bip01_Spine1, 1, 0, 0, bow * 0.5, r); rot(B.Bip01_Head, 1, 0, 0, bow * 0.25, r); }
  if (o.hands === false) return;
  r.updateMatrixWorld(true);
  const ground = -FLOOR_SIT_Y / I.scale;   // floor height in root space (cm)
  (['L', 'R'] as const).forEach((sd) => { const m = sd === 'L' ? 1 : -1; const knee = lp(I, B[`Bip01_${sd}_Calf`]).add(V(0, 7, 2));
    const down = V(m * 13, ground + 3, 48); const tgt = knee.clone().lerp(down, sm(bow));
    fingers(I, sd, bow > 0.5 ? 'flat' : 'relaxed', 1); ik(I, sd, tgt, V(m * 0.7, -1, -0.2), 1); });
};
/** a lying character (wrapper pitched −π/2) jolts up off the pillow: k 0…1 */
export const sitUp = (I: any, k: number) => { const B = I.bones, r = I.root; if (k <= 0.001) return;
  rot(B.Bip01_Spine, 1, 0, 0, k * 0.45, r); rot(B.Bip01_Spine1, 1, 0, 0, k * 0.4, r); rot(B.Bip01_Neck, 1, 0, 0, k * 0.2, r);
  (['L', 'R'] as const).forEach((sd) => rot(B[`Bip01_${sd}_UpperArm`], 1, 0, 0, -k * 0.6, r)); };
