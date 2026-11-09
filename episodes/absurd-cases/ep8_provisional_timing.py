#!/usr/bin/env python3
"""EP8 PROVISIONAL line timing (no voice yet): lays the 13 lines out at a Fenrir-like pace so the picture can be built.
Writes ep8_line_timing.json in the same shape tools/tighten_take.py writes. Replace it with the real one:
  python3 tools/tighten_take.py <raw16.wav> episodes/absurd-cases/ep8_cuts_fenrir.json public/absurd-cases/ep8/ep8_narration_tight.wav episodes/absurd-cases/ep8_line_timing.json 0.22 <gaps>
"""
import json, pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
CPS = 13.9                      # Thai chars/s (EP4–5 Fenrir pace)
INNER = 0.18                    # pause at a card split that has a comma
GAPS = {'ep8-l004': 0.22, 'ep8-l010': 0.6, 'ep8-l013': 0.45}   # l010: after the shadow's 'ฟึ่บ' answer; l013: beat before the closer
n = lambda s: len(re.sub(r'[\s,!“”"…—]', '', s))
script = json.load(open(HERE / 'ep8_script.json'))
t, rows = 0.0, []
for i, l in enumerate(script['lines']):
    t += GAPS.get(l['id'], 0.25) if i else 0.0
    start = t; parts = []
    for j, (text, _) in enumerate(l['cards']):
        a = t; t += n(text) / CPS; parts.append([round(a, 3), round(t, 3)])
        if j < len(l['cards']) - 1 and ',' in l['text'] and l['text'].split(',')[0].replace(' ', '').endswith(text.replace(' ', '')[-3:]): t += INNER
    rows.append({'id': l['id'], 'start': round(start, 3), 'end': round(t, 3), 'parts': parts, 'provisional': True})
json.dump(rows, open(HERE / 'ep8_line_timing.json', 'w'), indent=1)
print('provisional speech', round(t, 2), 's')
