#!/usr/bin/env python3
"""absurd-cases EP6 timing plan (คดีบังคับใช้แรงงาน · สะพานลอย): the one source of timing -> public/absurd-cases/ep6/ep6_timeline.json
Line timing from ep6_line_timing.json: provisional (ep6_provisional_timing.py) until the Fenrir take is cut with tools/tighten_take.py."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
TAIL, HOLD = 0.75, 2.0         # after "บินข้าม": the swarm finishes crossing, then the visiting-rules notice is held (pause-bait)
script = json.load(open(HERE / 'ep6_script.json')); rows = json.load(open(HERE / 'ep6_line_timing.json'))
timing = {r['id']: r for r in rows}; provisional = any(r.get('provisional') for r in rows)
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    spans = [[parts[0][0], parts[-1][1]]] if len(l['cards']) == 1 else parts
    assert len(spans) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], spans)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep6-{k}']['parts'][i][0]
E = lambda k: timing[f'ep6-{k}']['end']
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
# the accused's answer: wind whistling through the concrete (echo card)
ans = E('l010') + 0.1
cards.insert(next(i for i, c in enumerate(cards) if c['line'] == 'l011'), {'id': 'l010c9', 'line': 'l010', 'text': 'หวิววว…', 'hl': 'หวิววว', 't0': round(ans, 3), 't1': round(P('l011') - 0.02, 3), 'echo': True})
speech = E('l013'); notice0 = speech + TAIL
gavel0 = P('l011') - 0.05
ev.update(cars=0.15, knee=P('l002', 1) + 0.25, plate=P('l003', 1), phoneUp=P('l004') - 0.05, press=P('l004') + 0.4,
          siren=P('l005') + 0.05, cranes=P('l005') + 0.1, cones=P('l006') + 0.1, saw=P('l007') + 0.1, sawCut=P('l007', 1) - 0.25,
          lift=P('l007', 1) - 0.05, cuff=P('l007', 1) + 0.45, rubble=P('l008') + 0.2, ahem=P('l009') + 0.05, answer=ans,
          gavel=gavel0 + 0.45, thump=gavel0 + 1.05, chain=P('l012') + 0.35, swarm=P('l013') - 0.6, notice=notice0, stamp=notice0 + 0.45)
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('foot', 0.0), ('stairsUp', P('l002') - .05), ('knee', P('l002', 1) - .05), ('charge', P('l003') - .05),
         ('phone', P('l004') - .05), ('callUI', P('l004', 1) - .05), ('cranes', P('l005') - .05), ('heli', P('l005', 1) - .05), ('lanes', P('l006') - .05),
         ('saw', P('l007') - .05), ('cuffs', P('l007', 1) - .05), ('courtExt', P('l008') - .05), ('hole', P('l008', 1) - .05), ('courtIn', P('l009') - .05), ('judgeCU', P('l009', 1) - .05),
         ('girder', P('l010') - .05), ('wind', P('l010', 1) - .05), ('gavel', gavel0), ('cellPush', gavel0 + 0.9), ('prisonFront', P('l012') - .05), ('chains', P('l012', 1) - .05), ('swarm', P('l013') - .05), ('swarmUp', P('l013', 1) - .05), ('notice', notice0)]
TOTAL = round((notice0 + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 90 for s in shots[1:-1]), [s for s in shots[1:] if s['dur'] > 90]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if provisional else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep6/ep6_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
