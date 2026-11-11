import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import '../AbsurdEp1/cast';
import {useRb, useCast} from '../../pov/cast/RbPerson';
import {applyBoxLook, setFaceStyle} from '../AbsurdEp1/boxcast';
import {useFontsReady} from '../../pov/ui/story';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {ik, fingers, resetTurn} from '../../pov/acting/ik';
import {gait, pace, env, arc} from '../../pov/acting/motion';
import {Court, Cell} from '../AbsurdEp1/sets';
import {Grade} from '../AbsurdEp1/ui';
import {Village} from '../AbsurdEp8/village';
import {Clock, Sala} from '../AbsurdEp11/props';
import {ps, walker, body, bw, hideProps, loc, P, CamRig, mv, sm, V, add3, Cast, ShotOut, V3} from './stage';
import {TOWN, Townsfolk, Extra} from './people';
import {VillageLife, GroundsLife, CourtLife, CellBlockLife, BedroomLife} from './presets';
import {StrayDog} from './props';

/** lifekit demo reel: every preset once, then the motion helpers on one character. Not an episode; a look-dev and regression reel. */
const FPS = 30;
const SEGS: [string, number][] = [['villageWide', 75], ['villageStreet', 90], ['villageNight', 105], ['court', 75], ['courtFaces', 60], ['cells', 120], ['grounds', 135], ['motion', 195]];
const STARTS = SEGS.map((_, i) => SEGS.slice(0, i).reduce((a, s) => a + s[1], 0));
export const DEMO_TOTAL = SEGS.reduce((a, s) => a + s[1], 0);
const IDS = ['nai', 'offA', 'judge', ...TOWN];
const LABEL: Record<string, string> = {villageWide: 'หมู่บ้าน · กลางวัน', villageStreet: 'หมู่บ้าน · ระดับถนน', villageNight: 'หมู่บ้าน · กลางคืน', court: 'ศาล · มีคนฟัง', courtFaces: 'ศาล · มุมกลับ', cells: 'คุก · ห้องข้างๆ', grounds: 'ลานวัด/สวน', motion: 'การเคลื่อนไหวตัวละคร'};

const DAY = () => <><hemisphereLight args={['#DCE8F2', '#5A5446', 1.1]} /><directionalLight position={[-8, 16, 10]} color="#FFF1D6" intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={70} /></>;
const NIGHT = () => <><hemisphereLight args={['#5A6C9A', '#1A1C24', 0.55]} /><directionalLight position={[10, 14, 6]} color="#9FB4E0" intensity={0.5} /></>;
const SKY = {color: '#BFD6E4'}, DUSK = {color: '#141A2A'};
const FP = 0.12;

