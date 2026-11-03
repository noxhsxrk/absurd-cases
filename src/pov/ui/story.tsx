import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, delayRender, continueRender, interpolate, Easing} from 'remotion';
import * as THREE from 'three';
import {FONT} from './fonts';
import {canvasTex} from '../lib/tex';

/** Hold the render until Prompt is usable in <canvas> (canvas text doesn't wait for webfonts on its own). */
export const useFontsReady = () => {
  const [ok, setOk] = useState(false);
  const [h] = useState(() => delayRender('fonts for canvas'));
  useEffect(() => {
    Promise.all(['400', '600', '700'].map((w) => document.fonts.load(`${w} 40px Prompt`, 'กขค ABC'))).then(() => { setOk(true); continueRender(h); }).catch(() => { setOk(true); continueRender(h); });
  }, []);
  return ok;
};

const F = (w: number, px: number) => `${w} ${px}px Prompt, sans-serif`;
const wrap = (g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) => {
  // Thai has no spaces between words: break on spaces first, then by characters
  const words = text.split(' '); let line = '', yy = y;
  const flush = () => { g.fillText(line, x, yy); yy += lh; line = ''; };
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width <= maxW) { line = test; continue; }
    if (line) flush();
    if (g.measureText(w).width <= maxW) { line = w; continue; }
    for (const ch of Array.from(w)) { if (g.measureText(line + ch).width > maxW) flush(); line += ch; }
  }
  if (line) flush(); return yy;
};
const statusBar = (g: CanvasRenderingContext2D, W: number, time: string, dark = true) => {
  g.fillStyle = dark ? '#FFFFFF' : '#111'; g.font = F(600, 26); g.textAlign = 'left'; g.fillText(time, 34, 46); g.textAlign = 'right'; g.fillText('5G  ▮▮▮  82%', W - 30, 46); g.textAlign = 'left';
};

