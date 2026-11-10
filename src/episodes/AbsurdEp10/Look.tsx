import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {IDS} from './cast';
import {useRb, useCast, drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {applyBoxLook, setFaceStyle, setFace} from '../AbsurdEp1/boxcast';
import {toLocal, ik, fingers, resetTurn} from '../../pov/acting/ik';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {useFontsReady} from '../../pov/ui/story';
import {Bedroom, Interro, Cell, TABLE_TOP, BED_TOP} from '../AbsurdEp1/sets';
import {Handcuffs} from '../AbsurdEp1/props';
import {Village} from '../AbsurdEp8/village';
import {Grade} from '../AbsurdEp1/ui';
import {camMove, Cam} from '../absurdkit';
import {Router, Tower5G, SteelBox} from './props';
import {WifiFail} from './ui';

/** EP10 look-dev: the new things only — the router (LEDs, waves, tied antennas), the Cyber Police, the 5G tower, the steel box, the judge's phone. */
type V3 = [number, number, number];
const SEG = 75; export const LOOK_TOTAL = SEG * 5;
const sm = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const ps = (id: string, x: number, z: number, yaw: number, t: number, clip: string, poseId = 'stand') => ({id, x, z, yaw, pose: {...(POSES as any)[poseId]({t, phase: 0, talking: false, seed: id.length, speed: 0}), hy: 0},
  held: 'none', heldL: 'none', front: 'none', visible: true, moving: false, label: '', next: '', talking: false, odo: 0, poseId, talkK: 0, fear: 0, clip} as any);
const wraps = new Map<any, THREE.Group>();
const body = (I: any, s: any, t: number, y = 0, rx = 0) => { let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, y, s.z); w.rotation.set(rx, s.yaw, 0, 'YXZ'); w.scale.setScalar(I.scale); w.updateMatrixWorld(true); drive(I, s, t); w.updateMatrixWorld(true); return w; };
const P: React.FC<{o: THREE.Object3D}> = ({o}) => <primitive object={o} />;
const local = (I: any, s: any, w: V3) => new THREE.Vector3(...(toLocal(I, s, w) as any));
const Rig: React.FC<{cam: Cam; bg: string}> = ({cam, bg}) => { const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = new THREE.Color(bg); c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look); c.fov = cam.fov; c.updateProjectionMatrix(); return null; };

