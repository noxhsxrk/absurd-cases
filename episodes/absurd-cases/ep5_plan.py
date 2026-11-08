#!/usr/bin/env python3
"""absurd-cases EP5 timing plan: the one source of timing (cuts, cards, events) -> public/absurd-cases/ep5/ep5_timeline.json
Line timing comes from ep5_line_timing.json: provisional (ep5_provisional_timing.py) until the Fenrir take is cut with tools/tighten_take.py."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
CHASE, HOLD = 1.45, 2.1        # after the last word: the soap runs the corridor, then the escape report is held (pause-bait)
script = json.load(open(HERE / 'ep5_script.json')); rows = json.load(open(HERE / 'ep5_line_timing.json'))
timing = {r['id']: r for r in rows}; provisional = any(r.get('provisional') for r in rows)
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    spans = [[parts[0][0], parts[-1][1]]] if len(l['cards']) == 1 else parts
    assert len(spans) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], spans)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep5-{k}']['parts'][i][0]
E = lambda k: timing[f'ep5-{k}']['end']
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
# the accused's answer: two bubbles, not words (echo card)
ans = E('l010') + 0.12
cards.insert(next(i for i, c in enumerate(cards) if c['line'] == 'l011'), {'id': 'l010c9', 'line': 'l010', 'text': 'ปุด… ป๊อบ', 'hl': 'ป๊อบ', 't0': round(ans, 3), 't1': round(P('l011') - 0.02, 3), 'echo': True})
# the charge word lands the plate: card start of 'พยายามฆ่า' until Whisper gives the real word time
charge_word = P('l003', 1)
speech = E('l013'); chase0 = speech + 0.08; report0 = chase0 + CHASE
ev.update(slip=P('l002', 1) - 0.42, trap=P('l002', 1) + 0.3, plate=charge_word, phoneUp=P('l004') - 0.05, press=P('l004') + 0.4,
          bang=P('l005') + 0.15, kick=P('l005', 1) + 0.05, siren=P('l005', 1) + 0.05,
          slip0=P('l006') + 0.55, heads=P('l006', 1) + 0.15, taser=P('l007', 1) + 0.25,
          grab=P('l008') + 0.4, lift=P('l008') + 0.7, cuffOn=P('l008', 1) + 0.15,
          lock=P('l009') + 0.25, squirt=P('l009') + 0.45, cage=P('l009', 1) + 0.1,
          answer=ans, pop=ans + 0.38, gavel=P('l011') + 0.5, peel=P('l011', 1) + 0.05, stick=P('l011', 1) + 0.45, clang=P('l011', 1) + 0.8,
          fanTurn=P('l012') + 0.1, foam=P('l012', 1) - 0.05, glide=P('l013') + 0.15, through=P('l013', 1) + 0.15, gone=speech,
          chase=chase0, guardSlip=chase0 + 0.6, prisonSiren=chase0 + 0.35, report=report0, stamp=report0 + 0.45)
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('shower', 0.0), ('slip', P('l002') - .05), ('trap', P('l002', 1) - .05), ('charge', P('l003') - .05),
         ('phone', P('l004') - .05), ('callUI', P('l004', 1) - .05),
         ('doorBurst', P('l005') - .05), ('domino', P('l006') - .05), ('pileup', P('l006', 1) - .05), ('crawl', P('l007') - .05), ('taser', P('l007', 1) - .05),
         ('tongs', P('l008') - .05), ('cuffOn', P('l008', 1) - .05), ('cuffSlip', P('l009') - .05), ('cage', P('l009', 1) - .05),
         ('interro', P('l010') - .05), ('soapAnswer', P('l010', 1) - .05), ('court', P('l011') - .05), ('cell18', P('l011', 1) - .05),
         ('fan19', P('l012') - .05), ('foamFlood', P('l012', 1) - .05), ('slide', P('l013') - .05), ('chase', chase0), ('report', report0)]
TOTAL = round((report0 + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 90 for s in shots[1:-1]), [s for s in shots[1:] if s['dur'] > 90]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if provisional else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep5/ep5_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
