import {TOON, ToonLook} from '../Toon';
import {hash} from '../../lib/math';
import {COLS, ROWS} from '../../sets/school/layout';

/** ม.5/3 cast. Thai school uniform (per Nox's reference photo): boys — loose white short-sleeve shirt with pocket, khaki knee shorts, black belt + silver buckle, white ankle socks, brown shoes; girls — white sailor-collar blouse worn untucked, big navy bow, navy pleated knee skirt, white ankle socks, black strap shoes. */
const NAVY = '#24304D', WHITE = '#F1F0F6', SHOE_B = '#17181C', SOCK = '#F4F3EF', KHAKI = '#B39A72', BROWN = '#8C3E2C';
const SKINS = ['#E6BC98', '#D9A67F', '#C99069', '#B97E58', '#A86F4C', '#E0B08B', '#CF9A74'];
const HAIRC = ['#141113', '#1C1614', '#241A16', '#2E211B', '#3A2A22'];
const boy = (skin: string, hair: string, o: Partial<ToonLook> = {}): ToonLook => ({skin, hair, hairStyle: 'short', top: WHITE, pants: KHAKI, shoes: BROWN, outfit: 'shortSleeve', female: false, build: 0.9, shorts: true, socks: SOCK, pocket: true, belt: '#15161A', buckle: true, ...o});
const girl = (skin: string, hair: string, o: Partial<ToonLook> = {}): ToonLook => ({skin, hair, hairStyle: 'long', top: WHITE, pants: NAVY, skirt: true, pleats: true, shoes: SHOE_B, strap: true, outfit: 'shortSleeve', female: true, build: 0.86, socks: SOCK, bow: NAVY, sailor: true, untucked: true, ...o});

export const MAIN: Record<string, ToonLook> = {
  kru: {skin: '#E2B48C', hair: '#141113', hairStyle: 'bob', top: '#BFD6EA', pants: '#2C3A55', skirt: true, shoes: '#2A2328', outfit: 'blouse', glasses: true, female: true, build: 0.98},
  prae: girl('#EBC3A0', '#151214', {hairStyle: 'bun', build: 0.85}),
  phum: boy('#C98E66', '#141113', {build: 0.93}),
  ton: boy('#B67B55', '#1A1513', {glasses: true, build: 0.82}),
};
/** seat map: 'me' = the viewer (camera), 'ton' = empty seat with his bag; everybody else is an extra */
export const SEATS: Record<string, string> = {};
let n = 0;
COLS.forEach((_, c) => ROWS.forEach((__, r) => {
  const k = `${c}${r}`;
  SEATS[k] = k === '33' ? 'me' : k === '43' ? 'ton' : k === '00' ? 'prae' : k === '23' ? 'phum' : `s${String(++n).padStart(2, '0')}`;
}));
export const EXTRAS = Object.values(SEATS).filter((v) => v.startsWith('s'));
EXTRAS.forEach((id, i) => {
  const h = (k: number) => hash(i * 17.3 + k * 3.1);
  const female = h(1) > 0.48, skin = SKINS[Math.floor(h(2) * SKINS.length)], hair = HAIRC[Math.floor(h(3) * HAIRC.length)];
  TOON[id] = female
    ? girl(skin, hair, {hairStyle: (['long', 'bob', 'bun', 'long'] as const)[Math.floor(h(4) * 4)], glasses: h(5) > 0.8, build: 0.82 + h(6) * 0.1})
    : boy(skin, hair, {glasses: h(5) > 0.78, build: 0.86 + h(6) * 0.14});
});
Object.assign(TOON, MAIN);
export const SPEAKER_ID: Record<string, string> = {KRU_ORN: 'kru', PRAE: 'prae', PHUM: 'phum'};
