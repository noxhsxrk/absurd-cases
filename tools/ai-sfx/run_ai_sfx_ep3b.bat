@echo off
cd /d "%~dp0"
title EP3 SFX round 2
.venv\Scripts\python.exe gen_sfx_ep3b.py
echo === EP3B FINISHED ===
pause
