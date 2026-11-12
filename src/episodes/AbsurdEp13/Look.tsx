import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook, setFaceStyle} from '../AbsurdEp1/boxcast';
import {ik, fingers, resetTurn} from '../../pov/acting/ik';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {useFontsReady} from '../../pov/ui/story';
import {Cell, Court} from '../AbsurdEp1/sets';
import {Grade} from '../AbsurdEp1/ui';
import {M} from '../../pov/lib/tex';
import {Puffs} from '../AbsurdEp7/props';
import {ps, body, P, CamRig, mv, strike, near, loc, hideProps, V3, Cast} from '../lifekit/stage';
import {Echo, echoBounce, Sledgehammer, SLEDGE_LEN, BrickWall, EchoJar, FoamLining} from './props';
import '../AbsurdEp1/cast';

/** EP13 look-dev (gate 1): the new things only — A the echo pinballing in the empty room, B a cop's sledgehammer through the brick wall,
 *  C the jar cuffed at the lid on the court table, D the echo in the foam-lined cell. */
const SEG = 75; export const LOOK13_TOTAL = SEG * 4;
const IDS = ['nai', 'offA', 'offB', 'judge'];
const Bx: React.FC<{p: V3; s: V3; c: string}> = ({p, s, c}) => <mesh position={p} castShadow receiveShadow material={M(c, 0.9)}><boxGeometry args={s} /></mesh>;
/** the empty room: 4 × 4 m, plain walls, bare bulb; the north wall (z = −2) is the brick wall that gets smashed */
export const EmptyRoom: React.FC<{t: number; hits?: {t: number; x: number; y: number}[]}> = ({t, hits = []}) => <group>
  <Bx p={[0, -0.05, 0]} s={[4.2, 0.1, 4.2]} c="#A9825A" />
  <Bx p={[0, 2.75, 0]} s={[4.2, 0.1, 4.2]} c="#EFEBE0" />
  <Bx p={[-2.05, 1.35, 0]} s={[0.1, 2.7, 4.2]} c="#D9CFB6" /><Bx p={[2.05, 1.35, 0]} s={[0.1, 2.7, 4.2]} c="#D3C9AF" />
  <BrickWall t={t} w={4.0} h={2.7} position={[0, 0, -2.0]} hits={hits} />
  <mesh position={[-1.99, 1.5, -0.6]} rotation={[0, Math.PI / 2, 0]} material={new THREE.MeshBasicMaterial({color: '#CFE4F2', toneMapped: false})}><planeGeometry args={[1.0, 1.0]} /></mesh>
  <mesh position={[0, 2.35, -0.3]} material={new THREE.MeshBasicMaterial({color: '#FFE9B8', toneMapped: false})}><sphereGeometry args={[0.05, 12, 10]} /></mesh>
  <pointLight position={[0, 2.3, -0.3]} color="#FFE2B0" intensity={2.2} distance={7} decay={1.4} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
  <hemisphereLight args={['#DCE6EE', '#5A4E40', 0.9]} />
  <directionalLight position={[-6, 5, 6]} color="#FFF1D6" intensity={0.8} />
  {/* daylight outside the north wall, seen through the holes */}
  <mesh position={[0, 3, -9]} material={new THREE.MeshBasicMaterial({color: '#BFD6E4', toneMapped: false})}><planeGeometry args={[40, 12]} /></mesh>
  <mesh position={[0, -0.06, -6]} rotation={[-Math.PI / 2, 0, 0]} material={M('#6A8742', 0.95)}><planeGeometry args={[40, 8]} /></mesh>
</group>;
const CORNERS: V3[] = [[-1.1, 2.0, -1.85], [1.0, 1.2, -1.85], [-1.3, 0.8, -1.2], [0.9, 2.1, -1.85], [0.0, 2.3, -1.85]];

/** a sledgehammer swing that lands at each time in `hits` on the wall `wallZ` ahead of the cop (yaw 0 = facing −z) */
export const swing = (I: any, s: any, t: number, hits: number[]) => {
  const k = hits.reduce((a, h) => Math.max(a, strike(t, h, 0.4)), 0);         // 0 = head on the wall, 1 = raised behind the head
  const th = Math.PI / 2 * (1 - k) - 0.35 * k;                                    // handle pitch: forward-level → over the shoulder
  const fw = (d: number): [number, number] => [s.x + Math.sin(s.yaw + Math.PI) * d, s.z + Math.cos(s.yaw + Math.PI) * d];
  const gd = 0.3 * (1 - k) + 0.02 * k, gy = 1.0 * (1 - k) + 1.42 * k;            // grip: waist-front → above the shoulder
  const [gx, gz] = fw(gd);
  const along = (u: number): V3 => { const [x, z] = fw(gd + Math.sin(th) * u); return [x, gy + Math.cos(th) * u, z]; };
  fingers(I, 'R', 'fist', 1); fingers(I, 'L', 'fist', 1);
  ik(I, 'R', loc(I, along(0.3)), new THREE.Vector3(-1, -0.6, -0.4), 1); ik(I, 'L', loc(I, along(0.04)), new THREE.Vector3(1, -0.6, -0.4), 1);
  return {node: <group position={[gx, gy, gz]} rotation={[0, s.yaw + Math.PI, 0]}><Sledgehammer position={[0, 0, 0]} rotation={[th, 0, 0]} /></group>, head: along(SLEDGE_LEN - 0.04)};
};

