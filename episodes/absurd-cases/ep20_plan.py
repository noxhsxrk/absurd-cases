#!/usr/bin/env python3
"""absurd-cases EP20 timing plan (แก๊งห้อง 24 ตอน 1 · ไม่มีใครเอาด้วย): the one source of timing -> public/absurd-cases/ep20/ep20_timeline.json
Line timing from ep20_line_timing.json (Nox's AI Studio take cut with tools/tighten_take.py; visual beats live in ep20_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # closer (ก): the picture walks on — the mosquito circles him, the blood signature in box 1
script = json.load(open(HERE / 'ep20_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep20_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep20-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep20-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# the call rings the guard's phone in the silent beat after l004; he answers on l005, hangs up on "วางหู"; the second call is cut on "ตำ—"
ev.update(day=P('l002', 1), plate=P('l003', 1), dial=P('l004') + 0.15, ring=E('l004') + 0.12, answer=P('l005') + 0.35, hang=P('l005', 1) + 0.2,
          paper=P('l006') + 0.2, shake=P('l007', 1) + 0.05, turn=P('l008', 1), puff=P('l009', 1) + 0.1, plate2=P('l011', 1), dial2=P('l012') + 0.1,
          cut=E('l012') - 0.03, mqIn=E('l012') + 0.15, land=P('l013') + 0.45, hop=P('l013', 1) + 0.1, bite=P('l014') + 0.2, lift=P('l014', 1) + 0.15, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('open', 0.0), ('wall', P('l002') - L), ('allday', P('l002', 1) - .06), ('charge', P('l003') - L), ('phone', P('l004') - L),
         ('guard', E('l004') + 0.05), ('hangup', P('l005', 1) - .06), ('silence', E('l005') + 0.08), ('invite', P('l006') - L), ('plan', P('l006', 1) - .06),
         ('fan', P('l007') - L), ('earth', P('l008') - L), ('fridge', P('l009') - L), ('cold', P('l009', 1) - .06), ('moon', P('l010') - L),
         ('charge2', P('l011') - L), ('phone2', P('l012') - L), ('buzz', E('l012') + 0.05), ('mosq', P('l013') - L), ('yes', P('l013', 1) - .06),
         ('sign', P('l014') - L), ('blood', P('l014', 1) - .06)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 30 * FPS, TOTAL / FPS
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep20/ep20_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
