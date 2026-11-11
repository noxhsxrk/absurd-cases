import React from 'react';
import {Cell} from '../AbsurdEp1/sets';
import {Jar, Mosquito} from '../AbsurdEp1/props';
import {Fan, CellPlate} from '../AbsurdEp2/props';
import {Durian} from '../AbsurdEp4/props';
import {Glow} from '../AbsurdEp8/props';
import {lots} from '../AbsurdEp8/village';
import {M} from '../../pov/lib/tex';
import {Skyline, Hills, CloudsDrift, SwayTree, Palm, Bush, GrassTufts, FallingLeaves, Birds, WireBirds, Pigeons, Chickens, Butterflies, Moths, Gecko, StrayDog, SleepingDog, SittingCat,
  Traffic, Laundry, Bunting, CeilingFan, Curtain, Smoke} from './props';
import {Townsfolk, Extra, Bench, FarWalkers, courtAudience, TOWN} from './people';
import {Cast, V3} from './stage';

/**
 * lifekit presets (2026-11-11): one line per location turns a dead set into a lived-in one.
 * Each preset adds the three depth layers (near dressing, mid life, far world) and at least two moving things;
 * pass C (the cast) to also get the default townsfolk — their ids (TOWN) must be in the episode's IDS.
 * Rule of thumb: background life is muted and slow; switch a layer off (traffic, folk, trees) when the action needs that space.
 */
type Opt<T> = T & {t: number};

