import TL from '../../../public/absurd-cases/ep4/ep4_timeline.json';

/** Everything time-based comes from the plan (episodes/absurd-cases/ep4_plan.py) — never hard-code seconds here. */
export type V3 = [number, number, number];
export type Card = {id: string; line: string; text: string; hl: string; t0: number; t1: number; echo?: boolean};
export type Shot = {name: string; from: number; dur: number; t0: number; t1: number};
export const FPS = 30, W = 1080, H = 1920;
/** the channel handle, painted INTO the scene like the reference (jar label, news ticker, case folder) — change to the real one */
export const HANDLE = '@absurd.cases';
export const TOTAL: number = TL.total;
export const SOURCE: string = TL.source;
const EVS = TL.events as Record<string, number>;
export const ev = (k: string) => { const v = EVS[k]; if (v === undefined) throw new Error('no event ' + k); return v; };
export const CARDS = TL.cards as Card[];
export const SHOTS = TL.shots as Shot[];
export const LINES = TL.lines as {id: string; key: string; text: string; t0: number; t1: number; title?: string | null}[];
export const LN = Object.fromEntries(LINES.map((l) => [l.key, l]));
export const shotAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].t0) i++; return SHOTS[i]; };
export const sm = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
export const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
/** ease-out spring 0→1 with a small overshoot (pops, slams) */
export const pop = (x: number) => { if (x <= 0) return 0; if (x >= 1) return 1; return 1 - Math.exp(-6 * x) * Math.cos(9 * x); };
/** seeded camera shake that decays after t0 */
export const shake = (t: number, t0: number, amp: number, decay = 9): V3 => {
  if (t < t0) return [0, 0, 0]; const k = amp * Math.exp(-(t - t0) * decay);
  return [Math.sin(t * 71.3) * k, Math.sin(t * 57.9 + 1.3) * k, Math.sin(t * 63.1 + 2.1) * k * 0.5];
};
