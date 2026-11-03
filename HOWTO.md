# How to make a POV story episode with this kit

From an empty folder to a rendered vertical episode (1080×1920, 30 fps). Everything visual is code; sound comes from the library, audio-studio or synthesis; voices from Gemini TTS. API details are in `KIT.md`; installs in `DEPENDENCIES.md`.

## 0 · Start a project
```bash
git clone https://github.com/noxhsxrk/pov-story-kit my-series && cd my-series && rm -rf .git   # or copy src/pov tools scripts library into an existing project
bash tools/doctor.sh                    # every dependency OK?
pnpm install && bash tools/rb_setup.sh  # mocap + fonts (needs extra clips? add them to BASE in tools/rb_setup.sh, not a second command)
pnpm exec tsc --noEmit
node scripts/stills.mjs OfficePOV qa/check 0.5 15,110,200     # open the PNGs: the kit renders on this machine
pnpm exec remotion studio src/index.ts                         # browse every sheet: CastSheet, GestureSheet, SetTour, MrtLookdev …
```
Existing project: compare `src/pov/VERSION`, copy `src/pov/`, `tools/`, `scripts/`, `library/`, `KIT.md`, merge `package.json` deps; keep the user's lockfile.

## 1 · Write the series (no code yet)
Create `episodes/<slug>/` with:
- `series_bible.md` — premise, cast (name, voice, one-line personality, a `TOON` look), the viewer (skin, sleeve), extras with routines, background life, locations + floor plans, story clock, per-episode hook / turn / cliffhanger / decision, a names section, look per location, asset list. Copy the shape of `examples/mrt-train-zero/episodes/mrt-train-zero/series_bible.md`.
- `ep1_script.json` — `{"lines":[{"id":"ep1-l001","speaker":"MAY","text":"…","emotion":"afraid","shotHint":"…"}]}`; 3–12 Thai words per line, numbers spelled out.
- `voice_prompt.md` — speaker → AI Studio voice → style text. **Audition first**: play `library/voices/*.mp3` (see `library/voices/CASTING.md`) and pick voices whose texture differs from the viewer's.
- Story-logic pass: decision still open at the end, nobody knows names they shouldn't, every "there is…" line is preceded by a look, the scary thing looks wrong.

## 2 · Voices
1. `episodes/<slug>/ep1_tts_jobs.json` — `[{"id","sp","voice","style","text"}]`, one take per line (copy `examples/mrt-train-zero/episodes/mrt-train-zero/make_jobs.py`).
2. Generate in Google AI Studio's speech playground (built-in browser of the Claude desktop app; the user picks the key). Dump the takes, then
   ```bash
   python3 tools/collect_tts.py public/<slug>/ep1/src --since <unix time of this run>
   python3 tools/post_tts.py 1 public/<slug> episodes/<slug>/ep1_script.json   # → lines/<id>.wav + ep1_lines_meta.json + review mp3
   ```
3. Listen to the review MP3; regenerate single lines by id. Re-voicing a few lines: run `post_tts.py` on a temp root with only those takes, then merge.
Free fallback: `edge-tts` (see `examples/lockdown-class/episodes/lockdown-class/make_voices.py`).

## 3 · Plan the timeline
`episodes/<slug>/ep1_plan.py` (copy `examples/mrt-train-zero/episodes/mrt-train-zero/ep1_plan.py`): lays lines on a timeline with per-line gaps, defines story events (`ev['slam'] = LN['ep1-l039']['t0'] - 0.95`), light curves, and writes `ep1_timeline.json` + karaoke `ep1_words.json`. **Never hard-code seconds** elsewhere — the picture and the mix read events from this file. Need room for an action? Widen that line's gap.
```bash
pip install pythainlp; python3 episodes/<slug>/ep1_plan.py
```

## 4 · Cast and sets
- **People**: one `TOON` line per character (or copy looks from `src/pov/cast/library/*.ts`). Check with `CastSheet` / `GarmentSheet` and a close-up at the episode's camera heights.
- **Sets**: reuse `sets/school/*` or `sets/metro/*`, or build a new one in their style (canvas textures via `lib/tex.ts`, every far thing in 3D and alive, `state` props for story changes). Make a lookdev composition like `SetTour` / `MrtLookdev` and open it before shooting.
- **Light**: `SnapSun` for daylight that follows the camera; practicals with halos; nothing pure black.

