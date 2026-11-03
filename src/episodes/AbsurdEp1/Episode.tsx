import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import './cast';
import {IDS} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook} from './boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, LN} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, TitlePlate, Stamp, CallScreen, NewsBar, Grade, Flash} from './ui';

export {TOTAL};
const MIX = 'absurd-cases/ep1/mix/ep1_mix.wav';
// per-shot grade: night shots cooler, the court warm, the cell flat
const GRADE: Record<string, string> = {
  bedWide: 'saturate(0.78) contrast(1.06)', bedSleep: 'saturate(0.72) contrast(1.08) brightness(1.05)', mosqFly: 'saturate(0.72) contrast(1.08) brightness(1.08)', bite: 'saturate(0.77) contrast(1.08) brightness(1.08)',
  assault: 'saturate(0.81) contrast(1.06)', phone: 'saturate(0.81) contrast(1.06)', vans: 'saturate(0.85) contrast(1.1) brightness(1.08)', commandos: 'saturate(0.77) contrast(1.06)', ring: 'saturate(0.77) contrast(1.06)', cuff: 'saturate(0.81) contrast(1.06)',
  caseFile: 'saturate(0.8) contrast(1.06)', interroWide: 'saturate(0.72) contrast(1.1)', officerLean: 'saturate(0.72) contrast(1.1)', mosqJar: 'saturate(0.77) contrast(1.1)', confess: 'saturate(0.72) contrast(1.1)',
  court: 'saturate(0.81) contrast(1.05)', gavelECU: 'saturate(0.81) contrast(1.05)', cell: 'saturate(0.64) contrast(1.06)', tally: 'saturate(0.64) contrast(1.06)', news: 'saturate(0.77) contrast(1.08) brightness(1.1)', swarm: 'saturate(0.77) contrast(1.08) brightness(1.1)', swarmLow: 'saturate(0.77) contrast(1.08) brightness(1.1)', window: 'saturate(0.72) contrast(1.1) brightness(1.06)',
};

// flat painted look: a strong soft fill per place so nothing goes darker than the reference's mid-tones
const FILL: Record<string, [string, number]> = {bed: ['#B3C4E6', 1.25], street: ['#AFC0E8', 0.9], interro: ['#BFD6D8', 1.25], court: ['#FFF1DE', 0.55], cell: ['#D6DCE6', 1.0], town: ['#A9B8E0', 0.7], lamp: ['#FFE9CF', 0.75]};
const PLACE: Record<string, string> = {bedWide: 'lamp', bedSleep: 'bed', mosqFly: 'bed', bite: 'bed', assault: 'lamp', phone: 'lamp', vans: 'street', commandos: 'lamp', ring: 'lamp', cuff: 'lamp', caseFile: 'interro', interroWide: 'interro', officerLean: 'interro', mosqJar: 'interro', confess: 'interro', court: 'court', gavelECU: 'court', cell: 'cell', tally: 'cell', news: 'town', swarm: 'town', swarmLow: 'town', window: 'bed'};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE[sh.name]] ?? ['#ffffff', 0.6];
  return <><CamRig cam={out.cam} bg={out.bg ?? null} /><ambientLight color={fc} intensity={fi} />{out.node}</>;
};

export const AbsurdEp1: React.FC<{quality?: Quality; tmap?: number[]}> = ({quality = 'fast', tmap}) => {
  const f = useCurrentFrame(); const t = tmap ? tmap[Math.min(f, tmap.length - 1)] : f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  // skinned toon bodies are re-posed and re-parented shot to shot (lying, sitting, running): a bounding sphere cached
  // in another pose can cull the whole body on the GPU path, so the cast is never frustum-culled
  useMemo(() => { for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [P]);
  const sh = shotAt(t); const q = canvasQuality(quality);
  const hasMix = getStaticFiles().some((s) => s.name === MIX);
  const l3 = LN.l003, l10 = LN.l010, l11 = LN.l011, l12 = LN.l012;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.02)', filter: GRADE[sh.name] ?? 'none'}}>
        {lib && ready && <ThreeCanvas key={'c'} width={W} height={H} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 400, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, logarithmicDepthBuffer: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
          <World t={t} P={P} />
        </ThreeCanvas>}
      </AbsoluteFill>
      <Grade frame={f} vig={0.12} />
      <CallScreen t={t} t0={ev('callUI')} t1={LN.l005.t0 - 0.12} />
      <Stamp text="รับสารภาพ" t={t} t0={ev('stamp')} t1={l11.t0 - 0.12} />
      <TitlePlate text="จำคุกตลอดชีวิต" t={t} t0={ev('lifePlaque')} t1={l12.t0 - 0.1} />
      <TitlePlate text="ตลอดชีวิต" t={t} t0={LN.l012.t0 + 0.05} t1={LN.l013.t0 - 0.12} strike={Math.min(1, Math.max(0, (t - ev('legsUp') + 0.25) / 0.3))} sub="= 14 วัน" />
      <NewsBar t={t} t0={ev('news')} t1={ev('window')} />
      <Flash t={t} t0={ev('cuff')} max={0.35} />
      <Flash t={t} t0={ev('stamp')} max={0.25} />
      <Flash t={t} t0={ev('gavel')} max={0.2} />
      <Captions cards={CARDS} t={t} />
      {hasMix && <Audio src={staticFile(MIX)} />}
    </AbsoluteFill>
  );
};
