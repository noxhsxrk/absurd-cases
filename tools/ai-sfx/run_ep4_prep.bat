@echo off
cd /d "%~dp0"
title EP4 prep: Whisper + AI SFX
.venv\Scripts\python.exe transcribe_ep4.py
type transcribe_ep4_log.txt
.venv\Scripts\python.exe gen_sfx_ep4.py
echo === EP4 PREP FINISHED ===
pause