// =====================================================================================================
// VILLAGE: dresses <Village /> (AbsurdEp8): road along x (z −3…3), footpaths at z = ±4.6 (top y 0.12), fences at ±5.6
// =====================================================================================================
const FP = 0.12;
export const VILLAGE_FOLK: Extra[] = [
  {id: 'tw1', kind: 'walk', path: [[-26, 4.45], [26, 4.45], [26, 4.8], [-26, 4.8]], y: FP},
  {id: 'tw2', kind: 'walk', path: [[24, -4.45], [-24, -4.45], [-24, -4.8], [24, -4.8]], y: FP, phase: 11},
  {id: 'tw8', kind: 'walk', path: [[-20, -4.5], [18, -4.5], [18, -4.75], [-20, -4.75]], y: FP, phase: 31, clip: 'walk_cool_01'},
  {id: 'tw4', kind: 'walk', path: [[14, 4.5], [-22, 4.5], [-22, 4.75], [14, 4.75]], y: FP, phase: 17, clip: 'walk_fast_01'},
  {id: 'tw3', kind: 'stand', at: [-6.5, -4.3], yaw: 0.3, y: FP, clip: 'cell_phone_textmessage'},
  {id: 'tw5', kind: 'chat', with: 'tw7', at: [7.5, 4.65], yaw: Math.PI / 2, y: FP},
  {id: 'tw6', kind: 'sit', at: [-12, 4.95], yaw: Math.PI, y: FP + 0.45, clip: 'sit_chair_idle_look_around'},
];
export const VillageLife: React.FC<Opt<{night?: number; C?: Cast; plan?: Extra[]; traffic?: boolean; trees?: boolean; animals?: boolean; /** the street dog trotting along the kerb */ dog?: boolean; x0?: number; x1?: number}>> = ({t, night = 0, C, plan = VILLAGE_FOLK, traffic = true, trees = true, animals = true, dog = true, x0 = -34, x1 = 34}) => {
  const L = lots(x0, x1); const day = night < 0.5;
  const yard = (k: number) => L[Math.min(L.length - 1, k)];
  const a = yard(1), b = yard(L.length - 2), c = yard(3), d = yard(L.length - 4);
  const lamps = Array.from({length: 5}, (_, k) => x0 + 6 + k * 16);
  return <>
    {/* far */}
    <Skyline t={t} night={night} r0={70} r1={130} /><Hills /><CloudsDrift t={t} night={night} />
    <FarWalkers a={[x1 + 2, FP, 4.6]} b={[x1 + 24, FP, 4.6]} n={5} t={t} seed={3} /><FarWalkers a={[x0 - 24, FP, -4.6]} b={[x0 - 2, FP, -4.6]} n={4} t={t} seed={8} />
    {/* green */}
    {trees && <>{[[-20, 3.65], [-2, 3.65], [16, 3.65], [-9, -3.65], [9, -3.65], [25, -3.65]].map(([x, z], i) => <SwayTree key={i} position={[x, 0.1, z]} t={t} seed={i + 1} kind={i % 2 ? 'tall' : 'round'} scale={0.8} />)}
      {[[-15, -19], [8, -20], [22, 19], [-27, 19.5]].map(([x, z], i) => <Palm key={i} position={[x, 0, z]} t={t} seed={i + 4} h={7 + (i % 2)} />)}</>}
    {L.filter((_, i) => i % 2 === 0).map((l) => <Bush key={l.i} position={[l.x - l.W * 0.42, 0.06, l.side * 6.1]} t={t} seed={l.i} flowers={l.i % 4 === 0} />)}
    {[1, -1].map((s) => <GrassTufts key={s} center={[(x0 + x1) / 2, 0.1, s * 3.6]} size={[x1 - x0, 0.6]} n={260} t={t} seed={s + 2} />)}
    {/* yards */}
    <Laundry a={[a.x - a.W * 0.1, 1.9, a.side * 6.5]} b={[a.x + a.W * 0.42, 1.9, a.side * 6.5]} t={t} seed={2} />
    <Laundry a={[b.x - b.W * 0.4, 1.9, b.side * 6.5]} b={[b.x + b.W * 0.05, 1.9, b.side * 6.5]} t={t} seed={5} n={4} />
    {/* animals */}
    {animals && <>
      <SittingCat position={[c.x + c.W * 0.3, 1.2, c.side * 5.6]} yaw={c.side > 0 ? Math.PI : 0} t={t} look={Math.sin(t * 0.4) * 0.6} />
      {!dog ? null : day ? <StrayDog path={[[-18, 0, 2.5], [-3, 0, 2.5], [-3, 0, 2.1], [-18, 0, 2.1]]} t={t} seed={1} /> : <SleepingDog position={[lamps[2] + 0.6, FP, -4.2]} yaw={1.2} t={t} />}
      {day && <><Chickens center={[d.x - d.W * 0.05, 0.06, d.side * 7.5]} r={1.2} n={3} t={t} seed={4} /><Butterflies center={[a.x - a.W * 0.42, 0.9, a.side * 6.1]} size={[1.6, 1, 1.2]} n={3} t={t} seed={6} />
        <Birds t={t} center={[0, 0, 0]} radius={18} y={15} n={7} seed={2} /><WireBirds a={[lamps[2], 6.42, -3.4]} b={[lamps[2], 6.42, -2.2]} n={3} t={t} seed={9} /></>}
    </>}
    {traffic && <><Traffic t={t} a={[x0 - 12, 0, -1.4]} b={[x1 + 12, 0, -1.4]} every={6} speed={8} seed={1} night={night} /><Traffic t={t} a={[x1 + 12, 0, 1.4]} b={[x0 - 12, 0, 1.4]} every={9} speed={7} seed={7} night={night} kinds={['bike', 'car']} /></>}
    {/* night: the set's lamp posts come on, moths round them */}
    {!day && lamps.map((x, k) => <group key={x}><pointLight position={[x, 6.0, -2.15]} color="#FFD9A0" intensity={9} distance={11} decay={1.6} /><Glow p={[x, 6.2, -2.15]} c="#FFD9A0" s={1.6} o={0.7} />
      {k % 2 === 0 && <Moths center={[x, 6.1, -2.15]} r={0.4} n={6} t={t} seed={k} />}</group>)}
    {C && <><Bench position={[-12, FP, 5.1]} yaw={Math.PI} /><Townsfolk C={C} t={t} plan={plan} /></>}
  </>;
};

