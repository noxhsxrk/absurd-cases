"""Small contact sheets the Read tool can open (the rtk Read hook blocks big images, EP26): 3 frames per shot (12/50/92 %), PER shots per
jpg at W px wide, so each file stays ~100–250 'lines'. usage: mini_sheet.py timeline.json video.mp4 out_prefix [shot,shot,…] [W=200] [PER=2]
Writes out_prefix_00.jpg, _01.jpg … and prints each file's shots. For QA strips: sips -Z 900 -s format jpeg -s formatOptions 40 strip.png --out s.jpg"""
import json, subprocess, sys, pathlib
tl = json.load(open(sys.argv[1])); vid = sys.argv[2]; out = pathlib.Path(sys.argv[3]); only = set(sys.argv[4].split(',')) if len(sys.argv) > 4 and sys.argv[4] else None
W = int(sys.argv[5]) if len(sys.argv) > 5 else 200; PER = int(sys.argv[6]) if len(sys.argv) > 6 else 2
shots = [s for s in tl['shots'] if not only or s['name'] in only]
for k in range(0, len(shots), PER):
    part = shots[k:k + PER]; fr = [s['from'] + int(s['dur'] * p) for s in part for p in (0.12, 0.5, 0.92)]
    sel = '+'.join(r'eq(n\,%d)' % f for f in fr); p = out.with_name(f'{out.name}_{k // PER:02d}.jpg')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-vf', f"select='{sel}',scale={W}:-1,tile=3x{len(part)}", '-fps_mode', 'passthrough', '-frames:v', '1', '-q:v', '6', str(p)], check=True)
    print(p, ' '.join(s['name'] for s in part))
