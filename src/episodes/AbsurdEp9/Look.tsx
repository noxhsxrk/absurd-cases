import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import '../AbsurdEp1/cast';
import {useRb, useCast, drive} from '../../pov/cast/RbPerson';
import {POSES} from '../../pov/cast/poses';
import {applyBoxLook, setFaceStyle, setFace} from '../AbsurdEp1/boxcast';
import {toLocal, ik, fingers, resetTurn} from '../../pov/acting/ik';
import {canvasQuality, Quality} from '../../pov/ui/quality';
import {Bedroom, Interro, TABLE_TOP} from '../AbsurdEp1/sets';
import {Handcuffs} from '../AbsurdEp1/props';
import {Grade} from '../AbsurdEp1/ui';
import {camMove, Cam} from '../absurdkit';
import {Mirror, BlackBag, makeToothbrush, MIR_H} from './props';

/** EP9 look-dev: four short tests of the new offender (the mirror) — not part of the episode. */
type V3 = [number, number, number];
export const LOOK_TOTAL = 330;
const IDS = ['nai', 'offA'];
const sm = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const ps = (id: string, x: number, z: number, yaw: number, t: number, clip: string, poseId = 'stand') => ({id, x, z, yaw, pose: {...(POSES as any)[poseId]({t, phase: 0, talking: false, seed: id.length, speed: 0}), hy: 0},
  held: 'none', heldL: 'none', front: 'none', visible: true, moving: false, label: '', next: '', talking: false, odo: 0, poseId, talkK: 0, fear: 0, clip} as any);
const wraps = new Map<any, THREE.Group>();
const body = (I: any, s: any, t: number) => { let w = wraps.get(I); if (!w) { w = new THREE.Group(); w.add(I.root); wraps.set(I, w); }
  w.position.set(s.x, 0, s.z); w.rotation.set(0, s.yaw, 0); w.scale.setScalar(I.scale); w.updateMatrixWorld(true); drive(I, s, t); w.updateMatrixWorld(true); return w; };
const P: React.FC<{o: THREE.Object3D}> = ({o}) => <primitive object={o} />;
const brushes = new WeakMap<any, THREE.Object3D>();
const brush = (I: any) => { let b = brushes.get(I); if (!b) { b = makeToothbrush(); b.position.set(8, 0, 0); b.rotation.set(0, Math.PI / 2, 0); I.bones.Bip01_R_Hand.add(b); brushes.set(I, b); } return b; };
const bw = (I: any, n: string): V3 => { const v = I.bones[n].getWorldPosition(new THREE.Vector3()); return [v.x, v.y, v.z]; };
const local = (I: any, s: any, w: V3) => new THREE.Vector3(...(toLocal(I, s, w) as any));

const Rig: React.FC<{cam: Cam; bg: string}> = ({cam, bg}) => { const {camera, scene} = useThree(); const c = camera as THREE.PerspectiveCamera;
  scene.background = new THREE.Color(bg); c.position.set(...cam.pos); c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0); c.lookAt(...cam.look); c.fov = cam.fov; c.updateProjectionMatrix(); return null; };

