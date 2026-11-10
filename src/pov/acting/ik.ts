import * as THREE from 'three';
import {smooth, hash, hashStr, clamp} from '../lib/math';
type V3 = [number, number, number];
/**
 * Arm acting on top of the mocap (kit v2026-11-02): two-bone arm IK with an elbow pole, hand orientation (fingers + thumb roll),
 * the reachable() anatomy guard (trunk twists first, no arm aimed behind the body), finger hand shapes on the Biped finger bones,
 * and the gesture library GEST. Root space: +x the character's left, +y up, +z forward, cm. Call resetTurn(I) once per person per frame.
 */
const q0 = new THREE.Quaternion(), pw = new THREE.Quaternion(), ax = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
export const rot = (b: THREE.Object3D | undefined, x: number, y: number, z: number, ang: number, root: THREE.Object3D) => {
  if (!b || Math.abs(ang) < 1e-5) return; ax.set(x, y, z).normalize().applyQuaternion(root.getWorldQuaternion(q0)); b.parent!.getWorldQuaternion(pw);
  b.quaternion.premultiply(pw.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(ax, ang)).multiply(pw)); b.updateMatrixWorld(true);
};
export const lp = (I: any, b: THREE.Object3D, out = new THREE.Vector3()) => I.root.worldToLocal(b.getWorldPosition(out));
/** world point → root-local (built from the person's state, so it is right even before the group has rendered) */
export const toLocal = (I: any, s: any, w: V3) => {
  I.root.updateMatrix();
  const G = new THREE.Matrix4().compose(new THREE.Vector3(s.x, s.y ?? 0, s.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw), new THREE.Vector3(I.scale, I.scale, I.scale));
  return new THREE.Vector3(...w).applyMatrix4(G.multiply(I.root.matrix).invert());
};
/** world → root space through the root's real world matrix. Unlike toLocal() this honours a wrap group's lift (y) and tilt
 *  (a character lying in bed / sitting on a raised bench); call after the wrap is placed and updateMatrixWorld'd. Use for new episodes. */
export const rootLocal = (I: any, w: V3) => { I.root.updateMatrixWorld(true); return new THREE.Vector3(...w).applyMatrix4(I.root.matrixWorld.clone().invert()); };
// ---------------- two-bone arm IK (root space: +x the character's left, +y up, +z forward; cm) ----------------
const qr = new THREE.Quaternion();
const boneQ = (I: any, b: THREE.Object3D) => I.root.getWorldQuaternion(qr).clone().invert().multiply(b.getWorldQuaternion(new THREE.Quaternion()));
/** rotate a bone so that root-space direction `from` turns toward `to`, by fraction k */
const turn = (I: any, bone: THREE.Object3D | undefined, from: THREE.Vector3, to: THREE.Vector3, k: number) => {
  if (!bone || k <= 1e-3 || from.lengthSq() < 1e-9 || to.lengthSq() < 1e-9) return;
  const q = new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
  const w = clamp(q.w, -1, 1), ang = 2 * Math.acos(w), sn = Math.sqrt(1 - w * w);
  if (ang < 1e-4 || sn < 1e-6) return; rot(bone, q.x / sn, q.y / sn, q.z / sn, ang * k, I.root);
};
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/**
 * World-space helpers for gesture targets (s = a PersonState: x, z, yaw; the character faces +z at yaw 0, its left is +x).
 * `onSide` moves a target d metres to the person's own left ('L') or right ('R') so each hand reaches on its own side and arms never
 * cross (at yaw Y the left is (cos Y, −sin Y)); `ahead` is a point d metres in front at height y.
 * Use them for every two-handed gesture (pounding a window, reaching for someone, holding something out) instead of raw world offsets,
 * which cross the arms as soon as the person faces another way.
 */
