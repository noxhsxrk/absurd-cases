#!/usr/bin/env bash
# Check every dependency of the POV story kit. usage: bash tools/doctor.sh
cd "$(dirname "$0")/.."
ok=0; bad=0
y() { printf '  \033[32mOK\033[0m       %-22s %s\n' "$1" "$2"; ok=$((ok+1)); }
n() { printf '  \033[31mMISSING\033[0m  %-22s → %s\n' "$1" "$2"; bad=$((bad+1)); }
o() { printf '  \033[33moptional\033[0m %-22s → %s\n' "$1" "$2"; }
mac=$([ "$(uname)" = Darwin ] && echo 1 || echo 0)
inst() { [ $mac = 1 ] && echo "brew install $1" || echo "sudo apt install $2"; }
pipi() { [ $mac = 1 ] && echo "pip3 install $1" || echo "pip3 install --break-system-packages $1"; }
echo "Required"
if command -v node >/dev/null; then v=$(node -v); [ "${v:1:2}" -ge 20 ] 2>/dev/null && y node "$v" || n node "need ≥ 20 (have $v)"; else n node "$(inst node nodejs)"; fi
command -v pnpm >/dev/null && y pnpm "$(pnpm -v)" || n pnpm "corepack enable && corepack prepare pnpm@latest --activate"
command -v git >/dev/null && y git "$(git --version | cut -d' ' -f3)" || n git "$(inst git git)"
command -v ffmpeg >/dev/null && y ffmpeg "$(ffmpeg -version | head -1 | cut -d' ' -f3)" || n ffmpeg "$(inst ffmpeg ffmpeg)"
command -v ffprobe >/dev/null && y ffprobe "" || n ffprobe "comes with ffmpeg"
command -v python3 >/dev/null && y python3 "$(python3 -V | cut -d' ' -f2)" || n python3 "$(inst python python3)"
for m in numpy scipy; do python3 -c "import $m" 2>/dev/null && y "$m" "$(python3 -c "import $m;print($m.__version__)")" || n "$m" "$(pipi $m)"; done
[ -d node_modules/remotion ] && y node_modules "remotion $(node -p "require('remotion/package.json').version" 2>/dev/null)" || n node_modules "pnpm install"
[ -f node_modules/typescript/package.json ] && { tv=$(node -p "require('typescript/package.json').version"); [[ $tv == 5.6.* ]] && y typescript "$tv" || n typescript "pin 5.6.x (have $tv): pnpm add -D typescript@5.6.3"; }
[ -f public/rb/anims_m.glb ] && y rocketbox-mocap "public/rb" || n rocketbox-mocap "bash tools/rb_setup.sh"
[ -f public/fonts/Prompt-thai-400.woff2 ] && y fonts "public/fonts" || n fonts "bash tools/rb_setup.sh"
echo "For captions / voices / SFX"
python3 -c "import pythainlp" 2>/dev/null && y pythainlp "" || n pythainlp "$(pipi pythainlp)"
[ -d library/sfx ] && y sfx-library "$(find library/sfx -name '*.flac' | wc -l | tr -d ' ') cues" || n sfx-library "library/ missing — re-clone the kit"
[ -d "$HOME/playground/audio-studio-mcp" ] && y audio-studio-mcp "$HOME/playground/audio-studio-mcp" || o audio-studio-mcp "Stable Audio 3 MCP on the Mac (only for generating new SFX)"
echo "Optional fallbacks"
python3 -c "import edge_tts" 2>/dev/null && y edge-tts "" || o edge-tts "$(pipi edge-tts)"
python3 -c "import faster_whisper" 2>/dev/null && y faster-whisper "" || o faster-whisper "$(pipi faster-whisper)"
python3 -c "import PIL" 2>/dev/null && y pillow "" || o pillow "$(pipi pillow)"
echo; echo "$ok OK, $bad missing"; [ $bad = 0 ]
