import {TOON} from '../../pov/cast/Toon';

/** absurd-cases cast. Original looks; the man ("ชายคนนี้") is the recurring lead of the series. */
TOON.nai = {skin: '#D8A27C', hair: '#1A1513', hairStyle: 'sidePart', top: '#9DBAD9', pants: '#6F86AE', shoes: '#C9CED6', outfit: 'shortSleeve', pocket: true, female: false, build: 1.04};
// commandos: dark fatigues, cap-helmet, goggles
const cmd = (skin: string, build: number) => ({skin, hair: '#141210', hairStyle: 'cap' as const, cap: '#1B2027', top: '#252C35', under: '#39424E', pants: '#20262E', shoes: '#111214', outfit: 'vest' as const, glasses: true, female: false, build});
const SKINS = ['#C99069', '#B97E58', '#D3A27C', '#A8734F', '#CF9A74', '#BC8760'];
export const COMMANDOS = Array.from({length: 12}, (_, i) => `cmd${i + 1}`);
COMMANDOS.forEach((id, i) => { TOON[id] = cmd(SKINS[i % SKINS.length], 1.0 + ((i * 37) % 9) / 100); });
// interrogation officers (khaki shirt, dark trousers; no real insignia)
TOON.offA = {skin: '#BC8760', hair: '#141210', hairStyle: 'crew', top: '#8A7350', pants: '#262A30', shoes: '#141416', outfit: 'shirt', pocket: true, belt: '#1A1A1C', buckle: true, female: false, build: 1.12};
TOON.offB = {skin: '#D3A27C', hair: '#1B1715', hairStyle: 'buzz', top: '#8A7350', pants: '#262A30', shoes: '#141416', outfit: 'shirt', pocket: true, belt: '#1A1A1C', buckle: true, glasses: true, female: false, build: 1.0};
// the judge: black robe over a white shirt
TOON.judge = {skin: '#C58E67', hair: '#8E8E92', hairStyle: 'slick', top: '#141418', under: '#F2F0EA', tie: '#141418', pants: '#141418', shoes: '#0E0E10', outfit: 'suit', glasses: true, female: false, build: 1.1};
// the last shot uses its own instance of the man: re-using `nai` after the raid shots lost him on the render path (open bug)
TOON.naiEnd = TOON.nai;
export const IDS = ['nai', 'naiEnd', ...COMMANDOS, 'offA', 'offB', 'judge'];

// ---- box-people looks (reference style): see boxcast.ts
import {BOX} from './boxcast';
BOX.nai = {face: {skin: '#D9A879', hair: '#1A1513', hairStyle: 'messy', stubble: 0.9, brows: 0.2}, jacket: '#8FB0D2', shirt: '#8FB0D2', pants: '#2F3F5E', shoes: '#1C1C20', sleeves: 'short', pocket: true};
COMMANDOS.forEach((id, i) => { BOX[id] = {face: {skin: ['#C99A6E', '#B98559', '#D6A87C'][i % 3], hair: '#141210', hairStyle: 'none', stubble: 0, mask: '#2E343D'}, jacket: '#3A4452', shirt: '#3A4452', pants: '#333B46', shoes: '#16181B', helmet: '#2B323B', vest: '#4A5563', belt: '#16181C', build: 1.0 + (i % 3) * 0.04}; });
BOX.offA = {face: {skin: '#C8935F', hair: '#141210', hairStyle: 'short', stubble: 0.7, mustache: true, brows: -0.5}, jacket: '#8DB4CF', shirt: '#8DB4CF', pants: '#26324A', shoes: '#141416', sleeves: 'short', cap: '#22314C', badge: true, belt: '#1A1A1C', pocket: true, build: 1.12};
BOX.offB = {face: {skin: '#DDB088', hair: '#1B1715', hairStyle: 'slick', stubble: 0.5, glasses: true}, jacket: '#8DB4CF', shirt: '#8DB4CF', pants: '#26324A', shoes: '#141416', sleeves: 'short', cap: '#22314C', badge: true, belt: '#1A1A1C', pocket: true};
BOX.judge = {face: {skin: '#C99A6E', hair: '#B9B6B0', hairStyle: 'slick', stubble: 0.3, glasses: true, brows: -0.3}, jacket: '#17171B', lapel: '#26262C', shirt: '#F1EEE6', pants: '#17171B', shoes: '#0E0E10', robe: true};
BOX.naiEnd = BOX.nai;
