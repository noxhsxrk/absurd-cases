import '../AbsurdEp1/cast';   // the recurring cast: man, officers, judge
import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import {TOWN} from '../lifekit/people';
/** EP12: the man barefoot (he goes out in flip-flops), and the traffic police — light-blue shirt, lime reflective vest, white cap. */
TOON.naiB = TOON.nai;
BOX.naiB = {...BOX.nai, shoes: BOX.nai.face.skin};
const TR = [['trf1', '#C99A6E', 1.08], ['trf2', '#D6A87C', 1.0]] as const;
TR.forEach(([id, skin, build]) => {
  TOON[id] = {skin, hair: '#141210', hairStyle: 'crew', top: '#8DB4CF', pants: '#26324A', shoes: '#141416', outfit: 'shirt', female: false, build} as any;
  BOX[id] = {face: {skin, hair: '#141210', hairStyle: 'short', stubble: 0.6, brows: -0.2}, jacket: '#8DB4CF', shirt: '#8DB4CF', pants: '#26324A', shoes: '#141416', sleeves: 'short', cap: '#EDEBE4', vest: '#B8D83A', belt: '#16181C', badge: true, build};
});
export const TRAFFIC = TR.map((c) => c[0]);
export const IDS = ['naiB', 'nai', ...TRAFFIC, 'offA', 'offB', 'judge', ...TOWN];
