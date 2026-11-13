#!/usr/bin/env python3
"""absurd-cases EP15 timing plan (คดีดวงจันทร์): the one source of timing -> public/absurd-cases/ep15/ep15_timeline.json
Line timing from ep15_line_timing.json (Nox's AI Studio take cut with tools/tighten_take.py; visual beats live in ep15_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # closer: the Moon keeps orbiting cell 18 — live to the last frame, no freeze
script = json.load(open(HERE / 'ep15_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep15_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep15-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep15-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l012')
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
ev.update(turnL=P('l002'), turnR=P('l003'), follow2=P('l003', 1) + 0.2, zoom=P('l004', 1) - 0.2, plate1=P('l004', 1),
          phoneUp=P('l005') - 0.05, press=P('l005') + 0.3, siren=P('l006') - 0.1, lift=P('l006', 1) + 0.05, brake=P('l007', 1) + 0.25,
          cuff=P('l008') + 0.45, table=P('l009') + 0.3, cross=P('l010') + 0.35, circle=P('l010', 1) + 0.05,
          gavel=P('l011') + 0.35, flip=P('l011', 1) + 0.1, cellShut=P('l011', 1) + 0.5, end=E('l012'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('drive', 0.0), ('wide', P('l001', 1) - .1), ('left', P('l002') - L), ('right', P('l003') - L), ('charge', P('l004') - L), ('phone', P('l005') - .15),
         ('takeoff', P('l006') - L), ('space', P('l007') - L), ('reach', P('l007', 1) - .05), ('cuff', P('l008') - L), ('tow', P('l008', 1) - .05), ('interro', P('l009') - L),
         ('board', P('l010') - L), ('court', P('l011') - L), ('cell19', P('l011', 1) - .05), ('cells', P('l012') - L), ('orbit', P('l012', 1) + .55)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep15/ep15_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
