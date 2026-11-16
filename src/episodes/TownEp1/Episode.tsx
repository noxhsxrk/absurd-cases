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
import {FPS, W, H, TOTAL, ev, CARDS, shotAt} from './data';
import {SHOT_FN, CamRig, sunEl, FLASH} from './shots';
import {dayK} from './props';
import {Captions, Grade, Flash} from '../AbsurdEp1/ui';

export {TOTAL};
/** ในเมืองนี้ EP1 (หาว). Same pipeline as absurd-cases (box cast on mocap, motion blur via the Blur composition), its own town and cast. */
export const BLUR_SUB = 6;
const MIX = 'in-this-town/ep1/mix/ep1_mix.wav';
const VOICE = 'in-this-town/ep1/ep1_narration_tight.wav';   // until the mix exists
const IN = (n: string, a: string[]) => a.includes(n);
const ROOM = ['open', 'curtains', 'yaiTorch', 'yaiDoor', 'yaiChair', 'layers', 'wall', 'photo', 'megaphone', 'curtainOpen', 'yaiFace', 'yaiTells', 'diagramYawn', 'diagramGasp', 'diagramUp', 'borrow', 'darkRoom', 'together', 'togetherWide', 'yaiSays', 'yaiSmile', 'tvPart2', 'part2', 'yaiYawn'];
const HALL = ['hall', 'boss', 'podium', 'slide1', 'stack', 'clapHall', 'slide50', 'stillBoss', 'appendix', 'climb', 'onAir', 'kidMic', 'bossTurns', 'boring', 'bossGasp', 'count'];
const LIVING = ['clapHome', 'kidTV', 'tally', 'slide10', 'slide200', 'calendar', 'calendar2'];
/** the flashback (thirty years ago) is graded sepia wherever it happens */
const PLACE = (n: string) => IN(n, FLASH) ? 'flash' : IN(n, ROOM) ? 'room' : IN(n, HALL) ? 'hall' : IN(n, LIVING) ? 'living' : IN(n, ['crib', 'bottle']) ? 'nursery' : IN(n, ['school', 'bell', 'drawing', 'drawingCU']) ? 'school' : IN(n, ['book', 'illegal']) ? 'office' : IN(n, ['courtKid', 'gavel']) ? 'court' : n === 'yaiWindow' || n === 'windowCU' ? 'nursery' : 'street';
const GRADE: Record<string, string> = {room: 'saturate(0.85) contrast(1.08)', nursery: 'saturate(0.95) contrast(1.03)', school: 'saturate(0.95) contrast(1.04)', office: 'saturate(0.85) contrast(1.05)', street: 'saturate(1.0) contrast(1.05)', hall: 'saturate(0.95) contrast(1.06)', living: 'saturate(0.92) contrast(1.05)', court: 'saturate(0.85) contrast(1.05)', flash: 'sepia(0.85) saturate(0.75) contrast(1.08) brightness(0.95)'};
/** the street's fill follows the sun (sunEl): bright by day, a cold blue at night */
const fill = (place: string, t: number): [string, number] => place === 'street' || place === 'flash' ? ['#C8D6E8', 0.12 + 0.2 * dayK(sunEl(t))] : place === 'room' ? ['#6A74A8', 0.32] : ['#FFF4E4', 0.25];
const POST: Record<string, {ao: number; bloom: number; threshold: number}> = {room: {ao: 1, bloom: 0.32, threshold: 0.9}, nursery: {ao: 1, bloom: 0.15, threshold: 0.96}, school: {ao: 1, bloom: 0.15, threshold: 0.96}, office: {ao: 1, bloom: 0.12, threshold: 0.97}, street: {ao: 1, bloom: 0.35, threshold: 0.88}, hall: {ao: 1, bloom: 0.25, threshold: 0.92}, living: {ao: 1, bloom: 0.25, threshold: 0.92}, court: {ao: 1, bloom: 0.2, threshold: 0.97}, flash: {ao: 1, bloom: 0.35, threshold: 0.88}};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const place = PLACE(sh.name); const [fc, fi] = fill(place, t);
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#2A2420'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group><Post {...POST[place]} /></>;
};
export const TownEp1: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
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
      {['flash', 'stamp', 'tape', 'tapeU', 'gavel30', 'gavel', 'shout', 'gasp'].map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.2} />)}
      <Captions cards={CARDS} t={f30 / FPS} y={1395} />   {/* whole 30 fps frames: a caption swap must not be averaged into a 1-frame dissolve */}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
