"""Contact sheets from a draft render: 3 frames per shot (12 / 50 / 92 %), 7 shots (21 frames) per sheet at 270 px so faces and props can be read.
usage: contact_sheet.py timeline.json draft.mp4 out.png [shot,shot,…]
Writes out_0.png, out_1.png, … (one row of three frames per shot, shots in timeline order) and prints which shots are on which sheet.
Pass shot names to sheet only those (after fixing two shots there is no need to look at all twenty again)."""
import json, subprocess, sys, pathlib
tl = json.load(open(sys.argv[1], encoding='utf-8')); out = pathlib.Path(sys.argv[3]); only = set(sys.argv[4].split(',')) if len(sys.argv) > 4 else None
shots = [s for s in tl['shots'] if not only or s['name'] in only]
PER = 7
for k in range(0, len(shots), PER):
    part = shots[k:k + PER]; fr = [s['from'] + int(s['dur'] * p) for s in part for p in (0.12, 0.5, 0.92)]
    sel = '+'.join(r'eq(n\,%d)' % f for f in fr); p = out.with_name(f'{out.stem}_{k // PER}{out.suffix}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', sys.argv[2], '-vf', f"select='{sel}',scale=270:-1,tile=6x{(len(fr) + 5) // 6}", '-fps_mode', 'passthrough', '-frames:v', '1', str(p)], check=True)
    print(p, '<-', ' '.join(s['name'] for s in part))
