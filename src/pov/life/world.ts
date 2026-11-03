import {POSES, blendPose, Pose, Ctx} from '../cast/poses';
import {World, baseAt, posAt, Base, Held} from './sim';
import {hash, hashStr, smooth, angDiff, yawTo, clamp, lerp, V2} from '../lib/math';

export type PersonState = {id: string; x: number; z: number; yaw: number; pose: Pose; held: Held; heldL: Held; front: Held; visible: boolean; moving: boolean; label: string; next: string; talking: boolean; path?: V2[]; kind?: string; odo: number; poseId: string; talkK: number; upper?: string; fear?: number; cart?: {x: number; z: number; yaw: number}};
const STRIDE = 1.45;

const talkingAt = (w: World, b: Base, id: string, t: number): boolean => {
  const s = b.seg; if (!s) return false;
  if (s.talk === 'self') return hash(Math.floor(t / 1.35) + hashStr(id) * 0.07) > 0.28;
  if (s.talk === 'turns' && s.meet) {
    const m = w.meets[s.meet]; const idx = m.ids.indexOf(id), n = m.ids.length; const k = Math.floor((t - s.t0) / 2.3);
    const sp = (k + (hash(k * 7 + hashStr(s.meet)) > 0.7 ? 1 : 0)) % n; return sp === idx;
  }
  return false;
};
const mergeUpper = (legs: Pose, up: Pose): Pose => ({...legs, aL: up.aL, aR: up.aR, hp: up.hp, hy: up.hy, hr: up.hr, face: up.face});

export const stateAt = (w: World, t: number): PersonState[] => {
  const ids = w.agents.map((a) => a.def.id);
  const bases = ids.map((id) => baseAt(w, id, t));
  // --- stateless separation: push overlapping people apart; people who are busy at a spot get pushed less ---
  const off = ids.map(() => [0, 0] as V2); const R = 0.62;
  const wt = bases.map((b) => (!b.seg ? 0.05 : b.moving ? 1 : b.seg.pose.startsWith('sit') ? 0.03 : 0.25));
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = bases[i], b = bases[j]; if (!a.visible || !b.visible) continue;
    const dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz); if (d >= R || d < 1e-4) continue;
    const push = R - d, sa = wt[i] / (wt[i] + wt[j]), sb = 1 - sa;
    off[i][0] += (dx / d) * push * sa; off[i][1] += (dz / d) * push * sa; off[j][0] -= (dx / d) * push * sb; off[j][1] -= (dz / d) * push * sb;
  }
  return ids.map((id, i) => {
    const b = bases[i], seg = b.seg!, c = w.byId[id], seed = hashStr(id) * 0.013;
    const talking = talkingAt(w, b, id, t);
    const talkK = [-0.3, -0.15, 0, 0.15, 0.3].reduce((a, d) => a + (talkingAt(w, b, id, t + d) ? 0.2 : 0), 0);
    const ctx: Ctx = {t, phase: seg ? 2 * Math.PI * (seg.odo0 + b.d) / STRIDE : 0, talking, seed, speed: b.speed};
    let pose: Pose;
    if (!seg) pose = POSES.stand(ctx);
    else if (seg.kind === 'walk') {
      const base = POSES[seg.pose]({...ctx, speed: Math.max(b.speed, 0.6)});
      pose = seg.upper ? mergeUpper(base, POSES[seg.upper](ctx)) : base;
      if (b.tau < 0.3 && seg.prev !== 'walk') pose = blendPose(POSES[seg.prev]({...ctx, speed: 0}), pose, smooth(b.tau / 0.3));
    } else {
      const to = POSES[seg.pose](ctx);
      pose = b.tau < 0.5 && seg.prev !== seg.pose ? blendPose(POSES[seg.prev]({...ctx, speed: 0}), to, smooth(b.tau / 0.5)) : to;
    }
    // --- ambient glances: every few seconds, look at the nearest other person who is moving (stateless windows) ---
    let hy = 0; const W = 3.1, o = hash(hashStr(id)) * W, wi = Math.floor((t + o) / W), loc = (t + o) - wi * W;
    if (seg && !seg.face && hash(wi * 13 + hashStr(id)) < 0.55 && loc > 0.7 && loc < 2.3) {
      const env = smooth((loc - 0.7) / 0.35) * (1 - smooth((loc - 1.95) / 0.35)); const tm = (wi + 0.5) * W - o;
      let best = -1, bd = 5.2; const me = posAt(w, id, tm);
      ids.forEach((o2, k) => { if (k === i) return; const bb = bases[k]; if (!bb.visible) return; const p = posAt(w, o2, tm); const d = Math.hypot(p[0] - me[0], p[1] - me[1]); if (d < bd && baseAt(w, o2, tm).moving) { bd = d; best = k; } });
      if (best >= 0) { const p = posAt(w, ids[best], t); const rel = angDiff(b.yaw, yawTo([b.x, b.z], p)); if (Math.abs(rel) < 1.9) hy = clamp(rel, -1.0, 1.0) * env; }
    }
    if (seg?.face) { const tp = typeof seg.face === 'string' ? posAt(w, seg.face, t) : seg.face; const rel = angDiff(b.yaw, yawTo([b.x, b.z], tp)); hy = clamp(rel, -0.5, 0.5) * 0.5; }
    pose = {...pose, hy: pose.hy + hy};
    let cart: PersonState['cart'];
    if (c.def.cart) { let h = c.segs[0].yaw0; for (const s of c.segs) if (s.kind === 'walk' && s.t0 <= t) h = t >= s.t1 ? s.yawT : b.heading; cart = {x: b.x + off[i][0] + Math.sin(h) * 0.86, z: b.z + off[i][1] + Math.cos(h) * 0.86, yaw: h}; }
    return {id, x: b.x + off[i][0], z: b.z + off[i][1], yaw: b.yaw, pose, held: seg?.held ?? 'none', heldL: seg?.heldL ?? 'none', front: seg?.front ?? 'none', visible: b.visible, moving: b.moving, label: seg?.label ?? '', next: seg?.next ?? '', talking, cart, path: seg?.kind === 'walk' ? seg.path : undefined, kind: seg?.kind, odo: seg ? seg.odo0 + b.d : 0, talkK, poseId: seg ? (seg.kind === 'walk' ? seg.pose : seg.pose) : 'stand', upper: seg?.upper};
  });
};
let memo: {w: World; t: number; s: PersonState[]} | null = null;
export const stateMemo = (w: World, t: number) => (memo && memo.w === w && memo.t === t ? memo.s : (memo = {w, t, s: stateAt(w, t)}).s);
