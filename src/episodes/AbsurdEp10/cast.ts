import '../AbsurdEp1/cast';   // the recurring cast: man, officers, judge, commandos
import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
/** EP10 adds the Cyber Police: dark polo, teal tactical vest, navy cap (three of them). */
const CY = [['cyb1', '#C99A6E', 1.06], ['cyb2', '#B98559', 1.0], ['cyb3', '#D6A87C', 1.1]] as const;
CY.forEach(([id, skin, build]) => {
  TOON[id] = {skin, hair: '#141210', hairStyle: 'crew', top: '#1E2533', pants: '#1E2533', shoes: '#111214', outfit: 'shirt', female: false, build} as any;
  BOX[id] = {face: {skin, hair: '#141210', hairStyle: 'short', stubble: 0.6, brows: -0.3}, jacket: '#1E2533', shirt: '#1E2533', pants: '#262E3E', shoes: '#111214', sleeves: 'short', cap: '#121826', vest: '#1C9AAA', belt: '#16181C', badge: true, build};
});
export const CYBER = CY.map((c) => c[0]);
export const IDS = ['nai', ...CYBER, 'offA', 'offB', 'judge'];
