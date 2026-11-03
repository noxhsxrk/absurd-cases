import {TOON} from '../Toon';

/**
 * MRT เที่ยวสุดท้าย — ขบวนที่ 0 · cast (looks from episodes/mrt-train-zero/series_bible.md).
 * Main: may, win, winx (the replaced Win / the double behind the glass), aunt, boy, stranger (the POV's true face, EP3 end only).
 * Extras: people on the two skipped platforms, the far figure in car 4, the passenger of the opposite train, the night street.
 */
TOON.may = {skin: '#EFC8A6', hair: '#17120F', hairStyle: 'long', top: '#6F8199', under: '#F4F2EC', pants: '#4F5A3E', skirt: true, shoes: '#ECECE8', outfit: 'suit', glasses: true, female: true, build: 0.92, noButton: true};   // the single suit button read as a navel on her
TOON.win = {skin: '#C98F66', hair: '#141210', hairStyle: 'undercut', top: '#8B9097', pants: '#33353B', shoes: '#18191C', outfit: 'shirt', untucked: true, female: false, build: 1.07};
TOON.winx = {...TOON.win, hair: '#0B0B0C', hairStyle: 'slick', top: '#737880'};
TOON.aunt = {skin: '#B57E5A', hair: '#9C9893', hairStyle: 'bun', top: '#7A2E3A', pants: '#2F2B33', shoes: '#6B5B4E', outfit: 'blouse', female: true, build: 1.04};
TOON.boy = {skin: '#E0B08A', hair: '#1A1411', hairStyle: 'curtain', top: '#D9C46A', pants: '#28304A', shorts: true, shoes: '#6A4A33', outfit: 'shortSleeve', untucked: true, female: false, build: 0.9};
TOON.stranger = {skin: '#E6C3A5', hair: '#121012', hairStyle: 'sidePart', top: '#F3F2EE', pants: '#2B2D33', shoes: '#141416', outfit: 'shirt', female: false, build: 1.0};
// skipped platforms (EP1): late passengers, a guard, a cleaner
TOON.sp1 = {skin: '#D3A27C', hair: '#1D1A1F', hairStyle: 'quiff', top: '#3E5A7A', pants: '#2B2E3B', shoes: '#1F1F24', outfit: 'shirt', female: false, build: 1.0};
TOON.sp2 = {skin: '#E2B08A', hair: '#2A211E', hairStyle: 'bob', top: '#C76A6A', pants: '#2F3342', shoes: '#2A2A2E', outfit: 'blouse', female: true, build: 0.94};
TOON.sp3 = {skin: '#BC8760', hair: '#191517', hairStyle: 'cap', cap: '#1E2A3A', top: '#E3C25A', pants: '#2F3342', shoes: '#22252C', outfit: 'shortSleeve', headphones: true, female: false, build: 0.97};
TOON.guard = {skin: '#A8734F', hair: '#16120F', hairStyle: 'cap', cap: '#2C3A52', top: '#2C3A52', under: '#9FB0C4', pants: '#23293A', shoes: '#141418', outfit: 'shirt', female: false, build: 1.08};
TOON.clean = {skin: '#C28B65', hair: '#2C1D19', hairStyle: 'bun', top: '#5C8F8A', pants: '#2F3E44', shoes: '#2A2A2E', outfit: 'shortSleeve', female: true, build: 1.0};
TOON.far = {skin: '#8E7766', hair: '#0D0D0E', hairStyle: 'buzz', top: '#3A3D44', pants: '#24262B', shoes: '#111', outfit: 'shirt', female: false, build: 1.02};
TOON.opp = {skin: '#D9B49A', hair: '#101012', hairStyle: 'long', top: '#4A4F5C', pants: '#22252C', shoes: '#141418', outfit: 'suit', female: true, build: 0.93};
// the night street (EP3 close)
TOON.rider1 = {skin: '#B97E58', hair: '#16120F', hairStyle: 'cap', cap: '#D97A2B', top: '#D97A2B', under: '#2B2E36', pants: '#2A2D38', shoes: '#22252C', outfit: 'vest', female: false, build: 1.04};
TOON.rider2 = {skin: '#A8734F', hair: '#16120F', hairStyle: 'buzz', top: '#D97A2B', under: '#3A3C46', pants: '#2A2D38', shoes: '#22252C', outfit: 'vest', female: false, build: 1.0};
TOON.vendor = {skin: '#C99069', hair: '#2A211E', hairStyle: 'bun', top: '#E9E2D2', pants: '#3D2F45', shoes: '#4A4038', outfit: 'blouse', female: true, build: 1.06};
TOON.walk1 = {skin: '#D9A67F', hair: '#1A1513', hairStyle: 'long', top: '#6FA982', pants: '#30354A', shoes: '#2A2A2E', outfit: 'blouse', female: true, build: 0.92};
TOON.walk2 = {skin: '#CF9A74', hair: '#1F1D24', hairStyle: 'messy', top: '#7E68A8', pants: '#2B2E3B', shoes: '#1F1F24', outfit: 'shirt', glasses: true, female: false, build: 1.0};

export const MAIN = ['may', 'win', 'winx', 'aunt', 'boy', 'stranger'];
export const PLATFORM = ['sp1', 'sp2', 'sp3', 'guard', 'clean'];
export const STREET = ['rider1', 'rider2', 'vendor', 'walk1', 'walk2'];
export const IDS = [...MAIN, ...PLATFORM, 'far', 'opp', ...STREET];
/** body scale on top of the instance scale (the boy is 8) */
export const SCALE: Record<string, number> = {boy: 0.66, aunt: 0.95, may: 0.97};
/** the viewer: hands before and after the transfer (EP3 l033) */
export const VIEWER = {skin: '#E3B48C', sleeve: '#BFD3E6', cuff: '#B3C8DD'};
export const VIEWER_MAY = {skin: '#EFC8A6', sleeve: '#6F8199', cuff: '#64758C', bracelet: '#B8262E'};
export const SPEAKER: Record<string, string> = {MAY: 'may', WIN: 'win', WIN_DOUBLE: 'winx', AUNT: 'aunt', BOY: 'boy', VIEWER_MAY: 'may'};
