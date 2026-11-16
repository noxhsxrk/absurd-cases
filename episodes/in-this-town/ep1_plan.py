#!/usr/bin/env python3
"""ในเมืองนี้ EP1 (หาว) timing plan: the one source of timing -> public/in-this-town/ep1/ep1_timeline.json
Line timing from ep1_line_timing.json (provisional until the voice exists: ep1_cards.py). Long-form series: no 30 s cap."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
FPS = 30
HOLD = 2.4                     # the closer: the TV in their dark room announces part two; live picture to the last frame
script = json.load(open(HERE / 'ep1_script.json', encoding='utf-8')); rows = json.load(open(HERE / 'ep1_line_timing.json'))
timing = {r['id']: r for r in rows}
lines, cards, ev = [], [], {}
for l in script['lines']:
    id = l['id']; key = id.split('-')[1]; T = timing[id]; parts = T['parts']
    lines.append({'id': id, 'key': key, 'text': l['text'].replace(',', ''), 't0': T['start'], 't1': T['end'], 'dur': round(T['end'] - T['start'], 3), 'title': None})
    assert len(parts) == len(l['cards']), id
    for i, ((text, hl), (a, b)) in enumerate(zip(l['cards'], parts)):
        cards.append({'id': f'{key}c{i}', 'line': key, 'text': text, 'hl': hl, 't0': round(a, 3), 't1': round(b + 0.12, 3)})
P = lambda k, i=0: timing[f'town1-{k}']['parts'][i][0]
E = lambda k, i=-1: timing[f'town1-{k}']['parts'][i][1]
for a, b in zip(cards, cards[1:]):
    if b['t0'] - a['t1'] < 0.3: a['t1'] = b['t0']
speech = E('l045')
L = 0.2   # a cut leads its sentence by ~6 frames
# ---- events (act 1 so far; later acts get theirs when their shots are written)
ev.update(
    torch=P('l001') + 0.15,                                   # she clicks the torch on under her chin
    yawn1=P('l002', 1) + 0.1, drop1=P('l002', 2) + 0.35,      # a passer-by yawns; the sun drops one notch on "ตก"
    yawn2a=P('l003') - 0.1, drop2a=P('l003') + 0.4, drop2b=P('l003', 1) + 0.45,
    sip=P('l005', 1) + 0.1, bell=P('l006', 1) + 0.9, snip=P('l007') + 0.55, stamp=P('l007', 1) + 0.12,
    camTurn=P('l008', 1) + 0.1, yawnSt=P('l009') - 0.15, flash=P('l009') + 0.35, tape=P('l009', 1) + 0.35,
    word=P('l010', 1) + 0.35,
    s10=P('l020'), yawnU=P('l020', 1) + 0.15, dropU=E('l020') + 0.4, s50=P('l021'), yawnUnit=P('l021', 2) - 0.15, tapeU=P('l021', 2) + 0.4, dropUnit=P('l021', 2) + 0.45,
    s200=P('l022'), mass=P('l022', 1) + 0.1, plunge=P('l023') + 0.15, cal1=P('l023', 1), cal1e=E('l023'), s300=P('l027'), app1=P('l027', 1),
    curtain=P('l028') + 0.3, dawn30=P('l033', 1) + 0.1, shout30=P('l032') + 0.9, gavel30=P('l034') + 0.5, shut30=P('l034', 1) + 0.95,
    grab=P('l035') + 0.45, climb=P('l036') + 0.1, turn=P('l037', 1) + 0.05, shout=P('l037', 2), gasp=P('l038', 1) - 0.05, count0=P('l039'), rise=P('l039', 1) + 0.12,
    cal2=P('l040', 2), cal2e=E('l040'), gavel=P('l042') + 1.05, tvOn=P('l045') - 0.1, yaiYawn=E('l045') + 0.55,
    end=E('l045'))
ev = {k: round(v, 3) for k, v in ev.items()}
c = lambda k, i: P(k, i) - .06          # a cut on a line's later card
m = lambda k, d: P(k) + d                # a cut inside a one-phrase card (the take read it without a pause)
SHOTS = [
 # act 1 — the town and its rule
 ('open', 0.0), ('curtains', c('l001', 1)), ('yaiTorch', c('l001', 2)),
 ('street', P('l002') - L), ('yawner', c('l002', 1)), ('sunDrop', c('l002', 2)),
 ('yawnTwice', P('l003') - L), ('sunDrop2', c('l003', 1)),
 ('wideEyed', P('l004') - L),
 ('crib', P('l005') - L), ('bottle', c('l005', 1)),
 ('school', P('l006') - L), ('bell', c('l006', 1)),
 ('book', P('l007') - L), ('illegal', c('l007', 1)),
 ('lamppost', P('l008') - L), ('camera', c('l008', 1)),
 ('caught', P('l009') - L), ('tape', c('l009', 1)),
 ('sign', P('l010') - L), ('word', c('l010', 1)),
 ('yaiDoor', P('l011') - L), ('yaiChair', m('l011', 0.55)), ('layers', c('l011', 1)),
 ('wall', P('l012') - L), ('photo', m('l012', 0.8)), ('megaphone', c('l012', 1)),
 ('gossip', P('l013') - L), ('gossipCU', c('l013', 1)), ('yaiWindow', P('l014') - L), ('windowCU', m('l014', 0.6)),
 # act 2 — the new leader
 ('hall', P('l015') - L), ('boss', c('l015', 1)),
 ('podium', P('l016') - L), ('tvTown', c('l016', 1)),
 ('slide1', P('l017') - L), ('stack', c('l017', 1)),
 ('clapHall', P('l018') - L), ('clapHome', m('l018', 0.5)),
 ('kidTV', P('l019') - L), ('tally', c('l019', 1)),
 ('slide10', P('l020') - L), ('uncle', c('l020', 1)), ('sunDrop3', E('l020') + 0.1),
 ('slide50', P('l021') - L), ('unit', c('l021', 1)), ('unitYawn', c('l021', 2)),
 ('slide200', P('l022') - L), ('massYawn', c('l022', 1)),
 ('sunGone', P('l023') - L), ('calendar', c('l023', 1)),
 ('rooster', P('l024') - L), ('roosterBox', m('l024', 0.6)),
 ('trees', P('l025') - L), ('treesLean', m('l025', 0.75)),
 ('drawing', P('l026') - L), ('drawingCU', c('l026', 1)),
 ('stillBoss', P('l027') - L), ('appendix', c('l027', 1)),
 # act 3 — the secret
 ('curtainOpen', P('l028') - L), ('yaiFace', c('l028', 1)),
 ('yaiTells', P('l029') - L), ('diagramYawn', c('l029', 1)),
 ('diagramGasp', P('l030') - L), ('diagramUp', c('l030', 1)),
 ('flashback', P('l031') - L), ('fiveDays', c('l031', 1)),
 ('youngYai', P('l032') - L), ('megaphone30', m('l032', 1.15)),
 ('gasp30', P('l033') - L), ('dawn30', c('l033', 1)),
 ('court30', P('l034') - L), ('sentence30', c('l034', 1)), ('curtainShut', P('l034', 1) + 0.75),
 # act 4 — the move
 ('borrow', P('l035') - L),
 ('climb', P('l036') - L), ('onAir', c('l036', 1)),
 ('kidMic', P('l037') - L), ('bossTurns', c('l037', 1)), ('boring', c('l037', 2)),
 ('townGasp', P('l038') - L), ('bossGasp', c('l038', 1)),
 ('count', P('l039') - L), ('sunRise', c('l039', 1)),
 ('blaze', P('l040') - L), ('clockSpin', c('l040', 1)), ('calendar2', c('l040', 2)),
 ('insomnia', P('l041') - L), ('insomniaWide', E('l041') + 0.15),
 # act 5 — the sentence, and part two
 ('courtKid', P('l042') - L), ('gavel', m('l042', 0.75)),
 ('darkRoom', P('l043') - L), ('together', c('l043', 1)), ('togetherWide', P('l043', 1) + 0.75),
 ('yaiSays', P('l044') - L), ('yaiSmile', c('l044', 2)),
 ('tvPart2', P('l045') - L), ('part2', c('l045', 2)), ('yaiYawn', E('l045') + 0.3),
]
TOTAL = round((speech + HOLD) * FPS)
fr = [round(t * FPS) for _, t in SHOTS] + [TOTAL]
shots = [{'name': n, 'from': fr[i], 'dur': fr[i + 1] - fr[i], 't0': round(fr[i] / FPS, 3), 't1': round(fr[i + 1] / FPS, 3)} for i, (n, _) in enumerate(SHOTS)]
assert len({n for n, _ in SHOTS}) == len(SHOTS), 'duplicate shot name'
assert all(s['dur'] >= 12 for s in shots), [(s['name'], s['dur']) for s in shots if s['dur'] < 12]
assert all(s['dur'] <= 105 for s in shots), [(s['name'], s['dur']) for s in shots if s['dur'] > 105]
out = {'fps': FPS, 'total': TOTAL, 'speechEnd': speech, 'source': 'provisional' if rows[0].get('provisional') else 'voice-tight', 'events': ev, 'lines': lines, 'cards': cards, 'shots': shots}
p = ROOT / 'public/in-this-town/ep1/ep1_timeline.json'; p.parent.mkdir(parents=True, exist_ok=True); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(out['source'], 'total', TOTAL, 'frames', round(TOTAL / FPS, 2), 's; shots', len(shots), 'ASL', round(TOTAL / FPS / len(shots), 2), 'cards', len(cards))
