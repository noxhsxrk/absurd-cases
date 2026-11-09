@echo off
cd /d "%~dp0"
title Render AbsurdEp8B (Blender plates)
if not exist out mkdir out
echo Rendering AbsurdEp8B (1080x1920, 30fps) on the GPU ... > out\render_log.txt
node node_modules\@remotion\cli\remotion-cli.js render src/index.ts AbsurdEp8B out/absurd-ep8-blender.mp4 --gl=angle --bundle-cache=false >> out\render_log.txt 2>&1
if errorlevel 1 (echo RENDER FAILED >> out\render_log.txt) else (echo RENDER DONE >> out\render_log.txt)
type out\render_log.txt
pause
