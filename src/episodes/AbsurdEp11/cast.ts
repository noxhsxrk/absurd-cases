import {BOMBS, applyBombSuit} from '../AbsurdEp2/cast';   // the recurring cast + EP2's bomb-disposal officers
import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
/** EP11 adds the disciples of the meditation centre: plain white, barefoot. */
const DS = [['dis1', '#C99A6E', 1.0, 'short'], ['dis2', '#B98559', 1.08, 'slick'], ['dis3', '#D6A87C', 0.96, 'messy'], ['dis4', '#C8935F', 1.04, 'short'], ['dis5', '#DDB088', 1.0, 'slick']] as const;
DS.forEach(([id, skin, build, hairStyle]) => {
  TOON[id] = {skin, hair: '#141210', hairStyle: 'crew', top: '#F2F0E8', pants: '#F2F0E8', shoes: skin, outfit: 'shirt', female: false, build} as any;
  BOX[id] = {face: {skin, hair: '#141210', hairStyle, stubble: 0.3}, jacket: '#F2F0E8', shirt: '#F2F0E8', pants: '#E9E6DC', shoes: skin, sleeves: 'short', build};
});
export const DISCIPLES = DS.map((d) => d[0]);
export const SQUAD = BOMBS.slice(0, 6);
export {applyBombSuit};
export const IDS = ['nai', ...SQUAD, 'offA', 'offB', 'judge', ...DISCIPLES];
