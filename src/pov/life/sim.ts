import {POSES, blendPose, PoseId, Pose, Ctx} from '../cast/poses';
export type Held = 'none' | 'cup' | 'mug' | 'phone' | 'box' | 'papers' | 'clipboard' | 'laptop' | 'bag';
import {findPath, place, pathLen} from './nav';
import {ST} from '../sets/layout';
import {V2, hash, hashStr, smooth, lerpAng, angDiff, yawTo, clamp, lerp} from '../lib/math';

export type Pace = 'walk' | 'hurry' | 'amble' | 'push';
type Common = {label: string; next?: string; mark?: string; held?: Held; heldL?: Held; front?: Held};
export type Act =
  | (Common & {k: 'go'; to: string | V2; pace?: Pace; upper?: PoseId; hide?: boolean})
  | (Common & {k: 'do'; pose: PoseId; dur: number; face?: string | V2; meet?: string; waitPose?: PoseId; talk?: 'self' | 'turns'; yaw?: number});
export type AgentDef = {id: string; start: string | V2; startYaw?: number; t0: number; plan: Act[]; hideAtEnd?: boolean; cart?: boolean};
const SPEED: Record<Pace, number> = {walk: 1.25, hurry: 1.95, amble: 1.0, push: 1.0};
const STRIDE = 1.45, RAMP = 0.35;

type Seg = {kind: 'walk' | 'do' | 'wait'; t0: number; t1: number; label: string; next: string; path: V2[]; cum: number[]; len: number; v: number; odo0: number;
  pose: PoseId; upper?: PoseId; held: Held; heldL: Held; front: Held; pos0: V2; pos1: V2; yaw0: number; yawT: number; face?: string | V2; talk?: 'self' | 'turns'; meet?: string; prev: PoseId; hide?: boolean};
export type Compiled = {def: AgentDef; segs: Seg[]; arrivals: Record<string, number>; marks: Record<string, number>; end: number};

