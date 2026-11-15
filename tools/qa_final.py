"""QA on the file that is actually delivered. usage: qa_final.py N [file=out/absurd-epN.mp4]
Prints size / length / frame count against the timeline, loudness (target −15 LUFS, LRA ≤ 5, peak ≤ −1.5), every frame that barely differs
from the one before it (mean difference < 0.6 on a 108×192 grey copy = a frozen picture), and writes contact sheets of every 8th frame to
qa/epN/final_0.png, final_1.png, … Read those sheets: they are the proof that the delivered file is the film you think it is."""
import json, subprocess, re, sys, pathlib
import numpy as np
N = sys.argv[1]; ROOT = pathlib.Path(__file__).resolve().parent.parent; F = sys.argv[2] if len(sys.argv) > 2 else str(ROOT / f'out/absurd-ep{N}.mp4')
tl = json.load(open(ROOT / f'public/absurd-cases/ep{N}/ep{N}_timeline.json', encoding='utf-8')); Q = ROOT / f'qa/ep{N}'; Q.mkdir(parents=True, exist_ok=True)
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,nb_frames', '-of', 'json', F], capture_output=True, text=True).stdout)
v = next(s for s in pr['streams'] if s['codec_type'] == 'video'); has_audio = any(s['codec_type'] == 'audio' for s in pr['streams'])
print(f"{F}: {v['width']}x{v['height']}, {float(pr['format']['duration']):.2f} s, {v['nb_frames']} frames (timeline {tl['total']}), audio {'yes' if has_audio else 'NO - render_blur.py needs audio=…'}")
if has_audio:
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', F, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    print(' '.join(re.findall(r'(I:\s+-?[\d.]+ LUFS|LRA:\s+[\d.]+ LU|Peak:\s+-?[\d.]+ dBFS)', r[r.rfind('Summary:'):])))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', F, '-vf', 'scale=108:192,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 192, 108).astype(np.float32); d = np.abs(np.diff(fr, axis=0)).mean((1, 2)); shot = lambda f: next((s['name'] for s in tl['shots'] if s['from'] <= f < s['from'] + s['dur']), '?')
still = [int(i) + 1 for i in np.where(d < 0.6)[0]]
print(f'frame difference: min {d.min():.2f}, median {np.median(d):.2f}; nearly still frames: ' + (', '.join(f'{f} ({shot(f)})' for f in still[:30]) or 'none'))
idx = list(range(0, len(fr), 8)); cols, rows = 13, 4
for k in range(0, len(idx), cols * rows):
    sel = '+'.join(r'eq(n\,%d)' % f for f in idx[k:k + cols * rows]); p = Q / f'final_{k // (cols * rows)}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', F, '-vf', f"select='{sel}',scale=162:-1,tile={cols}x{rows}", '-fps_mode', 'passthrough', '-frames:v', '1', str(p)], check=True); print('sheet', p)
