import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT} from '../../pov/ui/fonts';
import {sm} from './data';

/** Full-frame call UI: 191 first, then the electricity authority stacks in on "กับการไฟฟ้า". */
export const CallScreen2: React.FC<{t: number; t0: number; t1: number; t2: number}> = ({t, t0, t1, t2}) => {
  if (t < t0 || t > t2) return null;
  const dots = '.'.repeat(1 + (Math.floor((t - t0) * 3) % 3)); const k = sm((t - t0) / 0.25); const elec = t >= t1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', background: elec ? '#2B3A2E' : '#1C2A44', fontFamily: FONT, color: '#F4F1E8', alignItems: 'center'}}>
      <div style={{position: 'absolute', inset: 0, border: '26px solid #2E7D5B', borderRadius: 48}} />
      <div style={{marginTop: 250, fontSize: 150, fontWeight: 700, letterSpacing: 2, transform: `scale(${0.9 + 0.1 * k})`}}>กำลังโทร{dots}</div>
      {!elec && <>
        <div style={{marginTop: 70, width: 420, height: 470, background: '#E8B23A', clipPath: 'polygon(50% 0, 100% 14%, 100% 60%, 50% 100%, 0 60%, 0 14%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{color: '#1C2A44', fontSize: 170, fontWeight: 700, marginTop: -30}}>191</div>
        </div>
        <div style={{marginTop: 90, fontSize: 190, fontWeight: 700}}>ตำรวจ</div>
      </>}
      {elec && <>
        <div style={{marginTop: 70, width: 420, height: 470, background: '#E8B23A', clipPath: 'polygon(58% 0, 18% 56%, 46% 56%, 34% 100%, 84% 38%, 54% 38%, 72% 0)'}} />
        <div style={{marginTop: 90, fontSize: 170, fontWeight: 700}}>การไฟฟ้า</div>
      </>}
      <div style={{position: 'absolute', right: -40, bottom: -160, width: 300, height: 620, borderRadius: 150, background: '#D9A072', transform: `rotate(-28deg) translateY(${(1 - k) * 320}px)`}} />
    </AbsoluteFill>
  );
};
