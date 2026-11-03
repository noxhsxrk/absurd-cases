// Pure helpers. Everything in this project is a pure function of time (seconds) — no Math.random, no Date.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (k: number) => { const c = clamp(k); return c * c * (3 - 2 * c); };
export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const hashStr = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 100000; };
export const angDiff = (a: number, b: number) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
export const lerpAng = (a: number, b: number, k: number) => a + angDiff(a, b) * k;
export type V2 = [number, number];
export const dist = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** yaw so that a character (facing +z at yaw 0) looks from a toward b */
export const yawTo = (a: V2, b: V2) => Math.atan2(b[0] - a[0], b[1] - a[1]);
