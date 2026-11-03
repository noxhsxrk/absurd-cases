import React from 'react';
import {AbsoluteFill, interpolate, Easing} from 'remotion';
import {FONT} from '../../pov/ui/fonts';
import {Card, pop, cl, sm, HANDLE} from './data';

/**
 * 2D layer in the reference style: phrase captions (white, heavy outline, one keyword in coral), navy title plates
 * for the charge, a red rubber stamp, the phone-call screen and a breaking-news lower third.
 */
export const CORAL = '#FF8A73';
const OUTLINE = '0 0 2px #000, 0 0 2px #000, 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000, 0 6px 14px rgba(0,0,0,.55)';

/** One caption card: the whole phrase, the keyword coloured. Pops in on its first frames like the reference. */
export const Captions: React.FC<{cards: Card[]; t: number; y?: number}> = ({cards, t, y = 1395}) => {
  const c = cards.find((k) => t >= k.t0 && t < k.t1);
  if (!c) return null;
  const k = 1;   // reference captions hard-swap, no pop
  const parts: React.ReactNode[] = [];
  if (c.hl && c.text.includes(c.hl)) {
    const i = c.text.indexOf(c.hl);
    parts.push(c.text.slice(0, i), <span key="h" style={{color: CORAL}}>{c.hl}</span>, c.text.slice(i + c.hl.length));
  } else parts.push(c.text);
  // the mosquito's echo: the answer repeats smaller and fainter, like the canyon's "silent… silent…"
  const echo = c.echo ? Math.floor((t - c.t0) / 0.38) : 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 70, right: 70, top: y, display: 'flex', justifyContent: 'center', transform: `scale(${0.86 + 0.14 * k})`, opacity: Math.min(1, k * 1.5)}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 74, lineHeight: 1.28, color: '#FFFFFF', textAlign: 'center', textShadow: OUTLINE, whiteSpace: 'pre-line', wordBreak: 'keep-all'}}>{parts}</div>
      </div>
      {c.echo && [1, 2].filter((i) => i <= echo).map((i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y + 110 + (i - 1) * 78, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 62 - i * 10, color: CORAL, opacity: 0.75 - i * 0.22, textShadow: OUTLINE}}>{c.hl}…</div>
      ))}
    </AbsoluteFill>
  );
};

/** The charge on a navy plate, dropping in from above with a small overshoot (reference: "TRESPASSING"). */
export const TitlePlate: React.FC<{text: string; t: number; t0: number; t1: number; y?: number; size?: number; strike?: number; sub?: string}> = ({text, t, t0, t1, y = 190, size = 92, strike = 0, sub}) => {
  if (t < t0 || t > t1) return null;
  const k = pop((t - t0) / 0.32), out = sm((t - (t1 - 0.12)) / 0.12);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: y + (1 - k) * -160, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: (1 - out) * Math.min(1, k * 2)}}>
        <div style={{position: 'relative', background: '#1E2B3C', color: '#F4F6F8', fontFamily: FONT, fontWeight: 700, fontSize: size, padding: '18px 54px 26px', borderRadius: 10, boxShadow: '0 14px 30px rgba(0,0,0,.35)', letterSpacing: 1}}>
          {text}
          {strike > 0 && <div style={{position: 'absolute', left: 30, top: '52%', height: 14, width: `${(strike * 100 - 6).toFixed(1)}%`, background: '#E0322E', borderRadius: 7, transform: 'rotate(-4deg)'}} />}
        </div>
        {sub && strike > 0.95 && <div style={{marginTop: 22, background: '#E0322E', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: size * 0.92, padding: '12px 46px 20px', borderRadius: 10, transform: `scale(${pop((t - t0 - 0.9) / 0.3)})`}}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

/** Rubber stamp slamming onto the frame. */
export const Stamp: React.FC<{text: string; t: number; t0: number; t1: number}> = ({text, t, t0, t1}) => {
  if (t < t0 || t > t1) return null;
  const k = cl((t - t0) / 0.12); const s = 1.9 - 0.9 * Easing.in(Easing.quad)(k);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
      <div style={{transform: `translateY(-210px) rotate(-11deg) scale(${s})`, opacity: k < 1 ? 0.35 + 0.65 * k : 0.93, border: '14px solid #D7262B', borderRadius: 22, color: '#D7262B', fontFamily: FONT, fontWeight: 700, fontSize: 128, padding: '6px 52px 22px', background: 'rgba(255,250,240,.08)', textShadow: '0 0 1px #D7262B', boxShadow: 'inset 0 0 0 6px rgba(215,38,43,.25)'}}>{text}</div>
    </AbsoluteFill>
  );
};

