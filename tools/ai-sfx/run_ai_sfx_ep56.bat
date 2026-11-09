@echo off
cd /d "%~dp0"
title EP5+EP6 AI SFX
.venv\Scripts\python.exe gen_sfx_ep56.py
echo === EP5+6 SFX FINISHED ===
pause
