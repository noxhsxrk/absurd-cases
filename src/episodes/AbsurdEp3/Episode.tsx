import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {IDS} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, LN} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, Stamp, Grade, Flash, CallScreen} from '../AbsurdEp1/ui';
import {NewsBar3, SirenWash} from './ui';

export {TOTAL};
const MIX = 'absurd-cases/ep3/mix/ep3_mix.wav';
const DAY = 'saturate(0.8) contrast(1.05) brightness(1.02)', SKY = 'saturate(0.82) contrast(1.05)', INT = 'saturate(0.74) contrast(1.08)', CRT = 'saturate(0.81) contrast(1.05)', CELLG = 'saturate(0.68) contrast(1.06)';
const PLACE: Record<string, string> = {openWindow: 'bed', dustAir: 'bed', noseCU: 'bed', sneeze: 'bed', dustScale: 'bed', stare: 'bed', phone: 'bed', callUI: 'bed',
  helis: 'sky', vacuum: 'sky', skyClean: 'sky', jarLid: 'interro', jarCuff: 'interro', court: 'court', judge: 'court', caseFile: 'court', jarECU: 'court', courtWide: 'court', gavel: 'court',
  cellBlock: 'cell', cell19: 'cell', fanTurn: 'cell', dustOut: 'cell', escape: 'out', plateNail: 'cell', fanCuffed: 'cell'};
const GRADE: Record<string, string> = {bed: DAY, sky: SKY, interro: INT, court: CRT, cell: CELLG, out: SKY};
const FILL: Record<string, [string, number]> = {bed: ['#F2EBDD', 0.55], sky: ['#E6E8E2', 0.35], interro: ['#BFD6D8', 1.25], court: ['#FFF1DE', 0.55], cell: ['#D6DCE6', 1.0], out: ['#E6E8E2', 0.3]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE[sh.name]] ?? ['#ffffff', 0.6];
  return <><CamRig cam={out.cam} bg={out.bg ?? null} /><ambientLight color={fc} intensity={fi} />{out.node}</>;
};

export const AbsurdEp3: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  useMemo(() => { for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [P]);
  const sh = shotAt(t); const q = canvasQuality(quality);
  const hasMix = getStaticFiles().some((s) => s.name === MIX);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.02)', filter: GRADE[PLACE[sh.name]] ?? 'none'}}>
        {lib && ready && <ThreeCanvas key={'c'} width={W} height={H} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 400, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, logarithmicDepthBuffer: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
          <World t={t} P={P} />
        </ThreeCanvas>}
      </AbsoluteFill>
      <Grade frame={f} vig={0.12} />
      <SirenWash t={t} t0={ev('siren')} t1={LN.l012.t0 - 0.05} />
      <CallScreen t={t} t0={ev('callUI')} t1={LN.l005.t0 - 0.06} />
      <NewsBar3 t={t} t0={ev('news')} t1={LN.l012.t1 - 1.0} head="นักโทษฝุ่นหลบหนีทางช่องลม" sub="ผู้คุมเร่งตรวจพัดลมห้อง 19" />
      <Flash t={t} t0={ev('sneeze')} d={0.08} max={0.25} />
      <Flash t={t} t0={ev('titleCharge')} d={0.1} max={0.6} />
      <Flash t={t} t0={ev('pop')} d={0.12} max={0.35} />
      <Flash t={t} t0={ev('cuff')} max={0.3} />
      <Flash t={t} t0={ev('gavel')} max={0.2} />
      <Flash t={t} t0={ev('barsShut')} max={0.22} />
      <Flash t={t} t0={ev('nail1')} max={0.25} />
      <Captions cards={CARDS} t={t} />
      {hasMix && <Audio src={staticFile(MIX)} />}
    </AbsoluteFill>
  );
};