// =====================================================================================================
// TEMPLE / PARK GROUNDS: an open lawn with big shade trees around the origin (put the hall or the action at the centre)
// =====================================================================================================
export const GroundsLife: React.FC<Opt<{r?: number; C?: Cast; plan?: Extra[]; bunting?: [V3, V3][]; incense?: V3}>> = ({t, r = 14, C, plan = [], bunting = [], incense}) => <>
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}><planeGeometry args={[500, 500]} /><meshLambertMaterial color="#9FBE8B" /></mesh>
  <Skyline t={t} r0={90} r1={150} n={60} /><Hills /><CloudsDrift t={t} />
  {Array.from({length: 9}, (_, i) => { const a = -2.6 + i * 0.65 + Math.sin(i * 5.1) * 0.12, d = r + (i % 3) * 3.5; return <SwayTree key={i} position={[Math.sin(a) * d, 0, -Math.cos(a) * d - 4]} t={t} seed={i + 11} kind={i % 3 === 0 ? 'mango' : 'round'} scale={1.2 + (i % 2) * 0.35} />; })}
  {[[-r - 2, 6], [r + 3, 4], [-r + 1, -r - 9]].map(([x, z], i) => <Palm key={i} position={[x, 0, z]} t={t} seed={i + 2} h={7.5} />)}
  {[[-4.2, -1.2], [4.3, -1.6], [-5.5, 3], [5.8, 3.4]].map(([x, z], i) => <Bush key={i} position={[x, 0, z]} t={t} seed={i + 5} flowers={i % 2 === 0} />)}
  <GrassTufts center={[0, 0, 4]} size={[26, 18]} n={500} t={t} seed={5} />
  <FallingLeaves center={[-r * 0.55, 3, -6]} size={[5, 5, 5]} t={t} n={12} seed={3} />
  <Birds t={t} center={[0, 0, -4]} radius={16} y={13} n={6} seed={5} /><Pigeons center={[4.5, 0, 5.5]} r={1.4} n={5} t={t} seed={2} /><Butterflies center={[-4.2, 0.9, -1.2]} size={[2, 1, 1.5]} n={3} t={t} seed={7} />
  <SleepingDog position={[3.6, 0, -0.4]} yaw={-0.8} t={t} />
  {bunting.map(([a, b], i) => <Bunting key={i} a={a} b={b} t={t} />)}
  {incense && <Smoke from={incense} t={t} n={6} color="#E8E4DA" rise={0.9} spread={0.12} />}
  {C && plan.length > 0 && <Townsfolk C={C} t={t} plan={plan} />}
</>;

// =====================================================================================================
// COURT (AbsurdEp1 Court set): people in the gallery, fans turning, curtains breathing at the windows
// =====================================================================================================
export const CourtLife: React.FC<Opt<{C?: Cast; ids?: string[]; look?: V3}>> = ({t, C, ids = TOWN, look}) => <>
  {[-1.8, 1.8].map((x) => <CeilingFan key={x} position={[x, 4.2, 0.8]} t={t} speed={0.7} />)}
  {[-1.2, 1.2].map((z) => <Curtain key={z} position={[-3.9, 1.55, z]} w={1.1} h={2.1} yaw={Math.PI / 2} t={t} color="#E9E2D0" />)}
  {C && <Townsfolk C={C} t={t} plan={courtAudience(ids, look)} />}
</>;

