#!/usr/bin/env python3
"""One whole-script narration take with Gemini TTS, from episodes/absurd-cases/epN_voice_prompt.md.

  GEMINI_API_KEY=... python3 tools/gemini_take.py N [--model gemini-3.8-flash-tts] [--voice Fenrir] [--takes 3]
Writes public/absurd-cases/epN/raw/gemini_take{k}.wav (24 kHz mono).
  --per-line: one call per Text line with its own numbered delivery cue (a whole read runs the commas together,
  so make_cuts cannot find the cards — EP23), joined with 0.9 s of silence into gemini_lines.wav. Pick one, then: python3 tools/voice_in.py N <that wav>
Only the prompt file's Style, per-sentence delivery and Text are sent; the key comes from the environment and is never written anywhere.
"""
import numpy as np
import argparse, base64, json, os, pathlib, re, time, urllib.error, urllib.request, wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'


def prompt_parts(n, full=False):
    md = (ROOT / f'episodes/absurd-cases/ep{n}_voice_prompt.md').read_text(encoding='utf-8')
    direction = md.split('## Style', 1)[1].split('## Text', 1)[0].strip()
    if not full: direction = direction.split('Delivery per sentence', 1)[0].strip()   # numbered cues get read aloud and loop (EP23)
    text = md.split('## Text', 1)[1].strip()
    assert text and direction, 'voice prompt needs ## Style and ## Text'
    return direction, text


def tts(prompt, voice, model, key):
    body = {'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {'responseModalities': ['AUDIO'],
                                 'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voice}}}}}
    req = urllib.request.Request(API.format(model=model), data=json.dumps(body).encode(), method='POST',
                                 headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                d = json.load(r)
            part = d['candidates'][0]['content']['parts'][0]['inlineData']
            return base64.b64decode(part['data']), part.get('mimeType', '')
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')
            if e.code in (429, 500, 503) and attempt < 3: time.sleep(10 * (attempt + 1)); continue
            raise SystemExit(f'HTTP {e.code}: {msg[:400]}')
        except (KeyError, IndexError):
            if attempt < 3: time.sleep(3); continue
            raise SystemExit(f'no audio in the response: {json.dumps(d)[:400]}')


def save_wav(path, pcm, mime):
    m = re.search(r'rate=(\d+)', mime or '')
    rate = int(m.group(1)) if m else 24000
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
    return len(pcm) / 2 / rate


def speech(x, rate):
    """Cut a line clip to its speech: every clip starts with a click and ends with ~0.16 s of loud junk (EP23, 3.8 flash)."""
    x = x[int(rate * 0.03):len(x) - int(rate * 0.25)]
    hop = rate // 50; e = np.array([np.sqrt(np.mean((x[k:k + hop] / 32768.0) ** 2)) for k in range(0, len(x) - hop, hop)])
    on = np.nonzero(20 * np.log10(e + 1e-9) > -45)[0]
    return x[max(0, on[0] * hop - int(rate * 0.06)):min(len(x), (on[-1] + 1) * hop + int(rate * 0.12))]


def per_line(a, key):
    full, text = prompt_parts(a.n, True)
    style = full.split('Delivery per sentence', 1)[0].strip()
    cues = dict(re.findall(r'^(\d+) (.+)$', full, re.M))
    lines = [l for l in text.splitlines() if l.strip()]
    d = ROOT / f'public/absurd-cases/ep{a.n}/raw/gemini_lines'; d.mkdir(parents=True, exist_ok=True)
    for i, line in enumerate(lines, 1):
        p = d / f'l{i:03d}.wav'
        if p.exists() and not (a.only and i in a.only): continue
        prompt = (f'# AUDIO PROFILE\n{style}\n\n## DIRECTOR\'S NOTES\n{cues.get(str(i), "")}\n\n'
                  f'## TRANSCRIPT\n{line}')
        limit = len(line) / 6 + 1.5   # longer than this = instructions read aloud or a loop (EP23 flash did both)
        for _ in range(5):
            pcm, mime = tts(prompt, a.voice, a.model, key)
            if len(pcm) / 2 / 24000 <= limit: break
            print(f'l{i:03d}  {len(pcm) / 48000:.2f} s > {limit:.1f} s, retry', flush=True)
        print(f'l{i:03d}  {save_wav(p, pcm, mime):.2f} s  {line}', flush=True)
    rate = 24000; gap = np.zeros(int(rate * 0.9), np.int16); parts = [gap[:rate // 4]]
    for i in range(1, len(lines) + 1):
        with wave.open(str(d / f'l{i:03d}.wav')) as w:
            assert w.getframerate() == rate; x = np.frombuffer(w.readframes(w.getnframes()), np.int16)
        parts += [speech(x, rate), gap]
    pcm = np.concatenate(parts).tobytes()
    out = d.parent / 'gemini_lines.wav'
    print(f'{out.relative_to(ROOT)}  {save_wav(out, pcm, "rate=24000"):.2f} s')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('n')
    ap.add_argument('--model', default='gemini-3.8-flash-tts')
    ap.add_argument('--voice', default='Fenrir')
    ap.add_argument('--takes', type=int, default=3)
    ap.add_argument('--first', type=int, default=1, help='number of the first take file')
    ap.add_argument('--delivery', action='store_true', help='also send the numbered per-sentence cues')
    ap.add_argument('--per-line', action='store_true')
    ap.add_argument('--only', nargs='*', type=int, help='with --per-line: redo these line numbers (1-based)')
    a = ap.parse_args()
    key = os.environ.get('GEMINI_API_KEY')
    if not key: raise SystemExit('set GEMINI_API_KEY first')
    if a.per_line: return per_line(a, key)
    direction, text = prompt_parts(a.n, a.delivery)
    prompt = (f'{direction}\n\nRead ONLY the Thai text below, exactly as written, every line in order, '
              f'nothing else (do not read any of the directions above aloud):\n\n{text}')
    out = ROOT / f'public/absurd-cases/ep{a.n}/raw'; out.mkdir(parents=True, exist_ok=True)
    for k in range(a.first, a.first + a.takes):
        pcm, mime = tts(prompt, a.voice, a.model, key)
        p = out / f'gemini_take{k}.wav'
        print(f'{p.relative_to(ROOT)}  {save_wav(p, pcm, mime):.2f} s  ({a.model}, {a.voice})', flush=True)


if __name__ == '__main__':
    main()
