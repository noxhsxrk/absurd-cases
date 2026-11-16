import {TOON} from '../../pov/cast/Toon';
import {BOX} from '../AbsurdEp1/boxcast';
import {TOWN} from '../lifekit/people';
/** ในเมืองนี้ EP1 cast — a new town, nobody from absurd-cases.
 *  dek  = the narrator ("ฉัน"), about twelve: the whole rig is scaled to KID_SCALE in Episode.tsx and the head is drawn bigger.
 *  yai  = his grandmother: grey bun, glasses, plum cardigan.
 *  boss = the town's new head (หัวหน้า): a beige suit and a mustard tie (never the reference channel's navy suit and red tie).
 *  unit1/unit2 = the anti-yawn unit (หน่วยกันหาว): olive uniform, yellow vest, cap.
 *  + the lifekit townsfolk (TOWN) for passers-by, the teacher, the neighbour. */
export const KID_SCALE = 0.72;
TOON.dek = {skin: '#D9A783', hair: '#1A1513', hairStyle: 'crew', top: '#F4F1EA', pants: '#2B3A5A', shoes: '#2A2A2E', outfit: 'shortSleeve', female: false, build: 0.9} as any;
BOX.dek = {face: {skin: '#DDAE84', hair: '#1A1513', hairStyle: 'messy', stubble: 0, brows: 0.1}, jacket: '#F4F1EA', shirt: '#F4F1EA', pants: '#2B3A5A', shoes: '#2A2A2E', sleeves: 'short', pocket: true, build: 0.92, head: 1.24};
TOON.yai = {skin: '#C99A6E', hair: '#C8C4BC', hairStyle: 'long', top: '#7E5A86', pants: '#4A3A44', shoes: '#2A221C', outfit: 'blouse', female: true, build: 0.95} as any;
BOX.yai = {face: {skin: '#C99A6E', hair: '#9C968C', hairStyle: 'slick', stubble: 0, glasses: true, brows: -0.2}, jacket: '#7E5A86', shirt: '#E8DFCF', pants: '#4A3A44', skirt: '#4A3A44', shoes: '#2A221C', sleeves: 'jacket', bun: true, build: 0.95};
TOON.boss = {skin: '#C8935F', hair: '#141210', hairStyle: 'crew', top: '#C9B48E', under: '#F2F0EA', tie: '#D9A93C', pants: '#C9B48E', shoes: '#3A2A1E', outfit: 'suit', female: false, build: 1.14} as any;
BOX.boss = {face: {skin: '#C8935F', hair: '#141210', hairStyle: 'slick', stubble: 0.4, mustache: true, glasses: true, brows: 0.3}, jacket: '#C9B48E', lapel: '#B5A07A', shirt: '#F2F0EA', tie: '#D9A93C', pants: '#B5A07A', shoes: '#3A2A1E', build: 1.14};
const unit = (skin: string, build: number) => ({face: {skin, hair: '#141210', hairStyle: 'short' as const, stubble: 0.5, brows: -0.4}, jacket: '#55704E', shirt: '#55704E', pants: '#3A4A36', shoes: '#16181B', sleeves: 'short' as const, cap: '#3A4A36', vest: '#E8C23A', belt: '#1A1A1C', build});
TOON.unit1 = {...(TOON as any).boss, top: '#55704E', pants: '#3A4A36', outfit: 'shirt', build: 1.08}; BOX.unit1 = unit('#B98559', 1.08);
TOON.unit2 = {...(TOON as any).boss, top: '#55704E', pants: '#3A4A36', outfit: 'shirt', build: 1.0}; BOX.unit2 = unit('#D6A87C', 1.0);
/** the town judge (a plum robe, grey hair, no wig) and grandma thirty years ago (black bun, no glasses, a red blouse) */
TOON.judge = {...(TOON as any).boss, top: '#4A2A3A', pants: '#4A2A3A', outfit: 'suit', build: 1.1}; BOX.judge = {face: {skin: '#C99A6E', hair: '#B9B6B0', hairStyle: 'slick', stubble: 0.3, glasses: true, brows: -0.4}, jacket: '#4A2A3A', lapel: '#5A3A4A', shirt: '#F1EEE6', pants: '#4A2A3A', shoes: '#1A1214', robe: true, build: 1.1};
TOON.yaiY = {...(TOON as any).yai}; BOX.yaiY = {face: {skin: '#D2A47A', hair: '#1A1513', hairStyle: 'slick', stubble: 0, brows: 0.2}, jacket: '#C8503A', shirt: '#F2EEE4', pants: '#3A2A30', skirt: '#3A2A30', shoes: '#2A221C', sleeves: 'short', bun: true, build: 0.92};
export const IDS = ['dek', 'yai', 'yaiY', 'boss', 'judge', 'unit1', 'unit2', ...TOWN];
