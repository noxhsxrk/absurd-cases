#!/usr/bin/env python3
"""Pick one Gemini TTS take per narration line, because nobody listens before the render (EP23: words alone picked a take a
whole octave above the rest). For every Text line of episodes/absurd-cases/epN_voice_prompt.md it makes K takes with
tools/gemini_take.py's prompt, measures each one (Whisper match to the line, median pitch, speech level) and copies the best
to public/absurd-cases/epN/raw/gemini_lines/lNNN.wav; then run `python3 tools/gemini_take.py N --per-line` to join them.

  GEMINI_API_KEY=... tools/ai-sfx/.venv/bin/python tools/ai-sfx/voice_pick.py N [--k 4] [--only 3 7]
Score = Whisper similarity − pitch penalty (beyond ±15 % of the episode median) − level penalty (beyond ±2.5 dB)
− 0.15 per pause too many or too few (a card is cut at each comma's pause: EP24 2.5 Pro paused inside cards and ran two together).
Candidates stay in gemini_lines/alt/ (lNNN_k.wav) with picks.json, so a line can be swapped by hand later."""
import argparse, difflib, importlib.util, json, os, pathlib, re, shutil, sys, wave
import numpy as np, torch, librosa
from scipy.signal import resample_poly
from transformers import pipeline

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
spec = importlib.util.spec_from_file_location('gt', ROOT / 'tools/gemini_take.py'); gt = importlib.util.module_from_spec(spec); spec.loader.exec_module(gt)
NUM = [('ยี่สิบสี่', '24'), ('ยี่สิบสาม', '23'), ('ยี่สิบสอง', '22'), ('ยี่สิบ', '20'), ('สิบเก้า', '19'), ('สิบแปด', '18'), ('สิบสอง', '12')]


def norm(s):
    for a, b in NUM: s = s.replace(a, b)
    return re.sub(r'[\s,!\.\?]', '', s)


def pauses(y, sr=24000, gap=0.24):
    """silences ≥ gap inside the speech (20 ms frames under −40 dB)"""
    hop = sr // 50; e = np.array([20 * np.log10(np.sqrt(np.mean(y[k:k + hop] ** 2)) + 1e-9) for k in range(0, len(y) - hop, hop)]) < -40
    n, run = 0, 0
    for q in e:
        if q: run += 1
        else:
            if run * 0.02 >= gap: n += 1
            run = 0
    return n


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('n'); ap.add_argument('--k', type=int, default=4); ap.add_argument('--only', nargs='*', type=int)
    ap.add_argument('--model', default='gemini-3.8-flash-tts'); ap.add_argument('--voice', default='Fenrir'); a = ap.parse_args()
    key = os.environ.get('GEMINI_API_KEY') or sys.exit('set GEMINI_API_KEY first')
    full, text = gt.prompt_parts(a.n, True); style = full.split('Delivery per sentence', 1)[0].strip()
    cues = dict(re.findall(r'^(\d+) (.+)$', full, re.M)); lines = [l for l in text.splitlines() if l.strip()]
    d = ROOT / f'public/absurd-cases/ep{a.n}/raw/gemini_lines'; (d / 'alt').mkdir(parents=True, exist_ok=True)
    asr = pipeline('automatic-speech-recognition', model='openai/whisper-large-v3-turbo', dtype=torch.float16, device='mps' if torch.backends.mps.is_available() else 'cpu')
    todo = a.only or list(range(1, len(lines) + 1)); cand = {}
    for i in todo:
        line = lines[i - 1]; prompt = f'# AUDIO PROFILE\n{style}\n\n## DIRECTOR\'S NOTES\n{cues.get(str(i), "")}\n\n## TRANSCRIPT\n{line}'
        for k in range(a.k):
            p = d / 'alt' / f'l{i:03d}_{k}.wav'
            if not p.exists():
                for _ in range(4):
                    pcm, mime = gt.tts(prompt, a.voice, a.model, key)
                    if len(pcm) / 48000 <= len(line) / 6 + 1.5: break   # longer = directions read aloud or a loop
                gt.save_wav(p, pcm, mime)
            with wave.open(str(p)) as w: x = np.frombuffer(w.readframes(w.getnframes()), np.int16)
            y = gt.speech(x, 24000).astype(np.float32) / 32768
            heard = asr({'raw': resample_poly(y, 2, 3).astype(np.float32), 'sampling_rate': 16000}, generate_kwargs={'language': 'th'})['text']
            f0 = float(np.nanmedian(librosa.pyin(y, fmin=60, fmax=400, sr=24000, frame_length=1024)[0]))
            on = y[np.abs(y) > 0.01]; lv = float(20 * np.log10(np.sqrt(np.mean(on ** 2)) + 1e-9))
            sim = difflib.SequenceMatcher(None, norm(heard), norm(line)).ratio()
            cand.setdefault(i, []).append({'file': p.name, 'sim': round(sim, 3), 'pauses': pauses(y), 'want': line.count(','), 'f0': round(f0, 1), 'db': round(lv, 1), 'heard': heard, 'sec': round(len(y) / 24000, 2)})
    allc = [c for cs in cand.values() for c in cs]; F0 = float(np.median([c['f0'] for c in allc])); DB = float(np.median([c['db'] for c in allc]))
    picks = json.load(open(d / 'picks.json')) if (d / 'picks.json').exists() else {}
    for i, cs in cand.items():
        for c in cs: c['score'] = round(c['sim'] - 0.01 * max(0, abs(c['f0'] / F0 - 1) * 100 - 15) - 0.03 * max(0, abs(c['db'] - DB) - 2.5) - 0.15 * abs(c['pauses'] - c['want']), 3)
        best = max(cs, key=lambda c: c['score']); shutil.copy(d / 'alt' / best['file'], d / f'l{i:03d}.wav'); picks[f'l{i:03d}'] = {'pick': best, 'all': cs}
        print(f"l{i:03d} <- {best['file']}  score {best['score']}  pauses {best['pauses']}/{best['want']}  sim {best['sim']}  f0 {best['f0']} (median {F0:.0f})  {best['db']} dB (median {DB:.1f})  {best['heard']}")
    json.dump(picks, open(d / 'picks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'next: python3 tools/gemini_take.py {a.n} --per-line')


if __name__ == '__main__':
    main()
