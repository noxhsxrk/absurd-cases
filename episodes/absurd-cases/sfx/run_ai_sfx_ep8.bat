@echo off
cd /d "%~dp0"
title EP8 AI SFX
.venv\Scripts\python.exe gen_sfx_ep8.py
echo === EP8 SFX FINISHED ===
