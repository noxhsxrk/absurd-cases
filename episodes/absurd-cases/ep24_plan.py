#!/usr/bin/env python3
"""absurd-cases EP24 timing plan (แก๊งห้อง 24 ตอน 5 · แรงโน้มถ่วงหลุด): the one source of timing -> public/absurd-cases/ep24/ep24_timeline.json
Line timing from ep24_line_timing.json (Gemini TTS Fenrir, one call per line via tools/gemini_take.py --per-line, cut with tools/tighten_take.py; visual beats live in ep24_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.6                     # cliffhanger: the moon starts pulling him off the ceiling, then black
script = json.load(open(HERE / 'ep24_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep24_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep24-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep24-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# night, where EP23 stopped: the hooded new prisoner at the bars of 24. Its cloak drops (`drop`): there is no one inside, only a flat
# shadow with a broom (EP8: his own shadow, sentenced to shade the bus stop, fled at noon). It slides along the floor through the bars
# (`slide0`…`slide1`) and stops under his feet at the window (`stick`). The Earth in 18 starts to shake (`shake0`) and leans on the wall
# of 24 (`push`, a crack). The whole block quakes (`quake0`…`quake1`); a wall bursts (`collapse`) — cell 22's, at the far end
# (`reveal22`). Gravity (EP16: cuffs round nothing, "g = 9.8", a red arrow) slips out through the hole (`escape`), and everything
# lifts (`lift`). He comes out of the window (`unlodge`) and bumps the ceiling (`ceil`). His phone floats out of reach (`phone0`, `miss`).
# The guard swims over (`swim0`) and snaps cuffs on air (`aircuff`). Only his shadow stays on the floor. The moon (`moon`) pulls (`pull`).
ev.update(drop=P('l001', 1), slide0=P('l002') - 0.1, slide1=E('l002', 0) + 0.1, stick=P('l002', 1) + 0.4, shake0=P('l003', 1), push=P('l003', 2) + 0.2,
          quake0=P('l004') - 0.1, collapse=P('l004', 1) + 0.15, quake1=E('l004') + 0.5, reveal22=P('l005', 1), escape=P('l006', 1) + 0.1,
          lift=P('l007') + 0.3, unlodge=P('l008', 1) - 0.1, ceil=P('l008', 2) + 0.4, plate=P('l009', 1), phone0=P('l010') + 0.2, miss=P('l010', 1) + 0.3,
          swim0=P('l008'), aircuff=P('l011', 1) + 0.15, moon=P('l013'), pull=P('l013', 1), black=E('l013') + 1.3, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
# TODO one entry per cut, (name, time), in order. Cut L (0.2 s) before a sentence and 0.05–0.08 s before a line's second card;
#      a silent beat that shows a new picture is its own shot (≥ 0.5 s: raise that line's gap in epN_gaps.txt, do not squeeze the shot).
SHOTS = [('open', 0.0), ('cloak', P('l001', 1) - .06), ('slide', P('l002') - L), ('stick', P('l002', 1) - .06), ('earth', P('l003') - L),
         ('earth2', P('l003', 1) - .06), ('aim', P('l003', 2) - .06), ('quake', P('l004') - L), ('collapse', P('l004', 1) - .06), ('wrong', P('l005') - L),
         ('cell22', P('l005', 1) - .06), ('gravity', P('l006') - L), ('escape', P('l006', 1) - .06), ('lift', P('l007') - L), ('lift2', P('l007', 1) - .06),
         ('man', P('l008') - L), ('unlodge', P('l008', 1) - .06), ('ceiling', P('l008', 2) - .06), ('plate', P('l009') - L), ('phone', P('l010') - L),
         ('miss', P('l010', 1) - .06), ('swim', P('l011') - L), ('aircuff', P('l011', 1) - .06), ('allfloat', P('l012') - L), ('shadow', P('l012', 1) - .06),
         ('stuck', P('l012', 2) - .06), ('moon', P('l013') - L), ('pull', P('l013', 1) - .06), ('pull2', E('l013') + 0.2)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 48 * FPS, TOTAL / FPS   # series 2: Nox lifted the 30 s cap (series2_bible.md)
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep24/ep24_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
