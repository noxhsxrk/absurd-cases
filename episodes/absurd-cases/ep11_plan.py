#!/usr/bin/env python3
"""absurd-cases EP11 timing plan (คดีนาฬิกาปลุก): the one source of timing -> public/absurd-cases/ep11/ep11_timeline.json
Line timing from ep11_line_timing.json (provisional until the Fenrir take is cut with tools/tighten_take.py; visual beats live in ep11_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.9                     # closer: the man bows to the clock he reported; frame holds, then the clip ends
script = json.load(open(HERE / 'ep11_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep11_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep11-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep11-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l013')
ev.update(ring=P('l002') - 0.3, wake=P('l002') + 0.35, compare=P('l002', 1) + 0.1, plate1=P('l003', 1),
          phoneUp=P('l004') - 0.05, press=P('l004') + 0.35, siren=P('l005') - 0.1, door=P('l005') + 0.1, ringed=P('l005', 1) + 0.25,
          grip=P('l006', 1) + 0.45, pull=P('l006', 1) + 0.8, slam=P('l007', 1) + 0.25, rage=P('l008', 1) + 0.35,
          gavel=P('l009') + 0.75, unhand=E('l009', 0) + 0.85, cellShut=P('l009', 1) + 0.3, stamp=P('l010') + 0.3,
          gate=P('l011'), sign=P('l012', 1) + 0.1, bow=E('l013') + 0.45, end=E('l013'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('sleep', 0.0), ('ring', P('l002') - .35), ('early', P('l002', 1) - .05), ('point', P('l003') - .05), ('charge', P('l003', 1) - .05), ('phone', P('l004') - .05), ('callUI', P('l004', 1) + .1),
         ('raid', P('l005') - .05), ('surround', P('l005', 1) - .05), ('pliers', P('l006') - .05), ('battery', P('l006', 1) - .05),
         ('carry', P('l007') - .05), ('interro', P('l007', 1) - .05), ('file', E('l007') + .15), ('tick', P('l008') - .05), ('defy', P('l008', 1) - .05),
         ('court', P('l009') - .05), ('unhand', E('l009', 0) + .15), ('cell', P('l009', 1) - .05), ('parole', P('l010') - .05), ('onTime', P('l010', 1) - .05),
         ('release', P('l011') - .05), ('noHands', P('l011', 1) - .05), ('ordain', P('l012') - .05), ('school', P('l012', 1) - .05),
         ('disciples', P('l013') - .5), ('nation', P('l013', 1) - .05), ('final', E('l013') + .15)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep11/ep11_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