const SHOTS: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {
  villageWide: (t, lt, C) => ({node: <><Village />{DAY()}<VillageLife t={t} C={C} /></>,
    cam: mv({pos: [-17, 7.5, 1.2], look: [6, 1.2, 0], fov: 55}, lt, {push: 0.05, arrive: 0.06}), bg: SKY}),
  villageStreet: (t, lt, C) => {
    // the man strolls up the footpath toward the lens: feet locked to the odometer, he slows to a stop and looks up at the birds
    const I = C.nai; hideProps(I); const clip = 'walk_stroll_01'; const g = gait([[-4.5, 4.6], [3.2, 4.6]], lt, {t0: 0.1, speed: pace(clip) * 1.25});
    const w = body(I, walker('nai', g, t, {locoClip: clip, idle: 'idle_look_around_01', lookW: g.since > 0.2 ? [9, 7, 0] : undefined, lookT0: t - (g.since - 0.2)}), t, FP);
    return {node: <><Village />{DAY()}<VillageLife t={t} C={C} /><P o={w} /></>,
      cam: mv({pos: [6.4, 1.35, 3.6], look: [0.5, 1.25, 4.7], fov: 40}, lt, {push: 0.03, arrive: 0.06}), bg: SKY};
  },
  villageNight: (t, lt, C) => {
    const I = C.nai; hideProps(I); const w = body(I, ps('nai', 3.1, -4.45, 1.9, t, {clip: 'cell_phone_textmessage'}), t, FP);
    return {node: <><Village night={1} t={t} />{NIGHT()}<VillageLife t={t} night={1} C={C} /><P o={w} /></>,
      cam: mv({pos: [8.2, 1.5, -0.6], look: [3.7, 2.0, -4.0], fov: 46}, lt, {push: 0.05, arrive: 0.06}), bg: DUSK};
  },
  court: (t, lt, C) => ({node: courtScene(t, C), cam: mv({pos: [0.3, 2.0, 4.35], look: [0, 1.5, -2.6], fov: 52}, lt, {push: 0.06, arrive: 0.06})}),
  courtFaces: (t, lt, C) => ({node: courtScene(t, C), cam: mv({pos: [1.3, 1.65, -0.5], look: [-0.5, 1.05, 2.7], fov: 50}, lt, {push: 0.06, arrive: 0.06})}),
  cells: (t, lt, C) => {
    // the guard walks his beat past the neighbours (the fan, the mosquito in its jar, the durian); the newest inmate in the middle cell
    const I = C.offA; hideProps(I); const g = gait([[-5.5, 3.0], [5.5, 3.0], [5.5, 3.5], [-5.5, 3.5]], t, {loop: true, speed: pace('walk_slow_01')});
    const w = body(I, walker('offA', g, t, {locoClip: 'walk_slow_01', lookW: [g.x, 1.0, 0]}), t);
    return {node: <><Cell t={t} days={0.45} marks={12} /><Clock position={[0.1, 0, 0.6]} yaw={0.2} scale={3.4} t={t} hands={false} battery={false} /><CellBlockLife t={t} /><P o={w} /></>,
      cam: mv({pos: [5.2, 1.5, 4.4], look: [-2.2, 1.0, 1.7], fov: 50}, lt, {push: 0.04, arrive: 0.06}), bg: {color: '#2A2E33'}};
  },
  grounds: (t, lt, C) => {
    const seats: Extra[] = [['tw1', -1.2, 0.4], ['tw2', 0, 0.2], ['tw3', 1.2, 0.4], ['tw5', -1.8, 1.5], ['tw6', -0.6, 1.5], ['tw7', 0.6, 1.5], ['tw4', 1.8, 1.5]].map(([id, x, z]) => ({id: id as string, kind: 'floor' as const, at: [x as number, z as number], yaw: Math.PI}));
    const late: Extra = {id: 'tw8', kind: 'walk', path: [[8.5, 7], [3.4, 2.6]], loop: false, t0: SEG('grounds') + 0.3, clip: 'walk_neutral_01', idle: 'idle_scratch_head_01'};
    return {node: <>{DAY()}<GroundsLife t={t} C={C} plan={[...seats, late]} bunting={[[[-2.9, 3.0, -0.9], [-7.5, 2.3, 4.5]], [[2.9, 3.0, -0.9], [7.5, 2.3, 4.5]]]} incense={[0.9, 0.78, -3.7]} />
      <Sala position={[0, 0, -3]} /><Clock position={[0, 0.66, -4]} scale={4} t={t} hands={false} battery={false} robe lit={0.15} /></>,
      cam: mv({pos: [2.6, 1.55, 9.6], look: [0, 1.5, -3], fov: 50}, lt, {push: 0.04, arrive: 0.06}), bg: SKY};
  },
  motion: (t, lt, C) => {
    // walk in → stop (crossfade out of the walk) → eyes/head/chest follow the dog → point (wind-up, overshoot, hold, quick drop; hand on an arc) → cheer (one-shot clip from its first frame)
    const I = C.nai; hideProps(I); const dogPath: V3[] = [[2.6, 0, 4.4], [-2.2, 0, 4.6], [-2.2, 0, 5.0], [2.6, 0, 5.2]];
    const g = gait([[-3.4, 3], [-0.2, 3]], lt, {t0: 0.15, speed: pace('walk_neutral_01')});
    const dogAt = gait(dogPath.map((p) => [p[0], p[2]] as [number, number]), t, {loop: true, speed: 1.3}); const dog: V3 = [dogAt.x, 0.4, dogAt.z];
    const tStop = lt - g.since, tPoint = 4.6, tCheer = 6.0;   // local seconds
    const cheering = lt > tCheer;
    const s = walker('nai', g, t, {idle: cheering ? 'cheer_01' : 'idle_neutral_01', lookW: g.since > 0.3 ? dog : undefined, lookT0: t - (g.since - 0.3),
      ...(cheering ? {clipT: lt - tCheer, clipB: 'idle_neutral_01', mix: sm((lt - tCheer) / 0.3)} : {}), face: cheering ? 'shout' : lt > tPoint && lt < tPoint + 0.9 ? 'wide' : undefined});
    const w = body(I, s, t); resetTurn(I);
    const k = cheering ? 0 : env(lt - tPoint, {hold: 0.55});
    if (Math.abs(k) > 0.001) { const sh = bw(I, 'Bip01_R_UpperArm'), rest = bw(I, 'Bip01_R_Hand'); const d = new THREE.Vector3(dog[0] - sh[0], dog[1] - sh[1], dog[2] - sh[2]).normalize();
      const tgt: V3 = [sh[0] + d.x * 0.58, sh[1] + d.y * 0.58 + 0.05, sh[2] + d.z * 0.58];
      fingers(I, 'R', 'point', Math.min(1, Math.max(0, k))); ik(I, 'R', loc(I, arc(rest, tgt, k, 0.12)), V(0.6, -1, 0), Math.min(1, Math.abs(k) * 4)); w.updateMatrixWorld(true); }
    void tStop;
    return {node: <>{DAY()}<GroundsLife t={t} /><StrayDog path={dogPath} t={t} seed={2} /><P o={w} /></>,
      cam: mv({pos: [1.6, 1.35, 7.4], look: [-0.5, 1.05, 3.2], fov: 38}, lt, {push: 0.02, arrive: 0.06}), bg: SKY};
  },
};
const SEG = (n: string) => STARTS[SEGS.findIndex((s) => s[0] === n)] / FPS;
const courtScene = (t: number, C: Cast) => { const I = C.judge; hideProps(I);
  const w = body(I, ps('judge', 0, -3.25, 0, t, {poseId: 'sitIdle', clip: 'sit_table_idle_look_around', lookW: [0, 1.2, 0.6]}), t, 0.5);
  return <><Court t={t} /><P o={w} /><Clock position={[0, 1.04, 0.6]} yaw={Math.PI} scale={2.6} t={t} sec={t} battery={false} /><CourtLife t={t} C={C} /></>; };

