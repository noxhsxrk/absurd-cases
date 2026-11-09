#!/usr/bin/env python3
"""absurd-cases EP8 timing plan (คดีสะกดรอยตาม · เงาของตัวเอง): the one source of timing -> public/absurd-cases/ep8/ep8_timeline.json
Line timing from ep8_line_timing.json: provisional (ep8_provisional_timing.py) until the Fenrir take is cut with tools/tighten_take.py."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
TAIL, HOLD = 0.25, 2.1         # after "หดหนีงาน": the vest settles, then the work report is held (pause-bait) and stamped
script = json.load(open(HERE / 'ep8_script.json')); rows = json.load(open(HERE / 'ep8_line_timing.json'))
timing = {r['id']: r for r in rows}; provisional = any(r.get('provisional') for r in rows)
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep8-{k}']['parts'][i][0]
E = lambda k: timing[f'ep8-{k}']['end']
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
# the accused's answer: a rubber sheet shrinking (echo card)
ans = E('l009') + 0.08
cards.insert(next(i for i, c in enumerate(cards) if c['line'] == 'l010'), {'id': 'l009c9', 'line': 'l009', 'text': 'ฟึ่บ!', 'hl': 'ฟึ่บ', 't0': round(ans, 3), 't1': round(P('l010') - 0.02, 3), 'echo': True})
speech = E('l013'); rep0 = speech + TAIL
ev.update(stop=1.0, lag=P('l002', 1) + 0.15, step2=P('l002', 1) + 0.75, plate=P('l003', 1), phoneUp=P('l004') - 0.05, press=P('l004') + 0.4,
          siren=P('l005') - 0.05, lights=P('l005', 1) - 0.1, scrape=P('l006') + 0.25, peel=P('l006', 1) + 0.1, fold=P('l007') + 0.1, cuff=P('l007', 1) + 0.25,
          lamp=P('l008', 1) + 0.25, shrink=P('l009') + 0.3, answer=ans, cough=P('l010') + 0.25, gavel=P('l010', 1) + 0.55, vest=P('l011') + 0.05, em=P('l011', 1) + 0.15,
          sunStart=P('l013') - 0.05, bell=P('l013') + 0.65, squash=P('l013', 1) + 0.05, burn=P('l013', 1) + 0.55, report=rep0, stamp=rep0 + 0.85)
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('walk', 0.0), ('look', 1.0), ('shadowStep', P('l002') - .05), ('charge', P('l003') - .05), ('phone', P('l004') - .05), ('callUI', P('l004', 1) - .05),
         ('swat', P('l005') - .05), ('lights', P('l005', 1) - .05), ('scrape', P('l006') - .05), ('peel', P('l006', 1) - .05), ('fold', P('l007') - .05), ('cuffs', P('l007', 1) - .05),
         ('interro', P('l008') - .05), ('lamp', P('l008', 1) - .05), ('shrink', P('l009') - .05), ('answerCU', ans - .05), ('court', P('l010') - .05), ('gavel', P('l010', 1) - .05), ('vest', P('l011') - .05), ('anklet', P('l011', 1) - .05),
         ('busStop', P('l012') - .05), ('busWide', P('l012', 1) - .05), ('sun', P('l013') - .05), ('squash', P('l013', 1) - .05), ('report', rep0)]
TOTAL = round((rep0 + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 90 for s in shots[1:-1]), [s for s in shots[1:] if s['dur'] > 90]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if provisional else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep8/ep8_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
