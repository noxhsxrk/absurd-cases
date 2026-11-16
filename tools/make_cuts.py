"""Turn the speech segments of a take into the cut file tighten_take.py wants. usage: make_cuts.py N [force]
Reads tools/ai-sfx/epN_segments.json (segments.py) and episodes/absurd-cases/epN_script.json, writes episodes/absurd-cases/epN_cuts_fenrir.json
and, if it does not exist yet, epN_gaps.txt with 0.2 s before every line (then raise the gaps where the picture needs a silent beat).

It only works when there is exactly one segment per caption card, in order: that is the one thing to check in the table it prints
(left = what Whisper heard, right = the card). If the counts differ it stops and shows both lists:
  more segments than cards -> a breath split a card: rerun segments.py with a larger mingap, or merge the two rows in epN_segments.json
  fewer segments than cards -> two cards were read without a pause: rerun with a smaller mingap (0.1), or find the boundary by
                               transcribing sub-ranges (segments.py N a,b) and split the row by hand
Edges are moved into the silence (line start −0.05 s, line end +0.06 s, 0.04 s kept on each side of a comma pause) so no word is clipped;
tighten_take.py gets that air back with inner=0.12. A pause you want to keep longer is a third number on its split: [a, b, 0.3]."""
import json, sys, pathlib
N = sys.argv[1]; ROOT = pathlib.Path(__file__).resolve().parent.parent
SER = __import__('os').environ.get('SERIES', 'absurd-cases'); TAG = '' if SER == 'absurd-cases' else SER + '-'   # SERIES=in-this-town for the second series
E = ROOT / f'episodes/{SER}'
seg = json.load(open(ROOT / f'tools/ai-sfx/{TAG}ep{N}_segments.json', encoding='utf-8')); script = json.load(open(E / f'ep{N}_script.json', encoding='utf-8'))['lines']
cards = [(l['id'], c[0]) for l in script for c in l['cards']]
if len(seg) != len(cards):
    print(f'{len(seg)} segments but {len(cards)} cards. ' + ('A breath split a card: rerun segments.py with a larger mingap (0.2), or merge the two rows in the segments json.' if len(seg) > len(cards) else 'Two cards were read without a pause: rerun segments.py with a smaller mingap (0.1), or transcribe sub-ranges (segments.py N a,b) to find the boundary and split that row by hand.') + '\n')
    for i in range(max(len(seg), len(cards))):
        s = seg[i] if i < len(seg) else ['', '', '']; c = cards[i] if i < len(cards) else ('', '')
        print(f'{str(s[0]):>6} {str(s[1]):>6}  {s[2]:<34} | {c[0]:<10} {c[1]}')
    sys.exit(1)
out = {'_note': f'EP{N}: ranges and comma pauses from the take\'s silences (tools/ai-sfx/segments.py); edges padded into the silence by tools/make_cuts.py.'}
i = 0
for l in script:
    n = len(l['cards']); s = seg[i:i + n]; i += n
    out[l['id']] = {'range': [round(max(0, s[0][0] - 0.05), 2), round(s[-1][1] + 0.06, 2)], 'splits': [[round(a[1] + 0.04, 2), round(b[0] - 0.04, 2)] for a, b in zip(s, s[1:])]}
    for (a, b, heard), c in zip(s, l['cards']): print(f'{a:6.2f} {b:6.2f}  {heard:<34} | {l["id"]:<10} {c[0]}')
ids = [l['id'] for l in script]
for a, b in zip(ids, ids[1:]): assert out[a]['range'][1] <= out[b]['range'][0], f'{a} runs into {b}: the padded edges overlap, the gap between these lines is under 0.11 s'
p = E / f'ep{N}_cuts_fenrir.json'
if p.exists() and 'force' not in sys.argv[2:]: print(f'\n{p.name} exists: not overwritten (pass "force" to replace it and lose hand edits)')
else: json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print(f'\nwrote {p.name}')
g = E / f'ep{N}_gaps.txt'
if not g.exists(): g.write_text(','.join(f'{x}:0.2' for x in ids[1:])); print(f'wrote {g.name} (0.2 s before every line: raise the ones before a silent picture beat to 0.5–1.05)')
print(f'\nnext: PYTHONUTF8=1 python tools/tighten_take.py public/absurd-cases/ep{N}/raw/n24.wav episodes/absurd-cases/ep{N}_cuts_fenrir.json public/absurd-cases/ep{N}/ep{N}_narration_tight.wav episodes/absurd-cases/ep{N}_line_timing.json 0.12 $(cat episodes/absurd-cases/ep{N}_gaps.txt)')
