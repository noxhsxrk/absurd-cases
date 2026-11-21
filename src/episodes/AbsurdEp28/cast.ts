import '../AbsurdEp1/cast';   // the recurring cast: man, officers (offA/offB), judge
import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import {TOWN} from '../lifekit/people';
/** EP28: the man, three police frogmen (black wetsuits, no caps; masks, tanks and fins are added in shots.tsx), the officer with the giant cuffs,
 *  the judge, the cell-block guard, five inmates in prison brown with bare feet (one white sock each is added in shots.tsx), townsfolk for the court. */
export const FROGS = ['frog1', 'frog2', 'frog3'];
const FSKIN = ['#B98559', '#C99069', '#A8734F'];
FROGS.forEach((id, i) => { TOON[id] = {...TOON.offA, skin: FSKIN[i], top: '#1D2126', pants: '#1D2126', shoes: '#1D2126', build: 1.02 + i * 0.04} as any;
  BOX[id] = {face: {skin: FSKIN[i], hair: '#141210', hairStyle: 'short', stubble: 0.5, brows: -0.4}, jacket: '#1F2329', shirt: '#1F2329', pants: '#1F2329', shoes: '#1F2329', sleeves: 'jacket', build: 1.02 + i * 0.04}; });
export const INMATES = ['pr1', 'pr2', 'pr3', 'pr4', 'pr5'];
const PSKIN = ['#C99069', '#B97E58', '#D3A27C', '#A8734F', '#CF9A74'], HAIR = ['none', 'short', 'messy', 'none', 'short'] as const;
INMATES.forEach((id, i) => { TOON[id] = {...TOON.offA, skin: PSKIN[i], top: '#6B4226', pants: '#6B4226', shoes: PSKIN[i], build: 0.98 + (i % 3) * 0.05} as any;
  BOX[id] = {face: {skin: PSKIN[i], hair: '#141210', hairStyle: HAIR[i], stubble: 0.3 + (i % 3) * 0.3, brows: -0.2}, jacket: '#6B4226', shirt: '#6B4226', pants: '#6B4226', shoes: PSKIN[i], sleeves: 'short', build: 0.98 + (i % 3) * 0.05} as any; });
export const IDS = ['nai', ...FROGS, 'offA', 'offB', 'judge', ...INMATES, ...TOWN];
