"""Motion-blurred render: render the <id>Blur composition (FPS x SUB sub-frames, see BLUR_SUB in the episode) and average each group of SUB
sub-frames into one 30 fps frame. Cuts stay hard because every group lies inside one 30 fps frame.
usage: python tools/render_blur.py AbsurdEp15 out/absurd-ep15.mp4 [sub=6] [open=5] [frames=a-b (30 fps frame range, for a test)] [audio=mix.wav]
open = how many of the SUB sub-frames are averaged (shutter: open/sub x 360 degrees)."""
import subprocess, sys, pathlib
cid, out = sys.argv[1], pathlib.Path(sys.argv[2]); kw = dict(a.split('=') for a in sys.argv[3:])
sub, op = int(kw.get('sub', 6)), int(kw.get('open', 5)); tmp = out.with_name(out.stem + '_sub.mp4')
cmd = f'pnpm exec remotion render src/index.ts {cid}Blur "{tmp}" --gl=angle --props=render/props_full.json --crf=8 --log=error'
if 'frames' in kw: a, b = map(int, kw['frames'].split('-')); cmd += f' --frames={a * sub}-{b * sub + sub - 1}'
subprocess.run(cmd, shell=True, check=True)
w = ' '.join(['1'] * op + ['0'] * (sub - op))
vf = f"tmix=frames={sub}:weights='{w}',select='eq(mod(n\,{sub})\,{sub - 1})',setpts=N/(30*TB)"
au = ['-i', kw['audio']] if 'audio' in kw else []   # the sub-frame render's own audio is at the wrong rate: mux the mix here
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp), *au, '-vf', vf, '-r', '30', '-map', '0:v', *(['-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-shortest'] if au else ['-an']), '-c:v', 'libx264', '-crf', '15', '-pix_fmt', 'yuv420p', str(out)], check=True)
tmp.unlink(); print('ok', out)
