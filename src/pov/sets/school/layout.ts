import type {V2} from '../../lib/math';
/**
 * Classroom ม.5/3 (ห้อง 325). Metres; x → right, z → toward the back, y up. Students face the board (−z).
 * Corridor wall on the left (x = −4.2) with the front door; windows on the right (x = +4.2); board on the front wall (z = −5).
 * Safe corner = back-right, out of the door's sight line.
 */
export const FLOOR = {x0: -4.2, x1: 4.2, z0: -5, z1: 5};
export type Furn = {id: string; kind: 'desk' | 'tdesk' | 'cabinet' | 'wall'; x: number; z: number; w: number; d: number; h: number; c: string; solid: boolean};
export const COLS = [-2.8, -1.4, 0, 1.4, 2.8], ROWS = [-2.6, -1.5, -0.4, 0.7, 1.8, 2.9];
export const DESK = {w: 0.62, d: 0.45, h: 0.72};
export const SEAT = (c: number, r: number): V2 => [COLS[c], ROWS[r] + 0.5];
const F: Furn[] = [];
ROWS.forEach((z, r) => COLS.forEach((x, c) => F.push({id: `desk${c}${r}`, kind: 'desk', x, z, w: DESK.w, d: DESK.d, h: DESK.h, c: '#C9A878', solid: true})));
F.push(
  {id: 'tdesk', kind: 'tdesk', x: 2.6, z: -4.05, w: 1.2, d: 0.6, h: 0.76, c: '#8C6B4B', solid: true},
  {id: 'cab', kind: 'cabinet', x: -3.2, z: 4.72, w: 1.6, d: 0.45, h: 1.1, c: '#9AA3AE', solid: true},
);
// invisible obstacle where the viewer (camera) crouches, so nobody walks through the lens
F.push({id: 'me', kind: 'wall', x: 2.25, z: 4.5, w: 0.42, d: 0.42, h: 0, c: '#000', solid: true});
export const FURN = F;
export const DOOR = {x: -4.2, z: -3.65, w: 0.9, h: 2.1};
export const SWITCH: [number, number, number] = [-4.16, 1.3, -2.0];
export const PA: [number, number, number] = [-2.3, 2.55, -4.92];
/** where the barricade desks end up (moved from their row positions between the scrape events) */
export const BARRICADE: {id: string; to: V2; yaw: number}[] = [
  {id: 'desk00', to: [-3.78, -3.62], yaw: 1.57},
  {id: 'desk01', to: [-3.62, -2.98], yaw: 1.2},
];
export const VIEW_SEAT: V2 = SEAT(3, 3);     // the viewer's desk (camera)
export const TON_SEAT: V2 = SEAT(4, 3);      // Ton's empty seat, right of the viewer (Phum sits on the left)
export const CORNER_ME: V2 = [2.25, 4.5];    // where the viewer crouches in the corner

/** Named places: [x, z, yaw] (yaw 0 faces +z = toward the back of the room). */
export const ST: Record<string, [number, number, number]> = {
  kruBoard: [0.6, -4.25, 0], kruSpeak: [0.9, -3.4, 0], kruDoor: [-3.55, -3.55, -Math.PI / 2], kruWatch: [-3.0, -2.2, -2.4], kruCorner: [2.15, 3.65, 0],
  switch: [-3.72, -2.0, -Math.PI / 2], praeStand: [-2.75, -3.25, 0.35],
  push1: [-3.55, -2.45, Math.PI], push2: [-3.05, -2.62, -2.6], push3: [-3.8, -1.95, Math.PI], lock: [-3.62, -4.05, -Math.PI / 2], kruSide: [-2.95, -4.4, -1.2],
};
COLS.forEach((x, c) => ROWS.forEach((z, r) => { ST[`seat${c}${r}`] = [x, z + 0.5, Math.PI]; }));
/** main cast corner spots (near the viewer) */
export const MAIN_SPOT: Record<string, [number, number, number]> = {prae: [1.35, 4.42, Math.PI * 0.82], phum: [3.58, 4.3, -1.85], kru: [2.8, 3.72, -0.35]};
Object.entries(MAIN_SPOT).forEach(([k, v]) => { ST[`main_${k}`] = v; });
/** crouch spots: two rows along the back wall + a column along the window wall; nothing within 0.45 m of the
 *  viewer or the main cast, and the strip between the viewer and Kru stays clear so close-ups read */
const RESERVED: V2[] = [CORNER_ME, ...Object.values(MAIN_SPOT).map((v) => [v[0], v[1]] as V2)];
const cand: V2[] = [];
for (let i = 0; i < 12; i++) cand.push([-1.95 + i * 0.5, 4.55]);
for (let i = 0; i < 11; i++) cand.push([-1.76 + i * 0.52, 3.98]);
for (let i = 0; i < 13; i++) cand.push([3.82, 3.3 - i * 0.55]);
for (let i = 0; i < 5; i++) cand.push([-1.55 + i * 0.6, 3.42]);   // a third row in front, left of the main cast
export const CROUCH: V2[] = cand.filter(([x, z]) => RESERVED.every(([a, b]) => Math.hypot(x - a, z - b) > 0.45) && !(z < 4.2 && x > 1.3 && x < 3.0) && !(x > 2.6 && x < 3.4));   // keep the line between the viewer and Phum clear
CROUCH.forEach((p, i) => { ST[`cr${i}`] = [p[0], p[1], p[0] > 3.6 ? -Math.PI / 2 : Math.PI]; });
