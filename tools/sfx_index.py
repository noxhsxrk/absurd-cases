"""Sound-effect library index for absurd-cases: every generated / synthesised take on disk, searchable, so a new episode
reuses sounds before generating new ones.

  python tools/sfx_index.py build            # scan the folders below -> tools/sfx_library/index.json + index.md
  python tools/sfx_index.py search cuffs     # best matches (name, tags, prompt), best take first
  python tools/sfx_index.py search "door slam" --engine sao --min-score 0.2
  python tools/sfx_index.py search จับ           # Thai works too: matches the usage notes
  python tools/sfx_index.py render           # rewrite index.md from index.json + usage.json (no disk scan)

When to use each sound lives in tools/sfx_library/usage.json (category + a Thai line per cue, base name without _vN).
Where each sound was already used is read from the premix scripts (tools/premix_absurd_ep*.py).

What gets indexed (paths relative to the repo root):
  tools/ai-sfx/out*/<cue>_r<k>.wav      generator takes (AudioLDM2 = out, out3..out8; Stable Audio Open = out_sao*)
  public/absurd-cases/ep*/sfx_*/*.wav   takes an episode actually used (sfx_ai, sfx_sao, sfx_own)
Prompts / CLAP targets come from the generator scripts' CUES lists (tools/ai-sfx/gen_*.py), scores from scores.json.
Run `build` after every generation batch (the SAO generator does it for you at the end)."""
import ast, json, re, sys, wave, pathlib, contextlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIB = ROOT / 'tools' / 'sfx_library'
TAGS = {   # coarse categories, matched on cue name + prompt words
    'ambience': ['amb', 'ambience', 'bed', 'room', 'tone', 'cicada', 'traffic', 'crowd', 'wind', 'rain', 'hum', 'birds', 'courtroom', 'street'],
    'footsteps': ['step', 'footstep', 'walk', 'run', 'boots', 'stomp'],
    'police': ['siren', 'police', 'swat', 'cuffs', 'handcuff', 'radio', 'walkie'],
    'impact': ['thud', 'slam', 'hit', 'gavel', 'stamp', 'knock', 'clunk', 'punch', 'crash', 'bang'],
    'mechanical': ['switch', 'click', 'lamp', 'door', 'lock', 'zip', 'beep', 'engine', 'motor', 'flood'],
    'material': ['rubber', 'peel', 'tape', 'fold', 'paper', 'fabric', 'vest', 'scrape', 'trowel', 'squish', 'squash', 'sticky'],
    'voice': ['cough', 'gasp', 'laugh', 'breath', 'scream', 'sigh', 'crowd'],
    'cartoon': ['squeak', 'whoosh', 'fwip', 'boing', 'trombone', 'slide whistle', 'pop', 'shrink', 'sizzle'],
    'tonal': ['bell', 'chime', 'ding', 'tone', 'sting'],
    'nature': ['bird', 'insect', 'mosquito', 'dog', 'cat', 'water', 'wave', 'thunder', 'fire'],
}

def cue_meta():
    """cue name -> {prompt(s), target, seconds, script} from every generator's CUES list"""
    meta = {}
    for f in sorted((ROOT / 'tools' / 'ai-sfx').glob('gen_*.py')):
        src = f.read_text(encoding='utf-8', errors='ignore')
        m = re.search(r'^CUES\s*=\s*\[', src, re.M)
        if not m: continue
        try:
            node = ast.parse(src).body
            cues = next(ast.literal_eval(n.value) for n in node if isinstance(n, ast.Assign) and getattr(n.targets[0], 'id', '') == 'CUES')
        except Exception:
            continue
        for c in cues:
            c = list(c)
            if isinstance(c[0], int): c = c[1:]                    # (episode, cue, ...) form
            name, sec, target, prompt = c[0], c[1], c[2], c[3] if len(c) > 3 else ''
            meta.setdefault(name, {'prompts': [], 'target': target, 'seconds': sec, 'scripts': []})
            for p in (prompt if isinstance(prompt, list) else [prompt]):
                if p and p not in meta[name]['prompts']: meta[name]['prompts'].append(p)
            meta[name]['scripts'].append(f.name)
    return meta

def wav_info(p):
    try:
        with contextlib.closing(wave.open(str(p))) as w:
            n, sr, ch, sw = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
            raw = w.readframes(n)
        import numpy as np
        dt = {1: np.int8, 2: np.int16, 4: np.int32}.get(sw)
        x = np.frombuffer(raw, dt).astype('float32') / float(2 ** (8 * sw - 1)) if dt else None
        if x is None or not len(x): return {'sec': round(n / sr, 2), 'sr': sr, 'ch': ch}
        rms = float((x ** 2).mean() ** 0.5); pk = float(abs(x).max())
        db = lambda v: round(20 * __import__('math').log10(max(v, 1e-9)), 1)
        return {'sec': round(n / sr, 2), 'sr': sr, 'ch': ch, 'rms_db': db(rms), 'peak_db': db(pk)}
    except Exception as e:
        return {'error': str(e)[:80]}

