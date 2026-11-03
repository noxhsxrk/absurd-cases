import type {V2} from '../lib/math';
// World units: metres. x → right, z → toward the camera, y up. Floor x∈[-5.5,5.5], z∈[-12,4]. Windows on the z=-12 wall.
export const FLOOR = {x0: -5.5, x1: 5.5, z0: -12, z1: 4};
export type Furn = {id: string; kind: 'desk' | 'table' | 'counter' | 'cooler' | 'printer' | 'bin' | 'plant' | 'wall' | 'reception' | 'sofa'; x: number; z: number; w: number; d: number; h: number; c: string; solid: boolean};
export const COLS = [-4.3, -1.1], ROWS = [-2, -5, -8];
export const SEAT = (col: number, row: number): V2 => [COLS[col], ROWS[row] - 0.78];
const F: Furn[] = [];
ROWS.forEach((z, r) => COLS.forEach((x, c) => F.push({id: `desk${c}${r}`, kind: 'desk', x, z, w: 1.5, d: 0.75, h: 0.74, c: '#D8C6A4', solid: true})));
ROWS.forEach((z, r) => F.push({id: `bin${r}`, kind: 'bin', x: -3.4, z: z - 0.55, w: 0.3, d: 0.3, h: 0.4, c: '#5B6A78', solid: true}));
F.push(
  {id: 'reception', kind: 'reception', x: 2.8, z: 0.81, w: 2.0, d: 0.38, h: 1.0, c: '#CFC7B8', solid: true},
  {id: 'mtable', kind: 'table', x: 3.5, z: -9.6, w: 2.0, d: 1.0, h: 0.74, c: '#8C6B4B', solid: true},
  {id: 'counter', kind: 'counter', x: 5.15, z: -4.1, w: 0.7, d: 3.4, h: 0.92, c: '#E8E2D6', solid: true},
  {id: 'cooler', kind: 'cooler', x: 5.05, z: -5.95, w: 0.4, d: 0.4, h: 1.1, c: '#9CC4DD', solid: true},
  {id: 'printer', kind: 'printer', x: -5.15, z: 0.6, w: 0.7, d: 0.8, h: 0.95, c: '#C9CCD2', solid: true},
  // meeting room glass: left wall + front wall with a 1.0 m door gap at x 1.3..2.3
  {id: 'mwallL', kind: 'wall', x: 1.3, z: -9.6, w: 0.1, d: 4.2, h: 2.6, c: '#A9D3E6', solid: true},
  {id: 'mwallF', kind: 'wall', x: 4.0, z: -7.5, w: 2.8, d: 0.1, h: 2.6, c: '#A9D3E6', solid: true},
  {id: 'plant1', kind: 'plant', x: -5.0, z: 3.0, w: 0.5, d: 0.5, h: 1.2, c: '#3E7A4A', solid: true},
  {id: 'plant2', kind: 'plant', x: -0.6, z: -6.6, w: 0.5, d: 0.5, h: 1.3, c: '#3E7A4A', solid: true},
  {id: 'plant3', kind: 'plant', x: 5.0, z: -7.0, w: 0.5, d: 0.5, h: 1.1, c: '#3E7A4A', solid: true},
  {id: 'sofa', kind: 'sofa', x: 4.4, z: 3.4, w: 1.6, d: 0.7, h: 0.8, c: '#5A6E8C', solid: true},
);
export const FURN = F;
export const MEET_DOOR = {x: 1.95, z: -7.5, w: 1.3};
export const ELEV = {x: 5.5, zs: [1.45, 2.55], w: 0.95};
/** Named standing/sitting places: [x, z, yaw] (yaw 0 faces +z toward the camera). */
export const ST: Record<string, [number, number, number]> = {
  seatFon: [...SEAT(0, 0), 0], seatDao: [...SEAT(1, 0), 0], seatGun: [...SEAT(0, 1), 0], seatMook: [...SEAT(1, 1), 0], seatArm: [...SEAT(0, 2), 0], seatOat: [...SEAT(1, 2), 0],
  recSeat: [2.8, -0.3, 0], recStand: [2.8, 0.22, 0], recFront: [2.8, 1.5, Math.PI],
  elevOut: [4.75, 1.45, -Math.PI / 2], elevIn: [5.2, 1.45, Math.PI / 2],
  printer: [-4.45, 0.6, -Math.PI / 2], coffee: [4.2, -3.2, Math.PI / 2], cooler: [4.4, -5.95, Math.PI / 2],
  chatA: [3.7, -4.45, 0], chatB: [3.7, -5.45, 0],
  windowL: [-2.6, -10.9, 0], windowR: [0.2, -10.9, 0],
  meetDoor: [1.95, -6.8, Math.PI], meetIn: [2.0, -8.2, Math.PI],
  seatPim: [3.5, -10.75, 0], seatNok: [2.7, -10.75, 0], seatJay: [4.3, -10.75, 0], seatBeam: [3.5, -8.4, Math.PI],
  janStart: [-2.55, 3.8, 0], binStop0: [-2.55, -2.55, -Math.PI / 2], binStop1: [-2.55, -5.55, -Math.PI / 2], binStop2: [-2.55, -8.55, -Math.PI / 2], janEnd: [-2.55, -10.2, 0],
  lobbyFront: [1.0, 2.8, 0], corridor: [0.8, -1.5, -Math.PI / 2], corridorB: [-0.1, -1.5, Math.PI / 2],
};
