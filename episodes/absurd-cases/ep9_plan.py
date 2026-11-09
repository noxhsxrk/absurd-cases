#!/usr/bin/env python3
"""absurd-cases EP9 timing plan (คดีกระจกเงา · กระจกเงาตั้งโต๊ะ): the one source of timing -> public/absurd-cases/ep9/ep9_timeline.json
Line timing from ep9_line_timing.json (Fenrir take cut with tools/tighten_take.py; l006 / l010 hold visual-only beats between cards)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 0.35                    # after the cut-off "ตำ—": ~0.35 s of silence, then a hard cut (no freeze)
script = json.load(open(HERE / 'ep9_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep9_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep9-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep9-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l015')
# v2 (Nox: clarity over speed): each beat gets its own held shot; visual-only beats live in the gaps set in ep9_gaps.txt
ev.update(tilt=P('l002', 1) + 0.15, raise_=P('l002', 1) + 0.7, point=P('l003') + 0.05, plate1=P('l003', 1), plate2=P('l004', 1),
          phoneUp=P('l005') - 0.05, press=P('l005') + 0.35, siren=P('l006') - 0.1, door=P('l006') + 0.1,
          hit1=P('l006', 1) + 0.15, hit2=P('l006', 1) + 0.6, hit3=E('l006') + 0.3, hit4=E('l006') + 0.75,
          hit5=P('l007') + 0.2, hit6=P('l007') + 0.6, reel=P('l007', 1) + 0.05, bag=P('l008') + 0.35, cuff=P('l008', 1) + 0.25,
          interro=P('l009'), unbag=P('l009') + 0.2, slam1=P('l009', 1) + 0.25, slam2=E('l009') + 0.15, note=E('l009') + 0.75,
          gavel1=P('l010') + 0.45, gavel2=P('l010', 1) + 0.3, plate3=P('l011', 1), gavel3=E('l011') + 0.1, gavel4=E('l011') + 0.3, gavel5=E('l011') + 0.5,
          dark=P('l012'), release=P('l013'), ring=P('l013', 1) + 0.15,
          newMirror=P('l014'), brush2=P('l014', 1) + 0.2, tilt2=E('l014') + 0.35, phone2=P('l015') - 0.35, end=E('l015'))
ev = {k.rstrip('_'): round(v, 3) for k, v in ev.items()}
SHOTS = [('brush', 0.0), ('mirrorECU', P('l002') - .05), ('mimic', P('l002', 1) - .05), ('charge', P('l003') - .05), ('chargeBack', P('l004') - .05),
         ('phone', P('l005') - .05), ('callUI', P('l005', 1) + .1), ('swat', P('l006') - .05), ('beat1', P('l006', 1) - .05),
         ('beat2', P('l007') - .05), ('beatBack', P('l007', 1) - .05), ('bag', P('l008') - .05), ('cuffs', P('l008', 1) - .05),
         ('interro', P('l009') - .05), ('slam', P('l009', 1) - .05), ('note', E('l009') + .6),
         ('court', P('l010') - .05), ('judgeMad', P('l010', 1) - .05), ('judgeRage', P('l011') - .05),
         ('darkCell', P('l012') - .05), ('sign3', P('l012', 1) - .05), ('release', P('l013') - .05), ('ringLive', P('l013', 1) - .05),
         ('newMirror', P('l014') - .05), ('brush2', P('l014', 1) - .05), ('phone2', ev['phone2'])]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots[1:-1]), [s for s in shots[1:] if s['dur'] > 105]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep9/ep9_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
