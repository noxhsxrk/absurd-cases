import {WORLD} from '../src/pov/life/plans';
import {stateAt} from '../src/pov/life/world';
import {FURN} from '../src/pov/sets/layout';
let minD = 9, at = '', inside = 0, ex = '';
for (let t = 0; t <= 24; t += 0.1) {
  const s = stateAt(WORLD, t).filter((x) => x.visible);
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j < s.length; j++) { const d = Math.hypot(s[i].x - s[j].x, s[i].z - s[j].z); if (d < minD) { minD = d; at = `${s[i].id}/${s[j].id}@${t.toFixed(1)}s`; } }
    for (const f of FURN) if (f.solid && f.kind !== 'wall' && Math.abs(s[i].x - f.x) < f.w / 2 - 0.02 && Math.abs(s[i].z - f.z) < f.d / 2 - 0.02) { inside++; if (inside < 6) ex += ` ${s[i].id}∈${f.id}@${t.toFixed(1)}`; }
  }
}
console.log('min distance between two people', minD.toFixed(2), 'm', at); console.log('samples inside furniture:', inside, ex);
// who is doing something different at each second (liveness): count of distinct activity labels changing per 4 s window
const labels = (t: number) => stateAt(WORLD, t).filter((x) => x.visible).map((x) => x.id + ':' + x.label);
for (let w = 0; w < 24; w += 4) { const a = new Set(labels(w)), b = new Set(labels(w + 4)); let ch = 0; b.forEach((x) => !a.has(x) && ch++); console.log(`${w}-${w + 4}s  visible ${a.size}  activity changes ${ch}`); }
const moving = (t: number) => stateAt(WORLD, t).filter((x) => x.visible && x.moving).length;
console.log('people moving at t=0,6,12,18:', [0, 6, 12, 18].map(moving).join(', '));