const scA = (C: Cast, t: number, lt: number) => {
  const I = C.nai; hideProps(I); const e = echoBounce(lt, CORNERS, 0.45);
  const w = body(I, ps('nai', 0.5, 0.2, -0.35, t, {clip: 'gestic_talk_angry_01', lookW: e.p, face: 'shout'}), t);
  return {node: <><EmptyRoom t={t} /><P o={w} /><Echo t={t} position={e.p} scale={0.9} pulse={e.hitK} look={[0.5, 0]} /></>,
    cam: mv({pos: [1.0, 1.55, 2.9], look: [-0.3, 1.45, -0.6], fov: 55}, lt, {push: 0.06}), bg: {color: '#1A1E22'}};
};
const HITS = [0.9, 1.75];
const scB = (C: Cast, t: number, lt: number) => {
  const I = C.offA; hideProps(I); resetTurn(I); const s = ps('offA', 0.2, -0.85, 0, t, {clip: 'idle_angry_01', face: 'angry'}); const w = body(I, s, t);
  const sw = swing(I, s, lt, HITS); w.updateMatrixWorld(true);
  const hits = HITS.map((h) => ({t: h, x: 0.2, y: 1.0}));
  return {node: <><EmptyRoom t={lt} hits={hits} /><P o={w} />{sw.node}{HITS.map((h) => <Puffs key={h} at={[0.2, 1.0, -1.9]} t={lt} t0={h} n={9} size={0.16} color="#CDBFA4" />)}</>,
    cam: mv({pos: [1.9, 1.35, 0.9], look: [0.0, 1.05, -1.6], fov: 55}, lt, {push: 0.05, shake: near(lt, HITS, 0.15) ? 0.025 : 0}), bg: {color: '#1A1E22'}};
};
const scC = (t: number, lt: number) => ({node: <><Court t={t} /><Bx p={[0, 0.85, 0.6]} s={[1.4, 0.06, 0.7]} c="#6A4428" />
  <EchoJar t={t} position={[0, 0.88, 0.6]} scale={2.2}><Echo t={t} position={[0, 0.075, 0]} scale={0.13} pulse={0.3} light={0.4} /></EchoJar></>,
  cam: mv({pos: [0.3, 1.35, 2.2], look: [0, 1.1, 0.6], fov: 34}, lt, {push: 0.1}), bg: {color: '#2A2420'}});
const scD = (t: number, lt: number) => ({node: <><Cell t={t} days={0.5} marks={0} /><FoamLining />
  <Echo t={t} position={[0.3, 1.0 + Math.sin(t * 1.3) * 0.05, -0.6]} scale={0.8} pulse={0} hoarse={lt > 1.2 ? 0.8 : 0} /></>,
  cam: mv({pos: [0.2, 1.5, 2.6], look: [0, 1.1, -0.6], fov: 50}, lt, {push: 0.08}), bg: {color: '#2A2E33'}});

const World: React.FC<{seg: number; t: number; lt: number; C: Cast}> = ({seg, t, lt, C}) => {
  const out = seg === 0 ? scA(C, t, lt) : seg === 1 ? scB(C, t, lt) : seg === 2 ? scC(t, lt) : scD(t, lt);
  return <><CamRig cam={out.cam} bg={out.bg} /><ambientLight intensity={0.25} />{out.node}</>;
};
export const AbsurdEp13Look: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / 30; const seg = Math.floor(f / SEG); const lt = (f - seg * SEG) / 30;
  const ready = useFontsReady(); const lib = useRb([], 'toon'); const C = useCast(IDS, lib); const q = canvasQuality(quality);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(C) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [C]);
  return <AbsoluteFill style={{background: '#000'}}>
    {lib && ready && <ThreeCanvas width={1080} height={1920} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 600}} gl={{antialias: q.antialias, stencil: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
      <World seg={seg} t={t} lt={lt} C={C} />
    </ThreeCanvas>}
    <Grade frame={f} vig={0.16} />
  </AbsoluteFill>;
};
