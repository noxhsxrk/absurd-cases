"""Scaffold episode N from episode M (default: the latest episode that exists) so a stub draft renders before any prop exists. usage: new_episode.py N [from=M]
Creates (never overwrites):
  src/episodes/AbsurdEpN/Episode.tsx, data.ts, cast.ts   copied from M with the number changed; PLACE maps every shot to 'town' and the
                                                          charge plate / flash lines are left as marked examples to fill in
  src/episodes/AbsurdEpN/props.tsx, shots.tsx            stubs: every shot name in the plan renders the empty village until you write it
  episodes/absurd-cases/epN_plan.py                      M's plan with its events, shot list and closing hold replaced by marked placeholders to write
  tools/premix_absurd_epN.py                             M's premix: rewrite the part between "# ---- beds" and "OUT = "
  tools/ai-sfx/gen_sao_epN.py                            M's generator with an empty CUES list
and registers AbsurdEpN + AbsurdEpNBlur in src/Root.tsx. It does not touch the script, the voice or the bible."""
import re, sys, pathlib
N = int(sys.argv[1]); kw = dict(a.split('=') for a in sys.argv[2:]); ROOT = pathlib.Path(__file__).resolve().parent.parent
have = sorted(int(m.group(1)) for d in (ROOT / 'src/episodes').iterdir() if (m := re.fullmatch(r'AbsurdEp(\d+)', d.name)) and int(m.group(1)) < N and (ROOT / f'episodes/absurd-cases/ep{m.group(1)}_plan.py').exists())
M = int(kw.get('from', have[-1]))
ren = lambda s: s.replace(f'ep{M}', f'ep{N}').replace(f'Ep{M}', f'Ep{N}').replace(f'EP{M}', f'EP{N}')
def put(path, text):
    p = ROOT / path
    if p.exists(): print('exists, kept:', path); return
    p.parent.mkdir(parents=True, exist_ok=True); p.write_text(text, encoding='utf-8', newline='\n'); print('wrote', path)
src = ROOT / f'src/episodes/AbsurdEp{M}'
ep = ren((src / 'Episode.tsx').read_text(encoding='utf-8')); out = []
for line in ep.split('\n'):
    if line.startswith('const PLACE ='): line = "const PLACE = (n: string) => 'town';   // TODO: map this episode's shot names to a place (a key of GRADE / FILL / POST), e.g. IN(n, ['interro', 'burn']) ? 'interro' : …"
    elif '<HangingPlate' in line: line = '      {/* TODO charge plate: ' + line.strip().replace('*/', '') + ' */}'
    elif '<Flash key' in line: line = "      {([] as string[]).map((k) => <Flash key={k} t={t} t0={ev(k)} d={0.07} max={0.2} />)}   {/* TODO: the events that hit (list their names) */}"
    out.append(line)
