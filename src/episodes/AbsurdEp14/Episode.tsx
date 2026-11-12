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
const MIX = 'absurd-cases/ep14/mix/ep14_mix.wav';
const VOICE = 'absurd-cases/ep14/ep14_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const IN = (n: string, a: string[]) => a.includes(n);
const PLACE = (n: string) => IN(n, ['patrol', 'cuff', 'backseat']) ? 'street' : IN(n, ['interro', 'shake', 'polygraph']) ? 'interro' : IN(n, ['court', 'sentence']) ? 'court' : n === 'cell18' ? 'cell' : 'room';
const GRADE: Record<string, string> = {room: 'saturate(0.85) contrast(1.05)', street: 'saturate(0.9) contrast(1.03)', interro: 'saturate(0.8) contrast(1.06)', court: 'saturate(0.8) contrast(1.05)', cell: 'saturate(0.75) contrast(1.08)'};
const FILL: Record<string, [string, number]> = {room: ['#8090C0', 0.35], street: ['#E8EEF2', 0.35], interro: ['#BFD6DA', 0.25], court: ['#FFF1DE', 0.5], cell: ['#8090B0', 0.3]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#2A2420'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;
};
export const AbsurdEp14: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
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
      <SirenWash t={t} t0={ev('siren')} t1={T('interro').t0} amt={0.06} />
      <HangingPlate t={t} text="ก่อความไม่สงบ" drops={[ev('plate1')]} t1={T('phone').t0} />
      <AbsoluteFill style={{transform: `scale(${1 + 0.1 * Math.max(0, t - ev('press') - 0.2)})`}}><CallScreen t={t} t0={ev('press') + 0.2} t1={T('patrol').t0 - 0.001} /></AbsoluteFill>
      <Stamp text="ห้าพันล้านปี" t={t} t0={ev('plate2')} t1={T('cell18').t0} />
      {['cuff', 'doorShut', 'gavel', 'cellShut'].map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.2} />)}
      <Captions cards={CARDS} t={t} y={1395} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