const World: React.FC<{t: number; f: number; C: Cast}> = ({t, f, C}) => {
  let i = 0; while (i + 1 < STARTS.length && f >= STARTS[i + 1]) i++;
  const name = SEGS[i][0]; const out = SHOTS[name](t, (f - STARTS[i]) / FPS, C);
  return <><CamRig cam={out.cam} bg={out.bg ?? {color: '#BFD6E4'}} /><ambientLight color="#E8EEF2" intensity={0.25} /><group key={name}>{out.node}</group></>;
};
export const LifeKitDemo: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / FPS; const ready = useFontsReady();
  const lib = useRb([], 'toon'); const C = useCast(IDS, lib);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(C) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [C]);
  const q = canvasQuality(quality); let i = 0; while (i + 1 < STARTS.length && f >= STARTS[i + 1]) i++;
  return <AbsoluteFill style={{background: '#000'}}>
    <AbsoluteFill style={{filter: 'saturate(0.9) contrast(1.04)'}}>
      {lib && ready && <ThreeCanvas width={1080} height={1920} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 600, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, stencil: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
        <World t={t} f={f} C={C} />
      </ThreeCanvas>}
    </AbsoluteFill>
    <Grade frame={f} vig={0.14} />
    <div style={{position: 'absolute', left: 48, top: 70, color: '#fff', font: '600 40px Prompt, sans-serif', textShadow: '0 2px 8px #000'}}>lifekit · {LABEL[SEGS[i][0]]}</div>
  </AbsoluteFill>;
};
void BedroomLife;