const deskM = new THREE.MeshStandardMaterial({color: '#A87A52', roughness: 0.6});
// A: bedroom, a desk by the bed, the man brushing in front of the tabletop mirror
const DESK: V3 = [1.0, 0.95, -1.2];
const scA = (C: any, t: number) => {
  const I = C.nai; const s = ps('nai', DESK[0], DESK[2] + 0.6, Math.PI, t, 'idle_neutral_01'); const w = body(I, s, t); resetTurn(I);
  brush(I).visible = true;
  const head = bw(I, 'Bip01_Head'); const mouth: V3 = [head[0] + Math.sin(t * 31) * 0.03, head[1] - 0.02, head[2] - 0.12];
  fingers(I, 'R', 'fist', 1); ik(I, 'R', local(I, s, mouth), new THREE.Vector3(-0.3, -1, 0.6), 1); w.updateMatrixWorld(true); setFace(I, 'half');
  const node = <><Bedroom st={{t, lamp: 1, day: 1}} />
    <mesh castShadow receiveShadow position={[DESK[0], DESK[1] / 2, DESK[2]]} material={deskM}><boxGeometry args={[0.9, DESK[1], 0.5]} /></mesh>
    <Mirror position={[DESK[0], DESK[1], DESK[2] - 0.05]} scale={1.5} tilt={-0.12} />
    <P o={w} /></>;
  return {node, cam: camMove({pos: [DESK[0] - 0.75, 1.75, DESK[2] + 3.0], look: [DESK[0] - 0.1, 1.3, DESK[2]], fov: 40}, t, {arrive: 0.1, push: 0.12}), bg: '#BFD6E4'};
};
// B: interrogation, the lieutenant slams the table; we look past his back into the mirror (his own face slams back)
const scB = (C: any, t: number, lt: number) => {
  const I = C.offA; const s = ps('offA', 0, 0.85, Math.PI, t, 'sit_table_idle_neutral_01', 'sitIdle'); const w = body(I, s, t); resetTurn(I);
  const ph = (lt % 1.5) / 1.5; const up = ph < 0.45 ? sm(ph / 0.45) : 1 - Math.min(1, (ph - 0.45) / 0.08);   // raise slow, slam fast (~2–3 f)
  const hand: V3 = [0.2, TABLE_TOP + 0.06 + up * 0.38, 0.3 - up * 0.05];
  fingers(I, 'R', 'flat', 1); ik(I, 'R', local(I, s, hand), new THREE.Vector3(0.6, -1, -0.3), 1); w.updateMatrixWorld(true);
  setFace(I, Math.sin(lt * 14) > -0.3 ? 'talk' : 'wide');
  const node = <><Interro t={t} swing={0} /><Mirror position={[0, TABLE_TOP, -0.15]} scale={1.6} tilt={-0.1} /><P o={w} /></>;
  return {node, cam: camMove({pos: [-0.7, 1.55, 2.9], look: [0, 1.15, -0.15], fov: 38}, lt, {arrive: 0.1, push: 0.1}), bg: '#1A1E22'};
};
// C: bagged + cuffed to the frame edge, on the interrogation table
const scC = (t: number, lt: number) => ({node: <><Interro t={t} swing={0} /><Mirror position={[0, TABLE_TOP, -0.15]} scale={1.6} />
  <group position={[0, TABLE_TOP, -0.15]} scale={1.6}><BlackBag k={sm(lt / 0.5)} /></group>
  <Handcuffs k={1} position={[0.4, TABLE_TOP + 0.3, -0.1]} rotation={[0, 0, Math.PI / 2]} size={2} /></>,
  cam: camMove({pos: [1.1, 1.75, 2.6], look: [0.05, TABLE_TOP + 0.35, -0.15], fov: 40}, lt, {push: 0.15}), bg: '#1A1E22'});
// D: ring light on, steam fogging it up (bedroom at night stands in for the rented room)
const scD = (t: number, lt: number) => ({node: <><Bedroom st={{t, lamp: 0.3}} />
    <mesh receiveShadow position={[DESK[0], DESK[1] / 2, DESK[2]]} material={deskM}><boxGeometry args={[0.9, DESK[1], 0.5]} /></mesh>
    <Mirror position={[DESK[0], DESK[1], DESK[2] - 0.05]} scale={1.5} ring={sm(lt / 0.3)} fog={sm((lt - 0.8) / 1.8)} /></>,
    cam: camMove({pos: [DESK[0] + 0.3, 1.45, DESK[2] + 2.4], look: [DESK[0], DESK[1] + 0.45, DESK[2]], fov: 40}, lt, {push: 0.08}), bg: '#10141C'});

const World: React.FC<{C: any; f: number}> = ({C, f}) => {
  const t = f / 30;
  for (const I of Object.values(C) as any[]) I.root.visible = false;
  const b = brushes.get(C.nai); if (b) b.visible = false;
  let o;
  if (f < 90) { C.nai.root.visible = true; o = scA(C, t); }
  else if (f < 180) { C.offA.root.visible = true; o = scB(C, t, t - 3); }
  else if (f < 240) o = scC(t, t - 6);
  else o = scD(t, t - 8);
  return <><Rig cam={o.cam} bg={o.bg} /><ambientLight intensity={0.3} />{o.node}</>;
};

export const AbsurdEp9Look: React.FC<{quality?: Quality}> = ({quality = 'fast'}) => {
  const f = useCurrentFrame(); const q = canvasQuality(quality);
  const lib = useRb([], 'toon'); const C = useCast(IDS, lib);
  useMemo(() => { setFaceStyle('ink'); for (const [id, I] of Object.entries(C) as [string, any][]) { applyBoxLook(I, id); I.root.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); } }, [C]);
  return <AbsoluteFill style={{background: '#000'}}>
    {lib && (C as any).nai && <ThreeCanvas width={1080} height={1920} dpr={q.dpr} shadows={q.shadows} camera={{fov: 40, near: 0.01, far: 200, position: [0, 1.5, 3]}} gl={{antialias: q.antialias, stencil: true}} onCreated={({gl}) => { gl.toneMapping = THREE.NoToneMapping; }}>
      <World C={C} f={f} /></ThreeCanvas>}
    <Grade frame={f} vig={0.16} />
  </AbsoluteFill>;
};
