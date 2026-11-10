#!/usr/bin/env python3
"""absurd-cases EP10 timing plan (คดีเราเตอร์ Wi-Fi): the one source of timing -> public/absurd-cases/ep10/ep10_timeline.json
Line timing from ep10_line_timing.json (Fenrir take cut with tools/tighten_take.py; visual beats live in ep10_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # closer 'ดับอนาถ': last LED dies, frame holds, then the clip ends
script = json.load(open(HERE / 'ep10_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep10_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep10-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep10-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l017')
ev.update(spin=P('l002') + 0.1, oneBar=P('l002', 1) + 0.1, grumble=P('l003') + 0.1, red=P('l003', 1) + 0.35, plate1=P('l004', 1),
          phoneUp=P('l005') - 0.05, press=P('l005') + 0.35, siren=P('l006') - 0.1, door=P('l006') + 0.1, pin=P('l006', 1) + 0.2,
          tie=P('l007', 1) + 0.1, interro=P('l008'), slam=P('l008', 1) + 0.2, blink=P('l008', 1) + 0.35, noSignal=P('l009', 1) + 0.2,
          judgeType=P('l010', 1) + 0.1, wifiFail=P('l010', 2) + 0.3, mad=P('l011'), gavel1=P('l011', 1) + 0.1, gavel2=P('l011', 1) + 0.35,
          gavel3=P('l011', 1) + 0.6, gavel4=E('l011') + 0.3, gavel5=E('l011') + 0.7, gavel6=E('l011') + 1.1, plate2=P('l012', 1),
          boxShut=P('l013', 1) + 0.25, lidOpen=P('l014') + 0.2, guardsNet=P('l014', 1) + 0.1, gate=P('l015'), tower=P('l016'),
          reject=P('l016', 1) + 0.15, led1=P('l017', 1), led2=P('l017', 1) + 0.25, led3=P('l017', 1) + 0.5, led4=E('l017') + 0.1, end=E('l017'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('bed', 0.0), ('spinner', P('l002') - .05), ('oneBar', P('l002', 1) - .05), ('grumble', P('l003') - .05), ('redLight', P('l003', 1) - .05),
         ('charge', P('l004') - .05), ('phone', P('l005') - .05), ('callUI', P('l005', 1) + .1), ('raid', P('l006') - .05), ('grab', P('l006', 1) - .05),
         ('lan', P('l007') - .05), ('tie', P('l007', 1) - .05), ('interro', P('l008') - .05), ('blink', P('l008', 1) - .05),
         ('silent', P('l009') - .05), ('noSignal', P('l009', 1) - .05), ('court', P('l010') - .05),
         ('wifiFail', P('l010', 2) - .05), ('judgeMad', P('l011') - .05), ('gavel', P('l011', 1) - .05), ('gavelRage', E('l011') + .5),
         ('charge2', P('l012') - .05), ('box', P('l013') - .05), ('guardsNet', P('l014') - .05), ('release', P('l015') - .05),
         ('jobHunt', P('l015', 1) - .05), ('tower', P('l016') - .05), ('rejected', P('l016', 1) - .05), ('lastLight', P('l017') - .05)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep10/ep10_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
