@echo off
rem One-time move of everything absurd-cases needs into C:\Claude\absurd-cases (this folder), as a git checkout of
rem github.com/noxhsxrk/absurd-cases + all local assets. Old folders (pov-story, ai-sfx, blender) are only COPIED, never deleted.
setlocal
cd /d "%~dp0"
if /i "%~nx0"=="migrate_from_old_folders.bat" cd /d "%~dp0.."
set ROOT=%cd%
set LOG=%ROOT%\migrate_log.txt
title absurd-cases: migrate
echo === migrate %date% %time% in %ROOT% === > "%LOG%"
set COREPACK_ENABLE_DOWNLOAD_PROMPT=0
set RC=robocopy /E /XO /NFL /NDL /NJH /NP /R:1 /W:1

echo [0] park the old loose files >> "%LOG%"
if not exist _old_root mkdir _old_root
for %%F in (ep1_tts_jobs.json ep5_script.txt ep5_voice_prompt.md ep6_script.txt ep6_voice_prompt.md ep7_full_script.md ep7_script.txt ep7_voice_prompt.md ep8_script.json ep8_script.txt ep8_voice_prompt.md gemini_tts.py run_tts.bat) do if exist "%%F" move /y "%%F" _old_root\ >> "%LOG%" 2>&1
if exist ep7 move /y ep7 _old_root\ep7 >> "%LOG%" 2>&1
if exist "Claude outputs" move /y "Claude outputs" "_old_root\Claude outputs" >> "%LOG%" 2>&1

echo [1] git checkout of github.com/noxhsxrk/absurd-cases >> "%LOG%"
if not exist .git (git init -b main >> "%LOG%" 2>&1 & git remote add origin https://github.com/noxhsxrk/absurd-cases.git >> "%LOG%" 2>&1)
git fetch origin main >> "%LOG%" 2>&1
git checkout -f -B main origin/main >> "%LOG%" 2>&1
git branch --set-upstream-to=origin/main main >> "%LOG%" 2>&1
git config user.name noxhsxrk
git config user.email castioleone@gmail.com

echo [2] assets >> "%LOG%"
%RC% "C:\Claude\pov-story\public\rb" "public\rb" >> "%LOG%"
%RC% "C:\Claude\pov-story\public\fonts" "public\fonts" >> "%LOG%"
%RC% "C:\Claude\pov-story\public\absurd-cases" "public\absurd-cases" >> "%LOG%"
%RC% "C:\Claude\ai-sfx" "tools\ai-sfx" >> "%LOG%"
robocopy "C:\Claude\pov-story\out" "out" absurd-*.mp4 /XO /NFL /NDL /NJH /NP /R:1 /W:1 >> "%LOG%"
if exist "C:\Claude\blender\test" %RC% "C:\Claude\blender\test" "blender\test" >> "%LOG%"
if exist "C:\Claude\blender\mixamo" %RC% "C:\Claude\blender\mixamo" "blender\mixamo" >> "%LOG%"
if not exist blender\mixamo mkdir blender\mixamo
robocopy "%USERPROFILE%\Downloads" "blender\mixamo" ep8_*.fbx Walking.fbx /XO /NFL /NDL /NJH /NP /R:1 /W:1 >> "%LOG%"
if exist _old_root\ep7 %RC% "_old_root\ep7" "episodes\absurd-cases\ep7" >> "%LOG%"
if exist "_old_root\Claude outputs" %RC% "_old_root\Claude outputs" "out" >> "%LOG%"

echo [3] node packages (pnpm) >> "%LOG%"
where pnpm >nul 2>nul && (call pnpm install --frozen-lockfile >> "%LOG%" 2>&1) || (call corepack pnpm install --frozen-lockfile >> "%LOG%" 2>&1)

echo [4] checks >> "%LOG%"
if exist node_modules\@remotion\cli\remotion-cli.js (echo OK remotion cli >> "%LOG%") else (echo MISSING remotion cli >> "%LOG%")
if exist public\rb\anims_m.glb (echo OK mocap glb >> "%LOG%") else (echo MISSING mocap glb >> "%LOG%")
tools\ai-sfx\.venv\Scripts\python.exe -c "import torch,diffusers,transformers;print('OK ai-sfx venv torch',torch.__version__,'cuda',torch.cuda.is_available())" >> "%LOG%" 2>&1
if exist "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" (echo OK blender 4.2 >> "%LOG%") else (echo MISSING blender 4.2 >> "%LOG%")
for /f %%N in ('dir /s /b tools\ai-sfx\out*\*.wav 2^>nul ^| find /c /v ""') do echo ai sfx takes: %%N >> "%LOG%"
for /f %%N in ('dir /b blender\mixamo\*.fbx 2^>nul ^| find /c /v ""') do echo mixamo fbx: %%N >> "%LOG%"
node node_modules\@remotion\cli\remotion-cli.js still src/index.ts AbsurdEp8 out\migrate_check.png --frame=100 --gl=angle >> "%LOG%" 2>&1 && (echo OK remotion still render >> "%LOG%") || (echo FAILED remotion still render >> "%LOG%")
git status --short >> "%LOG%" 2>&1
echo === MIGRATE DONE === >> "%LOG%"
type "%LOG%"
pause
