import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import '../AbsurdEp1/cast';   // the recurring cast: man, officers, judge, commandos
import '../AbsurdEp4/cast';   // offC
import '../AbsurdEp5/cast';   // guard
/** EP7: the man at his computer, the officer in the yellow rubber suit who jumps, three interrogation officers, the judge, the guard. */
TOON.rubber = {...TOON.cmd1, build: 1.08};
BOX.rubber = {face: {skin: '#C99A6E', hair: '#141210', hairStyle: 'short', stubble: 0.4, brows: -0.4}, jacket: '#F2C230', shirt: '#F2C230', pants: '#E2B226', shoes: '#1A1A1C', belt: '#1A1A1C', build: 1.08};
export const IDS = ['nai', 'rubber', 'offA', 'offB', 'offC', 'judge', 'guard'];
