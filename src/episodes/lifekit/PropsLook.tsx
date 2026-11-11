import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {useFontsReady} from '../../pov/ui/story';
import {M} from '../../pov/lib/tex';
import {Village, lots} from '../AbsurdEp8/village';
import {Grade} from '../AbsurdEp1/ui';
import {camMove, Cam} from '../absurdkit';
import {V3, Skyline, Hills, PowerLine, powerWire, CloudsDrift, SwayTree, Palm, Bush, PotPlant, GrassTufts, FallingLeaves, Birds, WireBirds, Pigeons, Chickens, Butterflies, Gecko, StrayDog, SleepingDog, SittingCat,
  Car, Pickup, Motorbike, FoodCart, Traffic, Laundry, Bunting, Curtain, CeilingFan, WindowLight, StreetLamp, Smoke} from './props';

/** lifekit look-dev: six 2-second staged scenes, one per family of props (street / garden / night / vehicles / interior / sky). No cast. */
const SEG = 60; export const PROPS_TOTAL = SEG * 6;
const SKY = '#BFD6E4', NIGHT = '#121928';
const Rig: React.FC<{cam: Cam; bg: string}> = ({cam, bg}) => { const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = new THREE.Color(bg); c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look); c.fov = cam.fov; c.updateProjectionMatrix(); return null; };
const Day: React.FC<{at?: V3; r?: number}> = ({at = [0, 0, 0], r = 22}) => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} />
  <directionalLight position={[at[0] - 10, 20, at[2] + 12]} target-position={at} color="#FFF1D6" intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-r} shadow-camera-right={r} shadow-camera-top={r} shadow-camera-bottom={-r} shadow-camera-far={80} shadow-bias={-0.0006} /></>;
const Ground: React.FC<{color: string; y?: number}> = ({color, y = -0.05}) => <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} material={M(color, 0.95)}><circleGeometry args={[420, 48]} /></mesh>;
const Box: React.FC<{p: V3; s: V3; c: string}> = ({p, s, c}) => <mesh position={p} castShadow receiveShadow material={M(c, 0.9)}><boxGeometry args={s} /></mesh>;
const win = (h: {x: number; side: number; W: number}, k: number, fl: number): V3 => [h.x + k * h.W * 0.28, fl ? 4.4 : 1.6, h.side * 9.1];   // a house window pane (k = −1/1 left/right, fl = floor)

type Sc = {node: React.ReactNode; cam: Cam; bg: string};
// 1: village street, day
const PA: V3 = [-22, 0, 3.9], PB: V3 = [26, 0, 3.9], RIGHT = lots().filter((h) => h.side > 0);
const sc1 = (t: number, lt: number): Sc => { const w = powerWire(PA, PB, 4, 1, 0), hc = RIGHT.find((h) => h.x + h.W * 0.3 > -3)!, hl = RIGHT.find((h) => h.x > hc.x + 1)!;
  return {node: <><Village clear={[-60, 60]} /><Ground color="#5B7838" /><Day at={[2, 0, 0]} r={30} />
    <Skyline t={t} r0={70} r1={130} /><Hills /><CloudsDrift t={t} />
    <PowerLine a={PA} b={PB} poles={4} t={t} /><WireBirds a={w.a} b={w.b} sag={0.5} n={6} t={t + 4.2} size={0.26} />
    <SwayTree position={[14, 0, 3.5]} t={t} seed={1} /><SwayTree position={[23, 0, -3.8]} t={t} seed={2} kind="tall" /><SwayTree position={[30, 0, 3.6]} t={t} seed={3} kind="mango" />
    <Laundry a={[hl.x - hl.W * 0.3, 2.05, 6.8]} b={[hl.x + hl.W * 0.14, 2.05, 7.5]} t={t} n={5} poles />
    <Traffic t={t + 3} a={[-40, 0, -1.4]} b={[44, 0, -1.4]} />
    <StrayDog path={[[-6, 0, 1.2], [2, 0, 1.6], [2.6, 0, 2.4], [-5.5, 0, 2.6]]} t={t} />
    <SittingCat position={[hc.x + hc.W * 0.3, 1.2, 5.6]} yaw={-2.0} t={t} look={Math.sin(t * 1.2) * 0.5} /></>,
    cam: camMove({pos: [-13, 1.7, 0.5], look: [10, 3.7, 4.5], fov: 58}, lt, {arrive: 0.06, push: 0.05}), bg: SKY}; };
