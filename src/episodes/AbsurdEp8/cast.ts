import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import '../AbsurdEp1/cast';   // the recurring cast: man, officers, judge, commandos
import '../AbsurdEp4/cast';   // offC
/** EP8: the man; his own shadow (a second instance of the man, every material swapped to flat black in shots.tsx);
 *  six SWAT, three interrogation officers, the judge (gas mask), two people waiting at the bus stop. */
TOON.shade = TOON.nai;
BOX.shade = {...BOX.nai, face: {...BOX.nai.face, stubble: 0}};
TOON.vil1 = {...TOON.nai, build: 0.98};
BOX.vil1 = {face: {skin: '#D9AC84', hair: '#2A2220', hairStyle: 'short', stubble: 0.2, brows: 0.1}, jacket: '#E8B04A', shirt: '#E8B04A', pants: '#4A5466', shoes: '#2A2A2E', sleeves: 'short', pocket: false};
TOON.vil2 = {...TOON.offB, build: 1.06};
BOX.vil2 = {face: {skin: '#C48F64', hair: '#9A9894', hairStyle: 'slick', stubble: 0.5, glasses: true, brows: -0.2}, jacket: '#7FA36E', shirt: '#7FA36E', pants: '#3A3A40', shoes: '#1A1A1C', sleeves: 'short', pocket: true};
export const SWAT8 = ['cmd1', 'cmd2', 'cmd3', 'cmd4', 'cmd5', 'cmd6'];
export const IDS = ['nai', 'shade', ...SWAT8, 'offA', 'offB', 'offC', 'judge', 'vil1', 'vil2'];
