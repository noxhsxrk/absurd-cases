#!/usr/bin/env python3
"""absurd-cases EP27 timing plan (แก๊งห้อง 24 ตอน 6 · ดาวบริวาร): the one source of timing -> public/absurd-cases/ep27/ep27_timeline.json
Line timing from ep27_line_timing.json (Gemini TTS Fenrir, one call per line via tools/gemini_take.py --per-line, cut with tools/tighten_take.py; visual beats live in ep27_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # season cliffhanger: his shadow, left behind in 24, starts to slide to the bars, then black
script = json.load(open(HERE / 'ep27_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep27_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep27-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep27-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# TODO the events of THIS story. Tie every one to a card start P('l00X', i) or a card end E('l00X'), never to bare seconds, and name every moment
#      of contact (a bite, a slap, a door shutting): the shots, the mix and tools/qa_strips.py all look events up by name.
# night, where EP26 stopped: no guard. The fire ball drifts on and melts the bars of 19 (`m19`) and 20 (`m20`); the gang floats out
# (`out0`) and gathers inside 22 at the hole (`gather`). He counts them: tags pop 1…4 (`c1`…`c4`) and 5 on himself (`c5`). Five:
# a criminal gang! He calls (`dial`). Outside, by car 0, the cuffed guard's phone rings in his pocket (`ring`); his hands are cuffed (`strain`),
# he can't answer. Nobody comes: one by one they float out through the hole (`ex0`…`ex4`, him last) and gravity outside drops each to the
# ground (`ld0`…`ld4`). He stands up outside the wall (`stand`), free; the gang walks off (`walk`). Under the lamp everyone has a shadow but
# him (`lamp`): his is still on the floor of 24 (`cell24`), and that night it starts to slide to the bars (`slide`).
ex0 = P('l009') - 0.6
ev.update(m19=P('l001', 1) + 0.25, m20=P('l001', 1) + 1.05, out0=P('l002') + 0.1, gather=P('l002', 1) + 1.3,
          c1=P('l003') + 0.25, c2=P('l003') + 0.55, c3=P('l003') + 0.85, c4=P('l003') + 1.15, c5=P('l003', 1) + 0.1, plate=P('l004', 1), dial=P('l005') + 0.1,
          ring=P('l006') + 0.15, strain=P('l007', 1) + 0.1, enter=P('l008', 1) - 0.3,
          **{f'ex{i}': ex0 + 0.5 * i for i in range(5)}, **{f'ld{i}': ex0 + 0.5 * i + 0.5 for i in range(5)},
          stand=P('l010') + 0.15, walk=P('l010', 1) - 0.1, lamp=P('l011'), cell24=P('l011', 1), slide=P('l012', 2) + 0.1, black=E('l012') + 1.3, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
# TODO one entry per cut, (name, time), in order. Cut L (0.2 s) before a sentence and 0.05–0.08 s before a line's second card;
#      a silent beat that shows a new picture is its own shot (≥ 0.5 s: raise that line's gap in epN_gaps.txt, do not squeeze the shot).
# TODO one entry per cut, (name, time), in order. Cut L (0.2 s) before a sentence and 0.05–0.08 s before a line's second card;
#      a silent beat that shows a new picture is its own shot (≥ 0.5 s: raise that line's gap in epN_gaps.txt, do not squeeze the shot).
SHOTS = [('open', 0.0), ('melt19', P('l001', 1) - .06), ('melt20', P('l001', 1) + 0.85), ('gang', P('l002') - L), ('gather', P('l002', 1) - .06), ('hole', P('l002', 1) + 1.2),
         ('count', P('l003') - L), ('five', P('l003', 1) - .06), ('plate', P('l004') - L), ('call', P('l005') - L), ('pocket', P('l006') - L), ('ringcu', P('l006', 1) - .06),
         ('cuffed', P('l007') - L), ('cant', P('l007', 2) - .06), ('noone', P('l008') - L), ('through', P('l008', 1) - .06), ('drops', P('l009') - L), ('dropcu', P('l009', 1) - .06),
         ('stand', P('l010') - L), ('free', P('l010', 1) - .06), ('lamp', P('l011') - L), ('cell24', P('l011', 1) - .06), ('night', P('l012') - L), ('slide', P('l012', 2) - .06), ('slidecu', E('l012') + 0.15)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 50 * FPS, TOTAL / FPS   # series 2: Nox lifted the 30 s cap (series2_bible.md)
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep27/ep27_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
