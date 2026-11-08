#!/usr/bin/env python3
"""EP5 PROVISIONAL line timing (no voice yet): lays the 13 lines out at a Fenrir-like pace so the picture can be built.
Writes ep5_line_timing.json in the same shape tools/tighten_take.py writes. Replace it with the real one:
  python3 tools/tighten_take.py <raw16.wav> episodes/absurd-cases/ep5_cuts_fenrir.json public/absurd-cases/ep5/ep5_narration_tight.wav episodes/absurd-cases/ep5_line_timing.json 0.22 <gaps>
"""
import json, pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
CPS = 14.5                      # Thai chars/s (EP4 Fenrir averaged 13.9; EP5's prompt asks for a brisker read)
INNER = 0.18                    # pause at a card split that has a comma
GAPS = {'ep5-l004': 0.22, 'ep5-l005': 0.3, 'ep5-l011': 0.55, 'ep5-l013': 0.45}   # l011: after the soap's bubble answer; l013: beat before the closer
n = lambda s: len(re.sub(r'[\s,!“”"…—]', '', s))
script = json.load(open(HERE / 'ep5_script.json'))
t, rows = 0.0, []
for i, l in enumerate(script['lines']):
    t += GAPS.get(l['id'], 0.25) if i else 0.0
    start = t; parts = []
    for j, (text, _) in enumerate(l['cards']):
        a = t; t += n(text) / CPS; parts.append([round(a, 3), round(t, 3)])
        if j < len(l['cards']) - 1 and ',' in l['text'] and l['text'].split(',')[0].replace(' ', '').endswith(text.replace(' ', '')[-3:]): t += INNER
    rows.append({'id': l['id'], 'start': round(start, 3), 'end': round(t, 3), 'parts': parts, 'provisional': True})
json.dump(rows, open(HERE / 'ep5_line_timing.json', 'w'), indent=1)
print('provisional speech', round(t, 2), 's')
