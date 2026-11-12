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
import {Echo, Reflect, EchoJar, FoamLining, EmptyRoom, swing} from './props';
const Bx: React.FC<{p: V3; s: V3; c: string}> = ({p, s, c}) => <mesh position={p} castShadow receiveShadow material={M(c, 0.9)}><boxGeometry args={s} /></mesh>;
import '../AbsurdEp1/cast';

/** EP13 look-dev (gate 1): the new things only — A the echo pinballing in the empty room, B a cop's sledgehammer through the brick wall,
 *  C the jar cuffed at the lid on the court table, D the echo in the foam-lined cell. */
const SEG = 75; export const LOOK13_TOTAL = SEG * 4;
const IDS = ['nai', 'offA', 'offB', 'judge'];
const SHOUTS = [0.25, 1.15];
const scA = (C: Cast, t: number, lt: number) => {
  const I = C.nai; hideProps(I); const s = ps('nai', 0.5, 0.3, Math.PI - 0.25, t, {clip: 'gestic_talk_angry_01', face: 'shout'}); const w = body(I, s, t);
  const mouth: V3 = [0.42, 1.62, 0.12];
  return {node: <><EmptyRoom t={t} /><P o={w} /><Reflect t={lt} src={mouth} hit={[0.05, 1.6, -1.93]} normal={[0, 0, 1]} t0s={SHOUTS} /></>,
    cam: mv({pos: [-1.5, 1.55, 2.9], look: [0.15, 1.35, -0.7], fov: 58}, lt, {push: 0.06}), bg: {color: '#1A1E22'}};
};
const HITS = [0.9, 1.75];
const scB = (C: Cast, t: number, lt: number) => {
  const I = C.offA; hideProps(I); resetTurn(I); const s = ps('offA', 0.45, -0.88, Math.PI + 0.35, t, {clip: 'idle_angry_01', face: 'angry'}); const w = body(I, s, t);
  const sw = swing(I, s, lt, HITS); w.updateMatrixWorld(true);
  const hp = sw.hitAt, hits = HITS.map((h) => ({t: h, x: hp[0], y: hp[1]}));
  return {node: <><EmptyRoom t={lt} hits={hits} /><P o={w} />{sw.node}{HITS.map((h) => <Puffs key={h} at={[hp[0], hp[1], -1.9]} t={lt} t0={h} n={9} size={0.16} color="#CDBFA4" />)}</>,
    cam: mv({pos: [1.95, 1.5, -0.25], look: [0.26, 1.2, -1.4], fov: 62}, lt, {push: 0.05, shake: near(lt, HITS, 0.15) ? 0.025 : 0}), bg: {color: '#1A1E22'}};
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
