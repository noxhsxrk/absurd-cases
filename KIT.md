# POV Story Kit — reference (read this, not the source)

Version: see `src/pov/VERSION` (2026-11-02: cast/rig upgrades, acting + finger shapes, gaze camera, school + metro sets, story UI, sound library, examples).

Low-poly 3D POV story shorts in Remotion + React Three Fiber. **Everything visual is built in code**; the only downloaded data is free MIT mocap (Microsoft Rocketbox) fetched by `tools/rb_setup.sh`. Units: 1 = 1 m, y up, characters face +z at yaw 0. Every frame is a pure function of time `t` (no `Math.random`, `Date`, timers).

## Setup (once per project)
```bash
pnpm install
bash tools/rb_setup.sh            # git sparse-clones Rocketbox → public/rb/anims_{m,f}.glb + manifest, copies Prompt fonts
pnpm exec tsc --noEmit
node scripts/stills.mjs OfficePOV qa/check 0.5 15,110,200   # renders stills + contact sheet — open them
pnpm exec remotion studio src/index.ts
```
More clips: `CLIPS="run_fast_01 cheer_01 crouch_idle" bash tools/rb_setup.sh` (names = Rocketbox file names without `m_`/`f_`/`.max.fbx`; ~400 exist: idles, talk/listen with moods, laugh, shrug, cheer, clap, wave, dance, sit chair/table + sit-down/stand-up, phone talk/text, drink, documents, newspaper, umbrella, trolley, bag, knock/try door, take picture, crouch, walk/run variants incl. injured/drunk, turns). Map a new clip to a sim pose in `RbPerson.tsx` (`STAND` / `SIT`). No falls, lying, crawling or carrying people in the library — do those as procedural bone overrides (see `rot()` in `drive`).
Sandbox without GPU: `remotion.config.ts` and `scripts/stills.mjs` pick `swangle` automatically when `/opt/pw-browsers` exists (override with `POV_GL`, `POV_BROWSER`). On a normal machine: `--gl=angle`.

