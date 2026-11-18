#!/usr/bin/env python3
"""absurd-cases EP21 timing plan (แก๊งห้อง 24 ตอน 2 · แหกคุกได้ครึ่งตัว): the one source of timing -> public/absurd-cases/ep21/ep21_timeline.json
Line timing from ep21_line_timing.json (Nox's AI Studio take cut with tools/tighten_take.py; visual beats live in ep21_gaps.txt)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 2.1                     # cliffhanger: the foam closes round his hand, then black
script = json.load(open(HERE / 'ep21_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep21_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', '').replace('!', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': l.get('titleCard')})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'ep21-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'ep21-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)
L = 0.2   # ref6: a cut leads its sentence by 5–9 frames
# the plan diagram on the wall, the bite in the beat after l002; first call: guard's phone rings in the beat after l004, he answers, and on
# l005 HE takes it back (covers the phone, waves no). The swarm comes in on l006, he deflates over l007 (flat 0→1), slides sideways into the
# bars on l008 and stops half out (`stuck`). Second call is never withdrawn: the guard turns, masks up, fogs the block; the swarm flees out
# the window with his blood; the guard pinches one out of the fog and cuffs it. Fog clears, every cell stares. Night. Bubbles. Foam on his hand.
ev.update(offer=P('l002') + 0.1, bite=E('l002') + 0.15, full=E('l002') + 0.7, plate=P('l003', 1), dial=P('l004') + 0.15, ring=E('l004') + 0.12, answer=E('l004') + 0.45,
          retract=P('l005') + 0.15, gdown=P('l005') + 0.7, mqOut=P('l006') + 0.15, swarm=P('l006', 1), flat0=P('l007'), flatB=P('l007', 1), flat1=E('l007') + 0.2,
          turn=P('l008') + 0.05, slide=P('l008') + 0.3, stuck=P('l008', 1) + 0.35, itch=P('l009'), scratch=E('l009') + 0.1,
          plate2=P('l010', 1), plate3=P('l010', 2), dial2=P('l011') + 0.1, ring2=P('l011') + 0.3, answer2=E('l011') + 0.05, firm=P('l012', 1),
          mask=P('l012', 1) + 0.15, fogOn=P('l013') + 0.25, fogAll=P('l013', 1), flee=P('l014'), out=P('l014', 1), catch=P('l015') + 0.35,
          cuff=P('l015', 1) + 0.3, clear=P('l016') - 1.1, stare=P('l016', 1), night=P('l017') - 0.3, bubbles=E('l017') + 0.15,
          touch=P('l018', 1) + 0.15, grip=P('l018', 1) + 0.55, black=E('l018') + 1.5, end=E(LAST))
ev = {k: round(v, 3) for k, v in ev.items()}
SHOTS = [('open', 0.0), ('offer', P('l002') - L), ('diagram', P('l002', 1) - .06), ('bite', E('l002') + 0.05), ('charge', P('l003') - L),
         ('phone', P('l004') - L), ('guard', E('l004') + 0.05), ('retract', P('l005') - L), ('callkin', P('l006') - L), ('swarm', P('l006', 1) - .06),
         ('cloud', P('l007') - L), ('flat', P('l007', 1) - .06), ('slide', P('l008') - L), ('half', P('l008', 1) - .06), ('itch', P('l009') - L),
         ('scratch', E('l009') + 0.05), ('charge2', P('l010') - L), ('phone2', P('l011') - L), ('firm', P('l012') - L), ('mask', P('l012', 1) - .06),
         ('fogger', P('l013') - L), ('fogall', P('l013', 1) - .06), ('flee', P('l014') - L), ('window', P('l014', 1) - .06), ('catch', P('l015') - L),
         ('cuffs', P('l015', 1) - .06), ('halfout', P('l016') - L), ('night', P('l017') - L), ('bubbles', E('l017') + 0.05), ('grab', P('l018', 1) - .06)]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert all(s['dur'] >= 12 for s in shots), [s for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [s for s in shots if s['dur'] > 105]
assert TOTAL <= 45 * FPS, TOTAL / FPS   # series 2: Nox lifted the 30 s cap (series2_bible.md)
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'fenrir-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/absurd-cases/ep21/ep21_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
for s in shots: print(f"{s['name']:12s} {s['t0']:6.2f} {s['dur']/FPS:5.2f}")
