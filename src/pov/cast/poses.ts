import {clamp, lerp, smooth, hash} from '../lib/math';
// Angles in radians, "forward-positive": sp = shoulder swing forward, sr = arm out to the side, el = elbow flex (forearm forward/up),
// hp = hip swing forward, kn = knee flex (shin backward). The rig converts to three.js axes.
export type Arm = {sp: number; sr: number; el: number};
export type Leg = {hp: number; kn: number};
export type Face = {mouth: number; smile: number; brow: number; blink: number};
export type Pose = {drop: number; tp: number; tw: number; tr: number; hp: number; hy: number; hr: number; aL: Arm; aR: Arm; lL: Leg; lR: Leg; face: Face; seated: boolean};
export type Ctx = {t: number; phase: number; talking: boolean; seed: number; speed: number};
export type PoseId = 'stand' | 'walk' | 'sitType' | 'sitIdle' | 'sitPhone' | 'sitDrink' | 'sitStretch' | 'sitTalk' | 'standPhone' | 'standDrink' | 'chat' | 'carry' | 'read' | 'watch' | 'brew' | 'bin' | 'push' | 'sign' | 'handOver' | 'phoneCheck' | 'wave' | 'laugh' | 'point' | 'think' | 'sitGroove'
  | 'crouch' | 'crouchTalk' | 'nervous' | 'lookAround' | 'sitLook' | 'sitNervous' | 'sitWrite' | 'sitFace' | 'listenDoor' | 'tryDoor' | 'pushDesk' | 'press' | 'hunch';

const A = (sp = 0.05, sr = 0.1, el = 0.2): Arm => ({sp, sr, el});
const L = (hp = 0, kn = 0): Leg => ({hp, kn});
export const blink = (t: number, seed: number) => { const per = 2.4 + hash(seed) * 2.2; const k = (t + hash(seed + 3) * per) % per; return k < 0.12 ? 1 - Math.abs(k - 0.06) / 0.06 : 0; };

export const idle = (c: Ctx): Pose => {
  const b = Math.sin(c.t * 1.9 + c.seed) * 0.5 + 0.5;            // breathing
  const sh = Math.sin(c.t * 0.35 + c.seed * 2);                    // slow weight shift
  return {drop: -0.012 * b, tp: 0.02 + 0.012 * b, tw: sh * 0.03, tr: sh * 0.025, hp: 0.0, hy: 0, hr: sh * 0.02,
    aL: A(0.04 + 0.02 * b, 0.1, 0.18), aR: A(0.04 + 0.02 * b, 0.1, 0.18), lL: L(sh * 0.03, 0.02), lR: L(-sh * 0.03, 0.02),
    face: {mouth: 0, smile: 0.1, brow: 0, blink: blink(c.t, c.seed)}, seated: false};
};
const talkJaw = (c: Ctx) => c.talking ? 0.25 + 0.5 * Math.abs(Math.sin(c.t * 11 + c.seed)) * (0.6 + 0.4 * Math.sin(c.t * 3.1)) : 0;
const gest = (c: Ctx, k = 1) => c.talking ? Math.sin(c.t * 4.1 + c.seed) * 0.18 * k : 0;
const seat = (p: Pose): Pose => ({...p, seated: true, drop: -0.46, tp: 0.05, lL: L(1.5, 1.5), lR: L(1.5, 1.5)});