## Library (`src/pov/`)
| Path | What |
|---|---|
| `cast/Toon.ts` | **Code-built low-poly people** on the Biped skeleton: lathed body, tapered limbs, **five-fingered hands** on the Biped finger bones (palm box sized from Finger1/Finger4, 3 tapered segments per finger + knuckle spheres + thenar pad; mitten only as a fallback), shoes, cartoon face (eyes + highlight, brows, nose, mouth, blink/talk). Hair `short long bob bun cap bald` + 12 male styles (`MALE_HAIR`: buzz crew undercut sidePart quiff curtain spiky messy slick curly…). Outfits `shirt shortSleeve suit blouse vest`; school uniform options (`shorts socks bow pocket belt buckle sailor untucked`); **skinned trousers/shorts/skirts** (`skirt`, `pleats`, `skirtHem`, `skirtFlare`) that bend with the legs. **Add a person = one line in `TOON`.** |
| `cast/RbPerson.tsx` | Mocap driver: `useRb([], 'toon')` + `useCast(ids)` outside the canvas; `drive(I, state, t)` per frame: pose → clip (`STAND`/`SIT`, missing clip → nearest procedural pose), upper/lower split, footsteps by distance, glances (`pose.hy`), **head-pitch aim** (`pose.lookL` = target in root-local cm, `pose.lookK` strength; neck 40 % / head 60 %, ±0.75 rad), crouch-walk + squat (`crouchBody`), seated phone pose, props, blink + talk. Restores the last mixer pose each frame (no accumulating overrides). |
| `cast/FpvHands.tsx` | Viewer's arms: `GRIPS` (`open relaxed mug phone point press fist wave`), `mixGrip`, `handQuat`, `FpvArm`, `MugInHand`, `PenInHand`, `PhoneInHand`, and **`PhoneGrip`** (one-handed phone hold modelled around the phone: fingers round the left edge, thumb on the right edge, `tap` 0→1 to the glass, `phone`/`hand` toggles). |
| `cast/CardGrip.tsx` | **`CardGrip`**: a right hand holding a card the way people do (thumb pad on the front face, index + middle flat behind, ring + little curled under the bottom edge), modelled around the card like `PhoneGrip`; sleeve/cuff/bracelet colours, `map` = card texture. Pose it with `handQuat(cardUp, cardFront)`. Every new handheld prop gets a grip built like this, not a prop stuck onto a generic pinch. |
| `cast/library/*.ts` | **Character library** (register into `TOON` on import): `lockdown.ts` (Thai school: teacher, class monitor, students, auto-generated classmates), `lockdown2.ts` / `lockdown3.ts` (janitor, runners, police, volunteers, parents), `metro.ts` (night-train cast: May, Win + his double, Aunt Duean, boy, platform staff, street extras; `VIEWER` sleeves). Import one, copy the looks you need under new ids. |
| `acting/ik.ts` | **Arm acting on the mocap**: `ik` (two-bone, elbow pole), `handTo` (fingers dir + thumb roll = which way the palm faces), `reachable` + `resetTurn` (trunk twists first, no arm aimed behind the body), `toLocal` (world → root cm), **`onSide(s, side, w, d)` / `ahead(s, d, y)`** (world gesture targets on the person's own left/right / in front: two-handed gestures never cross the arms), **`fingers(I, side, shape, k)`** with shapes `open flat point fist cup claw relaxed`, and **`GEST`**: `stopPalm point palmsDown shh holdRoom reach glassPalm shrug earCup hugKnees coverHead beckon` — each sets its hand shape. Call `resetTurn(I)` once per person per frame, then gestures, after `drive()`. |
| `camera/gaze.ts` | **Embodied head camera**: `makeGaze({eye, keys, zooms})` → spring gaze (ω 8.5, ζ 0.72, 0.15 s delay) over keys `[t, target, slowSeconds?]` (slow deliberate turns), `zoomAt` push-ins `[from, to, deg, rampIn?]`, `startle(t, t0)` (jerk/shake/FOV kick), `toBody` (lap hands counter-rotated with the head so they leave frame), `fovScale` (camera-space hands keep their size when zoomed), `aimAngles`. |
| `fx/sun.tsx` | `SnapSun`: camera-following shadow sun snapped to shadow-map texels (no floor shimmer). |
| `fx/atmos.tsx` | `Shafts` (window light cones), `Motes` (seeded dust). |
| `fx/animals.tsx` | Code-built animals (no animal mocap exists): **`Dog`** (Thai street dog, real diagonal trot from `phase`, wagging tail) and **`Cat`** (sitting, glowing eyes, tail twitch, head `look`). Time their paths so they cross the camera's view while it looks there. |
| `ui/story.tsx` | Story overlay: `useFontsReady`, `Hud` (date/clock/place), **`KaraokeCaptions`** (word-lit, speaker tag, reads `epN_words.json`), `Captions`, **`Eyelid`** (k 0 open → 1 shut), `Grade`, **`DecisionCard`**, **`PartCard`**, `useScreens` (phone UI textures example). Layer order: canvas → grade → HUD → eyelid → blackout → captions → flash → cards. |
| `ui/quality.ts` | **Studio playback quality**: `qualitySchema` (zod 3.22.3) + `canvasQuality(q)` → `dpr`, `shadows`, `antialias` for `<ThreeCanvas>`; `fast` (default) / `draft` / `full`; renders always full. Register with `schema={qualitySchema} defaultProps={{quality: 'fast'}}` so the Props panel shows the dropdown. |
| `lib/tex.ts` | Canvas-texture kit: `tex(key,…)` (cached), `canvasTex` (uncached), `speckle`, `grime`, `wrapText`, `M`/`MB` material caches, `glowTex`, `F` Thai font string. |
| `sets/Interior.tsx` + `sets/layout.ts` | Eye-level office (demo `OfficePOV`). Floor plan = furniture list (nav obstacles) + stations. |
| `sets/school/` | Thai secondary school (lockdown-class): `Classroom` (room 325, `ClassState`: lights, clock, desks moved, door swing + thumbturn, phones lit, fan, dust; `gun` time for the outside reaction), `Exterior` + `ExteriorLife` (3D view from the windows: track, PE class, opposite block, gate guard, dog, traffic, birds — all react to `gun`), `Building` (corridors, back stairs, under-block, canteen, back gate with chain, shophouse alley start; `SetState`), `Front`, `Temple` (`Alley3`, temple yard with sala/tent/chedi, police `Car` with a `CarCue`), `layout.ts` (desks, crouch spots, stations). |
| `sets/metro/` | Bangkok-style metro (mrt-train-zero): `TrainCar` (blue seats, Y-poles, straps, door LCD with `lcd` modes route/zero/rules/pa/station, red priority-seat covers, emergency light, window crack 0→1, broken pane, `CarLights`, `Shards`, `flicker`), `Tunnel` (ring segments, lamps, `nearLamps`), `Station` (`Platform` with PSDs, crowds, `TrainShell`), `Street` (exit stair + canopy, night street, **`Stairwell`** below: tiled walls, slab ceiling, fluorescent tubes, landing, lit station sign; `dogT0` times the dog's pass), `ui.tsx` (`HudMrt`, `clockOf`, `useMrtScreens` phone screens, `CardInHand`, `GradeMrt`). |
| `sheets/` | QA compositions: `ToonSheet`, `FpvSheet`, `CastSheet`, `UniformSheet`, `GarmentSheet`, `GestureSheet` (every gesture on adult / crouched adult / crouched student), `PhoneTest`, `NpcPhoneTest`, `SetTour` (school sets), `WindowTest`, `MrtLookdev` (metro sets × states × camera heights), `MrtCast`, `MrtHair`, `MrtPov`. |
| `life/*` | Living extras: plans of `go`/`doo` acts, A* paths, rendezvous, turn-taking talk, glances, push-apart; `pnpm dlx tsx scripts/verify.ts`. (Bound to `sets/layout.ts`; a new set brings its own layout + a copy of `life/` as lockdown-class did.) |
| `PovScene.tsx` | Demo shot (office, mug in hand, HUD, caption). |

## Sound library (`library/`)
| Path | What |
|---|---|
| `library/sfx/<category>/*.flac` | **80 cues** from both series: ambience beds (train interior, horror drone, school yard, canteen, flicker buzz, whispers), world (station pass, helicopter, sirens, police arrival, car door, gate, dog, birds), people (steps, stairs, runners, crowd shuffle/screams/stampede, breath, heartbeats), foley (desk drag, doors, lock, handle, knock, switch, phone tap, bags, chain, keys, glass scrape/hit), impacts (glass crash/crack, sub boom, thuds, distant gunshots), horror (stingers, risers), signals (metro/school chimes, alert, PA hiss/cut, phone buzz/dial, radio squelch/static). `CATALOG.md` = measured duration/attack/peak-at/centroid + use; `catalog.json` for scripts. |
| `library/voices/` | One MP3 per Gemini TTS voice as cast (Zeno, Zuri, Riko, Gacrux, Enya, Vindemiatrix, Kira, Elio, Nyla, Puck, Rasalgethi, Cruz, Algenib, + rejected Fenrir) and `CASTING.md` (voice → character → exact style text → sample line, and the casting rules). Audition from these before generating. |

## Tools (`tools/`)
| Tool | What |
|---|---|
| `rb_setup.sh` | Rocketbox mocap + fonts. BASE = 40 clips (office + school + crouch + nervous + door clips). |
| `sfx_lib.py` | `list [category]`, `find <word>`, `pull <public/…/sfx> cue=category/name …` (→ 48 kHz WAV the premix reads), `add <wav> <category/name> "use"`. |
| `mixlib.py` | Premix helpers: `read` (WAV/FLAC/MP3 → 48 kHz), filters, `ir`/`verb` rooms, `comp`, `radio`, `pa_speaker`, `peak_to`/`rms_to`, `loop_to`, `env`, `Mix` (`voice` levelled by emotion `TARGET`, `put`/`put2` with pan/width, `bed`, `master` with ducking + quiet windows + compressor → loudnorm → limiter), `check` (LUFS/LRA/TP, RMS spread, dead air, stereo width). |
| `synth_sfx_recipes.py` | Deterministic numpy SFX recipes (gunshots far / through a PA, thuds, handle, knock, lock, switch, chimes, alert, PA hiss/cut, heartbeat, breath, shuffle, chairs, scrape, roomtone, murmur, riser) — the fallback when audio-studio is unavailable. |
| `collect_tts.py` | Rebuild Gemini takes from browser-dumped chunks (`--tr`, `--since` so old takes never win). |
| `post_tts.py` | Trim takes → `lines/<id>.wav` + `epN_lines_meta.json` (dur + voiced segments) + review MP3. Run on a temp root to re-voice only some lines. |

## Examples (`examples/`)
Frozen, uncompiled copies of lockdown-class (3 eps) and mrt-train-zero (EP1): episode code, plans (`epN_plan.py`), premixes, bibles, voice prompts, TTS job files. See `examples/README.md` for what to copy from where.

## Recipes
* **New character**: add `TOON.<id> = {skin, hair, hairStyle, top, under?, tie?, pants, skirt?, shoes, outfit, glasses?, headphones?, cap?, female, build}`; give the agent a plan in `plans.ts`; render `ToonSheet`.
* **Hand action**: blend grips over time, e.g. `mixGrip(GRIPS.relaxed, GRIPS.press, smooth((t-3)/0.3))` while moving the wrist toward the elevator button; `phone` grip + `PhoneInHand screen={canvasTexture}` for phone UI inserts.
* **New set**: build a component like `Interior` (boxes/lathes/canvas textures), put solid furniture into the layout list so A* avoids it, name stations, write plans for everybody (even extras get "doing now → next").
* **Shot**: one composition or `<Sequence>` per shot, each with its own `camAt`; story clock in the HUD from the same `t`.
* **Credit** in the video description: "Motion: Microsoft Rocketbox Avatar Library (MIT)". License copied to `public/rb/LICENSE-Rocketbox.md`.
* **Gestures on a line**: after `drive(I, s, t)`: `resetTurn(I); GEST.point(I, 'R', toLocal(I, s, SIGN_WORLD), env)`; heads: set `s.pose.lookL = toLocal(I, s, target)` (cm) so speakers look at the viewer / the sign at its height.
* **Head camera**: `const head = makeGaze({eye, keys, zooms})`; per frame `const g = head.at(t)`; `fov = 66 - head.zoomAt(t) + startle(t, ev.slam).fov`; lap hands through `toBody(arm, aimAngles(eye, KNEES), g.yaw, g.pitch)` and drop them when they leave frame.
* **Metro scene**: `import '../cast/library/metro'`; `<TrainCar st={{...CAR_DEFAULT, t, light, lcd: 'rules', rulesShown: 2}} ready={fonts} />` + `<CarLights …/>` + `<Tunnel s={distance} …/>`; seats in `SEAT`. See `MrtLookdev` for lighting per state.
* **School scene**: `<Classroom st={…ClassState} />`, `<Building st={…SetState} />`, `<Front t />`, `<Alley3 t /> <Temple t /> <Car t cue={…} />` with `<SnapSun p={eye} />`. See `SetTour`.
* **Sound for an episode**: `python3 tools/sfx_lib.py pull public/<slug>/ep1/sfx train_bed=ambience/train_interior_bed glass_hit=foley/glass_hit …`, then a premix built on `tools/mixlib.py` that places every cue from the plan's events (copy `examples/mrt-train-zero/tools/premix_mrt_ep1.py`). New audio-studio picks go back with `sfx_lib.py add`.
* **Voices**: audition from `library/voices/` (CASTING.md has the exact style text); generate in AI Studio one take per line; `collect_tts.py` → `post_tts.py`.
