#!/usr/bin/env python3
"""absurd-cases EP29 timing plan (คดีตู้กดน้ำ): the one source of timing -> public/absurd-cases/ep29/ep29_timeline.json
Line timing from ep29_line_timing.json (gemini-2.5-pro-preview-tts Fenrir per-line take sped 1.25x (3.8-flash quota spent); cut with tools/tighten_take.py; visual beats live in ep29_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # closer (ข): the sergeant sits in cell 27 cuffed to the machine; the camera keeps pushing in
script = json.load(open(HERE / 'ep29_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep29_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep29-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep29-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# TODO the events of THIS story. Tie every one to a card start P('l00X', i) or a card end E('l00X'), never to bare seconds, and name every moment
#      of contact (a bite, a slap, a door shutting): the shots, the mix and tools/qa_strips.py all look events up by name.
ev.update(coin=P('l001', 1) + 0.15, eat=P('l002') + 0.25, press=P('l002', 1) + 0.05, point=P('l003') + 0.05, plate=P('l003', 1), phoneUp=P('l004') - 0.05,
          cops=P('l005') + 0.05, shake=P('l005', 1), drop=P('l006') + 0.35, one=P('l006', 1), grab=P('l007') + 0.3, drink=P('l007', 1) + 0.05,
          point2=P('l008') + 0.05, plate2=P('l008', 1), cuffm=P('l009') + 0.55, cuffd=P('l010') + 0.75, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
# TODO one entry per cut, (name, time), in order. Cut L (0.2 s) before a sentence and 0.05–0.08 s before a line's second card;
#      a silent beat that shows a new picture is its own shot (≥ 0.5 s: raise that line's gap in epN_gaps.txt, do not squeeze the shot).
SHOTS = [('open', 0.0), ('eat', P('l002') - L), ('empty', P('l002', 1) - .06), ('charge', P('l003') - L), ('accuse', P('l003', 1) - .06), ('phone', P('l004') - L),
         ('cops', P('l005') - L), ('shake', P('l005', 1) - .06), ('drop', P('l006') - L), ('one', P('l006', 1) - .06), ('take', P('l007') - L), ('drink', P('l007', 1) - .06),
         ('charge2', P('l008') - L), ('bribe', P('l008', 1) - .06), ('cuffm', P('l009') - L), ('ring', P('l009', 1) - .06), ('cuffd', P('l010') - L), ('sergeant', P('l010', 1) - .06), ('cell', P('l011') - L), ('together', P('l011', 1) - .06), ('last', E(LAST) + 0.15)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 30 * FPS, TOTAL / FPS
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep29/ep29_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
