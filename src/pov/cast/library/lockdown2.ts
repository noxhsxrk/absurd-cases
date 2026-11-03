import {TOON, ToonLook} from '../Toon';
import {SEATS, EXTRAS, MAIN} from './lockdown';
import {CROUCH, ST} from '../../sets/school/layout';
import {hash} from '../../lib/math';

/**
 * EP2 cast. The class is EP1's (same looks, same three boys who dragged the barricade), plus Ton (now with us),
 * the teacher of the room next door, two canteen aunties, a neighbour in the alley and five ม.2 kids who come running at the end.
 */
const seatOf = (id: string) => Object.entries(SEATS).find(([, v]) => v === id)![0];
export const PUSHERS = [SEATS['01'], SEATS['02'], SEATS['10']];
PUSHERS.forEach((id) => { TOON[id] = {...TOON[id], female: false, hairStyle: 'short', skirt: false, pleats: false, sailor: false, untucked: false, strap: false, shorts: true, bow: undefined, pocket: true, pants: '#B39A72', shoes: '#8C3E2C', belt: '#15161A', buckle: true, build: 0.95}; });
TOON.ton = MAIN.ton;

/** where each extra was crouched at the end of EP1 (same assignment as EP1's plans) */
export const SPOT: Record<string, number> = {};
{
  const taken = new Set<number>();
  const order = EXTRAS.filter((id) => !PUSHERS.includes(id)).concat(PUSHERS).sort((a, b) => ST[`seat${seatOf(b)}`][1] - ST[`seat${seatOf(a)}`][1]);
  order.forEach((id) => {
    const [x, z] = ST[`seat${seatOf(id)}`]; let best = -1, bd = 1e9;
    CROUCH.forEach((p, i) => { if (taken.has(i)) return; const d = Math.hypot(p[0] - x, p[1] - z); if (d < bd) { bd = d; best = i; } });
    taken.add(best); SPOT[id] = best;
  });
}

const W: Partial<ToonLook> = {};
TOON.kru324 = {skin: '#D8A27C', hair: '#18120F', hairStyle: 'bun', top: '#E9B7C0', pants: '#3B3A44', skirt: true, shoes: '#2A2328', outfit: 'blouse', glasses: false, female: true, build: 1.0, ...W};
TOON.vend1 = {skin: '#C68B62', hair: '#1D1714', hairStyle: 'bun', top: '#5E8FB8', pants: '#2F3135', shoes: '#6B5A4A', outfit: 'shortSleeve', female: true, build: 1.08};
TOON.vend2 = {skin: '#B97E58', hair: '#2A211C', hairStyle: 'bob', top: '#D9774E', pants: '#3A3430', shoes: '#4A4038', outfit: 'shortSleeve', female: true, build: 1.04};
TOON.neigh = {skin: '#C99A78', hair: '#B9B4AE', hairStyle: 'bun', top: '#7A5A8C', pants: '#33302E', shoes: '#4A4038', outfit: 'shortSleeve', female: true, build: 0.98};
// ม.2 kids: the same uniform, younger and smaller
export const RUNNERS = ['run1', 'run2', 'run3', 'run4', 'run5'];
RUNNERS.forEach((id, i) => {
  const girl = i % 2 === 1, skin = ['#D9A67F', '#C99069', '#E0B08B', '#B97E58', '#CF9A74'][i];
  TOON[id] = girl
    ? {skin, hair: '#151214', hairStyle: 'bob', top: '#F1F0F6', pants: '#24304D', skirt: true, pleats: true, shoes: '#17181C', strap: true, outfit: 'shortSleeve', female: true, build: 0.8, socks: '#F4F3EF', bow: '#24304D', sailor: true, untucked: true}
    : {skin, hair: '#141113', hairStyle: 'short', top: '#F1F0F6', pants: '#B39A72', shoes: '#8C3E2C', outfit: 'shortSleeve', female: false, build: 0.8, shorts: true, socks: '#F4F3EF', pocket: true, belt: '#15161A', buckle: true};
});

/** the class in train order: Kru leads, Prae, the viewer ('me', not a body), Phum, Ton, then the extras */
export const CLASS = ['kru', 'prae', 'phum', 'ton', ...EXTRAS];
export const OTHERS = ['kru324', 'vend1', 'vend2', 'neigh', ...RUNNERS];
export const IDS = [...CLASS, ...OTHERS];
export const SCALE: Record<string, number> = {run1: 0.9, run2: 0.88, run3: 0.91, run4: 0.89, run5: 0.9};
export const SPEAKER_ID: Record<string, string> = {KRU_ORN: 'kru', PRAE: 'prae', PHUM: 'phum', TON: 'ton'};
export {EXTRAS, SEATS};
export const _h = hash;
