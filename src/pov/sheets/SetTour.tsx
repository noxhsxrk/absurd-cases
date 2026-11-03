import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Classroom, ClassState} from '../sets/school/Classroom';
import {Building, Front, SetState} from '../sets/school/Building';
import {Alley3, Temple, Car} from '../sets/school/Temple';
import {Shafts, Motes} from '../fx/atmos';
import {SnapSun} from '../fx/sun';
import {Cam} from './MetroLookdev';
import {useFontsReady} from '../ui/story';
import {FONT} from '../ui/fonts';

/**
 * Set tour for the school sets (lockdown-class): frame n = one set/state/camera. The metro sets have their own MrtLookdev.
 * Render: node scripts/stills.mjs SetTour qa/sets 0.5 0,1,2,3,4,5,6,7
 */
type V3 = [number, number, number];
type Stop = {name: string; p: V3; yaw: number; pitch: number; lights?: number; inClass?: boolean; temple?: boolean; t?: number};
export const TOUR: Stop[] = [
  {name: 'classroom 325 · lights on · seated 1.2 m', p: [1.4, 1.2, 1.2], yaw: 0, pitch: -0.08, lights: 1, inClass: true},
  {name: 'classroom 325 · lights off (window fill only)', p: [1.4, 1.2, 1.2], yaw: 0.35, pitch: -0.05, lights: 0, inClass: true},
  {name: 'classroom → window view (3D exterior, life)', p: [2.6, 1.25, 0.6], yaw: -1.35, pitch: -0.05, lights: 1, inClass: true, t: 2},
  {name: 'classroom · crouched 0.9 m by the door, toward the windows', p: [-3.27, 0.92, -3.16], yaw: -1.87, pitch: -0.09},
  {name: 'building · back stairs', p: [1.22, -0.21, -6.41], yaw: -7.62, pitch: -0.3},
  {name: 'building · under the block / canteen', p: [-12.94, -2.62, -7.35], yaw: -3.48, pitch: 0.03},
  {name: 'back gate → alley', p: [-17.95, -2.04, -3.1], yaw: 1.59, pitch: -0.12, temple: true},
  {name: 'alley · shophouses', p: [-23.62, -1.99, 14.44], yaw: 2.71, pitch: -0.1, temple: true},
  {name: 'temple yard · police car, tent, sala', p: [-35.6, -2.56, 27.2], yaw: 4.53, pitch: -0.01, temple: true, t: 30},
];
const cls = (t: number, lights: number): ClassState => ({t, lightsK: lights, clock: 14 * 3600 + 5 * 60, phonesRed: 0, desks: {}, handle: 0, shadow: 0, dust: 1 - lights, fanK: lights});
const set = (t: number, s: Stop): SetState => ({t, chainK: 0, chainT: 999, catT: 999, birdsT: 999, neighDoor: 0, daylight: 1, door324: 0, gateOpen: s.temple ? 1 : 0});

export const SetTour: React.FC = () => {
  const f = useCurrentFrame(); const s = TOUR[f % TOUR.length]; const t = s.t ?? 3;
  useFontsReady();
  const L = s.lights ?? 1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: 'saturate(0.72) contrast(1.07)'}}>
        <ThreeCanvas width={1080} height={1920} shadows="soft" camera={{fov: 66, near: 0.04, far: 260, position: [0, 1.6, 0]}} gl={{antialias: true, logarithmicDepthBuffer: true}} onCreated={({gl}) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; }}>
          <Cam p={s.p} yaw={s.yaw} pitch={s.pitch} fov={66} />
          <color attach="background" args={['#B9D3E8']} />
          <fog attach="fog" args={[s.inClass ? '#9EABB9' : '#CCD6DE', s.inClass ? 3 : 16, s.inClass ? 40 : 130]} />
          <hemisphereLight args={[L > 0.5 ? '#FFF8EC' : '#DCE8F5', L > 0.5 ? '#9A8F7C' : '#6B6A5E', 0.85 + 0.3 * L]} />
          <ambientLight intensity={0.24} color="#9FB0C8" />
          <SnapSun p={s.p} />
          {s.inClass && <><pointLight position={[3.2, 2.2, 0]} intensity={0.9} distance={9} decay={1.2} color="#CFDDF0" /><pointLight position={[2.6, 2.4, -3.5]} intensity={0.6} distance={8} decay={1.2} color="#CFDDF0" /></>}
          {!s.inClass && <><pointLight position={[3.6, -0.4, -7.5]} intensity={1.5} distance={7} decay={1.5} color="#FFE2B8" /><pointLight position={[-12.2, -0.4, -7.5]} intensity={0.8} distance={12} decay={1.3} color="#F2EEE4" /></>}
          <Classroom st={{...cls(t, L), real: !s.inClass}} />
          {s.inClass && L < 0.5 && <><Shafts dark={1} t={t} /><Motes t={t} dark={1} /></>}
          <Building st={set(t, s)} />
          <Front t={t} />
          {s.temple && <><Alley3 t={t} /><Temple t={t} /><Car t={t} /></>}
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 40, bottom: 60, right: 40, color: '#fff', fontFamily: FONT, fontSize: 30, background: 'rgba(0,0,0,.55)', padding: '10px 18px', borderRadius: 10}}>SET {f % TOUR.length}: {s.name}</div>
    </AbsoluteFill>
  );
};
