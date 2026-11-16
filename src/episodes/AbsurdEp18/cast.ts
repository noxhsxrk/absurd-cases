import '../AbsurdEp1/cast';   // the recurring cast: man, officers (offA/offB), judge
import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import {TOWN} from '../lifekit/people';
/** EP18: the man; the sergeant at the date-line checkpoint (dab: khaki marine-police shirt, big moustache, white cap — the one face of the
 *  operation, planted in the passport shot so the love act has someone to be about); three boat officers in the series' blue; the judge;
 *  townsfolk for the court gallery. */
const MORE = [['pol3', '#B98559', 1.06, 'messy'], ['pol4', '#D6A87C', 0.98, 'short']] as const;
MORE.forEach(([id, skin, build, hairStyle]) => { TOON[id] = {...TOON.offA, skin, build} as any; BOX[id] = {...BOX.offA, face: {skin, hair: '#141210', hairStyle, stubble: 0.4, brows: -0.3}, build}; });
TOON.dab = {...TOON.offA, skin: '#A9724C', build: 1.08} as any;
BOX.dab = {...BOX.offA, face: {skin: '#B47B52', hair: '#1A1512', hairStyle: 'short', stubble: 0.3, mustache: true, brows: -0.2}, jacket: '#9C7A4E', shirt: '#9C7A4E', pants: '#3A2E22', cap: '#F2F0EA', build: 1.08};
export const POLICE = ['offA', 'offB', 'pol3'];
export const IDS = ['nai', 'dab', ...POLICE, 'judge', ...TOWN];