const cumOf = (p: V2[]) => { const c = [0]; for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return c; };
const resolve = (s: string | V2): V2 => (typeof s === 'string' ? place(s) : s);
const stYaw = (s: string | V2): number | undefined => (typeof s === 'string' ? ST[s][2] : undefined);
const headingAt = (path: V2[], cum: number[], d: number): number => {
  const dd = clamp(d, 0, cum[cum.length - 1] - 1e-6); let i = 1; while (i < cum.length - 1 && cum[i] < dd) i++;
  return Math.atan2(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
};

export const compile = (def: AgentDef, meetStart: Record<string, number>): Compiled => {
  const segs: Seg[] = [], arrivals: Record<string, number> = {}, marks: Record<string, number> = {};
  let t = def.t0, pos = resolve(def.start), yaw = def.startYaw ?? (typeof def.start === 'string' ? ST[def.start][2] : 0), odo = 0, prev: PoseId = 'stand';
  let held: Held = 'none', heldL: Held = 'none', front: Held = 'none'; let pendingYaw: number | undefined = typeof def.start === 'string' ? ST[def.start][2] : def.startYaw;
  const nextLabel = (i: number) => (def.plan[i + 1] ? def.plan[i + 1].label : '—');
  def.plan.forEach((a, i) => {
    if (a.held !== undefined) held = a.held; if (a.heldL !== undefined) heldL = a.heldL; if (a.front !== undefined) front = a.front;
    if (a.mark) marks[a.mark] = t;
    if (a.k === 'go') {
      const to = resolve(a.to), path = findPath(pos, to), cum = cumOf(path), len = cum[cum.length - 1], v = SPEED[a.pace ?? 'walk'];
      const dur = len / v + RAMP;
      const yE = headingAt(path, cum, len); pendingYaw = stYaw(a.to);
      segs.push({kind: 'walk', t0: t, t1: t + dur, label: a.label, next: a.next ?? nextLabel(i), path, cum, len, v, odo0: odo, pose: a.pace === 'push' ? 'push' : 'walk', upper: a.upper, held, heldL, front, pos0: pos, pos1: to, yaw0: yaw, yawT: yE, prev, hide: a.hide});
      t += dur; pos = to; yaw = yE; odo += len; prev = 'walk';
    } else {
      const arr = t; let start = t;
      if (a.meet) { arrivals[a.meet] = Math.max(arrivals[a.meet] ?? 0, arr); start = Math.max(arr, meetStart[a.meet] ?? arr); }
      if (start > arr + 0.05) {
        segs.push({kind: 'wait', t0: arr, t1: start, label: 'รอ — ' + a.label, next: a.label, path: [pos, pos], cum: [0, 0], len: 0, v: 0, odo0: odo, pose: a.waitPose ?? 'stand', held, heldL, front, pos0: pos, pos1: pos, yaw0: yaw, yawT: yaw, face: a.face, prev});
        prev = a.waitPose ?? 'stand'; t = start;
      }
      const yT = a.yaw ?? pendingYaw ?? yaw;
      segs.push({kind: 'do', t0: t, t1: t + a.dur, label: a.label, next: a.next ?? nextLabel(i), path: [pos, pos], cum: [0, 0], len: 0, v: 0, odo0: odo, pose: a.pose, held, heldL, front, pos0: pos, pos1: pos, yaw0: yaw, yawT: yT, face: a.face, talk: a.talk, meet: a.meet, prev});
      t += a.dur; prev = a.pose;
    }
  });
  return {def, segs, arrivals, marks, end: t};
};

// ---------- evaluation (pure functions of time) ----------
export type World = {agents: Compiled[]; byId: Record<string, Compiled>; marks: Record<string, number>; meets: Record<string, {ids: string[]; start: number}>};
export const build = (defs: AgentDef[]): World => {
  let meetStart: Record<string, number> = {}; let comp: Compiled[] = [];
  for (let pass = 0; pass < 8; pass++) {
    comp = defs.map((d) => compile(d, meetStart));
    const next: Record<string, number> = {};
    comp.forEach((c) => Object.entries(c.arrivals).forEach(([k, v]) => (next[k] = Math.max(next[k] ?? 0, v))));
    Object.keys(next).forEach((k) => (next[k] = Math.max(next[k], meetStart[k] ?? 0)));
    const same = Object.keys(next).every((k) => Math.abs(next[k] - (meetStart[k] ?? -1)) < 1e-6); meetStart = next; if (same && pass > 0) break;
  }
  const marks: Record<string, number> = {}; comp.forEach((c) => Object.assign(marks, c.marks));
  const meets: World['meets'] = {};
  comp.forEach((c) => c.segs.forEach((s) => { if (s.meet) { (meets[s.meet] ??= {ids: [], start: meetStart[s.meet]}).ids.includes(c.def.id) || meets[s.meet].ids.push(c.def.id); } }));
  return {agents: comp, byId: Object.fromEntries(comp.map((c) => [c.def.id, c])), marks, meets};
};

export type Base = {id: string; x: number; z: number; yaw: number; moving: boolean; visible: boolean; seg: Seg | null; tau: number; d: number; speed: number; heading: number};
const segAt = (c: Compiled, t: number): Seg | null => { const s = c.segs; if (!s.length || t < s[0].t0) return null; for (let i = 0; i < s.length; i++) if (t < s[i].t1) return s[i]; return s[s.length - 1]; };
const walkD = (T: number, L: number, v: number, tau: number) => { const r = RAMP; if (tau <= 0) return {d: 0, sp: 0}; if (tau >= T) return {d: L, sp: 0};
  if (tau < r) return {d: v * tau * tau / (2 * r), sp: v * tau / r}; if (tau <= T - r) return {d: v * (tau - r / 2), sp: v}; const u = T - tau; return {d: L - v * u * u / (2 * r), sp: v * u / r}; };

export const posAt = (w: World, id: string, t: number): V2 => {
  const c = w.byId[id]; const seg = segAt(c, t); if (!seg) return resolve(c.def.start);
  if (seg.kind !== 'walk') return seg.pos0;
  const T = seg.t1 - seg.t0, {d} = walkD(T, seg.len, seg.v, Math.max(0, t - seg.t0));
  let i = 1; while (i < seg.cum.length - 1 && seg.cum[i] < d) i++;
  const u = seg.cum[i] - seg.cum[i - 1] > 0 ? clamp((d - seg.cum[i - 1]) / (seg.cum[i] - seg.cum[i - 1])) : 0;
  return [lerp(seg.path[i - 1][0], seg.path[i][0], u), lerp(seg.path[i - 1][1], seg.path[i][1], u)];
};
export const baseAt = (w: World, id: string, t: number): Base => {
  const c = w.byId[id], first = c.segs[0];
  const lastSeg = c.segs[c.segs.length - 1];
  const visible = t >= c.def.t0 - 1e-6 && !(c.def.hideAtEnd && t > c.end);
  const seg = segAt(c, t);
  if (!seg) { const p = resolve(c.def.start); return {id, x: p[0], z: p[1], yaw: first?.yaw0 ?? 0, moving: false, visible, seg: first ?? null, tau: 0, d: 0, speed: 0, heading: first?.yaw0 ?? 0}; }
  const tau = Math.max(0, t - seg.t0);
  if (seg.kind === 'walk') {
    const T = seg.t1 - seg.t0, {d, sp} = walkD(T, seg.len, seg.v, tau);
    let i = 1; while (i < seg.cum.length - 1 && seg.cum[i] < d) i++;
    const u = seg.cum[i] - seg.cum[i - 1] > 0 ? clamp((d - seg.cum[i - 1]) / (seg.cum[i] - seg.cum[i - 1])) : 0;
    const x = lerp(seg.path[i - 1][0], seg.path[i][0], u), z = lerp(seg.path[i - 1][1], seg.path[i][1], u);
    const hs = [-0.35, 0, 0.35].map((o) => headingAt(seg.path, seg.cum, d + o + 0.2)); // look-ahead smoothing around corners
    const hx = hs.reduce((a, h) => a + Math.sin(h), 0), hz = hs.reduce((a, h) => a + Math.cos(h), 0); const heading = Math.atan2(hx, hz);
    const yaw = lerpAng(seg.yaw0, heading, smooth(tau / 0.35));
    const endTurn = lerpAng(yaw, seg.yawT, smooth((tau - (T - 0.3)) / 0.3) * 0); // final facing handled by next segment
    return {id, x, z, yaw: endTurn, moving: sp > 0.05, visible, seg, tau, d, speed: sp, heading};
  }
  let yaw = lerpAng(seg.yaw0, seg.yawT, smooth(tau / 0.5));
  if (seg.face) { const tp: V2 = typeof seg.face === 'string' ? posAt(w, seg.face, t) : seg.face; yaw = lerpAng(seg.yaw0, yawTo(seg.pos0, tp), smooth(tau / 0.5)); }
  return {id, x: seg.pos0[0], z: seg.pos0[1], yaw, moving: false, visible, seg, tau, d: 0, speed: 0, heading: yaw};
};
