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
const MIX = 'absurd-cases/ep17/mix/ep17_mix.wav';
const VOICE = 'absurd-cases/ep17/ep17_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const IN = (n: string, a: string[]) => a.includes(n);
const PLACE = (n: string) => IN(n, ['interro', 'burn', 'soot']) ? 'interro' : n === 'court' ? 'court' : n === 'fridge' ? 'cell' : 'town';
const GRADE: Record<string, string> = {town: 'saturate(1.0) contrast(1.05)', interro: 'saturate(0.85) contrast(1.06)', court: 'saturate(0.82) contrast(1.05)', cell: 'saturate(0.8) contrast(1.08)'};
const FILL: Record<string, [string, number]> = {town: ['#DCE8F2', 0.3], interro: ['#BFD6DA', 0.25], court: ['#FFF1DE', 0.5], cell: ['#8090B0', 0.3]};
/** ambient occlusion + bloom per place: the fire should glow, so the bloom is a little higher than EP16's daylight */
const POST: Record<string, {ao: number; bloom: number; threshold: number}> = {town: {ao: 1, bloom: 0.3, threshold: 0.9}, interro: {ao: 1, bloom: 0.12, threshold: 0.97}, court: {ao: 1, bloom: 0.2, threshold: 0.97}, cell: {ao: 1, bloom: 0.5, threshold: 0.88}};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const place = PLACE(sh.name); const [fc, fi] = FILL[place];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#2A2420'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group><Post {...POST[place]} /></>;
};
export const AbsurdEp17: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
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
      <HangingPlate t={t} text="วางเพลิง" drops={[ev('plate')]} t1={T('phone').t0 - 1 / 30} top={0.1} w={0.9} />
      {['fire', 'flare', 'cuff', 'slap', 'gavel', 'shut', 'fire2'].map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.2} />)}
      <Captions cards={CARDS} t={f30 / FPS} y={1395} />   {/* whole 30 fps frames: a caption swap must not be averaged into a 1-frame dissolve */}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
