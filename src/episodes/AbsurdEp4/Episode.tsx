import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {IDS} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook, setFaceStyle} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, LN} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, Grade, Flash} from '../AbsurdEp1/ui';
import {HangingPlate, SirenWash} from '../absurdkit';

export {TOTAL};
const MIX = 'absurd-cases/ep4/mix/ep4_mix.wav';
const NIGHT = 'saturate(0.85) contrast(1.08) brightness(0.98)', INT = 'saturate(0.74) contrast(1.08)', CRT = 'saturate(0.81) contrast(1.05)', CELLG = 'saturate(0.7) contrast(1.06)';
const PLACE = (n: string) => ['interro', 'officerAsk', 'askClose', 'durianAnswer', 'smellRoom', 'faint', 'faintTop'].includes(n) ? 'interro' : n === 'court' ? 'court' : ['cell20', 'fan19', 'smellFlow', 'cell18', 'form'].includes(n) ? 'cell' : 'kitchen';
const GRADE: Record<string, string> = {kitchen: NIGHT, interro: INT, court: CRT, cell: CELLG};
const FILL: Record<string, [string, number]> = {kitchen: ['#6A7CA8', 0.35], interro: ['#BFD6D8', 1.2], court: ['#FFF1DE', 0.55], cell: ['#D6DCE6', 1.0]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#151B26'}} /><ambientLight color={fc} intensity={fi} />{out.node}</>;
};

export const AbsurdEp4: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [P]);
  const sh = shotAt(t); const q = canvasQuality(quality);
  const hasMix = getStaticFiles().some((s) => s.name === MIX);
  // the interrupted line: captions go silent with it
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.02)', filter: GRADE[PLACE(sh.name)]}}>
        {lib && ready && <ThreeCanvas key={'c'} width={W} height={H} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 400, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, logarithmicDepthBuffer: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
          <World t={t} P={P} />
        </ThreeCanvas>}
      </AbsoluteFill>
      <Grade frame={f} vig={0.16} />
      <SirenWash t={t} t0={ev('siren')} t1={LN.l008.t0 - 0.06} amt={0.16} />
      <HangingPlate t={t} text="ก่อเหตุเดือดร้อนรำคาญ" drops={[ev('plate')]} t1={LN.l004.t0 + 0.6} />
      <Flash t={t} t0={ev('doorBurst') + 0.3} d={0.08} max={0.25} />
      <Flash t={t} t0={ev('cuff')} max={0.3} />
      <Flash t={t} t0={ev('gavel')} max={0.2} />
      <Captions cards={CARDS} t={t} />
      {hasMix && <Audio src={staticFile(MIX)} />}
    </AbsoluteFill>
  );
};
