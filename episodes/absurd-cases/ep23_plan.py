#!/usr/bin/env python3
"""absurd-cases EP23 timing plan (แก๊งห้อง 24 ตอน 4 · แผนรมผู้คุม): the one source of timing -> public/absurd-cases/ep23/ep23_timeline.json
Line timing from ep23_line_timing.json (Gemini TTS Fenrir, one call per line via tools/gemini_take.py --per-line, cut with tools/tighten_take.py; visual beats live in ep23_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 2.0                     # cliffhanger: the hooded new prisoner at the bars of 24, his legs still in the window, then black
script = json.load(open(HERE / 'ep23_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep23_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep23-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep23-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# dawn after EP22: he is flat in the back window of 24, top half outside (ten cars, the warrant). Cell 20's smell is the durian's plan to gas
# the guard (`stink`, ribbons creep to the guard's empty post `creep`). Morning: it lets go (`puff`). The fan in 19 oscillates as it always
# does (`sway`), catches the cloud (`turn`) and blows all of it down the corridor (`sweep`) into 24 (`flood`) and out of the window round his
# head (`window`). Chemical weapons! He calls (`dial`); the guard, arriving for his shift at the far end, answers (`ring`, `answer`), pulls his
# gas mask down (`mask`) and walks in through the gas (`walk0`). He hooks the fan's neck through the bars (`grab`), cuffs it to a bar — a second
# pair (`cuff`), wraps the whole front of 19 in plastic (`wrap0`…`wrap1`) and slaps a hazard sign on it (`sign`). Everyone is gassed (`faint`,
# the mosquito in its jar keels over `mqfall`) except the guard. He peers into 24 (`peer`): only smoke. Files it as escaped (`stamp`).
# That night (`night`) he leads a hooded new prisoner (`lead`) to cell 24 (`arrive`); black.
ev.update(stink=P('l002') + 0.1, creep=P('l002', 1), puff=P('l003', 1) + 0.1, turn=P('l004', 1) + 0.1, sweep=P('l005'), flood=P('l005', 1),
          window=E('l005') - 0.05, plate=P('l006', 1), dial=P('l007') + 0.1, ring=P('l008') - 0.15, answer=P('l008') + 0.35, mask=P('l008') + 1.3,
          walk0=P('l008', 1) - 0.3, grab=P('l009') + 0.3, cuff=P('l009', 1) + 0.35, wrap0=P('l010') - 0.1, wrap1=P('l010', 1) - 0.1, sign=P('l010', 1) + 0.3,
          faint=P('l011', 1), mqfall=E('l011') + 0.15, peer=P('l013') + 0.2, stamp=P('l014', 1) + 0.05, night=P('l015') - 0.2, lead=P('l015', 1) - 0.4,
          arrive=P('l015', 2) + 0.6, black=E('l015') + 1.3, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('open', 0.0), ('legs', P('l001', 1) - .06), ('durian', P('l002') - L), ('post', P('l002', 1) - .06), ('dawn', P('l003') - L),
         ('puff', P('l003', 1) - .06), ('fan', P('l004') - L), ('sway', P('l004', 1) - .06), ('blow', P('l005') - L), ('flood', P('l005', 1) - .06),
         ('window', E('l005') + 0.05), ('plate', P('l006', 1) - .06), ('phone', P('l007') - L), ('guard', P('l008') - L), ('masks', P('l008') + 0.95),
         ('walk', P('l008', 1) - .06), ('grab', P('l009') - L), ('cuff', P('l009', 1) - .06), ('wrap', P('l010') - L), ('sign', P('l010', 1) - .06),
         ('proud', P('l011') - L), ('faint', P('l011', 1) - .06), ('jar', E('l011') + 0.05), ('except', P('l012') - L), ('peer', P('l013') - L),
         ('smoke', P('l013', 1) - .06), ('file', P('l014') - L), ('stamp', P('l014', 1) - .06), ('irony', E('l014') + 0.05), ('night', P('l015') - L),
         ('lead', P('l015', 1) - .06), ('cell24', P('l015', 2) - .06), ('legs2', E('l015') + 0.3)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 45 * FPS, TOTAL / FPS   # series 2: Nox lifted the 30 s cap (series2_bible.md)
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep23/ep23_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
