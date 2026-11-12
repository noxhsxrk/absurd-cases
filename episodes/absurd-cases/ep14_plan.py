#!/usr/bin/env python3
"""absurd-cases EP14 timing plan (คดีแผ่นดินไหว): the one source of timing -> public/absurd-cases/ep14/ep14_timeline.json
Line timing from ep14_line_timing.json (Nox's AI Studio take cut with tools/tighten_take.py; visual beats live in ep14_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.6                     # closer: the rebuilt dominoes start to wobble (aftershock at large); hold, then the clip ends
script = json.load(open(HERE / 'ep14_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep14_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep14-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep14-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l012')
ev.update(lastDomino=0.45, quake=P('l002') - 0.1, topple=P('l002', 1) + 0.05, plate1=P('l003', 1), phoneUp=P('l004') - 0.05, press=P('l004') + 0.3,
          siren=P('l005') - 0.1, park=P('l005', 1) + 0.4, cuff=P('l006') + 0.55, doorShut=P('l006', 1) + 0.45,
          shake=P('l007', 1), needle=P('l008') + 0.05, fall=P('l008', 1) + 0.2, gavel=P('l009') + 0.45, plate2=P('l009', 1),
          cellShut=P('l010') + 0.35, place=P('l011', 1) + 0.4, wobble=P('l012') + 0.2, end=E('l012'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('man', 0.0), ('dominoes', P('l001', 1) - .05), ('quake', P('l002') - .05), ('topple', P('l002', 1) - .05),
         ('charge', P('l003') - .05), ('phone', P('l004') - .05),
         ('patrol', P('l005') - .05), ('cuff', P('l006') - .05), ('backseat', P('l006', 1) - .05),
         ('interro', P('l007') - .05), ('shake', P('l007', 1) - .05), ('polygraph', P('l008') - .05),
         ('court', P('l009') - .05), ('sentence', P('l009', 1) - .05), ('cell18', P('l010') - .05),
         ('rebuild', P('l011') - .05), ('aftershock', P('l012') - .05), ('final', P('l012', 1) - .05)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep14/ep14_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
