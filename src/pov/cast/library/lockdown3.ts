import {TOON} from '../Toon';
import {EXTRAS} from './lockdown2';
import './lockdown2';

/** EP3 cast: EP1/EP2's class, plus Lung (the guard), 4 police, 3 rescue volunteers, parents, other students, a monk, the aunt, and the ม.2 kids. */
const skins = ['#D9A67F', '#C99069', '#E0B08B', '#B97E58', '#CF9A74', '#A8734F', '#DDAA84'];
TOON.lung = {skin: '#A8734F', hair: '#8E8E92', hairStyle: 'cap', cap: '#5E6B3A', top: '#6F7A44', pants: '#3A3A33', shoes: '#26241F', outfit: 'shirt', female: false, build: 1.04};
const police = (skin: string, female: boolean, build: number) => ({skin, hair: '#171210', hairStyle: 'cap' as const, cap: '#2C2A28', top: '#D3E03C', under: '#9A7B52', pants: '#2A2A2E', shoes: '#141416', outfit: 'vest' as const, female, build});
TOON.po1 = police('#D3A27C', true, 0.97); TOON.po2 = police('#B97E58', false, 1.06); TOON.po3 = police('#C99069', false, 1.02); TOON.po4 = police('#A8734F', false, 1.08);
const vol = (skin: string, female: boolean, build: number) => ({skin, hair: '#1A1513', hairStyle: 'cap' as const, cap: '#F2F2EE', top: '#F07A2A', under: '#F2F2EE', pants: '#33363D', shoes: '#2A2A2E', outfit: 'vest' as const, female, build});
TOON.vo1 = vol('#D9A67F', true, 0.95); TOON.vo2 = vol('#B97E58', false, 1.05); TOON.vo3 = vol('#E0B08B', false, 1.0);
TOON.pa1 = {skin: '#CF9A74', hair: '#2A211E', hairStyle: 'bun', top: '#C76A9A', pants: '#33363D', shoes: '#4A4038', outfit: 'blouse', female: true, build: 1.0};
TOON.pa2 = {skin: '#B97E58', hair: '#1A1513', hairStyle: 'bob', top: '#4B7F9E', pants: '#2F3342', shoes: '#2A2A2E', outfit: 'blouse', female: true, build: 1.05};
TOON.pa3 = {skin: '#C28B65', hair: '#1A1614', hairStyle: 'short', top: '#7E8C6A', pants: '#3A3C46', shoes: '#22252C', outfit: 'shirt', female: false, build: 1.08};
TOON.pa4 = {skin: '#D3A27C', hair: '#B9B4AE', hairStyle: 'bun', top: '#E9B7C0', pants: '#33302E', shoes: '#4A4038', outfit: 'blouse', female: true, build: 0.98};
TOON.monk = {skin: '#B98A60', hair: '#B98A60', hairStyle: 'bald', top: '#D9822B', pants: '#D9822B', skirt: true, shoes: '#6B5A4A', outfit: 'blouse', female: false, build: 1.0};
TOON.st1 = {...TOON[EXTRAS[2]], top: '#F1F0F6'}; TOON.st2 = {...TOON[EXTRAS[7]]}; TOON.st3 = {...TOON[EXTRAS[11]]}; TOON.st4 = {...TOON[EXTRAS[15]]};
TOON.vil = {skin: '#C99069', hair: '#111113', hairStyle: 'cap', cap: '#1C1C20', top: '#2B2E36', pants: '#1D1E24', shoes: '#101012', outfit: 'shirt', female: false, build: 1.1};
void skins;

export const KIDS = ['run1', 'run2', 'run3', 'run4', 'run5'];
export const POLICE = ['po1', 'po2', 'po3', 'po4'];
export const VOLS = ['vo1', 'vo2', 'vo3'];
export const PARENTS = ['pa1', 'pa2', 'pa3', 'pa4'];
export const STUDENTS = ['st1', 'st2', 'st3', 'st4'];
export const CLASS3 = ['kru', 'prae', 'phum', 'ton', ...EXTRAS];
export const OTHERS3 = ['vil', 'lung', 'neigh', 'monk', ...KIDS, ...POLICE, ...VOLS, ...PARENTS, ...STUDENTS];
export const IDS3 = [...CLASS3, ...OTHERS3];
export const SCALE3: Record<string, number> = {run1: 0.9, run2: 0.88, run3: 0.91, run4: 0.89, run5: 0.9};
export const SPEAKER3: Record<string, string> = {KRU_ORN: 'kru', PRAE: 'prae', PHUM: 'phum', LUNG: 'lung', POLICE: 'po1'};
export {EXTRAS};
