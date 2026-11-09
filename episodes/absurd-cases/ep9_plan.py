#!/usr/bin/env python3
"""absurd-cases EP9 timing plan (คดีกระจกเงา · กระจกเงาตั้งโต๊ะ): the one source of timing -> public/absurd-cases/ep9/ep9_timeline.json
Line timing from ep9_line_timing.json (Fenrir take cut with tools/tighten_take.py; l006 / l010 hold visual-only beats between cards)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.9                     # after "แสนมัว": the fogged mirror holds, the finger-written "แค้น" fades
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
speech = E('l014')
ev.update(tilt=P('l002', 1) + 0.1, raise_=P('l002', 1) + 0.55, point=P('l003', 1) - 0.25, plate1=P('l003', 1), plate2=P('l004', 1), pointBack=P('l004') - 0.1,
          phoneUp=P('l005') - 0.05, press=P('l005') + 0.3, siren=P('l006') - 0.1, door=P('l006') + 0.05,
          hit1=P('l006') + 0.55, hit2=P('l006') + 0.8, hit3=E('l006', 0) + 0.3, hit4=E('l006', 0) + 0.5, bag=P('l006', 1) + 0.25,
          cuff=P('l007') + 0.3, interro=P('l008'), unbag=P('l008') + 0.15,
          slam1=P('l009') + 0.3, slam2=P('l009', 1) + 0.35, note=E('l009') + 0.05,
          gavel1=P('l010') + 0.35, gavel2=E('l010', 0) + 0.05, gavel3=E('l010', 0) + 0.22, gavel4=E('l010', 0) + 0.39, dark=P('l010', 1),
          cut3=P('l011') + 0.3, release=P('l012'), ring=P('l012', 1) + 0.15, steam=P('l013') - 0.1, viewers0=P('l013', 1) + 0.35, fogEnd=P('l014'))
ev = {k.rstrip('_'): round(v, 3) for k, v in ev.items()}
SHOTS = [('brush', 0.0), ('mirrorECU', P('l002') - .05), ('mimic', P('l002', 1) - .05), ('charge', P('l003') - .05), ('chargeBack', P('l004') - .05),
         ('phone', P('l005') - .05), ('callUI', P('l005', 1) - .05), ('swat', P('l006') - .05), ('beat1', P('l006') + .48), ('beat2', E('l006', 0) + .22), ('bag', P('l006', 1) - .05),
         ('cuffs', P('l007') - .05), ('carry', P('l007', 1) - .05), ('interro', P('l008') - .05), ('interroCU', P('l008', 1) - .05),
         ('slam', P('l009') - .05), ('slam2', P('l009', 1) - .05), ('note', P('l009', 1) + .45), ('court', P('l010') - .05), ('judgeMad', E('l010', 0) - .02), ('darkCell', P('l010', 1) - .05),
         ('reduce', P('l011') - .05), ('cornerMirror', P('l011', 1) - .05), ('release', P('l012') - .05), ('ringLive', P('l012', 1) - .05),
         ('steam', P('l013') - .05), ('live0', P('l013', 1) - .05), ('fogEnd', P('l014') - .05)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 90 for s in shots[1:-1]), [s for s in shots[1:] if s['dur'] > 90]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep9/ep9_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
