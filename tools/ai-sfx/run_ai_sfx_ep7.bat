@echo off
cd /d "%~dp0"
title EP7 AI SFX
.venv\Scripts\python.exe gen_sfx_ep7.py
echo === EP7 SFX FINISHED ===