export const onSide = (s: {yaw: number}, sd: Side, w: [number, number, number], d: number): [number, number, number] => { const k = sd === 'L' ? d : -d; return [w[0] + Math.cos(s.yaw) * k, w[1], w[2] - Math.sin(s.yaw) * k]; };
export const ahead = (s: {x: number; z: number; yaw: number}, d: number, y: number): [number, number, number] => [s.x + Math.sin(s.yaw) * d, y, s.z + Math.cos(s.yaw) * d];
export type Side = 'L' | 'R';
/** the arm reaches `wrist`; the elbow bends toward `pole` (a direction), as a real elbow does — never a locked straight stick */
export const ik = (I: any, sd: Side, wrist: THREE.Vector3, pole: THREE.Vector3, k: number) => {
  const B = I.bones, ua = B[`Bip01_${sd}_UpperArm`], fa = B[`Bip01_${sd}_Forearm`], hd = B[`Bip01_${sd}_Hand`];
  if (!ua || !fa || !hd || k <= 1e-3) return;
  const a = lp(I, ua), b = lp(I, fa), c = lp(I, hd); const L1 = b.distanceTo(a), L2 = c.distanceTo(b);
  const v = wrist.clone().sub(a); const d = clamp(v.length(), Math.abs(L1 - L2) + 1, (L1 + L2) * 0.97); v.setLength(d);
  const n = v.clone().normalize(), x = (L1 * L1 + d * d - L2 * L2) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  const pp = pole.clone().sub(n.clone().multiplyScalar(pole.dot(n))); if (pp.lengthSq() < 1e-6) pp.set(0, -1, 0); pp.normalize();
  const E = a.clone().add(n.clone().multiplyScalar(x)).add(pp.multiplyScalar(h)), T = a.clone().add(v);
  turn(I, ua, b.clone().sub(a), E.clone().sub(a), k);
  const b2 = lp(I, fa), c2 = lp(I, hd); turn(I, fa, c2.clone().sub(b2), T.clone().sub(b2), k);
};
/** orient the hand: fingers along `fingers`, then roll so the thumb points along `thumb` (sets which way the palm faces) */
export const handTo = (I: any, sd: Side, fingers: THREE.Vector3, thumb: THREE.Vector3 | null, k: number) => {
  const hd = I.bones[`Bip01_${sd}_Hand`]; if (!hd || k <= 1e-3) return;
  turn(I, hd, V(1, 0, 0).applyQuaternion(boneQ(I, hd)), fingers, k);
  if (!thumb) return;
  const q = boneQ(I, hd), fx = V(1, 0, 0).applyQuaternion(q), z = V(0, 0, sd === 'R' ? 1 : -1).applyQuaternion(q);
  const tp = thumb.clone().sub(fx.clone().multiplyScalar(thumb.dot(fx))), zp = z.clone().sub(fx.clone().multiplyScalar(z.dot(fx)));
  if (tp.lengthSq() < 1e-6 || zp.lengthSq() < 1e-6) return; tp.normalize(); zp.normalize();
  rot(hd, fx.x, fx.y, fx.z, Math.atan2(fx.dot(zp.clone().cross(tp)), zp.dot(tp)) * k, I.root);
};
export const sh = (I: any, sd: Side) => lp(I, I.bones[`Bip01_${sd}_UpperArm`]);
export const hc = (I: any) => lp(I, I.bones.Bip01_Head).add(V(0, 9, 2));     // centre of the head
export const mid = (sd: Side) => (sd === 'R' ? 1 : -1);                         // +x is the character's left: toward the midline for the right arm
/**
 * Anatomy guard for aimed gestures. A person turns their chest toward what they point at (up to ~60°), and an arm
 * cannot point behind the body or far across it: the aim is clamped to what a shoulder can reach in the turned torso's
 * frame (forward-ish, a little behind only on its own side). Returns the reachable target (root space, cm).
 */
const turned = new WeakMap<object, number>();
export const reachable = (I: any, sd: Side, target: THREE.Vector3, k: number, reach = 80): THREE.Vector3 => {
  const B = I.bones, r = I.root, m = mid(sd);
  // 1) twist the trunk toward the target, once per frame per person (the rest of the turn is the arm's job)
  const chest = lp(I, B.Bip01_Spine2), v = target.clone().sub(chest), yaw = Math.atan2(v.x, v.z);
  let tw = turned.get(I) ?? NaN;
  if (Number.isNaN(tw)) {
    tw = Math.abs(yaw) > 0.4 ? clamp(yaw - Math.sign(yaw) * 0.4, -1.05, 1.05) * k : 0;
    if (tw) { rot(B.Bip01_Spine, 0, 1, 0, tw * 0.3, r); rot(B.Bip01_Spine1, 0, 1, 0, tw * 0.35, r); rot(B.Bip01_Spine2, 0, 1, 0, tw * 0.2, r); rot(B.Bip01_Neck, 0, 1, 0, tw * 0.3, r); rot(B.Bip01_Head, 0, 1, 0, tw * 0.25, r); }
    turned.set(I, tw);
  }
  const torso = tw * 0.85;
  // 2) clamp the direction from the shoulder in the torso's frame
  const s0 = sh(I, sd), d = target.clone().sub(s0); const dist = d.length(); d.normalize();
  const c = Math.cos(-torso), sn = Math.sin(-torso);
  let x = d.x * c + d.z * sn, z = -d.x * sn + d.z * c; const y = d.y;
  const out = -m * x;                        // toward this arm's own side
  const across = m * x;                      // across the chest
  if (across > 0.55) x = m * 0.55;
  const zMin = out > 0.55 ? -0.3 : 0.18;     // only on its own side may the hand go a little behind
  if (z < zMin) z = zMin;
  const n = Math.hypot(x, y, z) || 1; x /= n; z /= n;
  const yy = y / n, c2 = Math.cos(torso), s2 = Math.sin(torso);
  const dd = V(x * c2 + z * s2, yy, -x * s2 + z * c2);
  return s0.clone().add(dd.multiplyScalar(Math.min(dist, reach)));
};
/** call once per person per frame before their gestures (the trunk twist is applied at most once) */
export const resetTurn = (I: any) => { turned.delete(I); };
/**
 * Hand shapes on the Biped finger bones (Finger0 thumb … Finger4 little; joints n, n1, n2; local +z curls toward the palm).
 * Each entry: [base, middle, tip] curl in radians added to the rest pose, per finger; `spread` fans the fingers about local y.
 * Blended over the mocap's own fingers by k, so a gesture's fingers match what the hand is doing (a point uses the index finger, a press is a flat palm).
 */