def engine_of(rel):
    if 'out_sao' in rel or 'sfx_sao' in rel: return 'sao'          # Stable Audio Open 44.1 kHz — preferred
    if 'sfx_own' in rel: return 'synth'
    return 'audioldm2'

def tags_for(name, text):
    s = ' ' + re.sub(r'[^a-z0-9]+', ' ', (name + ' ' + text).lower()) + ' '
    return sorted({t for t, kws in TAGS.items() if any(re.search(r'\b' + re.escape(k), s) for k in kws)})

base = lambda cue: re.sub(r'_v\d+$', '', cue)

def usage():
    f = LIB / 'usage.json'
    return json.loads(f.read_text(encoding='utf-8')) if f.exists() else {'categories': {}, 'cues': {}, 'synth': []}

def used_in():
    """cue -> ['EP8 cuff', 'EP8 bed interro→court', ...] from take('cue' / amb('cue' calls in the premix scripts"""
    out = {}
    for f in sorted((ROOT / 'tools').glob('premix_absurd_ep*.py')):
        ep = 'EP' + re.search(r'ep(\d+\w*)', f.stem).group(1)
        for line in f.read_text(encoding='utf-8', errors='ignore').splitlines():
            for m in re.finditer(r"(?:take|amb|ai)\('([a-z0-9_]+)'", line):
                at = re.findall(r"EV\['(\w+)'\]|T\('(\w+)'\)", line)
                at = [a or b for a, b in at]
                where = ('bed ' + ('→'.join(at[:2]) if len(at) > 1 else '…→' + ''.join(at[:1]))) if ('M.bed' in line or 'amb(' in line) else (at[0] if at else '')
                lab = (ep + ' ' + where).strip()
                if lab not in out.setdefault(m.group(1), []): out[m.group(1)].append(lab)
    return out

def best_per_cue(rows):
    """one row per base cue: sao first, then CLAP score, then rank"""
    best = {}
    for r in rows:
        k = base(r['cue']); key = (r['engine'] == 'sao', r['score'] if r['score'] is not None else -1, -r['rank'])
        if k not in best or key > best[k][0]: best[k] = (key, r)
    return {k: v[1] for k, v in best.items()}

def render(rows=None):
    rows = rows if rows is not None else json.loads((LIB / 'index.json').read_text(encoding='utf-8'))
    U = usage(); cats, cues = U['categories'], U['cues']; ui = used_in(); best = best_per_cue(rows)
    n_take = {}
    for r in rows: n_take[base(r['cue'])] = n_take.get(base(r['cue']), 0) + 1
    L = ['# คลังเสียง absurd-cases (SFX library)', '',
         f'{len(rows)} ไฟล์ · {len(best)} เสียง · สร้างใหม่: `python tools/sfx_index.py build` · ค้น: `python tools/sfx_index.py search <คำ>` (ไทยก็ได้)', '',
         '## วิธีใช้', '',
         '1. อ่านสคริปต์ตอนใหม่ แล้วไล่ทีละจังหวะ: ฉากอยู่ที่ไหน (bed) → คนทำอะไร (spot) → ช่วงพีก (จับ/ตัดสิน/มุก). หาเสียงจากหมวดด้านล่างหรือ `search`',
         '2. มีเสียงที่ตรง → ก๊อป take ไป `public/absurd-cases/epN/sfx_sao/<cue>_r1.wav` แล้วเรียกใน premix ด้วย `take(\'<cue>\', synth_สำรอง, ความยาว)`',
         '3. ไม่มี / ไม่ตรง → เจนเฉพาะ cue ที่ขาดด้วย `tools/ai-sfx/gen_sao_epN.py` (ตั้งชื่อ cue อังกฤษค้นง่าย) แล้วเพิ่มบรรทัดใน `tools/sfx_library/usage.json` ว่าใช้ตอนไหน แล้ว `build`',
         '4. ลำดับความไว้ใจ: engine `sao` (Stable Audio Open 44.1 kHz) > `audioldm2` (16 kHz) > รุ่นเก่า `_v1/_v2` (EP1–2). คะแนน CLAP < 0.05 = take พลาด ใช้ synth แทน',
         '5. ไม่มีเพลงเด็ดขาด. ระดับ: bed rms ≈ 0.0038 (−40 dBFS) · spot peak 0.15–0.62 · ค้อนตัดสิน/ป้ายข้อหาดังสุด · ทุกอย่างหลบใต้พากย์ ~3 dB · มิกซ์จบ −15 LUFS', '',
         '## สารบัญหมวด', '']
    order = list(cats) + ['other']
    for k in order:
        if k in cats: L.append(f"- **{cats[k]['title']}** — {cats[k]['how']}")
    L.append('')
    groups = {}
    for k, r in best.items(): groups.setdefault(cues.get(k, ['other'])[0], []).append((k, r))
    for c in order:
        if c not in groups: continue
        L += [f"## {cats[c]['title'] if c in cats else 'ยังไม่มีคำอธิบาย (เพิ่มใน usage.json)'}", '']
        if c in cats: L += [cats[c]['how'], '']
        L += ['| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |', '|---|---|---|---|---|---|']
        for k, r in sorted(groups[c], key=lambda x: (x[1]['engine'] != 'sao', x[0])):
            sc = '' if r['score'] is None else round(r['score'], 2)
            L.append(f"| **{k}** | {cues.get(k, ['', ''])[1]} | {', '.join(ui.get(r['cue'], []) + [u for u in ui.get(k, []) if k != r['cue']])} | `{r['path']}` | {r['engine']} · {r.get('sec', '')} · {sc} | {n_take[k]} |")
        L.append('')
    if U.get('synth'):
        L += ['## เสียงสังเคราะห์ (ไม่ต้องเจน — ฟังก์ชันใน `tools/premix_absurd_ep8b.py`)', '', 'ใช้เป็นตัวสำรองตัวที่ 2 ของ `take()` หรือเมื่อ AI take ไม่เข้า', '', '| ฟังก์ชัน | เสียง |', '|---|---|']
        L += [f'| `{a}` | {b} |' for a, b in U['synth']] + ['']
    (LIB / 'index.md').write_text('\n'.join(L), encoding='utf-8')
    missing = sorted(k for k in best if k not in cues)
    if missing: print('no usage line yet for:', ', '.join(missing))
    print('wrote', (LIB / 'index.md').relative_to(ROOT), '-', len(best), 'sounds')

