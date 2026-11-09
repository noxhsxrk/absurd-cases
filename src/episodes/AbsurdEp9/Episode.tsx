import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {IDS} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook, setFaceStyle} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, SHOTS, HANDLE} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, Grade, Flash, CallScreen} from '../AbsurdEp1/ui';
import {HangingPlate, SirenWash} from '../absurdkit';

export {TOTAL};
const MIX = 'absurd-cases/ep9/mix/ep9_mix.wav';
const VOICE = 'absurd-cases/ep9/ep9_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const PLACE = (n: string) => ['brush', 'mirrorECU', 'mimic', 'charge', 'chargeBack', 'phone', 'callUI', 'newMirror', 'brush2', 'phone2'].includes(n) ? 'bed' : ['swat', 'beat1', 'beat2', 'beatBack', 'bag', 'cuffs'].includes(n) ? 'raid'
  : ['interro', 'interroCU', 'slam', 'slam2', 'note'].includes(n) ? 'interro' : ['court', 'judgeMad', 'judgeRage'].includes(n) ? 'court' : ['darkCell', 'sign3'].includes(n) ? 'cell'
  : n === 'release' ? 'prison' : 'live';
const GRADE: Record<string, string> = {bed: 'saturate(0.9) contrast(1.04) brightness(1.03)', raid: 'saturate(0.86) contrast(1.07)', interro: 'saturate(0.82) contrast(1.05)', court: 'saturate(0.8) contrast(1.05)',
  cell: 'saturate(0.75) contrast(1.08)', prison: 'saturate(0.86) contrast(1.04)', live: 'saturate(0.85) contrast(1.04)'};
const FILL: Record<string, [string, number]> = {bed: ['#FFF4E4', 0.35], raid: ['#FFF4E4', 0.35], interro: ['#D6DCE6', 0.3], court: ['#FFF1DE', 0.5], cell: ['#8090B0', 0.12], prison: ['#E8EEF2', 0.35], live: ['#E8E2F2', 0.2]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#BFD6E4'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;
};

/** lights out in the cell: a black frame with a guard's torch beam sweeping across (darkCell), easing open on the cut sentence */
const Dark: React.FC<{t: number}> = ({t}) => {
  const a = T('darkCell'), b = T('sign3');
  if (t < a.t0 || t >= b.t1) return null;
  const u = t - a.t0; const x = 30 + 22 * Math.sin(u * 2.2); const y = 60 + 6 * Math.sin(u * 3.1);
  const open = t >= b.t0 ? 0.2 : 0.42;
  return <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(circle at ${x}% ${y}%, rgba(0,0,0,0) 0, rgba(0,0,0,0) 18%, rgba(2,3,6,${open}) 32%)`}} />;
};
/** the makeup livestream UI over the ring-light shots */
const LiveUI: React.FC<{t: number}> = ({t}) => {
  const a = T('ringLive').t0 + 0.15, e = T('ringLive').t1;
  if (t < a || t >= e) return null;
  const viewers = 1; const blink = Math.floor(t * 2) % 2 === 0;
  return <AbsoluteFill style={{pointerEvents: 'none', fontFamily: 'Prompt, sans-serif'}}>
    <div style={{position: 'absolute', left: 60, top: 150, display: 'flex', gap: 18, alignItems: 'center'}}>
      <div style={{background: '#E8323C', color: '#fff', fontWeight: 700, fontSize: 40, padding: '6px 22px', borderRadius: 10, opacity: blink ? 1 : 0.75}}>● LIVE</div>
      <div style={{background: 'rgba(0,0,0,0.55)', color: '#fff', fontWeight: 600, fontSize: 38, padding: '6px 22px', borderRadius: 10}}>👁 {viewers}</div>
    </div>
    <div style={{position: 'absolute', left: 60, top: 250, color: '#fff', fontWeight: 700, fontSize: 44, textShadow: '0 3px 8px rgba(0,0,0,.7)'}}>สอนแต่งหน้า EP.1 · ลุคพ้นโทษ</div>
    <div style={{position: 'absolute', left: 60, top: 312, color: '#E6E7CF', fontWeight: 500, fontSize: 32, textShadow: '0 3px 8px rgba(0,0,0,.7)'}}>{HANDLE}</div>
  </AbsoluteFill>;
};

export const AbsurdEp9: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [P]);
  const sh = shotAt(t); const q = canvasQuality(quality);
  const files = getStaticFiles(); const audio = files.some((s) => s.name === MIX) ? MIX : files.some((s) => s.name === VOICE) ? VOICE : null;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.02)', filter: GRADE[PLACE(sh.name)]}}>
        {lib && ready && <ThreeCanvas key={'c'} width={W} height={H} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 600, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, stencil: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
          <World t={t} P={P} />
        </ThreeCanvas>}
      </AbsoluteFill>
      <Dark t={t} />
      <Grade frame={f} vig={0.16} />
      <SirenWash t={t} t0={ev('siren')} t1={T('bag').t0} amt={0.1} />
      <HangingPlate t={t} text="แอบอ้างตัวตน" drops={[ev('plate1')]} t1={ev('plate2')} />
      <HangingPlate t={t} text="ปลอมแปลงอัตลักษณ์" drops={[ev('plate2')]} t1={T('phone').t0} />
      <HangingPlate t={t} text="ดูหมิ่นศาล" drops={[ev('plate3')]} t1={T('darkCell').t0} />
      <CallScreen t={t} t0={ev('press') + 0.2} t1={T('swat').t0 - 0.001} />
      <Flash t={t} t0={ev('door')} d={0.08} max={0.3} />
      <Flash t={t} t0={ev('cuff')} d={0.06} max={0.25} />
      <Flash t={t} t0={ev('gavel1')} d={0.06} max={0.2} />
      <Flash t={t} t0={ev('gavel2')} d={0.06} max={0.2} />
      <Flash t={t} t0={ev('ring')} d={0.1} max={0.35} color="#FFF6E6" />
      <LiveUI t={t} />
      <Captions cards={CARDS} t={t} y={1395} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
