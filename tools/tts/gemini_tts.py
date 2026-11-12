#!/usr/bin/env python3
"""Generate the narrator lines with Gemini TTS (Google AI Studio API key) — one WAV per line.

  export GEMINI_API_KEY=...            # your AI Studio key (never commit it)
  python3 gemini_tts.py                          # all 14 lines → takes/ep1-l001.wav …
  python3 gemini_tts.py --audition Charon Schedar Iapetus   # l003 + l012 in each voice → takes/audition/
  python3 gemini_tts.py --only ep1-l009 ep1-l012 # redo some lines
  python3 gemini_tts.py --voice Schedar --model gemini-2.5-pro-preview-tts

Python 3.9+, standard library only. Reads ep1_tts_jobs.json next to this file. Existing takes are skipped unless --force.
Stops at the first quota error (daily cap per model) and tells you which lines are still missing.
Then: bash episodes/absurd-cases/ingest_voices.sh episodes/absurd-cases/takes

Whole episode as one take (the way Nox does it in AI Studio, EP9+):
  python tools/tts/gemini_tts.py --episode 14 --takes 3
  → sends episodes/absurd-cases/ep14_voice_prompt.md as the prompt (voice Fenrir)
  → public/absurd-cases/ep14/raw/narration_ep14_t1.wav … (existing takes are kept, numbering continues)
Key: GEMINI_API_KEY env var, or the first line of ~/.gemini_api_key (outside the repo: the repo is public).
"""
import argparse, base64, json, os, pathlib, sys, time, urllib.error, urllib.request, wave

HERE = pathlib.Path(__file__).resolve().parent
API = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'

def tts(text, style, voice, model, key, raw_prompt=False):
    prompt = text if raw_prompt else f"{style}\n\nRead this Thai line exactly as written, nothing else:\n{text}"
    body = {'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {'responseModalities': ['AUDIO'],
                                 'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voice}}}}}
    req = urllib.request.Request(API.format(model=model), data=json.dumps(body).encode(), method='POST',
                                 headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                d = json.load(r)
            part = d['candidates'][0]['content']['parts'][0]['inlineData']
            return base64.b64decode(part['data']), part.get('mimeType', '')
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')
            if e.code == 429: raise SystemExit(f'quota reached (429): {msg[:300]}')
            if e.code >= 500 and attempt < 3: time.sleep(4 * (attempt + 1)); continue
            raise SystemExit(f'HTTP {e.code}: {msg[:500]}')
        except (KeyError, IndexError):
            if attempt < 3: time.sleep(2); continue
            raise SystemExit(f'no audio in the response: {json.dumps(d)[:500]}')

def save_wav(path, pcm, mime):
    rate = 24000
    if 'rate=' in mime:
        try: rate = int(mime.split('rate=')[1].split(';')[0])
        except ValueError: pass
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
    return len(pcm) / 2 / rate

def get_key():
    key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    f = pathlib.Path.home() / '.gemini_api_key'
    if not key and f.exists(): key = f.read_text(encoding='utf-8').strip().splitlines()[0].strip()
    if not key: raise SystemExit('no key: set GEMINI_API_KEY or put it in ~/.gemini_api_key')
    return key

def episode_takes(n, takes, voice, model, key):
    root = HERE.parent.parent
    prompt = (root / f'episodes/absurd-cases/ep{n}_voice_prompt.md').read_text(encoding='utf-8')
    raw = root / f'public/absurd-cases/ep{n}/raw'
    i = 1
    for _ in range(takes):
        while (raw / f'narration_ep{n}_t{i}.wav').exists(): i += 1
        pcm, mime = tts(prompt, '', voice, model, key, raw_prompt=True)
        p = raw / f'narration_ep{n}_t{i}.wav'
        print(f'{p.relative_to(root)}  {save_wav(p, pcm, mime):.1f}s', flush=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', help='override the voice in the jobs file (e.g. Charon)')
    ap.add_argument('--model', default=os.environ.get('GEMINI_TTS_MODEL', 'gemini-2.5-flash-preview-tts'),
                    help='any Gemini TTS model id available to your key')
    ap.add_argument('--only', nargs='*', help='line ids to (re)generate')
    ap.add_argument('--audition', nargs='*', help='voices to compare on ep1-l003 and ep1-l012')
    ap.add_argument('--out', default=str(HERE / 'takes'))
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--episode', type=int, help='whole episode from epN_voice_prompt.md as one take')
    ap.add_argument('--takes', type=int, default=1)
    a = ap.parse_args()
    key = get_key()
    if a.episode:
        return episode_takes(a.episode, a.takes, a.voice or 'Fenrir', a.model, key)
    jobs = json.load(open(HERE / 'ep1_tts_jobs.json', encoding='utf-8'))
    out = pathlib.Path(a.out)

    if a.audition:
        for v in a.audition:
            for j in jobs:
                if j['id'] not in ('ep1-l003', 'ep1-l012'): continue
                pcm, mime = tts(j['text'], j['style'], v, a.model, key)
                d = save_wav(out / 'audition' / f"{j['id']}__{v}.wav", pcm, mime)
                print(f"{v:12s} {j['id']}  {d:.2f}s")
        return

    todo = [j for j in jobs if not a.only or j['id'] in a.only]
    for j in todo:
        p = out / f"{j['id']}.wav"
        if p.exists() and not a.force: print(f"{j['id']}  skip (exists)"); continue
        voice = a.voice or j['voice']
        try:
            pcm, mime = tts(j['text'], j['style'], voice, a.model, key)
        except SystemExit as e:
            missing = [x['id'] for x in todo if not (out / f"{x['id']}.wav").exists()]
            print(e, '\nstill missing:', ' '.join(missing)); sys.exit(1)
        d = save_wav(p, pcm, mime)
        exp = len(j['text']) / 13
        flag = '  <-- check (length looks off)' if d < exp * 0.5 or d > exp * 2.2 + 1 else ''
        print(f"{j['id']}  {voice}  {d:.2f}s  {j['text']}{flag}")
    print(f'\ndone → {out}\nnext: bash episodes/absurd-cases/ingest_voices.sh {out}')

if __name__ == '__main__':
    main()
