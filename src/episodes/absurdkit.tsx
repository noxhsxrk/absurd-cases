/**
 * absurd-cases shared kit for the ref8 rules (EP4 on):
 *  - camMove(): every shot moves — a fast "arrival" that settles in ~5 frames, then a clear push-in (~11 %/s), optional roll drift
 *  - HangingPlate: the charge sign hangs top-centre, drops in on the charge word on a damped spring, swings, keeps a small sway
 *  - SirenWash / sirenLights(): red/blue police strobe that floods the whole frame every 4 frames
 *  - whip(): 2-frame yaw whip at a cut, for blurred transitions
 * Everything is a pure function of t (Remotion renders frames out of order).
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT} from '../pov/ui/fonts';

type V3 = [number, number, number];
export type Cam = {pos: V3; look: V3; fov: number; roll?: number};
const FPS = 30;
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const easeOutCubic = (x: number) => 1 - Math.pow(1 - cl(x), 3);

export type MoveOpts = {
  push?: number;          // fraction of the camera→subject distance closed per second (0.11 ≈ +11 %/s image growth). Negative = pull out.
  arrive?: number;        // 0 = no arrival; else the shot starts this fraction further out (0.08–0.15) and settles in `arriveF` frames
  arriveF?: number;       // 4–6
  side?: number;          // lateral component of the arrival (−1 left … 1 right), so it reads as a move, not a zoom
  roll?: number;          // roll drift in degrees across the shot (≤ 6)
  roll0?: number;         // starting roll in degrees
  shake?: number;         // per-frame jitter amplitude (earthquake / impacts), metres
};
/** the camera for a shot at local time lt (seconds since the cut) */
export const camMove = (base: Cam, lt: number, o: MoveOpts = {}): Cam => {
  const push = o.push ?? 0.11, arrive = o.arrive ?? 0, aF = o.arriveF ?? 5;
  const d = sub(base.pos, base.look);
  // push-in: shrink the distance by `push` per second (multiplicative, so the image grows at a steady rate)
  const k = Math.pow(1 - cl(Math.abs(push), 0, 0.6), lt) ; const scale = push >= 0 ? k : 1 / k;
  let pos = add(base.look, mul(d, scale));
  if (arrive > 0) {
    const u = easeOutCubic((lt * FPS) / aF); const off = (1 - u);
    const right: V3 = [d[2], 0, -d[0]]; const rl = Math.hypot(right[0], right[2]) || 1;
    pos = add(pos, add(mul(d, arrive * off), mul([right[0] / rl, 0, right[2] / rl], (o.side ?? 0.4) * arrive * Math.hypot(...d) * off)));
  }
  if (o.shake) { const f = Math.floor(lt * FPS); const h = (n: number) => { const s = Math.sin(n * 127.1 + f * 311.7) * 43758.5453; return s - Math.floor(s) - 0.5; }; pos = add(pos, [h(1) * o.shake, h(2) * o.shake, h(3) * o.shake * 0.5]); }
  const roll = ((o.roll0 ?? 0) + (o.roll ?? 0) * Math.min(1, lt / 2)) * Math.PI / 180;
  return {pos, look: base.look, fov: base.fov, roll: (base.roll ?? 0) + roll};
};
/** yaw-whip the look point around the camera over the first/last `f` frames of a shot (dir ±1). Use with a hard cut on both sides. */
export const whip = (cam: Cam, lt: number, dur: number, f = 2, dir = 1, amount = 0.9): Cam => {
  const fr = lt * FPS, end = dur * FPS - fr; let a = 0;
  if (fr < f) a = (1 - fr / f) * amount * -dir; else if (end < f) a = (1 - end / f) * amount * dir;
  if (!a) return cam;
  const d = sub(cam.look, cam.pos); const c = Math.cos(a), s = Math.sin(a);
  return {...cam, look: add(cam.pos, [d[0] * c - d[2] * s, d[1], d[0] * s + d[2] * c])};
};

