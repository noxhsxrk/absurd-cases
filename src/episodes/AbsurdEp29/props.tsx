import React from 'react';
import * as THREE from 'three';
import {MB, M} from '../../pov/lib/tex';
import {PM} from '../AbsurdEp1/boxcast';
import {label} from '../AbsurdEp8/props';
import {HANDLE} from './data';

/** EP29 คดีตู้กดน้ำ — the new things only. The accused is a plain coin-op drinks machine (no face): it eats coins, and when shaken it drops
 *  one can. Cuffs, cell, phone and the giant ring come from earlier episodes. */
export type V3 = [number, number, number];
const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// =====================================================================================================
// THE VENDING MACHINE. Origin = the middle of its foot print, front = +z. rz / rx = how it rocks when shaken (rad, about its base);
// flap = the can in the tray (0 none, 1 one can lying there); coin 0…1 = the coin going into the slot; lit = the display.
// =====================================================================================================
export const VM = {w: 0.95, h: 1.85, d: 0.75, slot: [0.3, 1.12] as [number, number], tray: [0, 0.62] as [number, number]};
const CANS = ['#C8382E', '#2F6DB5', '#E8B52A', '#3E9A5A', '#E07A2A'];
export const Can: React.FC<{position?: V3; rotation?: V3; c?: string; s?: number; dent?: number}> = ({position = [0, 0, 0], rotation = [0, 0, 0], c = '#C8382E', s = 1}) =>
  <group position={position} rotation={rotation} scale={s}>
    <mesh material={PM(c, 'can')} castShadow><cylinderGeometry args={[0.033, 0.033, 0.12, 14]} /></mesh>
    <mesh position={[0, 0.062, 0]} material={M('#C9CED3', 0.3, 0.8)}><cylinderGeometry args={[0.03, 0.033, 0.006, 14]} /></mesh>
    <mesh position={[0, 0.0, 0.0331]} material={MB('#F4F1E8')}><planeGeometry args={[0.03, 0.05]} /></mesh>
  </group>;
export const Coin: React.FC<{position: V3; rotation?: V3}> = ({position, rotation = [Math.PI / 2, 0, 0]}) =>
  <mesh position={position} rotation={rotation} material={M('#D9B44A', 0.25, 0.9)} castShadow><cylinderGeometry args={[0.013, 0.013, 0.003, 14]} /></mesh>;
export const Vending: React.FC<{position: V3; yaw?: number; rz?: number; rx?: number; flap?: number; coin?: number; lit?: string; t: number}> = ({position, yaw = 0, rz = 0, rx = 0, flap = 0, coin = 0, lit = '--', t}) => {
  const {w, h, d} = VM; const red = PM('#B8262A', 'vm'), dark = MB('#1A1C1F'), trim = M('#C9CED3', 0.3, 0.7);
  const piv: V3 = [rz > 0 ? w / 2 : -w / 2, 0, rx > 0 ? d / 2 : -d / 2];   // it rocks about the bottom edge it leans towards
  const disp = label('ep29-disp-' + lit, 256, 96, '#0E1A12', '#7CFF9A', [lit], 64);
  return <group position={position} rotation={[0, yaw, 0]}>
    <group position={piv} rotation={[rx, 0, -rz]}><group position={[-piv[0], 0, -piv[2]]}>
      <mesh position={[0, h / 2, 0]} material={red} castShadow receiveShadow><boxGeometry args={[w, h, d]} /></mesh>
      {/* the window full of cans: four rows of five */}
      <mesh position={[-0.12, 1.32, d / 2 + 0.002]} material={MB('#20262B')}><planeGeometry args={[0.6, 0.86]} /></mesh>
      {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((k) => <Can key={`${r}${k}`} position={[-0.36 + k * 0.12, 1.0 + r * 0.21, d / 2 + 0.04]} c={CANS[(r + k) % 5]} s={1.05} />))}
      <mesh position={[-0.12, 1.32, d / 2 + 0.085]} material={M('#BFD8E6', 0.05, 0.1, {transparent: true, opacity: 0.2}, 'vmglass')}><planeGeometry args={[0.62, 0.88]} /></mesh>
      {/* the side panel: display, buttons, the coin slot */}
      <mesh position={[0.33, 1.38, d / 2 + 0.004]} material={disp}><planeGeometry args={[0.2, 0.075]} /></mesh>
      {[0, 1, 2, 3].map((k) => <mesh key={k} position={[0.33, 1.26 - k * 0.06, d / 2 + 0.01]} material={MB(CANS[k])}><boxGeometry args={[0.1, 0.035, 0.02]} /></mesh>)}
      <mesh position={[VM.slot[0], VM.slot[1] - 0.12, d / 2 + 0.01]} material={trim}><boxGeometry args={[0.1, 0.1, 0.02]} /></mesh>
      <mesh position={[VM.slot[0], VM.slot[1] - 0.12, d / 2 + 0.021]} material={dark}><boxGeometry args={[0.006, 0.05, 0.002]} /></mesh>
      {coin > 0 && coin < 1 && <Coin position={[VM.slot[0], VM.slot[1] - 0.12 + 0.03 * (1 - coin), d / 2 + 0.02 + 0.06 * (1 - coin)]} rotation={[0, 0, Math.PI / 2]} />}
      {/* brand strip with the channel handle, and the tray at the bottom */}
      <mesh position={[0, 1.76, d / 2 + 0.003]} material={label('ep29-brand', 512, 96, '#F4EFE2', '#B8262A', ['น้ำเย็น 10 บาท · ' + HANDLE], 46)}><planeGeometry args={[0.88, 0.16]} /></mesh>
      <mesh position={[VM.tray[0], VM.tray[1], d / 2 + 0.003]} material={dark}><planeGeometry args={[0.6, 0.18]} /></mesh>
      <mesh position={[VM.tray[0], VM.tray[1] + 0.07, d / 2 + 0.1]} rotation={[0.25, 0, 0]} material={M('#3A3F44', 0.5, 0.4, {transparent: true, opacity: 0.75}, 'vmflap')}><boxGeometry args={[0.6, 0.12, 0.01]} /></mesh>
      {flap > 0 && <Can position={[0.05, VM.tray[1] - 0.04, d / 2 + 0.045]} rotation={[0, 0, Math.PI / 2]} c="#C8382E" />}
      <mesh position={[VM.tray[0], VM.tray[1] - 0.09, d / 2 + 0.05]} material={dark}><boxGeometry args={[0.6, 0.01, 0.1]} /></mesh>
    </group></group>
    <mesh position={[0, 0.005, 0]} material={MB('#2A2C2F')}><boxGeometry args={[w + 0.04, 0.01, d + 0.04]} /></mesh>
  </group>;
};
/** shake: both officers rocking it, rz in rad over time (0 outside the window) */
export const shakeAt = (t: number, t0: number, t1: number) => t < t0 || t > t1 ? 0 : 0.09 * Math.sin((t - t0) * 17) * Math.sin(Math.PI * (t - t0) / (t1 - t0));
void hash;
