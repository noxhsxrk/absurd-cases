import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {IDS, applyBombSuit} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, LN} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, TitlePlate, Stamp, Grade, Flash} from '../AbsurdEp1/ui';
import {CallScreen2} from './ui';

export {TOTAL};
const MIX = 'absurd-cases/ep2/mix/ep2_mix.wav';
const NIGHT = 'saturate(0.78) contrast(1.06) brightness(1.04)', INT = 'saturate(0.74) contrast(1.08)', CELLG = 'saturate(0.66) contrast(1.06)';
const GRADE: Record<string, string> = {fanPress: NIGHT, fingerECU: NIGHT, zapped: NIGHT, fanScale: NIGHT, phone: NIGHT, callUI: NIGHT, squadWalk: 'saturate(0.85) contrast(1.08) brightness(1.08)', doorway: NIGHT, surround: NIGHT, soiCut: 'saturate(0.85) contrast(1.08) brightness(1.08)', cuffECU: NIGHT,
  interroFront: INT, caseFile: 'saturate(0.8) contrast(1.06)', shakeNo: INT, plugECU: INT, windDown: INT, confess: INT, court: 'saturate(0.81) contrast(1.05)', cell19: CELLG, press3: CELLG, cellBlock: CELLG, mosqBlown: CELLG, mosqWall: CELLG, mosqECU: CELLG, reportForm: 'saturate(0.8) contrast(1.06)'};
const FILL: Record<string, [string, number]> = {bed: ['#B3C4E6', 1.25], street: ['#AFC0E8', 0.9], interro: ['#BFD6D8', 1.25], court: ['#FFF1DE', 0.55], cell: ['#D6DCE6', 1.0], lamp: ['#FFE9CF', 0.75]};
const PLACE: Record<string, string> = {fanPress: 'lamp', fingerECU: 'lamp', zapped: 'lamp', fanScale: 'lamp', phone: 'lamp', callUI: 'lamp', squadWalk: 'street', doorway: 'lamp', surround: 'lamp', soiCut: 'street', cuffECU: 'bed', interroFront: 'interro', caseFile: 'interro', shakeNo: 'interro', plugECU: 'interro', windDown: 'interro', confess: 'interro', court: 'court', cell19: 'cell', press3: 'cell', cellBlock: 'cell', mosqBlown: 'cell', mosqWall: 'cell', mosqECU: 'cell', reportForm: 'interro'};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE[sh.name]] ?? ['#ffffff', 0.6];
  return <><CamRig cam={out.cam} bg={out.bg ?? null} /><ambientLight color={fc} intensity={fi} />{out.node}</>;
};

export const AbsurdEp2: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  useMemo(() => { for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); applyBombSuit(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [P]);
  const sh = shotAt(t); const q = canvasQuality(quality);
  const hasMix = getStaticFiles().some((s) => s.name === MIX);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.02)', filter: GRADE[sh.name] ?? 'none'}}>
        {lib && ready && <ThreeCanvas key={'c'} width={W} height={H} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 400, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, logarithmicDepthBuffer: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
          <World t={t} P={P} />
        </ThreeCanvas>}
      </AbsoluteFill>
      {sh.name === 'soiCut' && t >= ev('out1') && <AbsoluteFill style={{background: '#070B18', opacity: t >= ev('out3') ? 0.62 : t >= ev('out2') ? 0.36 : 0.16, pointerEvents: 'none'}} />}
      <Grade frame={f} vig={0.12} />
      <CallScreen2 t={t} t0={ev('callUI')} t1={ev('callElec')} t2={LN.l005.t0 - 0.06} />
      <Stamp text="รับสารภาพ" t={t} t0={ev('stamp')} t1={LN.l011.t0 - 0.06} />
      <TitlePlate text="จำคุก 20 ปี" t={t} t0={ev('sentence')} t1={ev('cellDoor')} />
      <Flash t={t} t0={ev('zap')} max={0.5} />
      <Flash t={t} t0={ev('cut')} max={0.45} />
      <Flash t={t} t0={ev('cuff')} max={0.3} />
      <Flash t={t} t0={ev('stamp')} max={0.25} />
      <Flash t={t} t0={ev('gavel')} max={0.2} />
      <Flash t={t} t0={ev('splat')} max={0.2} />
      <Captions cards={CARDS} t={t} />
      {hasMix && <Audio src={staticFile(MIX)} />}
    </AbsoluteFill>
  );
};