// =====================================================================================================
// CELL BLOCK: the neighbours. The hero cell is at x = 0 (the episode draws it); these are the cells either side, with
// the inmates the series has already put away (bible: the mosquito in its jar, the fan, the durian).
// =====================================================================================================
export type Inmate = 'mosquito' | 'fan' | 'durian' | 'empty';
const CELL_W = 3.05;
const inmate = (who: Inmate, t: number) => who === 'mosquito' ? <group position={[-0.35, 0.46, -1.2]}><Jar><Mosquito t={t} position={[Math.sin(t * 3.1) * 0.03, 0.09 + Math.sin(t * 4.3) * 0.02, Math.cos(t * 2.3) * 0.03]} scale={0.5} /></Jar></group>
  : who === 'fan' ? <Fan position={[0.25, 0, -0.3]} yaw={-0.25} headYaw={Math.sin(t * 1.05) * 0.5} blade={t * 31} blur={1} lit={3} />
  : who === 'durian' ? <Durian position={[0.1, 0.32, -0.5]} r={0.3} yaw={0.3 + Math.sin(t * 0.5) * 0.15} squash={Math.sin(t * 1.4) * 0.02} /> : null;
export const CellBlockLife: React.FC<Opt<{left?: Inmate[]; right?: Inmate[]; corridor?: boolean; C?: Cast; plan?: Extra[]}>> = ({t, left = ['fan', 'mosquito'], right = ['durian'], corridor = true, C, plan = []}) => {
  const cells: [number, Inmate, number][] = [...left.map((w, i) => [-(i + 1) * CELL_W, w, 19 - i] as [number, Inmate, number]), ...right.map((w, i) => [(i + 1) * CELL_W, w, 20 + i * 2] as [number, Inmate, number])];
  const span = (Math.max(left.length, right.length) + 1.5) * CELL_W * 2;
  return <>
    {cells.map(([x, who, no]) => <group key={x} position={[x, 0, 0]}><Cell t={t} days={0.45} marks={who === 'empty' ? 0 : 9 + (no % 7)} />{inmate(who, t)}
      <CellPlate text={`ห้อง ${no}`} position={[0, 2.12, 1.54]} w={0.64} /></group>)}
    {corridor && <><mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 3.2]} material={M('#8E918B')}><planeGeometry args={[span, 3.6]} /></mesh>
      <mesh position={[0, 1.4, 5.0]} rotation={[0, Math.PI, 0]} material={M('#6F736D')}><planeGeometry args={[span, 2.8]} /></mesh></>}
    <Gecko a={[-1.2, 2.3, 4.98]} b={[1.4, 1.9, 4.98]} normal={[0, 0, -1]} t={t} seed={3} />
    {C && plan.length > 0 && <Townsfolk C={C} t={t} plan={plan} />}
  </>;
};

// =====================================================================================================
// any open exterior (prison front, a field, a roadside): just the far world + sky life, nothing on the ground plane
// =====================================================================================================
export const OpenAirLife: React.FC<Opt<{night?: number; arc?: [number, number]; pigeons?: V3; scareAt?: number}>> = ({t, night = 0, arc, pigeons, scareAt}) => <>
  <Skyline t={t} night={night} r0={80} r1={140} arc={arc} /><Hills /><CloudsDrift t={t} night={night} />
  {night < 0.5 && <Birds t={t} center={[0, 0, 0]} radius={20} y={16} n={6} seed={4} />}
  {pigeons && <Pigeons center={pigeons} r={1.3} n={5} t={t} seed={6} scareAt={scareAt} />}
</>;

// =====================================================================================================
// BEDROOM at night (AbsurdEp1 Bedroom): the small things that say "someone lives here"
// =====================================================================================================
export const BedroomLife: React.FC<Opt<{lamp?: boolean}>> = ({t, lamp = true}) => { const sweep = (t % 9) / 2.2;   // a car passes outside every 9 s: its headlights slide across the ceiling
  return <>
    <Gecko a={[1.75, 1.7, -2.18]} b={[0.95, 2.15, -2.18]} normal={[0, 0, 1]} t={t} seed={1} />
    {lamp && <Moths center={[1.1, 0.98, -1.95]} r={0.2} n={3} t={t} seed={2} />}
    {sweep < 1 && <pointLight position={[-1.6 + sweep * 3.2, 2.5, -0.5 + sweep * 0.8]} color="#DCE8FF" intensity={1.6 * Math.sin(sweep * Math.PI)} distance={3.2} decay={1.5} />}
  </>;
};
