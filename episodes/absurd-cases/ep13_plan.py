#!/usr/bin/env python3
"""absurd-cases EP13 timing plan (คดีเสียงสะท้อน): the one source of timing -> public/absurd-cases/ep13/ep13_timeline.json
Line timing from ep13_line_timing.json (provisional until the Fenrir take is cut with tools/tighten_take.py; visual beats live in ep13_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.5                     # closer: the left slipper alone on the step; frame holds, then the clip ends
script = json.load(open(HERE / 'ep13_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep13_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep13-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep13-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l013')
ev.update(shout=P('l001', 1) + 0.05, plate1=P('l003', 1), phoneUp=P('l004') - 0.05, press=P('l004') + 0.3, siren=P('l005') - 0.1,
          talk=P('l005', 1) + 0.05, mock=P('l006', 1) + 0.05,
          hit1=P('l007') + 0.45, hit2=P('l007') + 0.85, hit3=P('l007') + 1.25, hit4=P('l007') + 1.6,
          jarIn=P('l008') + 0.35, lid=P('l008') + 0.85, gavel=P('l009') + 0.3, cellShut=P('l009', 1) + 0.25, cut=P('l010') + 0.3, sing=P('l010', 1) + 0.1,
          gate=P('l011') + 0.1, boo=P('l012', 1) + 0.3, end=E('l013'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('man', 0.0), ('shout', P('l001', 1) - .05), ('bounce', P('l002') - .05), ('mimic', P('l002', 1) - .05), ('glare', P('l003') - .05), ('charge', P('l003', 1) - .05),
         ('phone', P('l004') - .05), ('callUI', P('l004', 1) + .1), ('cops', P('l005') - .05), ('mediate', P('l005', 1) - .05),
         ('wallBack', P('l006') - .05), ('mocked', P('l006', 1) - .05), ('smash', P('l007') - .05), ('rubble', P('l007', 1) - .05),
         ('jar', P('l008') - .05), ('courtJar', P('l008', 1) - .05), ('gavel', P('l009') - .05), ('foam', P('l009', 1) - .05),
         ('reduced', P('l010') - .05), ('sing', P('l010', 1) - .05), ('release', P('l011') - .05), ('hoarse', P('l011', 1) - .05),
         ('haunted', P('l012') - .05), ('boo', P('l012', 1) - .05), ('retire', P('l013') - .05), ('final', P('l013', 1) - .05)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep13/ep13_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
