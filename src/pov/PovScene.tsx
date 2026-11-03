import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree, createPortal} from '@react-three/fiber';
import * as THREE from 'three';
import {Interior} from './sets/Interior';
import {WORLD} from './life/plans';
import {stateMemo} from './life/world';
import {useRb, useCast, RbPerson, CASTING} from './cast/RbPerson';
import {keys} from './lib/time';
import {FONT} from './ui/fonts';
import {FpvArm, GRIPS, handQuat} from './cast/FpvHands';

const W = 1080, H = 1920, FOV = 62;
const IDS = Object.keys(CASTING);
const T0 = 6.5;

/** POV: the viewer stands in the lobby with a coffee, watches the delivery arrive, then looks down the office. */
const camAt = (t: number) => {
  const T = [6.5, 8.0, 9.6, 12.0, 13.3, 14.5];
  const px = keys(t, [6.5, 14.5], [1.25, 0.85]), pz = keys(t, [6.5, 9, 12, 14.5], [3.35, 3.1, 2.75, 2.2]);
  const lx = keys(t, T, [1.6, 4.4, 2.9, 2.75, 0.6, -1.6]), ly = keys(t, T, [1.35, 1.35, 1.22, 1.22, 1.3, 1.15]), lz = keys(t, T, [-6, 0.9, 0.75, 0.6, -1.8, -5.5]);
  const step = Math.sin(t * 2 * Math.PI * 0.9) * 0.012 * (t < 12 ? 0.4 : 1);
  return {p: [px, 1.62 + step, pz] as [number, number, number], l: [lx, ly, lz] as [number, number, number]};
};
const hand = (t: number) => ({x: Math.sin(t * 0.7) * 0.008 + Math.sin(t * 1.9) * 0.003, y: Math.sin(t * 0.55 + 1) * 0.006 + Math.sin(t * 2 * Math.PI * 0.9) * 0.004, r: Math.sin(t * 0.45) * 0.03});

/** The viewer's right hand holding the mug: palm faces the mug (left), fingers wrap forward-left, forearm enters from the lower right. */
const MugHand: React.FC<{t: number}> = ({t}) => {
  const h = hand(t);
  const q = useMemo(() => handQuat([-0.8, 0.12, -0.58], [-0.6, 0.0, 0.8]), []);
  const qq = q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, h.r)));
  return <FpvArm side="R" wrist={[0.135 + h.x, -0.2 + h.y, -0.5]} q={qq} grip={GRIPS.mug} sleeve="#F2F2EF" cuff="#E2E2DE" />;
};

const Rig: React.FC<{t: number}> = ({t}) => {
  const {camera, scene} = useThree();
  useLayoutEffect(() => { if (camera.parent !== scene) scene.add(camera); const c = camAt(t); camera.position.set(...c.p); camera.lookAt(...c.l); camera.rotateZ(Math.sin(t * 0.6) * 0.006); const pc = camera as THREE.PerspectiveCamera; pc.fov = FOV; pc.aspect = W / H; pc.near = 0.05; pc.updateProjectionMatrix(); });
  return createPortal(<MugHand t={t} />, camera);
};

const fmt = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = Math.floor(s) % 60; return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')} AM`; };
const LINES: [number, number, string, string][] = [
  [6.6, 9.4, 'เช้าวันจันทร์ ชั้น 12... ทุกอย่างดู', 'ปกติ'],
  [9.7, 12.2, 'พัสดุของพี่มะลิมาแล้วครับ ', 'เซ็นรับ'],
  [12.4, 14.5, 'แต่ไม่มีใครรู้เลยว่า... ', 'อีกสิบนาทีข้างหน้า'],
];
const Hud: React.FC<{t: number}> = ({t}) => {
  const clock = 8 * 3600 + 36 * 60 + t;
  const line = LINES.find((l) => t >= l[0] && t < l[1]);
  return (
    <AbsoluteFill style={{fontFamily: FONT, pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.38) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 72%, rgba(0,0,0,.28) 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,.32) 100%)'}} />
      <div style={{position: 'absolute', left: 58, top: 150, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.45)'}}>
        <div style={{fontSize: 28, fontWeight: 500, opacity: 0.92}}>จันทร์ 3 พ.ย.</div>
        <div style={{fontSize: 74, fontWeight: 700, lineHeight: 1.05, letterSpacing: 0.5}}>{fmt(clock)}</div>
        <div style={{fontSize: 28, fontWeight: 600, opacity: 0.92, marginTop: 4}}>อาคารนอร์ทวินด์ · ชั้น 12</div>
        <div style={{display: 'inline-block', marginTop: 12, padding: '3px 14px', background: '#D8343A', color: '#fff', borderRadius: 6, fontSize: 26, fontWeight: 700, border: '2px solid #fff'}}>เรื่องสมมติ</div>
      </div>
      {line && (() => { const k = Math.min(1, (t - line[0]) / 0.18, (line[1] - t) / 0.18); return (
        <div style={{position: 'absolute', left: 70, right: 70, top: 1190, textAlign: 'center', color: '#fff', fontSize: 52, fontWeight: 700, lineHeight: 1.3, textShadow: '0 3px 12px rgba(0,0,0,.6), 0 0 2px rgba(0,0,0,.8)', opacity: k, transform: `translateY(${(1 - k) * 12}px)`}}>
          {line[2]}<span style={{color: '#FFB020'}}>{line[3]}</span></div>); })()}
    </AbsoluteFill>
  );
};

export const PovScene: React.FC = () => {
  const t = useCurrentFrame() / 30 + T0;
  const states = stateMemo(WORLD, t);
  const lib = useRb(IDS.map((i) => CASTING[i]), 'toon'); const P = useCast(IDS, lib);
  const ready = !!P[IDS[0]];
  return (
    <AbsoluteFill style={{background: '#E9E6E0'}}>
      <ThreeCanvas width={W} height={H} shadows="soft" camera={{fov: FOV, near: 0.05, far: 600, position: [1, 1.62, 3]}} gl={{antialias: true}} onCreated={({gl}) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; }}>
        <Rig t={t} />
        <color attach="background" args={['#DCE6EE']} /><fog attach="fog" args={['#E4E6E6', 30, 260]} />
        <hemisphereLight args={['#FFF9F0', '#8D8679', 1.35]} /><ambientLight intensity={0.35} />
        <directionalLight position={[-6, 9, -20]} intensity={1.6} color="#FFF1DC" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-near={1} shadow-camera-far={60} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-radius={4} />
        <directionalLight position={[2, 12, 4]} intensity={0.6} color="#FFFFFF" />
        <Interior t={t} marks={WORLD.marks} boxOnDesk={t >= WORLD.marks.boxDown} clock={8 * 3600 + 36 * 60 + t} />
        {ready && states.map((s) => s.visible && P[s.id] && <RbPerson key={s.id} I={P[s.id]} s={s} t={t} />)}
      </ThreeCanvas>
      <Hud t={t} />
    </AbsoluteFill>
  );
};
