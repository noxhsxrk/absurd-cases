#!/usr/bin/env python3
"""absurd-cases EP25 timing plan (แก๊งห้อง 24 ตอน 6 · ดาวบริวาร): the one source of timing -> public/absurd-cases/ep25/ep25_timeline.json
Line timing from ep25_line_timing.json (Gemini TTS Fenrir, one call per line via tools/gemini_take.py --per-line, cut with tools/tighten_take.py; visual beats live in ep25_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # cliffhanger: the fridge door of 23 swings open, the fire inside flares, then black
script = json.load(open(HERE / 'ep25_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep25_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep25-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep25-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# night, where EP24 stopped: the Moon pulls him off the ceiling of 24; on the way he grabs his floating phone (`grab`), slides out between
# the bars (`out24`), along the corridor and in between the bars of 18 (`in18`), and drops into orbit round the Earth (`orbit0`). The orbit is
# tuned so he passes the front of 18, nearest the bars, exactly at `cuff1`; the Moon trails 0.35 s behind (`cuff2`). Kidnapping! He calls
# (`dial`); the line drops every time he goes behind the Earth; he redials to the twelfth call (`redial0`…`redial1`). The guard swims over from
# 22 (`swim0`…`garrive`), reaches through the bars (`reach`), cuffs his wrist (`cuff1`) and the other ring onto the Moon (`cuff2`). That night
# the door of the floating fridge in 23 swings open (`door`), black.
ev.update(grab=P('l001') + 0.9, out24=P('l001', 1) - 0.1, in18=P('l001', 1) + 1.6, orbit0=P('l002'), plate=P('l004', 1), dial=P('l005') + 0.1,
          redial0=P('l007'), redial1=P('l007', 1) + 0.8, swim0=P('l006'), garrive=P('l008') + 0.9, reach=P('l008', 1) + 0.2,
          cuff1=P('l009') + 0.35, cuff2=P('l009') + 0.7, door=P('l011', 2) + 0.2, black=E('l011') + 1.3, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('open', 0.0), ('bars', P('l001', 1) - .06), ('into18', P('l001', 1) + 1.1), ('orbit', P('l002') - L), ('tidal', P('l002', 1) - .06), ('lap', P('l003') - L),
         ('dizzy', P('l003', 1) - .06), ('plate', P('l004') - L), ('call', P('l005') - L), ('drop', P('l006') - L), ('behind', P('l006', 1) - .06), ('behind2', P('l006', 1) + 1.3),
         ('redial', P('l007') - L), ('count12', P('l007', 1) - .06), ('guardfly', P('l008') - L), ('reach', P('l008', 1) - .06), ('snap1', P('l009') - L),
         ('snap2', P('l009', 1) - .06), ('since', P('l010') - L), ('pair', P('l010', 1) - .06), ('coorbit', P('l010', 2) - .06), ('topdown', P('l010', 2) + 1.3), ('night', P('l011') - L),
         ('fridge', P('l011', 1) - .06), ('door', P('l011', 2) - .06), ('fire', E('l011') + 0.2)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 48 * FPS, TOTAL / FPS   # series 2: Nox lifted the 30 s cap (series2_bible.md)
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep25/ep25_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
