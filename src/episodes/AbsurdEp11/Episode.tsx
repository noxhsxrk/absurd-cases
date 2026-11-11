import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {IDS, SQUAD, applyBombSuit} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook, setFaceStyle} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, SHOTS} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, Grade, Flash, CallScreen, Stamp} from '../AbsurdEp1/ui';
import {HangingPlate, SirenWash} from '../absurdkit';

export {TOTAL};
const MIX = 'absurd-cases/ep11/mix/ep11_mix.wav';
const VOICE = 'absurd-cases/ep11/ep11_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const IN = (n: string, a: string[]) => a.includes(n);
const PLACE = (n: string) => IN(n, ['sleep', 'ring', 'early', 'charge', 'phone', 'callUI']) ? 'bed' : IN(n, ['raid', 'surround', 'pliers', 'battery', 'carry']) ? 'raid'
  : IN(n, ['interro', 'file', 'tick', 'defy']) ? 'interro' : IN(n, ['court', 'unhand']) ? 'court' : IN(n, ['cell', 'parole', 'onTime']) ? 'cell' : IN(n, ['release', 'noHands']) ? 'prison' : 'sala';
const GRADE: Record<string, string> = {bed: 'saturate(0.88) contrast(1.05)', raid: 'saturate(0.86) contrast(1.07)', interro: 'saturate(0.82) contrast(1.05)', court: 'saturate(0.8) contrast(1.05)',
  cell: 'saturate(0.75) contrast(1.08)', prison: 'saturate(0.86) contrast(1.04)', sala: 'saturate(0.9) contrast(1.03)'};
const FILL: Record<string, [string, number]> = {bed: ['#9FB0D8', 0.22], raid: ['#9FB0D8', 0.3], interro: ['#D6DCE6', 0.3], court: ['#FFF1DE', 0.5], cell: ['#8090B0', 0.3], prison: ['#E8EEF2', 0.35], sala: ['#E8EEF2', 0.3]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#BFD6E4'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;
};
export const AbsurdEp11: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); if (SQUAD.includes(id)) applyBombSuit(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [P]);
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
      <SirenWash t={t} t0={ev('siren')} t1={T('interro').t0} amt={0.1} />
      <HangingPlate t={t} text="ปลอมแปลงเวลาราชการ" drops={[ev('plate1')]} t1={T('phone').t0} />
      <AbsoluteFill style={{transform: `scale(${1 + 0.05 * Math.max(0, t - ev('press') - 0.2)})`}}><CallScreen t={t} t0={ev('press') + 0.2} t1={T('raid').t0 - 0.001} /></AbsoluteFill>
      <Stamp text="ลดโทษ" t={t} t0={ev('stamp')} t1={T('onTime').t0} />
      {['door', 'pull', 'slam', 'rage', 'gavel', 'unhand', 'cellShut'].map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.25} />)}
      <Captions cards={CARDS} t={t} y={1395} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