// 2: garden at ground level; the pigeons burst away at local frame 30
const sc2 = (t: number, lt: number): Sc => ({node: <><Ground color="#6A8742" /><Day at={[0, 0, 0]} r={12} /><Hills /><CloudsDrift t={t} seed={3} />
  <GrassTufts center={[0, -0.05, -1]} size={[6, 9]} n={900} t={t} /><Bush position={[-0.75, -0.05, -1.6]} t={t} seed={1} flowers /><Bush position={[1.1, -0.05, -2.6]} t={t} seed={2} />
  <Butterflies center={[-0.45, 0.85, -1.1]} size={[0.9, 0.5, 0.8]} t={t} /><Chickens center={[0.3, -0.05, -0.5]} r={0.7} t={t} />
  <Pigeons center={[0.1, -0.05, 1.1]} r={0.55} n={5} t={t} scareAt={SEG / 30 + 1} />
  <FallingLeaves center={[0.1, 1.5, -0.5]} size={[1.6, 3, 3]} n={18} t={t} /><SwayTree position={[-1.6, -0.05, -7]} t={t} seed={5} /><Palm position={[1.2, -0.05, -6.5]} t={t} seed={1} /></>,
  cam: camMove({pos: [0.1, 0.42, 3.6], look: [0.1, 1.0, 0], fov: 50}, lt, {arrive: 0.06, push: 0.04}), bg: SKY});
// 3: the street at night
const sc3 = (t: number, lt: number): Sc => { const hs = RIGHT.filter((h) => h.x > 4);
  return {node: <><Village clear={[-60, 60]} /><Ground color="#5B7838" /><hemisphereLight args={['#3C4C72', '#15171C', 0.6]} /><directionalLight position={[-10, 14, -8]} color="#8EA6E8" intensity={0.35} />
    <Skyline t={t} night={1} haze="#2A3550" r0={70} r1={130} /><CloudsDrift t={t} night={1} />
    <StreetLamp position={[1, 0, 3.7]} yaw={Math.PI} t={t} /><SleepingDog position={[1.3, 0, 2.75]} yaw={2.4} t={t} />
    {hs[0] && <><WindowLight position={win(hs[0], 1, 1)} w={1.6} h={1.3} yaw={Math.PI} t={t} /><WindowLight position={win(hs[0], 1, 0)} w={1.6} h={1.3} yaw={Math.PI} t={t} kind="tv" /></>}
    {hs[1] && <><WindowLight position={win(hs[1], -1, 1)} w={1.6} h={1.3} yaw={Math.PI} t={t} kind="tv" seed={3} /><WindowLight position={win(hs[1], 1, 1)} w={1.6} h={1.3} yaw={Math.PI} t={t} /></>}
    <Traffic t={t + 7.5} a={[44, 0, 1.2]} b={[-40, 0, 1.2]} night={1} />
    <Gecko a={[0.2, 0.75, 5.5]} b={[1.6, 1.05, 5.5]} normal={[0, 0, -1]} t={t + 2} size={0.22} /></>,
    cam: camMove({pos: [-7, 1.4, 2.7], look: [5, 2.7, 4.1], fov: 56}, lt, {arrive: 0.06, push: 0.05}), bg: NIGHT}; };
// 4: vehicles line-up, 3/4 view
const sc4 = (t: number, lt: number): Sc => ({node: <><Ground color="#4A4C50" /><Day at={[0, 0, -2]} r={14} />
  <Motorbike position={[2.9, -0.05, 4.6]} yaw={0.75} t={t} roll={t * 2} /><FoodCart position={[1.2, -0.05, 2.0]} yaw={0.75} t={t} /><Smoke from={[2.9, 0.1, 1.6]} t={t} color="#8E8E8A" />
  <Car position={[1.3, -0.05, -2.2]} yaw={0.75} t={t} roll={t * 2} color="#B24A3E" /><Pickup position={[-0.8, -0.05, -8.5]} yaw={0.75} t={t} roll={t * 2} /></>,
  cam: camMove({pos: [4.6, 5.2, 10.5], look: [0.6, 0.6, -2.5], fov: 48}, lt, {arrive: 0.06, push: 0.04}), bg: SKY});
