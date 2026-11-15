#!/usr/bin/env python3
"""absurd-cases EP17 timing plan (คดีไฟในปาก): the one source of timing -> public/absurd-cases/ep17/ep17_timeline.json
Line timing from ep17_line_timing.json (Nox's AI Studio take cut with tools/tighten_take.py; visual beats live in ep17_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 2.2                     # closer: a silent picture gag — he takes another forkful and the fire is back. Live to the last frame, no freeze
script = json.load(open(HERE / 'ep17_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep17_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep17-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep17-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l010')
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
jets = P('l005', 1) - 0.02; jetsOff = E('l005') + 0.12
ev.update(dig=P('l001', 1) + 0.25, chili=P('l001', 1) + 0.6, bite=P('l002') + 0.3, fire=P('l002', 1) + 0.02, zoom=P('l003', 1) - 0.2, plate=P('l003', 1),
          phoneUp=P('l004') - 0.05, ten=P('l005') + 0.8, jets=jets, jetsOff=jetsOff, flare=jetsOff + 0.18,
          grip=P('l006') + 0.7, out=P('l006') + 1.2, cuff=P('l006', 1) + 0.35, melt=P('l007') + 0.35, melted=P('l007') + 1.05, two=P('l007', 1) + 0.05, three=P('l007', 1) + 0.42,
          slap=P('l008') + 0.55, ignite=P('l008', 1) + 0.25, ash=E('l008') + 0.02, gavel=P('l009') + 0.75, shut=P('l009', 1) + 0.3, flip=P('l009', 1) + 0.55,
          bite2=E('l010') + 0.8, fire2=E('l010') + 1.35, end=E('l010'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('open', 0.0), ('plate', P('l001', 1) - .08), ('bite', P('l002') - L), ('fire', P('l002', 1) - .08), ('charge', P('l003') - L), ('phone', P('l004') - .15),
         ('trucks', P('l005') - L), ('hose', P('l005', 1) - .05), ('soaked', jetsOff + .14), ('tongs', P('l006') - L), ('cuff', P('l006', 1) - .05), ('melt', P('l007') - L), ('three', P('l007', 1) - .05),
         ('interro', P('l008') - L), ('burn', P('l008', 1) - .05), ('soot', E('l008') - .05), ('court', P('l009') - L), ('fridge', P('l009', 1) - .05),
         ('chili', P('l010') - L), ('again', E('l010') + .2)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 30 * FPS, TOTAL / FPS
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep17/ep17_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