export const POSES: Record<PoseId, (c: Ctx) => Pose> = {
  stand: (c) => idle(c),
  walk: (c) => {
    const s = clamp(c.speed / 1.4, 0.4, 1.9), a = 0.5 * Math.min(1.3, s), p = c.phase;
    const sw = Math.sin(p), sw2 = Math.sin(p + Math.PI);
    const base = idle(c);
    return {...base, drop: -0.03 - 0.035 * Math.abs(Math.cos(p)) * s, tp: 0.05 + 0.05 * (s - 1) , tw: -sw * 0.12 * s, tr: sw * 0.03,
      aL: A(sw2 * 0.55 * s, 0.07, 0.25 + Math.max(0, sw2) * 0.5 * s), aR: A(sw * 0.55 * s, 0.07, 0.25 + Math.max(0, sw) * 0.5 * s),
      lL: L(sw * a * 1.2, Math.max(0, -Math.sin(p + 0.9)) * 0.95 * s), lR: L(sw2 * a * 1.2, Math.max(0, -Math.sin(p + Math.PI + 0.9)) * 0.95 * s)};
  },
  sitIdle: (c) => { const b = idle(c); return seat({...b, aL: A(0.5, 0.1, 1.0), aR: A(0.5, 0.1, 1.0)}); },
  sitType: (c) => { const b = idle(c); const k = Math.sin(c.t * 17 + c.seed), k2 = Math.sin(c.t * 13 + c.seed * 2); const burst = smooth(Math.sin(c.t * 0.9 + c.seed) * 3 + 1.2);
    return seat({...b, tp: 0.16, hp: 0.22 + 0.05 * Math.sin(c.t * 0.7 + c.seed), aL: A(0.55 + 0.04 * k * burst, 0.12, 0.95 + 0.07 * k2 * burst), aR: A(0.55 + 0.04 * k2 * burst, 0.12, 0.95 + 0.07 * k * burst), face: {...b.face, brow: -0.1}}); },
  sitPhone: (c) => { const b = idle(c); return seat({...b, hr: -0.08, hy: 0.1, aR: A(0.95, 0.42, 2.15 + gest(c, 0.3)), aL: A(0.5, 0.1, 1.0), face: {...b.face, mouth: talkJaw(c), smile: 0.2}}); },
  sitDrink: (c) => { const b = idle(c); const k = smooth(Math.sin(c.t * 0.8 + c.seed) * 2 + 0.4); return seat({...b, tp: 0.08 - 0.05 * k, hp: -0.1 * k, aR: A(0.5 + 0.4 * k, 0.1, 1.0 + 1.15 * k), aL: A(0.5, 0.1, 1.0)}); },
  sitStretch: (c) => { const b = idle(c); const k = smooth(Math.sin(c.t * 0.9 + c.seed) * 1.6 + 0.2); return seat({...b, tp: -0.12 * k, hp: -0.25 * k, aL: A(2.6 * k + 0.5 * (1 - k), 0.5 * k, 0.4 * k + 1 - k), aR: A(2.6 * k + 0.5 * (1 - k), 0.5 * k, 0.4 * k + 1 - k), face: {...b.face, mouth: 0.4 * k, brow: 0.2}}); },
  sitTalk: (c) => { const b = idle(c); return seat({...b, tw: 0.5, tp: 0.05, hy: 0.35, aR: A(0.7 + gest(c, 2), 0.35, 1.2), aL: A(0.5, 0.1, 1.0), face: {...b.face, mouth: talkJaw(c), smile: 0.15}}); },
  standPhone: (c) => { const b = idle(c); const g = Math.sin(c.t * 1.7 + c.seed); return {...b, hy: 0.15 * Math.sin(c.t * 0.9 + c.seed), hr: -0.1, aR: A(0.95, 0.42, 2.15), aL: A(0.35 + 0.35 * Math.max(0, g) * (c.talking ? 1.5 : 0.3), 0.3 + 0.25 * Math.max(0, g), 0.9 + 0.3 * g), face: {...b.face, mouth: talkJaw(c), brow: 0.15}}; },
  standDrink: (c) => { const b = idle(c); const k = smooth(Math.sin(c.t * 0.7 + c.seed) * 2.2 + 0.6); return {...b, hp: -0.18 * k, aR: A(0.55 + 0.35 * k, 0.1, 1.0 + 1.1 * k), aL: A(0.2, 0.15, 0.5), face: {...b.face, smile: 0.25}}; },
  chat: (c) => { const b = idle(c); const nod = c.talking ? 0 : Math.max(0, Math.sin(c.t * 2.3 + c.seed * 3)) * 0.12;
    return {...b, hp: nod + (c.talking ? -0.03 : 0.04), hy: Math.sin(c.t * 0.8 + c.seed) * 0.08, tw: b.tw + gest(c, 0.4), aR: A(0.5 + gest(c, 2.2) + 0.25 * (c.talking ? 1 : 0), 0.2 + 0.15 * (c.talking ? 1 : 0), 1.05 + gest(c, 1.2)), aL: c.talking ? A(0.4 + gest(c, 1.5), 0.25, 0.9) : A(0.25, 0.1, 0.5), face: {...b.face, mouth: talkJaw(c), smile: 0.3}}; },
  carry: (c) => { const b = idle(c); return {...b, tp: b.tp + 0.04, aL: A(1.25, -0.12, 1.15), aR: A(1.25, -0.12, 1.15)}; },
  read: (c) => { const b = idle(c); return {...b, hp: 0.45, tp: 0.08, aL: A(1.0, 0.05, 1.7), aR: A(1.0, 0.05, 1.7), face: {...b.face, brow: -0.15}}; },
  watch: (c) => { const k = smooth(Math.sin(c.t * 1.4 + c.seed) * 2); const b = idle(c); return {...b, hp: 0.35 * k, aL: A(0.85 * k + 0.05, 0.1, 1.7 * k + 0.2), aR: A(0.1, 0.1, 0.3), face: {...b.face, brow: 0.2 * k}}; },
  phoneCheck: (c) => { const b = idle(c); return {...b, hp: 0.5, tp: 0.1, aR: A(0.95, 0.05, 1.5), aL: A(0.1, 0.1, 0.3), face: {...b.face, smile: 0.15}}; },
  brew: (c) => { const b = idle(c); const press = smooth(Math.sin(c.t * 0.6 + c.seed) * 2 + 0.5); return {...b, tp: 0.1, hp: 0.2, aR: A(1.2 + 0.1 * press, 0.05, 0.5 - 0.1 * press), aL: A(0.7, 0.1, 1.0)}; },
  bin: (c) => { const b = idle(c); const k = smooth(Math.sin(c.t * 1.3 + c.seed) * 1.8 + 0.6); return {...b, drop: -0.18 * k, tp: 0.95 * k, hp: -0.3 * k, aL: A(0.3 + 0.9 * k, 0.1, 0.2 + 0.3 * k), aR: A(0.3 + 0.9 * k, 0.1, 0.2 + 0.3 * k), lL: L(0.35 * k, 0.55 * k), lR: L(0.35 * k, 0.55 * k)}; },
  push: (c) => { const w = POSES.walk(c); return {...w, tp: 0.18, aL: A(1.05, 0.1, 0.5), aR: A(1.05, 0.1, 0.5)}; },
  sign: (c) => { const b = idle(c); const wr = Math.sin(c.t * 9) * 0.04; return {...b, tp: 0.22, hp: 0.5, aR: A(1.05 + wr, 0.05, 0.9), aL: A(0.9, 0.05, 1.4), face: {...b.face, brow: -0.1}}; },
  handOver: (c) => { const b = idle(c); return {...b, aR: A(1.3, 0.1, 0.35), aL: A(0.2, 0.1, 0.4), hp: 0.05, face: {...b.face, smile: 0.4}}; },
  wave: (c) => { const b = idle(c); return {...b, aR: A(0.3, 1.9 + 0.12 * Math.sin(c.t * 9), 1.25 + 0.3 * Math.sin(c.t * 9)), face: {...b.face, smile: 0.7, mouth: 0.2}}; },
  laugh: (c) => { const b = idle(c); const s = Math.sin(c.t * 14 + c.seed); return {...b, tp: -0.1 + 0.03 * s, hp: -0.3, drop: 0.012 * s, aR: A(0.5, 0.3, 1.2), aL: A(0.35, 0.3, 0.9), face: {...b.face, mouth: 0.6 + 0.3 * s, smile: 1, brow: -0.2}}; },
  point: (c) => { const b = idle(c); return {...b, aR: A(1.45, 0.15, 0.15), aL: A(0.1, 0.1, 0.3), hy: -0.1, face: {...b.face, mouth: talkJaw(c)}}; },
  sitGroove: (c) => { const b = idle(c); const bt = Math.sin(c.t * 6.6 + c.seed); return seat({...b, hp: 0.1 * bt, tr: 0.05 * Math.sin(c.t * 3.3), tp: 0.1, aL: A(0.55, 0.12, 0.95), aR: A(0.55 + 0.08 * Math.max(0, bt), 0.12, 0.95), face: {...b.face, smile: 0.4}}); },
  // v2026-11-01c — lockdown poses (clips chosen in RbPerson STAND/SIT; these only feed glances/blends)
  crouch: (c) => ({...idle(c), drop: -0.5}), crouchTalk: (c) => ({...idle(c), drop: -0.5, face: {...idle(c).face, mouth: talkJaw(c)}}),
  nervous: (c) => idle(c), lookAround: (c) => idle(c), listenDoor: (c) => idle(c), tryDoor: (c) => idle(c), pushDesk: (c) => idle(c), press: (c) => POSES.point(c), hunch: (c) => POSES.walk(c),
  sitLook: (c) => seat(idle(c)), sitNervous: (c) => seat(idle(c)), sitWrite: (c) => POSES.sitType(c), sitFace: (c) => seat(idle(c)),
  think: (c) => { const b = idle(c); return {...b, hy: 0.25, hp: -0.12, aR: A(0.7, 0.1, 2.0), aL: A(0.5, 0.1, 1.2), face: {...b.face, brow: -0.25}}; },
};
export const blendPose = (a: Pose, b: Pose, k: number): Pose => {
  const m = (x: number, y: number) => lerp(x, y, k);
  const arm = (p: Arm, q: Arm): Arm => ({sp: m(p.sp, q.sp), sr: m(p.sr, q.sr), el: m(p.el, q.el)});
  const leg = (p: Leg, q: Leg): Leg => ({hp: m(p.hp, q.hp), kn: m(p.kn, q.kn)});
  return {drop: m(a.drop, b.drop), tp: m(a.tp, b.tp), tw: m(a.tw, b.tw), tr: m(a.tr, b.tr), hp: m(a.hp, b.hp), hy: m(a.hy, b.hy), hr: m(a.hr, b.hr),
    aL: arm(a.aL, b.aL), aR: arm(a.aR, b.aR), lL: leg(a.lL, b.lL), lR: leg(a.lR, b.lR),
    face: {mouth: m(a.face.mouth, b.face.mouth), smile: m(a.face.smile, b.face.smile), brow: m(a.face.brow, b.face.brow), blink: Math.max(a.face.blink, b.face.blink)}, seated: k > 0.5 ? b.seated : a.seated};
};
