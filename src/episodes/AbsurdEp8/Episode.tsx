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
import {SHADOW_PROJ} from './props';
import {Captions, Grade, Flash, CallScreen} from '../AbsurdEp1/ui';
import {HangingPlate, SirenWash} from '../absurdkit';

export {TOTAL};
const MIX = 'absurd-cases/ep8/mix/ep8_mix.wav';
const VOICE = 'absurd-cases/ep8/ep8_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const PLACE = (n: string) => ['walk', 'look', 'shadowStep', 'charge', 'phone', 'callUI'].includes(n) ? 'street' : ['swat', 'lights', 'scrape', 'peel', 'fold', 'cuffs'].includes(n) ? 'raid'
  : ['interro', 'lamp', 'shrink', 'answerCU'].includes(n) ? 'interro' : ['court', 'gavel'].includes(n) ? 'court' : n === 'report' ? 'desk' : n === 'squash' || n === 'sun' ? 'noon' : 'prison';
const GRADE: Record<string, string> = {street: 'saturate(0.86) contrast(1.05)', raid: 'saturate(0.84) contrast(1.07)', interro: 'saturate(0.82) contrast(1.05)', court: 'saturate(0.8) contrast(1.05)',
  prison: 'saturate(0.86) contrast(1.04)', noon: 'saturate(0.92) contrast(1.1) brightness(1.04)', desk: 'saturate(0.9) contrast(1.04)'};
const FILL: Record<string, [string, number]> = {street: ['#E8EEF2', 0.35], raid: ['#E8EEF2', 0.35], interro: ['#D6DCE6', 0.3], court: ['#FFF1DE', 0.55], prison: ['#E8EEF2', 0.35], noon: ['#FFF6E0', 0.5], desk: ['#FFF6E8', 0.3]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#BFD6E4'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;   // keyed per shot (see EP6)
};

export const AbsurdEp8: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) { o.frustumCulled = false; if (id === 'shade') { o.material = SHADOW_PROJ; o.renderOrder = 2; } } }); } }, [P]);
  const sh = shotAt(t); const q = canvasQuality(quality);
  const files = getStaticFiles(); const audio = files.some((s) => s.name === MIX) ? MIX : files.some((s) => s.name === VOICE) ? VOICE : null;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.02)', filter: GRADE[PLACE(sh.name)]}}>
        {lib && ready && <ThreeCanvas key={'c'} width={W} height={H} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 600, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, logarithmicDepthBuffer: true, stencil: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
          <World t={t} P={P} />
        </ThreeCanvas>}
      </AbsoluteFill>
      <Grade frame={f} vig={0.16} />
      <SirenWash t={t} t0={ev('siren')} t1={T('scrape').t0} amt={0.08} />
      <HangingPlate t={t} text="คุกคามสะกดรอยตาม" drops={[ev('plate')]} t1={T('phone').t0} />
      <CallScreen t={t} t0={ev('press') + 0.2} t1={T('swat').t0 - 0.001} />
      <Flash t={t} t0={ev('lights')} d={0.1} max={0.35} />
      <Flash t={t} t0={ev('cuff')} d={0.06} max={0.25} />
      <Flash t={t} t0={ev('lamp')} d={0.08} max={0.3} color="#FFF4D8" />
      <Flash t={t} t0={ev('gavel')} d={0.06} max={0.2} />
      <Flash t={t} t0={ev('bell')} d={0.12} max={0.25} color="#FFE9A0" />
      <Captions cards={CARDS} t={t} y={1395} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
