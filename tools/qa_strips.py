"""Consecutive frames round every action, from the delivered file. usage: qa_strips.py N [file=out/absurd-epN.mp4] [event,event,…]
For each event in the timeline (all of them, or the ones named) it takes six frames (−4, −2, 0, +2, +4, +7 round the event) at 480 px and
stacks two events per image: qa/epN/strip_00.png, … and prints which events are on which image.

This is the check contact sheets cannot do. Thumbnails every 8 frames show that a shot exists; they do not show a hand inside a chest,
a gavel landing on air, a fork that misses the mouth, or an arm that reads as the wrong person's. Open every image and, for each event,
ask: does the thing that the narration says happens visibly happen, does the contact land, is every limb outside every body, and whose
hand is it? EP17 found four problems this way after the thumbnails had all looked fine."""
import json, subprocess, sys, pathlib
N = sys.argv[1]; ROOT = pathlib.Path(__file__).resolve().parent.parent; rest = sys.argv[2:]
F = next((a for a in rest if a.endswith('.mp4')), str(ROOT / f'out/absurd-ep{N}.mp4')); only = next((set(a.split(',')) for a in rest if not a.endswith('.mp4')), None)
tl = json.load(open(ROOT / f'public/absurd-cases/ep{N}/ep{N}_timeline.json', encoding='utf-8')); Q = ROOT / f'qa/ep{N}'; Q.mkdir(parents=True, exist_ok=True)
evs = sorted(((k, t) for k, t in tl['events'].items() if (not only or k in only) and 0 <= t * tl['fps'] < tl['total'] - 8), key=lambda x: x[1])
rows = []
for k, t in evs:
    f = round(t * tl['fps']); fr = [max(0, f + d) for d in (-4, -2, 0, 2, 4, 7)]; sel = '+'.join(r'eq(n\,%d)' % x for x in fr); p = Q / f'_row_{k}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', F, '-vf', f"select='{sel}',scale=480:-1,tile=6x1", '-fps_mode', 'passthrough', '-frames:v', '1', str(p)], check=True); rows.append((k, f, p))
for i in range(0, len(rows), 2):
    pair = rows[i:i + 2]; out = Q / f'strip_{i // 2:02d}.png'
    if len(pair) == 2: subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(pair[0][2]), '-i', str(pair[1][2]), '-filter_complex', 'vstack', '-frames:v', '1', str(out)], check=True)
    else: pair[0][2].replace(out)
    print(out, '<-', ' | '.join(f'{k} (frame {f})' for k, f, _ in pair))
for _, _, p in rows: p.unlink(missing_ok=True)
