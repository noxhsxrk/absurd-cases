"""Speech segments of an episode's narration take, from its silences (RMS 10 ms, max −38 dB, gaps ≥ MINGAP s), each transcribed by Whisper on its own.
usage: segments.py N [mingap=0.3] [a,b a,b ...]     (run with tools/ai-sfx/.venv/Scripts/python.exe and PYTHONUTF8=1)
  N       episode number: reads public/absurd-cases/epN/raw/n16.wav (tools/voice_in.py writes it), writes tools/ai-sfx/epN_segments.json
  mingap  0.15 finds the comma pauses of a brisk take (one segment per caption card is the goal); 0.3 only the sentence gaps
  a,b     explicit ranges: transcribe just those sub-clips (to find where a card with no pause ends)
Whisper's Thai is only a check that each segment is the phrase you expect: it mishears words (EP17: ในตู้เย็น → นายตูจริง). Trust the order, not the spelling."""
import sys, json, pathlib, numpy as np, scipy.io.wavfile as wf, torch
from transformers import pipeline
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
N = sys.argv[1]; args = sys.argv[2:]
sr, x = wf.read(ROOT / f'public/absurd-cases/ep{N}/raw/n16.wav'); x = x.astype('float32') / 32768
mingap = float(args[0]) if args and ',' not in args[0] else 0.3; rng = [tuple(map(float, a.split(','))) for a in args if ',' in a]; explicit = bool(rng)
if not rng:
    h = sr // 100; e = np.sqrt(np.mean(x[:len(x) // h * h].reshape(-1, h) ** 2, 1)); on = 20 * np.log10(e + 1e-9) > 20 * np.log10(e.max()) - 38
    i, w = 0, int(mingap * 100)
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j:j + w].any(): j += 1   # the segment runs on until a silence of at least mingap
            rng.append((i / 100, j / 100)); i = j
        else: i += 1
asr = pipeline('automatic-speech-recognition', model='openai/whisper-large-v3-turbo', torch_dtype=torch.float16, device='cuda:0')
out = []
for a, b in rng:
    t = asr({'raw': x[int(max(0, a - 0.05) * sr):int((b + 0.05) * sr)], 'sampling_rate': sr}, generate_kwargs={'language': 'thai', 'task': 'transcribe'})['text'].strip()
    out.append([round(a, 2), round(b, 2), t]); print(f'{a:6.2f} {b:6.2f} {b - a:5.2f}  {t}', flush=True)
if not explicit: json.dump(out, open(HERE / f'ep{N}_segments.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