// A: night, he lies in bed watching a clip; the router on the nightstand goes green → amber → red
const NS: V3 = [1.28, 0.54, -1.74];
const PHONE: V3 = [0.14, BED_TOP + 0.62, -1.45];
const scA = (C: any, t: number, lt: number) => {
  const I = C.nai; const s = ps('nai', 0.12, -0.22, 0, t, 'idle_neutral_01'); const w = body(I, s, t, BED_TOP + 0.13, -Math.PI / 2); resetTurn(I);
  fingers(I, 'R', 'fist', 1); fingers(I, 'L', 'fist', 1);
  ik(I, 'R', local(I, s, [PHONE[0] + 0.06, PHONE[1] - 0.05, PHONE[2] + 0.02]), new THREE.Vector3(0.5, 0, -1), 1);
  ik(I, 'L', local(I, s, [PHONE[0] - 0.06, PHONE[1] - 0.05, PHONE[2] + 0.02]), new THREE.Vector3(-0.5, 0, -1), 1); w.updateMatrixWorld(true);
  setFace(I, lt > 1.5 ? 'angry' : 'half');
  const led = lt < 0.8 ? 'ok' : lt < 1.5 ? 'weak' : 'red';
  return {node: <><Bedroom st={{t, lamp: 0.25, made: false}} /><P o={w} />
    <group position={PHONE} rotation={[-Math.PI / 2 + 0.25, 0, 0]}><mesh><boxGeometry args={[0.08, 0.16, 0.009]} /><meshStandardMaterial color="#1B232C" /></mesh>
      <mesh position={[0, 0, -0.005]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.07, 0.15]} /><meshBasicMaterial color="#9CC4E8" toneMapped={false} /></mesh></group>
    <pointLight position={[PHONE[0], PHONE[1] - 0.1, PHONE[2]]} color="#9CC4E8" intensity={0.5} distance={1} />
    <Router position={NS} yaw={-0.5} scale={1.6} t={t} led={led} waves={1 - sm((lt - 0.6) / 0.8)} /></>,
    cam: camMove({pos: [1.95, 1.3, -0.15], look: [0.75, 0.62, -1.6], fov: 46}, lt, {arrive: 0.1, push: 0.12}), bg: '#1A1E22'};
};
// B: interrogation table, antennas tied behind its back with LAN cable, red LED blinking; a Cyber cop leans in
const scB = (C: any, t: number, lt: number) => {
  const I = C.cyb1; const s = ps('cyb1', 0, 0.85, Math.PI, t, 'sit_table_idle_neutral_01', 'sitIdle'); const w = body(I, s, t); resetTurn(I);
  fingers(I, 'R', 'point', 1); ik(I, 'R', local(I, s, [0.08, TABLE_TOP + 0.12, 0.05]), new THREE.Vector3(0.6, -1, -0.3), 1); w.updateMatrixWorld(true); setFace(I, 'angry');
  return {node: <><Interro t={t} swing={0.3} /><P o={w} /><Router position={[0, TABLE_TOP, 0.05]} scale={1.5} t={t} led="blink" tied={1} /></>,
    cam: camMove({pos: [-0.75, 1.45, -0.75], look: [0, TABLE_TOP + 0.04, -0.08], fov: 40}, lt, {arrive: 0.1, push: 0.15}), bg: '#1A1E22'};
};
// C: scale — the tiny router on the pavement, the 5G tower over the houses
const scC = (t: number, lt: number) => ({node: <><Village clear={[-6, 6]} /><hemisphereLight args={['#DCE8F2', '#5A5446', 1.15]} /><directionalLight position={[-10, 20, 12]} color="#FFF1D6" intensity={1.9} />
  <Tower5G position={[30, 0, -13]} yaw={-Math.PI / 2 + 0.35} t={t} /><Router position={[-3.9, 0, -2.25]} yaw={-Math.PI / 2 - 0.35} scale={1.4} t={t} led="weak" /></>,
  cam: camMove({pos: [-5.3, 0.32, -2.0], look: [-1.5, 1.35, -2.6], fov: 62}, lt, {arrive: 0.06, push: 0.05}), bg: '#BFD6E4'});
// D: the cell — the steel box lid slams over the router
const scD = (t: number, lt: number) => {
  const lid = 1 - sm((lt - 0.9) / 0.18);
  return {node: <><Cell t={t} days={0} marks={0} /><SteelBox position={[-0.2, 0, -0.6]} lid={lid} /><Router position={[-0.2, 0.0, -0.6]} scale={1.6} t={t} led="red" tied={0} /></>,
    cam: camMove({pos: [0.6, 1.5, 1.4], look: [-0.2, 0.4, -0.6], fov: 42}, lt, {arrive: 0.1, push: 0.12, shake: lt > 1.08 && lt < 1.3 ? 0.015 : 0}), bg: '#2A2E33'};
};

const World: React.FC<{seg: number; t: number; lt: number; C: any}> = ({seg, t, lt, C}) => {
  const out = seg === 0 ? scA(C, t, lt) : seg === 1 ? scB(C, t, lt) : seg === 2 ? scC(t, lt) : scD(t, lt);
  return <><Rig cam={out.cam} bg={out.bg} /><ambientLight intensity={0.25} />{out.node}</>;
};
export const AbsurdEp10Look: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const t = f / 30; const seg = Math.floor(f / SEG); const lt = (f - seg * SEG) / 30;
  const ready = useFontsReady(); const lib = useRb([], 'toon'); const C = useCast(IDS, lib); const q = canvasQuality(quality);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(C) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [C]);
  return <AbsoluteFill style={{background: '#000'}}>
    {seg < 4 && lib && ready && <ThreeCanvas width={1080} height={1920} dpr={q.dpr} shadows={q.shadows} camera={{fov: 45, near: 0.01, far: 600}} gl={{antialias: q.antialias, stencil: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
      <World seg={seg} t={t} lt={lt} C={C} />
    </ThreeCanvas>}
    <WifiFail t={t} t0={SEG * 4 / 30} t1={1e9} fail={SEG * 4 / 30 + 1.2} />
    <Grade frame={f} vig={0.16} />
  </AbsoluteFill>;
};
