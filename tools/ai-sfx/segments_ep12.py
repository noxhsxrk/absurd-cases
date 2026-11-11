"""EP11 narration: speech segments from silences (RMS 10 ms, max-38 dB, gaps >= MINGAP s), each transcribed by Whisper on its own.
usage: segments_ep12.py [mingap=0.3] [a,b a,b ...]   (explicit ranges: transcribe just those sub-clips)"""
import sys, json, pathlib, numpy as np, scipy.io.wavfile as wf, torch
from transformers import pipeline
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
sr, x = wf.read(ROOT / 'public/absurd-cases/ep12/raw/n16.wav'); x = x.astype('float32') / 32768
args = sys.argv[1:]; mingap = float(args[0]) if args and ',' not in args[0] else 0.3; rng = [tuple(map(float, a.split(','))) for a in args if ',' in a]
if not rng:
    h = sr // 100; e = np.sqrt(np.mean(x[:len(x) // h * h].reshape(-1, h) ** 2, 1)); on = 20 * np.log10(e + 1e-9) > 20 * np.log10(e.max()) - 38
    segs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and (on[j] or not on[j:j + int(mingap * 100)].any() is False and on[j:j + int(mingap * 100)].any()): j += 1
            segs.append((i / 100, j / 100)); i = j
        else: i += 1
    rng = segs
asr = pipeline('automatic-speech-recognition', model='openai/whisper-large-v3-turbo', torch_dtype=torch.float16, device='cuda:0')
out = []
for a, b in rng:
    t = asr({'raw': x[int(max(0, a - 0.05) * sr):int((b + 0.05) * sr)], 'sampling_rate': sr}, generate_kwargs={'language': 'thai', 'task': 'transcribe'})['text'].strip()
    out.append([round(a, 2), round(b, 2), t]); print(f'{a:6.2f} {b:6.2f} {b - a:5.2f}  {t}', flush=True)
json.dump(out, open(HERE / 'ep12_segments.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
