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
import {Captions, Grade, Flash, CallScreen, Stamp} from '../AbsurdEp1/ui';
import {HangingPlate, SirenWash} from '../absurdkit';

export {TOTAL};
const MIX = 'absurd-cases/ep13/mix/ep13_mix.wav';
const VOICE = 'absurd-cases/ep13/ep13_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const IN = (n: string, a: string[]) => a.includes(n);
const PLACE = (n: string) => IN(n, ['courtJar', 'gavel']) ? 'court' : IN(n, ['foam', 'reduced', 'sing']) ? 'cell' : IN(n, ['release', 'hoarse']) ? 'prison' : IN(n, ['haunted', 'boo', 'retire', 'final']) ? 'night' : 'room';
const GRADE: Record<string, string> = {room: 'saturate(0.9) contrast(1.03)', court: 'saturate(0.8) contrast(1.05)', cell: 'saturate(0.75) contrast(1.08)', prison: 'saturate(0.86) contrast(1.04)', night: 'saturate(0.8) contrast(1.06)'};
const FILL: Record<string, [string, number]> = {room: ['#FFF1DE', 0.3], court: ['#FFF1DE', 0.5], cell: ['#8090B0', 0.3], prison: ['#E8EEF2', 0.35], night: ['#6070A0', 0.25]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#2A2420'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;
};
export const AbsurdEp13: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
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
      <SirenWash t={t} t0={ev('siren')} t1={T('mediate').t0} amt={0.06} />
      <HangingPlate t={t} text="ละเมิดลิขสิทธิ์ทางเสียง" drops={[ev('plate1')]} t1={T('phone').t0} />
      <AbsoluteFill style={{transform: `scale(${1 + 0.1 * Math.max(0, t - ev('press') - 0.2)})`}}><CallScreen t={t} t0={ev('press') + 0.2} t1={T('cops').t0 - 0.001} /></AbsoluteFill>
      <Stamp text="ลดโทษ" t={t} t0={ev('cut')} t1={T('sing').t0} />
      {['hit1', 'hit2', 'hit3', 'hit4', 'lid', 'gavel', 'cellShut', 'boo'].map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.2} />)}
      <Captions cards={CARDS} t={t} y={1395} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
