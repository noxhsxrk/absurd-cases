#!/usr/bin/env python3
"""absurd-cases EP4 timing plan: the one source of timing (cuts, cards, events) -> public/absurd-cases/ep4/ep4_timeline.json"""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS, END_HOLD = 30, 1.8
script = json.load(open(HERE / 'ep4_script.json')); timing = {r['id']: r for r in json.load(open(HERE / 'ep4_line_timing.json'))}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    spans = [[parts[0][0], parts[-1][1]]] if len(l['cards']) == 1 else parts
    assert len(spans) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], spans)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep4-{k}']['parts'][i][0]
E = lambda k: timing[f'ep4-{k}']['end']
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
# the accused's answer: a smell, not a word (echo card in green)
ans = E('l008') + 0.1
cards.insert(next(i for i, c in enumerate(cards) if c['line'] == 'l009'), {'id': 'l008c9', 'line': 'l008', 'text': 'ฟู่ววว…', 'hl': 'ฟู่ววว', 't0': round(ans, 3), 't1': round(P('l009') - 0.02, 3), 'echo': True})
# the charge word lands the plate (from Whisper word timings once the take exists; card start until then)
charge_word = P('l003', 0) + (8.40 - 7.11) - (0.52 - 0.22) - 0.03   # 'ก่อเหตุ' at 8.40 s in the raw take (Whisper)
cutoff = E('l004')                               # the line stops mid-word; 0.3 s of digital silence follows
ev.update(doorOpen=0.18, light=0.3, blast=P('l002', 1) + 0.05, gag=P('l002', 1) + 0.5, plate=charge_word, phoneUp=P('l004') - 0.05, cutoff=cutoff,
          doorBurst=cutoff + 0.3, siren=cutoff + 0.3, masks=P('l005', 1), swarm=P('l005', 2), tape0=P('l006') + 0.1, tapeTop=P('l006', 1),
          cuff=P('l007') + 0.35, lobes=P('l007', 1), ask=P('l008', 2), answer=ans, faint0=P('l010') + 0.1, faint1=P('l010') + 0.4, faint2=P('l010') + 0.7,
          gavel=P('l011') + 0.5, place=P('l011', 1), turn=P('l012') + 0.1, flow=P('l012', 1), peel=P('l012', 2) + 0.2, form=P('l013'))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('fridgeOpen', 0.0), ('fridgeFace', P('l001', 1) - .05), ('durianIn', P('l002') - .05), ('smellBlast', P('l002', 1) - .05), ('charge', P('l003') - .05), ('deadpan', P('l003', 1) - .05),
         ('phone', P('l004') - .05), ('phoneEar', P('l004') + 0.75), ('doorBurst', cutoff + 0.3), ('swatMasks', P('l005', 1) - .05), ('swatWide', P('l005', 2) - .05),
         ('tape', P('l006') - .05), ('tapeTop', P('l006', 1) - .05), ('cuffLobe', P('l007') - .05), ('cuffAll', P('l007', 1) - .05),
         ('interro', P('l008') - .05), ('officerAsk', P('l008', 1) - .05), ('askClose', P('l008', 2) - .05), ('durianAnswer', E('l008') + 0.02), ('smellRoom', P('l009') + 0.35), ('faint', P('l010') - .05), ('faintTop', P('l010', 1) - .05),
         ('court', P('l011') - .05), ('cell20', P('l011', 1) - .05), ('fan19', P('l012') - .05), ('smellFlow', P('l012', 1) - .05), ('cell18', P('l012', 2) - .05),
         ('form', P('l013') - .05)]
speech = E('l013'); TOTAL = round((speech + END_HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 100 for s in shots[1:-1]), [s for s in shots[1:] if s['dur'] > 96]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep4/ep4_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w'), ensure_ascii=False, indent=1)
print('total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
