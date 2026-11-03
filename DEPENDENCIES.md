# Dependencies

Check everything at once: `bash tools/doctor.sh` (prints OK / MISSING per item, and the install command for anything missing).

## Required (render a video)
| What | Version | Why | Install (macOS · Ubuntu) |
|---|---|---|---|
| Node.js | ≥ 20 (tested 22) | Remotion bundler/renderer, `tools/rb_convert.mjs`, `scripts/stills.mjs` | `brew install node` · nodesource / `nvm install 22` |
| pnpm | ≥ 10 (tested 10.28) | package manager — **never npm/npx/yarn** | `corepack enable && corepack prepare pnpm@latest --activate` |
| git | any | `tools/rb_setup.sh` sparse-clones Microsoft Rocketbox | `brew install git` · `apt install git` |
| ffmpeg + ffprobe | ≥ 6 | audio conversion, loudness checks, contact sheets, SFX library pull | `brew install ffmpeg` · `apt install ffmpeg` |
| Python 3 | ≥ 3.10 | plans, premix, TTS post, SFX library | system / `brew install python` |
| numpy, scipy | numpy ≥ 1.26, scipy ≥ 1.11 | premix (`tools/mixlib.py`), SFX synthesis, catalog metrics | `pip install numpy scipy` (`--break-system-packages` on Debian/Ubuntu system Python) |
| Chrome / Chromium | Remotion downloads its own headless shell on first render | rendering | automatic; in a GPU-less sandbox `scripts/stills.mjs` uses `/opt/pw-browsers` + `swangle` |
| GPU (user machine) | any | `--gl=angle` renders ~1 s/frame instead of 5–7 s | — |

### Node packages (`package.json`, pinned)
| Package | Version | Note |
|---|---|---|
| `remotion`, `@remotion/cli`, `@remotion/bundler`, `@remotion/renderer`, `@remotion/three`, `@remotion/fonts` | **4.0.355** | keep all `@remotion/*` on the same version |
| `three` / `@types/three` | **0.169.0** | Rocketbox FBX → GLB conversion and the toon cast depend on this API |
| `@react-three/fiber` | **8.17.10** | React 18 line |
| `react`, `react-dom` | **18.3.1** | |
| `@fontsource/prompt` | ^5.3.0 | Thai/Latin font files copied to `public/fonts` by setup |
| `typescript` | **5.6.x** | newer TS breaks the Remotion 4.0.355 bundler |
| `zod` | **3.22.3** | the version Remotion 4.0.355 pins; needed for Studio prop schemas (`ui/quality.ts`) |
| `@gltf-transform/core`, `@gltf-transform/functions`, `meshoptimizer` | 4.1.1 / 0.22.0 | mocap conversion (dev) |

`pnpm-workspace.yaml` approves the `esbuild` and `sharp` build scripts (pnpm ≥ 10 blocks them otherwise). Never ship a `pnpm-lock.yaml` resolved elsewhere over a user's project.

### Downloaded data (free)
| What | License | Where |
|---|---|---|
| Microsoft Rocketbox mocap (40 clips × 2 genders; optional textured avatars) | MIT — credit "Motion: Microsoft Rocketbox Avatar Library (MIT)" | `bash tools/rb_setup.sh` → `public/rb/` (+ `src/pov/cast/rbManifest.ts`) |
| Prompt font (Thai + Latin, 400/600/700) | OFL | copied from `@fontsource/prompt` → `public/fonts/` |

## Needed for specific steps
| What | For | Install |
|---|---|---|
| `pythainlp` | Thai word segmentation for karaoke captions (`epN_plan.py` / `epN_words.py`) | `pip install pythainlp` |
| `tsx` (via `pnpm dlx tsx`) | running `scripts/verify.ts` and check scripts | none — fetched on demand |
| Google AI Studio (Gemini TTS) + the user's API key | character voices (one take per line), driven in the Claude desktop **built-in browser** | the user selects the key in the AI Studio UI; never read keys from files/env |
| Claude desktop app linked to the computer | built-in browser (AI Studio), audio-studio, writing into the project folder | open the task in the desktop app → "Link to this computer" |
| **audio-studio-mcp** (Stable Audio 3, local on a Mac) | generating SFX (`generate_audio`, `process_audio`, `unload_models`) | installed on Nox's Mac at `~/playground/audio-studio-mcp`; outputs in `…/outputs` |

## Optional fallbacks
| What | For | Install |
|---|---|---|
| `edge-tts` | free Thai voices (th-TH-PremwadeeNeural / NiwatNeural) when AI Studio isn't available | `pip install edge-tts` |
| Kokoro-82M | free English voices | `pip install kokoro` |
| `faster-whisper` (or `mlx-whisper` on Apple Silicon) | word timestamps for user-supplied audio | `pip install faster-whisper` |
| `pillow` | image checks in QA scripts (luminance/saturation of stills) | `pip install pillow` |
| `@react-three/rapier` | deterministic physics (collapses, crashes) | `pnpm add @react-three/rapier` |
