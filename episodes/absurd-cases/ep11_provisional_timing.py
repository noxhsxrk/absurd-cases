#!/usr/bin/env python3
"""EP11 PROVISIONAL line timing (no voice yet): lays the 13 lines out at the EP9/EP10 Fenrir pace so the picture can be built.
Writes ep11_line_timing.json in the shape tools/tighten_take.py writes; the real take replaces it (see ep10 for the commands)."""
import json, pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
CPS, INNER = 11.0, 0.32
INNER_X = {'ep11-l009': 1.5}    # "ศาลสั่งถอดเข็ม" | the hands come off | "ขังลืมห้าปี" (real take: split [a, b, 1.5])
GAPS = dict(kv.split(':') for kv in open(HERE / 'ep11_gaps.txt').read().strip().split(','))
n = lambda s: len(re.sub(r'[\s,!]', '', s))
t, rows = 0.0, []
for i, l in enumerate(json.load(open(HERE / 'ep11_script.json', encoding='utf-8'))['lines']):
    t += float(GAPS.get(l['id'], 0.4)) if i else 0.0
    start, parts = t, []
    for j, (text, _) in enumerate(l['cards']):
        a = t; t += max(0.5, n(text) / CPS); parts.append([round(a, 3), round(t, 3)])
        if j < len(l['cards']) - 1: t += INNER_X.get(l['id'], INNER if ',' in l['text'] else 0.0)
    rows.append({'id': l['id'], 'start': round(start, 3), 'end': round(t, 3), 'parts': parts, 'provisional': True})
json.dump(rows, open(HERE / 'ep11_line_timing.json', 'w'), indent=1)
print('provisional speech', round(t, 2), 's')