export type Screens = {alert: THREE.Texture; silent: THREE.Texture; chat: THREE.Texture; dark: THREE.Texture};
export const useScreens = (ready: boolean): Screens | null => useMemo(() => {
  if (!ready) return null;
  const W = 400, H = 860;
  const alert = canvasTex(W, H, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2A0E10'); gr.addColorStop(1, '#120708'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    statusBar(g, W, '13:47');
    g.fillStyle = '#F1F1F1'; g.font = F(700, 96); g.textAlign = 'center'; g.fillText('13:47', W / 2, 190); g.font = F(400, 26); g.fillText('อังคาร 11 พฤศจิกายน', W / 2, 232);
    // emergency card
    g.fillStyle = '#C8232C'; g.beginPath(); g.roundRect(22, 268, W - 44, 470, 26); g.fill();
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(62, 336); g.lineTo(92, 286); g.lineTo(122, 336); g.closePath(); g.fill(); g.fillStyle = '#C8232C'; g.font = F(700, 34); g.fillText('!', 92, 330);
    g.fillStyle = '#FFFFFF'; g.textAlign = 'left'; g.font = F(700, 30); g.fillText('แจ้งเตือนเหตุฉุกเฉิน', 140, 312); g.font = F(400, 22); g.fillText('ความปลอดภัยสาธารณะ', 140, 342);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(44, 366, W - 88, 2);
    g.fillStyle = '#FFFFFF'; g.font = F(600, 27);
    let y = wrap(g, 'เหตุคนร้ายติดอาวุธ บริเวณถนนศรีธารา ใกล้ โรงเรียนวิทยาธารา', 46, 412, W - 92, 38);
    g.font = F(400, 24); y = wrap(g, 'ให้หลบอยู่ในอาคาร ล็อกประตู อยู่ห่างจากหน้าต่าง และรอประกาศจากเจ้าหน้าที่', 46, y + 10, W - 92, 34);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = F(400, 20); g.fillText('ศูนย์เตือนภัย · 13:47', 46, 712);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.roundRect(70, 770, W - 140, 56, 28); g.fill(); g.fillStyle = '#FFFFFF'; g.font = F(600, 24); g.textAlign = 'center'; g.fillText('รับทราบ', W / 2, 806);
  });
  const silent = canvasTex(W, H, (g) => {
    g.fillStyle = '#151820'; g.fillRect(0, 0, W, H); statusBar(g, W, '13:48');
    g.fillStyle = '#F1F1F1'; g.textAlign = 'center'; g.font = F(700, 34); g.fillText('ศูนย์ควบคุม', W / 2, 130);
    // silent toggle (on) + vibration (off)
    g.fillStyle = '#E8823A'; g.beginPath(); g.roundRect(40, 180, W - 80, 200, 30); g.fill();
    g.fillStyle = '#FFFFFF'; g.lineWidth = 9; g.strokeStyle = '#FFFFFF'; g.beginPath(); g.arc(W / 2, 262, 38, Math.PI, 0); g.lineTo(W / 2 + 38, 300); g.lineTo(W / 2 - 38, 300); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(W / 2 - 60, 220); g.lineTo(W / 2 + 60, 320); g.stroke();
    g.font = F(700, 30); g.fillText('โหมดเงียบ: เปิด', W / 2, 356);
    g.fillStyle = '#2A2F3B'; g.beginPath(); g.roundRect(40, 410, W - 80, 120, 30); g.fill();
    g.fillStyle = '#B9C0CC'; g.font = F(600, 28); g.textAlign = 'left'; g.fillText('การสั่น', 74, 480);
    g.fillStyle = '#4A505C'; g.beginPath(); g.roundRect(W - 160, 446, 86, 48, 24); g.fill(); g.fillStyle = '#D9DDE4'; g.beginPath(); g.arc(W - 136, 470, 19, 0, 7); g.fill();
    g.fillStyle = '#8A93A3'; g.font = F(400, 22); g.fillText('ปิด', W - 230, 480);
    g.fillStyle = '#2A2F3B'; g.beginPath(); g.roundRect(40, 560, W - 80, 120, 30); g.fill(); g.fillStyle = '#B9C0CC'; g.font = F(600, 26); g.fillText('ความสว่างหน้าจอ', 74, 610); g.fillStyle = '#4A505C'; g.fillRect(74, 638, W - 148, 12); g.fillStyle = '#D9DDE4'; g.fillRect(74, 638, 70, 12);
  });
  const chat = canvasTex(W, H, (g) => {
    g.fillStyle = '#EEF1F5'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2C6BED'; g.fillRect(0, 0, W, 128); statusBar(g, W, '13:48');
    g.fillStyle = '#FFFFFF'; g.font = F(700, 30); g.textAlign = 'left'; g.fillText('‹  ม.5/3 (32)', 22, 104);
    const msgs: [string, string, string, boolean][] = [
      ['มายด์', 'ทุกคนอยู่ในห้องกันใช่ไหม', '#7A5AF8', false],
      ['บอส', 'ถนนหน้าโรงเรียนปิดแล้ว ตำรวจเต็มเลย', '#E8823A', false],
      ['ฟ้า', 'อย่าเพิ่งออกจากห้องนะ', '#16A37F', false],
      ['ต้น', 'ผมอยู่ห้องน้ำชั้น 3 ทำไงดี', '#D8343A', false],
    ];
    let y = 168;
    msgs.forEach(([who, text, c]) => {
      g.fillStyle = c; g.beginPath(); g.arc(44, y + 22, 22, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = F(700, 22); g.textAlign = 'center'; g.fillText(who.slice(0, 1), 44, y + 30);
      g.textAlign = 'left'; g.fillStyle = '#5A6070'; g.font = F(600, 20); g.fillText(who, 80, y + 6);
      g.font = F(400, 25); const lines: string[] = []; { let line = ''; for (const ch of Array.from(text)) { if (g.measureText(line + ch).width > W - 150) { lines.push(line); line = ''; } line += ch; } lines.push(line); }
      const h = 26 + lines.length * 34; g.fillStyle = '#FFFFFF'; g.beginPath(); g.roundRect(78, y + 14, W - 110, h, 18); g.fill();
      g.fillStyle = '#1C1F26'; lines.forEach((l, k) => g.fillText(l, 96, y + 52 + k * 34)); y += h + 46;
    });
    g.fillStyle = '#FFFFFF'; g.fillRect(0, H - 92, W, 92); g.fillStyle = '#EEF1F5'; g.beginPath(); g.roundRect(22, H - 72, W - 110, 52, 26); g.fill(); g.fillStyle = '#9AA1AE'; g.font = F(400, 22); g.fillText('พิมพ์ข้อความ…', 44, H - 38);
  });
  const dark = canvasTex(W, H, (g) => { g.fillStyle = '#07080A'; g.fillRect(0, 0, W, H); });
  return {alert, silent, chat, dark};
}, [ready]);

