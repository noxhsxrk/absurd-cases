import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import {COMMANDOS} from '../AbsurdEp1/cast';   // the recurring cast: man, officers, judge, 12 commandos
import '../AbsurdEp4/cast';                    // offC (the third interrogation officer)
/** EP5: fifteen SWAT (three more commandos), the man in a towel for the shower, a bomb-squad officer, a prison guard. */
const extra = ['cmd13', 'cmd14', 'cmd15'];
extra.forEach((id, i) => { TOON[id] = {...TOON[COMMANDOS[i]]}; BOX[id] = {...BOX[COMMANDOS[i + 3]], build: 1.02 + i * 0.03}; });
export const SWAT = [...COMMANDOS, ...extra];
// the man, showering: bare torso (skin-coloured "shirt"), a white towel round the waist
TOON.naiBath = {...TOON.nai};
BOX.naiBath = {...BOX.nai, jacket: '#D9A879', shirt: '#D9A879', pants: '#F4F3EF', shoes: '#D9A879', sleeves: 'short', pocket: false};
// bomb squad: bulky olive suit (the helmet is a prop on the head bone)
TOON.bomb = {...TOON.cmd1, build: 1.3};
BOX.bomb = {face: {skin: '#C99A6E', hair: '#141210', hairStyle: 'none', stubble: 0, mask: '#2E343D'}, jacket: '#56613F', shirt: '#56613F', pants: '#4E5838', shoes: '#16181B', vest: '#4A5436', build: 1.35};
// the prison guard (chase)
TOON.guard = {...TOON.offB};
BOX.guard = {face: {skin: '#D3A27C', hair: '#1B1715', hairStyle: 'short', stubble: 0.6, brows: -0.2}, jacket: '#5E6E5A', shirt: '#5E6E5A', pants: '#2E3530', shoes: '#141416', sleeves: 'short', cap: '#2E3530', badge: true, belt: '#1A1A1C', pocket: true};
export const IDS = ['naiBath', ...SWAT, 'bomb', 'offA', 'offB', 'offC', 'judge', 'guard'];
