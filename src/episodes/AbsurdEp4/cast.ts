import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import {COMMANDOS} from '../AbsurdEp1/cast';   // the recurring cast: man, officers, judge, 12 masked commandos (here: the SWAT team)
/** EP4 adds a third interrogation officer (three of them faint). */
TOON.offC = {skin: '#C99069', hair: '#141210', hairStyle: 'crew', top: '#8A7350', pants: '#262A30', shoes: '#141416', outfit: 'shirt', pocket: true, belt: '#1A1A1C', buckle: true, female: false, build: 1.18};
BOX.offC = {face: {skin: '#BE8A5C', hair: '#141210', hairStyle: 'short', stubble: 0.9, brows: 0.3}, jacket: '#8DB4CF', shirt: '#8DB4CF', pants: '#26324A', shoes: '#141416', sleeves: 'short', cap: '#22314C', badge: true, belt: '#1A1A1C', pocket: true, build: 1.18};
export const SWAT = COMMANDOS;
export const IDS = ['nai', ...COMMANDOS, 'offA', 'offB', 'offC', 'judge'];