// ---------------- 2D overlays ----------------
const fmt = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = Math.floor(s) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; };
export const Hud: React.FC<{clock: number; opacity?: number}> = ({clock, opacity = 1}) => (
  <div style={{position: 'absolute', left: 58, top: 150, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.5)', fontFamily: FONT, opacity}}>
    <div style={{fontSize: 28, fontWeight: 600, opacity: 0.92}}>อังคาร 11 พ.ย.</div>
    <div style={{fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: 1, fontVariantNumeric: 'tabular-nums'}}>{fmt(clock)}</div>
    <div style={{fontSize: 28, fontWeight: 600, opacity: 0.92, marginTop: 4}}>ร.ร.วิทยาธารา · ห้อง 325</div>
  </div>
);

export type WordLine = {lineId: string; speaker: string; startMs: number; endMs: number; words: {w: string; s: number; e: number; hl: string; gap?: boolean}[]};
/** whole line on screen (≤ 2 lines), the word being spoken lights up and the highlight moves word by word (reference style) */
export const KaraokeCaptions: React.FC<{lines: WordLine[]; ms: number; names?: Record<string, string>}> = ({lines, ms, names}) => {
  const c = lines.find((x) => ms >= x.startMs - 60 && ms < x.endMs + 260); if (!c) return null;
  const k = Math.min(1, (ms - c.startMs + 60) / 120), out = Math.min(1, (c.endMs + 260 - ms) / 160);
  const who = names?.[c.speaker] ?? WHO[c.speaker] ?? '';
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1150, textAlign: 'center', fontFamily: FONT, opacity: Math.min(k, out)}}>
      {who && <div style={{display: 'inline-block', fontSize: 26, fontWeight: 700, color: '#111', background: c.speaker === 'PA' || c.speaker === 'LUNG' ? '#D9DDE4' : '#FFFFFF', borderRadius: 8, padding: '0 12px', marginBottom: 10, opacity: 0.9}}>{who}</div>}
      <div style={{fontSize: 54, fontWeight: 700, lineHeight: 1.32, color: '#fff', textShadow: '0 4px 14px rgba(0,0,0,.75), 0 0 3px rgba(0,0,0,.95)', WebkitTextStroke: '1.5px rgba(0,0,0,.5)'}}>
        {c.words.map((w, i) => {
          const now = ms >= w.s && ms < w.e + 40;
          const col = now ? (w.hl ? VAR[w.hl] : '#FFB020') : w.hl && ms >= w.s ? VAR[w.hl] : '#FFFFFF';
          return <span key={i} style={{color: col, display: 'inline-block', transform: `scale(${now ? 1.06 : 1})`, marginRight: w.gap ? 16 : 0}}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

export type Cap = {id: string; startMs: number; endMs: number; text: string; highlight: string[]; variant: string; speaker: string};
const VAR: Record<string, string> = {amber: '#FFB020', cyan: '#5FD3FF', red: '#FF5A4E', plain: '#FFFFFF'};
const WHO: Record<string, string> = {VIEWER: '', KRU_ORN: 'ครูอร', PRAE: 'แพร', PHUM: 'ภูมิ', TON: 'ต้น', PA: 'ประกาศ', LUNG: 'ลุงสมพงษ์ · วิทยุ'};
export const Captions: React.FC<{caps: Cap[]; ms: number}> = ({caps, ms}) => {
  const c = caps.find((x) => ms >= x.startMs - 40 && ms < x.endMs + 120); if (!c) return null;
  const k = Math.min(1, (ms - c.startMs + 40) / 140), out = Math.min(1, (c.endMs + 120 - ms) / 120);
  const pop = interpolate(k, [0, 1], [0.86, 1], {easing: Easing.out(Easing.back(2))});
  const hl = c.highlight[0]; const parts = hl && c.text.includes(hl) ? c.text.split(hl) : [c.text];
  const who = WHO[c.speaker] ?? '';
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1180, textAlign: 'center', fontFamily: FONT, opacity: Math.min(k, out)}}>
      {who && <div style={{display: 'inline-block', fontSize: 26, fontWeight: 700, color: '#111', background: c.speaker === 'PA' || c.speaker === 'LUNG' ? '#D9DDE4' : '#FFFFFF', borderRadius: 8, padding: '0 12px', marginBottom: 8, opacity: 0.92}}>{who}</div>}
      <div style={{fontSize: 58, fontWeight: 700, lineHeight: 1.25, color: '#fff', transform: `scale(${pop})`, textShadow: '0 4px 14px rgba(0,0,0,.7), 0 0 3px rgba(0,0,0,.95)', WebkitTextStroke: '1.5px rgba(0,0,0,.55)'}}>
        {parts.length > 1 ? <>{parts[0]}<span style={{color: VAR[c.variant] ?? '#FFB020'}}>{hl}</span>{parts.slice(1).join(hl)}</> : c.text}
      </div>
    </div>
  );
};

