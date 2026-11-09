"""Queue an episode's Blender shots for the PC render watcher.
usage: python3 blender/queue_ep.py ep8 v1 [shot ...]   (no shots = every shot in eps/ep8.py that is in the timeline)
writes blender/queue/<ep>_<ver>_<nn>_<shot>.job -> plates land in public/absurd-cases/<ep>/plates/<shot>/<shot>.mp4"""
import sys, os, json, re
B = os.path.dirname(os.path.abspath(__file__)); ep, ver = sys.argv[1], sys.argv[2]; want = sys.argv[3:]
src = open(os.path.join(B, 'eps', ep + '.py')).read(); have = re.findall(r'^def shot_(\w+)\(', src, re.M)
tl = json.load(open(os.path.join(B, '..', 'public', 'absurd-cases', ep, f'{ep}_timeline.json')))
order = [s['name'] for s in tl['shots']]
shots = [s for s in order if s in have and (not want or s in want)]
os.makedirs(os.path.join(B, 'queue'), exist_ok=True)
for s in shots:
    out = f'..\\public\\absurd-cases\\{ep}\\plates\\{s}'
    p = os.path.join(B, 'queue', f'{ep}_{ver}_{order.index(s):02d}_{s}.job')
    open(p, 'w', newline='\r\n').write(f'eps/{ep}.py -- --shot {s} --mp4 --samples 64 --out {out}\n')
print(len(shots), 'jobs:', ' '.join(shots))
