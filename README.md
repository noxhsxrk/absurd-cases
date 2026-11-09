# absurd-cases (คดีไม่เป็นคดี)

Thai deadpan-narrator shorts, low-poly 3D, 1080×1920 @ 30 fps: "ชายคนนี้ … นั่นคือ[ข้อหา] เขาเลยโทรแจ้งตำรวจ". Remotion 4 + @remotion/three.

| Episode | Composition | Runtime | Source |
|---|---|---|---|
| EP1 ยุงทำร้ายร่างกาย | `AbsurdEp1` | 33.7 s | `src/episodes/AbsurdEp1` |
| EP2 คดีช็อตไม่เลือกหน้า | `AbsurdEp2` | 34.6 s | `src/episodes/AbsurdEp2` (reuses EP1's sets and cast) |
| EP3 คดีบุกรุกปอด | `AbsurdEp3` | 36.4 s | `src/episodes/AbsurdEp3` (bedroom by day, helicopters + vacuum, court, cells 18/19/20) |

## Run

```bash
pnpm install && bash tools/rb_setup.sh                 # fetches the mocap clips and fonts
pnpm exec remotion studio src/index.ts
pnpm exec remotion render src/index.ts AbsurdEp2 out/absurd-ep2.mp4 --gl=angle
```

On Nox's PC, double-click `render_absurd.bat` (EP2) or `render_absurd_ep3.bat` (EP3).

## Layout

- `src/pov/`: the character and set kit this series builds on
- `src/episodes/AbsurdEpN/`: one folder per episode (cast, props, shots, UI)
- `episodes/absurd-cases/`: script, voice prompt, timing plan, shot list, voice takes
- `episodes/absurd-cases/sfx/`: AudioLDM2 sound-effect generators, run on the PC
- `tools/premix_absurd_ep2.py`: the EP2 mix. It reads `public/absurd-cases/ep2/sfx_ai/` (16-bit WAVs converted from the generated takes, not committed)
- `public/absurd-cases/epN/`: timelines and final mixes the render reads

## Timing

`python3 episodes/absurd-cases/ep2_plan.py` writes `public/absurd-cases/ep2/ep2_timeline.json`, the only source of cuts, cards and events for EP2.

## EP3 audio pipeline

`episodes/absurd-cases/sfx/run_ep3_prep.bat` (PC) runs Whisper word timings + the AudioLDM2 cues. `tools/tighten_take.py` cuts the single Fenrir take by `ep3_cuts_fenrir.json` into `ep3_narration_tight.wav` + `ep3_line_timing.json`; then `ep3_plan.py` and `tools/premix_absurd_ep3.py`.

## Not in this repo yet

EP1's script, timing plan and premix were written in an earlier session and were not on the PC, so they are missing here. EP1 still renders from its committed timeline and mix.

## Layout on Nox's PC (`C:\Claude\absurd-cases`, everything for the series lives here)

| Path | What |
|---|---|
| `src/`, `public/`, `tools/*.py`, `render_absurd_ep*.bat` | Remotion project (EP1–7 3D, EP8+ captions/plates/UI/mix compositing). `public/rb` = Rocketbox mocap (glb, not in git), `public/fonts` |
| `episodes/absurd-cases/` | scripts, voice prompts, Fenrir cuts, timing plans, study notes (`ref5_visual_notes.md`) |
| `public/absurd-cases/epN/` | narration takes, timelines, final mixes, `sfx_ai/` takes used by each premix |
| `tools/ai-sfx/` | AudioLDM2 SFX + Whisper word timing (`gen_sfx_ep*.py`, `transcribe*.py`, `run_*.bat`), its `.venv` (torch cu124) and every generated take (`out*/`, not in git) |
| `tools/tts/` | old Gemini TTS helper (voices are now made by Nox in AI Studio, voice Fenrir) |
| `blender/` | Blender 4.2 pipeline: `lib/` (look kit, sets), look-dev scripts, `run_blender.bat <script.py>`, `mixamo/` FBX (not in git) |
| `out/` | renders |

Set up from the old folders once with `tools/migrate_from_old_folders.bat` (copies from `C:\Claude\pov-story`, `C:\Claude\ai-sfx`, `C:\Claude\blender`, Downloads; deletes nothing). Hugging Face models (AudioLDM2, Whisper) stay in the user cache.