/** two SVG lids; k 0 = open, 1 = closed */
export const Eyelid: React.FC<{k: number}> = ({k}) => k <= 0.001 ? null : (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <path d={`M0 0 H1080 V${960 * k} Q540 ${960 * k + 160 * (1 - k)} 0 ${960 * k} Z`} fill="#050505" />
      <path d={`M0 1920 H1080 V${1920 - 960 * k} Q540 ${1920 - 960 * k - 120 * (1 - k)} 0 ${1920 - 960 * k} Z`} fill="#050505" />
    </svg>
  </AbsoluteFill>
);
export const Grade: React.FC<{frame: number; dark: number}> = ({frame, dark}) => (
  <>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,.35) 100%)'}} />
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) ${52 - dark * 10}%, rgba(4,8,20,${0.3 + dark * 0.25}) 100%)`}} />
    <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
      <svg width={1080} height={1920}><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 97} /></filter><rect width="100%" height="100%" filter="url(#gr)" /></svg>
    </AbsoluteFill>
  </>
);

const fade = (f: number, a: number, d = 14) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
export const DecisionCard: React.FC<{f: number; q: string; a: string; b: string; cta: string}> = ({f, q, a, b, cta}) => (
  <AbsoluteFill style={{background: `rgba(8,10,16,${0.55 * fade(f, 0, 10)})`, fontFamily: FONT, color: '#fff', alignItems: 'center', justifyContent: 'center', textShadow: '0 4px 18px rgba(0,0,0,.6)'}}>
    <div style={{opacity: fade(f, 4), transform: `translateY(${(1 - fade(f, 4)) * 30}px)`, fontSize: 30, fontWeight: 600, letterSpacing: 4, color: '#FF5A4E', marginBottom: 26}}>ถ้าเป็นคุณ…</div>
    <div style={{opacity: fade(f, 10), transform: `translateY(${(1 - fade(f, 10)) * 30}px)`, fontSize: 66, fontWeight: 700, textAlign: 'center', lineHeight: 1.25, maxWidth: 880}}>{q}</div>
    <div style={{display: 'flex', gap: 34, marginTop: 70}}>
      {[['A', a], ['B', b]].map(([k, txt], i) => (
        <div key={k} style={{opacity: fade(f, 22 + i * 8), transform: `translateY(${(1 - fade(f, 22 + i * 8)) * 40}px)`, width: 400, height: 300, border: '4px solid rgba(255,255,255,.9)', borderRadius: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,12,18,.45)', backdropFilter: 'blur(4px)'}}>
          <div style={{fontSize: 90, fontWeight: 700, color: i === 0 ? '#FFB020' : '#5FD3FF', lineHeight: 1}}>{k}</div>
          <div style={{fontSize: 48, fontWeight: 700, marginTop: 18}}>{txt}</div>
        </div>
      ))}
    </div>
    <div style={{opacity: fade(f, 44), marginTop: 60, fontSize: 36, fontWeight: 600, color: 'rgba(255,255,255,.85)'}}>{cta}</div>
  </AbsoluteFill>
);
export const PartCard: React.FC<{f: number; part: number}> = ({f, part}) => (
  <AbsoluteFill style={{background: '#0A0C12', fontFamily: FONT, color: '#fff', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{opacity: fade(f, 0, 8), fontSize: 140, fontWeight: 700, letterSpacing: 6, transform: `scale(${0.9 + 0.1 * fade(f, 0, 10)})`}}>PART {part}</div>
    <div style={{opacity: fade(f, 8), fontSize: 44, fontWeight: 600, marginTop: 20}}>กดติดตาม รอดูพาร์ต {part + 1}</div>
    <div style={{opacity: fade(f, 16), fontSize: 34, fontWeight: 400, marginTop: 18, color: 'rgba(255,255,255,.8)'}}>แท็กเพื่อนที่คุณจะหนีไปด้วย</div>
  </AbsoluteFill>
);
