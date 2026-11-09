@echo off
cd /d "%~dp0"
title AI SFX EP2
.venv\Scripts\python.exe gen_sfx_ep2.py
echo === finished (see gen_log.txt) ===
pause
