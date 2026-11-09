import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, getStaticFiles} from 'remotion';
import {TOTAL, ev, CARDS, SHOTS} from '../AbsurdEp8/data';
import {Captions, Grade, Flash, CallScreen} from '../AbsurdEp1/ui';
import {HangingPlate, SirenWash} from '../absurdkit';

/** EP8 from Blender plates: each shot is public/absurd-cases/ep8/plates/<name>/<name>.mp4 (rendered by blender/eps/ep8.py,
 *  shot length + 20 frames of handle). Remotion only adds the plate, captions, phone UI, flashes and the mix. */
export {TOTAL};
const MIX = 'absurd-cases/ep8/mix/ep8b_mix.wav';
const VOICE = 'absurd-cases/ep8/ep8_narration_tight.wav';
const T = (n: string) => SHOTS.find((s) => s.name === n)!;
/** shots that continue another shot's take: [plate, offset frames into it] */
const SAME_TAKE: Record<string, [string, number]> = {callUI: ['phone', T('phone').dur]};
const plate = (name: string) => `absurd-cases/ep8/plates/${name}/${name}.mp4`;

export const AbsurdEp8B: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30;
  const files = getStaticFiles(); const has = (p: string) => files.some((s) => s.name === p);
  const audio = has(MIX) ? MIX : has(VOICE) ? VOICE : null;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHOTS.map((s) => {
        const [src, off] = SAME_TAKE[s.name] ?? [s.name, 0];
        return (
          <Sequence key={s.name} from={s.from} durationInFrames={s.dur}>
            {has(plate(src)) ? <OffthreadVideo src={staticFile(plate(src))} startFrom={off} muted /> :
              <AbsoluteFill style={{background: '#333', color: '#fff', fontSize: 64, alignItems: 'center', justifyContent: 'center'}}>{s.name}</AbsoluteFill>}
          </Sequence>
        );
      })}
      <Grade frame={f} vig={0.14} />
      <SirenWash t={t} t0={ev('siren')} t1={T('scrape').t0} amt={0.07} />
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
