#!/usr/bin/env python3
"""absurd-cases EP18 timing plan (คดีวันจันทร์): the one source of timing -> public/absurd-cases/ep18/ep18_timeline.json
Line timing from ep18_line_timing.json (Nox's AI Studio take cut with tools/tighten_take.py; visual beats live in ep18_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # closer (ง): the picture walks on — Tuesday drifts through the barrier, the sergeant keeps glaring. Live to the last frame
script = json.load(open(HERE / 'ep18_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep18_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep18-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep18-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
ev.update(midnight=P('l002') + 0.12, peel=P('l002', 1) - 0.02, note=P('l002', 2) + 0.05, point=P('l003') + 0.05, plate=P('l003', 1),
          phoneUp=P('l004') - 0.05, hundred=P('l005') + 0.35, wire=P('l005', 1) + 0.1, wireDone=E('l005') - 0.05,
          sunUp=P('l006') - 0.1, palm=P('l006', 1) + 0.12, glide=E('l006') + 0.1, cuff=P('l007') - 0.5,
          gavel=P('l007') + 0.62, tow=P('l007', 1) - 0.02, back=P('l008') + 0.15, w2=P('l008', 1) - 0.02, w3=P('l008', 1) + 0.24, w4=P('l008', 1) + 0.5,
          lone=P('l009') + 0.8, sigh=P('l009', 1) + 0.2, jets=P('l010') + 0.1, stamp=P('l010', 1) + 0.28,
          leave=P('l011') - 0.15, glare=P('l011', 1) + 0.12, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('open', 0.0), ('clock', P('l001', 1) - .08), ('peel', P('l002') - L), ('note', P('l002', 2) - .06), ('charge', P('l003') - L), ('phone', P('l004') - L),
         ('fleet', P('l005') - L), ('wire', P('l005', 1) - .06), ('sun', P('l006') - L), ('palm', P('l006', 1) - .06), ('arrest', E('l006') + .15),
         ('court', P('l007') - L), ('deport', P('l007', 1) - .06), ('back', P('l008') - L), ('weeks', P('l008', 1) - .06),
         ('alone', P('l009') - L), ('wait', P('l009', 1) - .06), ('wedding', P('l010') - L), ('stamp', P('l010', 1) - .06), ('tue', P('l011') - L), ('glare', P('l011', 1) - .06)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 30 * FPS, TOTAL / FPS
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep18/ep18_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
