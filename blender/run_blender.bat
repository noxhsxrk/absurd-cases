@echo off
rem usage: run_blender.bat <script.py> [args...]   — runs Blender 4.2 headless with a script from this folder; log -> <script>_log.txt
cd /d "%~dp0"
set B="C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"
if not exist %B% (echo Blender 4.2 not found at %B% > "%~n1_log.txt" & exit /b 1)
%B% -b -P %* > "%~n1_log.txt" 2>&1
echo BLENDER DONE >> "%~n1_log.txt"
