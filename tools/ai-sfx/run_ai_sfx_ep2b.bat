@echo off
cd /d "%~dp0"
title AI SFX EP2 round 2
.venv\Scripts\python.exe gen_sfx_ep2b.py
echo === finished (see gen_log.txt) ===
pause
