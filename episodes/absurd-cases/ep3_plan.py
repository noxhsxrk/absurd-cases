#!/usr/bin/env python3
"""absurd-cases EP3 timing plan: the one source of timing (cuts, cards, events) -> public/absurd-cases/ep3/ep3_timeline.json"""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS, END_HOLD = 30, 1.8
script = json.load(open(HERE / 'ep3_script.json')); timing = {r['id']: r for r in json.load(open(HERE / 'ep3_line_timing.json'))}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    spans = [[parts[0][0], parts[-1][1]]] if len(l['cards']) == 1 else parts
    assert len(spans) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], spans)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep3-{k}']['parts'][i][0]
E = lambda k: timing[f'ep3-{k}']['end']
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
# the accused's answer: a thin whine in the beat after the judge's question, echo card
ans = E('l008') + 0.08
cards.insert(next(i for i, c in enumerate(cards) if c['line'] == 'l009'), {'id': 'l008c9', 'line': 'l008', 'text': 'วิ้งงง…', 'hl': 'วิ้งงง', 't0': round(ans, 3), 't1': round(P('l009') - 0.02, 3), 'echo': True})
ev.update(window=0.12, dustIn=P('l002', 1) + 0.25, sniff=E('l002') - 0.15, sneeze=E('l002') + 0.06, titleCharge=P('l003') - 0.5, dial=P('l004') - 0.05, callUI=P('l004') + 0.7,
          helis=P('l005'), six=P('l005', 1), vacOn=P('l006') + 0.1, suck0=P('l006', 1) - 0.05, suck1=E('l006') - 0.1, pop=E('l006') - 0.05, cuff=P('l007', 1) + 0.15,
          ahem=P('l008') + 0.05, ask=P('l008', 2), answer=ans, gavel=P('l010') + 0.2, tipIn=P('l010', 1) - 0.02, barsShut=P('l010', 1) + 0.42,
          turn0=P('l011') + 0.1, turnLock=P('l011', 1) + 0.35, blow=P('l011', 2) + 0.05, siren=P('l011', 2) + 0.45, news=E('l011') - 0.2,
          nail1=P('l012') + 0.2, nail2=P('l012') + 0.6, cuffs3=P('l012', 1) + 0.1)
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('openWindow', 0.0), ('dustAir', P('l002') - .05), ('noseCU', P('l002', 1) - .05), ('sneeze', E('l002') - .02), ('dustScale', P('l003') - 0.5), ('stare', P('l003', 1) - .05),
         ('phone', P('l004') - .05), ('callUI', P('l004') + 0.65), ('helis', P('l005') - .05), ('vacuum', P('l006') - .05), ('skyClean', P('l006', 1) - .05),
         ('jarLid', P('l007') - .05), ('jarCuff', P('l007', 1) - .05), ('court', P('l008') - .05), ('judge', P('l008', 1) - .05), ('caseFile', P('l008', 2) - .05),
         ('jarECU', E('l008') + 0.02), ('courtWide', P('l009', 1) - .05), ('gavel', P('l010') - .05), ('cellBlock', P('l010', 1) - .05),
         ('cell19', P('l011') - .05), ('fanTurn', P('l011', 1) - .05), ('dustOut', P('l011', 2) - .05), ('escape', E('l011') - .25),
         ('plateNail', P('l012') - .05), ('fanCuffed', P('l012', 1) - .05)]
speech = E('l012'); TOTAL = round((speech + END_HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 96 for s in shots[1:]), [s for s in shots[1:] if s['dur'] > 96]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep3/ep3_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w'), ensure_ascii=False, indent=1)
print('total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
