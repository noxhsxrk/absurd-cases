import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {FONT} from '../../ui/fonts';
import {tex, F, wrapText} from '../../lib/tex';

/** HUD: small day line, big clock, place; optional red badge (off by default — Nox asked to drop the เรื่องสมมติ badge) */
const fmt = (s: number) => { const h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, ss = Math.floor(s) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; };
export const HudMrt: React.FC<{clock: number; place: string; badge?: string | null; opacity?: number}> = ({clock, place, badge = null, opacity = 1}) => (
  <div style={{position: 'absolute', left: 58, top: 150, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.6)', fontFamily: FONT, opacity}}>
    {badge && <div style={{display: 'inline-block', background: '#D9302A', color: '#fff', fontSize: 24, fontWeight: 700, padding: '4px 14px', borderRadius: 6, marginBottom: 10, textShadow: 'none'}}>{badge}</div>}
    <div style={{fontSize: 28, fontWeight: 600, opacity: 0.92}}>คืนวันศุกร์</div>
    <div style={{fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: 1, fontVariantNumeric: 'tabular-nums'}}>{fmt(clock)}</div>
    <div style={{fontSize: 28, fontWeight: 600, opacity: 0.92, marginTop: 4}}>{place}</div>
  </div>
);
export const clockOf = (h: number, m: number, s = 0) => h * 3600 + m * 60 + s;

const PW = 540, PH = 1140;
const status = (g: CanvasRenderingContext2D, time: string, signal: boolean) => {
  g.fillStyle = '#fff'; g.font = F(600, 26); g.textAlign = 'left'; g.fillText(time, 40, 50); g.textAlign = 'right';
  g.fillText(signal ? '5G ▮▮▮  64%' : 'ไม่มีบริการ   64%', PW - 34, 50); g.textAlign = 'left';
};
/** phone screens for the POV phone (the viewer's: no signal, clock frozen at 00:13) and May's (Face ID, a call from แม่) */
export type MrtScreens = {home: THREE.Texture; noSignal: THREE.Texture; history: THREE.Texture; faceId: THREE.Texture; call: THREE.Texture; dark: THREE.Texture};
export const useMrtScreens = (ready: boolean): MrtScreens | null => useMemo(() => {
  if (!ready) return null;
  const wall = (g: CanvasRenderingContext2D) => { const gr = g.createLinearGradient(0, 0, PW, PH); gr.addColorStop(0, '#1B2340'); gr.addColorStop(1, '#3B2F6B'); g.fillStyle = gr; g.fillRect(0, 0, PW, PH); };
  const home = tex('ph_home', PW, PH, (g) => { wall(g); status(g, '00:13', false); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = F(300, 150); g.fillText('00:13', PW / 2, 330); g.font = F(500, 32); g.fillText('วันศุกร์ที่ 13', PW / 2, 390); });
  const noSignal = tex('ph_nosig', PW, PH, (g) => { wall(g); status(g, '00:13', false); g.fillStyle = 'rgba(20,22,30,.85)'; g.beginPath(); g.roundRect(40, 420, PW - 80, 300, 30); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = F(700, 40); g.fillText('ไม่สามารถโทรออกได้', PW / 2, 500); g.font = F(400, 30); g.fillStyle = '#C9CFE0'; wrapText(g, 'ไม่มีสัญญาณเครือข่าย ลองอีกครั้งภายหลัง', PW / 2, 560, PW - 140, 42); g.fillStyle = '#5FA8FF'; g.font = F(600, 34); g.fillText('ตกลง', PW / 2, 690); });
  const history = tex('ph_hist', PW, PH, (g) => { g.fillStyle = '#F4F5F8'; g.fillRect(0, 0, PW, PH); g.fillStyle = '#3B2F6B'; g.fillRect(0, 0, PW, 220); status(g, '00:13', false); g.fillStyle = '#fff'; g.font = F(700, 40); g.textAlign = 'left'; g.fillText('ประวัติการเดินทาง', 40, 160);
    g.fillStyle = '#9AA1AE'; g.textAlign = 'center'; g.font = F(500, 34); g.fillText('ยังไม่มีรายการ', PW / 2, 560); g.font = F(400, 26); g.fillText('ไม่พบการแตะเข้าระบบ', PW / 2, 606); g.strokeStyle = '#C9CDD6'; g.lineWidth = 6; g.beginPath(); g.roundRect(PW / 2 - 70, 380, 140, 100, 14); g.stroke(); });
  const faceId = tex('ph_face', PW, PH, (g) => { const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#E9A6A0'); gr.addColorStop(1, '#6E4A8C'); g.fillStyle = gr; g.fillRect(0, 0, PW, PH); status(g, '00:33', true); g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.roundRect(PW / 2 - 60, 260, 120, 120, 30); g.stroke(); g.beginPath(); g.arc(PW / 2, 330, 26, 0.2, Math.PI - 0.2); g.stroke(); g.fillStyle = '#fff'; g.font = F(600, 34); g.textAlign = 'center'; g.fillText('ปลดล็อกแล้ว', PW / 2, 450); g.font = F(400, 26); g.fillText('ยินดีต้อนรับ เมย์', PW / 2, 495); });
  const call = tex('ph_call', PW, PH, (g) => { const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#2A3348'); gr.addColorStop(1, '#10141E'); g.fillStyle = gr; g.fillRect(0, 0, PW, PH); status(g, '00:33', true); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = F(600, 64); g.fillText('แม่', PW / 2, 300); g.font = F(400, 30); g.fillStyle = '#AEB6C8'; g.fillText('สายเรียกเข้า…', PW / 2, 350);
    g.fillStyle = '#E2453A'; g.beginPath(); g.arc(140, 940, 56, 0, 7); g.fill(); g.fillStyle = '#34C759'; g.beginPath(); g.arc(PW - 140, 940, 56, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = F(500, 26); g.fillText('ปฏิเสธ', 140, 1036); g.fillText('รับสาย', PW - 140, 1036); });
  const dark = tex('ph_dark', 8, 8, (g) => { g.fillStyle = '#060708'; g.fillRect(0, 0, 8, 8); });
  return {home, noSignal, history, faceId, call, dark};
}, [ready]);

/** May's ticket: dark-blue contactless card (invented operator) */
export const cardTex = (ready: boolean) => tex('card' + ready, 512, 320, (g) => { const gr = g.createLinearGradient(0, 0, 512, 320); gr.addColorStop(0, '#1E2A5A'); gr.addColorStop(1, '#3B2F6B'); g.fillStyle = gr; g.beginPath(); g.roundRect(0, 0, 512, 320, 26); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(430, 90, 30 + i * 18, -0.8, 0.8); g.stroke(); }
  if (!ready) return; g.fillStyle = '#fff'; g.font = F(700, 40); g.textAlign = 'left'; g.fillText('บัตรโดยสาร', 34, 70); g.font = F(400, 26); g.fillStyle = '#C9D2E8'; g.fillText('สายนิลกาฬ', 36, 110); g.font = F(600, 34); g.fillStyle = '#fff'; g.fillText('0000 1324', 36, 270); });
/** the card held in a pinch grip (hand-local metres: fingers +y, palm +z) */
export const CardInHand: React.FC<{ready: boolean}> = ({ready}) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({map: cardTex(ready), roughness: 0.4}), [ready]);
  return <group position={[0.03, 0.13, 0.03]} rotation={[-0.3, 0.2, 0.4]}><mesh material={m} castShadow><boxGeometry args={[0.0856, 0.054, 0.001]} /></mesh></group>;
};

/** grade overlay: lifted shadows, vignette, film grain (2–4 %) */
export const GradeMrt: React.FC<{frame: number; tense?: number; tint?: string}> = ({frame, tense = 0, tint}) => (
  <>
    {tint && <AbsoluteFill style={{background: tint, mixBlendMode: 'soft-light', opacity: 0.35}} />}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,.38) 100%)'}} />
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) ${50 - tense * 12}%, rgba(4,6,14,${0.32 + tense * 0.25}) 100%)`}} />
    <AbsoluteFill style={{opacity: 0.08, mixBlendMode: 'overlay'}}>
      <svg width={1080} height={1920}><filter id="grm"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 97} /></filter><rect width="100%" height="100%" filter="url(#grm)" /></svg>
    </AbsoluteFill>
  </>
);