// 5: a room corner
const sc5 = (t: number, lt: number): Sc => ({node: <><hemisphereLight args={['#F2E6D0', '#6A5A48', 1.1]} />
  <directionalLight position={[1.5, 2.6, 4.5]} target-position={[0, 1, -1.5]} color="#FFE6BF" intensity={1.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0006} />
  <Box p={[0, -0.05, 0]} s={[4.4, 0.1, 4.4]} c="#A8835A" /><Box p={[0, 1.45, -2.05]} s={[4.4, 3.0, 0.1]} c="#E4DCC6" /><Box p={[-2.05, 1.45, 0]} s={[0.1, 3.0, 4.4]} c="#DCD3BC" /><Box p={[0, 2.95, 0]} s={[4.4, 0.1, 4.4]} c="#EFEBE0" />
  <WindowLight position={[0.1, 1.55, -1.99]} w={1.3} h={1.3} t={t} color="#DCEBFA" /><Curtain position={[-0.28, 1.5, -1.93]} w={0.8} h={1.6} t={t} />
  <CeilingFan position={[-0.1, 2.9, -0.7]} t={t} /><PotPlant position={[-1.15, 0, -1.55]} t={t} seed={2} />
  <Gecko a={[-1.3, 2.05, -1.99]} b={[-0.5, 2.5, -1.99]} normal={[0, 0, 1]} t={t - 0.6} seed={2} />
  <Box p={[0.75, 0.22, -1.65]} s={[0.9, 0.44, 0.5]} c="#7A5A3C" /><SittingCat position={[0.7, 0.44, -1.65]} yaw={-0.2} t={t} look={Math.sin(t * 1.5) * 0.6} /></>,
  cam: camMove({pos: [0.5, 1.5, 3.7], look: [-0.2, 1.4, -1.8], fov: 50}, lt, {arrive: 0.06, push: 0.04}), bg: '#2A2622'});
// 6: big sky
const sc6 = (t: number, lt: number): Sc => ({node: <><Ground color="#6A8742" /><Day at={[0, 0, -4]} r={16} /><Hills /><CloudsDrift t={t} seed={7} n={11} /><Skyline t={t} arc={[-2.6, -0.5]} n={50} seed={4} r0={85} r1={140} />
  <Birds t={t} center={[0.5, 0, -6]} radius={4.5} y={15} size={0.45} /><Palm position={[-2.6, -0.05, -3]} t={t} seed={3} h={6.5} /><Palm position={[3.4, -0.05, -9]} t={t} seed={5} h={8} />
  <Box p={[-3.2, 2.2, 2.5]} s={[0.1, 4.5, 0.1]} c="#B59A62" /><Box p={[3.6, 2.4, -1.5]} s={[0.1, 4.9, 0.1]} c="#B59A62" /><Bunting a={[-3.2, 4.4, 2.5]} b={[3.6, 4.8, -1.5]} t={t} n={14} /></>,
  cam: camMove({pos: [0.3, 1.5, 10], look: [0, 8.5, -6], fov: 55}, lt, {arrive: 0.05, push: 0.03}), bg: SKY});

const World: React.FC<{seg: number; t: number; lt: number}> = ({seg, t, lt}) => {
  const out = [sc1, sc2, sc3, sc4, sc5, sc6][Math.min(5, seg)](t, lt);
  return <><Rig cam={out.cam} bg={out.bg} /><ambientLight intensity={0.25} />{out.node}</>;
};
export const LifeKitProps: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / 30; const seg = Math.floor(f / SEG); const lt = (f - seg * SEG) / 30;
  const ready = useFontsReady(); const q = canvasQuality(quality);
  return <AbsoluteFill style={{background: '#000'}}>
    {ready && <ThreeCanvas width={1080} height={1920} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.05, far: 700}} gl={{antialias: q.antialias, stencil: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
      <World seg={seg} t={t} lt={lt} />
    </ThreeCanvas>}
    <Grade frame={f} vig={0.16} />
  </AbsoluteFill>;
};
