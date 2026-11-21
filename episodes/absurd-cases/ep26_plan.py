#!/usr/bin/env python3
"""absurd-cases EP26 timing plan (แก๊งห้อง 24 ตอน 6 · ดาวบริวาร): the one source of timing -> public/absurd-cases/ep26/ep26_timeline.json
Line timing from ep26_line_timing.json (Gemini TTS Fenrir, one call per line via tools/gemini_take.py --per-line, cut with tools/tighten_take.py; visual beats live in ep26_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 1.8                     # cliffhanger: the block with no guard, everyone turned to the hole in 22, then black
script = json.load(open(HERE / 'ep26_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep26_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep26-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep26-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# TODO the events of THIS story. Tie every one to a card start P('l00X', i) or a card end E('l00X'), never to bare seconds, and name every moment
#      of contact (a bite, a slap, a door shutting): the shots, the mix and tools/qa_strips.py all look events up by name.
# night, weightless, where EP25 stopped: the fridge door in 23 is open, the fire flares (`flare`) and floats out (`fireout`); with no gravity
# it burns as a ball (`ball`). It drifts to the bars of 23 (`m23`), along to 22 (`m22`), back to 18 (`m18`): every bar it touches melts. In 18
# it hangs at the front of the orbit and the chain between his wrist and the Moon passes through it (`cut`): he flies off the orbit, out
# through the melted bars into the corridor (`free0`…`free1`). Helping a prisoner escape! He calls (`dial`); the guard, right there at 18,
# answers (`answer`), grabs the floating extinguisher (`grab`) and sprays the fire (`spray`); the recoil shoots him backwards along the corridor
# (`kick`), into 22 and out through the hole (`hole`). Outside there is gravity: he stops in the air (`hang`), the red arrow, he drops (`land`).
# The police outside run over (`run`) and cuff him (`cuff`) — escaping. That night the block has no guard; everyone turns to the hole (`look`).
ev.update(flare=P('l001') + 0.3, fireout=P('l001', 2) - 0.1, ball=P('l002', 1) - 0.2, m23=P('l003') + 0.2, m22=P('l003', 1) + 0.1, m18=P('l004') + 0.2,
          cut=P('l004', 1) + 0.45, free0=P('l004', 1) + 0.5, free1=P('l005', 1) + 1.0, plate=P('l006', 1), dial=P('l007') + 0.15,
          ring=P('l007') + 0.6, answer=P('l008') + 0.15, grab=P('l008', 1) + 0.15, spray=P('l008', 2) + 0.1, kick=P('l009', 1),
          hole=P('l010') + 0.7, out=P('l010', 1) - 0.1, hang=P('l011') + 0.1, land=P('l011', 1) + 0.35, run=P('l012') + 0.1,
          cuff=P('l012', 1) + 0.45, plate2=P('l012', 2), look=P('l013', 2), black=E('l013') + 1.3, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
# TODO one entry per cut, (name, time), in order. Cut L (0.2 s) before a sentence and 0.05–0.08 s before a line's second card;
#      a silent beat that shows a new picture is its own shot (≥ 0.5 s: raise that line's gap in epN_gaps.txt, do not squeeze the shot).
SHOTS = [('open', 0.0), ('fire', P('l001', 1) - .06), ('outfridge', P('l001', 2) - .06), ('ball', P('l002') - L), ('ballcu', P('l002', 1) - .06),
         ('drift', P('l003') - L), ('melt22', P('l003', 1) - .06), ('row', P('l003', 2) - .06), ('in18', P('l004') - L), ('chain', P('l004', 1) - .06),
         ('free', P('l005') - L), ('freeface', P('l005', 1) - .06), ('plate', P('l006') - L), ('call', P('l007') - L), ('ring', P('l008') - L),
         ('grab', P('l008', 1) - .06), ('spray', P('l008', 2) - .06), ('recoil', P('l009') - L), ('flyby', P('l009', 1) - .06), ('hole', P('l010') - L),
         ('outhole', P('l010', 1) - .06), ('hang', P('l011') - L), ('land', P('l011', 1) - .06), ('cops', P('l012') - L), ('cuff', P('l012', 1) - .06),
         ('charge2', P('l012', 2) - .06), ('night', P('l013') - L), ('look', P('l013', 2) - .06)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 50 * FPS, TOTAL / FPS   # series 2: Nox lifted the 30 s cap (series2_bible.md)
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep26/ep26_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
