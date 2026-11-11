import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {IDS} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook, setFaceStyle} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, SHOTS} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, Grade, Flash, CallScreen} from '../AbsurdEp1/ui';
import {HangingPlate, SirenWash} from '../absurdkit';

export {TOTAL};
const MIX = 'absurd-cases/ep12/mix/ep12_mix.wav';
const VOICE = 'absurd-cases/ep12/ep12_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const IN = (n: string, a: string[]) => a.includes(n);
const PLACE = (n: string) => IN(n, ['court', 'crossed', 'gavel']) ? 'court' : IN(n, ['split', 'apart', 'years', 'rightIn']) ? 'cell' : IN(n, ['leftOut', 'early']) ? 'prison' : n === 'van' ? 'road' : 'street';
const GRADE: Record<string, string> = {street: 'saturate(0.9) contrast(1.03)', court: 'saturate(0.8) contrast(1.05)', cell: 'saturate(0.75) contrast(1.08)', prison: 'saturate(0.86) contrast(1.04)', road: 'saturate(0.88) contrast(1.03)'};
const FILL: Record<string, [string, number]> = {street: ['#E8EEF2', 0.25], court: ['#FFF1DE', 0.5], cell: ['#8090B0', 0.3], prison: ['#E8EEF2', 0.35], road: ['#E8EEF2', 0.25]};
/** "ที่วางสลับข้างไว้": red annotation over the top-down ECU — a dashed box on each foot, ✕ and the label */
const SwapNote: React.FC<{t: number}> = ({t}) => { const s = T('swapped'); if (t < s.t0 + 0.35 || t >= s.t1) return null; const k = Math.min(1, (t - s.t0 - 0.35) / 0.12);
  const box = (x: number, label: string) => <div style={{position: 'absolute', left: x, top: 640, width: 300, height: 560, border: '8px dashed #E0262B', borderRadius: 28, opacity: k}}>
    <div style={{position: 'absolute', top: -96, left: 0, right: 0, textAlign: 'center', color: '#E0262B', font: '700 64px Prompt, sans-serif', textShadow: '0 0 6px #fff'}}>{label}</div>
    <div style={{position: 'absolute', bottom: -110, left: 0, right: 0, textAlign: 'center', color: '#E0262B', font: '700 110px Prompt, sans-serif', textShadow: '0 0 6px #fff'}}>✕</div></div>;
  return <AbsoluteFill>{box(40, 'เท้าขวา')}{box(660, 'เท้าซ้าย')}</AbsoluteFill>; };
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#BFD6E4'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;
};
export const AbsurdEp12: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
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
      <Grade frame={f} vig={0.16} />
      <SirenWash t={t} t0={ev('siren')} t1={T('towCall').t0} amt={0.06} />
      <HangingPlate t={t} text="ดัดแปลงสภาพทางสัญจร" drops={[ev('plate1')]} t1={T('phone').t0} />
      <AbsoluteFill style={{transform: `scale(${1 + 0.1 * Math.max(0, t - ev('press') - 0.2)})`}}><CallScreen t={t} t0={ev('press') + 0.2} t1={T('cop').t0 - 0.001} /></AbsoluteFill>
      <SwapNote t={t} />
      {['fall', 'clamp', 'hook', 'gavel', 'cellShut'].map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.22} />)}
      <Captions cards={CARDS} t={t} y={1395} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