/** The phone screen takes the whole frame, flat-illustrated (reference: "CALLING POLICE" shield + a finger). */
export const CallScreen: React.FC<{t: number; t0: number; t1: number}> = ({t, t0, t1}) => {
  if (t < t0 || t > t1) return null;
  const dots = '.'.repeat(1 + (Math.floor((t - t0) * 3) % 3)); const k = sm((t - t0) / 0.25);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', background: '#1C2A44', fontFamily: FONT, color: '#F4F1E8', alignItems: 'center'}}>
      <div style={{position: 'absolute', inset: 0, border: '26px solid #2E7D5B', borderRadius: 48}} />
      <div style={{marginTop: 250, fontSize: 150, fontWeight: 700, letterSpacing: 2, transform: `scale(${0.9 + 0.1 * k})`}}>กำลังโทร{dots}</div>
      <div style={{marginTop: 70, width: 420, height: 470, background: '#E8B23A', clipPath: 'polygon(50% 0, 100% 14%, 100% 60%, 50% 100%, 0 60%, 0 14%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: '#1C2A44', fontSize: 170, fontWeight: 700, marginTop: -30}}>191</div>
      </div>
      <div style={{marginTop: 90, fontSize: 190, fontWeight: 700}}>ตำรวจ</div>
      <div style={{position: 'absolute', left: 120, bottom: 150, width: 90, height: 90, borderRadius: 45, background: '#F4F1E8'}} />
      <div style={{position: 'absolute', right: -40, bottom: -160, width: 300, height: 620, borderRadius: 150, background: '#D9A072', transform: `rotate(-28deg) translateY(${(1 - k) * 320}px)`}} />
    </AbsoluteFill>
  );
};

/** LIVE bug + breaking-news lower third. */
export const NewsBar: React.FC<{t: number; t0: number; t1?: number}> = ({t, t0, t1 = 1e9}) => {
  if (t < t0 || t >= t1) return null;
  const k = sm((t - t0) / 0.3), k2 = sm((t - t0 - 0.25) / 0.3);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 50, top: 150, background: '#E0322E', color: '#fff', fontWeight: 700, fontSize: 40, padding: '4px 22px 10px', borderRadius: 6, opacity: k}}>● LIVE</div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 1600, transform: `translateX(${(1 - k) * -1100}px)`}}>
        <div style={{display: 'inline-block', background: '#E0322E', color: '#fff', fontWeight: 700, fontSize: 46, padding: '4px 26px 12px'}}>ข่าวด่วน</div>
        <div style={{background: 'rgba(14,18,28,.92)', color: '#fff', fontWeight: 700, fontSize: 50, padding: '16px 26px 24px', transform: `translateX(${(1 - k2) * -1100}px)`}}>ฝูงยุงนับล้าน มุ่งหน้าเข้าเมือง</div>
        <div style={{background: '#F2F2F0', color: '#1A1E26', fontWeight: 600, fontSize: 34, padding: '8px 26px 14px', transform: `translateX(${(1 - k2) * -1100}px)`}}>เจ้าหน้าที่แนะ ปิดหน้าต่าง · ทายากันยุง · {HANDLE}</div>
      </div>
    </AbsoluteFill>
  );
};

/** grade + vignette + seeded film grain on top of the 3D */
export const Grade: React.FC<{frame: number; vig?: number}> = ({frame, vig = 0.28}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vig}) 100%)`}} />
    <AbsoluteFill style={{opacity: 0.05, mixBlendMode: 'overlay', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${frame % 97}'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>")`}} />
  </AbsoluteFill>
);

export const Flash: React.FC<{t: number; t0: number; d?: number; color?: string; max?: number}> = ({t, t0, d = 0.12, color = '#fff', max = 0.5}) => {
  if (t < t0 || t > t0 + d) return null;
  return <AbsoluteFill style={{background: color, opacity: max * (1 - (t - t0) / d), pointerEvents: 'none'}} />;
};
export const fadeIn = (f: number, a: number, d = 10) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
