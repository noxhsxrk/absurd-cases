#!/usr/bin/env python3
"""Cut one narrator take into lines, squeeze pauses, write the tight narration + line timing.
usage: tighten_take.py raw.wav cuts.json out_tight.wav out_timing.json [inner=0.22] [gaps=id:sec,...]
Gap before each line defaults to 0.25 s; a list split [a, b, gap] forces the silence between the two cards (a visual-only beat); pass e.g. gaps=ep3-l009:0.5 for comedic beats."""
import json, sys, wave, numpy as np
raw, cutp, outw, outj = sys.argv[1:5]; INNER = float(sys.argv[5]) if len(sys.argv) > 5 else 0.22
GAPS = dict((k, float(v)) for k, v in (x.split(':') for x in sys.argv[6].split(','))) if len(sys.argv) > 6 else {}
w = wave.open(raw); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
cuts = {k: v for k, v in json.load(open(cutp)).items() if not k.startswith('_')}
for id, c in cuts.items():   # every cut edge must sit in silence, or a word gets clipped
    for e in c['range'] + [v for s in c['splits'] for v in (s['q'] if isinstance(s, dict) else s[:2] if isinstance(s, list) else [])]:
        lv = 20 * np.log10(np.sqrt(np.mean(x[max(0, int((e - 0.01) * sr)):int((e + 0.01) * sr)] ** 2)) + 1e-9)
        if lv > -45: print(f'WARNING {id}: cut at {e} s is inside sound ({lv:.0f} dB)')
fade = lambda y, n=int(0.008 * sr): (y.__setitem__(slice(0, n), y[:n] * np.linspace(0, 1, n)), y.__setitem__(slice(-n, None), y[-n:] * np.linspace(1, 0, n)), y)[2]
out, t, rows = [], 0.0, []
for i, (id, c) in enumerate(cuts.items()):
    g = GAPS.get(id, 0.25 if i else 0.0); out.append(np.zeros(int(g * sr), np.float32)); t += g
    a, b = c['range']; pieces = []; bounds = [a]
    for s in c['splits']:
        if isinstance(s, dict): pieces.append(('sq', s['q']))          # squeeze a pause without starting a new card
        elif isinstance(s, list): pieces.append(('cut', s))
        else: pieces.append(('pt', s))
    start = t; parts = []; cur = a; pt0 = t
    for kind, s in pieces:
        if kind == 'cut':
            seg = fade(x[int(cur * sr):int(s[0] * sr)].copy()); out.append(seg); t += len(seg) / sr; parts.append([round(pt0, 3), round(t, 3)])
            gap = s[2] if len(s) > 2 else min(INNER, s[1] - s[0]); out.append(np.zeros(int(gap * sr), np.float32)); t += gap; cur = s[1]; pt0 = t
        elif kind == 'sq':
            seg = fade(x[int(cur * sr):int(s[0] * sr)].copy()); out.append(seg); t += len(seg) / sr
            gap = min(INNER, s[1] - s[0]); out.append(np.zeros(int(gap * sr), np.float32)); t += gap; cur = s[1]
        else:
            seg = x[int(cur * sr):int(s * sr)].copy(); out.append(seg); t += len(seg) / sr; parts.append([round(pt0, 3), round(t, 3)]); cur = s; pt0 = t
    seg = fade(x[int(cur * sr):int(b * sr)].copy()); out.append(seg); t += len(seg) / sr; parts.append([round(pt0, 3), round(t, 3)])
    rows.append({'id': id, 'start': round(start, 3), 'end': round(t, 3), 'parts': parts})
y = np.concatenate(out); o = wave.open(outw, 'wb'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()); o.close()
json.dump(rows, open(outj, 'w'), indent=1)
MAP = []  # (rawT, tightT) anchors written for word-level events

print('tight', round(len(y) / sr, 2), 's (raw', round(len(x) / sr, 2), ')')
for r in rows: print(r['id'], r['start'], r['end'], len(r['parts']))
