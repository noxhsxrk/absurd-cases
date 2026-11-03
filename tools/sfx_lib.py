#!/usr/bin/env python3
"""Kit sound library CLI (library/sfx/*.flac + catalog.json).

  python3 tools/sfx_lib.py list                     # every cue with duration / attack / peak-at / use
  python3 tools/sfx_lib.py list horror              # one category (ambience world people foley impacts horror signals)
  python3 tools/sfx_lib.py find glass               # search names and uses
  python3 tools/sfx_lib.py pull public/<slug>/ep1/sfx glass_hit=foley/glass_hit sub_boom=impacts/sub_boom train_bed=ambience/train_interior_bed
        -> writes <dir>/<cue>.wav (48 kHz, original channels) for the premix; existing files are kept unless --force
  python3 tools/sfx_lib.py add <file.wav> <category>/<name> "use note" [as|synth]   # put a new pick into the library
"""
import json, pathlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
LIB = ROOT / 'library/sfx'; CAT = LIB / 'catalog.json'

def load(): return json.load(open(CAT))
def show(rows):
    for r in rows: print(f"{r['name']:38s} {r['dur']:6.2f}s  ch{r['ch']}  attack {r['attack_s']:5.2f}  peak@{r['peak_at_s']:6.2f}  {r['centroid_hz']:5d} Hz  {r['use']}")

def main(a):
    if not a or a[0] in ('-h', '--help'): print(__doc__); return
    cmd = a[0]
    if cmd == 'list': show([r for r in load() if len(a) < 2 or r['name'].startswith(a[1] + '/')])
    elif cmd == 'find': q = a[1].lower(); show([r for r in load() if q in r['name'].lower() or q in r['use'].lower()])
    elif cmd == 'pull':
        dst = pathlib.Path(a[1]); dst.mkdir(parents=True, exist_ok=True); force = '--force' in a
        for spec in [s for s in a[2:] if '=' in s]:
            cue, name = spec.split('=', 1); src = LIB / f'{name}.flac'; out = dst / f'{cue}.wav'
            if not src.exists(): print('missing', name); continue
            if out.exists() and not force: print('keep', out); continue
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(src), '-ar', '48000', '-c:a', 'pcm_s16le', str(out)], check=True); print('wrote', out)
    elif cmd == 'add':
        src, name, note = a[1], a[2], a[3]; origin = a[4] if len(a) > 4 else 'as'
        out = LIB / f'{name}.flac'; out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-c:a', 'flac', '-sample_fmt', 's16', '-compression_level', '8', str(out)], check=True)
        sys.path.insert(0, str(ROOT / 'tools')); import numpy as np; from mixlib import read, R
        x = read(out, stereo=True); m = np.abs(x).max(1); pk = m.max()
        sp = np.abs(np.fft.rfft(x.mean(1)[:R * 8])); f = np.fft.rfftfreq(min(len(x), R * 8), 1 / R)
        p = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=sample_rate,channels', '-of', 'json', str(out)], capture_output=True, text=True).stdout)['streams'][0]
        rows = [r for r in load() if r['name'] != name]
        rows.append(dict(name=name, dur=round(len(x) / R, 2), ch=p['channels'], sr=int(p['sample_rate']), origin='audio-studio (Stable Audio 3)' if origin == 'as' else 'numpy synthesis',
                         use=note, from_=str(src), peak_db=round(20 * np.log10(pk), 1), rms_db=round(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12), 1),
                         attack_s=round(int(np.argmax(m > pk * 0.5)) / R, 3), peak_at_s=round(int(m.argmax()) / R, 2), centroid_hz=int((sp * f).sum() / (sp.sum() + 1e-9))))
        json.dump(sorted(rows, key=lambda r: r['name']), open(CAT, 'w'), ensure_ascii=False, indent=1)
        print('added', name, '— add a row to library/sfx/CATALOG.md too')
    else: print(__doc__)

if __name__ == '__main__': main(sys.argv[1:])
