#!/usr/bin/env python3
"""Rebuild Gemini TTS WAVs from browser-dumped chunks ('#<lineId>#<i>#<n>#<data-url slice>|…') saved in tool-result files.

  python3 tools/collect_tts.py <out_dir> [lineId …] [--tr <tool-results dir>] [--since <unix time>]

--tr      the session's tool-results folder (default: the newest ~/.claude/projects/*/*/tool-results)
--since   only parse result files modified after this time, so older takes of the same ids never win
Every chunk of every take is kept by file time (the newest copy of a chunk wins); a line with missing chunks is reported, not written.
"""
import json, glob, base64, os, sys, collections, re
a = sys.argv[1:]
def opt(k, d=None):
    if k in a: i = a.index(k); v = a[i + 1]; del a[i:i + 2]; return v
    return d
TR = opt('--tr') or max(glob.glob(os.path.expanduser('~/.claude/projects/*/*/tool-results')), key=os.path.getmtime)
since = float(opt('--since', 0))
out = a[0]; want = set(a[1:]); os.makedirs(out, exist_ok=True)
parts = collections.defaultdict(dict); total = {}
pat = re.compile(r'#(ep\d+-[a-z0-9_]+)#(\d+)#(\d+)#([A-Za-z0-9+/=:;,.\-]+?)(?:\||")')
for f in sorted(glob.glob(TR + '/*.txt') + glob.glob(TR + '/*.json'), key=os.path.getmtime):
    if os.path.getmtime(f) < since: continue
    try: raw = open(f).read()
    except Exception: continue
    if '#ep' not in raw[:400]: continue
    try: t = json.load(open(f))[0]['text']
    except Exception: t = raw
    for m in pat.finditer(t.replace('\\"', '"')):
        id_, i, n, data = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4)
        parts[id_][i] = (os.path.getmtime(f), data); total[id_] = n
for id_, ch in sorted(parts.items()):
    if want and id_ not in want: continue
    if len(ch) != total[id_]: print('incomplete', id_, sorted(ch), total[id_]); continue
    s = ''.join(ch[i][1] for i in range(total[id_]))
    b = base64.b64decode(s.split(',', 1)[1])
    p = f'{out}/{id_}.wav'; open(p, 'wb').write(b); print('ok', id_, round((len(b) - 44) / 48000, 2), 's (24 kHz mono 16-bit)')
