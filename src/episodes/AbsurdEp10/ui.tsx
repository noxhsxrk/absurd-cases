import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT} from '../../pov/ui/fonts';
/** EP10 full-frame phone UIs. Pure functions of t. */
const cl = (x: number) => Math.min(1, Math.max(0, x));
const Spinner: React.FC<{t: number; size: number; color?: string}> = ({t, size, color = '#FFFFFF'}) => (
  <div style={{width: size, height: size, borderRadius: size, border: `${size * 0.11}px solid rgba(255,255,255,.18)`, borderTopColor: color, transform: `rotate(${t * 420}deg)`}} />
);
/** Wi-Fi fan icon with `bars` of 3 lit */
export const WifiIcon: React.FC<{bars: number; size: number; color?: string; dim?: string}> = ({bars, size, color = '#FFFFFF', dim = 'rgba(255,255,255,.22)'}) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 100 80">
    {[0, 1, 2].map((i) => { const r = 22 + i * 20; const a = 0.75; const x0 = 50 - r * Math.sin(a), y0 = 70 - r * Math.cos(a);
      return <path key={i} d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${100 - x0} ${y0}`} fill="none" stroke={i < bars ? color : dim} strokeWidth={9} strokeLinecap="round" />; })}
    <circle cx={50} cy={70} r={7} fill={color} />
  </svg>
);
/** his phone, full frame: a clip frozen on a loading circle; the Wi-Fi icon drops to one bar at `drop` */
export const ClipScreen: React.FC<{t: number; t0: number; t1: number; drop: number}> = ({t, t0, t1, drop}) => {
  if (t < t0 || t >= t1) return null;
  const bars = t < drop ? 3 : t < drop + 0.15 ? 2 : 1; const u = t - t0;
  const pulse = t > drop ? 1 + 0.25 * Math.exp(-(t - drop) * 3) * Math.abs(Math.sin((t - drop) * 9)) : 1;
  return <AbsoluteFill style={{background: '#0B0E14', fontFamily: FONT, color: '#fff', transform: `scale(${1.0 + 0.06 * u})`}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 60, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', fontSize: 44, fontWeight: 600}}>
      <span>23:47</span><span style={{display: 'flex', gap: 22, alignItems: 'center', transform: `scale(${pulse})`, transformOrigin: 'right center'}}><WifiIcon bars={bars} size={70} color={bars === 1 ? '#FFB23A' : '#fff'} /><span>12%</span></span>
    </div>
    {/* the clip: a cat about to jump, frozen on the spinner */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 560, height: 610, background: 'linear-gradient(#5E8FA6, #8FB4C4)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 170, background: '#A87A52'}} />
      <div style={{position: 'absolute', left: 380, bottom: 150, width: 300, height: 170, borderRadius: '50% 50% 40% 40%', background: '#F0A64E'}} />
      <div style={{position: 'absolute', left: 600, bottom: 260, width: 150, height: 130, borderRadius: '45%', background: '#F0A64E'}} />
      {[0, 1].map((i) => <div key={i} style={{position: 'absolute', left: 612 + i * 70, bottom: 370, width: 0, height: 0, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderBottom: '46px solid #F0A64E'}} />)}
      <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Spinner t={u} size={190} /></div>
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 12, width: '100%', background: 'rgba(255,255,255,.25)'}}><div style={{height: '100%', width: '34%', background: '#E8323C'}} /></div>
    </div>
    <div style={{position: 'absolute', left: 60, top: 1210, fontSize: 52, fontWeight: 700}}>แมวกระโดดข้ามคลองแบบเหลือเชื่อ</div>
    <div style={{position: 'absolute', left: 60, top: 1290, fontSize: 36, color: '#9AA3B2'}}>@absurd.cases · 2.1M views</div>
  </AbsoluteFill>;
};
/** the judge's phone: Wi-Fi settings, the court network spins, then fails with a red ✕ at `fail` */
export const WifiFail: React.FC<{t: number; t0: number; t1: number; fail: number}> = ({t, t0, t1, fail}) => {
  if (t < t0 || t >= t1) return null;
  const failed = t >= fail; const shake = failed ? 18 * Math.exp(-(t - fail) * 6) * Math.sin((t - fail) * 60) : 0; const k = cl((t - fail) / 0.12);
  const row = (name: string, bars: number, active = false) => <div key={name} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '34px 50px', borderBottom: '2px solid #E3E5EA', background: active ? '#EEF3FF' : '#fff'}}>
    <span style={{fontSize: 50, fontWeight: active ? 700 : 500, color: '#1A1E26'}}>{name}</span>
    <span style={{display: 'flex', alignItems: 'center', gap: 20}}>{active && !failed && <Spinner t={t} size={54} color="#2F6BFF" />}<WifiIcon bars={bars} size={64} color="#1A1E26" dim="#C8CCD4" /></span></div>;
  return <AbsoluteFill style={{background: '#F2F3F6', fontFamily: FONT, transform: `translateX(${shake}px) scale(${1 + 0.05 * (t - t0)})`}}>
    <div style={{padding: '190px 50px 30px', fontSize: 80, fontWeight: 700, color: '#1A1E26'}}>Wi-Fi</div>
    <div style={{margin: '0 30px', borderRadius: 30, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.08)'}}>
      {row('ศาล_ห้องพิจารณา1', 1, true)}{row('ของกลาง_หมายเลข10', 0)}{row('บ้านนี้ไม่มีเน็ต', 1)}{row('ผู้คุม_FREE', 2)}
    </div>
    {failed && <div style={{position: 'absolute', left: 90, right: 90, top: 820, background: '#fff', borderRadius: 40, padding: '60px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.25)', transform: `scale(${0.8 + 0.2 * k})`, opacity: k}}>
      <div style={{width: 170, height: 170, margin: '0 auto', borderRadius: 85, background: '#E8323C', color: '#fff', fontSize: 120, lineHeight: '170px', fontWeight: 700}}>✕</div>
      <div style={{marginTop: 30, fontSize: 64, fontWeight: 700, color: '#1A1E26'}}>เชื่อมต่อไม่ได้</div>
      <div style={{marginTop: 12, fontSize: 40, color: '#6A6F7A'}}>อุปกรณ์ปฏิเสธการให้การ</div>
    </div>}
  </AbsoluteFill>;
};
/** the lieutenant's phone in the interrogation room: scanning for the suspect's network — nothing */
export const NoNet: React.FC<{t: number; t0: number; t1: number; none: number}> = ({t, t0, t1, none}) => {
  if (t < t0 || t >= t1) return null;
  const found = t >= none; const k = cl((t - none) / 0.15);
  return <AbsoluteFill style={{background: '#11161E', fontFamily: FONT, color: '#fff', alignItems: 'center', transform: `scale(${1 + 0.06 * (t - t0)})`}}>
    <div style={{marginTop: 380, opacity: found ? 0.35 : 1, transform: `scale(${1 + 0.04 * Math.sin(t * 6)})`}}><WifiIcon bars={found ? 0 : Math.floor(t * 4) % 4} size={360} dim="rgba(255,255,255,.12)" /></div>
    <div style={{marginTop: 60, fontSize: 64, fontWeight: 700}}>{found ? 'ไม่พบสัญญาณ' : 'กำลังค้นหา Wi-Fi...'}</div>
    {found && <div style={{marginTop: 40, fontSize: 46, color: '#FF6B5E', fontWeight: 700, opacity: k, transform: `scale(${0.9 + 0.1 * k})`}}>ผู้ต้องหา: ไม่ส่งคลื่น (0 ขีด)</div>}
  </AbsoluteFill>;
};
