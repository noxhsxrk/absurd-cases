import '../AbsurdEp1/cast';   // the recurring cast: man, officers (offA/offB), judge
import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import {TOWN} from '../lifekit/people';
/** EP13: four patrol officers (offA, offB + two more in the same uniform), the judge, the guard (offB in the cells), townsfolk as haunted-house visitors. */
const MORE = [['pol3', '#B98559', 1.06, 'messy'], ['pol4', '#D6A87C', 0.98, 'short']] as const;
MORE.forEach(([id, skin, build, hairStyle]) => { TOON[id] = {...TOON.offA, skin, build} as any; BOX[id] = {...BOX.offA, face: {skin, hair: '#141210', hairStyle, stubble: 0.4, brows: -0.3}, build}; });
export const POLICE = ['offA', 'offB', 'pol3', 'pol4'];
export const IDS = ['nai', ...POLICE, 'judge', ...TOWN];