## 5 · Build the episode
`src/episodes/<Series>Ep1/` (copy `examples/mrt-train-zero/src/episodes/MrtEp1/` as the template):
- `data.ts` — imports the timeline JSON, `ev()`, `T0()/T1()` helpers.
- `headcam.ts` — `makeGaze({eye, keys, zooms})` from `camera/gaze.ts`: gaze keys per beat (turn to each speaker, look before you say, slow turns with a 3rd value), push-ins for far speakers and text, `startle()` on the scare.
- `people.ts` — per-frame state for everyone: pose, position, `talking`/`talkK`, `pose.lookL` (what they look at, at its height), gestures per line.
- `Episode.tsx` — `ThreeCanvas` with the set + `RbPerson`/`drive` cast + gestures (`resetTurn`, `GEST.point/shh/glassPalm…`, `fingers`) + camera hands (`FpvArm`, `PhoneGrip`, lap hands through `toBody`), then the 2D layer: grade → HUD → `Eyelid` → blackout → `KaraokeCaptions` → flash → `DecisionCard` / `PartCard`. One `<Audio>` for the mix.
- Register `<Composition id="<Series>Ep1" … width={1080} height={1920} fps={30}>` in `src/Root.tsx`; `pnpm exec tsc --noEmit`.

## 6 · Sound
```bash
python3 tools/sfx_lib.py list                      # or: find glass / list horror
python3 tools/sfx_lib.py pull public/<slug>/ep1/sfx train_bed=ambience/train_interior_bed glass_hit=foley/glass_hit \
        stinger=horror/stinger_reveal sub_boom=impacts/sub_boom heartbeat=people/heartbeat_100bpm
```
Missing a cue? Generate it with audio-studio (`generate_audio` sfx, English prompt with source/material/action/space, `variations: 2` for hero cues), pick by the measured numbers, and add it back: `python3 tools/sfx_lib.py add take.wav horror/new_cue "what it is"`. No audio-studio → `tools/synth_sfx_recipes.py`.

Premix `tools/premix_<slug>_ep1.py` on `tools/mixlib.py` (copy `examples/mrt-train-zero/tools/premix_mrt_ep1.py`): voices levelled by emotion with room reverb and pan, beds looped and ducked, every cue placed from events, a jump scare = visual hit + snap zoom + glass/impact + stinger + low thud within 0.1 s, never a stinger on a word. Then
```bash
python3 tools/premix_<slug>_ep1.py
python3 -c "import sys; sys.path.insert(0,'tools'); from mixlib import check; check('public/<slug>/ep1/mix/ep1_mix.wav')"   # aim −14…−16 LUFS, TP ≤ −1, LRA ≤ 6
```

## 7 · QA (open every image)
```bash
node scripts/stills.mjs <Series>Ep1 qa/<slug>/ep1 0.5 <2 frames per beat>
```
Check at full scale: the speaker of every line is visible and looks at what they address; fingers match the gesture; captions readable with eyes shut and in black; no grey board, no floor flicker (3 consecutive frames on floors), feet on floors, no camera inside geometry, lap hands leave the frame when looking up. Fix, re-render only what changed. Say what only motion/listening can confirm.

## 8 · Render
```bash
pnpm exec remotion render src/index.ts <Series>Ep1 out/<slug>-ep1-preview.mp4 --scale=0.25 --gl=angle
pnpm exec remotion render src/index.ts <Series>Ep1 out/<slug>-ep1.mp4 --gl=angle --concurrency=<cores>
```
Description: hook without spoilers, "เรื่องแต่ง" line when there is no badge, hashtags, and "Motion: Microsoft Rocketbox Avatar Library (MIT)".

## 9 · Give back to the kit
New outfits, sets, gestures, UI pieces or SFX picks that worked: copy them into `src/pov/…` / `library/`, document them in `KIT.md`, bump `src/pov/VERSION`, push a branch and open a PR.
