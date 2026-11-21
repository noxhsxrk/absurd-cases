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
const MIX = 'absurd-cases/ep27/mix/ep27_mix.wav';
const VOICE = 'absurd-cases/ep27/ep27_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const IN = (n: string, a: string[]) => a.includes(n);
/** four lights: the block in the morning (inside, green gas), the yard outside at dawn, macro close-ups, and the block at night (cliffhanger) */
/** the block at night (inside, weightless), the yard outside the wall (gravity), and macro close-ups */
/** the block at night (inside, weightless), the yard outside the wall (gravity), and macro close-ups */
const PLACE = (n: string) => IN(n, ['pocket', 'ringcu', 'cuffed', 'cant', 'drops', 'dropcu', 'stand', 'free', 'lamp']) ? 'out' : IN(n, ['five', 'call']) ? 'close' : 'night';
const GRADE: Record<string, string> = {day: 'saturate(0.95) contrast(1.06)', night: 'saturate(0.82) contrast(1.08) brightness(0.95)', out: 'saturate(0.88) contrast(1.1)', close: 'saturate(0.9) contrast(1.05)'};
const FILL: Record<string, [string, number]> = {day: ['#C8C4B0', 0.5], night: ['#7088C0', 0.32], out: ['#5E70A0', 0.3], close: ['#B8C4DC', 0.45]};
/** ambient occlusion + bloom per place: siren bars, the searchlight and the fridge fire glow, so the bloom stays moderate */
const POST: Record<string, {ao: number; bloom: number; threshold: number}> = {day: {ao: 1, bloom: 0.18, threshold: 0.95}, night: {ao: 1, bloom: 0.35, threshold: 0.85}, out: {ao: 1, bloom: 0.4, threshold: 0.85}, close: {ao: 1, bloom: 0.25, threshold: 0.92}};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const place = PLACE(sh.name); const [fc, fi] = FILL[place];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#2A2420'}} /><ambientLight color={fc} intensity={fi} />{(out as any).fog && <fog attach="fog" args={(out as any).fog} />}<group key={sh.name}>{out.node}</group><Post {...POST[place]} /></>;
};
export const AbsurdEp27: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
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
      <HangingPlate t={t} text="ซ่องโจร" drops={[ev('plate')]} t1={T('call').t0 - 1 / 30} top={0.1} w={0.6} />
      {['c5', 'ld4'].map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.2} />)}
      {t > ev('black') - 0.5 && <AbsoluteFill style={{background: '#000', opacity: Math.min(1, (t - ev('black') + 0.5) / 0.5)}} />}   {/* cliffhanger: cut to black */}
      <Captions cards={CARDS} t={f30 / FPS} y={1395} />   {/* whole 30 fps frames: a caption swap must not be averaged into a 1-frame dissolve */}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