// -------------------------------------------------------------------------------------------------
// Hanging charge plate. drops = times the sign (re)drops in; text changes = a new plate.
// Rest position: top edge at `top` of frame height, width `w` of frame width, centred.
// -------------------------------------------------------------------------------------------------
const spring = (u: number, zeta = 0.32, f = 2.6) => { // 0 → 1 with overshoot; u in seconds
  if (u <= 0) return 0; const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * u) * (Math.cos(wd * u) + (zeta * w / wd) * Math.sin(wd * u));
};
export const HangingPlate: React.FC<{t: number; text: string; drops: number[]; t1?: number; top?: number; w?: number; sub?: string}> = ({t, text, drops, t1 = 1e9, top = 0.11, w = 0.72, sub: subtitle}) => {
  const past = drops.filter((d) => t >= d); if (!past.length || t >= t1) return null;
  const t0 = past[past.length - 1], u = t - t0;
  const W = 1080, H = 1920, pw = W * w, ph = pw * 0.27;
  const restY = H * top; const startY = -ph - 260;
  const y = startY + (restY - startY) * spring(u);
  const swing = (6 * Math.exp(-u * 4.5) * Math.cos(2 * Math.PI * 1.6 * u + 0.4)) + 1.5 * Math.sin(2 * Math.PI * 0.6 * u) * Math.max(0.35, Math.exp(-u * 0.6));
  const blur = u < 1 / FPS ? 6 : 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: (W - pw) / 2, top: y, width: pw, height: ph, transformOrigin: `50% ${-y}px`, transform: `rotate(${swing}deg)`, filter: blur ? `blur(${blur}px)` : undefined}}>
        {[0.16, 0.84].map((x) => <div key={x} style={{position: 'absolute', left: pw * x - 3, top: -y - 40, width: 6, height: y + 46, background: '#1A1C1E'}} />)}
        <div style={{position: 'absolute', inset: 0, background: '#152028', borderRadius: 10, boxShadow: '0 18px 30px rgba(0,0,0,.35)', border: '6px solid #0C1418', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', inset: 10, border: '3px solid #E6E7CF', borderRadius: 6, opacity: 0.85}} />
          <div style={{fontFamily: FONT, fontWeight: 700, color: '#E6E7CF', fontSize: Math.min(ph * 0.5, (pw * 0.84) / Math.max(4, text.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '').length * 0.56)), lineHeight: 1.1, letterSpacing: 2}}>{text}</div>
          {subtitle && <div style={{fontFamily: FONT, fontWeight: 600, color: '#C9BA9B', fontSize: ph * 0.16, marginTop: 4}}>{subtitle}</div>}
        </div>
        {[0.16, 0.84].map((x) => <div key={'r' + x} style={{position: 'absolute', left: pw * x - 9, top: -9, width: 18, height: 18, borderRadius: 9, background: '#9AA2A8', border: '3px solid #2A2E33'}} />)}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------------------------------------------
// Police strobe: red / blue alternating every `every` frames, multiply-washing the whole frame.
// -------------------------------------------------------------------------------------------------
export const sirenPhase = (t: number, every = 4) => Math.floor((t * FPS) / every) % 2;   // 0 red, 1 blue
export const SirenWash: React.FC<{t: number; t0: number; t1: number; amt?: number; every?: number}> = ({t, t0, t1, amt = 0.25, every = 4}) => {
  if (t < t0 || t >= t1) return null; const ph = sirenPhase(t, every);
  return <AbsoluteFill style={{pointerEvents: 'none', background: ph ? '#2F5BFF' : '#FF2A2A', opacity: amt, mixBlendMode: 'multiply'}} />;
};
/** matching 3D lights for the strobe (place near the window/door the police come through) */
export const SirenLights: React.FC<{t: number; position: V3; power?: number; every?: number}> = ({t, position, power = 6, every = 4}) => {
  const ph = sirenPhase(t, every);
  return <pointLight position={position} color={ph ? '#3A64FF' : '#FF3030'} intensity={power} distance={14} decay={1.3} />;
};
/** an interrupted line: a caption that ends in an em dash is followed by ~0.3 s of digital silence (done in the mix); this marks it visually */
export const isCut = (text: string) => /—$/.test(text);
