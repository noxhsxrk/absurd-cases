import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {IDS} from './cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook, setFaceStyle} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {FONT} from '../../pov/ui/fonts';
import {FPS, W, H, TOTAL, ev, CARDS, shotAt, SHOTS, cl} from './data';
import {SHOT_FN, CamRig} from './shots';
import {Captions, Grade, Flash, CallScreen} from '../AbsurdEp1/ui';
import {HangingPlate, SirenWash} from '../absurdkit';

export {TOTAL};
const MIX = 'absurd-cases/ep7/mix/ep7_mix.wav';
const VOICE = 'absurd-cases/ep7/ep7_narration_tight.wav';   // until the mix exists
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
const PLACE = (n: string) => ['bedroom', 'strike', 'router', 'charge', 'phone', 'alert'].includes(n) ? 'room' : ['throttle', 'liftoff'].includes(n) ? 'street'
  : ['chase', 'stormHit', 'jump', 'cuffECU', 'midair'].includes(n) ? 'sky' : ['interro', 'glare', 'zap', 'blackFaces'].includes(n) ? 'interro' : n === 'court' ? 'court'
  : ['cell18', 'barJump', 'fanPlug', 'dial', 'blowDurian'].includes(n) ? 'cell' : n === 'prisonTop' ? 'top' : 'map';
const GRADE: Record<string, string> = {room: 'saturate(0.9) contrast(1.06)', street: 'saturate(0.86) contrast(1.06)', sky: 'saturate(0.8) contrast(1.08)', interro: 'saturate(0.82) contrast(1.05)',
  court: 'saturate(0.81) contrast(1.05)', cell: 'saturate(0.72) contrast(1.06)', top: 'saturate(0.85) contrast(1.04)', map: 'saturate(0.95) contrast(1.04)'};
const FILL: Record<string, [string, number]> = {room: ['#8A98C8', 0.35], street: ['#8A98C8', 0.4], sky: ['#AEB8CC', 0.55], interro: ['#D6DCE6', 0.35], court: ['#FFF1DE', 0.55], cell: ['#D6DCE6', 1.0], top: ['#E8EEF2', 0.45], map: ['#E8EEF2', 0.35]};
const World: React.FC<{t: number; P: any}> = ({t, P}) => {
  const sh = shotAt(t); const out = SHOT_FN[sh.name](t, t - sh.t0, P); const [fc, fi] = FILL[PLACE(sh.name)];
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#BFD6E4'}} /><ambientLight color={fc} intensity={fi} /><group key={sh.name}>{out.node}</group></>;   // keyed per shot (see EP6)
};
/** the weather-map style counter in the Thailand shot */
const SmellMeter: React.FC<{t: number}> = ({t}) => {
  const s = T('thailand'); if (t < s.t0 || t >= s.t1) return null;
  const k = Math.pow(cl((t - s.t0) / (ev('cover') - s.t0)), 0.85); const pct = Math.round(3 + 97 * k);
  return <AbsoluteFill style={{pointerEvents: 'none', fontFamily: FONT}}>
    <div style={{position: 'absolute', right: 46, bottom: 120, background: 'rgba(14,22,30,.86)', border: '4px solid #E6E7CF', borderRadius: 14, padding: '10px 26px 16px', color: '#E6E7CF', textAlign: 'right'}}>
      <div style={{fontSize: 36, fontWeight: 600}}>พื้นที่ได้รับกลิ่น</div>
      <div style={{fontSize: 96, fontWeight: 700, color: pct >= 100 ? '#FF8A73' : '#C9E07A', lineHeight: 1.05}}>{pct}%</div>
    </div>
  </AbsoluteFill>;
};

export const AbsurdEp7: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const ready = useFontsReady();
  const lib = useRb([], 'toon'); const P = useCast(IDS, lib);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(P) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [P]);
  const sh = shotAt(t); const q = canvasQuality(quality);
  const files = getStaticFiles(); const audio = files.some((s) => s.name === MIX) ? MIX : files.some((s) => s.name === VOICE) ? VOICE : null;
  const map = sh.name === 'thailand';
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(1.02)', filter: GRADE[PLACE(sh.name)]}}>
        {lib && ready && <ThreeCanvas key={'c'} width={W} height={H} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 600, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, logarithmicDepthBuffer: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
          <World t={t} P={P} />
        </ThreeCanvas>}
      </AbsoluteFill>
      <Grade frame={f} vig={0.16} />
      <SirenWash t={t} t0={ev('siren')} t1={T('interro').t0} amt={0.1} />
      <HangingPlate t={t} text="ทำให้เสียทรัพย์" drops={[ev('plate')]} t1={T('phone').t0} />
      <CallScreen t={t} t0={ev('press') + 0.2} t1={T('throttle').t0 - 0.001} />
      <Flash t={t} t0={ev('strike')} d={0.1} max={0.55} />
      <Flash t={t} t0={ev('routerBoom')} d={0.06} max={0.25} />
      <Flash t={t} t0={ev('carHit')} d={0.08} max={0.45} />
      <Flash t={t} t0={ev('cuff')} d={0.06} max={0.25} />
      <Flash t={t} t0={ev('zap')} d={0.08} max={0.5} />
      <Flash t={t} t0={ev('gavel')} d={0.06} max={0.2} />
      <Flash t={t} t0={ev('plugIn')} d={0.06} max={0.3} color="#FFE07A" />
      <SmellMeter t={t} />
      <Captions cards={CARDS} t={t} y={map ? 120 : 1395} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
