#!/usr/bin/env python3
"""absurd-cases EP22 timing plan (แก๊งห้อง 24 ตอน 2 · แหกคุกได้ครึ่งตัว): the one source of timing -> public/absurd-cases/ep22/ep22_timeline.json
Line timing from ep22_line_timing.json (Nox's AI Studio take cut with tools/tighten_take.py; visual beats live in ep22_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # cliffhanger: the stink rises off cell 20, then black
script = json.load(open(HERE / 'ep22_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep22_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep22-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep22-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# TODO the events of THIS story. Tie every one to a card start P('l00X', i) or a card end E('l00X'), never to bare seconds, and name every moment
#      of contact (a bite, a slap, a door shutting): the shots, the mix and tools/qa_strips.py all look events up by name.
# night, as EP21 ended: he is flat and stuck half out of the front bars, foam on his outside hand. The soap (EP5) is on that hand; it signs box 2
# of the contract with its own foam (`stamp`), rubs him slick (`rub0`…`rub1`), pulls (`pull`) and slips out of his hand (`slip`). He snaps back
# into the cell (`snap`) and lodges head first in the back window (`lodge`), top half outside the prison. Phone in his outside hand (`dial`);
# the call reaches the police OUTSIDE (`ring`, `answer`, `lookup`). Ten cars close in (`cars0`…`cars1`), a searchlight finds him (`spot`).
# The soap shoots out under the yard door, an officer catches it (`grab`), cuffs it (`cuff`), it squirts out (`slip2`). A warrant goes up on the
# wall under his window (`slap`). Then cell 20 begins to smell (`stink`), black.
ev.update(soap=P('l002') + 0.1, stamp=P('l002', 1) + 0.4, rub0=P('l003') + 0.1, rub1=E('l003', 0), pull=P('l003', 1) + 0.05, slip=P('l004', 1) + 0.08,
          snap=P('l005') + 0.12, lodge=P('l005') + 0.62, plate=P('l006', 1), dial=P('l007') + 0.1, ring=P('l008') + 0.1, answer=P('l008') + 0.4,
          lookup=P('l008', 1) - 0.1, cars0=P('l009') - 0.3, cars1=P('l009', 1) + 0.45, spot=P('l010', 1) + 0.05, plate2=P('l011', 1),
          grab=P('l012') + 0.35, cuff=P('l012', 1) + 0.25, slip2=P('l012', 1) + 0.85, slap=P('l013', 1) + 0.12, stink=P('l015', 2) - 0.05,
          black=E('l015') + 1.3, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
# TODO one entry per cut, (name, time), in order. Cut L (0.2 s) before a sentence and 0.05–0.08 s before a line's second card;
#      a silent beat that shows a new picture is its own shot (≥ 0.5 s: raise that line's gap in epN_gaps.txt, do not squeeze the shot).
SHOTS = [('open', 0.0), ('halfwide', P('l001', 1) - .06), ('soap', P('l002') - L), ('sign', P('l002', 1) - .06), ('rub', P('l003') - L),
         ('pull', P('l003', 1) - .06), ('slip', P('l004') - L), ('away', E('l004') + 0.05), ('snap', P('l005') - L), ('lodge', P('l005', 1) - .06),
         ('outside', E('l005') + 0.05), ('legs', P('l006') - L), ('helpless', P('l006', 1) - .06), ('phone', P('l007') - L), ('answer', P('l008') - L),
         ('lookup', P('l008', 1) - .06), ('cars', P('l009') - L), ('ring', P('l009', 1) - .06), ('spot', P('l010') - L), ('found', P('l010', 1) - .06),
         ('aim', E('l010') + 0.05), ('charge2', P('l011', 1) - .06), ('catch', P('l012') - L), ('cuffs', P('l012', 1) - .06), ('empty', E('l012') + 0.05),
         ('warrant', P('l013') - L), ('poster', P('l013', 1) - .06), ('irony', P('l014') - L), ('inside', P('l014', 1) - .06), ('quiet', E('l014') + 0.05),
         ('corridor', P('l015') - L), ('durian', P('l015', 1) - .06)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 45 * FPS, TOTAL / FPS   # series 2: Nox lifted the 30 s cap (series2_bible.md)
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep22/ep22_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
