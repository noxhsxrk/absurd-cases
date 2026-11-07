import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT} from '../../pov/ui/fonts';
import {sm, HANDLE} from './data';

/** breaking-news lower third with this episode's headline */
export const NewsBar3: React.FC<{t: number; t0: number; t1?: number; head: string; sub: string}> = ({t, t0, t1 = 1e9, head, sub}) => {
  if (t < t0 || t >= t1) return null;
  const k = sm((t - t0) / 0.2), k2 = sm((t - t0 - 0.12) / 0.2);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 50, top: 150, background: '#E0322E', color: '#fff', fontWeight: 700, fontSize: 40, padding: '4px 22px 10px', borderRadius: 6, opacity: k}}>● LIVE</div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 1600, transform: `translateX(${(1 - k) * -1100}px)`}}>
        <div style={{display: 'inline-block', background: '#E0322E', color: '#fff', fontWeight: 700, fontSize: 46, padding: '4px 26px 12px'}}>ด่วน</div>
        <div style={{background: 'rgba(14,18,28,.92)', color: '#fff', fontWeight: 700, fontSize: 50, padding: '16px 26px 24px', transform: `translateX(${(1 - k2) * -1100}px)`}}>{head}</div>
        <div style={{background: '#F2F2F0', color: '#1A1E26', fontWeight: 600, fontSize: 34, padding: '8px 26px 14px', transform: `translateX(${(1 - k2) * -1100}px)`}}>{sub} · {HANDLE}</div>
      </div>
    </AbsoluteFill>
  );
};
/** the prison siren: a slow red pulse over the frame */
export const SirenWash: React.FC<{t: number; t0: number; t1: number}> = ({t, t0, t1}) => {
  if (t < t0 || t >= t1) return null;
  const p = 0.5 - 0.5 * Math.cos((t - t0) * Math.PI * 2 * 1.4);
  return <AbsoluteFill style={{pointerEvents: 'none', background: '#E0322E', opacity: 0.16 * p * sm((t - t0) / 0.15), mixBlendMode: 'multiply'}} />;
};
