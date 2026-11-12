#!/usr/bin/env python3
"""absurd-cases EP12 timing plan (คดีรองเท้าแตะสลับข้าง): the one source of timing -> public/absurd-cases/ep12/ep12_timeline.json
Line timing from ep12_line_timing.json (provisional until the Fenrir take is cut with tools/tighten_take.py; visual beats live in ep12_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.5                     # closer: the left slipper alone on the step; frame holds, then the clip ends
script = json.load(open(HERE / 'ep12_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep12_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep12-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep12-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l013')
ev.update(step=P('l002') + 0.25, tangle=P('l003') + 0.1, fall=P('l003', 1) + 0.2, plate1=P('l004', 1),
          phoneUp=P('l005') - 0.05, press=P('l005') + 0.35, siren=P('l006') - 0.1, cop=P('l006') + 0.1, clamp=P('l006', 1) + 0.7,
          tow=P('l007') + 0.1, hook=P('l007', 1) + 0.15, lift=P('l007', 1) + 0.45, gavel=P('l009') + 0.5, cellShut=P('l009', 1) + 0.4,
          gate=P('l011') + 0.15, vanGo=P('l012', 1) + 0.2, door=E('l013') + 0.35, end=E('l013'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('exit', 0.0), ('gate', P('l001', 1) - .05), ('slip', P('l002') - .05), ('swapped', P('l002', 1) - .05), ('tangle', P('l003') - .05), ('fall', P('l003', 1) - .05),
         ('glare', P('l004') - .05), ('charge', P('l004', 1) - .05), ('phone', P('l005') - .05), ('callUI', P('l005', 1) + .1),
         ('cop', P('l006') - .05), ('clamp', P('l006', 1) - .05), ('towCall', P('l007') - .05), ('towed', P('l007', 1) - .05),
         ('court', P('l008') - .05), ('crossed', P('l008', 1) - .05), ('gavel', P('l009') - .05), ('split', P('l009', 1) - .05),
         ('apart', P('l010') - .05), ('years', P('l010', 1) - .05), ('leftOut', P('l011') - .05), ('early', P('l011', 1) - .05),
         ('rightIn', P('l012') - .05), ('van', P('l012', 1) - .05), ('alone', P('l013') - .05), ('final', P('l013', 1) - .05)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep12/ep12_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
