"""Bring Nox's narration take into the repo. usage: voice_in.py N <take.wav>
Copies it to public/absurd-cases/epN/raw/narration_fenrir.wav and writes n16.wav (16 kHz, for Whisper) and n24.wav (24 kHz, for tighten_take.py).
The conversion also repairs the broken header Gemini writes (nAvgBytesPerSec), which is why nothing should read the original directly."""
import sys, shutil, subprocess, pathlib
n, src = sys.argv[1], pathlib.Path(sys.argv[2]); ROOT = pathlib.Path(__file__).resolve().parent.parent
d = ROOT / f'public/absurd-cases/ep{n}/raw'; d.mkdir(parents=True, exist_ok=True); raw = d / 'narration_fenrir.wav'
if src.resolve() != raw.resolve(): shutil.copy(src, raw)
for sr in (16000, 24000): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-ar', str(sr), '-ac', '1', str(d / f'n{sr // 1000}.wav')], check=True)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(d / 'n24.wav')], capture_output=True, text=True).stdout)
print(f'ep{n}: take {dur:.2f} s -> {d}')
print(f'next: PYTHONUTF8=1 tools/ai-sfx/.venv/Scripts/python.exe tools/ai-sfx/segments.py {n} 0.15   then   python tools/make_cuts.py {n}')
