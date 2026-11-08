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
const MIX = 'absurd-cases/ep5/mix/ep5_mix.wav';
const VOICE = 'absurd-cases/ep5/ep5_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const BATH = 'saturate(0.86) contrast(1.06)', INT = 'saturate(0.74) contrast(1.08)', CRT = 'saturate(0.81) contrast(1.05)', CELLG = 'saturate(0.72) contrast(1.06)', DESK = 'saturate(0.85) contrast(1.05)';
const PLACE = (n: string) => ['interro', 'soapAnswer'].includes(n) ? 'interro' : n === 'court' ? 'court' : ['cell18', 'fan19', 'foamFlood', 'slide', 'chase'].includes(n) ? 'cell' : n === 'report' ? 'desk' : 'bath';
const GRADE: Record<string, string> = {bath: BATH, interro: INT, court: CRT, cell: CELLG, desk: DESK};
const FILL: Record<string, [string, number]> = {bath: ['#FFE6E8', 0.55], interro: ['#BFD6D8', 1.2], court: ['#FFF1DE', 0.55], cell: ['#D6DCE6', 1.0], desk: ['#FFF1DE', 0.6]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#2A2226'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;   // keyed per shot: a person object moving between slots of two shots was re-added then removed (vanished on sequential renders)
};

export const AbsurdEp5: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [P]);
  const sh = shotAt(t); const q = canvasQuality(quality);
  const files = getStaticFiles(); const audio = files.some((s) => s.name === MIX) ? MIX : files.some((s) => s.name === VOICE) ? VOICE : null;
  const call = T('callUI');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.02)', filter: GRADE[PLACE(sh.name)]}}>
        {lib && ready && <ThreeCanvas key={'c'} width={W} height={H} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 400, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, logarithmicDepthBuffer: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
          <World t={t} P={P} />
        </ThreeCanvas>}
      </AbsoluteFill>
      <Grade frame={f} vig={0.16} />
      <SirenWash t={t} t0={ev('siren')} t1={T('interro').t0} amt={0.14} />
      <SirenWash t={t} t0={ev('prisonSiren')} t1={T('report').t0} amt={0.12} />
      <HangingPlate t={t} text="พยายามฆ่า" drops={[ev('plate')]} t1={T('phone').t0} />
      <CallScreen t={t} t0={call.t0} t1={call.t1 - 0.001} />
      <Flash t={t} t0={ev('kick') + 0.02} d={0.08} max={0.25} />
      <Flash t={t} t0={ev('lock')} max={0.25} />
      <Flash t={t} t0={ev('gavel')} max={0.2} />
      <Flash t={t} t0={ev('stamp') + 0.12} d={0.06} max={0.15} />
      <Captions cards={CARDS} t={t} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
