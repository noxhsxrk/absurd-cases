/**
 * Embodied head camera building blocks (from mrt-train-zero EP1 `headcam.ts`, made generic).
 *
 *   const head = makeGaze({eye: EYE, keys: [[0, KNEES], [2.1, MAY], [9.4, WIN, 1.6]], zooms: [[12, 15.5, 38]]});
 *   const {yaw, pitch, speed} = head.at(t);  const fov = 66 - head.zoomAt(t) + startle(t, tStartle).fov;
 *
 * - Gaze keys `[time, target, slowSeconds?]`: the head turns to each target with a damped spring (ω 8.5, ζ 0.72) after a
 *   short reaction delay, with a little overshoot. A 3rd element makes it a slow deliberate turn: the spring's target is
 *   walked from the previous key over that many seconds (ease in-out) instead of snapping.
 * - Zooms `[from, to, degrees, rampIn?]`: eased push-ins (cubic in-out, ~0.9 s in, 0.45 s out before `to`). Use −35…−40° for a
 *   far speaker, −40…−45° for text that must be read, −30° with rampIn 0.2 for a jump-scare snap.
 * - `toBody`: hands resting on the lap belong to the body; counter-rotate them about the eye by the head's turn away from the
 *   look they were authored for, so they slide out of frame when the head lifts.
 * Everything is deterministic: the spring is integrated on a fixed 1/120 s grid from t = 0 and cached.
 */
export type V3 = [number, number, number];
export type GazeKey = [number, V3, number?];
export type Zoom = [number, number, number, number?];
export type Angles = {yaw: number; pitch: number};

export const sm = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
export const easeInOut3 = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
/** yaw/pitch for a camera at p looking at q (camera looks down −z at yaw 0) */
export const aimAngles = (p: V3, q: V3): Angles => { const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2]; return {yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz))}; };
export const unwrap = (a: number, ref: number) => { while (a - ref > Math.PI) a -= 2 * Math.PI; while (a - ref < -Math.PI) a += 2 * Math.PI; return a; };

export const zoomAt = (zooms: Zoom[], t: number) => Math.max(0, ...zooms.map(([a, b, deg, rin]) => deg * easeInOut3((t - a) / (rin ?? 0.9)) * (1 - easeInOut3((t - b + 0.45) / 0.45))));

export type GazeOpts = {eye: V3 | ((t: number) => V3); keys: GazeKey[]; zooms?: Zoom[]; omega?: number; zeta?: number; delay?: number};
export const makeGaze = ({eye, keys, zooms = [], omega = 8.5, zeta = 0.72, delay = 0.15}: GazeOpts) => {
  const E = typeof eye === 'function' ? eye : () => eye;
  const K = keys.slice().sort((a, b) => a[0] - b[0]);
  const targetAt = (t: number): Angles => {
    let i = 0; while (i + 1 < K.length && t >= K[i + 1][0] + delay) i++;
    const e = E(t), a = aimAngles(e, K[i][1]), dur = K[i][2];
    if (!dur || i === 0) return a;
    const b = aimAngles(e, K[i - 1][1]), k = sm((t - K[i][0] - delay) / dur);
    return {yaw: b.yaw + (unwrap(a.yaw, b.yaw) - b.yaw) * k, pitch: b.pitch + (a.pitch - b.pitch) * k};
  };
  const DT = 1 / 120; const cache = new Map<number, {yaw: number; pitch: number; vy: number; vp: number}>();
  const at = (t: number) => {
    const n = Math.max(0, Math.round(t / DT)); let k = n; while (k > 0 && !cache.has(k)) k--;
    const s0 = cache.get(k) ?? (() => { const a = targetAt(0); return {yaw: a.yaw, pitch: a.pitch, vy: 0, vp: 0}; })(); if (!cache.has(k)) k = 0;
    let {yaw, pitch, vy, vp} = s0;
    for (let i = k; i < n; i++) {
      const tg = targetAt(i * DT); const ty = unwrap(tg.yaw, yaw);
      vy += (omega * omega * (ty - yaw) - 2 * zeta * omega * vy) * DT; yaw += vy * DT;
      vp += (omega * omega * (tg.pitch - pitch) - 2 * zeta * omega * vp) * DT; pitch += vp * DT;
      if ((i + 1) % 30 === 0) cache.set(i + 1, {yaw, pitch, vy, vp});
    }
    return {yaw, pitch, speed: Math.abs(vy)};
  };
  return {at, targetAt, zoomAt: (t: number) => zoomAt(zooms, t)};
};

/** startle at time t0: head jerks back/up (exp decay 7/s), hard short shake, FOV kick +4° */
export const startle = (t: number, t0: number) => {
  const u = t - t0, jerk = u > 0 ? Math.exp(-u * 7) * Math.min(1, u / 0.06) : 0, shake = u > 0 && u < 0.5 ? Math.sin(u * 70) * (0.5 - u) * 0.02 : 0;
  return {jerk, shake, dz: -jerk * 0.12, dy: jerk * 0.04, pitch: jerk * 0.22, roll: jerk * 0.08, fov: jerk * 4};
};

/** a hand in camera space (FpvArm conventions) */
export type CamArm = {wrist: V3; fingers: V3; palm: V3; body?: boolean};
/**
 * Lap/knee hands authored for the look `ref` (aimAngles(eye, knees)): counter-rotate about the eye by the head's turn away from it.
 * Drop the arm when it leaves the frame (e.g. keep only `wrist[1] > -0.75 && wrist[2] < 0`).
 */
export const toBody = <A extends CamArm>(a: A, ref: Angles, yaw: number, pitch: number): A => {
  if (!a.body) return a;
  const dy = unwrap(yaw - ref.yaw, 0), dp = pitch - ref.pitch;
  const rot = (v: V3): V3 => {
    const c = Math.cos(-dp), sn = Math.sin(-dp); const y1 = v[1] * c - v[2] * sn, z1 = v[1] * sn + v[2] * c;
    const cy = Math.cos(-dy), sy = Math.sin(-dy); return [v[0] * cy + z1 * sy, y1, -v[0] * sy + z1 * cy];
  };
  return {...a, wrist: rot(a.wrist), fingers: rot(a.fingers), palm: rot(a.palm)};
};
/** camera-space hands keep their on-screen size when the FOV narrows (rest FOV 66°) */
export const fovScale = (fov: number, rest = 66) => Math.min(1, Math.tan((fov / 2) * Math.PI / 180) / Math.tan((rest / 2) * Math.PI / 180));
