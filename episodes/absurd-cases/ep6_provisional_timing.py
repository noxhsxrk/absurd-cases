#!/usr/bin/env python3
"""EP6 PROVISIONAL line timing (no voice yet): lays the 13 lines out at a Fenrir-like pace so the picture can be built.
Writes ep6_line_timing.json in the same shape tools/tighten_take.py writes. Replace it with the real one:
  python3 tools/tighten_take.py <raw16.wav> episodes/absurd-cases/ep6_cuts_fenrir.json public/absurd-cases/ep6/ep6_narration_tight.wav episodes/absurd-cases/ep6_line_timing.json 0.22 <gaps>
"""
import json, pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
CPS = 13.9                      # Thai chars/s (EP4–5 Fenrir pace)
INNER = 0.18                    # pause at a card split that has a comma
GAPS = {'ep6-l004': 0.22, 'ep6-l011': 0.55, 'ep6-l013': 0.45}   # l011: after the bridge's wind answer; l013: beat before the closer   # l011: after the soap's bubble answer; l013: beat before the closer
n = lambda s: len(re.sub(r'[\s,!“”"…—]', '', s))
script = json.load(open(HERE / 'ep6_script.json'))
t, rows = 0.0, []
for i, l in enumerate(script['lines']):
    t += GAPS.get(l['id'], 0.25) if i else 0.0
    start = t; parts = []
    for j, (text, _) in enumerate(l['cards']):
        a = t; t += n(text) / CPS; parts.append([round(a, 3), round(t, 3)])
        if j < len(l['cards']) - 1 and ',' in l['text'] and l['text'].split(',')[0].replace(' ', '').endswith(text.replace(' ', '')[-3:]): t += INNER
    rows.append({'id': l['id'], 'start': round(start, 3), 'end': round(t, 3), 'parts': parts, 'provisional': True})
json.dump(rows, open(HERE / 'ep6_line_timing.json', 'w'), indent=1)
print('provisional speech', round(t, 2), 's')