def build():
    meta = cue_meta(); rows = []
    scores = {}
    for sj in list((ROOT / 'tools' / 'ai-sfx').glob('out*/scores.json')) + list((ROOT / 'public' / 'absurd-cases').glob('ep*/sfx_*/scores.json')):
        try: d = json.loads(sj.read_text())
        except Exception: continue
        for k, v in d.items():
            vals = [x['score'] if isinstance(x, dict) else x for x in v] if isinstance(v, list) else []
            scores[(sj.parent.name, k)] = vals
    files = list((ROOT / 'tools' / 'ai-sfx').glob('out*/*.wav')) + list((ROOT / 'public' / 'absurd-cases').glob('ep*/sfx_*/*.wav'))
    for p in sorted(files):
        rel = p.relative_to(ROOT).as_posix(); m = re.match(r'(.+?)_r(\d+)$', p.stem)
        cue, rank = (m.group(1), int(m.group(2))) if m else (p.stem, 1)
        sc = scores.get((p.parent.name, cue)); score = sc[rank - 1] if sc and rank - 1 < len(sc) else None
        md = meta.get(cue, {})
        rows.append({'cue': cue, 'rank': rank, 'path': rel, 'engine': engine_of(rel), 'score': score,
                     'episode': (re.search(r'ep(\d+)', rel) or re.search(r'out(\d+)', p.parent.name) or [None, None])[1],
                     'prompt': (md.get('prompts') or [''])[0], 'target': md.get('target', ''), 'tags': tags_for(cue, ' '.join(md.get('prompts', [])) + ' ' + md.get('target', '')),
                     **wav_info(p)})
    LIB.mkdir(parents=True, exist_ok=True)
    (LIB / 'index.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
    render(rows)
    print('indexed', len(rows), 'takes ->', (LIB / 'index.json').relative_to(ROOT))

def search(words, engine=None, min_score=None, n=12):
    rows = json.loads((LIB / 'index.json').read_text(encoding='utf-8')); q = [w.lower() for w in words]; U = usage()
    def hit(r):
        u = U['cues'].get(base(r['cue']), ['', ''])
        hay = ' '.join([r['cue'].replace('_', ' '), r['prompt'], r['target'], ' '.join(r['tags']), u[1], U['categories'].get(u[0], {}).get('title', '')]).lower()
        return sum(3 if w in r['cue'] else 1 for w in q if w in hay)
    res = [(hit(r), r) for r in rows if (not engine or r['engine'] == engine) and (min_score is None or (r['score'] or 0) >= min_score)]
    res = [x for x in res if x[0] > 0]; seen = set()
    res = [x for x in res if not ((k := (x[1]['cue'], x[1]['engine'], x[1]['rank'], x[1]['score'])) in seen or seen.add(k))]   # same take copied into public/
    res.sort(key=lambda x: (-x[0], x[1]['engine'] != 'sao', x[1]['rank'], -(x[1]['score'] or 0)))
    for s, r in res[:n]:
        print(f"{r['cue']:18s} {r['engine']:9s} r{r['rank']} {str(r.get('sec', '')):>5}s score {r['score'] if r['score'] is not None else '-':<7} {r['path']}")
        u = U['cues'].get(base(r['cue']))
        if u and r['rank'] == 1: print(' ' * 20 + '↳ ' + u[1])
    if not res: print('no match — generate it (tools/ai-sfx/gen_sao_epN.py), then run build')

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a or a[0] == 'build': build()
    elif a[0] == 'render': render()
    elif a[0] == 'search':
        eng = a[a.index('--engine') + 1] if '--engine' in a else None
        ms = float(a[a.index('--min-score') + 1]) if '--min-score' in a else None
        words = [w for i, w in enumerate(a[1:], 1) if not w.startswith('--') and (a[i - 1] not in ('--engine', '--min-score'))]
        search(words, eng, ms)
