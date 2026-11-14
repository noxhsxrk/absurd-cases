#!/usr/bin/env python3
"""absurd-cases EP16 timing plan (คดีแรงโน้มถ่วง): the one source of timing -> public/absurd-cases/ep16/ep16_timeline.json
Line timing from ep16_line_timing.json (Nox's AI Studio take cut with tools/tighten_take.py; visual beats live in ep16_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # closer: he floats over the village, the phone hovers beside him — live to the last frame, no freeze
script = json.load(open(HERE / 'ep16_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep16_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep16-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep16-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l011')
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
FLIGHT = 0.86   # how long the thrown cuffs are in the air (shots.tsx works out the throw from this)
slip = P('l001', 1) + 0.1; drop = slip + 0.3; hit = P('l002', 1) + 0.95; clat = P('l005', 1) + 0.75
ev.update(slip=slip, drop=drop, hit=hit, note=P('l002'), note2=P('l005', 1), zoom=P('l003', 1) - 0.2, plate1=P('l003', 1), phoneUp=P('l004') - 0.05, press=P('l004') + 0.3,
          throw=clat - FLIGHT, clat=clat, plate2=P('l006') + 0.05, heave=P('l007', 1), pop=P('l008') + 0.28, cuff=P('l008', 1) + 0.35,
          float=E('l008') + 0.4, gavel=P('l010') + 0.5, flip=P('l010', 1) + 0.1, letgo=P('l011', 1) + 0.15, end=E('l011'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('open', 0.0), ('fall', drop + 0.12), ('crack', hit - 0.07), ('charge', P('l003') - L), ('phone', P('l004') - .15),
         ('throw', P('l005') - L), ('clatter', clat - 0.1), ('resist', P('l006') - L), ('army', P('l007') - L), ('pull', P('l007', 1) - .05),
         ('pop', P('l008') - L), ('cuffed', P('l008', 1) - .05), ('lift', E('l008') + .12), ('car', P('l009', 1) - .08), ('house', P('l009', 2) - .08),
         ('court', P('l009', 3) - .08), ('gavel', P('l010') - L), ('cell', P('l010', 1) - .05), ('relax', P('l011') - L), ('sky', E('l011') + .25)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 30 * FPS, TOTAL / FPS
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep16/ep16_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
