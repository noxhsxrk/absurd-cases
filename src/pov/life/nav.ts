import {FURN, FLOOR, ST} from '../sets/layout';
import type {V2} from '../lib/math';
// Grid A* with obstacle inflation + line-of-sight smoothing. Built once at module load; fully deterministic.
const CELL = 0.2, R = 0.25;
const NX = Math.round((FLOOR.x1 - FLOOR.x0) / CELL), NZ = Math.round((FLOOR.z1 - FLOOR.z0) / CELL);
const blocked = new Uint8Array(NX * NZ);
const ci = (x: number) => Math.floor((x - FLOOR.x0) / CELL), cj = (z: number) => Math.floor((z - FLOOR.z0) / CELL);
for (const f of FURN) {
  if (!f.solid || f.kind === 'sofa' && false) continue;
  const x0 = ci(f.x - f.w / 2 - R), x1 = ci(f.x + f.w / 2 + R), z0 = cj(f.z - f.d / 2 - R), z1 = cj(f.z + f.d / 2 + R);
  for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) if (i >= 0 && j >= 0 && i < NX && j < NZ) blocked[j * NX + i] = 1;
}
for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) if (i < 1 || j < 1 || i >= NX - 1 || j >= NZ - 1) blocked[j * NX + i] = 1;
const free = (i: number, j: number) => i >= 0 && j >= 0 && i < NX && j < NZ && !blocked[j * NX + i];
const cx = (i: number) => FLOOR.x0 + (i + 0.5) * CELL, cz = (j: number) => FLOOR.z0 + (j + 0.5) * CELL;
const nearestFree = (i: number, j: number): [number, number] => {
  if (free(i, j)) return [i, j];
  for (let r = 1; r < 30; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) if (Math.max(Math.abs(di), Math.abs(dj)) === r && free(i + di, j + dj)) return [i + di, j + dj];
  return [i, j];
};
const los = (a: V2, b: V2) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CELL * 0.5)); for (let k = 0; k <= n; k++) { const u = k / n; if (!free(ci(a[0] + (b[0] - a[0]) * u), cj(a[1] + (b[1] - a[1]) * u))) return false; } return true; };
const cache = new Map<string, V2[]>();
export const findPath = (from: V2, to: V2): V2[] => {
  const key = `${from.map((v) => v.toFixed(2))}|${to.map((v) => v.toFixed(2))}`;
  const hit = cache.get(key); if (hit) return hit;
  const [si, sj] = nearestFree(ci(from[0]), cj(from[1])), [gi, gj] = nearestFree(ci(to[0]), cj(to[1]));
  const N = NX * NZ, g = new Float32Array(N).fill(1e9), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const open: [number, number][] = []; const s = sj * NX + si, goal = gj * NX + gi;
  g[s] = 0; open.push([0, s]);
  const h = (i: number, j: number) => Math.hypot(i - gi, j - gj);
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
    const [, cur] = open.splice(bi, 1)[0]; if (done[cur]) continue; done[cur] = 1; if (cur === goal) break;
    const i = cur % NX, j = (cur / NX) | 0;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (!free(ni, nj)) continue;
      if (di && dj && (!free(i + di, j) || !free(i, nj))) continue;
      const nn = nj * NX + ni, ng = g[cur] + Math.hypot(di, dj) + (0); if (ng < g[nn]) { g[nn] = ng; prev[nn] = cur; open.push([ng + h(ni, nj), nn]); }
    }
  }
  const cells: V2[] = []; for (let c = goal; c !== -1; c = prev[c]) cells.push([cx(c % NX), cz((c / NX) | 0)]); cells.reverse();
  // exact endpoints, then string-pull
  const pts: V2[] = [from, ...cells.slice(1, -1), to];
  const out: V2[] = [from]; let a = 0;
  while (a < pts.length - 1) { let b = pts.length - 1; while (b > a + 1 && !los(pts[a], pts[b])) b--; out.push(pts[b]); a = b; }
  cache.set(key, out); return out;
};
export const place = (id: string): V2 => { const s = ST[id]; if (!s) throw new Error('unknown station ' + id); return [s[0], s[1]]; };
export const pathLen = (p: V2[]) => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
