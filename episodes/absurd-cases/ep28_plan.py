#!/usr/bin/env python3
"""absurd-cases EP28 timing plan (คดีถุงเท้าหาย): the one source of timing -> public/absurd-cases/ep28/ep28_timeline.json
Line timing from ep28_line_timing.json (Gemini Fenrir per-line take, cut with tools/tighten_take.py; visual beats live in ep28_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 2.0                     # closer (ค): the camera keeps tracking along the row of feet, one sock each
script = json.load(open(HERE / 'ep28_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep28_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep28-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep28-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
ev.update(pull=P('l001', 1) + 0.1, sock=P('l002') + 0.05, one=P('l002', 1), point=P('l003') + 0.05, plate=P('l003', 1), phoneUp=P('l004') - 0.05,
          frogs=P('l005') + 0.1, dive1=P('l005', 1) - 0.02, dive2=P('l005', 1) + 0.3, dive3=P('l005', 1) + 0.62, mode=P('l006') + 0.45, spin=P('l006', 1),
          fling=E('l006') + 0.12, land=E('l006') + 0.55, lift=P('l007') + 0.1, cuff=P('l007', 1) + 0.12, gavel=P('l008', 1) + 0.1,
          drop=P('l009') + 0.7, feet=P('l010', 2), end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('open', 0.0), ('sock', P('l002') - L), ('tub', P('l002', 1) - .06), ('charge', P('l003') - L), ('phone', P('l004') - L),
         ('frogs', P('l005') - L), ('dive', P('l005', 1) - .06), ('panel', P('l006') - L), ('spin', P('l006', 1) - .06), ('fling', E('l006') + 0.05),
         ('cuff', P('l007') - L), ('lock', P('l007', 1) - .06), ('court', P('l008') - L), ('gavel', P('l008', 1) - .06), ('cell', P('l009') - L), ('queue', P('l009', 1) - .06),
         ('line', P('l010') - L), ('feet', P('l010', 2) - .06), ('socks', E(LAST) + 0.15)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 30 * FPS, TOTAL / FPS
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep28/ep28_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
