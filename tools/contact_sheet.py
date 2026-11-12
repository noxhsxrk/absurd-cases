"""contact sheet: 3 frames per shot (15/50/90 %) from a draft render. usage: contact_sheet.py timeline.json draft.mp4 out.png"""
import json, subprocess, sys
tl = json.load(open(sys.argv[1], encoding='utf-8'))
fr = [s['from'] + int(s['dur'] * p) for s in tl['shots'] for p in (0.15, 0.5, 0.9)]
sel = '+'.join(r'eq(n\,%d)' % f for f in fr)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', sys.argv[2], '-vf', f"select='{sel}',scale=216:-1,tile=9x6", '-fps_mode', 'passthrough', '-frames:v', '1', sys.argv[3]], check=True)