put(f'src/episodes/AbsurdEp{N}/Episode.tsx', '\n'.join(out))
for f in ('data.ts', 'cast.ts'): put(f'src/episodes/AbsurdEp{N}/{f}', ren((src / f).read_text(encoding='utf-8')))
put(f'src/episodes/AbsurdEp{N}/props.tsx', f"""import React from 'react';
import * as THREE from 'three';
import {{MB, M, tex, F}} from '../../pov/lib/tex';
import {{PM}} from '../AbsurdEp1/boxcast';

/** EP{N} — the new things only (the offender, and the one to three hero props). Everything else comes from earlier episodes and lifekit. */
export type V3 = [number, number, number];
""")
put(f'src/episodes/AbsurdEp{N}/shots.tsx', f"""import React from 'react';
import {{ev, SHOTS}} from './data';
import {{Village}} from '../AbsurdEp8/village';
import {{ps, body, bw, hideProps, prop, P, CamRig, mv, strike, near, sm, V3, Cast, ShotOut, DAY, SKY, CELL_BG, toward, hand, hw, hdir}} from '../lifekit/stage';
import {{VillageLife}} from '../lifekit/presets';

export {{CamRig}};
/** EP{N}. One function per shot name in the plan. Until a shot is written it falls back to `stub` (the man in the empty village),
 *  so the whole timeline renders from the first minute and every later draft shows real progress. */
const stub = (t: number, lt: number, C: Cast): ShotOut => {{ const w = body(C.nai, ps('nai', 0, 0, 0, t, {{clip: 'idle_neutral_01'}}), t);
  return {{node: <><Village /><VillageLife t={{t}} traffic={{false}} dog={{false}} />{{DAY()}}<P o={{w}} /></>, cam: mv({{pos: [0.6, 1.5, 3.2], look: [0, 1.3, 0], fov: 46}}, lt, {{arrive: 0.06, push: 0.06}}), bg: SKY}}; }};
const WRITTEN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = {{
  // open: (t, lt, C) => {{ … }},
}};
export const SHOT_FN: Record<string, (t: number, lt: number, C: Cast) => ShotOut> = Object.fromEntries(SHOTS.map((s) => [s.name, WRITTEN[s.name] ?? stub]));
void [ev, near, sm, bw, hideProps, prop, strike, CELL_BG, toward, hand, hw, hdir]; void ({{}} as V3);
""")
pl = ren((ROOT / f'episodes/absurd-cases/ep{M}_plan.py').read_text(encoding='utf-8')).split('\n'); out = []; skip = None
for line in pl:
    if skip:
        if line.startswith(skip): skip = None
        else: continue
    if line.startswith('HOLD ='): line = "HOLD = 2.0                     # TODO seconds after the last word: 1.6–2.2 by the kind of ending (a silent picture gag needs the most)"
    elif line.startswith('speech = E('): line = "LAST = script['lines'][-1]['id'].split('-')[1]; speech = E(LAST)"
    elif line.startswith('L = '):
        out += [line, "# TODO the events of THIS story. Tie every one to a card start P('l00X', i) or a card end E('l00X'), never to bare seconds, and name every moment",
                "#      of contact (a bite, a slap, a door shutting): the shots, the mix and tools/qa_strips.py all look events up by name.",
                "ev.update(end=E(LAST))"]; skip = 'ev = {'; continue
    elif line.startswith('SHOTS = ['):
        out += ["# TODO one entry per cut, (name, time), in order. Cut L (0.2 s) before a sentence and 0.05–0.08 s before a line's second card;",
                "#      a silent beat that shows a new picture is its own shot (≥ 0.5 s: raise that line's gap in epN_gaps.txt, do not squeeze the shot).",
                "SHOTS = [('open', 0.0)]"]; skip = 'TOTAL ='; continue
    out.append(line)
put(f'episodes/absurd-cases/ep{N}_plan.py', '\n'.join(out))
put(f'tools/premix_absurd_ep{N}.py', ren((ROOT / f'tools/premix_absurd_ep{M}.py').read_text(encoding='utf-8')))
g = ren((ROOT / f'tools/ai-sfx/gen_sao_ep{M}.py').read_text(encoding='utf-8')).replace(f'out_sao{M}', f'out_sao{N}')
g = re.sub(r'CUES = \[.*?\n\]\n', "CUES = [  # cue, seconds, CLAP target, prompt — only what `sfx_index.py search` cannot find\n]\n", g, flags=re.S)
put(f'tools/ai-sfx/gen_sao_ep{N}.py', g)
rp = ROOT / 'src/Root.tsx'; r = rp.read_text(encoding='utf-8')
if f'AbsurdEp{N}/Episode' in r: print('Root.tsx already registers', N)
else:
    imp = next(l for l in r.split('\n') if f"'./episodes/AbsurdEp{M}/Episode'" in l); comps = [l for l in r.split('\n') if f'id="AbsurdEp{M}"' in l or f'id="AbsurdEp{M}Blur"' in l]
    sw = lambda l: l.replace(f'AbsurdEp{M}', f'AbsurdEp{N}').replace(f'ABSURD{M}_', f'ABSURD{N}_')
    r = r.replace(imp, imp + '\n' + sw(imp)).replace(comps[-1], comps[-1] + '\n' + '\n'.join(sw(l) for l in comps)); rp.write_text(r, encoding='utf-8', newline='\n'); print('registered in src/Root.tsx')
print(f'next: write the two TODO blocks in episodes/absurd-cases/ep{N}_plan.py, run it, fill the three TODOs in src/episodes/AbsurdEp{N}/Episode.tsx, then: pnpm exec remotion render src/index.ts AbsurdEp{N} qa/ep{N}/draft.mp4 --gl=angle --scale=0.3')
