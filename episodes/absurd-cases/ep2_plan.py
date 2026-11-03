#!/usr/bin/env python3
"""absurd-cases EP2 timing plan: the one source of timing (cuts, cards, events) -> public/absurd-cases/ep2/ep2_timeline.json"""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS, END_HOLD = 30, 1.8
script = json.load(open(HERE / 'ep2_script.json')); timing = {r['id']: r for r in json.load(open(HERE / 'ep2_line_timing.json'))}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', '').replace('…', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    # cards follow the spoken segments; a line with one card spans all of its segments
    if len(l['cards']) == 1: spans = [[parts[0][0], parts[-1][1]]]
    else:
        assert len(l['cards']) == len(parts), id
        spans = parts
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], spans)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep2-{k}']['parts'][i][0]
E = lambda k: timing[f'ep2-{k}']['end']
# keep captions on until the next card when the gap is short (hard swap, no flicker)
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
# the mosquito's answer is a card of its own, echoing
ans = E('l013') + 0.12
cards.insert(next(i for i, c in enumerate(cards) if c['line'] == 'l014'), {'id': 'l013c9', 'line': 'l013', 'text': 'หึ่ง…', 'hl': 'หึ่ง', 't0': round(ans, 3), 't1': round(P('l014') - 0.02, 3), 'echo': True})
ev.update(press=0.55, zap=P('l002', 1) - 0.25, titleCharge=P('l003') - 0.5, zapPeak=E('l002'), dial=P('l004') - 0.05, callUI=P('l004') + 0.65, callElec=P('l004', 1) - 0.05, squad=P('l005'), door=P('l005', 1) - 0.05, ring=P('l006'),
          cut=P('l006', 1) + 0.03, out1=P('l006', 1) + 0.1, out2=P('l006', 1) + 0.3, out3=P('l006', 1) + 0.5, cuff=P('l006b') + 1.46, interro=P('l007') - 0.05, shake0=P('l008') - 0.1, shake1=P('l008') + 1.0, unplug=P('l009') + 0.33,
          windDown=P('l009') + 0.42, stamp=P('l010') + 0.25, gavel=P('l011') + 0.1, sentence=P('l011') + 0.2, cellDoor=P('l011', 1) - 0.05, press3=P('l012') + 0.28, wind=(P('l012') + E('l012')) / 2, peel=P('l013') + 0.25, splat=P('l013') + 0.62, answer=ans, form=P('l014') - 0.05)
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('fanPress', 0.0), ('fingerECU', P('l002') - .05), ('zapped', P('l002', 1) - .05), ('fanScale', P('l003') - 0.5), ('phone', P('l004') - .05), ('callUI', P('l004', 1) - .05), ('squadWalk', P('l005') - .05), ('doorway', P('l005', 1) - .05),
         ('surround', P('l006') - .05), ('soiCut', P('l006', 1) - .05), ('seize', P('l006b') - 0.05), ('cuffECU', P('l006b') + 1.08), ('interroFront', P('l007') - .05), ('caseFile', P('l007', 1) - .05), ('shakeNo', P('l008') - .25), ('plugECU', P('l009') - .05), ('windDown', P('l009', 1) - .05),
         ('confess', P('l010') - .05), ('court', P('l011') - .05), ('cell19', P('l011', 1) - .05), ('press3', P('l012') - .05), ('cellBlock', (P('l012') + E('l012')) / 2), ('mosqBlown', P('l013') - .05), ('mosqWall', P('l013', 1) - .05), ('mosqECU', P('l013', 2) - .05), ('reportForm', P('l014') - .05)]
speech = E('l014'); TOTAL = round((speech + END_HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 90 for s in shots[1:]), 'no shot over 3 s except the first'
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep2/ep2_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w'), ensure_ascii=False, indent=1)
print('total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
