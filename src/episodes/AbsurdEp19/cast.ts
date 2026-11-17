import '../AbsurdEp1/cast';   // the recurring cast: man, officers (offA/offB), judge
import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import {TOWN} from '../lifekit/people';
/** EP19: the man, three officers, the judge, townsfolk for the court gallery — and the déjà-vu doubles: two copies of the man and one of the
 *  judge, built like them and turned into violet see-through silhouettes in Episode.tsx (GHOSTS). A double repeats what its owner does. */
const MORE = [['pol3', '#B98559', 1.06, 'messy']] as const;
MORE.forEach(([id, skin, build, hairStyle]) => { TOON[id] = {...TOON.offA, skin, build} as any; BOX[id] = {...BOX.offA, face: {skin, hair: '#141210', hairStyle, stubble: 0.4, brows: -0.3}, build}; });
export const GHOSTS = ['gnai', 'gnai2', 'gjudge'];
(['gnai', 'gnai2'] as const).forEach((id) => { TOON[id] = {...TOON.nai} as any; BOX[id] = {...BOX.nai}; });
TOON.gjudge = {...TOON.judge} as any; BOX.gjudge = {...BOX.judge};
export const POLICE = ['offA', 'offB', 'pol3'];
export const IDS = ['nai', ...GHOSTS, ...POLICE, 'judge', ...TOWN];
