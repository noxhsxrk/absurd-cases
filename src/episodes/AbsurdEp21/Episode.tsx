import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {IDS} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook, setFaceStyle} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {Post} from '../../pov/lib/post';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, SHOTS} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, Grade, Flash} from '../AbsurdEp1/ui';
import {HangingPlate} from '../absurdkit';

export {TOTAL};
/** Motion blur (ref6: every fast move is blurred): the same composition registered at FPS × BLUR_SUB frames per second; ffmpeg then averages each
 *  group of BLUR_SUB sub-frames into one 30 fps frame (tools/render_blur.py). Everything here runs on t in seconds, so both rates give the same film. */
export const BLUR_SUB = 6;
const MIX = 'absurd-cases/ep21/mix/ep21_mix.wav';
const VOICE = 'absurd-cases/ep21/ep21_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const IN = (n: string, a: string[]) => a.includes(n);
/** one place, three lights: the cell block by day, macro close-ups, and the block at night (the cliffhanger) */
const PLACE = (n: string) => IN(n, ['night', 'bubbles', 'grab']) ? 'night' : IN(n, ['bite', 'diagram', 'cuffs']) ? 'close' : 'cell';
const GRADE: Record<string, string> = {cell: 'saturate(0.88) contrast(1.06)', close: 'saturate(0.92) contrast(1.05)', night: 'saturate(0.8) contrast(1.1) brightness(0.9)'};
const FILL: Record<string, [string, number]> = {cell: ['#C8D2E0', 0.45], close: ['#D6DCE6', 0.5], night: ['#6A7FB0', 0.28]};
/** ambient occlusion + bloom per place: the fire in the fridge and the moon glow, so the bloom stays moderate */
const POST: Record<string, {ao: number; bloom: number; threshold: number}> = {cell: {ao: 1, bloom: 0.45, threshold: 0.88}, close: {ao: 1, bloom: 0.3, threshold: 0.92}, night: {ao: 1, bloom: 0.35, threshold: 0.85}};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const place = PLACE(sh.name); const [fc, fi] = FILL[place];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#2A2420'}} /><ambientLight color={fc} intensity={fi} />{(out as any).fog && <fog attach="fog" args={(out as any).fog} />}<group key={sh.name}>{out.node}</group><Post {...POST[place]} /></>;
};
export const AbsurdEp21: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps; const f30 = Math.floor(t * FPS);
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
      <Grade frame={f30} vig={0.16} />
      <HangingPlate t={t} text="ทำร้ายร่างกาย" drops={[ev('plate')]} t1={T('phone').t0 - 1 / 30} top={0.1} w={0.9} />
      <HangingPlate t={t} text="ทำร้ายร่างกาย" drops={[ev('plate2')]} t1={T('phone2').t0 - 1 / 30} top={0.1} w={0.9} />
      <HangingPlate t={t} text="× ล้านกระทง" drops={[ev('plate3')]} t1={T('phone2').t0 - 1 / 30} top={0.255} w={0.62} />
      {['bite', 'cuff'].map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.15} />)}
      {t > ev('black') - 0.5 && <AbsoluteFill style={{background: '#000', opacity: Math.min(1, (t - ev('black') + 0.5) / 0.5)}} />}   {/* cliffhanger: cut to black */}
      <Captions cards={CARDS} t={f30 / FPS} y={1395} />   {/* whole 30 fps frames: a caption swap must not be averaged into a 1-frame dissolve */}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