export type HandShape = 'open' | 'flat' | 'point' | 'fist' | 'cup' | 'claw' | 'relaxed';
const SHAPES: Record<HandShape, {c: [number, number, number][]; spread: number}> = {
  open:    {c: [[0.05, -0.1, -0.1], [-0.12, -0.12, -0.1], [-0.12, -0.12, -0.1], [-0.12, -0.12, -0.1], [-0.12, -0.12, -0.1]], spread: 0.1},
  flat:    {c: [[0.0, -0.15, -0.15], [-0.15, -0.15, -0.12], [-0.15, -0.15, -0.12], [-0.15, -0.15, -0.12], [-0.15, -0.15, -0.12]], spread: 0.16},
  point:   {c: [[0.35, 0.55, 0.5], [-0.15, -0.12, -0.1], [1.45, 1.55, 0.9], [1.45, 1.55, 0.9], [1.4, 1.5, 0.9]], spread: 0},
  fist:    {c: [[0.45, 0.65, 0.6], [1.45, 1.55, 0.9], [1.45, 1.55, 0.9], [1.45, 1.55, 0.9], [1.4, 1.5, 0.9]], spread: 0},
  cup:     {c: [[0.15, 0.2, 0.2], [0.35, 0.4, 0.3], [0.35, 0.4, 0.3], [0.35, 0.4, 0.3], [0.35, 0.4, 0.3]], spread: 0.04},
  claw:    {c: [[0.1, 0.3, 0.4], [0.1, 0.9, 0.7], [0.1, 0.9, 0.7], [0.1, 0.9, 0.7], [0.1, 0.9, 0.7]], spread: 0.18},
  relaxed: {c: [[0.1, 0.15, 0.15], [0.25, 0.3, 0.2], [0.3, 0.35, 0.25], [0.35, 0.4, 0.25], [0.4, 0.45, 0.3]], spread: 0.02},
};
const _q = new THREE.Quaternion(), _qz = new THREE.Quaternion(), _qy = new THREE.Quaternion(), ZA = new THREE.Vector3(0, 0, 1), YA = new THREE.Vector3(0, 1, 0);
export const fingers = (I: any, sd: Side, shape: HandShape, k: number) => {
  if (k <= 1e-3) return; const B = I.bones; if (!B[`Bip01_${sd}_Finger1`]) return;
  const rest: Map<THREE.Object3D, THREE.Quaternion> = I._restQ ?? (I._restQ = new Map((I.rest ?? []).map(([b, , q]: any) => [b, q])));
  const S = SHAPES[shape];
  for (let n = 0; n < 5; n++) ['', '1', '2'].forEach((j, i) => {
    const b = B[`Bip01_${sd}_Finger${n}${j}`]; const r0 = rest.get(b); if (!b || !r0) return;
    _q.copy(r0).multiply(_qz.setFromAxisAngle(ZA, S.c[n][i]));
    if (i === 0 && n > 0) _q.multiply(_qy.setFromAxisAngle(YA, (n - 2.5) * S.spread * (sd === 'R' ? 1 : -1) * 0.5));
    b.quaternion.slerp(_q, Math.min(1, k));
  });
};
/** gesture library — every pose is wrist target + elbow pole + hand orientation, so arms bend like arms */
export const GEST = {
  stopPalm: (I: any, sd: Side, k: number, t = 0) => { fingers(I, sd, 'flat', k); const m = mid(sd); ik(I, sd, sh(I, sd).add(V(-m * 11, 8 + Math.sin(t * 2) * 1.5, 30)), V(-m * 0.3, -1, 0.25), k); handTo(I, sd, V(0, 1, 0.15), V(m, 0, 0), k); },
  point: (I: any, sd: Side, target0: THREE.Vector3, k: number) => { fingers(I, sd, 'point', k); const target = reachable(I, sd, target0, k); const m = mid(sd), s0 = sh(I, sd), dir = target.clone().sub(s0).normalize(); ik(I, sd, s0.clone().add(dir.clone().multiplyScalar(80)), V(-m * 0.5, -1, -0.4), k); handTo(I, sd, dir, V(0, 1, 0), k); },
  palmsDown: (I: any, sd: Side, k: number, pump = 0) => { fingers(I, sd, 'open', k); const m = mid(sd); ik(I, sd, sh(I, sd).add(V(m * 6, -16 + pump, 42)), V(-m * 0.8, -0.6, -0.4), k); handTo(I, sd, V(m * 0.25, -0.2, 1), V(m, 0, 0), k); },
  shh: (I: any, sd: Side, k: number) => { fingers(I, sd, 'point', k); const m = mid(sd); ik(I, sd, hc(I).add(V(-m * 1, -17, 13)), V(-m, -1, -0.2), k); handTo(I, sd, V(m * 0.1, 1, 0.1), V(0, 0, -1), k); },
  holdRoom: (I: any, sd: Side, k: number, t = 0) => { fingers(I, sd, 'flat', k); const m = mid(sd); ik(I, sd, sh(I, sd).add(V(-m * 2, 6 + Math.sin(t * 2.5) * 2, 44)), V(-m * 0.8, -1, -0.2), k); handTo(I, sd, V(0, 1, 0.3), V(m, 0, 0), k); },
  reach: (I: any, sd: Side, target0: THREE.Vector3, k: number) => { fingers(I, sd, 'open', k); const target = reachable(I, sd, target0, k, 62); const m = mid(sd); ik(I, sd, target, V(-m * 0.6, -1, -0.2), k); handTo(I, sd, target.clone().sub(sh(I, sd)).normalize(), V(0, 1, 0), k); },
  /** palm pressed flat on a pane in front (target = where the palm lands), fingers up and slightly splayed outward */
  glassPalm: (I: any, sd: Side, target: THREE.Vector3, k: number) => { const m = mid(sd); fingers(I, sd, 'claw', k); ik(I, sd, target, V(-m * 0.9, -0.7, -0.2), k); handTo(I, sd, V(-m * 0.25, 1, 0.05), V(-m, 0, 0), k); },
  shrug: (I: any, sd: Side, k: number) => { fingers(I, sd, 'open', k); const m = mid(sd); ik(I, sd, sh(I, sd).add(V(-m * 16, -24, 24)), V(-m, -1, -0.2), k); handTo(I, sd, V(-m * 0.45, 0.05, 1), V(-m, 0, 0), k); },
  earCup: (I: any, sd: Side, k: number) => { fingers(I, sd, 'cup', k); const m = mid(sd); ik(I, sd, hc(I).add(V(-m * 14, -6, -4)), V(-m, -1, -0.4), k); handTo(I, sd, V(0, 1, -0.25), V(m, 0, 0.3), k); },
  /** crouched, arms round the knees */
  hugKnees: (I: any, sd: Side, k: number) => { fingers(I, sd, 'relaxed', k); const m = mid(sd); ik(I, sd, V(m * 6, 42, 34), V(-m * 0.9, -0.2, 0.6), k); handTo(I, sd, V(m * 0.8, -0.2, 0.3), V(0, 1, 0), k); },
  coverHead: (I: any, sd: Side, k: number) => { fingers(I, sd, 'cup', k); const m = mid(sd); ik(I, sd, hc(I).add(V(-m * 5, 12, 3)), V(-m * 0.8, 0, 1), k); handTo(I, sd, V(m, 0.35, 0.1), null, k); },
  beckon: (I: any, sd: Side, target0: THREE.Vector3, k: number, curl: number) => {
    fingers(I, sd, curl > 0.5 ? 'cup' : 'open', k);
    // someone behind her: she doesn't throw the arm back over the shoulder — a low "come on" at her side, palm back, while she looks round
    { const s1 = sh(I, sd); if (target0.z - s1.z < 0) { const m = mid(sd); reachable(I, sd, target0, k); ik(I, sd, sh(I, sd).add(V(-m * 22, -38 + curl * 8, 6 - curl * 14)), V(-m * 0.4, -0.3, 1), k); handTo(I, sd, V(-m * 0.3, -0.6, -0.4 - curl * 0.5), V(0, 0, 1), k); return; } }
    const target = reachable(I, sd, target0, k); const m = mid(sd), s0 = sh(I, sd), dir = target.clone().sub(s0).normalize(); ik(I, sd, s0.clone().add(dir.clone().multiplyScalar(62 - curl * 18)).add(V(0, 8 * curl, 0)), V(-m * 0.5, -1, -0.3), k); handTo(I, sd, dir.clone().add(V(0, 0.4 + curl * 1.4, 0)).normalize(), V(0, 0, 1), k); },
};

export const _m = {smooth, hash, hashStr, clamp};
