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
import {ClipScreen, WifiFail, NoNet} from './ui';

export {TOTAL};
const MIX = 'absurd-cases/ep10/mix/ep10_mix.wav';
const VOICE = 'absurd-cases/ep10/ep10_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const PLACE = (n: string) => ['bed', 'spinner', 'oneBar', 'grumble', 'redLight', 'charge', 'phone', 'callUI'].includes(n) ? 'bed' : ['raid', 'grab', 'lan', 'tie'].includes(n) ? 'raid'
  : ['interro', 'blink', 'silent', 'noSignal'].includes(n) ? 'interro' : ['court', 'wifiFail', 'judgeMad', 'gavel', 'gavelRage', 'charge2'].includes(n) ? 'court'
  : ['box', 'guardsNet'].includes(n) ? 'cell' : n === 'release' ? 'prison' : n === 'lastLight' ? 'dusk' : 'street';
const GRADE: Record<string, string> = {bed: 'saturate(0.88) contrast(1.05)', raid: 'saturate(0.86) contrast(1.07)', interro: 'saturate(0.82) contrast(1.05)', court: 'saturate(0.8) contrast(1.05)',
  cell: 'saturate(0.75) contrast(1.08)', prison: 'saturate(0.86) contrast(1.04)', street: 'saturate(0.9) contrast(1.03)', dusk: 'saturate(0.85) contrast(1.04) sepia(0.12)'};
const FILL: Record<string, [string, number]> = {bed: ['#9FB0D8', 0.22], raid: ['#9FB0D8', 0.3], interro: ['#D6DCE6', 0.3], court: ['#FFF1DE', 0.5], cell: ['#8090B0', 0.3], prison: ['#E8EEF2', 0.35], street: ['#E8EEF2', 0.25], dusk: ['#E8C2A8', 0.25]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#BFD6E4'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;
};
/** "เหลือขีดเดียว": the phone UI pushed in on the status-bar Wi-Fi icon */
const OneBarZoom: React.FC<{t: number}> = ({t}) => {
  const a = T('spinner'), b = T('oneBar');
  if (t < a.t0 || t >= b.t1) return null;
  // the status-bar Wi-Fi icon (ClipScreen: right padding 60, "12%" ~90 px, gap 22, icon 70 px; bar centre y 115), moved by ClipScreen's own slow push about the frame centre
  const si = 1 + 0.06 * (t - a.t0); const px = 540 + (873 - 540) * si, py = 960 + (115 - 960) * si;
  const k = t < b.t0 ? 0 : Math.min(1, (t - b.t0) / 0.3); const e = k * k * (3 - 2 * k);
  const z = 1 + 2.4 * e + 0.12 * Math.max(0, t - b.t0);
  const tx = (px + (540 - px) * e) - px * z, ty = (py + (620 - py) * e) - py * z;   // the icon glides to upper-centre while it grows
  return <AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})`}}><ClipScreen t={t} t0={a.t0} t1={b.t1} drop={ev('oneBar')} /></AbsoluteFill>;
};

export const AbsurdEp10: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
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
      <OneBarZoom t={t} />
      <NoNet t={t} t0={T('noSignal').t0} t1={T('noSignal').t1} none={ev('noSignal')} />
      <WifiFail t={t} t0={T('wifiFail').t0} t1={T('wifiFail').t1} fail={ev('wifiFail')} />
      <Grade frame={f} vig={0.16} />
      <SirenWash t={t} t0={ev('siren')} t1={T('interro').t0} amt={0.1} />
      <HangingPlate t={t} text="ละทิ้งหน้าที่" drops={[ev('plate1')]} t1={T('phone').t0} />
      <HangingPlate t={t} text="ขัดขวางกระบวนการยุติธรรม" drops={[ev('plate2')]} t1={T('box').t0} />
      <CallScreen t={t} t0={ev('press') + 0.2} t1={T('raid').t0 - 0.001} />
      <Flash t={t} t0={ev('door')} d={0.08} max={0.3} />
      <Flash t={t} t0={ev('pin')} d={0.06} max={0.25} />
      <Flash t={t} t0={ev('red')} d={0.08} max={0.35} color="#FF3B30" />
      {['gavel1', 'gavel2', 'gavel3', 'gavel4', 'gavel5', 'gavel6'].map((g) => <Flash key={g} t={t} t0={ev(g)} d={0.06} max={0.18} />)}
      <Flash t={t} t0={ev('boxShut')} d={0.06} max={0.25} />
      <Captions cards={CARDS} t={t} y={1395} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
